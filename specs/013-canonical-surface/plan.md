# 013 — Simplify produces a canonical flat rule

> Status: draft plan

## Goal

**Simplify normalizes the rule into a canonical flat form.** The Rule
union stays exactly as it is today — no new variants, no new
interfaces. But post-simplify, a rule's TOP-LEVEL STRUCTURE directly
reflects the node's surface:

```
simplified rule top-level (for a branch):
    seq([ field('a', contentA), field('b', contentB), symbol('c'), ... ])

Derivation:
    rule.members.filter(m => m.type === 'field')    // the fields
    rule.members.filter(m => m.type === 'symbol')   // the children
```

No recursion. No merging at derivation time. No position-by-position
heuristics. The simplification pass does all that work once, up front,
and emits a canonical tree where each semantic field lives at exactly
one top-level position with all its value branches already unioned
into its content.

## Non-goals

- Not introducing a new `SimplifiedRule` type. The Rule union stays
  as-is. Simplified rules are Rules — just in a canonical subset of
  shapes.
- Not changing emitters. They continue to read through
  `node.fields` / `node.children`; those getters now become trivial
  walkers over the canonical top-level form.
- Not changing template-walker. It still walks raw rules for
  delimiters.
- Not changing corpus FLOORS. Pure restructure.

## Motivating failure cases

1. **BinaryExpression.operator** typed as `AutoStamp<"&&">` —
   should be literal union of 25 operators.
2. **ForInStatement.kind** typed as `BooleanKeyword<"var">` —
   should be `"var" | "let" | "const"`.
3. **object_type** separator rendered as hardcoded `,` regardless of
   source.

All three share one root cause: derivation walks a non-canonical
tree making position-by-position decisions that silently drop or
collapse information. In the new model the canonical tree simply
doesn't have those ambiguous positions — there's nothing to silently
collapse.

## Canonical form — what simplify produces

For a **branch**-classified rule, post-simplify is:

```
seq([
    field('a', contentA),          // contentA already unions choice-across-branches
    field('b', contentB),
    symbol('c'),                    // unnamed child
    supertype('d'),                 // unnamed child via supertype
    ...
])
```

- Top-level is a `seq` (or a single field/symbol/leaf if there's
  only one member).
- Each semantic field is a single `field(name, content)` at the top
  level. Same-named fields across choice branches are merged; the
  `content` reflects the union of all per-branch shapes.
- Each unnamed child reference is a `symbol` or `supertype` at the
  top level.
- No `choice` at the top level (choices at a field position are
  absorbed into the field's content; choices at a non-field structural
  position are handled by polymorph classification or
  optional-downgrade).
- Anonymous delimiters (punctuation, keywords without a field wrap)
  are absent — already stripped by current simplify.

For a **container**-classified rule (no fields, only children):

```
repeat(symbol('x'))    // or repeat1
// or
seq([symbol('x'), symbol('y')])
```

For a **choice**-at-top (polymorph / enum / supertype) — the choice
remains because it's the rule's actual semantics, not a derivation
artifact. Classification dispatches:

```
polymorph:  choice([variant('a', …), variant('b', …)])
enum:       emitted as EnumRule (already the case today)
supertype:  emitted as SupertypeRule (already the case today)
```

## Current state vs target state

### Current (today)

`simplify` strips anon literals, collapses single-member seqs.
Produces a Rule that may still contain:
- `choice(seq(field('a',x), …), seq(field('a',y), …))` with
  same-named fields across branches
- Nested seqs with fields interleaved with other wrappers
- Optional/repeat wrappers around fields

Derivation (`deriveFields` / `deriveFieldsRaw`) then walks this
possibly-ambiguous tree with per-case merge logic, producing
AssembledField[]. BUG-PRONE because each walker's case-handling
has to get the merge right, and today the `case 'choice'` drops
duplicate-named occurrences.

### Target (post-013)

`simplify` does everything above PLUS:
- If the top-level is a choice whose branches each have the same
  field shape (same set of field names), union per-branch contents
  into a flat `seq([field('a', unionedContent), field('b',
  unionedContent), …])`.
