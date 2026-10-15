# @sittir/scm

Sittir's generated API for tree-sitter query syntax (SCM). This package is included in the workspace's stable grammar and validation sets.

```sh
pnpm add @sittir/common @sittir/scm
```

```ts
import { createEngine } from '@sittir/common';
import scm from '@sittir/scm';

const engine = await createEngine(scm);
const source = '(identifier) @name';
engine.parse(source, { errors: 'throw' }).$render() === source; // true
engine.dispose();
```

This grammar models query syntax, not general Scheme. Parsing a query does not validate its node/field names against another language's grammar. See the [usage guide](../../docs/use-cases-and-examples.md) and [regeneration workflow](../../DEVELOPMENT.md#regeneration).
