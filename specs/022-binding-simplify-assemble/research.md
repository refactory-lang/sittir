# Research: 022 Binding/Simplify/Assemble + De-hoisted NodeData

**Design origin**: `docs/superpowers/specs/2026-04-29-rule-identity-and-binding-split-design.md`
— defines the 021/022 split, three-axis separation, and rule-form mapping.

## R1: `#[serde(flatten)]` performance with `HashMap<String, MemberValue>`

**Decision**: Use `#[serde(flatten)]` for named members on Rust `NodeData`.

**Rationale**: serde's flatten with HashMap is well-supported and the
standard pattern for mixed known + dynamic fields. Performance is adequate
for our use case (codegen output, not hot-path parsing). The alternative
(manual Serialize/Deserialize) adds complexity for no measurable gain —
NodeData serialization is already dominated by template rendering time.

**Alternatives considered**:
- Manual Serialize/Deserialize with field-aware dispatch — rejected:
  per-grammar field sets change at codegen time, HashMap is the right
  abstraction for dynamic keys.
- `serde_json::Value` instead of typed `MemberValue` — rejected: loses
  type safety at the Rust boundary.

## R2: `$with` namespace — object vs Proxy

**Decision**: Plain object with per-field closures, generated at
construction time.

**Rationale**: Closures close over the config and the factory function.
No Proxy indirection, no runtime metaprogramming. The `$with` object is
created once per factory call. Each method is a one-liner
(`(v) => factory({ ...config, field: v })`). The object is small
(one closure per field, typically 3-10 fields).

**Alternatives considered**:
- ES Proxy with `get` trap — rejected: Proxy is slower than direct
  property access, invisible to TypeScript's type system (no
  autocompletion), and harder to debug.
- Prototype-based methods — rejected: closures over config are simpler
  and don't require `this` binding.

## R3: Shape A/B/C discrimination at emit time

**Decision**: The constituent model from Binding + Simplify determines
which shape each kind uses. The classification is:

- **Shape A (all named)**: every constituent has an `edgeName` (field).
  No unnamed positional constituents.
- **Shape B (`$children`)**: kind has unnamed constituents with
  `repeated: true`. Uses `$children: readonly NodeMemberValue[]`.
- **Shape C (`$child`)**: kind has exactly one unnamed constituent with
  `repeated: false`. Uses `$child: NodeMemberValue`.

The classification is computed once during Assemble and stored on the
`AssembledNode`. Emitters read it directly — no re-derivation.

**Alternatives considered**:
- Runtime shape detection via `'$children' in node` — rejected: the
  shape is statically known at codegen time. Runtime detection is a
  DRY violation (re-deriving a fact the assembler already computed).

## R4: Migration grep patterns

**Decision**: Phase 2 transforms are greppable:

| Pattern | Search | Replace |
|---------|--------|---------|
| Field access | `.$fields.` | `.` |
| Getter call | `.name()` (no args) | `.name` |
| Setter call | `.name(v)` (with args) | `.$with.name(v)` |
| Render | `.render()` | `.$render()` |
| ToEdit | `.toEdit(` | `.$toEdit(` |
| Replace | `.replace(` | `.$replace(` |
| Trivia | `.trivia(` | `.$trivia(` |

Consumer packages can be migrated with sed/codemod. The factory emitter
change handles generated code; consumer code needs the grep-replace.

## R5: `$child` vs `$children` — mutual exclusivity

**Decision**: Enforced at the type level via `AnyNodeData` union
(`NodeBase | NodeWithChildren | NodeWithChild`). At runtime, only one
of `$child` or `$children` is present (the other is `undefined`/absent).
The assembler classifies each kind into exactly one shape.

**Edge case**: kinds that have BOTH named fields AND unnamed children
(e.g., `block` with `label` field + `$children` statements) are Shape B
with the named fields as top-level properties alongside `$children`.

**No unknowns remain.**
