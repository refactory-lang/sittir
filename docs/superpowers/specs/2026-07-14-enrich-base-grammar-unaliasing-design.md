# Enrich Base-Grammar Un-aliasing — Design

> **Superseded during implementation.** The mechanism below describes the ORIGINAL design — drop-only, with a `canonicalRuleSignature`-serialization equality check. What actually shipped, in `packages/codegen/src/dsl/enrich.ts`'s `applyUnaliasDistinct`, branches instead: a colliding alias is DROPPED when its storage kind is visible (as originally designed here), but RETARGETED (rewritten to `alias($.X, $.<X-without-leading-underscore>)`, guarded against name collisions) when its storage kind is itself hidden — a hidden rule produces no independent CST node if merely un-aliased, so dropping would silently destroy its visibility. Structural equality is judged via `clusterSignatures`/`rulesEqual` over raw pre-simplify rule shapes, not the `canonicalRuleSignature` serialization this doc describes. The final accepted baseline also diverges from this doc's original expectation (125/76/107): rust is 123 (not 125 — a deliberately accepted regression, `generic_type_with_turbofish`'s turbofish-adjacency rendering gap, see `docs/KNOWN_ISSUES.md`), typescript is unchanged at 76, and python improved to 108 (from 107) once the `_suite` special-case carve-out was removed. Treat the mechanism description below as historical context, not a description of the shipped behavior — see `applyUnaliasDistinct` and this feature's plan doc's revision notes for the actual, current picture.

**Goal:** Give enrich a new pass that automatically drops a base-grammar `alias(X, Y)` whenever `X` and `Y`'s underlying rule shapes are structurally distinct, so distinct grammar-native storage kinds stop silently collapsing onto one shared parse kind.

**Architecture:** Reuse the existing `parsekind-noninjective` diagnostic's decision function (`diagnoseParseKindCollisions`) with enrich-computed inputs instead of assemble-time inputs, driven by a phase-generalized `rulesEqual`. When it reports a genuine collision, enrich rewrites the grammar to drop the offending alias and still emits the diagnostic (downgraded to informational) as an audit trail of the auto-fix.

**Tech Stack:** TypeScript compiler pipeline (`packages/codegen/src/dsl/enrich.ts`, `packages/codegen/src/compiler/normalize.ts`, `packages/codegen/src/compiler/diagnostics/parsekind-collisions.ts`).

## Global Constraints

- DRY is the #1 rule: reuse `diagnoseParseKindCollisions` and `rulesEqual` rather than reimplementing their decision logic.
- Never hand-edit generated artifacts; this pass lives entirely in codegen source.
- Every codegen-source-touching change must regenerate all 3 grammars and run the full `validate:native` sweep before landing.
- Prefer explicit overrides over inference — but this specific transform is exempt from that stance's usual caution, because its trigger precondition (structural distinctness, per the existing diagnostic's own logic) is exactly the condition under which the automatic fix is provably correct, not a guess. See "Why fully automatic is safe" below.

---

## 1. Problem

`packages/rust/.sittir/grammar-diagnostics.json` and the typescript equivalent currently record 7 live `parsekind-noninjective` diagnostics (rust: 1, typescript: 6) — e.g. rust's `scoped_type_identifier.path` collapses `[generic_type_with_turbofish, generic_type]` onto the parse kind `generic_type`; typescript's `_arrow_function_parameter.parameter` collapses `[_reserved_identifier, identifier]` onto `identifier`. In every one of these 7 cases the collapsing alias comes from the **base tree-sitter grammar itself** (tree-sitter-rust / tree-sitter-typescript upstream), not from anything in `overrides.ts`.

This diagnostic currently fires at assemble/collect-slots time (`resolveParseKindCollisionsInSlot`, `compiler/model/node-map.ts:1056`), operating on already-assembled `AssembledNonterminal`/`NodeOrTerminal` slot values. By that point in the pipeline the fix the diagnostic's own `proposal` text suggests — "give each colliding arm a distinct alias" — can only be applied via a hand-authored `overrides.ts` change per instance. That's a real fix, but it's per-instance manual burn-down work with no automation, and PR-L (the compiler-simplification master plan's final PR) wants this diagnostic flippable to blocking severity — which isn't safe to do while 7 real instances remain unresolved.

