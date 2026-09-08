# Handoff — strict rebuild from source (2026-09-08)

Branch `feat/strict-rebuild-from-source`, stacked on #272 (`feat/enrich-skip-list-retirement`).
Nothing pushed, no PR open. Sixteen commits from 6c6c3dd42 (4f4f5ef31 = inline-group emitter spelling, ceilings 19/31/10); `git log --oneline master..` lists them.

## What landed, in order

1. **Enum-of-literals leaves are kind-id-stored at the model** (6c6c3dd42 + 7d1584598).
   `AssembledEnum.storage` is `'kindId'`; an enum mints no factory, coercer or `ir`
   entry; its type is the member-id union (`BooleanLiteral = TSKindId.True | TSKindId.False`).
   `ValueStorage` has a member-set arm; `isFixedTextLeaf` is the single-text guard.
   Both transport enum builders order kind-id-stored variants first
   (`kindIdStoredFirst`) — rust aliases the primitive tokens onto `identifier` in
   expression position, so the alias wire-id map lists `u8`'s id under `identifier`
   grammar-wide and the `_type` transport decoded a bare 28 as an empty identifier.
   Spec: `docs/superpowers/specs/2026-09-07-enum-leaf-kind-id-storage-design.md`.
2. **`ir` exposes aliased pattern leaves by `userFacing`** (27f66acd8 + 41ce4d2d8):
   `ir.stringLiteralOpen`, the comment-content patterns, `templateChars`. Hidden
   keywords stay off (value is the id); a hidden pattern whose key keeps its
   underscore stays off. Ratchets: rust 274, typescript 253, python 201.
   The rust strict example spells token trees with `TSKindId.Comma`.
3. **Factory source emitter** (dbbf31ce0, 46916d1c8, 078a32c62, 2fafde12f):
   `sittir tool emit-factory-source --grammar <g> --file <path> [--export name] [--out path]`
   runs the validators' own dispatcher (`buildFactoryNodeFromReference`) with a
   printing factory map (`packages/tools/src/emit/factory-source.ts`).
   `pnpm run gen:examples` writes `examples/{17,18,19}-dogfood-*.generated.ts`;
   `examples/generated-typecheck-ceiling.json` counts their type errors; the
   package `examples-verify` tests hold each to its target's tree as `it.fails`
   naming the open rows; `packages/tools/tests/emit/generated-examples.test.ts`
   checks freshness and the ceiling.
4. **Slot wire keys** (dc4eca738 + 3bbb7b5af + d42e02209): the read stores an
   unnamed slot under the child's kind (`_parameter`); the factory map stamps
   `FactorySlotMeta.wireKeys` (the set the wrap accepts, `collectConcreteStorageKeys`
   moved to `shared.ts`) and each slot's storage class into `node-model.json5`;
   `nodeToConfig` resolves a read key to its slot through them.
5. **`$variant` inference retired** (c9a88bf8d): no generated code reads it;
   the inference, its promotion helpers, the `polymorphVariants` option and its
   chain through the from / factory-render-parse validators are gone.

## Gates at c9a88bf8d

- validate counts: rust 147/147 · 207/207 · 134/137 · 1517/1517; typescript
  143/143 · 193/193 · 112/114 · 1202/1202; python 126/126 · 142/142 · 115/116 · 1390/1390.
  The `from` totals dropped from 149/145 by the enum coercers removed by design.
- Parity fixtures identical to before (rust 1486, typescript 1500, python 1361).
- Six dogfood renders byte-identical (baseline in the session scratchpad; the
  `rust-strict` render changed once, deliberately, when the example was rewritten).
- cargo, scope boundaries, type-check clean. The only failing test anywhere is
  the user's uncommitted `examples/01-construct-nodes.ts` edit (`value: true`).
