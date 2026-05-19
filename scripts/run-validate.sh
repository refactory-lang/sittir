#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if [ "$#" -eq 0 ]; then
    echo "usage: scripts/run-validate.sh <validator-subcommand> [args...]" >&2
    exit 1
fi

# tsconfig paths resolve @sittir/* to source, so no dist build is required.
# Regenerate grammars from current codegen source for a fresh measurement.
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src

exec pnpm exec tsx packages/validator/src/cli.ts "$@"
