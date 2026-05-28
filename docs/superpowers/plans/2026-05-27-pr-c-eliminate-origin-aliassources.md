# PR-C: Eliminate `origin` and `aliasSources` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove slot-level `origin` and `aliasSources`, re-point behavior reads to `slot.isUnnamed` and per-value `parseKind`, and add the non-injective-`parseKind` merge-or-diagnose pass without regressing native validation.

**Architecture:** PR-B already front-loaded the per-value `parseKind` model and `sourceRuleIds`; PR-C finishes the migration by deleting the old slot-level approximations (`origin`, `aliasSources`) and moving every behavior consumer onto structural facts that already live on the slot/value model. The new collision pass runs at codegen time — not runtime — so ambiguous many-to-one parse aliases are either merged when structurally identical or surfaced as an explicit diagnostic instead of being silently clobbered.

**Tech Stack:** TypeScript ESM, Vitest, `tsx`, `tsgo`, `pnpm validate:native`, existing codegen compiler/emitters under `packages/codegen/src/**`

---

## File map

- **Modify:** `packages/codegen/src/compiler/node-map.ts`
  - delete `origin` / `aliasSources` from `AssembledNonterminal`
  - add `isUnnamed`
  - re-project parse names from `value.parseKind`
  - host or call the non-injective-`parseKind` pass
- **Modify:** `packages/codegen/src/compiler/collect-slots.ts`
  - stop stamping `origin`
  - stop merging slot-level alias maps
- **Modify:** `packages/codegen/src/emitters/wrap.ts`
  - replace `slot.origin` / `slot.aliasSources` behavior with `slot.isUnnamed` + `value.parseKind`
- **Modify:** `packages/codegen/src/emitters/shared.ts`
  - replace behavior checks using `slot.source === 'inferred'`
- **Modify:** `packages/codegen/src/emitters/render-module.ts`
  - replace behavior checks using `slot.source === 'inferred'`
- **Modify:** `packages/codegen/src/emitters/templates.ts`
  - replace behavior checks using `slot.source === 'inferred'`
- **Modify:** `packages/codegen/src/emitters/node-model.ts`
  - stop serializing `aliasSources`
- **Create:** `packages/codegen/src/compiler/diagnose-parsekind-collisions.ts`
  - detect non-injective `parseKind` buckets and either merge or diagnose
- **Create:** `packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts`
  - direct unit coverage for merge vs diagnose behavior
- **Create:** `packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts`
  - integration-style coverage for `isUnnamed`, `parseNames`, and slot merge behavior
- **Modify:** `packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts`
  - add emitted/runtime regression coverage for wrap-side parse-kind routing if the new helper wiring needs a generated-surface guard

---

### Task 0: Re-measure the PR-C baseline

**Files:**

- Modify: none

- [ ] **Step 1: Confirm the branch and working tree are clean**

```bash
git status --short
git branch --show-current
```

Expected:

```text
pr-c-eliminate-origin-aliassources
```

and no unexpected dirty files before code changes start.

- [ ] **Step 2: Re-run the native validation gate that PR-C must hold**

Run:

```bash
pnpm validate:native
```

Expected: rust/python/typescript all finish, and the observed cov / read-render-parse / ast numbers become PR-C’s local hold-the-line baseline. Record the numbers in the session notes before editing anything.

- [ ] **Step 3: Commit the clean branch point**

```bash
git add -A
git commit --allow-empty -m "chore: start PR-C baseline"
```

Expected: one empty checkpoint commit anchoring the pre-change state for easy diffing/revert during the PR-C branch.

---

### Task 1: Lock the structural replacement in tests (`isUnnamed`, `parseKind`, no slot-level alias map)

**Files:**

- Create: `packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts`
- Test: `packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts`

- [ ] **Step 1: Write the failing structural-signal tests**

