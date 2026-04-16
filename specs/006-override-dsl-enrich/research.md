# Research — Override DSL with enrich(base)

**Feature**: 006-override-dsl-enrich
**Phase**: 0

This document resolves the `NEEDS CLARIFICATION` items identified in `plan.md` Phase 0. Each entry: **Decision / Rationale / Alternatives considered**.

---

## R-001 — enrich() passes and relationship to Link

**Revised after recon of `link.ts`**. Initial assumption (that all three enrich passes corresponded to existing Link passes) was wrong. Link operates on sittir's post-Evaluate internal grammar model; enrich operates on tree-sitter grammar shapes (pre-Evaluate). They are different abstraction levels.

**Decision**: `enrich(base)` implements three mechanical passes on tree-sitter grammar rule shapes. One of them subsumes an existing Link pass; two are new work with no Link equivalent.

1. **Keyword-prefix field promotion** — NEW. When a rule begins with a literal string token (e.g., `seq('async', ...)`), wraps the literal as `field(kw, kw)`. No pre-existing Link implementation.
2. **Unambiguous kind-to-name field wrapping** — NEW. When a rule references a single kind (e.g., `seq('(', $.expression, ')')`) with no field-name collision, wraps `$.expression` as `field('expression', $.expression)`. Similar intent to Link's `inferFieldNames`, but `inferFieldNames` is **heuristic** (5-reference + 80% agreement threshold) — it does not belong in mechanical enrich. Our pre-Evaluate pass is strictly local and collision-aware.
3. **`seq(X, repeat(X))` → `repeat1(X)` normalization** — NEW. No pre-existing Link implementation.

