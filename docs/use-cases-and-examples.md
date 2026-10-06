# sittir — Use Cases & Examples

> **Purpose:** Mixes **current** public API examples with **target** examples for
> surfaces that are planned but not fully landed yet. It still serves as a
> user guide and a development litmus test, but not every snippet below is
> expected to compile against today's implementation.
>
> **Grammars:** Rust (`@sittir/rust`), TypeScript (`@sittir/typescript`), Python (`@sittir/python`).
>
> **Status:** The compile-checked current examples live under
> [`examples/`](../examples/) and currently cover:
> `01-construct-nodes.ts`, `02-render-round-trip.ts`,
> `07-read-source.ts`, `09-type-guards.ts`, and `23-read-query-with.ts`.
>
> The biggest **pending** surfaces called out below are:
>
> - `template(...)` and `snippets.*` construction helpers — not shipped yet
> - `engine.findAndRead(...)` — intended surface, but not wired/implemented yet
> - older docs that still show `wrap(...)` instead of the current `wrapNode(...)`,
>   and `engine.findAndRead(...)` results that a shipped surface would already
>   hand back wrapped
>
> **Access conventions:** Factory and wrap output exposes named fields via getter methods (`fn.name()`). Raw storage uses `_storageName` prefix (`fn._name`). `$with` provides immutable updates. All sittir methods use `$`-prefix.
>
> **Executable companions:** Source-form TypeScript versions of these examples
> live under [`examples/`](../examples/). Stable examples graduate into the
> compile gate, which also runs them (`tests/acceptance/examples-run.test.ts`); pending target-surface examples stay documented here until the
> implementation catches up.

## 1. Construct nodes with factories

A node belongs to the engine that built or read it, and renders, edits and takes trivia through that engine. Every snippet below builds through an engine — `ir` is that engine's `build` — because a node made anywhere else has no engine and `$render()` says so.

### Factory API — explicit construction

Every node is constructed with its factory. No-arg calls produce empty nodes: no children and optional fields absent.

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

// pub fn main() {}
const fn = ir.functionItem({
	visibilityModifier: ir.visibilityModifier(),
	name: ir.identifier('main'),
	parameters: ir.parameters(),
	body: ir.block()
});

// Access via getter methods.
fn.name(); // returns the name value (terminal-hoisted: string "main")
fn.body(); // returns the Block UntypedNode
fn.$render(); // "pub fn main() {}"
```

### Factory API — nested

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

// pub fn greet(name: &str) -> String {
//     format!("Hello, {}!", name)
// }
const fn = ir.functionItem({
	visibilityModifier: ir.visibilityModifier(),
	name: ir.identifier('greet'),
	parameters: ir.parameters([
		ir.parameter({
			pattern: ir.identifier('name'),
			type: ir.referenceType({
				type: ir.primitiveType('str')
			})
		})
	]),
	returnType: ir.typeIdentifier('String'),
	body: ir.block([
		ir.expressionStatement({
			expression: ir.macroInvocation({
				macro: ir.identifier('format!'),
				args: ir.tokenTree([
					ir.stringLiteral('"Hello, {}!"'),
					ir.identifier('name')
				])
			})
		})
	])
});
```

### Coercion — the same function, simplified

Coercion resolves at every level:

- Strings become appropriate leaf nodes.
- Single values wrap in an array where an array is expected.
- Arrays wrap in the parent node where a parent is expected.
- Omitted optional fields produce no output.

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

const fn = ir.functionItem({
	visibilityModifier: 'pub',
	name: 'greet',
	parameters: { pattern: 'name', type: '&str' },
	returnType: 'String',
	body: ir.expressionStatement({
		expression: ir.macroInvocation({
			macro: ir.identifier('format!'),
			args: ir.tokenTree([
				ir.stringLiteral('"Hello, {}!"'),
				ir.identifier('name')
			])
		})
	})
});
```

### Coercion — minimal

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

// fn main() {}
const fn = ir.functionItem({ name: 'main' });
```

### Immutable updates with `$with`

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

const fn = ir.functionItem({ name: 'main' });
const stmt = ir.expressionStatement({ expression: 'todo!()' });

const renamed = fn.$with.name(ir.identifier('greet'));
const withReturn = renamed.$with.returnType(ir.typeIdentifier('String'));
const withBody = withReturn.$with.body(ir.block([stmt]));

// Chained:
const updated = fn
	.$with.name(ir.identifier('greet'))
	.$with.returnType(ir.typeIdentifier('String'))
	.$with.body(ir.block([stmt]));
