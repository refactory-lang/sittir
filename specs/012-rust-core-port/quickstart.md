# Quickstart — Working on the Rust Port

**Audience**: developers implementing or consuming feature 012 mid-development. Assumes the MVP decisions from `spec.md` and the technology choices from `research.md`.

---

## Prerequisites

- **Rust**: 1.82+ stable (install via `rustup`).
- **Node.js**: same LTS that the TS packages target.
- **pnpm**: existing monorepo setup.
- **tree-sitter CLI**: already required for sittir development.
- **Optional** — `cargo-criterion` for Rust-side benchmarks; `@napi-rs/cli` is a workspace devDependency (will be added in Phase 2).

The MVP does NOT require:
- `wasm-pack` / Emscripten (WASM path is deferred).
- A published crates.io account (crate publication is deferred).

---

## Repo layout after this feature lands

```text
sittir/
├── packages/                        # (existing — TS monorepo)
│   ├── core/                        # @sittir/core, TS runtime
│   ├── types/
│   ├── codegen/
│   ├── rust/
│   │   ├── src/                     # generated TS (existing)
│   │   ├── templates/               # generated .jinja (existing)
│   │   └── rust-render/             # NEW — generated Rust render crate
│   │       ├── Cargo.toml
│   │       ├── src/lib.rs
│   │       ├── src/templates.rs
│   │       └── src/hash.rs          # FR-020 const
│   ├── typescript/
│   │   └── rust-render/
│   └── python/
│       └── rust-render/
└── rust/                            # NEW — Rust workspace root
    ├── Cargo.toml                   # workspace manifest
    ├── crates/
    │   ├── sittir-core/             # hand-written
    │   │   └── src/
    │   │       ├── lib.rs
    │   │       ├── types.rs
    │   │       ├── read_node.rs
    │   │       ├── prepare.rs
    │   │       ├── splice.rs
    │   │       ├── boundary.rs
    │   │       └── filters.rs
    │   ├── sittir-rust-napi/        # napi binding (rust grammar)
    │   ├── sittir-typescript-napi/
    │   └── sittir-python-napi/
    └── tests/
        ├── fixtures/                # auto-extracted parity fixtures (JSON)
        └── parity/                  # cross-engine diff harness
```

---

## First build

```bash
# TS side (existing)
pnpm install
pnpm -r run type-check

# Rust side (new)
cd rust
cargo build --workspace
cargo test --workspace
```

The first `cargo build` on a fresh checkout downloads `tree-sitter`, `ast-grep-core`, `askama`, `napi`, `serde_json`, `sha2`, and the three per-grammar `tree-sitter-{lang}` crates. Expect 1–3 minutes. Incremental builds that change templates (but not grammar shape) will re-run askama's derive for the affected kinds — typically 5–15s per grammar.

---

## Regenerating the Rust render crates

Per-grammar generation is triggered through the existing codegen CLI, now with an added `--rust-render` flag:

```bash
npx tsx packages/codegen/src/cli.ts \
  --grammar rust \
  --all \
  --rust-render \
  --output packages/rust/src

# Same for typescript, python
```

This emits (per grammar):
- The existing TS output (unchanged).
- `packages/{lang}/rust-render/src/templates.rs` — `match kind { ... }` dispatch + embedded templates.
- `packages/{lang}/rust-render/src/hash.rs` — `pub const TEMPLATE_BUNDLE_HASH`.
- `packages/{lang}/src/hash.ts` — `export const TEMPLATE_BUNDLE_HASH` (matches Rust const byte-for-byte).

After regeneration, rebuild the Rust workspace:
```bash
cd rust && cargo build --workspace
```

---

## Running the parity suite locally

The shared parity fixtures are emitted by codegen from the existing round-trip validator's corpus:

```bash
# Generate fixtures (part of the codegen run above; or run standalone)
npx tsx packages/codegen/src/cli.ts --grammar rust --fixtures-only

# Rust-side parity run (byte-identical render + semantic round-trip)
cd rust && cargo test -p sittir-parity-tests

# TS-side parity sanity check (confirms fixtures are reproducible from the TS engine)
pnpm --filter '@sittir/rust' run test:parity
```

A failure on the byte-identical partition means the Rust and TS render engines diverged on a fixture; inspect the failing fixture's JSON and compare outputs. A failure on the semantic partition means the full round-trip produced a different AST on one side — usually a splice-path issue.

---

## Exercising the native backend from a Node script

