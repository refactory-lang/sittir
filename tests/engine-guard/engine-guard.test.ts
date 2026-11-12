import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { startVitest } from 'vitest/node';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PACKAGES = ['cli', 'codegen', 'common', 'python', 'regex', 'rust', 'scm', 'tools', 'typescript'];

function fixture(disposes: boolean): string {
	const open = disposes ? "using engine = await createEngine(await languageByName('regex'), { nodeStorage: 'object' });" : "const engine = await createEngine(await languageByName('regex'), { nodeStorage: 'object' });";
	return [
		"import { it } from 'vitest';",
		`import { createEngine } from '${pathToFileURL(join(ROOT, 'packages/common/src/index.ts')).href}';`,
		`import { languageByName } from '${pathToFileURL(join(ROOT, 'packages/tools/src/languages.ts')).href}';`,
		`it('creates an engine', async () => { ${open} void engine; });`,
		''
	].join('\n');
}

async function run(file: string, config: string, testNamePattern?: string): Promise<'passed' | 'failed'> {
	const vitest = await startVitest('test', [], {
		run: true,
		watch: false,
		include: [file],
		config,
		testNamePattern,
		globalSetup: [],
		reporters: [],
		outputFile: undefined,
		coverage: { enabled: false }
	});
	try {
		const files = vitest.state.getFiles();
		return files.length > 0 && files.every((f) => f.result?.state === 'pass') ? 'passed' : 'failed';
	} finally {
		await vitest.close();
	}
}

describe('the engine guard runs in every package', () => {
	for (const pkg of PACKAGES) {
		it(`${pkg}: under the root and the package config, a test file that leaves an engine undisposed fails and one that disposes it passes`, async () => {
			const dir = join(ROOT, 'packages', pkg, 'tests', '__guard__');
			mkdirSync(dir, { recursive: true });
			const leak = join(dir, 'leak.guard.ts');
			const clean = join(dir, 'clean.guard.ts');
			try {
				writeFileSync(leak, fixture(false));
				writeFileSync(clean, fixture(true));
				for (const config of [join(ROOT, 'vitest.config.ts'), join(ROOT, 'packages', pkg, 'vitest.config.ts')]) {
					expect(await run(leak, config)).toBe('failed');
					expect(await run(clean, config)).toBe('passed');
				}
			} finally {
				rmSync(dir, { recursive: true, force: true });
			}
		}, 240_000);
	}
});

describe('the allowlist check holds for a filtered run', () => {
	it('does not call an allowlisted file stale when only part of it ran', async () => {
		const file = join(ROOT, 'packages/common/tests/create-engine.test.ts');
		expect(await run(file, join(ROOT, 'vitest.config.ts'), 'disposes its native engine')).toBe('passed');
	}, 120_000);
});

describe('sharedEngine in a reused worker', () => {
	it('is accepted at file scope after another file ran a test in the same worker', async () => {
		const dir = join(ROOT, 'packages', 'common', 'tests', '__guard__');
		mkdirSync(dir, { recursive: true });
		const first = join(dir, 'a-first.guard.ts');
		const second = join(dir, 'b-second.guard.ts');
		try {
			writeFileSync(first, ["import { it } from 'vitest';", "it('runs a test', () => {});", ''].join('\n'));
			writeFileSync(
				second,
				[
					"import { expect, it } from 'vitest';",
					`import { sharedEngine } from '${pathToFileURL(join(ROOT, 'packages/common/src/testing.ts')).href}';`,
					'const held = await sharedEngine(async () => ({ [Symbol.dispose]() {} }));',
					"it('holds the engine', () => expect(held).toBeDefined());",
					''
				].join('\n')
			);
			const vitest = await startVitest('test', [], {
				run: true,
				watch: false,
				include: [first, second],
				config: join(ROOT, 'vitest.config.ts'),
				isolate: false,
				fileParallelism: false,
				maxWorkers: 1,
				globalSetup: [],
				reporters: [],
				outputFile: undefined,
				coverage: { enabled: false }
			});
			try {
				const files = vitest.state.getFiles();
				expect(files).toHaveLength(2);
				expect(files.map((f) => f.result?.state)).toEqual(['pass', 'pass']);
			} finally {
				await vitest.close();
			}
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 120_000);
});
