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

### S2 — A no-argument form call is rejected — RESOLVED

Was: `ir.visibilityModifier.pub.strict()` rejected with `TS2554: Expected 1 arguments, but got 0`, and the rebuild printed `strict(undefined)` for the empty slot.
One cause with S3. The `pub` wrapper declares its own surface first, `(value?: T.VisibilityModifierGroup)`, and the group's surface after it, `(value: TSKindId.Self | … | T.VisibilityModifierPubInPath)`; `ArgsOf<F>` inferred the parameter tuple from a plain call signature, which matches only the LAST overload, so the form's type kept the required group member and lost the optional own-surface the runtime accepts. `ArgsOf` is now the union of every declared overload's tuple, and the rebuild prints a form's arguments only up to the last defined one, so an empty optional slot spells `strict()`.

### S3 — A prebuilt node is refused where a wrapper's seat forwards to its target — RESOLVED

Was: python `ir.classDefinition.block.strict({ body: [ir.block.strict(…)] })` rejected with `TS2322: Type 'Built' is not assignable to type 'SimpleStatements | CompoundStatement'` at six sites of the rebuild; the earlier spelling of this entry (a statement slot naming the hidden `_statement` wrappers) had already gone with the supertype expansion, and the surviving error was this one.
The seat's config key is typed `ArgsOf<typeof F.buildSuiteBlock>`; that wrapper declares `(value: T.Block)` first and the block's `(...children: (SimpleStatements | CompoundStatement)[])` after it, and `ArgsOf` kept only the last, so the type admitted the statements but not the `Block` the read tree holds and the runtime wrapper accepts by its `$type`. With `ArgsOf` the union of every overload's tuple, `body: [ir.block.strict(…)]` and `body: [stmt, stmt]` are both admitted. The generated rebuilds type-check with no errors in all three grammars.

### S4 — The validators' config vocabulary is not the strict config's — RESOLVED

Two causes, both in `nodeToConfig`. The read stores an unnamed slot under the child's kind (`_parameter`, `_impl_item_body`); the factory map now stamps those spellings as the slot's `wireKeys` (the set the wrap accepts) and the projection resolves a read key to its slot through them. And the projection stamped a `$variant` and promoted a "variant child's" surface into the parent whenever a child kind appeared in some polymorph's map, which projected a `declaration_list` under an impl body as `foreignModItem.body`; no generated code reads `$variant` (polymorphs were retired into transforms), so the inference and its promotion are gone. `ir.implItem.strict({ traitClause: ir.implItem.positiveClause.strict(…), content: ir.implItem.body.strict(ir.declarationList.strict(…)) })` now prints as the hand-written strict example spells it.

### S5 — An attributed single-slot wrapper projects to `{}` — RESOLVED

Resolved with S4's slot keys: `ir.attributedParameter.strict({ content: ir.selfParameter.strict({ reference: true }) })` now prints, as do the argument, type-argument and import wrappers.

### S6 — Verbatim text in an expression or pattern position has no leaf to wrap — RESOLVED

Was: typescript `"boundary"` where a pattern is expected, `"0"` and `"offset"` in `arguments`, python a bare string where an `Identifier` is expected.
The factory-source emitter wraps every text leaf through the public text kind the slot declares (`wrapTextLeaves`, `printVerbatimText`), so the rebuilds spell `ir.identifier("boundary")`, `ir.number("0")`, `ir.identifier("offset")`; no bare text remains in a node position in any of the three generated rebuilds.

### S7 — A layout keyword arrives as a kind id where a presence flag is expected — RESOLVED

Was: typescript `TSKindId.AutomaticSemicolon` rejected for a statement terminator slot typed `BooleanKeyword<"\n">`.
The terminator is a declared choice slot whose values are kind ids (`terminator: KindEnum<'\n' | ';', TSKindId.AutomaticSemicolon | TSKindId.Semi>`), so both spellings build and render (`packages/typescript/tests/strict-surface-seats.test.ts`); the rebuild has no such site left.

### S9 — A config-shaped parent does not build its hoisted group from a config — RESOLVED

