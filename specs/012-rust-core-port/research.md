# Research — Rust Port of `@sittir/core`

**Phase 0 output.** Resolves the `NEEDS CLARIFICATION` and technology-choice items left by the plan's Technical Context so Phase 1 can proceed with concrete types and contracts. The four spec-level open questions were already resolved by `/speckit-superb-clarify` (Q1 wire shape, Q3 hash check, Q4 fixture procedure) and `/speckit.clarify` (Q2 codegen scope, Q5 diagnostic surface); this doc tightens the remaining **implementation-level** choices.

---

## R1. Rust Jinja template engine — `askama` vs. `minijinja`

**Decision**: **`askama`** (compile-time template compilation) with one `#[derive(Template)]` struct per kind, emitted by codegen.

**Rationale (FR-008 is the deciding factor)**:

- **FR-008 mandates cargo-build-time template validation.** The spec says: _"Template validity MUST be enforced at Rust build time — undefined template variables, unknown tags, or syntax errors MUST fail `cargo build` with a diagnostic that identifies the template file and line."_ A runtime-parsing engine (minijinja, tera, handlebars) fundamentally cannot satisfy this — template defects surface only at first render, not at `cargo build`. Askama is the standard Rust implementation of compile-time template compilation and satisfies FR-008 literally.
- **Fail-fast on template defects.** A malformed template fails the build immediately, with filename + line. The CI parity gate (FR-002a) would eventually catch the same error — but weeks later, for a grammar whose templates happen to be exercised by a fixture. Askama catches it in the build that introduced the bug.
- **Typed template context per kind.** Each kind's template references a specific set of raw field names (`{{ visibility_modifier }}`, `{{ name }}`, etc.). Askama validates that every referenced variable is a field on the struct. If codegen ever emits a template referencing a field the node doesn't have (a rules.ts emitter bug), askama fails the build and points at the line.
- **Zero runtime parse cost.** Templates are compiled into efficient `Display` impls. For long-running codemods rendering thousands of nodes, this is strict improvement over any runtime parser.
- **Filter aliasing** (FR-015: `upper`/`uppercase`): askama uses a custom filter module — one function per alias — declared once in `sittir-core::filters`. ~5 lines of boilerplate shared across all grammars. Not a meaningful cost.
- **FR-013 compliance**: askama consumes standard Jinja syntax. The derive macro is pre-authored by askama, not us — we don't author proc macros.

**Cost (honestly accounted)**:

- **~450 `#[derive(Template)]` structs** across three grammars (one per kind). All codegen-emitted, not hand-written. Builds the "per-kind struct with typed fields" view of the grammar that makes FR-008 work. This is a Principle II (Fewer Abstractions) tension — **see Complexity Tracking in plan.md**. The tradeoff is justified: it is the mechanism by which the spec-mandated build-time validation is achieved. Removing the structs would require replacing askama, which violates FR-008.
- **Per-grammar build time**: the derive macro invocations add measurable compile time per grammar crate (projected ~5–15s incremental on a release build). Acceptable for the CI and local-dev loops.
- **Template file layout**: askama reads `.jinja` files from disk at build time, so `packages/{lang}/rust-render/templates/` must be a copy or symlink of `packages/{lang}/templates/`. Handled by codegen writing both locations (single source: the codegen pipeline; two emission targets).

**Alternatives considered**:

- **`minijinja`** (runtime): rejected — cannot satisfy FR-008 (cargo-build-time validation). The argument "TS side catches template errors at first render + CI parity gate catches divergence" does NOT satisfy the spec's literal requirement on the Rust side. If FR-008 were relaxed to "template defects fail no later than CI", minijinja would be the right choice; it isn't.
- **`tera`**: rejected — runtime parsing, same failure against FR-008 as minijinja. Also larger feature surface we don't need.
- **Hand-written template compiler in sittir**: rejected by FR-013.

**Sittir-wide impact**: `askama = "0.14"` (or latest stable) is a new Rust dependency declared in each generated render crate (`sittir-{lang}-render`). `sittir-core` registers the filter aliases via askama's `#[template]` filter module mechanism. Per-grammar render crates depend on `askama` directly.

---

## R2. Cargo workspace layout — top-level `rust/` vs. per-package

**Decision**: **Single top-level `rust/` workspace** at repo root, with render crates pointed at by path into `packages/{lang}/rust-render/`.

**Rationale**:

