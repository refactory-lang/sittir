# Factory overlays — the ergonomic construction surface over raw builders

**Status:** approved design, not yet implemented
**Date:** 2026-08-30

## Problem

The core emitters now produce exactly one plain builder per kind, with every
slot a config field: no slot filtering, no positional parameters, presence
flags and terminators in the config. That is the correct storage-faithful
surface, but it is not how an author writes code. Three ergonomic layers
that used to be mixed into the core emitters (`factories.ts`, `ir.ts`,
`from.ts`) were removed with the slot filtering they depended on:

- **form constructors** — `lineComment.docInner(text)`,
  `visibilityModifier.inPath(path)`, `forHeader.let(...)`: build an arm of a
  choice slot and return the parent with that slot filled;
- **enum-member constructors** — `binaryExpression.ampAmp(config)`: fix an
  enum slot by name, take the remaining slots;
- **grouped namespaces** — `ir.statement.function(...)`,
  `ir.expression.binary(...)`: the members of a supertype or of a hidden
  choice-of-kinds rule, re-keyed by short name.

Hand-written consumers of that surface (the dogfood examples and the
per-grammar example-verify, tree-identity, grouped-equivalence and
namespace-convergence tests) no longer type-check. The refine-form
factories still exist but are attached by hand inside `ir.ts`'s bundle
composition — a second, private "forms on a builder" mechanism.

## Design

### One principle

**Bundles are plain objects; overlays are static wiring; one method per
builder.** The core emitters keep producing plain strict builders and plain
coercers. The coerce surface is a strict subset of the factory surface
(a coercer wraps a raw builder), and a hidden kind belongs to both when
the model marks it user-facing — alias-faced, variant-adopted, or
slot-reachable — so aliased-hidden kinds join the bundles, `ir`, and the
wire map under their visible-style keys; hoisted form kinds coerce only
locally inside their parent (separated lists are exempt: a GROUP-wrapped
list carries the hoisted stamp yet owns a public coerce surface). The
`ir` namespace's node-factory members are the bundle entries themselves,
so the three surfaces cannot disagree.
A *bundle* pairs the two for one kind — `{ strict, coerce }`,
made by the one generic `bundle()` helper — and every ergonomic layer
decorates bundles by object spread, never by mutating a function. A
sub-factory's mechanics ("build the child, seat it in the parent slot")
are identical for the strict and coerce flavors, so each sub-factory is
ONE module-local method in the generated overlay — its slot key, fixed
value, and destructure list baked in statically, generic only over the
(parent, child) function pair — applied twice: once to the strict pair,
once to the coerce pair. Bundling and the final hoisting are the only
dynamic stages (`bundle()` and `hoist()` in `utils.ts`), because they are
uniform across all kinds. No TypeScript `namespace` merging, no
`attachProps`-style property definition on imported functions, no
hand-assembled type unions — types fall out of generic inference over the
paired function types. Where a child has no emitted coercer, the coerce
application seats the child's strict builder inside the parent's coercer.
No layer changes storage, wrap, transport, render, or the validators — the
overlays are surface only. The one non-surface effect in this design is
additive: a hidden dispatch union that link now keeps (python's `_suite`)
emits its supertype transport surface in the native crate (a transport
struct, slot enum, and render helper) that was previously pruned away;
validators stay exactly at floor.

### Generated layout (per grammar, under `packages/<lang>/src/`)

```
factories/raw.ts                  the plain strict builders (today's factories.ts, unchanged content)
factories/coerce.ts               the coercers and per-field resolvers (formerly from.ts, unchanged content)
factories/bundle.ts               one line per kind: export const <irKey> = bundle(F.build<X>, C.coerceTo<X>)
factories/overlays/refines.ts     spreads bundles, wires refine-form factories (static)
factories/overlays/polymorphs.ts  spreads the refines layer; one method per sub-factory, applied to both flavors (static)
factories/overlays/supertypes.ts  grouped namespaces over the decorated bundles (static)
factories/index.ts                hoist() — the callable, coerce-first consumer surface (dynamic)
```

The chain order is fixed by dependency; each layer re-exports the previous
one and shadows only the bundles it decorates, carrying lower props forward
by spread (`{ ...B.x, docInner: form(B.x, B.xDocInner) }`).

**Below `index.ts`, the caller always chooses a flavor** — every layer's
surface point is a plain `{ strict, coerce }` pair. `factories/index.ts`
is the final, dynamic step: `hoist()` wraps each decorated bundle as a
callable whose bare call is the coerce flavor, recursively (sub-factory
pairs hoist the same way), with `.strict` always reachable — so the
consumer surface keeps today's shapes: `ir.x(...)` (loose),
`ir.x.strict(...)`, `ir.x.docInner(' hi')`, `ir.x.docInner.strict(' hi')`.
`ir.ts` assembles the `ir` object from `factories/index.js` by reference
and emits no composition logic of its own.

### Derivation sources

Every overlay reads the assembled model only; nothing re-derives a fact
from names or rule shapes.

**Refines** (`refines.ts`): `nodeMap.refineForms` — per kind, one factory
per authored refine form, attached under the form's camelCase name (and the
raw name when it differs), exactly the properties `ir.ts` composes into its
bundles today. This attachment moves out of `ir.ts`.

