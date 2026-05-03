# Feature Specification: Binding, Simplify, and Assemble Re-architecture

**Feature Branch**: `022-binding-simplify-assemble`
**Created**: 2026-04-29
**Status**: Draft
**Input**: Follow-on architectural work extracted from refined spec 021. Spec 021 now defines the rule-first identity/classification model (`RuleId`, rule-level `terminal` / `nonterminal`, field and alias semantics, and late KindID / FieldID metadata). This spec owns the compiler rewrite that consumes that model: Binding, Simplify, and Assemble.

## Background

Even with a stable rule-first ontology, the compiler still reasons about many structures through a
wrapper-heavy tree and an old `fields` / `children` / slot mental model. That makes assembled
representation drift from the clarified model in 021.

The new direction is:

- **Binding** first binds terminals to the nonterminals they belong with.
- **Simplify** then pushes wrapper behavior down onto those constituent rules.
- **Assemble** materializes kinds from normalized constituent rules instead of treating wrappers as
  primary assembled members.

This spec owns that rewrite. It deliberately starts **after** 021 has settled identity and rule
classification, so this pipeline change does not need to redefine ontology while it rewires the
compiler.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Binding attaches terminals to the nonterminals they belong with (Priority: P1)

A maintainer needs an early phase that can bind terminal rules to the nonterminal constituents they
belong with, so later phases stop reasoning over raw wrapper shape and instead reason over the
constituent-oriented model.

**Why this priority**: Without Binding, Simplify has to guess constituent boundaries from the raw
wrapper tree and the new model immediately becomes under-specified.

**Independent Test**: For representative rule shapes that currently mix terminals and wrappers,
assert that Binding produces a stable constituent-oriented association that later phases can consume
without re-walking the raw tree for ownership.

**Acceptance Scenarios**:

1. **Given** a kind whose raw rule contains terminals interleaved with nonterminals, **When** Binding runs, **Then** the terminals are associated with the nonterminal constituents they belong with instead of remaining detached primary members.
2. **Given** field-wrapped terminal-only content, **When** Binding runs after 021 classification, **Then** that content respects the already-forced nonterminal classification instead of falling back to a terminal-only view.
3. **Given** named alias over terminal-like content, **When** Binding runs, **Then** the result respects 021's nonterminal-forcing alias semantics.

---

### User Story 2 — Simplify pushes wrapper behavior down onto constituent rules (Priority: P1)

A maintainer needs Simplify to normalize wrapper-heavy rule trees by pushing behavior down onto
constituent rules so wrappers no longer behave like primary assembled members.

**Why this priority**: This is the heart of the re-architecture. If wrappers remain primary members
in the assembled model, the compiler will continue to drift from the clarified ontology.

**Independent Test**: For representative `seq`, `choice`, `optional`, `repeat`, `repeat1`, and
`prec*` shapes, assert that Simplify produces a normalized constituent view where ordering,
multiplicity, alternatives, and precedence are carried by constituents rather than by surviving
wrapper nodes.

**Acceptance Scenarios**:

1. **Given** a `seq(...)` wrapper, **When** Simplify runs, **Then** ordering is represented on the resulting constituent rules rather than by treating the sequence wrapper as a primary assembled member.
2. **Given** `optional(rule)` or `repeat(rule)`, **When** Simplify runs, **Then** optionality and multiplicity become properties of the constituent rule(s) rather than surviving as primary wrapper members.
3. **Given** `choice(...)` with mixed wrapper-heavy alternatives, **When** Simplify runs, **Then** the result is classified by its frontier outcome after Binding + Simplify, even if Simplify must synthesize a normalized constituent form to make that coherent.

---

### User Story 3 — Assemble materializes kinds from normalized constituent rules (Priority: P2)

A maintainer needs Assemble to stop thinking in the old `fields` / `children` / slot ontology and
instead materialize kinds from normalized constituent rules, with parent-edge naming attached where
present.

