# @sittir/regex

Typed Regex IR builders generated from the `tree-sitter-regex` grammar by `@sittir/codegen`.

## Quick start

```bash
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

## Regenerating

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
```

This grammar is included in the workspace's stable grammar and validation sets.
