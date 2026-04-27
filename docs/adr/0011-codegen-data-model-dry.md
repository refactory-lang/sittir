# ADR 0011 — Codegen data-model refactor: DRY enforcement, class-hierarchy encapsulation, per-value multiplicity

**Status**: Accepted (2026-04-21)
**Date**: 2026-04-21
**Related**: ADR-0010 (auto-stamp + refine) — motivator; this ADR captures the data-model work that ADR-0010's implementation surfaced as necessary.

## Context

ADR-0010's phase-1 implementation (auto-stamp single-literal fields) ran into a
series of structural problems with the codegen pipeline's internal data model.
Each problem was fixable in isolation, but they shared a single root cause:
**the pipeline stored the same facts in multiple places and derived them in
multiple ways**. Independent views drifted, flattenings lost information, and
silent `default:` branches in discriminated-union switches swallowed
information future maintainers would never realize was missing.

Concrete examples encountered during ADR-0010 implementation:

- **`deriveContentTypes` dropped string literals from mixed choices.** A field
  `choice('const', $.mutable_specifier)` reduced to `contentTypes=['mutable_specifier']`
  with the literal silently gone. Meanwhile `deriveLiteralValues` did the
  opposite — kept the literal, dropped the symbol. Two walkers, two subsets,
  downstream code consumed both and trusted them to agree on what the slot
  "really was."

- **`contentTypes: string[]` + `literalValues?: string[]` stored the same
  slot-content fact in two places.** The combined truth about a slot's content
  required merging the two arrays. Every consumer that didn't merge correctly
  produced a wrong answer.

- **String-name references (`contentTypes: string[]`) instead of object refs
  to the referenced AssembledNode.** Every consumer had to re-resolve via
  `kindMap.get(name)?` — a potential drift point per call site.

- **Slot-level `required: boolean` + `multiple: boolean` + `nonEmpty?: boolean`
  flattened information that was per-value.** A field
  `choice(optional($.foo), repeat($.bar))` legitimately has different
  multiplicity per value. The flat flags collapse to one pair (`multiple: true`,
  `required: false`), losing the nuance. Downstream code that needed the
  per-value shape re-derived it from the rule — a second derivation,
  disagreeing with the first.

- **`rule: Rule` on `AssembledNodeBase` was public and wide.** External
  consumers reached into raw rule trees (`factory-map.ts::shapeOf`
  did `(node as { rule?: Rule }).rule` — a cast through `unknown`), duplicating
  classification logic that belonged on the class.

- **Subclass-specific init cloning.** Every AssembledNode subclass constructor
  took `{ kind, typeName, factoryName, irKey, ...subclass-specifics }` — the
  first four derivable from `kind` alone, yet each subclass re-declared the
  param and re-assigned `this.*`. Multiple sources of the same init logic,
  scattered across 10 constructors.

- **`deriveFieldsRaw` / `deriveChildrenRaw` intermediate shapes.** A
  raw-then-dedupe pipeline treats raw and deduplicated as two distinct
  representations of the same data — with the raw form existing solely to be
  deduplicated. Two shapes of identical information, one needing a transform
  pass to become the other.

Each is a variant of one anti-pattern: **the same fact stored (or derived) in
more than one way**. Every individual violation is forgivable; together they
produce a codebase where every nontrivial change requires auditing three
places for consistency.

## Forcing Constraint

> "We should be DRY — we cannot store the same knowledge in two different
> places, or derive that knowledge in more than one way."
> — user, this session

The stricter reading of DRY — not "don't duplicate code" but **"every fact has
exactly one source and exactly one definition of how to extract it"** — is the
foundational correctness principle we want the codegen to satisfy. This ADR
captures it + the concrete refactors that enforce it.

## Alternatives Considered

- **Incremental patches per bug.** Fix `deriveContentTypes` to keep literals;
  fix the string-name-ref drift per call site; fix the flattening for one case.
  Rejected — treats symptoms, leaves the structure that generates them.

- **Keep ADR-0010 scope narrow; ship phase 1 auto-stamp as a per-flag fix
  only.** Rejected once the `mutable_specifier` semantic mismatch surfaced: the
  bug was rooted in the data model, not the classification. Patching one flag
  would leave the framework producing the same kind of hidden wrongness in
  every future field that hits a similar shape.

