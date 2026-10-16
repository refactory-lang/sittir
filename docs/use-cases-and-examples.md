# Usage guide

These examples target `master` and are type-checked and executed by the documentation acceptance test. Larger runnable modules are indexed in [examples](../examples/README.md).

## Engine and language

Install the language package with your preferred package manager (for example, `npm install @sittir/rust`). It exports generated types and a descriptor with its own `createEngine()` factory. Use the resulting engine's `build`, `is`, `kinds`, `parse`, and `render` surface. A node's rendering and query operations depend on its engine. A `using` declaration disposes the engine when its scope exits, including when an exception is thrown; keep the node operations inside that scope.

At module scope, `using` disposes the engine when module evaluation finishes, so exported engines or callbacks that run later need an explicitly managed, longer-lived engine.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();
const name = rs.build.identifier('value');
name.$render(); // "value"
rs.isFactoryNode(name); // true
```

## Construction and coercion

The ordinary builder resolves ergonomic inputs according to the slot's grammar-derived type. `.strict` takes the explicit constructor shape. A lexical builder still takes text, and fixed syntax may be represented by a kind ID rather than a node factory.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();
const fn = rs.build.statement.function.strict({
	name: rs.build.identifier('main'),
	parameters: rs.build.parameters.strict(),
	body: rs.build.block.strict()
});
fn.$render(); // "fn main() {}"
```

Builders expose the grammar's forms, not a uniform object constructor for every kind. Lists may be variadic; forms may have separate named paths; required slots remain required. Use the generated signature rather than guessing an omitted field or a default arm. Lexical validation does not establish semantic validity of the resulting program.

## Parsing and errors

`parse` returns the typed root. Accessors materialize children on demand. An untouched root retains its source spelling.

```ts
import typescript from '@sittir/typescript';

using ts = await typescript.createEngine();
const source = 'const answer: number = 42; // retained\n';
const root = ts.parse(source, { errors: 'throw' });
root.$errors.length === 0; // true
root.$render() === source; // true
```

Without `errors: 'throw'`, inspect `root.$errors` before assuming a complete parse. `depth` controls eager hydration; increasing it is not a repair for an invalid grammar or source.

## Accessors, guards, and immutable updates

Accessors return their declared slot values. A guard narrows a grammar kind; it is not a structural test for an arbitrary object with a matching `$type`.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();
const root = rs.parse('fn old_name() {}\n');
const statements = root.statements().map((node) =>
	rs.is.functionItem(node)
		? node.$with.name(rs.build.identifier('new_name'))
		: node
);
const updated = root.$with.statements(...statements);
updated.$render(); // "fn new_name() {}\n"
root.$render(); // "fn old_name() {}\n"
```

Rebuilding a child leaves its ancestors unchanged. Return or render the updated root when transforming an entire file. Source-preserving edits retain untouched child bytes; rebuilt syntax follows the grammar's render rules.

## Querying parsed syntax

A parsed node's `$query()` exposes typed slot views and structural walks. `ofType` narrows kinds; `where` predicates operate on query facets rather than eagerly materialized node accessors.

```ts
import python from '@sittir/python';

using py = await python.createEngine();
const root = py.parse('load(1)\nstore(2)\n');
const calls = Array.from(
	root.$query().$descendants.ofType(py.kinds.Call)
		.where((call) => call.function.eq('load'))
);
calls.length === 1; // true
```

Queries require parsed structure. A newly constructed node or draft is not a parsed tree; render the updated root and parse the result again before querying it. [Read/query/update examples](../examples/23-read-query-with.ts) show slot views, traversal, and ancestor reconstruction together.

## Rendering

`node.$render()` returns source text. `engine.render(node)` returns a render result with `toString()`, `print()`, and `save(path)`. Render options are typed by the selected grammar.

```ts
import rust from '@sittir/rust';

using rs = await rust.createEngine();
const name = rs.build.identifier('value');
rs.render(name).toString(); // "value"
```

Parsed nodes can reuse their source bytes. A fresh build is rendered from its structure. Neither path promises that every grammar construct is covered without exclusions; the native validation baseline records that coverage.

## Comments and layout

Use `$trivia` rather than editing raw layout storage. Leading and trailing trivia belong to the node. Inner trivia requires an appropriate empty node; the grammar and engine determine eligibility.

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

## Types and engine selection

Use per-kind exported types for language-specific code, or `Engine<LanguageAPI>` and the engine type map for generic utilities. Use a builder's `.strict` entry for strict construction; engine-wide `api: 'strict'` selection is reserved and currently throws.

## Portable preview

Languages with authored bindings expose a portable vocabulary preview through `api: 'portable'`. Its `kinds` groups grammar kind IDs under shared vocabulary paths, with each path's admitted IDs in `$ids`; `is` supplies the corresponding language-scoped guards. These classify grammar-specific nodes, and some classifications require parent/slot context.

Use the grammar-specific engine for construction, parsing, queries, and rendering. Portable node projections, readers, and builders remain planned. The [runtime example](../packages/common/README.md#portable-preview) demonstrates the current typed preview entry point.

See [shared types](../packages/types/README.md), the generated declarations, and [architecture](architecture.md) for the type families and runtime boundaries.
