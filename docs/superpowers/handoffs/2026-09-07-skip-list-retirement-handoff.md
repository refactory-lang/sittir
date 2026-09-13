# Handoff — retiring enrich's skip list (classes A and C, then the config key)

Paste from the `---` line down.

---

Follow-on to the choice-separator slice, which landed on
`feat/punctuation-seams` (PR #271, head `462deab3d`, stacked on #270 ← #269).
Read [docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md)
first. Session memory: `get_latest_session` (session_2026-09-07). Governing
spec: `docs/superpowers/specs/2026-09-07-enrich-skip-list-retirement-design.md`
(status header records that class B landed). The choice-separator plan
`docs/superpowers/plans/2026-09-07-choice-separator-spacing.md` is fully
ticked; its Task 8 is the class-B precedent for how an entry leaves the list.

## What landed today (context you will lean on)

- `preference('separator', <kind>)` under a list slot is a `source:
  'separator'` site (`collectSitePreferences`); default REQUIRED; rides
  `SPACING_SITES` under its kind (`SpacingSite.role = 'separator'`,
  `defaultText` stamped at plan time); `checkDefaultArms` AND
  `validateRenderDefaults` skip `<slot>_separator`. Factory option is
  kind-id typed and stamped with the declared default; the WRAP stamps the
  same default on a parsed list with no separator token (needed for
  ts factory-render-parse to stay 1202/1202). `KIND_LITERAL_TEXT` plumbing
  is gone from tools. `gapOf` names a choice-of-literals gap by the LIST
  kind — declare both `<kind>_separator_space_before` (tight) and `_after`.
- Class B: `fieldSeparatedListElements` declines when the element choice
  has a fielded arm (`hasFieldedArm`); `_enum_body_elements` is off
  typescript's skip list; parser `grammar.json` byte-identical.
- The real reason the enum list had no gap was `admitsNoExtras`: any
  token-kind arm in the element CHOICE glued the repeat. A separated repeat
  now admits whitespace unless the rule itself or its separator token is
  tokenized/immediate; unseparated repeats (string/template fragments) keep
  the any-arm rule. Measured: only `_enum_body_elements.content` and
  `extends_type_clause.type` gained sites (the latter output-neutral).
  Expect the same predicate to matter again when other lists come off the
  list — measure with the scratch probe pattern below before assuming.

## What remains: the skip entries, by class

| grammar | entries | class |
| --- | --- | --- |
| typescript | `lexical_declaration`, `variable_declaration`, `object`, `object_pattern`, `array`, `array_pattern`, `arguments` | A |
| rust | `tuple_type`, `trait_bounds`, `function_modifiers` | A |
| python | `string_content` | C |

`_enum_body_elements` (class B) is done. No other entries exist.

### Class A — an override that fields a span enrich already fielded

Mechanism per spec: `resolveFieldPlaceholder` (dsl/transform) already
relabels a uniform sibling field set in place for POSITIONAL patches
(`1: field('properties')`). The typescript entries and `trait_bounds`
predate that rule. Per entry: remove it from `skip`, regenerate the
grammar, hold the gates, read the affected kind's transport and factory
signature. Where the relabel does not cover the collision (path patches
`'(_type)': field('type')`, wildcard `_: field('modifier')`), extend the
relabel to that override form — outer name wins. A surface change on
`object`/`array`/`arguments`/the declarations is a FINDING, not a cost.
Rust's skip comment also names `_where_predicates`,
`_closure_parameters_optional1`, `_use_clauses` as kinds that once
regressed; they are not in the list — the comment goes with the list.

### Class C — verbatim text (`string_content`)

Declare the fact on the rule: a `role` marking the kind verbatim (same
primitive as the indent/newline externals; see python's `role($._indent,
'indent')` in `grammar.sittir.ts`). The walker's `$TEXT` fallback decision
reads it and `applyNodeChoiceFieldWrap` declines on it. Then the name-keyed
exemption goes.

### Then delete the key

`EnrichConfig.skip`, module-level `separatedListEnrichSkip`, and the
mint-candidate skip check in `packages/codegen/src/dsl/enrich.ts`, plus
the three grammars' `skip:` arrays and comments. Unit tests: A (relabel
through path and wildcard overrides), C (verbatim role switches the
walker's fallback). Glossary entries for every touched declaration
(`docs/glossary/dsl.md`, `dsl-transform.md`).

## Gates (run after every entry; a moved number stops for review, never revert)

- Byte gate: `dogfood.ts` in the session scratchpad is LOST between
  sessions. Recreate it first (six renders: `createEngine().render(
  rebuild…())` from `examples/17|18|19-dogfood-*.ts` and their `-strict`
  twins) and capture the baseline at HEAD before editing. Today's sizes:
  rust 2412 B, rust-strict 916 B, ts 479 B, ts-strict 586 B, py 196 B,
  py-strict 205 B.
- `pnpm exec tsx packages/cli/src/cli.ts validate counts` — today: rust
  149/149 207/207 134/137 1517/1517; typescript 145/145 193/193 112/114
  1202/1202; python 126/126 142/142 115/116 1390/1390. It auto-commits a
  `chore(validator)` record.
- Parser shape: dump `packages/<g>/.sittir/src/grammar.json` rules for the
  kind before and after (the grammar executes twice; a DSL-layer change
  that alters the parser rule is a finding).
- `pnpm run type-check`; vitest codegen (1219), tools (278), cli (73), rust
  (719), typescript (563), python (403); `rtk cargo test --workspace
  --exclude sittir-parity-tests` (112); `bash scripts/assert-scope-boundaries.sh`.
- Commits by pathspec; a source-only commit before regen needs
  `--no-verify`; commit generated output separately (`packages/<g>/.sittir`,
  `packages/<g>/src`, `rust/crates/sittir-<g>/{src,index.d.ts,test-fixtures.json}`,
  snapshots). `packages/tools/validation-report.json` is hook-managed; leave it.

## Diagnosis recipes that paid off today

- Which repeated slots would gain/lose spacing sites under a predicate
  change: build the node map in a scratch `.mts` (`evaluate(
  resolveOverridesPath(g))` → `link` → `normalizeGrammar` → `assemble(
  AssembleCtx.from(normalized, tables, undefined, loadGrammarJsonAliasMap(g)))`
  with `deriveGeneratedIdTablesFromParserCSource(parser.c)`), walk
  `nodeMap.normalizedRules` with `RuleWalker.fold`, and compare the old and
  new predicate per `slotByRuleId` entry. Cheaper and exact versus
  regenerating.
- `sittir tool probe-stages --grammar <g> --kind <k> --compact` shows the
  rule at every phase, but its `fields: []` for a list is misleading: dump
  `node.slots` from the scratch node map instead.
- A factory-render-parse drop shows in `sittir tool profile-factory -g <g>
  --ast` (astMismatches), not in `diff-failures`/`probe-factory` (errors).
- `render-module-emit.test.ts` builds its own pipeline; it now passes
  `renderDefaults: raw.renderDefaults` — keep it aligned with `emit.ts`.

## Gotchas (this session)

- BSD sed has no `\|`; use `sed -E` with `|`. Several early "no matches"
  probes were vacuous for that reason.
- Do not check out a source file to verify RED while a regen is running:
  the manifest hashes codegen source at regen time.
- A python `validate counts` or tools run can leave
  `packages/python/.sittir/grammar.js` re-bundled after an enrich edit;
  if the manifest check names it, regenerate python once more.
- `ir.<kind>` (no `.strict`) is a hoisted one-argument wrapper:
  `ir.enumBody(A, B)` drops `B`; use `.strict(A, B)` or pass the built list.
  Recorded as S1 in `docs/factory-surface-issues.md` (which was pruned
  today: L1–L5, X1, X2 re-probed and kept; closed S1/S2 rationale moved to
  the glossary).
- Infigraph's graph was held by the reindex writer; the search fallback
  sentinel `.infigraph/.search-fallback-allowed` was written. Reconnect
  with `/mcp reconnect infigraph` before relying on it.
