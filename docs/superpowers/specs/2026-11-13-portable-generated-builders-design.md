# Generated portable builders and projections

**Status:** proposed, 2026-11-13. The shape, the surface, the pin and the emitter-gap rule are the user's approved answers to the example set; the rows under "Decisions" are proposals.

**Prototype:** branch `probe/portable-generated` (no PR). The emitter is `packages/tools/src/portable/prototype/emit.ts`, and its output is `packages/{python,typescript}/src/portable/prototype.ts`.

## The end state

- Codegen writes each grammar's portable layer as code: one typed function per vocabulary path that calls the grammar's low-level loose builders, and one generated projection from a node's kind to its portable structure.
- Nothing interprets a table at run time. The build table and the read table are the emitter's input inside codegen. They aren't shipped, and no run-time code walks them.
- The portable engine is `createEngine(language, { api: 'portable' })`. It carries the generated `build` namespace, `parse(source)`, `project(node)`, `render`, `kinds` and `is`.
- The emitter is the compiler's first dogfooded consumer. It writes every node of the generated modules through the `@sittir/typescript` builders of the pinned build (`bootstrap.json`), never through strings.

## The surface

```ts
using engine = await createEngine(python, { api: 'portable' });
const getter = engine.build.declaration.property.getter({
	name: 'x',
	body: { $path: 'statement.block', statements: [{ $path: 'statement.return', expression: { $path: 'literal.number.integer', $value: 1 } }] }
});
engine.render(getter); // "@property\ndef x(self):\n    return 1\n"
engine.project(engine.parse('class C:\n    @property\n    def x(self):\n        return 1\n'));
// … { $path: 'declaration.property.getter', name: 'x', body: { … } } …
```

The same call against typescript renders `get x() {\n  return 1;\n}`. A portable getter takes no `parameters` in any language, and python's generated getter writes `self` itself.

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

`packages/<lang>/src/portable/project.ts` exports `project(node)`: a `switch (node.$type)` over the grammar's kinds. Each case writes out the read tests (decorators, a name pattern, a lone `self`) and member accessors as code. The claim test `(#eq? @_self "self")` becomes `onlySelf(node.parameters())`. The projection isn't prototyped yet (see the plan).

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

Each row shows the case, then the proposed answer.

### 1. One source for a member's paths

**The case.** The prototype took its `switch` cases from the build table, while the member's type comes from the read routes (`map.ts` overrides). The two disagree:

