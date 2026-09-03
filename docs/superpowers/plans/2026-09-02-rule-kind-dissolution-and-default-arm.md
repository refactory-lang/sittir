# Rule-kind dissolution, one patches surface, and a declared default arm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ir.statement.impl({ traitClause: 'std::fmt::Display', … })` type-checks and builds the positive clause, reached by simplifying the grammar DSL on the way: GROUP and VARIANT stop being rule kinds (their facts become rule `annotations`), the `patches:` block becomes the one declarative surface (the `polymorphs:` config and inline `transform()` calls retire), a `defaultArm()` placeholder declares the arm a bare value means, and hoisted forms get from() coercers.

**Architecture:** VARIANT already has no production minter (`variant()` lowers to `annotations.variant`); GROUP is minted at two link sites and read everywhere as one fact, "this hidden rule is a hoisted form" — that fact becomes `annotations.hoisted`, and `HoistedFacts` (never populated beyond `{}`) collapses to a boolean. `polymorphs:` is wire-time sugar over `transform()` with `variant()` patches, so its entries move into `patches` verbatim (appended as the last patch set to keep ordering) and the three phase consumers of the config lose an input they no longer need. `defaultArm()` is a fourth placeholder next to `field()`/`alias()`/`variant()`: it stamps `annotations.defaultArm` on the arm; `deriveValuesForRule` copies it onto the slot value; the slot exposes `defaultArm`; the from emitter passes it to the generated `_resolveOne` as the tie-break when several arms admit the same bare input. Finally `classifyFromEmission` stops withholding coercers from hoisted forms while `bundleEntries` keeps them off the top-level bundle.

**Tech Stack:** TypeScript ESM (`.ts` imports), vitest, `pnpm exec tsx packages/cli/src/cli.ts gen`, Rust render crates.

**Spec:** the user's rulings recorded in `.infigraph/sessions/session_2026-09-02.md` and memory `feedback_transforms_block_single_surface`: patches block is the single declarative surface; escape hatch is rewriting the rule; GROUP/VARIANT dissolve into annotations; `groups:` stays. Earlier ruling: `docs/superpowers/handoffs/2026-09-02-trait-clause-default-arm-handoff.md`.

## Global Constraints

- **Byte-identity is the gate for Tasks 2–5.** After each: regenerate all three grammars (`pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src --tests-dir packages/<g>/tests --no-workspace-check`) and require `git status --short packages/*/src packages/*/tests packages/*/.sittir` to list only `generated.manifest.json` (it hashes codegen sources). Task 5 also changes `grammar.sittir.ts`, so `packages/<g>/.sittir/grammar.js` and `src/grammar.json` must ALSO be byte-identical — that proves the parser did not move. A diff stops the work for review; never revert it.
- Generated outputs are never hand-edited. Codegen vitest and the python suite rewrite `packages/python/.sittir/grammar.js`; regenerate python afterwards.
- No source comments in `packages/codegen/src/`; document in `docs/glossary/<dir>.md` under the qualified name. No spec/plan/PR/task numbers in docs or comments.
- Standing gates before each commit: `pnpm -C packages/codegen run type-check` (clean); `pnpm -C packages/codegen exec vitest run` (15 known failures: baseline-diff, generate, strict-terminal, render-module-emit, roundtrip; 1091 passed). Tasks 6–7 additionally: per package `tsc -p tsconfig.build.json --noEmit`, `run type-check`, `vitest run` (rust 6 known); `validate counts` + `validate history` ×3 with numbers compared (rust 149/149 · 208/208 · 134/137 · 1519; typescript 145/145 · 193/193 · 112/114 · 1202; python 126/126 · 142/142 · 115/116 · 1390).
- Commit by pathspec. Never `TODO.md`, `packages/tools/validation-report.json`, `examples/01-construct-nodes.ts`, `packages/*/node_modules/.vite/**`, untracked `*-roles.scm` / `sittir-role-interfaces-scm-spec.md` / older handoffs. Branch: `fix/example-surface-gaps`.
- `rg`/`grep`/`find` are hook-blocked; use infigraph `search` for code search, `awk` with `(^|[^A-Za-z_])WORD([^A-Za-z_]|$)` (never `\b`) and `sed -n` for exact reads.
- Never trust a "this test is stale" claim: a test that builds a VARIANT/GROUP node is rewritten to the annotation form only after confirming the annotation form reaches the same assertion.

---

### Task 1: Delete the always-empty `polymorphFormKinds` — DONE (`6b65e5d58`)

---

### Task 2: VARIANT is not a rule kind

