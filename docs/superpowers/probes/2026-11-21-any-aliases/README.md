# Any as what lies beneath a path: aliases and AnyWith

A proposal, before any spec text, for the maintainer's ruling at the top of the bindings and vocabulary spec: `V.X.Any<G>` is what lies beneath the path in `G`'s language, a kind from elsewhere that a namespace admits at every one of its slots lies beneath it as an alias path, and a slot that admits more takes an `AnyWith…` union. It answers four questions: how a language's additions come in, how `Any<G>` is typed per composition, the census under the new model, and what lies beneath `declaration.member`.

Measured on the body branch `feat/portable-body-contents` at 6aeb39c82, after the member and type nesting. Every cell comes from a script or a type test in this folder unless it says "not checked".

## In brief

1. **An alias is declared like a kind, and a language has the aliases of what it composes.** The base or a feature folder declares an alias path as a type alias in the namespace's stub. It has one owner. Types and guards both derive from the composition, so they agree by construction, and features stay the one adder except at the rows in §1.3.
2. **`Any<G>` is the kinds beneath the path, ungated (levels stay whole), the base's aliases, ungated, and each feature's aliases gated on their owner.** A refinement that narrows a slot to a feature's alias gates the narrowing on that alias's owner. The type test shows both, for every `G`.
3. **Universal aliases:** identifier and literal beneath expression and pattern, identifier beneath type, declaration and expression beneath statement, and, proposed, member and subscript beneath pattern.
4. **Language aliases:** 24 alias paths, owned by 12 features (§3.2).
5. **AnyWith:** 8 named unions over 44 slots (§3.3); 19 slots keep a union particular to their construct (§3.4); 6 findings (§3.5).
6. **`Member.Any`:** the member kinds, nested types (java, C#), type aliases (rust's associated types), constants (rust, python), and rust's macro calls and inner attributes. Python's class body takes an AnyWith (recommended) or makes every statement an alias (§4).

## 1. Mechanism

### 1.1 How an alias is written

An alias is a type alias in a namespace's stub, in the base or in the folder of the feature that owns it. The generator reads it as an alias path, beneath the namespace, to the path of the interface it names.

| | rust's `if` beneath expression |
| --- | --- |
| stub, `features/rust-expressions/expression.ts` | `export namespace Expression { export type If<G extends GrammarMap> = V.Statement.If<G>; }` |
| generated, `augment.ts` | `type If<G extends GrammarMap> = gate.In<G, features.RustExpressions, V.Statement.If<G>>;` and `If<G>` joins `Expression.Any<G>` |
| path list | `vocabularyAliases`: `['expression.if', 'statement.if', 'rust-expressions']` (not built) |
| source | `let x = if c { 1 } else { 2 };` (rust), `if (c) {}` (typescript) |
| read | rust: `is.expression(node)` true, `is.statement.if(node)` true. typescript: `is.expression(node)` false (not built; follows from the stamp) |

- **The alias path is the namespace and the target's last segment:** `expression.if` → `statement.if`. In rust it is also the grammar's own name for the node, `if_expression`, and likewise for `loop_expression`, `match_expression`, `break_expression`, `continue_expression` and `return_expression` (read from rust's grammar; not checked beyond these). A path that is already a kind or a namespace is a generator diagnostic. One does collide: `expression.block` is a kind, refined by rust's async, const, generator, try and unsafe blocks (question 2).
- **An alias covers its target and what lies beneath it, as the language has it.** In the types it is one name: `export import Identifier = V.Identifier` inside a namespace is refused under the repo's `verbatimModuleSyntax` (TS1269, TS1288 and TS1380 from tsrs), so nested names under an alias (`V.Expression.Loop.While<G>`) are not proposed. The namespace's `Any` takes the target's `Any`.
- **Runtime (not built).** The path list gains `vocabularyAliases` (alias path, target, owner). Each grammar's portable module stamps the aliases its composition holds. `is.expression` holds for a node read beneath `expression`, or beneath the target of an alias the language holds. The portable trees give an alias its own node, with the target's `$path` and the alias's identity, so `ofType(kinds.expression.if)` selects nothing in typescript.
- **Checks (not built).** Per language, the inventory lists (a) each kind from elsewhere in the language's rule for a kind-set that no held alias covers, and (b) each held alias the rule doesn't admit, which the map narrows.

### 1.2 Why composition, not the grammar

The alternative is to read each language's aliases from its grammar's rule for the kind-set (`_expression`, `_pattern`, …), the census in `results/rules.txt`. That keeps aliases exact per grammar, but nothing in `G` names them for an arbitrary map. So no refinement could narrow to one and still check for every `G`, and the guard and the type would come from two sources. Composition gives one source and a gate the type test shows works (§2). The rule census becomes the inventory's check (b) above.

### 1.3 Where features don't fit

| # | alias | languages whose rule admits it (`results/rules.txt`) | owner | fits? |
| --- | --- | --- | --- | --- |
| 1 | `pattern.member`, `pattern.subscript` → `expression.member`, `expression.subscript` | typescript (`pattern` holds `lhs_expression`), python (`pattern` holds `attribute`, `subscript`) | none | **No.** All three languages have destructuring assignment. Rust's grammar parses the target as an expression, the other two as a pattern. No atom is held by exactly typescript and python. Proposed: a base alias that rust narrows, like literal beneath pattern, which typescript narrows (question 3) |
| 2 | `pattern.literal` → `literal` | rust (`_pattern`); python only in case patterns, a separate rule; typescript only `undefined` | base, per the ruling | Fits with narrowing: typescript and python's target slots narrow it. Alternative owner `match-expressions` (rust, python) (question 4) |
| 3 | `declaration.member.type` → `declaration.type` | java, C# (not checked: no grammar) | new atom `nested-types` | Fits by cutting an atom by holder set (spec §4.1). Rust's impls and traits hold only type aliases (§4); typescript composes neither |
| 4 | `expression.rest` → `pattern.rest` (python's `*x`) | python (`primary_expression` holds it) | `python-destructuring` | Fits. The alternative is narrowing python's grammar: `a + *b` parses, so the alias admits what python refuses. That is the rule library's |
| 5 | `type.removed` → `clause.bounds.removed` (rust's `?Sized`) | rust (`_type` holds `removed_trait_bound`) | `where-clauses` | Fits, but `?Sized` means something only in bounds. Recommended: narrow rust's `_type` and let `AnyWithBounds` hold it |
| 6 | python's class body: every statement | python | `executable-class-bodies` (not in the vocabulary yet) | A choice between an alias and an AnyWith (§4, question 1) |

## 2. Typing

```ts
type Any<G extends GrammarMap> =
	| V.Expression<G> | V.Expression.Call<G> | …                           // kinds beneath: ungated
	| V.Identifier.Any<G> | V.Literal.Any<G>                              // base aliases: ungated
	| gate.In<G, features.RustExpressions, V.Statement.If<G> | …>         // feature aliases: gated on their owner
	| gate.In<G, features.PythonDestructuring, V.Pattern.Rest<G>>;
```

`any.test-d.mts` (tsrs 0.20.1; passes on the body branch at 6aeb39c82 and on master at 4fe1ff192, `results/typing.txt`):

| check | result |
| --- | --- |
| rust's contract: `Any` holds `statement.if` | `Equal` to `V.Statement.If<Rust>` |
| typescript's and python's contracts: `Any` holds no `statement.if` | `Equal` to `never` |
| typescript's contract: `Any` holds `identifier` | `Equal` to `V.Identifier<TypeScript>` |
| a typescript `if` assigned to typescript's `Any` | refused |
| `V.Statement.If<Rust \| TypeScript>` assigned to `Any<Rust \| TypeScript>` | accepted: the gate distributes over a union of maps |
| a refinement narrows the slot to a kind beneath the path | compiles for every `G` |
| … to a base alias (`V.Identifier<G> \| V.Literal.String<G>`) | compiles for every `G` |
| … to a feature's alias, ungated (`V.Statement.Block<G>`) | TS2430 |
| … to a feature's alias gated on its owner | compiles for every `G` |
| … gated on a feature the owner extends (`RustExpressions` for a `ValuedBlocks` alias) | TS2430 |

**What has to give:** a narrowing to a feature's alias belongs to that feature. It is declared gated on the alias's owner exactly, as a gated member is gated along its inheritance line (spec §4.4). Levels stay whole: the kinds beneath a path stay ungated, so every narrowing the vocabulary has today still checks.
- `Fits` refuses a map that places a feature's alias its composition lacks: the default is read over the contract of the map's features, and `PathOf<Missing<F>>` is `never` (read from `map.ts`; not run).
- Not checked: whether any refinement in today's vocabulary narrows a slot to an alias the proposal gates. The regenerated `augment.ts` would report it as TS2430.

## 3. Census

`rules.cjs` reads each grammar's rule for a kind-set (node-types supertypes, through envelopes) and the path each member reads as (`PortableIds`): `results/rules.txt`. `replan.cjs` reads every slot each language's map overrides, finds the vocabulary slot that declares it, and picks the narrowest namespace whose kinds and proposed aliases cover what the three maps read there: `results/replan.txt`. Of 497 slots some map reads, 430 take one namespace's `Any` and 67 need more.

### 3.1 Base arms that become universal aliases

| namespace | alias | rust | typescript | python | owner |
| --- | --- | --- | --- | --- | --- |
| expression | `expression.identifier`, `expression.literal` | rule | rule | rule | base |
| pattern | `pattern.identifier` | rule | rule (via `lhs_expression`) | rule | base |
| pattern | `pattern.literal` | rule | `undefined` only | case patterns only | base, per the ruling (question 4) |
| pattern | `pattern.member`, `pattern.subscript` | no: an assignment target is an expression | rule | rule | base, proposed (question 3) |
| type | `type.identifier` | rule | rule | no rule: a type position holds an expression | base |
| statement | `statement.declaration`, `statement.expression` | rule | rule | rule (expression through `simple_statements`) | base |

The spec's other base arm, "the expression kind-set" beneath pattern, does not survive: rust's patterns admit no expressions, and typescript and python's admit member and subscript only.

### 3.2 Language additions

| alias | target | language | owner |
| --- | --- | --- | --- |
| `expression.if`, `.loop`, `.match`, `.break`, `.continue`, `.return` | `statement.if`, … (`statement.loop` with `for_each` and `while`) | rust | `rust-expressions` |
| `expression.block` | `statement.block` | rust | `rust-expressions`; collides (question 2) |
| `expression.rest` | `pattern.rest` | python | `python-destructuring` |
| `pattern.const` | `expression.block.const` | rust | `compile-time-evaluation` |
| `pattern.macro`, `type.macro`, `declaration.member.macro` | `expression.call.macro` | rust | `syntactic-metaprogramming` |
| `pattern.non_null` | `expression.cast.non_null` | typescript | `non-null-assertions` |
| `type.expression` | `expression` | python | `python-type-forms` |
| `type.removed` | `clause.bounds.removed` | rust | `where-clauses`, or narrow `_type` (§1.3, row 5) |
| `statement.attribute`, `declaration.member.attribute` | `attribute` | rust (inner attributes) | `attributes` |
| `declaration.parameter.identifier`, `.rest`, `.tuple` | `identifier`, `pattern.rest`, `pattern.tuple` | python | `python-declarations` |
| `declaration.member.type`, `.type_alias`, `.constant` | see §4 | | |

The statement kind-set takes the macro call through `statement.expression`, so it needs no alias of its own.

### 3.3 AnyWith

Proposed rule: an AnyWith is named `V.<Namespace>.AnyWith<Extra>`, declared by the owner of its extra arm, ungated like a level, and only when two or more slots share it. A union only one slot uses stays spelled at that slot.

| type | union | slots | read by |
| --- | --- | --- | --- |
| `V.Expression.AnyWithLet<G>` | `Expression.Any \| Clause.Let.Any` | `statement.if.condition`, `statement.loop.while.condition`, `clause.case.match.guard`, `clause.let.chain.left`, `.rights` (5) | rust |
| `V.Expression.AnyWithArgument<G>` | `Expression.Any \| Argument.Any \| Element.Spread.Any` | `expression.call.arguments`, `.member.arguments`, `.qualified.arguments`, `.construct.arguments`, `attribute.call.arguments`, `declaration.type.class.bases` (6) | all three |
| `V.Expression.AnyWithSpread<G>` | `Expression.Any \| Element.Spread.Any \| Element.Attributed` | `expression.collection.list.elements`, `.set.elements`, `.tuple.elements` (3) | all three |
| `V.Pattern.AnyWithExpression<G>` | `Pattern.Any \| Expression.Any` | `expression.assignment.left`, `expression.assignment.compound.left`, `clause.catch.name` (3) | rust reads expressions at both assignment targets, typescript and python patterns; typescript reads a pattern at a catch name, python an expression |
| `V.Type.AnyWithBounds<G>` | `Type.Any \| Clause.Bounds.Any` | `clause.where.predicate.bounds`, `.left`, `declaration.type_parameter.bounds`, `declaration.type.interface.trait.extends`, `declaration.type.type_alias.associated.bounds`, `element.type_argument.bounds`, `type.dynamic.trait`, `type.bounded.left`, `.right` (9) | rust |
| `V.Type.AnyWithTypeArgument<G>` | `Type.Any \| Element.TypeArgument` and rust's const arguments | `expression.call.typeArguments`, `.member.typeArguments`, `expression.instantiation.typeArguments`, `type.generic.typeArguments`, `element.type_argument.argument` (5) | rust |
| `V.Declaration.Parameter.AnyWithType<G>` | `Declaration.Parameter.Any \| Type.Any` | `declaration.function.parameters`, `.signature.parameters`, `declaration.member.method.parameters`, `.signature.parameters`, `type.function.parameters` (5) | rust (a parameter list admits a bare type) |
| `V.Attribute.AnyWithExpression<G>` | `Attribute.Any \| Expression.Any` | the decorator slots: `declaration.member.{constructor,field,method,property}.decorators`, `declaration.parameter.decorators`, `declaration.type.class.decorators`, `expression.class.decorators`, `statement.export.decorators` (8) | typescript reads attribute kinds, python expressions. Not checked: whether python's decorator should be claimed as an attribute kind instead, which would make these `V.Attribute.Any<G>` |

### 3.4 Unions spelled at the slot

These sets are particular to their construct, as the spec already allows. Rust's macro token trees: `attribute.input`, `element.macro.token_tree.tokens`, `element.macro.token_repetition.tokens`, `element.macro.token_repetition.pattern.tokenPatterns`. Import trees: `clause.import.list.useClauses`, `statement.import.argument`, `statement.import.from.moduleName`, `statement.import.names`, `statement.import.fromClause`. Typescript's decorator chains: `attribute.call.function`, `attribute.member.object`, `attribute.parenthesized.expression`. Typescript's type-level pieces: `type.query.expression`, `type.template.elements`, `type.tuple.tupleTypeMembers`. Typescript's object literal: `expression.collection.object.properties`. Typescript's single-identifier arrow parameter: `expression.lambda.parameters`. Typescript's export and ambient bodies: §3.6, item 2.

### 3.5 Findings

1. Python reads a bare tuple on the right of `=` as `pattern.tuple.bare`, at `declaration.constant.value`, `declaration.variable.value`, `expression.assignment.compound.right` and `expression.interpolation.expression`. It looks like a claim that should read `expression.collection.tuple.bare` (not checked).
2. Rust's `pattern.tuple.elements` reads `expression.lambda`: upstream's `tuple_pattern` admits a closure. It accepts invalid input; the fix is a grammar narrowing.
3. Typescript's `declaration.type_parameter.default` reads `clause.default` (not checked).
4. Rust's trait and impl bodies read the whole declaration level and `use`, because the grammar reuses `_declaration_statement`. The member slots can take `V.Declaration.Member.Any<G>` only after rust's `_member_declaration` narrows them to what rustc accepts (spec §4.5); before that, rust's map misfits.
5. Typescript's interface body reads `export =` (`statement.export`) (not checked).
6. `Declaration.Module`, an arm of 62 expression slots, is read there by no map, so it drops.

### 3.6 The held slot fixes, replanned

1. **The 63 expression positions naming `Statement.Any`**: 59 distinct slots on the body branch. 46 become `V.Expression.Any<G>`, since rust's block-like statements now arrive through the `rust-expressions` aliases. 13 take an AnyWith for reasons unrelated to statements: let, arguments, spreads, assignment targets and the macro input.
2. **Typescript's `statement.export.declaration` and `declaration.ambient.body`.** Both read typescript's `declaration` rule, which also holds `import x = …` (`statement.import.alias`). `ambient.body` adds `declare global { }` (`statement.block`) and `declare module.x: T` (`declaration.module_property`). Proposed: `export.declaration` is `V.Declaration.Any<G> | V.Statement.Import.Alias<G>`, and `ambient.body` adds the other two, each spelled at its slot. The alternative is an alias `declaration.alias` owned by `javascript-modules`.
3. **The assignment targets.** With member and subscript beneath pattern, `statement.loop.for_each.left`, `clause.comprehension.for.left`, `pattern.assignment.left` and `pattern.object.assignment.left` take `V.Pattern.Any<G>`. `expression.assignment.left` and `expression.assignment.compound.left` take `V.Pattern.AnyWithExpression<G>`: rust's left side is an expression. Each map's override narrows it: `RustMap`, `TypeScriptMap` and `PythonMap` at `overrides['expression.assignment'].left` and `overrides['expression.assignment.compound'].left`.
4. **The 9 parameter slots,** the slot declarations that name `Pattern.Any` without `Expression.Any`. They no longer widen, since `Pattern.Any` no longer means the expression kind-set. The parameter lists take `V.Declaration.Parameter.Any<G>`, with python's aliases, or `AnyWithType` for rust's five. `pattern.object.properties`, `pattern.object.assignment.left` and `declaration.variable.pattern.name` take `V.Pattern.Any<G>`.

## 4. `Member.Any`

Beneath `declaration.member` on the body branch: `constructor`, `enum_member` (`struct`, `tuple`), `field` (`signature`), `method` (`signature`, `signature.abstract`, `special`), `property` (`getter`, `setter`, `signature` and its getters and setters), `signature` (`call`, `construct`, `index`, `index.mapped`), and `static_block`.

| alias | target | rust | typescript | python | java, C# (not checked) | owner |
| --- | --- | --- | --- | --- | --- | --- |
| `declaration.member.type` | `declaration.type` | no: rustc refuses a struct in an impl | no | yes, through the class body | yes | new atom `nested-types` |
| `declaration.member.type_alias` | `declaration.type.type_alias` | yes: an associated type, narrowed to `.associated` | no | through the class body | | `associated-types` |
| `declaration.member.constant` | `declaration.constant` | yes: `const` in a trait or impl | no: the closure holds no `constants` | yes: class-level constants | C# `const` | `constants` |
| `declaration.member.macro` | `expression.call.macro` | yes | no | no | no | `syntactic-metaprogramming` |
| `declaration.member.attribute` | `attribute` | yes: inner attributes | no | no | no | `attributes` |

What each map reads at its member slots today (`replan.cjs` over the maps):
- Rust's trait and impl bodies: the whole declaration level, `use` and the above. That accepts invalid input until `_member_declaration` narrows it (§3.5, item 4).
- Typescript's class body: only member kinds. Its interface body: member kinds and `export =`.
- Python's class body: every statement and expression.

Python's class body is the one choice. Its class body is a block, so it holds every statement and expression.
- (a) **AnyWith, recommended:** `declaration.type.class.members` takes `V.Declaration.Member.AnyWithStatement<G>`, owned by `executable-class-bodies`. Python's `Member.Any` holds methods, the constructor, nested classes and constants.
- (b) **Alias:** `executable-class-bodies` owns `declaration.member.statement` → `statement`, by the letter of the ruling, since the class body is python's only member slot.

An alias goes by kind, not position. Under (b), `is.declaration.member(node)` holds for every python statement and expression, a module-level `print(1)` included. Under (a), `is.declaration.member` holds for a method and not for `print(1)`. With a single member slot, "admitted at every slot" cannot tell what the namespace holds from what that one slot holds, which is why (a) is recommended.

| source (python) | (a) AnyWith | (b) alias |
| --- | --- | --- |
| `class A:\n  def m(self): pass` | `is.declaration.member(m)` true | true |
| `class A:\n  print(1)` | `print(1)` in `members`; `is.declaration.member` false | true |
| `print(1)` at module level | false | true |

(Expected, not built.)

## 5. Open questions

1. Python's class body: (a) `V.Declaration.Member.AnyWithStatement<G>` (recommended) or (b) an alias for every statement.
2. The `expression.block` collision: (a) rust's async, const, generator, try and unsafe blocks move beneath `statement.block`, and `expression.block` becomes the alias, recommended because they are blocks with a modifier; or (b) the alias takes another segment.
3. Member and subscript beneath pattern: (a) a base alias that rust narrows (recommended: they reach 12 typescript and python pattern slots); or (b) an AnyWith at those 12 slots.
4. Literal beneath pattern: (a) the base, per the ruling, with typescript and python's target slots narrowing it; or (b) owned by `match-expressions`.
5. Rust's associated type: (a) the alias `declaration.member.type_alias` owned by `associated-types` (recommended); or (b) the kind moves beneath `declaration.member`, as rust's `fn` in an impl became a method.
6. AnyWith naming as §3.3 proposes: `V.<Namespace>.AnyWith<Extra>`, shared unions only.

## Run

From the root of a body-branch checkout, with the slot-kind-sets probe's `slots.cjs`:

```bash
out=$(mktemp -d)
probe=docs/superpowers/probes/2026-11-21-any-aliases
node docs/superpowers/probes/2026-11-21-slot-kind-sets/slots.cjs packages/types/src/vocabulary $out/slots.json
node $probe/rules.cjs . $out/rules.json > $out/rules.txt
node $probe/replan.cjs . $out/slots.json $out/replan.json > $out/replan.txt
node_modules/.bin/tsrs -p $probe/tsconfig.json
```

The probe sits on master; copy the folder into a body-branch checkout to run it there. The type test resolves the vocabulary from the checkout it sits in.
