# JS vs Native Terminology Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace deprecated-backend terminology that still says `typescript` with `js` everywhere it means the non-native engine, while preserving `typescript` for the TypeScript language pack / grammar only.

**Architecture:** Treat this as a backend-contract rename, not a grammar rename. Update the validator/codegen/probe backend contract first, then migrate printed and persisted outputs, then align agent prompts and command wrappers so every layer agrees on **js vs native** while TypeScript grammar/package surfaces remain unchanged.

**Tech Stack:** TypeScript ESM, Vitest, pnpm workspace scripts, JSONL validation history, repo-local Markdown agent prompts

---

## File structure / responsibility map

- `packages/validator/src/run.ts` — public validator facade; owns backend type exposed to validator callers.
- `packages/validator/src/cli.ts` — CLI parsing, backend labels, history recording, printed summaries.
- `packages/validator/src/history.ts` — persisted validation-history schema and append/read helpers.
- `packages/validator/src/native-staleness.ts` — stale-native warning text.
- `packages/validator/tests/run.test.ts` — validator facade contract tests.
- `packages/validator/tests/cli.test.ts` — validator CLI backend/help/history tests.
- `packages/validator/tests/history.test.ts` — validation-history round-trip tests.
- `packages/validator/validation-history.jsonl` — checked-in persisted history rows; existing backend values need normalization.
- `packages/codegen/src/validate/{common,from,factory-render-parse,read-render-parse}.ts` — lower-level validation backend contract and defaulting.
- `packages/codegen/src/scripts/{collect-baseline,check-baseline-regression,probe-kind,probe-validate}.ts` — codegen-side machine-readable and probe surfaces that still serialize the deprecated backend as `typescript`.
- `packages/codegen/src/__tests__/check-baseline-regression.test.ts` — baseline-regression schema expectations.
- `scripts/list-rt-failures.mts`, `scripts/list-rt-details.mts` — repo helper scripts exposing backend selection.
- `.claude/agents/sittir-{research,review,codegen}.md` — agent instructions; must consistently say **js vs native** and distinguish engine from language pack.

### Task 1: Rename the validator backend contract to `js | native`

**Files:**

- Modify: `packages/validator/src/run.ts`
- Modify: `packages/validator/tests/run.test.ts`
- Modify: `packages/validator/tests/history.test.ts`

- [ ] **Step 1: Write the failing validator-contract tests**

```ts
// packages/validator/tests/run.test.ts
it('runFrom passes an explicit js backend override', async () => {
	await runFrom('python', 'js');
	expect(vi.mocked(validateFrom)).toHaveBeenCalledWith('python', 'js');
});

it('runRt passes an explicit js backend in the option object', async () => {
	await runRt('typescript', '/some/templates', 'js');
	expect(vi.mocked(validateReadRenderParse)).toHaveBeenCalledWith('typescript', '/some/templates', {
		backend: 'js',
	});
});

it('runFactory passes an explicit js backend', async () => {
	await runFactory('rust', '/tmpl', 'js');
	expect(vi.mocked(validateFactoryRenderParse)).toHaveBeenCalledWith('rust', '/tmpl', 'js');
});
```

```ts
// packages/validator/tests/history.test.ts
it('appendHistory + readHistory round-trips a js backend entry', () => {
	const entry = makeEntry({ grammar: 'typescript', backend: 'js' });
	appendHistory(entry);
	const runs = readHistory();
	expect(runs).toHaveLength(1);
	expect(runs[0]!.grammar).toBe('typescript');
	expect(runs[0]!.backend).toBe('js');
});
```

- [ ] **Step 2: Run the validator contract tests to verify they fail**

Run:

```bash
pnpm exec vitest run packages/validator/tests/run.test.ts packages/validator/tests/history.test.ts
```

Expected: FAIL because `Backend` still only allows `'native' | 'typescript'`.

- [ ] **Step 3: Rename the validator facade backend type and forwarding**

