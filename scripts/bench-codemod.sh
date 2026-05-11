#!/usr/bin/env bash
# Spec 012 T059 — macro-benchmark wrapper for the US1 codemod.
#
# Runs `tests/acceptance/codemod-inline.ts`'s `runCodemodOnDir` against
# `tests/acceptance/fixtures/codemod-sample/` twice — once with
# `SITTIR_BACKEND=native`, once with `SITTIR_BACKEND=typescript` — and
# reports wall-clock per run. Exits 0 ONLY if native is strictly lower
# than typescript (SC-003 automation).
#
# Implementation note: Date.now() inside the script gives ms-precision
# wall-clock without any external bench harness. `hyperfine` would be
# nicer but is not a hard dep — keep this portable to plain CI.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORPUS="${ROOT}/tests/acceptance/fixtures/codemod-sample"
RUNNER="${ROOT}/packages/tools/src/profile/codemod.ts"

if [ ! -d "${CORPUS}" ]; then
    echo "bench-codemod: corpus directory not found: ${CORPUS}" >&2
    exit 2
fi

# Run-once helper. Echoes "<wall_ms> <files>" on stdout. Status of the
# tsx invocation is propagated via `set -e`.
run_once () {
    local backend="$1"
    local node_env="${NODE_ENV:-production}"
    NODE_ENV="${node_env}" \
    SITTIR_BACKEND="${backend}" \
        npx --yes tsx "${RUNNER}" "${CORPUS}"
}

echo "bench-codemod: corpus = ${CORPUS}"

echo "bench-codemod: warming up (typescript)…"
run_once typescript >/dev/null

echo "bench-codemod: timing native run…"
NATIVE_OUT="$(run_once native)"
NATIVE_MS="${NATIVE_OUT% *}"
NATIVE_FILES="${NATIVE_OUT##* }"

echo "bench-codemod: timing typescript run…"
TS_OUT="$(run_once typescript)"
TS_MS="${TS_OUT% *}"
TS_FILES="${TS_OUT##* }"

printf 'bench-codemod: native     = %5d ms (%s files)\n' "${NATIVE_MS}" "${NATIVE_FILES}"
printf 'bench-codemod: typescript = %5d ms (%s files)\n' "${TS_MS}" "${TS_FILES}"

if [ "${NATIVE_MS}" -lt "${TS_MS}" ]; then
    echo "bench-codemod: PASS — native is faster"
    exit 0
fi

echo "bench-codemod: FAIL — native is not strictly faster than typescript"
exit 1
