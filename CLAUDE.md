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
  cut-release.yml               # manual dispatch: cuts release/X.Y.Z off development, opens a draft PR into main
  release.yml                   # build + release-it + npm publish on merge of release/* or hotfix/* into `main`
  semver-check.yml              # enforces the PR label rules per target branch (see "Release process")
docs/
  RELEASING.md                  # the release/hotfix runbook
  SDLC.md                       # branching & lifecycle policy
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
- four listener arrays (`auth-success`, `auth-error`, `keycloak-ready`,
  `init-error`) with `on()` / `off()` for subscription,
- a settled `initState` (`'initializing' | 'ready' | 'failed'`) readable via
  `getInitState()` / `isAuthenticated()`, because a subscriber that registers
  *after* init settled never receives the event and has to read what it missed.

`init-error` fires when `keycloak.init()` **rejects** — an unreachable auth server,
or a browser that blocks the third-party-cookie probe that keycloak-js awaits before
`onReady`. That is a settled outcome, not a hang, which is why it is a distinct event
from `auth-error` (which also fires for an ordinary anonymous `check-sso`).

Because it's a singleton, **the first set of `{ config, initOptions }` passed in
wins** — calling `getInstance()` again with different config after the first
call does *not* re-initialize Keycloak. Mounting `<KeycloakProvider>` twice with
different configs in the same page will silently reuse the first instance.

**`KeycloakProvider` (`KeycloakProvider.tsx`)** — a React component that:
1. On mount, if `disabled` is true, immediately marks itself settled with
   `keycloak: null`, `authenticated: false`, and skips Keycloak entirely.
2. Otherwise gets the `KeycloakService` singleton, subscribes to its events, and
   **replays the service's current `initState`** in case init already settled.
3. **Always renders `children`** — it never withholds the app tree. Consumers gate
   whatever depends on identity on the `initializing` context value themselves.
4. Tracks one `status` (`'initializing' | 'ready' | 'failed'`). It settles on
   `keycloak-ready` *or* on `init-error`; `timeout` (default 12000ms /
   `KEYCLOAK_READY_TIMEOUT_MS`) is only a backstop for an init that never settles
   either way, **not** the failure path.
5. Exposes `{ keycloak, authenticated, initializing, failed, loader }` via Context
   using the **React 19 Context-as-Provider shorthand** (`<KeycloakContext value={...}>`,
   not `<KeycloakContext.Provider value={...}>`) — matching the `react: ">=19"` peer range.
   The value is `useMemo`'d.
6. `useKeycloak()` is just `useContext(KeycloakContext)`.

`initializing` is load-bearing and deliberately distinct from `!authenticated`: it means
"we don't know yet whether there is a session", so a consumer that dispatches on role can
avoid rendering an anonymous tree and remounting it when the token lands.

**Public surface (`src/index.ts`)**: `KeycloakProvider`, `useKeycloak`, and the
re-exported `KeycloakConfig` / `KeycloakInitOptions` types from `keycloak-js`.
Nothing else in `src/lib` is intended to be imported directly by consumers.

## Commands

