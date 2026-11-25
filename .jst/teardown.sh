#!/usr/bin/env bash
# .jst/teardown.sh: remove what .jst/bootstrap.sh made in this issue worktree (written by jst-stack).
# Run by hand before removing the worktree: .jst/teardown.sh
# Removes node_modules/ and build/ only; nothing runs, so there is nothing to stop.
# It refuses in the main checkout.
set -euo pipefail
cd "$(dirname "$0")/.."
here=$(pwd -P)

main_worktree() {
  local common wt
  common=$(git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || return 0
  wt=$(git config --file "$common/config" core.worktree 2>/dev/null || true)
  if [ -n "$wt" ]; then (cd "$common" && cd "$wt" && pwd -P); else (cd "$(dirname "$common")" && pwd -P); fi
}
main=${CF_MAIN_CHECKOUT:-$(main_worktree "$here")}
[ -n "$main" ] && main=$(cd "$main" && pwd -P)
if [ "$here" = "$main" ]; then
  printf '%s\n' "refused: this is the main checkout; .jst/teardown.sh only runs in an issue worktree" >&2
  exit 2
fi

rm -rf -- "$here/node_modules" "$here/build"
printf '%s\n' "removed node_modules/ and build/ from $here" >&2
