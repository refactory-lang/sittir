# 013 — Canonical surface as simplify output

> Status: draft plan (not yet implemented)

## Goal

After rule simplification, a rule's `.fields` array IS the fields. Its
`.children` array IS the children. No downstream traversal, no walker
extraction, no per-consumer re-derivation. The simplified rule carries
its canonical semantic surface as direct properties.

Eliminates the class of bugs where walker-based derivation made
assumptions it shouldn't have (e.g. dropping same-named fields across
choice branches → `BinaryExpression.operator: AutoStamp<"&&">` silently
collapsing a 25-member enum into a 1-literal constant).

## Non-goals

- Not changing Rule's raw representation (the pre-simplify tree). The
  raw rule is still consumed by the template walker because templates
  need literal delimiters that simplify strips.
- Not changing the emitter interface — `node.fields`, `node.children`
  remain the consumer API. Their implementations change to return
  precomputed surfaces.
- Not changing corpus validator semantics, FLOORS, or any rtPass /
  fromPass numbers. The refactor is a pure restructure.

## Motivating failure cases (from this session)

1. **BinaryExpression.operator** typed as `AutoStamp<"&&">` — wrong.
   Should be literal union of all 25 operators. Caused by
   `deriveFieldsRaw`'s `case 'choice'` dropping duplicate-named field
   occurrences across branches after the first.
2. **ForInStatement.kind** typed as `BooleanKeyword<"var">` — wrong.
   Should be `"var" | "let" | "const"`. Same class of bug.
3. **object_type** separator: `choice(',', ';')` inside `sepBy1`
   renders as hardcoded `,`. Walker picks first literal silently.
   Same class.

All three share the root cause: derivation walks the rule tree making
position-by-position decisions that silently pick, drop, or collapse
when the actual semantics are "union of per-branch possibilities".

## Current architecture (what to replace)

```
simplify(rule) → Rule (same type, delimiters stripped)
assemble() → AssembledBranch/Container/Group wraps (rule, simplifiedRule)
AssembledBranch.fields   → lazy getter calling deriveFields(simplifiedRule)
AssembledBranch.children → lazy getter calling deriveChildren(simplifiedRule)

deriveFields(rule):
    raw = deriveFieldsRaw(rule, 'single')       // recursive walk
    merge raw by name → AssembledField[]

deriveFieldsRaw(rule, outerMult):
    - case 'field'   → build AssembledField from content
    - case 'seq'     → flatMap(members)
    - case 'choice'  → perBranch[].merge-by-name with in-all-branches check
    - case 'optional'/'repeat'/'repeat1' → recurse with adjusted mult
    - case 'clause'  → recurse with optional mult
    - case 'variant'/'group' → pass through
    - default → []

deriveChildren(rule): similar shape via walkForChildren().
```

Two walkers (fields + children), each re-walking the same tree, each
with its own subtle merge logic.

## Proposed architecture

### New type: `AssembledSurface`

```ts
interface AssembledSurface {
    readonly fields: readonly AssembledField[]
    readonly children: readonly AssembledChild[]
    // Separator metadata (today split between joinBy / joinByField /
    // joinByTrailing on various rule positions) migrates here.
    readonly separators?: {
        readonly children?: SeparatorSpec
        readonly byField?: ReadonlyMap<string, SeparatorSpec>
    }
    // Choice-of-literals position metadata — the enum patterns the
    // walker today silently collapses. Populated for any unlabeled
    // `choice(lit, lit, ...)` the walker encounters.
    readonly literalEnums?: ReadonlyMap<string, readonly string[]>  // slot-name → allowed literals
}
```

One shared struct between fields and children. Computed once by a
single walker; cached by the assembled node.

### Single walker: `computeSurface(rule: Rule): AssembledSurface`

One pass. Emits occurrences with presence context:

```ts
interface FieldOccurrence {
    name: string
    content: Rule
    outerMultiplicity: Multiplicity
    // Branch coordinates from the top of the rule to this occurrence.
    // Each frame is (choice-id, branch-idx, total-branches).
    branchPath: readonly ChoiceFrame[]
    source: RuleSource | undefined
}

interface ChildOccurrence {
    targetKindName: string      // or supertype name
    outerMultiplicity: Multiplicity
    branchPath: readonly ChoiceFrame[]
}
```

