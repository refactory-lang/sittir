# Research: 022 De-hoisted NodeData Surface

**Source of truth**: `docs/adr/0018-dehoist-nodedata-surface.md`
**Design origin**: `docs/superpowers/specs/2026-04-29-rule-identity-and-binding-split-design.md`

All decisions below trace back to ADR-0018 (accepted 2026-05-03 after a multi-turn
brainstorming session that resolved the design space).

## R1: napi crossing — direct property access (no JSON round-trip)

**Decision**: Cross the napi boundary via `FromNapiValue` / `ToNapiValue`
implementations that read JS object properties by name. No `serde_json::to_string`
then `JSON.parse` round-trip. No `HashMap<String, MemberValue>`. No
`#[serde(flatten)]`.

**Rationale**: With de-hoisted storage (`_name` as a top-level enumerable
property), Rust can read the value directly via `Object::get_named_property`. The
JSON intermediate is pure overhead — it allocates a string, parses it, then
discards both. Per-kind transport structs already do direct property access; the
generic `NodeData` can do the same with a lookup table keyed by storage name.

**Alternatives considered**:
- **`#[serde(flatten)]` + HashMap** — rejected: serde JSON intermediate is
  unnecessary when napi already provides typed property accessors. HashMap adds
  string allocations and hash lookups in the hot path.
- **Manual Serialize/Deserialize with field-aware dispatch** — rejected for the
  same reason; serde is the wrong layer.

**Supersedes**: prior R1 in this file (2026-05-03 decision overrides
2026-04-29 placeholder which assumed serde flatten).

## R2: `$with` namespace — plain object with closures

**Decision**: Plain object literal with per-field closures, generated at
construction time. Each accessor is a one-liner
`(v) => factory({ ...config, name: v })`. The `$with` object is non-enumerable on
the parent NodeData.

**Rationale**: Closures close over the config and the factory function. No Proxy
indirection, no runtime metaprogramming. The `$with` object is small (one closure
per field, typically 3-10 fields) and discoverable by TypeScript autocomplete via
the generated type definition.

**Alternatives considered**:
- **ES Proxy with `get` trap** — rejected: Proxy is slower than direct property
  access, invisible to TypeScript's type system (no autocompletion), and harder
  to debug in stack traces.
- **Prototype-based methods** — rejected: closures over config are simpler and
  don't require `this` binding; freezing the prototype is clumsy.

## R3: Accessor pattern — non-enumerable function on the instance

**Decision**: Generate non-enumerable function properties on each NodeData
instance via `Object.defineProperty(node, 'name', { value: function() { ... },
enumerable: false })`. Accessors capture the instance via the function's `this`
binding (not closure capture — closures would prevent the cursor/value duality
where the function reference is the cursor handle).

**Rationale**:
- Non-enumerable: `Object.keys` and `JSON.stringify` see only `$`-metadata and
  `_`-storage. Functions don't pollute iteration.
- Function instead of native getter: getters trigger on `Object.keys` and
  `JSON.stringify` enumeration — they can't be hidden. Functions can.
- Cursor/value duality: `node.name` returns the function reference (cursor);
  `node.name()` calls it (value). Future cursor methods (`parent()`, `next()`,
  `kind`) can attach to the function without breaking value resolution.

**Alternatives considered**:
- **Native getter `get name()`** — rejected: triggers on enumeration; can't
  evolve to cursor pattern.
- **Plain property access (`node.name = value`)** — rejected: can't intercept
  for lazy drill-in (wrap nodes); incompatible with frozen objects (drill-in
  needs to materialize lazily).

## R4: Frozen objects — `Object.freeze` at construction

**Decision**: Call `Object.freeze(node)` as the last step of factory and wrap
construction. Freeze applies to the top-level object; `_`-storage values that are
themselves NodeData are frozen by their own factory; arrays in `_`-storage are
frozen separately.

**Rationale**: Immutability makes node identity reliable, enables safe structural
sharing in `$with` chains, and prevents accidental mutation by consumers. The
runtime cost is negligible (freeze is O(1) per object after the first call;
ECMAScript engines optimize frozen-object access paths).

**Drill-in tension**: Wrap accessors must materialize stubs lazily, but the
parent node is frozen. Resolution: accessors do NOT mutate `_name` to cache the
materialized value — they return the materialized value directly each call.
Optional optimization (Phase 2+): closure-scoped WeakMap keyed by stub identity
for memoization.

