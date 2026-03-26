# Public API Contract: @sittir packages

**Feature**: 001-codegen-grammarjs-rewrite
**Date**: 2026-03-24
**Last Updated**: 2026-03-25

## @sittir/core — TypeScript Runtime (grammar-agnostic)

```typescript
// Render node data to source string using S-expression render rules
export function render(node: AnyNodeData, registry: RulesRegistry, joinBy?: JoinByMap): string;

// Parse S-expression template into cached parsed form
export function parseTemplate(template: string): ParsedTemplate;

// Validate source text via tree-sitter (returns error positions or empty)
export function validateFull(source: string, parser: unknown): Promise<string>;

// Create an Edit for a byte range
export function toEdit(node: AnyNodeData, rules: RulesRegistry, startOrRange: number | ByteRange, endPos?: number, joinBy?: JoinByMap): Edit;

// Type-safe field replacement using KindOf<T> inference
export function replaceField<T extends AnyNodeData>(target: ReplaceTarget, selector: (node: T) => unknown, replacement: AnyNodeData, rules: RulesRegistry, joinBy?: JoinByMap): Edit;

// Bind a range to a node for later .replace()
export function bindRange(node: AnyNodeData, range: ByteRange): AnyNodeData;

// Replace a matched node's full range
export function replace(node: AnyNodeData, target: ReplaceTarget, rules: RulesRegistry, joinBy?: JoinByMap): Edit;

// Build CST node tree with byte offsets
export function toCst(node: AnyNodeData, registry: RulesRegistry, offset?: number, joinBy?: JoinByMap): CSTNode;
```

Note: `@sittir/core` has NO `.from()` resolution — generated packages inline all resolution logic for tree-shaking.

## @sittir/types — Pure TypeScript Types (zero runtime)

```typescript
// --- Grammar-derived type projections ---

// NodeData<G, K> — the primary node type. Always two params (grammar + kind).
// Branches have fields, leaves have text. No loose typing.
type NodeData<G, K extends NodeKind<G>> = ExpandNode<G, K, []>;

// NodeFields<G, K> — factory config type (NodeData<G,K>['fields'])
type NodeFields<G, K extends NodeKind<G>> = NodeData<G, K>['fields'];

// TreeNode<G, K> — parsed tree node with typed field() navigation
// Structurally compatible with ast-grep SgNode
interface TreeNode<G, K> {
  readonly type: K;
  field<F extends string>(name: F): TreeNode<G, FieldKinds<G,K,F>> | null;
  text(): string;
  range(): { start: { index: number }; end: { index: number } };
  children(): TreeNode<G, NodeKind<G>>[];
}

// --- Runtime types (grammar-agnostic) ---

// AnyNodeData — loose structural supertype for core functions
interface AnyNodeData {
  readonly type: string;
  readonly fields?: Readonly<Record<string, unknown>>;  // optional — leaves have text, not fields
  readonly text?: string;
}

// AnyTreeNode — loose tree node for grammar-agnostic operations
interface AnyTreeNode {
  readonly type: string;
  field(name: string): AnyTreeNode | null;
  text(): string;
  range(): { start: { index: number }; end: { index: number } };
}

// Edit (ast-grep compatible)
interface Edit { startPos: number; endPos: number; insertedText: string }

// CST types
interface CSTNode { type, text, children, isNamed, startIndex, endIndex,
                    startPosition, endPosition, fieldName? }

// KindOf<T> — extract the kind string from a NodeData type (for replaceField)
type KindOf<T> = T extends { readonly type: infer K } ? K : never;

// Simplify<T> — flatten intersection into single object (shallow, from type-fest)
type Simplify<T> = { [K in keyof T]: T[K] } & {};
```

## @sittir/codegen — Code Generator

```typescript
function generate(config: CodegenConfig): GeneratedFiles;

interface GeneratedFiles {
  grammar: string;      // grammar.ts — type literal
  types: string;        // types.ts — enums, interfaces, unions
  rules: string;        // rules.ts — S-expression templates
  joinBy: string;       // joinby.ts — separator map
  factories: string;    // factories.ts — unified factories
  from: string;         // from.ts — .from() resolution
  assign: string;       // assign.ts — tree hydration
  utils: string;        // utils.ts — shared client utilities
  irNamespace: string;  // ir.ts — developer namespace
  consts: string;       // consts.ts — kind/keyword/operator maps
  index: string;        // index.ts — barrel exports
  tests: string;        // nodes.test.ts — per-node tests
  config: string;       // vitest.config.ts
}
```