- Cargo workspaces require a single `Cargo.toml` at the workspace root. Placing the workspace at repo root lets `cargo build --workspace` cover every crate in one command — essential for CI and for `cargo test` running parity fixtures across all grammars.
- The per-grammar render crates (`packages/{lang}/rust-render/`) are **generated output** and belong physically next to the `.jinja` templates they render. Listing them as workspace members by path keeps the workspace manifest authoritative while the code lives where codegen wants it.
- `sittir-core` lives in `rust/crates/sittir-core/` because it's hand-written and not tied to a single grammar.
- `sittir-{lang}-napi` lives in `rust/crates/` too because it's a thin binding glue per grammar (not generated per rule) and its release artifact (`.node`) belongs in a platform-agnostic location.

**Alternatives considered**:

- **Per-package workspace** (one Cargo workspace per `@sittir/{lang}` TS package): rejected. Would require three `Cargo.toml` files, can't share `sittir-core` as a path dependency cleanly (would need a 4th workspace at repo root for the shared crate anyway), and fragments CI.
- **Flat repo with crates at root**: rejected — clutters repo root for TS contributors.

---

## R3. napi-rs patterns for serde values across the boundary

**Decision**: Use **`napi-rs` with the `serde-json` feature** and `#[napi(object)]` where appropriate for the `Edit` type (small, fixed shape); serialize `NodeData` via `serde_json` → JSON string → `env.create_string`. Two separate patterns by value type.

**Rationale**:

- `napi-rs` supports direct N-API mapping of serde-serializable types via its `serde-json` feature — it walks the value via serde and produces V8 primitives. This is the cheapest crossing for small, stable shapes (like `Edit`).
- For `NodeData`, the shape is recursive (`$children: Vec<NodeData>`). Direct serde-to-N-API mapping is possible but (a) benchmarks published by napi-rs maintainers and adjacent projects (swc, oxc) show that for deeply recursive shapes, `JSON.parse(string)` on the V8 side is _faster_ than walking the structure per-field across the N-API boundary — V8's JSON parser is a highly optimized native-code path, whereas per-field N-API calls each incur overhead.
- This matches the v3 spec input's "napi-rs: Native N-API mapping via serde … / WASM: JSON string" table — the deferred WASM path picked JSON string for exactly this reason. We apply the same choice to the napi path for the `NodeData` boundary specifically, but keep direct N-API mapping for simple `Edit`.
- Concretely: `fn find_and_read(source: String, pattern: String) -> Result<String>` returns a JSON string that TS does `JSON.parse` on. `fn apply_edits(edits: Vec<Edit>, source: String) -> Result<String>` uses the N-API native mapping (edits are simple: `{ startPos: u32, endPos: u32, insertedText: String }`).

**Alternatives considered**:

- **All-direct-N-API mapping** (serde feature for everything): rejected for NodeData based on recursive-shape performance characteristics; kept for simple types.
- **Buffer-based custom binary protocol** (protobuf, MessagePack, CBOR): rejected — premature optimization, adds dependency, gives up debuggability. If benchmarks show JSON-string is a bottleneck we can revisit in a follow-up.

---

## R4. Edit-path boundary shape — per-edit vs. batched (spec Open Q #2)

**Decision**: **Hybrid (what FR-016 already implies, confirmed here).** `render(NodeData) -> String` is per-node; `apply_edits(Vec<Edit>, source) -> String` is batched. No combined `renderAndEdit(batch) -> String` in MVP.

**Rationale**:

