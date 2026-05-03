# Feature Specification: De-hoisted NodeData Surface

**Feature Branch**: `022-binding-simplify-assemble`
**Created**: 2026-04-29
**Revised**: 2026-05-03
**Status**: Draft
**ADR**: `docs/adr/0018-dehoist-nodedata-surface.md`

## Background

The current NodeData surface has accumulated complexity that impedes consumers and
blocks further runtime evolution:

- `$fields` wrapper adds indirection for named member access
- Per-field fluent getter/setter methods duplicate ~1,500 lines per grammar
- Factory and wrap output have different APIs (fluent vs raw)
- `readNode` serializes through JSON (`serde_json::to_string` then `JSON.parse`)
- The old `fields` / `children` / slot mental model drifts from the clarified
  rule-first ontology established by spec 021

ADR-0018 establishes a new runtime surface: three namespaces (`$`, `_`, unprefixed),
frozen objects, function-call accessors with cursor/value duality, `$with` updaters,
and napi direct property access.

This spec owns the migration to that surface **and** the internal pipeline rewrite
(Binding, Simplify, Assemble) that produces it.

**Implementation order**: surface-first, internals later.

## User Scenarios & Testing _(mandatory)_

### User Story 0 — Assembled model taxonomy collapse (Priority: P1)

A maintainer collapses the 10 assembled-model types into a smaller, more
coherent set: `AssembledNonterminal` (one slot, named or unnamed) replaces
`AssembledField` + `AssembledChild` + `AssembledMulti`; `AssembledLeaf` becomes
the base for `Pattern`/`Keyword`/`Token`/`Enum`; `AssembledGroup` is absorbed
into `AssembledPolymorph`. This is a pure rename — every emitter, validator,
and walker that reads the model is updated to consume the new types, but the
emitted output is byte-identical.

**Why this priority**: This precedes the surface change so emitters consume the
final taxonomy from day one. Doing the surface change first would force a
transient adapter layer in the emitters (read old types, emit new shape).
Landing taxonomy first means every later phase reads one coherent model.

**Independent Test**: After taxonomy phase commits, regenerate all three grammar
packages and compare diffs against pre-phase output. Diff MUST be empty
(byte-identical). All RT modes pass at exactly the same counts as before.

**Acceptance Scenarios**:

1. **Given** the codebase before Phase 1, **When** taxonomy types are renamed and emitters updated, **Then** regenerated grammar package output is byte-identical to before.
2. **Given** the new taxonomy, **When** any reader (emitter, validator, walker) inspects an assembled kind, **Then** it sees `AssembledNonterminal`/`AssembledLeaf`/`AssembledPolymorph`/`AssembledSupertype`/`AssembledBranch` only — no `AssembledField`/`AssembledChild`/`AssembledMulti`/`AssembledGroup` references remain.
3. **Given** an `AssembledNonterminal` with `edgeName` set, **When** consumed by the factory emitter, **Then** it produces a named storage slot. **Given** `edgeName` absent, **Then** it produces `$child` or `$children` based on multiplicity in `values`.
4. **Given** any `AssembledLeaf` subtype (Pattern/Keyword/Token/Enum), **When** consumed by the factory emitter, **Then** it produces a leaf factory with the appropriate validation (regex / fixed text / enum membership).

---

### User Story 1 — De-hoisted storage replaces `$fields` (Priority: P1)

A consumer accesses named members directly on the node without the `$fields` wrapper.
Values are stored with `_`-prefix and accessed via function-call accessors. The
consumer never touches `$fields` again.

**Why this priority**: This is the fundamental shape change. Every other surface
improvement builds on it. Without de-hoisting, the cursor pattern, `$with`, and
napi direct all lack a foundation.

**Independent Test**: Given any factory-produced or wrap-produced node, named member
values are accessible via `node._name` (storage) and `node.name()` (accessor), and
`node.$fields` does not exist.

**Acceptance Scenarios**:

1. **Given** a factory-produced node with named fields, **When** a consumer reads `node._name`, **Then** the stored value is returned directly (string for terminals, NodeData for nonterminals).
2. **Given** a wrap-produced node (from readNode), **When** a consumer calls `node.name()`, **Then** the accessor resolves the value (materializing drill-in stubs if necessary).
3. **Given** any node, **When** a consumer accesses `node.$fields`, **Then** the property is undefined — it does not exist on the object.
4. **Given** a node with an unnamed positional member, **When** the consumer reads `node.$child` or `node.$children`, **Then** the unnamed slot is accessible without any wrapper.

