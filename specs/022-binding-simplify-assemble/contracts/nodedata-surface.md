# Contract: NodeData Runtime Surface

> ⚠️ **Status:** Phase 1–3 of this spec landed with naming
> divergence from the design below (e.g. `AssembledContainer` →
> `AssembledBranch`, `AssembledField`/`Child` → `AssembledNonterminal`,
> `$fields` envelope → `_<name>` storage). Read
> [`IMPLEMENTATION-STATUS.md`](../IMPLEMENTATION-STATUS.md) **first** for the planned-→shipped
> mapping; this file remains as design rationale.

The shape every consumer of a per-grammar package sees. Stable across
factory and wrap output (US5).

## Object structure

```ts
const node = {
  // ── $-prefixed: sittir metadata + methods ──────────────────────────

  // Enumerable metadata (read directly):
  $type: 42,                  // TSKindId (number) | synthesized kind name (string)
  $source: 0,                 // 0 = ts, 1 = sg, 2 = factory
  $named: true,               // boolean: named vs anonymous
  $text: "fn main()",         // string: leaf text or debug branch text
  $span: { start, end },      // ByteRange
  $nodeHandle: 7,             // u32: engine node table index (ADR-0017, optional)
  $childIndex: 2,             // u16: position in parent children (ADR-0017, optional)
  $variant?: "binary",        // string: variant subtype if polymorph
  $trivia?: NodeTrivia,       // leading/trailing comments
  $format?: FormatRecord,     // per-node format override

  // Unnamed slot (at most ONE per kind):
  $child?: NodeMemberValue,        // singular unnamed
  $children?: NodeMemberValue[],   // array unnamed (frozen array)

  // Non-enumerable methods + namespace:
  $with: { /* per-field/slot updaters — see below */ },
  $render(): string,
  $toEdit(range: ByteRange): Edit,
  $replace(target: AnyNodeData): Edit,
  $trivia(...): AnyNodeData,

  // ── _-prefixed: storage (enumerable serializable data) ─────────────

  _name: "main",              // NodeMemberValue per named slot
  _body: { ... },             // NodeData (factory) or stub (wrap)
  _parameters: [...],         // frozen array

  // ── unprefixed: accessors (non-enumerable functions) ───────────────

  name(): NodeMemberValue,    // calls return value
  body(): NodeMemberValue,    // wrap: materializes stub if needed
  parameters(): NodeMemberValue[],
};

Object.isFrozen(node) === true;   // always
Object.keys(node);                // returns only $-metadata + _-storage
JSON.stringify(node);             // serializes only $-metadata + _-storage
```

## Type definitions (in `@sittir/types`)

```ts
type NodeMemberValue = AnyNodeData | string | number;

interface NodeBase {
  readonly $type: number | string;
  readonly $source: 0 | 1 | 2;
  readonly $named: boolean;
  readonly $text?: string;
  readonly $span?: ByteRange;
  readonly $nodeHandle?: number;
  readonly $childIndex?: number;
  readonly $variant?: string;
  readonly $trivia?: NodeTrivia;
  readonly $format?: FormatRecord;
}

interface NodeWithChild extends NodeBase {
  readonly $child: NodeMemberValue;
}

interface NodeWithChildren extends NodeBase {
  readonly $children: readonly NodeMemberValue[];
}

type AnyNodeData = NodeBase | NodeWithChild | NodeWithChildren;
```

The unnamed-slot constraint (at most one of `$child` / `$children`) is
enforced at codegen time via the assembled model — the runtime union does
not encode "exactly one or neither" because TypeScript's union narrowing
handles it adequately via `'$child' in node` / `'$children' in node`
discrimination when needed.

## $with namespace

Per-storage-slot updaters. Each returns a NEW frozen node via the factory.

```ts
node.$with.<fieldName>(value: NodeMemberValue): AnyNodeData;
node.$with.$child(value: NodeMemberValue): AnyNodeData;
node.$with.$children(values: readonly NodeMemberValue[]): AnyNodeData;
```

Naming rule: matches the storage key. `_name` storage → `$with.name(v)`.
`$child` storage → `$with.$child(v)` (preserves the `$`-prefix).

Chaining is supported because each update returns a valid NodeData:

```ts
node.$with.name(x).$with.body(y).$with.$children([a, b]);
```

## Accessor semantics

- **Factory accessor**: returns `_<name>` directly. Value-identical to the
  stored value.
- **Wrap accessor**: if `_<name>` is a stub (`{ $type, $nodeHandle, $childIndex }`),
  materialize via `readNode(tree, $nodeHandle, $childIndex)` and return the
  resolved value. Does NOT mutate `_<name>` — frozen.
- **Cursor reference**: `node.<name>` (without call) is the function reference.
  Used as a traversal handle. May gain navigation methods in future specs.

## Constraints

| Constraint | Enforcement |
|---|---|
| `Object.isFrozen(node) === true` | factory + wrap call `Object.freeze` last |
| `_`-storage arrays frozen | factory + wrap call `Object.freeze` on arrays before assignment |
| Accessors non-enumerable | `Object.defineProperty(..., { enumerable: false })` |
| `$with` non-enumerable | same as above |
| `$`-prefix methods non-enumerable | same as above |
| At most one unnamed slot | assembled model classifies kind; emitter emits exactly one of `$child`/`$children` (or neither) |

## Compatibility

This is a BREAKING change for any consumer that reads `node.$fields.<name>`
or calls `node.<name>(value)` as a setter. Migration path:

| Old | New |
|---|---|
| `node.$fields.name` | `node.name()` |
| `node.name()` (getter) | `node.name()` |
| `node.name(v)` (setter) | `node.$with.name(v)` |
| `node.render()` | `node.$render()` |
| `node.toEdit(r)` | `node.$toEdit(r)` |
| `node.replace(t)` | `node.$replace(t)` |
| `node.trivia(...)` | `node.$trivia(...)` |