- **Rewrite the whole codegen in one commit.** Rejected as too large for
  reviewability. Broken into targeted refactors: class-hierarchy unification
  (1a), Rule narrowing (1a-fix), parameterless fixpoint (1.5),
  constructor-based assembly + rule encapsulation (1b), value unification
  (1.6). Each one lands separately, each reviewable in isolation.

- **One ADR covering both the ergonomic changes (ADR-0010) and the data-model
  refactor.** Rejected — they're architecturally distinct concerns. ADR-0010
  changes the author-facing factory surface; this ADR changes the internal
  codegen pipeline. Splitting keeps "why" stories focused.

## Decision

Enforce DRY as the top work convention. Refactor the codegen data model so
every fact has one source and one derivation. Specifically:

### 1. DRY principle promoted to CLAUDE.md's top work convention

Wording verbatim: _"Every fact about the program has exactly one source, and
exactly one definition of how to extract it."_

Both clauses load-bearing:

- **One source** — no parallel storage of the same fact.
- **One derivation** — no second walker producing the same-shaped subset.

Practical rule: every discriminated-union switch ends with `assertNever(x)` —
no silent `default:` branches. Projections live as methods on the class that
owns the data, not as external walkers. Object references (not name strings)
for anything that points at another assembled node.

### 2. `AssembledField extends AssembledChild`

A field is a child slot with extra authoring-surface metadata (paramName,
aliasSources, source, projection). Previously had 6 duplicated members across
the two interfaces. Now: one base interface, one extension.

### 3. `AssembledNodeBase<R extends Rule>` with narrowing per subclass

All 10 subclasses declare their accepted Rule subset:

- `AssembledBranch extends AssembledNodeBase<SeqRule | ChoiceRule>`
- `AssembledContainer extends AssembledNodeBase<SeqRule | ChoiceRule | RepeatRule | Repeat1Rule>`
- `AssembledPolymorph extends AssembledNodeBase<PolymorphRule>`
- `AssembledLeaf extends AssembledNodeBase<PatternRule>`
- `AssembledKeyword extends AssembledNodeBase<StringRule>`
- `AssembledToken extends AssembledNodeBase<TokenRule>`
- `AssembledEnum extends AssembledNodeBase<EnumRule>`
- `AssembledSupertype extends AssembledNodeBase<SupertypeRule>`
- `AssembledMulti extends AssembledNodeBase<RepeatRule | Repeat1Rule>`
- `AssembledGroup extends AssembledNodeBase<GroupRule | SeqRule | ChoiceRule>`

Rule stored (not just declared) on all 10 — truthful at runtime, not just
documentation.

### 4. `protected readonly rule` + render through class methods

`rule` flips from public to **protected**. Enforces the convention
"only renderTemplate + class internals reach into raw rule" at the type level.
External consumers go through class accessors:

- `members`, `content`, `separator`, `trailing`, `leading` — structural access
- `text`, `values`, `subtypes`, `forms`, `pattern`, `elementRule` — content access
- `isTextTemplate(externals)` — classification
- `renderParts(rules, wordMatcher)` — cross-class render collaboration

Consumers that previously did `(node as { rule?: Rule }).rule` are gone. New
use cases that need raw rule access add a new getter, not a cast.

### 5. Constructor-based assembly

`AssembledNodeBase` constructor derives `typeName`, `factoryName`, `irKey`
from `kind` via `nameNode(kind)` — one source (kind), one derivation. Subclass
constructors take `(kind, rule, ...subclass-specifics, opts?)` instead of
bag-of-params `{ kind, typeName, factoryName, irKey, ...everything }`. Each
subclass is self-contained: construction logic lives with the class, not in
`assemble.ts`.

`assemble.ts` shrinks to: `classifyNode(kind, rule)` → `new SubclassCtor(...)`.

### 6. `isParameterless` on base + fixpoint (auto-stamp generalization)

Any kind whose every required slot auto-stamps is itself parameterless. Applies
both to fields AND children (symmetric — post Task 1a both derive from the
same base interface). Computed via fixpoint pass in `assemble.ts` after
construction; converges in typically ≤3 iterations.