---

### User Story 2 — Function-call accessors with cursor/value duality (Priority: P1)

A consumer calls `node.name()` to get the resolved value, or holds a reference to
`node.name` as a traversal cursor handle. Accessors are non-enumerable functions —
they don't appear in `Object.keys` or `JSON.stringify`.

**Why this priority**: The cursor/value duality is the ergonomic unlock that
justifies function-call syntax over plain property access. It enables lazy drill-in,
future navigation methods, and memoization without API changes.

**Independent Test**: Given a factory node, `typeof node.name === 'function'`,
`node.name()` returns the stored value, `Object.keys(node)` does not include
`'name'`, and `JSON.stringify(node)` serializes only `$`-metadata and `_`-storage.

**Acceptance Scenarios**:

1. **Given** a factory node, **When** `node.name()` is called, **Then** the stored value from `node._name` is returned.
2. **Given** a wrap node with a drill-in stub in `_name`, **When** `node.name()` is called, **Then** the stub is materialized via readNode and the resolved NodeData is returned.
3. **Given** any node, **When** `Object.keys(node)` is called, **Then** accessor function names are NOT included (non-enumerable).
4. **Given** a node reference `const cursor = node.name`, **When** the cursor is inspected, **Then** it is a callable function. In the future it may carry navigation methods.

---

### User Story 3 — Frozen immutable nodes with `$with` updaters (Priority: P1)

A consumer modifies a node by calling `node.$with.name(newValue)` which returns a
new frozen node. The original node is never mutated. All nodes are frozen at
construction.

**Why this priority**: Immutability makes node identity reliable and enables safe
structural sharing. It replaces the mutable fluent-setter pattern that led to
~1,500 lines of duplicated methods per grammar.

**Independent Test**: Given a factory node, `Object.isFrozen(node) === true`, and
calling `node.$with.name(v)` returns a new frozen node where `newNode._name === v`
and `node._name` is unchanged.

**Acceptance Scenarios**:

1. **Given** a factory-produced node, **When** `Object.isFrozen(node)` is checked, **Then** it returns `true`.
2. **Given** any node, **When** `node.$with.name(newValue)` is called, **Then** a NEW frozen node is returned with the updated value, and the original node is unchanged.
3. **Given** a consumer tries `node._name = 'x'`, **When** the assignment executes, **Then** it throws in strict mode (or silently fails in sloppy mode) because the object is frozen.
4. **Given** a `$with` call on a wrap-produced node, **When** the new node is returned, **Then** it has the same shape (accessors, methods, metadata) as the original.

---

### User Story 4 — `$`-prefixed methods replace unprefixed methods (Priority: P2)

A consumer calls `node.$render()`, `node.$toEdit()`, `node.$replace()` instead of
the old `node.render()`, `node.toEdit()`, `node.replace()`. All sittir-owned
methods use `$`-prefix to eliminate collisions with grammar field names.

**Why this priority**: Without `$`-prefix, method names can collide with grammar
field accessors (e.g., a grammar could have a `type` field). The `$` convention
makes the namespace collision-free by construction.

**Independent Test**: Given any node, `node.$render()` produces rendered source
text, and `node.render` is undefined (or is a grammar field accessor if the grammar
has a `render` field).

**Acceptance Scenarios**:

1. **Given** any branch node with a valid template, **When** `node.$render()` is called, **Then** it produces the rendered source text.
2. **Given** any node, **When** `node.$toEdit(range)` is called, **Then** it creates an Edit object for the given byte range.
3. **Given** a grammar with a field named `type`, **When** a consumer accesses `node.type()`, **Then** it resolves the grammar field value (not metadata). `$type` is the sittir metadata.

---

### User Story 5 — Unified factory and wrap surface (Priority: P2)

A consumer gets the same API whether a node came from a factory or from wrap
(readNode). Both have `_`-storage, unprefixed accessors, `$with`, and `$`-prefixed
methods. The only behavioral difference: wrap accessors may perform lazy drill-in.

**Why this priority**: Consumers should not need to know or care about the
provenance of a node. A unified surface enables generic utilities that work on any
NodeData regardless of source.