```

### Side-by-side: struct

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

// pub struct Config { pub host: String, port: u16 }

// Factory API.
const s = ir.structItem({
	visibilityModifier: ir.visibilityModifier(),
	name: ir.typeIdentifier('Config'),
	body: ir.fieldDeclarationList([
		ir.fieldDeclaration({
			visibilityModifier: ir.visibilityModifier(),
			name: ir.fieldIdentifier('host'),
			type: ir.typeIdentifier('String')
		}),
		ir.fieldDeclaration({
			name: ir.fieldIdentifier('port'),
			type: ir.primitiveType('u16')
		})
	])
});

// coercing API.
const sFrom = ir.structItem({
	visibilityModifier: 'pub',
	name: 'Config',
	body: [
		{ visibilityModifier: 'pub', name: 'host', type: 'String' },
		{ name: 'port', type: 'u16' }
	]
});
```

## 2. Render UntypedNode to source

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

const fn = ir.functionItem({ visibilityModifier: 'pub', name: 'main' });
fn.$render();
// "pub fn main() {}"
```

### Round-trip: read → render

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);
const tree = engine.parse(source);
tree.$render() === source; // nothing was rebuilt, so nothing is re-spelled
```

Rendering is format-preserving by default. Only what you rebuild renders in
the canonical spelling; anything you left alone comes back as its own bytes,
comments and blank lines and indentation included.

## 3. Attach comments with `.$trivia`

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

const fn = ir
	.functionItem({ visibilityModifier: 'pub', name: 'main' })
	.$trivia.leading(ir.docComment('/// Entry point.'));

fn.$render();
// "/// Entry point.\npub fn main() {}"
```

### Leading and trailing trivia

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const { build: ir } = await createEngine(rust);

const fn = ir
	.functionItem({ visibilityModifier: 'pub', name: 'main' })
	.$trivia.leading(ir.lineComment('// @generated'), ir.docComment('/// Main.'))
	.$trivia.trailing(ir.lineComment('// end main'));
```

`$trivia.leading(...)` and `$trivia.trailing(...)` each take a spread and set one side, keeping the other, so they chain. `$trivia` is its positions; the node itself is not callable.

A node with nothing in it takes inner trivia, rendered where its children would go:

```ts
const todo = ir.functionItem({
	name: 'todo',
	parameters: ir.parameters(),
	body: ir.block().$trivia.inner(ir.lineComment(' TODO'))
});
todo.$render(); // fn todo() {\n    // TODO\n}
```

Only an empty node has `inner`: a factory call with no arguments returns the empty form (`EmptyBlock`), and `engine.isEmptyNode(node)` narrows a read node to it.

## 4. Construction templates — pre-compiled

### Template file

```rust
// snippets/impl-display.rust.template
impl std::fmt::Display for $TYPE {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", $EXPR)
    }
}
```

### Usage

```ts
import { snippets, ir } from '@sittir/rust';

const source = snippets.implDisplay
	.fill({
		TYPE: ir.typeIdentifier('Config'),
		EXPR: ir.fieldExpression({
			value: ir.selfExpression(),
			field: ir.fieldIdentifier('host')
		})
	})
	.render();
```

### With `.from()` on slots

```ts
import { snippets, ir } from '@sittir/rust';

const source = snippets.implDisplay
	.from({
		TYPE: 'Config',
		EXPR: ir.fieldExpression({
			value: ir.selfExpression(),
			field: ir.fieldIdentifier('host')
		})
	})
	.render();
```

## 5. Construction templates — inline

```ts
import { template, ir } from '@sittir/rust';

const letBinding = template('let $NAME: $TYPE = $VALUE;');

const source = letBinding
	.fill({
		NAME: ir.identifier('config'),
		TYPE: ir.typeIdentifier('Config'),
		VALUE: ir.structExpression({
			name: 'Config',
			body: [
				{ name: 'host', value: '"localhost"' },
				{ name: 'port', value: '8080' }
			]
		})
	})
	.render();
```

## 6. Composition

`.read()` returns UntypedNode, so its output is valid as a slot for another template.

```ts
import { snippets, template, ir } from '@sittir/rust';

const method = snippets.pubMethod
	.fill({
		NAME: ir.identifier('new'),
		PARAMS: ir.parameter({ name: 'host', type: 'String' }),
		RET: ir.typeIdentifier('Self'),
		BODY: template('Self { $...FIELDS }')
			.fill({
				FIELDS: [ir.fieldInitializer({ name: 'host', value: 'host' })]
			})
			.read()
	})
	.read();

const source = snippets.implBlock
	.fill({
		TYPE: ir.typeIdentifier('Config'),
		METHODS: method
	})
	.render();
```

## 7. Read source into UntypedNode

```ts
import { createEngine } from '@sittir/rust';

const engine = createEngine();
const tree = engine.parse(source);
// tree.statements()[0].name() — accessors return wrapped nodes at every level.
// engine.diagnostics.parseAndRead(source) exposes the raw `{ root, tree }` instead.
```