**Files:**
- Modify: `packages/codegen/src/types/rule-types.ts:7`, `types/rule.ts:8,81,178-182,363,404`
- Modify: `dsl/builders.ts:18,100-140 (interface members),252,427`, `dsl/rule-patterns.ts:32,61,86`, `dsl/rule-transforms.ts:18,63,82,122,192`, `dsl/enrich.ts:2410,2611`
- Modify: `compiler/link.ts:18,398,547,1006,1036,1043,1102,1121,1138,1386,1406,1534,1613,1706,1724,1948,2093,2167,2278,2463-2470,2505`, `compiler/normalize.ts:18,176,365-369,386,426,435,461,487,553,585,639,679,726,772-773`, `compiler/simplify.ts:12,152,258,361`, `compiler/flatten.ts:18,76-77`, `compiler/evaluate.ts:14,496`, `compiler/rule-catalog.ts:18,169,226`, `compiler/collect-slots.ts:13,44,96,447`, `compiler/assemble.ts:15,341,611,892,940,975,1007`, `compiler/variant-structural.ts:2,19,30`, `compiler/model/node-map.ts:13,429-431,438,448,869,1655,1976,2216,2301`
- Modify: `emitters/templates.ts:12,162,294,333,554,940`
- Modify tests: `compiler/__tests__/assemble.test.ts:178,198`, `link.test.ts:623,628`, `normalize.test.ts:232,237`, `simplify-canonical.test.ts:49`, `simplify-universal-shape.test.ts:80,85`, `emitters/__tests__/templates-emitter-emitRule.test.ts:216`
- Docs: `docs/glossary/types.md` (`rule-types.ts::VARIANT`, `rule.ts::VariantRule`), `docs/glossary/compiler-model.md` (`unwrapStructuralPassthroughs`, `classifyTopLevelShape`), `docs/compiler-phase-glossary.md:136`

**Interfaces:**
- Produces: `Rule<P>` union without `VariantRule`; `RuleBuilder` without `variant`; `unwrapStructuralPassthroughs` peels GROUP only (deleted in Task 3).

- [ ] **Step 1: Prove the premise on the real grammars**

Run this probe (scratch `.mts`) — it walks every link-phase rule of the three grammars and counts VARIANT nodes:

```ts
import { buildSimplifiedGrammar } from '<repo>/packages/tools/src/codegen-surface.ts';
for (const g of ['rust', 'typescript', 'python']) {
	const n = await buildSimplifiedGrammar(g);
	const count = JSON.stringify(n).match(/"type":"VARIANT"/g)?.length ?? 0;
	console.log(g, 'VARIANT nodes:', count);
}
```

Expected: 0 · 0 · 0. If not zero, stop: a production minter exists that the census missed.

- [ ] **Step 2: Remove the kind**

Delete `export const VARIANT = 'VARIANT' as const;` and the `VariantRule` type, its member in the `Rule` union, and the `variant` builder from `StructuralBuilder`, `AttributeBuilder`, and `RuleBuilder`. Then at every listed site: a `case VARIANT:` that shares a body with other arms is deleted; `m.type === VARIANT ? m.content : m` becomes `m`; `while (core.type === VARIANT || core.type === OPTIONAL)` becomes `while (core.type === OPTIONAL)`; `unwrapStructuralPassthroughs` loops on GROUP only; normalize's two re-wraps (`branch.type === VARIANT ? { type: VARIANT, … } : flat` and the `nonEmpty.push(...)` twin) become `flat` / `bodyRule`; `simplify.ts:152` (`if (rule.members.some((m) => m.type === VARIANT)) return rule;`) is deleted; `rulesEqual`'s VARIANT arm is deleted; `link.ts::unwrapToStringValue` keeps only the `literalTextOf` line; `classifyTopLevelShape` loses the VARIANT case and the `every VARIANT` line; `flatten.ts` loses its rebuild arm; node-map's three `case 'VARIANT'` string arms go.

- [ ] **Step 3: Rewrite the six tests**

Each fixture builds `{ type: VARIANT, name: 'x', content: R }`. Replace with `{ ...R, annotations: { variant: 'x', variantOf: '<parent kind in that fixture>' } }` and keep the assertion. For `simplify-canonical.test.ts:49` and `simplify-universal-shape.test.ts:80-85` (shape classification of a VARIANT wrapper) delete the case — the shape it tested no longer exists. For `templates-emitter-emitRule.test.ts:216` (`stringifyRule` through a VARIANT) delete the case.

- [ ] **Step 4: Gates**

`pnpm -C packages/codegen run type-check` clean (it is the census: every remaining `.name` on a former VariantRule surfaces here); codegen vitest 15 known; regenerate ×3 → only manifests change.

- [ ] **Step 5: Glossary and commit**

Delete the `VARIANT` / `VariantRule` entries; in `docs/compiler-phase-glossary.md:136` drop `VARIANT` from the wrapper list. Add to `docs/glossary/types.md` under `rule.ts::RuleAnnotations`: "`variant`/`variantOf` are the arm-name fact a `variant()` transform stamps on the arm rule — an annotation, not a wrapper node."

```bash
git add packages/codegen/src docs/glossary docs/compiler-phase-glossary.md packages/*/.sittir/generated.manifest.json
git commit -m "rule model: VARIANT is an annotation, not a rule kind"
```

---

### Task 3: GROUP is `annotations.hoisted`