**Independent Test**: Given a factory node and a wrap node of the same kind, both
have identical `Object.keys()`, identical accessor names, and calling `$with` on
either returns a valid new node.

**Acceptance Scenarios**:

1. **Given** a factory node and a wrap node of kind `function_item`, **When** `Object.keys()` is compared, **Then** both return the same set of `$`-metadata keys and `_`-storage keys.
2. **Given** either node type, **When** `node.name()` is called, **Then** the resolved value is returned (factory: direct; wrap: via drill-in if stub).
3. **Given** either node type, **When** `node.$with.name(v)` is called, **Then** a new frozen node with the updated value is returned.

---

### User Story 6 — napi direct property access (Priority: P2)

The native render path reads NodeData fields by name from the JS object, without
JSON serialization. Transport becomes identity: the stored shape IS the transport
shape. No `serde_json::to_string` then `JSON.parse` round-trip.

**Why this priority**: The JSON round-trip adds measurable latency and allocates
intermediate strings. With de-hoisted storage, `_name` on the JS object IS the
value the native engine needs — direct property access eliminates the translation.

**Independent Test**: Given a factory node passed to the native render engine, the
engine reads `_name` directly via napi `Object::get_named_property`. No JSON
appears in the call path.

**Acceptance Scenarios**:

1. **Given** a factory node, **When** passed to native render, **Then** the engine reads `_name`, `_body` etc. as JS object properties via napi — no JSON serialization.
2. **Given** terminal slot values stored as plain strings, **When** native render reads them, **Then** no NodeData-to-string conversion is needed — transport is identity.
3. **Given** the node carries `$with` and accessor functions, **When** passed to native render, **Then** those non-enumerable properties are ignored — only `$`-metadata and `_`-storage are read.

---

### User Story 7 — Internal pipeline produces the new surface (Priority: P3)

The Binding, Simplify, and Assemble phases are rewritten to produce the de-hoisted
surface directly. Binding attaches terminals to nonterminals. Simplify pushes wrapper
behavior down to constituents. Assemble materializes kinds from normalized
constituent rules.

**Why this priority**: The internal pipeline rewrite is invisible to consumers. It
can land AFTER the surface is stable because the current pipeline can emit the new
shape through adapter projections.

**Independent Test**: After the internal pipeline rewrite, the same RT baselines
pass and the assembled model directly produces `_`-storage + accessors without any
compatibility shim.

**Acceptance Scenarios**:

1. **Given** a kind whose raw rule contains terminals interleaved with nonterminals, **When** Binding runs, **Then** the terminals are associated with the nonterminal constituents they belong with.
2. **Given** `optional(rule)` or `repeat(rule)`, **When** Simplify runs, **Then** optionality and multiplicity become properties of the constituent rule(s).
3. **Given** normalized constituent rules, **When** Assemble runs, **Then** it materializes the kind with `_`-prefixed storage keys and accessor function definitions ready for emission.

---

### Edge Cases

- **Grammar fields named with `$` or `_` prefix**: Tree-sitter field names cannot start with `$` or `_`, so namespace collisions are impossible by construction.
- **Unnamed slots**: A kind with only named members has no `$child` or `$children`. A kind with unnamed members has exactly ONE unnamed slot (`$child` for singular, `$children` for array).
- **Drill-in resolution failure**: If a wrap accessor tries to materialize a stub but the underlying tree has been freed, it must throw a clear error rather than returning undefined.
- **Multiple `$with` chains**: `node.$with.a(x).$with.b(y)` must produce a correct node with both updates applied (each intermediate is a valid frozen node).
- **Empty nodes**: A node with zero named members and no unnamed slot (e.g., a keyword node like `fn`) still has `$type`, `$source`, `$named`, `$text` — it's a valid leaf.
- **Serialization**: `JSON.stringify(node)` produces only `$`-metadata and `_`-storage (no accessor functions, no `$with`, no methods). This must round-trip cleanly for persistence.

## Requirements _(mandatory)_

### Functional Requirements

**Taxonomy (Phase 1 — pure rename)**

