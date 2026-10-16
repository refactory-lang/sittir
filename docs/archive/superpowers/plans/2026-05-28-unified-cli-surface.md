# Unified `@sittir/cli` Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the three CLI entry points (`codegen`, `tools`, `validator`) into one `sittir <namespace> <command>` binary backed by a shared commander framework, and extract codegen's orchestration logic into reusable library entries.

**Architecture:** A new top-of-stack `@sittir/cli` package depends on `@sittir/codegen`, `@sittir/validator`, `@sittir/tools` (the dependency order is linear: `core/common → codegen → validator → tools → cli`, no cycle). Commands are light `CommandModule` objects registered onto one commander program under three namespaces (`gen`, `validate`, `tool`). Shared options are composable mixins; codegen's `--all` orchestration moves into `runCodegen()`/`runFullRegen()` library functions; the validator's `run*Cli` functions move out of its CLI file into a library module. The three old `cli.ts` files are deleted and every caller (npm scripts, `run-validate.sh`, agent docs, tests) is repointed in the cutover phase.

**Tech Stack:** TypeScript (ESM, `.ts` extensions on local imports), `tsx` for source execution, `commander` ^15, `vitest`, pnpm workspaces, tsconfig `@sittir/*` path mapping (runs from source — no dist build in the loop).

---

## Reference facts (read before starting)

- **Tools run from source.** Root `tsconfig.json` maps `@sittir/*` → `packages/<name>/src/*.ts`; `tsx` honours these at runtime. No package needs a dist build to be runnable. (See memory `project_tsconfig_paths_source_resolution`.)
- **The `sittir` bin is currently owned by `packages/codegen/package.json`** (`"bin": { "sittir": "./src/cli.ts" }`). This plan moves it to `@sittir/cli`.
- **Every tool today exports `run(argv: string[]): Promise<number>`** and parses `argv` ad-hoc. Conversion changes the signature to `run(opts): Promise<number>` and deletes the ad-hoc parser; the command's option declarations move to a `CommandModule` in `@sittir/cli`.
- **The validator already uses commander** with `makeBackendOption()`/`makeRecursiveOption()` factories and `resolveGrammars()`/`resolveBackends()` helpers — these are the seed of the shared framework.
- **`scripts/run-validate.sh` regenerates all three grammars before validating** so `--backend native` counts are true-native. This behaviour is correctness, not packaging, and must be preserved (memory `project_native_build_and_staleness`).
- **`defaultTemplatesPath`, `runFrom`, `runRt`, `runCoverage`, `runFactory`** are exported from `packages/validator/src/run.ts`.
- **Commit discipline:** always `git commit -- <paths>` (pathspec-scoped) so hook-auto-staged files aren't swept in (memory `feedback_pathspec_commit_in_dirty_tree`). Put `-m "..."` *before* `--`.
- **Co-author trailer** on every commit: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## File structure (created / modified)

**New package `packages/cli/`:**
- `package.json` — name `@sittir/cli`, `bin.sittir → ./src/cli.ts`, deps on codegen/validator/tools/commander.
- `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts` — mirror `packages/validator/`.
- `src/cli.ts` — main: builds the commander program, registers namespaces, `parseAsync`.
- `src/framework/command-module.ts` — `CommandModule` interface + namespace registrar.
- `src/framework/options.ts` — option mixins (`withGrammar`/`withBackend`/`withRecursive`/`withOutput`).
- `src/framework/resolvers.ts` — re-exports `resolveGrammars`/`resolveBackends` (from validator) + `defaultTemplatesPath`.
- `src/commands/gen.ts` — the `gen` CommandModule.
- `src/commands/validate/{counts,probe-factory,history,trace-rt}.ts` — one CommandModule each.
- `src/commands/validate/index.ts` — `validate` namespace registrar.
- `src/commands/tool/<name>.ts` — one CommandModule per tool (22 files).
- `src/commands/tool/index.ts` — `tool` namespace registrar.
- `tests/**` — framework + per-command tests.

**Modified (codegen):**
- `packages/codegen/src/run-codegen.ts` — **new**: `runCodegen()`, `runFullRegen()` (logic lifted from `cli.ts`).
- `packages/codegen/src/index.ts` — export the new library entries.
- `packages/codegen/package.json` — add `./run-codegen` export, **remove** `bin`.
- `packages/codegen/src/cli.ts` — **deleted** in cutover.

**Modified (validator):**
- `packages/validator/src/commands.ts` — **new**: `runCountsCli`/`runProbeFactoryCli`/`runHistoryCli`/`runTraceRtCli` + `resolveGrammars`/`resolveBackends` (lifted from `cli.ts`).
- `packages/validator/src/index.ts` — re-export from `commands.ts`.
- `packages/validator/src/cli.ts` — **deleted** in cutover.

**Modified (tools):**
- `packages/tools/src/<group>/<tool>.ts` — `run(argv)` → `run(opts)` (22 files).
- `packages/tools/src/cli.ts` — **deleted** in cutover.
- `packages/tools/src/validate/counts.ts` + `packages/codegen/src/scripts/counts.ts` — **deleted** (the 4-hop `counts` shim; canonical is `sittir validate counts`).

**Modified (callers / docs):**
- root `package.json` scripts, `scripts/run-validate.sh` (deleted), `tsconfig.json` paths.
- `.claude/agents/sittir-codegen.md`, `.github/agents/*.agent.md`, `CLAUDE.md`.
- `docs/cli-command-glossary.md` — **new**.

---

# Phase 1 — Framework + `gen` + `validate`

## Task 1: Scaffold the `@sittir/cli` package

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/tsconfig.build.json`
- Create: `packages/cli/vitest.config.ts`
- Create: `packages/cli/src/cli.ts`
- Modify: `tsconfig.json` (root) — add path mapping
- Modify: `packages/codegen/package.json` — remove `bin`

- [ ] **Step 1: Create the package manifest**

Create `packages/cli/package.json`:

```json
{
  "name": "@sittir/cli",
  "version": "0.1.0",
  "description": "Unified sittir command-line surface",
  "license": "MIT",
  "type": "module",
  "bin": { "sittir": "./src/cli.ts" },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "pnpm run clean && tsgo -p tsconfig.build.json",
    "clean": "rm -rf dist tsconfig.build.tsbuildinfo tsconfig.tsbuildinfo",
    "test": "vitest run",
    "type-check": "tsgo --noEmit"
  },
  "dependencies": {
    "@sittir/codegen": "workspace:*",
    "@sittir/validator": "workspace:*",
    "@sittir/tools": "workspace:*",
    "commander": "^15.0.0-0"
  },
  "devDependencies": {
    "@types/node": "^25.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig files** (copy the shape of `packages/validator/tsconfig.json` and `tsconfig.build.json`)

Run: `cp packages/validator/tsconfig.json packages/cli/tsconfig.json && cp packages/validator/tsconfig.build.json packages/cli/tsconfig.build.json && cp packages/validator/vitest.config.ts packages/cli/vitest.config.ts`
Expected: three files created. Open each and confirm no validator-specific `references`/paths remain; adjust include globs to `src/**/*.ts` / `tests/**/*.ts` if needed.

- [ ] **Step 3: Add the root tsconfig path mapping**

Modify `tsconfig.json` (root) — inside `"paths"`, after the `@sittir/tools/cli` entry, add:

```jsonc
"@sittir/cli": ["./packages/cli/src/cli.ts"]
```

- [ ] **Step 4: Remove the bin from codegen so the name is free**

Modify `packages/codegen/package.json` — delete the block:

```json
	"bin": {
		"sittir": "./src/cli.ts"
	},
```

- [ ] **Step 5: Write a placeholder main so the package resolves**

Create `packages/cli/src/cli.ts`:

```ts
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command()
	.name('sittir')
	.description('Unified sittir command-line surface');

// Namespaces are registered in later tasks.

await program.parseAsync(process.argv);
```

- [ ] **Step 6: Install and verify the workspace links**

Run: `pnpm install`
Expected: completes; `@sittir/cli` appears in the workspace. Then run: `pnpm exec tsx packages/cli/src/cli.ts --help`
Expected: prints `Usage: sittir ...` with no commands yet.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(cli): scaffold @sittir/cli package

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/package.json packages/cli/tsconfig.json packages/cli/tsconfig.build.json packages/cli/vitest.config.ts packages/cli/src/cli.ts tsconfig.json packages/codegen/package.json pnpm-lock.yaml
```

---

## Task 2: The `CommandModule` interface + namespace registrar

**Files:**
- Create: `packages/cli/src/framework/command-module.ts`
- Test: `packages/cli/tests/framework/command-module.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/tests/framework/command-module.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerNamespace, type CommandModule } from '../../src/framework/command-module.ts';

