import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { admittedPaths, computeBackerParity, corpusFile, runParity } from '../src/validate/backer-parity.ts';

const root = mkdtempSync(join(tmpdir(), 'backer-parity-'));
const outside = mkdtempSync(join(tmpdir(), 'backer-parity-outside-'));
mkdirSync(join(root, 'src'));
writeFileSync(
	join(root, 'src/a.ts'),
	'export const π = "ünïcödé";\nlet x = [1, 2]\nfunction f(a: number) {\n  return a // ✓\n}\n'
);
writeFileSync(join(root, 'src/b.mts'), 'if (a { b(); }\nlet y = ;\n');
writeFileSync(join(root, 'src/c.d.ts'), 'export declare const c: number;\n');
writeFileSync(join(root, 'src/d.js'), 'module.exports = 1;\n');
writeFileSync(join(outside, 'x.ts'), 'export const x = 1;\n');
symlinkSync(outside, join(root, 'out'));
writeFileSync(join(root, 'admitted.json'), JSON.stringify({ files: [{ path: 'src/a.ts' }, { path: 'src/b.mts' }] }));
afterAll(() => {
	rmSync(root, { recursive: true, force: true });
	rmSync(outside, { recursive: true, force: true });
});

describe('backer parity', () => {
	it('finds no node of a corpus the record backer answers apart from the tree backer, and no layout run measured apart', async () => {
		const census = await computeBackerParity(root, admittedPaths(join(root, 'admitted.json')));
		expect(census.files).toBe(2);
		expect(census.nodes).toBeGreaterThan(40);
		expect(census.runs).toBeGreaterThan(10);
		expect({ differing: census.differing, differingRuns: census.differingRuns, failing: census.failing }).toEqual({ differing: 0, differingRuns: 0, failing: [] });
	}, 120_000);

	it('counts each layout run its two measures place or measure apart', () => {
		const run = { start: 3, end: 4, index: 2, side: 'trailing', breaks: 0, spaces: 1, tabs: 0 } as const;
		expect(runParity([run], [run])).toEqual({ runs: 1, differingRuns: 0 });
		expect(runParity([run], [{ ...run, spaces: 0 }])).toEqual({ runs: 1, differingRuns: 1, firstRun: 3 });
		expect(runParity([run, { ...run, start: 9, end: 9 }], [run])).toEqual({ runs: 2, differingRuns: 1, firstRun: 9 });
	});

	it('refuses a census of no file, so an empty or missing list cannot pass', async () => {
		writeFileSync(join(root, 'none.json'), JSON.stringify({ files: [] }));
		for (const paths of [[], admittedPaths(join(root, 'none.json'))]) {
			await expect(computeBackerParity(root, paths)).rejects.toThrow(/backer-parity has no corpus file to read/);
		}
	});

	it('reads TypeScript sources inside the corpus only', () => {
		expect(corpusFile(root, 'src/a.ts')).toMatch(/src\/a\.ts$/);
		for (const path of ['src/c.d.ts', 'src/d.js', '../a.ts', join(root, 'src/a.ts'), 'out/x.ts']) {
			expect(() => corpusFile(root, path), path).toThrow(/inside the corpus only/);
		}
	});
});
