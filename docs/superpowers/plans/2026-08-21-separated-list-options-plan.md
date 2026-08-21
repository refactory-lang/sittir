# Separated-List Options Struct — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> (this is foundational codegen work — execute INLINE in the main session, not
> via subagent dispatch). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every delimiter-bearing separated list is a top-level separatedList
kind carrying its kind-level options (`_content` + `_delimiter` +
`_separator`); the field-prefixed `_<field>_delimiter` family and the
factory-side per-field flank machinery are deleted.

**Architecture:** Realify field-embedded lists as top-level rules (hidden rule
+ visible alias — the existing `*_elements` pattern) via explicit grammar
overrides at the four A-sites, and widen separator-lift/classification at the
true root for the B-sites (multi-field choice elements; fielded-element lift
gap). No new wire, factory, transport, or view mechanism: the standard
separatedList pipeline serves every site once it classifies.

**Tech Stack:** sittir codegen (TypeScript, tsx no-build), tree-sitter grammar
DSL overrides, napi/Rust render crates, validator battery.

**Spec:** `docs/superpowers/specs/2026-08-21-separated-list-options-struct.md`
(realization bullets updated 2026-08-21: "The delimiter belongs in the kind
itself").

## Global Constraints

- Gates per change (numbers compared, not eyeballed): targeted probes (wrap
  AND render layers), `sittir validate history` across all three grammars,
  full unit suite (new failures isolated via stash-and-rerun), baseline
  compare (`packages/tools/baselines/native.json`, 9685 pass / 24 fail —
  fail count never rises).
- Floors at plan time: rust from=146/146 cov=204/204 rrp=134/137(134)
  frp=1507/1507; ts from=142/143 cov=199/199 rrp=112/114(112) frp=1203/1212;
  py from=122/122 cov=138/138 rrp=112/116(112) frp=1376/1381. Byte-identical
  except rows for the touched kinds; every moved row explained; ratchets
  only tighten.
- Known reds not to chase: ts from() member_expression; python rrp trio
  (chevron/type_parameter/types).
- Rebuild the napi crate after any grammar or sittir-core change AND after
  branch switches: `cd rust/crates/sittir-<lang> && pnpm run build` (sccache
  makes it near-instant; trust the gate, not duration).
- Regenerate after ANY `packages/codegen/src` edit (comments included) or the
  manifest gate fails the suite:
  `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`.
- python `grammar.js` reorders nondeterministically per regen — restore
  before commit when the diff is reorder-only.
- Commit with pathspecs in a dirty tree: `git commit -- <paths>`.
- Branch: `separated-list-options` (stacked work; NO PR until asked).
- Test-pin updates follow standard 4: independently reproduce that a pin
  covers amended behavior (stash fix → passes, reapply → fails) before
  editing any expectation.

## Landed (do not revisit)

- Slice 1 (536fdf2a0): delimiter vocabulary renames + `DelimiterFlags`
  bitflag + `permittedDelimiters` mask.
- Slice 2a (36bab4329): `_delimiter` bitflag replaced `_trailing_sep` /
  `_leading_sep` in both spellings, atomic producers+consumers flip.
- Slice 2b (4af6d3353): `_separator_kind` → `_separator`, stored only when
  dynamic.
- Slice 3a (f1d44159b): spread + leading-options factory surface for all 39
  classified separatedList kinds (rust 16 / ts 6 / py 17); options recognized
  by shape (plain object, no `$type`, keys ⊆ permitted); single `delimiter`
  `$with` setter; single-slot hoisting delivered for free by the forwarded
  wrappers (`buildArguments(...args: Parameters<typeof
  buildArgumentsElements>)` — derived, upgrades on regen).

## Design decisions (2026-08-21 discussion — settled, do not relitigate)

- The delimiter belongs in the kind itself: a separated list within a field
  is a top-level rule/kind. No anonymous struct slots, no field-prefixed
  keys, no leading-options-inside-array-values, no kind-level trailing
  `options` param on config factories.
- Kinds that ARE the list but store `_<field>_delimiter`
  (`enum_body_elements`) unify to kind-level spelling via separatedList
  CLASSIFICATION, not a spelling patch.
- Delimiter-less repeated fields (e.g. `tuple_expression.attributes`) stay
  bare arrays.
- Multi-slot parents need no hoisting: the field value is a built list node
  (`elements: tupleExpressionElements({ delimiter: 2 }, e1, e2)`).
- The read side is symmetric: wrap emits the list KIND node into the slot; a
  read node's field accessor returns the list node carrying its own
  delimiter/separator.

## Site inventory (design-check findings, 2026-08-21)

| Site | Kind exists? | Blocker | Class |
|---|---|---|---|
| rust `tuple_type` (`_type_delimiter`) | no — list inline in `'(' … ')'` | needs extraction | A |
| py `print_statement_group2` (`_argument_delimiter`) | rule exists, list inline after `'print'` | needs extraction | A |
| py `print_statement_group1` (`_argument_delimiter`) | rule exists; list is comma-LEADING (`(',' arg)* ','?`) | extraction + leading-shape classification | A (contingent on C) |
| ts `enum_body_elements` (`_content_delimiter`) | yes (`_enum_body_elements`, aliased visible) | element is `choice(field('name', _property_name), enum_assignment)` — multi-field element | B |
| py `expression_statement_tuple` (`_expression_delimiter`) | yes (`_expression_statement_tuple`, aliased visible) | clean `sepBy1(field) ','?` shape yet classifies branch — lift gap on fielded elements | B |
| rust `tuple_expression` (`_elements_delimiter`) | no — comma-TERMINATED shape `(e ',')+ e?` + `attributes` slot | extraction + comma-terminated classification | A (needs B first) |

Reference precedents: `_tuple_pattern_elements` / `_arguments_elements` are
enrich group-lift products (`author: enrich, symbolSource: group-lift`,
hidden rule + visible alias) and DO classify separatedList with fielded
elements — `_tuple_pattern_elements` vs `_expression_statement_tuple` is the
B-diagnosis comparison pair. Classification predicate:
`isSeparatedListShape` (`packages/codegen/src/compiler/assemble.ts:1338`)
requires the kind's own RenderRule to carry `multiplicity:
array|nonEmptyArray` + a lifted `separator` with an optional flank (or
nonterminal separator).

---

### Task 3b: rust `tuple_type` extraction

**Files:**
- Modify: `packages/rust/grammar.sittir.ts` (the `tuple_type: { '(_type)':
  field('type') }` patch override, ~line 301, and the header comment ~29-47
  that references it)
- Regenerate: `packages/rust/src/*` (+ `rust/crates/sittir-rust` templates)
- Test: validator battery + probe

**Interfaces:**
- Produces: kind `tuple_type_elements` (hidden `_tuple_type_elements` aliased
  visible), classified separatedList → spread factory
  `buildTupleTypeElements(options?, ...elements)` with kind-level
  `_content`/`_delimiter`; `tuple_type` becomes a single-slot parent
  (forwarded factory surface).

- [ ] **Step 1: Replace the patch override with an extraction rewrite.**
  Mirror `_tuple_pattern_elements`' shape (fielded elements, optional
  trailing separator); reproduce the base rule's structure verbatim inside
  the new hidden rule:

```ts
// rules: section of the rust grammar overrides
_tuple_type_elements: ($) =>
	seq(
		field('type', $._type),
		repeat(seq(',', field('type', $._type))),
		optional(',')
	),
tuple_type: ($) => seq('(', alias($._tuple_type_elements, 'tuple_type_elements'), ')'),
```

  Delete the old `tuple_type: { '(_type)': field('type') }` patch entry and
  update the header comment that cites it.

- [ ] **Step 2: Regenerate rust + rebuild the crate.**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
cd rust/crates/sittir-rust && pnpm run build && cd -
```

- [ ] **Step 3: Verify classification took.** `packages/rust/src/factories.ts`
  must contain a spread-shaped `buildTupleTypeElements` (overload pair +
  `_optsFirst` dispatch, storage `_content` + `const _delimiter =
  options.delimiter ?? 0`) and `buildTupleType` must be a forwarded wrapper
  (`...args: Parameters<typeof buildTupleTypeElements>`). `rg
  '_type_delimiter' packages/rust/src` must return zero.
- [ ] **Step 4: Verify parser shape.** Diff
  `packages/rust/.sittir/src/grammar.json` — `tuple_type` shows only the new
  alias member; `_tuple_type_elements` matches the base list verbatim.
- [ ] **Step 5: Targeted probes (wrap AND render).**

```bash
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind -g rust -t tuple_type
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind -g rust -t tuple_type_elements
```

  Round-trip `(A, B)`, `(A, B,)`, single `(A,)` through render-parse.
- [ ] **Step 6: Gate battery.** `pnpm run validate:native` + `pnpm exec tsx
  packages/cli/src/cli.ts validate history 2` — floors byte-identical except
  tuple_type-family rows (each moved row explained); full suite 0 failed
  (stash-isolate anything new); baseline compare unchanged.
- [ ] **Step 7: Commit.**

```bash
git commit -m "feat(rust): realify tuple_type elements as separatedList kind — slice 3b" -- packages/rust packages/codegen rust/crates/sittir-rust docs
```

---

### Task 3c: python print-group extractions

**Files:**
- Modify: `packages/python/grammar.sittir.ts:423-433` (the
  `print_statement_group1/2` override rules; extend the adjacent comment
  block for the extraction rationale)
- Regenerate: `packages/python/src/*` (+ `rust/crates/sittir-python`)

**Interfaces:**
- Produces: kinds `print_arguments` (group2's list) and — contingent on its
  classification, see Step 3 — `print_chevron_arguments` (group1's
  comma-leading list); parents keep `'print'`/`chevron` as template
  text/slot and hold the list node.

- [ ] **Step 1: Rewrite group2 (clean sepBy1 shape).** Language-equality is
  exact:

```ts
_print_arguments: ($) =>
	seq(
		field('argument', $.expression),
		repeat(seq(',', field('argument', $.expression))),
		optional(',')
	),
print_statement_group2: ($) => seq('print', alias($._print_arguments, 'print_arguments')),
```

- [ ] **Step 2: Rewrite group1 preserving the bare-comma arm.** Original
  post-chevron language is `{ε, ',', (',' arg)+, (',' arg)+ ','}`; the
  rewrite must keep all four:

```ts
_print_chevron_arguments: ($) =>
	seq(repeat1(seq(',', field('argument', $.expression))), optional(',')),
print_statement_group1: ($) =>
	seq(
		'print',
		$.chevron,
		optional(choice(alias($._print_chevron_arguments, 'print_chevron_arguments'), ','))
	),
```

- [x] **Step 3: Regenerate python, rebuild sittir-python, check
  classification.** `buildPrintArguments` must be spread-shaped with
  kind-level `_delimiter`; `rg '_argument_delimiter'
  packages/python/src` must return zero for group2.
  OUTCOME: `_print_chevron_arguments` (leading-mandatory) did NOT
  classify — it emitted field-carrying with interim
  `_argument_delimiter`. Contingency resolved by KEEPING the extraction
  (not reverting): gates held (floors additive-only, chevron corpus row
  was already red pre-change — the old wrap captured only 'trailing' and
  dropped the leading comma), and the extracted kind is the structure
  Task 3d's widening converts in place. Task 3e no longer includes
  group1.
- [ ] **Step 4: Targeted probes.** `print 1, 2`, `print 1, 2,`, `print >>f`,
  `print >>f, 1`, `print >>f,` through render-parse
  (`tool probe-kind -g python -t print_statement`).
- [ ] **Step 5: Gate battery** (same as Task 3b Step 6; python floors;
  restore `grammar.js` if the diff is reorder-only).
- [ ] **Step 6: Commit** (pathspec commit as in Task 3b).

---

### Task 3d: classification widening (B-class, true-root #170 fix)

**Files:**
- Diagnose then modify: the structural separator-lift (evaluate-side
  `extractRepeatSeparator` region flagged by the compiler-simplification
  spec) and/or `isSeparatedListShape` + content-slot derivation
  (`packages/codegen/src/compiler/assemble.ts:1338`,
  `packages/codegen/src/compiler/collect-slots.ts`,
  `packages/codegen/src/compiler/model/node-map.ts` merge path)
- Modify: `packages/typescript/grammar.sittir.ts:592-599`
  (`expectTestFailures` — remove the `enum_body_elements` #170 pin when
  green)
- Test: `packages/codegen/src/compiler/__tests__` unit pins for the widened
  predicate; full battery on ALL three grammars

**Interfaces:**
- Consumes: nothing from 3b/3c (independent; sequenced after so A-risk and
  B-risk gate separately).
- Produces: `enum_body_elements` and `expression_statement_tuple` classify
  `separatedList` → kind-level `_content`/`_delimiter`, spread factories
  (`enumBodyElements(options?, ...elements)`), `_content_delimiter` /
  `_expression_delimiter` gone. The widened lift also recognizes the shapes
  Task 3e needs (comma-terminated; comma-leading if deferred from 3c).

- [ ] **Step 1: Diagnose the comparison pair.** Trace
  `_tuple_pattern_elements` (classifies separatedList) vs
  `_expression_statement_tuple` (classifies branch) through evaluate →
  link → assemble: find exactly which producer stamps
  `multiplicity`/`separator` for the first and not the second (suspicion:
  enrich-minted list-pattern separator ATTRS vs raw structural lift that
  bails on FIELD-wrapped elements — the S3 "inner slots hardcode
  trailing:false" diagnosis). Write the finding into the task commit
  message, not code comments.
- [ ] **Step 2: Write failing unit pins** in the compiler tests for the
  three shapes, using minimal RenderRule fixtures:
  (i) `seq(field(f, sym), repeat(seq(',', field(f, sym))), optional(','))`
  → separatedList, separator `,`, trailing optional;
  (ii) `seq(seq(choice(field('name', symA), symB), repeat(seq(',',
  choice(field('name', symA), symB)))), optional(','))` → separatedList
  with union content slot (the `enum_body_elements` shape);
  (iii) the comma-terminated shape `seq(seq(elem, ','), repeat(seq(elem,
  ',')), optional(elem))` → separatedList, trailing delimiter present ⟺
  final element absent (the rust tuple shape, for Task 3e).
- [ ] **Step 3: Run the pins — all three must FAIL** (classify branch /
  no separator lifted).
- [ ] **Step 4: Widen at the identified root.** Fix the ONE producer Step 1
  identified — do not patch classification downstream of it (stamped facts
  over re-derivation). If the fix requires knowledge only link has, the
  lift moves to link (the sanctioned end-state per the casing/lift
  architecture decision) — that move becomes part of this task, not a
  parallel heuristic.
- [ ] **Step 5: Pins pass; regenerate ALL THREE grammars; rebuild all three
  crates.**
- [ ] **Step 6: Verify the two B-sites converted.** Spread-shaped
  `buildEnumBodyElements` / `buildExpressionStatementTuple` with kind-level
  `_delimiter`; `rg '_content_delimiter|_expression_delimiter'
  packages/*/src` returns zero; `enum_body`'s forwarded wrapper now hoists
  the spread surface (`enumBody({ delimiter: 2 }, e1, e2)` type-checks —
  add a factory probe).
- [ ] **Step 7: Re-check the enum_body_elements #170 pin per standard 4.**
  Stash the widening → generated test still fails; reapply → passes; then
  remove the pin from `expectTestFailures` (and the stale "#170" mechanism
  comments at `packages/typescript/grammar.sittir.ts:23-31` referencing the
  old single-field-storage gap).
- [ ] **Step 8: Full gate battery, all three grammars.** Classifier changes
  are cross-grammar: floors byte-identical outside the two touched kinds'
  rows; any OTHER kind newly classifying separatedList is a STOP-and-review
  finding (5b), not a silent accept.
- [ ] **Step 9: Commit.**

---

### Task 3e: rust `tuple_expression` extraction (+ deferred py group1)

**Files:**
- Modify: `packages/rust/grammar.sittir.ts` (~line 296 `tuple_expression`
  patch override) (+ py group1 if deferred from Task 3c)
- Regenerate: rust (+ python)

**Interfaces:**
- Consumes: Task 3d's comma-terminated shape recognition (pin iii).
- Produces: kind `tuple_expression_elements`; `tuple_expression` keeps
  `attributes` + the list-node slot (multi-slot parent, config factory, NO
  hoisting): `buildTupleExpression({ attributes, elements:
  buildTupleExpressionElements({ delimiter: 2 }, e1, e2) })`.

- [ ] **Step 1: Extraction rewrite.** Confirm the base rule's tail from
  `packages/rust/.sittir/src/grammar.json` first (the dump at design time
  showed `'(' attrs (elem ',')+ … ` — verify the optional final element
  member), then mirror it verbatim inside the hidden rule:

```ts
_tuple_expression_elements: ($) =>
	seq(
		seq(field('element', $._expression), ','),
		repeat(seq(field('element', $._expression), ',')),
		optional(field('element', $._expression))
	),
tuple_expression: ($) =>
	seq(
		'(',
		field('attributes', repeat($.attribute_item)),
		alias($._tuple_expression_elements, 'tuple_expression_elements'),
		')'
	),
```

  (replaces the `tuple_expression: { 1: field('attributes'),
  '(_expression)': field('elements') }` patch entry).
- [ ] **Step 2: Single-element validity invariant.** With the comma-
  terminated shape classified, `emitSeparatedListFactory` must emit the
  spec's asserted invariant for this kind: one element REQUIRES the
  trailing delimiter (`(1,)` vs parenthesized `(1)`). Emit the assert in
  the factory body when the kind's shape is comma-terminated:

```ts
// generated shape, inside _buildTupleExpressionElements:
if (elements.length === 1 && ((options.delimiter ?? 0) & 2) === 0) {
	throw new Error('tuple_expression_elements: a single element requires delimiter: 2 (trailing) — `(x,)`');
}
```

  Driven by a model fact stamped at classification (the shape class), not a
  kind-name special case.
- [ ] **Step 3: Regenerate, rebuild, probe.** `(1,)`, `(1, 2)`, `(1, 2,)`,
  `(#[attr] 1, 2)` through render-parse; the `(1,)` corpus row is EXPECTED
  to flip green — closes the deferred single-element-tuple regression;
  floors ratchet up only, movement explained.
- [ ] **Step 4: Gate battery + commit.**

---

### Task 4: cleanup + ratchets

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (~600-790),
  `packages/codegen/src/emitters/wrap.ts` (per-field flank capture),
  `rust/crates/sittir-core/src/filters.rs`, `packages/tools/src/validate/*`,
  `docs/KNOWN_ISSUES.md`, the spec's status line
- Regenerate: all three grammars (codegen edits)

- [ ] **Step 1: Delete the per-field flank machinery — now occupant-free.**
  `flankOptionField` / `hasFlankOptions` / `flankOptionsType` /
  `delimiterSourceFor` and the `options` threading in
  `emitFieldCarryingFactory` (factories.ts:646-650, 711-732, 741-786,
  806-824); `emitFieldFlankCaptureLines` reduces to nothing (wrap.ts);
  `delimiterUnionFor` stays (used by `emitSeparatedListFactory`). Verify
  first: `rg 'delimiter\?' packages/*/src/factories.ts` shows only
  spread-shaped kinds.
- [ ] **Step 2: Prove the sittir-core anon-matching fallback dead, then
  delete it.** `flank_match` / `trailing_anon` / `leading_anon` in
  `rust/crates/sittir-core/src/filters.rs` (~12 sites) + the `FlankValues`
  anon arm: instrument or trace that `xs.trailing()` from the
  `_delimiter`-populated view wins at every call site across a full
  `validate:native` run of all three grammars, THEN delete. A hit is a
  STOP-and-review finding (5b).
- [ ] **Step 3: Delete `separatedListFactoryOptions`** (validator suffix
  discovery) and any remaining `_<field>_delimiter` handling in
  validate/common + exercise/roundtrip.
- [ ] **Step 4: Audits at zero.**

```bash
rg '_\w+_(trailing|leading)_sep' packages/*/src/wrap.ts   # → zero
rg '_\w+_delimiter' packages/*/src                        # → zero
```

- [ ] **Step 5: Docs.** Delete `ki-perfield-flank-residual` from
  `docs/KNOWN_ISSUES.md`; update the spec's status to realized; sweep
  `docs/` for `_<field>_delimiter` / flank-vocabulary stragglers (spec-DRY
  audit rule).
- [ ] **Step 6: Full battery (all grammars) + commit.**

---

## Self-review (spec coverage)

- One spelling / struct on the list → Tasks 3b-3e (realify + reclassify);
  Task 4 deletes the residue.
- Wire shape = view shape → kind-level `_content`/`_delimiter` everywhere a
  delimiter exists; flat-key reassembly + `separatedListFactoryOptions`
  deleted (Task 4).
- Factory surface (spread + leading options) → landed 3a; B-sites inherit
  it on reclassification (3d).
- Single-slot hoisting → already delivered via forwarded wrappers (3a);
  probed again in 3d Step 6.
- Absorbs ki-perfield-flank-residual + rust tuple family invariant → 3e
  Step 2, Task 4 Step 5.
- Non-goals untouched: no per-element separator possession; permission
  derivation unchanged.