Flat occurrence list. Merge pass:

```
groupByName(occurrences)
    for each group:
        union values across occurrences
        compute "present in every leaf path from root" → required/optional
        merge projection.kinds, aliasSources
    emit AssembledField[]
```

Single source of truth for merging. No per-case logic.

### Surface storage on assembled nodes

```ts
class AssembledBranch {
    readonly surface: AssembledSurface        // eager — computed during assemble
    get fields() { return this.surface.fields }
    get children() { return this.surface.children }
    // ...
}
```

Computed eagerly during `assemble()`. No lazy getters. Consumers
(emitters, factory builders, etc.) hit a plain property access.

## What changes

### Deleted

- `deriveFields(rule)` public API (or kept as thin forward to
  `computeSurface(rule).fields` during a transition).
- `deriveFieldsRaw(rule, outerMult)` — internal; full delete.
- `deriveChildren(rule)` — delete or forward.
- `walkForChildren(rule, out, mult)` — delete.
- `deriveValuesForRule` — still needed as a helper but folded into
  the new walker's field-case, cleaner scope.

### Modified

- `compiler/simplify.ts` — unchanged semantically (still strips
  non-alphanumeric literals, collapses single-member seqs). Keeps
  current output.
- `compiler/assemble.ts` — calls `computeSurface(simplifiedRule)` at
  construction time; passes the surface to AssembledXxx constructors.
- `compiler/node-map.ts` — AssembledBranch / AssembledContainer /
  AssembledGroup constructors accept `surface: AssembledSurface`.
  Getters read from it. The class definitions shrink.
- `compiler/types.ts` — may need an export for `AssembledSurface`.

### New

- `compiler/surface.ts` — new file. Exports `AssembledSurface` type
  and `computeSurface(rule)` function. Contains the single walker and
  merge logic. ~200 LOC.

### Unchanged

- Template walker (`template-walker.ts`). Still consumes raw Rule for
  delimiter literals. Not part of the refactor.
- `deriveAliasSources` (used by emitters separately) — keep as-is.
- Emitters (factories, types, from, node-model, etc.). They consume
  `node.fields` / `node.children` which still work.
- Tests. Pure behavior preservation — any test asserting current
  derived-field shape passes identically because the bug fix is a
  correctness improvement (more values, not fewer/different).

## Algorithm: `computeSurface`

Single recursive walker. Returns occurrences + tree shape info.
Then a merge pass folds occurrences into final fields/children.

```
computeSurface(rule):
    occurrences = walkOccurrences(rule, {
        outerMultiplicity: 'single',
        branchPath: [],
    })
    fields = mergeFieldOccurrences(occurrences.fields)
    children = mergeChildOccurrences(occurrences.children)
    return { fields, children, separators, literalEnums }

walkOccurrences(rule, ctx):
    switch rule.type:
        case 'field':
            // Don't descend into another field() — fields are opaque slots.
            // Synthetic wrapper check still applies.
            if isSyntheticFieldWrapper(rule.content):
                return walkOccurrences(rule.content, ctx)
            emit FieldOccurrence(rule.name, rule.content, ctx.mult, ctx.branchPath)
            return

        case 'seq':
            for m of rule.members:
                walkOccurrences(m, ctx)

        case 'choice':
            for (branch, idx) of rule.members:
                newCtx = { ...ctx, branchPath: [...ctx.branchPath, { choiceId, idx, total }] }
                walkOccurrences(branch, newCtx)

        case 'optional': ctx.mult = 'optional', recurse
        case 'repeat':   ctx.mult = 'array',    recurse
        case 'repeat1':  ctx.mult = 'nonEmptyArray', recurse
        case 'clause':   ctx.mult = 'optional',  recurse
        case 'variant' | 'group': pass through

        case 'symbol' | 'supertype':
            // Child occurrence (unnamed).
            emit ChildOccurrence(rule.name, ctx.mult, ctx.branchPath)

        // literal string/pattern/enum etc.: check if unlabeled
        // choice-of-literals pattern around this position and register
        // a literal-enum slot.
```

