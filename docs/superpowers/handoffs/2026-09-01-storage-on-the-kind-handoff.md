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
