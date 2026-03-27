# WIP Changelog — Type Generics & Factory Simplification

Running log of changes. Delete once merged.

---

## NodeFromInput generic (prior session)

**What:** Replaced hand-rolled `*FromInput` interfaces with `interface *FromInput extends NodeFromInput<'kind'> {}` aliases backed by a recursive generic `NodeFromInput<G, K, LeafScalars>` in `@sittir/types`.

**Files changed:**
- `packages/types/src/index.ts` — Added `BranchKindsOf`, `FromInputKindExpand`, `FromInputExpandSlot`, `DerivedFromInputFields`, `DerivedFromInputChildren`, `FromInputFieldsShape`, `NodeFromInput` types
- `packages/codegen/src/emitters/types.ts` — Generates `LeafScalarMap`, `NodeFromInput<K>` alias, `interface *FromInput extends NodeFromInput<'kind'> {}` per node
- `packages/codegen/src/emitters/factories.ts` — Removed `fromInputFieldType()` helper (~60 lines), removed hand-rolled `*FromInput` generation block, removed supertype FromInput union generation
- `packages/codegen/src/emitters/from.ts` — Split imports: `*FromInput` from `./types.js`, `*FromNode` from `./factories.js`
- `packages/codegen/src/emitters/type-test.ts` — Added `*FromInput ≡ NodeFromInput<K>` assertion section

**Design decisions:**
- `BranchKindsOf<G, K>` pre-computes branch kinds per slot; `[AllBranches] extends [K]` detects single-branch (no `{ kind }` wrapper) vs multi-branch (`{ kind: K }` discriminated)
- No `unknown[]` anywhere in FromInput types
- `LeafScalarMap` is grammar-specific: `{ integer_literal: number; float_literal: number; boolean_literal: boolean }` for Rust

---

## Remove *Config types (this session)

**What:** Removed `*Config` type aliases from generated factories. They were just `type FooConfig = FooFields` — unnecessary indirection. Factories now accept `*Fields` directly.

**Files changed:**
- `packages/codegen/src/emitters/factories.ts` — Removed `export type ${typeName}Config = ${typeName}Fields;` line from `emitFactory()`

**Breaking:** Any consumer using `FunctionItemConfig`, `StructItemConfig`, etc. must switch to `FunctionItemFields`, `StructItemFields`.

---

## Remove *OrConfig / mixed positional args (this session)

**What:** Factories no longer accept `(ctorFieldValue | Config, config?)` overload. They take a single `config: *Fields` object.

**Files changed:**
- `packages/codegen/src/emitters/factories.ts` — Removed `selectConstructorField` usage, removed `*OrConfig` pattern, removed `config?: Partial<*Config>` second param, removed `isNodeData()` branching

**Before:**
```ts
export function functionItem(
  nameOrConfig: Identifier | Metavariable | FunctionItemConfig,
  config?: Partial<FunctionItemConfig>,
): FunctionItemNode {
```

**After:**
```ts
export function functionItem(
  config: FunctionItemFields,
): FunctionItemNode {
```

**Breaking:** `ir.functionItem(identifier('main'))` → `ir.functionItem({ name: identifier('main') })`

---

## Remove intermediate `fields` variable (this session)

**What:** Factory functions no longer create a `const fields = config as Record<string, unknown>` intermediary. `config` is passed directly to the node literal.

**Files changed:**
- `packages/codegen/src/emitters/factories.ts` — Node created as `{ type: '...' as const, fields: config ?? {} }`

---

## Immutable fluent setters (this session)

**What:** Fluent setters no longer mutate the node. Each setter returns a fresh node by re-calling the factory with spread config.

**Files changed:**
- `packages/codegen/src/emitters/factories.ts` — Setters changed from `(node.fields as any)['x'] = v; return node;` to `factoryName({ ...config, 'x': v } as Fields)`

**Before:**
```ts
node.name = (v) => { (node.fields as any)['name'] = v; return node; };
```

