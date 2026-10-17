# Hidden-repeat-helper visibility: promoting separator-variable list kinds out of `AssembledMulti`

> **Status:** Design (brainstormed 2026-07-13). Follow-on to `docs/superpowers/specs/2026-07-12-separator-as-slot-design.md` (PR #154, `AssembledSeparatedList` tri-state `SeparatorFlankMode` fix, committed `7a46f0d02` on branch `non-slot-separator-rules`). That work is a prerequisite, not superseded — this design only matters because the tri-state model now makes "genuine separator variability" a real, checkable fact.

## Problem

19 hidden-repeat-helper kinds across rust (11), typescript (3), and python (5) carry genuine separator variability — a nonterminal separator (`choice(',', ';')`) or a per-instance-optional leading/trailing flank — but are classified `'multi'` (`AssembledMulti`) instead of `'separatedList'` (`AssembledSeparatedList`). `AssembledMulti` has zero wrap/render support by design (it exists for kinds tree-sitter inlines away at parse time, with nothing to construct). Concretely: python's `_collection_elements` (backs `list`/`set`/`tuple` literals) is stamped `separator: ",", trailing: "optional"` in the current node-model dump, but that optional trailing comma is completely unreachable — there is no code path that ever captures or renders it correctly per-instance.

## Root cause

`classifyNode` (`compiler/assemble.ts:1571-1597`) checks `isHiddenRepeatHelper` before `isSeparatedListShape`:

```ts
if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
if (isSeparatedListShape(rule)) return 'separatedList';
```

`isHiddenRepeatHelper` (`assemble.ts:1646`) fires whenever a kind is hidden (`_`-prefixed), its body unwraps to a repeat, and it isn't aliased by a parent — with no check for separator variability at all. Underneath that, `isInlineSafe` (`dsl/group-classify.ts:203-252`) has two early returns that are the actual bug:

```ts
if (isRepeatLike(t)) return true;
...
if (seqHasTopLevelRepeat(members)) return true;
```

Both unconditionally mark *any* repeat-shaped body "inline-safe" (i.e., fine to leave hidden), regardless of whether the list has a variable separator. The gate deciding hidden-vs-visible today is purely "is this a list at all" — nothing about the list's own separator behavior.

## Scope: 19 kinds, two tracks, confirmed closed

Verified via a temporary diagnostic in `classifyNode` (logging whenever `isHiddenRepeatHelper` fires AND `isSeparatedListShape` would also fire) plus a full regen of all 3 grammars, then reverted before commit:

**Track A — 16 kinds, sittir's own enrich synthesis.** `dsl/enrich.ts`'s `clauseHoistSynthName` (`enrich.ts:1511-1543`) synthesizes hidden helper names with the literal pattern `` `_${parentKind}_optional${counter.opt}` `` inside `applyClauseHoist` (`enrich.ts:1339-1497`), for an unrelated clause-hoisting purpose (collapsing a nested `optional(seq(...))` position into one unit). All 16 of these kind names match that exact naming scheme:

- rust (11): `_enum_variant_list_optional1`, `_field_declaration_list_optional1`, `_ordered_field_declaration_list_optional1`, `_use_list_optional1`, `_parameters_optional1`, `_use_bounds_optional1`, `_arguments_optional1`, `_field_initializer_list_optional1`, `_tuple_pattern_optional1`, `_slice_pattern_optional1`, `_struct_pattern_optional1`
- typescript (3): `_export_clause_optional1`, `_named_imports_optional1`, `_tuple_type_optional1`
- python (2): `_argument_list_optional1`, `_dictionary_optional1`

**Track B — 3 kinds, grammar-authored.** `_collection_elements`, `_parameters`, `_patterns` (python) do not match the synthesis naming scheme — they are separately-defined, standalone top-level hidden rules in tree-sitter-python's own grammar, referenced via `symbol($._parameters)` etc. from their callers. `applyClauseHoist` only rewrites anonymous nested shapes *within* a rule body; it never touches an already-named rule's own top-level definition, so these were never candidates for Track A's mechanism.

**Confirmed NOT the same as** the prior design doc's explicitly-deferred item ("Enrich-based auto-synthesis for anonymous/inline separator-shaped patterns with no rule of their own") — that's a narrower case (a pattern with no kind at all). All 19 kinds here already have a named kind; the gap is dispatch order and CST visibility, not absence of a rule.

**Confirmed closed set:** enrich already runs before `assemble()`, so every enrich-synthesized helper (Track A) was already present in the rule set the diagnostic scanned. Widening the matching criteria doesn't surface additional candidates beyond these 19 — this is a fully-discovered, closed scope, not an open-ended expansion.

## Mechanism — Track A

Qualify `isInlineSafe`'s two early returns so a repeat-shaped body that *also* has genuine separator variability (the same check `isSeparatedListShape` performs: nonterminal separator, or `leadingMode`/`trailingMode === 'optional'`) does not get the automatic inline-safe pass. Instead of returning `true` unconditionally for any repeat/list shape, the check becomes: repeat-shaped AND no separator variability → inline-safe (unchanged, today's behavior for the vast majority of list kinds); repeat-shaped WITH separator variability → falls through, same as a multi-slot/bare-choice body does today.