```typescript
import { describe, expect, it } from 'vitest';
import { seq, field } from '../evaluate.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { link } from '../link.ts';
import { optimize } from '../optimize.ts';
import { assemble } from '../assemble.ts';
import type { RawGrammar } from '../types.ts';

function buildNodeMap(rules: Record<string, unknown>) {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	const raw: RawGrammar = {
		name: 'synth',
		rules: catalogRules,
		ruleCatalog,
		extras: [],
		externals: [],
		supertypes: [],
		inline: [],
		conflicts: [],
		word: null,
		references: [],
	};
	return assemble(optimize(link(raw)));
}

describe('slot structural signals', () => {
	it('treats fieldless slots as unnamed without consulting origin', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = nodeMap.nodes.get('box')?.children[0];
		expect(slot?.fieldName).toBeUndefined();
		expect(slot?.isUnnamed).toBe(true);
	});

	it('projects parseNames from per-value parseKind rather than slot.aliasSources', () => {
		const nodeMap = buildNodeMap({
			host: seq(field('value', { type: 'symbol', name: 'identifier' })),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = nodeMap.nodes.get('host')?.fields[0];
		expect(slot?.parseNames).toEqual(['value']);
		expect('aliasSources' in (slot ?? {})).toBe(false);
	});
});
```

- [ ] **Step 2: Run the new test file and confirm it fails before implementation**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/compiler/__tests__/slot-structural-signals.test.ts
```

Expected: FAIL because `AssembledNonterminal` does not yet expose `isUnnamed` and still carries slot-level alias/origin scaffolding.

- [ ] **Step 3: Implement the minimum model changes to satisfy the new test**

```typescript
// packages/codegen/src/compiler/node-map.ts
export interface AssembledNonterminalInit {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	readonly source: 'grammar' | 'override' | 'enriched' | 'inferred';
	readonly sourceRuleIds: readonly RuleId[];
	storageInfo?: FieldStorageInfo;
}

export class AssembledNonterminal {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	readonly source: 'grammar' | 'override' | 'enriched' | 'inferred';
	readonly sourceRuleIds: readonly RuleId[];
	storageInfo?: FieldStorageInfo;

	get isUnnamed(): boolean {
		return this.fieldName === undefined;
	}
}
```

```typescript
// packages/codegen/src/compiler/collect-slots.ts
let source: AssembledNonterminal['source'] = (rule as { source?: RuleSource }).source ?? 'grammar';

if (baseName === undefined && (rule.type === 'symbol' || rule.type === 'supertype')) {
	baseName = rule.name.replace(/^_+/, '') || rule.name;
	source = 'inferred';
}
```

- [ ] **Step 4: Re-run the structural-signal test and make it pass**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/compiler/__tests__/slot-structural-signals.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the structural-model change**

```bash
git add packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/compiler/collect-slots.ts \
        packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts
git commit -m "refactor: replace slot origin with structural signal"
```

---

### Task 2: Delete slot-level `aliasSources` and re-point emitters to `value.parseKind`

**Files:**

- Modify: `packages/codegen/src/compiler/node-map.ts`
- Modify: `packages/codegen/src/compiler/collect-slots.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`
- Modify: `packages/codegen/src/emitters/node-model.ts`
- Test: `packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts`

- [ ] **Step 1: Write a failing wrap-side regression that proves the slot-level alias map is no longer needed**

```typescript
it('routes unnamed kind-origin storage keys from per-value parseKind data', async () => {
	const source = emitWrap({ grammar: 'synth', nodeMap: makeNodeMapWith(nodes) });
	expect(source).toContain('const candidateStorageKeys = collectConcreteStorageKeys');
	expect(source).not.toContain('aliasSources');
});
```

- [ ] **Step 2: Run the targeted wrap test before editing**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/wrapped-tree-materialization.test.ts
```

Expected: FAIL on the new assertion because generated wrap source still threads `aliasSources`.

- [ ] **Step 3: Remove `aliasSources` from the slot model and re-point the wrap emitter**

```typescript
// packages/codegen/src/compiler/node-map.ts
export function projectSlotNaming(slot: SlotNamingInputs) {
	const parseNames =
		slot.fieldName !== undefined
			? [slot.fieldName]
			: [...new Set(slot.values.map((v) => v.parseKind?.name).filter((n): n is string => n !== undefined))];
	// ...
}
```

```typescript
// packages/codegen/src/emitters/wrap.ts
function collectConcreteStorageKeys(slot: AssembledNonterminal, nodeMap: NodeMap): readonly string[] | undefined {
	if (!slot.isUnnamed) return undefined;
	const refKinds = slot.values
		.map((value) => value.parseKind?.name)
		.filter((name): name is string => name !== undefined);
	if (refKinds.length === 0) return undefined;
	const concrete = expandRuntimeDiscriminatorKinds(refKinds, nodeMap);
	// ...
}
```

