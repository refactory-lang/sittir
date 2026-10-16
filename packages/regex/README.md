# @sittir/regex

Typed Regex IR builders generated from the `tree-sitter-regex` grammar by `@sittir/codegen`.

## Quick start

Install the language package with your preferred package manager; for example:

```bash
npm install @sittir/regex
```

```ts
import regex from '@sittir/regex';

using engine = await regex.createEngine();
const source = '[a-z]+';
engine.parse(source, { errors: 'throw' }).$render() === source; // true
```

## Regenerating

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
```

This grammar is included in the workspace's stable grammar and validation sets.
