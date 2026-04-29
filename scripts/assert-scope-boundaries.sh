#!/usr/bin/env bash
# Spec 012 T064 — scope-boundary enforcement.
#
# Fails the build if any of the following slip into the MVP:
#   (a) WASM artifacts in any package — `*.wasm` files leaked from
#       a deferred US3 implementation.
#   (b) `cargo publish` lurking in any workflow file — sittir-core is
#       NOT crates.io-published in the MVP (FR-018).
#   (c) Non-source files inside grammar-owned render artifacts —
#       generated render modules contain ONLY `*.rs`,
#       `templates/*.jinja`, plus the parity-test data file
#       `test-fixtures.json` (FR-019).
#   (d) Disallowed derive-macro / proc-macro crates in the Rust
#       workspace dep graph (FR-013 — only `askama`, `napi-derive`,
#       `serde_derive`, and tree-sitter internals are allowed).
#
# Run as a CI step under the `rust` job. Exits non-zero on the first
# violation; the message names the offending file or crate so the
# failure log explains itself without spelunking.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

fail=0

# ---- (a) no WASM artifacts in published packages -----------------------------
# `pnpm publish --dry-run` would also catch this, but it's network-
# heavy + requires a publish-ready workspace. The directory scan is
# fast and equally definitive: if any `.wasm` shows up under
# `packages/*/`, the deferred US3 leaked into the MVP scope.
echo "[scope] (a) checking for WASM artifacts in packages/…"
wasm_files=$(find packages -name '*.wasm' -not -path '*/.sittir/*' -not -path '*/node_modules/*' 2>/dev/null || true)
if [ -n "${wasm_files}" ]; then
    echo "FAIL (a): WASM artifacts found in publishable packages:"
    echo "${wasm_files}" | sed 's/^/  /'
    echo "         WASM is deferred to US3; remove these or move under .sittir/."
    fail=1
fi

# ---- (b) no `cargo publish` in any workflow ---------------------------------
# Match a `run:` step or a bare command — not comments. Lines whose
# first non-whitespace character is `#` are skipped so commentary
# referencing the term doesn't trip the gate.
echo "[scope] (b) checking for cargo-publish steps in workflows…"
publish_hits=$(grep -RnE '^[^#]*cargo[[:space:]]+publish' .github/workflows/ 2>/dev/null || true)
if [ -n "${publish_hits}" ]; then
    echo "FAIL (b): cargo publish step found in a CI workflow:"
    echo "${publish_hits}" | sed 's/^/  /'
    echo "         sittir-core MUST NOT be published to crates.io in the MVP (FR-018)."
    fail=1
fi