```ts
// packages/validator/src/run.ts
export type Grammar = 'rust' | 'typescript' | 'python';
export type Backend = 'native' | 'js';

export function runFrom(grammar: Grammar, backend: Backend = 'native') {
	return validateFrom(grammar, backend);
}

export function runRt(
	grammar: Grammar,
	templatesPath: string,
	backend: Backend = 'native',
	options: Pick<ValidateReadRenderParseOptions, 'recursive'> = {},
) {
	return validateReadRenderParse(grammar, templatesPath, { backend, recursive: options.recursive });
}

export function runFactory(
	grammar: Grammar,
	templatesPath: string,
	backend: Backend = 'native',
) {
	return validateFactoryRenderParse(grammar, templatesPath, backend);
}
```

```ts
// packages/validator/tests/history.test.ts
const entry = makeEntry({ grammar: 'typescript', backend: 'js' });
expect(runs[0]!.backend).toBe('js');
```

- [ ] **Step 4: Run the validator contract tests to verify they pass**

Run:

```bash
pnpm exec vitest run packages/validator/tests/run.test.ts packages/validator/tests/history.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/validator/src/run.ts packages/validator/tests/run.test.ts packages/validator/tests/history.test.ts
git commit -m "refactor(validator): rename backend contract to js"
```

### Task 2: Migrate validator CLI output and persisted history to `js`

**Files:**

- Modify: `packages/validator/src/cli.ts`
- Modify: `packages/validator/src/history.ts`
- Modify: `packages/validator/src/native-staleness.ts`
- Modify: `packages/validator/tests/cli.test.ts`
- Modify: `packages/validator/validation-history.jsonl`

- [ ] **Step 1: Write the failing CLI/history tests**

```ts
// packages/validator/tests/cli.test.ts
it('appends history rows with backend=js for the deprecated engine', async () => {
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	await runCountsCli(['python'], 'js');
	expect(vi.mocked(appendHistory)).toHaveBeenCalledWith(
		expect.objectContaining({
			grammar: 'python',
			backend: 'js',
		}),
	);
	logSpy.mockRestore();
});

it('runs both backends when backend=all', async () => {
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	await runCountsCli(['rust'], 'all');
	expect(vi.mocked(runFrom)).toHaveBeenNthCalledWith(2, 'rust', 'js');
	expect(logSpy.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/rust\/js:/);
	logSpy.mockRestore();
});
```

```ts
// packages/validator/tests/history.test.ts
it('readHistory preserves js backend rows from disk', () => {
	writeFileSync(SCRATCH, JSON.stringify(makeEntry({ backend: 'js' })) + '\n');
	const runs = readHistory();
	expect(runs[0]!.backend).toBe('js');
});
```

- [ ] **Step 2: Run the CLI/history tests to verify they fail**

Run:

```bash
pnpm exec vitest run packages/validator/tests/cli.test.ts packages/validator/tests/history.test.ts
```

Expected: FAIL because CLI/history code still emits or expects `typescript` for the deprecated backend.

- [ ] **Step 3: Rename CLI backend labels and persisted history values**

```ts
// packages/validator/src/cli.ts
const ALL_CLI_BACKENDS = ['native', 'js', 'all'] as const;

function resolveBackends(mode: CliBackend): Backend[] {
	switch (mode) {
		case 'native':
			return ['native'];
		case 'js':
			return ['js'];
		case 'all':
			return ['native', 'js'];
	}
}

function formatBackendLabel(backend: Backend): 'native' | 'js' {
	return backend;
}
```

```ts
// packages/validator/src/history.ts
export interface ValidationRun {
	ts: string;
	grammar: Grammar;
	backend: Backend;
	// ... existing counters unchanged
}
```

```ts
// packages/validator/src/native-staleness.ts
console.warn(
	`⚠ [${grammar}] STALE NATIVE BINARY — templates were regenerated after the last napi build ` +
	`... \`--backend native\` may silently fall back to JS render (FR-020) ...`,
);
```

```bash
# normalize existing checked-in history rows
node -e "const fs=require('node:fs'); const p='packages/validator/validation-history.jsonl'; const out=fs.readFileSync(p,'utf8').split('\n').map(line=>{ if(!line.trim()||line.startsWith('//')) return line; const obj=JSON.parse(line); if(obj.backend==='typescript') obj.backend='js'; return JSON.stringify(obj); }).join('\n'); fs.writeFileSync(p,out);"
```

- [ ] **Step 4: Run the validator CLI/history tests to verify they pass**

Run:

```bash
pnpm exec vitest run packages/validator/tests/cli.test.ts packages/validator/tests/history.test.ts
```

Expected: PASS, with CLI output and appended history rows using `js`.

- [ ] **Step 5: Run a focused CLI smoke check**

Run:

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend js rust
pnpm exec tsx packages/validator/src/cli.ts history 1
```