## 2. Why the existing diagnostic can't just be called from enrich

Enrich (`dsl/enrich.ts`) runs on raw, near-grammar `Rule` objects (`SEQ`/`CHOICE`/`SYMBOL`/`ALIAS`/etc. primitives, phase-tagged `Rule<'evaluate'>` or earlier) — a much more primitive tree shape than what the existing diagnostic's call site consumes. `resolveParseKindCollisionsInSlot` depends on `AssembledNonterminal.values`, `value.parseKind`, and `structuralSignatureOfValue` (`node-map.ts:1081`) — all concepts that only exist after assemble has run, several phases downstream of enrich. Enrich cannot reach or reuse that specific call site's inputs.

However, the actual **decision function**, `diagnoseParseKindCollisions` (`compiler/diagnostics/parsekind-collisions.ts:35`), is phase-agnostic and generic (`<T>`): it takes a list of `{parseKind, storageKind, structuralSignature, original: T}` values, buckets by `parseKind`, and for each bucket with more than one distinct `storageKind`, checks whether all `structuralSignature`s match. If they do, it silently merges (matching today's "structurally-identical collisions merge with no diagnostic" behavior). If they don't, it returns a `parsekind-noninjective` diagnostic. Nothing about this function is tied to assemble-phase data — it just needs a caller-supplied signature per value.

## 3. The structural-equality primitive: generalize `rulesEqual`

`rulesEqual` (`compiler/normalize.ts:1138`) already implements exactly the "are these two rule bodies structurally the same shape" comparison needed — recursively matching `SEQ`/`CHOICE`/`SYMBOL`/`STRING`/`PATTERN`/`OPTIONAL`/`REPEAT`/`FIELD`/`VARIANT`/`SUPERTYPE` by their actual shape (not just reference identity). It's currently typed `(a: Rule<'link'>, b: Rule<'link'>): boolean`, but every field it touches (`type`, `members`, `content`, `name`, `value`) exists identically across every phase's `Rule<Phase>` variant per the codebase's phase-tagged `Rule<Phase>` discriminated-union pattern (`types/rule.ts`).

**Task**: generalize `rulesEqual`'s signature to `<P extends Phase>(a: Rule<P>, b: Rule<P>): boolean` (or introduce a thin evaluate-phase-typed wrapper delegating to the same body) so it's callable on the `Rule<'evaluate'>` shapes enrich actually holds, without duplicating the comparison logic. This is the one piece of genuine new plumbing this design needs; everything else is reuse.

## 4. The new enrich pass

A new function in `dsl/enrich.ts`, wired into `applyEnrichPasses` alongside the existing clause-hoist/auto-group passes:

1. Walk the raw grammar rule tree looking for `alias($.X, $.Y)` sites (the pattern is: a rule position wraps a symbol reference to `X` in tree-sitter's `alias()` DSL primitive, renaming it to present as `Y` in the parsed tree).
2. For each parse-kind name (`Y`) that has 2+ distinct storage-kind candidates aliasing onto it at any position, look up each candidate's own rule body and build the `{parseKind, storageKind, structuralSignature, original}` inputs `diagnoseParseKindCollisions` expects. Compute `structuralSignature` as a canonical-JSON serialization of each candidate's rule body (deterministic key ordering, so two calls to `JSON.stringify` on structurally-equal rules produce identical strings and `diagnoseParseKindCollisions`'s `distinct()` bucketing groups them correctly) — do not reuse the assembled-phase `structuralSignatureOfValue`'s catalog-kind-based scheme, which depends on concepts (resolved catalog kinds) that don't exist yet at enrich time. The generalized `rulesEqual` (§3) is used to unit-test that this serialization's equality matches true structural equality, not called directly in the pass itself.
3. Call `diagnoseParseKindCollisions` (unmodified) with these inputs.
4. For every returned diagnostic (a genuine structural collision): rewrite the grammar rule to drop the alias — `alias($.X, $.Y)` → `$.X` — so `X` surfaces under its own name. Since enrich injects directly into `base.grammar.rules` (confirmed: enrich runs before tree-sitter's `grammar()`, which seeds from `base.grammar.rules`, and `evaluate` reads the same post-enrich rules — see `feedback_enrich_post_evaluation_only` memory), this rewrite reaches **both** the compiled parser (parser.wasm/native, via `tree-sitter generate`) **and** sittir's own IR pipeline (`evaluate` onward) from one injection point.
5. Still emit the returned diagnostic — but at a downgraded, non-blocking severity (e.g. `info`, code suffixed or flagged as auto-resolved) rather than the original `error`/blocking severity, since enrich has already fixed it. This preserves the audit trail: authors can see in `grammar-diagnostics.json` that sittir made a structural decision on their behalf, without it blocking regen.

## 5. Why fully automatic is safe

`diagnoseParseKindCollisions` only returns a diagnostic when the colliding storage kinds are **structurally distinct** — structurally-identical collisions merge silently with no diagnostic at all (existing, unchanged behavior). Dropping the alias is only ever attempted in the distinct case. There is no scenario where the alias fires this diagnostic AND keeping the alias would have been the correct choice — merging two genuinely different shapes under one name is never sound, regardless of author intent, since it makes read-time dispatch non-injective (the CST literally cannot distinguish which shape was parsed). This is why the transform can run without an opt-in override, unlike most of this project's heuristic-replacement work.

## 6. Relationship to the later (assemble-time) diagnostic

The existing `resolveParseKindCollisionsInSlot` call site (assemble/collect-slots time) stays in place unchanged, as a safety net. Once this enrich pass ships, it should catch every one of today's 7 live instances proactively (all confirmed base-grammar-caused), so the later check's live count should drop to zero across all 3 grammars. Any future firing of the later check would then indicate either a genuine gap in enrich's detection, or a NEW collision introduced by something enrich can't see (e.g. our own `overrides.ts`-authored `alias()`/`variant()` calls, or a collision synthesized later in the pipeline) — a real case with no automatic fix available, which should legitimately block. This is what makes flipping the later diagnostic to blocking severity (part of PR-L, a separate dependent spec) low-risk once this pass lands.

## 7. Testing / validation

- Unit tests for the generalized `rulesEqual` (structurally-identical vs. distinct evaluate-phase rule pairs).
- Unit tests for the new enrich pass: a synthetic grammar fixture with a known structurally-distinct alias site, asserting the alias is dropped and the correct downgraded diagnostic is emitted; a second fixture with a structurally-identical alias site, asserting nothing changes and no diagnostic fires.
- Full regen (all 3 grammars) + diff against HEAD: expect exactly the 7 known live-instance kinds (rust `scoped_type_identifier`; typescript `_arrow_function_parameter`, `_index_signature_colon`, `_jsx_string`, `augmented_assignment_expression`, `string`, `type_predicate`) to change shape (their aliased storage kind now surfaces under its own name), and `grammar-diagnostics.json`'s `parsekind-noninjective` entries for those 7 to disappear (or move to the new downgraded/auto-resolved shape, per whatever final diagnostic-code decision the implementer makes — TBD at plan time, not a design-time decision).
- Full `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` sweep — current baseline rust=125/typescript=76/python=107 (`readRenderParseAstMatchPass`). Treat any unexplained shift as stop-and-investigate: this changes real CST shape (new distinct kinds appear where two things used to collapse onto one), so some baseline movement in the touched kinds is *expected*, not automatically a regression — but it must be individually confirmed correct via `probe-kind` round-trip checks on each of the 7 affected kinds, not waved through.
- `cargo check --workspace --features napi-bindings` clean.

## 8. Out of scope

- The `mergeByName`/`mergeChoiceArms` removal (originally PR-L's "item 3") is explicitly deferred — to be recorded in `docs/KNOWN_ISSUES.md`, not implemented as part of this work.
- Renaming `parsekind-noninjective` to a different diagnostic code, or unifying it with `content-collision`'s severity-flip mechanics — that's PR-L's own concern (a separate, dependent spec), not this one.
- Any override-authored (`overrides.ts`) alias collisions — this pass only touches base-grammar-native aliases. An override-authored collision still needs a manual fix and should still surface via the (now-blocking, per PR-L) later diagnostic.
