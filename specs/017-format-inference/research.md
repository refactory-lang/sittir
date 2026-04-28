# Research: Format Inference (017)

All NEEDS CLARIFICATION items are resolved. No open unknowns.

---

## Decision 1: `$format` is residual delta, not a source-text copy

**Decision**: Store only the bytes that the template-canonical render would lose — not the full source span.

**Rationale**: Storing the full source span as an opaque string would (a) violate FR-001 ("MUST NOT duplicate the full rendered source as a second opaque string"), (b) require a custom merge strategy for edit rebasing (FR-004), and (c) make it impossible to apply format selectively (FR-003 fallback requires knowing which parts are "format" vs "canonical"). A structured residual record is the only design that satisfies all three.

**Alternatives considered**:
- **Opaque string**: `$format: string` — full source span verbatim. Rejected: violates FR-001; makes edit rebasing O(source-text) instead of O(changed-fields).
- **Per-backend format flags**: e.g. `$trailingComma: boolean`. Rejected: proliferates parallel facts; violates FR-007 (one extractor) and DRY principle.

---

## Decision 2: Extraction algorithm — canonical-render diff

**Decision**: `extractFormat(node, sourceText, canonicalRender)` computes the canonical render for the node (using the existing bound renderer), then diffs the source span against that canonical string to produce the `FormatRecord` subfields.

**Rationale**: The grammar template already defines canonical form. The delta between source and canonical is exactly what `$format` must capture. This avoids inventing a second model of "what the grammar intends". It also ensures the applier (`applyFormat`) can reconstruct source bytes by re-applying the same delta to a fresh canonical render.

**Alternatives considered**:
- **Heuristic per-category scanners** (e.g. "scan for trailing comma before `]`"): rejected — multiple partial walkers violating DRY (FR-007 / Principle XI).
- **Parser-level annotation** (teaching tree-sitter to emit format nodes): out of scope; requires grammar-level changes to three upstream grammars.

---

## Decision 3: Extraction point — Rust-only, NOT in JS `readNode`

**Decision (revised 2026-04-27)**: `extractFormat` lives exclusively in the native Rust tier (`rust/sittir-core/src/format.rs`). The JS `readNode` in `@sittir/core` is **unchanged** — it never receives a `sourceText` parameter and never emits `$format`.

**Rationale**: Format inference is a byte-level analysis pass over source text. This naturally belongs in Rust: it's performance-sensitive, it operates on raw bytes, and keeping it native avoids a complex sourceText-threading API on the JS side that would change the contract for every existing JS `readNode` caller. The JS tier remains a fast structural reader; the native tier is the format-aware parser.

**Corollary**: The only way to get a `NodeData` with `$format` populated is to use the native reader. JS callers that want format-preserving roundtrip must go through the native path. JS callers that don't need format are unaffected — zero API change.

---

## Decision 4: Application point — `RenderContext.format`, not per-node lookup

**Decision**: Both the JS render (`@sittir/core`) and the native Rust render consume a single `FormatRecord` via `ctx.format?: FormatRecord`. The render path checks `ctx.format ?? node.$format` — tree-level record first, per-node inline override second, then template-canonical. This satisfies FR-003 and FR-005.

**Rationale**: A single record per render context is simpler than a per-node map lookup on every node. Format style is a file-level property (indent width, trailing-comma policy, quote style) — not something that varies node-by-node within a well-formatted file.

---

## Decision 5: `FormatRecord` subfield structure

**Decision**: Four named subfields — `boundary`, `slots`, `literals`, `trivia` — each optional.

**Rationale**: The spec (FR-001) names exactly these four. Each captures a distinct source-format dimension with no overlap:
- `boundary`: leading/trailing bytes around the node's canonical body (indentation, blank lines between top-level items).
- `slots`: per-field/per-child-position separator and optional-token choices (trailing comma, optional semicolon, separator style).
- `literals`: spelling overrides for leaf text not guaranteed by `$text` (numeric style, quote character, raw-string prefix).
- `trivia`: comments and blank lines with byte offsets relative to the node span.

No subfield can be inferred from another. No two subfields encode the same fact.

**Alternatives considered**:
- **Flat `Record<string, unknown>`**: untyped; loses the structural contract. Rejected.
- **Parallel arrays** (`offsets: number[]` + `texts: string[]`): DRY violation — two arrays for one trivia item. Rejected.

---

## Decision 4a: One `FormatRecord` per tree, not per node

**Decision**: Format inference produces a single `FormatRecord` for the entire parsed file. The Rust reader sets `treeHandle.format?: FormatRecord`. There is no `Map<NodeId, FormatRecord>` or `$format` on individual nodes from inference.

**Rationale**: Format style is a file-level property — indent policy, separator conventions, quote style. Inferring a consensus record across the file is simpler to implement, simpler to store, and simpler to apply. A per-node map would imply node-local style variations within a single file; well-formatted real-world files don't have that.

**Corollary**: `$format` on `AnyNodeData` is reserved for user-supplied per-node inline overrides only. Inferred format never sets `node.$format`.



**Decision**: `readNode(tree, nodeId?)` — no new parameters. The JS reader never extracts format.

**Rationale**: Extraction is Rust-only (Decision 3). Adding an optional `sourceText` to the JS signature would imply JS extraction is possible or planned. Keeping the JS signature clean avoids future confusion and maintains the invariant: `$format` on a `NodeData` means "this came from the native reader".

---

## Decision 7: Native backend (P2) deferred

**Decision**: The Rust Askama native backend does not yet exist in the worktree. T-native is included in the plan as a placeholder but is not a blocking gate for the P1 tasks.

**Rationale**: The spec (US3) is P2 and explicitly notes that "TS-mode delivers the user-visible win of US1/US2. But native-mode is a peer backend." No native crate source exists on this branch; implementing the applier there is follow-up work once the `$format` type contract and TS applier are settled.

---

## Decision 8: JSON roundtrip safety

**Decision**: All `FormatRecord` fields use primitives (`string`, `number`, `boolean`) and plain objects/arrays — no `Map`, `Set`, `Date`, or class instances.

**Rationale**: FR-011 requires `stringify` → `parse` roundtrip with no custom reviver. Plain-object shape satisfies this trivially.