## @sittir/{rust,typescript,python} — Generated Packages

### Naming Conventions

- **`toShortName`** for ir keys: `ir.function` (not `ir.functionItem`), `ir.struct` (not `ir.structItem`)
- **Trailing underscores dropped** in ir namespace: `ir.function`, `ir.enum`, `ir.const`
- **camelCase field names** from snake_case grammar: `returnType` from `return_type`
- **Supertype union types**: `_expression` → `Expression`, `ExpressionFields`, `ExpressionTree`, `ExpressionFromInput`
- **`interface extends` pattern**: `interface FunctionItem extends NodeData<'function_item'> {}` for compiler caching

### Grammar-Bound Type Aliases

```typescript
// Generated types.ts re-exports with grammar bound:
import type { NodeData as BaseNodeData } from '@sittir/types';
type RustGrammar = { /* grammar type literal */ };
export type NodeData<K extends NodeKind<RustGrammar>> = BaseNodeData<RustGrammar, K>;
export type NodeFields<K extends NodeKind<RustGrammar>> = BaseNodeFields<RustGrammar, K>;
export type TreeNode<K extends NodeKind<RustGrammar>> = BaseTreeNode<RustGrammar, K>;

// Named interfaces for IDE performance:
export interface FunctionItem extends NodeData<'function_item'> {}
export interface FunctionItemFields extends NodeFields<'function_item'> {}
export interface FunctionItemTree extends TreeNode<'function_item'> {}
```

### Three API Tiers

| API | Performance | Ergonomics | Input types | File |
|-----|-------------|------------|-------------|------|
| **Regular** (declarative/fluent/mixed) | Maximum | Strict | `NodeData` interfaces only | `factories.ts` |
| **`.from()`** (ergonomic) | Good | Maximum | Strings, numbers, booleans, objects, arrays, NodeData, TreeNode | `from.ts` |
| **`.assign()`** (hydration) | Good | Strict | `TreeNode` (SgNode) | `assign.ts` |

### Unified Factory API (three modes)

```typescript
import { ir } from '@sittir/rust';

// === Mode 1: Declarative (config object) ===
const fn1 = ir.function({
  name: ir.identifier('main'),
  parameters: ir.parameters([]),
  body: ir.block(),
});

// === Mode 2: Fluent (method chaining) ===
const fn2 = ir.function(ir.identifier('main'))
  .parameters(ir.parameters([]))
  .body(ir.block());

// === Mode 3: Mixed (required positional + config) ===
const fn3 = ir.function(ir.identifier('main'), {
  parameters: ir.parameters([]),
  body: ir.block(),
});

// All three produce identical NodeData with render/toEdit/replace methods:
const source = fn1.render();
const edit = fn1.toEdit(42, 67);

// .from() — ergonomic entry point (strings, objects, TreeNodes):
const fn4 = ir.function.from({
  name: 'main',
  // Required array fields default to [] when omitted:
  // parameters, body etc. are coerced to empty arrays
});

// .from() with explicit children:
const fn5 = ir.function.from({
  name: 'main',
  parameters: { children: [{ kind: 'parameter', name: 'x', type: 'i32' }] },
});

// .assign() — hydrate from parsed tree node:
import { edit } from '@sittir/rust';
// edit() returns Simplify<NodeData<K> & { toEdit, replace, render }>
// K flows from TreeNode<K> input → typed return
const hydrated = edit(treeNode);  // universal entry via assignByKind

// Keywords (zero-arg)
ir.self()   // → { type: 'self', text: 'self' }
ir.mut()    // → { type: 'mutable_specifier', text: 'mut' }
```

### Constants

```typescript
import { nodeKinds, leafKinds, keywords, operators } from '@sittir/rust/consts';
```

### Render Templates

```typescript
import { rules } from '@sittir/rust/rules';
// rules['function_item'] → S-expression template string
```
