# Software Development Life Cycle (SDLC) & Branching Strategy

The branching and lifecycle policy for `react-keycloak-provider`.

**Audience:** human developers and autonomous AI/LLM coding assistants.

**Core idea:** *merging is not releasing.* Work is integrated continuously on
`development`, but nothing reaches npm until a release is explicitly cut, QA'd
on its own branch, and merged into `main`.

> **See also:** [RELEASING.md](RELEASING.md) — the step-by-step runbook for
> cutting a release and shipping a hotfix.

---

## 1. Branch architecture

| Branch pattern | Source | Merges to | Purpose |
| :--- | :--- | :--- | :--- |
| `main` | `release/*`, `hotfix/*` | `development` | The published state of the package. Tagged `X.Y.Z` by `release-it`; every tag here corresponds to one npm version. |
| `development` | `main` | `release/*` | The default working branch and the integration target. Publishes **nothing**. |
| `feature/ISSUE-KEY-slug` | `development` | `development` | New features and non-critical fixes. |
| `release/X.Y.Z` | `development` | `main` | Temporary freeze branch for QA and release hardening. Cut by `cut-release.yml`, named after the version it will publish. |
| `fix/short-description` | `release/X.Y.Z` | `release/X.Y.Z` | Bug fixes found by QA during a freeze. |
| `hotfix/ISSUE-KEY-slug` | `main` | `main` & `development` | **Only** for critical bugs in the published package that cannot wait for the next release. |

`main` is not the repository's default branch — `development` is. `main` is the
*publish target*.

---

## 2. The lifecycle

### Phase 1 — Active development

- Branch `feature/ISSUE-KEY-slug` off `development`; PR back into `development`.
- `semver-check.yml` requires a `major`/`minor`/`patch` label on the PR.
- `tests.yml` runs the Selenium/Keycloak E2E suite on every push to the branch.
- Merging publishes nothing and creates no tag. `development` simply accumulates
  the changes that the next release will contain.

### Phase 2 — Release cut (freeze)

- Run **`cut-release.yml`** from the Actions UI on `development`. It resolves
  the next version `X.Y.Z` from the latest tag plus the intended bump, creates
  `release/X.Y.Z`, and opens a **draft PR** into `main` labeled with that bump.
- **No new features** go into the release branch.
- `development` stays open for the next release's work.

### Phase 3 — QA & hardening

- QA exercises `release/X.Y.Z`. `tests.yml` runs on pushes to it.
- Bugs are fixed on `fix/*` branches cut from the release branch and merged
  back into it — never by merging fresh features from `development`.

### Phase 4 — Ship

- The draft PR is marked ready and merged into `main`.
- `release.yml` runs `release-it` once on `main`: it bumps `package.json`,
  creates the `X.Y.Z` tag and the GitHub Release, and publishes to npm.
- `main` is then back-merged into `development` automatically so the QA fixes
  are not lost (a `sync/main-to-dev-X.Y.Z` PR is opened if it conflicts).
- The `release/X.Y.Z` branch can be deleted.

---

## 3. Hotfixes

For a critical bug in the *published* package that cannot wait for the next
release. This path bypasses `development` entirely, so unreleased work is not
dragged into production.

```bash
git checkout main
git pull origin main
git checkout -b hotfix/ISSUE-KEY-short-description
# ...fix, commit, push...
```

Open a PR **into `main`** labeled `patch` (`semver-check.yml` enforces the
label). On merge, `release.yml` forces a **patch** bump regardless of any other
label, publishes, and back-merges `main` into `development` — that last step is
what stops the next release cut from reintroducing the bug.

---

## 4. Versioning

[Semantic Versioning](https://semver.org/), tagged on `main` as bare `X.Y.Z`
(no `v` prefix — that is `release-it`'s default `git.tagName`, and every
existing tag in this repo follows it).

- **Stable tags `X.Y.Z`** are created **only** by `release.yml`, on a `release/*`
  or `hotfix/*` PR merged into `main`. The bump is:
  - `release/*` — **label-driven**: `major`/`patch`, else the **minor** default.
    `cut-release.yml` puts that label on the PR, derived from the same input it
    used to name the branch.
  - `hotfix/*` — always **patch**.
- There is **no prerelease channel.** Nothing publishes to npm from
  `development`, and no `-rc` npm dist-tag exists. The `-rc.<run>.<attempt>`
  version that `tests.yml` builds is a local cache-busting device inside the CI
  runner — it is never committed, tagged, or published (see `CLAUDE.md`).

Commit messages play no part in version resolution: the label decides.

| Bump | Example | When |
| :--- | :--- | :--- |
| `major` | `2.1.0` → `3.0.0` | Breaking changes to the public API in `src/index.ts` |
| `minor` | `2.1.0` → `2.2.0` | Backward-compatible features — the release default |
| `patch` | `2.1.0` → `2.1.1` | Bug fixes only; always the hotfix bump |

Never hand-edit `version` in `package.json`; `release-it` owns it.

---

## 5. 🤖 LLM directives

*Instructions for AI coding assistants reading this document:*

1. **Branch naming:** `<type>/<ISSUE-KEY>-<kebab-case-description>` (e.g.
   `feature/RKP-12-add-token-refresh`). `feature/*` is cut from `development`;
   the only exception is an emergency `hotfix/*` cut from `main`.
2. **Target branches:** default PR targets to `development`. Target `main` only
   for an explicit hotfix, or for a `release/*` branch created by
   `cut-release.yml`.
3. **Versioning:** never edit `package.json`'s `version`, never create tags by
   hand, and never add an npm publish step to a workflow that triggers on
   `development`. The bump comes from the PR label; Conventional Commits are not
   used for versioning. Prefix each commit with its Jira issue key.
4. **Release cuts are a human action.** Do not run `cut-release.yml` on your own
   initiative.
