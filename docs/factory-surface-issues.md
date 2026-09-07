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