- If the top-level is a choice whose branches have heterogeneous
  field sets (pattern A: ε `update_expression`; pattern B:
  `function_modifiers`), promote to PolymorphRule (already partially
  done) — forms-after-simplify are themselves canonical.
- Contents of each `field()` are themselves simplified: choices
  within the field's content become unions at value-derivation time.
- Anonymous internal structural wrappers (redundant seqs, variants,
  groups) are flattened.

Derivation reduces to:

```ts
function deriveFields(rule: Rule): AssembledField[] {
    const members = rule.type === 'seq' ? rule.members : [rule]
    return members
        .filter(isField)
        .map(f => buildAssembledField(f))
}

function deriveChildren(rule: Rule): AssembledChild[] {
    const members = rule.type === 'seq' ? rule.members : [rule]
    return members
        .filter(m => m.type === 'symbol' || m.type === 'supertype')
        .map(m => buildAssembledChild(m))
}
```

Two short straight-line functions. No recursion, no merging, no
per-case logic.

## Migration phases

### Phase 1: Canonical form + simplify pipeline additions

- Extend `simplify.ts` with a new normalization pass that runs
  AFTER the existing strip-and-collapse:
  - `mergeChoiceBranches`: when a top-level choice has all branches
    sharing the same field-name set, merge into a flat seq where
    each field's content is `choice([per-branch-content])` —
    effectively pushing the ambiguity INTO the field's content.
  - `flattenStructuralWrappers`: strip redundant nested seqs /
    variants / groups so the top-level seq's members are
    syntactically the surface positions.
  - `absorbChoicesIntoFields`: for `seq(field(a, …), choice(X, Y),
    field(b, …))` — handle the choice by either polymorph-promoting
    (distinct field sets) or merging it into adjacent fields'
    content (shared shape).

- Add unit tests for each transformation on minimal rule fragments,
  freezing the canonical output.

- `simplify`'s return type stays `Rule`.

### Phase 2: Rewrite derivation as trivial walk

- `deriveFields(rule)` shrinks to the 4-line form shown above:
  filter top-level seq members, build AssembledField for each
  `field()` node.
- `deriveChildren(rule)` similarly.
- Delete `deriveFieldsRaw`, `walkForChildren`, helper passes that
  existed to handle the un-canonical cases.
- Keep `deriveAliasSources` and `deriveValuesForRule` — those are
  leaf-level helpers called for building individual field/child
  entries.

### Phase 3: Consumer verification

- `AssembledBranch.fields` / `children` getters — unchanged API,
  now call the 4-line derivation.
- All emitter tests pass without modification.
- Corpus FLOORS unchanged or improved (improved on the three
  motivating bugs).

### AssembledNode = pure projection

Post-013, the AssembledBranch / AssembledContainer / AssembledGroup
layer becomes a THIN PROJECTION of the canonical simplified rule
into the shape emitters want to consume. No merge logic, no
traversal, no per-case decisions — those all happen inside
`simplify()` before AssembledNode ever sees the rule.

```ts
class AssembledBranch {
    readonly simplifiedRule: Rule   // already canonicalized
    // ... factory naming / irKey / etc.

    get fields(): AssembledField[] {
        return projectFields(this.simplifiedRule)
    }
    get children(): AssembledChild[] {
        return projectChildren(this.simplifiedRule)
    }
}

function projectFields(simplified: Rule): AssembledField[] {
    const members = simplified.type === 'seq' ? simplified.members : [simplified]
    return members.filter(isField).map(buildAssembledField)
}
```

No private caches (`#fields`). No lazy re-derivation. Semantic
correctness is guaranteed by simplify's canonicalization, not by
getter logic. AssembledBranch's whole purpose reduces to "pair the
canonical rule with the kind-metadata (factoryName, irKey, hidden,
etc.) that emitters need."

### Phase 4 (optional, follow-up): Separator / literal-enum metadata

- SimplifiedRule branch could carry a `separators` annotation on
  the seq/repeat structure.
- Or the canonical form could preserve literal enums at positions
  that need them (object_type separator case).
- Independent from Phases 1-3.

## Risks

