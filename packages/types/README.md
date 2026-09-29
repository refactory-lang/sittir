# @sittir/types

Language-agnostic type projection from tree-sitter grammars to typed IR builders.

## Installation

```bash
pnpm add @sittir/types
```

## What It Does

Provides the runtime base classes and type-level machinery for sittir's builder system:

1. **`Builder<N>`** — abstract base class that all generated builders extend
2. **`LeafBuilder<K>`** — concrete builder for terminal nodes (identifiers, literals, keywords)
3. **`RenderContext`** — context threaded through render/build calls (parser, indent)
4. **`Edit`** — codemod-compatible text edit interface (`{ startPos, endPos, insertedText }`)

## Runtime Classes

### `Builder<N>`

Abstract base for all IR builders. Generated per-node builders extend this with their own `renderImpl()` and `build()`.

```ts
import { Builder } from '@sittir/types';

// Builder instances support multiple render modes:
builder.render('skip'); // sync, no validation
builder.render('fast'); // sync, brace/paren matching
builder.render('full', { parser }); // async, tree-sitter validation

// Direct access:
builder.renderImpl(ctx); // source string (no validation)
builder.build(ctx); // plain-object IR node
builder.toCST(offset, ctx); // lightweight CST with positions
```

### `LeafBuilder<K>`

The only way to introduce raw text into the IR. Wraps a string with a node kind:

```ts
import { LeafBuilder } from '@sittir/types';

const id = new LeafBuilder('identifier', 'main');
id.renderImpl(); // "main"
id.build(); // { kind: 'identifier' }
```

### `Edit`

Codemod-compatible text edit — replace bytes `[startPos, endPos)` with `insertedText`:

```ts
import type { Edit } from '@sittir/types';

const edit: Edit = {
	startPos: 0,
	endPos: 10,
	insertedText: 'fn main() {}'
};
```

## License

MIT
