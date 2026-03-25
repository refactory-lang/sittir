# Public API Contract: @sittir packages

**Feature**: 001-codegen-grammarjs-rewrite
**Date**: 2026-03-24

## @sittir/core — Rust/WASM Runtime

### WASM Exports (TypeScript bindings)

```typescript
// Render node data to source string using render rules
export function render(nodeJson: string, rulesJson: string): string;

// Render and create an Edit for a byte range
export function toEdit(nodeJson: string, rulesJson: string, start: number, end: number): Edit;

// Validate source text via tree-sitter (returns error positions or empty)
export function validate(source: string, grammar: string): ValidationResult;

// Build CST node tree with byte offsets
export function toCst(nodeJson: string, rulesJson: string, offset: number): CSTNode;
```

### Rust Crate Exports (for native consumers)

```rust
// Render engine
pub fn render(node: &NodeData, rules: &[RenderRule]) -> String;
pub fn to_edit(node: &NodeData, rules: &[RenderRule], start: u32, end: u32) -> Edit;
pub fn validate(source: &str, grammar: &str) -> ValidationResult;
pub fn to_cst(node: &NodeData, rules: &[RenderRule], offset: u32) -> CSTNode;

// Rust ir module (generated per grammar, e.g. ir::rust)
pub mod ir {
    pub mod rust {
        pub fn function_item(name: NodeData) -> FunctionItemBuilder;
        pub fn identifier(text: &str) -> NodeData;
        pub fn block() -> BlockBuilder;
        // ... all node kinds
    }
}
```

## @sittir/types — Pure TypeScript Types (zero runtime)

```typescript
// Node data — what factories produce, what core consumes
interface NodeData {
  kind: string;
  fields: Record<string, NodeData | NodeData[] | string | undefined>;
  text?: string;  // for terminal nodes
}

// Render table types
type RenderStep =
  | { token: string }
  | { field: string; required: boolean; multiple?: boolean;
      sep?: string; prefix?: string; suffix?: string };
type RenderRule = RenderStep[];

// Edit (ast-grep compatible)
interface Edit { startPos: number; endPos: number; insertedText: string }

// CST types
interface CSTNode { type, text, children, isNamed, startIndex, endIndex,
                    startPosition, endPosition, fieldName? }
interface Position { row: number; column: number }
interface ValidationResult { ok: boolean; errors?: Array<{ offset: number; kind: string }> }

// Type-level grammar projection
type NodeType<G, K extends keyof G & string> = /* deeply expanded IR node shape */
```

## @sittir/codegen — Code Generator

```typescript
function generate(config: CodegenConfig): GeneratedFiles;

interface CodegenConfig {
  grammar: string;
  nodes?: string[];
  outputDir: string;
  aliases?: Record<string, Record<string, string>>;
  testSourceImportPath?: string;
  emitRust?: boolean;  // also emit Rust ir module source
}
```

## @sittir/{rust,typescript,python} — Generated Packages

### Naming Conventions (retained from old API)

- **`toShortName`** for ir keys: `ir.function` (not `ir.functionItem`), `ir.struct` (not `ir.structItem`)
- **Trailing underscores dropped** in ir namespace: `ir.function`, `ir.enum`, `ir.const`
- **camelCase field names** from snake_case grammar: `returnType` from `return_type`
- **Supertype union types**: `_expression` → `type Expression = BinaryExpression | CallExpression | ...`
- **Nested namespaces** by supertype: group related factories

### Supertype Unions (key convention)

```typescript
// Generated from _expression supertype
type Expression = BinaryExpression | CallExpression | IfExpression | ...;

// Fields typed with supertypes accept any concrete expression
interface IfExpressionConfig {
  condition: Expression;      // accepts any expression factory output
  consequence: Block;
  alternative?: ElseClause;
}
```

### Unified Factory API (three modes)

```typescript
import { ir } from '@sittir/rust';

// === Mode 1: Declarative (config object) ===
const fn1 = ir.function({
  name: ir.identifier('main'),
  returnType: ir.primitiveType('i32'),  // string shorthand for leaf
  body: ir.block(),
});

// === Mode 2: Fluent (method chaining) ===
const fn2 = ir.function(ir.identifier('main'))
  .returnType(ir.primitiveType('i32'))
  .body(ir.block());

// === Mode 3: Mixed (required positional + config) ===
const fn3 = ir.function(ir.identifier('main'), {
  returnType: ir.primitiveType('i32'),
  body: ir.block(),
});

// All three produce identical NodeData with render/toEdit methods:
const source = fn1.render();
const edit = fn1.toEdit(42, 67);

// String shorthand + single-field compression:
ir.stringLiteral('hello')       // single-field: content inferred
ir.stringLiteral('\\n')         // template literal: escape_sequence inferred
ir.stringLiteral({ content: { kind: 'escape_sequence', text: '\\n' } })  // explicit

// Keywords (zero-arg)
ir.self()   // → { kind: 'self', text: 'self' }
ir.mut()    // → { kind: 'mutable_specifier', text: 'mut' }

// Operators (semantic aliases)
ir.add()    // → { kind: 'binary_expression_operator', text: '+' }
ir.eq()     // → { kind: 'binary_expression_operator', text: '==' }
```

