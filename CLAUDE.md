# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this is

`react-keycloak-provider` is a small npm package (~6 source files) that wraps
[`keycloak-js`](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter)
in a React Context Provider + hook, so consuming apps can do:

```tsx
<KeycloakProvider config={...} initOptions={...}>
  <App />
</KeycloakProvider>
```

```tsx
const { keycloak, authenticated, failed } = useKeycloak();
```

Published to npm as `react-keycloak-provider`. Current version: see `package.json`
(`version` field) — bumped automatically by CI/release-it, don't hand-edit it.

## Repo layout

```
src/
  index.ts                     # public entry point — only export this file's surface
  lib/keycloak-provider/
    KeycloakProvider.tsx        # the Context, Provider component, useKeycloak() hook
    keycloakService.ts          # singleton wrapper around the keycloak-js instance
    progress.css                # CSS for an (apparently unused/dead) circular progress UI
    README.md                   # usage doc, stale/buggy in places — see Gotchas
  stories/
    KeycloakProvider.stories.tsx
    Loading.stories.tsx         # ⚠️ imports a './Loading' component that does not exist
ci/
  docker-compose.keycloak.yml   # spins up a real Keycloak 26.4 with an imported demo realm
  demo-realm-with-react-client-localhost-3000-export.json  # the imported realm/client
  run.sh                        # starts Keycloak, waits for it, creates a demo user via Admin API
  wait_for_docker.sh            # polls `docker compose logs` until Keycloak's dev-mode banner appears
  tests/tests.py                # Selenium end-to-end test: login -> redirect -> logout
  tests/App.tsx, index.tsx, silent-check-sso.html  # fixture app copied into a throwaway CRA app in CI
  requirements.txt              # Python deps for ci/tests (selenium)
.github/workflows/
  tests.yml                     # full E2E pipeline (see "CI / E2E flow" below)
  release.yml                   # build + release-it + npm publish on merge to `development`
  semver-check.yml              # enforces a major/minor/patch PR label before merge
rollup.config.js                # library build: CJS + ESM bundles, plus a separate .d.ts bundle pass
tsconfig.json                   # noEmit: true — TS is used for type-checking only, rollup/babel does the JS emit
package.json                    # main/module/types point at ./build/*, scripts below
```

There is no `src/lib/keycloak-provider/Loading.tsx` despite `Loading.stories.tsx`
referencing it — treat that story as broken/stale, not as a guide to existing API.

## Core architecture

**`KeycloakService` (`keycloakService.ts`)** — a module-level **singleton**
(`getInstance()` keeps a single `Keycloak` instance for the lifetime of the page).
It owns:
- the actual `keycloak-js` instance and its `.init()` call,
- three listener arrays (`auth-success`, `auth-error`, `keycloak-ready`) with
  `on()` / `off()` for subscription.

Because it's a singleton, **the first set of `{ config, initOptions }` passed in
wins** — calling `getInstance()` again with different config after the first
call does *not* re-initialize Keycloak. Mounting `<KeycloakProvider>` twice with
different configs in the same page will silently reuse the first instance.

**`KeycloakProvider` (`KeycloakProvider.tsx`)** — a React component that:
1. On mount, if `disabled` is true, immediately marks itself "ready" with
   `keycloak: null`, `authenticated: false`, and skips Keycloak entirely.
2. Otherwise gets the `KeycloakService` singleton, subscribes to its events,
   and renders `loader` (default: `Loading...`) until either `keycloak-ready`
   fires or `timeout` ms elapse (default 12000ms / `KEYCLOAK_READY_TIMEOUT_MS`).
3. Exposes `{ keycloak, authenticated, failed }` via Context using the
   **React 19 Context-as-Provider shorthand** (`<KeycloakContext value={...}>`,
   not `<KeycloakContext.Provider value={...}>`). See Gotchas below — this is
   load-bearing for which React versions actually work.
4. `useKeycloak()` is just `useContext(KeycloakContext)`.

**Public surface (`src/index.ts`)**: `KeycloakProvider`, `useKeycloak`, and the
re-exported `KeycloakConfig` / `KeycloakInitOptions` types from `keycloak-js`.
Nothing else in `src/lib` is intended to be imported directly by consumers.

## Commands

```bash
yarn install        # install deps (yarn.lock is the lockfile of record, not npm)
yarn build           # rollup -c → build/index.js (cjs), build/index.es.js (esm), build/index.d.ts
yarn test            # react-scripts test (Jest) — note: no test/ files currently exist in src/
yarn storybook       # storybook dev -p 6006
yarn build-storybook # static storybook build
yarn release         # release-it — bumps version, tags, pushes, creates GH release, publishes to npm
```

There is no `lint` script; ESLint config lives inline in `package.json`
(`eslintConfig`, extends `react-app` + `storybook/recommended`).

### Running the real E2E suite locally

`ci/run.sh` expects an `.env.keycloak.ci` file next to
`ci/docker-compose.keycloak.yml` (it's `required: true` in the compose file and
is git-ignored — you'll need to create it, e.g. with `KEYCLOAK_ADMIN_PASSWORD=change_me`
matching what `ci/run.sh` hardcodes).

