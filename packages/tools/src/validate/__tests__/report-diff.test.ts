import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runValidationReportDiffCli } from '../../commands.ts';
import { diffValidationReports, formatReportDiff, readComparableReport, reportMoved } from '../report-diff.ts';
import {
	buildValidationReport,
	readValidationReport,
	writeValidationReport,
	type ValidationReport,
	type ValidationReportEntry
} from '../validation-report.ts';

const row = (grammar: string, code: string, message: string, extra: object = {}): ValidationReportEntry => ({
	source: 'validator',
	grammar,
	backend: 'native',
	code,
	severity: 'error',
	message,
	stage: 'read-render-parse',
	label: 'entry',
	...extra
});

const rep = (rows: readonly ValidationReportEntry[], grammars: ValidationReport['grammars'] = {}): ValidationReport => ({ grammars, rows });

let dir: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'sittir-report-diff-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const file = (name: string, text: string): string => {
	const path = join(dir, name);
	writeFileSync(path, text);
	return path;
};

const written = (name: string, report: ValidationReport): string => {
	const path = join(dir, name);
	writeValidationReport(report, path);
	return path;
};

describe('readValidationReport', () => {
	it('reads back the report the writer wrote', () => {
		const report = rep([row('rust', 'x', 'm')], { rust: { digest: 'd', counts: { y: { info: 2 } } } });
		expect(readValidationReport(written('a.json', report))).toEqual(report);
	});

	it('reads a report in the flat row-array format, folding its grammar rows into counts and a digest', () => {
		const grammarRow = { source: 'grammar', grammar: 'rust', backend: 'native', code: 'y', severity: 'info', message: 'g' };
		expect(readValidationReport(file('old.json', JSON.stringify([row('rust', 'x', 'm'), grammarRow, grammarRow])))).toEqual(
			rep([row('rust', 'x', 'm')], { rust: { digest: expect.stringMatching(/^[0-9a-f]{64}$/), counts: { y: { info: 2 } } } })
		);
		expect(readValidationReport(file('empty-array.json', '[]'))).toEqual(rep([]));
	});

	it('refuses a missing file, an empty file, unparseable JSON and a value that is neither format, naming the path', () => {
		expect(() => readValidationReport(join(dir, 'absent.json'))).toThrow(/absent\.json/);
		expect(() => readValidationReport(file('empty.json', '  \n'))).toThrow(/empty.*empty\.json/);
		expect(() => readValidationReport(file('bad.json', '{'))).toThrow(/bad\.json/);
		expect(() => readValidationReport(file('obj.json', '{"rows":[]}'))).toThrow(/not a validation report.*obj\.json/);
		expect(() => readValidationReport(file('num.json', '5'))).toThrow(/not a validation report.*num\.json/);
	});

	it('refuses an element that is not a row, in either format, naming the path and the index', () => {
		const good = row('rust', 'x', 'm');
		for (const bad of [1, null, {}, [], { ...good, grammar: 7 }, { ...good, message: undefined }]) {
			expect(() => readValidationReport(file('rows.json', JSON.stringify([good, bad])))).toThrow(/row 1 .*rows\.json/);
			expect(() => readValidationReport(file('new.json', JSON.stringify({ grammars: {}, rows: [good, bad] })))).toThrow(/row 1 .*new\.json/);
		}
	});
});

describe('readComparableReport', () => {
	it('refuses a report with no rows and no grammar records, so an empty side never reads as nothing moved', () => {
		expect(() => readComparableReport(file('none.json', '[]'))).toThrow(/nothing recorded.*none\.json/);
		expect(() => readComparableReport(file('none2.json', '{"grammars":{},"rows":[]}'))).toThrow(/nothing recorded.*none2\.json/);
	});
});