Was: the group's config under the slot key (`content: { kind, left }`) rejected, `comparators: [{ operators, primaryExpression }]` rejected, and rust's render throwing on a list seat handed one node.
Resolved by group seating on the parent: a hoisted group is reached through the parent's mount route, which merges the group's keys into the call (`ir.forInStatement.letConstKind.strict({ kind, left, operator, right, body })`); an element group in a list slot takes each element as the group's config (`ir.comparisonOperator.strict({ left, comparators: [{ operators, primaryExpression }] })`); a spliced group keeps its own arity (`ir.matchBlock.strict({ matchArm, lastArm })`, `ir.matchBlock.strict()` for the empty block) and a list seat handed one node is refused at compile time, so the render throw is behind a type error. The config-under-slot-key spelling this row asked for is refused on purpose: the plain route takes the built group, the mount route takes its keys. Witnesses: `strict-surface-seats.test.ts` in each grammar package.

### S8 — Form names the read data reaches are not on `ir` — RESOLVED

Generated: python `ir.assignment.eq.strict(…)`, `ir.comparisonOperatorComparator(…)`; typescript `TSKindId.<Member>` where `ImportClause | …` is expected.
Error: `TS2339: Property 'eq' does not exist on type …`; at render: `Cannot read properties of undefined (reading 'strict')`; typescript at render: `unknown kind id 390 in StatementTransport on ProgramTransport._statements`.

The python half closed when the example emitter began consuming seats, which
put `ir.assignment.eq` and `ir.comparisonOperator` on the printed surface.

The typescript half was a different mechanism wearing the same symptom, and
`unseated` in the hoisted census was the misleading signal. A hoisted compound
has NO flat `ir` binding — hoisting is precisely what keeps it out of the
bundle — yet the emitter spelled every unseated one as `ir.<irKey>`, a path
that by construction never exists. The five typescript residues all reach `ir`
by a route the census does not measure: the variant form their parent declares,
where the entry is the CHILD's own builder namespaced under the parent
(`ir.importStatement.clauseFrom.strict` is `F.buildImportStatementClauseFrom`),
yielding the child kind for the caller to seat. That is the alias-form
convention `examples/18-dogfood-typescript-strict.ts` already documents and
spells by hand.

| kind | declared form |
| --- | --- |
| `_binary_expression_in` | `ir.binaryExpression.in` |
| `_class_body_member` | `ir.classBody.member` |
| `_class_body_method` | `ir.classBody.method` |
| `_class_body_method_sig` | `ir.classBody.methodSig` |
| `_import_statement_clause_from` | `ir.importStatement.clauseFrom` |

`irPathResolver` now composes that path for a hoisted kind, walking up while
each parent is itself hoisted and stopping at the first kind that owns a flat
binding. The form alone cannot decide it: non-hoisted kinds are declared under
variant forms too (`export_statement.default`, `import_clause.named_imports`)
and their flat spelling is the canonical one, so hoistedness is the
discriminator.

The typescript rebuild now constructs and renders; its `examples-verify`
"renders" row is a plain `it`, and its type-error ceiling is **0**.

### S11 — Two arm slots cannot both be named in one call — RESOLVED

Arms of one slot now chain onto arms of another, so a caller names both:
`ir.exceptClause.exception.list.block.strict({ exception: [a, b], suite: [block] })`
renders `except a, b:` with its block suite. A later slot's arms are emitted
again under each earlier arm, applied to it, and the validators' projection
composes the mounts in slot order rather than refusing the second.

### S12 — A separated list's separator is printed as an element — RESOLVED

Generated: typescript `ir.arguments.strict("result", TSKindId.Comma, "format")`.
Error at render: `unknown kind id 14 in ArgumentsArgumentsTransportSlot`. The
comma is the list's separator, which the list factory supplies itself, and the
two operands print as bare text where an expression node is wanted.

The wrap layer already answers this: a slot's contents are filtered to the
kinds the slot admits, so `arguments._arguments` reads as `["result","format"]`
with the comma in `$other`, and `nodeToConfig` handles that shape correctly.
The example emitter did not use it — it re-read each child raw through
`handle.read`, which hands the separator back as an element.

The emitter now builds from `materializeWrappedNodeData`, the same input
`factory-render-parse` builds from, and applies the seat key-move as a plain
walker over the result. Four defects had to fall with it, and the first is why
an earlier attempt at the switch alone fixed typescript while regressing rust:

- **`resolveChild` re-read every materialized child.** Materialized nodes keep
  `$nodeHandle` and `$childIndex`, and `drillReadNode` re-reads on those two
  keys alone, so the raw parse node came back one level down and the slot
  filter was discarded again. A node that carries its own contents — text, slot
  keys, `$children` or `$other` — is no longer re-read. The emitter is the only
  caller that passes a tree handle, so nothing else changes shape.
