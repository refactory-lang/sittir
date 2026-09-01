# Handoff — storage is a property of the kind; parameterless factories become kind ids

Paste from the `---` line down.

---

Follow-on to the per-value storage stamp (merged as PR #260) and the suite-arm
naming (PR #262, stacked on master). Read
[docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md) first.
Session memory: `get_latest_session`.

## The ruling

Storage is a property of the **kind**, not of the reference. Every
`AssembledNode` carries one readonly storage kind, decided by what it is:

| class | storage | why |
| --- | --- | --- |
| `AssembledKeyword`, `AssembledToken` (with text) | `kindId` | nothing to store but identity — these are exactly today's `parameterless` classes |
| branch, envelope, polymorph, list, pattern, enum-owner, supertype | `node` | they have structure (or text a factory takes) |

A slot value's storage is then derived, never decided:

- `NodeRef` → its target's storage, plus `missing` when the kind is not in the map;
- inline terminal → `kindId` when it resolved to a kind (that kind's storage is `kindId` by definition), else `literal`;
- multiplicity is orthogonal (an array of ids, an array of nodes).

`classifyValueStorage` becomes a three-line projection. `isFactorylessTextLeaf`
and the hidden-`_` proxy disappear — they were the kind-level predicate
re-evaluated per reference.

**Parameterless factories go away.** A kind whose storage is `kindId` has no
factory; the id is the value. Measured population (regenerate to confirm):

| grammar | parameterless factories | keyword/token kinds currently stored as slot nodes |
| --- | --- | --- |
| rust | 9 | 11 (`MutableSpecifier`, `Crate`, `Dollar`, `ImplItemSemi`, `ModItemExternal`, …) |
| typescript | 11 | 7 (`This`, `True`, `False`, `Null`, `Import`, `EmptyStatement`, …) |
| python | 10 | 3 (`Comma`, `WildcardImport`, `NotEscapeSequence`) |

## Decisions (user rulings recorded)

1. **AGREED, with ergonomics.** Keyword kinds store as ids everywhere, including
   unions and arrays. To keep the surface readable: emit
   `export type EmptyStatement = TSKindId.EmptyStatement` (so slot types still
   name the kind), and keep `buildEmptyStatement()` as a function that
   **returns `TSKindId.EmptyStatement`** rather than a node. The factory names
   stay; the node object goes.
2. **Patterns are `node`** (no objection raised to the recommendation).
3. **AGREED (option b): delete the `verbatim` escape.** One encoding — mixed —
   seats `node` arms as nodes, `kindId` arms as ids, and genuinely anonymous
   `literal` arms as their quoted text (no table entry → identity coercion),
   which is what `valueStorageExpr` already does. The one census survivor
   (rust `'raw const' | ReferenceExpressionRawMut | MutableSpecifier`) is a
   phantom-kind smell to note, not a reason to keep a second encoding. Every
   former verbatim slot must therefore gain a coercion call in its factory.
4. **AGREED** — resolve the transport asymmetry, delete `carrier`.
5. **AGREED — keyword kinds keep a namespace, same convention as structured
   kinds.** The bare name stays the built type (a type alias merges with a
   namespace exactly as an interface does; no `Built` member — that would be
   vocabulary only keyword kinds have). Keyword kinds get an entry in the
   namespace map (`KeywordNs<TSKindId.X, ';'>`) so `LooseFor` / `TreeFor` and
   the `WidenValue` short-circuit through `NsMap[K]['Loose']` pick them up
   with no new machinery; that is what makes union slots widen uniformly
   (`Expression | EmptyStatement` → `Expression.Loose | EmptyStatement.Loose`).
   Shape:

   ```ts
   export type EmptyStatement = TSKindId.EmptyStatement;
   export namespace EmptyStatement {
   	export type Loose = LooseFor<TSKindId.EmptyStatement>; // TSKindId.EmptyStatement | ';'
   	export type Kind = 'empty_statement';
   	export type Tree = TreeFor<TSKindId.EmptyStatement>;
   }
   ```

   `BuildArgs` / `LooseArgs` are the empty tuple (`buildEmptyStatement()`
   stays a zero-arg function returning the id); whether the keyword namespace
   emits them is an S2 detail. Free-text token kinds (`HashBangLine`) keep
   node storage and are untouched. Lands in S2.
6. **Boolean / bitflag are slot-level storage, not a projection of the kind's
   storage.** Rule (user): an optional single-value slot whose value is an
   `AssembledKeyword` / `AssembledToken` (value storage `kindId`) or an
   anonymous literal (value storage `literal`) stores as **boolean**;
   a repeated slot of such values stores as bitflag. The slot's shape
   (optionality / arity) decides; the kind's storage only says whether the
   value has fixed text. Today `keywordPresenceKind` has exactly this shape
   but discovers "has fixed text" through the hidden-`_` proxy
   (`resolveEntryLiteral` → `resolveHiddenKeywordLiteral`), so a visible
   keyword kind referenced optionally (`mutable_specifier?`) is NOT boolean
   today. In S2 the presence classifier reads the stamped value storage
   (`via !== 'node'`), so those slots become boolean — a deliberate,
   measured baseline move, to be listed per grammar.

   Precision (user-confirmed): presence storage needs **exactly one arm** —
   the value axis must have nothing to say beyond presence. Optional ×
   several fixed-text arms (`'const' | MutableSpecifier`) is an optional
   `kindEnum` / `mixedEnum` (which one matters); a `node` arm anywhere
   takes the slot out of presence storage. And a `kindId` / `literal` arm
   never has variable text: `AssembledKeyword` / `AssembledToken` are built
   from a single `STRING` rule (assemble throws otherwise) and an inline
   literal is one fixed text, so the text is a property of the kind and
   render recovers it from the id. Variable text has one home,
   `AssembledPattern` (`node` storage, factory takes the text; a bare string
   coerces into that node); `AssembledEnum` is fixed-but-one-of-several and
   is `node` too.

## S1 gate finding (recorded, not hidden)

The first S1 cut set keyword storage from `hidden` (no factory name) alone
and was NOT byte-identical: rust 5 files, typescript 4, python 3. Every
divergent site was a `_`-prefixed keyword kind whose factory name is
*derived* but never *emitted* (`_kw_ref_marker`, `_kw_unsafe_marker`,
`_kw_static_marker`, `_kw_async_marker`, `_kw_move_marker`,
`_impl_item_unsafe_marker`, `_pointer_type_const`, python
`_wildcard_pattern`). `assemble` constructs grammar keywords without
`hidden`, so `factoryName` is set on them; the factory is then dropped by
`classifyFactoryEmission` (`skip-non-surface-kind` / `skip-hidden-keyword-
literal`), and today's kind-id storage for those references comes ONLY from
the `_` proxy in `resolveHiddenKeywordLeaf`. Consequence: the proxy is
load-bearing and cannot be deleted in a byte-identical step. S1 therefore
transplants today's predicate exactly onto the class
(`AssembledKeyword.storage = hidden || kind.startsWith('_') ? kindId : node`;
`AssembledToken.storage = kindId`) and S2 replaces it with the unconditional
`kindId` the ruling calls for — at which point the proxy is dead and goes.
`_wildcard_pattern` is additionally odd: its rule carries `hidden: false`
despite the `_` name, i.e. the rule-level hidden stamp and the name
disagree; note for the phantom/alias census.

## Decisions as originally posed

1. **Statement-level keyword kinds.** `empty_statement`, `pass_statement`,
   `break_statement`, `this`, `true`, `null` are keyword kinds that appear in
   *union* slots (`expression`, statement arrays). Under the ruling they store
   as `TSKindId.This` inside `Expression | TSKindId.This | …`, and statement
   arrays become `readonly (Statement | TSKindId.EmptyStatement)[]`. This is
   the range_expression shape generalized to supertypes and arrays. Confirm
   this is intended (it is the consistent answer, and the widest blast).
2. **`AssembledPattern` storage.** The user floated `verbatim` (store the
   text). Concern raised: in a multi-kind slot (`Identifier | ScopedIdentifier`)
   a bare string cannot say which pattern kind it is. Recommendation: `node`
   (text-constructible, `.Loose` already accepts a bare string for
   string-constructible kinds via `stringConstructibleTexts`).
3. **The `verbatim` slot escape** in `classifyFieldStorageInfo`
   (`sawNodeArm && (sawLayoutLiteral || sawNamedKeywordArm) → verbatim`) must
   go: with keyword arms always `kindId`, every such slot is mixed and must
   coerce, whereas a verbatim slot seats raw text with no coercion call (see
   `buildClosureExpression`). Decide whether any verbatim survivor exists
   (genuinely anonymous literal beside nodes) or whether `literal` arms in a
   mixed slot simply seat quoted text through the mixed coercion.
4. **`carrier` and the transport asymmetry.** With `kind` populated for any
   value that has one, `carrier: 'ref' | 'terminal'` has no reader left except
   `typeComponentOf`, which only exists to keep `transport-projection.ts:91` /
   `render-module.ts:2215` reading `rawKind ?? value` (a terminal with a kind
   currently uses its literal TEXT as the transport kind). Resolve it — a
   kind-bearing terminal uses its kind — and delete `carrier`. Needs
   `validate:native` evidence, not just type-checks.

## Staging (each stage gated)

- **S1 — the attribute, byte-identical.** Add `storage` to `AssembledNodeBase`
  (set in constructors by class; `AssembledToken` without text stays `node`
  as today), make `classifyValueStorage` project from it, delete
  `isFactorylessTextLeaf`. Gate: every emitter unchanged in all three regens
  (the `gen` command's "Regen diff vs HEAD" is exact; noise floor is zero).
  If S1 is not byte-identical, the difference IS a place where today's
  reference-level predicate disagrees with the class — review it, don't hide it.
- **S2 — parameterless factories → kind ids.** Kinds with `storage: kindId`
  get no `factoryName`; every slot storing them stores the id; `.Loose`
  accepts the text; `from()` coerces text → id via the existing
  `coerceKindEnumStorage` / `coerceMixedEnumStorage` tables; render recovers
  the text from the kind (value arms already render this way). Measure per
  grammar; expect `types.ts`, `raw.ts`, `coerce.ts`, `wrap.ts`, transport and
  templates all to move. The `parameterless` getter and the auto-stamp
  "parameterless factory call" path (memory:
  `project_auto_stamp_parameterless_factories`) retire with the factories.
- **S3 — delete the escapes.** Remove the `verbatim` escape (decision 3),
  resolve the transport asymmetry and delete `carrier` (decision 4).

## S2 as landed

Keyword storage is unconditional `kindId` (the S1 `_`-prefix transplant is
gone). Decision 3's half that S2 needed came with it: the `verbatim`
escape in `classifyFieldStorageInfo` is deleted, so a node-plus-keyword
slot is `mixedEnum` (ids seated, text→id table, `projectMixedEnumStorage`
on read); a genuinely anonymous literal arm stays as a text-only arm of
that slot. Surface, per ruling 1 / 5: `export type X = TSKindId.X`,
`namespace X { Loose; Tree; Kind }`, a `KeywordNs<Id, Text, Tree, Kind>`
row in `NamespaceMap` (`@sittir/types`), `buildX()` returns the id,
`coerceToX(input?: X.Loose)` returns the id, `WidenValue` widens a bare id
member through `NsMap[id]['Loose']` (bare ids only — branded `KindEnum` /
`Bitflag` numbers keep their own widening). Presence slots are untouched
(ruling 6 already held at HEAD: `resolveEntryLiteral` reads the stamp).
The `parameterless` getter stays: it is still true (the factory takes no
parameters), and `node-model` still serializes it.

Wire identity: a value's `kindId` stamp is `keywordRefWireIdentity` — the
grammar type id — the same derivation the slot tables use, so type, table
and transport agree. Probe (`stamp-probe`, scratch) showed the storage-first
stamp disagreed with it at exactly two classes: every `_kw_*` presence arm
(irrelevant to storage) and python's `_newline` arm aliased to
`suite_empty` (313 vs the token's 101). The parser emits the raw `newline`
token for that arm in the invalid-python "Empty blocks" corpus case (error
recovery), so the wrap projections take an alt-id map
(`kindEnumAltIdPairs`: storage / parse / token symbols that differ from the
stored id) and fold a stray parse identity onto the grammar type id before
transport. Ruling (user): "it should come out under the grammar type id".

Gate results (all three grammars): build 0/0/0; `validate:native` exit 0
with every metric identical to the pre-S2 run — from 149/145/126, coverage
208/193/142 (factories kept, so no drop), read-render-parse 134/137 ·
112/114 · 115/116, factory-render-parse 1519/1202/1390 all pass. The
validator's from() probe now treats a numeric result as the round-trip
(id equality) instead of walking it for nodes.

Findings recorded, not absorbed:

- `packages/<g>/tests/nodes.test.ts` is generated only when `gen` gets
  `--tests-dir packages/<g>/tests`; the keyword test now pins the id.
- Per-package type-check moved only at examples (`examples/07`, `09`, `17`
  for rust) and one hand-written test (`read-depth.test.ts`, now narrows).
  Two causes: (a) `Statement`-like unions carry an id member, so
  `statement.$type` must narrow (`typeof s === 'number'`); (b) examples
  passed bare strings where a slot has a keyword arm (`fields: ['start',
  'end']` for `FieldPattern | '..'`). (b) only ever compiled because a
  keyword LEAF arm widened to `string` by accident — `WidenValue`'s leaf
  branch keys `LeafStringMap` by kind NAME while `$type` is numeric, so it
  fell through to `string`; the runtime never resolved `'start'` into a
  FieldPattern either. Not reintroduced.
- Every referenced `kindId` kind gets its alias / namespace, hidden
  (`_kw_ref_marker` → `KwRefMarker`) or not: `userFacing` is true for any
  slot-referenced hidden kind, so it is not a gate for "only appears through
  a presence slot", and the proxy was the only thing excluding them.
- Remaining hidden-`_` proxy readers (`resolveHiddenKeywordLeaf` callers in
  factories.ts, classifyFactoryEmission, transport-projection, from.ts's
  `stringCapable`, `wrapsAnonLiteralContent`) are a separate byte-identical
  sweep, not part of S2.

## S3 as landed

`carrier` is deleted from `ValueStorage`; a `kindId` value always names
its kind, so `typeComponentOf` gives every kind-bearing literal component
its kind as `rawKind` whether the grammar wrote the arm as a reference or
an inline terminal, and the transport keys the literal variant by kind in
both cases (before, an inline terminal that resolved to a kind was keyed
by its text — the `rawKind ?? value` asymmetry). `valueKindIdExpr` is
identity-only; the text-match fallback moved into `kindEnumTextExpr`, the
one caller that has only a text in hand. The read-side alt-id fold from
S2 is the other half of the asymmetry and stays.

Effect: only the three Rust transport files changed (literal variant
names and serde renames for kind-bearing inline literals); every
TypeScript runtime output is byte-identical; build 0/0/0; `validate:native`
exit 0 with every metric identical to the S2 run.

Preceded by a byte-identical sweep (`8c0fb9643`): `resolveHiddenKeywordLeaf`,
`terminalTransportLiteralForKind`, the factory emitter's kind-enum text
map and `fixedTextOfKind` read `isKindIdStored(storageTargetOf(node))`
instead of testing leaf classes; the `_` gate survives only in
`resolveHiddenKeywordLeaf`, where it means grammar hiddenness.

## Gates (mandatory, per stage)

- `pnpm -C packages/<g> exec tsc -p tsconfig.build.json --noEmit` and
  `tsc --noEmit` — baselines build 0/0/0, type-check rust 31 / ts 8 / py 5
  (all pre-existing `examples/*.ts` + test files).
- `pnpm run validate:native` exit 0 — floors: coverage 208 · 193 · 142
  (typescript is 193 since #262); factory-render-parse 1519 · 1202 · 1390;
  read-render-parse 134/137 · 112/114 · 115/116; from() 149 · 145 · 126.
  Coverage counts kinds with factories — S2 removes factories, so the
  coverage totals WILL drop by the parameterless count; that is the intended
  baseline move and must be stated, not absorbed.
- `pnpm -C packages/codegen exec vitest run` — 15 failed / 1091 passed /
  1 skipped, diffed by test NAME.
- Overlay census vs master (entries per `export const X: typeof B.X` block):
  value arms keyed on keyword kinds must not be lost.

## Established, do not re-derive

- Per-value storage already exists (`NodeRef.storage`, `ValueStorage`,
  `classifyValueStorage`, `valueKindIdExpr`); this change moves the decision
  to the class and deletes the reference-level predicate.
- A verbatim slot seats raw text with no coercion (`_content = config.content`).
- `sittir tool diff-failures` reads a stale napi build after a regen — trust
  only `validate:native`'s own log / `validation-report.json`.
- Regenerating while `validate:native` runs races on `packages/<g>/src`.
- `transforms:` entries are static patch maps (a function is a silent no-op);
  `rules:` overrides are structural edits of `original`.
- Never chain `git stash` into a backgroundable command. Commit by pathspec;
  never `TODO.md`, `examples/*`, `tsconfig.json`, `validation-report.json`.
