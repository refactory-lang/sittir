#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if [ "$#" -eq 0 ]; then
    echo "usage: scripts/run-validate.sh <validator-subcommand> [args...]" >&2
    exit 1
fi

build_prereqs() {
    pnpm --filter @sittir/types run build
    pnpm --filter @sittir/common run build
    pnpm --filter @sittir/core run build
}

regenerate_grammars() {
    npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
    npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
    npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
}

build_grammar_packages() {
    pnpm --filter @sittir/rust run build
    pnpm --filter @sittir/typescript run build
    pnpm --filter @sittir/python run build
}

build_prereqs
build_grammar_packages
regenerate_grammars
build_grammar_packages

if [ -n "${NODE_OPTIONS:-}" ]; then
    export NODE_OPTIONS="${NODE_OPTIONS} --conditions=source"
else
    export NODE_OPTIONS="--conditions=source"
fi

exec pnpm exec tsx packages/validator/src/cli.ts "$@"