- **A fixed-text leaf stores its kind id in place of its text.** A
  `_token_tree_punctuation` node arrives with `$text: 137`, the id of `comma`,
  and the raw-node printer handled only a string `$text`, so it fell through to
  the generic object print and emitted `{}`. A numeric `$text` is a kind id.
- **Only two of the four factory shapes wrapped their text arguments.** `direct`
  and `config` route a bare string through `printVerbatimText`; `spread`,
  `elements` and the mount route handed it straight to `printValue`, which
  spells it as a string literal. That, not supertype resolution, is why
  `"Debug"` stayed bare in `ir.delimTokenTree.paren.strict(…)` — the existing
  resolution had never been asked. All four shapes wrap now.
- **A tuple seat carries the child's options bag.** It hands the parent's slot
  the child's WHOLE argument list, so a separated list's options object reaches
  the generic array printer, where a `delimiter` of `0` was read as a kind id
  and threw. Recognising an options bag is one predicate (`isListOptions`) used
  by both the `elements` shape and the array printer.

Rebuild ceiling 10 / 23 / 14 → 6 / 1 / 7, with no syntax errors masking the
count. The single remaining typescript error is S9's census residue
(`importStatementClauseFrom` is not on `ir`), and it is the only thing left
between the typescript rebuild and rendering.

Neither validator would have caught any of this: `read-render-parse` never
constructs, and `factory-render-parse` passes no tree handle, so `resolveChild`
halts and its children are never rebuilt. The example emitter is the only
consumer that rebuilds a tree bottom-up, and the rebuild ceiling is its only
signal.

## Loose surface

### The contract: loose = strict + six coercions

Rule 2 (a bare scalar guessed into a keyword or enum member) is retired —
numbering below kept stable for the open rows that cite rules 3/4/5/7 by
number.

The loose surface never chooses a kind by looking at a value's shape. The
slot chooses, the caller names it, or the grammar declares a default. Every
coercion below is value-level and driven by a classification the strict
surface already owns — a leaf's pattern, a keyword's text, the `forwarded`
factory shape, the list envelope, `arm.default`, slot multiplicity. Nothing
picks among structurally distinct candidates.

Strict ⊆ loose: a prebuilt node that fits the slot passes through untouched
and is never re-interpreted.

| # | input | becomes | condition (all slot-driven) |
| --- | --- | --- | --- |
| 1 | string | a text leaf | the slot admits leaf kinds; matched by the leaf's own pattern |
| ~~2~~ | ~~string / number / boolean~~ | ~~a keyword or enum member~~ | **retired** — a bare scalar is never guessed into a keyword or enum member; name the kind (rule 3) instead |
| 3 | plain object | a kind's config | the kind is `kind:` (grammar name or `TSKindId`), else the slot's only kind, else an error |
| 4 | array, or one bare element | a list envelope, one entry per array item (a non-array value is one entry), each coerced recursively | the slot admits one list kind, or `arm.default` names one; a `repeat` slot coerces per element. An empty array (or empty spread) at an **optional** list slot is the slot absent: no elements node is built and the presence gate renders nothing (`ir.arguments([])` and `f()` render `()`); at a **required** list slot the list factory's non-empty guard throws, naming the slot |
| 5 | kind-identified value (node data, a `kind:` object, or a bare kind id) | wrapped by a single-slot wrapper | the slot's kind is a wrapper whose sole required slot admits the value — the same `forwarded` classification the strict factory's target overload uses; a wrapper's admitted set includes the members of any enum its slot reaches, so `returnType: TSKindId.StringKeyword` builds the `type_annotation` |
| 6 | bare non-object (string / number / boolean / array) | the field's declared `arm.default` | the slot has one candidate or declares a default; else an error |
| 7 | omission | nothing | whatever strict lets you omit; all slots omittable ⇒ callable with no argument |

Deliberately outside the contract:

- Structural inference — "this object's keys look like kind K". Retired.
- Rule 2, bare-scalar-to-keyword/enum-member guessing. Retired: a scalar
  names nothing about which of several candidate keywords or enum members it
  means, so the ambiguity is the same shape as structural inference above.
- Default-arm hoisting for a kindless config object. A config names its kind
  unless the slot is single-kind (rule 3); only bare values hoist (rule 6).
