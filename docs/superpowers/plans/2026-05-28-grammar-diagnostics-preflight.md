# Grammar Diagnostics Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unconditional non-injective `parseKind` hard-fails with a reusable grammar-diagnostics preflight that runs before codegen, is available as a standalone tools command, and gates continuation through explicit diagnostic-code allowances or interactive confirmation.

**Architecture:** Keep the existing merge-or-diagnose analysis in the compiler, but move the fail-vs-proceed decision to the CLI boundary. Introduce a shared grammar-diagnostics engine that both the codegen CLI and a new `packages/tools` inspection command can invoke, then add code-based gating (`--allow-diagnostic <code>`) plus interactive/non-interactive proceed policy in the codegen CLI.

**Tech Stack:** TypeScript ESM, Vitest, `tsx`, `pnpm`, codegen compiler under `packages/codegen/src/**`, developer tools under `packages/tools/src/**`

---

## File map

- **Create:** `packages/codegen/src/compiler/grammar-diagnostics.ts`
  - shared `GrammarDiagnostic` record shape
  - `GrammarDiagnosticError`
  - preflight orchestration entrypoint for parseKind collision checks
- **Modify:** `packages/codegen/src/compiler/diagnose-parsekind-collisions.ts`
  - attach stable diagnostic code metadata
  - preserve merge behavior for identical collisions
- **Modify:** `packages/codegen/src/compiler/node-map.ts`
  - stop owning unconditional fail-on-diagnostic behavior
  - surface collision diagnostics to the orchestration layer
- **Modify:** `packages/codegen/src/compiler/assemble.ts`
  - remove assembly-owned fail policy
  - thread diagnostics context without deciding invocation policy
- **Modify:** `packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts`
  - replace hard-throw expectations with diagnostic-record expectations
- **Create:** `packages/codegen/src/__tests__/grammar-diagnostics.test.ts`
  - preflight integration coverage for emitted codes and grouped records
- **Modify:** `packages/codegen/src/cli.ts`
  - parse `--allow-diagnostic`
  - add testable preflight helper / main entrypoint
  - run grammar diagnostics before generation
  - prompt in interactive mode and fail in non-interactive mode unless explicitly allowed
- **Create:** `packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts`
  - codegen CLI preflight tests (interactive prompt, explicit allow, non-interactive fail)
- **Create:** `packages/tools/src/inspect/grammar-diagnostics.ts`
  - standalone inspection tool that invokes the same shared preflight engine
- **Modify:** `packages/tools/src/cli.ts`
  - register `grammar-diagnostics`
  - add help text under Inspection
- **Modify:** `packages/tools/tests/cli.test.ts`
  - assert tool registration/help coverage
- **Modify:** `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`
  - change §4d.1 wording from unconditional `fail` to diagnostic + invocation-level gate
- **Modify:** `docs/superpowers/plans/2026-05-27-pr-c-eliminate-origin-aliassources.md`
  - align Task 4/5 wording with the new preflight tool and CLI gate

---

### Task 1: Introduce shared grammar diagnostics and downgrade collision handling to records

**Files:**

- Create: `packages/codegen/src/compiler/grammar-diagnostics.ts`
- Modify: `packages/codegen/src/compiler/diagnose-parsekind-collisions.ts`
- Modify: `packages/codegen/src/compiler/node-map.ts`
- Modify: `packages/codegen/src/compiler/assemble.ts`
- Modify: `packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts`
- Test: `packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts`
- Test: `packages/codegen/src/__tests__/grammar-diagnostics.test.ts`

- [ ] **Step 1: Write the failing shared-diagnostics integration test**

```typescript
import { describe, expect, it } from 'vitest';
import { collectGrammarDiagnostics } from '../compiler/grammar-diagnostics.ts';

describe('grammar diagnostics preflight', () => {
	it('emits parsekind-noninjective records for structurally distinct collisions', () => {
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [
				{
					ownerKind: '_suite',
					slotName: 'content',
					shape: 'propose-distinct-alias',
					parseKind: 'block',
					storageKinds: ['_simple_statements', 'block', '_newline'],
					proposal: 'Give each colliding arm a distinct alias.',
				},
			],
		});

		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				code: 'parsekind-noninjective',
				grammar: 'synth',
				ownerKind: '_suite',
				slotName: 'content',
				canProceed: false,
			}),
		]);
	});
});
```

