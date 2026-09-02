# Handoff — example gaps, class 1: a kind's bare input is a fact on its namespace row

Paste from the `---` line down.

---

Follow-on to the CI type-check handoff
(`2026-09-02-type-check-tests-green-example-gaps-handoff.md`). Branch
`fix/example-surface-gaps`, stacked on `fix/enum-leaf-discriminant` (PR #264),
which is stacked on `feat/leaf-namespaces` (PR #263). Read
[docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md) first.
Session memory: `get_latest_session` (the infigraph MCP dropped mid-session;
the file fallback under `.infigraph/sessions/session_2026-09-02.*` is current).

## What this class was

`examples/17-dogfood-rust.ts` passed `ir.declarationList.strict(…)` where an
`impl_item`'s `content` slot expects the `_impl_item_body` wrapper (lines 142,
231). The coercer accepted it — `coerceToImplItemBody(input: T.DeclarationList |
T.ImplItemBody.Loose)` — but the slot's loose type did not, because a slot reads
`NamespaceMap[K]['Loose']`, and `Loose` was `LooseConfigOf<T> | T` alone. The
from emitter had spelled the wider union by hand in each thin wrapper's coercer
signature (`childElementType | list element | Loose`), so the fact "this
coercer takes its sole slot bare" existed in exactly one place that no slot
could see. The same shape covered the list-element string sites (158, 249,
255: `typeArguments: ['Edit']`) and the transparent-wrapper sites (288, 292:
`arguments: ['source']`).

## What landed

One fact, one source, read by everything:

- **`fromBareInput(node)`** (`emitters/shared.ts`) classifies what a coercer
  accepts bare beyond the kind and its config bag: `'value'` for a thin
  wrapper whose factory takes its sole slot directly (the `direct` /
  `forwarded` factory shapes), `'elements'` for a separated list, `null`
  otherwise. Spread compounds are deliberately `null`: `emitChildrenFrom`
  hands its input to the strict factory unresolved.
- **The types emitter stamps the bare slot's key on the row**
  (`bareSlotArg`): `NodeNs<…, <Kind>.LooseArgs, 'declaration_list'>` — the
  `storageName` of that slot, i.e. its `FieldsOf<T>` key — gated on
  `classifyFromEmission === 'emit'` (a hidden form with a builder but no
  from() cannot resolve a bare value at runtime).
- **`@sittir/types`**: `NodeNs` gains `Bare extends string = never` and a
  `Bare` member. `Loose = LooseConfigOf<T> | T | BareLoose<T, Bare, …>`, where
  `BareLoose` widens that field through the same `WidenLooseFieldValue`
  `LooseConfigOf` uses. `WidenValue`'s single-kind branch adds `BareArm<T>`,
  which reads `NsMap[K]['Bare']` and widens that slot — so a slot typed as the
  wrapper admits the wrapper's content, and a slot typed as a list admits an
  element or the element array. `LooseProjection` now reads `LooseConfig`
  (arm-free) instead of `Loose`.
- **The from emitter writes `T.<Kind>.Loose`** for every branch coercer; the
  hand-spelled union and `soleListElements` are gone.
- **List tuples are spelled `[element: E, ...elements: E[]]`**
  (`elementsTuple`) instead of `[...elements: NonEmptyArray<E>]`.
- **A separated list whose element kind is a transparent wrapper stamps
  `__inputHints__` on its element slot** from `separatedListSurface().elemType`
  — the strict builder maps bare content into the wrapper
  (`surface.wrapper`), so the content is an input-side fact of that slot.
  This is what fixed `examples/01-construct-nodes.ts:40`
  (`ir.parameters(ir.parameter(…))`), which the first cut had regressed.

Glossary entries: `emitters.md` — `fromBareInput`, `bareSlotArg`,
`emitNamespaceInterfaceLine`, `emitBranchFrom` (bodies), `BuiltTypeSurface`
(cycle rules), `elementsTuple`, `fieldInputHintTypeExpr`. `@sittir/types`
documents `BareLoose`, `BareArm`, `MaxBareHops`, `Contains`, `NodeNs.Bare`
in source.

## Why the shape is what it is (each was a failed attempt)

- **Not `<Kind>.LooseArgs[0]` on the row, by name or inline.** An indexed
  access in a base-type argument resolves eagerly; in the wrapper↔list
  clusters (`TuplePattern`↔`Patterns`, `UseList`↔`UseClauses`,
  `TupleType`↔`TupleTypeElements`, `TuplePatternElements`) it re-enters the
  row (TS2310 ×17) and the tuple's type-argument resolution (TS4110, TS2456).
- **Not an arm computed at `Loose` creation that walks through `Loose`.** The
  row member the recursion short-circuits through must be cheap to create;
  the walk goes through `LooseConfig` and re-adds the passthrough and the
  bare arm itself (`LooseOrConfigBag | BareArm`).
- **Not `NonEmptyArray<E>` in a rest position.** A variadic spread of an alias
  makes the whole tuple alias resolve eagerly at declaration; the loose
  element's widening then walks each element kind's bare slot straight back
  into the list's own row while its base types are still resolving.
- **Bare hops spend no `Depth`.** An elided wrapper is not a nesting level
  the caller wrote. Chains terminate on `Visited` (widened to
  `(string | number)[]`, extended only by `BareArm`) and `MaxBareHops = 3`;
  without the cap the chain visits every wrapper kind once (TS2589).

## Gates at commit time

| gate | result |
| --- | --- |
| per-package `tsc -p tsconfig.build.json` | rust 0 · typescript 0 · python 0 |
| examples type-check | rust 18 → 12 · typescript 5 (unchanged) · python 2 (unchanged); `examples/01` clean |
| `validate counts` | rust 149/149 · 208/208 · 134/137 · 1519 — typescript 145/145 · 193/193 · 112/114 · 1202 — python 126/126 · 142/142 · 115/116 · 1390 (all identical to the prior run) |
| codegen vitest | 15 failed / 1091 passed / 1 skipped — same files as HEAD (baseline-diff, generate, strict-terminal, render-module-emit, roundtrip) |
| package vitest | rust 6 failed (examples-verify 01/17, trivia ×3, read-depth) · typescript 2 failed (examples-verify return-statement) — identical at HEAD via stash-rerun |
| oxlint on touched sources | 6 errors, identical at HEAD |

Runtime is untouched: every `coerce.ts` line that changed is a signature.

## Class 2 (second commit on the branch): kind tags and the leaf maps

`{ kind: 'scoped_type_identifier', … }` on a multi-kind slot was rejected
(rust 39, 152, 164, 182, 199, 210, 249, 253, 287). Three defects, all in
`@sittir/types`'s `WidenValue`, verified by type probes on the rust
package:

- **The union decision never ran.** `T extends readonly (infer E)[]` on the
  naked `T` distributes, so everything after it — the tuple-wrapped
  single/homogeneous/heterogeneous decision — saw one member at a time.
  `IsSingleType` was always true; `TagEachArm` never ran.
  `LooseValue<A | B>` was provably equal to `LooseValue<A> | LooseValue<B>`.
- **The tag machinery was dead anyway**: `TagEachArm`, `UnionOfArmsLoose`
  and the `Visited` guards matched `$type: infer K extends string`, and
  `$type` is a numeric `TSKindId` member.
- **`WidenValue<never>` yielded `boolean`.** Every bare kind id went through
  `WidenValue<NonBareKindId<id>>` = `WidenValue<never>`, where
  `IsBooleanKeyword<never> extends true` holds (`never` extends anything),
  so `boolean` leaked into every slot holding a keyword id. That is the
  only reason `value: true` in `examples/01` ever type-checked.

What landed:

- `WidenValue` splits the union by member class — `WidenBrandMembers`,
  `WidenArrayMembers`, `WidenLeafMembers`, `WidenKindId`, `WidenBranches`,
  `OtherMembers` — and `WidenBranches` decides once for all structural
  members: every kind gets `{ kind: <name> } & <bag>` (`TagEachArm`); a lone
  kind additionally gets its untagged bag and its bare slot. This mirrors
  the runtime exactly: `_resolveOne` dispatches a tagged bag through the
  from map and accepts an untagged bag only with one candidate kind.
- The tag is the kind NAME. `NodeNs` gains `Kind extends string = never`,
  stamped by the types emitter (`coercerRowArgs`) only for kinds with a
  from() coercer — rows now end `LooseArgs, <bare | never>, 'kind'` — so a
  kind that cannot be built from a bag offers none. `IsHomogeneous`,
  `UnionOfArmsLoose`, `UnionToIntersection`, `Equals`, `NonBareKindId` are
  gone (the "homogeneous → untagged" idea contradicted the runtime).
- **The leaf maps were dead too.** `LeafScalarMap` / `LeafStringMap` were
  keyed by grammar name while `WidenLeafMembers` indexes them by the leaf's
  numeric `$type`, so every leaf widened to `string` and no scalar was ever
  admitted. Both maps are now keyed by the discriminant
  (`[TSKindId.X]: …`, `kindDiscriminantOrLiteral`), and `LeafScalarMap` is
  populated from `shared.scalarLeafKinds` — the same table `_resolveScalar`
  is emitted from (`boolean_literal → boolean`, `integer(_literal)` and
  `float(_literal) → number`). `value: true` is now admitted on purpose.

Rust examples 12 → 3; typescript and python counts unchanged. Note the
typescript `program.statements` site now reports four errors instead of two:
the two `Comment` elements are the real ones, and TypeScript elaborates
their siblings against the discriminant-narrowed target as `never` (probed:
`[comment, built]` reports both, `[built, built]` is clean).

## Class 3 (third commit on the branch): comments are trivia

typescript 86 placed `ir.comment(…)` in `program.statements`. Ruling: a
comment is not a statement and the children are not reordered — the reader
already resolves extras into per-node trivia (`$triviaData`), so a comment
child would double-represent one fact. Two things were missing on the
`$trivia` surface, both verified by runtime probes:

- **String shorthand.** The generated `$trivia` was already typed per grammar
  from the `trivia` role (`(Comment | { leading?, trailing? })[]`), and a bare
  string already RENDERED correctly: every entry crosses as
  `SlotValue<TriviaTransport>`, whose sittir-core decoder maps a JS string to
  `SlotValue::Verbatim`, and the engine newline-terminates each entry. Only
  the TypeScript signature forbade it. `TriviaEntry = AnyNodeData | string`
  in `@sittir/types`; `buildTriviaParamType` adds `| string`. A string is
  verbatim text, not resolved to a kind: `utils.ts` may not import the from
  map (generated packages are acyclic by lint), and trivia needs no kind.
- **`$with` carries trivia.** A setter rebuilds through the factory from the
  config, so the attached comment vanished. `withMethods` in
  `@sittir/common` now wraps every `$with` setter to hand the source node's
  `$triviaData` to the rebuilt node — one place, no per-factory emission. The
  `trivia.test.ts` case that pinned the drop is flipped.

The example now writes `applyFormat().$trivia(importTypes(), applyFormatDoc())`
(a string and a `comment` node). New `packages/typescript/tests/trivia.test.ts`;
rust `trivia.test.ts` gained carry and verbatim cases (spacing-robust — its
three pre-existing exact-whitespace failures are untouched).

## The remaining example red (rust 3 · typescript 3 · python 2)

With their roots as far as this session got:

1. ~~Tagged config~~ — landed in class 2 above. Left over from it: the
   `Visited` guards in `LooseConfigOf` / `LooseOrConfigBag` still match
   `extends string` and so never fire; `Depth` alone bounds that recursion
   today, and reviving them would tighten same-kind nesting (`binary({ left:
   { kind: 'binary_expression', … } })` would go strict one level early).
   Also `KindOf<T>` is now unused inside `@sittir/types` (public export).
2. **`traitClause: 'std::fmt::Display'`** (rust 140, 229). The slot is a
   two-arm hidden choice (`_impl_item_positive_clause |
   _impl_item_negative_clause`); no coercer is emitted for either
   (`coerceToImplItemPositiveClause` does not exist), and
   `resolveImplItem_traitClause` → `_resolveOne(value, K2, K22)` cannot pick
   an arm for a bare string. `BareArm` deliberately applies to single-kind
   slots only, so the type is truthful here; the fix is runtime (an arm
   choice for a bare value) before the type can admit it.
3. **`withSemi({ expression: … })`** (rust 271). `ir.statement.expression
   .withSemi` is the polymorph-form bundle whose CHILD is the strict
   direct-value builder (`ArgsOf<typeof F.buildExpressionStatementWithSemi>`
   = `[value: Expression]`); the example passes a config bag. The `() =>
   Expression | undefined` in the error is just TypeScript picking
   `ReturnExpression`'s accessor out of the `Expression` union. Either the
   example writes `withSemi(expr)` (the documented direct-value convention),
   or hidden forms get a coercing child (they get no from() today, which is
   also why the coerce bundle's child is the strict builder).
4. ~~typescript 86~~ — landed in class 3 above.
5. **typescript 57, 77** (`expression` vs `expressions`), **strict 25**
   (`.identifier.identifier` not callable) — unchanged from the prior handoff.
6. **python 47** (`ir.passStatement()` in `module.statements`) and **strict
   21** (`module.strict({})`) — unchanged. Note the error prints the whole
   `TSKindId` enum although `buildPassStatement(): TSKindId.PassStatement` is
   annotated; check whether the `ir` map's `typeof F.buildPassStatement`
   widens it.

## Follow-ups this class exposed (not done)

- `wrapChildrenListHint` (`emitters/types.ts`) is now a second derivation
  of the list admission for `direct` / `forwarded` / list kinds — `BareArm`
  reproduces it at the same depth. It is still the only admission for
  **spread compounds**, because their coercer passes input to the strict
  factory unresolved. Consolidate when `emitChildrenFrom` resolves elements.
- The dead `extends string` guards above.

## Gotchas (this session)

- `git checkout -b … | tail -1` hid a failed branch creation; the validator
  hook then auto-committed two `chore(validator): record validation run`
  commits onto the base branch. They are now the first two commits of
  `fix/example-surface-gaps`; `fix/enum-leaf-discriminant` was moved back
  to its remote.
- The codegen vitest run rewrites `packages/python/.sittir/grammar.js`
  (roundtrip tests), and so does the python package suite — regenerate
  python after either, or `validate counts` fails manifest verification.
- `git stash pop` refuses when vitest has touched the TRACKED
  `packages/*/node_modules/.vite/vitest/**/results.json`; `git checkout --`
  those two files first.
- `pnpm -C packages/<g> run type-check` is incremental and takes seconds
  here; do not read a fast run as a skipped one.
