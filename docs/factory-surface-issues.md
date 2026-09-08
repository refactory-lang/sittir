# Factory surface — open issues

Measured state of the two construction surfaces, per grammar. Supersedes the
class-A/B/C/D grouping in the 2026-08-25 dogfood gap worklist, most of whose
rows were calling mistakes rather than surface limits.

**The two surfaces.** The *strict* surface is the factory layer: `ir.<kind>.strict(…)`
and `ir.<kind>.<form>.strict(…)`, every node spelled explicitly. The *loose*
surface is the coercion layer: `ir.<kind>(…)` and `ir.<kind>.<form>(…)`, which
resolves plain objects, strings and arrays into nodes before calling the
factory. A shape that fails on one and works on the other tells you which layer
owns the defect.

**How each row was verified.** By probing the exact input the issue names, after
reading the kind's generated factory signature in
`packages/<lang>/src/factories/raw.ts`. A failure diagnosed without reading that
signature is not evidence — see [Reading a failure](#reading-a-failure).

---

## Strict surface

### S1 — A list envelope given a config object fails in the native transport, not at the factory

**Accepted, same class as X1; the runtime message is the only defect.** An
envelope whose one slot is a separated list takes the list's own calling
convention, `(...elements)` / `(options, ...elements)`, or the built list
itself. Spelling the slot as a config key is the wrong shape, and the typed
surface says so at the call site:

```ts
ir.enumBody.strict(ir.identifier('A'), ir.identifier('B'))          // → "{\n    A,\n    B,\n}"
ir.enumBody.strict(ir.enumBodyElements.strict(a, b))                 // → same
ir.enumBody.strict({ enumBodyElements: ir.enumBodyElements.strict(a, b) })
// error TS2769: No overload matches this call.
```

Only a call that bypasses the types (`ir.enumBody as any`, a probe script)
reaches the runtime, and there the wrong shape is not refused where it is
made: the factory's `...args` dispatch sees one object argument without a
`$type`, treats it as the first element, and stores the config object in the
list's `_content`. Nothing checks the element shape until the render
transport reads `$type` from it, so the failure surfaces as

```
$type property missing in EnumBodyElementsContentTransportSlot
  on EnumBodyElementsTransport._content on EnumBodyTransport._enum_body_elements
```

rather than as a factory-side rejection naming the argument. If that message
is ever worth improving, the place is the list factory's dispatch, which
already probes the first argument for the options-bag shape and could refuse
an object that is neither an options bag nor a node by name, before storage.
Reference: `packages/typescript/src/factories/raw.ts::buildEnumBody`.

---

### S2 — A no-argument form call is rejected

Generated: `ir.visibilityModifier.pub.strict()`, `ir.parameters.strict()`, python `ir.expressionStatement.strict()` (5 sites), typescript line 225.
Error: `TS2554: Expected 1 arguments, but got 0.`
A forwarded or direct form whose slot is empty in the source has no spelling on the strict surface; the coercing surface takes `()`.

### S3 — A statement slot takes only the hidden statement wrappers

Generated: `ir.block.strict({ statements: [ir.letDeclaration.strict({ … })] })`; typescript `ir.program.strict({ statements: [ir.importStatement.strict(…)] })`.
Error: `TS2322: Type 'Built' is not assignable to type 'ExpressionStatement | DeclarationStatement | KindEnum<";", TSKindId.Semi>'` (typescript: `'Statement | KindEnum<";", TSKindId.Semi>'`).
The slot's union names the hidden `_declaration_statement` / `_statement` wrappers, which have no builder of their own, so a concrete item cannot be seated where the grammar seats it.

### S4 — The validators' config vocabulary is not the strict config's — RESOLVED

Two causes, both in `nodeToConfig`. The read stores an unnamed slot under the child's kind (`_parameter`, `_impl_item_body`); the factory map now stamps those spellings as the slot's `wireKeys` (the set the wrap accepts) and the projection resolves a read key to its slot through them. And the projection stamped a `$variant` and promoted a "variant child's" surface into the parent whenever a child kind appeared in some polymorph's map, which projected a `declaration_list` under an impl body as `foreignModItem.body`; no generated code reads `$variant` (polymorphs were retired into transforms), so the inference and its promotion are gone. `ir.implItem.strict({ traitClause: ir.implItem.positiveClause.strict(…), content: ir.implItem.body.strict(ir.declarationList.strict(…)) })` now prints as the hand-written strict example spells it.

### S5 — An attributed single-slot wrapper projects to `{}` — RESOLVED

Resolved with S4's slot keys: `ir.attributedParameter.strict({ content: ir.selfParameter.strict({ reference: true }) })` now prints, as do the argument, type-argument and import wrappers.

### S6 — Verbatim text in an expression or pattern position has no leaf to wrap

Generated: typescript `"boundary"` where `ObjectAssignmentPattern | PairPattern | RestPattern | ShorthandPropertyIdentifierPattern` is expected, `"0"` and `"offset"` in `arguments`, python `Argument of type 'string' is not assignable to parameter of type 'Identifier'`.
The read stores text for aliased leaves (`shorthand_property_identifier_pattern`, `number`) and the slot lists no pattern kind the emitter can pick, so the text is printed bare.

### S7 — A layout keyword arrives as a kind id where a presence flag is expected

Generated: typescript `TSKindId.AutomaticSemicolon` for a statement terminator slot.
Error: `TS2322: Type 'TSKindId.AutomaticSemicolon' is not assignable to type 'BooleanKeyword<"\n"> | undefined'`.

### S9 — A config-shaped parent does not build its hoisted group from a config

Generated (the intended spelling): typescript `ir.forInStatement.strict({ content: { kind: TSKindId.Const, left: ir.identifier("item") }, … })`, python `ir.comparisonOperator.strict({ left, comparators: [{ operators: TSKindId.EqEq, primaryExpression: … }] })`.
Error: `TS2322: Type 'TSKindId' is not assignable to type '() => number'` (the slot's type is the group's Built shape, accessor methods included); at render: `Missing field \`_operators\` on ComparisonOperatorTransport._comparators`, `$type property missing in ExportStatementContentTransportSlot`.
A group has a visible alias and its builder exists in the generated factories (`buildForHeaderLetConstKind`, `buildComparisonOperatorComparator`), but it is not on `ir`, and only a forwarded parent builds it from a config (`buildMatchBlock` accepts `MatchBlockArms.Config`). A config-shaped parent passes the slot value through untouched (`const _content = config.content;`) and its Config demands the group's Built. The parent's Config should accept the group's Config in that slot and the factory should call the group's builder, as the forwarded case already does. Rust's render still throws `seated is not iterable` on a list slot handed one node.

### S8 — Form names the read data reaches are not on `ir`

Generated: python `ir.assignment.eq.strict(…)`, `ir.comparisonOperatorComparator(…)`; typescript `TSKindId.<Member>` where `ImportClause | …` is expected.
Error: `TS2339: Property 'eq' does not exist on type …`; at render: `Cannot read properties of undefined (reading 'strict')`; typescript at render: `unknown kind id 390 in StatementTransport on ProgramTransport._statements`.

### S10 — A rust boolean literal has no constructor

Wanted: `ir.statement.let({ pattern: 'a', value: true })`, or any spelling
that names `true` / `false` where an expression is expected.
Error: `TS2322: Type 'true' is not assignable to type 'string | number | ArrayExpression | …'`; and there is no `boolean`,
`true` or `false` entry on `ir` at all — the rust grammar's boolean literal is a
token choice, so no kind survives for a caller to name. Every other literal
has one (`integerLiteral`, `floatLiteral`, `charLiteral`, `stringLiteral`).

### S11 — Two arm slots cannot both be named in one call

Wanted: python `except a, b:` with a block suite, which needs the exception's
`list` arm and the suite's `block` arm at once.
Error: `ir surface: except_clause seats two arms in one config (exception.list, block); no spelling calls both`.
Each arm is emitted as its own route wrapping the parent, so a caller picks
one. A kind with two arm-seated slots has no route that applies both. The
routes would have to compose, each returning a surface that still offers the
others.

## Loose surface

### L1 — The stamped kind enum is rejected as a `kind:` discriminant

A discriminated config accepts the raw grammar string but not the numeric enum
the package exports for the purpose.

```ts
ir.matchArm({ pattern: { pattern: { kind: 'struct_pattern', … } } })       // → "T{a}=>{}"
ir.matchArm({ pattern: { pattern: { kind: TSKindId.StructPattern, … } } }) // rejected
```

`TSKindId.StructPattern` is `305`; the resolver matches on names only, so every
config re-spells a name the enum already holds.

Affects rust; the same resolver is shared, so typescript and python are
expected to behave alike (unverified).

### L2 — List options are honoured only in first argument position

The variadic signature admits the options object anywhere, the runtime reads it
only first.

```ts
ir.enumVariantList.strict({ delimiter: Delimiter.Trailing }, variantA)  // → "{A,}"
ir.enumVariantList.strict(variantA, { delimiter: Delimiter.Trailing })  // throws
```

In last position the object is treated as an element and the transport rejects
it (`Missing field _name`). It is also an internal inconsistency: 45 list
builders emit an overload pinning options to the first parameter, 16 emit the
permissive one. Conforming the 16 to the majority shape fixes both halves.

Affects rust, typescript, python.

### L3 — A two-branch list slot takes no array

Where a slot accepts either of two list kinds, the coercer resolves neither from
an array; the list node must be built explicitly.

```ts
ir.enumVariant({ name: 'V', body: [ir.fieldDeclaration({ … })] })              // rejected
ir.enumVariant({ name: 'V', body: ir.fieldDeclarationList.strict(…) })         // → "V{a:u32}"
```

Affects rust (`enum_variant.body`: `field_declaration_list |
ordered_field_declaration_list`).

### L4 — A single-slot wrapper must be spelled by hand

Where a slot holds a wrapper whose own required slot has the same name, the
coercer takes no bare inner value.

```ts
ir.matchArm({ pattern: { kind: 'struct_pattern', … } })              // rejected
ir.matchArm({ pattern: { pattern: { kind: 'struct_pattern', … } } }) // → "T{a}=>{}"
```

Affects rust (`match_arm.pattern` → `match_pattern`).

### L5 — Whole-alternative arms need their form named

A kind whose rule is a choice of complete alternatives cannot be built from the
bare kind; the arm's form has to be named, even on the loose surface.

```ts
ir.callExpression({ function: 'f', arguments: ir.arguments.strict() })      // rejected
ir.callExpression.call({ function: 'f', arguments: ir.arguments.strict() }) // → "f()"
```

Whether this is a defect or the intended surface is open — the forms exist and
are reachable, so it may be a documentation matter rather than a gap.

Affects typescript (`call_expression`, `variable_declarator`, `import_statement`,
`export_statement`).

---

## Both surfaces

### X1 — An unrecognised config key is dropped in silence

**Accepted; not a defect to fix.** The check that matters fires where nodes are
actually constructed — at the call site, on the object literal — and it names
the real slots:

```ts
ir.attribute.strict({ path, arguments: tokenTree })
// error TS2353: 'arguments' does not exist in type
//   '{ readonly input?: AttributeInput; readonly path: … }'
```

Construction at the site is the surface's normal shape, so a caller writing a
config inline is told immediately, by name, what the slot really is.

Two things follow, and both are worth stating because the earlier inventory got
them wrong.

**The silent drop is only reachable when types are bypassed.** Every false
finding this issue caused was probed through `ir as any`; none would have
survived a typed call. It was filed as a product defect and is not one.

**The by-reference hole is known and accepted.** Excess-property checking
applies only to fresh literals, so a config built separately and passed by
reference — or spread — is structurally assignable and its extra key is dropped
at runtime:

```ts
const cfg = { path, arguments: tokenTree };
ir.attribute.strict(cfg);        // accepted, `arguments` dropped
ir.attribute.strict({ ...cfg }); // spread defeats freshness
```

An exact-type encoding closes this — `type Exact<T, C> = C &
Record<Exclude<keyof C, keyof T>, never>` was verified to reject the extra key
by reference while regressing no valid call across nine kinds, including
union-shaped configs. It is deliberately NOT applied: it costs a generic
parameter on every config-shaped factory in three packages, this codebase has
already hit instantiation-depth limits in the loose-type work, and the
literal-site check covers the way the surface is used.

Revisit only if by-reference config construction becomes a common pattern.

### X2 — No-argument construction is inconsistent on the loose surface

A factory whose slots are all omittable should be callable with no argument. The
strict surface now derives this from slot multiplicity, so `ir.tryBlock.strict()`
renders `try{}`. The loose surface still requires `{}` in these cases:

| grammar | count | kinds |
| --- | --- | --- |
| rust | 17 | `typeParameters` `scopedUseList` `forLifetimes` `tupleType` `typeArguments` `loopExpression` `constBlock` `unsafeBlock` `asyncBlock` `genBlock` `tryBlock` `async` `gen` `loop` `scopedList` `tuple` `unsafe` |
| typescript | 12 | `tryStatement` `catchClause` `finallyClause` `class` `functionExpression` `generatorFunction` `classStaticBlock` `typeArguments` `callSignature` `typeParameters` `constructSignature` `try` |
| python | 11 | `simpleStatements` `importStatement` `matchBlock` `lambdaParameters` `typeParameter` `classPattern` `set` `withClauseParen` `futureImportStatementParen` `printStatementPlain` `import` |

The `repeat1` kinds in these lists overlap S1 and should be excluded rather than
fixed — an empty one is not legal. The remainder is the same coercion-side
plumbing the strict side already has.

---

## Reading a failure

Every issue above was filed only after reading the kind's generated factory
signature. Several plausible-looking defects turned out to be calling mistakes:

```bash
awk '/export function build<Kind>\(/{c=8} c&&c--' packages/<lang>/src/factories/raw.ts
```

That line states whether the factory is positional, variadic or config-shaped,
and names the real slot keys. Four conventions account for most confusion:

- **A thin wrapper is positional.** `ir.typeAnnotation.strict(type)`, not
  `.strict({ type })`. A config bag there yields
  `$type property missing in <X>TransportSlot`, which reads like a transport
  bug.
- **A form is `ir.<kind>.<form>.strict(…)`.** `ir.<kind>.<form>(…)` is its
  coercing twin.
- **An alias form yields its own kind, not the parent's.**
  `ir.importStatement.clauseFrom.strict(…)` builds the arm; the caller seats it in
  `import_statement.fromClause`. Rendered alone it lacks the `import` keyword
  because that is the parent's template text.
- **A seat holding an argument tuple takes an array, and that array is the
  child's argument list.** `ir.functionDefinition.block.strict({ body: [line] })`
  — the statements go in directly, not pre-wrapped in a block. A bare node
  there is a type error; bypassing the types gives
  `seated is not iterable` or `Spread syntax requires ...iterable`.

## Where the examples stand

`examples/17-dogfood-rust-strict.ts`, `18-dogfood-typescript-strict.ts` and
`19-dogfood-python-strict.ts` each rebuild their whole target file through the
factory surface and name a row above only where it bites (`17` marks L2). The
loose halves, `17-dogfood-rust.ts`, `18-dogfood-typescript.ts` and
`19-dogfood-python.ts`, carry their own gap commentary from the earlier
worklist; a gap named there that is not a row above is a calling mistake, and
the strict twin shows the shape that builds.

### The generated rebuilds

`pnpm run gen:examples` prints `examples/17-dogfood-rust.generated.ts`,
`18-dogfood-typescript.generated.ts` and `19-dogfood-python.generated.ts`
from their targets with `sittir tool emit-factory-source`; their type errors
are counted under `examples/generated-typecheck-ceiling.json` (a ceiling that
only shrinks for a given emitter; when the emitter reaches more of a target,
as the slot-key fix did, the count is re-baselined and the commit says so),
and the package verify tests hold each to its target's tree
as expected failures naming the open rows above. Inner comments are not
printed yet: a comment rides the following node's `$triviaData`, which the
dispatcher does not hand to a factory. `probe-sweep.py` is not the python
target because the override parser rejects its `name=True` keyword defaults
(lines 129 and 133); the 4-space format fixture is.
