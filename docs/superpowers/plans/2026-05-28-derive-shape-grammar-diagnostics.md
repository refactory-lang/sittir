# Derive-shape Grammar Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the grammar-diagnostics preflight so known derive-audit shape failures become structured diagnostics with stable public codes, then run and save all-language diagnostic captures.

**Architecture:** Add one focused derive-shape diagnostic mapper near the compiler, wire `node-map` / `assemble` to accumulate those records instead of hard-stopping on known shapes, and let `grammar-diagnostics.ts` merge them into the existing preflight batch. Keep CLI/tool policy unchanged: the same allowlist and interactive confirmation logic should apply to alias collisions and derive-shape findings alike.

**Tech Stack:** TypeScript ESM, Vitest, `pnpm`, codegen compiler under `packages/codegen/src/**`, developer tools under `packages/tools/src/**`

---

## File map

- **Create:** `packages/codegen/src/compiler/diagnose-derive-shapes.ts`
  - map raw derive audit shapes to public codes
  - build diagnostic messages / metadata / proposals
- **Create:** `packages/codegen/src/compiler/diagnose-derive-shapes.test.ts`
  - unit coverage for code mapping and `rule-unexpected`
- **Modify:** `packages/codegen/src/compiler/node-map.ts`
  - record known derive-shape diagnostics instead of throwing for them
  - continue throwing on genuinely unknown/internal defects
- **Modify:** `packages/codegen/src/compiler/assemble.ts`
  - drain derive-shape diagnostics into the assembled result
- **Modify:** `packages/codegen/src/compiler/grammar-diagnostics.ts`
  - add derive-shape diagnostics to the shared batch and formatter
- **Modify:** `packages/codegen/src/__tests__/grammar-diagnostics.test.ts`
  - add shared-batch and real-grammar integration coverage
- **Modify:** `packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts`
  - add explicit preflight coverage for `seq-with-nested-seq`
- **Create:** `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28/`
  - saved all-language diagnostic outputs
- **Modify:** `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/handoff.md`
  - handoff for the next agent with saved artifact paths and remaining work

---

### Task 1: Add derive-shape code mapping and messages

**Files:**

- Create: `packages/codegen/src/compiler/diagnose-derive-shapes.ts`
- Create: `packages/codegen/src/compiler/diagnose-derive-shapes.test.ts`

- [ ] **Step 1: Write the failing mapper tests**

```ts
import { describe, expect, it } from 'vitest';
import { describeDeriveShape } from './diagnose-derive-shapes.ts';

describe('describeDeriveShape', () => {
	it('maps seq-with-nested-seq directly', () => {
		expect(
			describeDeriveShape({
				rawShape: 'seq-with-nested-seq',
				ruleType: 'seq',
				context: 'derive-values',
				ownerKind: 'host',
			}),
		).toEqual(
			expect.objectContaining({
				code: 'seq-with-nested-seq',
				ownerKind: 'host',
				details: expect.objectContaining({ rawShape: 'seq-with-nested-seq' }),
			}),
		);
	});

	it('maps seq-member-* shapes to seq-member-collision', () => {
		expect(
			describeDeriveShape({
				rawShape: 'seq-member-choice-needs-variant-or-merge',
				ruleType: 'choice',
				context: 'derive-values',
				ownerKind: 'host',
			}),
		).toEqual(
			expect.objectContaining({
				code: 'seq-member-collision',
			}),
		);
	});

	it('maps heterogeneous choices to choice-with-multiple-arm-shapes', () => {
		expect(
			describeDeriveShape({
				rawShape: 'choice-needs-variant-or-merge',
				ruleType: 'choice',
				context: 'derive-values',
				ownerKind: 'host',
			}),
		).toEqual(
			expect.objectContaining({
				code: 'choice-with-multiple-arm-shapes',
			}),
		);
	});

	it('builds rule-unexpected messages from containment context', () => {
		expect(
			describeDeriveShape({
				rawShape: 'optional-wrapping-group-wrapping-alias',
				ruleType: 'alias',
				context: 'optional -> seq member',
				ownerKind: 'host',
				expected: ['field', 'symbol', 'string'],
			}),
		).toEqual(
			expect.objectContaining({
				code: 'rule-unexpected',
				message: expect.stringContaining(
					'we did not expect rule type alias inside optional -> seq member',
				),
			}),
		);
	});
});
```

- [ ] **Step 2: Run the new unit test and confirm it fails**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-derive-shapes.test.ts
```

Expected: FAIL because `diagnose-derive-shapes.ts` does not exist yet.

- [ ] **Step 3: Implement the derive-shape mapper**

```ts
export type DeriveShapeCode =
	| 'alias-collision'
	| 'seq-with-nested-seq'
	| 'seq-member-collision'
	| 'choice-with-multiple-arm-shapes'
	| 'rule-unexpected'
	| 'polymorph-classification-gap';

