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

### S1 — An empty separated list is constructible when the grammar forbids one

**Closed on the type side.** `ir.<list>.strict({})` is now a compile error for
list kinds the grammar declares `repeat1`:

```ts
ir.typeArguments.strict({})                       // error TS2769: no overload matches
ir.typeArguments.strict(ir.identifier('Edit'))    // → "<Edit>"
ir.typeArguments.strict({ delimiter: … }, elem)   // → "<Edit,>"
```

The envelope wrapper used to re-declare its list target's surface as one
permissive overload, `...args: ({ delimiter?: … } | Element)[]`, which admits a
lone options object and therefore zero elements. It now re-declares the pair the
list factory itself carries — `(options, ...elements: NonEmptyArray<E>)` and
`(...elements: NonEmptyArray<E>)` — so the arity is checked at every call.

Overload ORDER is load-bearing: the coercer reaches these builders through
`Parameters<typeof F.build<Kind>>`, which resolves to the LAST declared
overload, so the elements-only form must be declared last. Emitting the pair the
other way round type-errors every separated-list call in the generated coercers.

The runtime is deliberately unchanged. `_assertNonEmpty` remains gated behind
`SITTIR_DEBUG`, so an untyped caller can still build an empty list; the arity is
a type-level contract, not a runtime one.

A consequence worth knowing: a `repeat1` list will no longer take a spread of a
possibly-empty array, because `T[]` is not assignable to `NonEmptyArray<T>`.
`list.strict(...items.map(f))` must become `list.strict(f(a), f(b))` or supply a
tuple. `examples/17-dogfood-rust-strict.ts` shows the shape.

### S2 — Determined punctuation has no form on most kinds that carry it

**Closed.** Every typescript kind whose punctuation slot is a pure literal enum
now exposes a form that fills it:

```ts
ir.returnStatement.semi({ expression })   // → "return x;"
ir.breakStatement.semi()                  // → "break;"
```

`return_statement`, `expression_statement`, `throw_statement`,
`function_signature` and `import_alias` gained `semi` / `automaticSemicolon`,
joining the six kinds that already had them.

The eligibility rule was `choiceSlotOf`: a kind qualified only when it had
EXACTLY ONE slot with two or more values. `break_statement` has one — its
`semicolon`. `return_statement` has two, because its `expression` slot is a
wide expression union, so the whole sub-factory derivation bailed and the kind
got no forms at all. The count was doing duty for a question it cannot answer.

The fix reads the slot's own storage classification instead: when the choice
count is ambiguous AND the forwarding branch yields nothing, a lone slot whose
storage is a pure `kindEnum` — every value a literal with no factory — is the
choice slot. Two constraints keep it from over-reaching:

- **Only on the empty path.** If the forwarding branch already produced forms,
  they stand. Firing unconditionally replaced `impl_item`'s alias-wire `body`,
  which returns `_impl_item_body`, with a seated sub-factory returning the
  parent — a silent semantic change that broke every caller.
- **`kindEnum` only, never `mixedEnum`.** `impl_item.content` is
  `ImplItemBody | ';'` — a node arm beside a literal. Determined punctuation is
  the pure-literal case, and admitting the mixed one reintroduces the same
  regression.

`import_statement` still has no form, correctly: it carries TWO pure literal
enum slots (`import_clause` for the `type` modifier, and `semicolon`), so the
choice is genuinely ambiguous.

Storage classification is available for this because `computeFieldStorageInfo`
now runs inside `assemble()` rather than partway through `generate()`, so
`slot.storageInfo` is populated on every consumer downstream of the node map.

---

## Loose surface

### L1 — The stamped kind enum is rejected as a `kind:` discriminant

A discriminated config accepts the raw grammar string but not the numeric enum
the package exports for the purpose.

```ts
ir.matchArm({ pattern: { pattern: { kind: 'struct_pattern', … } } })       // → "T{a}=>{}"
ir.matchArm({ pattern: { pattern: { kind: TSKindId.StructPattern, … } } }) // rejected
```

`TSKindId.StructPattern` is `300`; the resolver matches on names only, so every
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
//   '{ readonly attributeArm?: AttributeArm; readonly path: … }'
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
| python | 11 | `simpleStatements` `importStatement` `matchBlock` `lambdaParameters` `typeParameter` `classPattern` `set` `withClauseParen` `futureImportStatementArm` `printStatementArm2` `import` |

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
  `ir.importStatement.arm.strict(…)` builds the arm; the caller seats it in
  `import_statement.fromClause`. Rendered alone it lacks the `import` keyword
  because that is the parent's template text.
- **A seat holding an argument tuple takes an array, and that array is the
  child's argument list.** `ir.functionDefinition.block.strict({ body: [line] })`
  — the statements go in directly, not pre-wrapped in a block. A bare node
  there is a type error; bypassing the types gives
  `seated is not iterable` or `Spread syntax requires ...iterable`.

## Working state

Uncommitted at the time of writing. Nothing here is committed; the only commits
on the branch are validator records (see below).

**Emitter and model**

| file | change |
| --- | --- |
| `emitters/factories.ts` | `constructorSurface` emits a list target's real overload pair (S1); wrapper emits one overload per entry |
| `emitters/overlays/sub-factories.ts` | `loneEnumChoiceSlot` fallback (S2) |
| `compiler/assemble.ts` | runs `computeFieldStorageInfo`; builds `nodeByKindId` |
| `compiler/generate.ts` | storage pass removed from here |
| `compiler/model/node-map.ts` | `kindEntry` / `kindId` stamp, `NodeLookup`, `argumentOptional` |
| `compiler/types.ts` | `nodeByKindId` on `NodeMap` |
| `packages/types/src/index.ts` | dead `AutoStamp` brand and its four consumers removed |

**Generated** — `raw.ts` in all three packages, `overlays/polymorphs.ts` in
typescript and python, plus the generated `nodes.test.ts` fixtures.

**Docs** — this file; `glossary/compiler-model.md` (`kindEntry`, `kindId`,
`argumentOptional`, `NodeLookup`, corrected `parameterless`),
`glossary/compiler.md` (`nodeByKindId`), `glossary/emitters.md` (two orphan
entries removed, brand precedence corrected).

**Examples** — the three `*-strict.ts` rebuilds. `examples/01-construct-nodes.ts`
carries unrelated edits that are not part of this work.

**Gates**, re-run after every emitter change: type-check ×5 at 0 errors;
examples ×8 at 0 errors, rendering 706 / 542 / 203 chars; validator identical on
all fifteen metrics; codegen suite 14 failed / 1113 passed across
`baseline-diff`, `strict-terminal`, `render-module-emit` and `roundtrip` —
proven pre-existing by a pathspec-limited stash-and-rerun.

**`sittir validate counts` auto-commits.** It appends to
`packages/tools/validation-history.jsonl` and commits, with no opt-out flag
(`--help` offers only `--isolate`). Budget one chore commit per gate run, or
squash them.

## Where the examples stand

`examples/17-dogfood-rust-strict.ts`, `18-dogfood-typescript-strict.ts` and
`19-dogfood-python-strict.ts` each rebuild their whole target file through the
factory surface, and carry a marker only where an issue above genuinely bites.
The loose halves of 18 and 19 still carry markers that predate this measurement.
