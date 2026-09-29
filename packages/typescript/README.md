# @sittir/typescript

Typed factories, guards, kind ids, a reader and a native renderer for TypeScript, generated from the tree-sitter-typescript grammar by `@sittir/codegen`. The package exports the language descriptor and its types; everything you call is reached through an engine.

## Installation

```bash
pnpm add @sittir/common @sittir/typescript
```

## Quick start

```ts
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);

const iface = engine.build.interfaceDeclaration({
	name: 'User',
	body: engine.build.objectType.curly()
});

iface.$render(); // "interface User {}"
engine.render(iface).toString(); // the same text
```

A node belongs to the engine that built or read it, and renders, edits and takes trivia through that engine. `engine.build` is the only way to make nodes; a node made anywhere else has no engine, and `$render()` says so.

## Reading

`parse` returns a lazily expanded tree: a child is read the first time an accessor reaches it. Nothing you leave alone is re-spelled, so an untouched tree renders back to its own source, byte for byte.

```ts
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);
const source = 'let x:   number = 1; // keep me\n';

const program = engine.parse(source);
program.$render() === source; // true
```

## Comments

`$trivia` attaches comments to a node. A loose string is built into the grammar's default comment.

```ts
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);

const iface = engine.build.interfaceDeclaration({
	name: 'User',
	body: engine.build.objectType.curly()
});

iface.$trivia('// the user').$render(); // "// the user\ninterface User {}"
```

## Guards

The guards narrow to this engine's language: a node of another engine of the language passes, a node of another language does not, and a value with no engine never does.

```ts
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);
const built = engine.build.interfaceDeclaration({
	name: 'User',
	body: engine.build.objectType.curly()
});

engine.isNode(built); // true
engine.isFactoryNode(built); // true
engine.isParsedNode(built); // false
```

## Types

The package index exports types only, besides the descriptor.

```ts
import type { TypescriptAPI, InterfaceDeclaration, FunctionDeclaration } from '@sittir/typescript';
```

`TypescriptAPI` is the language's type-level shape, from which every engine type is derived (`Engine<TypescriptAPI>`).

## Regenerating

Everything under `src/` is generated. Change the grammar or the codegen, never the output:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
```

## License

MIT