**Alternatives considered**:
- **Freeze-after-first-access** — rejected: violates "frozen at construction"
  guarantee; consumer can observe a transient mutable state.
- **Skip freeze** — rejected: mutation footguns proliferate without it; `$with`
  loses its safety story.

## R5: `$child` vs `$children` — mutual exclusivity at the type level

**Decision**: Enforced via the `AnyNodeData` union
(`NodeBase | NodeWithChildren | NodeWithChild`). At runtime, exactly one of
`$child` or `$children` is present (or neither, for kinds with only named
members). The assembler classifies each kind into exactly one shape at codegen
time — runtime detection is forbidden (DRY: the fact is statically known).

**Edge case**: Kinds with BOTH named fields AND unnamed members (e.g., `block`
with `label` field plus statements as unnamed children) are valid. They have
named fields as top-level keys (`_label`) AND `$children` for the unnamed slot.
The assembled-model `AssembledBranch.slots` Record represents this naturally:
the named fields keyed by their grammar names plus a `'children'` entry keyed
literally `'children'` for the unnamed positional content.

**Alternatives considered**:
- **Runtime shape detection (`'$children' in node`)** — rejected: re-derives a
  fact the assembler already computed; DRY violation per Constitution XI.
- **Always include both keys (`$child: undefined, $children: []` for unused)** —
  rejected: pollutes the surface; consumer iteration sees noise.

## R6: $with for unnamed slots ($child / $children)

**Decision**: `$with` includes updaters for unnamed slots when present.
Naming follows the storage key:
- `$with.$child(v)` updates the singular unnamed slot
- `$with.$children([...])` replaces the array
- For named members: `$with.<fieldName>(v)`

**Rationale**: Symmetry — every storage slot has a matching `$with` updater.
The `$`-prefix on the unnamed-slot updaters mirrors the `$`-prefix on the storage
key, keeping the namespace coherent. Array updates are full replacement (not
push/splice) because the node is frozen and immutability requires returning a
new array.

**Alternatives considered**:
- **`$with.child(v)` / `$with.children([...])` (no `$`)** — rejected: drops the
  prefix mid-namespace; reader has to remember which keys are `$`-prefixed
  (storage) vs not (named-field updaters).
- **Skip unnamed-slot updaters** — rejected: leaves consumers unable to
  immutably update unnamed children, forcing them to construct a fresh node from
  scratch.

## R7: Migration grep patterns

**Decision**: Phase 1 transforms are greppable with sed/codemod for consumer
code. Generated code is regenerated by codegen.

| Pattern | Search | Replace |
|---------|--------|---------|
| Field access | `.$fields.<name>` | `.<name>()` |
| Setter call | `.<name>(v)` (with args) | `.$with.<name>(v)` |
| Render | `.render()` | `.$render()` |
| ToEdit | `.toEdit(` | `.$toEdit(` |
| Replace | `.replace(` | `.$replace(` |
| Trivia | `.trivia(` | `.$trivia(` |

The setter→`$with` pattern is structurally distinguishable: getters take no args,
setters take one. AST-grep can disambiguate; sed cannot reliably.

**Recommendation**: Use ast-grep for consumer migration; rely on codegen
regeneration for generated files.

## R8: Frozen array semantics for `_`-storage

**Decision**: Arrays stored in `_`-storage (e.g., `_parameters: Param[]`) are
themselves frozen (`Object.freeze` applied to the array). `$with.parameters([...])`
replaces the array entirely with a new frozen array.

**Rationale**: A frozen NodeData containing a mutable array would let consumers
do `node._parameters.push(x)` — defeating the freeze guarantee. Freezing the
array prevents this.

**Alternatives considered**:
- **`ReadonlyArray<T>` type without freeze** — rejected: TypeScript-only, no
  runtime enforcement. Consumers using `as Param[]` casts would bypass.
- **Defensive copy on read** — rejected: every `node.parameters()` call
  allocates a new array; defeats accessor performance story.

## No unknowns remain

All design decisions in spec FR-001 through FR-023 trace to a research entry
above or to ADR-0018 directly. The assembled model taxonomy (AssembledBranch /
Nonterminal / Leaf / etc.) is explicitly DRAFT in the spec and out of scope for
Phase 1 — finalizing it is a Phase 3 concern.
