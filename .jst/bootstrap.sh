#!/usr/bin/env bash
# .jst/bootstrap.sh: give this issue worktree its own toolchain (written by jst-stack).
# A `toolchain` project (see .jst/STACK.md): nothing listens, so there is no ./stack. An
# instance is the worktree's own node_modules/ (from its own yarn.lock) and its own build/.
# The executor runs it in every new issue worktree; by hand: .jst/bootstrap.sh
# It refuses in the main checkout, whose node_modules the human manages with `yarn install`.
set -euo pipefail
cd "$(dirname "$0")/.."
here=$(pwd -P)

log() { printf '%s\n' "$*" >&2; }
fail() { log "::step-failed::$1"; log "NOT DONE: $1: $2"; exit 1; }

# The contract's main_worktree: the git common dir's parent (or its core.worktree).
main_worktree() {
  local common wt
  common=$(git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || return 0
  wt=$(git config --file "$common/config" core.worktree 2>/dev/null || true)
  if [ -n "$wt" ]; then (cd "$common" && cd "$wt" && pwd -P); else (cd "$(dirname "$common")" && pwd -P); fi
}
main=${CF_MAIN_CHECKOUT:-$(main_worktree "$here")}
[ -n "$main" ] && main=$(cd "$main" && pwd -P)
if [ "$here" = "$main" ]; then
  log "refused: this is the main checkout; run .jst/bootstrap.sh in an issue worktree"
  exit 2
fi

# Node and Yarn from fnm: a caller may run this with a small PATH (NODE_BIN overrides).
NODE_BIN=${NODE_BIN:-$HOME/.local/share/fnm/aliases/default/bin}
export PATH="$NODE_BIN:$PATH"

log "== Check the host"
missing=""
command -v node >/dev/null || missing+=" node"
command -v yarn >/dev/null || missing+=" yarn"
[ -z "$missing" ] || fail "Check the host" "missing:$missing (Node 24 and Yarn 1.22 through fnm: fnm install 24 && fnm default 24 && npm install -g yarn@1.22.22)"
node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 24 ] || fail "Check the host" "Node $(node --version) is older than CI's 24 (fnm install 24 && fnm default 24)"
log "node $(node --version), yarn $(yarn --version)"

# Own node_modules, from this worktree's yarn.lock; the yarn cache is shared.
log "== Install dependencies"
yarn install --frozen-lockfile --non-interactive >&2 || fail "Install dependencies" "yarn install --frozen-lockfile failed (see above)"
[ -x node_modules/.bin/rollup ] || fail "Install dependencies" "node_modules/.bin/rollup is missing after the install"

# Own build/: this branch's bundle (CJS, ESM, .d.ts).
log "== Build the library"
yarn build >&2 || fail "Build the library" "yarn build failed (see above)"
[ -f build/index.d.ts ] || fail "Build the library" "build/index.d.ts is missing after yarn build"

log "ready: node_modules/ and build/ in $here"