export interface DeriveShapeDiagnostic {
	readonly code: DeriveShapeCode;
	readonly ownerKind?: string;
	readonly message: string;
	readonly proposal?: string;
	readonly canProceed: false;
	readonly details: {
		readonly rawShape: string;
		readonly ruleType: string;
		readonly context: string;
		readonly expected?: readonly string[];
	};
}

export function describeDeriveShape(input: {
	rawShape: string;
	ruleType: string;
	context: string;
	ownerKind?: string;
	expected?: readonly string[];
}): DeriveShapeDiagnostic | null {
	if (input.rawShape === 'seq-with-nested-seq') {
		return {
			code: 'seq-with-nested-seq',
			ownerKind: input.ownerKind,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' still contains a nested seq ` +
				`that should have been flattened, grouped, or normalized before derive.`,
			proposal: 'Introduce a visible group or normalize the nested seq earlier.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected,
			},
		};
	}
	if (input.rawShape.startsWith('seq-member-')) {
		return {
			code: 'seq-member-collision',
			ownerKind: input.ownerKind,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' has a seq member with a ` +
				`noncanonical structural shape that must be grouped, merged, or variantized.`,
			proposal: 'Normalize the offending seq member before derive.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected,
			},
		};
	}
	if (input.rawShape.includes('choice-needs-variant-or-merge')) {
		return {
			code: 'choice-with-multiple-arm-shapes',
			ownerKind: input.ownerKind,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' has a choice whose arms ` +
				`still carry multiple structural shapes at derive time.`,
			proposal: 'Adopt variant() or merge/hoist the choice arms before derive.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected,
			},
		};
	}
	if (input.rawShape.includes('polymorph')) {
		return {
			code: 'polymorph-classification-gap',
			ownerKind: input.ownerKind,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' reached derive in a shape ` +
				`that should have been classified as polymorph earlier.`,
			proposal: 'Fix variant()/polymorph classification before derive.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected,
			},
		};
	}
	return {
		code: 'rule-unexpected',
		ownerKind: input.ownerKind,
		message:
			`Kind '${input.ownerKind ?? '(no-kind-context)'}': we did not expect rule type ` +
			`${input.ruleType} inside ${input.context}.`,
		proposal: 'Normalize, group, merge, or classify the rule earlier in the pipeline.',
		canProceed: false,
		details: {
			rawShape: input.rawShape,
			ruleType: input.ruleType,
			context: input.context,
			expected: input.expected,
		},
	};
}
```

- [ ] **Step 4: Re-run the mapper unit test and make it pass**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-derive-shapes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the mapper**

```bash
git add \
  packages/codegen/src/compiler/diagnose-derive-shapes.ts \
  packages/codegen/src/compiler/diagnose-derive-shapes.test.ts
git commit -m "feat: add derive-shape diagnostic mapping"
```

---

### Task 2: Wire known derive shapes into the shared grammar-diagnostics batch

**Files:**

- Modify: `packages/codegen/src/compiler/node-map.ts`
- Modify: `packages/codegen/src/compiler/assemble.ts`
- Modify: `packages/codegen/src/compiler/grammar-diagnostics.ts`
- Modify: `packages/codegen/src/__tests__/grammar-diagnostics.test.ts`

- [ ] **Step 1: Extend the shared-batch test first**

```ts
it('includes derive-shape diagnostics in the shared batch', () => {
	const result = collectGrammarDiagnostics({
		grammar: 'synth',
		parseKindCollisions: [],
		deriveShapeDiagnostics: [
			{
				code: 'seq-with-nested-seq',
				ownerKind: 'host',
				message: 'Kind host still contains a nested seq.',
				canProceed: false,
				details: {
					rawShape: 'seq-with-nested-seq',
					ruleType: 'seq',
					context: 'derive-values',
				},
			},
		],
	});

	expect(result.diagnostics).toEqual([
		expect.objectContaining({
			code: 'seq-with-nested-seq',
			grammar: 'synth',
			ownerKind: 'host',
			canProceed: false,
		}),
	]);
});
```

- [ ] **Step 2: Run the shared-batch test and confirm it fails**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/__tests__/grammar-diagnostics.test.ts
```

Expected: FAIL because `collectGrammarDiagnostics(...)` does not yet accept derive-shape inputs.

- [ ] **Step 3: Record known derive-shape findings in `node-map.ts` and drain them through `assemble.ts`**

