# Data Model: 022 De-hoisted NodeData

> ⚠️ **Status:** Phase 1–3 of this spec landed with naming
> divergence from the design below (e.g. `AssembledContainer` →
> `AssembledBranch`, `AssembledField`/`Child` → `AssembledNonterminal`,
> `$fields` envelope → `_<name>` storage). Read
> [`IMPLEMENTATION-STATUS.md`](./IMPLEMENTATION-STATUS.md) **first** for the planned-→shipped
> mapping; this file remains as design rationale.

Source of truth: `docs/adr/0018-dehoist-nodedata-surface.md`

## Runtime Surface (what consumers hold)

Frozen object with three namespaces:

### `$`-prefixed — metadata + methods (sittir-owned)

| Key | Type | Enumerable | Notes |
|-----|------|-----------|-------|
| `$type` | `number \| string` | Yes | TSKindId or synthesized kind name |
| `$source` | `0 \| 1 \| 2` | Yes | 0=ts, 1=sg, 2=factory |
| `$named` | `boolean` | Yes | Named vs anonymous |
| `$text` | `string` | Yes | Leaf text / debug branch text |
| `$span` | `{ start, end }` | Yes | Byte offset span |
| `$nodeHandle` | `number` | Yes | Engine node table index (ADR-0017) |
| `$childIndex` | `number` | Yes | Position in parent children (ADR-0017) |
| `$variant` | `string` | Yes | Variant subtype |
| `$trivia` | `NodeTrivia` | Yes | Leading/trailing comments |
| `$format` | `FormatRecord` | Yes | Per-node format override |
| `$child` | `NodeMemberValue` | Yes | Single unnamed constituent |
| `$children` | `NodeMemberValue[]` | Yes | Repeated unnamed constituents |
| `$with` | `{ field(v) }` | No | Immutable updaters |
| `$render()` | `() => string` | No | Render to source |
| `$toEdit()` | `(...) => Edit` | No | Create edit |
| `$replace()` | `(target) => Edit` | No | Replace target |
| `$trivia()` | `(...) => Node` | No | Attach comments |

### `_`-prefixed — storage (private data)

| Key | Type | Enumerable | Notes |
|-----|------|-----------|-------|
| `_fieldName` | `NodeMemberValue` | Yes | Stored value for each named slot |

Terminal slots store plain strings. Nonterminal slots store NodeData
(or drill-in stubs with `$nodeHandle` + `$childIndex`).

### Unprefixed — accessor functions (consumer API)

| Key | Type | Enumerable | Notes |
|-----|------|-----------|-------|
| `fieldName` | `() => NodeMemberValue` | **No** | Call = resolve value. Reference = cursor handle. |

`fn.name` = cursor/traversal handle (the function reference).
`fn.name()` = resolved value (call evaluates).

Future: cursor can grow methods (`parent()`, `next()`, `children()`, `kind`).

### NodeMemberValue

```
NodeMemberValue = AnyNodeData | string | number
```

### $child / $children (mutually exclusive)

At most ONE unnamed slot per kind:
- `$child: NodeMemberValue` — singular arity
- `$children: NodeMemberValue[]` — array arity
- Neither present — all members are named

Determined by the slot's values' multiplicity in the assembled model.

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

## Assembled Model Taxonomy

**Status**: Finalized 2026-05-03.

### Map from current to new

| Current (10 types) | New | Rationale |
|---|---|---|
| `AssembledBranch` | `AssembledBranch` | Stays — absorbs Container + Multi |
| `AssembledContainer` | `AssembledBranch` | Same as Branch — unnamed slot has no `edgeName` |
| `AssembledMulti` | **Removed** | Repeat is a multiplicity on the slot's values, not a separate type |
| `AssembledField` | `AssembledNonterminal` | Slot with `edgeName` |
| `AssembledChild` | `AssembledNonterminal` | Slot without `edgeName` |
| `AssembledPolymorph` | `AssembledPolymorph` | Stays — choice-of-kinds dispatch |
| `AssembledLeaf` | `AssembledPattern` | Renamed — open text, optionally pattern-validated |
| `AssembledKeyword` | `AssembledKeyword` | Stays — extends `AssembledLeaf` base |
| `AssembledToken` | `AssembledToken` | Stays — extends `AssembledLeaf` base |
| `AssembledEnum` | `AssembledEnum` | Stays — extends `AssembledLeaf` base |
| `AssembledSupertype` | `AssembledSupertype` | Stays — union of subtypes |
| `AssembledGroup` | Absorbed into `AssembledPolymorph` | Polymorph form = inline property |