**Files:**
- Modify: `types/rule-types.ts:9`, `types/rule.ts:10,33-36 (RuleAnnotations),83,254-258,335,364,405`
- Modify: `compiler/link.ts:6,210-219,399,548,726,844,979,1005,1103,1385,1406,1449,1559-1568,1612,1707,1725,1949,2094,2169,2279,2506`, `compiler/normalize.ts:6,177,387,462,488,527,576,595,640,680,727`, `compiler/simplify.ts:4,113-115,257,362`, `compiler/flatten.ts:6,78-79`, `compiler/evaluate.ts:5,497`, `compiler/rule-catalog.ts:6,170,227`, `compiler/collect-slots.ts:5,45,97,448`, `compiler/assemble.ts:5,177-190,218,358-361,612,893,916-918,941,953,976,1008`, `compiler/model/node-map.ts:5,441,870,1426-1475 (HoistedFacts, getters),1484-1487,1605-1657`
- Modify: `dsl/builders.ts` (`group` builder + interface members), `dsl/rule-patterns.ts:20,62,87`, `dsl/rule-transforms.ts:6,64,83,121,193,203-210`, `dsl/enrich.ts:2411,2612`
- Modify: `emitters/templates.ts:4,161,295,334,555,940-942`, `emitters/wrap.ts:468`, `emitters/factories.ts:528,857-859,1141-1146`, `emitters/node-model.ts:231-235`, `emitters/overlays/sub-factories.ts:79-83`, `emitters/shared.ts:812-818`
- Modify tests: `compiler/__tests__/assemble.test.ts:290,316,342`, `simplify-canonical.test.ts:229`, `simplify-group-lift-inline.test.ts:108,168,212,257`, `emitters/__tests__/templates-emitter-emitRule.test.ts:222`
- Docs: glossary entries for `link.ts::classifyHiddenSeqRule`, `link.ts::classifyHiddenRule`, `link.ts::_wouldInlineAtAssemble`, `normalize.ts::isStructurallyMeaningfulHiddenRule`, `rule-transforms.ts::resolveGroupOrMultiInlineTarget`, `assemble.ts::assemble`, `node-map.ts::AbstractAssembledCompound` (hoisted), `NodeEnrichment`, `shared.ts::classifyTemplateEmission`, `sub-factories.ts::kindArmName`, `node-model.ts::serializeNode`; `docs/compiler-phase-glossary.md:136,286`; `packages/tools/src/probe/variant-derivation.ts:41,104,111` wording ("GROUP-classified" → "hoisted")

**Interfaces:**
- Produces: `RuleAnnotations = { variant?, variantOf?, hoisted?: true }`; `NodeEnrichment.hoisted?: true`; `AbstractAssembledCompound.hoisted` unchanged in meaning; `detectToken`/`parentKind`/`overridePassthrough`/`name` getters deleted; `TemplateEmission` without `'skip-polymorph-form-group'`.

- [ ] **Step 1: Prove the dead facts**

Probe on all three grammars: every hoisted node has `enrichment.hoisted` deep-equal `{}`; `packages/*/src/node-model.json5` contains no `detectToken`/`parentKind` key (0 today). Expected: true; this makes the HoistedFacts collapse byte-identical.

- [ ] **Step 2: Link stamps the annotation instead of wrapping**

```ts
// link.ts — both mint sites
function classifyHiddenSeqRule(rule: SeqRule<'link'>): Rule<'link'> {
	return hasAnyField(rule) ? hoist(rule) : rule;
}
// group-lift synthesized kinds (replacing the `if (body && body.type !== GROUP) { rules[synthKind] = { type: GROUP, … } }` block):
if (body && body.annotations?.hoisted !== true) rules[synthKind] = hoist(liftSeparators(body, linkCtx));
// shared, in dsl/rule-attrs.ts:
export function hoist<R extends AnyRule>(rule: R): R {
	return { ...rule, annotations: { ...rule.annotations, hoisted: true } };
}
export const isHoisted = (rule: AnyRule): boolean => rule.annotations?.hoisted === true;
```

`classifyHiddenRule`: `rule.type === GROUP` → `isHoisted(rule)`. `_wouldInlineAtAssemble`: `target.type === GROUP` → `isHoisted(target)`. `isStructurallyMeaningfulHiddenRule`: same. `resolveGroupOrMultiInlineTarget`: `isGroup = isHoisted(target)`; when inlining a hoisted body return it with the annotation stripped (`{ ...target, annotations: { ...target.annotations, hoisted: undefined } }` reduced via a small `unhoist`), so the copy spliced into the parent is not itself "hoisted". `unwrapForMerge`, `unwrapGroupViews`, `peelSeparatedListCore`'s first line, `pickConditionalKey`'s GROUP branch, `topLevelAliasOf`/`extractTopLevelAliasTarget`/`extractTopLevelNamedAliasContent`/`aliasedSymbolWithin`'s GROUP hop: identity (delete the GROUP part). Every `case GROUP:` switch arm: delete. `classifyNode`'s `case GROUP:` merges into the compound path: `if (isHoisted(rule) && isSeparatedListShape(peelSeparatedListCore(rule))) return 'list';` before `compoundModelType(rule)` — keep the exact decision order the old arm had. `classifyTopLevelShape`'s GROUP case: delete. `unwrapStructuralPassthroughs`: delete; its three callers use the rule directly. `assemble.ts:187`: `...(isHoisted(simplifiedRule) ? { hoisted: true } : {})` — verify the stamp survives normalize/simplify to the SimplifiedRule (they spread `...rule`, so it should; the probe in Step 4 proves it).