```bash
yarn install        # install deps (yarn.lock is the lockfile of record, not npm)
yarn build           # rollup -c → build/index.js (cjs), build/index.es.js (esm), build/index.d.ts
yarn test            # react-scripts test (Jest) — watch mode
CI=true yarn test --watchAll=false                # full suite, once
CI=true yarn test --watchAll=false -t "<name>"    # one test by name
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
look like end-to-end." On push to `feature/*`, `hotfix/*`, `release/*` or `fix/*`
branches it:
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

**Why the workflow bumps to an `-rc.<run>.<attempt>` version before packing.**
`yarn add <tarball>` caches by `name@version`, and setup-node's `cache: 'yarn'`
restores that cache across runs. `release-it` only bumps the version when a
release ships (a `release/*` or `hotfix/*` merge into `main`), so without the
bump every run between two releases packs *different* contents under the *same*
version — and yarn installs whichever copy it cached first. The symptom is a demo-app build failing against stale `.d.ts`
(e.g. `Property 'x' does not exist on type ...` for something the branch just
added), which looks like a source bug and isn't. The `Setup demo app` step
asserts the installed version equals the packed one, so a recurrence fails
immediately with a clear message instead. Don't remove the bump to "keep the
version clean" — nothing is committed or tagged (`--no-git-tag-version`).

## Release process

Full detail in [`docs/RELEASING.md`](docs/RELEASING.md) (runbook) and
[`docs/SDLC.md`](docs/SDLC.md) (branching policy). In short — **merging is not
releasing**:

- Feature work happens on `feature/*`, PR'd into `development`. `semver-check.yml`
  requires a `major`/`minor`/`patch` label on those PRs. **Merging into
  `development` publishes nothing and creates no tag** — it used to publish an npm
  version per merged PR; that trigger has moved to `main`.
- A release is cut explicitly: `cut-release.yml` (manual `workflow_dispatch` from
  `development`) resolves the next version from the latest tag plus the intended
  bump, creates `release/X.Y.Z`, and opens a **draft PR into `main`** labeled with
  that bump. QA happens on that branch; bugs are fixed via `fix/*` PRs into it.
- `release.yml` runs on a `release/*` **or** `hotfix/*` PR merged into `main`:
  builds, then `release-it` does version bump/tag/GitHub release/npm publish. The
  bump is label-driven for `release/*` (default `minor`) and forced `patch` for
  `hotfix/*`. It then back-merges `main` into `development`, opening a
  `sync/main-to-dev-X.Y.Z` PR if that merge conflicts or the push is rejected.
- `semver-check.yml` also guards PRs into `main`: `release/*` PRs skip the label
  check (already labeled at cut time), anything else targeting `main` (the hotfix
  path) requires `patch`.
- Tags are bare `X.Y.Z`, **not** `vX.Y.Z` — that is `release-it`'s default
  `git.tagName` and every existing tag follows it. `cut-release.yml` does version
  math on tag names, so don't introduce a prefix.
- Commit messages containing `--skip-ci` skip both the test and release-type-check
  workflows.
- The repo's default branch is `development`. `main` is the publish target, not
  the working branch.

## Known quirks / things to double-check before "fixing"

- **`Loading.stories.tsx` imports a nonexistent `./Loading` component.** Either
  it's dead code from a refactor (the loader is now just the `loader` prop on
  `KeycloakProvider`) or a component was deleted without updating the story.
  Don't assume a `Loading` component should exist — confirm intent before adding one.
- **`progress.css`** (circular progress ring) also appears to be unused leftover
  from whatever the missing `Loading` component was.
- **React 19 Context shorthand**: `KeycloakProvider.tsx` renders
  `<KeycloakContext value={...}>` instead of `<KeycloakContext.Provider value={...}>`.
  This syntax requires React 19+, which `package.json` `peerDependencies`
  (`react: ">=19"`) now matches — keep the two in step if either is touched.
- **`KeycloakService` singleton ignores subsequent config.** Re-mounting
  `KeycloakProvider` with new `config`/`initOptions` after first init has no effect
  on the already-created Keycloak instance.
- **`initOptions` default is unreachable**: `keycloakService.ts` does
  `initOptions ?? { onLoad: 'login-required' }`, but `KeycloakProvider` already
  defaults the prop to `{}` (truthy), so that fallback default never fires in practice.
- **The init effect deps are `[disabled]` on purpose.** `config` / `initOptions` /
  `timeout` are read through a ref instead, because consumers pass them as inline
  object literals (that is what both READMEs show) and including them re-ran the
  effect on every render — tearing down all listeners and arming a fresh timeout
  each time. Re-running would be pointless anyway: the service singleton ignores
  config after the first init. Don't "fix" the exhaustive-deps warning by adding
  them back; the ref is the fix.
- **`ci/tests/App.tsx` is a real consumer of the public contract.** It gates its
  auth controls on `initializing`, which is what keeps the Selenium test from
  clicking `Login` before `keycloak` exists. Update it alongside any context change.
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