Expected:

- first command prints `rust/js:`
- second command prints `<grammar>/js` for any newly-recorded deprecated-backend row

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/cli.ts packages/validator/src/history.ts packages/validator/src/native-staleness.ts packages/validator/tests/cli.test.ts packages/validator/tests/history.test.ts packages/validator/validation-history.jsonl
git commit -m "refactor(validator): rename deprecated backend outputs to js"
```

### Task 3: Rename codegen/probe/script backend identities to `js`

**Files:**

- Modify: `packages/codegen/src/validate/common.ts`
- Modify: `packages/codegen/src/validate/from.ts`
- Modify: `packages/codegen/src/validate/factory-render-parse.ts`
- Modify: `packages/codegen/src/validate/read-render-parse.ts`
- Modify: `packages/codegen/src/scripts/collect-baseline.ts`
- Modify: `packages/codegen/src/scripts/check-baseline-regression.ts`
- Modify: `packages/codegen/src/scripts/probe-kind.ts`
- Modify: `packages/codegen/src/scripts/probe-validate.ts`
- Modify: `packages/codegen/src/__tests__/check-baseline-regression.test.ts`
- Modify: `scripts/list-rt-failures.mts`
- Modify: `scripts/list-rt-details.mts`

- [ ] **Step 1: Write the failing backend-schema tests**

```ts
// packages/codegen/src/__tests__/check-baseline-regression.test.ts
function baseline(backend: 'js' | 'native' = 'js'): BackendBaseline {
	return {
		grammar: 'rust',
		backend,
		covPass: 1,
		covTotal: 1,
		readRenderParsePass: 1,
		readRenderParseTotal: 1,
		readRenderParseAstMatchPass: 1,
	};
}

it('accepts js as the non-native backend label', () => {
	const base = baseline('js');
	expect(base.backend).toBe('js');
});
```

- [ ] **Step 2: Run the codegen script tests to verify they fail**

Run:

```bash
pnpm exec vitest run packages/codegen/src/__tests__/check-baseline-regression.test.ts
```

Expected: FAIL because codegen-side backend schemas still only admit `typescript | native`.

- [ ] **Step 3: Rename codegen-side backend values and probe serialization**

```ts
// packages/codegen/src/validate/read-render-parse.ts
export interface ValidateReadRenderParseOptions {
	backend?: 'native' | 'js';
	recursive?: boolean;
	stopOnFirstFailure?: boolean;
}
```

```ts
// packages/codegen/src/scripts/check-baseline-regression.ts
if (obj['backend'] !== 'js' && obj['backend'] !== 'native') {
	return {
		ok: false,
		summary: `${label}.backend is not 'js' | 'native'`,
	};
}
```

```ts
// packages/codegen/src/scripts/probe-validate.ts
backend: engine === 'native' ? 'native' : 'js',
```

```ts
// scripts/list-rt-failures.mts / scripts/list-rt-details.mts
const backend = (process.argv[3] ?? 'native') as 'native' | 'js';
```

- [ ] **Step 4: Run the codegen/backend regression tests to verify they pass**

Run:

```bash
pnpm exec vitest run packages/codegen/src/__tests__/check-baseline-regression.test.ts packages/validator/tests/run.test.ts
```

Expected: PASS, with codegen/validator backend types aligned on `js | native`.

- [ ] **Step 5: Run probe/script smoke checks**

Run:

```bash
pnpm exec tsx packages/codegen/src/scripts/probe-validate.ts --grammar rust --engine js --stop-on-first-failure
pnpm exec tsx scripts/list-rt-failures.mts rust js
pnpm exec tsx scripts/list-rt-details.mts rust js
```

Expected:

- no parser/argument error for `js`
- emitted JSON/text labels say `js`, not `typescript`, when naming the deprecated backend

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/validate/common.ts packages/codegen/src/validate/from.ts packages/codegen/src/validate/factory-render-parse.ts packages/codegen/src/validate/read-render-parse.ts packages/codegen/src/scripts/collect-baseline.ts packages/codegen/src/scripts/check-baseline-regression.ts packages/codegen/src/scripts/probe-kind.ts packages/codegen/src/scripts/probe-validate.ts packages/codegen/src/__tests__/check-baseline-regression.test.ts scripts/list-rt-failures.mts scripts/list-rt-details.mts
git commit -m "refactor(codegen): rename deprecated backend to js"
```

