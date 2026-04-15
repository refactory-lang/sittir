# @sittir/python

97 Python IR node kinds with self-contained builders — all generated from the tree-sitter-python grammar by `@sittir/codegen`.

## Installation

```bash
pnpm add @sittir/python
```

## Quick Start

### Fluent API

```ts
import { ir } from '@sittir/python';

const node = ir.functionDefinition(ir.identifier('greet'))
  .parameters(ir.parameters())
  .body(ir.block(
    ir.return_(ir.identifier('hello'))
  ));

node.renderImpl();  // "def greet ( ) : return hello"
```

### Declarative API (`.from()`)

```ts
// Strings auto-resolve to LeafBuilder for leaf-typed fields
const fn = ir.functionDefinition.from({
  name: 'greet',   // string → LeafBuilder('identifier', 'greet')
  parameters: ir.parameters(),
  body: ir.block(),
});
```

### Leaf Builders

```ts
ir.identifier('x')         // LeafBuilder<'identifier'>
ir.integer('42')            // LeafBuilder<'integer'>
ir.string_('hello')         // LeafBuilder<'string'>
```

### CST Round-Trip

```ts
import { fromCST, edit } from '@sittir/python';

const builder = fromCST(treeSitterNode);
const patch = edit(treeSitterNode, (b) => b.body(ir.block()));
```

## Types

```ts
import type {
  PythonGrammar,
  FunctionDefinition,
  ClassDefinition,
  Identifier,       // leaf type
  Expression,       // supertype union
  Statement,        // supertype union
} from '@sittir/python';

import type { FunctionDefinitionBuilder } from '@sittir/python';
```

## License

MIT
