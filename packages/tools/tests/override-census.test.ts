import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '../src/codegen-surface.ts';
import { run } from '../src/discover/override-census.ts';

// Only the compiled raw grammar is supplied; the census reads its ruleCauses and writes the rows under test.
vi.mock('../src/codegen-surface.ts', () => ({ invoke: vi.fn() }));

const compiledWith = (ruleCauses: Record<string, unknown>) => ({
	stages: {},
	diagnosticRecords: [],
	raw: { ruleCauses, undeclaredRules: [], patchSites: [] }
});

let written: string[];
beforeEach(() => {
	written = [];
	vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
		written.push(String(chunk));
		return true;
	});
});
afterEach(() => {
	vi.restoreAllMocks();
});

async function censusRows(ruleCauses: Record<string, unknown>): Promise<string> {
	vi.mocked(invoke).mockImplementation(async (_module: string, fn: string) => {
		if (fn === 'loadGeneratedIdTables') return {};
		if (fn === 'compileGrammar') return compiledWith(ruleCauses);
		if (fn === 'labelPatchSites') return [];
		return undefined;
	});
	await run({ grammar: 'typescript', json: false });
	return written.join('');
}

describe('override-census cause column', () => {
	it('shows the one cause of a single-cause rule', async () => {
		const out = await censusRows({ tuple: { kind: 'reauthored', causes: [{ cause: 'ambiguity' }] } });
		expect(out).toContain(`  ${'reauthored'.padEnd(11)} ${'ambiguity'.padEnd(17)} tuple\n`);
	});

	it('joins the causes of a multi-cause rule with +, in declaration order', async () => {
		const out = await censusRows({
			getter: {
				kind: 'reauthored',
				causes: [{ cause: 'accepts-invalid-syntax', witnesses: [] }, { cause: 'ruled-narrowing', witnesses: [] }]
			}
		});
		expect(out).toContain(`  ${'reauthored'.padEnd(11)} ${'accepts-invalid-syntax+ruled-narrowing'.padEnd(17)} getter\n`);
	});

	it('leaves the cause column empty for a vocabulary rule', async () => {
		const out = await censusRows({ helper: { kind: 'vocabulary' } });
		expect(out).toContain(`  ${'vocabulary'.padEnd(11)} ${''.padEnd(17)} helper\n`);
	});
});