**Link migration (FR-020a)**: `promoteOptionalKeywordFields` at `packages/codegen/src/compiler/link.ts:1328` is the one Link pass with a mechanical pattern detectable at the tree-sitter grammar level. It wraps `optional(keywordString)` as `optional(field(kw, keywordString, source: 'inferred'))`, skipping on name collision. We will:
- Re-implement the same detection at the tree-sitter grammar level inside `enrich()` (effectively a variant of pass #1 that handles the `optional(...)` wrapper case).
- Remove the pass from Link once the fidelity ceilings confirm no regression.

**Explicitly staying in Link (FR-020b)**:
- `resolveRule`, `classifyHiddenRule`, `tagVariants`, `wrapVariants`, `deduplicateVariants`, `nameVariant`, `hoistIndentIntoRepeat`, `annotateBlockBearerFields`, `detectClause` — post-Evaluate transformations operating on sittir's internal grammar model. Cannot run at the tree-sitter grammar level.
- `inferFieldNames` — heuristic (thresholds), violates mechanical-only principle.
- `promotePolymorph` — heuristic (field-set heterogeneity check).
- `collectRepeatedShapes` — suggestion-only, drives `suggested-overrides.ts`.

**Alternatives considered**:
- **Port more Link passes into enrich**: impossible — they operate on different abstraction levels. Would require re-running Evaluate or duplicating its logic inside enrich.
- **Skip Link migration entirely and leave `promoteOptionalKeywordFields` in place**: acceptable fallback, but then enrich would fail to subsume a pattern that's clearly detectable at its level.
- **Port `inferFieldNames` into enrich**: violates mechanical-only principle (ADR-0002) — it uses frequency thresholds.

---

## R-002 — tree-sitter CLI invocation contract

**Decision**: CI runs `tree-sitter generate` from each grammar package directory (`packages/<lang>/`). Per-package `tree-sitter.json` points `grammars[0].path` at `./.sittir` so the CLI finds the transpiled `grammar.js`. Success is exit code 0; any non-zero exit fails CI with the CLI's stderr attached.

**Rationale**: The per-package `tree-sitter.json` convention is how tree-sitter itself locates grammars in monorepos, so we're using the tool's own contract rather than inventing one. `.sittir/` as the target directory keeps the transpiled output namespaced away from hand-written sources.

**Alternatives considered**:
- **Single root-level `tree-sitter.json`**: would require cross-package paths and complicates monorepo migration.
- **Invoke `tree-sitter generate` inside sittir's codegen**: couples sittir to the tree-sitter CLI at runtime; CI-only keeps it as a validation gate rather than a dependency.

**Open sub-question (non-blocking)**: the tree-sitter CLI version to pin in CI. Deferred to Phase 2 task creation.

---

## R-003 — TS→JS transpile strategy

**Decision**: Use `esbuild` in CJS-output mode, configured to:
- Target `node18` (matches existing sittir CI baseline)
- Output format `cjs` (tree-sitter CLI uses `require()` on the grammar file)
- Preserve `@ts-nocheck` comments (needed because the base grammar `.js` import is untyped)
- Bundle the import from `@sittir/codegen/dsl` inline so the resulting `grammar.js` has no external runtime dependencies

**Rationale**: `esbuild` is already a transitive dev dependency via Vitest; it's the fastest of the three candidates (`tsc`, `swc`, `esbuild`) and has the simplest config for this use case. Bundling the DSL import inline avoids shipping `@sittir/codegen` as a runtime dependency of the transpiled output, which would pollute `packages/<lang>/node_modules` for no benefit.

**Alternatives considered**:
- **`tsc`**: slower, generates multi-file output, would need path rewriting for the `@sittir/codegen/dsl` import.
- **`swc`**: comparable speed but introduces a new dependency.
- **Write a custom transformer**: overkill and duplicates `esbuild`'s import resolution.

**Constraint validation**: `esbuild --format=cjs --bundle --platform=node --external:tree-sitter-<lang>` keeps the base grammar package external (tree-sitter's own loader resolves it at generate-time).

---

## R-004 — Accumulator save/restore pattern

**Decision**: Role accumulator lives on a module-local `let current: string[] | null = null` in `dsl/role.ts`. `grammar(base, config)` wraps its execution in a try/finally that saves the previous `current`, sets a new empty array, runs the config evaluation, captures the accumulated roles onto the resulting grammar object as a `sittirRoles` field (sidecar, tree-sitter ignores it), and restores the previous `current` in the `finally` block.

**Module caching is not a concern**: sittir evaluates `overrides.ts` fresh each codegen run via the transpiled `.sittir/grammar.js` — which esbuild rebuilds from source. Even if Node's module cache held the compiled module across runs, the `grammar(...)` call's save/restore pattern clears state at entry regardless of what was left behind.

**Rationale**: Save/restore is the standard pattern for nestable dynamic scope in JavaScript (see React's hook dispatcher, Zone.js, etc.). Per-grammar scoping is the only correctness requirement from FR-012 and save/restore satisfies it without introducing a context object that every DSL call would need to thread.

**Alternatives considered**:
- **Explicit context parameter**: every `role()` call would take a context, making inline usage inside `externals` arrays ugly (would need a closure wrapper).
- **`AsyncLocalStorage`**: overkill for synchronous grammar evaluation and adds a Node-specific API to a zero-dep package.
- **Global without save/restore**: fails FR-012 (nested grammar calls would leak).

---

## R-005 — Path addressing syntax for transforms

**Decision**: Path strings use forward-slash delimiter with numeric indices and `*` wildcard. Examples:

- `'0'` — first position of the top-level rule (flat index, backwards-compatible with existing transform API)
- `'0/0'` — first position of the nested structure at position 0
- `'0/*/1'` — position 1 of every branch at level 1 under position 0
- `'*'` alone — every top-level position

Rules:
- No leading slash (`/0` is invalid — ambiguous with "root").
- No trailing slash.
- `*` matches a single level only, not recursive (no `**`).
- Out-of-bounds paths are hard errors with a message naming the path and the actual shape at the failure point.

**Rationale**: Forward-slash matches file-path intuition, which every developer has. `*` is the standard wildcard. Single-level-only keeps the matcher simple and predictable; `**` would invite questions about traversal order that don't have clean answers.

**Alternatives considered**:
- **Dot delimiter (`0.0.0`)**: collides visually with decimal numbers in rule definitions.
- **Array form (`[0, 0, 0]`)**: verbose in practice, no wildcard story.
- **Recursive `**`**: invites ordering ambiguity. Deferred unless a real use case demands it (P-007).

---

## R-006 — Extension-point dedupe identity

**Decision**: Dedupe uses **reference equality** on the entries being merged. Tree-sitter rule objects (from `$.foo`) are stable proxies within a single grammar evaluation, so reference equality catches "the same entry listed twice." Different `$` proxies would produce different references even for the same symbol — but that's not a realistic case because there's only one `$` per grammar.

**Rationale**: Reference equality is the simplest rule that works for the 99% case, and it avoids the rabbit hole of structural comparison on rule objects (which can contain nested sequences, choices, aliases with their own fields). When a real collision case emerges — e.g., the same external token listed by two different overrides contributing to the same grammar — we revisit.

**Worked example**: `externals: [...base.externals, $.new_token, $.new_token]` → dedupes to `[...base.externals, $.new_token]` because `$.new_token` returns the same proxy both times. `externals: [...base.externals, /regex-a/, /regex-a/]` → **not** deduped because each regex literal is a distinct object.

**Alternatives considered**:
- **Structural comparison**: requires recursive equality over the entire tree-sitter rule tree, including nested sequences. Expensive and underspecified.
- **No dedupe (option C from clarify)**: simpler but pushes errors to `tree-sitter generate` where the message is cryptic ("duplicate external token") rather than actionable.
- **Symbol-name comparison for `$.foo` entries only**: special-cases one entry type. Reference equality is uniform across all entry types.

---

## Summary

All six research questions resolved. No remaining `NEEDS CLARIFICATION` markers. Proceeding to Phase 1.
