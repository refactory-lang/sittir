# @sittir/regex

Sittir's generated API for the tree-sitter regex grammar. This package is included in the workspace's stable grammar and validation sets.

```sh
pnpm add @sittir/common @sittir/regex
```

```ts
import { createEngine } from '@sittir/common';
import regex from '@sittir/regex';

const engine = await createEngine(regex);
const source = '[a-z]+';
engine.parse(source, { errors: 'throw' }).$render() === source; // true
engine.dispose();
```

The grammar describes regex syntax; it is not a regex execution engine or a guarantee of compatibility with every regex dialect. Use its generated types and builders for the admitted syntax. See the [usage guide](../../docs/use-cases-and-examples.md) and [regeneration workflow](../../DEVELOPMENT.md#regeneration).