`stampExpression` on the base carries the code-gen string (`"'break'"` for a
keyword terminal, `"kwBreak()"` for a parameterless compound). Emitters read it
directly — no per-emitter branching between literal-stamp and factory-call-stamp.

### 7. `NodeOrTerminal` + per-value multiplicity

THE core data-model change. Replaces five fields on `AssembledChild`
(`required`, `multiple`, `nonEmpty`, `contentTypes`, `literalValues`) with
one:

```ts
type Multiplicity = "optional" | "single" | "array" | "nonEmptyArray";

interface NodeRef<T extends AssembledNode = AssembledNode> {
	readonly kind: "node-ref";
	readonly node: T | UnresolvedRef;
	readonly multiplicity: Multiplicity;
}

interface TerminalValue {
	readonly kind: "terminal";
	readonly value: string;
	readonly multiplicity: Multiplicity;
}

interface UnresolvedRef {
	readonly kind: "unresolved-ref";
	readonly name: string;
}

type NodeOrTerminal = NodeRef | TerminalValue;

interface AssembledChild {
	readonly name: string;
	readonly propertyName: string;
	readonly values: readonly NodeOrTerminal[];
}
```

Slot-level bools (`isRequired`, `isMultiple`, `isNonEmpty`) become derived
helpers computed from `values`. One source of truth (values); one derivation
per helper.

Per-value multiplicity correctly represents mixed cases like
`choice(optional($.foo), repeat($.bar))` — two entries, different
multiplicities, both preserved.

Emission mapping:

- `optional` → `T | undefined`
- `single` → `T`
- `array` → `readonly T[]`
- `nonEmptyArray` → `readonly [T, ...T[]]` (NonEmptyArray<T>)

### 8. Delete all partial-projection walkers

`deriveContentTypes`, `deriveLiteralValues`, `deriveFieldsRaw`,
`deriveChildrenRaw` — all deleted. Replaced by one walker `deriveSlots` that
takes a **SimplifiedRule** (the canonical derivation input) and produces
deduplicated `AssembledField[]` / `AssembledChild[]` with `values` populated
directly. No raw-intermediate shape.

Template emission retains its own walker on the **raw Rule** (`renderRuleTemplate`)
because templates need the literals / anonymous tokens that simplification
strips. Two walkers, two genuinely different projections — not redundant.

### 9. Post-assemble `resolveSlotRefs`

Walks every slot's `values`. For each `NodeRef` whose `.node` is an
`UnresolvedRef`, looks up the kind in the nodes map and replaces with the
AssembledNode. Immutable — produces new slot objects; doesn't mutate readonly
arrays in place.

