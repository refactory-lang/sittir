import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { startVitest } from 'vitest/node';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PACKAGES = ['cli', 'codegen', 'common', 'python', 'regex', 'rust', 'scm', 'tools', 'typescript'];

function fixture(disposes: boolean): string {
	const open = disposes ? "using engine = await createEngine(await languageByName('regex'));" : "const engine = await createEngine(await languageByName('regex'));";
	return [
		"import { it } from 'vitest';",
		`import { createEngine } from '${join(ROOT, 'packages/common/src/index.ts')}';`,
		`import { languageByName } from '${join(ROOT, 'packages/tools/src/languages.ts')}';`,
		`it('creates an engine', async () => { ${open} void engine; });`,
		''
	].join('\n');
}

async function run(file: string): Promise<'passed' | 'failed'> {
	const vitest = await startVitest('test', [], {
		run: true,
		watch: false,
		include: [file],
		config: join(ROOT, 'vitest.config.ts'),
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
		it(`${pkg}: a test file that leaves an engine undisposed fails, one that disposes it passes`, async () => {
			const dir = join(ROOT, 'packages', pkg, 'tests', '__guard__');
			mkdirSync(dir, { recursive: true });
			const leak = join(dir, 'leak.guard.ts');
			const clean = join(dir, 'clean.guard.ts');
			try {
				writeFileSync(leak, fixture(false));
				writeFileSync(clean, fixture(true));
				expect(await run(leak)).toBe('failed');
				expect(await run(clean)).toBe('passed');
			} finally {
				rmSync(dir, { recursive: true, force: true });
			}
		}, 120_000);
	}
});