describe('diffValidationReports', () => {
	it('reports identical reports as unchanged, whatever the key order of each row', () => {
		const a = row('rust', 'x', 'm');
		const reordered = Object.fromEntries(Object.entries(a).reverse()) as ValidationReportEntry;
		const diff = diffValidationReports(rep([a]), rep([reordered]));
		expect(diff.added).toEqual([]);
		expect(diff.removed).toEqual([]);
		expect(diff.codes).toEqual([]);
		expect(diff.digests).toEqual([]);
		expect(diff.grammars).toEqual([{ grammar: 'rust', base: 1, head: 1, added: 0, removed: 0 }]);
	});

	it('ignores key order at every depth, and still tells nested values apart', () => {
		const nested = (details: unknown): ValidationReportEntry => row('rust', 'x', 'm', { details });
		const a = nested({ resolution: { kind: 'AddConflict', symbols: ['a', 'b'] }, step: 'default' });
		const reordered = nested({ step: 'default', resolution: { symbols: ['a', 'b'], kind: 'AddConflict' } });
		expect(diffValidationReports(rep([a]), rep([reordered])).added).toEqual([]);
		const reorderedArray = nested({ resolution: { kind: 'AddConflict', symbols: ['b', 'a'] }, step: 'default' });
		expect(diffValidationReports(rep([a]), rep([reorderedArray])).added).toEqual([reorderedArray]);
		const pairs = nested([['step', 'default']]);
		const object = nested({ step: 'default' });
		expect(diffValidationReports(rep([pairs]), rep([object])).added).toEqual([object]);
	});

	it('gives per-grammar row deltas and per-code count deltas, and the rows only one side has', () => {
		const base = rep([row('rust', 'x', 'm1'), row('rust', 'x', 'm2'), row('python', 'y', 'p')]);
		const head = rep([row('rust', 'x', 'm1'), row('rust', 'z', 'n'), row('typescript', 'y', 't')]);
		const diff = diffValidationReports(base, head);
		expect(diff.grammars).toEqual([
			{ grammar: 'python', base: 1, head: 0, added: 0, removed: 1 },
			{ grammar: 'rust', base: 2, head: 2, added: 1, removed: 1 },
			{ grammar: 'typescript', base: 0, head: 1, added: 1, removed: 0 }
		]);
		expect(diff.codes).toEqual([
			{ grammar: 'python', code: 'y', base: 1, head: 0 },
			{ grammar: 'rust', code: 'x', base: 2, head: 1 },
			{ grammar: 'rust', code: 'z', base: 0, head: 1 },
			{ grammar: 'typescript', code: 'y', base: 0, head: 1 }
		]);
		expect(diff.added).toEqual([row('rust', 'z', 'n'), row('typescript', 'y', 't')]);
		expect(diff.removed).toEqual([row('rust', 'x', 'm2'), row('python', 'y', 'p')]);
	});

	it('counts a repeated row once per copy', () => {
		const a = row('rust', 'x', 'm');
		const diff = diffValidationReports(rep([a]), rep([a, a]));
		expect(diff.added).toEqual([a]);
		expect(diff.grammars).toEqual([{ grammar: 'rust', base: 1, head: 2, added: 1, removed: 0 }]);
		expect(diff.codes).toEqual([{ grammar: 'rust', code: 'x', base: 1, head: 2 }]);
	});

	it('counts recorded grammar diagnostics in the grammar totals and the per-code deltas', () => {
		const base = rep([], { rust: { digest: 'd', counts: { y: { info: 2 }, z: { error: 1 } } } });
		const head = rep([], { rust: { digest: 'e', counts: { y: { info: 3 }, z: { error: 1 } } } });
		const diff = diffValidationReports(base, head);
		expect(diff.grammars).toEqual([{ grammar: 'rust', base: 3, head: 4, added: 0, removed: 0 }]);
		expect(diff.codes).toEqual([{ grammar: 'rust', code: 'y', base: 2, head: 3 }]);
	});

	it('reports a grammar whose diagnostics changed, by its digests', () => {
		const counts = { y: { info: 1 } };
		expect(diffValidationReports(rep([], { rust: { digest: 'd', counts } }), rep([], { rust: { digest: 'e', counts } })).digests).toEqual([
			{ grammar: 'rust', base: 'd', head: 'e' }
		]);
	});

	it('finds nothing moved between a flat-format report and the same diagnostics in the record format', () => {
		const owned = { scope: 'grammar', grammar: 'rust', code: 'y', severity: 'info' as const, message: 'g', ownerKind: 'k', location: 'k' };
		const unowned = { scope: 'grammar', grammar: 'rust', code: 'z', severity: 'error' as const, message: 'h', location: undefined };
		const flatRows = [owned, unowned].map((d) => ({ source: 'grammar', backend: 'native', ...d, sClass: null }));
		const flat = readValidationReport(file('flat.json', JSON.stringify([row('rust', 'x', 'm'), ...flatRows])));
		const records = buildValidationReport({ rust: { entries: [owned, unowned] } }, { rust: [] });
		const diff = diffValidationReports(flat, { ...records, rows: [row('rust', 'x', 'm')] });
		expect([diff.added, diff.removed, diff.codes, diff.digests]).toEqual([[], [], [], []]);
	});

	it('finds a grammar row that moved between a flat-format base and a record-format head though every count holds', () => {
		const grammarRow = { source: 'grammar', grammar: 'rust', backend: 'native', code: 'y', severity: 'error', message: 'g', location: 'call_expression' };
		const flat = readValidationReport(file('flat.json', JSON.stringify([grammarRow])));
		const records = buildValidationReport({ rust: { entries: [{ code: 'y', severity: 'error', message: 'g', location: 'macro_invocation' }] } }, {});
		const diff = diffValidationReports(flat, records);
		expect(diff.codes).toEqual([]);
		expect(diff.digests.map((d) => d.grammar)).toEqual(['rust']);
		expect(reportMoved(diff)).toBe(true);
	});
});