### Merge pass

```
mergeFieldOccurrences(occurrences):
    byName = groupBy(occurrences, o => o.name)
    for each (name, group):
        values = dedupeValues(flatMap(group, o => deriveValuesForRule(o.content, o.outerMultiplicity)))
        // Presence: required iff every leaf-branch-path contains this name.
        required = coveredByAllLeafPaths(group, occurrences)
        if !required:
            values = values.map(v => ({ ...v, multiplicity: toOptional(v.multiplicity) }))
        emit AssembledField with merged values + projection + aliasSources
```

`coveredByAllLeafPaths` check replaces the current `inAll()` per-choice
logic. Computed once over the full occurrence list.

Equivalent to today's behavior for simple cases; correctly handles
nested choices where the current in-case logic has no information.

## Migration phases

### Phase 1: Introduce surface (no consumer changes)

- Add `compiler/surface.ts` with `AssembledSurface` + `computeSurface`.
- No test changes; no downstream changes.
- Unit tests for `computeSurface` exercising:
  - simple seq with fields
  - choice with shared fields (should preserve all branches' values —
    today's bug)
  - choice with distinct fields (should optional-downgrade)
  - nested choice (outer branches each with inner choices)
  - repeat / optional / clause wrappers
  - override-wrapper fields (the source === 'override' + choice case)

### Phase 2: Wire into assemble

- `assemble.ts` calls `computeSurface` at branch/container/group
  construction time.
- AssembledBranch / AssembledContainer / AssembledGroup take
  `surface` in constructor opts.
- `fields` / `children` getters read from `surface` instead of
  calling `deriveFields` / `deriveChildren`.
- Full test suite should pass with identical output except for the
  bug fixes (auto-stamp regressions, separator pattern fixes).

### Phase 3: Delete dead code

- Remove `deriveFieldsRaw`, `deriveFields` (or leave as one-line
  forward for backwards-compat if external tests use them).
- Remove `walkForChildren`, `deriveChildren` (same).
- Clean up helper functions that only serve the deleted walkers.

### Phase 4 (optional): Separator and literal-enum unification

- Fold separator-discovery logic (`findRepeatSeparator`,
  `findRepeatFlag`) into the same walker — emit separators on the
  surface.
- Detect and emit `literalEnums` for unlabeled `choice(lit, lit)`
  positions; emitter uses these to type the slot correctly in
  factories / Config types.
- Closes the object_type separator-preservation gap.

## Risks

1. **Presence computation correctness.** The current `inAll()` logic
   works case-by-case; a global `coveredByAllLeafPaths` must agree on
   all existing cases. Mitigate with thorough unit tests from current
   grammars before/after.

2. **Child-node ordering.** `deriveChildren` today emits children in
   source-walk order. The merge pass needs to preserve this to avoid
   shuffling `$children` slots in emitter output. Use occurrence-emit
   order as the merge key.

3. **Alias / projection merge.** `deriveFields`'s outer merge
   currently folds `projection.kinds` and `aliasSources`. The new
   merge must replicate that. Not hard but easy to forget.

4. **Template walker untouched.** Confirm it doesn't call
   `deriveFields` anywhere (grep says no, but verify).

## Scope estimate

- Phase 1: ~250 LOC new (surface.ts + tests).
- Phase 2: ~100 LOC modifications across node-map.ts + assemble.ts.
- Phase 3: ~-300 LOC net (deleting old code).
- Phase 4: ~100 LOC if we also do separators + literal enums.

Net: roughly flat LOC with cleaner architecture and bug fixes.

## Backout plan

Phase 1 is purely additive. If issues arise, don't wire into assemble
and the new code is dead until reverted. Phase 2 is the breaking
point — commit the wiring separately so a revert is clean.

Phase 3 only lands after Phase 2 is stable, making the deletion
safe.