**After:**
```ts
node.name = (v) => functionItem({ ...config, 'name': v } as FunctionItemFields);
```

**Design decision:** Immutable by default. Each setter call produces a new node — safe for functional pipelines, no shared mutable state.

---

## Leaf NodeData: no `fields` property (this session)

**What:** `NodeData<G, K>` now conditionally includes `fields` only for branch nodes (grammar entry has `fields: object`). Leaf nodes get `{ type: K; text?: string }` — no `fields` key.

**Files changed:**
- `packages/types/src/index.ts` — `NodeData` now uses `G[K] extends { fields: object }` conditional; `NodeFields` uses `extends { fields: infer F }` extraction instead of direct `['fields']` access

**Before:**
```ts
// Identifier resolves to:
{ readonly type: 'identifier'; readonly fields: {}; readonly text?: string }
```

**After:**
```ts
// Identifier resolves to:
{ readonly type: 'identifier'; readonly text?: string }
```

---

## Replace SimplifyDeep with Simplify (this session)

**What:** `NodeData` branch case uses shallow `Simplify` instead of `SimplifyDeep` from type-fest. Leaf case uses no simplification (plain object literal, no intersection). `SimplifyDeep` is recursively expensive and unnecessary — the recursive generic machinery already resolves field types.

**Files changed:**
- `packages/types/src/index.ts` — `SimplifyDeep` → `Simplify` for branch `NodeData`, removed for leaf `NodeData`

---

## Rename *Fields → *Config, single object literal, replace takes *Tree (this session)

**What:** Three changes to factories:

1. **Rename `*Fields` → `*Config`** — The factory input type includes named fields AND children, so "Fields" was misleading. `NodeFields` → `NodeConfig` in `@sittir/types`, `*Fields` → `*Config` in generated types and factories.

2. **Single object literal** — Nodes are now constructed as a single `{ type, fields, setters..., methods... }` literal. No separate `const node = {} as X; node.setter = ...;` assignment pattern.

3. **`replace` takes `*Tree`** — Instead of generic `ReplaceTarget<'kind'>`, replace now accepts the concrete tree type (e.g., `FunctionItemTree`, `IdentifierTree`).

4. **NodeData: no `?`** — Branch nodes: `{ type: K; fields: ... }` (no `text?`). Leaf nodes: `{ type: K; text: string }` (required, not optional).

**Files changed:**
- `packages/types/src/index.ts` — Added `NodeConfig<G, K>`, deprecated `NodeFields` (alias to NodeConfig). `NodeData` branch: removed `text?`. Leaf: `text: string` required.
- `packages/codegen/src/emitters/types.ts` — `NodeFields` → `NodeConfig` import, per-node `*Fields` → `*Config`, supertype `*Fields` unions → `*Config`
- `packages/codegen/src/emitters/factories.ts` — All `*Fields` → `*Config` in factory params/setters/types. Single object literal construction. `replace(target: *Tree)`. `*Tree` imports added.

**Before:**
```ts
export function functionItem(
  config: FunctionItemFields,
): FunctionItemNode {
  const node = { type: 'function_item' as const, fields: config ?? {} } as FunctionItemNode;
  node.name = (v) => functionItem({ ...config, 'name': v } as FunctionItemFields);
  node.render = () => render(node, rules, joinBy);
  node.replace = (target: ReplaceTarget<'function_item'>) => { ... };
  return node;
}
```

**After:**
```ts
export function functionItem(
  config: FunctionItemConfig,
): FunctionItemNode {
  const node: FunctionItemNode = {
    type: 'function_item' as const,
    fields: config ?? {},
    name: (v) => functionItem({ ...config, 'name': v } as FunctionItemConfig),
    render: () => render(node, rules, joinBy),
    replace: (target: FunctionItemTree) => { ... },
  } as FunctionItemNode;
  return node;
}
```

