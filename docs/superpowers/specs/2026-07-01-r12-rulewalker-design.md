# R12 PR-6 — RuleWalker\<R\>: one traversal engine, inventory-driven

**Status:** designed (2026-07-01), pending implementation.
**Parent:** [R12 unified phase context](2026-06-29-r12-unified-phase-context.md) — PR-6, the
last R12 item. The parent spec required RuleWalker be "designed from per-phase inventory,
not upfront"; this doc records that inventory and the design derived from it.
**Builds on:** the phase-parameterized `Rule<Phase>` IR (PR #111) — `AnyRule`, phase-generic
guards, and the already-generic `recurseChildren<R extends AnyRule>`.

## Problem — the walk inventory

~70 hand-rolled rule-tree walks across 17 files, in six families:

| Family | Shape | Exemplars | ~Count |
|---|---|---|---|
| Transform (map) | Rule→Rule, rebuild-on-change, identity-preserving | `recurseChildren`, `pushAttrsToLeaves`, `inlineRefs`, `fanOutSeqChoices`, `collapseWrappers`, `resolveRule` | ~25 |
| Collect (fold) | Rule→Set/array accumulator | `walkFieldNames`, `collectSubtypeNames`, `walkForStrings`, `deriveComplexAliasTargetHidden` | ~20 |
| Predicate/search | Rule→boolean, short-circuit | `findRepeatFlag`, `hasAnyField`, `referencesSelf`, `ruleMatchesEmpty` | ~12 |
| Map-deref | follow SYMBOL refs through the rules map + seen-set cycle guard | `inlineRefs`, `resolveHiddenRuleContent`, `dereferenceTopLevelAliasBody` | ~6 |
| Text-emit dispatcher | order-sensitive per-type emission (the flagged "walker hotspot") | `emitRule` (templates.ts), suggested.ts walkers | ~5 |
| Path-addressed | segment-indexed descent | `replaceAtPathRec`, transform-path | ~3 |

The load-bearing defect: **the child-edge relation is hand-rolled differently in every walk
and drifts**. `findRepeatFlag` descends seq/choice/optional/variant/group/field but not
alias/token; `deriveComplexAliasTargetHidden` had to be patched to also cover separator
rules; post-optimize the `separator.rules` edge exists while wrapper edges don't. Every
drift is a latent missed-subtree bug.

## Decisions (design discussion, 2026-07-01)

1. **Scope: transform + collect + predicate (+ map-deref)** — the generalizable families
   (~57 walks + the 6 deref walks). Text-emit (`emitRule`) and path-addressed
   (`replaceAtPath`) stay bespoke: they are per-type *dispatchers*, not traversals — a
   generic walker adds indirection without removing code, and the emitRule hotspot (3 known
   edge-case fixes, no unit tests) is too risky to restructure here.
2. **Home: on ctx.** `BaseCtx<R>` gains `readonly walker: RuleWalker<R>` — chosen because
   the walker's *state* is trackable there: it binds the phase's rules map (+ diagnostics
   sink), which is exactly what BaseCtx already holds.
3. **State: ctx binding + per-walk guards only.** The walker is constructed over
   `ctx.rules` (+ `ctx.diagnostics`); `*Deep` walks manage cycle seen-sets *internally per
   invocation*. **No state persists between walks** — deterministic, and CW6-compatible:
   the explicit trailing seen-set params don't move onto ctx, they vanish into the walk
   invocation. Cross-walk memoization and walk telemetry were considered and rejected
   (cache-invalidation hazard against the mutable rules map during link/normalize; YAGNI).
4. **API shape: primitive trio over one edge relation** (approach A). A visitor-object API
   was rejected — it replaces exhaustive `switch (rule.type)` arms with partial visitor
   bags, losing TS exhaustiveness checking (feedback_rule_type_discrimination: switches
   first). The walker owns **recursion**, never **dispatch**.

## Design

### Placement & layering

`RuleWalker<R extends AnyRule>` is a class in `dsl/rule-walker.ts`, mirroring
`RuleBuilder`'s layering exactly: dsl-side so enrich / rule-transforms construct one
locally without a ctx; compiler-side `BaseCtx<R>` holds a bound instance, built in the
ctor from `init.rules` + `init.diagnostics` (derived, not injected — no new init field).
Evaluate remains the R12 exception (no BaseCtx) but may `new RuleWalker(rules)` locally.

### The edge relation — the DRY core

```ts
childrenOf(rule: R): readonly R[]
```

One source of truth for "what are this rule's children":
- `members` (seq / choice)
- `content` (optional / repeat / repeat1 / field / variant / group / token / alias)
- separator rules: string form → none; array form → its elements; object form → `sep.rules`
- leaves (string / pattern / symbol / supertype / indent / dedent / newline) → `[]`
  (supertype's `subtypes` are *names*, not rules — deref-wing territory, not edges)

Walks that need a *narrower* edge set (e.g. "don't descend into token") express that in
their own visit lambda by returning early on those types. The walker never grows per-walk
edge-set options — revisit only if the lambdas get repetitive.

### API surface

```ts
export class RuleWalker<R extends AnyRule = AnyRule> {
	constructor(rules?: Readonly<Record<string, R>>, diagnostics?: DiagnosticSink);

	childrenOf(rule: R): readonly R[];

	/** Bottom-up rebuild. Returns the SAME reference when nothing changed —
	 *  load-bearing for fixpoint loops (enrich compares `r === before`).
	 *  Bottom-up rebuild over structural edges (members/content); separator
	 *  edges are observation-only territory (fold/find). */
	map(rule: R, visit: (r: R) => R): R;

	/** Pre-order accumulate. */
	fold<A>(rule: R, init: A, f: (acc: A, r: R) => A): A;

	/** Pre-order search, short-circuits on first match. */
	find(rule: R, pred: (r: R) => boolean): R | undefined;

	// --- deref wing (requires `rules`; throws if constructed without) ---

	/** One-step SYMBOL resolve through the bound rules map. */
	deref(ref: R): R | undefined;

	/** Follow symbol refs; internal seen-set per invocation (cycle-safe). */
	foldDeep<A>(rule: R, init: A, f: (acc: A, r: R) => A): A;
	findDeep(rule: R, pred: (r: R) => boolean): R | undefined;
}
```

The seen-set contract: each reachable rule node is visited at most once per invocation,
keyed on rule **object identity** (not symbol name). Identity-keying (rather than
name-keying) was an in-flight adjudication: the plan's own cycle test was authoritative,
and name-keyed dedup double-counted nodes reachable both directly and via a ref-chain;
identity-keying also naturally dedupes diamond ref patterns (two refs resolving to one
shared node visited once, not twice).

Phase-generic end to end: `BaseCtx<Rule<'link'>>.walker` walks link-view rules; the
type parameter flows through every lambda.

### Test-layout convention (lead-in commit)

Four test conventions coexist in codegen (53-file `src/__tests__/` grab-bag mixing unit +
integration; 31 module-adjacent `__tests__/` files; 8 co-located `*.test.ts`; package-level
`tests/` in packages/tools). Standardize:

- **Module-adjacent `__tests__/` for unit tests** (the plurality convention; where
  `dsl/__tests__/rule-walker.test.ts` lands).
- **`src/__tests__/` reserved for cross-module integration tests** (real-grammar,
  emitter-framework, factory-surface stay).

Migration: move the ~20 per-module unit tests out of the grab-bag and the 8 co-located
files into their module's `__tests__/` — pure moves + import-path updates, zero logic,
executed via `lsproxy` file-moves (importer updates come free). Lands as a **separate
mechanical lead-in commit** on the PR-6 branch so the walker diff stays reviewable. Add
the convention one-liner to `.claude/codegen-conventions.md`.

## PR-6 migration scope (byte-neutral, gated)

Land the class + `BaseCtx.walker` + migrate **exemplars per family** — not all 57:

- `findRepeatFlag` (rule-transforms) → `walker.find` (own predicate keeps the flag/separator dispatch)
- `deriveComplexAliasTargetHidden` (evaluate) → `walker.fold` (separator edges now come from childrenOf)
- `recurseChildren` (rule-transforms) → deprecated pointer to `walker.map`; callers migrate opportunistically
- `walkFieldNames` (types/rule.ts) — NOT migrated: types-layer cannot depend on dsl; stays self-contained
- `resolveHiddenRuleContent` (assemble) — evaluated 2026-07-02 and CLOSED as won't-migrate:
  it is a per-type DISPATCHER, not a traversal (each case decides both what to emit and where
  to descend, including deref by NAME STRINGS through supertype subtypes — inexpressible via
  the walker's SYMBOL-node deref). Same category as emitRule per the scope decision above;
  no mapDeep primitive is warranted.

Remaining walks migrate opportunistically in later passes (each gated). Gates:
`SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` holds rust 117 / ts 75 / py 102;
`propose-14` ratchet OK; oxlint parity.

## Testing

New `dsl/__tests__/rule-walker.test.ts`:
- `childrenOf` edge coverage per rule type, **including all three separator forms**
- `map` identity preservation (unchanged tree returns the same reference)
- `fold` pre-order visit order
- `find` short-circuit (visit count stops at first match)
- `deref`/`*Deep` cycle termination on self-referential rules maps
- `deref`/`*Deep` diamond dedup (two refs to one shared node → visited once)

Migrated exemplar walks keep their existing tests as behavioral locks.
