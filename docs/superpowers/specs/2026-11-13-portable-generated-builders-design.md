# Generated portable builders and projections

**Status:** proposed, 2026-11-13. The shape, the surface, the pin and the emitter-gap rule are the user's approved answers to the example set; the user approved decisions 1, 2, 3 and 6 and the public export rows on 2026-11-14. Decisions 4 and 5 change no surface and are accepted as emitter-internal. The user approved decision 7 and "a parse returns the projection" (under the surface) on 2026-11-14.

**Prototype:** branch `probe/portable-generated` (no PR). The emitter is `packages/tools/src/portable/prototype/emit.ts`, and its output is `packages/{python,typescript}/src/portable/prototype.ts`.

## The end state

- Codegen writes each grammar's portable layer as code: one typed function per vocabulary path that calls the grammar's strict builders, and one generated projection from a node's kind to its portable structure.
- Nothing interprets a table at run time. The build table and the read table are the emitter's input inside codegen. They aren't shipped, and no run-time code walks them.
- The portable engine is `createEngine(language, { api: 'portable' })`. It carries the generated `build` namespace, `parse(source)` (which returns the source's projection), `project(node)`, `render`, `kinds` and `is`.
- The emitter is the compiler's first dogfooded consumer. It writes every node of the generated modules through the `@sittir/typescript` builders of the pinned build (`bootstrap.json`), never through strings.

## The surface

```ts
using engine = await createEngine(python, { api: 'portable' });
const file = engine.parse('class C:\n    @property\n    def x(self):\n        return 1\n');
// { $path: 'file', statements: [{ $path: 'declaration.type.class', name: 'C', bases: [], body: { $path: 'statement.block', statements: [
//   { $path: 'declaration.member.property.getter', name: 'x', body: { $path: 'statement.block', statements: [
//     { $path: 'statement.return', expression: { $path: 'literal.number.integer', $value: 1 } }] } }] } }] }
const getter = engine.build.declaration.property.getter({
	name: 'x',
	body: { statements: [{ $path: 'statement.return', expression: 1 }] }
});
engine.render(getter); // "@property\ndef x(self):\n    return 1\n"
engine.render(engine.build.file(file)); // the source back
engine.project(getter); // { $path: 'declaration.member.property.getter', name: 'x', body: { … } }
```

The same calls against typescript give `get x() {\n  return 1;\n}`. A portable getter takes no `parameters` in any language, and python's generated getter writes `self` itself.

### A parse returns the projection

**Approved, 2026-11-14.** On the portable engine, projection happens on read: `parse(source)` returns the source's projection, and the caller never calls `project` after it.

- **What it returns:** the root's structure, `{ $path: 'file', … }`. Every grammar's root kind projects to `file` (python `module`, typescript `program`, rust `source_file`, probed), so the type is `File<G>`. The emitter refuses a grammar whose root kind has no `file` arm.
- **Whole, in the parse call.** The generated projection walks the tree once, while the parse holds it, and returns plain data. It isn't lazy:
  - A projection is plain data (readonly fields, arrays, strings, numbers), and it is the build's input as it stands (decision 1).
  - A lazy slot would need a getter or a `Proxy`, which the node surface rules out, or a function, which changes every slot's type and stops the projection being an input.
  - Plan Task 5 measures parse against parse-with-projection over the corpus and reports the ratio per grammar in its PR. It doesn't gate.
- **What a projection holds:**
  - every node a path claims, as its structure;
  - a node it can't express, kept in place as the node itself: the node a parse error sits on, an unclaimed kind, a flag no arm builds. The slot's node arm types it (decision 2), `engine.isNode` tells it apart, and a build passes it through. Probed: python `x = = 1` keeps its `1` as an `integer_decimal_plain` node.
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

`packages/<lang>/src/portable/build.ts` exports `portableBuild`, the namespace. It is a table of functions that take no engine, like `ir-strict.ts`, and they call the strict builders it imports (`import { ir as b } from '../ir-strict.js'`). A caller runs it inside an engine with `scopeBuilders(engine, portableBuild)` from `@sittir/common/engine`, as `createEngine` scopes `ir.ts`: each call then builds in that engine's storage, and the engine settles the result under its `verifyStructure`. Called unscoped, it builds object nodes. Inside it:

- **A path function** for each root path, typed `(input: BuildInput<Map, P>)`. When a path has one arm and no facts, the arm function is the path function. Otherwise the path function picks:
  - by the `$value`'s type when the path builds values (`builds`);
  - else by the arms' pick tests, compiled to conditions, in table order, stopping at the first arm whose tests are always true.
- **An arm function** for each arm something reaches, named `<path>$<kind>`, which makes the low-level call. Arms reached only from a holder (python `statement.block`'s suites) have no path function. The holder's slot function calls them.
  - **Among arms no pick test tells apart, the seats decide the root build.** An arm only one seat takes (one holder kind and slot) is that seat's own form, built by the holder's slot function. When exactly one arm of the group is taken by more than one seat, it is the path's root build; otherwise the path has none. So typescript's statement-level `let i = 0;` (fifteen seats) is `declaration.variable.reassignable`'s root build and the `for` header's kind (one seat) builds only there. Python's bare tuple `a, b` builds at the root as `expression_list`. Python's `*x` has no root build: both of `pattern.rest`'s kinds are taken by several seats. The rule reads which seats take each kind, never who authored a rule.
- **A slot function** per (arm, slot) that admits a nested value, named `<arm>_<slot>`. In order:
  - a list hole returns `null`, only where the slot's list takes holes;
  - a string goes to a token kind (a `switch` over the seat's token texts), placed in that token's seat containers; else to the seat's leaf builder; else through the one path among the slot's paths whose arm fits the seat and takes the string as its only required slot; else the slot refuses it (`untexted`), as the interpreter refuses a text no route seats;
  - a built or parsed node (`isNode` from `@sittir/common/utils`) passes through, placed by its kind (decision 2);
  - a structure goes through a `switch (value.$path)` over the slot's paths (decision 1). Each case calls the arm function the seat takes and wraps it in the seat's containers.
- **Facts spelled in a container** (python `@property`, `@staticmethod`, `@override`) are written where the node meets its container. The root function of a path with facts builds the container itself when any fact is set.

Python's getter, from the prototype (decisions applied, names shortened):

```ts
const declaration_property_getter$361 = (input: BuildInput<PythonMap, 'declaration.member.property.getter'>): T.MethodDeclaration.Bound =>
	b.methodDeclaration({
		name: getter_name(input.name),
		parameters: b.parameters(b.parametersElements(b.identifier('self'))),
		returnType: input.type === undefined ? undefined : getter_type(input.type),
		body: getter_body(input.body),
		async: (input.$flags ?? []).includes('async')
	});
const declaration_property_getter = (input: BuildInput<PythonMap, 'declaration.member.property.getter'>) => {
	const node = declaration_property_getter$361(input);
	const decorators = [
		attribute_decorator({ $path: 'attribute.decorator', content: 'property' }),
		...((input.$flags ?? []).includes('override') ? [attribute_decorator({ $path: 'attribute.decorator', content: 'override' })] : [])
	];
	return decorators.length === 0 ? node : b.decoratedDefinitionClassDeclaration({ definition: node, decorators });
};
```

`packages/<lang>/src/portable/project.ts` exports `project(node, carried?)`: a `switch (node.$type)` over the grammar's kinds. The portable engine's `parse` calls it on the root. Each case writes out the read tests (decorators, a name pattern, a lone `self`) and slot accessors as code. The claim test `(#eq? @_self "self")` becomes `onlySelf(node.parameters())`. The projection isn't prototyped yet (see the plan).

`packages/<lang>/src/portable/map.ts` keeps the grammar map and gains `nodes` (decision 2) and the per-path flag sets (decision 3).

## The emitter

- **Where it runs:** in codegen's pinned child process (`bindings/pinned-reader.child.ts`), as a new mode beside `facts` and `exportedStrings`. The child runs under `TSX_TSCONFIG_PATH=packages/codegen/tsconfig.pinned.json`, so the workspace `paths` never reach the pinned build (decision 6).
- **What it reads:** the grammar's build table and read routes, which are the same facts that write `map.ts` today.
- **What it writes:** every node of the module through the pinned engine's builders (`t.callExpressionCall`, `t.arrowFunction.callSignature`, `t.switchStatement`, …), then `engine.render` gives the text.
  - The header comment is `statement.$trivia.leading(t.comment.line(' Auto-generated …'))`.
  - The export is `t.exportStatementDefaultDeclaration({ content })`, which writes `export const portableBuild`.
- **Gaps:** a construct the pinned builders can't express fails generation with `portable-emit-pinned-gap`, naming the construct and the pinned sha. There's no string or parsed-snippet fallback. The fix lands in `@sittir/typescript` on master, and a later commit bumps the pin.
  - Known today: `binaryExpression.in` throws on any input, so the emitter writes no `in` test. It checks a built node with `isNode`.
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

### 1. One source for a slot's paths

**The case.** The prototype took its `switch` cases from the build table, while the slot's type comes from the read routes (`map.ts` overrides). The two disagree:

| slot | type admits | table admits | effect |
|---|---|---|---|
| typescript `expression.collection.list` → `elements` | `literal.number.integer`, `.float`, `.integer.big` | `literal.number` too (a root that picks its arm by the `$value`'s type) | `case 'literal.number'` is TS2678, not comparable to the `$path` union |
| python `declaration.member.property.getter` → `type` | `string` (`-> int` reads as `'int'`) | no leaf seat | no string branch, so `value.$path` on `string \| …` is TS2339 |
| python `statement.return` → `expression` | 89 paths | 85 paths | `identifier` has no build row: it builds from text |

**Answer (approved 2026-11-14).** The slot's read type is the source, because a portable input is what a read returns (`InputOf`).
- The emitter takes each slot's path set from the same read-route facts that write the `map.ts` override. Every path in it gets a case.
- Each case's placement comes from the build table. A path with no fitting arm fails generation as `portable-emit-unplaced-path`.
- A string the type admits but no leaf, text or token seat takes builds through the slot's one path whose arm takes it as its only required slot: python `qualifier: 'a'` writes `identifier_qualified({ name: 'a' })`, which builds `dottedName({ name: identifier('a') })`. Where no path or more than one does, the slot refuses the string (`untexted`), as the interpreter refuses a text no route seats.
- A build-only convenience, like a root path that picks its arm by the `$value`'s type (typescript `literal.number`), joins the slot's type through `G['inputs']`. That's written from the build rows that carry `builds`, so the case list still equals the type.

```ts
// typescript array element, cases = the type's paths
switch (value.$path) {
	case 'literal.number.integer': return literal_number_integer(value);
	case 'literal.number.float': return literal_number_float(value);
	case 'literal.number': return literal_number(value); // admitted through G['inputs']
	…
}
// python qualifier: a text builds through identifier.qualified, whose only required slot takes it
if (typeof value === 'string') return identifier_qualified$187({ name: value });
```

### 2. A node passed as input

**The case.** `Slot` adds `Unmapped` (`{ readonly $type: number }`) to every slot. So the node guard narrows the input to the whole `PythonNode` union, and the pass-through fails its slot:
```
methodDeclaration({ name: getter_name(input.name), … })
TS2322: Type 'PythonNode' is not assignable to type 'string | ({ readonly $type: TSKindId.Identifier; } & NodeMarker)'.
```

**Answer (approved 2026-11-14).** In an input, a slot's node arm is the language's node types for the kinds its paths read, never `{ $type: number }`.
- `map.ts` gains `nodes`, one entry per path: the kinds whose read entries read as that path, never a subpath's (approved 2026-11-15). `readonly 'statement.block': T.Block.Bound | T.Block.Parsed | T.SuiteEmpty.Bound | …`. `PortableIds` keeps the whole family, because the `is` guards test a family. A path's nodes come from the same read entries its read arms do, so python's `identifier` takes an `Identifier` node and refuses a `DottedName`, which reads as `identifier.qualified`.
- An unmapped kind keeps its `UnmappedKinds` entry, which is already a real node type.
- The module's own guard, `const isNode = (value: unknown): value is PythonNode => isAnyNode(value)` (`isAnyNode` is `isNode` from `@sittir/common/utils`), narrows as `engine.isNode` does, without its language check. It then narrows to exactly those types, and the generated code places the node by its kind:

```ts
type BodyItem = BuildInput<PythonMap, 'statement.block'> | PythonMap['nodes']['statement.block'];
if (isNode(value)) return value.$type === TSKindId.Block ? b.suiteBlock(value) : value;
```

| passed | compile time | run time |
|---|---|---|
| a python `Block` node into a getter `body` | accepted, wrapped in `suite_block` | builds |
| a typescript node | TS2345, not assignable (probed) | inside a python engine (`scopeBuilders`), the builder that takes it refuses: `cannot build a python return_statement with a typescript node in its …` (tested); where its kind matches no seat, `unseated` refuses first, naming the slot and the kind. Unscoped, nothing checks its language, as nothing does for `ir.ts` called unscoped |
| a python node of a kind the slot doesn't take (a `Block` as a `name`) | TS2345 (probed) | `unseated` refuses it before any builder runs, naming the slot and the kind |

### 3. Flags

**The case.** Python reads `@property async def x(self)` as `{ $path: 'declaration.member.property.getter', $flags: ['async'], name: 'x' }`. The getter's `$flags` type is `'override'` only, so the read isn't assignable to its own input. The generated `async: …includes('async')` is TS2345: `'"async"' is not assignable to parameter of type '"override"'`.

**Answer (approved 2026-11-14).** A path's flag names are the union of the flags its arms set and its facts carry. Read and build use the same arms. `map.ts` writes the set per path, and `FlagsAt<G, P>` reads it.

| path | today's `$flags` type | from its arms and facts |
|---|---|---|
| python `declaration.member.property.getter` | `'override'` | `'async' \| 'override'` |
| python `declaration.member.method` | per the vocabulary | `'async' \| 'static' \| 'override' \| 'privateName'` |
| typescript `declaration.member.property.getter` | per the vocabulary | `'static' \| 'override' \| 'privateName' \| 'computed'` |

A keyword flag is a boolean on the strict builders (`static: …includes('static')`), not a token id.

A flag a container sets on what it unwraps is among its element path's flags. Rust's `expression.call.macro` has `'terminated'`, which an expression statement sets on the macro call it unwraps: `a!();` reads `{ $path: 'expression.call.macro', $flags: ['terminated'], … }`, and an item macro (`foo! { }`) reads with no flags (the user, 2026-11-16: "Flag `terminated` on the macro call"). The build takes the expression-statement seat for a flagged macro call and the item seat for an unflagged one, so both round-trip (bindings spec §9).

### 4. Lists

**The case.** The loose list builders, measured:

| call | possibly-empty list (`block`) | non-empty list (`parametersElements`) |
|---|---|---|
| `b.x(...items)`, `items: T[]` | type-checks | TS2345 (wants `[T, ...T[]]`) |
| `b.x({ key: items })` | type-checks | TS2345 |
| `b.x(...items)`, `items: (T \| null)[]` | TS2345 | — |
| `b.x(f(first), ...rest.map(f))` | — | type-checks |

**Answer (emitter-internal, accepted 2026-11-14).** The builders don't change: a non-empty list stays non-empty in the strict builders' types, as in the loose ones'.
- The emitter spreads a typed array for a list that may be empty.
- For a non-empty list it writes `f(first), ...rest.map(f)`. When the list's container is optional, it guards with `first === undefined`.
- It returns `null` only from slots whose list takes holes (typescript `Elisions`).
- A one-item list that no list seat takes builds in the slot's single seat: python's `from a import *` reads `names: ['*']`, and the build writes the wildcard (the user, 2026-11-16: "Approve all listed").

```ts
const [first, ...rest] = input.parameters ?? [];
parameters: first === undefined ? b.parameters() : b.parameters(b.parametersElements(parameter(first), ...rest.map(parameter)))
```

### 5. Signatures and union size

**The case.** The prototype typed a slot function's parameter as `BuildItem<Map, P, M>`, computed from the vocabulary slot type, and left the functions unannotated.
- Python: TS2590 "union type too complex to represent" ×2, TS7023 implicit `any` from recursion ×2.
- Typescript: TS2590 ×4, TS7023 ×4.

**Answer (emitter-internal, accepted 2026-11-14).**
- Each slot's item type is written out as a union of `BuildInput<Map, P>` over the slot's paths, plus `string` where the type admits it, plus the node types from decision 2. It's named per slot, and `BuildItem` goes.
- Every arm function is annotated with its kind's node type. A slot function's return is inferred from the arm functions it calls. That breaks the recursion: the generated build modules type-check with 0 errors in all three grammars under tsrs, the TypeScript 7 checker (measured 2026-11-18). TypeScript 6 is not a lane the repo checks. A slot function is not annotated with its seats' node union, as this decision first said: that union cannot be written for every slot, because some seat kinds have no node type in the grammar's node union (python's `statement.return` expression slot: 13 of its 54 seat kinds, the keyword leaves, the number leaves and the supertypes `Expression` and `PrimaryExpression`).
- Named per-path interfaces were tried and rejected: a path with several build forms isn't an object type (TS2312 on python `expression.lambda`, `expression.collection.tuple.bare` and two octal integers).

The largest slot measured holds the expressions a python statement can be: 107 paths, 25 raw node kinds and one unmapped kind (typescript's largest: 104; rust's: 96). Python's statement lists hold those expressions beside the statements themselves (bindings spec §6, rule 6). The slot's generated signature, measured:

```ts
type Item = string | BuildInput<PythonMap, 'expression.assignment'> | … /* 107 paths */ | T.Attribute.Bound | T.Attribute.Parsed | … /* 25 kinds */ | V.Unmapped<'python:as_pattern'>;
const expression_item = (value: Item): T.ExpressionStatement.Bound | … => {
	if (typeof value === 'string') return …;
	if (isNode(value)) return value;
	switch (value.$path) { case 'expression.assignment': return …; /* 107 cases */ }
};
```

It narrows with 0 errors. Check time is 8.9 s against a 5.9 s baseline (the same imports with no slot function), and 38.1M instantiations against 18.7M. Most of the difference is the first instantiation of the path input types, which every later slot function shares. The whole module's time is measured against the baseline and reported. It doesn't gate.

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
  - on a slot whose paths include exactly one structure-built path (a getter's or a method's `body`).
  
  The type is `{ readonly $path?: P }` there. The generated slot function reads a structure without `$path` as that path, with no `switch`.
- **A bare scalar coerces** where the slot's paths include a value path that builds it, as the loose builders coerce:
  - a `number` or `bigint` goes to the path whose `builds` row takes it (an integral number to `builds.integer`, any other number to `builds.float`, a `bigint` to `builds.bigint`);
  - `true` and `false` go to the boolean paths: each value to a path every one of whose arms reads that value (`literal.boolean.true`, `literal.boolean.false`). A path that picks between the two by `$value`, as rust's `literal.boolean` does, takes neither alone, so no slot's input gains a `$value`-tagged boolean shape for it;
  - a string goes to the slot's leaf, as today.
  
  The type admits the scalar exactly where a path builds it. A slot where two paths take the same scalar and neither is beneath the other is `portable-emit-unfit-slot`; otherwise the outermost takes it (an integer goes to `literal.number.integer`, not `.hex`; ruled 2026-11-17, "The outermost path takes it").
- `$path` stays required on a slot with several structure-built paths (a block's `statements`).

| call | today | after |
|---|---|---|
| a getter | `getter({ $path: 'declaration.member.property.getter', name: 'x', body: { $path: 'statement.block', statements: [{ $path: 'statement.return', expression: { $path: 'literal.number.integer', $value: 1 } }] } })` | `getter({ name: 'x', body: { statements: [{ $path: 'statement.return', expression: 1 }] } })` |
| a float element | `list({ $path: 'expression.collection.list', elements: [{ $path: 'literal.number.float', $value: 1.5 }] })` | `list({ elements: [1.5] })` |
| an identifier element | `list({ $path: 'expression.collection.list', elements: ['y'] })` | `list({ elements: ['y'] })` |

The generated slot function for `statement.return` → `expression`, after:
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
- A guard derives the set from the build tables. A path whose build arms include one that takes a text `$value` (a text arm or a content arm), and none of which needs a slot or builds another value, declares the text `$value`, and no other path does.
- Its read and its input are its bare text or `{ $path, $value }`. `{ $path }` alone is a type error.
- `Read<G, P>`, `InputOf` and a slot's default all add the bare text for such a path. The reader is unchanged.
- The identifier subkinds that are structures (`identifier.qualified`, `.label`, `.lifetime`) restate `$value` away.
- The fixed-word text paths keep `{ $path }`, because every grammar builds them from it: `statement.break`, `statement.continue`, `modifier.visibility.*`, `expression.meta` and `clause.import.wildcard`.
- A path whose text arm sits beside structural arms (rust `literal.character`), or whose `$value` is a number (python `literal.number.integer`, rust `literal.number.float`, typescript `literal.number`), is left out. Its input needs forms, each stating either `$value` or the slots. Its text form requires `$value`: rust's `literal.character` is `V.Form<'content', '$value'> | V.Form<'$value', 'content'>` (the user, 2026-11-16: "Approve all listed").
- A text-built arm requires `$value` in its pick tests, so the map types every text-built path's input as `$forms: V.Form<'$value'>` (the user, 2026-11-16).
- The repo type-checks under tsrs only; there is no TypeScript 6 lane (the maintainer, 2026-11-18: "there should be no ts6 typecheck only tsrs"). This replaces the 2026-11-16 arrangement, in which a negative check on a build form ran in a TypeScript 6 lane because a tsrs program that has already related a map's reads to its inputs can skip a later negative check. Three negative checks went with that lane, since tsrs accepts their inputs: typescript's qualified name passed as a class `name`, `typedSequence` and `declaredTypedSequence`. They are recorded in an issue (the maintainer: "Delete, file an issue").

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
  - as another `case` label in the generated slot function.

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
| `{ $path: 'add', left: 'a', right: 'b' }` | TS2322 | refused: the slot function has no `case 'add'` |
| `{ $path: 'binary.arithmetic.add', left: 'a', right: 'b' }` | TS2322 | refused: neither the tail nor the full path |

Table 3. One path is a prefix of another. A tail is a suffix, so a prefix never collides.

| slot | admitted path | tail |
|---|---|---|
| rust `declaration.function.parameters` | `identifier` | `identifier` |
| | `identifier.qualified` | `qualified` |
| | `identifier.metavariable` | `metavariable` |
| rust `statement.return.expression` | `expression.call` | `call` |
| | `expression.call.member` | `call.member` (`member` also ends `expression.member`) |
| | `expression.member` | `expression.member` (`member` also ends `expression.call.member`, so no shorter suffix is its own) |

Table 4. The same path in different slots: `expression.binary.arithmetic.add`'s tail.

| slot | also admits `expression.assignment.compound.add` | tail |
|---|---|---|
| python `statement.return.expression` | no | `add` |
| python `file.statements` | yes | `arithmetic.add` |
| rust `statement.return.expression` | yes | `arithmetic.add` |
| typescript `statement.return.expression` | yes | `arithmetic.add` |

Python's tail is `add` in 171 slots and `arithmetic.add` in 2, its statement lists (`file.statements` and `statement.block.statements`). Rust and typescript need `arithmetic.add` in all of theirs (144 and 198 slots).

### Ruled while the emitter was built (2026-11-17)

- **The generated builders call the strict builders, not the loose ones** ("We should have the portable builder call the strict api", confirmed "Yes, generated builders call the strict API"). This replaces "calls the grammar's low-level loose builders" in The end state and wherever this spec routes a value "to the loose builder": the generated function knows each slot's paths, so it writes the exact strict call itself, and no coercion is left to a loose builder. Python `{ $path: 'identifier.qualified', qualifier: 'a', name: 'b' }` builds `a.b` because the generated code writes `dottedName({ name: identifier('a') })`. The portable input still behaves like the loose API for its caller (bare scalars, an optional `$path`). Two answers given earlier the same day fall away with it: no loose slot gains `string`, and the loose list arguments are not widened for `null`. The strict list arguments are ("Strict list args admit null on hole-taking kinds"): on kinds whose model says `hasOptionalElements` (typescript `arguments`, `array`, `array_pattern`, `object`, `object_pattern`; regex `alternation`) the strict list argument goes through the `withHoles` type the storage and setters use, so `arrayPattern([a, null, b])` builds `[a,, b]` and a read is a valid build input. Neither surface took `null` there before. The generated module imports the strict builder table directly, as `ir.ts` imports the loose builders; it does not take an engine to reach them ("It doesn't need to take an engine - it can import the strict functions directly just like loose does", on seeing the re-costing, which proposed `portableBuild(engine)` over a strict engine). The re-costing: one file (`emit/build.ts`), about 100–200 lines; the pin needs nothing; no arm stops generating; the run-time coercions become explicit generated calls (a string through the one path whose arm takes it as its only required slot, a token's kind id wrapped in its seat's container builder, an integer passed to its builder once per scalar type, since TypeScript infers a radix builder's literal parameter from a number or a bigint but not from their union).
- **In a slot that takes numbers, a bare number is a number** ("The number is a number"). The map types a fixed word's built form as its bare kind id (python `True`, `False`, `None`, `...`), which is a number, so `expression: 69` could not be told from the integer 69. Where a slot has a number taker, the type no longer admits a fixed word's bare kind id: `{ $path: 'statement.return', expression: 69 }` builds `return 69`, and a fixed word is written as its structure (`{ $path: 'literal.null' }`) or, once literal arms generate, its scalar (`true`), which is also what a read returns. Bare kind ids stay in slots with no number taker (operators and other kind-enum members).
- **A number path is `$path` and `$value`** ("A number path is `$path` + `$value`"). The table listed a number arm's numeric parts (python float `integer`, `fraction`, `exponent`; rust integer `content`; the radix prefixes and exponent markers) as required slots, but a read never returns them (`0X1F` reads `{ $path: 'literal.number.integer.hex', $value: 31 }`), so a read failed its own type and was not a valid build input. A number arm's numeric parts are its `$value`: the table drops them from the arm's slots and requires `$value`, and the read and build types of a number path hold `$path`, `$value` and the non-numeric slots only (rust `suffix`, python's long `marker`, python `imaginary`). The slots narrowed to token texts that are such numeric parts (21 of the 30) leave the types instead.
- **An option still tells kinds apart** (the maintainer, 2026-11-17: "spelling slots definitely tell kinds apart.... just like separators separate nodes, but the type of separator, ; vs. , can in certain cases be a spelling"; on the terms: "we should call grammar side choices of this kind 'preferences' not spelling", and, settling the two words, "an option, is a slot bound to a preference"). The two terms: a **preference** is the grammar-side choice among forms that mean the same thing, as the grammar layer declares it (`preference('separator', 'semi')`, `preference('double_blankline')`); an **option** is a slot bound to a preference, the place where that choice is written. A number's radix prefix (`0x` or `0X`), its exponent marker (`e` or `E`) and the separator a list writes (`;` or `,`) are options where a preference binds them. A slot that is only an option leaves the portable types with the number-path ruling, but it remains a fact of the grammar that distinguishes parser kinds: modern octal `0o17` and legacy octal `017` stay two kinds though both read as `integer.octal` with a `$value`. The bindings' shape comparison therefore counts those slots beside the routed slots. The same split holds for separators: a separator's presence separates nodes, while which separator it is can be an option.
- **A path is defined by its slots and flags** (the maintainer, 2026-11-20: "path/kind in the portable api is defined by its slots/flags - meaning both the for_header versions and the base versions map to the same portable kind"). Kinds whose slots and flags agree read as one path, whatever grammar rule produced them, so a difference between grammar rules makes no difference on the portable surface. A seat builds the kind it takes: a structure's `$path` case calls the arm its seat takes, and an arm reached only from a holder has no path function. Typescript's classic `for` header kinds hold the keyword and declarators as `lexical_declaration`, `variable_declaration` and `using_declaration` do, so `for (let i = 0; …)` reads its initializer as `declaration.variable.reassignable` as a statement-level `let` does, and that value built at the header's seat builds the header kind. An option one kind has and the other lacks (the statement's terminator) doesn't split the path, since options are not on it, as modern and legacy octal are two kinds that both read as `integer.octal`. Such kinds are not merged into one name: the bindings fold two kinds of one path onto its name only where their slots and options all agree (`sameShapeAs` counts a kind's options), and the statement kinds' terminator option tells the header kinds apart. So each header kind keeps its own grammar name, the derivation lists it among the claimed kinds not merged, and both read as the path, each built at its own seat. Folding the header kind onto the statement kind's name would undo its own kinds. The for-in header's kinds are not this case: each holds the whole parenthesised header (`left`, `operator`, `right`), not a declaration, and reads raw today.
- **The words for what a path holds are slot, option and flag** (the maintainer, 2026-11-17: "member is new jargon we shouldn't introduce... you are either a slot or an option and i guess we have flags"). "Member" is not a term of this design: where this spec, its plan, the build table, the portable types or a diagnostic say "member" for a field of a path, the word is slot, or option where a preference binds it, or flag for a `$flags` entry. The rename is costed before it is made, since some of the names are public (`MemberInput`, `portable-emit-unfit-member`). In the bindings, one collection holds slots and flags together, each entry carrying `flag` (`Vocabulary.members(path)`, the binding facts, the read routes, derive's level facts): those collections are named slots too (the maintainer, 2026-11-17), since a flag there is read from a grammar slot, by its presence or its kind. The rename changes no data structure; the build table keeps `slots` and `flags` apart as it does today.
- **A number path has options and slots** (2026-11-17; the terms are the maintainer's: "you have options and then you have slots - for numbers, one of those slots is called value, the rest of the slots depend on the kind/path"). An **option** is a slot a declared preference binds (`registered` on the model): the radix prefix, the exponent marker and python's long marker (`L` or `l`). Options are not on the portable path ("Yes: options leave the portable number paths"). Of the **slots**, one is the value, `$value`: the grammar's digit and sign slots (`content`, `integer`, `fraction`, `exponent` and the exponent's sign, which "is part of the value": `-` is the value's sign and a positive exponent writes nothing, so `1e+5` builds back as `1e5`) are what the value is written from, and none of them is a slot of the path by itself. The rest of a path's slots depend on its kind: rust's integer `suffix`, python's `imaginary`. So of the 30 slots typed as token texts, 5 remain: rust's four integer `suffix` and the macro `fragment`.
- **A kind id has no meaning on the portable surface** (the maintainer, on the ruling above: "technically kindId's shouldn't have a meaning in the portable api surface"). A kind id is the low-level API's name for a kind; a portable input or read names things by path, by value or by text. So the bare kind ids the map still admits (a fixed word's built form, and the operator and other kind-enum members left in place by the ruling above) are a gap to close, not a form to keep. Before code: a census of every place a kind id appears in the portable types and reads, per grammar, and the path each becomes: where the low-level API names a kind by its id, the portable surface names it by its path, which is the portable name for a kind ("It should be a path (as this is our jargon for portable kinds)"). The path is typed ("Path should be typed"): a slot's type admits exactly the paths its seats build, as literal types, never `string`, so a path the slot cannot hold is a type error. A nominal brand was considered and not taken ("Literal union, no nominal brand; close the kind-id gap"): `TSKindId` is itself an unbranded numeric enum, a slot's `$path` is already the literal union of the paths its seats build (`'literal.nul'` and an un-narrowed `string` are type errors), and a brand would put a generated constant on every structure. The gap closes as the census found it: kind ids reach the portable types only as the fallback for a fixed word with no bound surface, and every such word already has a vocabulary path (python 9, rust 16, typescript 23). That fallback becomes `never`; a bare number in a slot with no number taker is refused instead of placed as a kind id; the `PortableStructure` documentation drops "a kind id". A fixed word is written as its read returns it: `{ $path: 'literal.null' }` for a structure path, its text for a text path. It is its own task after the emitter's. A value that is not a kind (a number, a text, a flag) stays a scalar, a token text or a boolean. The rows go to the maintainer.
- **The generated module's import** reads "as `ir.ts` imports the loose builders": the module imports `ir` from `../ir-strict.js`, since the build table stamps ir paths, and the caller scopes it with `scopeBuilders(engine, portableBuild)`. Before this ruling the module took an engine.
- **A slot whose grammar slot is a fixed set of tokens is typed as those texts** ("The map narrows them to their token texts"): rust `fragment` and the integer `suffix` read and build as the union the grammar admits (`'u8' | 'i32' | …`), derived from the grammar's token list, not `string`. One rule for every such slot; the count per grammar is reported before code.
- **`decimalSpelling` is exported** from `@sittir/common/portable/utils` ("Approve"): `decimalSpelling(value: number | bigint, parts, scientific: boolean): DecimalSpelling<P> | undefined` in `packages/common/src/number.ts`. The interpreter's spelling bodies move into it unchanged, and the generated build calls it; `undefined` means unspellable and each caller throws its own message.
- **A fact's spellings carry their text** (brainstorm's call, 2026-11-18, from the end state's "Nothing interprets a table at run time"). For a fact spelled in a container, the build table stamps each spelling with the text the reader reads at its spelled site, and codegen derives that text from the spelling's stated values and the grammar's fixed tokens. The generated function then compares `$at.<fact>.spelling` with a literal (`'override'`, `'typing.override'`) and builds the spelling it names. The generated module imports no read rows. A spelling the interpreter builds is never a generated-module refusal.
- **`$at` is typed, and each fact's spelling is generated code** (the maintainer, 2026-11-19: "This shouldn't happen at run time - generated builders should be calling those inputs directly?", then "Approve" on the generated form). The map gains `facts`: per path with facts, each fact and the union of its stamped spelling texts. Inputs and reads gain `$at?` typed per path from it (`override?: { index: number; spelling?: 'override' | 'typing.override' }`), so a wrong spelling is a type error. A spelling with holes is typed from its item and holes (the setter's `` `${string}.setter` ``) and built from the slot it names. Each fact's spelling is a generated switch, one case per stamped text, that calls the low-level builders. Its default refuses naming the slot, as the `$path` switch's default does, and only an untyped caller reaches it. No generic helper reads `$at` at run time. The order of facts among the stated items is input data (`$at.<fact>.index`), placed by a typed splice over the entries the function builds. Which container a fact goes in is decided per path at codegen time, by branches on the slots and flags the input states.
- **`$at` is not tied to `$flags` in the types** (the maintainer, 2026-11-19: "Keep the run-time refusal"). An input may type-check with `$at.<fact>` for a fact its flags don't set; the generated build and the interpreter both refuse it, naming the fact (`unset`). No builder takes a type parameter over its input to tie the two.
- **A read may normalize spelling, never value** (the maintainer, 2026-11-23). A read that cannot keep a value carries the parsed node. Python's debug f-string is one: `f"{a+b = }"` prints its own source text, so where `debug` holds, `expression.interpolation` reads as the node, and a build from a structure still sets `debug`. For this, python's ceilings rise once: claimed kinds with a per-kind raw arm from 1 to 3 (`interpolation`, `format_expression`), and corpus entries carried whole from 5 to 6.
- **An arm mounted through a child also fills a seat whose envelope is its holder.** Python's `simple_pattern_negative` mounts at two holders, and `union_pattern`'s `left` and `right` unwrap one of them, so `case 3 | -3` builds through the existing `simplePattern.negative` with no new public builder. Two corpus structures that used to throw now build through the interpreter, so python's count of structures only the interpreter builds is 438 where it was 436 (the maintainer, 2026-11-23: "Raise to 438").
- **A range pattern reads `start` and `end`, as a range expression does** (the maintainer, 2026-11-23: "should range read more like start end?", then "Rename to start/end"). Rust's `a..b` is `{ start, end }` on `expression.range*` and on the four `pattern.range*` paths, and the rename reaches `range_pattern`'s fields at the low level (the maintainer, 2026-11-23: "field name changes always go to the low level"). `pattern.range.exclusive` also takes `start` alone, so `d..` is typed build input. Three corpus structures that used to throw now build through the interpreter, so rust's count of structures only the interpreter builds is 626 where it was 623 (the maintainer, 2026-11-23: "okay that's fine... and yes to the later").
- **A range's forms are named by the bounds they hold** (the maintainer, 2026-11-23: "range_pattern_lower_bounded, range_pattern_bounded, range_pattern_upper_bounded, range_pattern_unbounded", then "confirmed if you agree with it"). `a..b` is `_bounded`, `a..` is `_lower_bounded` and `..b` is `_upper_bounded`, on both `range_pattern` and `range_expression`. Only `range_expression` has `_unbounded`, because a bare `..` in a pattern is the rest pattern. `range_pattern` becomes three flat arms, so each form holds its own `start` and `end`, as `range_expression`'s do. A `variant()` inside a choice arm that has no variant of its own takes that arm's sequence; no layer uses that shape today, so no other rule moves. Each claim names what tells its form, its operator or the bound it lacks (`(range_pattern_lower_bounded !end)`), so no range kind takes a path's bound name in place of these. `a..` has no operator to choose, so `pattern.range` builds it from `{ start }`, as `expression.range` builds its forms with no operator (the maintainer, 2026-11-23: "Allow it"). `{ start, end }` there still refuses, and a read still names a refinement. The split counts one more kind with raw arms, so rust's per-value ceiling is 97 where it was 96 (the maintainer, 2026-11-23: "Raise to 97"), and rust's count of structures only the interpreter builds falls to 615.
- **A declaration holds its body's contents directly** (the maintainer, 2026-11-19, replacing the same day's "A body is one node": "Does it need a body? Do we gain anything by not flattening the contents of the body into the declaration?", "I'm thinking body is replaced with statements", "Those body facts would be hoisted into the declaration's surface", "Name each by what it holds", "technically a class declaration is composed of members", then "Approve" on the names below). A body is not a node of its own on the portable surface. What it holds goes directly on its holder, in a slot named for what the holder is made of, in every grammar:
  - class, interface, trait, impl and enum hold `members`, the vocabulary's own word (`Declaration.Member.EnumMember`). `members` is typed by the member kind-set (bindings and vocabulary spec §4.5), whose base arms are the member paths (method, constructor, accessor, field, constant, type alias, index signature, static block, and a nested type where a language has one), not `Declaration.Any | Statement.Any`. A feature adds kinds to it, and a language's map narrows it to what its grammar places there; a language adds nothing (the maintainer, 2026-11-21: "We still take the language-level overrides approach"). The maintainer's 2026-11-19 rule left a statement in a python class to the language "unless it corresponds to a meaningful feature", and it is one (2026-11-21: "It's a feature - whatever you want to call it"): `executable-class-bodies` adds the statement and expression kind-sets to the member kind-set, so a class-level `if`, `print()` or `pass` reads and builds as a member. A class-level `x = 1` is such a statement too, and python holds no field. A typescript class holds methods, fields, accessors, index signatures and static blocks, and no nested `class`, `function`, variable, `interface` or `type` (the maintainer, 2026-11-19: "typescript doesn't permit any declaration in its classes"). Narrowing the member kind-set's base to the member paths waits for the grammars (the maintainer, 2026-11-20: "Rename now, narrow later"): rust's trait and impl bodies reuse the module's item list, so its parser places any item there, and a typescript interface body admits `export`. Neither is a kind a feature adds, and a language's map can't add one. Until each grammar's layer narrows its list to what its compiler accepts, through its `_member_declaration` rule, the member kind-set's base is today's wide type, the `declaration` and `statement` levels, and the features' arms are added to it as for any kind-set.
  - module, function, method, accessor, loop, `try` and `catch` hold `statements`.
  - struct holds `fields`, switch holds `cases`, match holds `arms`.

  A fact the block carried becomes a fact on its holder. A missing body reads `undefined` and an empty one `[]`, as a hoisted list does (`mod m;` and `mod m {}`). So python's `class A:` / `x = 1` reads `{ $path: 'declaration.type.class', name: 'A', members: [x = 1] }`, and `mod m { fn f() {} }` reads `{ $path: 'declaration.module', name: 'm', statements: [fn f] }`. An expression body (an arrow function's `x => x + 1`, a `lambda`) keeps its slot. Which block facts exist, and the per-path list, come from the census that comes before the code. The census's answers:
  - **A one-statement body holds `statements`** (the maintainer, 2026-11-19: "statements + braces option"). A typescript loop or `else` reads `for (;;) x();` and `for (;;) { x(); }` both as `statements: [x()]`, and braced or bare is an option on the holder, braced by default, bare only for one statement. **The braces and suite options stay off the portable path** (the maintainer, 2026-11-20: "Off the path", over a `bare` and an `inline` flag), as number options do: a read doesn't say which form a body took, and a portable build takes the option's default, braced or indented, with `[]` as python's empty form. So `for (;;) x();` builds as `for (;;) {⏎  x();⏎}`, and python's `def f(): x` as an indented suite. **An `else` whose statements are one `if` builds bare** (the maintainer, 2026-11-21: "One if builds else if", over the braced build this bullet first gave it): typescript's and rust's `else if (d) {}` builds back as `else if (d) {}`. The default is decided from the content, so the read gains no flag and the option stays off the path; a source that braces a lone `if` (`else { if (d) {} }`) builds back as `else if (d) {}`. The bare form whose bindings capture names its kinds is a built route that seats only those kinds (rust's `if_expression`; typescript's `(else_clause body: (if_statement) @statements)`), and a slot whose only item is one of them builds through it, in the generated build and the interpreter alike; a bare form that captures any kind stays read only, so `else { x(); }` builds braced (the maintainer, 2026-11-21: "Split the route", over widening `readOnly` to a form that sometimes builds). So a slot's routes split by the kinds their captures name, and two routes may land on one grammar slot when their kinds don't overlap. The bare and inline forms remain the low-level builders' options; the portable surface doesn't build them. `with` (`statement.scope`), a labeled statement and `declare` (`declaration.ambient`) hold exactly one statement and keep a one-statement slot.
  - **A rust tail value is its own slot** (the maintainer, 2026-11-19: "Its own slot"). The holder takes the block's `trailingExpression` beside `statements`: `fn f() -> i32 { g(); 1 }` reads `statements: [g()], trailingExpression: 1`, and `fn f() { g(); 1; }` reads `statements: [g(), 1]`.
  - The rest follow from the rulings above (brainstorm's calls, 2026-11-19):
    - **Holders of statements:** typescript's `static { … }`, `finally` (python, typescript), `else` (python, rust) and python's `with` (`statement.resource`). Rust's value blocks hold `statements` directly as well: `unsafe`, `async`, `const`, `gen` and `try`, a bare block value, and a labeled block, which keeps its `label`.
    - **A case:** python's `case p:` holds `statements`. Rust's `p => expr` keeps its expression slot, as a lambda does.
    - **A struct expression:** `Point { x: 1, ..base }` holds `fields`, and the base is that list's last item, `element.struct.base`, not a slot of its own (the maintainer, 2026-11-20: "Typing can enforce this, right? Also the slots are same, it's simply the rendering that is different, correct?", replacing the same day's "The expression"). In the grammar the base is an item of the same list that renders `..` before its value, so it reads `{ fields: [x: 1, ..base] }` and builds in order. That it comes last is a type: `fields` is `readonly Field[] | readonly [...Field[], StructBase]`. The type derives from the grammar layer narrowing the list to its fields and then an optional base, since upstream admits the base anywhere and only the compiler refuses it, so the parser refuses a misplaced base too.
    - **An item a language requires last stays the list's last item, typed so** (the same ruling): typescript's object and array rest (`{a, ...r}`, `[a, ...r]`) and rest parameter (`(a, ...args)`), rust's variadic parameter (`fn f(a, ...)`) and its struct pattern's `..`. Each reads in order as today, and its list's type puts it last once the grammar layer states that order; none takes a slot of its own. Python's parameter sections (`/`, `*`, `**kw`) are an order of several parts, not one last item, and are not this case.
    - **An enum variant's fields** (brainstorm's call, 2026-11-20, from "Name each by what it holds"): `V { x: i32 }` and `W(u8)` read through the containers a struct does, so they hold `fields` too, and a unit variant `X` holds none, as `struct U;` does.
    - **Python's suite form** (inline, indented, or empty) is an option on the holder, bound to the `_suite` preference. The empty form reads `[]`. An empty list builds the empty form, absent included where the route has no `emptyContainer` stamp: the step through the suite carries the builder of its grammar slot's empty form (`PortableSlotStep.empty`, stamped where that slot holds a form with nothing in it beside the form the step enters), and both builds build it for an empty list, so `def f():⏎` builds `suite_empty`, the kind it reparses as (the maintainer, 2026-11-21: "Approve the field").
    - **Rust's trait and impl `members`** are what rust's `declaration_list` places: methods, method signatures, constants, type aliases and associated types. A macro invocation (`foo!();`) in that list is a member through `syntactic-metaprogramming`, and an inner attribute (`#![cfg(x)]`) through `attributes`, each adding its kind to the member kind-set. `attributes` adds the inner attribute to the statement kind-set too, for a module and a block, and a `match` arm holds one among its own `attributes`.
    - **Typescript class bodies:** a class body's empty element (`;`) is a fixed token, not a member. `export` inside an interface body is no member: tsc refuses it and no feature adds it, so it stays outside the member kind-set, and typescript's grammar layer refuses it once its interface body narrows to its `_member_declaration` rule. Until then the wide base above admits it.
    - **Python class bodies:** a class-level assignment (`x = 1`, `x: int = 1`, `x: int`) is a statement run when the class is created, and reads as a member through `executable-class-bodies`, as `pass` reads `members: [pass]`. Python holds no `declaration.member.field`.
  - From the statements group's findings (brainstorm's calls, 2026-11-20, each from the rules above):
    - **`if` holds `statements`** beside `condition` and `alternative`, as a loop does, and python's `elif` holds `statements` as `else` does. Rust's `if` also takes the block's `trailingExpression`. A typescript consequence is any statement, so it takes the braces option; python's takes the suite option.
    - **A lambda's block body holds `statements`**, as a function does, and only an expression body keeps `body`. `() => { x(); }` reads `statements: [x()]` and `x => x + 1` reads `body: x + 1`; rust's `|| { g(); 1 }` reads `statements: [g()], trailingExpression: 1`. An input states one form or the other. A rust closure builds the arm the parser reads for its text: a block body with no return type is `closure_expression_expr`, the arm rust's grammar layer declares the default, and only a return type takes `closure_expression_block`. The default makes the low-level `ir.closureExpression(config)` callable, building that arm (the maintainer, 2026-11-22); a return type goes through `.block`.
    - **A struct pattern's two forms are two paths** (the maintainer, 2026-11-22). Rust's `S { a }` reads `pattern.struct` and `S(a)` reads `pattern.struct.tuple`, gated by `tuple-structs` as `declaration.type.struct.tuple` is. So `S {}` and `S()`, which mean different things, each rebuild as themselves, as do `S { .. }` and `S(..)`. `is.pattern.struct` holds for both forms. Python's `class_pattern` stays `pattern.struct`.
    - **Rust's `else` takes the braces option,** bare only for one `if`: `else if c {}` and `else { if c {} }` both read `statements: [if c {}]`, as typescript's `else` does, and a portable build writes `else if c {}` (above, "An `else` whose statements are one `if` builds bare"); an `else` holding anything else builds braced.
    - **Rust's let-else keeps `alternative`,** holding a block value (`expression.block`, which holds `statements` and `trailingExpression` as every rust value block does). It is a value in a declaration's seat, not the declaration's body.
    - **One path, two languages' slots:** `clause.case.match` holds `statements` for python's `case p:` and keeps `body` for rust's `p => expr`. Each slot is gated to its language's feature, so each grammar's composed type has only its own.
    - **A holder read through a container that stands in for others** (rust's `expression_statement_with_semi` in a block's statements): the generated build compiles such a container before any holder reads through it, rather than counting new unfit-slot rows. That also takes rust's `statement.block` off the unfit-slot rows and lowers the ceiling.
    - **An empty body and a missing one stay apart where one kind holds both** (typescript's `_module` holds an optional `statement_block`, where rust splits `mod_item` in two). A slot's route is stamped where a container on the way is optional and the list inside it may be empty, by the same walk that stamps `nonEmpty`. On such a route the read leaves the slot absent when the container is absent and reads `[]` when it is present and empty; both builds make the empty container for `[]` and omit it for `undefined`. So `namespace M {}` reads `statements: []`, `declare module "m";` reads no `statements`, and each builds back to itself. Every other list slot reads and builds as before: an absent list reads `[]`, and a list the grammar requires non-empty inside an optional container omits the container for `[]`. The grammar isn't split; the stamp reaches any route of this shape, in every grammar.
  - **A slot read through a list wrapper takes the hoist's route** (brainstorm's call, 2026-11-19). A holder's capture that reaches through an unclaimed wrapper holding a list, and takes that whole list, names the holder's slot, and the slot's route is the hoist's route through that wrapper: one stored step, the empty wrapper's seat, and the slot in its forms. The capture's name renames the wrapper's field as a direct capture's does (below, "A binding's rename reaches the field"), where every capture through that wrapper gives the same name; a wrapper whose captures name it differently keeps its field, and the hoist names each holder's slot. A claimed block at a holder's seat is not a slot there. Besides the bodies, the rule reaches rust's `bounds` on associated types, lifetime parameters, type parameters and where predicates, and `extends` on traits, read through `trait_bounds`; under the rule below their types don't change.
  - **A list the grammar requires non-empty is non-empty on the portable surface** (the maintainer's rule from the low-level builders, 2026-11-19: "We have a non empty list type c'mon"). A slot's route is stamped `nonEmpty` where its grammar list is `repeat1`, every step to it is required and no container on the way is optional; its read and input are `NonEmptyArray`, and both builds refuse `[]` naming the slot. Python's `match` keeps `repeat` for now (the maintainer, 2026-11-20: "Keep repeat; file the scanner fix", replacing the same day's "Approve the removal"): with `repeat1` the parser refused valid source, a column-0 comment between `match x:` and its first indented `case`, because the external scanner's handling of that comment depends on whether a dedent is valid there. So python's `arms` admits `[]` and `EmptyMatchBlock` stays until the scanner no longer depends on it; then `_match_block` takes `repeat1`, as CPython's `case_block+` does. Generating the paths this reaches counts the inline suite's unplaced compound statements, so python's `portable-emit-unplaced-arm` ceiling rises from 191 to 202, as debt that was always there (the maintainer, 2026-11-19: "Raise to 202, counted debt"); narrowing the inline suite's `statements` comes with the suite option.
  - **A list item's raw arms don't depend on its route** (the maintainer, 2026-11-19: "One rule: items count", replacing the same day's "Accept, in B1's commit", whose narrowing came from routes that never examined a wrapper's items). A raw arm admits a parsed low-level node where the build can't make every form of its kind. The kinds a slot's raw arms are drawn from are the claimed kinds its read reaches, through a container as through a nested route, by the one walk that finds its read paths. So a list read through a wrapper admits its items' raw arms as a nested route does. The ceilings rise to the counts this measures, as debt that was always there and is now counted: per-value raw arms python 2252 → 3059, rust 5667 → 6672, typescript 4375 → 6287.
  - **The raw-arm ratchet counts each kind once** (the maintainer, 2026-11-20: "Once per item kind", once moving typescript's static block and function expression onto `statements` raised the per-slot count by 34 a holder with no new kind gaining a raw arm). Per grammar, the ratchet counts the claimed kinds a raw arm admits, each once however many slots admit it: the debt is a kind the build can't make, and fixing that kind lowers the count at every slot together. Flattening a body onto its holder doesn't move it. The per-slot figure stays in the report and is not gated. The ceilings start at the distinct counts on the change that makes this switch, and only tighten.
  - **A kinds pick reports its limits per slot** (the maintainer, 2026-11-20: "Allow raise, lower rest"). A pick compiles per slot, as a generated switch over the kinds its seat admits, so an owner path whose slot can't place some path no longer fails whole as one unfit-slot row: it generates, and each slot records every path its arm can't place. A path that an arm's kinds test excludes never reaches that arm, so it is not counted as unplaced there. The limits these rows name were already there, inside the whole-path rows: rust `static` names take identifiers only, rust struct-pattern fields under the struct form, typescript's optional-chain call `function` takes primary expressions only, `typeof x<T>` instantiation, `let` as an `if` or loop body, `[a]` as a declaration name. As a one-off exception, the ceilings move in one commit: unplaced-arm rust 7 → 66, typescript 3 → 156, python 202 → 21; unplaced-path typescript 1 → 15; unfit-slot rust 241 → 169, typescript 225 → 122; 748 rows in all become 618. From there they only tighten.
  - **A preset value takes only a kind its slot admits** (the maintainer, 2026-11-20: "Allow +9 with the fix"). The build table made `requiredParameter({ name: this })` and `parameter({ name: self })`, trees the parser can't produce: the bound parser reads a receiver as its own declaration kind, so those slots admit only a pattern. A preset is refused where its slot doesn't admit its kind. The rows this uncovers are honest: closures and constructors declare no receiver, so unplaced-path rises rust 0 → 4 (closure parameters) and typescript 15 → 20 (constructor and construct-signature parameters), 627 rows in all, in the same commit as the fix. Narrowing those slots' inputs so they don't admit a receiver is the source fix, an API change of its own.
  - **A binding's rename reaches the field** (the maintainer, 2026-11-20: "Binding based renames are fine - all bindings should invoke field-level renames - if that happens for the other cases, that's fine too"). Where a binding's capture sits directly on a grammar field, the capture's name renames the field in the grammar and the parser, and the low-level accessor and factory key follow. Typescript's `switch_case` and `switch_default` hold `statements` at both levels (low-level `bodies` until now). Such a rename needs no row of its own; it is listed with the change's public changes. A bare capture whose slot also reads through a nested route under the same field leaves the field's name alone: typescript's `for_statement.body` holds one statement and stays `body` in the parser, while the slot reads `statements` through it.
  - **A slot reads through each form its grammar slot holds, and builds through the form that holds its list** (brainstorm's call, 2026-11-21). Where a holder's slot reaches its contents through more than one form, the slot keeps one route per form. The step that enters a form carries the form's kind ids, and the read refuses a node of another kind there, so it takes the present form's route by kind, not by the keys the form holds (the maintainer, 2026-11-21: "Stamp kinds", over a refusal of forms that keys and co-required routes don't tell apart): python's `with (a):` meets the `as_pattern` step as a `parenthesized_expression` and reads through the bare form. A route's anchor is stamped on the step it applies to, and the walk takes the first, last or only item there before the kinds filter (the maintainer, 2026-11-21: "Approve anchor"): python's docstring is its function's or class's `doc` only as the string that opens its body, so `def f():⏎    "s"` reads `doc: "s"` and `def f():⏎    x = 1⏎    "s"` reads none. The anchored item leaves the statements its holder's `statements` route reads, decided at generation, once the function and class hold `statements` (brainstorm's call), so a docstring is read once. A form holds a list only where the slot's declared arity is a list. A form holding one node beside a form holding a list is read only: typescript's bare one-statement body and rust's `else if` read into `statements` and build through the block form, braced except for an `else` holding one `if`, as the braces option being off the path requires. Forms that each hold a list all build, chosen by what the items fit: rust's `function_item` reads `parameters` through `parameters_elements` and its receiver copy, as it builds today. A list form whose every structure the slot's default form also takes is read only, decided when the table is emitted, so neither build gains a tie-break (python's inline suite builds indented); a list form that overlaps the default only in part, or a slot with no default, stays the build's "builds … through more than one form" refusal, as a counted diagnostic (python's `_suite_class_definition`). A route takes a form out of the slot's own route only when it is a route of the same slot, and through a supertype it opens only the supertypes that hold the form (typescript's bare loop body keeps `declaration` whole): python's docstring capture, read through `suite_block`, leaves the block in every `def`'s `body`. Python's `with_item` `value` no longer also reads an `as_pattern` whole beside the route through it.
- **A path no build can take is not an input** (the maintainer, 2026-11-18: "Fix the cause"). A path with no arms in the grammar's build table is left out of the exact sets, so the map's input types don't admit it. Python's `expression.binary`, `expression.unary`, `expression.binary.logical` and `pattern.complex` are such paths: source reads as one of their sub-paths (`type X = int | str` reads `expression.binary.bitwise.or`), and a build of the family path threw ("does not build in python"). `{ $path: 'expression.binary', … }` is now a type error. Read types narrow with them, as one slot type serves both sides (the maintainer, 2026-11-18: "Narrow reads too"): codegen stamps, per kind that reads as a family path, whether its refinements cover every value of its discriminating token, and a covered kind's read type leaves out the family path. All 13 such paths are covered: python's `element.comparator`, `expression.binary`, `expression.binary.logical`, `expression.unary`, `pattern.complex` and `expression.assignment.compound`; rust's `expression.assignment.compound`, `expression.binary`, `expression.unary` and `pattern.range`; typescript's `expression.assignment.compound`, `expression.unary` and `expression.update`. So python's `a + b` has the read type `expression.binary.arithmetic.add | …` and no longer `expression.binary`, and what a read returns at run time is unchanged. A family path with no arms whose kind is not covered is refused by codegen with a diagnostic, not given a separate input type. Every path that builds is unchanged. Their `portable-emit-unplaced-path` rows go with them, and the ceiling is lowered to the new count. The coverage stamp is per kind, for every family claim, whether or not the family path has arms (the maintainer, 2026-11-20: "Per kind, everywhere"): a kind whose refinements cover every value of its discriminating token, and which no arm of the family path builds, reads only as its refinements, so the family path leaves that kind's read sites and, since one slot type serves both sides, those slots' inputs. Typescript's `lexical_declaration` always reads as `declaration.variable.constant` or `.reassignable`, so bare `declaration.variable` leaves its 18 read sites and the 13 statement slots that admitted a structure no arm there places (unplaced-path 22 → 9 with the module move). Rust's `range_expression_binary` always reads as a refinement of `expression.range`, so its slots no longer take bare `expression.range` as input; `expression.range.exclusive` builds the same `a..b`, and the root `expression.range` build stays, since that path's arms build there.

## Diagnostics and the MVP sets

Generation reports, by name:

| diagnostic | cause |
|---|---|
| `portable-emit-unplaced-path` | a path in a slot's type with no arm that fits the slot's seats (decision 1) |
| `portable-emit-unfit-slot` | a slot route the emitter doesn't compile (several steps, a mounted step, a template-spelled slot, a sole-item delimiter) |
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
| `@sittir/types/vocabulary` | `Unmapped` | changed: in an input, a slot's node arm is `G['nodes'][P]` |
| `@sittir/types` | `PortableBuildArm`, `PortableSlotStep` | changed (the maintainer, 2026-11-21: "Stamp kinds", asked with both): `PortableBuildArm.readOnly` marks a form the slot reads and never builds, and `PortableSlotStep.kinds` holds the kind ids of the form a step enters |
| `@sittir/types` | `PortableSlotStep` | changed (the maintainer, 2026-11-21: "Approve anchor"): `anchor?: StepAnchor`, the bindings' anchor of the route at that step |
| `@sittir/types` | `PortableSlotStep`, `PortableBuildArm` | changed (the maintainer, 2026-11-21: "Approve the field", "Remove now, own commit"): `PortableSlotStep.empty?: string`, the builder of the empty form of the step's grammar slot; `PortableBuildArm.empty` removed, as nothing reads it once an absent unstamped list builds as `[]` |
| `@sittir/common/portable/utils` | `entriesHolding`, `PlanItems` | added (the maintainer, 2026-11-18): the classifier's selection of the entries a node holds, shared with codegen's coverage stamp so the two cannot disagree |
| `@sittir/types/vocabulary` | `GrammarMap`, `Contract` | changed (the maintainer, 2026-11-19: "Approve"): gain `facts`, each path's facts and the union of their stamped spelling texts, which type `$at?` on that path's inputs, reads and slot items |
| `@sittir/codegen` | `mapFactsOf`, `MapFacts` | added (the maintainer, 2026-11-19: "Approve"): the one derivation of a path's facts that the map, the types and the generated build read |
| `@sittir/common` (internal) | `spellingOf`, `PortableBuildContext.spellingOf` | removed (the maintainer, 2026-11-19: "Ride this PR"): the interpreter reads a spelling's text from the stamp on the table |
| generated `<lang>/src/portable/build.ts` | `placeOf` removed; refusal `unset` added | changed (the maintainer, 2026-11-19: "Approve"): an `$at` naming a fact its arm doesn't set refuses, as the interpreter does |
| generated `<lang>/src/portable/build.ts` | `build` (the table) | replaced: `portableBuild`, a table of functions a caller scopes with `scopeBuilders(engine, portableBuild)` |
| generated `<lang>/src/portable/project.ts` | `project` | added |
| generated `<lang>/src/portable/index.ts` | `rows` | removed |
| generated `<lang>` descriptor | `portable: rows`, `portableBuild` | changed: the descriptor's portable entry is `{ build: portableBuild, project }` |

## The portable-grammar-map plan

- Its Tasks 1–5 stand. Their grammar map, `InputOf`, `ReadOf`, overrides and token texts are what the generated signatures use.
- Its Task 6 (typing `PortableRuntime.read` and `build`) is superseded: the generated functions carry the types, and `PortableRuntime` goes. Its honest-read items (typescript `identifier.qualified`) move to this work's projection task.
- Its Task 7: `PortableEngine<C>` is the generated engine's type over a composition.
- Its Task 8 is unchanged. A language feature's builders generate into its grammar package.
- Its Task 9's gates swap the conformance mirror and its ratchet for the generated modules' own type-check, with the emit diagnostics above counted at today's ceilings.