```ts
// example-codemod.ts
import { getActiveBackend, findMatches, wrap, readNode } from "@sittir/rust";

console.log("backend:", getActiveBackend());
// → { name: 'native', hashMatch: true } when things are configured right

const source = await fs.readFile("some-file.rs", "utf8");
const matches = findMatches(source, "fn $NAME($$$PARAMS) { $$$BODY }");
for (const match of matches) {
  const node = wrap(match);              // existing TS API
  console.log(node.$fields.name.$text);
  // ... codemod logic ...
}
```

No API changes from the consumer's perspective. The backend swap is invisible.

### Forcing the TS fallback (for parity diffing)

```bash
SITTIR_BACKEND=typescript node example-codemod.js
```

### Diagnosing a native-load failure

```bash
SITTIR_BACKEND_DEBUG=1 node example-codemod.js 2>&1 | grep sittir
# sittir/rust: backend = typescript, reason = native binary not available for this platform
```

---

## Testing the hash-mismatch fallback path

To simulate the FR-020 failure mode:

1. Build the Rust side (cargo builds the `.node` with a baked hash).
2. Edit any `.jinja` template file under `packages/rust/templates/` — do **not** regenerate.
3. The TS-side `TEMPLATE_BUNDLE_HASH` export now doesn't match the binary's bake.
4. Run a codemod; verify `getActiveBackend()` returns `{ name: 'typescript', hashMatch: false, reason: 'template-bundle hash mismatch' }`.

---

## Adding a new grammar

New grammars inherit the Rust path automatically:

1. Add the TS-side `@sittir/{newlang}` package as usual (existing workflow).
2. In `rust/Cargo.toml`, add `packages/{newlang}/rust-render` and `rust/crates/sittir-{newlang}-napi` to the `members` list.
3. Create `rust/crates/sittir-{newlang}-napi/` from the existing napi-binding template (copy-paste from `sittir-rust-napi/` and update imports).
4. Add the new grammar to the CI platform matrix (GitHub Actions: 7 new jobs).
5. Run codegen; run parity suite; both should pass on day one if the grammar is well-formed.

---

## Common operations cheat-sheet

| Task | Command |
|---|---|
| Full rebuild (Rust + TS) | `pnpm -r run type-check && cd rust && cargo build --workspace` |
| Regenerate all grammars (TS + Rust) | `pnpm -r exec npx tsx packages/codegen/src/cli.ts --grammar $G --all --rust-render` (loop over G) |
| Run all tests | `pnpm test && cd rust && cargo test --workspace` |
| Run only parity tests | `cd rust && cargo test -p sittir-parity-tests` |
| Benchmark (micro) | `cd rust && cargo bench -p sittir-core` |
| Benchmark (macro, wall-clock) | `./scripts/bench-codemod.sh native && ./scripts/bench-codemod.sh typescript` (script TBD in Phase 2) |
| Force TS fallback | `SITTIR_BACKEND=typescript <command>` |
| Diagnose backend | `SITTIR_BACKEND_DEBUG=1 <command>` |

---

## Troubleshooting

**Symptom**: `cargo build` fails with "file not found" in `templates.rs` on a fresh checkout.
**Cause**: the Rust render crate is codegen-emitted. A fresh checkout has the stub crate but no generated contents.
**Fix**: run the codegen step first (`npx tsx packages/codegen/src/cli.ts --grammar rust --all --rust-render`).

**Symptom**: `getActiveBackend()` returns `typescript` on a supported platform.
**Cause #1**: `@sittir/{lang}-native` not installed (check `node_modules/`).
**Cause #2**: Hash mismatch — rebuild after template changes.
**Diagnose**: `SITTIR_BACKEND_DEBUG=1` prints the reason.

**Symptom**: parity suite failure on a specific fixture, byte-identical partition.
**Fix**: dump both engines' output to files and `diff` — usually a whitespace-control (`{%-` / `-%}`) mismatch or a filter-alias gap.

**Symptom**: parity suite failure on round-trip partition (re-parse tree differs).
**Fix**: likely a splice-path issue. Check that `apply_edits` sorts descending and that the fixture's edits don't overlap.

**Symptom**: Rust-side compile times > 2 minutes on fresh checkout.
**Expected**: first compile pulls tree-sitter + ast-grep + three grammar crates. Use `cargo check -p sittir-core` for iterative edits on the hand-written core crate to avoid rebuilding the grammar crates.