| member | type admits | table admits | effect |
|---|---|---|---|
| typescript `expression.collection.list` → `elements` | `literal.number.integer`, `.float`, `.integer.big` | `literal.number` too (a root that picks its arm by the `$value`'s type) | `case 'literal.number'` is TS2678, not comparable to the `$path` union |
| python `declaration.property.getter` → `type` | `string` (`-> int` reads as `'int'`) | no leaf seat | no string branch, so `value.$path` on `string \| …` is TS2339 |
| python `statement.return` → `expression` | 89 paths | 85 paths | `identifier` has no build row: it builds from text |

**Proposed answer.** The member's read type is the source, because a portable input is what a read returns (`InputOf`).
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

**Proposed answer.** In an input, a member's node arm is the language's node types for the kinds its paths read, never `{ $type: number }`.
- `map.ts` gains `nodes`, one entry per path, written from the generated `PortableIds`: `readonly 'statement.block': T.Block.Bound | T.Block.Parsed | T.SuiteEmpty.Bound | …`.
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

**Proposed answer.** A path's flag names are the union of the flags its arms set and its facts carry. Read and build use the same arms. `map.ts` writes the set per path, and `FlagsAt<G, P>` reads it.

| path | today's `$flags` type | from its arms and facts |
|---|---|---|
| python `declaration.property.getter` | `'override'` | `'async' \| 'override'` |
| python `declaration.method` | per the vocabulary | `'async' \| 'static' \| 'override' \| 'privateName'` |
| typescript `declaration.property.getter` | per the vocabulary | `'static' \| 'override' \| 'privateName' \| 'computed'` |

A keyword flag is a boolean on the loose surface (`static: …includes('static')`), not a token id.

### 4. Lists

**The case.** The loose list builders, measured:

| call | possibly-empty list (`block`) | non-empty list (`parametersElements`) |
|---|---|---|
| `b.x(...items)`, `items: T[]` | type-checks | TS2345 (wants `[T, ...T[]]`) |
| `b.x({ key: items })` | type-checks | TS2345 |
| `b.x(...items)`, `items: (T \| null)[]` | TS2345 | — |
| `b.x(f(first), ...rest.map(f))` | — | type-checks |

**Proposed answer.** The loose surface doesn't change, because a non-empty list stays non-empty in its type.
- The emitter spreads a typed array for a list that may be empty.
- For a non-empty list it writes `f(first), ...rest.map(f)`. When the list's container is optional, it guards with `first === undefined`.
- It returns `null` only from members whose list takes holes (typescript `Elisions`).

```ts
const [first, ...rest] = input.parameters ?? [];
parameters: first === undefined ? b.parameters() : b.parameters(b.parametersElements(parameter(first), ...rest.map(parameter)))
```

### 5. Signatures and union size

**The case.** The prototype typed a member function's parameter as `BuildItem<Map, P, M>`, computed from the vocabulary member type, and left the functions unannotated.
- Python: TS2590 "union type too complex to represent" ×2, TS7023 implicit `any` from recursion ×2.
- Typescript: TS2590 ×4, TS7023 ×4.

**Proposed answer.**
- Each member's item type is written out as a union of `BuildInput<Map, P>` over the member's paths, plus `string` where the type admits it, plus the node types from decision 2. It's named per member, and `BuildItem` goes.
- Every arm function is annotated with its kind's node type, and every member function with its seats' node union. That breaks the recursion.
- Named per-path interfaces were tried and rejected: a path with several build forms isn't an object type (TS2312 on python `expression.lambda`, `expression.collection.tuple.bare` and two octal integers).

The largest member in any grammar is python `statement.expression` → `content`: 107 paths, 25 raw node kinds and one unmapped kind (typescript's largest: 104; rust's: 96). Its generated signature, measured:

```ts
type Item = string | BuildInput<PythonMap, 'expression.assignment'> | … /* 107 paths */ | T.Attribute.Bound | T.Attribute.Parsed | … /* 25 kinds */ | V.Unmapped<'python:as_pattern'>;
const statement_expression_content = (value: Item): T.ExpressionStatement.Bound | … => {
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

**Proposed answer.**
- The emitter runs as a mode of the pinned child process, so it loads the pin the way the reader does.
- `loadPinnedBuild` refuses to load in a process whose resolution maps the pinned build's `@sittir/common` outside the pinned directory. It checks `import.meta.resolve('@sittir/common', <pinned typescript dist>)` and throws `pinned-build-unpinned`, which names the resolved path and the child reader. A mixed load then fails at once, by name, instead of later as an unrelated arena or engine error.

## Diagnostics and the MVP sets

Generation reports, by name:

| diagnostic | cause |
|---|---|
| `portable-emit-unplaced-path` | a path in a member's type with no arm that fits the member's seats (decision 1) |
| `portable-emit-unfit-member` | a member route the emitter doesn't compile (several steps, a mounted step, a template-spelled member, a sole-item delimiter) |
| `portable-emit-pinned-gap` | the pinned builders can't express a construct |
| `portable-emit-type` | the generated module fails its type-check |

The conformance ruling ("an MVP set per language") maps onto them like this:
- On a path in the language's MVP set, any of them fails generation.
- Outside the set, it's a warning, the path isn't generated, and the ratchet counts it per grammar at today's ceilings. Ratchets only tighten.

The MVP sets themselves are the user's choice. Until they're named, every path generated today counts as outside, and the ratchet holds the line.

## Public exports

| package | export | change |
|---|---|---|
| `@sittir/common/engine` | `portableRuntime`, `portableRuntimeTree`, `PortableRuntime`, `PortableCarry`, `PortableCarried`, `portablePathHasFacts` | removed: the engine's `build` and `project` replace them |
| `@sittir/common/portable` | `classifierOf`, `registerPortableRows`, `portableTrees`, `PortableClassifier`, `PortableKindTree`, `PortableGuardTree`, `PortableQueryIds`, `PortableLanguage` | removed: no run-time table |
| `@sittir/common/portable` | `portable`, `portableGuardsOf`, `LanguageGuard`, `PortableGuard`, `PortableKind` | removed: each grammar's generated module supplies `kinds.portable` and `is.portable` |
| `@sittir/types` | `PortableReadEntry`, `PortablePath`, `PortableTable`, `PortableFact`, `PortablePlace`, `PortableRows`, `PortableStep`, `PortableCondition`, and the build-table types `PortableCallShape` through `PortableBuildTable` | removed from the public package: they become codegen's internal emitter input |
| `@sittir/types` | `PortableStructure` | removed: `BuildInput<G, P>` and `ReadOf<G>` type the structures |
| `@sittir/types` | `PortableEngine<API>`, `PortableSurface` | changed: the generated engine's type (`build`, `parse`, `project`, `render`, `kinds`, `is`); `PortableEngine<C>` over a composition is the same shape |
| `@sittir/types/vocabulary` | `BuildInput<G, P>` | added: a path's input |
| `@sittir/types/vocabulary` | `GrammarMap` | changed: gains `nodes` (decision 2) and the per-path flag sets (decision 3) |
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