- [ ] **Step 2: Run the targeted tests to confirm the new preflight surface does not exist yet**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-parsekind-collisions.test.ts \
  src/__tests__/grammar-diagnostics.test.ts
```

Expected: FAIL because `grammar-diagnostics.ts` and the shared diagnostic record shape do not exist yet.

- [ ] **Step 3: Add the shared diagnostic model and error type**

```typescript
// packages/codegen/src/compiler/grammar-diagnostics.ts
export interface GrammarDiagnostic {
	readonly code: string;
	readonly severity: 'warning' | 'error';
	readonly grammar: string;
	readonly ownerKind: string;
	readonly slotName?: string;
	readonly message: string;
	readonly proposal?: string;
	readonly canProceed: boolean;
	readonly details?: Record<string, unknown>;
}

export class GrammarDiagnosticError extends Error {
	readonly codes: readonly string[];

	constructor(readonly diagnostics: readonly GrammarDiagnostic[]) {
		super(
			diagnostics
				.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
				.join('\n'),
		);
		this.name = 'GrammarDiagnosticError';
		this.codes = diagnostics.map((diagnostic) => diagnostic.code);
	}
}
```

- [ ] **Step 4: Convert parseKind collision diagnostics into shared records**

```typescript
// packages/codegen/src/compiler/diagnose-parsekind-collisions.ts
export interface ParseKindCollisionDiagnostic {
	readonly code: 'parsekind-noninjective';
	readonly ownerKind: string;
	readonly slotName: string;
	readonly shape: 'propose-distinct-alias';
	readonly parseKind: string;
	readonly storageKinds: readonly string[];
	readonly proposal: string;
}
```

```typescript
// packages/codegen/src/compiler/grammar-diagnostics.ts
export function fromParseKindCollision(
	grammar: string,
	diagnostic: ParseKindCollisionDiagnostic,
): GrammarDiagnostic {
	return {
		code: diagnostic.code,
		severity: 'error',
		grammar,
		ownerKind: diagnostic.ownerKind,
		slotName: diagnostic.slotName,
		message:
			`Slot '${diagnostic.slotName}' of kind '${diagnostic.ownerKind}' ` +
			`collapses [${diagnostic.storageKinds.join(', ')}] onto parse kind '${diagnostic.parseKind}'.`,
		proposal: diagnostic.proposal,
		canProceed: false,
		details: {
			parseKind: diagnostic.parseKind,
			storageKinds: diagnostic.storageKinds,
		},
	};
}
```

- [ ] **Step 5: Remove assembly-owned unconditional throw behavior**

```typescript
// packages/codegen/src/compiler/assemble.ts
const parseKindCollisionContext = {
	ruleSignatures: buildParseKindRuleSignatures(optimized.renderRules!),
	failOnDiagnostic: false,
} as const;
```

```typescript
// packages/codegen/src/compiler/node-map.ts
export interface ParseKindCollisionContext {
	readonly ruleSignatures: Readonly<Record<string, string>>;
	readonly failOnDiagnostic: boolean;
}

function resolveParseKindCollisionsInSlot(
	ownerKind: string,
	slot: AssembledNonterminal,
	context?: ParseKindCollisionContext,
): AssembledNonterminal {
	const resolution = diagnoseParseKindCollisions({
		ownerKind,
		slotName: slot.name,
		values: describedValues,
	});
	const nextValues = [...resolution.values];
	return nextValues.length === slot.values.length &&
		nextValues.every((value, index) => value === slot.values[index])
		? slot
		: slot.with({ values: dedupeValues(nextValues) });
}
```

- [ ] **Step 6: Add orchestration that turns compiler findings into shared diagnostics**

```typescript
// packages/codegen/src/compiler/grammar-diagnostics.ts
export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
}): { diagnostics: readonly GrammarDiagnostic[] } {
	return {
		diagnostics: input.parseKindCollisions.map((diagnostic) =>
			fromParseKindCollision(input.grammar, diagnostic),
		),
	};
}

export async function collectGrammarDiagnosticsForGrammar(
	grammar: string,
): Promise<{ diagnostics: readonly GrammarDiagnostic[] }> {
	const result = await generate({
		grammar,
		outputDir: `/tmp/sittir-diagnostics-${grammar}`,
		emitRenderModule: false,
	});
	return collectGrammarDiagnostics({
		grammar,
		parseKindCollisions: result.nodeMap.parseKindCollisions ?? [],
	});
}