### Three API Tiers

The factory system provides three distinct API tiers with different tradeoffs:

| API | Performance | Ergonomics | Input types | File |
|-----|-------------|------------|-------------|------|
| **Regular** (declarative/fluent/mixed) | Maximum | Strict | `NodeData<NarrowKind>` only | `factories.ts` |
| **`.from()`** (ergonomic) | Good | Maximum | Strings, numbers, booleans, objects, arrays, NodeData, SgNode | `from.ts` |
| **`.assign()`** (hydration) | Good | Strict | `AssignableNode` (SgNode) | `factories.ts` |

The `.from()` API is the universal entry point — it dispatches to the regular factory for plain-object resolution, and to `.assign()` when it detects an SgNode-like input. Naming follows the `Buffer.from()` / Rust `From` trait convention: a polymorphic constructor that accepts diverse input shapes.

### Generated Factory Implementation Pattern

```typescript
// === factories.ts — regular API (lightweight, tree-shakeable) ===

import { render, toEdit } from '@sittir/core';
import { rules } from './rules.js';

// Per-node config type — strict, narrowed NodeData per field (FR-016)
interface FunctionItemConfig {
  name: NodeData<'identifier' | 'metavariable'>;          // required
  type_parameters?: NodeData<'type_parameters'>;           // optional
  parameters: NodeData<'parameters'>;                      // required
  return_type?: NodeData<'primitive_type' | 'type_identifier' | ...>; // optional
  body: NodeData<'block'>;                                 // required
}

// FromInput type — ergonomic, recursively typed for .from() API (FR-027)
interface FunctionItemFromInput {
  name: NodeData<'identifier' | 'metavariable'> | string;
  type_parameters?: NodeData<'type_parameters'> | TypeParametersFromInput;
  parameters: NodeData<'parameters'> | ParametersFromInput | FromValue[];
  return_type?: NodeData<...> | string | number | GenericTypeFromInput | ...;
  body: NodeData<'block'> | BlockFromInput | FromValue[];
}

// Return types: Node (strict setters) vs FromNode (ergonomic setters)
type FunctionItemNode = NodeData<'function_item'> & {
  typeParameters(v: NodeData<'type_parameters'>): FunctionItemNode;
  returnType(v: NodeData<...>): FunctionItemNode;
  body(v: NodeData<'block'>): FunctionItemNode;
  render(): string;
  toEdit(start: number, end: number): Edit;
  replace(target: ...): Edit;
};

type FunctionItemFromNode = NodeData<'function_item'> & {
  typeParameters(v: NodeData<...> | TypeParametersFromInput): FunctionItemFromNode;
  returnType(v: NodeData<...> | string | number | ...): FunctionItemFromNode;
  body(v: NodeData<...> | BlockFromInput | FromValue[]): FunctionItemFromNode;
  render(): string;
  toEdit(start: number, end: number): Edit;
  replace(target: ...): Edit;
};

// Factory function — no runtime type inference, only NodeData accepted
export function functionItem(
  nameOrConfig: NodeData<'identifier' | 'metavariable'> | FunctionItemConfig,
  config?: Partial<FunctionItemConfig>,
): FunctionItemNode { ... }

// .assign() — hydrate from parsed tree node
functionItem.assign = function(target: AssignableNode<'function_item'>): FunctionItemNode { ... };

// === from.ts — .from() API (separate file for tree-shaking, FR-030) ===

// Inlined per-field resolution — no generic resolver (FR-029)
export function functionItemFrom(
  input: AssignableNode<'function_item'> | FunctionItemFromInput | FromValue[],
): FunctionItemFromNode {
  // SgNode detection — delegates to .assign() with ergonomic setters (FR-031)
  if (typeof input.field === 'function') {
    const base = functionItem.assign(input);
    // Wrap setters with resolution...
    return base;
  }
  // Plain-object resolution: strings → identifier(), numbers → integerLiteral(), etc.
  ...
}

// === ir.ts — combines both via Object.assign ===
export const ir = {
  function: Object.assign(functionItem, { from: functionItemFrom }),
  ...
};
```

### Constants

```typescript
import { nodeKinds, leafKinds, keywords, operators } from '@sittir/rust/consts';
```

### Render Tables

```typescript
import { rules } from '@sittir/rust/rules';
// rules.function_item → RenderRule[] (data, not code)
```

### Type Projections

```typescript
import type { RustGrammar } from '@sittir/rust';
import type { NodeType } from '@sittir/types';
type FnItem = NodeType<RustGrammar, 'function_item'>;
```
