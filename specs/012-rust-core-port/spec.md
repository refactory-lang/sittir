# Feature Specification: Rust Port of `@sittir/core`

**Feature Branch**: `012-rust-core-port`
**Created**: 2026-04-22
**Last updated**: 2026-04-22 (post-clarify: Q1–Q4 decisions absorbed)
**Status**: Draft (spec-only; implementation gated on round-trip ceilings reaching zero)
**Input**: User description: Rust Port of `@sittir/core` — v3 specification, refined via `/speckit-superb-clarify` into a phased delivery. **MVP (release 1): native Node addon (napi-rs) + existing TypeScript/Nunjucks fallback.** WASM build and crates.io publication are deferred to follow-up releases. The Rust `readNode` produces primitive NodeData only; existing TypeScript enrichment (`wrap.ts`, `readTreeNode`, `_wrapTable`, factory getter/setter binding) runs over the Rust output to yield the full consumer-facing NodeData. Shared per-rule `.jinja` templates feed both engines. Render parity is byte-identical; full round-trip parity is semantic (re-parse equivalence).

## Clarifications

### Session 2026-04-22

- Q: NodeData primitive wire shape — exact field list → A: 8 fields — `$type`, `$fields`, `$children`, `$text`, `$span`, `$nodeId`, `$source`, `$named`. `$raw` excluded (derivable from `span + source`); `$variant` and other derived fields are enrichment-layer (TS), not wire.
- Q: TS codegen scope — new outputs required for Rust? → A: Zero new runtime artifacts. Rust crate generates its `match kind { ... }` dispatch and filter-alias tables at codegen time from existing `.jinja` file list + `node-model.json5`. Nothing is loaded from disk at runtime.
- Q: Engine-version / template-bundle mismatch detection → A: SHA-256 content hash over the grammar's `.jinja` files (stable order, normalized line endings), computed at codegen time, baked into the Rust binary as a `const`, exported from the TS package as a parallel constant. Compared at napi load; mismatch → transparent fall-through to TS engine.
- Q: Parity fixture generation procedure → A: Auto-extracted from the existing round-trip validator corpus on every codegen run. Render-parity partition is filtered to render-path NodeData; round-trip partition uses the full parse→read→splice→re-parse sequence. No hand-authored fixtures in MVP; coverage scales with the validator corpus.
- Q: Fallback diagnostic surface — shape → A: Exported `getActiveBackend()` JS function for programmatic inspection (returns `{ name, reason?, hashMatch? }`), plus `SITTIR_BACKEND_DEBUG=1` environment variable which, when set, writes a one-line stderr diagnostic at first-load time. Default behavior remains fully silent.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Codemod author runs a large codemod in Node without behavior change (Priority: P1, in MVP)

A developer authoring a cross-file codemod against a Rust/TypeScript/Python repository invokes sittir from a Node.js script. Their codemod pattern-matches nodes, drills into matches, edits fields via factory APIs, and writes modified source back to disk. Today the read/render/splice work runs in TypeScript with repeated FFI crossings into ast-grep's native engine; on large repositories (thousands of matches per run) this dominates wall-clock time. After this feature ships, the same codemod script (unchanged source) transparently uses the Rust engine and completes noticeably faster — no rewrite, no API changes, no observable diff in generated source.

**Why this priority**: This is the load-bearing value proposition and the only user story in MVP scope. Performance wins here fund the subsequent releases (US2 crate publication, US3 WASM) by proving the engine is correct.

**Independent Test**: Run an existing sittir codemod suite against a fixed corpus twice — once with the native backend enabled, once forced to the TypeScript fallback — and verify (a) render-output byte-identical between engines, (b) full written files re-parse to equivalent ASTs, and (c) measurable wall-clock improvement on the native run.

**Acceptance Scenarios**:

1. **Given** a Node.js codemod using sittir factories and `readNode()` against a 10k-file repository, **When** the native backend is available, **Then** the script executes, produces render output byte-identical to the TypeScript-only baseline, full written files re-parse to equivalent ASTs, and total wall-clock time is strictly less than the TypeScript-only baseline.
2. **Given** the native backend is unavailable on this platform (missing prebuilt binary), **When** the same script runs, **Then** the package silently falls back to the TypeScript engine and produces identical output with no code change on the consumer side.
3. **Given** a codemod that constructs new nodes via factories, renders them, and splices them into source, **When** that flow executes on the native backend, **Then** the resulting source string is byte-identical at the render step and the full spliced file re-parses to the same AST the TypeScript engine produces for the same inputs.
4. **Given** a template file contains an undefined variable reference, **When** the package is built, **Then** the error surfaces at build time (Rust side) and at first-render time with filename + line (TypeScript side) — no silent wrong output.

