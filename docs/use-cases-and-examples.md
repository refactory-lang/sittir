# sittir — Use Cases & Examples

> **Purpose:** Depicts sittir's fully realized API across realistic scenarios. It serves as both a user guide and a development litmus test: when every example compiles and runs correctly, the product is complete.
>
> **Grammars:** Rust (`@sittir/rust`), TypeScript (`@sittir/typescript`), Python (`@sittir/python`).
>
> **Status:** These examples document the target public API. Some surfaces are aspirational until the corresponding litmus-test items at the end of this document are checked off.
>
> **Access conventions:** Factory and wrap output exposes named fields via getter methods (`fn.name()`). Raw storage uses `_storageName` prefix (`fn._name`). `$with` provides immutable updates. All sittir methods use `$`-prefix.
>
> **Executable companions:** Source-form TypeScript versions of these examples live under [`examples/`](../examples/). They are written as callable modules so examples can graduate from documentation to compile/run checks as the target API lands.

## 1. Construct nodes with factories

### Factory API — explicit construction

Every node is constructed with its factory. No-arg calls produce empty nodes: no children and optional fields absent.

```ts
import { ir } from '@sittir/rust';

// pub fn main() {}
const fn = ir.functionItem({
	visibilityModifier: ir.visibilityModifier(),
	name: ir.identifier('main'),
	parameters: ir.parameters(),
	body: ir.block()
});

// Access via getter methods.
fn.name(); // returns the name value (terminal-hoisted: string "main")
fn.body(); // returns the Block NodeData
fn.$render(); // "pub fn main() {}"
```

### Factory API — nested

```ts
import { ir } from '@sittir/rust';

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

### `.from()` — the same function, simplified

`.from()` resolves at every level:

- Strings become appropriate leaf nodes.
- Single values wrap in an array where an array is expected.
- Arrays wrap in the parent node where a parent is expected.
- Omitted optional fields produce no output.

```ts
import { ir } from '@sittir/rust';

