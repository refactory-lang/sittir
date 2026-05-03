# Data Model: 022 Binding/Simplify/Assemble + De-hoisted NodeData

## Core Entities

### NodeBase (replaces AnyNodeData)

The base shape for all nodes. Named members are top-level keys.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$type` | `number \| string` | Yes | Numeric TSKindId or string for synthesized kinds |
| `$source` | `0 \| 1 \| 2` | No | 0=ts, 1=sg, 2=factory |
| `$variant` | `string` | No | Variant subtype name |
| `$text` | `string` | No | Source text (always on leaves, debug-only on branches) |
| `$span` | `{ start, end }` | No | Byte offset span |
| `$nodeHandle` | `number` | No | Index into engine's node table (ADR-0017) |
| `$childIndex` | `number` | No | Position in parent's child array (ADR-0017) |
| `$named` | `boolean` | No | Named vs anonymous node |
| `$trivia` | `NodeTrivia` | No | Leading/trailing comments |
| `$format` | `FormatRecord` | No | Per-node format override |
| `[fieldName]` | `NodeMemberValue` | Varies | De-hoisted named members |

### NodeWithChildren (Shape B)

Extends NodeBase with repeated unnamed children.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$children` | `readonly NodeMemberValue[]` | Yes | Unnamed positional members |

### NodeWithChild (Shape C)

Extends NodeBase with a single unnamed child.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$child` | `NodeMemberValue` | Yes | Single unnamed member |

### NodeMemberValue (replaces NodeFieldValue + NodeChildValue)

```
NodeMemberValue = AnyNodeData | string | number
```

Terminal values: `string` (leaf text) or `number` (numeric leaf).
Nonterminal values: `AnyNodeData` (branch/container node or drill-in stub).

### AnyNodeData (union)

```
AnyNodeData = NodeBase | NodeWithChildren | NodeWithChild
```

### MemberValue (Rust side)

```rust
pub enum MemberValue {
    Node(Box<NodeData>),
    Text(String),
    Number(f64),
    Array(Vec<MemberValue>),
}
```

## Pipeline Entities

### BindingResult

Output of the Binding phase. Associates terminals with their owning
nonterminal constituent.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ownerKind` | `string` | Yes | The nonterminal kind that owns these members |
| `members` | `BoundMember[]` | Yes | Ordered list of bound constituents |

### BoundMember

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ruleIds` | `RuleId[]` | Yes | Provenance from spec 021 |
| `terminality` | `'terminal' \| 'nonterminal'` | Yes | Classification |
| `edgeName` | `string` | No | Field name (from `field()` wrapper) |

### AssembledKindSurface

Output of Assemble. Materialized kind with constituent metadata.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `kind` | `string` | Yes | Kind name |
| `shape` | `'A' \| 'B' \| 'C'` | Yes | Which NodeData shape this kind uses |
| `members` | `AssembledMember[]` | Yes | Ordered constituents with metadata |

### AssembledMember

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ruleIds` | `RuleId[]` | Yes | Provenance |
| `terminality` | `'terminal' \| 'nonterminal'` | Yes | Classification |
| `edgeName` | `string` | No | Field name |
| `optional` | `boolean` | No | From `optional()` wrapper |
| `repeated` | `boolean` | No | From `repeat()`/`repeat1()` wrapper |
| `order` | `number` | Yes | Position in sequence |

## State Transitions

### Pipeline flow

```
Grammar rules (evaluate output)
  → Binding: attach terminals to nonterminal owners
  → Simplify: push seq/choice/optional/repeat/prec down to constituents
  → Assemble: materialize kinds with shape classification (A/B/C)
  → Emit: generate types, factories ($with), wrap (drillIn), transport
```

### Shape classification (at Assemble)

```
All members have edgeName? → Shape A (all named, no $children/$child)
Any member unnamed + repeated? → Shape B ($children)
Exactly one unnamed + not repeated? → Shape C ($child)
```

## Three-Axis Separation

Per the design doc (`docs/superpowers/specs/2026-04-29-rule-identity-and-binding-split-design.md`),
three axes are kept separate:

| Axis | What it governs | Source |
|------|----------------|--------|
| Sittir ontology | Rule, RuleId, terminal/nonterminal classification | Spec 021 |
| Parent-edge naming | field names (`field(name, rule)` forces nonterminal) | Grammar overrides |
| Tree-sitter CST surface | named vs anonymous node visibility | Parser output |

These often correlate but are NOT the same thing. A child can be field-addressable
and still anonymous on the CST surface. Named alias forces nonterminal even when
the wrapped content started simpler.

## Rule-Form Mapping

| Rule form | Meaning in Binding/Simplify |
|-----------|----------------------------|
| `symbol(...)` | nonterminal constituent |
| `string(...)` / `pattern(...)` | terminal constituent |
| `token(...)` | terminal-forming wrapper; result stays terminal |
| `field(name, rule)` | names the parent edge + forces nonterminal |
| `seq(...)` | ordered composition → assign `order` to constituents |
| `choice(...)` | alternative → resolve by frontier result |
| `optional(rule)` | → set `optional: true` on constituent(s) |
| `repeat(rule)` / `repeat1(rule)` | → set `repeated: true` on constituent(s) |
| `alias(rule, $.Name)` | forces nonterminal; surfaces named CST node |
| `alias(rule, 'lit')` | CST surface only; no ontology change |
| `prec*` | parse metadata; stripped by Simplify |

## Relationships

```
AssembledKindSurface 1──* AssembledMember
AssembledMember *──* RuleId (provenance)
AssembledMember ──> terminality classification
AssembledKindSurface ──> shape (A/B/C) ──> NodeData interface variant
```
