# Releasing

The step-by-step runbook for cutting a release and shipping a hotfix of
`react-keycloak-provider`. For the branching policy see [SDLC.md](SDLC.md).

- Repo: <https://github.com/kantorv/react-keycloak-provider>
- Actions: <https://github.com/kantorv/react-keycloak-provider/actions>
- Releases: <https://github.com/kantorv/react-keycloak-provider/releases>
- npm: <https://www.npmjs.com/package/react-keycloak-provider>

---

## TL;DR

| You want to… | Do this |
| :--- | :--- |
| Ship what's on `development` | Run **`cut-release.yml`** → QA the `release/X.Y.Z` branch → merge its draft PR into `main`. `release.yml` bumps, tags, releases, publishes to npm, and syncs back. |
| Choose the version | Pick the `bump` input when you cut (default `minor`), or pass an explicit `version`. The branch is named after the resulting version. |
| Emergency fix to the published package | Branch `hotfix/<KEY>-slug` off `main`, PR into `main` labeled `patch`, merge. `release.yml` forces a patch bump and syncs back. |
| Publish from `development` | You don't. `development` publishes nothing — that is the point of this cycle. |

There is **no prerelease/RC channel** and no `-rc` npm dist-tag. Only a merged
`release/*` or `hotfix/*` PR into `main` publishes.

---

## 1. Cut the release (SDLC Phase 2)

### Trigger it

**GitHub UI (recommended):** Actions → *Cut release* → **Run workflow** →
branch `development` → pick the `bump` → **Run workflow**.

**CLI:**
```bash
gh workflow run cut-release.yml --ref development -f bump=minor
# or pin the version explicitly:
gh workflow run cut-release.yml --ref development -f bump=minor -f version=2.2.0
```

### What it does

- Reads the latest stable tag (bare `X.Y.Z`) and applies the `bump` to get the
  next version. With `2.1.0` as the latest tag, `minor` → `2.2.0`.
- Refuses to continue if `release/X.Y.Z` or the tag `X.Y.Z` already exists on
  origin, or if `development` has no commits beyond `main`.
- Creates `release/X.Y.Z` from `development` and pushes it.
- Opens a **draft PR** `release/X.Y.Z → main`, titled *"Release X.Y.Z"*, labeled
  with the bump.

The `version` input is a safety valve, not a free-form field: it must be one of
the three versions reachable from the latest tag (`major`/`minor`/`patch`), and
the workflow derives the PR label from which one it is. That is what keeps the
branch name and the version that eventually ships from disagreeing — the label,
not the branch name, is what `release.yml` acts on.

> **Prereq:** *Settings → Actions → "Allow GitHub Actions to create and approve
> pull requests"* must be **ON**, or the draft PR cannot be created.

---

## 2. QA & hardening (SDLC Phase 3)

QA runs against `release/X.Y.Z`. `tests.yml` runs the full Selenium/Keycloak
E2E suite on every push to it, and to the `fix/*` branches below. Fix bugs **on
the release branch**, never by merging new features:

```bash
git checkout release/X.Y.Z
git checkout -b fix/short-description
# ...fix, commit...
git push origin fix/short-description
# open a PR: fix/short-description -> release/X.Y.Z, then merge it
```

---

## 3. Ship it (SDLC Phase 4)

When QA is green:

1. Open the draft PR (`release/X.Y.Z → main`) and click **Ready for review**.
2. Check the bump label. It was set at cut time and matches the branch name —
   changing it now changes the version that ships, and the branch name will no
   longer match it.

   | Label | Result | When |
   | :--- | :--- | :--- |
   | `major` | `2.1.0` → `3.0.0` | Breaking API changes |
   | `minor` | `2.1.0` → `2.2.0` | New features (the default) |
   | `patch` | `2.1.0` → `2.1.1` | Bug fixes only |
   | (none)  | treated as `minor` | Default |

3. Get approval and **merge** the PR into `main`.

Merging fires **`release.yml`**, which for a `release/*` head ref:

- Checks out `main`, installs, and runs `yarn build` (rollup → `build/`).
- Runs `release-it --ci --increment=<label>`: bumps `package.json`, commits and
  pushes it, creates the `X.Y.Z` tag, publishes the GitHub Release with
  auto-generated notes, and publishes the package to npm.
- Back-merges `main → development` (opens a sync PR only if that fails).

### Verify

- The [Releases page](https://github.com/kantorv/react-keycloak-provider/releases)
  shows the new `X.Y.Z` tag and notes.
- `npm view react-keycloak-provider version` reports the new version.
- `development` received the `[CHORE] sync main into development after X.Y.Z`
  commit — or a sync PR is waiting.

---

## 4. Hotfix

For a critical bug in the published package that can't wait for the next
release:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/ISSUE-KEY-short-description
# ...fix, commit...
git push origin hotfix/ISSUE-KEY-short-description
```

Open a PR **into `main`** and label it **`patch`** (`semver-check.yml` requires
it). On merge, the **same `release.yml`** handles the `hotfix/*` head ref:

- Forces a **patch** bump regardless of what else is on the PR.
- Builds, bumps, tags, publishes the GitHub Release and the npm package.
- Back-merges `main → development` with the same mechanism.

The hotfix and release paths differ **only** in the bump kind; everything else
is one shared workflow.

---

## 5. The sync-back mechanism

Both paths use **one** mechanism to bring `main` back into `development`:

1. `release.yml` attempts a direct `git merge --no-ff main → development` and
   pushes it.
2. If the merge **conflicts**, or the push is **rejected** (branch protection, a
   race), it aborts — never force-pushes — pushes a `sync/main-to-dev-X.Y.Z`
   branch, and opens a **sync PR** into `development` for a human to resolve.

Resolve that PR promptly: until it lands, `development` is missing the version
bump and any release-branch fixes, and the next cut would revert them.

---

## 6. Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| **`cut-release` failed: branch already exists** | A release is already in flight. Finish it, or delete the branch (`git push origin --delete release/X.Y.Z`). |
| **`cut-release` failed: version not reachable from the latest tag** | The `version` input must be the major, minor, or patch bump of the latest tag. The error lists the three accepted values. |
| **`cut-release` failed: nothing to release** | `development` has no commits beyond `main`. Nothing to ship. |
| **`cut-release` failed: "Resource not accessible by integration"** | Enable *Allow GitHub Actions to create and approve pull requests* in the repo's Actions settings. |
| **`release.yml` didn't trigger** | The PR must be **merged** (not just closed), must target `main`, and its head branch must start with `release/` or `hotfix/`. |
| **Wrong version published** | The label on the release PR at merge time decides it, not the branch name. `hotfix/*` is always `patch`. |
| **Back-merge conflict / rejected push** | Resolve the auto-opened `sync/main-to-dev-X.Y.Z` PR into `development`. |
| **Semver check failed on a hotfix PR** | Add the `patch` label — non-release PRs into `main` require it. |
| **npm publish failed on auth** | Publishing uses npm trusted publishing (OIDC): `release.yml` needs `id-token: write` and npm ≥ 11.5.1, which the *Update npm* step installs. |

---

## References

- [SDLC.md](SDLC.md) — branching & lifecycle policy
- [`release-it` config](../package.json) — the `"release-it"` block
- [`CLAUDE.md`](../CLAUDE.md) — repo layout and CI notes