- Each `render()` crossing is small (one NodeData in, one string out) and most codemods need the rendered string for logging/preview before committing to the splice. Forcing batching would leak through to the consumer API.
- `apply_edits` is naturally batched (it's a string rewrite pass) and consumers already accumulate edits before applying.
- The boundary-crossing cost per codemod run is: 1 `find_and_read` + N `render` + 1 `apply_edits` = N+2 crossings. For N=5,000 matches this is 5,002 crossings. Compared to the pre-port baseline (~5k × ~5–40 = ~25k–200k per-field readNode FFI crossings inside ast-grep's binding), this is a ~99% reduction in crossing count — the P1 motivation is preserved without needing further batching.
- A `renderAndEdit(batch)` combined endpoint is a plausible future optimization (reduces N+2 → 2 crossings) but adds boundary complexity, complicates the streaming-codemod case (where consumers want results as they go), and isn't load-bearing on the P1 performance claim. Deferred to post-MVP if benchmarks show the render crossings are a hotspot.

**Alternatives considered**:

- **Always batched** (consumer must accumulate NodeData+ByteRange pairs, submit all at once): rejected — breaks `.toEdit()` as a natural per-node operation and pushes batching logic into consumer code.
- **Per-edit-only** (no `apply_edits` batch; each Edit crosses immediately and Rust holds source state): rejected — makes Rust side stateful mid-codemod and loses the clean boundary.

**Documented in**: `plan.md` Technical Context (already); contract `contracts/napi-api.md`.

---

## R5. Template-bundle SHA-256 hash — emission and comparison mechanism

**Decision**: Computed by TS codegen during the per-grammar emit step. Bytes hashed = concatenation of `{filename}\0{file_contents_with_LF_normalized}\0` for each `.jinja` file in **sorted filename order**. Emitted to two places in the same codegen pass:

- As a `pub const TEMPLATE_BUNDLE_HASH: &str = "..."` in `packages/{lang}/rust-render/src/hash.rs` (included by `lib.rs`).
- As `export const TEMPLATE_BUNDLE_HASH = "..."` in `packages/{lang}/src/hash.ts` (re-exported from `index.ts`).

The napi binding exposes `#[napi] pub fn template_bundle_hash() -> String { sittir_{lang}_render::TEMPLATE_BUNDLE_HASH.to_string() }`. The JS runtime-selection shim imports both, compares, and picks the native backend only on match.

**Rationale**:

- Content-based hash (vs. semver or timestamp) detects _any_ template change regardless of version bump. Even a local template edit without a version bump produces a mismatch, which is the correct failure mode.
- Normalized line endings + sorted filename order guarantee the hash is deterministic across platforms (macOS vs. Linux vs. Windows CI).
- Null-separation between filename and content prevents edge cases where template content could appear to span files.
- SHA-256 > SHA-1 (collisions are effectively impossible for our input size and SHA-256 has negligible additional cost at codegen time).

**Alternatives considered**:

- **Build-time environment variable** (hash passed via `cargo:rustc-env`): rejected — couples the Rust crate build to knowing the TS-side codegen outputs. Cleaner to let codegen write `hash.rs` directly.
- **Git tree hash**: rejected — doesn't work for unpublished local template edits and breaks in non-git checkouts.

---

## R6. ast-grep core integration — version + pattern search API

**Decision**: `ast-grep-core = "0.x"` (latest 0.x at time of implementation; napi-rs ecosystem is on 0.x so consistency is preferred). Use `ast_grep_core::AstGrep::new(source, language)` + `ast_grep_core::Pattern` for the `find_and_read` path. No dependency on `@ast-grep/wasm` or `@ast-grep/napi` on the Rust side — the napi-rs binding we build _is_ the JS-facing surface.

**Rationale**:

- `ast-grep-core` is the pure-Rust core. It's what `@ast-grep/napi` wraps today. Using it directly eliminates the very FFI overhead FR-005 exists to kill.
- Pattern language compatibility with ast-grep's public surface is preserved because we're calling into the same core.

**Risks / notes**:

- The `ast-grep-core` API is pre-1.0 and may break. Pin a minor-version (`0.X`) and let the MSRV policy govern updates.
- If a future `ast-grep-core` release breaks our usage, that's a sittir-internal fix — consumer-visible API (the napi surface) is insulated.

**Alternatives considered**:

- **`ast_grep_core` as a dev-dependency + custom pattern compiler**: rejected — re-implementing ast-grep patterns is out of scope.
- **Drop pattern search, use tree-sitter queries directly**: rejected — breaks consumer-facing API parity with the current TS sittir (consumers rely on ast-grep pattern syntax).

---

## R7. Tree-sitter Rust integration — grammar access

**Decision**: Use the published per-grammar crates (`tree-sitter-rust`, `tree-sitter-typescript`, `tree-sitter-python`) as direct Rust dependencies of the per-grammar napi binding crate. The existing TS-side use of `web-tree-sitter` + WASM-compiled grammars is unchanged.

**Rationale**:

- The Rust grammar crates ship a static `Language` constant each (`tree_sitter_rust::LANGUAGE`). One-line initialization: `parser.set_language(&tree_sitter_rust::LANGUAGE.into())`.
- Versions are coupled: the grammar crate version MUST match the `.jinja` template bundle's grammar version. Mismatch here would manifest as readNode producing `$fields` keys the Rust render crate doesn't expect. The template-bundle hash check (FR-020, R5) covers this indirectly — a template regen implies a grammar version change, which produces a new hash.
- Transitive coupling: `sittir-{lang}-napi` depends on `tree-sitter-{lang}` + `sittir-{lang}-render` + `sittir-core`. The `tree-sitter-{lang}` grammar version must be pinned per-release alongside the template bundle.

**Alternatives considered**:

- **Build grammars from source in each crate**: rejected — re-implements what the published crates already do.
- **Use WASM grammars from Rust**: rejected — adds a runtime WASM layer inside the native binding, pointlessly.

---

## R8. Platform matrix CI — release-pipeline shape

**Decision**: Use **`@napi-rs/cli`'s built-in release pipeline** via a GitHub Actions matrix. 7 platform jobs (per FR-017) produce 7 `.node` artifacts, published to npm as platform-tagged subpackages (`@sittir/rust-native-darwin-arm64`, etc.) — the standard napi-rs shape.

**Rationale**:

- Reuses a well-trodden napi-rs release path (same approach as `@node-rs/argon2`, `swc`, `oxc`, `parcel`'s Rust tooling). CI configuration is near-boilerplate.
- Platform subpackages are optional peer deps of the umbrella `@sittir/rust-native`; npm installs only the one matching the consumer's platform. Unavailable platforms → no install → loadable-from-JS detection fails → TS fallback per FR-009.
- Musl Linux builds use the `napi-rs/setup-node-and-napi` action with the `musl` target; glibc builds use the default.

**CI matrix jobs** (per grammar × 7 platforms = 21 jobs at MVP):

- macOS arm64 (on `macos-14` runner — Apple silicon)
- macOS x64 (on `macos-13`)
- Linux x64 glibc (on `ubuntu-22.04`)
- Linux x64 musl (on `ubuntu-22.04` + zig-cc toolchain)
- Linux arm64 glibc (cross-compile on `ubuntu-22.04` with `aarch64-unknown-linux-gnu`)
- Linux arm64 musl (cross-compile)
- Windows x64 (on `windows-2022`)

**Alternatives considered**:

- **`cargo-dist`**: rejected — primarily for Rust binaries, not napi-rs addons; would require integration work that napi-rs's CLI already ships.
- **Docker-based cross-compilation for all**: rejected — slower, more fragile than the napi-rs per-runner pattern.

---

## R9. Performance benchmark baseline

**Decision**: **Two-tier benchmark**:

1. **Micro-benchmark** (`cargo criterion`): per-kind render + per-match read, on a synthetic corpus covering each grammar's largest-surface-area kinds. Compared within Rust against an older reference build.
2. **Macro-benchmark** (Node-level): full codemod run against a fixed-size real-world corpus (existing Refactory benchmark input, to be cataloged). Run with `SITTIR_BACKEND=native` and `SITTIR_BACKEND=typescript`, wall-clock diffed.

The macro-benchmark is the one that SC-003 is gated on. The micro-benchmark exists to identify regressions mid-development before they reach the macro level.

**Target hardware for reporting**: Refactory team's standard dev machine (macOS arm64) + one CI-linux-x64 run per release — both reported in release notes.

**Rationale**: matches the spec's intent — "strictly lower wall-clock than TS baseline on realistic codemod workloads" — while keeping a faster micro signal for developers.

**Alternatives considered**: single macro-benchmark only (rejected — no mid-development signal); pure micro (rejected — doesn't test SC-003).

---

## Summary of Phase 0 resolutions

| Item                                | Decision                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Template engine                     | `askama` (compile-time; one `#[derive(Template)]` per kind emitted by codegen) — chosen to satisfy FR-008 literally |
| Cargo workspace                     | Top-level `rust/` with per-grammar render crates at `packages/{lang}/rust-render/` as workspace members by path     |
| napi-rs boundary                    | Hybrid: JSON string for NodeData; direct N-API for Edit                                                             |
| Edit-path batching (spec Open Q #2) | Hybrid per-render + batched `apply_edits` — no combined endpoint in MVP                                             |
| Template-bundle hash                | SHA-256 over `{filename}\0{content}\0` with LF-normalized content, sorted filename order                            |
| ast-grep-core                       | Direct Rust dependency at 0.x; no WASM/napi indirection                                                             |
| Tree-sitter grammars                | Published per-grammar Rust crates; version pinned alongside template bundle                                         |
| Release pipeline                    | `@napi-rs/cli` on GitHub Actions; 7 platform jobs per grammar; platform-subpackage npm pattern                      |
| Benchmark plan                      | Two-tier (cargo criterion micro + Node macro); macro gates SC-003                                                   |

All NEEDS-CLARIFICATION items from Technical Context are resolved. Phase 1 can proceed.
