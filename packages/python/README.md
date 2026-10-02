# @sittir/python

Typed factories, guards, kind ids, a reader and a native renderer for Python, generated from the tree-sitter-python grammar by `@sittir/codegen`. The package exports the language descriptor and its types; everything you call is reached through an engine.

## Installation

```bash
pnpm add @sittir/common @sittir/python
```

## Quick start

```ts
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);

const fn = engine.build.functionDefinition({
	name: 'greet',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});

fn.$render(); // "def greet():"
engine.render(fn).toString(); // the same text
```

A node belongs to the engine that built or read it, and renders, edits and takes trivia through that engine. `engine.build` is the only way to make nodes; a node made anywhere else has no engine, and `$render()` says so.

## Reading

`parse` returns a lazily hydrated tree: a child is read the first time an accessor reaches it. Nothing you leave alone is re-spelled, so an untouched tree renders back to its own source, byte for byte.

```ts
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);
const source = 'def greet(name):\n    # say hello\n    print( name )\n';

const module = engine.parse(source);
module.$render() === source; // true
```

## Comments

`$trivia` attaches comments to a node. A loose string is built into the grammar's default comment.

```ts
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);

const fn = engine.build.functionDefinition({
	name: 'greet',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});

fn.$trivia.leading('# entry point').$render(); // "# entry point\ndef greet():"
```

## Guards

The guards narrow to this engine's language: a node of another engine of the language passes, a node of another language does not, and a value with no engine never does.

```ts
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);
const built = engine.build.functionDefinition({
	name: 'greet',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});

engine.isNode(built); // true
engine.isFactoryNode(built); // true
engine.isParsedNode(built); // false
```

## Types

The package index exports types only, besides the descriptor.

```ts
import type { PythonAPI, FunctionDefinition, ClassDefinition } from '@sittir/python';
```

`PythonAPI` is the language's type-level shape, from which every engine type is derived (`Engine<PythonAPI>`).

## Regenerating

Everything under `src/` is generated. Change the grammar or the codegen, never the output:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
```

## License

MIT