**Polymorphs** (`polymorphs.ts`): every kind with **exactly one choice
slot** — an envelope whose sole slot is a choice, a branch or polymorph with
one choice slot beside ordinary slots. Hoisted arm kinds continue to exist:
enrich is the hoister and mints them (they are parser-visible); `variant()`
is a rename of an arm to `<parent>_<variant>`. The overlay consumes the
hoist facts (`enrichment.hoisted`: `parentKind`, `name`) as a sidecar to
name the arms. Two arm shapes, one rule:

- a **kind arm** (a node reference in the choice slot) yields a form
  constructor named by the arm's variant name, or by the arm kind's name
  with the parent prefix stripped when no variant renamed it;
- a **forwarding hop** (a kind whose sole slot seats exactly one child
  kind — no choice of its own) passes its child's sub-factories through:
  the hop's surface re-exposes each of the child's forms seated in its
  own slot, and names them relative to the outer kind via the arm's
  deepest leaf (`visibility_modifier.pub` forwards through the group so
  `visibilityModifier.self`, `.super`, and `.inPath` exist at the top);
- a **whole-rule alternative arm** (a variant child that is a complete
  alternative of the parent's rule, in no slot at all —
  `binary_expression = choice(seq(left, op, right), _binary_expression_in)`)
  wires the arm's own factory pair under the same name, with no seating:
  the form is its own node kind in the CST, so the child factory already
  builds the complete node. Arms that sit in a real choice slot take the
  seated path; the alias path fires only for the unclaimed ones.
- a **literal arm** (a member of a kind-enum slot) yields a member
  constructor named by the token kind's camelCase name (`plus`, `ampAmp`).
  A fixed-token arm beside node arms stores and transports its kind id —
  single-value-enum semantics (`as_expression`'s `const` stores
  `TSKindId.Const`, never raw text and never a whole keyword node) —
  while whitespace/layout tokens, named-kind keywords, and identities
  owned by named nodes stay whole nodes, because their parse identities
  are real tree nodes an id cannot faithfully replace
  — the vocabulary the kind ids and consts already use. An authored
  `variant()` on the enum arm renames it (`add`, `and`); the mechanism is
  this spec's, the per-grammar naming sweep is later authored data.

`binary_expression`'s `in` arm is the ordinary case: enrich mints the arm
kind, `variant('in')` renames it, the overlay attaches `binaryExpression.in`
beside the enum members; the surface does not distinguish them.

**Supertypes**: every `AssembledSupertype` — including a hidden kind whose
body is a choice of kinds (a dispatch union with no node of its own —
`_statement` in rust and python is this shape), which link keeps even when
inlining removed every reference to it. Members are re-keyed by their
supertype-stripped short name. The grouped namespaces are emitted by
`ir.ts` as coercing-bundle groups (each member must carry `.strict`, so
the group is a projection over the hoisted bundles, not the strict
builders); the `overlays/supertypes.ts` chain layer is a reserved
pass-through seam.

### Sub-factory signature

**Subfactory = parent args − choice slot ∪ arm args.** The merged slot set
is classified by the existing factory-shape classifier
(`classifyFactoryShape` / `constructorSurface`) exactly as any factory's
slot set is: no slots → `()`, one text leaf → `(text)`, one envelope value
→ `(value)`, one list → spread, otherwise a config object. There is no
second surface derivation; the parent × child `instanceof` matrix decides
only how the merged set is produced (an envelope parent contributes no
residual; a branch contributes its residual; the child contributes its own
slots, or none for a literal arm).