export function formatGrammarDiagnostics(
	diagnostics: readonly GrammarDiagnostic[],
): string {
	return diagnostics.length === 0
		? 'No grammar diagnostics.'
		: diagnostics
				.map((diagnostic) => `${diagnostic.code} ${diagnostic.ownerKind}.${diagnostic.slotName ?? '-'}`)
				.join('\n');
}
```

- [ ] **Step 7: Re-run the targeted tests and make them pass**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-parsekind-collisions.test.ts \
  src/__tests__/grammar-diagnostics.test.ts
```

Expected: PASS. The low-level merge logic still collapses identical collisions, and distinct collisions now surface `parsekind-noninjective` records instead of relying on assembly-owned throws.

- [ ] **Step 8: Commit the shared-diagnostics compiler refactor**

```bash
git add packages/codegen/src/compiler/grammar-diagnostics.ts \
        packages/codegen/src/compiler/diagnose-parsekind-collisions.ts \
        packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/compiler/assemble.ts \
        packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts \
        packages/codegen/src/__tests__/grammar-diagnostics.test.ts
git commit -m "refactor: surface grammar diagnostics from parsekind collisions"
```

---

### Task 2: Add the standalone `grammar-diagnostics` inspection tool

**Files:**

- Create: `packages/tools/src/inspect/grammar-diagnostics.ts`
- Modify: `packages/tools/src/cli.ts`
- Modify: `packages/tools/tests/cli.test.ts`
- Test: `packages/tools/tests/cli.test.ts`

- [ ] **Step 1: Extend the tools CLI registration test first**

```typescript
// packages/tools/tests/cli.test.ts
it('registers expected tool names', () => {
	expect(TOOL_NAMES.has('inspect-refs')).toBe(true);
	expect(TOOL_NAMES.has('inspect-type')).toBe(true);
	expect(TOOL_NAMES.has('grammar-diagnostics')).toBe(true);
});
```

- [ ] **Step 2: Run the tools CLI test and confirm the new command is missing**

Run:

```bash
pnpm --dir packages/tools exec vitest run tests/cli.test.ts
```

Expected: FAIL because `grammar-diagnostics` is not yet in `TOOL_NAMES`.

- [ ] **Step 3: Add the new inspect tool module**

```typescript
// packages/tools/src/inspect/grammar-diagnostics.ts
import { collectGrammarDiagnosticsForGrammar, formatGrammarDiagnostics } from '../../../codegen/src/compiler/grammar-diagnostics.ts';

function parseGrammarArg(argv: string[]): string | undefined {
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--grammar') return argv[i + 1];
	}
	return undefined;
}

export async function run(argv: string[]): Promise<number> {
	const grammar = parseGrammarArg(argv) ?? 'rust';
	const result = await collectGrammarDiagnosticsForGrammar(grammar);
	process.stdout.write(formatGrammarDiagnostics(result.diagnostics) + '\n');
	return result.diagnostics.length > 0 ? 1 : 0;
}
```

- [ ] **Step 4: Register the tool under the Inspection section**

```typescript
// packages/tools/src/cli.ts
'grammar-diagnostics': './inspect/grammar-diagnostics.js',
```

```typescript
// packages/tools/src/cli.ts help text
'  grammar-diagnostics inspect pre-codegen grammar diagnostics',
```

- [ ] **Step 5: Re-run the tools CLI test and make it pass**

Run:

```bash
pnpm --dir packages/tools exec vitest run tests/cli.test.ts
```

Expected: PASS. The new tool is discoverable through the same dispatcher as the rest of the Inspection commands.

- [ ] **Step 6: Commit the standalone tool**

```bash
git add packages/tools/src/inspect/grammar-diagnostics.ts \
        packages/tools/src/cli.ts \
        packages/tools/tests/cli.test.ts
git commit -m "feat: add standalone grammar diagnostics tool"
```

---

### Task 3: Refactor the codegen CLI into a testable preflight gate

**Files:**

- Modify: `packages/codegen/src/cli.ts`
- Create: `packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts`
- Test: `packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts`

- [ ] **Step 1: Write the failing CLI preflight tests**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { runCodegenCli } from '../cli.ts';