- Form selection. Naming an alternative (`ir.callExpression.call`) chooses a
  form, on both surfaces alike; a grammar-declared default variant routes a
  bare call, and nothing else does.
- Argument conventions shared with strict (the options object's position on a
  list wrapper). Those are fixed or documented on both surfaces together.

Each open row below names the rule it falls under.

### The loose rebuild is the loose gate

`sittir tool emit-factory-source --surface loose` prints the same file the
strict emitter prints, through the bundle calls (`ir.<key>(…)`, never
`.coerce`), with every coercion the contract admits spelled bare: a text
leaf as its string where the slot admits one pattern kind (rule 1), a list
envelope as its array where the slot's one branch kind or its declared
default is the envelope (rules 4 and 6), a single-slot wrapper dropped
where exactly one arm admits its inner value (rule 5), an empty config as
a bare call (rule 7). `--nested configs` prints nested compounds as config
objects, keyless at a one-kind slot and `kind: TSKindId.<Member>` elsewhere
(rule 3); the default keeps the builder calls. Each grammar's loose rebuild
is checked in beside the strict one (`examples/<n>-dogfood-<g>-loose.generated.ts`,
`pnpm run gen:examples`), type-checked under the same ceiling, and held by
the package verify tests to the target's tree — so a coercion the runtime
refuses, or a spelling the loose types reject, is a diff and a count here.