- **FR-T01**: `AssembledField`, `AssembledChild`, `AssembledMulti` MUST be collapsed into a single `AssembledNonterminal` type. `edgeName?` distinguishes named (present) from unnamed (absent). `values[]` carries multiplicity.
- **FR-T02**: `AssembledLeaf` MUST become a base class for `AssembledPattern` (open text, optional regex), `AssembledKeyword` (single fixed named string), `AssembledToken` (single fixed anonymous string), `AssembledEnum` (closed set of literals). The current open-text type currently called `AssembledLeaf` becomes `AssembledPattern`.
- **FR-T03**: `AssembledGroup` MUST be absorbed into `AssembledPolymorph` (group form becomes an inline property of polymorph).
- **FR-T04**: `AssembledBranch` MUST absorb `AssembledContainer` and `AssembledMulti` semantics — one structural type for all kinds with nonterminal slots.
- **FR-T05**: At most ONE `AssembledNonterminal` per branch may lack `edgeName` (the unnamed slot constraint).
- **FR-T06**: After Phase 1, generated output (factories, types, wrap, transport) MUST be byte-identical to before. Phase 1 is pure refactor.

**Surface (de-hoist + accessors + freeze)**

- **FR-001**: `$fields` wrapper MUST be removed. Named members MUST be stored as `_`-prefixed top-level keys on the NodeData object.
- **FR-002**: Each named member MUST have a non-enumerable accessor function (unprefixed) that returns the stored value when called.
- **FR-003**: Accessor functions on wrap-produced nodes MUST perform lazy drill-in materialization when the stored value is a stub.
- **FR-004**: All NodeData objects MUST be frozen at construction (`Object.isFrozen(node) === true`).
- **FR-005**: `NodeFieldValue` and `NodeChildValue` MUST be unified into `NodeMemberValue = AnyNodeData | string | number`.
- **FR-006**: Unnamed positional members MUST use `$child` (singular) or `$children` (array). At most ONE unnamed slot per kind.

**`$with` namespace**

- **FR-007**: Per-field fluent getter/setter methods MUST be replaced by a `$with` namespace of immutable updaters.
- **FR-008**: Each `$with.field(v)` MUST return a NEW frozen node via the factory with the specified field updated.
- **FR-009**: `$with` MUST be non-enumerable on the node object.
- **FR-009a**: `$with` MUST include updaters for unnamed slots when present: `$with.$child(value)` for singular unnamed slots and `$with.$children(values)` for array unnamed slots. The `$`-prefix on the updater name mirrors the `$`-prefix on the storage key (`$child`/`$children`), keeping the namespace coherent. (See research R6 for rationale.)

**`$`-prefixed methods**

- **FR-010**: All sittir-owned methods MUST use `$`-prefix: `$render()`, `$toEdit()`, `$replace()`, `$trivia()`.
- **FR-011**: A shared `withMethods` helper MUST attach all `$`-prefixed methods instead of per-factory inline emission.
- **FR-012**: `$`-prefixed methods MUST be non-enumerable.

**Unified surface**

- **FR-013**: Wrap output MUST expose the same accessor functions, `$with` namespace, and `$`-prefixed methods as factory output.
- **FR-014**: The only behavioral difference between factory and wrap accessors MUST be drill-in — wrap accessors MAY materialize stubs; factory accessors return values directly.

**napi direct**

- **FR-015**: Rust NodeData MUST cross napi via direct `FromNapiValue`/`ToNapiValue` reading/writing JS object properties. No JSON serialization round-trip.
- **FR-016**: `$with` and `$`-prefixed methods are JS-side only and MUST NOT cross the napi boundary.
- **FR-017**: Terminal slot values stored as plain strings MUST be readable directly by native render — transport is identity (no NodeData-to-string conversion at runtime).

**Internal pipeline (Binding / Simplify / Assemble)**

- **FR-018**: Binding MUST precede Simplify and MUST attach terminals to the nonterminal constituents they belong with.
- **FR-019**: Simplify MUST push wrapper behavior (`seq`, `choice`, `optional`, `repeat`, `repeat1`, `prec*`) down onto constituent rules.
- **FR-020**: Assemble MUST materialize kinds from normalized constituent rules with parent-edge naming attached where present.
- **FR-021**: Assemble MUST preserve `RuleId` provenance from spec 021 for every constituent it materializes.
- **FR-022**: Any retained compatibility views MUST be derived from the normalized constituent-rule model — not maintained as a second independent discovery pass.

**Migration safety**