**Why this priority**: This is the downstream payoff of Binding + Simplify. If Assemble keeps the
old primary-storage model, the rewrite remains incomplete.

**Independent Test**: For representative kinds with field names, aliases, literals, and wrapper
forms, assert that Assemble produces a kind surface derived from normalized constituent rules and
preserves the naming/provenance semantics established earlier in the pipeline.

**Acceptance Scenarios**:

1. **Given** a kind with named and unnamed constituents, **When** Assemble runs after Binding + Simplify, **Then** it materializes that kind from normalized constituent rules with parent-edge naming attached where present.
2. **Given** a kind whose current implementation would split data across `fields` and `children`, **When** Assemble runs under the new model, **Then** its primary assembled representation is based on constituent rules rather than on the old split ontology.
3. **Given** a compatibility view still needs `fields` or `children`, **When** that view is produced, **Then** it is derived from the normalized constituent-rule model rather than by maintaining a second independent discovery pass.

---

### Edge Cases

- **Mixed `choice` frontier**: choices whose arms start terminal-like in some cases and nonterminal-like in others must resolve by frontier result after Binding + Simplify, even if normalization requires synthesis.
- **Field-wrapped literals**: field semantics from 021 still force nonterminal treatment even when the CST surface stays anonymous.
- **Named alias over terminal-like content**: Binding and Simplify must honor 021's rule that named alias forces nonterminal treatment.
- **Anonymous alias**: anonymous alias may still change anonymous CST labeling, but it must not reintroduce a second ontology during Binding / Simplify / Assemble.
- **Wrapper-only structure**: `seq`, `optional`, `repeat`, `repeat1`, `choice`, and `prec*` must not survive as primary assembled members just because the old implementation made that convenient.
- **Provenance**: Binding, Simplify, and Assemble must preserve `RuleId` lineage back to 021 rather than re-discovering structure through fresh walkers.

## Architectural Design

### 1. Binding comes before Simplify

Binding is the first step toward the constituent-oriented model. Its job is to bind terminals to
the nonterminals they belong with so that Simplify can normalize constituent behavior instead of
guessing ownership from raw tree shape.

Representative direction:

```ts
export interface BindingResult {
	readonly ownerKind: string;
	readonly members: readonly {
		readonly ruleIds: readonly RuleId[];
		readonly terminality: 'terminal' | 'nonterminal';
		readonly edgeName?: string;
	}[];
}
```

The important point is not this exact type name, but the phase boundary:

> Binding establishes constituent ownership before wrapper normalization.

### 2. Simplify pushes wrapper behavior down

Simplify becomes the normalization phase. It consumes bound constituents and pushes wrapper behavior
down onto them.

Under this design:

- ordering belongs to constituents
- multiplicity belongs to constituents
- alternative structure belongs to constituents
- precedence metadata belongs to constituents

This applies to wrappers such as:

- `seq`
- `choice`
- `optional`
- `repeat`
- `repeat1`
- `prec*`

### 3. Choice resolves by frontier result

`choice(...)` is the hardest wrapper case, so this spec makes it explicit:

- `choice(...)` resolves by its **frontier result after Binding + Simplify**
- if needed, Simplify may synthesize a normalized constituent form so Assemble sees one coherent
  result instead of a split terminal/nonterminal ambiguity

### 4. Assemble materializes kinds from normalized constituent rules

Assemble should no longer think in the old `fields` / `children` / slot ontology.

Instead, it materializes a kind from normalized constituent rules, with parent-edge naming attached
where present and `RuleId` provenance carried forward from 021.

Representative direction:

```ts
export interface AssembledKindSurface {
	readonly kind: string;
	readonly members: readonly {
		readonly ruleIds: readonly RuleId[];
		readonly terminality: 'terminal' | 'nonterminal';
		readonly edgeName?: string;
		readonly optional?: boolean;
		readonly repeated?: boolean;
		readonly order: number;
	}[];
}
```

