# Quickstart: Sittir Builder Usage

## Install

```bash
pnpm add @sittir/rust @sittir/core    # or @sittir/typescript, @sittir/python
```

## Build an AST fragment (three ways)

```typescript
import { ir } from '@sittir/rust';
import { render } from '@sittir/core';
import { rules } from '@sittir/rust/rules';

// === Declarative — all fields upfront ===
const fn1 = ir.functionItem({
  name: ir.identifier('main'),
  returnType: ir.primitiveType(ir.identifier('i32')),
  body: ir.block(),
});

// === Fluent — chain optional fields ===
const fn2 = ir.functionItem(ir.identifier('main'))
  .returnType(ir.primitiveType(ir.identifier('i32')))
  .body(ir.block());

// === Mixed — required positional + config ===
const fn3 = ir.functionItem(ir.identifier('main'), {
  returnType: ir.primitiveType(ir.identifier('i32')),
  body: ir.block(),
});

// All three produce identical NodeData. Render:
const source = render(fn1, rules.function_item);
// → "fn main() -> i32 {}"
```

## Use in a codemod (TypeScript + ast-grep)

```typescript
import { ir } from '@sittir/rust';
import { toEdit } from '@sittir/core';
import { rules } from '@sittir/rust/rules';

// After matching a node with ast-grep:
const match = sgRoot.find('println!($$$ARGS)');
const start = match.range().start.index;
const end = match.range().end.index;

// Build replacement and create edit
const replacement = ir.macroInvocation({ macro: ir.identifier('eprintln') });
const edit = toEdit(replacement, rules.macro_invocation, start, end);
// → { startPos: 42, endPos: 67, insertedText: 'eprintln!(...)' }
```

## Generate builders for a grammar

```typescript
import { generate } from '@sittir/codegen';

const files = generate({
  grammar: 'rust',
  outputDir: 'src',
});
```

## Validation

Validation happens at three levels — no render-time overhead:

```typescript
// 1. Compile-time: TypeScript types enforce correct kinds and fields
ir.function({ name: ir.block() });  // Type error — block is not an identifier

// 2. Factory-time: O(1) string input validation
ir.identifier('fn');     // Throws — 'fn' is a reserved keyword
ir.identifier('main');   // OK

// 3. Test-time: tree-sitter parse for render rule regression
// (only in codegen test suite, not runtime)
```

## Explore the grammar

```typescript
import { nodeKinds, leafKinds, keywords, operators } from '@sittir/rust/consts';

console.log(nodeKinds);   // ['function_item', 'struct_item', ...]
console.log(keywords);    // ['self', 'pub', 'mut', ...]
console.log(operators);   // ['+', '-', '*', '/', ...]
```
