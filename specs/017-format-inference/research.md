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

## Decision 3: Extraction point in `readNode`

**Decision**: Call `extractFormat` once per node, after the `fields`/`children` accumulation loop, before the return statement. Pass `sourceText` as an optional parameter on `readNode`.

**Rationale**: `readNode` already has the tree node, its span, and the accumulated `$fields`/`$children` — everything the extractor needs. Adding extraction after the loop and before the return keeps the single-code-path invariant (FR-007). Making `sourceText` optional preserves backward compatibility — callers without source (e.g. tree-only hydration) pass `undefined` and extraction is skipped.

**Alternatives considered**:
- **Post-processing pass over the returned tree**: requires a second tree walk and a separate entry point — two derivations of the same information. Rejected per DRY.
- **Lazy extraction on first `render()` call**: requires `readNode` to stash the full source text on every node, which is memory-wasteful and couples `render` to the extraction algorithm. Rejected.

---

## Decision 4: Application point in `render`

**Decision**: Check `node.$format` at the top of `render()`, after `prepare()`. If present and `ctx.ignoreFormat !== true`, call `applyFormat(node, format, canonicalResult)` and return early.

**Rationale**: Inserting the check after `prepare()` means the template-canonical string is already computed — `applyFormat` receives it and applies the format deltas. No duplication of the template-resolution logic. The `ignoreFormat` flag on `RenderContext` satisfies FR-010.

**Alternatives considered**:
- **Separate `renderFormatted()` function**: requires callers to pick the right function; removes the opt-out semantic. Rejected — FR-003 says render MUST apply `$format` when present and fall back otherwise. A single `render()` with opt-out is the correct surface.

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

## Decision 6: `readNode` signature change

**Decision**: `readNode(tree, nodeId?, sourceText?)` — add an optional third parameter. Callers that don't need format pass nothing; format extraction is `if (sourceText != null)` gated.

**Rationale**: Backward-compatible; zero changes to existing call sites.

---

## Decision 7: Native backend (P2) deferred

**Decision**: The Rust Askama native backend does not yet exist in the worktree. T-native is included in the plan as a placeholder but is not a blocking gate for the P1 tasks.

**Rationale**: The spec (US3) is P2 and explicitly notes that "TS-mode delivers the user-visible win of US1/US2. But native-mode is a peer backend." No native crate source exists on this branch; implementing the applier there is follow-up work once the `$format` type contract and TS applier are settled.

---

## Decision 8: JSON roundtrip safety

**Decision**: All `FormatRecord` fields use primitives (`string`, `number`, `boolean`) and plain objects/arrays — no `Map`, `Set`, `Date`, or class instances.

**Rationale**: FR-011 requires `stringify` → `parse` roundtrip with no custom reviver. Plain-object shape satisfies this trivially.