Consequences (each shape is one generic combinator, applied twice — once
over the strict pair, once over the coerce pair):

- envelope parent: `form(parent, child)` — the constructor is the arm
  factory's own signature, wrapped: `lineComment.docInner.strict(' hi')`;
- branch parent, literal arm: `member(parent, slotKey, value)` —
  `Omit<Config, slot>`: `binaryExpression.ampAmp.strict({ left, right })`;
  the fixed value matches the slot's storage (a kind id for kindEnum
  storage; the child factory's product when the arm is kind-backed);
- branch parent, config arm: the residual-merge combinator — one merged
  config, keys split by owner, child built and seated in the choice slot.

Everything stays non-positional beyond what the classifier already yields
for the merged set; presence flags remain config fields.

**Recursion.** An arm that is itself a single-choice-slot kind contributes
its own sub-factories to the parent, with the residual accumulated along
the path (`forHeader.let(...)` from the let/const arm's `kind` enum). The
arm builder keeps its own props, so `forHeader.letConst.let(...)` exists
too. Naming: a direct arm always wins the name over a flattened grand-arm;
two flattened claimants for one name → neither is attached and the emit
diagnostic names both. A parent residual slot name colliding with an arm
slot name is likewise an emit diagnostic and the constructor is skipped —
never a silent shadow.

### `ir.ts` after the overlays

`ir.ts` only assembles: it imports the decorated bundles from
`factories/index.js` and builds the `ir` object (flat keys, short aliases,
groups, synonyms) by reference. It contains no composition logic — no
bundling, no forms, no groups of its own.

### Consumers

Every consumer call names a flavor: the old `ir.x(...)` loose call becomes
`ir.x.coerce(...)`, and `ir.x.strict(...)` keeps its meaning.

| call shape | served by |
| --- | --- |
| `ir.lineComment.docInner.strict(text)` / `.coerce(text)`, `.docOuter`, `.content` | polymorph overlay wiring, envelope parent |
| `ir.visibilityModifier.pub.strict()`, `.crate.strict()` | polymorph overlay wiring, recursive arm |
| `ir.expressionStatement.withSemi.strict(expr)` | polymorph overlay wiring (forwarded child → positional) |
| `ir.binaryExpression.ampAmp.strict({ left, right })` | member wiring, enum slot fixed |
| `ir.statement.function.strict(...)` / `.coerce(...)`, `ir.expression.binary.*` | supertype overlay (hidden choice-of-kinds and supertypes) |
| `ir.identifier.identifier(name)` (typescript) | not served — a stale shape; rewritten to `ir.identifier.strict(name)` |
| `binaryExpression.in`, `visibilityModifier.inPath` | deferred: the `in` arm rename trips the typescript LR conflict table (`for (var x = e in …)`), and `inPath` sits behind the pre-existing `_visibility_modifier_pub_parens` phantom — both tracked outside this design |

Type-level access paths (`NamespaceMap`, `ConfigFor`, `FluentFor`) are
untouched: the overlays add properties to values, not members to the type
family.

### Tests

- The generated per-kind test emitter gains one test per attached
  sub-factory: build through it, render, reparse, assert the parent kind
  and that the choice slot holds the arm kind (or the enum value). Same
  fixture shape as the existing factory tests; `expectTestFailures` keys of
  the form `<kind>.<constructor>` pin one constructor's test.
- Acceptance: the three `examples-verify` suites and the dogfood examples
  (rust, typescript, python) compile and pass; `pnpm run type-check`
  returns to its baseline; grouped-equivalence and namespace-convergence
  tests are updated to the new import paths.
- Validators unchanged and at floor on all three grammars — the overlays
  do not touch the wire.

### Documentation

Each overlay emitter gets a section in the emitters glossary
(`docs/glossary/`); no comments in `packages/codegen/src`. The generated
layout is recorded in the architecture doc.

## Out of scope

- The per-grammar semantic naming of operator enum members (`add`, `and`)
  — authored data applied through the rename mechanism above.
- Unifying `fields` / `slots` / `structuralFieldsOf` / `allSlotsOf` into
  one accessor, and static spacing — both follow the overlays.
- Any change to storage, `from()`, wrap, transport, render, or the
  validators.
