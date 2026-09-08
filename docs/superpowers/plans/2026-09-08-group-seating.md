# Group Seating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every group seats on its parent by one of three shapes, decided by a declared `hoisted` stamp and emitted by the overlays, and the node model, validators and example emitter follow that stamp.

**Architecture:** Link stops inferring `hoisted` from rule shape; each minting route stamps `annotations.hoisted` and link collects the set from the annotation. The overlay layer owns all seating: the sub-factory derivation mounts a hoisted kind in any single slot (shape 1), a new splice seating widens a parent's own `strict` for a single group (shape 2), and an elements seating takes an array of group configs (shape 3). The node model serializes the seat decided per slot value; `nodeToConfig` and the factory source emitter consume it.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, the sittir codegen pipeline (`evaluate → link → normalize → assemble → emitters`), tree-sitter grammars under `packages/<g>/grammar.sittir.ts`.

**Spec:** `docs/superpowers/specs/2026-09-08-group-seating-design.md`

## Global Constraints

- Generated outputs are never hand-edited. After any edit under `packages/codegen/src/**`, regenerate all three grammars before running the tools or cli suites:
  ```bash
  for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen -g $g -a -o packages/$g/src --tests-dir packages/$g/tests --skip-ts-chain --no-emit-diff; done
  ```
- Gates are numbers, compared: `pnpm exec tsx packages/cli/src/cli.ts validate counts` must read rust 147/147 · 207/207 · 134/137 · 1517/1517, typescript 143/143 · 193/193 · 112/114 · 1202/1202, python 126/126 · 142/142 · 115/116 · 1390/1390 after every task unless the task says which number moves and why. Parity fixtures stay rust 1486 / typescript 1500 / python 1361.
- A failed gate stops the task for review. Never revert, stash or reset a failing state.
- No explanatory comments in `packages/codegen/src/`; every new or changed declaration gets a `###` entry in `docs/glossary/<dir>.md` (`compiler.md`, `dsl.md`, `emitters.md`, `compiler-model.md`).
- Comments and docs never cite spec, plan, PR or row numbers.
- Commits: `git add <new files>` then `git commit --no-verify -q -m "…" -- <paths>`. Never commit `tsconfig.json`.
- Text search is hook-blocked; write `date +%s > .infigraph/.search-fallback-allowed` in its own Bash call first, or use a python scan.
- The `ir` builder ratchets (rust 274, typescript 253, python 201 callable builders) are re-baselined exactly once, in Task 2, with the departing entries named in the commit message.

---

### Task 1: The hoisted census is a tool

**Files:**
- Create: `packages/tools/src/census/hoisted.ts`
- Create: `packages/cli/src/commands/tool/hoisted-census.ts`
- Modify: `packages/cli/src/commands/tool/index.ts` (register the tool)
- Modify: `packages/cli/tests/commands/tool/index.test.ts` (tool count 29 → 30)
- Modify: `docs/cli-command-glossary.md` (regenerated)
- Test: `packages/tools/tests/census/hoisted.test.ts`

**Interfaces:**
- Produces: `hoistedCensus(model: SerializedNodeModel): HoistedCensus` where `HoistedCensus = { hoisted: string[]; seated: string[]; unseated: string[] }`. `seated` is every hoisted kind that some slot value names as its `seat.kind` (Task 6 adds that field; until then `seated` is computed from the existing overlay derivation, see step 2). Later tasks use `unseated.length` as their gate.

- [ ] **Step 1: Write the failing test**

```ts
// packages/tools/tests/census/hoisted.test.ts
import { describe, it, expect } from 'vitest';
import { hoistedCensus } from '../../src/census/hoisted.ts';

describe('hoistedCensus', () => {
	it('splits hoisted kinds into seated and unseated', () => {
		const model = {
			nodes: [
				{ kind: 'parent', modelType: 'branch', hoisted: false, slots: [
					{ name: 'seat', kinds: ['_parent_arm'], values: [{ seat: { kind: '_parent_arm', shape: 'arm', mount: 'arm' } }] }
				] },
				{ kind: '_parent_arm', modelType: 'branch', hoisted: true, slots: [] },
				{ kind: '_orphan', modelType: 'branch', hoisted: true, slots: [] }
			]
		};
		expect(hoistedCensus(model as never)).toEqual({
			hoisted: ['_orphan', '_parent_arm'],
			seated: ['_parent_arm'],
			unseated: ['_orphan']
		});
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/tools/tests/census/hoisted.test.ts`
Expected: FAIL, module `../../src/census/hoisted.ts` not found.

- [ ] **Step 3: Implement the census**

```ts
// packages/tools/src/census/hoisted.ts
export interface HoistedCensus {
	readonly hoisted: string[];
	readonly seated: string[];
	readonly unseated: string[];
}

interface CensusValue { readonly seat?: { readonly kind: string } }
interface CensusSlot { readonly values?: readonly CensusValue[] }
interface CensusNode { readonly kind: string; readonly hoisted?: boolean; readonly slots?: readonly CensusSlot[] }
export interface CensusModel { readonly nodes: readonly CensusNode[] | Record<string, CensusNode> }

export function hoistedCensus(model: CensusModel): HoistedCensus {
	const nodes = Array.isArray(model.nodes) ? model.nodes : Object.values(model.nodes);
	const hoisted = nodes.filter((n) => n.hoisted === true).map((n) => n.kind).sort();
	const seatedSet = new Set<string>();
	for (const n of nodes) for (const s of n.slots ?? []) for (const v of s.values ?? []) if (v.seat) seatedSet.add(v.seat.kind);
	const seated = hoisted.filter((k) => seatedSet.has(k));
	const unseated = hoisted.filter((k) => !seatedSet.has(k));
	return { hoisted, seated, unseated };
}
```

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run packages/tools/tests/census/hoisted.test.ts`
Expected: PASS.

- [ ] **Step 5: Register the tool**

Add a runner in `packages/tools/src/census/hoisted.ts` that loads the raw model the way `loadNodeModel` in `packages/tools/src/validate/common.ts:1167` does (reuse its JSON5 read of `TYPES_MODULE_PATHS`-relative `node-model.json5`; export the raw-model read from `common.ts` if it is not already exported), and export it from `packages/tools/src/index.ts` next to `emitFactorySource`:

```ts
export async function runHoistedCensus(opts: { grammar: string }): Promise<number> {
	const model = await loadRawNodeModel(opts.grammar);
	const census = hoistedCensus(model);
	process.stdout.write(`${opts.grammar}: hoisted=${census.hoisted.length} seated=${census.seated.length} unseated=${census.unseated.length}\n`);
	for (const kind of census.unseated) process.stdout.write(`  ${kind}\n`);
	return 0;
}
```

```ts
// packages/cli/src/commands/tool/hoisted-census.ts
import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { runHoistedCensus } from '@sittir/tools';