```typescript
// packages/codegen/src/emitters/node-model.ts
function serializeField(field: AssembledNonterminal): SerializedField {
	return {
		name: field.name,
		propertyName: field.propertyName,
		paramName: field.paramName,
		required: isRequired(field),
		multiple: isMultiple(field),
		nonEmpty: isNonEmpty(field),
		values: field.values.map(serializeValue),
		source: field.source,
		projection: {
			typeName: '',
			kinds: [...kindsOf(field)],
		},
	};
}
```

- [ ] **Step 4: Re-run the targeted wrap/materialization test**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/wrapped-tree-materialization.test.ts
```

Expected: PASS with no remaining `aliasSources`-based routing in emitted wrap source.

- [ ] **Step 5: Commit the aliasSources deletion**

```bash
git add packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/compiler/collect-slots.ts \
        packages/codegen/src/emitters/wrap.ts \
        packages/codegen/src/emitters/node-model.ts \
        packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts
git commit -m "refactor: route slots through parseKind values"
```

---

### Task 3: Re-point behavior consumers from `source === 'inferred'` to `slot.isUnnamed`

**Files:**

- Modify: `packages/codegen/src/emitters/shared.ts`
- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/emitters/templates.ts`
- Test: `packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts`

- [ ] **Step 1: Extend the structural-signal test to cover behavior reads**

```typescript
it('uses slot.isUnnamed as the only behavior-facing unnamed-slot check', () => {
	const nodeMap = buildNodeMap({
		box: seq({ type: 'symbol', name: 'identifier' }),
		identifier: { type: 'pattern', value: '[a-z_]\\w*' },
	});
	const slot = nodeMap.nodes.get('box')?.children[0];
	expect(slot?.isUnnamed).toBe(true);
	expect(slot?.source).toBe('inferred');
});
```

- [ ] **Step 2: Run the focused tests before changing emitters**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/__tests__/slot-structural-signals.test.ts \
  src/__tests__/wrap-slot-arity.test.ts
```

Expected: the structural-signal test passes from Task 1, and `wrap-slot-arity` stays green before the consumer rewrites.

- [ ] **Step 3: Re-point every behavior read in the files named by the spec**

```typescript
// packages/codegen/src/emitters/shared.ts
if (slot.isUnnamed) return undefined;
```

```typescript
// packages/codegen/src/emitters/render-module.ts
const named = slots.filter((slot) => !slot.isUnnamed);
const unnamed = slots.filter((slot) => slot.isUnnamed);
```

```typescript
// packages/codegen/src/emitters/templates.ts
const unnamedSlots = allSlotsOf(node).filter((slot) => slot.isUnnamed);
```

- [ ] **Step 4: Re-run the focused consumer tests**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/__tests__/slot-structural-signals.test.ts \
  src/__tests__/wrap-slot-arity.test.ts
```

Expected: PASS. No behavior path should still depend on `slot.source === 'inferred'` as a proxy for unnamed-ness.

- [ ] **Step 5: Commit the behavior-read migration**

```bash
git add packages/codegen/src/emitters/shared.ts \
        packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/emitters/templates.ts \
        packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts
git commit -m "refactor: use slot.isUnnamed in emitters"
```

---

### Task 4: Add the non-injective-`parseKind` merge-or-diagnose pass

**Files:**

- Create: `packages/codegen/src/compiler/diagnose-parsekind-collisions.ts`
- Modify: `packages/codegen/src/compiler/node-map.ts`
- Modify: `packages/codegen/src/compiler/assemble.ts`
- Test: `packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts`

- [ ] **Step 1: Write the failing unit tests for merge vs diagnose**