Again, the architectural rule matters more than the exact spelling:

> Assemble is built from normalized constituent rules, not from surviving wrapper nodes and not from the old `fields` / `children` split as a primary ontology.

### 5. De-hoisted NodeData model

`$fields` is removed. Named members stored with `_`-prefix (`_name`, `_body`).
Getters provide clean unprefixed access (`fn.name`, `fn.body`).
`$`-prefix for sittir-owned metadata and methods.

This separation enables:
- Wrap getters intercept access with `drillIn` without mutating stored values
- Factory and wrap have identical getter APIs, different backing storage
- Storage shape can evolve (lazy, memoized) without API change

```ts
// Storage: _prefixed (not for direct consumer access)
// Getters: unprefixed (the consumer API)
// Metadata: $-prefixed
// Methods: $-prefixed

const fn = {
    $type: 42,
    $source: 2,
    $named: true,
    _name: "main",            // storage
    _body: { ... },           // storage
    get name() { return this._name; },   // getter
    get body() { return this._body; },   // getter
    $child?: NodeMemberValue,            // single unnamed
    $children?: NodeMemberValue[],       // repeated unnamed
    $with: { name, body, ... },
    $render() { ... },
};

type AnyNodeData = NodeBase;
type NodeMemberValue = AnyNodeData | string | number;
```

Naming convention:
- `$` — sittir metadata + methods (never collides with grammar)
- `_` — stored field values (never collides — tree-sitter field names are never `_`-prefixed)
- unprefixed — getter API (what consumers use)

### 6. `$with` namespace replaces fluent methods

Per-field fluent getter/setter methods (`fn.name()` / `fn.name(v)`) replaced
by a `$with` namespace of immutable updaters. Each `$with.field(v)` returns
a fresh node via the factory:

```ts
fn.$with.name(ir.identifier('greet'))
  .$with.returnType(ir.typeIdentifier('String'))
  .$with.body(ir.block([newStmt]))
```

### 7. `$`-prefixed methods

All sittir-owned operations use `$`-prefix: `$render()`, `$toEdit()`,
`$replace()`, `$trivia()`. Attached by a shared `withMethods` helper
instead of per-factory inline emission.

### 8. Unified wrap + factory surface

Wrap output has the same `$with` namespace and `$`-prefixed methods as
factory output. The only difference: wrap getters use `drillIn` for lazy
expansion of shallow fields. Factory output has raw data.

### 9. Rust NodeData — napi direct, no serde

Rust NodeData crosses the napi boundary via direct `FromNapiValue` /
`ToNapiValue` impls — no JSON serialization, no `serde_json::to_string` →
`JSON.parse` round-trip. Named members are read/written as JS object
properties directly.

No `HashMap<String, MemberValue>`. No `#[serde(flatten)]`. The per-kind
transport structs already do this (each field is a named napi property).
`NodeData` on the Rust side becomes a thin read helper, not a serialized
intermediate.