Falling through routes the kind into `applyClauseHoist`'s **existing** inline-unsafe branch — `visibleGroupSynthName` (`enrich.ts:1568-1597`) + `makeVisibleGroupAlias` (`enrich.ts:1678-1686`). Read directly, this mechanism is exactly: (1) register the body as a hidden backing rule so tree-sitter has a symbol to reference, (2) `alias(symbolRef, symbol(name))` — sittir's own re-exported `alias(target, name?)` DSL primitive (`specs/006-override-dsl-enrich/contracts/dsl-surface.md:130-138`), applied programmatically. No new synthesis or promotion machinery — this is a widened gate on code that already ships today for the choice/multi-slot case.

**Why this should work for repeat bodies too (reasoned, not yet empirically confirmed — see Pre-flight checks):** the "aliasing distributes across each element" failure mode `isInlineSafe`'s own comment warns about is specific to aliasing a *raw compound expression* (a seq/repeat/choice literal) directly — tree-sitter expands those in place at the call site, so an alias applied there has no single node to attach to. Aliasing a *symbol reference* to a separately-defined rule is different: it's one production slot in the grammar regardless of what the referenced rule's own body contains: the repeat's expansion happens one level down, inside the referenced node's own subtree, not at the aliased call site. This is exactly the technique already used successfully for the choice case today.

## Mechanism — Track B

Hand-authored `alias($._parameters, $.parameters)`-style declarations directly in `packages/python/overrides.ts`, one per kind, using the same `alias(target, name?)` DSL primitive. Not the `groups:`/`applyGroupOverrides` mechanism (`link.ts:3039-3099`) — that lifts a nested position *out of* a parent rule into a new synthesized kind, a different operation from renaming an already-standalone top-level rule. `_collection_elements`/`_parameters`/`_patterns` need only a direct rename/alias, mirroring the pattern already established this session for the `object_type_content_comma`/`_semi` override revert.

## Required pre-flight checks

1. **Per-kind reachability.** Before promoting any of the 19, verify each one actually has a live corpus instance where the variable flank/separator is genuinely exercised — via a temporary diagnostic plus a full 3-grammar regen, following this session's established discipline. `liftCommaSep`'s original Case 3 and `tryFusePair`'s Idiom B both turned out to be entirely dead code once checked this way; some of these 19 may be too, and promoting a dead one is pure API-surface churn for zero behavioral benefit.
2. **Alias-distribution check.** Before committing to Track A's mechanism for all 16 kinds, confirm empirically (a small real regen test on one representative kind) that aliasing a symbol reference to a repeat-shaped hidden rule produces one clean container node in the parsed CST, not array-of-siblings distribution. The reasoning above is sound by inference from how the mechanism already works for the choice case, but has not been directly observed for a repeat body.

## Accepted blast radius

Promoting any of these 19 kinds to visible is a genuine CST structural change, not an internal/type-level refinement:

- Tree-sitter's compiled parser will emit a real intermediate node where none exists in the parse tree today.
- Each promoted kind becomes a new **public type** in generated `types.ts`/`factories.ts`/Rust transport structs — real API surface growth for `@sittir/rust`/`typescript`/`python` consumers.
- Every parent kind referencing a promoted kind changes its own child structure, requiring full `validate:native` round-trip re-verification — not just for the 19 kinds themselves, but for every kind that has one as a child/field.
- Native/WASM parser regeneration is required for all 3 grammars.

This is accepted as necessary, not something to work around — but every implementation task must run the **full** `validate:native` sweep (never a targeted subset) and treat any unexplained regression as stop-and-investigate, matching the standing project discipline for this whole feature area.

## Explicitly out of scope

- Reopening or re-litigating the tri-state `SeparatorFlankMode` fix (`7a46f0d02`) — that is a completed, committed prerequisite.
- The prior design doc's already-deferred "anonymous/inline pattern with no rule of their own" case — categorically different from all 19 kinds here.
- Any kind beyond this closed 19-kind set — confirmed not to expand under wider matching, per the "Scope" section above.
- Genuine per-gap heterogeneous separators (unchanged carve-out from the prior design doc).

## Testing strategy

- `isInlineSafe`: unit tests confirming a repeat-shaped body with genuine separator variability no longer returns `true` (falls through), while a repeat-shaped body without variability is unaffected (still `true`, byte-neutral for the overwhelming majority of existing list kinds).
- `applyClauseHoist` / enrich: unit tests confirming the qualified gate routes a synthetic separator-variable repeat pattern through `visibleGroupSynthName`/`makeVisibleGroupAlias` instead of `clauseHoistSynthName`'s hidden path.
- Per-kind reachability diagnostic results recorded before promotion decisions (Pre-flight check 1) — any kind found dead is documented, not promoted.
- Alias-distribution empirical check (Pre-flight check 2) recorded as a concrete before/after CST inspection on at least one representative Track-A kind.
- End-to-end: for each promoted kind (from whichever subset survives the reachability check), a real round-trip test confirming the optional flank or nonterminal separator now renders correctly per-instance (present vs. absent, or correct literal-arm text), plus a `validate:native` full-sweep confirming no regression on any kind referencing the promoted kind as a child.