describe('formatReportDiff', () => {
	it('prints every grammar, every changed code, every changed diagnostics file and every moved row, without truncating', () => {
		const long = 'm'.repeat(400);
		const lines = formatReportDiff(
			diffValidationReports(rep([row('rust', 'x', 'a')], { rust: { digest: 'd', counts: {} } }), rep([row('rust', 'x', long)], { rust: { digest: 'e', counts: {} } }))
		);
		expect(lines).toContain('rust: rows 1 -> 1 (+1 -1)');
		expect(lines).toContain('  rust: grammar diagnostics changed (digest d -> e)');
		expect(lines.some((l) => l.startsWith('+ ') && l.includes(long))).toBe(true);
		expect(lines.some((l) => l.startsWith('- ') && l.includes('"message":"a"'))).toBe(true);
	});
});

describe('runValidationReportDiffCli', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it('exits 0 for identical reports, 1 when rows moved, 2 when a side is missing, empty or records nothing', () => {
		const a = written('a.json', rep([row('rust', 'x', 'm')]));
		const b = written('b.json', rep([row('rust', 'x', 'n')]));
		expect(runValidationReportDiffCli(a, a)).toBe(0);
		expect(runValidationReportDiffCli(a, b)).toBe(1);
		expect(runValidationReportDiffCli(a, join(dir, 'absent.json'))).toBe(2);
		expect(runValidationReportDiffCli(file('empty.json', ''), a)).toBe(2);
		expect(runValidationReportDiffCli(a, file('none.json', '[]'))).toBe(2);
	});

	it('exits 1 for two reports from different trees whose only difference is one moved grammar row', () => {
		const diagnostic = (location: string) => ({ code: 'rule-reauthored-without-cause', severity: 'error' as const, message: 'm', location });
		const baseTree = buildValidationReport({ rust: { entries: [diagnostic('call_expression')] } }, {});
		const headTree = buildValidationReport({ rust: { entries: [diagnostic('macro_invocation')] } }, {});
		expect(runValidationReportDiffCli(written('base.json', baseTree), written('head.json', headTree))).toBe(1);
	});
});