export const hoistedCensus: CommandModule = {
	name: 'hoisted-census',
	describe: 'Count hoisted kinds and list the ones no parent slot seats',
	register: (program) => {
		withGrammar(defineCommand(program, hoistedCensus)).action(async (opts: { grammar?: string }) => {
			const code = await runHoistedCensus({ grammar: opts.grammar ?? 'rust' });
			if (code !== 0) process.exitCode = code;
		});
	}
};
```

Register it in `packages/cli/src/commands/tool/index.ts` (import at line 15, list entry at line 47, next to `emitFactorySource`); bump the count in `packages/cli/tests/commands/tool/index.test.ts` from 29 to 30; regenerate `docs/cli-command-glossary.md` with the script `DEVELOPMENT.md` names for it.

- [ ] **Step 6: Run the tool and record the baseline**

Run: `for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts tool hoisted-census --grammar $g; done`
Expected today (no `seat` field yet, so everything reads unseated): rust `hoisted=33 unseated=33`, typescript `hoisted=40 unseated=40`, python `hoisted=8 unseated=8`. Write those three lines into `packages/tools/hoisted-census-baseline.txt`; it is the ratchet input for Tasks 3, 4, 5 and 6 (unseated may only fall).

- [ ] **Step 7: Run the cli test and commit**

Run: `pnpm exec vitest run packages/cli/tests/commands/tool/index.test.ts packages/tools/tests/census`
Expected: PASS.

```bash
git add packages/tools/src/census/hoisted.ts packages/cli/src/commands/tool/hoisted-census.ts packages/tools/tests/census/hoisted.test.ts packages/tools/hoisted-census-baseline.txt
git commit --no-verify -q -m "feat(tools): hoisted-census tool — hoisted kinds by seated / unseated" -- packages/tools/src/census packages/cli/src/commands/tool packages/cli/tests/commands/tool/index.test.ts packages/tools/tests/census packages/tools/hoisted-census-baseline.txt docs/cli-command-glossary.md
```

---

### Task 2: `hoisted` is a declared annotation; `hasAnyField` retires

**Files:**
- Modify: `packages/codegen/src/types/rule.ts:31-36` (`RuleAnnotations.hoisted?: true`)
- Create: `packages/codegen/src/dsl/annotations.ts` (`withAnnotations` moved out of `transform.ts`, `withHoistedAnnotation`)
- Modify: `packages/codegen/src/dsl/transform/transform.ts` (the three variant-lift paths stamp the arm body BEFORE the prec wrapper — evaluate unwraps prec and drops a wrapper's annotation)
- Modify: `packages/codegen/src/dsl/wire/wire.ts:900-905` (declared `groups:` body stamps, `stampHoistedFn`)
- Modify: `packages/codegen/src/dsl/enrich.ts` (clause groups stamped in place right after the unalias loop — `collapseSingletonMintOrdinals` rereads them after the merge; promoted symbol arms stamped in `mintStructuredChoiceArm`)
- Modify: `packages/codegen/src/compiler/link.ts:64,195-214,1422-1440,2040-2063` (collect from annotation; group lift stamps; no `hasAnyField`)
- Modify: `packages/codegen/src/compiler/assemble.ts` (`classifyNode`: the hoisted shortcut skips an all-text body — a leaf arm keeps its token/pattern class)
- Modify: `packages/codegen/src/emitters/shared.ts` (`isAuthoredCompound`, `isWrapChildrenKind`: hoisted no longer means unnameable to the from() coercer — `ir.visibilityModifier('pub')` must keep routing by keyword text)
- Delete: `hasAnyField` in `packages/codegen/src/dsl/rule-transforms.ts:68-84` and `packages/codegen/src/dsl/__tests__/has-any-field.test.ts`
- Create: `packages/codegen/src/dsl/primitives/group.ts` (`group()` placeholder), export from `packages/codegen/src/dsl/index.ts:5` and `packages/codegen/src/dsl/dsl-authoring.ts:20`
- Modify: `packages/codegen/src/dsl/transform/transform.ts:118-124,476-500` (`PatchValue` + `resolvePatch` lowering)
- Test: `packages/codegen/src/dsl/__tests__/group-annotation.test.ts`, `packages/codegen/src/compiler/__tests__/link-hoisted-annotation.test.ts`

**Interfaces:**
- Produces: `RuleAnnotations.hoisted?: true`; `group(): GroupPlaceholder` (`__sittirPlaceholder: 'group'`); `LinkedGrammar.hoistedKinds` = the names of rules whose `annotations.hoisted === true` after link's rule conversion.

- [ ] **Step 1: Capture the hoisted set before any change**

Run:
```bash
for g in rust typescript python; do python3 - "$g" <<'PY'
import sys,re,json
g=sys.argv[1]; s=open(f'packages/{g}/src/node-model.json5').read()
s=re.sub(r'^\s*//[^\n]*','',s,flags=re.M); s=re.sub(r',(\s*[}\]])',r'\1',s); m=json.loads(s,strict=False)
nodes=m['nodes'] if isinstance(m['nodes'],list) else list(m['nodes'].values())
open(f'/tmp/hoisted-before-{g}.txt','w').write('\n'.join(sorted(n['kind'] for n in nodes if n.get('hoisted')))+'\n')
PY
done
```
(Use the session scratchpad directory instead of `/tmp` when one is listed.) Expected: 33 / 40 / 8 lines.

- [ ] **Step 2: Write the failing DSL test**

```ts
// packages/codegen/src/dsl/__tests__/group-annotation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { group } from '../primitives/group.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

type Annotated = { annotations?: { hoisted?: true } };

describe('group()', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('stamps hoisted on the rule at the empty path', () => {
		const rule = { type: 'SEQ', members: [{ type: 'STRING', value: 'x' }, { type: 'STRING', value: 'y' }] } as unknown as RuntimeRule;
		const out = transform(rule, { '': group() });
		expect((out as unknown as Annotated).annotations?.hoisted).toBe(true);
		expect((out as unknown as { members: unknown[] }).members).toHaveLength(2);
	});

	it('stamps hoisted on an addressed member', () => {
		const rule = { type: 'SEQ', members: [{ type: 'SEQ', members: [{ type: 'STRING', value: 'a' }] }] } as unknown as RuntimeRule;
		const out = transform(rule, { '0': group() });
		expect(((out as unknown as { members: Annotated[] }).members[0]).annotations?.hoisted).toBe(true);
	});
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/group-annotation.test.ts`
Expected: FAIL, `../primitives/group.ts` not found.

- [ ] **Step 4: Add the primitive, the annotation and the lowering**

`packages/codegen/src/types/rule.ts`: add `readonly hoisted?: true;` to `RuleAnnotations`.

```ts
// packages/codegen/src/dsl/primitives/group.ts
export interface GroupPlaceholder {
	readonly __sittirPlaceholder: 'group';
}

export function isGroupPlaceholder(v: unknown): v is GroupPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'group';
}