- Generated-rebuild type errors: rust 19, typescript 31, python 10 (after the emitter began spelling groups inline; the rise is S9's surface).

## The work list (`docs/factory-surface-issues.md`)

S4 and S5 resolved. Open, in order of leverage:

- **S9** — in progress, see "S9 in flight" below. Spec
  `docs/superpowers/specs/2026-09-08-group-seating-design.md`, plan
  `docs/superpowers/plans/2026-09-08-group-seating.md` (9 tasks). Groups never
  reach the flat `ir`; shape 1 (choice arms) = sub-factories as the parent's
  overload projected down (the existing `structItem$brace` seating, gate
  widened to any single slot); shape 2 (single group) = keys spliced onto the
  parent with both-or-neither overloads; shape 3 (repeated group) = array of
  the group's configs in the list slot. `hasAnyField` is retired; `hoisted`
  comes from `annotations.hoisted` stamped by each sittir minting route and by
  nothing else. All seating logic is overlay-emitter code; base factories,
  `types.ts`, factory map and node model untouched. Census 2026-09-08 before
  Task 2: hoisted 33/40/8, mounted 30/29/6, unmounted 3/11/2 (rust/ts/py).
  The emitter already prints the shape 3 spelling; S2 folds into this.
- **S3** — statement slots take only the hidden statement wrappers.
- **S2** — a no-argument form call is rejected (`ir.parameters.strict()`).
- **S6** — verbatim text in expression/pattern positions with no leaf to wrap.
- **S7** — a layout keyword arrives as an id where a presence flag is expected.
- **S8** — form names the read reaches are not on `ir`.
- Inner comments: a comment rides the FOLLOWING node's `$triviaData`, which the
  dispatcher never hands to a factory; the emitter prints only root trivia.
  Carrying `$triviaData` through `nodeToConfig` would also make comments
  round-trip in the validators — a gate-moving change, do it on purpose.
- The override python parser rejects `name=True` keyword defaults
  (`packages/tools/scripts/probe-sweep.py` lines 129 and 133), so the python
  dogfood target is `tests/format-roundtrip/fixtures/python-4space.py`.
- `ir.synonym.*` is legacy (user ruling); rust lost `synonym.boolean`.
- `packages/tools/src/codegen-surface.ts::buildNodeMap` does not expose
  `terminalAliasWireIds` (the gen path does).

## S9 in flight — Task 2, uncommitted

Task 1 is committed (5ee584628): `tool hoisted-census`, baseline 33 / 40 / 8 in
`packages/tools/hoisted-census-baseline.txt`.

Task 2 edits, all uncommitted, all under `packages/codegen/src`:

- `types/rule.ts`: `RuleAnnotations.hoisted?: true`.
- `dsl/annotations.ts` (new): `withAnnotations` moved out of
  `transform/transform.ts`, plus `withHoistedAnnotation`.
- `dsl/primitives/group.ts` (new): the `group()` placeholder;
  `transform/transform-path.ts` accepts `'.'` as the root path; `resolvePatch`
  lowers `group()` to the annotation. Exported from `dsl/index.ts` and
  `dsl/dsl-authoring.ts`.
- Stamp sites: the three variant-lift paths in `transform/transform.ts`
  (`tryHoistSiblingVariants`, `registerAliasedVariant`, `renameEnrichLift`),
  stamped on the arm body BEFORE the prec wrapper because evaluate unwraps
  prec and drops a wrapper's annotation; `wire/wire.ts` `groups:` bodies
  (`stampHoistedFn`); `enrich.ts` clause groups, stamped in place right after
  the unalias loop because `collapseSingletonMintOrdinals` rereads them after
  the merge, and the promoted symbol arms; `compiler/link.ts` collects
  `hoistedKinds` from the annotation only and stamps the group-lift body.
- Deleted: `hasAnyField` and `dsl/__tests__/has-any-field.test.ts`.
- New tests pass: `dsl/__tests__/group-annotation.test.ts`,
  `compiler/__tests__/link-hoisted-annotation.test.ts`.

The gate diff of the hoisted set (in-memory `buildNodeMap`; before/after files
in the session scratchpad `hoisted/`; scratch script
`packages/tools/scripts/.scratch/hoisted-after.ts`, delete before commit):

| Class | Count | Kinds |
|---|---|---|
| declared field-less groups, now hoisted | 9 | rust `_attributed_argument`, `_attributed_enum_variant`, `_attributed_field_declaration`, `_attributed_parameter`, `_attributed_type_parameter`, `_type_argument`, `_visibility_modifier_in_path`, `_visibility_modifier_pub`; python `_yield_from_clause` |
| field-less variant arms, now hoisted | 26 | seven have no slot at all: rust `_foreign_mod_item_semi`, `_mod_item_external`, `_pointer_type_const`, `_range_pattern_left_bare`, `_struct_item_unit`; typescript `_meta_property_new_target`, `_meta_property_import_meta` |
| upstream hidden sequences, no longer hoisted | 8 | typescript `_number`, the six `_type_query_*`; python `_key_value_pattern` |
| authored hidden rules reached only via `alias($._x, $.x)`, no longer hoisted | 9 | rust `_impl_item_positive_clause`, `_impl_item_negative_clause`; typescript `_ambient_declaration_global`, `_ambient_declaration_module`, `_export_statement_equals_export`, `_export_statement_namespace_export`, `_export_statement_type_export`, `_extends_clause_single`; python `_except_clause_as` |

Nine of the 35 additions are all-text arms (rust `_foreign_mod_item_semi`,
`_line_comment_content`, `_line_comment_regular_dslash`, `_mod_item_external`,
`_pointer_type_const`, `_range_pattern_left_bare`, `_struct_item_unit`;
typescript `_meta_property_import_meta`, `_meta_property_new_target`). They
stay token / pattern leaves: `classifyNode`'s hoisted shortcut now skips an
all-text body, so the model's `hoisted` lands on compounds only. Forcing them
to compounds turned `meta_property.content` from kind-id to verbatim storage
and gave `_line_comment_regular_dslash` two positional `content` slots (a
blocking `storagename-collision`). Expected census after Task 2: rust 46,
typescript 32, python 12.

**Ruling (user, 2026-09-08): the overlay treatment is driven by annotations,
i.e. sittir provenance.** Hoisted means a sittir route minted the rule. The 17
departures are accepted as ordinary hidden rules with NO `patches` entries
(the plan's Step 12 and the spec's "eight upstream entries" paragraph are
withdrawn); the 26 arms stay hoisted. If a gate shows an aliased authored
rule needs its seat back, the fix is an explicit `'.': group()` declaration on
that rule, never a shape heuristic.

**Tasks 3 and 4 landed in the same working tree** (both uncommitted with
Task 2; one commit carries all three because the regenerated outputs are
inseparable):

- Task 3 (shape 1): `sub-factories.ts::hoistedCandidatesOf` mounts a hoisted
  compound seated in any non-multiple slot with two or more values, not only
  the lone choice slot; `resolveCandidates` reads each entry's own residual.
  `polymorphs.ts` gives every hoisted compound a PRIVATE wiring const keyed
  by its `factoryName` (`_visibilityModifierPub`), emitted before its parents,
  so a parent's arm flattened through a hoisted kind is no longer dropped as a
  context mismatch — that is what had cost `ir.visibilityModifier.inPath`.
  New mounts: `forInStatement.{lhs,varKind,letConstKind}`,
  `exportStatement.default*`, `rangePattern.{dotDot,dotDotEq,leftWithRight}`,
  `typeQuery.{dot,qmarkDot}`, python `expressionStatement.assignment*`, and
  arms flattened through previously-hoisted kinds (`rangeExpression.dotDot`,
  `variableDeclarator.*`, `keywordPattern.{float,integer}`).
- Task 4 (shape 2): `sub-factories.ts::spliceSeatOf` (one single-valued slot
  whose value is a hoisted config-shaped compound); `polymorphs.ts::spliceShape`
  + `emitSplice` override the parent's `strict`/`coerce` in its wiring const —
  config parent: partition keys, seat when any group key has a value, type
  `parent input | OmitEach<parent, seat> & (group | NoneOf<group>)`;
  forwarded parent: a built value or `undefined` passes through, anything
  else is the group's config. `factories.ts` skips the forwarded wrapper only
  when the target is a hoisted config-shaped group (`match_block`); the
  wrapper stays for every list forward. Probes: `ir.matchBlock.strict({
  matchArm, lastArm })`, `ir.attribute.strict({ path, arguments })`,
  `ir.catchClause.strict({ body })` with and without `parameter`.
- Gates: validate counts identical to the baseline above after each task;
  workspace type-check clean apart from the user's `examples/01` edit;
  examples-verify green apart from that same edit; strict example moved to
  `arguments:` directly on `attribute`.
- Ratchets moved and re-baselined, deliberately: `ir` entries rust 274→261,
  typescript 253→261 (RISES: the 17 un-hoisted rules arrive as flat entries),
  python 201→197; generated-rebuild ceiling rust 19→41, python 10→20 (the
  emitter still prints inline configs for hoisted kinds; Task 8 prints the
  seated spellings and the ceilings fall); hoisted census 46 / 32 / 12.
- from() surface delta vs HEAD: `_wrapKindIds` no longer lists the nine newly
  hoisted declared groups (array-of-children route), because
  `classifyChildFactorySurface` still refuses a hoisted kind.

**Hoisted is the annotation only** (uncommitted on top of bf9fa4214, user
ruling 2026-09-08): `LinkedGrammar.hoistedKinds`, `NodeEnrichment`, the model's
`hoisted` flag and the `emitGroup` split in the base emitters are deleted;
`AssembledNodeBase.annotations` reads the rule's bag; `withKindFacts` merges
the whole bag across every root rebuild (it was being lost for 19 kinds);
`node-model.json5` carries `annotations` on every node, so the census counts
leaves too: 69 / 41 / 26. Finding accepted by the user: seven raw factories
(rust `buildTokenTree{Paren,Bracket,Brace}`, typescript
`buildString{Double,Single}`, python `buildExceptClauseList`,
`buildMatchBlockBlock`) move from config to spread — the hoisted branch in
`classifyFactoryShape` had been the only thing making them config. The strict
examples spell `ir.delimTokenTree.paren.strict(a, TSKindId.Comma, b)` and
`ir.string.single.strict(fragment)`, and the generated-rebuild ceiling fell
to rust 3 / typescript 0 / python 0.

**Tasks 5 and 6 landed** (2026-09-08, after the annotation-only commit):

- Task 5, elements seat: `elementsSeatOf` admits a compound list slot or a
  list kind whose values hold exactly one hoisted config-shaped group;
  `elementsShape` builds each element through the group when it is a plain
  object without `$type` whose keys are a subset of the group's config keys,
  else passes it through (`isConfig(e) ? _c(child)(e) : e`); spread-shaped
  parents erase through `_s`. Probes: python `x == y` comparison, rust
  `<T, U>` type parameters.
- Task 6, seats stamped: `seatOf(parent, slot, value)` is the single
  derivation of a hoisted value's seat (`{kind, shape: arm | splice |
  elements, mount?}`); `node-model.json5` carries `seat` on every slot value
  and `elementSeats` on every list. Leaf arms seat too (value arms via the
  text storage, node arms for text leaves). A direct-shaped single group is a
  one-key splice (`directKey`): python `ir.slice.strict({ start, stop, step
  })`, `ir.exceptClause.strict({ content, suite })`. Lists carry the
  annotation as provenance but are never seated or private: the census skips
  `modelType === 'list'`, `isHoistedCompound` excludes `AssembledList`, and a
  list names itself (no `_` prefix).
- Census 53 / 53 / 0, 34 / 30 / 4, 12 / 12 / 0 in
  `packages/tools/hoisted-census-baseline.txt`; `hoisted.test.ts` reads the
  file and asserts each grammar's live `unseated` never exceeds it (ratchet
  down only). The plan wanted `unseated` empty; the four typescript residues
  are findings, recorded rather than seated:
  - `_class_body_member`, `_class_body_method`, `_class_body_method_sig`:
    three hoisted groups share `class_body`'s one multiple slot;
    `elementsSeatOf` requires exactly one group per slot. Needs a per-element
    dispatch (config keys disjoint → pick by key set) before it can seat.
  - `_import_statement_clause_from`: dropped by the slot-collision
    diagnostic on `import_statement` (its `source` key collides with the
    parent's own), so no arm and no splice names it.
- Finding, open: an arm route does not carry the parent's splice.
  `ir.exceptClause.block.strict({ content: id('E'), suite: [block] })`
  renders `except:` — `content` is silently dropped, only the bare
  `strict` splices it. The seats compose per parent, not per mount route;
  the mount variants (`$inline`, `$block`) are built from the parent's raw
  input without the splice wrapper. Either thread `spliceShape` under every
  mount route or reject unknown keys in strict builders.
- Gates at this state: validate counts identical to the baseline above;
  workspace type-check and examples-verify clean apart from the user's
  `examples/01` edit; generated-rebuild ceiling 3 / 0 / 0; full suite green
  apart from that same edit (241 / 242 files).

Next: Task 7 (validators `nodeToConfig` by seat in
`packages/tools/src/validate/common.ts`), Task 8 (example emitter prints
seated spellings; fix the malformed `fields: a, b,` spread-in-object print
behind the three rust rebuild errors), Task 9 closing gates and the two
findings above.

## Gotchas

- Text searches are hook-blocked unless `.infigraph/.search-fallback-allowed`
  holds a fresh timestamp; write it in its own Bash call, then search.
- After any `packages/codegen/src/**` edit, regenerate all three grammars or the
  tools/cli suites fail with "Generated manifest verification failed";
  `--tests-dir packages/<g>/tests` regenerates `nodes.test.ts`.
- The generated rebuilds are loaded by computed path in the verify tests so tsc
  does not follow them; their errors are the ceiling's business.
- The collect-baseline test fails if another type-check runs concurrently; it
  passes alone.
- Commits: `git commit --no-verify -m … -- <paths>`; new files need `git add`.
- `pnpm run gen:examples` exits 2 at its final `oxfmt` step: the shared
  `OXFMT_CONFIG.ignorePatterns` excludes `examples/**`, so oxfmt finds no
  target. The three emits before it have already written the files, and the
  freshness test compares modulo whitespace.
- `validate counts` never exercises from()'s bare-string routes; the package
  `examples-verify` tests do (`ir.visibilityModifier('pub')`). Run them with
  every regen.

## Commands

```bash
pnpm exec tsx packages/cli/src/cli.ts gen -g rust -a -o packages/rust/src --tests-dir packages/rust/tests --skip-ts-chain --no-emit-diff
pnpm exec tsx packages/cli/src/cli.ts validate counts
pnpm run gen:examples && pnpm run type-check:generated-examples
pnpm exec tsx packages/cli/src/cli.ts tool emit-factory-source --grammar rust --file rust/crates/sittir-core/src/splice.rs | head -40
```