### Read depth

Reading is lazy: `parse` expands one level, and a child with substructure is
a stub the accessors hydrate on first access. `{ deep: true }` expands the
whole tree up front instead — one crossing rather than one per level, at the
cost of reading what you may never touch. A list owner (a function's
`parameters`) is the exception to one level: it is expanded together with its
list, whose items stay stubs, so its `length` and indices need no crossing of
their own.

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);
const lazy = engine.parse(source);
const eager = engine.parse(source, { deep: true });
```

Depth also decides how much of the source survives a render, because only a
level that was expanded can be rebuilt. `lazy.$render()` returns the source
byte for byte; `eager.$render()` re-spells every level canonically. Both
re-parse to the same tree.

`engine.diagnostics.parseAndRead(source, { deep })` returns the same read
un-wrapped, as `{ root, tree }`, for tooling; the tree is bound to the engine,
so what is wrapped over it renders through it.

### Wrapped access

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);
const fn = engine.parse(source).statements()[0];
fn.name(); // read from the tree on first access
fn.body(); // returns the Block; the same node on every later call
fn.body().statements(); // the statements list, also the same list each time
```

### Query a parsed tree

`$query()` on a parsed node returns its query facet: `$children` (one level
down), `$descendants` (every level, in source order), and one view per slot,
holding what that slot's accessor returns. A view is lazy and takes the
read-only array verbs (`filter`, `map`, `find`, `some`, `slice`, `at`, …) plus
`ofType(kind)` and `where(condition)`. `ofType` and `where` run in the native
walk, so only the nodes that pass them are hydrated, and a terminal such as
`find` stops the walk at its answer. A condition names slots of the kind and
tests their text with `eq` or `match`, combined with `and`, `or` and `not`.
`engine.query(node)` returns the same facet for any node; a leaf's facet has
no slots and empty traversals.

```ts
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);
const root = engine.parse(source);

// Calls whose callee is `open`, at any depth.
const opens = [...root.$query().$descendants.ofType(engine.kinds.Call).where((call) => call.function.eq('open'))];

// Names of private, non-dunder functions.
const helpers = root
	.$query()
	.$descendants.ofType(engine.kinds.FunctionDefinition)
	.where((fn) => fn.name.match(/^_/).and(fn.name.match(/^__/).not()))
	.map((fn) => fn.name());
```

In Python, a statement that is only `print(x)` parses as the Python 2 print
statement (`PrintStatement`), not a `Call`; inside an expression it is a call.

### Edit a parsed node with `$with`

`$with.<slot>(value)` returns a copy of a parsed node with one slot replaced;
every child the edit did not touch renders the bytes it was read from. An
edited child goes back into its parent through the parent's `$with`.

```ts
const fn = root
	.$query()
	.$descendants.ofType(engine.kinds.FunctionDefinition)
	.where((candidate) => candidate.name.eq('_next'))
	.find();
const renamed = fn?.$with.name(engine.build.identifier('_advance'));

const file = root.$with.statements(
	...root
		.statements()
		.map((statement) =>
			engine.is.functionDefinition(statement) && engine.render(statement.name()).toString() === 'load'
				? statement.$with.name(engine.build.identifier('read_file'))
				: statement
		)
);
```

A node a view yields is a separate object from the one an accessor returns
for the same place in the source, so `===` cannot match them; a view's
`includes` compares places in the source instead.

The runnable versions, with an outline read through the accessors, are in
[`examples/23-read-query-with.ts`](../examples/23-read-query-with.ts).

## 8. Find nodes by pattern

```ts
import { createEngine, wrap } from '@sittir/rust';

const engine = createEngine();
const tree = engine.parse(source);
const matches = engine.findAndRead(source, 'pub fn $NAME($...PARAMS) $BODY');
for (const match of matches) {
	console.log(wrap(match, tree).name());
}
```

## 9. Type guards

```ts
import { is } from '@sittir/rust';

for (const stmt of tree.statements()) {
	if (is.functionItem(stmt)) {
		console.log(`Function: ${stmt.name()}`);
	} else if (is.structItem(stmt)) {
		console.log(`Struct: ${stmt.name()}`);
	}
}
```

## 10. Cross-language migration

TypeScript interface → Python dataclass.

