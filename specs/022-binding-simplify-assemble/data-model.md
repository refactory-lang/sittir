# Data Model: 022 Binding/Simplify/Assemble + De-hoisted NodeData

## Core Entities

### AnyNodeData (single type, replaces current AnyNodeData)

One shape for all nodes. Named members are top-level keys. Unnamed positional
members go in optional `$children`. No separate Shape A/B/C types — the
distinction is just "does this kind have unnamed positional members?"

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
| `$children` | `readonly NodeMemberValue[]` | No | Unnamed positional members (omitted when all members are named) |
| `[fieldName]` | `NodeMemberValue` | Varies | De-hoisted named members |

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

### Rust side

No `HashMap<String, MemberValue>` or serde flatten. Rust reads/writes
NodeData via napi direct property access (per-kind transport structs
already do this). The generic `NodeData` becomes a thin napi read helper,
not a serialized intermediate.

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
Collapses current `AssembledBranch` / `AssembledContainer` / `AssembledMulti`
into one type — whether members are named or positional is a member property.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `kind` | `string` | Yes | Kind name |
| `members` | `AssembledMember[]` | Yes | Ordered constituents with metadata |
| `hasUnnamedChildren` | `boolean` | Yes | True if any member lacks `edgeName` (→ `$children` on NodeData) |

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

### $children determination (at Assemble)

```
All members have edgeName? → no $children (named fields only)
Any member lacks edgeName? → $children present (unnamed positional members)
```

This replaces the current branch/container/multi split with a single
assembled type that reads `hasUnnamedChildren` from its member list.

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
