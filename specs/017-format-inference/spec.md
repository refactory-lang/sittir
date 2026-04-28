# Feature Specification: Format Inference

**Feature Branch**: `017-format-inference`
**Created**: 2026-04-25
**Status**: Draft (implementation-ready; ready for plan)
**Input**: User description: "format-inference — capture format intent from source text at parse time and replay it at render time so `render(readNode(parse(source))) === source` byte-for-byte. Closes the gap that grammar templates cannot fill: format = source_text - grammar_template_output. Format encompasses any source-text variation the grammar treats as semantically equivalent — whitespace, quote style, numeric literal style, optional tokens, comment placement, and other choices that produce the same AST."

## Overview

The grammar's per-rule template defines the *shape* of rendered source — the tokens that appear, their ordering, the separators the grammar mandates. Source text adds *format*: any choice the grammar treats as semantically equivalent. Today's render path preserves some spelling incidentally through `$text` on leaf/token nodes, but it does not model or guarantee the residual branch-level choices that live at separator, wrapper, indentation, and trivia boundaries. Any source with non-canonical layout or optional-token choices therefore cannot reliably survive a parse-render roundtrip.

**Operational definition**: format is *any source-text variation that produces the same AST after parse*. Concrete categories include:

- **Whitespace** — tab vs space indent, space around operators, blank-line distribution, trailing whitespace.
- **Quote style** — Python `'foo'` vs `"foo"`; JS `'foo'` vs `"foo"` vs template literals; Rust raw strings `r"…"` vs regular strings.
- **Numeric literal style** — `1_000` vs `1000`; `0x10` vs `0X10` vs `16`; `1.` vs `1.0`; hex digit casing (`0xAB` vs `0xab`).
- **Optional tokens** — trailing commas in arrays/objects/parameter lists; redundant parentheses around expressions; optional semicolons (TypeScript, Python's newline-as-statement-terminator); line-continuation backslashes.
- **String escape style** — `"\n"` vs raw-string with literal newline; `"\u{1F600}"` vs `"😀"`.
- **Comment placement** — `//` vs `/* */` in C-likes; leading vs trailing position relative to the documented node.
- **Block-vs-inline equivalents** — Python single-line `if x: y` vs newline-indented form; single-vs-multi-line function signatures.

Anything `parse(source)` accepts as the same AST falls under format. Some of those choices already survive in narrow leaf-node cases; the system does not preserve them uniformly or expose them as first-class data.

017 treats `$format` as **residual metadata over canonical render**, not as a second copy of the source span. If a node's existing `$text` / `$fields` / `$children` values already determine its output exactly, `$format` stays absent. When canonical render would lose information, `$format` stores only the source-derived deltas needed to reconstruct the original bytes.

This feature closes that gap by attaching a structured `$format` record to `NodeData` produced from source text when residual metadata is required, and by teaching the render path to consume that record when present (falling back to template-canonical output when it is absent — exactly today's behaviour). The same contract holds across both render backends (TypeScript Nunjucks and Rust Askama), and through the existing text-edit flow for unmodified subtrees.

Spec 016 (parity-and-regressions) is concurrently fixing template-shape failures — the cluster of 16 known TS-mode failures whose root cause is the template, not the source format. 016 amended its SC-001 to scope only to template-shape failures; format-attributable failures (whitespace divergence, optional-separator choice differences) are deferred to 017's input corpus. 017's success is measured in part by clearing that deferred set.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parse-then-render reproduces source byte-for-byte (Priority: P1)

A maintainer or codemod author parses a source file, walks the resulting `NodeData` tree, then renders it back. They expect the output to be byte-equal to the input — preserving the original indentation, blank-line distribution, comment placement, and optional-separator choices. Today this fails for any non-canonical formatting; with this feature, it succeeds.

**Why this priority**: This is the load-bearing capability of the feature. Every other story builds on the format-extraction-and-replay pipeline being in place. Without US1, there is no `$format` to edit, no `$format` to mirror in native, and no value delivered.

**Independent Test**: Pick a representative fixture per grammar (rust, typescript, python) with non-canonical formatting (e.g. tab-indent, trailing-comma in lists, blank lines between top-level items). Parse it via `readNode(parse(source))`. Verify the resulting `NodeData` tree carries `$format` records on nodes whose source span differs from the template-canonical render. Render the tree. Assert the rendered string equals the original source byte-for-byte. The fixture is the test contract.

**Acceptance Scenarios**:

1. **Given** a rust source file using tab-indentation with trailing commas in struct literals, **When** the maintainer runs `render(readNode(parse(source)))`, **Then** the result equals `source` byte-for-byte (no whitespace divergence, trailing commas preserved).
2. **Given** a python source file with `# leading comments` on multiple statements and blank-line-separated function definitions, **When** the maintainer runs the same parse-render roundtrip, **Then** the comments appear in their original positions and blank lines are preserved exactly as in the source.
3. **Given** a typescript source file with mixed-style optional-semicolon usage (some statements end with `;`, others omit it), **When** the maintainer runs the parse-render roundtrip, **Then** each statement retains its original semicolon presence/absence.
4. **Given** a NodeData produced by a factory (no source provenance), **When** the maintainer renders it, **Then** the output uses template-canonical defaults (today's behaviour) — no `$format` is fabricated, no errors are thrown.

---

### User Story 2 - Edits preserve format outside the edited subtree (Priority: P1)

A maintainer applies one or more `Edit`s (for example via `node.replace(newNode)` / `node.toEdit()` and the existing text-edit application flow) to a NodeData tree that originally came from a parsed source. They expect the rendered output to differ from the source ONLY in the byte range corresponding to the edited subtree — every other character (indentation, comments, blank lines, trailing whitespace, optional separators on unmodified statements) is preserved verbatim.

**Why this priority**: P1 alongside US1 because format-preserving edits are the user-visible consequence of having `$format` at all. A codemod that re-formats every untouched line is unusable in practice — code review noise hides the real change. US1 builds the mechanism; US2 makes it usable for the codemod use case Sittir exists to serve.

**Independent Test**: Take the same fixtures used in US1. Apply a single targeted edit (e.g. rename one identifier on one line, or replace a literal). Render the edited tree. Compute the byte-diff between original source and rendered output. Assert that every diff hunk lies inside the edited subtree's source span — outside that span, every byte matches.

**Acceptance Scenarios**:

1. **Given** a rust function in a tab-indented file with several other functions, **When** the maintainer renames one parameter inside that function via `node.replace(...)`, **Then** the rendered file's diff against the original shows changes only within the renamed parameter's span; all other lines (indentation, comments, blank lines, other functions) are byte-equal.
2. **Given** a python module with a leading comment on a class and blank lines between methods, **When** the maintainer applies an `Edit[]` that inserts a new method, **Then** the leading comment, blank-line distribution, and indentation of unmodified methods are preserved; only the inserted method's bytes are new.
3. **Given** a NodeData produced by a factory (no `$format`) that is then inserted into a parsed tree via an edit, **When** the maintainer renders the result, **Then** the inserted subtree renders with template-canonical defaults; the surrounding parsed tree retains its `$format`-driven output.

---

### User Story 3 - Native render path applies format identically to TS (Priority: P2)

A maintainer running validators with `SITTIR_BACKEND=native` (the Rust Askama path) expects the same byte-equal source roundtrip US1 establishes for the TS path. The two backends consume the same `NodeData` (including `$format`) and produce identical output.

**Why this priority**: P2, not P1, because most contributors run TS-mode by default — TS-mode delivers the user-visible win of US1/US2. But native-mode is a peer backend on 012's per-handle dispatch and 016 has lifted its corpus floor above zero; leaving it template-canonical-only after 017 lands would make `SITTIR_BACKEND=native` quietly inferior on every fixture with non-trivial formatting. Until both backends honour `$format`, the dual-backend infrastructure carries weight without delivering parity.

**Independent Test**: Take the US1 fixture set. For each fixture, run the parse-render roundtrip under both `SITTIR_BACKEND=typescript` and `SITTIR_BACKEND=native`. Assert (a) both produce byte-equal output to the source, and (b) the two backends' outputs are byte-equal to each other on every intermediate render (so any future divergence on a different fixture is caught as a backend-parity bug).

**Acceptance Scenarios**:

1. **Given** the rust US1 fixture and `SITTIR_BACKEND=native`, **When** the maintainer runs the parse-render roundtrip, **Then** the output is byte-equal to the source AND byte-equal to the TS-mode output for the same fixture.
2. **Given** an iteration of native parity work for 017, **When** TS-mode tests are re-run, **Then** zero TS-mode regressions appear on US1 / US2 fixtures (no count drops, no divergence introduced).

---

### Edge Cases

- **Source span exists but matches template-canonical render exactly**: a node whose source is already canonical needs no `$format` record. Behaviour: `readNode` omits `$format` for such nodes (no empty-record bloat). `render` falls back to canonical output. Roundtrip is byte-equal trivially.
- **Mixed tabs and spaces inside a single span**: source uses both. Captured verbatim, replayed verbatim. The format extractor does not normalise.
- **Trailing comma vs no trailing comma in a list**: the choice is per-list-instance, captured per-element. The template intent is "comma-separated"; the format records "this specific list ends with a comma" (or doesn't). Roundtrip preserves the choice.
- **Comments interleaved with tokens**: stored as positional offsets (byte ranges) relative to the enclosing span, with the comment node attached to the same span. Consumers decide attachment semantics (leading vs trailing vs free); 017 does not commit to a comment-attachment model. **Note (deferred work, on-the-record)**: a minimal attachment model — at least "leading comment of the immediately-following sibling" / "trailing comment of the immediately-preceding sibling" — is the most-asked-for capability for parse-render roundtrip in practice and WILL need to land. Owner decision (2026-04-25): the positional-offsets approach in 017 is sufficient for byte-equal roundtrip, which is 017's contract. Attachment semantics are tracked as a follow-up feature (provisional 018-comment-attachment) once 017's `$format` shape is settled and we have empirical data on consumer needs. NOT silently dropped — explicitly scheduled as next work after 017 lands.
- **Whitespace at start-of-file or end-of-file**: captured on the root node's `$format` and replayed; not silently trimmed.
- **Empty optional fields**: `$format` records absence. `render` does not synthesise the field. The roundtrip is byte-equal even when the grammar template would otherwise emit a placeholder.
- **Factory-built node inserted into a parsed tree**: factory output has no `$format` (it has no source provenance). Render emits template-canonical bytes for that subtree; the surrounding parsed tree retains its `$format`-driven output. The composite render shows the boundary as a style discontinuity (acceptable — out of scope for 017 to harmonise via formatter behaviour).
- **Same fixture parsed under different upstream tree-sitter versions**: if the parse tree shape changes (e.g. a node kind splits, or a field is renamed in the grammar), `$format` extraction produces different records, but each is internally consistent with the tree it was derived from. No silent drift between extraction and application.
- **Source span is empty (zero-byte)**: extractor records empty format; render emits nothing. No special-casing required.
- **Render under format-canonical mode**: a caller may want to render *without* `$format` (e.g. to normalise a tree). The render path supports this via an opt-in mode; default is "apply `$format` if present."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The shared NodeData type definition (in `@sittir/types`) MUST gain an optional `$format` field. `$format` MUST be one residual record with named substructures — at minimum: `boundary` (leading/trailing layout around the canonical body), `slots` (separator and optional-token choices per field/child position), `literals` (spelling/style choices not already guaranteed by `$text`), and `trivia` (comments / blank lines with offsets relative to the node span). It MUST NOT duplicate the full rendered source as a second opaque string or split the same fact across parallel arrays.
- **FR-002**: `readNode` MUST populate `$format` on every node whose source span cannot be reproduced from the node's template-canonical render plus its existing `$text` / `$fields` / `$children` values alone. Nodes already reproducible without residual metadata MUST have `$format` omitted (so the absence of `$format` is itself a signal). The extraction MUST be deterministic — same source bytes plus same grammar version produce the same `$format` record.
- **FR-003**: `render` MUST apply `$format` when present and fall back to today's template-canonical render when absent. The fallback MUST be behaviour-preserving for callers that never opt into format extraction (e.g. factory-built trees never carrying `$format`).
- **FR-004**: The text-edit application flow (including `node.replace`, `node.toEdit`, and any batched `Edit[]` helper layered on top of them) MUST preserve `$format` for subtrees outside the edited byte ranges. It MUST copy untouched descendants' `$format` unchanged, MUST rebase only the ancestor metadata whose relative offsets cross the edited span, and MUST NOT strip-and-re-extract format on unmodified subtrees. Edited subtrees may carry their own `$format` (if produced by a future format-aware factory) or render template-canonical (today's default for factory output).
- **FR-005**: Both render backends — TypeScript Nunjucks (`@sittir/core`) and Rust Askama (per-grammar napi crates) — MUST consume `$format` identically and produce byte-equal output for any NodeData with `$format`. A backend-parity test MUST exist that fails when one backend's `$format` application diverges from the other's.
- **FR-006**: Spec 016's TS-mode template-shape pass counts MUST NOT regress when 017 lands — every count in `specs/016-parity-regressions/baselines/ts.json` either stays equal or moves up. The format-deferred fixtures 016 explicitly excluded from its corpus MUST move from "deferred" to "passing" under 017's roundtrip test.
- **FR-007**: All format-extraction logic MUST live on a single code path in `@sittir/core` (Principle XI: one source, one derivation). All format-application logic MUST likewise live on a single code path per backend. Adding a new format dimension (e.g. "alignment") MUST be one edit on one extractor and one edit per backend's applier — never multiple parallel walkers each computing a partial projection.
- **FR-008**: The `$format` type MUST be defined in `@sittir/types` only (Principle X: don't hand-roll types you can import). Per-grammar packages and napi crates MUST import it; no parallel re-declaration.
- **FR-009**: Generated artifacts (per-grammar `.ts` files, `.jinja` templates, napi crate sources) MUST NOT be hand-edited to support `$format` (Principle III). Any per-grammar accommodation lives in the codegen pipeline (`packages/codegen/src/*`) or in `packages/{lang}/overrides.ts`. Regenerating from the codegen entry point MUST produce the format-aware outputs unchanged.
- **FR-010**: A render-path opt-out MUST exist so callers can request template-canonical output even when `$format` is present (e.g. for normalisation use cases). Default behaviour is "apply `$format` when present"; the opt-out is explicit.
- **FR-011**: Because NodeData is plain data, `$format` MUST survive a JSON-style serialisation roundtrip (`stringify` → `parse`) on representative nodes used by 017's acceptance corpus. The field MUST not require a custom reviver to remain structurally intact.
- **FR-012**: The repository MUST contain a committed format corpus manifest at `specs/017-format-inference/format-corpus.json` that lists every acceptance fixture by grammar, format category, seed source (`016-deferred` or `017-measured`), and expected backend coverage (`typescript-only` or `both`). The manifest is the authoritative acceptance set for 017.

### Key Entities

- **`$format` Record**: a structured record attached optionally to any NodeData node. Documents the source-derived format choices for that node's span — leading/trailing whitespace, indent context, list-separator-style choices (e.g. trailing comma present/absent), and positional offsets of trivia (comments, blank lines) within the span. Defined in `@sittir/types`. Absent when source matches template-canonical render. Same source bytes → same record (deterministic).
- **Format Extractor**: the single code path inside `@sittir/core::readNode` that walks a parsed source span against the template-canonical render of the parsed shape and produces a `$format` record (or omits it when they match). Grammar-agnostic — relies on the rendered template intent, not on per-kind heuristics.
- **Format Applier**: the single code path per backend (one in `@sittir/core` for the TS render; one in each napi crate's render path for native) that consumes `$format` during render. Grammar-agnostic.
- **Format Corpus Manifest**: the committed file at `specs/017-format-inference/format-corpus.json`. Enumerates the acceptance fixtures 017 must pass, grouped by grammar and tagged with the format dimension under test (layout, separators, optional tokens, literal spelling, trivia placement, etc.). If 016 produced format-deferred fixtures they appear here with `seedSource = "016-deferred"`; any additional 017-discovered fixtures are added with `seedSource = "017-measured"`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of fixtures listed in `specs/017-format-inference/format-corpus.json` pass the parse-render byte-equal roundtrip under `SITTIR_BACKEND=typescript`.
- **SC-002**: Every fixture seeded from 016 (`seedSource = "016-deferred"`) passes under 017. If 016 closes with no deferred fixtures, the manifest still contains at least one acceptance fixture for every in-scope format category that each grammar supports, all tagged `017-measured`.
- **SC-003**: 100% of fixtures in `format-corpus.json` whose `expectedBackendCoverage` is `both` pass under `SITTIR_BACKEND=native`, and TS/native outputs are byte-equal to each other on those fixtures.
- **SC-004**: Zero regressions in 016's TS-mode template-shape pass counts after 017 lands — every count in `specs/016-parity-regressions/baselines/ts.json` stays equal or moves up.
- **SC-005**: The `$format` extractor and applier each live on a single code path (Principle XI). A reviewer running a structural search for parallel walkers (multiple functions extracting different projections of the same source span) finds none.
- **SC-006**: Generated artifacts produced by the codegen pipeline before and after 017 lands are byte-equal for any grammar where 017 introduces no override changes — i.e. format-awareness rides on the existing codegen output without reshuffling unrelated emission. (Where overrides do change, the diff is visible in the same commit.)

## Assumptions

- The per-handle render dispatch shipped on 012 (`TreeHandle.read?(id)`, `nativeTreeHandle`, `SITTIR_BACKEND` selection) is the substrate 017 builds on. No further changes to the dispatch layer are required.
- Spec 016 may finish with either a non-empty or empty `formatDeferredKinds` set. If non-empty, 017 absorbs those fixtures into `format-corpus.json`; if empty (the expected 016 outcome), 017 seeds `format-corpus.json` from fresh measurement on this branch while still preserving 016's non-format pass counts.
- The grammar template intent is the same across both render backends (TS Nunjucks and Rust Askama) — the per-rule `.jinja` and Askama templates render identical output for identical NodeData absent `$format`. This is a 016 invariant; 017 inherits it.
- Format extraction is deterministic in the source bytes plus grammar version. If upstream tree-sitter version changes split a node kind or rename a field, the extractor's output for the same source bytes may legitimately change — captured by re-collecting baselines against the new grammar version, not by treating it as a regression.
- Comment-attachment semantics (which node a `# foo` comment "belongs to") are out of scope. 017 stores comments as positional offsets within the enclosing span and leaves attachment to consumers. A future feature may layer attachment on top.
- Pretty-printing / formatter normalisation is out of scope. 017 captures and replays the format the source had; it does not impose, convert, or canonicalise.

## Out of Scope (explicit)

- Pretty-printing, formatter behaviour, style normalisation (e.g. converting tabs to spaces, enforcing a max line length).
- Comment-attachment semantics — comments are positional offsets only; consumers decide leading/trailing/free.
- New grammar features. 017 is a runtime-layer extension plus per-grammar regen, not a grammar change.
- Format conversion across files — 017 captures and replays per node; it does not propagate one file's style to another.
- Per-language style guides (e.g. "rustfmt-compatible output"). The roundtrip preserves whatever format the source had; matching an external formatter's output is not a goal.

## Constitution Compliance Notes

- **II (Fewer Abstractions)**: a single `$format` record per node — no parallel `FormatBuilder` / `FormatResult` / `FormatLog` wrappers. The record's fields are documented in the plan and live in `@sittir/types`.
- **III (Generated vs Hand-Written)**: regen-only path. No hand-edits to `packages/{lang}/src/*`, `packages/{lang}/templates/*.jinja`, or napi crate sources. All accommodation through `packages/codegen/src/*` or `packages/{lang}/overrides.ts`.
- **VI (Deterministic)**: same source bytes plus same grammar version produce the same `$format` record. Verified by repeated extraction against the corpus.
- **IX (`@sittir/core` is the Rust-port surface)**: extractor and TS applier live in `@sittir/core` (runtime-portable). Per-grammar narrowing helpers (if any) live in the generated `utils.ts`, never in core.
- **X (Don't hand-roll types)**: the `$format` type lives in `@sittir/types`. Per-grammar packages and napi crates import it; no local redeclaration.
- **XI (DRY — one source, one derivation)**: format extraction is one walker producing one record shape. Format application is one path per backend. No parallel projections, no `default:` branches that silently drop variants, no string-name references where object references suffice.