export function group(): GroupPlaceholder {
	return { __sittirPlaceholder: 'group' as const };
}
```

`packages/codegen/src/dsl/transform/transform.ts`: import `isGroupPlaceholder`/`GroupPlaceholder`; add `| GroupPlaceholder` to `PatchValue`; in `transform()`'s `hasPlaceholderAlias` predicate add `|| isGroupPlaceholder(v)`; in `resolvePatch` add, before the variant branch:

```ts
if (isGroupPlaceholder(patch)) {
	return withAnnotations(originalMember, { hoisted: true });
}
```

Check the empty path: run `pnpm exec tsx -e "import('./packages/codegen/src/dsl/transform/transform-path.ts').then(m => console.log(JSON.stringify(m.parsePath(''))))"`. Expected `[]`. If `applyPath(rule, [], fn)` does not apply `fn` to the root, add that base case to `applyPath` (an empty segment list means the rule itself).

Export `group` from `packages/codegen/src/dsl/index.ts` and `packages/codegen/src/dsl/dsl-authoring.ts` next to `variant`.

- [ ] **Step 5: Run the DSL test**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/group-annotation.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing link test**

```ts
// packages/codegen/src/compiler/__tests__/link-hoisted-annotation.test.ts
import { FIELD, SEQ, STRING, SYMBOL, PATTERN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';

function raw(rules: Record<string, Rule<'evaluate'>>): RawGrammar {
	return {
		name: 'synth', rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [], externals: [], supertypes: [], factoryInline: [], inline: [], conflicts: [], word: null, references: []
	};
}

describe('link hoistedKinds', () => {
	const fielded: Rule<'evaluate'> = {
		type: SEQ,
		members: [{ type: STRING, value: '(' }, { type: FIELD, name: 'x', content: { type: PATTERN, value: '[a-z]+' } }]
	};

	it('collects a hidden rule that carries the hoisted annotation', () => {
		const linked = link(raw({
			root: { type: SEQ, members: [{ type: STRING, value: 'r' }, { type: SYMBOL, name: '_g' }] },
			_g: { ...fielded, annotations: { hoisted: true } } as Rule<'evaluate'>
		}));
		expect([...linked.hoistedKinds]).toEqual(['_g']);
	});

	it('does not hoist a hidden sequence for carrying a field', () => {
		const linked = link(raw({
			root: { type: SEQ, members: [{ type: STRING, value: 'r' }, { type: SYMBOL, name: '_g' }] },
			_g: fielded
		}));
		expect([...linked.hoistedKinds]).toEqual([]);
	});
});
```

- [ ] **Step 7: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/link-hoisted-annotation.test.ts`
Expected: the second case FAILS (`['_g']` received) because `hasAnyField` still hoists it.

- [ ] **Step 8: Collect from the annotation in link**

In `packages/codegen/src/compiler/link.ts`:

- Remove the `hasAnyField` import (line 64).
- In `classifyHiddenRule` (1422-1440) replace the `isSeq` branch's `if (hasAnyField(rule)) ctx.hoistedKinds.add(name);` with `if (rule.annotations?.hoisted === true) ctx.hoistedKinds.add(name);` and keep the early return for a name already in the set. Apply the same annotation check for a non-SEQ hidden rule so a stamped CHOICE or REPEAT body is collected too (put the check first, before the `isEnumChoiceRule` line: `if (rule.annotations?.hoisted === true) ctx.hoistedKinds.add(name);`).
- In `applyGroupOverrides` (2040-2063) stamp the lifted body: `newRules[synName] = { ...liftedBody, annotations: { ...liftedBody.annotations, hoisted: true } };` and delete the `linkCtx.hoistedKinds.add(synthKind)` loop at 207-213 except the `liftSeparators` call, which stays.

Delete `hasAnyField` from `packages/codegen/src/dsl/rule-transforms.ts` and delete `packages/codegen/src/dsl/__tests__/has-any-field.test.ts`.

- [ ] **Step 9: Stamp at the three DSL routes**

- `packages/codegen/src/dsl/transform/transform.ts:310`: `wireRegisterSyntheticRule(hiddenName, withAnnotations(hoistedBody, { hoisted: true }))`.
- `packages/codegen/src/dsl/wire/wire.ts:903`: the declared body is a `RuleFn`; wrap it so its result carries the stamp. Add next to `buildVisibleExternalsRewritingFn`:

```ts
function stampHoistedFn(fn: RuleFn): RuleFn {
	return function (this: unknown, $, previous) {
		const body = fn.call(this, $, previous) as RuntimeRule & { annotations?: Record<string, unknown> };
		return { ...body, annotations: { ...body.annotations, hoisted: true } } as RuntimeRule;
	};
}
```
  and register `rules[hiddenName] = stampHoistedFn(context ? wrapOneRuleFn(hiddenName, value, context) : value);` for the `groups` section only (`injects` bodies are not groups).
- `packages/codegen/src/dsl/enrich.ts:156`: stamp every clause-group body at the merge:

```ts
const stampedClauseGroups = Object.fromEntries(
	Object.entries(clauseGroupRules).map(([name, rule]) => [name, withHoistedAnnotation(rule)])
);
const mergedRules = { ...enrichedRules, ...kwRules, ...stampedClauseGroups };
```
  with `withHoistedAnnotation` a one-liner in `enrich.ts` returning `{ ...rule, annotations: { ...(rule as { annotations?: object }).annotations, hoisted: true } }`.

- [ ] **Step 10: Run the link test and the codegen suite**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/link-hoisted-annotation.test.ts packages/codegen`
Expected: the new test PASSES. Any other failure is isolated by stash-and-rerun before being touched; a test that pinned `hasAnyField` hoisting is updated to stamp the annotation on its fixture instead (search the codegen tests for `hoistedKinds` and `hoisted: true`; the `simplify-group-lift-inline` and `assemble` tests pass the set explicitly and need no change).

- [ ] **Step 11: Regenerate and diff the hoisted set**

Regenerate all three grammars (Global Constraints). Re-run the Step 1 script writing `hoisted-after-<g>.txt` and diff:

Run: `for g in rust typescript python; do diff /tmp/hoisted-before-$g.txt /tmp/hoisted-after-$g.txt && echo "$g identical"; done`
Expected (ruling 2026-09-08: hoisted means a sittir route minted the rule — overlay treatment is driven by annotations, i.e. sittir provenance): 17 kinds LEAVE — the eight upstream hidden sequences (typescript `_number`, the six `_type_query_*`; python `_key_value_pattern`) and nine authored hidden rules a parent reaches only through `alias($._x, $.x)` (rust `_impl_item_positive_clause`, `_impl_item_negative_clause`; typescript `_ambient_declaration_global`, `_ambient_declaration_module`, `_export_statement_equals_export`, `_export_statement_namespace_export`, `_export_statement_type_export`, `_extends_clause_single`; python `_except_clause_as`) — none gets a `patches` entry; they are ordinary hidden rules with flat `ir` entries. 35 kinds ARRIVE: the nine field-less declared groups (rust `_visibility_modifier_pub`, `_visibility_modifier_in_path`, `_type_argument`, `_attributed_parameter`, `_attributed_field_declaration`, `_attributed_enum_variant`, `_attributed_type_parameter`, `_attributed_argument`; python `_yield_from_clause`) and 26 field-less variant arms. Nine of the arms are all-text (rust `_foreign_mod_item_semi`, `_line_comment_content`, `_line_comment_regular_dslash`, `_mod_item_external`, `_pointer_type_const`, `_range_pattern_left_bare`, `_struct_item_unit`; typescript `_meta_property_import_meta`, `_meta_property_new_target`): they are in link's set but keep their token / pattern class and carry no model `hoisted` (`classifyNode`). Any other line in the diff is a finding: stop and review it.

- [ ] **Step 12: A hoisted arm stays reachable by its keyword text**

`packages/codegen/src/emitters/shared.ts`: `isAuthoredCompound` and `isWrapChildrenKind` drop their `!node.hoisted` clause. Without it the from() coercer's `_KEYWORD_BRANCH_BY_TEXT` loses `pub → _visibility_modifier_pub` and `ir.visibilityModifier('pub')` routes the string into the in-path arm (`pub(in pub)`). The examples-verify tests are the gate for this; `validate counts` does not exercise the bare-string route.

- [ ] **Step 13: The declared-group additions are the surface change; gate them**

Run: `pnpm exec tsx packages/cli/src/cli.ts validate counts`
Expected: every number equal to the Global Constraints baseline. If a rust count moved, the moved kind is one of the newly hoisted declared groups and the failure is reviewed, not reverted (the spec predicts they seat as shape 1 or 3; until Tasks 3 and 5 land, a newly hoisted declared group with no mount is unreachable from `ir` but its render and wrap must be unchanged).

Run: `for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts tool hoisted-census --grammar $g; done`
Expected: rust hoisted 46, typescript 32, python 12 (33 + 15 − 2, 40 + 5 − 13, 8 + 6 − 2; the nine all-text arms are leaves and do not count).

Run the `ir` ratchet tests (`pnpm exec vitest run packages/codegen/src/emitters/__tests__/ir-leaf-exposure.test.ts` and the per-package `ir` count tests named there); re-baseline to the new callable counts with the departing entries listed in the commit message: rust `visibilityModifierPub`, `visibilityModifierInPath`, `typeArgument`, `attributedParameter`, `attributedFieldDeclaration`, `attributedEnumVariant`, `attributedTypeParameter`, `attributedArgument`, `attributeInput`, `closureExpressionExpr`, `functionTypeFnForm`, `functionTypeTraitForm`, `macroDefinitionBrace`, `macroDefinitionBracket`, `macroDefinitionParen`; typescript `arrowFunctionParameter`, `exportStatementDefaultFrom`, `forHeaderLhs`, `importClauseDefaultImport`, `importClauseGroup`; python `yieldFromClause`, `withClauseParen`, `suiteBlock`, `sliceGroup`, `exceptClauseList`, `exceptClauseException`. The 17 kinds that leave the hoisted set arrive as flat entries (typescript gains twelve, rust and python two each), so the typescript ceiling RISES; that is the ruling's surface, not new debt. Move every caller of those entries in `examples/` and `packages/*/tests` to the parent (a python scan for the names); the entries return through Tasks 3 and 5 as mounts, not as flat keys.

- [ ] **Step 14: Glossary and commit**

Update `docs/glossary/compiler.md` (`LinkedGrammar.hoistedKinds`, `classifyHiddenRule`, `applyGroupOverrides`), `docs/glossary/dsl.md` (new `group`, `stampHoistedFn`, `withHoistedAnnotation`, the variant lift, remove `hasAnyField`), `docs/glossary/compiler-model.md` (`NodeEnrichment`: the stamp comes from the annotation). Run the full suite once: `pnpm exec vitest run`.

```bash
git add packages/codegen/src/dsl/primitives/group.ts packages/codegen/src/dsl/__tests__/group-annotation.test.ts packages/codegen/src/compiler/__tests__/link-hoisted-annotation.test.ts
git commit --no-verify -q -m "feat(link): hoisted is a declared annotation stamped by every minting route; hasAnyField retired" -- packages/codegen/src packages/typescript/grammar.sittir.ts packages/python/grammar.sittir.ts packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/typescript/tests packages/python/tests rust/crates examples docs/glossary
```

---

### Task 3: Shape 1 — a hoisted kind in any single slot mounts on the parent

**Files:**
- Modify: `packages/codegen/src/emitters/overlays/sub-factories.ts:133-210` (`derive`)
- Test: `packages/codegen/src/emitters/__tests__/sub-factories.test.ts`

**Interfaces:**
- Produces: `subFactoriesOf(parent)` returns an entry for every `NodeRef` value whose node is `hoisted`, in every non-multiple slot of the parent, named by `armNaming`; entries from the existing lone-choice / forwarded / lone-enum paths are unchanged.

- [ ] **Step 1: Write the failing test**

Add to `sub-factories.test.ts`, using its `buildNodeMap` helper:

```ts
function twoChoiceSlotsNodeMap(): NodeMap {
	return buildNodeMap({
		root: { type: SEQ, members: [{ type: STRING, value: 'for' }, { type: SYMBOL, name: 'header' }] },
		header: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'content', content: { type: CHOICE, members: [{ type: SYMBOL, name: '_header_lhs' }, { type: SYMBOL, name: '_header_kind' }] } },
				{ type: FIELD, name: 'operator', content: { type: CHOICE, members: [{ type: STRING, value: 'in' }, { type: STRING, value: 'of' }] } }
			]
		},
		_header_lhs: { type: SEQ, members: [{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } }], annotations: { hoisted: true, variant: 'lhs', variantOf: 'header' } },
		_header_kind: { type: SEQ, members: [{ type: FIELD, name: 'kind', content: { type: STRING, value: 'const' } }, { type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } }], annotations: { hoisted: true, variant: 'kind', variantOf: 'header' } }
	});
}

describe('hoisted arms in a parent with two choice slots', () => {
	it('mounts every hoisted arm under its variant name', () => {
		const nodeMap = twoChoiceSlotsNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('header')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['kind', 'lhs']);
		expect(nodeArmOf(set.entries, 'kind').child.kind).toBe('_header_kind');
		expect(set.entries[0]!.slot.name).toBe('content');
	});
});
```

(If `link` keeps the variant annotation on the SYMBOL ref rather than the rule, put `annotations: { variant, variantOf }` on the two `SYMBOL` members inside the choice instead; `armNaming` reads it off the value.)

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/sub-factories.test.ts`
Expected: FAIL, `entries` is empty (`choiceSlotOf(header)` is undefined because two slots have ≥ 2 values).

- [ ] **Step 3: Widen `derive`**

In `derive`, after `if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return EMPTY;` and before `let slot = choiceSlotOf(node);`, collect the hoisted candidates:

```ts
const hoistedCandidates: Candidate[] = [];
for (const s of node.slots) {
	if (isMultiple(s)) continue;
	const residual = node.slots.filter((f) => f !== s);
	for (const value of s.values) {
		if (!isNodeRef(value)) continue;
		const child = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (child === undefined || child.rawFactoryName === undefined || !isEmitted(child.kind)) continue;
		if (!(child instanceof AbstractAssembledCompound) || !child.hoisted) continue;
		const naming = armNaming(node, value, nodeMap);
		if (naming === undefined) continue;
		const arm: NodeArm = { via: 'node', child, path: [] };
		const entry: SubFactory = { name: naming.name, slot: s, residual, arm };
		hoistedCandidates.push({ ...naming, entry, claimant: claimantOf(entry) });
	}
}
```

Then, wherever `derive` returns `EMPTY` because no lone slot exists, return `resolveCandidates(node, hoistedCandidates, …)` instead when `hoistedCandidates` is non-empty; and where it proceeds with a lone slot, seed `candidates` with the hoisted candidates whose slot is not that lone slot (the lone-slot loop already produces the ones on it, so dedupe by `claimantOf`). `resolveCandidates` takes one `residual`; pass each candidate's own `entry.residual` through by making the collision check read `entry.residual` instead of the shared parameter. Import `AbstractAssembledCompound` from the model.

- [ ] **Step 4: Run the test file**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/sub-factories.test.ts packages/codegen/src/emitters/__tests__/polymorphs-overlay.test.ts packages/codegen/src/emitters/__tests__/test-emitter-sub-factories.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate, type-check, count**

Regenerate all three grammars. Run `pnpm run type-check` (the workspace script) and `validate counts`.
Expected: type-check clean; counts at baseline. Confirm the eleven mounts exist by name in the generated overlays:

Run: `python3 - <<'PY'
import re
want={'rust':['rangePattern\$leftWithRight'],'typescript':['exportStatement\$defaultClauseFrom','exportStatement\$defaultKw','exportStatement\$defaultNsFrom','exportStatement\$defaultStarFrom','exportStatement\$defaultValue','extendsClause\$single','forInStatement\$varKind','forInStatement\$letConstKind','typeQuery\$callExpressionInTypeAnnotation','typeQuery\$memberExpressionInTypeAnnotation']}
for g,names in want.items():
    ov=open(f'packages/{g}/src/factories/overlays/polymorphs.ts').read()
    for n in names: print(g, n, bool(re.search(n, ov)))
PY`
Expected: every line `True`. A `False` means the arm's parent key differs (the `for_header` arms may mount on `forStatement` too, since `_for_header` is inlined into both); print the overlay's `export const` names and correct the expectation from the model, not the other way round.

- [ ] **Step 6: Glossary and commit**

`docs/glossary/emitters.md`: update `sub-factories.ts::derive`'s entry (hoisted candidates come from every single slot; the lone-choice path is for visible arms).

```bash
git commit --no-verify -q -m "feat(overlays): a hoisted kind in any single slot mounts on its parent as a sub-factory" -- packages/codegen/src packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/typescript/tests packages/python/tests rust/crates docs/glossary
```

---

### Task 4: Shape 2 — a single group splices onto the parent's `strict`

**Files:**
- Modify: `packages/codegen/src/emitters/overlays/sub-factories.ts` (add `spliceSeatOf(parent, nodeMap)`)
- Modify: `packages/codegen/src/emitters/overlays/polymorphs.ts:90-160,277-381` (a splice wire per parent; the parent's `strict`/`coerce` are wrapped)
- Modify: `packages/codegen/src/emitters/factories.ts:924-960` (the forwarded wrapper keeps only the direct overload)
- Test: `packages/codegen/src/emitters/__tests__/polymorphs-overlay.test.ts`, `packages/codegen/src/emitters/__tests__/sub-factories.test.ts`

**Interfaces:**
- Produces: `spliceSeatOf(parent, nodeMap): { slot: AssembledNonterminal; group: AbstractAssembledCompound } | undefined` — the parent's one non-multiple slot whose value set is exactly one hoisted, config-shaped kind that is NOT an arm of a choice (the slot has one value). Generated: `export const <parent>: typeof B.<parent> & { strict: (config: <Parent>.Config minus seat & (<Group>.Config | { [k in keyof <Group>.Config]?: never })) => Built }`.

- [ ] **Step 1: Write the failing derivation test**

```ts
describe('spliceSeatOf', () => {
	it('finds the single hoisted group in an optional seat', () => {
		const nodeMap = buildNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'catch' }, { type: SYMBOL, name: 'clause' }] },
			clause: { type: SEQ, members: [{ type: STRING, value: 'catch' }, { type: OPTIONAL, content: { type: SYMBOL, name: '_clause_group' } }, { type: FIELD, name: 'body', content: { type: PATTERN, value: '.+' } }] },
			_clause_group: { type: SEQ, members: [{ type: STRING, value: '(' }, { type: FIELD, name: 'parameter', content: { type: PATTERN, value: '[a-z]+' } }, { type: OPTIONAL, content: { type: FIELD, name: 'type', content: { type: PATTERN, value: '[A-Z]+' } } }, { type: STRING, value: ')' }], annotations: { hoisted: true } }
		});
		const seat = spliceSeatOf(nodeMap.nodes.get('clause')!, nodeMap);
		expect(seat?.group.kind).toBe('_clause_group');
		expect(seat?.slot.name).toBe('clause_group');
	});
	it('returns nothing for a choice of arms', () => {
		const nodeMap = twoChoiceSlotsNodeMap();
		expect(spliceSeatOf(nodeMap.nodes.get('header')!, nodeMap)).toBeUndefined();
	});
});
```

(The seat slot's name is whatever the model derives for an unnamed group child; read it from the failing assertion and pin that.)

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/sub-factories.test.ts`
Expected: FAIL, `spliceSeatOf` is not exported.

- [ ] **Step 3: Implement `spliceSeatOf`**

```ts
export function spliceSeatOf(
	node: AssembledNode,
	nodeMap: NodeMap
): { slot: AssembledNonterminal; group: AbstractAssembledCompound } | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
	const seats = node.slots.flatMap((slot) => {
		if (isMultiple(slot) || slot.values.length !== 1) return [];
		const value = slot.values[0]!;
		if (!isNodeRef(value)) return [];
		const group = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (!(group instanceof AbstractAssembledCompound) || !group.hoisted) return [];
		if (classifyFactoryShape(group, nodeMap) !== 'config') return [];
		return [{ slot, group }];
	});
	return seats.length === 1 ? seats[0] : undefined;
}
```

A parent with two splice seats is left alone here and reported by the census (Task 6) as unseated; there is no such parent in the three grammars today.

- [ ] **Step 4: Write the failing overlay test**

In `polymorphs-overlay.test.ts`, build the `clause` grammar from Step 1 and assert the overlay text:

```ts
it('splices a single optional group onto the parent strict', () => {
	const out = emitPolymorphsOverlay({ nodeMap: clauseNodeMap() });
	expect(out).toContain('const clause$splice =');
	expect(out).toContain("OmitEach<ArgsOf<PF>[0], 'clauseGroup'> & (ArgsOf<CF>[0] | NoneOf<ArgsOf<CF>[0]>)");
	expect(out).toContain('export const clause: typeof B.clause & {');
	expect(out).toContain('strict: clause$splice(B.clause.strict, F.buildClauseGroup)');
});
```

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/polymorphs-overlay.test.ts`
Expected: FAIL on the first `toContain`.

- [ ] **Step 5: Emit the splice seating**

In `polymorphs.ts`:

- `PolymorphWireSet` gains `splice?: { slot: AssembledNonterminal; group: AbstractAssembledCompound }`; `collectPolymorphWires.visit` sets it from `spliceSeatOf(node, nodeMap)` and pushes the parent into `order` when it is defined even with no subs.
- Add to `ERASED_HELPERS` (emitted once):
  ```ts
  'type NoneOf<T> = { [K in keyof T]?: never };',
  ```
- Add `spliceShape(k: string, mergeKeys: readonly string[], m: string): WireShape`, the same partition loop as the config-shaped arm in `shape()` but seating only when a key was routed to `inner`:
  ```ts
  `const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
  `	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & (ArgsOf<CF>[0] | NoneOf<ArgsOf<CF>[0]>)): ReturnType<PF> => {`,
  `		const rest: Record<string, unknown> = {};`,
  `		const inner: Record<string, unknown> = {};`,
  `		let seated = false;`,
  `		for (const [key, value] of Object.entries(_o(config))) {`,
  `			if (${keyTests}) { inner[key] = value; seated = seated || value !== undefined; }`,
  `			else rest[key] = value;`,
  `		}`,
  `		return ${CALL_P}(seated ? { ...rest, ${k}: ${CALL_C}(inner) } : rest);`,
  `	};`
  ```
  `mergeKeys` = the group's slot `configKey`s (reuse `armConfigKeys` by building a synthetic `SubFactory` for the seat, or factor the key list out of it into `configKeysOf(child)`, which both call).
- In `emitPolymorphsOverlay`, for a wire set with `splice`, emit the method, then in the parent block replace the `strict` (and `coerce`, when `coerceEmitted(group)`) entries:
  ```ts
  wireLines.push(`	strict: ${m}(B.${parentKey}.strict, F.${group.rawFactoryName}),`);
  wireTypes.push(`	strict: ${paramFor(`B.${parentKey}.strict`, `F.${group.rawFactoryName}`)} => ReturnType<typeof B.${parentKey}.strict>;`);
  ```
  The spread `...B.<parentKey>` stays first so the wrapped `strict` wins.

- [ ] **Step 6: Run the overlay tests**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/polymorphs-overlay.test.ts packages/codegen/src/emitters/__tests__/sub-factories.test.ts`
Expected: PASS.

- [ ] **Step 7: Move the forwarded parent's config overload into the seating**

The forwarded wrapper in `factories.ts` (`emitFieldCarryingFactory`) serves every forwarded parent — the list forwards (`buildParameters(...elements)`, 35 / 13 / 20 wrappers across the grammars) as much as `buildMatchBlock` — so it is not deleted. It is skipped only when the target is a hoisted, config-shaped group (`forwardsToSeatedGroup`): that parent keeps the direct signature (`buildMatchBlock(value?: T.MatchBlockArms)`), and `spliceSeatOf` returns its seat, so the overlay supplies `ir.matchBlock.strict({ matchArm, lastArm })` through the positional `spliceShape` (a built value or `undefined` passes straight through, anything else is the group's config). No test pinned the prebuilt wrapper. The config-parent `spliceShape` also accepts the parent's own input, because the wrapped `strict` must still satisfy the bundle's signature (`typeof B.<key> & { strict }` is an intersection): the direct spelling with the built group under the seat key stays valid.

- [ ] **Step 8: Regenerate, gate, probe**

Regenerate; `pnpm run type-check`; `validate counts` at baseline; parity fixtures unchanged. Probe:

```bash
pnpm exec tsx -e "
import { ir } from './packages/rust/src/index.ts';
const b = ir.matchBlock.strict({ matchArm: [], lastArm: ir.lastMatchArm.strict({ pattern: ir.identifier('x'), value: ir.identifier('y') }) });
console.log(b.$type);
"
```
Expected: the `match_block` kind id printed, no throw. Then the typescript catch clause, once with `parameter` and once without, rendered through `packages/typescript/src` and re-parsed by the `validate` tool's read path (`sittir tool probe-kind --grammar typescript --kind catch_clause` if that tool renders a factory-built node; otherwise a three-line tsx script like the one above followed by `render`).

Run the census: `tool hoisted-census` (seated is still 0 until Task 6 serializes seats; unseated unchanged, that is expected here).

- [ ] **Step 9: Glossary and commit**

`docs/glossary/emitters.md`: `spliceSeatOf`, `spliceShape`, `NoneOf`, the `PolymorphWireSet.splice` field, and the forwarded wrapper's entry in `factories.ts` (config overload removed).

```bash
git commit --no-verify -q -m "feat(overlays): a single group splices onto its parent's strict with both-or-neither overloads; the forwarded config overload moves into the seating" -- packages/codegen/src packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/typescript/tests packages/python/tests rust/crates docs/glossary
```

---

### Task 5: Shape 3 — a repeated group is an array of its configs

**Files:**
- Modify: `packages/codegen/src/emitters/overlays/sub-factories.ts` (add `elementsSeatOf(parent, nodeMap)`)
- Modify: `packages/codegen/src/emitters/overlays/polymorphs.ts` (elements wire)
- Test: `polymorphs-overlay.test.ts`, `sub-factories.test.ts`

**Interfaces:**
- Produces: `elementsSeatOf(parent, nodeMap): { slot; group }[]` — every multiple slot whose element kinds are exactly one hoisted config-shaped kind. Generated `strict` takes `<Group>.Config[]` (`NonEmptyArray` when the slot is non-empty) in that slot.

- [ ] **Step 1: Write the failing tests**

Derivation:
```ts
it('finds a repeated hoisted group', () => {
	const nodeMap = buildNodeMap({
		root: { type: SEQ, members: [{ type: STRING, value: 'cmp' }, { type: SYMBOL, name: 'comparison' }] },
		comparison: { type: SEQ, members: [{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } }, { type: FIELD, name: 'comparators', content: { type: REPEAT1, content: { type: SYMBOL, name: '_comparison_comparator' } } }] },
		_comparison_comparator: { type: SEQ, members: [{ type: FIELD, name: 'operators', content: { type: CHOICE, members: [{ type: STRING, value: '<' }, { type: STRING, value: '==' }] } }, { type: FIELD, name: 'right', content: { type: PATTERN, value: '[a-z]+' } }], annotations: { hoisted: true } }
	});
	const seats = elementsSeatOf(nodeMap.nodes.get('comparison')!, nodeMap);
	expect(seats.map((s) => [s.slot.name, s.group.kind])).toEqual([['comparators', '_comparison_comparator']]);
});
```
Overlay:
```ts
it('builds each element of a repeated group from its config', () => {
	const out = emitPolymorphsOverlay({ nodeMap: comparisonNodeMap() });
	expect(out).toContain('const comparison$comparators =');
	expect(out).toContain("(config: OmitEach<ArgsOf<PF>[0], 'comparators'> & { comparators: ReadonlyArray<ArgsOf<CF>[0]> })");
	expect(out).toContain('comparators: (config.comparators as readonly unknown[]).map((e) => _c(child)(e))');
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/sub-factories.test.ts packages/codegen/src/emitters/__tests__/polymorphs-overlay.test.ts`
Expected: FAIL (`elementsSeatOf` not exported; overlay text absent).

- [ ] **Step 3: Implement**

`elementsSeatOf`: same as `spliceSeatOf` with `isMultiple(slot)` required instead of excluded, returning every such slot (a parent may have two element seats; each gets its own wire, composed in slot order).

`elementsShape(k, m)`:
```ts
`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & { ${k}: ReadonlyArray<ArgsOf<CF>[0]> }): ReturnType<PF> =>`,
`		${CALL_P}({ ..._o(config), ${k}: (config.${k} as readonly unknown[]).map((e) => ${CALL_C}(e)) });`
```
Wire it into the parent block exactly as the splice wire, composing over an already-wrapped `strict` when the parent also has a splice seat (`m2(m1(B.p.strict, F.g1), F.g2)`). For a `nonEmpty` slot the parameter type uses `NonEmptyArray<ArgsOf<CF>[0]>` (import from `../../utils.js` as the raw factories do).

- [ ] **Step 4: Run the tests, regenerate, gate**

Run the two test files: PASS. Regenerate; `pnpm run type-check`; `validate counts` at baseline. Probe python:

```bash
pnpm exec tsx -e "
import { ir, render } from './packages/python/src/index.ts';
const n = ir.comparisonOperator.strict({ left: ir.identifier('x'), comparators: [{ operators: 'EqEq' as never, primaryExpression: ir.identifier('y') }] });
console.log(render(n));
"
```
(Spell `operators` as the generated Config demands, `TSKindId.EqEq` from `packages/python/src/types.ts`.) Expected: `x == y`.

- [ ] **Step 5: Glossary and commit**

`docs/glossary/emitters.md`: `elementsSeatOf`, `elementsShape`, wire composition order.

```bash
git commit --no-verify -q -m "feat(overlays): a repeated group seats as an array of its configs on the parent's list slot" -- packages/codegen/src packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/typescript/tests packages/python/tests rust/crates docs/glossary
```

---

### Task 6: The node model serializes the seat per slot value

**Files:**
- Modify: `packages/codegen/src/emitters/node-model.ts:40-50,237-260` (`SerializedValue.seat`)
- Modify: `packages/codegen/src/emitters/overlays/sub-factories.ts` (add `seatOf(parent, slot, value, nodeMap)`)
- Modify: `packages/tools/hoisted-census-baseline.txt`
- Test: `packages/codegen/src/emitters/__tests__/node-model-emit.test.ts`, `packages/tools/tests/census/hoisted.test.ts` (already reads `seat`)

**Interfaces:**
- Produces: `SerializedValue.seat?: { kind: string; shape: 'arm' | 'splice' | 'elements'; mount?: string }`; `seatOf` returns that from `subFactoriesOf` (arm + mount name), `spliceSeatOf` (splice) and `elementsSeatOf` (elements), or `undefined` for a value that is not a hoisted kind. This is the only derivation of the seat; Tasks 7 and 8 consume it.

- [ ] **Step 1: Write the failing test**

In `node-model-emit.test.ts`, using `makeNodeMapWith` or the `buildNodeMap` helper from `polymorphs-overlay.test.ts` (import it, or lift it into `packages/codegen/src/__tests__/helpers/node-map-fixtures.ts` if it is not already there), build the three grammars from Tasks 3, 4 and 5 and assert:

```ts
it('serializes the seat of every hoisted slot value', () => {
	const model = buildNodeModel(twoChoiceSlotsNodeMap());
	const header = model.nodes.find((n) => n.kind === 'header')!;
	const content = header.slots.find((s) => s.name === 'content')!;
	expect(content.values.map((v) => v.seat)).toEqual([
		{ kind: '_header_lhs', shape: 'arm', mount: 'lhs' },
		{ kind: '_header_kind', shape: 'arm', mount: 'kind' }
	]);
	const clause = buildNodeModel(clauseNodeMap()).nodes.find((n) => n.kind === 'clause')!;
	expect(clause.slots.flatMap((s) => s.values).find((v) => v.seat)?.seat).toEqual({ kind: '_clause_group', shape: 'splice' });
	const comparison = buildNodeModel(comparisonNodeMap()).nodes.find((n) => n.kind === 'comparison')!;
	expect(comparison.slots.find((s) => s.name === 'comparators')!.values[0]!.seat).toEqual({ kind: '_comparison_comparator', shape: 'elements' });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/node-model-emit.test.ts`
Expected: FAIL, `seat` undefined.

- [ ] **Step 3: Implement `seatOf` and serialize it**

```ts
export type Seat = { readonly kind: string; readonly shape: 'arm' | 'splice' | 'elements'; readonly mount?: string };

export function seatOf(parent: AssembledNode, slot: AssembledNonterminal, value: NodeOrTerminal, nodeMap: NodeMap): Seat | undefined {
	if (!isNodeRef(value)) return undefined;
	const child = nodeMap.nodes.get(storageKindOfRef(value.node));
	if (!(child instanceof AbstractAssembledCompound) || !child.hoisted) return undefined;
	const arm = subFactoriesOf(parent, nodeMap).entries.find((e) => e.slot === slot && e.arm.via === 'node' && e.arm.child === child && e.arm.path.length === 0);
	if (arm !== undefined) return { kind: child.kind, shape: 'arm', mount: arm.name };
	const splice = spliceSeatOf(parent, nodeMap);
	if (splice !== undefined && splice.slot === slot) return { kind: child.kind, shape: 'splice' };
	if (elementsSeatOf(parent, nodeMap).some((s) => s.slot === slot)) return { kind: child.kind, shape: 'elements' };
	return undefined;
}
```

`node-model.ts`: `serializeSlot(slot, nodeMap)` needs the parent; change its signature to `serializeSlot(parent, slot, nodeMap)` (both callers are in `serializeCompoundNode`), and `serializeValue(v)` to `serializeValue(v, seat)` adding `...(seat === undefined ? {} : { seat })`. Add `seat?: Seat` to `SerializedValue`.

- [ ] **Step 4: Run the test, regenerate, ratchet**

Run the node-model test: PASS. Regenerate. Run the census:

Run: `for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts tool hoisted-census --grammar $g; done`
Expected: unseated 0 / 0 / 0. Any kind still unseated is a finding to review (a parent with two splice seats, or an arm whose name collided); it is not accepted into the baseline. Write the new lines to `packages/tools/hoisted-census-baseline.txt` and add a test in `packages/tools/tests/census/hoisted.test.ts` that loads each grammar's `node-model.json5` and asserts `unseated` is empty.

`validate counts` at baseline (the node model is a projection; nothing in the pipeline reads `seat` yet).

- [ ] **Step 5: Glossary and commit**

`docs/glossary/emitters.md`: `seatOf`, `Seat`, `SerializedValue.seat`, `serializeSlot` signature.

```bash
git commit --no-verify -q -m "feat(node-model): every hoisted slot value serializes its seat (arm/splice/elements) from the overlay derivation" -- packages/codegen/src packages/rust/src packages/typescript/src packages/python/src packages/tools/hoisted-census-baseline.txt packages/tools/tests/census docs/glossary
```

---

### Task 7: The validators project a read node by its seat

**Files:**
- Modify: `packages/tools/src/validate/common.ts:1117-1205` (`LoadedNodeModel.seats`), `:1881-1900` (`declaredSlotNameForKey`), `:2192-2262` (`nodeToConfig`)
- Test: `packages/tools/src/__tests__/node-to-config-seats.test.ts`

**Interfaces:**
- Consumes: `SerializedValue.seat`.
- Produces: `LoadedNodeModel.seats: Record<parentKind, Record<seatKind, Seat & { slot: string }>>`; `nodeToConfig` for a parent whose read child sits in a `splice` seat merges the child's projected config into the parent's; for an `elements` seat keeps each element as its projected config object (no `$type`); for an `arm` seat leaves the child as a node for the dispatcher, which already builds it through the mount because `buildFactoryNodeFromReference` resolves the child kind to `ir.<parent>.<mount>` via the factory map's public-name aliases.

- [ ] **Step 1: Write the failing test**

Model the fixture on `packages/tools/src/__tests__/node-to-config-promotion.test.ts` (it shows how `NodeToConfigOpts` are built with `factorySlots`/`factoryFields`). Three cases:

```ts
it('splices a spliced seat child into the parent config', () => {
	const data = { $type: 'clause', _clause_group: { $type: '_clause_group', _parameter: 'e', _type: 'E' }, _body: 'x' };
	const out = nodeToConfig(data as never, optsWithSeats({ clause: { _clause_group: { kind: '_clause_group', shape: 'splice', slot: 'clauseGroup' } } }));
	expect(out).toEqual({ parameter: 'e', type: 'E', body: 'x' });
});
it('keeps an elements seat child as a config object', () => {
	const data = { $type: 'comparison', _left: 'x', _comparators: [{ $type: '_comparison_comparator', _operators: 7, _right: 'y' }] };
	const out = nodeToConfig(data as never, optsWithSeats({ comparison: { _comparison_comparator: { kind: '_comparison_comparator', shape: 'elements', slot: 'comparators' } } }));
	expect(out).toEqual({ left: 'x', comparators: [{ operators: 7, right: 'y' }] });
});
it('leaves an arm seat child to the dispatcher', () => {
	const data = { $type: 'header', _content: { $type: '_header_kind', _kind: 3, _left: 'i' } };
	const out = nodeToConfig(data as never, optsWithSeats({ header: { _header_kind: { kind: '_header_kind', shape: 'arm', mount: 'kind', slot: 'content' } } }));
	expect(out.content).toMatchObject({ $type: '_header_kind' });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/tools/src/__tests__/node-to-config-seats.test.ts`
Expected: FAIL (`seats` unknown on the options type; first case returns `{ clauseGroup: {...}, body }`).

- [ ] **Step 3: Implement**

- `LoadedNodeModel` gains `seats`, filled in the loader loop (`common.ts:1179-1205`) from each node's slots' values' `seat`, keyed by parent kind then seat kind, with the slot's `name` added.
- `NodeToConfigOpts` gains `seats?: LoadedNodeModel['seats']`; every site that spreads a `LoadedNodeModel` into opts (the `from`, `factory-render-parse` and read-render-parse validators) passes it through.
- In `nodeToConfig`'s named-slot loop, before `declaredSlotNameForKey`: look up `opts.seats?.[parentKind]?.[childKindOf(v)]` (the child's `$type` resolved through `kindNameFromId`, as `resolveChild` does). For `splice`: `Object.assign(out, nodeToConfig(v, memberValueOpts(opts, parentKind, seat.slot)))` and `continue`. For `elements`: map each element through `nodeToConfig` and assign to the seat's slot, `continue`. For `arm`: fall through unchanged.

- [ ] **Step 4: Run the test and the validators**

Run: `pnpm exec vitest run packages/tools/src/__tests__/node-to-config-seats.test.ts packages/tools/src/__tests__/node-to-config-promotion.test.ts`
Expected: PASS.

Run: `pnpm exec tsx packages/cli/src/cli.ts validate counts`
Expected: rust and typescript at baseline; python read-render-parse may RISE (the comparison operator rows that failed on the unbuilt seat now build). Any number that falls is a finding: stop and review.

- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/__tests__/node-to-config-seats.test.ts
git commit --no-verify -q -m "feat(validate): nodeToConfig projects a read child by its seat — splice merges, elements stay configs, arms go to the mount" -- packages/tools/src packages/tools/validation-report.json
```

---

### Task 8: The example emitter prints the three spellings

**Files:**
- Modify: `packages/tools/src/emit/factory-source.ts:19-30,98-110,209-262,322-345,355-400,430-470`
- Modify: `examples/generated-typecheck-ceiling.json`, `examples/{17,18,19}-dogfood-*.generated.ts` (regenerated), `packages/{rust,typescript,python}/tests/examples-verify.test.ts`
- Modify: `docs/factory-surface-issues.md`
- Test: `packages/tools/tests/emit/factory-source-printer.test.ts`, `packages/tools/tests/emit/factory-source-emit.test.ts`

**Interfaces:**
- Consumes: `LoadedNodeModel.seats`.
- Produces: `PrintContext.seats` replaces `hoistedKinds` and `formOfKind`; `printingFactoryMap` prints an arm seat as `ir.<parent>.<mount>.strict({ …parentRest, …armKeys })`, a splice seat by merging the group's printed keys into the parent's object, an elements seat as an array of printed objects without a factory call.

- [ ] **Step 1: Write the failing printer tests**

In `factory-source-printer.test.ts`, one case per shape. Extend the file's `ctx` stubs with ids 11 `header`, 12 `_header_kind`, 13 `clause`, 14 `_clause_group`, 15 `comparison`, 16 `_comparison_comparator`, 20 `const` (`Const`), 21 `of` (`Of`), 22 `==` (`EqEq`), and `irPathOfKind` entries `header: 'ir.header'`, `clause: 'ir.clause'`, `comparison: 'ir.comparison'`. The config printer prints one key per line at depth, so the expectations use the same `\n\t` layout the existing `function_item` case pins:

```ts
const seatCtx: PrintContext = {
	...ctx,
	seats: {
		header: { _header_kind: { kind: '_header_kind', shape: 'arm', mount: 'kind', slot: 'content' } },
		clause: { _clause_group: { kind: '_clause_group', shape: 'splice', slot: 'clauseGroup' } },
		comparison: { _comparison_comparator: { kind: '_comparison_comparator', shape: 'elements', slot: 'comparators' } }
	}
};
const kindIdOf = (k: string) =>
	({ header: 11, _header_kind: 12, clause: 13, _clause_group: 14, comparison: 15, _comparison_comparator: 16, identifier: 3 })[k];
const map = printingFactoryMap(
	{ header: 'config', _header_kind: 'config', clause: 'config', _clause_group: 'config', comparison: 'config', _comparison_comparator: 'config', identifier: 'text' },
	kindIdOf,
	seatCtx
);

it('prints an arm seat as the mount call with the arm keys spliced', () => {
	const printed = map.header!({ content: map._header_kind!({ kind: 20, left: map.identifier!('i') }), operator: 21 });
	expect(printed.source).toBe('ir.header.kind.strict({\n\tkind: TSKindId.Const,\n\tleft: ir.identifier("i"),\n\toperator: TSKindId.Of,\n})');
});
it('prints a splice seat by merging the group keys into the parent', () => {
	const printed = map.clause!({ clauseGroup: map._clause_group!({ parameter: map.identifier!('e'), type: undefined }), body: map.identifier!('b') });
	expect(printed.source).toBe('ir.clause.strict({\n\tparameter: ir.identifier("e"),\n\tbody: ir.identifier("b"),\n})');
});
it('prints an elements seat as inline objects', () => {
	const printed = map.comparison!({ left: map.identifier!('x'), comparators: [map._comparison_comparator!({ operators: 22, right: map.identifier!('y') })] });
	expect(printed.source).toBe('ir.comparison.strict({\n\tleft: ir.identifier("x"),\n\tcomparators: [{\n\t\toperators: TSKindId.EqEq,\n\t\tright: ir.identifier("y"),\n\t}],\n})');
});
```

If the printer's array layout differs from the elements expectation, pin the layout the printer already produces for an array of objects (the `delimTokens` arrays in the rust rebuild show it) rather than changing the printer.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run packages/tools/tests/emit/factory-source-printer.test.ts`
Expected: FAIL (`seats` unknown; sources differ).

- [ ] **Step 3: Implement**

- `PrintContext`: add `seats`, remove `hoistedKinds` and `formOfKind`; `run()` fills `seats` from the loaded model and no longer calls `formsOf(model.polymorphVariants)`.
- `printingFactoryMap`, `config` case: after `wrapTextLeaves`, walk the config's entries; for a `Printed` value whose `kind` is a seat of this parent: `arm` → return `new Printed(id, \`${path}.${seat.mount}.strict(${printValue({ ...rest, ...value.argsObject }, …)})\`)` (keep the arm's unprinted config object on `Printed` as `argsObject` next to `argsSource`, set in the `config` case); `splice` → merge `value.argsObject` into the parent's object; `elements` → the array's `Printed` entries print as their `argsObject`. The `forwarded` case's `absorbed` branch and `printValue`'s hoisted branch are deleted; `materialize`/`seatFormChild` read the seat's `slot` instead of `formOfKind`.
- `irPathResolver` no longer needs `formOfKind`.

- [ ] **Step 4: Run the emit tests, regenerate the examples, measure**

Run: `pnpm exec vitest run packages/tools/tests/emit`
Expected: PASS (the `it.fails` case in `factory-source-emit.test.ts` that pinned the old inline spelling is rewritten to the new one and passes).

Run: `pnpm run gen:examples && pnpm run type-check:generated-examples`
Expected: rust ≤ 19, typescript < 31, python < 10 errors. Write the measured counts to `examples/generated-typecheck-ceiling.json` (only downwards). In the three `examples-verify.test.ts` files, flip the rows naming the parent-factory gap and the no-argument form from `it.fails` to `it`; run them:

Run: `pnpm exec vitest run packages/rust/tests/examples-verify.test.ts packages/typescript/tests/examples-verify.test.ts packages/python/tests/examples-verify.test.ts`
Expected: the flipped rows PASS; every other expected-fail row still fails for its own named reason (a row that unexpectedly passes is flipped too, with its reason recorded in the commit message).

- [ ] **Step 5: Docs and commit**

`docs/factory-surface-issues.md`: mark the parent-factory row and the no-argument form row RESOLVED with the new spellings; `docs/superpowers/handoffs/2026-09-08-strict-rebuild-handoff.md`: the work list and the gate numbers.

```bash
git commit --no-verify -q -m "feat(emit): the factory source emitter prints arm, splice and elements seats from the node model; rebuild ceilings fall" -- packages/tools/src packages/tools/tests examples packages/rust/tests/examples-verify.test.ts packages/typescript/tests/examples-verify.test.ts packages/python/tests/examples-verify.test.ts docs/factory-surface-issues.md docs/superpowers/handoffs/2026-09-08-strict-rebuild-handoff.md
```

---

### Task 9: Closing gates

- [ ] **Step 1: The full three-way verification**

Run, in this order and alone (the collect-baseline test fails under a concurrent type-check):

```bash
pnpm exec tsx packages/cli/src/cli.ts validate counts
pnpm exec tsx packages/cli/src/cli.ts validate history
cargo test --workspace --manifest-path rust/Cargo.toml
pnpm run type-check
pnpm exec vitest run
```
Expected: counts at baseline except the python rise recorded in Task 7; history shows no metric falling; cargo green; type-check clean; the suite green apart from the user's uncommitted `examples/01-construct-nodes.ts` edit if it is still present.

- [ ] **Step 2: Census and ratchets**

`tool hoisted-census`: unseated 0 / 0 / 0. `examples/generated-typecheck-ceiling.json` ≤ the Task 8 values. The `ir` ratchets at the Task 2 baseline.

- [ ] **Step 3: Glossary sweep**

Every declaration touched in Tasks 2 to 8 has a current `###` entry; the entries for `hasAnyField`, `PrintContext.hoistedKinds`, `formsOf` and the forwarded wrapper's config overload are removed or rewritten. No comment in `packages/codegen/src/` was added.