Unresolvable refs (dead kinds like rust's `doc_comment`) stay as
`UnresolvedRef`, surfacing the diagnostic rather than carrying a dangling
string.

## Principles Applied

- **P-005 (Single source of truth)** — every fact has one source. `values`
  replaces five parallel fields. `isParameterless` lives in one place.
  Reference to another AssembledNode is the actual object, not a lookup
  token.
- **P-007 (Cut speculative scope)** — deleted `deriveContentTypes`,
  `deriveLiteralValues`, `deriveFieldsRaw`, `deriveChildrenRaw`, and the slot-
  level boolean flags. Each was scaffolding for a problem that doesn't exist
  after unification.
- **P-008 (Composition over configuration)** — construction logic lives on
  the class that owns the data (subclass constructors). `assemble.ts`
  composes dispatch; each class composes its own init.

## Consequences

- **Enables**:
  - Future emitters trivially access slot content (direct `values[0].node`
    narrowing; no `kindMap.get(...)?` dance).
  - Mixed-multiplicity fields represented honestly — downstream code that
    wants per-value shape gets it; downstream code that wants flattened
    bools gets them via derived helpers. Both views consistent because both
    derive from the same source.
  - New Rule variants produce compile errors at every walker site (via
    `assertNever(x)` exhaustiveness) — silent-wrong-answer cases eliminated.
  - Easier to reason about the pipeline: fewer shapes of the same data,
    clearer ownership (class methods vs external walkers).

- **Costs**:
  - One large refactor churn across `node-map.ts`, `assemble.ts`, and every
    emitter. ~hundreds of lines of touch; spike + redispatch confirmed the
    migration is mechanical once the shape is clear.
  - Semantic corrections surface: fields like rust's `pointer_type.mutable_specifier`
    whose shape `choice('const', $.mutable_specifier)` previously let auto-stamp
    fire (because the literal was silently dropped) now correctly disqualify.
    This is the new correct behavior — user controls the specifier. Tests that
    encoded the old incorrect behavior get updated.
  - Per-value multiplicity means emitted types can be more complex in
    mixed-choice cases (`Foo | undefined | readonly Bar[]` where the old
    flattening produced a simpler-but-wrong type). Author-facing types honest
    about grammar shape.

- **Follow-ups**:
  - Rule-layer `SymbolRef` (in `rule.ts`) has the same `optional?: boolean +
repeated?: boolean` two-boolean encoding that can't distinguish
    repeat/repeat1. Consider the same four-valued multiplicity fix. Separate
    commit since rule.ts is pre-assembled pipeline stage.
  - `node-model.json5` serde needs to serialize `values` with Refs as
    `{kind:'unresolved-ref',name}` and rehydrate via `resolveSlotRefs` on
    load. If the file isn't bidirectional today (emitted but not re-loaded),
    this may be a no-op; verify.
  - Audit remaining Rule-tree walkers outside node-map.ts for the same
    pattern — `template-walker.ts`'s `collectRepeatedFields`, `link.ts`'s
    classification helpers, `optimize.ts`'s simplification passes. Any that
    collect partial projections of the same facts that another walker
    produces are candidates for consolidation.

## Verification

1. **All tests pass** at each phase boundary (1a, 1a-fix, 1.5, 1b, 1.6).
   Regression-free.

2. **Generated codegen output** bit-identical except for the intentional
   semantic corrections (mutable_specifier cases). Each correction documented
   in its commit message.

3. **Type-check clean** — only pre-existing python TS1009 trailing-comma
   errors (unrelated to this ADR) persist.

4. **No new consumer** reads `node.rule` directly outside class renderTemplate
   methods. `protected` enforces this at the type level.

5. **No partial-projection walkers remain** — grep for `deriveContentTypes`,
   `deriveLiteralValues`, `deriveFieldsRaw`, `deriveChildrenRaw` returns zero
   hits (or only their replacement `deriveSlots`).

6. **Every discriminated-union switch** on `Rule` / `AssembledNode` / slot
   shapes ends with `assertNever(x)`. Exhaustiveness enforced.

## Implementation tracking

- ✅ Task 1a — `AssembledField extends AssembledChild` (`f009e89`)
- ✅ Task 1a-fix — Rule narrowing for all 10 subclasses (`33a35d4`)
- ✅ Task 1.5 — `isParameterless` + fixpoint + children (`e0d573e`)
- ✅ Task 1b — constructor-based assembly; rule on all subclasses;
  narrowing-exploit getters (`6c32d3d`)
- ✅ Task 1b-follow — `protected rule` + `renderParts` + `isTextTemplate`
  encapsulation (`f0e2ced`, `2b73fc9`)
- ✅ Task 1.6 — `NodeOrTerminal` + per-value multiplicity + kill
  `deriveContentTypes` / `deriveLiteralValues` (`57f6d7b`)
- ✅ DRY principle → CLAUDE.md (`85559e7`)

**Note on `deriveFieldsRaw`:** retained as an internal helper for
`deriveFields`. Initially flagged as a candidate for elimination, but
re-examination shows it serves a distinct role — the recursive walker
that produces per-path fields, whose output is then dedup-merged by
`deriveFields`. The dedupe combines same-named fields appearing in
different seq/choice branches with branch-specific multiplicity
downgrading (not-in-all-branches → optional). This is not a DRY
violation: one walker produces one canonical output; the post-pass
dedupe is semantic (branch-presence analysis), not a redundant
re-derivation. Kept as-is.

**Outstanding DRY-enforcement item:** `deriveFieldsRaw`'s `default:
return []` branch swallows unhandled Rule variants silently. Should
be `assertNever(rule)` per the principle. Follow-up commit to tighten
this + any similar silent defaults elsewhere in node-map.ts and
sibling walkers.
