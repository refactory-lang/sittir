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

**Task 7 landed as `ir-render-parse`** (2026-09-08, user ruling: a
separate validator path, not a projection inside `factory-render-parse`):

- On the parse side a hoisted child is an ordinary child (python
  `a < b < c` reads `comparison_operator._comparators[0].$type ==
  _comparison_operator_comparator`), and `factory-render-parse` builds it
  through its own raw factory into the parent's raw slot. The raw surface is
  seat-blind; nothing seated was exercised anywhere before this.
- `ir-render-parse` is `validateFactoryRenderParse(grammar, 'native', {
  surface: 'ir' })`: the same runner, candidates restricted to kinds bound
  on `ir`, dispatch through `ir.<irKey>.strict` or the mount route
  `ir.<irKey>.<mount>.strict`, and `nodeToConfig` projecting by seat
  (`LoadedNodeModel.seats`, `IrSurface`, `projectSeatedSlot`). The
  projection mirrors the overlay's spellings: a spliced group's keys join
  the parent (a direct/forwarded parent then takes the config whole); an
  element seat keeps element configs; an arm on a config parent with a
  config-shaped child is FLATTENED (`ir.structItem.brace.strict({ name,
  body })`), a nested arm names the route (`ir.rangePattern.leftWithRight`),
  a token leaf hands the mount nothing, any other child hands its arguments
  under the slot. `resolveChild` and `buildFactoryNodeFromReference` now
  share one `buildWithFactory` (a config child receives its separator
  options on the raw surface too; counts did not move).
- Counts row `ir-render-parsePass/Total/AstMatchPass`, history fields
  `irRenderParse*` (optional on old rows), `validate probe-factory --surface
  ir`. First baseline: rust 1259/1259, typescript 1063/1063, python
  1285/1286.
- The first run found four overlay defects, fixed at the root in codegen:
  `seatOf` now reads the parent's EMITTED wire set (`buildNodeModel`
  collects the polymorph wires from the generator's id tables), so a stamp
  is always a printed route; a hoisted token the factories do not emit
  mounts as a value arm (`ir.pointerType.const.strict`); `spliceSeatOf`
  refuses a group whose keys collide with the parent's slots (typescript
  `_binary_expression_in` stole `binary_expression.left/right`; now
  unseated, census 34/29/5, a named ratchet move); an elements seat on a
  spread-shaped parent goes through the rest parameters (python
  `union_pattern`). Regen added value-arm rows to the generated
  `nodes.test.ts` (rust `ir.wherePredicate.const`).