- [ ] **Step 3: HoistedFacts collapses; dead consumers go**

`node-map.ts`: `NodeEnrichment.hoisted?: true`; `CompoundOpts.hoisted?: true`; delete `HoistedFacts` and the `detectToken`/`name`/`parentKind`/`overridePassthrough` getters; constructor: `const factoryName = opts?.factoryName ?? (opts?.hoisted && kind.startsWith('_') ? … : undefined)` unchanged in effect. `factories.ts`: `typeKind = node.kind`; delete `resolvePolymorphFormVariantName` and the `variantName` locals (they are always undefined — follow each use and remove the branch). `node-model.ts`: `if (node.hoisted) out.name = node.kind;` (drop the two undefined keys). `sub-factories.ts::kindArmName`: drop the hoisted branch (always false). `shared.ts`: delete `'skip-polymorph-form-group'` from `TemplateEmission` and its line in `classifyTemplateEmission`.

- [ ] **Step 4: Tests, gates**

Rewrite the eight fixtures from `{ type: GROUP, name, content: R }` to `hoist(R)` (import from `dsl/rule-attrs.ts`); `simplify-canonical.test.ts:229` wraps N GROUPs to test peeling depth — replace with a single `hoist()` and assert the classification is that of the body. Probe: the classify tool on rust `_impl_item_positive_clause` still says `hoisted: true` (rerun scratchpad `probe-form-from.mts`). type-check clean; vitest 15 known; regen ×3 byte-identical (manifests only).

- [ ] **Step 5: Glossary and commit**

`rule.ts::RuleAnnotations`: "`hoisted` marks a hidden rule that is a form of its parent — a hidden SEQ with a field, or a group-lift synthesized kind. Link stamps it; assemble reads it into the node's `hoisted` stamp; nothing between them re-derives it. It was the GROUP wrapper node." Update the listed entries to say `isHoisted` where they said GROUP; `AbstractAssembledCompound.hoisted`: "true for a form of its parent; the form has no separate name, detect token, or parent pointer — the parent reaches it through the arm the sub-factory derivation names."

```bash
git add packages/codegen/src packages/tools/src/probe/variant-derivation.ts docs/glossary docs/compiler-phase-glossary.md packages/*/.sittir/generated.manifest.json
git commit -m "rule model: GROUP is the hoisted annotation, not a rule kind"
```

---

### Task 4: `polymorphs:` moves into `patches`

