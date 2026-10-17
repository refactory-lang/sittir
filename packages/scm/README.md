# @sittir/scm

Typed Scm IR builders generated from the `tree-sitter-scm` grammar by `@sittir/codegen`.

## Quick start

Install the language package with your preferred package manager; for example:

```bash
npm install @sittir/scm
```

```ts
import scm from '@sittir/scm';

using q = await scm.createEngine();
const source = '(identifier) @name';
q.parse(source, { errors: 'throw' }).$render() === source; // true
```

## Regenerating

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src
```

This grammar is included in the workspace's stable grammar and validation sets.