---

### User Story 2 — Rust consumer depends on the core engine as a crate (Priority: deferred — post-MVP)

A Rust developer (inside Refactory or externally) wants to use sittir's render/read/splice engine directly from Rust, without going through Node. They add `sittir-core` and a grammar crate to their `Cargo.toml`, parse source with tree-sitter, call the engine's read/render APIs, and apply edits — all in-process, with no JavaScript involved.

**Status:** Out of MVP. The crate surface will exist as an internal Cargo workspace dependency during MVP development (the napi addon and fallback-chain integration depend on it), but is not published to crates.io and is not a supported external consumption surface at MVP release. Targeted for release 2.

**Why deferred**: The external Rust-consumer story requires (a) the full read/enrich pipeline to be Rust-native (Q4 Approach C, chosen for MVP, leaves enrichment in TypeScript), and (b) a stable published crate API. Both are real scope; the MVP ships neither. Refactory's Rust-side integration should use a path or git Cargo dependency until the crate is published.

**Acceptance Scenarios (for the follow-up release — informational)**:

1. **Given** a Cargo project depending only on `sittir-core` and one grammar render crate, **When** `cargo build` runs on a clean machine, **Then** it succeeds without requiring any Node.js, npm, or JavaScript toolchain.
2. **Given** a Rust consumer calls the render engine on a node constructed programmatically, **When** the render completes, **Then** the output matches what the TypeScript engine produces for the equivalent node, byte for byte.
3. **Given** a template file is malformed or references an undefined variable, **When** the render crate is compiled, **Then** the Rust build fails with a clear pointer to the offending template file and line.

---

### User Story 3 — Browser / edge-runtime consumer runs the engine in WASM (Priority: deferred — post-MVP)

A developer building a language server, a VS Code web extension, or an edge-runtime deployment (Cloudflare Workers, Deno Deploy) wants sittir's render engine to run where Node-native addons cannot.

**Status:** Out of MVP. No existing consumer is blocked today on WASM availability; the Nunjucks/TypeScript fallback already runs in any JS runtime. WASM is targeted for release 3 (after the crate is published) to minimize the CI/toolchain lift on the MVP.

**Why deferred**: Shipping WASM on day one triples the parity-testing matrix (native ↔ WASM ↔ TS), adds wasm-bindgen + WASM-compatible ast-grep build dependencies to the release pipeline, and protects a story no consumer is currently blocked on. Proving the native + TS parity first is a better use of release-1 effort.

---

### Edge Cases