```ts
let _deriveShapeDiagnostics: DeriveShapeDiagnostic[] = [];
let _deriveShapeSeen = new Set<string>();

function recordDeriveShapeDiagnostic(diagnostic: DeriveShapeDiagnostic): void {
	const key = JSON.stringify([
		diagnostic.code,
		diagnostic.ownerKind,
		diagnostic.details.rawShape,
		diagnostic.details.context,
	]);
	if (_deriveShapeSeen.has(key)) return;
	_deriveShapeSeen.add(key);
	_deriveShapeDiagnostics.push(diagnostic);
}

export function resetDeriveShapeDiagnostics(): void {
	_deriveShapeDiagnostics.length = 0;
	_deriveShapeSeen.clear();
}

export function drainDeriveShapeDiagnostics(): DeriveShapeDiagnostic[] {
	const out = [..._deriveShapeDiagnostics];
	resetDeriveShapeDiagnostics();
	return out;
}

const diagnostic = describeDeriveShape({
	rawShape: shape,
	ruleType: rule.type,
	context,
	ownerKind: currentAuditKind,
	expected,
});
if (diagnostic) {
	recordDeriveShapeDiagnostic(diagnostic);
	return;
}
throw new Error(
	`derive: non-canonical shape '${shape}' reached fields derivation for '${context}'`,
);
```

```ts
export interface AssembledNodeMap extends NodeMap {
	readonly parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	readonly deriveShapeDiagnostics: readonly DeriveShapeDiagnostic[];
}

resetDeriveShapeDiagnostics();
const nodeMap = buildNodeMap(...);
return {
	...nodeMap,
	parseKindCollisions: drainParseKindCollisionDiagnostics(),
	deriveShapeDiagnostics: drainDeriveShapeDiagnostics(),
};
```

- [ ] **Step 4: Merge derive-shape diagnostics into `grammar-diagnostics.ts`**

```ts
export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	deriveShapeDiagnostics?: readonly DeriveShapeDiagnostic[];
}): { diagnostics: readonly GrammarDiagnostic[] } {
	return {
		diagnostics: [
			...input.parseKindCollisions.map((diagnostic) =>
				fromParseKindCollision(input.grammar, diagnostic),
			),
			...(input.deriveShapeDiagnostics ?? []).map((diagnostic) => ({
				code: diagnostic.code,
				severity: 'error' as const,
				grammar: input.grammar,
				ownerKind: diagnostic.ownerKind ?? '(no-kind-context)',
				message: diagnostic.message,
				proposal: diagnostic.proposal,
				canProceed: diagnostic.canProceed,
				details: diagnostic.details,
			})),
		],
	};
}

export function collectGrammarDiagnosticsForGrammar(input: {
	rawGrammar: RawGrammar;
}): { nodeMap: AssembledNodeMap; diagnostics: readonly GrammarDiagnostic[] } {
	const nodeMap = assemble(optimize(link(input.rawGrammar)));
	return {
		nodeMap,
		diagnostics: collectGrammarDiagnostics({
			grammar: input.rawGrammar.name,
			parseKindCollisions: nodeMap.parseKindCollisions,
			deriveShapeDiagnostics: nodeMap.deriveShapeDiagnostics,
		}).diagnostics,
	};
}
```

- [ ] **Step 5: Re-run the shared-batch tests and make them pass**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-derive-shapes.test.ts \
  src/__tests__/grammar-diagnostics.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the compiler wiring**

```bash
git add \
  packages/codegen/src/compiler/node-map.ts \
  packages/codegen/src/compiler/assemble.ts \
  packages/codegen/src/compiler/grammar-diagnostics.ts \
  packages/codegen/src/__tests__/grammar-diagnostics.test.ts
git commit -m "feat: surface derive-shape diagnostics in preflight"
```

---

### Task 3: Prove the real preflight path handles derive-shape codes

**Files:**

- Modify: `packages/codegen/src/__tests__/grammar-diagnostics.test.ts`
- Modify: `packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts`

- [ ] **Step 1: Add the failing real-grammar integration test**

```ts
import { evaluate } from '../compiler/evaluate.ts';
import { resolveGrammarJsPath } from '../compiler/resolve-grammar.ts';

it('surfaces seq-with-nested-seq from a real grammar without throwing first', async () => {
	const rawGrammar = await evaluate(resolveGrammarJsPath('rust'));
	const result = collectGrammarDiagnosticsForGrammar({ rawGrammar });

	expect(result.diagnostics).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				code: 'seq-with-nested-seq',
				grammar: 'rust',
				canProceed: false,
			}),
		]),
	);
});
```