**Files:**
- Modify: `packages/{rust,typescript,python}/grammar.sittir.ts` (delete the `polymorphs:` block; each entry becomes a `variant()` patch set appended to that kind's `patches` entry — array form when the kind already has one)
- Modify: `dsl/wire/wire.ts:25,119-121,160,197-215,278-327 (delete polymorph functions; unify parent-fn builder),354-392 (registerHiddenRuleForPlaceholder uses polymorphHiddenName)`, `dsl/index.ts:12`
- Modify: `compiler/types.ts:96 (RawGrammar.polymorphsConfig)`, `compiler/evaluate.ts:366,392,530-538`, `compiler/generate.ts:26,106,112`, `compiler/inline-sets.ts:94-108`, `compiler/normalize.ts:40-44,253,264-267`, `compiler/link.ts:199-205,1962-1983 (deriveSynthesizedName),1985-2060 (validateGroupsConfig polymorph checks),2100-2135`
- Modify tests: `dsl/__tests__/wire.test.ts` (11 mentions), `compiler/__tests__/post-evaluate-invariant.test.ts`, `packages/tools/src/validate/template-coverage.ts:?` (1 mention)
- Docs: `docs/rust-grammar-sittir-glossary.md:116` (`polymorphs` section → fold into `patches`), the typescript/python grammar glossaries if they carry one, `docs/glossary/dsl-wire.md` (`wire`, `WireConfig`, deleted functions), `docs/glossary/compiler.md` (`deriveSynthesizedName`, `validateGroupsConfig`, `buildPolymorphsConfigSkip`)

**Interfaces:**
- Produces: `WireConfig` without `polymorphs`; `WireContext` without `polymorphsConfig`; `RawGrammar` without `polymorphsConfig`; `NormalizeCtx` without `polymorphSkip`; `applyGroupOverrides`/`validateGroupsConfig`/`deriveSynthesizedName` without a `polymorphs` argument; one `buildPatchedParentFn(kind, patchSets, userFn, context)` in `wire.ts`.

- [ ] **Step 1: Prove the three phase consumers are inert on the real grammars**

Probes (one scratch script): (a) for each grammar, `groups` keys ∩ polymorph parents is empty AND no `groups` path has a polymorph path as a prefix within the same kind — so `deriveSynthesizedName`'s polymorph contributions never fire (expected from the census: rust groups keys are hidden-kind or body-pattern entries, ts has one, python two, none under a polymorph parent); (b) `buildPolymorphsConfigSkip(raw.polymorphsConfig)` ⊆ the `variantSkip` normalize derives from `linked.variantChildren` (print the difference; expected empty). If (b) is not empty, the missing names are the finding: report them before continuing (normalize would stop skipping them).

- [ ] **Step 2: One parent-fn builder, correct hidden names**

```ts
// wire.ts — replaces buildTransformParentFn and buildPolymorphParentFn
function buildPatchedParentFn(kind: string, patchSets: readonly PatchMap[], userFn: SittirRuleFn | undefined, context: WireContext): SittirRuleFn {
	const isHidden = kind.startsWith('_');
	return function wiredPatchedParent($, original) {
		const base = userFn ? userFn($, original) : isHidden && context.deposits.has(kind) ? context.deposits.get(kind) : original;
		return (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, ...patchSets);
	};
}
```

`composeOrSynthesizeTransformParents(rules, patches, context)` calls it. Delete `composeOrSynthesizePolymorphParents`, `buildPolymorphParentFn`, `injectHiddenRulePlaceholders`. In `registerHiddenRuleForPlaceholder`, the variant branch uses `polymorphHiddenName(parentKind, value.name)` (today it writes `_${parentKind}_…`, which double-underscores a hidden parent — the polymorph path was masking that). `wire()` no longer reads `cfg.polymorphs`.

- [ ] **Step 3: Rename the block and delete the config path**

The declarative block is `patches`: `WireConfig.transforms` → `WireConfig.patches`, `TransformsConfig` → `PatchesConfig` (and its re-export), `cfg.transforms` → `cfg.patches` in `wire()`, `transforms: {` → `patches: {` in the three `grammar.sittir.ts`, and every grammar-glossary `### \`transforms\`` section → `### \`patches\``. The `dsl/transform/` module and `transform()` function keep their names — they are the mechanism that applies a patch set.


`PolymorphsConfig` type and its re-export; `WireContext.polymorphsConfig`; `drainPolymorphsConfigMetadata`; `RawGrammar.polymorphsConfig`; `buildPolymorphsConfigSkip` and `NormalizeCtx.polymorphSkip` (normalize's `variantSkip` starts from `linked.variantChildren` alone); `applyGroupOverrides`/`validateGroupsConfig`/`deriveSynthesizedName` drop the `polymorphs` argument and the collision checks against it (`deriveSynthesizedName` becomes `[base, discriminator].join('_')`).

- [ ] **Step 4: Move the 27 entries**

For each `polymorphs` entry `kind: { path: name, … }` write `kind: { path: variant('name'), … }` in `patches`. If `patches` already has an entry for the kind, make it an array `[existing, { …variants }]` — the variant map LAST (that is today's order: polymorph patches ran after every transform patch). Keep the comments that explain a path (typescript `class_body`). Delete the `polymorphs:` blocks.

- [ ] **Step 5: Gates**

type-check clean; codegen vitest (rewrite the wire tests that asserted the polymorph lowering to assert the same result through `patches`); regen ×3 → `git status --short packages/*/src packages/*/tests packages/*/.sittir` shows only manifests — in particular `packages/<g>/.sittir/grammar.js`, `src/grammar.json`, `src/node-model.json5` unchanged.

- [ ] **Step 6: Glossary and commit**

`docs/glossary/dsl-wire.md`: `wire` — "the `patches` block is the one declarative surface: `field()`, `alias()`, `variant()`, `defaultArm()` placeholders keyed by path; a kind's entry is a patch map or an array of them applied in order. Hidden rules a placeholder implies (`_kw_<name>`, `_<parent>_<variant>`, `_<alias>`) are registered as deferred deposits." Grammar glossaries: fold the `polymorphs` section into `patches`.

```bash
git add packages/codegen/src packages/rust/grammar.sittir.ts packages/typescript/grammar.sittir.ts packages/python/grammar.sittir.ts packages/tools/src docs packages/*/.sittir/generated.manifest.json
git commit -m "dsl: variants are declared in patches; the polymorphs config is gone"
```

---

### Task 5: No `transform()` inside rules

**Files:**
- Modify: `packages/rust/grammar.sittir.ts:428-437 (_non_special_token),499-503 (_pattern),512-520 (range_expression),529-533 (string_literal),545-549 (raw_string_literal)`, `packages/typescript/grammar.sittir.ts` (`ambient_declaration`)
- Modify: `dsl/dsl-authoring.ts:3,39` (drop the `transform` authoring export), `dsl/authoring-globals.d.ts` if it declares `transform`, `dsl/index.ts:1` stays (the compiler still imports it)
- Docs: `docs/rust-grammar-sittir-glossary.md` sections for the five rules; `docs/glossary/dsl.md` (`dsl-authoring.ts::transform` entry deleted)

- [ ] **Step 1: Convert each site**

- `_pattern`: `patches: { _pattern: { '-1': alias('wildcard_pattern') } }` — the placeholder resolves to `alias($._wildcard_pattern, $.wildcard_pattern)` (hidden `_` + name; `_wildcard_pattern` is authored so no deferred deposit is minted).
- `range_expression`: `{ '-1': alias('range_expression_bare') }`.
- `raw_string_literal`: `{ '0': alias('raw_string_literal_start'), '2': alias('raw_string_literal_end') }`.
- `ambient_declaration` (typescript): `{ '1/0': variant('declaration'), '1/1': variant('global'), '1/2': variant('module') }` — merge with any existing `patches.ambient_declaration` entry as an array.
- `string_literal`: the hidden name (`_string_literal_open`) differs from the visible one (`string_open`), which no placeholder spells — rewrite the rule in `rules:` from the base grammar body (`packages/codegen/src/grammar-shapes/grammar-shape.rust.ts`, rule `string_literal`) with `alias($._string_literal_open, $.string_open)` in place of the opening token.
- `_non_special_token`: it patches then slices members — rewrite the rule in `rules:` as the explicit `choice(...)` the patched-and-sliced result is today (dump the evaluated rule with `sittir tool probe-stages --grammar rust --kind _non_special_token` and transcribe).

- [ ] **Step 2: Remove the authoring export**

Delete the `transform` re-export in `dsl-authoring.ts` (and its global declaration if present) so a `transform(` in a rule body is a type error.

- [ ] **Step 3: Gates**

type-check the grammar files (`pnpm -C packages/rust run type-check`, typescript); regen ×3 → `.sittir/grammar.js`, `src/grammar.json`, `node-model.json5`, and all `src/**` byte-identical (manifests only). A diff in `grammar.json` means a rewrite changed the parser; stop and review.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src packages/rust/grammar.sittir.ts packages/typescript/grammar.sittir.ts docs packages/*/.sittir/generated.manifest.json
git commit -m "dsl: rules are declared or rewritten, never transformed inline"
```

---

### Task 6: `defaultArm()` declares the arm a bare value means

**Files:**
- Create: `dsl/primitives/default-arm.ts`
- Modify: `types/rule.ts:33-36` (`RuleAnnotations.defaultArm?: true`), `dsl/transform/transform.ts` (placeholder resolution), `dsl/wire/wire.ts` (`registerHiddenRuleForPlaceholder` ignores it), `dsl/dsl-authoring.ts` + `authoring-globals.d.ts` (export `defaultArm` beside `variant`), `dsl/index.ts`
- Modify: `compiler/model/node-map.ts:183 (NodeRef.defaultArm?: true),716-771 (deriveValuesForRule copies it),1078-1150 (AssembledNonterminal.defaultArm getter)`
- Modify: `emitters/from.ts:805-870,919-1030,1128-1250`
- Modify: `packages/rust/grammar.sittir.ts` (`patches.impl_item`), `examples/17-dogfood-rust.ts:133-139,224`
- Test: create `dsl/__tests__/default-arm.test.ts`, `emitters/__tests__/default-arm-from.test.ts`
- Docs: `docs/glossary/dsl-primitives.md` (`defaultArm`), `docs/glossary/types.md` (`RuleAnnotations`), `docs/glossary/compiler-model.md` (`NodeRef.defaultArm`, `AssembledNonterminal.defaultArm`), `docs/glossary/emitters.md` (`emitBareRoutingTables`, `emitResolveOneHelper`, `resolveFieldCall`, `buildInternedArrayResolverCall`), `docs/rust-grammar-sittir-glossary.md` (`patches.impl_item`)

**Interfaces:**
- Produces: `defaultArm(): DefaultArmPlaceholder` (`{ __sittirPlaceholder: 'defaultArm' }`); `annotations.defaultArm: true` on the arm rule; `NodeRef.defaultArm?: true`; `AssembledNonterminal.defaultArm: string | undefined` (the storage kind of the flagged value; throws at construction if two values are flagged); generated `_resolveOne<T>(v, leafKinds, branchKinds, defaultArm?: string)`, `_resolveMany` likewise, `_pickArm`, `_leafKindFor`, `_BARE_STRING_ARMS`.

- [ ] **Step 1: Failing tests**

`dsl/__tests__/default-arm.test.ts`: `transform(seq(choice(sym('_a'), sym('_b'))), { '0/0': defaultArm() })` yields members[0].members[0] with `annotations.defaultArm === true` and members[0].members[1] without it; a `defaultArm()` on a non-choice member throws `defaultArm(): path '…' is not a choice arm`.

`emitters/__tests__/default-arm-from.test.ts`: the Task-2 fixture from the earlier plan (`impl` / `_impl_positive` / `_impl_negative` / `identifier`) with the positive arm carrying `annotations: { defaultArm: true }` in the raw rules: the slot `clause` on `impl` has `defaultArm === '_impl_positive'`; the emitted from() contains `_resolveOne<…>(value, _K…, _K…, "_impl_positive")` for `resolveImpl_clause`, contains `function _pickArm(`, and `_BARE_STRING_ARMS` lists `"_impl_positive"` (its bare slot reaches the `identifier` pattern leaf). Without the annotation the call has three arguments.

- [ ] **Step 2: Placeholder → annotation**

```ts
// dsl/primitives/default-arm.ts
export interface DefaultArmPlaceholder { readonly __sittirPlaceholder: 'defaultArm' }
export function isDefaultArmPlaceholder(v: unknown): v is DefaultArmPlaceholder { … }
export function defaultArm(): DefaultArmPlaceholder { return { __sittirPlaceholder: 'defaultArm' as const }; }
```

In `transform.ts::resolvePatch`, before the alias branch: `if (isDefaultArmPlaceholder(patch)) return { ...(originalMember as object), annotations: { ...(originalMember as { annotations?: object }).annotations, defaultArm: true } } as RuntimeRule;` — `applyPath` already fails when the path does not resolve; add the "is a choice arm" check by passing the parent through `applyToMembers` (it knows the container type) or by validating in `applyPathPatches` that the parent of the last segment is a choice. `PatchSet` and the `TransformPatchMap` value type gain the placeholder.

- [ ] **Step 3: Annotation → slot**

`deriveValuesForRule`: factor the four `...variantOf` spreads into one `armFacts(rule)` returning `{ variant?, variantOf?, defaultArm? }` and spread it in all four SYMBOL branches. `NodeRef.defaultArm?: true`. `AssembledNonterminal`:

```ts
	get defaultArm(): string | undefined {
		const flagged = this.values.filter((v) => v.defaultArm === true && isNodeRef(v));
		if (flagged.length > 1) throw new Error(`[assemble] slot '${this.name}' declares ${flagged.length} default arms`);
		return flagged[0] === undefined ? undefined : storageKindOfRef(flagged[0].node);
	}
```

- [ ] **Step 4: Emitter**

`buildInternedArrayResolverCall(prop, leafKinds, branchKinds, fieldMultiple, intern, elementType, defaultArm?)` appends `, ${JSON.stringify(defaultArm)}` when defined; `resolveFieldCall` reads `'defaultArm' in field ? (field as AssembledNonterminal).defaultArm : undefined`. In `emitBareRoutingTables` collect kind NAMES in the closure (`acceptedBy` returns names; ids derived after), emit `_BARE_ACCEPTS` exactly as today, plus `const _BARE_STRING_ARMS: ReadonlySet<string> = new Set([...])` for the kinds whose closure contains a leaf-registry kind (share one `isLeafRegistryKind(kind, node, kindEntries)` predicate with `buildLeafRegistryEntries`). In `emitResolverHelpers` split `_resolveLeafString` into `_leafKindFor` + factory call. In `emitResolveOneHelper`:

```ts
function _pickArm(arms: readonly string[], defaultArm: string | undefined, what: string): string | undefined {
  if (arms.length <= 1) return arms[0];
  if (defaultArm !== undefined && arms.includes(defaultArm)) return defaultArm;
  throw new Error(`_resolveOne: a bare ${what} fits more than one arm: [${arms.join(", ")}]; declare the arm it means (defaultArm())`);
}
// kind route
const arms = branchKinds.filter((b) => _BARE_ACCEPTS[b]?.has(kindId) === true);
const arm = _pickArm(arms, defaultArm, kindName ?? String(kindId));
if (arm !== undefined && _isFromKind(arm)) return _resolveByKind(arm, v) as T;
// string route, replacing the `fwd` pair
const stringArms = branchKinds.filter((b) => _STRING_CAPABLE_BRANCHES.has(b) || _BARE_STRING_ARMS.has(b));
const arm = _pickArm(stringArms, defaultArm, JSON.stringify(v));
if (arm !== undefined && _isFromKind(arm)) return _resolveByKind(arm, v) as T;
```

`_resolveMany` gains and forwards `defaultArm`.

- [ ] **Step 5: Declare it in rust; clean the example**

`patches.impl_item`: the path to the positive-clause arm — determine it with `sittir tool probe-stages --grammar rust --kind impl_item` at the evaluate phase (member 3 is `optional(field('trait_clause', choice(alias…, alias…)))`; wrappers each consume one index segment, so the candidate is `'3/0/0/0'`; the field-name form `'3/trait_clause:/0'` is the readable alternative if `descendThroughNamedField` accepts it through the OPTIONAL). Add `impl_item: { '<path>': defaultArm() }`. Delete the GAP B comments in `examples/17-dogfood-rust.ts`.

- [ ] **Step 6: Gates**

type-check; codegen vitest; regen ×3; `cd rust/crates/sittir-rust && pnpm run build`; per package type-check (examples rust 2 → still 2 until Task 7, because the forms have no coercer yet — the generated `resolveImplItem_traitClause` now carries `"_impl_item_positive_clause"` but `_isFromKind` is false); validate counts identical ×3.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src packages/rust/grammar.sittir.ts examples/17-dogfood-rust.ts docs packages/rust/src packages/rust/tests packages/rust/.sittir packages/typescript/src packages/typescript/tests packages/typescript/.sittir packages/python/src packages/python/tests packages/python/.sittir rust/crates/sittir-rust
git commit -m "dsl: defaultArm() names the arm a bare value on a multi-arm slot means"
```

---

### Task 7: Hoisted forms get a from() coercer

**Files:**
- Modify: `emitters/shared.ts` (`FromEmission`, `classifyFromEmission`), `emitters/overlays/module.ts` (`bundleEntries`), `emitters/from.ts` (delete `#localFormChildCoercers`, `unexported` if unused)
- Test: `emitters/__tests__/hoisted-form-from.test.ts` (fixture as in Task 6's test; assertions: `classifyFromEmission` is `'emit'` for `_impl_positive`; `bundleEntries` excludes it; the from() contains `coerceToImplPositive` and its `_fromMap` row; the overlay wire is `positive: { strict: F.buildImplPositive, coerce: C.coerceToImplPositive }`)
- Docs: `docs/glossary/emitters.md` (`classifyFromEmission`, `bundleEntries`, `FromEmitter.<unknown>` deleted, `FromEmitter.finalize`)

- [ ] **Step 1: Failing test, then the change**

`classifyFromEmission` drops the hoisted line and `'skip-hoisted-form'`; `bundleEntries` adds `if (node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && node.hoisted) continue;`; `from.ts::finalize` iterates `this.#output` only.

- [ ] **Step 2: Gates (full)**

Regen ×3; per package `tsc`, `run type-check` — dogfood examples rust 0 · typescript 0 · python 0; runtime probes:

```ts
const a = ir.statement.impl({ traitClause: 'std::fmt::Display', type: 'SpliceError', content: ir.declarationList.strict() });
a.$render()            // impl std::fmt::Display for SpliceError {}
a.traitClause?.$type   // TSKindId.ImplItemPositiveClause
ir.statement.impl({ traitClause: { kind: 'impl_item_negative_clause', trait: 'Send' }, type: 'X', content: ir.declarationList.strict() }).$render()  // impl !Send for X {}
ir.statement.expression.withSemi.coerce({ kind: 'call_expression', function: 'f', arguments: [] }).$render() // f();
```

Suites: rust 6 known (if examples-verify 17 now passes, note the known failure disappearing); typescript, python green; the three generated `nodes.test.ts`; regenerate python after vitest. `validate counts` + `history` identical ×3 (a drop = a parent slot whose several arms now admit the same bare node; declare its `defaultArm()` or report).

- [ ] **Step 3: Commit, push, close out**

```bash
git add packages/codegen/src docs/glossary/emitters.md packages/rust/src packages/rust/tests packages/rust/.sittir packages/typescript/src packages/typescript/tests packages/typescript/.sittir packages/python/src packages/python/tests packages/python/.sittir
git commit -m "codegen: hoisted forms get a from() coercer; bundles stay on the parent wire"
git push
```

Update the handoff/session: PR #265 example gaps rust 0 · ts 0 · py 0; DSL: one `patches` surface; GROUP/VARIANT dissolved.

---

### Task 8: a path patch preserves the wrappers it descends through

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform-path.ts` (`reconstructWrapper`)
- Test: `packages/codegen/src/dsl/__tests__/` — a patch through a FIELD and through an OPTIONAL keeps every property the wrapper carried

`reconstructWrapper` rebuilds a wrapper by calling the native constructor:
`field(name, newContent)` for a FIELD, `optional(newContent)` for an OPTIONAL.
Both drop every property the original wrapper carried other than `name` and
`content` — `metadata` above all. Only REPEAT/REPEAT1 preserve, through
`reconstructRepeatWithMetadata`. So any path patch that descends through a
field silently strips that field's `metadata.fieldSource`, and nothing
downstream can tell an authored field from an enriched one afterwards.

Found while declaring `arm.default` on rust `impl_item`: the single patch at
`'3/0/0/0'` descends through `field('trait_clause', …)`, and
`metadata: { fieldSource: 'override' }` disappeared from that field in
`grammar.json`. The loss is not new — every existing patch that descends
through a field already suffers it, which is why the committed baseline
absorbs it.

- [ ] **Step 1: Census the reach**

Every patch path with a segment that lands on a FIELD or OPTIONAL, across the
three grammars. Report which of those wrappers carry `metadata` before the
patch runs (instrument `reconstructWrapper`, or diff the evaluated rule with
and without each patch). That set is the blast radius of the fix.

- [ ] **Step 2: Preserve, the way REPEAT already does**

Give FIELD and OPTIONAL the same treatment `reconstructRepeatWithMetadata`
gives REPEAT: rebuild through the native constructor, then restore the
properties the original carried. One helper for all wrapper types rather than
a per-type special case — the repeat variant folds into it.

- [ ] **Step 3: Gate**

Regenerate all three grammars. `grammar.json` WILL change: fields that were
being stripped keep their `metadata`. Confirm `parser.c` is byte-identical
(metadata is sittir-side and must not reach the automaton), and that
`validate counts` and `history` are unchanged. Any generated-source diff is a
real behavior change and stops the work for review — a field whose
`fieldSource` is restored may now classify differently.
