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

using rs = await rust.createEngine();

const fn = rs.build.statement.function({
	visibilityModifier: 'pub',
	name: 'main',
	parameters: rs.build.parameters(),
	body: rs.build.block()
});

fn.$render(); // "pub fn main() {}"
rs.render(fn).toString(); // "pub fn main() {}"
```

A node belongs to the engine that built or read it, and renders, edits and takes trivia through that engine. `rs.build` is the only way to make nodes; a node made anywhere else has no engine, and `$render()` says so.

## Building

A builder called with plain values is the coercing form: strings become leaf nodes, single values become lists where a list is expected. `.strict` takes only built nodes.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();

const strict = rs.build.statement.function.strict({
	visibilityModifier: rs.build.visibilityModifier.pub(),
	name: rs.build.identifier('main'),
	parameters: rs.build.parameters.strict(),
	body: rs.build.block.strict()
});

rs.render(strict.name()).toString(); // "main"
strict.$render(); // "pub fn main() {}"
```

## Reading

`parse` returns a lazily hydrated tree: a child is read the first time an accessor reaches it. Nothing you leave alone is re-spelled, so an untouched tree renders back to its own source, byte for byte.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();
const source = 'fn main() {\n    // keep me\n    run( 1 );\n}\n';

const file = rs.parse(source);
const first = file.statements()[0];
if (first !== undefined && rs.is.functionItem(first)) {
	rs.render(first.name()).toString(); // "main"
}

file.$render() === source; // true
```

## Updating

Nodes are immutable. `$with` returns a rebuilt node, and only what you rebuild is re-spelled.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();

const fn = rs.build.statement.function({
	name: 'main',
	parameters: rs.build.parameters(),
	body: rs.build.block()
});

fn.$with.name(rs.build.identifier('greet')).$render(); // "fn greet() {}"
```

## Comments

`$trivia` attaches comments to a node. A loose string is built into the grammar's default comment.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();

const fn = rs.build.statement.function({
	name: 'main',
	parameters: rs.build.parameters(),
	body: rs.build.block()
});

fn.$trivia.leading('// entry point').$render(); // "// entry point\nfn main() {}"
```

## Render options

An engine's render options come from the descriptor's `Options` type and are checked against it.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine({ render: { layout: { indent: '\t' } } });

const fn = rs.build.statement.function({
	name: 'f',
	parameters: rs.build.parameters(),
	body: rs.build.block({
		statements: [rs.build.expressionStatement(rs.build.identifier('a'))]
	})
});

rs.render(fn).toString(); // "fn f() {\n\ta;\n}"
```

## Editing a parsed tree

`$with` replaces one slot of a parsed node. The edited node renders its own text, and a node the edit did not touch renders the bytes it was read from.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();

const fn = rs.parse('fn  a( ) { 1 }\n').statements().find((statement) => rs.is.functionItem(statement));
fn?.$with.name(rs.build.identifier('b')).$render(); // "fn b( ) { 1 }"
```

## Guards and kinds

The guards narrow to this engine's language: a node of another engine of the language passes, a node of another language does not, and a value with no engine never does.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();
const built = rs.build.identifier('x');
const parsed = rs.parse('fn a() {}\n');

rs.isNode(built); // true
rs.isFactoryNode(built); // true
rs.isParsedNode(parsed); // true
rs.kinds.Identifier; // the kind id of `identifier`
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
