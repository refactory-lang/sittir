# @sittir/typescript

140 TypeScript IR node kinds with self-contained builders — all generated from the tree-sitter-typescript grammar by `@sittir/codegen`.

## Installation

```bash
pnpm add @sittir/typescript
```

## Quick Start

### Fluent API

```ts
import { ir } from '@sittir/typescript';

const node = ir.functionDeclaration(ir.identifier('greet'))
  .parameters(ir.formalParameters())
  .returnType(ir.typeAnnotation(ir.predefinedType('string')))
  .body(ir.statementBlock(
    ir.return_().children(ir.identifier('hello'))
  ));

node.renderImpl();  // "function greet ( ) : string { return hello }"
```

### Declarative API (`.from()`)

```ts
// Strings auto-resolve to LeafBuilder for leaf-typed fields
const fn = ir.function_.from({
  name: 'greet',   // string → LeafBuilder('identifier', 'greet')
  parameters: ir.formalParameters(),
  body: ir.statementBlock(),
});
```

### Leaf Builders

```ts
ir.identifier('x')         // LeafBuilder<'identifier'>
ir.typeIdentifier('Props')  // LeafBuilder<'type_identifier'>
ir.predefinedType('string') // LeafBuilder<'predefined_type'>
ir.propertyIdentifier('name')
```

### CST Round-Trip

```ts
import { fromCST, edit } from '@sittir/typescript';

const builder = fromCST(treeSitterNode);
const patch = edit(treeSitterNode, (b) => b.body(ir.statementBlock()));
```

## Types

```ts
import type {
  TypescriptGrammar,
  FunctionDeclaration,
  Identifier,       // leaf type
  Expression,       // supertype union
  Statement,        // supertype union
} from '@sittir/typescript';

import type { FunctionBuilder } from '@sittir/typescript';
```

## License

MIT
