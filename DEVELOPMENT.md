# Development

This is the command reference for a source checkout. The [README](README.md) describes the public API; [CLAUDE.md](CLAUDE.md) contains shared contributor and agent instructions.

## Setup

Use Node **22.18 or newer**, the pnpm version pinned in `package.json`, and the Rust toolchain pinned in `rust-toolchain.toml`. The Rust workspace declares its minimum version separately in `Cargo.toml`. Parser regeneration also needs the WebAssembly toolchain used by tree-sitter.

```sh
pnpm run bootstrap
pnpm run build
```

`bootstrap` installs dependencies, tracked Git hooks, and grammar-native bindings. `build` compiles the workspace packages as well. Native bindings are local platform binaries; installing JavaScript dependencies alone does not build them.

Hooks are installed into Git's hooks directory by `.githooks/install`; they are not selected by setting `core.hooksPath` to this repository's `.githooks`. Existing unmanaged hooks are preserved beside the installed hook. The post-checkout hook can bootstrap a known branch checkout; `SITTIR_NO_BOOTSTRAP=1` skips that automatic setup. Run setup manually after reviewing an unfamiliar checkout.

Each worktree needs its own dependencies. Do not symlink another checkout's `node_modules`: workspace package resolution would then read the other checkout's sources. In an Infigraph-indexed repository, also run `infigraph worktree init <path>` after creating a worktree.

## Everyday checks

Run commands from the repository root.

```sh
pnpm test
pnpm run type-check
pnpm run lint
pnpm run format:check
pnpm run build
```

For focused work, call Vitest directly with the relevant paths. This avoids recording a full-suite result for a partial run.

```sh
pnpm exec vitest run tests/acceptance/readme-snippets.test.ts tests/acceptance/examples-run.test.ts
pnpm run type-check:examples
pnpm run type-check:generated-examples
```

The documentation checks execute and type-check snippets in the root/package READMEs and usage guide, and run every exported function in the compile-checked example modules. An example with parameters needs a sample input in `tests/acceptance/examples-run.test.ts`. Generated reconstruction examples have a separate type-check and freshness gate.

Use `expression; // "expected text"` trailing expectations in executable Markdown snippets; the acceptance harness asserts string, boolean, and numeric expectations. A genuinely illustrative TypeScript block must carry `<!-- snippet: illustrative -->` immediately before its fence. Do not use that marker to hide a broken usage example.

## Regeneration

All five workspace grammars—Rust, TypeScript, Python, regex, and SCM—are included in the stable grammar set.

```sh
pnpm run regen:all

pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm run gen:examples
```

Language `src/`, parser artifacts under `.sittir/`, native render modules, fixture tables, and `*.generated.ts` examples are derived output. Fix codegen, the grammar entry, or the example emitter/input and regenerate; never patch the result by hand.

A full grammar generation aligns the parser, TypeScript model, Rust render module, native binding, and extracted fixtures. Skipping a step is useful for a focused diagnostic, but is not evidence that the full pipeline passes. Do not run tests concurrently with regeneration: both read parser metadata and generated artifacts.

### Local consistency and CI drift

Generation records source/output hashes in `node_modules/.cache/sittir/generated-manifest/`. The local verifier accepts a recorded source/output pair or a tree whose inputs and outputs both match the same committed revision. The pre-commit hook and diagnostics reject stale combinations.

The manifests are per worktree and uncommitted. A fresh checkout can be verified against Git; deleting a cache is not a repair for mismatched source and generated output.

CI regenerates every grammar and requires the resulting tree to match the commit, including newly generated files. Commit regenerated output with its authored change. CI reports drift; it does not commit a repair.

## Validation

```sh
pnpm run validate:native
pnpm run validate:history
cargo test --workspace --no-default-features
cargo clippy --workspace --all-targets --no-default-features -- -D warnings
```

`validate:native` regenerates and rebuilds before collecting native validator counts. `validate:history` compares recorded runs. Run the full Rust workspace from this repository root; testing only `sittir-core` does not compile every generated grammar transport. Disabling default features allows standalone Rust tests to link without a Node host.

Corpus-affecting changes require comparable raw counts **per grammar**, including pass/total and AST matches. Preserve the universe of admitted kinds and fixtures; aggregate totals can hide exclusions.

The committed regression contracts are:

- `packages/tools/baselines/native.json`: validator floors and excluded kinds
- `packages/tools/sclass-ceilings.json`: maximum classified round-trip debt
- `packages/tools/validation-report.json`: the measured report checked against those ceilings

Do not weaken a floor or raise a debt ceiling to make a gate pass. Tighten the matching baseline when a defect is removed, and commit a changed report with its corresponding validated change.

Validation/test history is recorded and committed automatically on the configured recording branches (`master` and `feat/bindings`). Other branches leave those histories alone. `SITTIR_HISTORY_NO_COMMIT=1` suppresses that automatic commit on a recording branch; `SITTIR_HISTORY_COMMIT=1` explicitly enables recording on another branch.

## Native bindings

Native crates live under `rust/crates/`; the Cargo workspace root is the repository root. Each grammar's build script writes its loader, declarations, and platform `.node` binary into `packages/<grammar>/native/`.

```sh
pnpm --dir rust/crates/sittir-rust run build
pnpm --dir rust/crates/sittir-rust run build:debug
```

Use release bindings for corpus validation. Build through the package script or the full generation command, which also refreshes N-API declarations; copying a compiled library by hand can leave declarations and code out of sync.

### Reader diagnostics

The typed reader always checks required slots and cardinality. Its default-off `read-debug-checks` feature additionally checks leftover parser children against generated layout metadata.

```sh
cargo test -p sittir-parity-tests --no-default-features --test typed_read --features sittir-core/read-debug-checks
```

This feature is independent of the Rust debug/release profile. See [Clippy policy](docs/clippy-policy.md) for lint and allocation constraints.

### Package verification

```sh
pnpm run check:published
pnpm run check:published --release
```

The first command packs, installs outside the workspace, and exercises the available host binding. The release check also requires every declared native target. A successful host check does not establish coverage of all targets or that a release has been published.

## Diagnostics and references

```sh
pnpm exec tsx packages/cli/src/cli.ts --help
pnpm exec tsx packages/cli/src/cli.ts tool --help
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --help
pnpm docs
pnpm run docs:md
```

Use the existing diagnostics before writing a one-off probe. The [CLI reference](docs/cli-command-glossary.md), [grammar workflow](.claude/grammar-workflow.md), and [compiler glossary](docs/compiler-phase-glossary.md) provide the detailed entry points.
