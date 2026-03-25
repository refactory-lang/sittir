# Quickstart: Sittir Builder Usage

## Install

```bash
pnpm add @sittir/rust @sittir/core    # or @sittir/typescript, @sittir/python
```

## Build an AST fragment (four ways)

```typescript
import { ir } from '@sittir/rust';

// === Mode 1: Declarative — all fields upfront (strict NodeData only) ===
const fn1 = ir.function({
  name: ir.identifier('main'),
  parameters: ir.parameters(),
  returnType: ir.primitiveType('i32'),
  body: ir.block(),
});

// === Mode 2: Fluent — chain optional fields ===
const fn2 = ir.function(ir.identifier('main'))
  .parameters(ir.parameters())
  .returnType(ir.primitiveType('i32'))
  .body(ir.block());

// === Mode 3: Mixed — required positional + config ===
const fn3 = ir.function(ir.identifier('main'), {
  parameters: ir.parameters(),
  returnType: ir.primitiveType('i32'),
  body: ir.block(),
});

// All three produce identical NodeData with render/toEdit methods:
const source = fn1.render();
// → "fn main() -> i32 {}"
```

## `.from()` — ergonomic entry point

The `.from()` API accepts strings, numbers, booleans, plain objects, arrays, and SgNodes — resolving them into typed `NodeData` automatically:

```typescript
import { ir } from '@sittir/rust';

// === Mode 4: .from() — maximum ergonomics ===
const fn4 = ir.function.from({
  name: 'main',                    // string → identifier
  parameters: [                    // array → parameters wrapper
    { pattern: 'a', type: 'i32' }, // objects → parameter with resolved fields
    { pattern: 'b', type: 'i32' },
  ],
  return_type: 'i32',             // string → primitive_type (recognized primitive)
  body: [                          // array → block wrapper
    { kind: 'binary_expression', left: 'a', operator: '+', right: 'b' },
  ],
});

const source = fn4.render();
// → "fn main(a: i32, b: i32) -> i32 { a + b }"

// Scalar shorthands:
ir.letDeclaration.from({ pattern: 'count', value: 42 });    // number → integer_literal
ir.letDeclaration.from({ pattern: 'flag', value: true });    // boolean → boolean_literal
ir.function.from({ name: 'get', parameters: [], return_type: 'MyType', body: [] });
// 'MyType' is not a primitive → resolves to type_identifier

// SgNode dispatch — .from() detects parsed tree nodes and delegates to .assign():
const node = ir.function.from(sgNode);  // hydrates from parsed tree
node.returnType('i32');                  // ergonomic setter (string resolved)
const edit = node.toEdit();              // edit with original byte range
```

### Three API Tiers

| API | Performance | Ergonomics | Input types |
|-----|-------------|------------|-------------|
| **Regular** (declarative/fluent/mixed) | Maximum | Strict | `NodeData<NarrowKind>` only |
| **`.from()`** (ergonomic) | Good | Maximum | Strings, numbers, booleans, objects, arrays, SgNode |
| **`.assign()`** (hydration) | Good | Strict | `AssignableNode` (SgNode) |

## Use in a codemod (TypeScript + ast-grep)

```typescript
import { ir } from '@sittir/rust';

// After matching a node with ast-grep:
const match = sgRoot.find('println!($$$ARGS)');

// Build replacement and create edit
const replacement = ir.macroInvocation({ macro: ir.identifier('eprintln') });
const edit = replacement.replace(match);
// → { startPos: 42, endPos: 67, insertedText: 'eprintln!(...)' }

// Or use .from() + .assign() for in-place editing:
const fn = ir.function.from(matchedFn);    // hydrate from parsed tree
fn.returnType(ir.primitiveType('i64'));     // override a field
const fnEdit = fn.toEdit();                // edit covering original range
```

## Generate builders for a grammar

```typescript
import { generate } from '@sittir/codegen';

const files = generate({
  grammar: 'rust',
  outputDir: 'src',
});
// Generates: rules.ts, factories.ts, from.ts, ir.ts, types.ts, consts.ts, joinby.ts, index.ts
```

## Validation

Validation happens at three levels — no render-time overhead:

```typescript
// 1. Compile-time: TypeScript types enforce correct kinds and fields
ir.function({ name: ir.block() });  // Type error — block is not an identifier

// 2. Factory-time: O(1) string input validation
ir.identifier('fn');     // Throws — 'fn' is a reserved keyword
ir.identifier('main');   // OK

// 3. .from() resolution: scalars/objects validated via factory creation
ir.function.from({ name: 'main', parameters: [], body: [] });  // validated per-field

// 4. Test-time: tree-sitter parse for render rule regression
// (only in codegen test suite, not runtime)
```

## Explore the grammar

```typescript
import { nodeKinds, leafKinds, keywords, operators } from '@sittir/rust/consts';

console.log(nodeKinds);   // ['function_item', 'struct_item', ...]
console.log(keywords);    // ['self', 'pub', 'mut', ...]
console.log(operators);   // ['+', '-', '*', '/', ...]
```
