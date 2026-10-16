# @sittir/rust

Typed factories, guards, kind ids, a reader and a native renderer for Rust, generated from the tree-sitter-rust grammar by `@sittir/codegen`. The package exports the language descriptor and its types; everything you call is reached through an engine.

A [portable vocabulary preview](../../docs/use-cases-and-examples.md#portable-preview), selected with `api: 'portable'`, exposes shared vocabulary kinds and guards over this language's nodes. Construction, parsing, queries, and rendering use the grammar-specific engine shown below.

## Installation

Install the language package with your preferred package manager; for example:

```bash
npm install @sittir/rust
```

## Quick start

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();

const fn = engine.build.statement.function({
	visibilityModifier: 'pub',
	name: 'main',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});

fn.$render(); // "pub fn main() {}"
engine.render(fn).toString(); // "pub fn main() {}"
```

A node belongs to the engine that built or read it, and renders, edits and takes trivia through that engine. `engine.build` is the only way to make nodes; a node made anywhere else has no engine, and `$render()` says so.

## Building

A builder called with plain values is the coercing form: strings become leaf nodes, single values become lists where a list is expected. `.strict` takes only built nodes.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();

const strict = engine.build.statement.function.strict({
	visibilityModifier: engine.build.visibilityModifier.pub(),
	name: engine.build.identifier('main'),
	parameters: engine.build.parameters.strict(),
	body: engine.build.block.strict()
});

engine.render(strict.name()).toString(); // "main"
strict.$render(); // "pub fn main() {}"
```

## Reading

`parse` returns a lazily hydrated tree: a child is read the first time an accessor reaches it. Nothing you leave alone is re-spelled, so an untouched tree renders back to its own source, byte for byte.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();
const source = 'fn main() {\n    // keep me\n    run( 1 );\n}\n';

const file = engine.parse(source);
const first = file.statements()[0];
if (first !== undefined && engine.is.functionItem(first)) {
	engine.render(first.name()).toString(); // "main"
}

file.$render() === source; // true
```

## Updating

Nodes are immutable. `$with` returns a rebuilt node, and only what you rebuild is re-spelled.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();

const fn = engine.build.statement.function({
	name: 'main',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});

fn.$with.name(engine.build.identifier('greet')).$render(); // "fn greet() {}"
```

## Comments

`$trivia` attaches comments to a node. A loose string is built into the grammar's default comment.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();

const fn = engine.build.statement.function({
	name: 'main',
	parameters: engine.build.parameters(),
	body: engine.build.block()
});

fn.$trivia.leading('// entry point').$render(); // "// entry point\nfn main() {}"
```

## Render options

An engine's render options come from the descriptor's `Options` type and are checked against it.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine({ render: { layout: { indent: '\t' } } });

const fn = engine.build.statement.function({
	name: 'f',
	parameters: engine.build.parameters(),
	body: engine.build.block({
		statements: [engine.build.expressionStatement(engine.build.identifier('a'))]
	})
});

engine.render(fn).toString(); // "fn f() {\n\ta;\n}"
```

## Editing a parsed tree

`$with` replaces one slot of a parsed node. The edited node renders its own text, and a node the edit did not touch renders the bytes it was read from.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();

const fn = engine.parse('fn  a( ) { 1 }\n').statements().find((statement) => engine.is.functionItem(statement));
fn?.$with.name(engine.build.identifier('b')).$render(); // "fn b( ) { 1 }"
```

## Guards and kinds

The guards narrow to this engine's language: a node of another engine of the language passes, a node of another language does not, and a value with no engine never does.

```ts
import rust from '@sittir/rust';

using engine = await rust.createEngine();
const built = engine.build.identifier('x');
const parsed = engine.parse('fn a() {}\n');

engine.isNode(built); // true
engine.isFactoryNode(built); // true
engine.isParsedNode(parsed); // true
engine.kinds.Identifier; // the kind id of `identifier`
```

## Types

The package index exports types only, besides the descriptor.

```ts
import type { RustAPI, FunctionItem, StructItem, Expression } from '@sittir/rust';
```

`RustAPI` is the language's type-level shape, from which every engine type is derived (`Engine<RustAPI>`).

## Regenerating

Everything under `src/` is generated. Change the grammar or the codegen, never the output:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
```

## License

MIT
