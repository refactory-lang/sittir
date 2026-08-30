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

**A raw builder is decorated, never rewritten.** The core `factories`
emitter keeps producing plain builders. Each ergonomic layer is a separate
generated module that imports the previous layer's exports, attaches
properties onto the builders it decorates (`attachProps`), and re-exports
everything. Consumers import the top of the chain. No layer changes a
builder's own signature, storage, `from()`, wrap, transport, render, or the
validators — the overlays are surface only, and there is no wire change.

### Generated layout (per grammar, under `packages/<lang>/src/`)

```
factories/raw.ts                  the plain builders (today's factories.ts, unchanged content)
factories/overlays/refines.ts     imports ../raw.js        → refine-form factories attached
factories/overlays/polymorphs.ts  imports ./refines.js     → arm sub-factories and enum members attached
factories/overlays/supertypes.ts  imports ./polymorphs.js  → grouped namespaces
factories/index.ts                re-exports ./overlays/supertypes.js — the public strict surface
```

The order is fixed by dependency: the polymorph overlay must see refine-
decorated arm builders (so `forHeader.letConst.<refineForm>` exists), and
the supertype overlay must group fully decorated builders.

`ir.ts` and `from.ts` import `F` from `./factories/index.js`. The barrel
(`index.ts`) exports the decorated surface, never `raw`. Tests that pin the
plain shape import `factories/raw.ts` explicitly.

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
- a **literal arm** (a member of a kind-enum slot) yields a member
  constructor named by the token kind's camelCase name (`plus`, `ampAmp`)
  — the vocabulary the kind ids and consts already use. An authored
  `variant()` on the enum arm renames it (`add`, `and`); the mechanism is
  this spec's, the per-grammar naming sweep is later authored data.

`binary_expression`'s `in` arm is the ordinary case: enrich mints the arm
kind, `variant('in')` renames it, the overlay attaches `binaryExpression.in`
beside the enum members; the surface does not distinguish them.

**Supertypes** (`supertypes.ts`): every `AssembledSupertype` and every
hidden kind whose body is a choice of kinds (a namespace with no node of
its own — `_statement` in rust and python is this shape). Members are
re-keyed by their supertype-stripped short name; supertype closure applies,
so `ir.statement.function` reaches `function_item` through
`_declaration_statement`. Each group is a top-level `export const` and is
also attached to `ir`. This emission moves out of `ir.ts`.

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

Consequences:

- envelope parent: the constructor is the arm factory's own signature,
  wrapped — `lineComment.docInner(' hi')`, `visibilityModifier.inPath(path)`;
- branch parent, literal arm: `Omit<Config, slot>` —
  `binaryExpression.ampAmp({ left, right })`;
- branch parent, config arm: one merged config; the overlay splits keys by
  owner, builds the arm, builds the parent with the arm in the choice slot.

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

`ir.ts` composes bundles only: `attachProps(FR.x, { strict: F.x, ...F.x })`
— whatever an overlay attached to the decorated builder surfaces on the
coercing bundle automatically (`ir.lineComment.docInner`,
`ir.binaryExpression.ampAmp`, `ir.functionItem.<refineForm>`). It attaches
the supertype overlay's groups to `ir` and emits no groups and no forms of
its own; `bundleParts` loses its refine-form branch.

### Consumers

| call shape | served by |
| --- | --- |
| `ir.lineComment.docInner(text)`, `.docOuter`, `.content` | polymorph overlay, envelope parent |
| `ir.visibilityModifier.pub()`, `.inPath(path)`, `.self()`, `.crate()` | polymorph overlay, recursive through `_visibility_modifier_pub` / group arm |
| `ir.expressionStatement.withSemi({ expression })` | polymorph overlay, branch parent, config arm |
| `ir.binaryExpression.in(...)` / `.ampAmp(...)` | polymorph overlay, kind arm / literal arm |
| `ir.statement.function(...)`, `ir.declaration.function(...)`, `ir.expression.binary(...)` | supertype overlay (hidden choice-of-kinds and supertypes) |
| `ir.x.form.strict(...)` | bundle spread: `.strict` is the decorated builder |
| `ir.identifier.identifier(name)` (typescript) | not served — a stale shape; rewritten to `ir.identifier(name)` |

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