- **Native addon missing for the current platform** (no prebuilt binary, glibc mismatch, arch mismatch): the package silently selects the TypeScript engine. A one-time diagnostic is available opt-in; default is silent.
- **Uncovered platform outside the prebuilt-binary matrix**: same behavior as above — transparent TS fallback. No error is surfaced to the consumer by default.
- **Template variable not present in the runtime template context**: Rust side fails at `cargo build` with template-file + line. TypeScript side fails at first render of that template with the same diagnostic detail (filename + line). Neither engine silently emits a wrong string.
- **Unknown node kind at render time** (a kind with no registered template): engine returns a structured error identifying the kind; no partial or garbled output.
- **Engine version mismatch** between the Rust render crate and the shared template bundle (e.g. a grammar was regenerated with new templates but an older binary is loaded): detected at napi load time via SHA-256 content-hash comparison (see FR-020). On mismatch the native backend is refused and the package transparently falls through to the TypeScript engine (per FR-009). Neither engine is ever invoked with stale templates.
- **NodeData serialization across the JS↔Rust boundary omits optional fields** (e.g. `$variant`, `$source`, `$span` when absent): round-trip reads back the same logical node, with omitted optionals remaining absent rather than being materialized as empty.
- **Render-path parity regression introduced by a template edit**: the shared-fixture render-parity suite catches divergence between TypeScript and Rust output on any affected fixture, failing CI before the change lands.
- **Splice-path tokenizer/extras-placement drift**: the full round-trip suite catches AST-visible regressions (re-parse to a different tree) but tolerates whitespace-only drift that re-parses identically — by design (Q2 Approach C).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The package MUST provide two backend engines in the MVP release — a Node-native addon and a pure-TypeScript fallback — selected at runtime in that preference order when a consumer imports sittir from JavaScript. The WASM backend is a named future release (post-MVP).
- **FR-002a (render parity — byte-identical)**: The Rust and TypeScript render engines MUST produce byte-identical output on the shared render-only fixture corpus; any divergence on any render fixture MUST fail CI.
- **FR-002b (round-trip parity — semantic)**: The full pipeline (parse → read → splice → re-parse) MUST produce re-parse-equivalent ASTs across the two engines on the shared round-trip fixture corpus; whitespace-only or extras-placement differences that do not affect the re-parsed tree are permitted.
- **FR-003**: The Rust render engine MUST consume the same per-rule Jinja template files the TypeScript Nunjucks engine consumes (landed in branch 011); no Rust-specific template variants are permitted.
- **FR-004**: The Rust `sittir-core` crate MUST be buildable as a standalone Cargo workspace member with no JavaScript or npm dependencies in its build graph; publication to crates.io is **not** an MVP deliverable.
- **FR-005**: The read pipeline inside the Rust process MUST NOT cross the JS↔Rust boundary per-field. Raw tree traversal (kind, raw field names, children, spans, `nodeId`) runs entirely in Rust; the single boundary crossing per match returns a primitive `NodeData` value to JavaScript.
- **FR-005a (readNode division of labor — Q4 Approach C)**: The Rust `readNode` MUST produce only **primitive NodeData**, serialized across the boundary with exactly these eight `$`-prefixed top-level fields: `$type` (string, required), `$fields` (map of raw field name → FieldValue, optional — omitted when empty), `$children` (ordered array of NodeData, optional — omitted when empty), `$text` (string, optional — leaf nodes only), `$span` (`{start, end}` byte offsets, optional), `$nodeId` (u32, optional — present when drill-in is possible), `$source` (`"ts" | "sg" | "factory"` — always `"ts"` for readNode output), `$named` (boolean — from tree-sitter's named/anonymous distinction). Optional fields MUST elide from the wire when absent (`skip_serializing_if = none` semantics). Any other field (`$variant`, promoted-keyword fields, inferred supertype labels, `$raw` source slices) MUST NOT appear on the wire — those are enrichment-layer concerns handled in TypeScript (`wrap.ts` / `readTreeNode` / `_wrapTable` / factories) over the Rust primitive output.
- **FR-006**: Consumer TypeScript/JavaScript code that uses the current sittir API (factories, `readNode`, `.render()`, `.toEdit()`, `from.*`, `ir.*`, `is.*`) MUST continue to work unchanged when the native backend is active — the backend switch is invisible at the source level.
- **FR-007**: Typed/ergonomic TS surfaces (`wrap`, `factories`, `types`, `from`, `ir`, `is`, `loader`) AND all semantic enrichment currently performed inside `readNode.ts` MUST remain in TypeScript. The port scope is limited to the hot-path tree traversal, render, and splice; enrichment stays TS-side per FR-005a.
- **FR-008**: Template validity MUST be enforced at Rust build time — undefined template variables, unknown tags, or syntax errors MUST fail `cargo build` with a diagnostic that identifies the template file and line.
- **FR-009**: When the native backend is unavailable at load time (missing binary, unsupported platform, load error), the package MUST transparently fall back to the TypeScript engine and continue producing correct output with no behavior change visible to the consumer.
- **FR-010**: NodeData transferred across the JS↔Rust boundary MUST use `$`-prefixed field names on the wire (per spec 008 US7) so that JavaScript consumers already on the `$`-prefix surface see the identical shape regardless of backend. The minimum wire contract is the primitive-NodeData shape defined in FR-005a.
- **FR-011**: Polymorph nodes MUST render correctly through child-type template dispatch for the general case; only the three enumerated exception rules (`rust/visibility_modifier`, `typescript/export_statement`, `typescript/call_expression`) may use in-template variant conditionals. `$variant` is NOT required to be present on Rust-emitted NodeData at read time — TS enrichment attaches it where needed (FR-005a).
- **FR-012**: A shared JSON test fixture corpus MUST exist with two partitions: (i) a **render-parity partition** used with FR-002a and (ii) a **round-trip partition** used with FR-002b. Each partition MUST cover all three grammars (Rust, TypeScript, Python) and exercise read, render, and splice paths. Both engines MUST execute both partitions in CI. The corpus MUST be **auto-extracted from the existing round-trip validator's input/output pairs** on every codegen run — the render-parity partition is the subset of NodeData → rendered-string pairs produced by the render path; the round-trip partition is the full parse → read → splice → re-parse sequence. Hand-authored fixtures MUST NOT be required for MVP — coverage growth tracks the validator corpus automatically.
- **FR-013**: The implementation MUST NOT introduce a custom procedural macro, `macro_rules` templating layer, or bespoke template grammar; the Rust render path MUST consume standard Jinja syntax via a compile-time Jinja template engine.
- **FR-014**: The Rust port MUST NOT ship until round-trip ceilings (render + re-parse + from-resolution) are at zero across all three grammars (Rust, TypeScript, Python) on the current TypeScript backend — this is the hard decision gate stated in the input.
- **FR-015**: Filter behavior that diverges in name between the two template engines (e.g. `upper`/`lower` vs. `uppercase`/`lowercase`) MUST be aliased on the Rust side so that the same template text produces the same rendered output in both engines.
- **FR-016**: The Rust engine MUST provide a stable boundary API covering at minimum: parse + search + read for a match (returning primitive NodeData per FR-005a), drill-in by node identifier, render a supplied NodeData, and apply a batch of edits to a source string returning the modified string.
- **FR-017 (platform matrix — Q3 Approach B)**: The native addon MUST ship prebuilt binaries on the standard napi-rs matrix at MVP: macOS arm64, macOS x64, Linux x64 (glibc), Linux x64 (musl), Linux arm64 (glibc), Linux arm64 (musl), and Windows x64. Platforms outside this set MUST transparently use the TypeScript fallback (FR-009).
- **FR-018 (deferred-scope boundary)**: The MVP release MUST NOT ship a WASM artifact, MUST NOT publish `sittir-core` to crates.io, and MUST NOT expose the Rust engine as a public Rust consumer API. Follow-up releases re-open each of these surfaces as separate scoped work items.
- **FR-019 (no new runtime codegen artifacts)**: TS codegen MUST NOT emit any new runtime-loaded artifact (e.g. manifest JSON, dispatch table file, filter-alias registry) specifically for Rust consumption. The Rust render crate's kind→template dispatch, filter alias table, and any other per-grammar metadata MUST be generated at codegen time as Rust source (e.g. inside the emitted `templates.rs`) from existing codegen inputs (the `.jinja` file list and `node-model.json5`) and compiled into the binary. No runtime manifest loading.
- **FR-020 (template-bundle hash for version skew detection)**: TS codegen MUST compute a SHA-256 content hash over the per-grammar `.jinja` file set (deterministic file order; newline normalization) and MUST (a) bake that hash into the emitted Rust source as a `const` (e.g. `pub const TEMPLATE_BUNDLE_HASH: &str = "..."`) and (b) export the same hash from the corresponding `@sittir/{lang}` TypeScript package as a module constant. The napi binding MUST expose the Rust-side hash; at load time the JS runtime-selection layer MUST compare the two hashes. On mismatch the native backend MUST be refused and the package MUST fall through to the TypeScript engine (per FR-009). On match the native backend proceeds normally.
- **FR-021 (backend-selection diagnostic surface)**: Each `@sittir/{lang}` package MUST export a `getActiveBackend()` function from its top-level entry point. The function MUST return an object describing the currently active backend, minimally: `{ name: "native" | "typescript", reason?: string, hashMatch?: boolean }` where `reason` is populated on fallback (e.g. `"native binary not available for this platform"`, `"template-bundle hash mismatch"`) and `hashMatch` reflects the FR-020 comparison outcome. Additionally, when the environment variable `SITTIR_BACKEND_DEBUG` is set to `"1"` (or any truthy non-empty string), the package MUST write a single-line human-readable diagnostic to stderr at first backend-selection time, stating which backend was selected and (on fallback) the reason. Under default configuration (env var unset) the package MUST be silent — no stdout or stderr output related to backend selection.

### Key Entities *(include if feature involves data)*

- **NodeData (consumer-facing)** — The enriched shape TypeScript consumers see. Carries node kind, optional field map (raw names), optional ordered children, optional literal text for leaves, optional byte span, optional node identifier, optional provenance (`ts` | `sg` | `factory`), optional variant label, optional `$named` flag, and bound fluent getter/setter methods. Wire form uses `$`-prefixed field names. **Produced by: TS enrichment over Rust primitive output** (per FR-005a).
- **NodeData (primitive — Rust wire shape)** — The exact shape Rust emits across the boundary per match. **Eight** `$`-prefixed top-level fields: `$type` (string, required), `$fields` (raw-named field map, optional), `$children` (ordered array, optional), `$text` (string, optional — leaves only), `$span` (byte range, optional), `$nodeId` (u32, optional), `$source` (`"ts"` from readNode), `$named` (boolean). Optionals elide on the wire. No derived fields (`$variant`, promoted keywords, inferred supertype membership, `$raw`). JavaScript upgrades this to the consumer-facing shape via the existing TS enrichment pipeline.
- **TemplateContext** — The pre-processed input a template consumes. Carries a map of pre-rendered string fields, a pre-rendered children string, a parallel list of per-child rendered strings, the variant label (if applicable), leaf text, and leading/trailing separator flags. Shape is identical on the TypeScript and Rust sides.
- **Edit** — A single replacement operation against a source string: start byte offset, end byte offset, and replacement text. Batches of Edits cross the boundary JS → Rust at splice time.
- **Shared template bundle** — The set of per-rule `.jinja` files generated by TypeScript codegen per grammar. Consumed at runtime by Nunjucks and at compile time by the Rust render crate. Single source of truth — no engine-specific variants.
- **Shared fixture corpus** — JSON-encoded NodeData inputs paired with expected rendered output strings and expected re-parse trees. Partitioned into (i) render-parity fixtures (used for byte-identical comparison) and (ii) round-trip fixtures (used for semantic-parity comparison).
- **Backend selection policy** — The runtime rule that picks between the native addon and TypeScript fallback based on platform and loadability; invisible to consumer code.

## Assumptions

- **Phased release — MVP is native + TS only (Q1 Approach A).** WASM (original US3) and crates.io publication (original US2) are named future releases, not MVP deliverables. Any work item in this spec that would block only on WASM or crates.io is out of scope.
- **Render parity is byte-identical; round-trip parity is semantic (Q2 Approach C).** Whitespace or extras-placement differences that don't change the re-parsed AST are acceptable on the round-trip path but not on the render path.
- **Standard napi-rs platform matrix at MVP (Q3 Approach B).** 7 prebuilt artifacts (macOS arm64/x64, Linux x64/arm64 × glibc/musl, Windows x64). Users on other platforms transparently use the TS engine.
- **Rust readNode produces primitive data only; TS owns enrichment (Q4 Approach C).** This is explicitly chosen over hand-porting TS readNode semantics (DRY violation per Principle XI) and over a manifest-based data-driven approach (not needed when TS enrichment is already a working pipeline).
- Performance "noticeably faster" on the native backend is interpreted as "no regression vs. the TypeScript baseline, with measurable improvement on realistic codemod workloads." Specific numeric thresholds (e.g. X× throughput) will be established once benchmarks exist and are out of scope for this spec; the hard requirements are the parity bars in FR-002a/b and no wall-clock regression.
- The grammar set in scope is the current three grammars: Rust, TypeScript, Python. New grammars added after this feature inherit the same dual-engine parity requirement automatically (same codegen pipeline emits both template files and Rust render structs).
- Backend fallback is silent by default; the opt-in diagnostic shape is specified in FR-021 (exported `getActiveBackend()` + `SITTIR_BACKEND_DEBUG` env var).
- The decision-gate prerequisite ("round-trip ceilings at zero across all three grammars") is work carried under the existing round-trip-cleanup tracks, not inside this feature. This feature is spec-only until that gate is cleared.
- The per-rule `.jinja` files and the TypeScript `buildTemplateContext()` pipeline already shipped in branch 011 are treated as fixed inputs to this feature; any change to those would be a separate change under the template-migration track.
- Refactory's Rust-side integration, PyO3 Python bindings, and language-server WASM hosting are enabled by the engine shape this spec defines but are not part of MVP delivery.

## Dependencies

- Landed: per-rule `.jinja` templates and the Nunjucks-based TypeScript render engine (branch 011).
- Landed: `$`-prefixed NodeData field naming and `$source` provenance tagging (spec 008 US7).
- Landed: the TypeScript enrichment pipeline (`wrap.ts`, `readTreeNode`, `_wrapTable`, factory getter/setter binding) that the Rust primitive output feeds into (per FR-005a).
- Gating: round-trip ceilings at zero for Rust, TypeScript, and Python grammars on the current TypeScript backend. Implementation of this feature MUST NOT begin until this gate is cleared.
- External: tree-sitter Rust crate for parsing; ast-grep's Rust core for pattern search; a compile-time Jinja template engine for Rust-side template compilation; serde + serde_json for the boundary format. No bespoke proc-macro authoring is permitted.

## Deferred / Future Work (informational; not MVP scope)

- **Release 2 (indicative):** Promote `sittir-core` to a publishable crate on crates.io; expose a Rust-native consumer API. Requires the Rust side to gain full enrichment semantics or a data-driven manifest equivalent (follow-on to FR-005a).
- **Release 3 (indicative):** WASM backend via wasm-bindgen; browser/edge-runtime consumption. Re-introduces the three-tier fallback chain (native → WASM → TS).
- **PyO3 Python bindings:** separate feature, depends on Release 2.
- **Numeric performance thresholds:** deferred to the benchmark phase per the v3 input.
- **Opt-in backend-selection diagnostic surface:** shape and API deferred; the MVP requirement is silent fallback.

## Open Questions (for `/speckit.clarify` or `/speckit.plan`)

Surfaced during the clarification pass but not load-bearing on the MVP scope decisions made above:

1. ~~**Minimum NodeData wire contract — exact field list.**~~ **Resolved 2026-04-22** — see Clarifications and FR-005a: 8 fields.
2. **Edit-path batching shape.** When a consumer builds a NodeData in JS and calls `.toEdit()`, does rendering cross JS→Rust per-edit, or does the Rust side accept `Vec<(NodeData, ByteRange)>` → `Vec<Edit>` in one crossing? Candidate FR-019 in a follow-up refinement.
3. ~~**Engine-version / template-bundle compatibility check at load time.**~~ **Resolved 2026-04-22** — see Clarifications and FR-020: SHA-256 content hash of `.jinja` bundle, baked-in + exported, compared at napi load.
4. ~~**Parity fixture generation procedure.**~~ **Resolved 2026-04-22** — see Clarifications and FR-012: auto-extracted from the round-trip validator corpus on every codegen run.

## Success Criteria *(mandatory)*

### Measurable Outcomes (MVP)

- **SC-001a (render parity)**: On the render-parity partition of the shared fixture corpus across all three grammars, the Rust and TypeScript render engines produce **100% byte-identical output** — zero divergent fixtures in CI.
- **SC-001b (round-trip parity)**: On the round-trip partition of the shared fixture corpus across all three grammars, outputs from the two engines re-parse to **100% equivalent ASTs** — zero divergent fixtures in CI. Whitespace-only or extras-placement drift that re-parses identically is not a divergence.
- **SC-002**: Existing sittir codemod scripts (selected sample from the Refactory codemod suite) run end-to-end against the native backend and satisfy the parity bars above against the TypeScript-baseline run on the same inputs — no behavior regression.
- **SC-003**: On large codemod runs (thousands of matches against the existing benchmark corpus), total wall-clock time on the native backend is **strictly lower** than on the TypeScript-only baseline, measured on the same hardware with warm caches — exact magnitude to be set once benchmarks exist, but a regression is a failure.
- **SC-004**: When the native backend is unavailable (uncovered platform or missing prebuilt binary), a codemod run on the same script completes successfully via the TypeScript fallback and produces output satisfying both parity bars — **100% of backend-unavailability scenarios fall through silently**.
- **SC-005**: A malformed template (undefined variable, invalid syntax) triggers a build-time failure on the Rust side **in 100% of test cases** — no template defect reaches the rendered output.
- **SC-006 (platform coverage)**: The native backend loads and exercises the render + splice path successfully on **each of the seven prebuilt-binary platforms** listed in FR-017 — verified via CI job per platform.
- **SC-007 (boundary shape)**: The Rust `readNode` output contains **zero derived/enriched fields** (`$variant`, promoted keywords, inferred supertype labels) — verified by asserting the Rust wire shape matches the primitive-NodeData contract in FR-005a, and that TypeScript enrichment is the sole producer of the consumer-facing NodeData shape.
- **SC-008**: No TypeScript-facing API surface (`readNode`, factories, `render()`, `toEdit()`, `replace()`, `from.*`, `ir.*`, `is.*`) changes its signature or observable behavior as a result of this feature — **0 breaking changes** visible to consumers.

### Deferred Success Criteria (not MVP; informational)

- **SC-DEF-01 (Release 2)**: A small external Rust consumer can depend on the published `sittir-core` crate, build on a machine with no Node.js or npm installed, and successfully render and splice using the same fixture inputs that succeed on the JavaScript consumer path.
- **SC-DEF-02 (Release 3)**: The WASM backend runs in a representative browser/edge runtime and satisfies both parity bars against the TypeScript engine on a designated WASM-compatible fixture subset.