- [ ] **Step 2: Add the failing CLI gate regression for the new code**

```ts
it('continues when seq-with-nested-seq is allowlisted', async () => {
	await expect(
		runCodegenCli(
			[
				'--grammar',
				'rust',
				'--all',
				'--output',
				'packages/rust/src',
				'--allow-diagnostic',
				'seq-with-nested-seq',
			],
			{
				isTTY: false,
				diagnostics: [makeDiagnostic('seq-with-nested-seq')],
			},
		),
	).resolves.toBe(0);
});
```

- [ ] **Step 3: Run the targeted tests and confirm the real-grammar case fails first**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/__tests__/grammar-diagnostics.test.ts \
  src/__tests__/cli-grammar-diagnostics.test.ts
```

Expected: the real-grammar test fails until known derive-shape findings are fully downgraded into diagnostics.

- [ ] **Step 4: Make the real-grammar path pass without special-case CLI logic**

```ts
// No new CLI policy branch.
// The only required behavior is that collectGrammarDiagnosticsForGrammar(...)
// now returns the derive-shape code, so the existing gate sees it as just
// another blocking diagnostic.
expect(result.diagnostics.some((d) => d.code === 'seq-with-nested-seq')).toBe(true);
```

- [ ] **Step 5: Re-run the targeted tests and make them pass**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/__tests__/grammar-diagnostics.test.ts \
  src/__tests__/cli-grammar-diagnostics.test.ts \
  src/compiler/diagnose-derive-shapes.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the preflight regression coverage**

```bash
git add \
  packages/codegen/src/__tests__/grammar-diagnostics.test.ts \
  packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts
git commit -m "test: cover derive-shape diagnostics in preflight"
```

---

### Task 4: Capture all-language outputs and write the next-agent handoff

**Files:**

- Create: `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28/rust.txt`
- Create: `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28/typescript.txt`
- Create: `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28/python.txt`
- Create: `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28/summary.tsv`
- Modify: `/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/handoff.md`

- [ ] **Step 1: Run the focused repository tests before the capture**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-derive-shapes.test.ts \
  src/__tests__/grammar-diagnostics.test.ts \
  src/__tests__/cli-grammar-diagnostics.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run and save the standalone diagnostics for all three grammars**

Run:

```bash
ARTIFACT_DIR="/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28"
mkdir -p "$ARTIFACT_DIR"
: > "$ARTIFACT_DIR/summary.tsv"
printf 'grammar\texit_code\toutput_file\n' >> "$ARTIFACT_DIR/summary.tsv"

for grammar in rust typescript python; do
  out="$ARTIFACT_DIR/${grammar}.txt"
  if pnpm --dir packages/tools exec tsx src/cli.ts grammar-diagnostics --grammar "$grammar" >"$out" 2>&1; then
    code=0
  else
    code=$?
  fi
  printf '%s\t%s\t%s\n' "$grammar" "$code" "$out" >> "$ARTIFACT_DIR/summary.tsv"
done
```

Expected: one saved output file per grammar plus `summary.tsv`.

- [ ] **Step 3: Summarize the saved outputs**

Run:

```bash
ARTIFACT_DIR="/Users/pmouli/.copilot/session-state/c9baeabd-3527-434c-902f-d4d47cc00452/files/derive-shape-diagnostics-2026-05-28"
for grammar in rust typescript python; do
  file="$ARTIFACT_DIR/${grammar}.txt"
  total=$(grep -c '^\[' "$file" || true)
  echo "$grammar total=$total"
done
```

Expected: one count line per grammar that can be copied into `handoff.md`.

- [ ] **Step 4: Update the handoff for the next agent**

```md
# Derive-shape diagnostics handoff

- spec: `docs/superpowers/specs/2026-05-28-derive-shape-grammar-diagnostics-design.md`
- plan: `docs/superpowers/plans/2026-05-28-derive-shape-grammar-diagnostics.md`
- saved artifacts:
  - `.../rust.txt`
  - `.../typescript.txt`
  - `.../python.txt`
  - `.../summary.tsv`
- current public codes:
  - `alias-collision`
  - `seq-with-nested-seq`
  - `seq-member-collision`
  - `choice-with-multiple-arm-shapes`
  - `rule-unexpected`
  - `polymorph-classification-gap`
- remaining work:
  - inspect any grammars still producing `rule-unexpected`
  - decide whether additional raw shapes deserve their own public code
```

- [ ] **Step 5: Do not create a repository commit for session-local artifacts**

```bash
git status --short
```

Expected: repository code changes may be committed from prior tasks, but the session-local artifact files and `handoff.md` stay outside repository history.
