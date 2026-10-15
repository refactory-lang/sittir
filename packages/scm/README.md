# @sittir/scm

Typed Scm IR builders generated from the `tree-sitter-scm` grammar by `@sittir/codegen`.

## Quick start

```bash
pnpm add @sittir/common @sittir/scm
```

```ts
import { createEngine } from '@sittir/common';
import scm from '@sittir/scm';

using engine = await createEngine(scm);
const source = '(identifier) @name';
engine.parse(source, { errors: 'throw' }).$render() === source; // true
```

## Regenerating

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src
```

This grammar is included in the workspace's stable grammar and validation sets.
