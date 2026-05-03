# Data Model: 022 Binding/Simplify/Assemble + De-hoisted NodeData

## Core Entities

### AnyNodeData (runtime surface)

One frozen shape for all nodes. Named members are top-level keys. At most
one unnamed slot maps to `$child` (singular) or `$children` (array).

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
| `$child` | `NodeMemberValue` | No | Single unnamed constituent (mutually exclusive with `$children`) |
| `$children` | `readonly NodeMemberValue[]` | No | Repeated unnamed constituents (mutually exclusive with `$child`) |
| `[fieldName]` | `NodeMemberValue` | Varies | De-hoisted named members (from slots with `edgeName`) |

Object is **frozen**. `$with` returns a new frozen node.

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

## Assembled Model Taxonomy (4 types)

### Map from current to new

| Current (10 types) | New | Rationale |
|---|---|---|
| `AssembledBranch` | `AssembledBranch` | Stays — absorbs Container + Multi |
| `AssembledContainer` | `AssembledBranch` | Same as Branch — unnamed slot has no `edgeName` |
| `AssembledMulti` | `AssembledBranch` | Same — one array slot |
| `AssembledField` | `AssembledNonterminal` | Slot with `edgeName` |
| `AssembledChild` | `AssembledNonterminal` | Slot without `edgeName` |
| `AssembledPolymorph` | `AssembledPolymorph` | Stays — choice-of-kinds dispatch |
| `AssembledLeaf` | `AssembledTerminal` | Pattern-matched text |
| `AssembledKeyword` | `AssembledTerminal` | Single fixed string |
| `AssembledToken` | `AssembledTerminal` | Anonymous delimiter |
| `AssembledEnum` | `AssembledTerminal` | Choice of fixed strings |
| `AssembledSupertype` | `AssembledSupertype` | Stays — union of subtypes |
| `AssembledGroup` | Absorbed into `AssembledPolymorph` | Polymorph form = inline property |

**5 types** total: `AssembledBranch`, `AssembledNonterminal` (slot), `AssembledTerminal`, `AssembledPolymorph`, `AssembledSupertype`.

### AssembledBranch (absorbs Container + Multi)

A `seq(...)` rule with ordered nonterminal slots. ONE type for all
structural kinds.

```ts
interface AssembledBranch {
  kind: string;
  slots: readonly AssembledNonterminal[];
  // ... existing metadata: typeName, irKey, rawFactoryName, userFacing, etc.
}
```

### AssembledNonterminal (replaces AssembledField + AssembledChild)

One slot in a branch. Collapses Field + Child into one construct — both
had `values: readonly NodeOrTerminal[]`. The only distinction was `name`
(present on Field, absent on Child) → now `edgeName`.

```ts
interface AssembledNonterminal {
  edgeName?: string;                    // present → named (top-level key on NodeData)
                                        // absent → the ONE unnamed slot ($child or $children)
  values: readonly NodeOrTerminal[];    // per-type: { kind, multiplicity }
}
```

Slot-level derivations (already exist as helpers):
- `isRequired(slot)` → all values non-optional
- `isMultiple(slot)` → any value has array/nonEmptyArray multiplicity

Runtime mapping:
- `slot.edgeName` present + `isMultiple(slot)` → `node.fieldName: T[]`
- `slot.edgeName` present + `!isMultiple(slot)` → `node.fieldName: T`
- `slot.edgeName` absent + `isMultiple(slot)` → `node.$children: T[]`
- `slot.edgeName` absent + `!isMultiple(slot)` → `node.$child: T`

**Constraint**: at most ONE slot per branch may lack `edgeName`.

### AssembledTerminal

Replaces Leaf + Keyword + Token + Enum. Renders as `$text`.

```ts
interface AssembledTerminal {
  kind: string;
  terminalType: 'leaf' | 'keyword' | 'token' | 'enum';
  text?: string;        // fixed text for keyword/token
  values?: string[];    // enum member literals
  pattern?: string;     // regex for leaf validation
}
```

### AssembledPolymorph

Stays. Top-level `choice($.kindA, $.kindB, ...)` where each arm is a
distinct kind. Forms are inline (no separate AssembledGroup class).

### AssembledSupertype

Stays. Grammar `supertypes` declaration — union of subtype kinds.

## NodeOrTerminal (per-value within a slot)

Already exists. Each entry in a slot's `values` array:

```ts
interface NodeRef {
  kind: 'node-ref';
  node: AssembledNode | UnresolvedRef;
  multiplicity: 'optional' | 'single' | 'array' | 'nonEmptyArray';
}

interface TerminalValue {
  kind: 'terminal';
  value: string;
  multiplicity: Multiplicity;
}

type NodeOrTerminal = NodeRef | TerminalValue;
```

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