```bash
cd ci
bash run.sh                 # starts Keycloak (docker compose), waits for readiness,
                             # creates demo user demo3@example.com / demo@pass
# in another shell, with a built demo app running on :3000 against this Keycloak:
cd ci/tests && python tests.py
```

`ci/tests/tests.py` is a Selenium script that expects Chrome + chromedriver at
`/tmp/chrome-linux64/chrome` and `/tmp/chromedriver-linux64/chromedriver`
(downloaded by the CI workflow, not provided locally) — see `.github/workflows/tests.yml`
for the exact Chrome version pinned (`CHROME_VERSION` env var) if reproducing locally.

## CI / E2E flow (`.github/workflows/tests.yml`)

This is the most informative file for understanding "what does correct behavior
look like end-to-end." On push to `feature/*` or `hotfix/*` branches it:
1. Downloads/caches a pinned Chrome + chromedriver build.
2. Loads/caches the pinned Keycloak Docker image.
3. `yarn install`, bumps a `-rc` prerelease version, `yarn build`, `yarn pack`.
4. Scaffolds a **throwaway** `create-react-app` (`demo-app`), copies
   `ci/tests/{index.tsx,App.tsx}` and `silent-check-sso.html` into it, and
   installs the just-packed tarball as a real dependency (i.e. it tests the
   built/packed artifact, not source).
5. Starts that demo app (`yarn start &`) and Keycloak (`ci/run.sh`) in parallel.
6. Runs `ci/tests/tests.py` against `localhost:3000` / `localhost:8282`,
   exercising a full login → redirect → logout cycle against a real Keycloak
   instance imported from `ci/demo-realm-with-react-client-localhost-3000-export.json`.

There's a comment in the workflow noting this approach exists because tests
sometimes pass against source but fail once installed from a packed tarball —
keep that in mind if asked to "speed up CI by testing source directly."

## Release process

- Work happens on branches named `feature/*` or `hotfix/*`, PR'd into `development`.
- `semver-check.yml` blocks merge unless the PR has a `major`, `minor`, or `patch` label.
- `release.yml` runs on PR merge to `development`: builds, then `release-it`
  bumps version/tag/GitHub release/npm publish per the chosen label.
- Commit messages containing `--skip-ci` skip both the test and release-type-check workflows.
- `main`/default branch in this repo is `development`, not `main`.

## Known quirks / things to double-check before "fixing"

- **`Loading.stories.tsx` imports a nonexistent `./Loading` component.** Either
  it's dead code from a refactor (the loader is now just the `loader` prop on
  `KeycloakProvider`) or a component was deleted without updating the story.
  Don't assume a `Loading` component should exist — confirm intent before adding one.
- **`progress.css`** (circular progress ring) also appears to be unused leftover
  from whatever the missing `Loading` component was.
- **React 19 Context shorthand**: `KeycloakProvider.tsx` renders
  `<KeycloakContext value={...}>` instead of `<KeycloakContext.Provider value={...}>`.
  This syntax requires React 19+, but `package.json` `peerDependencies` claims
  `react: ">=18"`. Consumers on React 18 will break. Flag this if asked to touch
  either the peer range or the Provider syntax — they're currently inconsistent.
- **`KeycloakService` singleton ignores subsequent config.** Re-mounting
  `KeycloakProvider` with new `config`/`initOptions` after first init has no effect
  on the already-created Keycloak instance.
- **`initOptions` default is unreachable**: `keycloakService.ts` does
  `initOptions ?? { onLoad: 'login-required' }`, but `KeycloakProvider` already
  defaults the prop to `{}` (truthy), so that fallback default never fires in practice.
- **`src/lib/keycloak-provider/README.md`** usage sample has `keycloak & authenticated`
  (bitwise AND) where `keycloak && authenticated` was clearly intended — don't
  copy that snippet verbatim if updating docs.
- **Effect dependency on `ready`** (`KeycloakProvider.tsx`'s `useEffect` deps
  include `ready`): since `ready` only flips once and the effect tears down/recreates
  listeners on every dependency change, be careful about reasoning about re-run
  semantics here if modifying the effect.
- **Two READMEs exist** with overlapping but slightly different usage examples:
  root `README.md` and `src/lib/keycloak-provider/README.md`. Keep both in sync
  if changing the public API or prop list.

## Conventions for changes

- Keep `src/index.ts` as the only intended public export surface; avoid adding
  new exports from `src/lib/**` directly without also wiring them through `index.ts`.
- This is a peer-dependency library (`react`/`react-dom` are peers, not deps) —
  don't add React itself to `dependencies`.
- `keycloak-js` is the one real runtime dependency; check its version
  (`^26.2.1` in `package.json`) before relying on any Keycloak JS adapter API
  that may have changed across major versions.
- Build output (`build/`) is git-ignored and generated by `rollup -c` — never
  hand-edit or commit files under `build/`.
