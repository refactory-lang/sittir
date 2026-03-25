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

### Generated Factory Implementation Pattern

```typescript
import { render, toEdit, toCst, validateFast } from '@sittir/core';
import { rules } from './rules.js';

// Per-node config type (generated)
interface FunctionConfig {
  name: NodeData | string;           // required; string shorthand for identifier
  returnType?: NodeData | string;    // optional; string shorthand for type_identifier
  parameters?: NodeData;             // optional
  body?: NodeData;                   // optional
}

// Per-node return type — NodeData + fluent setters + render methods (generated)
type FunctionNode = NodeData & {
  returnType(t: NodeData | string): FunctionNode;
  parameters(p: NodeData): FunctionNode;
  body(b: NodeData): FunctionNode;
  render(): string;
  toEdit(start: number, end: number): Edit;
  toCst(offset?: number): CSTNode;
  validate(mode?: 'fast' | 'full'): string | Promise<string>;
};

// Factory function (generated)
export function function_(
  nameOrConfig: NodeData | string | FunctionConfig,
  config?: Partial<FunctionConfig>,
): FunctionNode {
  const fields: FunctionConfig = typeof nameOrConfig === 'string'
    ? { name: resolveLeaf('identifier', nameOrConfig), ...config }
    : isNodeData(nameOrConfig)
      ? { name: nameOrConfig, ...config }
      : nameOrConfig;

  const node: any = { kind: 'function_item', fields };
  // Fluent setters
  node.returnType = (t) => { fields.returnType = resolveField(t, ...); return node; };
  node.parameters = (p) => { fields.parameters = p; return node; };
  node.body = (b) => { fields.body = b; return node; };
  // Render methods (close over rules)
  node.render = () => render(node, rules.function_item);
  node.toEdit = (s, e) => toEdit(node, rules.function_item, s, e);
  node.toCst = (o) => toCst(node, rules.function_item, o ?? 0);
  node.validate = (m) => m === 'full' ? validateFull(...) : validateFast(render(node, rules.function_item));
  return node;
}

// ir namespace uses toShortName — trailing underscore dropped
// ir.function = function_
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