- Open, both in the overlay's seat composition: a nested arm inside a
  spliced group has no spelling (python `except a, b:`, the one
  `ir-render-parse` error, thrown explicitly by the projection); a mount
  route does not carry the parent's splice (`ir.exceptClause.block.strict({
  content, suite })` drops `content`, masked today by the first).

**Task 8 landed**: the example emitter consumes the seats instead of its own
form map. `printingIrSurface` builds a printing counterpart of the grammar's
`ir` bindings (every kind's `strict`, plus one entry per mount its seats
declare) and hands it to `buildFactoryNodeFromReference` as the surface, so
the printer takes the SAME seat projection `ir-render-parse` takes rather
than a second derivation. `FormOfKind`/`formsOf`/`formOf`, `hoistedKinds`
inlining and the `forwarded` absorb branch are gone; `seatFormChild` moves a
read's unnamed-slot key to the slot its seat names (and deletes the source
key, or the slot is projected twice). `wrapSeatedConfig` wraps text leaves
with the seat's kind for spliced, flattened-arm and element configs.
`unboundKinds` keeps the old inline collapse for exactly the hoisted kinds
the census still lists as unseated, which have an `irKey` but no `ir`
binding.

The generated examples move to the seated spellings
(`ir.classDefinition.block.strict(…)`, `ir.assignment.eq.strict(…)`,
`ir.functionDefinition.block.strict({ body: [ir.block.strict(…)] })` — the
mount route takes the child's arguments as an array, which is the overlay's
own signature). Ceiling unchanged at 3 / 0 / 0; the python
`examples-verify` "renders" row flipped from `it.fails` to `it` because the
seated spellings put its kinds on `ir`. A second arm seat in one projected
config now throws instead of crashing on a redefined property.

**The tuple seat** (user ruling): a hoisted child whose OWN surface takes rest
parameters (`spread`, or a list's `elements`, which also carries an options
bag) seats as a TUPLE on its parent's slot — `ir.structPattern.strict({ type,
fields: [a, b] })`. All keys are named keys, so the tuple is only needed when
the parent is a branch with named slots; a parent that takes its sole slot
positionally already spreads the child's arguments into its own call, and its
bundle overloads already declare them. That retires the `fields: a, b,` bare
print, which was a syntax error.

Three defects of the same class fell out of it, all fixed at the root:

- **A seat or mount wired to a child's RAW builder collapses the child's own
  seats.** `seatBearing` now routes a seat-bearing child through its overlay
  entry (`argumentsElements.strict`), and the wire collector visits every
  node-arm child so the entry is declared first. A child in a cycle with its
  parent keeps the raw builder, because the seated form has no spelling that
  would resolve there.
- **A mount route dropped the parent's seats** (the old finding 2).
  `composeSeats` folds a kind's seats onto its factory and names the result
  `<key>$seated`; every mount builds on that name. A composed call expression
  has no `typeof`, which is why it needs a name.
  `ir.exceptClause.block.strict({ content, suite })` now keeps its `content`.
- **A leaf has no `strict`**, because its strict and loose forms are one call,
  so the `ir`-surface lookup falls back to the binding itself.

**The rebuild ceiling of 3 / 0 / 0 was a masked measurement.** The three rust
entries were TS1005 syntax errors, and a syntax error suppresses semantic
checking for the whole program: restoring only the old rust file makes
typescript and python report zero again while their files are byte-identical.
The true numbers, now recorded, are 16 / 25 / 14. They are a floor to drive
down, not new debt.

Next: Task 9 closing gates, the two composition findings above, the
typescript census residue, and the `fields: a, b,` print.

## After Task 9 — the seating surface closed out

Everything below landed after the plan's Task 9, driven by rulings during the
session. `ir-render-parse` is now CLEAN on all three grammars: rust
1259/1259, typescript 1063/1063, python 1286/1286.

**The tuple seat.** A hoisted child whose OWN surface takes rest parameters
(`spread`, or a list's `elements`, which also carries an options bag) seats as
a tuple on its parent's slot: `ir.structPattern.strict({ type, fields: [a, b] })`.
All keys are named keys, so the tuple is only needed when the parent is a
branch with named slots; a parent that takes its sole slot positionally already
spreads the child's arguments into its own call. That retired the bare
`fields: a, b,` print, which was a syntax error.

**Seats and mounts compose.** Three defects of one class fell out of the tuple
seat and are fixed at the root. A seat or mount wired to a child's RAW builder
collapses that child's own seats, so `seatBearing` routes a seat-bearing child
through its overlay entry and the collector visits every node-arm child so the
entry is declared first; a child in a cycle keeps the raw builder. A mount
route dropped the parent's seats, so `composeSeats` folds a kind's seats onto
its factory and names the result `<key>$seated`, which every mount builds on —
the name is required because a call expression has no `typeof` for the
parameter types. And a leaf binding has no `strict`, because its strict and
loose forms are one call.

**Nested variants nest.** A variant patched inside another variant's position
is minted inside that variant's rule, so the name composes:
`_except_clause_exception_as`. `nestVariantsByPath` derives that from the patch
paths alone, in `patchSetsOf`, so injection and transform agree; only the
minted name composes, the arm keeps its short name. The spelling nests to
match, so `ir.visibilityModifier.pub.inPath` replaces the flat `inPath` that
read as `pub`'s sibling. `emittedArmPath` is the ONE derivation of an arm's
spelling — the overlay's child references, the seat stamps and the generated
per-kind tests all go through it, after the rename exposed three that had
drifted. Grammar sources moved with it: python's authored `_except_clause_as`
and its conflicts, and rust's range-pattern variants, which lost the redundant
`left_` prefix the nesting now carries.

**A group that is itself a choice is not a splice.** Splicing flattens the
group's one key onto the parent and erases the choice inside it, which is why
`except_clause`'s `list` arm had no spelling at all. Such a group mounts as an
arm with its arms nested: `ir.exceptClause.exception.as.strict(…)`. The test is
whether the group has arms of its own, NOT whether it was declared with
`variant()` — one variant is not a choice, and rust's `attribute.input` reads
better spliced than routed.

**Arms of one slot chain onto arms of another.** A kind with two arm-seated
slots has to name both in one call (`except a, b:` needs the exception's `list`
and the suite's `block`), and each arm is a whole route wrapping the parent, so
a caller could otherwise pick only one. A later slot's arms are emitted again
under each earlier arm, applied to it:
`ir.exceptClause.exception.list.block.strict({ exception: [a, b], suite: [block] })`.
Exactly one kind across the three grammars needs this today.

**The rebuild ceiling was a masked measurement.** The recorded 3 / 0 / 0 was
three rust TS1005 syntax errors, and a syntax error suppresses semantic
checking for the WHOLE program: restoring only the old rust file makes
typescript and python report zero while their files are byte-identical. The
true numbers were 16 / 25 / 14. Fixing resolution through a factoryless
supertype wrapper (`soleWrappedNode`) then made the rust rebuild construct and
render for the first time, and the ceiling now stands at 10 / 23 / 14 with the
rust `examples-verify` renders row flipped to passing.

**What the ceiling still measures.** These are real, not typing noise: rust and
python render but are not byte-identical because comments and blank lines are
not printed (rust 1848 of 4389 characters, python 409 of 421), and typescript
still throws on S12. S12 also records the blind spot that let this accumulate:
`read-render-parse` never constructs, and `factory-render-parse` passes no tree
handle, so `resolveChild` halts and children are never rebuilt. The example
emitter is the only consumer that rebuilds a tree bottom-up.

## S12 closed — the rebuild builds from the wrapped materialization

`b492107d5`. The emitter no longer re-reads children raw through the tree
handle; it builds from `materializeWrappedNodeData`, the same input
`factory-render-parse` builds from, and applies the seat key-move as a plain
bottom-up walker (`seatFormTree`). `materialize`, `DrillHandle` and
`isShallowEntry` are gone.

Switching the root alone was never going to work, which is what the earlier
attempt measured. Four defects fell together:

- **`resolveChild` re-read every materialized child.** Materialized nodes keep
  `$nodeHandle` and `$childIndex`, and `drillReadNode` re-reads on those two
  keys alone, so the raw parse node came back one level down and the slot
  filter was discarded again. `carriesOwnContents` now leaves a node holding
  text, slot keys, `$children` or `$other` untouched. The emitter is the ONLY
  caller that passes a tree handle, so no validator changed shape — but note
  that nothing drills any more, and `shouldHaltRecursion`'s `!tree` clause is
  still what stops `factory-render-parse` recursing at all.
- **A fixed-text leaf stores its kind id in place of its text.** The
  `_token_tree_punctuation` node arrives as `$type: 352`, `$text: 137` — 137 is
  `comma`. `printRawNode` handled only a string `$text` and fell through to the
  generic object print, which is the `{}`. A numeric `$text` is a kind id.
- **Only two of the four factory shapes wrapped their text arguments.** The
  earlier "resolve a slot's supertype to its text leaves" diagnosis was wrong:
  `direct` and `config` route a bare string through `printVerbatimText`, while
  `spread`, `elements` and the mount route handed it to `printValue`, which
  spells a string literal. The existing resolution had simply never been asked.
  All four go through `wrapDirectArg` now. (The model does carry `subtypes` on
  every supertype node if supertype resolution is ever genuinely needed — it
  does not require `node-types.json`.)
- **A tuple seat carries the child's options bag** into the generic array
  printer, where `delimiter: 0` was read as a kind id and threw. `isListOptions`
  is one predicate, shared with the `elements` shape.

**Ceiling 10 / 23 / 14 → 6 / 1 / 7**, verified free of TS1xxx syntax errors so
the count is not masked. Validate counts, `ir-render-parse` and the full suite
are unchanged; no `examples-verify` row flipped.

The single remaining typescript error is `importStatementClauseFrom` not being
on `ir` — S9's census residue from the slot-collision drop on
`_import_statement_clause_from` — and it is now the ONLY thing between the
typescript rebuild and rendering. The reverted `keepNested` is the candidate
fix, to be designed deliberately rather than as a side effect.

Rust's 6: two `undefined` arguments to `ir.visibilityModifier.pub` (S2's
no-argument form call) and four overload misses. Python's 7: five `Built` not
assignable to `SimpleStatements | CompoundStatement`, and `ir.type.strict(
TSKindId.List)` where an expression was wanted — `memberIdOfText` maps any text
equal to a KIND NAME onto that kind's id, so the identifier `list` becomes
`TSKindId.List`. That one is pre-existing and is the same "wrong leaf chosen"
class as the `ir.escapeSequence("hi")` case.

## S8 closed — the typescript rebuild renders, ceiling 6 / 0 / 7

`6ada856b1`. The typescript residue was never a seating gap. **A hoisted
compound has no flat `ir` binding** — hoisting is exactly what keeps it out of
the bundle — yet the emitter spelled every unseated one as `ir.<irKey>`, a path
that by construction never exists.

All five typescript census residues reach `ir` by a route the census does not
measure: the **variant form** their parent declares. The entry is the CHILD's
own builder namespaced under the parent —
`ir.importStatement.clauseFrom.strict` IS `F.buildImportStatementClauseFrom` —
so it yields the child kind for the caller to seat. That is the alias-form
convention `examples/18-dogfood-typescript-strict.ts` already documents in its
header and spells by hand; the generated rebuild now matches it exactly.

| kind | declared form |
| --- | --- |
| `_binary_expression_in` | `ir.binaryExpression.in` |
| `_class_body_member` | `ir.classBody.member` |
| `_class_body_method` | `ir.classBody.method` |
| `_class_body_method_sig` | `ir.classBody.methodSig` |
| `_import_statement_clause_from` | `ir.importStatement.clauseFrom` |

`irPathResolver` composes that path for a hoisted kind, walking up while each
parent is itself hoisted and stopping at the first kind that owns a flat
binding. **The form alone cannot decide it**: non-hoisted kinds are declared
under variant forms too (`export_statement.default`,
`import_clause.named_imports`) and their flat spelling is canonical, so
hoistedness is the discriminator. Distinguish the two shapes that share the
namespace — `ir.binaryExpression.in` is the child's builder, while
`ir.binaryExpression.ampAmp` is `binaryExpression$ampAmp(F.buildBinaryExpression,
TSKindId.AmpAmp)`, which pins a determined slot and yields the PARENT.

Two corrections to what was recorded before: the `slot-collision` drop
(`sub-factories.ts:333`) is on `import_clause`, not `source` —
`import_statement` has no `source` slot at all — and that drop is correct and
irrelevant, since the kind was never going to be reached through a seat. The
reverted `keepNested` is therefore NOT needed for this row.

Gates: typescript's `examples-verify` "renders" row is now a plain `it`;
validate counts, `ir-render-parse` and the full suite unchanged; ceiling
**6 / 0 / 7**, no syntax errors masking it.

Rust's 6: two `undefined` arguments to `ir.visibilityModifier.pub` (S2's
no-argument form call) and four overload misses. Python's 7: five `Built` not
assignable to `SimpleStatements | CompoundStatement`, one `ir.type.strict(
TSKindId.List)` where an expression was wanted — `memberIdOfText` maps any text
equal to a KIND NAME onto that kind's id, so the identifier `list` becomes
`TSKindId.List`, the same "wrong leaf chosen" class as `ir.escapeSequence("hi")`.

The census still lists those five as unseated, and that stays correct: they are
spelled, not seated. `unseated` measures seats, not reachability.

Next, in order: trivia (rust renders 1848 of 4389 characters, python 409 of
421, both from missing comments and blank lines), then the remaining rust and
python ceiling rows.

**Continued in [2026-09-09-seams-and-trivia-handoff.md](2026-09-09-seams-and-trivia-handoff.md)**,
which carries the seam and trivia work: comments now render (rust 4140 of
4374), python re-parses to the same tree as its source, and `$triviaData` is
`$_trivia`.

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
pnpm exec tsx packages/cli/src/cli.ts validate probe-factory python --surface ir
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts tool hoisted-census --grammar $g; done
pnpm run gen:examples && pnpm run type-check:generated-examples
pnpm exec tsx packages/cli/src/cli.ts tool emit-factory-source --grammar rust --file rust/crates/sittir-core/src/splice.rs | head -40
```
