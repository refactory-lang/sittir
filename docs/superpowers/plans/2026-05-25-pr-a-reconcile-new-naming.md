# PR-A: Reconcile `_new` Naming Getters to Legacy (Divergence → 0) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wide divergence probe that, per grammar, compares every legacy projected slot name against the value recomputed from the inert `_new` naming derivation, then fix `collect-slots.ts` until the probe reports 0 divergences across rust/python/typescript — proving the `_new` derivation can byte-identically replace the legacy one when PR-B promotes `AssembledNonterminal` to a class.

**Architecture:** This is the foundational, behavior-preserving first step of the compiler-simplification strangler (spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`, PR-A row + §2 + §7.7). **No emitter changes** — no emitter reads the `_new` fields yet (verified: only `collect-slots.ts` writes them and `node-map.ts` declares them; `simplify.ts` does not compute them). We add a `tools`-CLI diagnostic (`reconcile-naming`) that builds the full NodeMap via the standard `evaluate → link → optimize → assemble` pipeline, walks every `AssembledNonterminal`, and reports each slot where ANY projected name diverges between the legacy stored value and the value recomputed from `storageNameNew` (per spec finding H1: compare `storageName`, `name→storageName`, the camelCase projections `configKey`/`propertyName`/`paramName`, AND the parse-name set — not just `name`/`storageName`). Then we fix the `_new` derivation in `collect-slots.ts` (driven by probe output) until divergence = 0.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), `tsx` (no build — tsconfig paths resolve `@sittir/*` to source), Vitest, the existing `packages/tools/src/cli.ts` tool registry + codegen `scripts/` delegate pattern, `pnpm validate:native` for the count gate.

---

## Chunk 1: Wide divergence probe + reconcile `_new` to legacy

### Background facts (grounded in current code on branch `029-slot-grouping-diagnostic`)

- **`buildSlot`** (`packages/codegen/src/compiler/collect-slots.ts:316-492`) constructs each `AssembledNonterminal`. It computes BOTH:
  - the **legacy** fields (`collect-slots.ts:458-476`): `name = baseName`, `storageName = baseName`, `configKey = basePropertyName` (= `snakeToCamel(baseName)`), `propertyName` (= `isMultiSlot ? pluralize(configKey) : configKey`), `paramName = safeParamName(propertyName)`. `baseName` is derived by the legacy name logic at `collect-slots.ts:338-406` (fieldName → kind-name-strip-underscore → `sharedArmFieldName` → `'content'`).
  - the **`_new`** fields (`collect-slots.ts:477-491`): `fieldName = rule.fieldName`; `storageNameNew = fieldName ?? (refKindNames.length === 1 ? refKindNames[0] : 'content')`; `nameNew = snakeToCamel(storageNameNew)`; `parseNamesNew = fieldName !== undefined ? [fieldName] : [...new Set([...refKindNames, ...Object.keys(aliasSources)])]`. `refKindNames = kindsOf(slot)`.
- **The `_new` rule (spec §2, parseNames updated 2026-05-26):** `storageName = fieldName ?? single-ref-kind-name (incl. supertype name) ?? 'content'`; `name = snakeToCamel(storageName)`; `parseNames = [fieldName] ?? (ref-kind-names ∪ Object.keys(aliasSources))` (the alias-target union is landed-correct, `type_query` fix `26b8a15c`; spec §2 is being updated to match — see FLAG 1).
- **`_new` is inert:** verified `rg storageNameNew|nameNew|parseNamesNew packages/ --type ts` returns ONLY `node-map.ts` (declares, `:1504-1507`) and `collect-slots.ts` (writes). **Zero emitters read them.** So fixing the `_new` derivation cannot change any of the 1–6 projections — the count gate is guaranteed unchanged, and the probe is the real acceptance test.
- **Slot enumeration:** `allStructuralSlotsOf(node)` (`node-map.ts:3278`) returns every slot for `branch`/`group`/`polymorph` model types (`Object.values(node.slots)`); other model types return `[]`. The NodeMap is `nodeMap.nodes: Map<string, AssembledNode>`.
- **Pipeline build pattern** (copy from `packages/codegen/src/scripts/probe-stages.ts:59-124`): `evaluate(entryPath) → link(raw, undefined) → optimize(linked) → assemble(optimized)`. The entry path is `packages/<grammar>/overrides.ts` when it exists, else the base `grammar.js` (resolver helper at `probe-stages.ts:166-176`). Route phase `console.log`/`console.warn` to stderr so stdout carries only the report (`probe-stages.ts:104-107`).
- **Naming helpers** are exported from `node-map.ts`: `snakeToCamel` (`:343`), `pluralize` (`:352`), `safeParamName` (`:411`), `kindsOf` (`:1526`).
- **Tool registration:** add an entry to the `TOOLS` map in `packages/tools/src/cli.ts:9-38` + a help line; the tool file is a thin wrapper delegating to a codegen `scripts/` module (pattern: `packages/tools/src/discover/provenance.ts` → `packages/codegen/src/scripts/field-provenance.ts`).

### ⚠ FLAGS — current code vs spec PR-A description (surface, do not paper over)

1. **`parseNames` comparison — RESOLVED (2026-05-26).** Spec §2 originally read `parseNames = [fieldName] ?? ref-kind-names`. The current `_new` code (`collect-slots.ts:488-489`) is `fieldName !== undefined ? [fieldName] : [...new Set([...refKindNames, ...Object.keys(aliasSources)])]` — i.e. it ALSO unions the alias TARGET keys in the non-field branch (`collect-slots.ts:483-487`). **This alias-target union is landed-correct** (the `type_query` fix `26b8a15c`, needed for wrap variant-routing); **spec §2 is being updated to match.** The earlier "mismatch" was a *pre-expansion artifact*: the raw `parseNamesNew` list and a `[fieldName] ?? ref-kinds` list differ only by a redundant *source* name that normalization (and the wrap path) drops. **Resolution:** PR-A's probe compares `parseNamesNew` against the CURRENT formula `[fieldName] ?? (ref-kinds ∪ Object.keys(aliasSources))`, with **both sides first normalized through `expandRuntimeDiscriminatorKinds(kinds, nodeMap)`** (`packages/codegen/src/emitters/factory-map.ts:280` — strips a leading `_`, dedupes, and expands a supertype kind into its subtypes). Comparing the **post-expansion storage-key sets** makes the redundant source-name difference a non-divergence. So there is NO open parseNames design question; the probe validates the *current* `_new` field against the *current* formula. (There is no legacy `parseNames` stored field on `AssembledNonterminal` — `parseNamesNew` is net-new; the "legacy" side of this one check is the current formula recomputed in-probe.)

   **Out of scope for PR-A:** the deeper per-value `parseKind` decomposition (`parseNames = values.map(v => v.parseKind.name)`; moving slot `aliasSources` onto a per-value `value.parseKind` kind-ref) is **DEFERRED to PR-B** (adds `kind`/`parseKind` to the value types) **+ PR-C** (removes `aliasSources`). PR-A must NOT reference `value.parseKind` — it does not exist until PR-B.
2. **`simplify.ts` does not compute `_new`.** The PR-A task says "fix the `_new` derivation in `collect-slots.ts` (and `simplify.ts` if it computes `_new` there)". Verified `simplify.ts` does NOT write any `_new` field (its `fieldName` references at `:926/:931/:961` are rule-level leaf attributes, not slot fields). So Task 3 touches `collect-slots.ts` ONLY; the `simplify.ts` clause is a no-op. Flag and skip.

### File structure for this chunk

- **Create:** `packages/codegen/src/scripts/reconcile-naming.ts` — the probe logic (builds NodeMap per grammar, walks slots, computes divergences, prints report). Owns ALL the comparison logic and CLI arg parsing.
- **Create:** `packages/tools/src/validate/reconcile-naming.ts` — thin tools-CLI wrapper delegating to the codegen script (mirrors `packages/tools/src/discover/provenance.ts`).
- **Modify:** `packages/tools/src/cli.ts` — register `reconcile-naming` in `TOOLS` + help text.
- **Create:** `packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts` — unit test: a fixture slot list with a known divergence → probe core reports it; a clean fixture → 0.
- **Modify (Task 3 only, driven by probe):** `packages/codegen/src/compiler/collect-slots.ts:477-491` (the `_new` derivation) until probe = 0.

---

### Task 0: Re-measure the clean baseline (working tree may be dirty)

**Files:** none (measurement only).

- [ ] **Step 1: Confirm branch + stash unrelated dirty fixtures**

Run: `git -C /Users/pmouli/GitHub.nosync/refactory-lang/sittir status --short`
Expected: shows the branch is `029-slot-grouping-diagnostic`. The known-dirty files (`validator/validation-history.jsonl`, the three `rust/crates/sittir-*/test-fixtures.json`) are measurement byproducts — leave them; do not let them mask the baseline. If anything ELSE is dirty in `packages/codegen/src`, stop and ask the user before proceeding.

- [ ] **Step 2: Re-measure the native baseline fresh**

Run: `pnpm validate:native`
Expected (deep `read-render-parsePass`; this is the gate to hold for the whole PR):
```
rust:        cov 181/186   read-render-parse 134/136   ast 125
python:      cov 107/110   read-render-parse  96/115   ast  74
typescript:  cov 174/182   read-render-parse  82/111   ast  75
```
Record the actual numbers observed. If they differ from the spec baseline, note the delta and use the OBSERVED numbers as this PR's gate (the spec says "re-measure clean at the start since the working tree may be dirty"). Do NOT proceed if rust/python/ts counts are clearly degraded vs spec — investigate first.

---

### Task 1: The probe core + unit test (fixture divergence → reported; clean → 0)

**Files:**
- Create: `packages/codegen/src/scripts/reconcile-naming.ts`
- Test: `packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts`

The probe core is split into a **pure, unit-testable** function `diffSlotNames(slot, owningKind, nodeMap)` that compares one slot's projections, and a `run(argv)` CLI shell that builds the NodeMap and aggregates. The unit test targets the pure function with hand-built slot fixtures + a tiny stub NodeMap (`expandRuntimeDiscriminatorKinds` only reads `nodeMap.nodes.get(...)`, returning `undefined` for unknown kinds → treated as a non-supertype passthrough, which is exactly what fixtures need — no pipeline run required).

- [ ] **Step 1: Write the failing unit test**

```typescript
// packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts
/**
 * Unit test for the PR-A wide divergence probe core (`diffSlotNames`).
 *
 * The probe asserts every projected slot name equals the value recomputed
 * from the `_new` derivation (spec finding H1): storageName, name→storageName,
 * configKey/propertyName/paramName (camelCase projections), and the parse-name
 * set. A divergence in ANY projection is reported.
 */
import { describe, it, expect } from 'vitest';
import { diffSlotNames } from '../../scripts/reconcile-naming.ts';
import { snakeToCamel, pluralize, safeParamName } from '../node-map.ts';
import type { AssembledNonterminal, NodeOrTerminal } from '../node-map.ts';
import type { NodeMap } from '../types.ts';

// A stub NodeMap with no nodes — expandRuntimeDiscriminatorKinds(kinds, stub)
// then just normalizes (strip leading `_`, dedupe) every kind as a passthrough
// (no kind resolves to a supertype), which is all the fixtures need.
const STUB_NODE_MAP = { nodes: new Map() } as unknown as NodeMap;

// A single-ref node-ref value (so kindsOf(slot) === ['the_kind']).
function nodeRefValue(kind: string, multiplicity: 'single' | 'array' = 'single'): NodeOrTerminal {
	return { kind: 'node-ref', node: { name: kind } as never, multiplicity } as unknown as NodeOrTerminal;
}

// A fully-consistent slot: legacy fields agree with the _new derivation.
function cleanSlot(): AssembledNonterminal {
	const storage = 'expression';
	const camel = snakeToCamel(storage); // 'expression'
	return {
		name: storage,
		storageName: storage,
		configKey: camel,
		propertyName: camel,
		paramName: safeParamName(camel),
		values: [nodeRefValue('expression')],
		hasTrailing: false,
		hasLeading: false,
		source: 'inferred',
		fieldName: undefined,
		storageNameNew: storage,
		nameNew: camel,
		parseNamesNew: ['expression'],
	} as AssembledNonterminal;
}

describe('diffSlotNames — PR-A wide divergence probe core', () => {
	it('reports nothing for a fully-consistent slot', () => {
		expect(diffSlotNames(cleanSlot(), 'binary_expression', STUB_NODE_MAP)).toEqual([]);
	});

	it('reports a storageName divergence (legacy != storageNameNew)', () => {
		const slot = { ...cleanSlot(), storageName: 'block', name: 'block' } as AssembledNonterminal;
		const out = diffSlotNames(slot, 'function_definition', STUB_NODE_MAP);
		expect(out).toContainEqual(
			expect.objectContaining({
				kind: 'function_definition',
				projection: 'storageName',
				legacy: 'block',
				recomputed: 'expression',
			}),
		);
	});

	it('reports a propertyName divergence (array slot legacy not pluralized)', () => {
		// Multi slot: recomputed propertyName must be pluralize(snakeToCamel(storageNameNew)).
		const storage = 'parameter';
		const slot = {
			...cleanSlot(),
			name: storage,
			storageName: storage,
			configKey: snakeToCamel(storage),
			propertyName: snakeToCamel(storage), // BUG: not pluralized
			paramName: safeParamName(snakeToCamel(storage)),
			values: [nodeRefValue('parameter', 'array')],
			storageNameNew: storage,
			nameNew: snakeToCamel(storage),
			parseNamesNew: ['parameter'],
		} as AssembledNonterminal;
		const out = diffSlotNames(slot, 'parameters', STUB_NODE_MAP);
		expect(out).toContainEqual(
			expect.objectContaining({
				projection: 'propertyName',
				legacy: 'parameter',
				recomputed: pluralize(snakeToCamel(storage)),
			}),
		);
	});

	it('reports a parseNames divergence (post-expansion sets differ)', () => {
		// cleanSlot()'s formula yields ['expression'] (no fieldName → ref-kinds ∪
		// aliasSources, here just ['expression']); a stored ['wrong_kind'] differs
		// even after expansion (neither resolves to a supertype in STUB_NODE_MAP).
		const slot = { ...cleanSlot(), parseNamesNew: ['wrong_kind'] } as AssembledNonterminal;
		const out = diffSlotNames(slot, 'binary_expression', STUB_NODE_MAP);
		expect(out).toContainEqual(expect.objectContaining({ projection: 'parseNames' }));
	});

	it('does NOT report parseNames when sets match only after `_`-normalization', () => {
		// Formula side and stored side differ only by a leading `_` on one name —
		// expandRuntimeDiscriminatorKinds strips it, so the sets are equal.
		const slot = {
			...cleanSlot(),
			values: [nodeRefValue('_expression')], // kindsOf → ['_expression']
			parseNamesNew: ['expression'], // stored without underscore
		} as AssembledNonterminal;
		const out = diffSlotNames(slot, 'binary_expression', STUB_NODE_MAP);
		expect(out.some((d) => d.projection === 'parseNames')).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts`
Expected: FAIL — `Cannot find module '../../scripts/reconcile-naming.ts'` (the script does not exist yet).

- [ ] **Step 3: Write the probe core (`diffSlotNames`) + a CLI shell stub**

```typescript
// packages/codegen/src/scripts/reconcile-naming.ts
/**
 * reconcile-naming — PR-A WIDE divergence probe.
 *
 * For every AssembledNonterminal in each grammar's NodeMap, assert each
 * projected slot name equals the value recomputed from the `_new` derivation
 * (spec finding H1): storageName, name→storageName, configKey/propertyName/
 * paramName (camelCase projections), and the parse-name set. Reports every
 * divergence with the owning kind + slot + the two values, plus a per-grammar
 * divergence count and the first N entries.
 *
 * No emitter reads the `_new` fields yet — this probe is the acceptance test
 * proving PR-B's getter swap will be byte-identical for EVERY projection.
 *
 * ## Usage
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts            # all grammars
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts --grammar rust
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts --first 20 # first-N per grammar
 */
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble } from '../compiler/assemble.ts';
import {
	allStructuralSlotsOf,
	kindsOf,
	snakeToCamel,
	pluralize,
	safeParamName,
	type AssembledNonterminal,
} from '../compiler/node-map.ts';
import { expandRuntimeDiscriminatorKinds } from '../emitters/factory-map.ts';
import type { NodeMap } from '../compiler/types.ts';

const requireFromHere = createRequire(import.meta.url);
const GRAMMARS = ['rust', 'typescript', 'python'] as const;
type Grammar = (typeof GRAMMARS)[number];

export interface Divergence {
	kind: string;
	slot: string; // the legacy slot.name (its current identity)
	projection: 'storageName' | 'name' | 'configKey' | 'propertyName' | 'paramName' | 'parseNames';
	legacy: string;
	recomputed: string;
}

/** True iff any value carries an array/nonEmptyArray multiplicity (multi slot). */
function isMultiSlot(slot: AssembledNonterminal): boolean {
	return slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
}

/**
 * Compare one slot's legacy projected names against the values recomputed from
 * the `_new` derivation (`storageNameNew`). Returns one Divergence per
 * mismatched projection (empty array = fully consistent).
 *
 * Recomputation rules:
 *   storageName := storageNameNew
 *   name        := snakeToCamel(storageNameNew)   (== nameNew)
 *   configKey   := snakeToCamel(storageNameNew)
 *   propertyName:= isMulti ? pluralize(configKey) : configKey
 *   paramName   := safeParamName(propertyName)
 *   parseNames  := slot.fieldName !== undefined
 *                    ? [fieldName]
 *                    : ref-kinds ∪ Object.keys(aliasSources)     (CURRENT formula)
 *
 * The parseNames check compares the two name SETS *after* normalizing BOTH
 * through `expandRuntimeDiscriminatorKinds` (strip leading `_`, dedupe, expand
 * supertypes → subtypes). This drops the redundant *source* name the alias-
 * target union otherwise leaves (plan FLAG 1 RESOLVED 2026-05-26): the alias-
 * target union is landed-correct (`type_query` fix 26b8a15c, wrap variant-
 * routing). The per-value `parseKind` decomposition is OUT OF SCOPE for PR-A
 * (deferred to PR-B/PR-C) — this probe must not reference `value.parseKind`.
 */
export function diffSlotNames(slot: AssembledNonterminal, kind: string, nodeMap: NodeMap): Divergence[] {
	const out: Divergence[] = [];
	const storageNew = slot.storageNameNew ?? '';
	const camel = snakeToCamel(storageNew);
	const propNew = isMultiSlot(slot) ? pluralize(camel) : camel;
	const paramNew = safeParamName(propNew);

	const push = (projection: Divergence['projection'], legacy: string, recomputed: string) => {
		if (legacy !== recomputed) out.push({ kind, slot: slot.name, projection, legacy, recomputed });
	};

	push('storageName', slot.storageName, storageNew);
	push('name', slot.name, camel); // name → snakeToCamel(storageNameNew) (Q1: name is snake today, becomes camel in §2)
	push('configKey', slot.configKey, camel);
	push('propertyName', slot.propertyName, propNew);
	push('paramName', slot.paramName, paramNew);

	// parseNames: the CURRENT formula (ref-kinds ∪ alias-target keys), compared
	// to the stored parseNamesNew as order-insensitive SETS, with both sides
	// normalized through expandRuntimeDiscriminatorKinds first (FLAG 1).
	const formula =
		slot.fieldName !== undefined
			? [slot.fieldName]
			: [...new Set([...kindsOf(slot), ...Object.keys(slot.aliasSources ?? {})])];
	const norm = (kinds: readonly string[]): string =>
		[...new Set(expandRuntimeDiscriminatorKinds(kinds, nodeMap))].sort().join(',');
	const storedParse = norm(slot.parseNamesNew ?? []);
	const formulaParse = norm(formula);
	if (storedParse !== formulaParse) {
		out.push({ kind, slot: slot.name, projection: 'parseNames', legacy: storedParse, recomputed: formulaParse });
	}
	return out;
}

function resolveEntryPath(grammar: Grammar, repoRoot: string): string {
	const overridesPath = resolve(repoRoot, `packages/${grammar}/overrides.ts`);
	if (existsSync(overridesPath)) return overridesPath;
	for (const c of [`tree-sitter-${grammar}/grammar.js`, `tree-sitter-${grammar}/common/define-grammar.js`]) {
		try {
			return requireFromHere.resolve(c);
		} catch {
			/* next */
		}
	}
	throw new Error(`reconcile-naming: could not resolve grammar entry for '${grammar}'`);
}

async function probeGrammar(grammar: Grammar, repoRoot: string): Promise<Divergence[]> {
	const raw = await evaluate(resolveEntryPath(grammar, repoRoot));
	const nodeMap = assemble(optimize(link(raw, undefined)));
	const divergences: Divergence[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		for (const slot of allStructuralSlotsOf(node)) {
			divergences.push(...diffSlotNames(slot, kind, nodeMap));
		}
	}
	return divergences;
}

export async function run(argv: string[]): Promise<number> {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string' },
			first: { type: 'string', default: '10' },
		},
	});
	const repoRoot = resolve(new URL('../../../..', import.meta.url).pathname);
	const first = Number.parseInt(values.first ?? '10', 10);
	const targets: Grammar[] = values.grammar ? [values.grammar as Grammar] : [...GRAMMARS];

	// Phase passes log via console.log/warn — route to stderr so stdout stays clean.
	const origLog = console.log;
	const origWarn = console.warn;
	console.log = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');
	console.warn = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');

	let total = 0;
	try {
		for (const grammar of targets) {
			const divergences = await probeGrammar(grammar, repoRoot);
			total += divergences.length;
			process.stdout.write(`${grammar}: ${divergences.length} divergence(s)\n`);
			for (const d of divergences.slice(0, first)) {
				process.stdout.write(
					`  ${d.kind}.${d.slot} [${d.projection}] legacy=${JSON.stringify(d.legacy)} recomputed=${JSON.stringify(d.recomputed)}\n`,
				);
			}
			if (divergences.length > first) {
				process.stdout.write(`  … and ${divergences.length - first} more\n`);
			}
		}
	} finally {
		console.log = origLog;
		console.warn = origWarn;
	}
	// Non-zero exit when ANY divergence remains — lets CI/the gate fail on it.
	return total === 0 ? 0 : 1;
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e) => {
			process.stderr.write(`reconcile-naming: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts`
Expected: PASS — all 5 cases (clean → `[]`; storageName / propertyName / parseNames divergences reported; parseNames NON-divergence after `_`-normalization).

- [ ] **Step 5: Type-check the new module**

Run: `pnpm type-check`
Expected: PASS (no new TS errors introduced by `reconcile-naming.ts` or its test). If `NodeOrTerminal`/`AssembledNonterminal` import shapes mismatch, fix the import to match `node-map.ts` exports.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/scripts/reconcile-naming.ts \
        packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts
git commit -m "test(pr-a): add wide _new-vs-legacy slot-name divergence probe core

Pure diffSlotNames compares every projected name (storageName, name,
configKey, propertyName, paramName, parseNames) against the value
recomputed from the inert _new derivation (spec finding H1). Unit test
covers a clean slot (0 divergences) and storageName/propertyName/parseNames
divergences. No emitter reads _new — this is the PR-A acceptance probe.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Register the tool + run it to enumerate the baseline divergences

**Files:**
- Create: `packages/tools/src/validate/reconcile-naming.ts`
- Modify: `packages/tools/src/cli.ts:20-25` (TOOLS map) + help text (`:89-95`)

- [ ] **Step 1: Write the thin tools-CLI wrapper**

```typescript
// packages/tools/src/validate/reconcile-naming.ts
/**
 * validate/reconcile-naming — thin wrapper delegating to @sittir/codegen's
 * reconcile-naming script (the PR-A wide _new-vs-legacy divergence probe).
 * Actual logic lives in packages/codegen/src/scripts/reconcile-naming.ts.
 */
type ToolRunner = (argv: string[]) => Promise<number>;

const CODEGEN_RECONCILE = '../../../codegen/src/scripts/reconcile-naming.ts';

async function loadRun(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_RECONCILE);
	return mod.run;
}

export async function run(argv: string[]): Promise<number> {
	return (await loadRun())(argv);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e) => {
			process.stderr.write(`reconcile-naming: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
```

- [ ] **Step 2: Register the tool in the CLI map**

In `packages/tools/src/cli.ts`, add to the `TOOLS` object under the `// Validation` group (after `'check-jinja'`, around `:25`):

```typescript
	'reconcile-naming': './validate/reconcile-naming.js',
```

And add to the help text in `printHelp()` under `Validation:` (after the `check-jinja` line, around `:95`):

```typescript
		'  reconcile-naming      PR-A: _new-vs-legacy slot-name divergence probe',
```

- [ ] **Step 3: Type-check + verify the tool dispatches**

Run: `pnpm type-check`
Expected: PASS.

Run: `pnpm exec tsx packages/tools/src/cli.ts --help`
Expected: the help output now lists `reconcile-naming` under `Validation:`.

- [ ] **Step 4: Run the probe to enumerate the CURRENT baseline divergences**

Run: `pnpm exec tsx packages/tools/src/cli.ts reconcile-naming --first 30`
Expected: a per-grammar divergence count + the first 30 entries per grammar. **Record the baseline counts here** (they are UNKNOWN until the probe runs — this is the enumeration step). Example shape:
```
rust: <N_rust> divergence(s)
  <kind>.<slot> [<projection>] legacy=... recomputed=...
  …
typescript: <N_ts> divergence(s)
  …
python: <N_py> divergence(s)
  …
```

- [ ] **Step 5: Triage the divergences by projection + likely source**

Group the reported entries by `projection` and by the `_new` code path that produced them. Per the spec, the known fragile spots to expect in the output are:
  - the `sharedArmFieldName` choice-naming path (`collect-slots.ts:378-383`) — a field-wrapped choice where legacy recovered `sharedArm` but `_new` (which keys only off `fieldName ?? single-ref-kind`) fell to `'content'` or a kind name.
  - the `'content'` fallback (`collect-slots.ts:393` legacy / `:490` `_new`) — divergence when legacy `baseName` resolved to a stripped-underscore kind name but `_new` saw `refKindNames.length !== 1` → `'content'` (or vice-versa).
  - the `origin`/`source` stamping interaction (`collect-slots.ts:347-396`) — the legacy `baseName` strips the leading underscore on `symbol`/`supertype` (`rule.name.replace(/^_+/, '')`), but `_new`'s `kindsOf(slot)` returns the kind as it appears in `values[].node` (which may or may not carry the underscore) → a storageName/name/configKey divergence on hidden-kind-referencing slots.

**parseNames is RESOLVED (FLAG 1, do NOT re-raise):** the probe already normalizes both sides through `expandRuntimeDiscriminatorKinds` and compares the post-expansion storage-key sets, so the alias-target-union / source-name difference is a non-divergence by construction. The alias-target union is landed-correct; the per-value `parseKind` decomposition is out of scope for PR-A (deferred to PR-B/PR-C). If `parseNames` divergences DO appear in the output, they are real set differences (a genuine `_new` bug), not the resolved formula question — triage them with the other classes below.

Write the triage into the commit message / a scratch note. **STOP and present the baseline counts + triage to the user before Task 3** (per `feedback_wait_for_answer` / `feedback_slow_down_during_discussion`). The STOP is for reviewing the remaining divergence classes — **storageName / name / configKey / propertyName / paramName** (the `sharedArmFieldName`, `'content'`-fallback, and underscore-strip classes above). The parseNames design question is no longer open.

- [ ] **Step 6: Commit (probe registered + baseline recorded)**

```bash
git add packages/tools/src/validate/reconcile-naming.ts packages/tools/src/cli.ts
git commit -m "feat(pr-a): register reconcile-naming tool; record baseline divergences

Wires the wide _new-vs-legacy divergence probe into the tools CLI.
Baseline divergence counts (current branch): rust=<N>, ts=<N>, python=<N>
(see commit body for projection/source triage). PR-A gate is 0 across all 3.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Fix the `_new` derivation in `collect-slots.ts` until the probe reports 0

**Files:**
- Modify: `packages/codegen/src/compiler/collect-slots.ts:477-491` (the `_new` computation block) — and ONLY this block (the legacy fields stay untouched; this PR reconciles `_new` TO legacy, behavior-preserving). `simplify.ts` is NOT touched (FLAG 2: it computes no `_new`).

This task is **probe-driven and iterative** — the exact edits depend on the Task-2 baseline output. The pattern for EACH divergence class:

- [ ] **Step 1 (per divergence class): Add a focused unit test reproducing it**

Add a case to `packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts` (for a synthetic slot) OR — better, when the divergence is a real grammar slot — add a `collectSlots` integration case to `packages/codegen/src/compiler/__tests__/collect-slots.test.ts` asserting the `_new` fields match the legacy fields for the witnessing rule shape. Example (field-wrapped operator choice, the `sharedArmFieldName` path):

```typescript
it('field-wrapped operator choice: storageNameNew matches legacy storageName', () => {
	// field('operator', choice('<','>')) — simplify strips the field off the
	// choice node but leaves fieldName on each arm; legacy recovers it via
	// sharedArmFieldName. _new must recover the same name, not fall to 'content'.
	const rule: Rule = {
		type: 'choice',
		members: [
			{ type: 'string', value: '<', fieldName: 'operator' } as Rule,
			{ type: 'string', value: '>', fieldName: 'operator' } as Rule,
		],
	};
	const out = slots(rule);
	expect(out).toHaveLength(1);
	expect(out[0]!.storageNameNew).toBe(out[0]!.storageName);
	expect(out[0]!.nameNew).toBe(snakeToCamel(out[0]!.storageName));
});
```
(Import `snakeToCamel` from `../node-map.ts` in that test file if not already imported.)

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/collect-slots.test.ts -t "storageNameNew matches legacy"`
Expected: FAIL — `storageNameNew` is `'content'` (or a kind name) while legacy `storageName` is `'operator'`.

- [ ] **Step 3: Fix the `_new` derivation to reconcile this class**

Edit ONLY the `_new` block at `collect-slots.ts:477-491`. The reconciliation principle: `_new`'s `storageNameNew` must be derived so it equals the legacy `baseName`-driven value for this shape. **Leave `parseNamesNew` AS-IS** (the current alias-target union is landed-correct; the probe already normalizes both sides — do not change the `parseNamesNew` line unless a real post-expansion set divergence is reported). Concretely, the `storageNameNew` derivation should reuse the SAME input the legacy path already computed — `baseName` (the legacy result) is in scope at that point. The cleanest reconciliation is to source `storageNameNew` from the already-computed `baseName` for the fallback cases the single-ref rule does not cover (shared-arm field name, underscore-stripped kind name), while keeping `fieldName` precedence. For example:

```typescript
	// --- _new centralized naming. Reconcile storageNameNew to the legacy baseName
	// so PR-B's getter swap is byte-identical: fieldName wins; else the single
	// referenced kind name; else the legacy-derived baseName (covers
	// sharedArmFieldName + underscore-stripped symbol/supertype kinds + 'content').
	const refKindNames = kindsOf(slot);
	const fieldName = rule.fieldName;
	// parseNamesNew UNCHANGED — the alias-target union is landed-correct
	// (type_query fix 26b8a15c, wrap variant-routing); the probe normalizes
	// both sides via expandRuntimeDiscriminatorKinds (plan FLAG 1 RESOLVED).
	const parseNamesNew =
		fieldName !== undefined ? [fieldName] : [...new Set([...refKindNames, ...Object.keys(aliasSources)])];
	const storageNameNew =
		fieldName ?? (refKindNames.length === 1 ? refKindNames[0]! : baseName);
	return { ...slot, fieldName, storageNameNew, nameNew: snakeToCamel(storageNameNew), parseNamesNew };
```

**Note:** the exact reconciliation differs per divergence class found in Task 2 — adjust `storageNameNew` based on the actual triage. The invariant is: do NOT change the legacy fields, and do NOT change `parseNamesNew` (the union is intended); only make `storageNameNew` match the legacy `baseName`. The per-value `parseKind` decomposition is out of scope for PR-A (PR-B/PR-C).

- [ ] **Step 4: Run the focused test + the unit probe test to verify they pass**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/collect-slots.test.ts packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts`
Expected: PASS.

- [ ] **Step 5: Re-run the full probe; repeat Steps 1–4 for the next divergence class**

Run: `pnpm exec tsx packages/tools/src/cli.ts reconcile-naming --first 30`
Expected: the divergence count for the fixed class drops. Iterate the per-class TDD loop until the probe reports **0 for all 3 grammars**:
```
rust: 0 divergence(s)
typescript: 0 divergence(s)
python: 0 divergence(s)
```

- [ ] **Step 6: Acceptance — probe = 0 (the PR-A gate, part 1)**

Run: `pnpm exec tsx packages/tools/src/cli.ts reconcile-naming`
Expected: exit code 0; output `rust: 0 divergence(s)` / `typescript: 0 divergence(s)` / `python: 0 divergence(s)`.

Run: `echo $?`
Expected: `0`.

- [ ] **Step 7: Commit the reconciliation**

```bash
git add packages/codegen/src/compiler/collect-slots.ts \
        packages/codegen/src/compiler/__tests__/collect-slots.test.ts \
        packages/codegen/src/compiler/__tests__/reconcile-naming.test.ts
git commit -m "fix(pr-a): reconcile _new naming derivation to legacy (divergence -> 0)

Make storageNameNew/nameNew/parseNamesNew match the legacy
name/storageName/configKey/propertyName/paramName projections for every
slot across rust/python/typescript. Probe (reconcile-naming) now reports 0
divergences for all 3 grammars — proving PR-B's getter swap is byte-identical
for every projection (spec finding H1). No emitter reads _new yet; behavior
unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: The count gate — `pnpm validate:native` unchanged at baseline

**Files:** none (gate only). PR-A is codegen-only (no rust emit change), so `validate:native` suffices — no separate `cargo check`/cargo-verify needed. `validate:native` rebuilds the `.node` (raw `counts` does NOT — `project_native_build_and_staleness`), so it cannot be masked by a stale binary.

- [ ] **Step 1: Run the full native validation gate**

Run: `pnpm validate:native`
Expected: counts EXACTLY equal the Task-0 re-measured baseline (deep `read-render-parsePass`):
```
rust:        cov 181/186   read-render-parse 134/136   ast 125
python:      cov 107/110   read-render-parse  96/115   ast  74
typescript:  cov 174/182   read-render-parse  82/111   ast  75
```
(Use the OBSERVED Task-0 numbers if they differed from spec.) Since no emitter reads `_new`, the regenerated grammars must be byte-identical and the counts MUST be unchanged. **Any regression means a legacy field was accidentally touched — revert and re-isolate the edit to the `_new` block.**

- [ ] **Step 2: Confirm the generated outputs did not drift unexpectedly**

Run: `git -C /Users/pmouli/GitHub.nosync/refactory-lang/sittir status --short packages/rust/src packages/typescript/src packages/python/src`
Expected: NO changes to generated `packages/*/src/*` (the `_new` fields are not emitted into any artifact). If generated files changed, investigate — `_new` should be inert. (The `validate:native` regen step rewrites them in place; confirm `git diff` shows no content change.)

- [ ] **Step 3: Run lint + format check**

Run: `pnpm lint && pnpm format:check`
Expected: PASS (new files conform). Run `pnpm format` if `format:check` flags the new files, then re-stage.

- [ ] **Step 4: Final full-suite type-check + tests for the touched packages**

Run: `pnpm type-check && pnpm exec vitest run packages/codegen/src/compiler/__tests__/`
Expected: PASS.

- [ ] **Step 5: Commit any lint/format fixups**

```bash
git add -A packages/codegen packages/tools
git commit -m "chore(pr-a): lint/format fixups for reconcile-naming probe

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## PR-A acceptance summary (both gates)

PR-A is complete when **both** hold:

1. **Divergence probe = 0** across rust/python/typescript:
   `pnpm exec tsx packages/tools/src/cli.ts reconcile-naming` → exit 0, all three `0 divergence(s)`.
2. **`pnpm validate:native` counts unchanged** at the Task-0 baseline (rust 181/134/125, python 107/96/74, ts 174/82/75 — deep read-render-parse).

No emitter reads `_new` (verified at plan-authoring time) — so the count gate is structurally guaranteed and the probe is the real proof that PR-B's getter swap will be byte-identical for EVERY projection. This unblocks PR-B (`AssembledNonterminal` → class with the `_new` logic promoted to getters).