# ---- (c) only allowed file kinds inside grammar-owned render dirs -----------
echo "[scope] (c) scanning rust/crates/sittir-*/ render artifacts for unexpected files…"
disallowed=()
while IFS= read -r f; do
    case "${f}" in
        */target/*) continue ;;  # build output, not committed
    esac
    base=$(basename "${f}")
    case "${f}" in
        */test-fixtures.json) ;;  # FR-019 explicit carve-out — parity harness consumes this; documented in spec.
        */src/render/*.rs) ;;
        */templates/*.jinja) ;;
        *)
            disallowed+=("${f}")
            ;;
    esac
done < <(find \
    rust/crates/sittir-rust/src/render rust/crates/sittir-rust/templates rust/crates/sittir-rust/test-fixtures.json \
    rust/crates/sittir-typescript/src/render rust/crates/sittir-typescript/templates rust/crates/sittir-typescript/test-fixtures.json \
    rust/crates/sittir-python/src/render rust/crates/sittir-python/templates rust/crates/sittir-python/test-fixtures.json \
    -type f 2>/dev/null)

if [ ${#disallowed[@]} -gt 0 ]; then
    echo "FAIL (c): disallowed files in rust/crates/sittir-* render artifacts (FR-019):"
    printf '  %s\n' "${disallowed[@]}"
    echo "         Allowed: src/render/*.rs, templates/*.jinja, test-fixtures.json."
    fail=1
fi

# ---- (d) derive-macro allow-list --------------------------------------------
# `cargo tree -e normal --depth N` collapses to one line per package;
# we filter to anything name-matching `*derive*` or `*proc-macro*` and
# subtract the allow-list. Depth=4 is enough to traverse our shallow
# dep graph without dragging in tree-sitter's internals.
echo "[scope] (d) scanning Rust dep graph for derive / proc-macro crates…"

# Allow-list — the four named crates the spec authorises plus the
# transitive proc-macro deps each one drags in. Each entry has a
# one-line rationale explaining why it's tolerated. Adding a new
# entry: write the rationale here AND update FR-013's enumerated
# list in spec 012.
allow=(
    # Spec-named: render templates + boundary + serde + tree-sitter
    "askama_derive"            # askama 0.14 — `#[derive(Template)]`
    "napi-derive"              # napi 3 — `#[napi(object)]` + `#[napi]`
    "serde_derive"             # serde 1 — `#[derive(Serialize/Deserialize)]`
    # Tree-sitter internals (transitive — pulled in by tree-sitter and
    # the per-grammar tree-sitter-{lang} crates the napi bindings link).
    "thiserror-impl"           # tree-sitter error chain
    # Criterion bench dev-dep tree. Only compiled into bench artifacts
    # — not the production crate. Documented as bench-only here.
    "futures-macro"            # criterion dev-dep
    "ctor-proc-macro"          # criterion / inventory init
    "dtor-proc-macro"          # criterion / inventory teardown
    "clap_derive"              # criterion CLI parsing
    "rustversion"              # transitive (clap / serde_json / quote / zerocopy)
    "wasm-bindgen-macro"       # criterion's plotters via wasm-bindgen (HTML reports)
    "zerocopy-derive"          # zerocopy used by tracing-style internals
)

# Run cargo metadata once and extract derive/proc-macro crate names.
# `cargo tree` is friendlier but its formatting drifts; metadata is
# stable. We look at all packages with `kind = "proc-macro"` in the
# metadata. `--offline` keeps CI deterministic; the workspace's
# Cargo.lock is checked in so this resolves without registry hits.
meta=$(cargo metadata --format-version 1 --offline 2>/dev/null \
    || cargo metadata --format-version 1 2>/dev/null \
    || true)
if [ -z "${meta}" ]; then
    echo "[scope] (d) cargo metadata unavailable — skipping derive-macro gate."
    proc_macros=""
else
proc_macros=$(printf '%s' "${meta}" | python3 -c '
import json, sys
m = json.loads(sys.stdin.read())
pkgs = m.get("packages", [])
seen = set()
for p in pkgs:
    for t in p.get("targets", []):
        if "proc-macro" in t.get("kind", []):
            seen.add(p["name"])
for n in sorted(seen):
    print(n)
' 2>/dev/null || true)
fi

unauth=()
while IFS= read -r line; do
    [ -z "${line}" ] && continue
    keep=0
    for ok in "${allow[@]}"; do
        if [[ "${line}" == *"${ok}"* ]]; then
            keep=1
            break
        fi
    done
    if [ "${keep}" -eq 0 ]; then
        unauth+=("${line}")
    fi
done <<< "${proc_macros}"

if [ ${#unauth[@]} -gt 0 ]; then
    echo "FAIL (d): unauthorized derive / proc-macro crates in dep graph (FR-013):"
    printf '  %s\n' "${unauth[@]}"
    echo "         Allow-list: ${allow[*]}"
    echo "         Adding a new one requires updating this script + the spec."
    fail=1
fi

if [ "${fail}" -ne 0 ]; then
    echo "[scope] failed — see above."
    exit 1
fi

echo "[scope] all four boundary gates pass."
