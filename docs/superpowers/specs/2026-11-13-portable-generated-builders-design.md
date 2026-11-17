# Generated portable builders and projections

**Status:** proposed, 2026-11-13. The shape, the surface, the pin and the emitter-gap rule are the user's approved answers to the example set; the user approved decisions 1, 2, 3 and 6 and the public export rows on 2026-11-14. Decisions 4 and 5 change no surface and are accepted as emitter-internal. The user approved decision 7 and "a parse returns the projection" (under the surface) on 2026-11-14.

**Prototype:** branch `probe/portable-generated` (no PR). The emitter is `packages/tools/src/portable/prototype/emit.ts`, and its output is `packages/{python,typescript}/src/portable/prototype.ts`.

## The end state

- Codegen writes each grammar's portable layer as code: one typed function per vocabulary path that calls the grammar's low-level loose builders, and one generated projection from a node's kind to its portable structure.
- Nothing interprets a table at run time. The build table and the read table are the emitter's input inside codegen. They aren't shipped, and no run-time code walks them.
- The portable engine is `createEngine(language, { api: 'portable' })`. It carries the generated `build` namespace, `parse(source)` (which returns the source's projection), `project(node)`, `render`, `kinds` and `is`.
- The emitter is the compiler's first dogfooded consumer. It writes every node of the generated modules through the `@sittir/typescript` builders of the pinned build (`bootstrap.json`), never through strings.

## The surface

```ts
using engine = await createEngine(python, { api: 'portable' });
const file = engine.parse('class C:\n    @property\n    def x(self):\n        return 1\n');
// { $path: 'file', statements: [{ $path: 'declaration.class', name: 'C', bases: [], body: { $path: 'statement.block', statements: [
//   { $path: 'declaration.property.getter', name: 'x', body: { $path: 'statement.block', statements: [
//     { $path: 'statement.return', expression: { $path: 'literal.number.integer', $value: 1 } }] } }] } }] }
const getter = engine.build.declaration.property.getter({
	name: 'x',
	body: { statements: [{ $path: 'statement.return', expression: 1 }] }
});
engine.render(getter); // "@property\ndef x(self):\n    return 1\n"
engine.render(engine.build.file(file)); // the source back
engine.project(getter); // { $path: 'declaration.property.getter', name: 'x', body: { … } }
```

The same calls against typescript give `get x() {\n  return 1;\n}`. A portable getter takes no `parameters` in any language, and python's generated getter writes `self` itself.

### A parse returns the projection

**Approved, 2026-11-14.** On the portable engine, projection happens on read: `parse(source)` returns the source's projection, and the caller never calls `project` after it.

- **What it returns:** the root's structure, `{ $path: 'file', … }`. Every grammar's root kind projects to `file` (python `module`, typescript `program`, rust `source_file`, probed), so the type is `File<G>`. The emitter refuses a grammar whose root kind has no `file` arm.
- **Whole, in the parse call.** The generated projection walks the tree once, while the parse holds it, and returns plain data. It isn't lazy:
  - A projection is plain data (readonly fields, arrays, strings, numbers), and it is the build's input as it stands (decision 1).
  - A lazy member would need a getter or a `Proxy`, which the node surface rules out, or a function, which changes every member's type and stops the projection being an input.
  - Plan Task 5 measures parse against parse-with-projection over the corpus and reports the ratio per grammar in its PR. It doesn't gate.
- **What a projection holds:**
  - every node a path claims, as its structure;
  - a node it can't express, kept in place as the node itself: the node a parse error sits on, an unclaimed kind, a flag no arm builds. The member's node arm types it (decision 2), `engine.isNode` tells it apart, and a build passes it through. Probed: python `x = = 1` keeps its `1` as an `integer_decimal_plain` node.
  - no comments, as today's read, so a whole-program round trip through the projection drops them.
- **What `project(node)` is for:**
  - a node the engine built: `engine.project(getter)` gives its structure;
  - a node from a low-level engine of the same language, such as a subtree a tool already holds;
  - the kept-node report for tools: `engine.project(node, carried)` calls `carried(node, carry)` for each node it keeps, with the reason, as today's read does. `parse(source)` takes no callback.

| task | the surface above, before | after |
|---|---|---|
| a file's structure | `engine.project(engine.parse(source))` | `engine.parse(source)` |
| a round trip | `engine.render(engine.build.file(engine.project(engine.parse(source))))` | `engine.render(engine.build.file(engine.parse(source)))` |
| a built node's structure | `engine.project(node)` | unchanged |
| a low-level node's structure | `engine.project(node)` | unchanged |
| why a node was kept (tools) | `portableRuntime(engine).read(node, carried)` | `engine.project(node, carried)` |
| render parsed text verbatim | `engine.render(engine.parse(source))` | a low-level engine's `render(parse(source))`; the portable engine renders built nodes |

## What codegen writes per grammar

`packages/<lang>/src/portable/build.ts` exports `portableBuild(engine)`, which returns the namespace. Inside it:

- **A path function** for each root path, typed `(input: BuildInput<Map, P>)`. When a path has one arm and no facts, the arm function is the path function. Otherwise the path function picks:
  - by the `$value`'s type when the path builds values (`builds`);
  - else by the arms' pick tests, compiled to conditions, in table order, stopping at the first arm whose tests are always true.
- **An arm function** for each arm something reaches, named `<path>$<kind>`, which makes the low-level call. Arms reached only from a holder (python `statement.block`'s suites) have no path function. The holder's member function calls them.
- **A member function** per (arm, member) that admits a nested value, named `<arm>_<member>`. In order:
  - a list hole returns `null`, only where the member's list takes holes;
  - a string goes to a token kind (a `switch` over the seat's token texts), else to the seat's leaf builder, else to the loose builder unchanged;
  - a built or parsed node passes through, placed by its kind (decision 2);
  - a structure goes through a `switch (value.$path)` over the member's paths (decision 1). Each case calls the arm function the seat takes and wraps it in the seat's containers.
- **Facts spelled in a container** (python `@property`, `@staticmethod`, `@override`) are written where the node meets its container. The root function of a path with facts builds the container itself when any fact is set.

Python's getter, from the prototype (decisions applied, names shortened):

```ts
const declaration_property_getter$361 = (input: BuildInput<PythonMap, 'declaration.property.getter'>): T.MethodDeclaration.Bound =>
	b.methodDeclaration({
		name: getter_name(input.name),
		parameters: b.parameters(b.parametersElements(b.identifier('self'))),
		returnType: input.type === undefined ? undefined : getter_type(input.type),
		body: getter_body(input.body),
		async: (input.$flags ?? []).includes('async')
	});
const declaration_property_getter = (input: BuildInput<PythonMap, 'declaration.property.getter'>) => {
	const node = declaration_property_getter$361(input);
	const decorators = [
		attribute_decorator({ $path: 'attribute.decorator', content: 'property' }),
		...((input.$flags ?? []).includes('override') ? [attribute_decorator({ $path: 'attribute.decorator', content: 'override' })] : [])
	];
	return decorators.length === 0 ? node : b.decoratedDefinitionClassDeclaration({ definition: node, decorators });
};
```

`packages/<lang>/src/portable/project.ts` exports `project(node, carried?)`: a `switch (node.$type)` over the grammar's kinds. The portable engine's `parse` calls it on the root. Each case writes out the read tests (decorators, a name pattern, a lone `self`) and member accessors as code. The claim test `(#eq? @_self "self")` becomes `onlySelf(node.parameters())`. The projection isn't prototyped yet (see the plan).

`packages/<lang>/src/portable/map.ts` keeps the grammar map and gains `nodes` (decision 2) and the per-path flag sets (decision 3).

## The emitter

- **Where it runs:** in codegen's pinned child process (`bindings/pinned-reader.child.ts`), as a new mode beside `facts` and `exportedStrings`. The child runs under `TSX_TSCONFIG_PATH=packages/codegen/tsconfig.pinned.json`, so the workspace `paths` never reach the pinned build (decision 6).
- **What it reads:** the grammar's build table and read routes, which are the same facts that write `map.ts` today.
- **What it writes:** every node of the module through the pinned engine's builders (`t.callExpressionCall`, `t.arrowFunction.callSignature`, `t.switchStatement`, …), then `engine.render` gives the text.
  - The header comment is `statement.$trivia.leading(t.comment.line(' Auto-generated …'))`.
  - The export is `t.exportStatementDefaultDeclaration({ content })`, which writes `export function portableBuild`.
- **Gaps:** a construct the pinned builders can't express fails generation with `portable-emit-pinned-gap`, naming the construct and the pinned sha. There's no string or parsed-snippet fallback. The fix lands in `@sittir/typescript` on master, and a later commit bumps the pin.
  - Known today: `binaryExpression.in` throws on any input, so the emitter writes no `in` test. It checks a built node with `engine.isNode`.
- **The emitter is type-checked against the pinned build's declarations, as a gate.** The loose builders drop an unknown key silently (`{ $trivia: … }`, or `body` written for `bodies`), and the emitter only finds out when the text comes out wrong.
  - `sittir bootstrap` writes a tsconfig that maps `@sittir/*` to the pinned directory's `dist` declarations.
  - The emitter's modules type-check under it in `pnpm run type-check`.
  - A red case proves it binds: `t.switchCase({ value, body: [] })` is a type error.
- **Size, measured on the prototype:**

| | lines | characters |
|---|---|---|
| the getter's arm function, as a string template | 2 | 337 |
| the same function, written through the pinned builders | 10 | 808 |
| the whole prototype emitter (8 paths' worth of shapes) | 451 | 25,856 |
| the run-time interpreter it replaces (`common/src/portable/build.ts`) | 821 | 52,080 |
| generated python module, 8 paths | 165 | 9,015 |
| generated typescript module, 8 paths | 266 | 10,936 |

Both writings of the getter produce the same text. Emitting takes about 10 ms per grammar after a ~200 ms load of the pinned build.

## Decisions

Each row shows the case, then the answer. Decision 7 changes the call the user writes, so it's shown before → after.

### 1. One source for a member's paths

**The case.** The prototype took its `switch` cases from the build table, while the member's type comes from the read routes (`map.ts` overrides). The two disagree:

| member | type admits | table admits | effect |
|---|---|---|---|
| typescript `expression.collection.list` → `elements` | `literal.number.integer`, `.float`, `.integer.big` | `literal.number` too (a root that picks its arm by the `$value`'s type) | `case 'literal.number'` is TS2678, not comparable to the `$path` union |
| python `declaration.property.getter` → `type` | `string` (`-> int` reads as `'int'`) | no leaf seat | no string branch, so `value.$path` on `string \| …` is TS2339 |
| python `statement.return` → `expression` | 89 paths | 85 paths | `identifier` has no build row: it builds from text |

**Answer (approved 2026-11-14).** The member's read type is the source, because a portable input is what a read returns (`InputOf`).
- The emitter takes each member's path set from the same read-route facts that write the `map.ts` override. Every path in it gets a case.
- Each case's placement comes from the build table. A path with no fitting arm fails generation as `portable-emit-unplaced-path`.
- A string the type admits but no leaf or token seat takes goes to the loose builder unchanged, and the loose builder coerces it. The interpreter does the same today.
- A build-only convenience, like a root path that picks its arm by the `$value`'s type (typescript `literal.number`), joins the member's type through `G['inputs']`. That's written from the build rows that carry `builds`, so the case list still equals the type.

```ts
// typescript array element, cases = the type's paths
switch (value.$path) {
	case 'literal.number.integer': return literal_number_integer(value);
	case 'literal.number.float': return literal_number_float(value);
	case 'literal.number': return literal_number(value); // admitted through G['inputs']
	…
}
// python getter type: the text goes to methodDeclaration's loose returnType
if (typeof value === 'string') return value;
```

### 2. A node passed as input

**The case.** `Slot` adds `Unmapped` (`{ readonly $type: number }`) to every member. So `engine.isNode(value)` narrows the input to the whole `PythonNode` union, and the pass-through fails its slot:
```
methodDeclaration({ name: getter_name(input.name), … })
TS2322: Type 'PythonNode' is not assignable to type 'string | ({ readonly $type: TSKindId.Identifier; } & NodeMarker)'.
```

**Answer (approved 2026-11-14).** In an input, a member's node arm is the language's node types for the kinds its paths read, never `{ $type: number }`.
- `map.ts` gains `nodes`, one entry per path: the kinds whose read entries read as that path, never a subpath's (approved 2026-11-15). `readonly 'statement.block': T.Block.Bound | T.Block.Parsed | T.SuiteEmpty.Bound | …`. `PortableIds` keeps the whole family, because the `is` guards test a family. A path's nodes come from the same read entries its read arms do, so python's `identifier` takes an `Identifier` node and refuses a `DottedName`, which reads as `identifier.qualified`.
- An unmapped kind keeps its `UnmappedKinds` entry, which is already a real node type.
- `engine.isNode` then narrows to exactly those types, and the generated code places the node by its kind:

```ts
type BodyItem = BuildInput<PythonMap, 'statement.block'> | PythonMap['nodes']['statement.block'];
if (engine.isNode(value)) return value.$type === TSKindId.Block ? b.suiteBlock(value) : value;
```

| passed | compile time | run time |
|---|---|---|
| a python `Block` node into a getter `body` | accepted, wrapped in `suite_block` | builds |
| a typescript node | TS2345, not assignable (probed) | `isNode` is false, and the `$path` switch's default refuses, naming the member |
| a python node of a kind the member doesn't take (a `Block` as a `name`) | TS2345 (probed) | the low-level builder's slot check refuses; it always runs |

### 3. Flags

**The case.** Python reads `@property async def x(self)` as `{ $path: 'declaration.property.getter', $flags: ['async'], name: 'x' }`. The getter's `$flags` type is `'override'` only, so the read isn't assignable to its own input. The generated `async: …includes('async')` is TS2345: `'"async"' is not assignable to parameter of type '"override"'`.

**Answer (approved 2026-11-14).** A path's flag names are the union of the flags its arms set and its facts carry. Read and build use the same arms. `map.ts` writes the set per path, and `FlagsAt<G, P>` reads it.

| path | today's `$flags` type | from its arms and facts |
|---|---|---|
| python `declaration.property.getter` | `'override'` | `'async' \| 'override'` |
| python `declaration.method` | per the vocabulary | `'async' \| 'static' \| 'override' \| 'privateName'` |
| typescript `declaration.property.getter` | per the vocabulary | `'static' \| 'override' \| 'privateName' \| 'computed'` |

A keyword flag is a boolean on the loose surface (`static: …includes('static')`), not a token id.

A flag a container sets on what it unwraps is among its element path's flags. Rust's `expression.call.macro` has `'terminated'`, which an expression statement sets on the macro call it unwraps: `a!();` reads `{ $path: 'expression.call.macro', $flags: ['terminated'], … }`, and an item macro (`foo! { }`) reads with no flags (the user, 2026-11-16: "Flag `terminated` on the macro call"). The build takes the expression-statement seat for a flagged macro call and the item seat for an unflagged one, so both round-trip (bindings spec §9).

### 4. Lists

**The case.** The loose list builders, measured:

| call | possibly-empty list (`block`) | non-empty list (`parametersElements`) |
|---|---|---|
| `b.x(...items)`, `items: T[]` | type-checks | TS2345 (wants `[T, ...T[]]`) |
| `b.x({ key: items })` | type-checks | TS2345 |
| `b.x(...items)`, `items: (T \| null)[]` | TS2345 | — |
| `b.x(f(first), ...rest.map(f))` | — | type-checks |

**Answer (emitter-internal, accepted 2026-11-14).** The loose surface doesn't change, because a non-empty list stays non-empty in its type.
- The emitter spreads a typed array for a list that may be empty.
- For a non-empty list it writes `f(first), ...rest.map(f)`. When the list's container is optional, it guards with `first === undefined`.
- It returns `null` only from members whose list takes holes (typescript `Elisions`).
- A one-item list that no list seat takes builds in the member's single seat: python's `from a import *` reads `names: ['*']`, and the build writes the wildcard (the user, 2026-11-16: "Approve all listed").

```ts
const [first, ...rest] = input.parameters ?? [];
parameters: first === undefined ? b.parameters() : b.parameters(b.parametersElements(parameter(first), ...rest.map(parameter)))
```

### 5. Signatures and union size

**The case.** The prototype typed a member function's parameter as `BuildItem<Map, P, M>`, computed from the vocabulary member type, and left the functions unannotated.
- Python: TS2590 "union type too complex to represent" ×2, TS7023 implicit `any` from recursion ×2.
- Typescript: TS2590 ×4, TS7023 ×4.

**Answer (emitter-internal, accepted 2026-11-14).**
- Each member's item type is written out as a union of `BuildInput<Map, P>` over the member's paths, plus `string` where the type admits it, plus the node types from decision 2. It's named per member, and `BuildItem` goes.
- Every arm function is annotated with its kind's node type, and every member function with its seats' node union. That breaks the recursion.
- Named per-path interfaces were tried and rejected: a path with several build forms isn't an object type (TS2312 on python `expression.lambda`, `expression.collection.tuple.bare` and two octal integers).

The largest member measured holds the expressions a python statement can be: 107 paths, 25 raw node kinds and one unmapped kind (typescript's largest: 104; rust's: 96). Python's statement lists hold those expressions beside the statements themselves (bindings spec §6, rule 6). The member's generated signature, measured:

```ts
type Item = string | BuildInput<PythonMap, 'expression.assignment'> | … /* 107 paths */ | T.Attribute.Bound | T.Attribute.Parsed | … /* 25 kinds */ | V.Unmapped<'python:as_pattern'>;
const expression_item = (value: Item): T.ExpressionStatement.Bound | … => {
	if (typeof value === 'string') return …;
	if (engine.isNode(value)) return value;
	switch (value.$path) { case 'expression.assignment': return …; /* 107 cases */ }
};
```

It narrows with 0 errors. Check time is 8.9 s against a 5.9 s baseline (the same imports with no member function), and 38.1M instantiations against 18.7M. Most of the difference is the first instantiation of the path input types, which every later member function shares. The whole module's time is measured against the baseline and reported. It doesn't gate.

### 6. Loading the pin

**The case.** Run in process under `pnpm exec tsx`, the root `tsconfig.json` `paths` map `@sittir/common` to `./packages/common/src/index.ts`, and tsx applies them inside the pinned build's `dist` too:

| loader | `@sittir/common` imported by the pinned typescript `dist` resolves to | result |
|---|---|---|
| `pnpm exec tsx` (workspace tsconfig) | `file:///…/sittir/packages/common/src/index.ts`, the live checkout | two versions of common in one engine: arena storage refuses ("needs an addon built with the arena feature"), and `$trivia.leading` throws "node has no engine" |
| `node` | the pinned `packages/common/dist/index.js` | works |
| tsx with `TSX_TSCONFIG_PATH=packages/codegen/tsconfig.pinned.json` | the pinned `dist` | works, both storages |

Today's pinned vocabulary reader isn't affected. Codegen already runs it in a child process under `tsconfig.pinned.json` (`bindings/read.ts` `startReader`). Only an in-process `loadPinnedBuild()` under the workspace tsconfig mixes versions, and that's what the prototype did.

**Answer (approved 2026-11-14).**
- The emitter runs as a mode of the pinned child process, so it loads the pin the way the reader does.
- `loadPinnedBuild` refuses to load in a process whose resolution maps the pinned build's `@sittir/common` outside the pinned directory. It checks `createRequire(<pinned typescript dist>/index.js).resolve('@sittir/common')` and throws `pinned-build-unpinned`, which names the resolved path and the child reader. A mixed load then fails at once, by name, instead of later as an unrelated arena or engine error. `import.meta.resolve(specifier, parent)` can't make this check: under tsx it ignores the parent and returns the workspace path for every loader.

### 7. Less nesting: `$path` and bare scalars

**The case.** Portable works like the loose API, and `$path` is required only where the context doesn't decide the kind. Today's types and the interpreter, measured on python (typescript matches):

| input | types today (`BuildInput`) | interpreter today |
|---|---|---|
| `statement.return` with `expression: 1` | TS2322: `number` isn't admitted | builds `return 1` |
| `statement.return` with `expression: 'x'` | accepted (identifier text) | builds `return x` |
| a method's `body: { statements: [...] }`, no `$path` | TS2322: `$path` is required | refuses (`cannot resolve value to any of [suite_inline, suite_block, suite_empty]`) |

**Answer (approved 2026-11-14).**
- **`$path` is optional where the context decides it:**
  - on the input of a path function, since the function names the path;
  - on a member whose paths include exactly one structure-built path (a getter's or a method's `body`).
  
  The type is `{ readonly $path?: P }` there. The generated member function reads a structure without `$path` as that path, with no `switch`.
- **A bare scalar coerces** where the member's paths include a value path that builds it, as the loose builders coerce:
  - a `number` or `bigint` goes to the path whose `builds` row takes it (an integral number to `builds.integer`, any other number to `builds.float`, a `bigint` to `builds.bigint`);
  - `true` and `false` go to the boolean paths;
  - a string goes to the member's leaf, as today.
  
  The type admits the scalar exactly where a path builds it. A member where two paths take the same scalar and neither is beneath the other is `portable-emit-unfit-member`; otherwise the outermost takes it (an integer goes to `literal.number.integer`, not `.hex`; ruled 2026-11-17, "The outermost path takes it").
- `$path` stays required on a member with several structure-built paths (a block's `statements`).

| call | today | after |
|---|---|---|
| a getter | `getter({ $path: 'declaration.property.getter', name: 'x', body: { $path: 'statement.block', statements: [{ $path: 'statement.return', expression: { $path: 'literal.number.integer', $value: 1 } }] } })` | `getter({ name: 'x', body: { statements: [{ $path: 'statement.return', expression: 1 }] } })` |
| a float element | `list({ $path: 'expression.collection.list', elements: [{ $path: 'literal.number.float', $value: 1.5 }] })` | `list({ elements: [1.5] })` |
| an identifier element | `list({ $path: 'expression.collection.list', elements: ['y'] })` | `list({ elements: ['y'] })` |

The generated member function for `statement.return` → `expression`, after:
```ts
if (typeof value === 'number') return Number.isInteger(value) ? literal_number_integer({ $value: value }) : literal_number_float({ $value: value });
if (typeof value === 'bigint') return literal_number_integer({ $value: value });
if (typeof value === 'string') return b.identifier(value);
```

### 8. A path built from text

**The case.** `identifier` is built from its text, but its interface held only `$path`, so `{ $path: 'identifier' }` type-checked and the build threw (`identifier: text must be a string: undefined`), while `{ $path: 'identifier', $value: 'x' }`, which builds, was refused. The reader returns an identifier as its bare text (`X: int = 1` reads `name: 'X'`), but the map typed every identifier read as `{ $path }`. The same held for every path a grammar builds from text alone. `x = "ab"` reads `{ $path: 'literal.string.text', $value: 'ab' }`, which the read type refused.

**Answer (approved 2026-11-15).**
- A path that a grammar builds from text alone declares `readonly $value: string`. Those paths are `identifier`, `literal.string.text`, `comment.text`, `comment.html`, `literal.regex.flags`, `literal.regex.pattern`, `clause.import.relative.prefix` and `expression.interpolation.conversion`. Rust's `identifier.metavariable` (`$x`) builds from its name's text too, through a content arm, so it keeps the `$value` it inherits from `identifier`.
- A node whose one slot holds a text-built kind is built from text too. Its content arm names that slot, and the build makes the child from the text, then the node around it. A lexed token whose only slot is its interior text is the simplest case. These paths therefore declare `$value: string` too, and lose `content` (the user, 2026-11-15):
  - the comment paths: `comment.line`, `.block`, `.block.doc`, `.line.doc`, `.line.doc.inner` and `.block.doc.inner`;
  - `literal.string.escape` in every grammar: an escape reads `$value` (bindings spec §9);
  - rust's `literal.string.raw`, `.bytes.raw` and `.c.raw`.

  Rust's `//x` reads `{ $path: 'comment.line', $value: 'x' }`, and its `r"a"` reads `{ $path: 'literal.string.raw', $value: 'a' }`.
- One predicate, `takesTextValue`, says which arms take a text `$value`: a text arm or a content arm. The build, the guard and the typed views all use it.
- A guard derives the set from the build tables. A path whose build arms include one that takes a text `$value` (a text arm or a content arm), and none of which needs a member or builds another value, declares the text `$value`, and no other path does.
- Its read and its input are its bare text or `{ $path, $value }`. `{ $path }` alone is a type error.
- `Read<G, P>`, `InputOf` and a slot's default all add the bare text for such a path. The reader is unchanged.
- The identifier subkinds that are structures (`identifier.qualified`, `.label`, `.lifetime`) restate `$value` away.
- The fixed-word text paths keep `{ $path }`, because every grammar builds them from it: `statement.break`, `statement.continue`, `modifier.visibility.*`, `expression.meta` and `clause.import.wildcard`.
- A path whose text arm sits beside structural arms (rust `literal.character`), or whose `$value` is a number (python `literal.number.integer`, rust `literal.number.float`, typescript `literal.number`), is left out. Its input needs forms, each stating either `$value` or the members. Its text form requires `$value`: rust's `literal.character` is `V.Form<'content', '$value'> | V.Form<'$value', 'content'>` (the user, 2026-11-16: "Approve all listed").
- A text-built arm requires `$value` in its pick tests, so the map types every text-built path's input as `$forms: V.Form<'$value'>` (the user, 2026-11-16).
- A negative check on a build form runs in the TypeScript 6 lane (`*.portable.ts6.test-d.ts`). A tsrs or TS7 program that has already related a map's reads to its inputs can skip a later negative check on a build form, so typescript's qualified name passed as a class `name` is refused there (the user, 2026-11-16).

| input | before | after |
|---|---|---|
| `{ $path: 'identifier' }` | accepted; the build throws | TS2322 |
| `{ $path: 'identifier', $value: 'x' }` | TS2353 | accepted; builds `x` |
| python constant `name` read as `'X'` | TS2322 | accepted |
| `{ $path: 'literal.string.text', $value: 'ab' }` as a read | TS2353 | accepted |
| `{ $path: 'statement.break' }` | accepted | accepted |
| rust `{ $path: 'identifier.metavariable', $value: 'y' }` as a macro binding's `name` | TS2353 | accepted; builds `$y:expr` |
| rust `{ $path: 'identifier.metavariable' }` | accepted; the build throws | TS2322 |

### 9. A slot's `$path` may be its tail

**The case.** A slot that admits several paths needs `$path` to choose among them, but the full path repeats what the slot already says. Rust's function `name` admits `identifier` and `identifier.metavariable`, and `metavariable` alone tells them apart. Even so, the input had to spell out `identifier.metavariable`.

**Answer (approved 2026-11-15).**
- In a slot that admits two or more paths, each admitted path has a tail: its shortest dot-suffix that is not a suffix of another path the slot admits. The slot accepts the tail and the full path, and no suffix in between. The full path works in every slot and every grammar; the tail is a local convenience.
- Codegen computes the tails once, beside the slot's exact set (the set its map type is written from), and writes each one twice:
  - as another `$path` spelling on the map's input side;
  - as another `case` label in the generated member function.

  Nothing maps a tail at run time.
- A tail adds a spelling to its path's variant, not a variant. Rust's return `expression` keeps 90 variants, and each `$path` gains at most one spelling.
- Reads return the full path, so a read stays a valid input. A root build has no slot, so it takes the full path. A slot with one path keeps decision 7: `$path` may be left out.
- A path that is itself the tail of another admitted path (`x` beside `a.x`) means itself, and `a.x` gets no shorter tail. A tail that is the full name of another path in the grammar fails generation (`portable-emit-tail-is-path`), so a `$path` that names a path always means that path. Neither case occurs in the three grammars today.
- **The cost.** A tail depends on the slot's whole set:
  - the same path's tail differs between slots and grammars (table 4);
  - admitting a new path in a slot can lengthen a tail, and an input written with the shorter tail then stops type-checking.

  The full path never breaks.

Table 1. One tail: rust `declaration.function.name` admits `identifier` and `identifier.metavariable`.

| input | type | builds |
|---|---|---|
| `{ $path: 'metavariable', $value: 'y' }` | accepted | `$y` |
| `{ $path: 'identifier.metavariable', $value: 'y' }` | accepted | `$y` |
| `'y'` | accepted | `y` |
| `{ $path: 'identifier', $value: 'y' }` | accepted: a one-segment path is its own tail | `y` |

Table 2. Two paths share a last segment: rust `statement.return.expression` admits `expression.binary.arithmetic.add` and `expression.assignment.compound.add`.

| input | type | builds |
|---|---|---|
| `{ $path: 'arithmetic.add', left: 'a', right: 'b' }` | accepted | `return a + b` |
| `{ $path: 'compound.add', left: 'a', right: 'b' }` | accepted | `return a += b` |
| `{ $path: 'add', left: 'a', right: 'b' }` | TS2322 | refused: the member function has no `case 'add'` |
| `{ $path: 'binary.arithmetic.add', left: 'a', right: 'b' }` | TS2322 | refused: neither the tail nor the full path |

Table 3. One path is a prefix of another. A tail is a suffix, so a prefix never collides.

| slot | admitted path | tail |
|---|---|---|
| rust `declaration.function.parameters` | `identifier` | `identifier` |
| | `identifier.qualified` | `qualified` |
| | `identifier.metavariable` | `metavariable` |
| rust `statement.return.expression` | `expression.call` | `call` |
| | `expression.call.member` | `call.member` (`member` is also `expression.member`'s tail) |

Table 4. The same path in different slots: `expression.binary.arithmetic.add`'s tail.

| slot | also admits `expression.assignment.compound.add` | tail |
|---|---|---|
| python `statement.return.expression` | no | `add` |
| python `file.statements` | yes | `arithmetic.add` |
| rust `statement.return.expression` | yes | `arithmetic.add` |
| typescript `statement.return.expression` | yes | `arithmetic.add` |

Python's tail is `add` in 171 slots and `arithmetic.add` in 2, its statement lists (`file.statements` and `statement.block.statements`). Rust and typescript need `arithmetic.add` in all of theirs (144 and 198 slots).

### Ruled while the emitter was built (2026-11-17)

- **The generated builders call the strict builders, not the loose ones** ("We should have the portable builder call the strict api", confirmed "Yes, generated builders call the strict API"). This replaces "calls the grammar's low-level loose builders" in The end state and wherever this spec routes a value "to the loose builder": the generated function knows each member's paths, so it writes the exact strict call itself, and no coercion is left to a loose builder. Python `{ $path: 'identifier.qualified', qualifier: 'a', name: 'b' }` builds `a.b` because the generated code writes `dottedName({ name: identifier('a') })`. The portable input still behaves like the loose API for its caller (bare scalars, an optional `$path`). Two answers given earlier the same day fall away with it: no loose slot gains `string`, and the loose list arguments are not widened for `null`. The strict list arguments are ("Strict list args admit null on hole-taking kinds"): on kinds whose model says `hasOptionalElements` (typescript `object`, `array_pattern`, `object_pattern`) the strict list argument goes through the `withHoles` type the storage and setters use, so `arrayPattern([a, null, b])` builds `[a,, b]` and a read is a valid build input. Neither surface took `null` there before. The generated module imports the strict builder functions directly, as it imports the loose ones today; it does not take an engine to reach them ("It doesn't need to take an engine - it can import the strict functions directly just like loose does", on seeing the re-costing, which proposed `portableBuild(engine)` over a strict engine). The re-costing: one file (`emit/build.ts`), about 100–200 lines; the pin needs nothing; no arm stops generating; the run-time coercions become explicit generated calls (a string to the member's outermost text-built path, a kind id wrapped in its seat's container builder, a bigint spelled before the radix integer builders).
- **In a member that takes numbers, a bare number is a number** ("The number is a number"). The map types a fixed word's built form as its bare kind id (python `True`, `False`, `None`, `...`), which is a number, so `expression: 69` could not be told from the integer 69. Where a member has a number taker, the type no longer admits a fixed word's bare kind id: `{ $path: 'statement.return', expression: 69 }` builds `return 69`, and a fixed word is written as its structure (`{ $path: 'literal.null' }`) or, once literal arms generate, its scalar (`true`), which is also what a read returns. Bare kind ids stay in members with no number taker (operators and other kind-enum members).
- **A number path is `$path` and `$value`** ("A number path is `$path` + `$value`"). The table listed a number arm's numeric parts (python float `integer`, `fraction`, `exponent`; rust integer `content`; the radix prefixes and exponent markers) as required members, but a read never returns them (`0X1F` reads `{ $path: 'literal.number.integer.hex', $value: 31 }`), so a read failed its own type and was not a valid build input. A number arm's numeric parts are its `$value`: the table drops them from the arm's members and requires `$value`, and the read and build types of a number path hold `$path`, `$value` and the non-numeric members only (rust `suffix`, python's long `marker`, python `imaginary`). The members narrowed to token texts that are such numeric parts (21 of the 30) leave the types instead.
- **An option still tells kinds apart** (the maintainer, 2026-11-17: "spelling slots definitely tell kinds apart.... just like separators separate nodes, but the type of separator, ; vs. , can in certain cases be a spelling"; on the terms: "we should call grammar side choices of this kind 'preferences' not spelling", and, settling the two words, "an option, is a slot bound to a preference"). The two terms: a **preference** is the grammar-side choice among forms that mean the same thing, as the grammar layer declares it (`preference('separator', 'semi')`, `preference('double_blankline')`); an **option** is a slot bound to a preference, the place where that choice is written. A number's radix prefix (`0x` or `0X`), its exponent marker (`e` or `E`) and the separator a list writes (`;` or `,`) are options where a preference binds them. A slot that is only an option leaves the portable types with the number-path ruling, but it remains a fact of the grammar that distinguishes parser kinds: modern octal `0o17` and legacy octal `017` stay two kinds though both read as `integer.octal` with a `$value`. The bindings' shape comparison therefore counts those slots beside the routed members. The same split holds for separators: a separator's presence separates nodes, while which separator it is can be an option.
- **What leaves a number path, by the model's facts** (2026-11-17). A slot of a number is one of three things. An **option** (a declared preference binds it, `registered` on the model): the radix prefix, the exponent marker and python's long marker (`L` or `l`). A **value part** (it holds the value's digits or sign): `content`, `integer`, `fraction`, `exponent` and the exponent's sign ("It is part of the value": `-` is the value's sign and a positive exponent writes nothing, so `1e+5` builds back as `1e5`). Or a **member** that means something no option or value holds: rust's integer `suffix`, python's `imaginary`. Options and value parts are not portable members ("Yes: options leave the portable number paths"); the path and `$value` say all of it. So of the 30 members typed as token texts, 5 remain: rust's four integer `suffix` and the macro `fragment`.
- **A kind id has no meaning on the portable surface** (the maintainer, on the ruling above: "technically kindId's shouldn't have a meaning in the portable api surface"). A kind id is the low-level API's name for a kind; a portable input or read names things by path, by value or by text. So the bare kind ids the map still admits (a fixed word's built form, and the operator and other kind-enum members left in place by the ruling above) are a gap to close, not a form to keep. Before code: a census of every place a kind id appears in the portable types and reads, per grammar, and the path each becomes: where the low-level API names a kind by its id, the portable surface names it by its path, which is the portable name for a kind ("It should be a path (as this is our jargon for portable kinds)"). The path is typed ("Path should be typed"): a member's type admits exactly the paths its seats build, as literal types, never `string`, so a path the member cannot hold is a type error. A nominal brand was considered and not taken ("Literal union, no nominal brand; close the kind-id gap"): `TSKindId` is itself an unbranded numeric enum, a member's `$path` is already the literal union of the paths its seats build (`'literal.nul'` and an un-narrowed `string` are type errors), and a brand would put a generated constant on every structure. The gap closes as the census found it: kind ids reach the portable types only as the fallback for a fixed word with no bound surface, and every such word already has a vocabulary path (python 9, rust 16, typescript 23). That fallback becomes `never`; a bare number in a member with no number taker is refused instead of placed as a kind id; the `PortableStructure` documentation drops "a kind id". A fixed word is written as its read returns it: `{ $path: 'literal.null' }` for a structure path, its text for a text path. It is its own task after the emitter's. A value that is not a kind (a number, a text, a flag) stays a scalar, a token text or a boolean. The rows go to the maintainer.
- **The generated module's import** reads "as `ir.ts` imports the loose builders": the module imports `ir` from `../ir-strict.js`, since the build table stamps ir paths, and the caller scopes it with `scopeBuilders(engine, portableBuild)`. Before this ruling the module took an engine.
- **A member whose grammar slot is a fixed set of tokens is typed as those texts** ("The map narrows them to their token texts"): rust `fragment` and the integer `suffix` read and build as the union the grammar admits (`'u8' | 'i32' | …`), derived from the grammar's token list, not `string`. One rule for every such member; the count per grammar is reported before code.
- **`decimalSpelling` is exported** from `@sittir/common/portable/utils` ("Approve"): `decimalSpelling(value: number | bigint, parts, scientific: boolean): DecimalSpelling<P> | undefined` in `packages/common/src/number.ts`. The interpreter's spelling bodies move into it unchanged, and the generated build calls it; `undefined` means unspellable and each caller throws its own message.

## Diagnostics and the MVP sets

Generation reports, by name:

| diagnostic | cause |
|---|---|
| `portable-emit-unplaced-path` | a path in a member's type with no arm that fits the member's seats (decision 1) |
| `portable-emit-unfit-member` | a member route the emitter doesn't compile (several steps, a mounted step, a template-spelled member, a sole-item delimiter) |
| `portable-emit-pinned-gap` | the pinned builders can't express a construct |
| `portable-emit-type` | the generated module fails its type-check |
| `portable-emit-tail-is-path` | a slot's tail is the full name of another path in the grammar (decision 9) |

The conformance ruling ("an MVP set per language") maps onto them like this:
- On a path in the language's MVP set, any of them fails generation.
- Outside the set, it's a warning, the path isn't generated, and the ratchet counts it per grammar at today's ceilings. Ratchets only tighten.
- `portable-emit-tail-is-path` fails generation on every path, in the set or not.

The MVP sets themselves are the user's choice. Until they're named, every path generated today counts as outside, and the ratchet holds the line.

## Public exports

Approved by the user, 2026-11-14.

| package | export | change |
|---|---|---|
| `@sittir/common/engine` | `portableRuntime`, `portableRuntimeTree`, `PortableRuntime`, `portablePathHasFacts` | removed: the engine's `build`, `parse` and `project` replace them |
| `@sittir/common/engine` | `PortableCarry`, `PortableCarried` | moved to `@sittir/types`, as the type of `engine.project(node, carried?)` |
| `@sittir/common/portable` | `classifierOf`, `registerPortableRows`, `portableTrees`, `PortableClassifier`, `PortableKindTree`, `PortableGuardTree`, `PortableQueryIds`, `PortableLanguage` | removed: no run-time table |
| `@sittir/common/portable` | `portable`, `portableGuardsOf`, `LanguageGuard`, `PortableGuard`, `PortableKind` | removed: each grammar's generated module supplies `kinds.portable` and `is.portable` |
| `@sittir/types` | `PortableReadEntry`, `PortablePath`, `PortableTable`, `PortableFact`, `PortablePlace`, `PortableRows`, `PortableStep`, `PortableCondition`, and the build-table types `PortableCallShape` through `PortableBuildTable` | removed from the public package: they become codegen's internal emitter input |
| `@sittir/types` | `PortableStructure` | removed: `BuildInput<G, P>` and `ReadOf<G>` type the structures |
| `@sittir/types` | `PortableEngine<API>`, `PortableSurface` | changed: the generated engine's type (`build`, `parse`, `project`, `render`, `kinds`, `is`); `PortableEngine<C>` over a composition is the same shape; `parse` returns `File<G>` |
| `@sittir/types/vocabulary` | `BuildInput<G, P>` | added: a path's input |
| `@sittir/types/vocabulary` | `GrammarMap` | changed: gains `nodes` (decision 2: each path's own kinds, approved 2026-11-15) and the per-path flag sets (decision 3) |
| `@sittir/types/vocabulary` | `Identifier`, `Literal.String.Text`, `Comment.Text`, `Comment.Html`, `Literal.Regex.Flags`, `Literal.Regex.Pattern`, `Clause.Import.Relative.Prefix`, `Expression.Interpolation.Conversion` | changed: gain `readonly $value: string`; the structural identifier subkinds declare `$value?: never` (decision 8, approved 2026-11-15) |
| `@sittir/types/vocabulary` | `Read<G, P>`, `InputOf<R, G>`, `BuildInput<G, P>`, `Slot` | changed: a path that declares a text `$value` also reads and builds from its bare text (decision 8, approved 2026-11-15) |
| `@sittir/types/vocabulary` | `Unmapped` | changed: in an input, a member's node arm is `G['nodes'][P]` |
| generated `<lang>/src/portable/build.ts` | `build` (the table) | replaced: `portableBuild(engine)` |
| generated `<lang>/src/portable/project.ts` | `project` | added |
| generated `<lang>/src/portable/index.ts` | `rows` | removed |
| generated `<lang>` descriptor | `portable: rows`, `portableBuild` | changed: the descriptor's portable entry is `{ build: portableBuild, project }` |

## The portable-grammar-map plan

- Its Tasks 1–5 stand. Their grammar map, `InputOf`, `ReadOf`, overrides and token texts are what the generated signatures use.
- Its Task 6 (typing `PortableRuntime.read` and `build`) is superseded: the generated functions carry the types, and `PortableRuntime` goes. Its honest-read items (typescript `identifier.qualified`) move to this work's projection task.
- Its Task 7: `PortableEngine<C>` is the generated engine's type over a composition.
- Its Task 8 is unchanged. A language feature's builders generate into its grammar package.
- Its Task 9's gates swap the conformance mirror and its ratchet for the generated modules' own type-check, with the emit diagnostics above counted at today's ceilings.