The printer decides each spelling from stamped facts (`node-model.json5`:
`bareAccepts`, a slot value's `default`, a list's `defaultDelimiter`, the
supertypes' `subtypes`), never by re-walking the grammar.

Rule 1's "matched by the leaf's own pattern" is what the runtime
implements: each pattern leaf's anchored regex is stamped into the emitted
`_leafRegistry`, and `_resolveLeafString` tests a bare string against it
before resolving, so a string never lands on the first pattern kind in the
slot's leaf order by default.

What the three loose rebuilds measure today (rust `splice.rs`, typescript
`format.ts`, python `python-4space.py`): all three render, re-parse to the
target's tree and render the target's bytes, and the type ceiling is zero for
every generated rebuild, strict and loose alike. The loose list call types its
options bag the way the strict one does (options first and optional, L2), so a
list whose read delimiter is not the stamped default is a plain call.

One spelling the printer deliberately does not attempt: elements inside a
bare array, and inside a tuple seat's array, keep their calls. The runtime
resolves each element through the element slot (L7), so a bare `'a'` is an
identifier node and a bare `1` an integer literal there, but an element slot
admits many leaf kinds, and the printer spells a leaf bare only where exactly
one pattern kind could take it.

### L1 — The stamped kind enum is rejected as a `kind:` discriminant — RESOLVED

A discriminated config accepts the raw grammar string but not the numeric enum
the package exports for the purpose.

```ts
ir.matchArm({ pattern: { pattern: { kind: 'struct_pattern', … } } })       // → "T{a}=>{}"
ir.matchArm({ pattern: { pattern: { kind: TSKindId.StructPattern, … } } }) // rejected
```

`TSKindId.StructPattern` is `305`; the resolver matches on names only, so every
config re-spells a name the enum already holds.

Affected all three grammars (the resolver is shared). `_kindNameOf` (from.ts)
now resolves a `kind:` discriminant's string or numeric spelling to the same
name once, shared by every `"kind" in v` site (`_resolveOne`, `_resolveOneLeaf`,
`_resolveOneBranch`, `_wrapArray`) instead of each re-deriving its own
`typeof kind === "string"` check. Verified against all three regenerated
packages (`tsc --noEmit` clean) and against rust at runtime: a numeric
`TSKindId.StructPattern` and its string spelling now build byte-identical
output through `ir.matchArm.withComma`.

### L2 — List options are honoured only in first argument position — RESOLVED

**Intended.** The options object is first so the elements stay a rest
parameter and a spread, and it is optional because the grammar's `options:`
block declares every default a list needs. A trailing options object is not
a spelling. What the optionality buys is on the loose surface: a list slot
takes its elements bare, `T | T[]` —
`docs/superpowers/specs/2026-09-17-factory-ergonomics-minor.md`, item 2.

A public strict list wrapper pins the options object to the first parameter;
the elements-only overload takes no options object at all. Passing options in
last position is a compile-time overload-resolution error, not a runtime
throw.

```ts
ir.enumVariantList.strict({ delimiter: Delimiter.Trailing }, variantA)  // → "{A,}"
ir.enumVariantList.strict(variantA, { delimiter: Delimiter.Trailing })  // type error
```

Affects rust, typescript, python.

The loose list coercer and the seated overlay type their parameters the same way,
`[first?: element | options, ...rest: element[]]`, so the options object is
accepted first on the loose surface as on the strict one and a trailing one is a
type error. The loose printer no longer needs an options overload that did not
exist: `ir.fieldDeclarationListElements({ delimiter: Delimiter.None }, …)` type-checks.

### L3 — A two-branch list slot takes no array — RESOLVED

Where a slot accepts either of two list kinds, the coercer resolves neither from
an array; the list node must be built explicitly. Under rule 4 the array
builds the one list kind the slot admits, or the one `arm.default` names; a
two-list slot with no declared default stays an error, and the fix is to
declare the default in the grammar, not to pick one.

```ts
ir.enumVariant({ name: 'V', body: [ir.fieldDeclaration({ … })] })              // → "V{a:u32}"
ir.enumVariant({ name: 'V', body: ir.fieldDeclaration({ … }) })                // → "V{a:u32}"
```

A single element goes through the bare-accept tables: a list admits its content
slot's kinds and those of a transparent wrapper it holds, so a `field_declaration`
is an element of `field_declaration_list` even though the list's own content is
`_attributed_field_declaration`.

Affected rust (`enum_variant.body`: `field_declaration_list |
ordered_field_declaration_list`). `arm.default` is now declared on the
braced, named-field form (`packages/rust/grammar.sittir.ts`, position
`2/0/0/0`) — the shape a bare array of field configs means; the
parenthesized, ordered-tuple form stays reachable by building it explicitly.
Combined with L6's array-to-envelope fix, `ir.enumVariant({ name, body: [...] })`
now builds the field list correctly.

### L4 — A visible wrapper must be spelled by hand — RESOLVED by seating

Where a slot holds a wrapper whose own required slot admits the value, the
coercer takes no bare inner value. The condition is the wrapper's `forwarded`
factory shape (the classification behind the strict factory's target
overload), not a coincidence of field names.

```ts
ir.matchArm.withComma({ pattern: { kind: 'struct_pattern', … } })              // → "T{a}=>{},"
ir.matchArm.withComma({ pattern: { pattern: { kind: 'struct_pattern', … } } })   // still builds
```

Affects rust (`match_arm.pattern` → `match_pattern`).

**Resolved.** `splice()` at the `pattern` field of `match_arm` and `last_match_arm`
(`packages/rust/grammar.sittir.ts`) declares `match_pattern` spliced onto its parent:
the reference carries `annotations.spliced`, the seat is recorded as `splice` in
`node-model.json5` on `last_match_arm`, `match_arm_with_comma` and
`match_arm_block_ending`, and the seated overlay passes a value that is already the
wrapper (built, or a config of its own keys) through untouched. Wrapping a bare value in a single-slot wrapper stays limited
to wrappers whose factory shape is `forwarded`.

The investigation that led there, kept for the reasoning: `forwardedTargetKind(match_pattern, nodeMap)`
returns `null` empirically (verified directly against the compiled node map):
`match_pattern`'s sole field `pattern` targets `_pattern`, a hidden
`AssembledSupertype` with ~19 subtypes and no `rawFactoryName` of its own, so
`forwardedTargetKind`'s `target?.rawFactoryName` check fails.
`classifyFactoryShape`/`isWrapChildrenKind` agree: `match_pattern` is not a
wrap-children kind — its raw factory (`buildMatchPattern`) is genuinely
config-shaped (`{pattern, condition}`), not positionally callable. The
existing `_wrapKindIds`/`_wrapWithChildren` infrastructure (reused for L6)
does not apply here. A real fix needs either (a) a new, narrow runtime fact
(sole-required-field config key + its accepted-kind closure, computed the
way `bareAcceptClosure` already walks slots) used only by
`_resolveOneBranch`'s kind-identified-value path, or (b) extending
`forwardedTargetKind` to admit a supertype target by checking subtype
membership instead of requiring `rawFactoryName` — the latter is the "true
root" fix but touches 7 existing callers across factories.ts/sub-factories.ts/
factory-map.ts and needs its own re-verification pass. Deferred pending that
design decision.

**Direction.** Neither. This is a seating question, not a coercion one: the
wrapper is spliced onto `match_arm` (and `last_match_arm`) so its keys are
the parent's, and the value at `pattern` resolves against `_pattern` by
rule 3. Wrapping a bare value in a single-slot wrapper stays limited to `forwarded` wrappers.
Design: `docs/superpowers/specs/2026-09-17-factory-ergonomics-minor.md`, item 1.

### L5 — Whole-alternative arms need their form named — intended, outside the contract

A kind whose rule is a choice of complete alternatives cannot be built from the
bare kind; the arm's form has to be named, even on the loose surface.

```ts
ir.callExpression({ function: 'f', arguments: ir.arguments.strict() })      // rejected
ir.callExpression.call({ function: 'f', arguments: ir.arguments.strict() }) // → "f()"
```

This is the surface, not a gap: naming an alternative chooses a form, on both
surfaces alike. A grammar-declared default variant routes the bare call; a
kind without one is named. Closed as documentation.

Affects typescript (`call_expression`, `variable_declarator`, `import_statement`,
`export_statement`).

---

### L6 — A list envelope's array collapses to its first string — RESOLVED

A loose config that hands a list-envelope slot an array of texts stores the
FIRST text as the envelope itself, dropping the rest; the envelope's transport
admits no text, so the native render refuses it.

```ts
ir.genericType({ type: 'Vec', typeArguments: ['Edit'] })                 // envelope slot holds "Edit"
ir.genericType({ type: 'Result', typeArguments: ['String', 'SpliceError'] }) // holds "String"; SpliceError is gone
ir.callExpression({ function: 'Ok', arguments: ['buf'] })                // envelope slot holds "buf"
ir.typeArguments.strict(ir.typeArgumentsElements.strict({ delimiter: Delimiter.None }, { content: 'Edit' })) // → "<Edit>"
ir.arguments.strict(ir.argumentsElements.strict({ delimiter: Delimiter.None }, 'buf'))                       // → "(buf)"
```

The slot carrier used to echo the stored text, so the first form rendered
`<Edit>` and the second rendered `<String>` without complaint; the carrier now
takes text only where a kind renders from text, so the loss surfaces as a
render error. The loose coercer should build the envelope with one element
per array entry.

Affected rust (`generic_type.type_arguments`, `call_expression.arguments`;
the hand-written rust rebuild, since retired, marked five sites). A new `_wrapArray` runtime
helper (from.ts, alongside `_wrapKindIds`/`_wrapWithChildren`) recurses into
the envelope's own list target before wrapping: a 'direct'-surface kind
(one positional child) whose sole child is itself a wrap-children kind
builds that inner list from the WHOLE array first, then wraps the single
built list — instead of handing the raw array straight to the envelope's
own one-argument factory. Verified against rust at runtime: both
`typeArguments: ['Edit']` and `typeArguments: ['String', 'SpliceError']`
now keep every element.

---

### L7 — A bare number inside a list-envelope array is dropped in silence — RESOLVED

Was: `ir.callExpression({ function: 'f', arguments: [1] })` rendered `f()`, and
`ir.letDeclaration({ pattern: 'x', value: 1 })` rendered `let x =;`, with no
error either time. Two halves of one cause: the separated-list coercer spread
the caller's elements raw into the strict factory, where a number is a kind
id, while the repeated-children coercer already resolved each element through
its slot; and the kind-enum resolver at a single slot took any number as the
slot's discriminant. The list coercer now resolves every fresh element
through the element slot (the transparent wrapper's content slot when the
list holds one, the wrapper's own config building through the wrapper), the
array-wrap helper hands an array to that coercer instead of carrying a second
element resolver, and a number is a discriminant only when it is a stored
kind id, so `[1]` and `value: 1` are integer literals and `2.5` a float on
both paths. A bare enum member id inside an array (`typeArguments:
[TSKindId.StringKeyword]`) stays the member it is, admitted where its enum
is, instead of being offered to every wrapper that now accepts it.

Rule 1 holds inside arrays as well: `'a'` is an identifier node and `'1'` an
integer literal, where before both were verbatim text the strict factory
stored unexamined. A string no leaf accepts at a multi-arm slot is named
explicitly, the same answer a single slot gives.

---

### L8 — A bare boolean is not a boolean literal — RESOLVED

Was: `ir.letDeclaration({ pattern: 'x', value: true })` and `arguments: [true]`
reached the transport as a raw boolean and failed there. `_resolveScalar`
looked the boolean up in the leaf registry under the name `boolean_literal`,
and no such row exists: rust's `boolean_literal` is an enum of two keywords,
which the registry never carries, and typescript and python have no kind of
that name at all, so the branch was not even emitted for them. The boolean
kinds now come from the model rather than a name (`scalarLeafKinds`): the
enum whose two member texts are `true` and `false` in any case, or the two
keyword kinds with those texts. A boolean resolves to the member's kind id,
which the slot admits as a stored id, and `LeafScalarMap` widens the enum
or both keywords to `boolean`, so `value: true` and `[true, false]` build
on all three grammars.

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

### X2 — No-argument construction is inconsistent on the loose surface — RESOLVED

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

**Resolved the coercion-side gap.** `emitBranchFrom`'s loose optionality
(from.ts) computed `opt` from a shallow, LOCAL "does this node have a
required slot" scan, diverging from the strict surface's own recursive
`argumentOptional` (node-map.ts) whenever a required field forwards to a
target that is itself constructible with no argument (a wrapper around an
empty-constructible compound, e.g. `try_block.body: Block`). `opt` is now
derived from `node.argumentOptional(nodeMap)` directly — the same fact
`factories.ts`'s strict-surface `targetTakesNoArgs` already uses — and the
`canDirectFactoryCall` code path now defaults an omitted required field via
`canDefaultToEmpty` (previously only the config-object path did). Verified
on rust: `constBlock`, `unsafeBlock`, `tryBlock`, `unsafe` now build with no
argument.

`canDefaultToEmpty` was also extended to a list-envelope's own list target
(it previously excluded `AssembledList` outright), checked through the same
`argumentOptional` — a separated list's own `argumentOptional` is
unconditionally true (an empty separated list is a legal JS construction
regardless of a `repeat1` grammar constraint), so `typeParameters`,
`forLifetimes`, `tupleType`, `typeArguments` and `tuple` build empty with no
argument too, matching what `ir.<kind>.strict()` already does today.

**Root-caused and fixed the remaining kinds.** `scopedUseList`,
`loopExpression`, `genBlock`, `async`, `gen`, `loop`, `scopedList` threw on
omission on both surfaces, because `argumentOptional` (node-map.ts) itself
undercounted this shape: it only recognized "every slot optional" or
"exactly one slot total," missing a node with an optional sibling slot
alongside its one required forwarding slot (e.g. `async_block`'s optional
`moveMarker` next to its required `body: Block`). Generalized
`argumentOptional` to the correct rule — a required slot only blocks the
no-argument call when it has no forwarding target of its own that is
argument-optional; any number of additional slots is fine as long as they
are all optional. Since both the strict raw factory (`factories.ts`'s
`resolveFactorySurface`) and the loose coercer (`from.ts`'s `emitBranchFrom`)
already derive their own optionality from this one shared fact, the fix
reached both surfaces without touching either emitter's own logic beyond
threading the (now correct) result through: `factories.ts`'s
`slotStorageExpr` was also given the same `canDefaultToEmpty` fallback the
loose surface already had, so a config that supplies nothing for the
one required-but-defaultable field constructs the empty target instead of
storing `undefined`. Verified on rust: `asyncBlock`, `genBlock`,
`loopExpression`, `scopedUseList` (and their aliases) now build with no
argument on both surfaces.

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
hand-written loose rebuilds that once sat beside them are retired: their gap
commentary named calling mistakes from the earlier worklist rather than surface
limits, and the generated loose rebuilds below prove the same targets on the
same surface with no hand-authored second derivation.

### The generated rebuilds

`pnpm run gen:examples` (`packages/tools/src/scripts/gen-examples.ts`, over the
target table in `packages/tools/src/emit/dogfood-targets.ts`) prints a strict
and a loose rebuild of each dogfood target, `examples/<n>-dogfood-<g>.generated.ts`
and `examples/<n>-dogfood-<g>-loose.generated.ts`, plus the strict keyword-opener
fixtures, with `sittir tool emit-factory-source`; their type errors are counted
under `examples/generated-typecheck-ceiling.json` (a ceiling that only shrinks
for a given emitter; when the emitter reaches more of a target, as the slot-key
fix did, the count is re-baselined and the commit says so), and the package
verify tests hold each to its target's tree. Inner comments are not
printed yet: a comment rides the following node's `$triviaData`, which the
dispatcher does not hand to a factory. `probe-sweep.py` is not the python
target because the override parser rejects its `name=True` keyword defaults
(lines 129 and 133); the 4-space format fixture is.
