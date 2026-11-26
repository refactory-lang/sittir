import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../grammars.ts';
import { portableBuildTypeDiagnostics } from '../run-codegen.ts';

interface Probe {
	readonly at?: (path: string) => string;
	readonly output?: string;
	readonly others?: Readonly<Record<string, string>>;
}

const probe = async (module: string, { at = (path) => path, output = 'src', others = {} }: Probe = {}) => {
	const dir = mkdtempSync(join(REPO_ROOT, 'packages', '.type-probe-'));
	try {
		const sittirDir = join(dir, '.sittir');
		mkdirSync(sittirDir, { recursive: true });
		const files: readonly (readonly [outDir: string, text: string])[] = [...Object.entries(others), [output, module]];
		for (const [outDir, text] of files) {
			mkdirSync(join(dir, outDir, 'portable'), { recursive: true });
			writeFileSync(join(dir, outDir, 'portable', 'build.ts'), text);
		}
		return await portableBuildTypeDiagnostics('probe', at(sittirDir), at(join(dir, output, 'portable', 'build.ts')));
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

	it('finds the module from paths given relative to the working directory, as gen --output gives them', async () => {
		const rows = await probe("export const two: number = 'two';\n", { at: (path) => relative(process.cwd(), path) });
		expect(rows.map((row) => row.message)).toEqual([expect.stringMatching(/^portable\/build\.ts:1: TS2322 /)]);
	});

	it('checks the module written to the output directory, not the one beside the .sittir directory', async () => {
		const rows = await probe("export const two: number = 'two';\n", { output: 'out', others: { src: "export const one: string = 1;\nexport const two: string = 2;\n" } });
		expect(rows.map((row) => row.message)).toEqual([expect.stringMatching(/^portable\/build\.ts:1: TS2322 /)]);
	});

	it('reports nothing for a module that type-checks', async () => {
		expect(await probe('export const one: number = 1;\n')).toEqual([]);
	});
}, 120_000);