const fn = ir.functionItem.from({
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

### `.from()` — minimal

```ts
import { ir } from '@sittir/rust';

// fn main() {}
const fn = ir.functionItem.from({ name: 'main' });
```

### Immutable updates with `$with`

```ts
import { ir } from '@sittir/rust';

const fn = ir.functionItem.from({ name: 'main' });
const stmt = ir.expressionStatement.from({ expression: 'todo!()' });

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
import { ir } from '@sittir/rust';

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

// `.from()` API.
const sFrom = ir.structItem.from({
	visibilityModifier: 'pub',
	name: 'Config',
	body: [
		{ visibilityModifier: 'pub', name: 'host', type: 'String' },
		{ name: 'port', type: 'u16' }
	]
});
```

## 2. Render NodeData to source

```ts
import { ir } from '@sittir/rust';

const fn = ir.functionItem.from({ visibilityModifier: 'pub', name: 'main' });
fn.$render();
// "pub fn main() {}"
```

### Round-trip: read → render

```ts
import { createEngine } from '@sittir/rust';

const engine = createEngine();
const tree = engine.parseAndRead(source);
tree.$render() === source; // byte-identical for well-formed input
```

## 3. Attach comments with `.$trivia()`

```ts
import { ir } from '@sittir/rust';

const fn = ir.functionItem
	.from({ visibilityModifier: 'pub', name: 'main' })
	.$trivia(ir.docComment('/// Entry point.'));

fn.$render();
// "/// Entry point.\npub fn main() {}"
```

### Leading and trailing trivia

```ts
import { ir } from '@sittir/rust';

const fn = ir.functionItem.from({ visibilityModifier: 'pub', name: 'main' }).$trivia({
	leading: [ir.lineComment('// @generated'), ir.docComment('/// Main.')],
	trailing: [ir.lineComment('// end main')]
});
```

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
		VALUE: ir.structExpression.from({
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

`.read()` returns NodeData, so its output is valid as a slot for another template.

```ts
import { snippets, template, ir } from '@sittir/rust';

const method = snippets.pubMethod
	.fill({
		NAME: ir.identifier('new'),
		PARAMS: ir.parameter.from({ name: 'host', type: 'String' }),
		RET: ir.typeIdentifier('Self'),
		BODY: template('Self { $...FIELDS }')
			.fill({
				FIELDS: [ir.fieldInitializer.from({ name: 'host', value: 'host' })]
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

## 7. Read source into NodeData

```ts
import { createEngine } from '@sittir/rust';

const engine = createEngine();
const tree = engine.parseAndRead(source);
// tree._statements[0]._name === 'greet' (terminal-hoisted: string)
```

### Lazy drill-in

```ts
import { createEngine } from '@sittir/rust';

const engine = createEngine();
const shallow = engine.parseAndRead(source, { depth: 1 });
const fn = shallow.$children[0];
// fn._name === 'greet'        (terminal-hoisted leaf: string)
// fn._body.$nodeHandle === 42 (structured: drill in to expand)

const body = engine.readNode(fn._body.$nodeHandle, fn._body.$childIndex);
body.$children[0].$type === TSKindId.ExpressionStatement;
```

### Wrapped access

```ts
import { createEngine, wrap } from '@sittir/rust';

const engine = createEngine();
const tree = engine.parseAndRead(source);
const shallow = engine.parseAndRead(source, { depth: 1 });
const fn = wrap(shallow.$children[0], tree);
fn.name(); // drillIn: lazy expand if needed
fn.body(); // drillIn: returns Block
fn.body().$children; // statements array
```

## 8. Find nodes by pattern

```ts
import { createEngine, wrap } from '@sittir/rust';

const engine = createEngine();
const tree = engine.parseAndRead(source);
const matches = engine.findAndRead(source, 'pub fn $NAME($...PARAMS) $BODY');
for (const match of matches) {
	console.log(wrap(match, tree).name());
}
```

## 9. Type guards

```ts
import { is, wrap } from '@sittir/rust';

for (const stmt of tree.$children) {
	if (is.functionItem(stmt)) {
		console.log(`Function: ${wrap(stmt, tree).name()}`);
	} else if (is.structItem(stmt)) {
		console.log(`Struct: ${wrap(stmt, tree).name()}`);
	}
}
```

## 10. Complete codemod: find → transform → apply

Replace `unwrap()` with `?`.

```ts
import fs from 'node:fs';
import { createEngine, ir, replace, wrap } from '@sittir/rust';

const engine = createEngine();
const source = fs.readFileSync('src/main.rs', 'utf8');
const tree = engine.parseAndRead(source);

const matches = engine.findAndRead(source, '$EXPR.unwrap()');

const edits = matches.map((match) =>
	replace(match, ir.tryExpression({ value: wrap(match, tree).value() }))
);

fs.writeFileSync('src/main.rs', engine.applyEdits(source, edits));
```

## 11. Codemod with construction templates

```rust
// snippets/try-wrapper.rust.template
match (|| -> Result<$RET, Box<dyn std::error::Error>> {
    $BODY
    Ok(())
})() {
    Ok(v) => v,
    Err(e) => {
        eprintln!("Error in {}: {}", $FNAME, e);
        $FALLBACK
    }
}
```

```ts
import fs from 'node:fs';
import { createEngine, snippets, ir, replace, wrap } from '@sittir/rust';

const engine = createEngine();
const source = fs.readFileSync('src/handlers.rs', 'utf8');
const tree = engine.parseAndRead(source);
const fns = engine.findAndRead(source, 'pub fn $NAME($...PARAMS) -> $RET { $...BODY }');

const edits = fns.map((fn) => {
	const w = wrap(fn, tree);
	return replace(
		w.body(),
		ir.block([
			snippets.tryWrapper
				.fill({
					RET: w.returnType(),
					BODY: w.body(),
					FNAME: ir.stringLiteral(w.name()),
					FALLBACK: ir.macroInvocation.from({
						macro: 'panic!',
						args: ['"unrecoverable"']
					})
				})
				.read()
		])
	);
});

fs.writeFileSync('src/handlers.rs', engine.applyEdits(source, edits));
```

## 12. Cross-language migration

TypeScript interface → Python dataclass.

```ts
import { createEngine as createTsEngine, wrap as wrapTs, is } from '@sittir/typescript';
import { snippets as pySnippets } from '@sittir/python';

const tsEngine = createTsEngine();
const tree = tsEngine.parseAndRead(tsSource);
const iface = wrapTs(tree.$children[0], tree);

const typeMap: Record<string, string> = { string: 'str', number: 'int', boolean: 'bool' };

const fields = iface
	.body()
	.$children.filter((m) => is.propertySignature(m))
	.map((m) => {
		const w = wrapTs(m, tree);
		const name = w.name();
		const pyType = typeMap[w.type()] || w.type();
		return `${name}: ${pyType}`;
	});

const source = pySnippets.dataclass
	.from({
		NAME: iface.name(),
		FIELDS: fields
	})
	.render();
```

## 13. Bulk file processing

```ts
import fs from 'node:fs';
import { createEngine, ir, replace, wrap } from '@sittir/rust';
import { glob } from 'glob';

const engine = createEngine();

for (const file of glob.sync('src/**/*.rs')) {
	const source = fs.readFileSync(file, 'utf8');
	const tree = engine.parseAndRead(source);
	const matches = engine.findAndRead(source, 'println!($...ARGS)');
	if (!matches.length) continue;

	const edits = matches.map((match) =>
		replace(
			match,
			ir.macroInvocation.from({
				macro: 'log::info!',
				args: wrap(match, tree).arguments()
			})
		)
	);

	fs.writeFileSync(file, engine.applyEdits(source, edits));
}
```

## 14. Format-preserving transforms

```ts
import fs from 'node:fs';
import { createEngine, ir, replace, wrap } from '@sittir/rust';

const engine = createEngine();
const source = fs.readFileSync('src/lib.rs', 'utf8');
const tree = engine.parseAndRead(source, { extractFormat: true });

const fns = engine.findAndRead(source, 'fn $NAME($...PARAMS) $BODY');
const target = wrap(
	fns.find((f) => wrap(f, tree).name() === 'process'),
	tree
);

const updatedParams = ir.parameters([
	...target.parameters().$children,
	ir.parameter.from({ name: 'verbose', type: 'bool' })
]);

fs.writeFileSync(
	'src/lib.rs',
	engine.applyEdits(source, [replace(target.parameters(), updatedParams)])
);
```

## 15. Generate a file from scratch

```ts
import fs from 'node:fs';
import { ir, snippets, template } from '@sittir/rust';

const file = ir.sourceFile({
	statements: [
		ir.useDeclaration.from({ path: 'std::collections::HashMap' }),

		ir.structItem
			.from({
				visibilityModifier: 'pub',
				name: 'Cache',
				body: { name: 'entries', type: 'HashMap<String, String>' }
			})
			.$trivia(ir.docComment('/// In-memory key-value cache.')),

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

## 16. Dogfooding

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

## `.from()` resolution rules

| Input                           | Field expects             | Resolution                                  |
| ------------------------------- | ------------------------- | ------------------------------------------- |
| `'main'`                        | Identifier                | `ir.identifier('main')`                     |
| `'String'`                      | Type                      | `ir.typeIdentifier('String')`               |
| `'pub'`                         | Visibility                | `ir.visibilityModifier()`                   |
| `42`                            | Expression                | `ir.integerLiteral('42')`                   |
| `{ pattern: 'x', type: 'i32' }` | Parameter                 | `ir.parameter.from(...)`                    |
| `{ pattern: 'x', type: 'i32' }` | Parameters                | `ir.parameters(ir.parameter.from(...))`     |
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
- [ ] `ir.*.from()` — string → leaf, single → array, array → wrapped, omitted → none
- [ ] `is.*()` runtime type guards
- [ ] `$render()` producing byte-identical round-trips
- [ ] `.$trivia()` — leading/trailing comment attachment, typed per grammar
- [ ] `$with.field(v)` — immutable per-field updates, chaining works
- [ ] `snippets.*.fill({}).read()` / `.render()` — pre-compiled templates
- [ ] `snippets.*.from({})` — template fill with coercion
- [ ] `template('...').fill({}).read()` / `.render()` — inline templates
- [ ] Composition: `.read()` output as slot input for another template
- [ ] `engine.parseAndRead()` with depth control, `$nodeHandle` / `$childIndex` drill-in
- [ ] `engine.readNode(handle, childIndex)` for lazy expansion
- [ ] `engine.findAndRead()` with pattern matching
- [ ] `engine.applyEdits()` for source modification
- [ ] `wrap(node, tree)` — getter methods with `drillIn` for lazy expansion
- [ ] Format-preserving transforms
- [ ] Native backend: one crossing per terminal