**Final taxonomy:**
- `AssembledBranch` — structural kind with nonterminal slots
- `AssembledNonterminal` — one slot (named or unnamed)
- `AssembledLeaf` — base for non-branch kinds (no slots)
  - `AssembledPattern` — open text, optional regex
  - `AssembledKeyword` — single fixed named string
  - `AssembledToken` — single fixed anonymous string
  - `AssembledEnum` — closed set of literals
- `AssembledPolymorph` — choice-of-kinds dispatch
- `AssembledSupertype` — union of subtypes

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

### AssembledLeaf (base for all non-branch kinds)

No slots, no constituents. Renders as `$text`. Shared by all leaf
subtypes.

```ts
abstract class AssembledLeaf {
  kind: string;
  // typeName, irKey, rawFactoryName, userFacing, etc.
}
```

#### AssembledPattern (replaces current "AssembledLeaf")

Open-valued text, optionally regex-validated. e.g. `identifier`, `integer_literal`.

```ts
class AssembledPattern extends AssembledLeaf {
  pattern?: string;   // undefined = accept anything, present = validate
}
```

#### AssembledKeyword (stays)

Single fixed named string. e.g. `"fn"`, `"let"`, `"async"`.

```ts
class AssembledKeyword extends AssembledLeaf {
  text: string;       // the one allowed value
}
```

#### AssembledToken (stays)

Single fixed anonymous delimiter. e.g. `"{"`, `";"`, `","`.

```ts
class AssembledToken extends AssembledLeaf {
  text: string;       // the one allowed value
}
```

#### AssembledEnum (stays)

Closed set of string literals. e.g. `"+=" | "-=" | "*="`.

```ts
class AssembledEnum extends AssembledLeaf {
  values: string[];   // the allowed members
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

Reflects the locked design (2026-05-03 brainstorm; see Phase 1d in `tasks.md`):

```
AssembledNode  (sum type — Branch | Pattern | Keyword | Token | Enum | Polymorph | Supertype)
    │
    ├── AssembledBranch
    │       slots: Readonly<Record<string, AssembledNonterminal>>
    │       (frozen, eagerly validated at construction:
    │         - duplicate keys → throw
    │         - >1 unnamed slot ('child' / 'children') → throw
    │         - mixed-arity values within a slot → warn)
    │
    └── AssembledLeaf  (abstract base)
            └── AssembledPattern   (open text, optional regex)
            └── AssembledKeyword   (single fixed named string)
            └── AssembledToken     (single fixed anonymous string)
            └── AssembledEnum      (closed set of literals)

AssembledBranch.slots[key]  →  AssembledNonterminal
    key:  grammar field name  OR  'child' / 'children' for truly-unnamed positional content
    insertion order:  declared rule order

AssembledNonterminal.values: readonly NodeOrTerminal[]
    Each value carries its own multiplicity, separator, trailing, leading.
    Per-value metadata replaces the prior per-slot hasTrailing / hasLeading flags.

NodeOrTerminal:
    NodeRef       { node: AssembledNode | UnresolvedRef, multiplicity, separator?, trailing?, leading? }
    TerminalValue { value: string,                       multiplicity, separator?, trailing?, leading? }

Helpers:
    kindsOf(slot)  →  derives the kind set from slot.values (replaces deleted KindProjection)
    deriveSlots(rule) →  single walk producing slots in declared order
                          (replaces deleted deriveFields / deriveChildren / deriveFieldsRaw /
                           findFieldsWithRepeatFlag / findRepeatSeparator / findRepeatFlag)
```

**Eliminated in Phase 1d** (do not appear above): `AssembledChild` interface,
`AssembledContainer` class, `AssembledField` (renamed to `AssembledNonterminal`),
`KindProjection`, `ProjectionContext`, `NodeMap.projections`, `AssembledNodeBase.structuralFields`,
`AssembledNodeBase.structuralChildren`.

**Eliminated in Phase 4** (alongside Binding/Simplify rewrite): `AssembledMulti`
(folded into per-value multiplicity), `AssembledGroup` (absorbed into
`AssembledPolymorph.forms[]` and `AssembledBranch` for standalone hidden seqs).

**Branch / Container distinction** is gone: `AssembledBranch` carries every
kind that has constituent slots, regardless of whether they are named fields,
unnamed positional content, or both. The discriminator `hasNamedSlots(branch)`
exists for the few emitter sites that need to gate on field-bearing behavior.