### Task 4: Align `sittir-*` agent prompts and perform the final terminology sweep

**Files:**

- Modify: `.claude/agents/sittir-research.md`
- Modify: `.claude/agents/sittir-review.md`
- Modify: `.claude/agents/sittir-codegen.md`
- Test: `packages/validator/tests/cli.test.ts`

- [ ] **Step 1: Add the prompt wording changes**

```md
<!-- .claude/agents/sittir-research.md -->
- **NEVER** diagnose the deprecated JS engine path. `packages/common/src/readNode.ts` (the JS one-level tree-walk reader) and `@sittir/core`'s JS/Nunjucks renderer are **`@deprecated`**. Production reads via the rust native `read_node` and renders via the native transport + Askama templates.
- The TypeScript language pack remains in scope; only the JS engine/backend is deprecated.
```

```md
<!-- .claude/agents/sittir-review.md -->
4. **Gate completeness** — ... raw `counts` instead of `pnpm validate:native` (a stale `.node` silently falls back to the JS engine path and masks regressions ...) ...
```

```md
<!-- .claude/agents/sittir-codegen.md -->
- run native counts for the affected grammar(s) ... report the real `js` vs `native` labels where backend terminology is discussed
- do not treat the TypeScript language pack as deprecated
```

- [ ] **Step 2: Run a repo terminology sweep to verify the intended distinction**

Run:

```bash
rg -n "TS path|JS/TS path|stale/TS path|engine typescript" .claude/agents packages/validator/src packages/codegen/src/scripts scripts
rg -n "backend\":\"typescript\"" packages/validator/validation-history.jsonl packages/codegen/src
```

Expected:

- first command returns only intentional TypeScript grammar/package references, not deprecated-backend wording
- second command returns no backend=`typescript` rows where the meaning is the deprecated engine

- [ ] **Step 3: Run the focused test bundle**

Run:

```bash
pnpm exec vitest run packages/validator/tests/run.test.ts packages/validator/tests/history.test.ts packages/validator/tests/cli.test.ts packages/codegen/src/__tests__/check-baseline-regression.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run final terminology smoke commands**

Run:

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend js rust
pnpm exec tsx packages/validator/src/cli.ts probe-factory --backend all rust
pnpm exec tsx packages/tools/src/cli.ts dump-ast-mismatches --grammar rust --format json
```

Expected:

- validator commands print `js` / `native`
- no deprecated-backend output still prints `typescript`
- tool grammar selection still accepts `typescript` where it refers to the language pack

- [ ] **Step 5: Commit**

```bash
git add .claude/agents/sittir-research.md .claude/agents/sittir-review.md .claude/agents/sittir-codegen.md packages/validator/tests/run.test.ts packages/validator/tests/history.test.ts packages/validator/tests/cli.test.ts packages/codegen/src/__tests__/check-baseline-regression.test.ts
git commit -m "docs(agents): align js-vs-native terminology"
```

## Self-review checklist

- Spec coverage:
  - backend terminology rename → Tasks 1-3
  - machine-readable outputs/history rename → Tasks 2-3
  - `sittir-*` prompt alignment → Task 4
  - preserve TypeScript language-pack naming → Tasks 1-4 checks
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency:
  - backend contract should be `js | native`
  - grammar contract should remain `rust | python | typescript`
  - prompt wording should say **JS engine** vs **TypeScript language pack**