describe('codegen CLI grammar-diagnostics preflight', () => {
	it('fails in non-interactive mode when encountered codes are not allowed', async () => {
		await expect(
			runCodegenCli(['--grammar', 'rust', '--all', '--output', 'packages/rust/src'], {
				isTTY: false,
				diagnostics: [{ code: 'parsekind-noninjective', canProceed: false }],
			}),
		).rejects.toThrow(/parsekind-noninjective/);
	});

	it('continues when the encountered code is explicitly allowed', async () => {
		await expect(
			runCodegenCli(
				[
					'--grammar',
					'rust',
					'--all',
					'--output',
					'packages/rust/src',
					'--allow-diagnostic',
					'parsekind-noninjective',
				],
				{
					isTTY: false,
					diagnostics: [{ code: 'parsekind-noninjective', canProceed: false }],
				},
			),
		).resolves.toBe(0);
	});
});
```

- [ ] **Step 2: Run the CLI preflight test and confirm the seam does not exist yet**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/cli-grammar-diagnostics.test.ts
```

Expected: FAIL because `cli.ts` does not yet export a testable `runCodegenCli` entrypoint or support `--allow-diagnostic`.

- [ ] **Step 3: Extract a testable codegen CLI entrypoint and parse the allowlist**

```typescript
// packages/codegen/src/cli.ts
interface CliArgs {
	grammar?: string;
	nodes?: string[];
	outputDir?: string;
	allowDiagnostics?: string[];
	// existing flags...
}

export async function runCodegenCli(
	argv: string[],
	env: {
		isTTY?: boolean;
		diagnostics?: readonly GrammarDiagnostic[];
	} = {},
): Promise<number> {
	const cliArgs = parseArgs(['node', 'cli.ts', ...argv]);
	const allowDiagnostics = new Set(cliArgs.allowDiagnostics ?? []);
	await runGrammarDiagnosticsPreflight({
		grammar: cliArgs.grammar!,
		allowDiagnostics,
		isTTY: env.isTTY ?? Boolean(process.stdin.isTTY),
		injectedDiagnostics: env.diagnostics,
	});
	return 0;
}
```

- [ ] **Step 4: Add interactive and non-interactive preflight policy**

```typescript
// packages/codegen/src/cli.ts
async function runGrammarDiagnosticsPreflight(input: {
	grammar: string;
	allowDiagnostics: ReadonlySet<string>;
	isTTY: boolean;
	injectedDiagnostics?: readonly GrammarDiagnostic[];
}): Promise<void> {
	const diagnostics =
		input.injectedDiagnostics ??
		(await collectGrammarDiagnosticsForGrammar(input.grammar)).diagnostics;
	const blocked = diagnostics.filter(
		(diagnostic) =>
			!input.allowDiagnostics.has(diagnostic.code) && diagnostic.canProceed === false,
	);
	if (blocked.length === 0) return;
	process.stderr.write(formatGrammarDiagnostics(diagnostics) + '\n');
	if (!input.isTTY) throw new GrammarDiagnosticError(blocked);
	if (!(await confirmProceed(blocked))) throw new GrammarDiagnosticError(blocked);
}
```

- [ ] **Step 5: Add a minimal prompt helper that can be stubbed in tests**

```typescript
// packages/codegen/src/cli.ts
async function confirmProceed(diagnostics: readonly GrammarDiagnostic[]): Promise<boolean> {
	process.stderr.write(
		`Diagnostics present (${diagnostics.map((diagnostic) => diagnostic.code).join(', ')}). Proceed? [y/N] `,
	);
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk as Buffer);
		break;
	}
	const answer = Buffer.concat(chunks).toString('utf8').trim().toLowerCase();
	return answer === 'y' || answer === 'yes';
}
```

- [ ] **Step 6: Re-run the CLI preflight tests and make them pass**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/cli-grammar-diagnostics.test.ts
```

Expected: PASS. The CLI now has a dedicated preflight seam, honors `--allow-diagnostic`, and fails in non-interactive mode unless the reported codes are explicitly allowed.

- [ ] **Step 7: Commit the CLI preflight gate**

```bash
git add packages/codegen/src/cli.ts \
        packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts
git commit -m "feat: gate codegen with grammar diagnostics preflight"
```

---

### Task 4: Sync the governing PR-C docs with the new diagnostic-and-gate behavior

**Files:**

- Modify: `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`
- Modify: `docs/superpowers/plans/2026-05-27-pr-c-eliminate-origin-aliassources.md`

- [ ] **Step 1: Update the PR-C spec wording**

```markdown
2. **DIAGNOSE** — otherwise (genuinely distinct structures) → `propose-distinct-alias`
   diagnostic code. The grammar-diagnostics preflight surfaces the code before
   codegen, and the current invocation may continue only if the code is explicitly
   allowed or the user confirms interactively.