1. **Completeness of canonicalization.** The three transformations
   (merge choice branches, flatten wrappers, absorb choices) must
   handle every grammar shape we've seen. Regressions are caught
   by: (a) per-grammar regen output diff, (b) corpus FLOORS, (c)
   505 unit tests.

2. **Choice absorption subtlety.** `choice(seq(a, x), seq(a, y),
   seq(a, z))` where `a` appears in all branches AND the inner
   content differs — merges into `seq(a, seq_over_choice_of_x_y_z)`
   or directly `seq(a, choice(x, y, z))`. Both are equivalent at
   the value-derivation level. Pick one and document.

3. **Polymorph interaction.** If a rule is already classified as
   polymorph pre-013, simplify's new passes shouldn't re-merge its
   forms. Forms retain their distinct shapes.

4. **Override fields + choice content.** The current
   `rule.source === 'override' && rule.content.type === 'choice'`
   special case — when a user's `field('wildcard', choice(inner_a,
   inner_b, inner_c))` override wraps a choice with inner fields —
   simplify needs to preserve access to the inner fields (they
   promote to parent). Must not be lost in canonicalization.

5. **Template walker untouched.** Template walker reads raw rule.
   Simplified rule is only for derivation. Confirm no cross-coupling
   emerges.

## Scope estimate

- Phase 1: ~250 LOC (three new transformations + tests).
- Phase 2: ~-400 LOC (deleting walker recursion + per-case merges).
- Phase 3: ~50 LOC (getter simplification + assemble tweaks).
- Phase 4: ~100 LOC if pursued.

Net: ~-100 LOC with cleaner architecture and three latent bugs
fixed.

## Backout plan

Phase 1 is additive (new passes, old derivation path still works).
Phase 2 is the irrevocable point — once old walkers are deleted,
the new canonical form is load-bearing. Commit each phase
separately so Phase 2 can be reverted independently.

## Open questions

- **Should the first transformation (`mergeChoiceBranches`)
  recurse into inner seqs that also contain choice?** Yes —
  canonicalization is recursive. Apply bottom-up.
- **What if a field's content is itself a canonical-form tree?**
  That's recursive canonical form; field content gets simplified
  by the same pipeline.
- **Separator metadata location?** For Phase 4. Probably a
  sidecar Map<fieldName, separatorSpec> that the assemble layer
  attaches to the AssembledBranch — or a rule-level annotation.
  Decide when we get there.

## Delivered

### Phase 1 — Canonical form + simplify pipeline additions

- `mergeChoiceBranches` + `hoistSharedFieldAcrossChoiceBranches`
  folded into `simplifyRule` (commits before this session).
- Cross-branch field hoist added (session commit `459e4953`).
- `classifyTopLevelShape` in node-map.ts — recursive walker that
  flags every non-canonical choice reaching derivation. Audit env
  var `SITTIR_AUDIT_DERIVE` controls report vs strict vs off.

### Phase 2 — Walker shrink + strict-audit default

Pipeline infrastructure:
- **Infra (A)** — `wire.ts` composes polymorphs onto hidden-rule
  parents (commit `be602c05`). `buildPolymorphParentFn` reads
  `context.deposits` for hidden-name parents; inject skips keys
  compose filled; `injectSyntheticRules` (evaluate.ts) skips keys
  the rule fn already wrote. Added `polymorphVisibleName` /
  `polymorphHiddenName` helpers that strip leading `_` from
  hidden parents so nested variants don't inherit the hidden-ness
  of their parent.
- **Infra (B)** — `applyPath` descends through `alias` (commit
  `c5d121c2`). Symmetric to the existing field / optional / repeat
  descent; unblocks polymorph adoption on rules whose path crosses
  an alias boundary (python `dict_pattern`).

Grammar-author adoption drained the audit:
- Rust `_visibility_modifier_pub: {'1/0/1/3':'in_path'}` —
  nested split unlocked by (A).
- Python `_match_block: {0:'block'}` — base-grammar hidden rule
  as polymorph parent.
- Python `dict_pattern: {'1/0/0/0':'kv'}` — unlocked by (B).
- Typescript `_export_statement_default` — three-level cascade
  (outer split → from_arm inner → decl_arm default_kw inner).
- Typescript `class_body: {'1/0/0':'method','1/0/1':'method_sig','1/0/3':'member'}`.
- Typescript `_for_header: {'1/0':'lhs','1/1':'var_kind','1/2':'let_const_kind'}`.
- Typescript `public_field_definition: {'1/0/0':'declare_first','1/0/1':'access_first','2/0':'static_mods','2/1':'abstract_first','2/2':'readonly_first','2/3':'accessor_opt'}`
  — resolved via tree-sitter's `inline:` config (commit `df8a8fa3`)
  rather than GLR conflicts. Each variant body is folded into the
  parent's LR state machine at the alias site; the alias survives
  inlining so sittir's canonical shape classification still holds.

Walker shrink (commit `aba04edf` + follow-up):
- **`DERIVE_AUDIT_MODE` default flipped to `'strict'`.** Env var
  opt-outs: `SITTIR_AUDIT_DERIVE=1` → `'report'`;
  `SITTIR_AUDIT_DERIVE=off` → `'off'`. `real-grammar.test.ts` uses
  `beforeAll` to switch to report mode since it consumes raw base
  grammars. The `deriveAuditMode()` accessor reads env dynamically
  so test-level overrides take effect.
- **`deriveFields` collapsed** from merge-loop to a single
  `deriveFieldsRaw(rule, 'single')` call — canonical input never
  produces duplicate field names, so the map-and-merge step is
  dead.
- **`deriveFieldsRaw` `case 'choice'` shrunk** to `return []`.
  Canonical choices are union-shaped (token-like / symbol-like);
  they contribute children, not fields — fields ride on concrete
  node kinds each arm resolves to.
- **`deriveFieldsRaw` override-wrapper-choice branch deleted**.
  With audit strict, these choices are canonical and the inner
  descent + `toOptionalMultiplicity` downgrade is dead.
- **`walkForChildren` `case 'choice'` shrunk** to a flat loop
  over arms (same multiplicity, no per-branch+downgrade merge).
- **`toOptionalMultiplicity` deleted** — no remaining callers.

Corpus floors: 6 failures (1 less than pre-session baseline of 7 —
typescript factory round-trip test now passes). Audit clean across
rust, python, typescript.

### Status — 013 closed as of 2026-04-24

Phases 1-3 delivered. AssembledBranch / AssembledContainer are
thin projections over the canonical rule (both-derivation loops
collapsed to filter-and-project). Audit is strict-default and
clean across all three grammars.

Enrich's kind-to-name pass still runs on top-level seqs only.
Extending it to recurse into nested seq positions (to cover
category 2 — the 11 `repeat(seq(...))` kinds reaching
derivation) was investigated in a 2026-04-24 session and
**deferred as follow-up work**. The session surfaced three
architectural blockers:

1. **DSL-runtime divergence.** Sittir's `seq()` / `optional()` /
   `field()` helpers do structural collapses (`liftCommaSep`,
   `absorbTrailingSeparator`, `collapseOptionalRepeatInField`,
   `hoistFieldOutOfSingleContentWrapper`) at evaluation time.
   Tree-sitter's DSL does none of these. Enrich runs in BOTH
   contexts with different input shapes — any pattern-matching
   enrich transform diverges between runtimes.
2. **Polymorphic-content repeats.** Tree-sitter merges
   node-types across all contexts a rule appears in (e.g.
   python `tuple_pattern`'s content spans both `pattern` and
   `case_pattern` across match-vs-fndef contexts). Wrapping
   inside `repeat1(sym(X), sep=',')` creates a field for X-typed
   entries but leaves other context types in loose children,
   splitting rendered content.
3. **Choice-arm polymorphs.** Rules like rust `_let_chain` have
   structurally different arms per-context; any per-arm enrich
   wrap breaks the uniform-shape invariant that the merge /
   polymorph classifier requires.

Paths forward documented in `next-session-prompt.md`. The two
cleanest options require either a dedicated post-evaluate
normalize pass (unwinding sittir's DSL-level collapses) or a
template-walker extension that handles field-wrapped-repeat
content identically to bare-symbol-repeat content — both
sizeable refactors beyond 013's scope.
