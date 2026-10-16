#!/usr/bin/env bash
# Fails when any path in the git index lives under a `node_modules/` directory.
# pnpm creates those as symlinks into the store; committing them makes a fresh
# clone resolve dependencies to dangling targets.
#
# Reads the index (the commit's snapshot), so it serves both the pre-commit
# hook and CI.

set -euo pipefail

tracked="$(git ls-files -- '*node_modules/*' | awk 'NF')"
if [ -n "${tracked}" ]; then
  echo "FAIL: tracked paths under node_modules/:" >&2
  echo "${tracked}" | sed 's/^/  /' >&2
  echo "Untrack with: git rm --cached -- <path>" >&2
  exit 1
fi