```

- [ ] **Step 2: Update the PR-C implementation plan wording**

```markdown
- auto-run grammar diagnostics before generation
- expose the same diagnostics through `packages/tools`
- gate continuation through diagnostic-code allowlists / interactive confirmation
```

- [ ] **Step 3: Review the updated doc diff**

Run:

```bash
git --no-pager diff -- \
  docs/superpowers/specs/2026-05-22-compiler-simplification-design.md \
  docs/superpowers/plans/2026-05-27-pr-c-eliminate-origin-aliassources.md
```

Expected: the text now matches the approved design: diagnostics are first-class and gating is invocation-level, not an unconditional assembly throw.

- [ ] **Step 4: Commit the doc sync**

```bash
git add docs/superpowers/specs/2026-05-22-compiler-simplification-design.md \
        docs/superpowers/plans/2026-05-27-pr-c-eliminate-origin-aliassources.md
git commit -m "docs: align PR-C collision policy with diagnostics preflight"
```

---

### Task 5: Run the focused gate and then the PR-C regen flow with explicit diagnostic allowance

**Files:**

- Modify: generated outputs only as a result of regen
- Test: `packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts`
- Test: `packages/codegen/src/__tests__/grammar-diagnostics.test.ts`
- Test: `packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts`
- Test: `packages/tools/tests/cli.test.ts`

- [ ] **Step 1: Run the focused unit/integration tests**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/compiler/diagnose-parsekind-collisions.test.ts \
  src/__tests__/grammar-diagnostics.test.ts \
  src/__tests__/cli-grammar-diagnostics.test.ts \
  && pnpm --dir packages/tools exec vitest run tests/cli.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the codegen typecheck on the touched package**

Run:

```bash
pnpm --dir packages/codegen exec tsgo --noEmit
```

Expected: PASS.

- [ ] **Step 3: Regenerate the affected grammars with the explicit diagnostic allowance**

Run:

```bash
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts \
  --grammar rust \
  --all \
  --allow-diagnostic parsekind-noninjective \
  --output packages/rust/src
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts \
  --grammar python \
  --all \
  --allow-diagnostic parsekind-noninjective \
  --output packages/python/src
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts \
  --grammar typescript \
  --all \
  --allow-diagnostic parsekind-noninjective \
  --output packages/typescript/src
```

Expected: the preflight reports any known `parsekind-noninjective` findings, the explicit allow flag permits continuation in non-interactive mode, and codegen completes.

- [ ] **Step 4: Run the native validation gate**

Run:

```bash
pnpm validate:native
```

Expected: hold or improve the recorded PR-C baseline. If counts drop, stop and classify the exact failing grammar/entry before changing more code.

- [ ] **Step 5: Inspect the final diff**

Run:

```bash
git status --short
git --no-pager diff --stat
```

Expected: source changes are limited to the planned compiler/CLI/tools/docs files, plus any generated outputs implied by the regen step.

- [ ] **Step 6: Commit the completed implementation**

```bash
git add packages/codegen/src/compiler/grammar-diagnostics.ts \
        packages/codegen/src/compiler/diagnose-parsekind-collisions.ts \
        packages/codegen/src/compiler/diagnose-parsekind-collisions.test.ts \
        packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/compiler/assemble.ts \
        packages/codegen/src/cli.ts \
        packages/codegen/src/__tests__/grammar-diagnostics.test.ts \
        packages/codegen/src/__tests__/cli-grammar-diagnostics.test.ts \
        packages/tools/src/inspect/grammar-diagnostics.ts \
        packages/tools/src/cli.ts \
        packages/tools/tests/cli.test.ts \
        docs/superpowers/specs/2026-05-22-compiler-simplification-design.md \
        docs/superpowers/plans/2026-05-27-pr-c-eliminate-origin-aliassources.md \
        packages/rust \
        packages/python \
        packages/typescript \
        rust/crates/sittir-rust \
        rust/crates/sittir-python \
        rust/crates/sittir-typescript
git commit -m "feat: add grammar diagnostics preflight"
```