**Breaking:** All `*Fields` type references must change to `*Config`. `ReplaceTarget` no longer used by factories.

---

## Supertype references in factory setters (this session)

**What:** Factory setter type annotations now use supertype names (e.g., `Expression`, `DeclarationStatement`, `Type`) instead of expanded inline unions of all concrete subtypes.

**Files changed:**
- `packages/codegen/src/emitters/factories.ts` — Added `supertypes` to `EmitFactoriesConfig`, `supertypeMap` to `emitFactory`. New helpers: `buildExpandedSupertypeMap` (recursively expands nested supertypes like `_literal ⊂ _expression`), `collapseToSupertypes` (replaces concrete type sets with supertype names, handles overlapping supertypes), `isSubsetOf`. Updated `fieldTypeExpr` and children union generation.
- `packages/codegen/src/index.ts` — Passes `supertypes` to `emitFactories` call

**Before:**
```ts
children: (...v: (ArrayExpression | AssignmentExpression | AsyncBlock | ... 60+ types ...)[]) => block({ ...config, children: v }),
returnType: (v: AbstractType | BoundedType | DynamicType | ... 15+ types ...) => functionItem({ ...config, 'return_type': v }),
```

**After:**
```ts
children: (...v: (DeclarationStatement | Expression | ExpressionStatement | Label)[]) => block({ ...config, children: v }),
returnType: (v: Type) => functionItem({ ...config, 'return_type': v }),
```

**Design decisions:**
- Supertypes are recursively expanded to concrete types before comparison (e.g., `_expression` includes `_literal` which includes `boolean_literal`)
- Overlapping supertypes (e.g., `_expression` and `_declaration_statement` share `macro_invocation`) are handled by checking all matches against the original input set, then pruning supertypes that are strict subsets of other matched supertypes
- Concrete types not covered by any matched supertype are kept as-is

---

## Remove `as` casts from factories (this session)

**What:** Removed all `as Type` casts from factory return statements. Branch factories already have `const node: *Node` type annotations, and terminal factories have return type annotations on the function — both provide sufficient type context without casts.

**Files changed:**
- `packages/codegen/src/emitters/factories.ts` — Removed `as ${typeName}Node` from branch factories, `as ${returnType}` from keyword and regular terminal factories

**Before:**
```ts
  const node: FunctionItemNode = { ... } as FunctionItemNode;
  // Terminal:
  export function identifier(text: string): Identifier & { render(): string; replace(target: IdentifierTree): Edit } {
    return { ... } as Identifier & { render(): string; replace(target: IdentifierTree): Edit };
  }
```

**After:**
```ts
  const node = { ... };
  // Terminal:
  export interface IdentifierNode extends Identifier, NodeMethods<'identifier'> {}
  export function identifier(text: string): IdentifierNode {
    return { ... };
  }
```

Leaf factories now emit their own `*Node` interface (`extends LeafType, NodeMethods<'kind'>`) — all factories exclusively return `*Node`.

---

## Deletable code (not yet removed)

| Location | What | Blocked by |
|----------|------|------------|
| `packages/codegen/src/emitters/type-test.ts` ~L62-66 | `*Config = *Fields` assertion section — needs rename to `*Config = NodeConfig<K>` | type-test emitter update |
| `packages/codegen/src/emitters/utils.ts` | `selectConstructorField` | still used by `from.ts`, `type-test.ts` |
| Generated `factories.ts` L3 | `import type { NodeData } from './types.js'` | may be unused, verify |
| Generated `factories.ts` | `AnyNodeData` import | used by fields with 0 named types — keep if needed |
| `packages/types/src/index.ts` | `NodeFields` deprecated alias | remove once all consumers migrated to `NodeConfig` |
| `packages/codegen/src/emitters/factories.ts` L227 | `import { isNodeData }` line removed | already done |
| `packages/types/src/index.ts` L21 | `SimplifyDeep` import from type-fest | unused after Simplify swap |