describe('registerNamespace', () => {
	it('creates a subcommand group and registers each module under it', () => {
		const a: CommandModule = { name: 'alpha', describe: 'Alpha cmd', register: (p) => { p.command('alpha').action(() => {}); } };
		const b: CommandModule = { name: 'beta', describe: 'Beta cmd', register: (p) => { p.command('beta').action(() => {}); } };
		const program = new Command();
		registerNamespace(program, 'demo', 'Demo namespace', [a, b]);
		const demo = program.commands.find((c) => c.name() === 'demo');
		expect(demo).toBeDefined();
		const names = demo!.commands.map((c) => c.name()).sort();
		expect(names).toEqual(['alpha', 'beta']);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/cli/tests/framework/command-module.test.ts`
Expected: FAIL — cannot find module `command-module.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `packages/cli/src/framework/command-module.ts`:

```ts
import type { Command } from 'commander';

/**
 * A single CLI command. `register` receives the parent commander program (or
 * namespace sub-program) and attaches exactly one command via `parent.command(...)`.
 */
export interface CommandModule {
	readonly name: string;
	readonly describe: string;
	register(parent: Command): void;
}

/**
 * Create a namespace sub-command (e.g. `validate`) on `program` and register
 * every module's command under it.
 */
export function registerNamespace(
	program: Command,
	namespace: string,
	describe: string,
	modules: readonly CommandModule[],
): void {
	const group = program.command(namespace).description(describe);
	for (const mod of modules) mod.register(group);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/cli/tests/framework/command-module.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(cli): add CommandModule interface and namespace registrar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/src/framework/command-module.ts packages/cli/tests/framework/command-module.test.ts
```

---

## Task 3: Option mixins

**Files:**
- Create: `packages/cli/src/framework/options.ts`
- Test: `packages/cli/tests/framework/options.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/tests/framework/options.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { withGrammar, withBackend, withRecursive, withOutput } from '../../src/framework/options.ts';

function optsFor(build: (c: Command) => Command, argv: string[]): Record<string, unknown> {
	let captured: Record<string, unknown> = {};
	const cmd = build(new Command('t')).action((o) => { captured = o; });
	cmd.parse(argv, { from: 'user' });
	return captured;
}

describe('option mixins', () => {
	it('withBackend defaults to native and accepts choices', () => {
		expect(optsFor(withBackend, []).backend).toBe('native');
		expect(optsFor(withBackend, ['--backend', 'js']).backend).toBe('js');
	});
	it('withRecursive is a boolean flag defaulting false', () => {
		expect(optsFor(withRecursive, []).recursive).toBe(false);
		expect(optsFor(withRecursive, ['--recursive']).recursive).toBe(true);
	});
	it('withGrammar accepts -g shorthand', () => {
		expect(optsFor(withGrammar, ['-g', 'rust']).grammar).toBe('rust');
	});
	it('withOutput accepts -o shorthand', () => {
		expect(optsFor(withOutput, ['-o', 'out/']).output).toBe('out/');
	});
	it('mixins compose on one command', () => {
		const o = optsFor((c) => withRecursive(withBackend(c)), ['--backend', 'all', '--recursive']);
		expect(o).toMatchObject({ backend: 'all', recursive: true });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/cli/tests/framework/options.test.ts`
Expected: FAIL — cannot find module `options.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `packages/cli/src/framework/options.ts`:

```ts
import { type Command, Option } from 'commander';

/** Grammar names accepted across the CLI. */
export const GRAMMARS = ['rust', 'typescript', 'python'] as const;
/** Backend modes accepted by validate/tool commands. */
export const BACKENDS = ['native', 'js', 'all'] as const;

/** Add `-g, --grammar <name>` (choices: rust|typescript|python). Returns the command for chaining. */
export function withGrammar(cmd: Command): Command {
	return cmd.addOption(
		new Option('-g, --grammar <name>', 'Grammar to operate on').choices([...GRAMMARS]),
	);
}

/** Add `-b, --backend <backend>` (native|js|all), default native. */
export function withBackend(cmd: Command): Command {
	return cmd.addOption(
		new Option('-b, --backend <backend>', 'Validation backend')
			.choices([...BACKENDS])
			.default('native'),
	);
}

/** Add `-r, --recursive` boolean flag, default false. */
export function withRecursive(cmd: Command): Command {
	return cmd.addOption(
		new Option('-r, --recursive', 'Use recursive deep-read instead of shallow').default(false),
	);
}

/** Add `-o, --output <dir>` output directory. */
export function withOutput(cmd: Command): Command {
	return cmd.addOption(new Option('-o, --output <dir>', 'Output directory'));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/cli/tests/framework/options.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(cli): add composable option mixins

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/src/framework/options.ts packages/cli/tests/framework/options.test.ts
```

---

## Task 4: Move validator `run*Cli` functions into a library module

This frees the validator's logic from its `cli.ts` so `@sittir/cli` can import it, and keeps the validator's existing tests working (repointed to the new module).

**Files:**
- Create: `packages/validator/src/commands.ts`
- Modify: `packages/validator/src/index.ts`
- Modify: `packages/validator/src/cli.ts:345-387` (remove the commander entry block only; leave it otherwise until cutover)
- Modify: `packages/validator/tests/cli.test.ts:35` (repoint import)

- [ ] **Step 1: Move the functions**

Create `packages/validator/src/commands.ts` by moving, **verbatim**, these from `packages/validator/src/cli.ts`: `ALL_GRAMMARS`, `ALL_CLI_BACKENDS`, `CliBackend`, `resolveGrammars`, `resolveBackends`, `formatBackendLabel`, `GrammarCounts`, `collectGrammarCounts`, `formatGrammarCounts`, `formatFirstFailures`, `toValidationRun`, `grammarProbeFactory`, `runCountsCli`, `runProbeFactoryCli`, `runHistoryCli`, `runTraceRtCli`, `loadProbeTrace`, `loadValidateReadRenderParse`, and the two `*Fn` types. Keep all imports they need (`./run.ts`, `./history.ts`, `./native-staleness.ts`, `@sittir/codegen/validate/read-render-parse`). Export `resolveGrammars`, `resolveBackends`, and all four `run*Cli` functions.

Leave `makeBackendOption`/`makeRecursiveOption` and the `if (process.argv[1] === ...)` block in `cli.ts` for now (deleted in cutover Task 16).

- [ ] **Step 2: Re-export from the package index**

Modify `packages/validator/src/index.ts` — add:

```ts
export { runCountsCli, runProbeFactoryCli, runHistoryCli, runTraceRtCli, resolveGrammars, resolveBackends } from './commands.ts';
```

(If `index.ts` already re-exports these from `./cli.ts`, change the source to `./commands.ts`.)

- [ ] **Step 3: Repoint the validator CLI to re-use the moved functions**

Modify `packages/validator/src/cli.ts` — replace the moved definitions with an import from `./commands.ts` (so the commander block still works until deleted):

```ts
import { runCountsCli, runProbeFactoryCli, runHistoryCli, runTraceRtCli, resolveGrammars, resolveBackends } from './commands.ts';
```

- [ ] **Step 4: Repoint the existing test import**

Modify `packages/validator/tests/cli.test.ts:35` — change:

```ts
import { runCountsCli, runProbeFactoryCli, runHistoryCli } from '../src/cli.ts';
```
to:
```ts
import { runCountsCli, runProbeFactoryCli, runHistoryCli } from '../src/commands.ts';
```

- [ ] **Step 5: Run the validator test suite to verify nothing broke**

Run: `pnpm exec vitest run packages/validator`
Expected: PASS — the same tests as before, now importing from `commands.ts`.

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor(validator): move run*Cli logic out of cli.ts into commands.ts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/validator/src/commands.ts packages/validator/src/index.ts packages/validator/src/cli.ts packages/validator/tests/cli.test.ts
```

---

## Task 5: Resolvers module

**Files:**
- Create: `packages/cli/src/framework/resolvers.ts`
- Test: `packages/cli/tests/framework/resolvers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/tests/framework/resolvers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveGrammars, resolveBackends, defaultTemplatesPath } from '../../src/framework/resolvers.ts';

describe('resolvers', () => {
	it('resolveGrammars drops unknown names and defaults to all', () => {
		expect(resolveGrammars(['rust', 'bogus'])).toEqual(['rust']);
		expect(resolveGrammars([])).toEqual(['rust', 'typescript', 'python']);
	});
	it('resolveBackends expands all', () => {
		expect(resolveBackends('all')).toEqual(['native', 'js']);
		expect(resolveBackends('native')).toEqual(['native']);
	});
	it('defaultTemplatesPath returns a per-grammar path', () => {
		expect(defaultTemplatesPath('rust')).toMatch(/rust/);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/cli/tests/framework/resolvers.test.ts`
Expected: FAIL — cannot find module `resolvers.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `packages/cli/src/framework/resolvers.ts`:

```ts
// Single source of truth: re-export the validator's resolution helpers so the
// CLI does not reimplement grammar/backend parsing.
export { resolveGrammars, resolveBackends } from '@sittir/validator';
export { defaultTemplatesPath } from '@sittir/validator/run';
```

Note: if `@sittir/validator/run` is not an exposed subpath, add it to the validator's `package.json` exports and the root tsconfig `paths` (mirror the existing `@sittir/tools/cli` entry), or re-export `defaultTemplatesPath` from `@sittir/validator`'s index and import it from there. Prefer the index re-export to avoid a new subpath.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/cli/tests/framework/resolvers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(cli): add shared resolvers re-exporting validator helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/src/framework/resolvers.ts packages/cli/tests/framework/resolvers.test.ts packages/validator/src/index.ts
```

---

## Task 6: `validate` namespace CommandModules

**Files:**
- Create: `packages/cli/src/commands/validate/counts.ts`
- Create: `packages/cli/src/commands/validate/probe-factory.ts`
- Create: `packages/cli/src/commands/validate/history.ts`
- Create: `packages/cli/src/commands/validate/trace-rt.ts`
- Create: `packages/cli/src/commands/validate/index.ts`
- Test: `packages/cli/tests/commands/validate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/tests/commands/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { validateModules } from '../../src/commands/validate/index.ts';

describe('validate namespace', () => {
	it('exposes counts, probe-factory, history, trace-rt', () => {
		const names = validateModules.map((m) => m.name).sort();
		expect(names).toEqual(['counts', 'history', 'probe-factory', 'trace-rt']);
	});
	it('each module registers exactly one command', () => {
		for (const mod of validateModules) {
			const program = new Command();
			mod.register(program);
			expect(program.commands.map((c) => c.name())).toEqual([mod.name]);
		}
	});
	it('counts command exposes --backend with native default', () => {
		const program = new Command();
		validateModules.find((m) => m.name === 'counts')!.register(program);
		const counts = program.commands.find((c) => c.name() === 'counts')!;
		const opt = counts.options.find((o) => o.long === '--backend');
		expect(opt?.defaultValue).toBe('native');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/cli/tests/commands/validate.test.ts`
Expected: FAIL — cannot find `validate/index.ts`.

- [ ] **Step 3: Write the four CommandModules**

Create `packages/cli/src/commands/validate/counts.ts`:

```ts
import type { CommandModule } from '../../framework/command-module.ts';
import { withBackend } from '../../framework/options.ts';
import { runCountsCli } from '@sittir/validator';

export const counts: CommandModule = {
	name: 'counts',
	describe: 'Per-grammar raw pass/total counts for all four validators',
	register: (program) => {
		withBackend(program.command('counts'))
			.description('Per-grammar raw pass/total counts for all four validators')
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.action(async (grammars: string[], opts: { backend: 'native' | 'js' | 'all' }) => {
				await runCountsCli(grammars, opts.backend);
			});
	},
};
```

Create `packages/cli/src/commands/validate/probe-factory.ts`:

```ts
import type { CommandModule } from '../../framework/command-module.ts';
import { withBackend } from '../../framework/options.ts';
import { runProbeFactoryCli } from '@sittir/validator';

export const probeFactory: CommandModule = {
	name: 'probe-factory',
	describe: 'Factory-render-parse error bucketing (top-8 buckets)',
	register: (program) => {
		withBackend(program.command('probe-factory'))
			.description('Factory-render-parse error bucketing (top-8 buckets)')
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.action(async (grammars: string[], opts: { backend: 'native' | 'js' | 'all' }) => {
				await runProbeFactoryCli(grammars, opts.backend);
			});
	},
};
```

Create `packages/cli/src/commands/validate/history.ts`:

```ts
import type { CommandModule } from '../../framework/command-module.ts';
import { runHistoryCli } from '@sittir/validator';

export const history: CommandModule = {
	name: 'history',
	describe: 'Print last N validation history entries',
	register: (program) => {
		program
			.command('history')
			.description('Print last N validation history entries')
			.argument('[n]', 'Number of entries to show', '10')
			.action((n: string) => { runHistoryCli([n]); });
	},
};
```

Create `packages/cli/src/commands/validate/trace-rt.ts`:

```ts
import type { CommandModule } from '../../framework/command-module.ts';
import { withBackend, withRecursive } from '../../framework/options.ts';
import { runTraceRtCli, resolveBackends } from '@sittir/validator';

export const traceRt: CommandModule = {
	name: 'trace-rt',
	describe: 'Replay the first failing read-render-parse case as a rich trace',
	register: (program) => {
		withRecursive(withBackend(program.command('trace-rt')))
			.description('Replay the first failing read-render-parse case as a rich trace')
			.argument('<grammar>', 'Grammar to trace (rust, typescript, python)')
			.action(async (grammar: string, opts: { backend: 'native' | 'js' | 'all'; recursive: boolean }) => {
				for (const backend of resolveBackends(opts.backend)) {
					await runTraceRtCli(grammar as 'rust' | 'typescript' | 'python', backend, { recursive: opts.recursive });
				}
			});
	},
};
```

Create `packages/cli/src/commands/validate/index.ts`:

```ts
import type { Command } from 'commander';
import type { CommandModule } from '../../framework/command-module.ts';
import { registerNamespace } from '../../framework/command-module.ts';
import { counts } from './counts.ts';
import { probeFactory } from './probe-factory.ts';
import { history } from './history.ts';
import { traceRt } from './trace-rt.ts';

export const validateModules: readonly CommandModule[] = [counts, probeFactory, history, traceRt];

export function registerValidate(program: Command): void {
	registerNamespace(program, 'validate', 'Validation utilities for sittir grammar packages', validateModules);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/cli/tests/commands/validate.test.ts`
Expected: PASS (all 3).

- [ ] **Step 5: Wire `validate` into the main program**

Modify `packages/cli/src/cli.ts` — add `import { registerValidate } from './commands/validate/index.ts';` and call `registerValidate(program);` before `parseAsync`.

- [ ] **Step 6: Smoke-test the live command (mocked-free, real validator) on one grammar**

Run: `pnpm exec tsx packages/cli/src/cli.ts validate history`
Expected: prints validation history (or "No validation history found."). No crash.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(cli): add validate namespace (counts, probe-factory, history, trace-rt)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/src/commands/validate packages/cli/src/cli.ts packages/cli/tests/commands/validate.test.ts
```

---

## Task 7: Extract codegen orchestration into `runCodegen()` / `runFullRegen()`

This is the largest task: move the body of `mainCli` (post-arg-parsing) out of `packages/codegen/src/cli.ts` into a reusable library module. **Do not change behaviour** — this is a pure lift-and-shift so the `gen` command can call it.

**Files:**
- Create: `packages/codegen/src/run-codegen.ts`
- Modify: `packages/codegen/src/index.ts`
- Modify: `packages/codegen/package.json` (add export)
- Test: `packages/codegen/tests/run-codegen.test.ts`

- [ ] **Step 1: Define the options type and function signatures (write the failing test first)**

Create `packages/codegen/tests/run-codegen.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { runCodegen, runFullRegen, type CodegenOptions } from '../src/run-codegen.ts';

describe('run-codegen library surface', () => {
	it('exports runCodegen and runFullRegen as functions', () => {
		expect(typeof runCodegen).toBe('function');
		expect(typeof runFullRegen).toBe('function');
	});
	it('CodegenOptions shape is accepted at the type level', () => {
		const opts: CodegenOptions = { grammar: 'rust', outputDir: 'packages/rust/src', all: true };
		expect(opts.grammar).toBe('rust');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/codegen/tests/run-codegen.test.ts`
Expected: FAIL — cannot find `run-codegen.ts`.

- [ ] **Step 3: Create the library module by lifting the orchestration**

Create `packages/codegen/src/run-codegen.ts`. Move into it, from `cli.ts`:
- The `CodegenConfig` interface (rename its CLI-facing shape to `CodegenOptions` with optional flags: `grammar`, `outputDir`, `nodes?`, `all?`, `testsDir?`, `roundtrip?`, `compileParser?`, `transpile?`, `tsGenerate?`, `skipTsChain?`, `buildNative?`, `noEmitDiff?`, `allowDiagnostics?`).
- `runGrammarDiagnosticsPreflight`, `confirmProceed`, and the exported preflight test seam (the `_isMain`-guarded exports tests import — keep them exported here).
- `runTreeSitterGenerate`, `writeFile`.
- The full body of `mainCli` *after* arg-parsing (lines ~338–617): the standalone transpile/compile/ts-generate branch, the `--all` auto-chain, the `generate()` call, all the `writeFile` calls, the renderable check, manifest write, emit-diff, and the roundtrip probe block.

Split that body into two exported functions:

```ts
/** Core generate path: evaluate → generate → write all artifacts → manifest → optional roundtrip probes. */
export async function runCodegen(opts: CodegenOptions): Promise<void> { /* generate + writes + manifest + roundtrip */ }

/** Full regenerate: transpile → tree-sitter generate → compile-parser → runCodegen → native build → emit-diff. */
export async function runFullRegen(opts: CodegenOptions): Promise<void> { /* the --all chain, then calls runCodegen */ }
```

Inside the roundtrip block, **drop the `runRt`/`runFactory`/`runFrom` mirror wrappers** (lines 22–33 of `cli.ts`) and call the codegen validate modules directly: `validateReadRenderParse(grammar, tp, { backend: 'native' })`, `validateFactoryRenderParse(grammar, tp, 'native')`, `validateFrom(grammar, 'native')`. This removes the named duplication the spec flagged without introducing a cycle (these are codegen's own validate modules).

Preserve the `process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1'` guard at the top of `runFullRegen`/`runCodegen`.

- [ ] **Step 4: Export from the package index and manifest**

Modify `packages/codegen/src/index.ts` — add:
```ts
export { runCodegen, runFullRegen, type CodegenOptions } from './run-codegen.ts';
```

Modify `packages/codegen/package.json` — add an export subpath mirroring the existing ones:
```json
		"./run-codegen": {
			"types": "./src/run-codegen.ts",
			"source": "./src/run-codegen.ts",
			"import": "./dist/run-codegen.js",
			"default": "./dist/run-codegen.js"
		},
```
And add to root `tsconfig.json` paths: `"@sittir/codegen/run-codegen": ["./packages/codegen/src/run-codegen.ts"]`.

- [ ] **Step 5: Point the old `cli.ts mainCli` at the new functions (temporary, until cutover)**

Modify `packages/codegen/src/cli.ts` — replace the lifted body so `mainCli` parses args (keep `parseArgs`) then calls `runFullRegen`/`runCodegen`. This keeps `npx tsx packages/codegen/src/cli.ts` working identically through Phase 2; the file is deleted in cutover Task 16.

- [ ] **Step 6: Verify codegen still generates identically**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src`
Expected: same console output as before (transpile → generate → compile → codegen → manifest → emit-diff), exit 0. Then run: `git diff --stat packages/rust/src` — expect **no** generated-output changes (pure refactor).

- [ ] **Step 7: Run the codegen test suite**

Run: `pnpm exec vitest run packages/codegen/tests/run-codegen.test.ts && pnpm exec vitest run packages/codegen`
Expected: PASS (including any pre-existing cli test seams now importing from `run-codegen.ts` — repoint those imports if present).

- [ ] **Step 8: Commit**

```bash
git commit -m "refactor(codegen): extract runCodegen/runFullRegen library entries from cli.ts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/codegen/src/run-codegen.ts packages/codegen/src/index.ts packages/codegen/package.json packages/codegen/src/cli.ts packages/codegen/tests/run-codegen.test.ts tsconfig.json
```

---

## Task 8: `gen` CommandModule

**Files:**
- Create: `packages/cli/src/commands/gen.ts`
- Test: `packages/cli/tests/commands/gen.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/tests/commands/gen.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/codegen/run-codegen', () => ({
	runCodegen: vi.fn().mockResolvedValue(undefined),
	runFullRegen: vi.fn().mockResolvedValue(undefined),
}));

import { gen } from '../../src/commands/gen.ts';
import { runFullRegen, runCodegen } from '@sittir/codegen/run-codegen';

describe('gen command', () => {
	it('registers a single gen command with --grammar/--all/--output', () => {
		const program = new Command();
		gen.register(program);
		const cmd = program.commands.find((c) => c.name() === 'gen')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar', '--all', '--output', '--nodes']));
	});
	it('routes --all to runFullRegen', async () => {
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--output', 'packages/rust/src'], { from: 'user' });
		expect(vi.mocked(runFullRegen)).toHaveBeenCalledWith(expect.objectContaining({ grammar: 'rust', all: true, outputDir: 'packages/rust/src' }));
	});
	it('routes --nodes (no --all) to runCodegen', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--nodes', 'struct_item', '--output', 'packages/rust/src'], { from: 'user' });
		expect(vi.mocked(runCodegen)).toHaveBeenCalledWith(expect.objectContaining({ grammar: 'rust', nodes: ['struct_item'] }));
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/cli/tests/commands/gen.test.ts`
Expected: FAIL — cannot find `gen.ts`.

- [ ] **Step 3: Write the implementation**

Create `packages/cli/src/commands/gen.ts`:

```ts
import { Option } from 'commander';
import type { CommandModule } from '../framework/command-module.ts';
import { withGrammar, withOutput } from '../framework/options.ts';
import { runCodegen, runFullRegen, type CodegenOptions } from '@sittir/codegen/run-codegen';

interface GenCliOptions {
	grammar?: string;
	output?: string;
	nodes?: string;
	all?: boolean;
	testsDir?: string;
	transpile?: boolean;
	compileParser?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean;
	emitDiff?: boolean;
	allowDiagnostic?: string[];
}

export const gen: CommandModule = {
	name: 'gen',
	describe: 'Generate typed factories, templates, and native bindings from a grammar',
	register: (program) => {
		const cmd = withOutput(withGrammar(program.command('gen')))
			.description('Generate typed factories, templates, and native bindings from a grammar')
			.option('-n, --nodes <list>', 'Comma-separated node kinds to generate')
			.option('-a, --all', 'Generate TS + native artifacts (full chain)')
			.option('--tests-dir <dir>', 'Output directory for test files')
			.option('--transpile', 'Transpile overrides.ts → .sittir/grammar.js')
			.option('--compile-parser', 'Compile override grammar to .sittir/parser.wasm')
			.option('--ts-generate', "Run 'tree-sitter generate' in .sittir/")
			.option('--skip-ts-chain', 'Skip the auto transpile + tree-sitter generate chain')
			.addOption(new Option('--no-build-native', 'Skip the post-regen N-API rebuild'))
			.addOption(new Option('--no-emit-diff', 'Suppress the post-regen emit diff'))
			.option('--allow-diagnostic <code>', 'Allow a blocking grammar diagnostic (repeatable)', collectRepeatable, [])
			.action(async (opts: GenCliOptions) => {
				if (!opts.grammar) throw new Error('Missing required option: --grammar');
				const codegenOpts: CodegenOptions = {
					grammar: opts.grammar,
					outputDir: opts.output ?? '',
					nodes: opts.nodes?.split(','),
					all: opts.all,
					testsDir: opts.testsDir,
					transpile: opts.transpile,
					compileParser: opts.compileParser,
					tsGenerate: opts.tsGenerate,
					skipTsChain: opts.skipTsChain,
					buildNative: opts.buildNative,
					noEmitDiff: opts.emitDiff === false,
					allowDiagnostics: opts.allowDiagnostic,
				};
				if (opts.all) await runFullRegen(codegenOpts);
				else await runCodegen(codegenOpts);
			});
		return cmd;
	},
};

function collectRepeatable(value: string, previous: string[]): string[] {
	return [...previous, value];
}
```

Note: commander's `--no-build-native`/`--no-emit-diff` set `opts.buildNative`/`opts.emitDiff` to `false`. Map them as shown. Validate the `--output`/`--nodes`-or-`--all` requirements inside `runCodegen`/`runFullRegen` (they already do), or replicate the guards here to match the old CLI's early-exit messages.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/cli/tests/commands/gen.test.ts`
Expected: PASS (all 3).

- [ ] **Step 5: Wire `gen` into the main program**

Modify `packages/cli/src/cli.ts` — add `import { gen } from './commands/gen.ts';` and `gen.register(program);`.

- [ ] **Step 6: Live smoke test (real codegen, no native build for speed)**

Run: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --no-build-native --output packages/rust/src`
Expected: full chain runs, exit 0, `git diff --stat packages/rust/src` shows no changes vs the Task 7 run.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(cli): add gen command backed by runCodegen/runFullRegen

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/src/commands/gen.ts packages/cli/src/cli.ts packages/cli/tests/commands/gen.test.ts
```

---

## Task 9: Phase 1 integration checkpoint

- [ ] **Step 1: Full type-check and test the new package**

Run: `pnpm --filter @sittir/cli run type-check && pnpm exec vitest run packages/cli`
Expected: PASS, no type errors.

- [ ] **Step 2: Verify the three Phase-1 surfaces work end to end**

Run each, expect no crash:
```bash
pnpm exec tsx packages/cli/src/cli.ts --help
pnpm exec tsx packages/cli/src/cli.ts validate --help
pnpm exec tsx packages/cli/src/cli.ts gen --help
pnpm exec tsx packages/cli/src/cli.ts validate counts --backend native rust
```
Expected: `validate counts` regenerates rust then prints counts (regen+staleness preserved because `runCountsCli` already calls the staleness guard; the regen is driven by the npm-script path in cutover Task 14 — confirm the counts run itself is correct here).

- [ ] **Step 3: Commit any fixes, then proceed to Phase 2.**

---

# Phase 2 — Convert all 22 tools

Each tool keeps its core logic in `@sittir/tools` but: (a) its `run(argv: string[])` becomes `run(opts: <ToolOpts>): Promise<number>` with the ad-hoc `parseArgs` deleted, and (b) a `CommandModule` is added under `packages/cli/src/commands/tool/<name>.ts` declaring the options via mixins and calling `run(opts)`.

**Execution:** dispatch these conversions to Copilot CLI subagents in batches (they have LSP read-write). Each tool is gated on **output parity** before acceptance (Step "verify parity" below). The conversion is mechanical and identical in shape across tools — Task 10 is the fully-worked canonical example; Task 11 is the per-tool table; Task 12 is the namespace wiring.

## Task 10: Canonical conversion — `list-kinds`

**Files:**
- Modify: `packages/tools/src/discover/list-kinds.ts` (signature change, delete `parseArgs`)
- Create: `packages/cli/src/commands/tool/list-kinds.ts`
- Test: `packages/cli/tests/commands/tool/list-kinds.test.ts`

- [ ] **Step 1: Capture the pre-conversion output (parity baseline)**

Run: `pnpm exec tsx packages/tools/src/cli.ts list-kinds --grammar rust --groups > /tmp/list-kinds-before.txt 2>&1; echo "exit=$?"`
Expected: file written, note the exit code. Keep this file for Step 6.

- [ ] **Step 2: Change the tool's signature**

Modify `packages/tools/src/discover/list-kinds.ts`:
- Delete the `parseArgs` function (lines ~88–112) and the ad-hoc `argv` loop.
- Change the entry export to:

```ts
export interface ListKindsOptions {
	grammar: string;
	groups: boolean;
	unaliased: boolean;
	phantom: boolean;
}

export async function run(opts: ListKindsOptions): Promise<number> {
	// Default mode when no flag is given (preserves old behaviour).
	const showGroups = opts.groups || (!opts.unaliased && !opts.phantom && !opts.groups);
	const { grammar, unaliased: showUnaliased, phantom: showPhantom } = opts;
	// ... rest of the original run() body, using showGroups/showUnaliased/showPhantom/grammar ...
}
```
- Delete the bottom `_isMain` block (the tool is no longer a standalone entry; it's invoked via the CLI).

- [ ] **Step 3: Write the CommandModule + its failing test**

Create `packages/cli/tests/commands/tool/list-kinds.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools/discover/list-kinds', () => ({ run: vi.fn().mockResolvedValue(0) }));
import { listKinds } from '../../../src/commands/tool/list-kinds.ts';
import { run as toolRun } from '@sittir/tools/discover/list-kinds';

describe('tool list-kinds command', () => {
	it('registers with --grammar/--groups/--unaliased/--phantom', () => {
		const program = new Command();
		listKinds.register(program);
		const cmd = program.commands.find((c) => c.name() === 'list-kinds')!;
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--grammar', '--groups', '--unaliased', '--phantom']));
	});
	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		listKinds.register(program);
		await program.parseAsync(['list-kinds', '--grammar', 'rust', '--groups'], { from: 'user' });
		expect(vi.mocked(toolRun)).toHaveBeenCalledWith(expect.objectContaining({ grammar: 'rust', groups: true }));
	});
});
```

Create `packages/cli/src/commands/tool/list-kinds.ts`:

```ts
import type { CommandModule } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { run } from '@sittir/tools/discover/list-kinds';

export const listKinds: CommandModule = {
	name: 'list-kinds',
	describe: 'List groups, unaliased, and phantom kinds',
	register: (program) => {
		withGrammar(program.command('list-kinds'))
			.description('List groups, unaliased, and phantom kinds')
			.option('--groups', 'List all group-modelled kinds')
			.option('--unaliased', 'List groups with no visible non-group twin')
			.option('--phantom', 'List phantom kinds (nodeMap without a parser symbol)')
			.action(async (opts: { grammar?: string; groups?: boolean; unaliased?: boolean; phantom?: boolean }) => {
				const code = await run({
					grammar: opts.grammar ?? 'rust',
					groups: opts.groups ?? false,
					unaliased: opts.unaliased ?? false,
					phantom: opts.phantom ?? false,
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
```

Add the tool subpath to `packages/tools/package.json` exports + root tsconfig `paths` (mirror existing entries): `@sittir/tools/discover/list-kinds` → `packages/tools/src/discover/list-kinds.ts`.

- [ ] **Step 4: Run the unit test**

Run: `pnpm exec vitest run packages/cli/tests/commands/tool/list-kinds.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into the tool namespace** (this command is added to the array in Task 12; for the standalone parity check, register it on a throwaway program or wait until Task 12).

- [ ] **Step 6: Verify output parity**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool list-kinds --grammar rust --groups > /tmp/list-kinds-after.txt 2>&1; echo "exit=$?"`
Then: `diff /tmp/list-kinds-before.txt /tmp/list-kinds-after.txt`
Expected: empty diff (identical output), same exit code. The leading `=== rust ===` banner and group list must match byte-for-byte.

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor(tools): convert list-kinds to options-based run + cli CommandModule

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/tools/src/discover/list-kinds.ts packages/tools/package.json tsconfig.json packages/cli/src/commands/tool/list-kinds.ts packages/cli/tests/commands/tool/list-kinds.test.ts
```

---

## Task 11: Convert the remaining 21 tools (Copilot-parallelized)

Apply the **exact pattern from Task 10** to each tool below. For each: (1) capture pre-conversion output via the current `packages/tools/src/cli.ts <name> <args>`; (2) change `run(argv)` → `run(opts)`, deleting the tool's ad-hoc parser and `_isMain` block; (3) add `packages/cli/src/commands/tool/<file>.ts` declaring options via the appropriate mixins; (4) add the tool subpath to `packages/tools/package.json` exports + root tsconfig paths; (5) unit-test the CommandModule; (6) verify byte-for-byte output parity; (7) commit per tool (or per small batch) with the pathspec + co-author trailer.

**Dispatch instruction for Copilot CLI subagents** (per memory `reference_copilot_cli_connect`): hand each subagent one tool (or a batch of 2–3 in the same group), this plan section, and Task 10 as the worked reference. Require the parity diff to be empty before reporting done. Verify each subagent's diff yourself before accepting (memory `feedback_verify_cargo_not_gate` / `feedback_review_agent_work`).

Tool-by-tool specifics (current flags inferred from each tool's `parseArgs`; confirm against the source before converting):

| Tool | File (`packages/tools/src/...`) | CLI module file | Mixins | Tool-specific options | Notes |
|------|--------------------------------|-----------------|--------|------------------------|-------|
| `probe-kind` | `probe/kind.ts` | `tool/probe-kind.ts` | `withGrammar` | `--source <text>`, positional source/range | delegates to codegen `probe-kind` |
| `probe-stages` | `probe/stages.ts` | `tool/probe-stages.ts` | `withGrammar` | `--kind <k>` | dumps rule shape per phase |
| `probe-parity` | `probe/parity.ts` | `tool/probe-parity.ts` | `withGrammar` | `--kind <k>` | template coverage for a kind |
| `profile` | `profile/failures.ts` | `tool/profile.ts` | `withGrammar`, `withBackend` | filter flags | unified failure aggregation |
| `profile-factory` | `profile/factory.ts` | `tool/profile-factory.ts` | `withGrammar`, `withBackend` | `--mode shallow\|recursive\|ast` | factory validator profiling |
| `bench` | `profile/bench.ts` | `tool/bench.ts` | `withGrammar` | iteration count | native vs JS render bench |
| `bench-codemod` | `profile/codemod.ts` | `tool/bench-codemod.ts` | `withGrammar` | corpus path | codemod corpus bench |
| `diff-failures` | `validate/diff.ts` | `tool/diff-failures.ts` | `withGrammar`, `withBackend` | — | per-kind validator failures |
| `dump-ast-mismatches` | `validate/dump-ast-mismatches.ts` | `tool/dump-ast-mismatches.ts` | `withGrammar`, `withBackend` | clustering flags | RT AST gap diagnostic |
| `check-baseline` | `validate/baseline.ts` | `tool/check-baseline.ts` | `withGrammar` | `--update` | baseline regression gate |
| `check-perf` | `validate/perf.ts` | `tool/check-perf.ts` | `withGrammar` | threshold flags | native perf gate |
| `check-jinja` | `validate/jinja.ts` | `tool/check-jinja.ts` | `withGrammar` | `--kind <k>` | per-rule .jinja invariant |
| `classify` | `discover/classify.ts` | `tool/classify.ts` | `withGrammar` | `--kind <k>` | kind classification |
| `phantom-kinds` | `discover/phantom.ts` | `tool/phantom-kinds.ts` | `withGrammar` | — | parser kinds missing from node-types |
| `field-provenance` | `discover/provenance.ts` | `tool/field-provenance.ts` | `withGrammar` | `--kind <k>` | field source tracking |
| `inspect-type` | `inspect/type.ts` | `tool/inspect-type.ts` | `withGrammar` | `--type <t>` | loose type widening verify |
| `inspect-refs` | `inspect/refs.ts` | `tool/inspect-refs.ts` | `withGrammar` | `--symbol <s>` | symbol reference dump |
| `compare-overrides` | `inspect/overrides.ts` | `tool/compare-overrides.ts` | `withGrammar` | — | override key diffs |
| `grammar-diagnostics` | `inspect/grammar-diagnostics.ts` | `tool/grammar-diagnostics.ts` | `withGrammar` | — | pre-codegen grammar diagnostics |
| `walk` | `exercise/walk.ts` | `tool/walk.ts` | `withGrammar` | `--source <text>` | wrapped-node traversal + render |
| `exercise` | `exercise/roundtrip.ts` | `tool/exercise.ts` | `withGrammar` | corpus flags | round-trip exercise harness |

- [ ] **Step 1:** Convert each tool per the table + Task 10 pattern. Each tool's actual flag set is the source of truth — read its current `parseArgs` and reproduce every flag (including defaults like `list-kinds`'s implicit `--groups`).
- [ ] **Step 2:** For each tool, capture before/after output and confirm an empty parity diff.
- [ ] **Step 3:** Unit-test each CommandModule (registers under its name; passes parsed opts to `run`).
- [ ] **Step 4:** Commit per tool/batch with pathspec + co-author trailer.

---

## Task 12: `tool` namespace registrar

**Files:**
- Create: `packages/cli/src/commands/tool/index.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/tests/commands/tool/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/tests/commands/tool/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toolModules } from '../../../src/commands/tool/index.ts';

const EXPECTED = [
	'bench', 'bench-codemod', 'check-baseline', 'check-jinja', 'check-perf',
	'classify', 'compare-overrides', 'diff-failures', 'dump-ast-mismatches',
	'exercise', 'field-provenance', 'grammar-diagnostics', 'inspect-refs',
	'inspect-type', 'list-kinds', 'phantom-kinds', 'probe-kind', 'probe-parity',
	'probe-stages', 'profile', 'profile-factory', 'walk',
];

describe('tool namespace', () => {
	it('registers exactly the 22 converted tools', () => {
		expect(toolModules.map((m) => m.name).sort()).toEqual([...EXPECTED].sort());
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/cli/tests/commands/tool/index.test.ts`
Expected: FAIL — cannot find `tool/index.ts`.

- [ ] **Step 3: Write the registrar**

Create `packages/cli/src/commands/tool/index.ts` importing all 22 CommandModules and exporting them:

```ts
import type { Command } from 'commander';
import type { CommandModule } from '../../framework/command-module.ts';
import { registerNamespace } from '../../framework/command-module.ts';
import { bench } from './bench.ts';
import { benchCodemod } from './bench-codemod.ts';
import { checkBaseline } from './check-baseline.ts';
import { checkJinja } from './check-jinja.ts';
import { checkPerf } from './check-perf.ts';
import { classify } from './classify.ts';
import { compareOverrides } from './compare-overrides.ts';
import { diffFailures } from './diff-failures.ts';
import { dumpAstMismatches } from './dump-ast-mismatches.ts';
import { exercise } from './exercise.ts';
import { fieldProvenance } from './field-provenance.ts';
import { grammarDiagnostics } from './grammar-diagnostics.ts';
import { inspectRefs } from './inspect-refs.ts';
import { inspectType } from './inspect-type.ts';
import { listKinds } from './list-kinds.ts';
import { phantomKinds } from './phantom-kinds.ts';
import { probeKind } from './probe-kind.ts';
import { probeParity } from './probe-parity.ts';
import { probeStages } from './probe-stages.ts';
import { profile } from './profile.ts';
import { profileFactory } from './profile-factory.ts';
import { walk } from './walk.ts';

export const toolModules: readonly CommandModule[] = [
	bench, benchCodemod, checkBaseline, checkJinja, checkPerf, classify,
	compareOverrides, diffFailures, dumpAstMismatches, exercise, fieldProvenance,
	grammarDiagnostics, inspectRefs, inspectType, listKinds, phantomKinds,
	probeKind, probeParity, probeStages, profile, profileFactory, walk,
];

export function registerTools(program: Command): void {
	registerNamespace(program, 'tool', 'Developer diagnostics', toolModules);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/cli/tests/commands/tool/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into main + verify help**

Modify `packages/cli/src/cli.ts` — add `import { registerTools } from './commands/tool/index.ts';` and `registerTools(program);`.
Run: `pnpm exec tsx packages/cli/src/cli.ts tool --help`
Expected: lists all 22 tools.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(cli): register tool namespace with all 22 converted tools

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/cli/src/commands/tool/index.ts packages/cli/src/cli.ts packages/cli/tests/commands/tool/index.test.ts
```

---

## Task 13: Phase 2 checkpoint

- [ ] **Step 1: Type-check + test the whole new package**

Run: `pnpm --filter @sittir/cli run type-check && pnpm exec vitest run packages/cli`
Expected: PASS.

- [ ] **Step 2: Spot-check 3 tools live against their old entry**

For `probe-kind`, `diff-failures`, `grammar-diagnostics`: run old vs new and diff. Expected: empty diffs.

---

# Phase 3 — Cutover (atomic)

All of Phase 3 lands as one PR. Do not delete old entry points until every caller is repointed.

## Task 14: Repoint npm scripts and fold `run-validate.sh`

**Files:**
- Modify: root `package.json` (scripts)
- Delete: `scripts/run-validate.sh`

- [ ] **Step 1: Confirm the regen+staleness behaviour has a home in the CLI**

The old `run-validate.sh` regenerates all three grammars, then runs the validator. Reproduce this with a `sittir validate` invocation that regenerates first. Add a `--regen` flag to `validate counts`/`validate probe-factory` (default true for native) that calls `runFullRegen` for each grammar before counting, OR keep regen in the npm script as an explicit `sittir gen` chain. **Decision:** keep it in the npm script as an explicit chain (matches the old shell script's explicitness and avoids hidden regen):

- [ ] **Step 2: Rewrite the scripts**

Modify root `package.json` `scripts`. Factor the three-grammar regen into one `regen:all` script (DRY) and have the validate scripts depend on it, so counts run only after all three grammars regenerate — keeping `--backend native` counts true-native:

```json
    "regen:all": "tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src && tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src && tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src",
    "validate": "pnpm run regen:all && tsx packages/cli/src/cli.ts validate counts",
    "validate:native": "pnpm run regen:all && tsx packages/cli/src/cli.ts validate counts --backend native",
    "validate:js": "tsx packages/cli/src/cli.ts validate counts --backend js",
    "validate:all": "tsx packages/cli/src/cli.ts validate counts --backend all",
    "validate:probe-factory:native": "tsx packages/cli/src/cli.ts validate probe-factory --backend native",
    "validate:probe-factory:js": "tsx packages/cli/src/cli.ts validate probe-factory --backend js",
    "validate:probe-factory:all": "tsx packages/cli/src/cli.ts validate probe-factory --backend all",
    "validate:history": "tsx packages/cli/src/cli.ts validate history",
    "probe:kind": "tsx packages/cli/src/cli.ts tool probe-kind"
```

Leave `probe:validate` pointing at its codegen script (`tsx packages/codegen/src/scripts/probe-validate.ts`) — `probe-validate` is not in the tool registry and is out of scope for this surface.

- [ ] **Step 3: Delete the shell wrapper**

Run: `git rm scripts/run-validate.sh`

- [ ] **Step 4: Verify the headline script still produces counts**

Run: `pnpm run validate:native`
Expected: regenerates all three grammars, then prints native counts for all three — same shape as before the change.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: repoint validate npm scripts to sittir cli; remove run-validate.sh

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- package.json scripts/run-validate.sh
```

---

## Task 15: Update agent docs and CLAUDE.md (executable contracts)

**Files:**
- Modify: `.claude/agents/sittir-codegen.md`, `.claude/agents/sittir-research.md`, `.claude/agents/sittir-review.md` (any that embed CLI commands)
- Modify: `.github/agents/sittir-codegen.agent.md`, `.github/agents/sittir-research.agent.md`, `.github/agents/sittir-review.agent.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Find every embedded CLI command**

Run: `rg -n "packages/(codegen|tools|validator)/src/cli\.ts|run-validate\.sh" .claude .github CLAUDE.md docs`
Expected: a list of every command string to update.

- [ ] **Step 2: Rewrite each command string exactly**

Replace, preserving flags:
- `npx tsx packages/codegen/src/cli.ts --grammar <g> --all --output packages/<g>/src` → `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`
- `pnpm exec tsx packages/tools/src/cli.ts <tool> [flags]` → `pnpm exec tsx packages/cli/src/cli.ts tool <tool> [flags]`
- `pnpm exec tsx packages/validator/src/cli.ts <cmd>` → `pnpm exec tsx packages/cli/src/cli.ts validate <cmd>`
- `./scripts/run-validate.sh ...` / `pnpm validate:native` → unchanged npm script names (still valid).

In `CLAUDE.md`, update the Quick Reference bullets accordingly and add a link to the new glossary (Task 17).

- [ ] **Step 3: Verify the new agent commands actually run**

Pick one command from each updated agent doc and run it. Expected: works as the doc claims (these are contracts the subagents execute).

- [ ] **Step 4: Commit**

```bash
git commit -m "docs: repoint agent docs and CLAUDE.md to the unified sittir cli

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- .claude/agents .github/agents CLAUDE.md
```

---

## Task 16: Delete the three old CLI entry points + the counts shims

**Files:**
- Delete: `packages/codegen/src/cli.ts`
- Delete: `packages/tools/src/cli.ts`
- Delete: `packages/validator/src/cli.ts`
- Delete: `packages/tools/src/validate/counts.ts`
- Delete: `packages/codegen/src/scripts/counts.ts`
- Modify: root `tsconfig.json` (remove `@sittir/tools/cli` path), `packages/tools/package.json` (remove any `cli` export)

- [ ] **Step 1: Confirm nothing imports the deleted files**

Run: `rg -n "tools/src/cli|validator/src/cli|codegen/src/cli|scripts/counts|validate/counts" packages --glob '!**/node_modules/**'`
Expected: only the files being deleted appear (plus already-repointed callers). If a live importer remains, repoint it first.

- [ ] **Step 2: Delete**

Run:
```bash
git rm packages/codegen/src/cli.ts packages/tools/src/cli.ts packages/validator/src/cli.ts packages/tools/src/validate/counts.ts packages/codegen/src/scripts/counts.ts
```
Remove the `@sittir/tools/cli` entry from root `tsconfig.json` paths and any `./cli` export from `packages/tools/package.json`.

- [ ] **Step 3: Full workspace type-check + tests**

Run: `pnpm run type-check && pnpm test`
Expected: PASS across all packages (validator tests already repointed in Task 4; codegen seam imports in Task 7).

- [ ] **Step 4: Full native validation parity (the real gate)**

Run: `pnpm run validate:native`
Expected: same per-grammar counts as a pre-cutover baseline (capture `git stash && pnpm run validate:native` on the base commit if unsure). Numbers must not regress (memory `project_native_build_and_staleness` — measure native via this script, not raw counts).

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: delete the three legacy cli.ts entries and the counts shims

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- packages/codegen/src/cli.ts packages/tools/src/cli.ts packages/validator/src/cli.ts packages/tools/src/validate/counts.ts packages/codegen/src/scripts/counts.ts tsconfig.json packages/tools/package.json
```

---

## Task 17: CLI command glossary

**Files:**
- Create: `docs/cli-command-glossary.md`
- Create: `packages/cli/src/glossary.ts` (generator) — optional but preferred
- Test: `packages/cli/tests/glossary.test.ts` (consistency check)

- [ ] **Step 1: Generate the glossary from the commander tree (preferred)**

Create `packages/cli/src/glossary.ts` that builds the program (without `parseAsync`), walks `program.commands` recursively, and emits a markdown document: one section per namespace (`gen`, `validate`, `tool`), one entry per command with its description, options (long flag + description + default), and one example. Mirror the heading depth and prose style of `docs/compiler-phase-glossary.md`.

- [ ] **Step 2: Write a consistency test so the doc cannot rot**

Create `packages/cli/tests/glossary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildProgram } from '../src/cli.ts'; // export a buildProgram() that returns the configured Command without parsing
import { allCommandNames } from '../src/glossary.ts';

describe('cli glossary', () => {
	it('documents every registered command', () => {
		const doc = readFileSync(new URL('../../../docs/cli-command-glossary.md', import.meta.url), 'utf8');
		for (const name of allCommandNames(buildProgram())) {
			expect(doc).toContain(name);
		}
	});
});
```

Refactor `packages/cli/src/cli.ts` to export `buildProgram(): Command` (registers all namespaces, returns the program) and call `await buildProgram().parseAsync(process.argv)` only under the `_isMain` guard, so tests and the glossary can build the program without executing it.

- [ ] **Step 3: Generate and write the doc**

Run: `pnpm exec tsx packages/cli/src/glossary.ts > docs/cli-command-glossary.md`
Expected: a complete glossary covering all ~27 commands.

- [ ] **Step 4: Run the consistency test**

Run: `pnpm exec vitest run packages/cli/tests/glossary.test.ts`
Expected: PASS.

- [ ] **Step 5: Link it from CLAUDE.md**

Modify `CLAUDE.md` Quick Reference — add: `- CLI command reference: [docs/cli-command-glossary.md](docs/cli-command-glossary.md)`.

- [ ] **Step 6: Commit**

```bash
git commit -m "docs: add generated CLI command glossary + consistency test

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" -- docs/cli-command-glossary.md packages/cli/src/glossary.ts packages/cli/src/cli.ts packages/cli/tests/glossary.test.ts CLAUDE.md
```

---

## Task 18: Final verification

- [ ] **Step 1: Whole-workspace gate**

Run: `pnpm run type-check && pnpm test && pnpm run lint`
Expected: PASS.

- [ ] **Step 2: Native validation has not regressed**

Run: `pnpm run validate:native`
Expected: per-grammar counts match the pre-work baseline.

- [ ] **Step 3: Every surface is reachable under one binary**

Run: `pnpm exec tsx packages/cli/src/cli.ts --help` and confirm `gen`, `validate`, `tool` namespaces are listed; spot-check one command in each.

- [ ] **Step 4: Confirm the old paths are gone**

Run: `rg -n "packages/(codegen|tools|validator)/src/cli\.ts|run-validate\.sh" . --glob '!**/node_modules/**' --glob '!**/*.md'`
Expected: no hits in code/scripts (docs/specs may reference history; that's fine).

---

## Self-review notes (spec coverage)

- **New `@sittir/cli` package + one binary** → Tasks 1, 9, 12, 18.
- **Codegen library extraction (`runCodegen`/`runFullRegen`)** → Task 7.
- **Grouped namespaces (gen/validate/tool)** → Tasks 6, 8, 12.
- **Light `CommandModule` + option mixins + resolvers** → Tasks 2, 3, 5.
- **`counts` 4-hop collapse / shim deletion** → Tasks 6, 16.
- **Validator logic relocation (keeps tests working)** → Task 4.
- **Convert all 22 tools** → Tasks 10, 11, 12.
- **Copilot-parallelized tool conversions** → Task 11 dispatch instruction.
- **Hard cutover of all callers (npm scripts, run-validate.sh, agents, CLAUDE.md, tests)** → Tasks 14, 15, 16.
- **Regen + staleness preserved in validate** → Tasks 9, 14.
- **Bin handoff codegen → cli** → Tasks 1, 7.
- **CLI command glossary** → Task 17.