```ts
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);

const typeMap: Record<string, string> = {
	string: 'str',
	number: 'int',
	boolean: 'bool',
};

export function interfaceToPythonDataclass(tsSource: string) {
	const program = engine.parse(tsSource);
	const iface = program.statements().find(engine.is.interfaceDeclaration);
	if (iface === undefined) {
		throw new Error('Expected a top-level TypeScript interface declaration.');
	}

	const fields = (iface.body().content().members()?.members() ?? []).flatMap((member) => {
		if (!engine.is.propertySignature(member)) return [];
		const annotation = member.type()?.type();
		const rawType = annotation === undefined ? 'Any' : engine.render(annotation).toString();
		return [`    ${engine.render(member.name())}: ${typeMap[rawType] ?? rawType}`];
	});

	return ['@dataclass', `class ${engine.render(iface.name())}:`, ...(fields.length > 0 ? fields : ['    pass'])].join('\n');
}
```

## 11. Generate a file from scratch

```ts
import fs from 'node:fs';
import { ir, snippets, template } from '@sittir/rust';

const file = ir.sourceFile({
	statements: [
		ir.useDeclaration({ path: 'std::collections::HashMap' }),

		ir
			.structItem({
				visibilityModifier: 'pub',
				name: 'Cache',
				body: { name: 'entries', type: 'HashMap<String, String>' }
			})
			.$trivia.leading(ir.docComment('/// In-memory key-value cache.')),

		snippets.implBlock
			.fill({
				TYPE: ir.typeIdentifier('Cache'),
				METHODS: snippets.pubMethod
					.fill({
						NAME: ir.identifier('new'),
						RET: ir.typeIdentifier('Self'),
						BODY: template('Self { entries: HashMap::new() }').fill({}).read()
					})
					.read()
			})
			.read()
	]
});

fs.writeFileSync('src/cache.rs', file.$render());
```

## 12. Dogfooding

sittir's codegen emitters use TypeScript grammar construction templates.

```ts
import { snippets, template, ir } from '@sittir/typescript';

export function emitIsModule(grammar: GrammarModel): string {
	const guards = grammar.kinds.map((kind) =>
		snippets.typeGuard
			.fill({
				NAME: ir.identifier(`is${pascalCase(kind)}`),
				TYPE: ir.typeReference(pascalCase(kind)),
				KIND: ir.stringLiteral(kind)
			})
			.render()
	);

	const dispatchObj = template('export const is = { $...ENTRIES }')
		.fill({
			ENTRIES: grammar.kinds.map((kind) =>
				ir.shorthandPropertyAssignment(ir.identifier(`is${pascalCase(kind)}`))
			)
		})
		.render();

	return [...guards, dispatchObj].join('\n\n');
}
```

## Coercion resolution rules

| Input                           | Field expects             | Resolution                                  |
| ------------------------------- | ------------------------- | ------------------------------------------- |
| `'main'`                        | Identifier                | `ir.identifier('main')`                     |
| `'String'`                      | Type                      | `ir.typeIdentifier('String')`               |
| `'pub'`                         | Visibility                | `ir.visibilityModifier()`                   |
| `42`                            | Expression                | `ir.integerLiteral('42')`                   |
| `{ pattern: 'x', type: 'i32' }` | Parameter                 | `ir.parameter(...)`                    |
| `{ pattern: 'x', type: 'i32' }` | Parameters                | `ir.parameters(ir.parameter(...))`     |
| `[p1, p2]`                      | Parameters                | `ir.parameters(resolved(p1), resolved(p2))` |
| `parameterNode`                 | Parameters                | `ir.parameters(parameterNode)`              |
| `parametersNode`                | Parameters                | pass through                                |
| `stmt`                          | Block                     | `ir.block({ children: [stmt] })`            |
| `[s1, s2]`                      | Block                     | `ir.block({ children: [s1, s2] })`          |
| `blockNode`                     | Block                     | pass through                                |
| omitted                         | Optional                  | no output                                   |
| omitted                         | Required no-arg factory   | empty node                                  |

## Litmus test

- [ ] `ir.*()` — no-arg = empty node
- [ ] `ir.*(...)` — string → leaf, single → array, array → wrapped, omitted → none
- [ ] `is.*()` runtime type guards
- [ ] `$render()` producing byte-identical round-trips
- [ ] `.$trivia` — leading/trailing comment attachment, typed per grammar
- [ ] `$with.field(v)` — immutable per-field updates, chaining works
- [ ] `snippets.*.fill({}).read()` / `.render()` — pre-compiled templates
- [ ] `snippets.*.from({})` — template fill with coercion
- [ ] `template('...').fill({}).read()` / `.render()` — inline templates
- [ ] Composition: `.read()` output as slot input for another template
- [x] `engine.parse()` with depth control, `$parentHandle` / `$childIndex` hydration
- [ ] `engine.readUntypedNode(handle, childIndex)` for lazy hydration
- [ ] `engine.findAndRead()` with pattern matching
- [ ] `wrap(node, tree)` — getter methods with `hydrateChild` for lazy hydration
- [ ] Format-preserving transforms
- [ ] Native backend: one crossing per terminal
