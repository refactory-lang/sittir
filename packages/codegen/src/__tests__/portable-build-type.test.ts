import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../grammars.ts';
import { portableBuildTypeDiagnostics } from '../run-codegen.ts';

const probe = async (module: string) => {
	const dir = mkdtempSync(join(REPO_ROOT, 'packages', '.type-probe-'));
	try {
		const sittirDir = join(dir, '.sittir');
		mkdirSync(sittirDir, { recursive: true });
		mkdirSync(join(dir, 'src', 'portable'), { recursive: true });
		writeFileSync(join(dir, 'src', 'portable', 'build.ts'), module);
		return await portableBuildTypeDiagnostics('probe', sittirDir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

describe("the generated portable build module's type-check", () => {
	it('reports each error in the module as a portable-emit-type row, by line', async () => {
		const rows = await probe("export const one: number = 1;\nexport const two: number = 'two';\n");
		expect(rows).toEqual([
			expect.objectContaining({ code: 'portable-emit-type', grammar: 'probe', severity: 'warning', canProceed: true, message: expect.stringMatching(/^portable\/build\.ts:2: TS2322 Type 'string' is not assignable to type 'number'/) })
		]);
	});

	it('reports nothing for a module that type-checks', async () => {
		expect(await probe('export const one: number = 1;\n')).toEqual([]);
	});
}, 120_000);