`$with` and `$`-prefixed methods are JS-side only. They don't cross napi.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Binding MUST precede Simplify.
- **FR-002**: Binding MUST attach terminals to the nonterminal constituents they belong with so later phases stop reasoning over raw wrapper shape as the primary model.
- **FR-003**: Binding MUST respect the rule classifications and field/alias semantics established by 021 rather than reclassifying them from scratch.
- **FR-004**: Simplify MUST push wrapper behavior down onto constituent rules instead of preserving wrappers as primary assembled members.
- **FR-005**: For `seq(...)`, ordering MUST be represented on the resulting constituent rules rather than by treating the sequence wrapper as a primary assembled member.
- **FR-006**: For `optional(rule)`, `repeat(rule)`, and `repeat1(rule)`, optionality and multiplicity MUST be represented on the constituent rule(s) produced from `rule`.
- **FR-007**: `choice(...)` MUST resolve by its frontier result after Binding + Simplify. If necessary, Simplify MAY synthesize a normalized constituent form so Assemble sees one coherent result.
- **FR-008**: `prec*` wrappers MUST remain parse-behavior metadata and MUST NOT survive as primary assembled members solely because of historical implementation shape.
- **FR-009**: Assemble MUST materialize kinds from normalized constituent rules with parent-edge naming attached where present.
- **FR-010**: Assemble MUST preserve `RuleId` provenance from 021 for every normalized constituent it materializes.
- **FR-011**: Any retained compatibility `fields` / `children` views MUST be derived from the normalized constituent-rule model rather than maintained as a second independent discovery pass.
- **FR-012**: Binding, Simplify, and Assemble MUST share one coherent constituent-oriented model; partial migration that leaves wrappers half-pushed-down while assembled storage has already changed is not acceptable.
- **FR-013**: Terminal constituents MUST be stored as plain values (strings) at the slot level in readNode, factory, and wrap output. Nonterminal constituents MUST be stored as `{ $type, $text, $nodeHandle, $childIndex }` stubs with drill-in materialization.
- **FR-014**: The `toNativeRenderTransport` projection MUST become identity for terminal slots — no runtime conversion from NodeData objects to strings. The source data shape must match the transport shape.
- **FR-015**: The terminal/nonterminal classification used by emitters (factory, readNode, wrap, transport) MUST be derived from the same constituent model that Binding + Simplify produce — one source, one derivation.
- **FR-016**: `$fields` wrapper MUST be removed. Named members MUST be top-level keys on the NodeData object. Grammar field names MUST NOT start with `$`.
- **FR-017**: `NodeFieldValue` and `NodeChildValue` MUST be unified into `NodeMemberValue = AnyNodeData | string | number`.
- **FR-018**: Unnamed positional members use `$children` (optional array). Named members are top-level keys. A kind with all named members simply omits `$children`. No separate shape types.
- **FR-019**: Per-field fluent getter/setter methods MUST be replaced by a `$with` namespace of immutable updaters. Each `$with.field(v)` returns a fresh node via the factory.
- **FR-020**: All sittir-owned methods MUST use `$`-prefix: `$render()`, `$toEdit()`, `$replace()`, `$trivia()`.
- **FR-021**: A shared `withMethods` helper MUST attach all `$`-prefixed methods. Per-factory inline method emission MUST be removed.
- **FR-022**: Wrap output MUST expose the same `$with` namespace and `$`-prefixed methods as factory output. Wrap getters MUST use `drillIn` for lazy expansion.
- **FR-023**: Rust `NodeData` MUST cross napi via direct `FromNapiValue`/`ToNapiValue` — no JSON serialization round-trip. Named members are read/written as JS object properties directly. `$with` and `$`-prefixed methods are JS-side only and MUST NOT cross napi.

### Key Entities _(include if feature involves data)_

- **`BindingResult`** — phase output that associates terminals with the nonterminal constituents they belong with before normalization.
- **Simplified constituent rule** — normalized rule member after wrapper behavior has been pushed down.
- **`AssembledKindSurface`** — assembled representation of a kind built from normalized constituent rules with naming/provenance attached.
- **Frontier result** — the resolved constituent outcome of a wrapper-heavy form, especially `choice(...)`, after Binding + Simplify.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Representative Binding tests show terminals attaching to the correct nonterminal constituents for Rust, TypeScript, and Python samples.
- **SC-002**: Representative Simplify tests show `seq`, `choice`, `optional`, `repeat`, `repeat1`, and `prec*` behavior pushed down onto constituent rules rather than preserved as primary assembled members.
- **SC-003**: Mixed `choice` cases can be normalized into one coherent frontier result after Binding + Simplify.
- **SC-004**: Assemble materializes kinds from normalized constituent rules while preserving `RuleId` provenance and parent-edge naming.
- **SC-005**: Any compatibility `fields` / `children` views remaining after the first landing are provably derived from the normalized constituent model rather than from separate private walkers.
- **SC-006**: Native RT pass rates must not regress below current baseline: python ≥114/115, rust ≥124/136, typescript ≥108/112.
- **SC-007**: Factory round-trip failure ceilings drop to zero across all three grammars (from rust 15, typescript 25, python 70).
- **SC-008**: Zero references to `$fields` remain in generated output or core runtime after Phase 3.
- **SC-009**: Per-field fluent method emission removed — net ~-1,500 lines across generated factories.
- **SC-010**: `withMethods` shared helper replaces per-factory `factorySuffix` emission (~15 lines × 1 instead of ~6 lines × 280).

