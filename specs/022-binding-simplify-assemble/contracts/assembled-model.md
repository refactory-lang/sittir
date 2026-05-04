# Contract: Assembled Model API

> ⚠️ **Status:** Phase 1–3 of this spec landed with naming
> divergence from the design below (e.g. `AssembledContainer` →
> `AssembledBranch`, `AssembledField`/`Child` → `AssembledNonterminal`,
> `$fields` envelope → `_<name>` storage). Read
> [`IMPLEMENTATION-STATUS.md`](../IMPLEMENTATION-STATUS.md) **first** for the planned-→shipped
> mapping; this file remains as design rationale.

The internal API the codegen pipeline exposes between Assemble and the
emitters. Phase 1 collapses the current 10 types into the set below.

## Type hierarchy

```
AssembledNode  (sum type)
├── AssembledBranch       — structural kind with nonterminal slots
├── AssembledLeaf  (base) — non-branch kinds (no slots)
│   ├── AssembledPattern  — open text, optional regex
│   ├── AssembledKeyword  — single fixed named string
│   ├── AssembledToken    — single fixed anonymous string
│   └── AssembledEnum     — closed set of literals
├── AssembledPolymorph    — choice-of-kinds dispatch (absorbs old AssembledGroup)
└── AssembledSupertype    — union of subtypes
```

## AssembledBranch

```ts
interface AssembledBranch {
  readonly kind: 'branch';
  readonly name: string;                          // grammar kind name
  readonly slots: readonly AssembledNonterminal[]; // ordered constituents
  // existing metadata preserved as-is:
  readonly typeName: string;
  readonly irKey: string;
  readonly rawFactoryName: string;
  readonly userFacing: boolean;
}
```

Replaces `AssembledBranch` + `AssembledContainer` + `AssembledMulti`.
A branch with `slots[i].edgeName === undefined` for some `i` has an
unnamed constituent — at most one such slot per branch.

## AssembledNonterminal

```ts
interface AssembledNonterminal {
  readonly edgeName?: string;                  // present → named; absent → unnamed
  readonly values: readonly NodeOrTerminal[];  // possible values with multiplicities
}

type NodeOrTerminal = NodeRef | TerminalValue;

interface NodeRef {
  readonly kind: 'node-ref';
  readonly node: AssembledNode | UnresolvedRef;
  readonly multiplicity: 'optional' | 'single' | 'array' | 'nonEmptyArray';
}

interface TerminalValue {
  readonly kind: 'terminal';
  readonly value: string;
  readonly multiplicity: 'optional' | 'single' | 'array' | 'nonEmptyArray';
}
```

Replaces `AssembledField` (had `edgeName`) + `AssembledChild` (no `edgeName`).
The `values[]` array carries multiplicity per value, eliminating the need for
a separate `AssembledMulti` wrapper.

### Slot derivations (helpers)

```ts
function isRequired(slot: AssembledNonterminal): boolean;
function isMultiple(slot: AssembledNonterminal): boolean;
```

Runtime-shape projection at emit time:

| `edgeName` | `isMultiple` | Emitted shape |
|---|---|---|
| present | true  | `_<name>: T[]` (array storage), `name(): T[]` |
| present | false | `_<name>: T`   (single storage), `name(): T`   |
| absent  | true  | `$children: T[]` |
| absent  | false | `$child: T`      |

## AssembledLeaf (abstract base)

```ts
abstract class AssembledLeaf {
  readonly kind: 'leaf';
  readonly name: string;
  readonly typeName: string;
  readonly irKey: string;
  readonly rawFactoryName: string;
  readonly userFacing: boolean;
}
```

No `slots` — leaves render as `$text` only.

### AssembledPattern

```ts
class AssembledPattern extends AssembledLeaf {
  readonly leafKind: 'pattern';
  readonly pattern?: string;   // undefined → accept anything; defined → regex validate
}
```

Replaces the current `AssembledLeaf` (open-text) — name change only,
prevents collision with the new base class.

### AssembledKeyword

```ts
class AssembledKeyword extends AssembledLeaf {
  readonly leafKind: 'keyword';
  readonly text: string;       // the one allowed value, e.g. "fn"
}
```

### AssembledToken

```ts
class AssembledToken extends AssembledLeaf {
  readonly leafKind: 'token';
  readonly text: string;       // the one allowed value, e.g. "{"
}
```

### AssembledEnum

```ts
class AssembledEnum extends AssembledLeaf {
  readonly leafKind: 'enum';
  readonly values: readonly string[];  // closed membership set
}
```

## AssembledPolymorph

```ts
interface AssembledPolymorph {
  readonly kind: 'polymorph';
  readonly name: string;
  readonly forms: readonly PolymorphForm[];   // absorbs old AssembledGroup
  // existing metadata preserved
}

interface PolymorphForm {
  readonly variant: string;
  readonly target: AssembledNode | UnresolvedRef;
}
```

Absorbs `AssembledGroup` — group form becomes an inline `forms[i]` entry.

## AssembledSupertype

```ts
interface AssembledSupertype {
  readonly kind: 'supertype';
  readonly name: string;
  readonly subtypes: readonly (AssembledNode | UnresolvedRef)[];
}
```

Unchanged from current `AssembledSupertype`.

## Discriminated-union exhaustiveness

Every `switch` over `AssembledNode` MUST end in `assertNever(x)` per
Constitution XI. Phase 1 verifies this in CI by grepping for `assertNever`
on every union switch.

## Migration mapping (Phase 1)

| Current type | Replacement | Notes |
|---|---|---|
| `AssembledBranch` | `AssembledBranch` | Same; absorbs Container + Multi semantics |
| `AssembledContainer` | `AssembledBranch` | Container = branch with one unnamed slot |
| `AssembledMulti` | (removed) | Multiplicity moves to slot `values[].multiplicity` |
| `AssembledField` | `AssembledNonterminal` (with `edgeName`) | |
| `AssembledChild` | `AssembledNonterminal` (without `edgeName`) | |
| `AssembledLeaf` (current) | `AssembledPattern` | Renamed to free up `AssembledLeaf` for the base class |
| `AssembledKeyword` | `AssembledKeyword extends AssembledLeaf` | Now a subclass of base |
| `AssembledToken` | `AssembledToken extends AssembledLeaf` | Now a subclass of base |
| `AssembledEnum` | `AssembledEnum extends AssembledLeaf` | Now a subclass of base |
| `AssembledPolymorph` | `AssembledPolymorph` | Absorbs `forms` from groups |
| `AssembledSupertype` | `AssembledSupertype` | Unchanged |
| `AssembledGroup` | (absorbed into `AssembledPolymorph.forms`) | |

## Phase 1 success criterion

After Phase 1 lands, regenerating all three grammar packages produces
**byte-identical** output. Diff = empty. The taxonomy collapse changes
only the internal type names and shapes — emit is unchanged.