- **FR-023**: Each commit MUST pass native RT baselines (python >= 114, rust >= 124, typescript >= 108) and type-check with zero errors.

### Key Entities

- **NodeData** — frozen plain object with three namespaces. The consumer-facing unit of the tree.
- **NodeMemberValue** — `AnyNodeData | string | number`. Unified member value type.
- **`$with` namespace** — non-enumerable object on each node providing per-field immutable updaters.
- **Accessor function** — non-enumerable function per named member. Call = value. Reference = cursor.
- **Stub** — minimal `{ $type, $nodeHandle, $childIndex }` stored in wrap nodes, materialized on access.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-T01**: After Phase 1 commit, `git diff` of regenerated `packages/{rust,typescript,python}/src/` produces zero changed lines (taxonomy rename is byte-identical). _Operationalizes FR-T06._
- **SC-T02**: Zero references to `AssembledField`, `AssembledChild`, `AssembledMulti`, `AssembledGroup` remain after Phase 1 (grep returns empty across `packages/codegen/src/`).
- **SC-001**: Zero references to `$fields` remain in generated output or core runtime.
- **SC-002**: Per-field fluent method emission removed — net ~-1,500 lines across generated factories per grammar.
- **SC-003**: `withMethods` shared helper replaces per-factory inline method emission.
- **SC-004**: `Object.keys(node)` returns only `$`-metadata keys and `_`-storage keys for any node.
- **SC-005**: Native RT pass rates do not regress below baseline: python >= 114, rust >= 124, typescript >= 108.
- **SC-006**: Factory round-trip failure ceilings drop to zero (from rust 15, typescript 25, python 70).
- **SC-007**: `JSON.stringify(anyNode)` produces a clean serialization with no function artifacts.
- **SC-008**: No JSON serialization appears in the native render call path (napi direct verified).
- **SC-009**: All generated factories produce frozen objects (`Object.isFrozen` assertion in tests).
- **SC-010**: `$with` chain produces correct nodes: `node.$with.a(x).$with.b(y)` verified in tests.

## Glossary

- **Compatibility shim** — temporary code introduced during Phases 1-3 that
  bridges old assembled-model accessors or old NodeData shape to the new one
  so each phase can pass the RT gate without requiring downstream phases to
  land first. Phase 4 (FR-022) drops every shim. Concrete examples expected
  to be shims: any `assembleField` / `assembleChild` legacy function paths in
  `assemble.ts`, any `$fields`-shaped fallback in factory or wrap, any
  JSON-serialization fallback in the napi boundary. If a piece of code's
  sole purpose is to keep the previous shape working while the new one is
  introduced, it is a shim.

## Out of Scope

- Defining foundational identity or rule classification (owned by spec 021).
- Replacing `RuleId` with KindID / FieldID metadata.
- Implementing the eventual enum-backed wire format.
- Changing tree-sitter CST semantics for named vs anonymous nodes.
- Cursor navigation methods beyond `.name` reference (`parent()`, `next()`, `children()`, `kind`) — future spec.

## Dependencies & Assumptions

- **Depends on** refined spec 021 for `RuleId`, rule classification, field semantics, alias semantics.
- **Depends on** the five-phase compiler contract from spec 005.
- **Depends on** ADR-0017 (merged): `$nodeHandle` + `$childIndex`, numeric `$source`, ParsedTree/Engine split.
- **Assumes** incremental staged migration with each commit passing all RT gates.
- **Assumes** surface changes land BEFORE internal pipeline rewrite (surface-first order).
- **Migration phases**:
  - **Phase 1** — Taxonomy: collapse `AssembledField`+`AssembledChild`+`AssembledMulti` into `AssembledNonterminal`; introduce `AssembledLeaf` base with `Pattern`/`Keyword`/`Token`/`Enum` subtypes; absorb `AssembledGroup` into `AssembledPolymorph`. Pure rename — RT byte-identical.
  - **Phase 2** — Surface: de-hoist `$fields` to `_`-prefix storage, add accessor functions, freeze nodes, add `$with`, `$`-prefix methods, unified factory/wrap surface.
  - **Phase 3** — Transport: napi direct property access, terminal value identity projection.
  - **Phase 4** — Internals: Binding/Simplify/Assemble rewrite producing the new taxonomy from scratch; remove compatibility shims from earlier phases.