## Out of Scope

- Defining foundational identity or rule classification from scratch; that is owned by 021.
- Replacing `RuleId` with KindID / FieldID or any other tree-sitter-generated metadata.
- Implementing the eventual enum-backed wire format itself.
- Changing tree-sitter CST semantics for named vs anonymous nodes.
- Transport emitter (`render-module.ts`), `from.ts` emitter, and `client-utils.ts` emitter updates — these follow naturally once storage matches transport shape; no spec-level work required.
- `toNativeRenderTransport` runtime workarounds — eliminated by terminal hoisting at source.

## Clarifications

### Session 2026-05-03

- Q: Is terminal value hoisting (storing leaf values as plain strings at slot level) in scope? → A: Yes — include as FR-013/014/015 (unified storage model, identity projection, single-source classification).
- Q: Migration strategy — big-bang or incremental? → A: Incremental staged commits, each passing tests. Backward-compat projections allowed temporarily as long as each stage is internally consistent. RT validator (native, 114/124/108) is the safety net.
- Q: Quantitative success criteria? → A: Factory round-trip ceilings must drop to zero (currently rust 15, ts 25, py 70). Terminal value hoisting eliminates the leaf-NodeData-as-String transport boundary mismatch that causes these failures.
- Q: Downstream emitter scope? → A: Core pipeline (Binding/Simplify/Assemble) + storage emitters (factory, readNode, wrap) for terminal hoisting. Transport/from/client-utils follow naturally once storage shape is correct — projection becomes identity.
- Amendment: De-hoisted NodeData model — `$fields` removed, named members top-level, `$with` namespace replaces fluent methods, `$`-prefix for all sittir methods, unified factory/wrap surface. FR-016 through FR-023, SC-008 through SC-010 added. Three-phase migration plan.

## Dependencies & Assumptions

- **Depends on** refined 021 for `RuleId`, rule classification, field semantics, alias semantics, and late KindID / FieldID metadata.
- **Depends on** the five-phase compiler contract from spec 005 remaining intact, with this work expressed as a Binding / Simplify / Assemble rewrite inside that broader pipeline.
- **Assumes** the current assembled representation can evolve in stages, with compatibility projections allowed temporarily as long as they derive from the normalized constituent model.
- **Migration**: Incremental staged commits across three phases:
  - **Phase 1** — Compiler-internal: Binding/Simplify/Assemble produces unified constituent model. Emitters project to current shape. No consumer changes.
  - **Phase 2** — De-hoist + `$with`: Remove `$fields`, replace fluent methods with `$with` namespace, `$`-prefix all methods, update wrap emitter. Greppable transforms: `.$fields.` → `.`, `.name()` → `.name`, `.name(v)` → `.$with.name(v)`, `.render()` → `.$render()`.
  - **Phase 3** — Cleanup: Remove `$fields`, `NodeFieldValue`, `NodeChildValue`, `factorySuffix`, per-field fluent methods.
  - Each stage must pass ALL THREE native RT modes and type-check with zero errors:
    - **Shallow RT** (native parse + native render): ≥114/124/108
    - **Deep RT** (native parse + recursive drill-in + native render): ≥114/124/108, structural identity (astMatch == pass)
    - **Factory RT**: ceilings must not regress (target: 0)
