#!/usr/bin/env bash
# The runtime bindings census over a checkout's generated rows and routes (default: the checkout this script is in):
#   docs/superpowers/probes/2026-10-25-runtime-bindings-census/run.sh [checkout root]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=${1:-$(git -C "$HERE" rev-parse --show-toplevel)}
mkdir -p "$HERE/results"
git -C "$ROOT" rev-parse --short HEAD
cd "$ROOT"
pnpm exec tsx "$HERE/census.mts" "$ROOT" "$HERE/results"