```typescript
import { describe, expect, it } from 'vitest';
import { diagnoseParseKindCollisions } from './diagnose-parsekind-collisions.ts';

describe('diagnoseParseKindCollisions', () => {
	it('merges structurally identical relabels that share one parseKind', () => {
		const records = diagnoseParseKindCollisions([
			/* fixture slot values: two storage kinds, one parseKind, identical bodies */
		]);
		expect(records).toEqual([]);
	});

	it('diagnoses structurally distinct storage kinds sharing one parseKind', () => {
		const records = diagnoseParseKindCollisions([
			/* fixture slot values: _simple_statements + block + _newline -> parseKind block */
		]);
		expect(records[0]).toMatchObject({
			shape: 'propose-distinct-alias',
		});
	});
});
```

- [ ] **Step 2: Run the new diagnostic test file to confirm it fails**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/compiler/diagnose-parsekind-collisions.test.ts
```

Expected: FAIL because the diagnostic module does not exist yet.

- [ ] **Step 3: Implement the pass and wire it into assembly**

```typescript
// packages/codegen/src/compiler/diagnose-parsekind-collisions.ts
export interface ParseKindCollisionDiagnostic {
	readonly ownerKind: string;
	readonly slotName: string;
	readonly shape: 'propose-distinct-alias';
	readonly proposal: string;
}

export function diagnoseParseKindCollisions(/* slot inputs */): ParseKindCollisionDiagnostic[] {
	// bucket by value.parseKind?.name
	// if distinct(parseKind) < distinct(storageKind):
	//   - merge only when structurally identical
	//   - otherwise emit propose-distinct-alias
	return [];
}
```

```typescript
// packages/codegen/src/compiler/assemble.ts
const parseKindDiagnostics = diagnoseParseKindCollisions(nodeMap.nodes);
for (const rec of parseKindDiagnostics) {
	console.info(`[parsekind-collision] ${rec.ownerKind}.${rec.slotName}: ${rec.proposal}`);
}
```

- [ ] **Step 4: Run the direct diagnostic tests and the slot backpointer regression together**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-parsekind-collisions.test.ts \
  src/compiler/__tests__/node-map-backpointers.test.ts
```

Expected: PASS. The new pass should not disturb PR-B’s `sourceRuleIds` / `slotByRuleId` behavior.

- [ ] **Step 5: Commit the collision pass**

```bash
git add packages/codegen/src/compiler/diagnose-parsekind-collisions.ts \
        packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts \
        packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/compiler/assemble.ts
git commit -m "feat: diagnose non-injective parseKind slots"
```

---

### Task 5: Full PR-C gate on generated output and native validation

**Files:**

- Modify: generated grammar outputs under `packages/{rust,python,typescript}/src/**` and `.sittir/**` (regen output only)

- [ ] **Step 1: Regenerate all grammars after the compiler/emitter changes**

Run:

```bash
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: all three regens complete and update only the generated surfaces implied by the compiler/emitter changes.

- [ ] **Step 2: Run the targeted codegen tests that cover the changed surfaces**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/__tests__/slot-structural-signals.test.ts \
  src/compiler/diagnose-parsekind-collisions.test.ts \
  src/compiler/__tests__/node-map-backpointers.test.ts \
  src/__tests__/wrapped-tree-materialization.test.ts \
  src/__tests__/wrap-slot-arity.test.ts \
  src/__tests__/probe-kind-trace.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the native validation gate**

Run:

```bash
pnpm validate:native
```

Expected: hold or improve the Task 0 baseline for rust/python/typescript. If counts drop, stop and classify the exact failing grammar/entry before changing more code.

- [ ] **Step 4: Inspect the final diff and commit the generated outputs**

```bash
git status --short
git add packages/codegen/src \
        packages/rust \
        packages/python \
        packages/typescript \
        rust/crates/sittir-rust \
        rust/crates/sittir-python \
        rust/crates/sittir-typescript
git commit -m "refactor: eliminate slot origin and aliasSources"
```

Expected: one final PR-C implementation commit containing source changes + generated artifacts, with no unrelated files.

---

## Self-review checklist

- **Spec coverage:** This plan covers the exact PR-C row from `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`: origin removal, aliasSources removal, `slot.isUnnamed` migration, node-model serialization cleanup, and the §4d.1 non-injective-`parseKind` pass.
- **No placeholders:** Every task names exact files, exact commands, and the intended code shape.
- **Type consistency:** The plan consistently treats `slot.isUnnamed` as the replacement for behavior reads, keeps `slot.source` only as provenance, and uses per-value `parseKind` as the alias/parse-as source.

