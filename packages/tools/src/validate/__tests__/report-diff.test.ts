import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runValidationReportDiffCli } from '../../commands.ts';
import { diffValidationReports, formatReportDiff, readComparableReport } from '../report-diff.ts';
import { readValidationReport, type ValidationReportEntry } from '../validation-report.ts';

const row = (grammar: string, code: string, message: string): ValidationReportEntry => ({
	source: 'validator',
	grammar,
	backend: 'native',
	code,
	severity: 'error',
	message,
	stage: 'read-render-parse',
	label: 'entry'
});

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

describe('readValidationReport', () => {
	it('reads a report written as a JSON array, including an empty one', () => {
		expect(readValidationReport(file('a.json', JSON.stringify([row('rust', 'x', 'm')])))).toHaveLength(1);
		expect(readValidationReport(file('b.json', '[]'))).toEqual([]);
	});

	it('refuses a missing file, an empty file, unparseable JSON and a non-array, naming the path', () => {
		expect(() => readValidationReport(join(dir, 'absent.json'))).toThrow(/absent\.json/);
		expect(() => readValidationReport(file('empty.json', '  \n'))).toThrow(/empty.*empty\.json/);
		expect(() => readValidationReport(file('bad.json', '{'))).toThrow(/bad\.json/);
		expect(() => readValidationReport(file('obj.json', '{"rows":[]}'))).toThrow(/not an array.*obj\.json/);
	});
});

describe('readComparableReport', () => {
	it('refuses a report with no rows, so an empty side never reads as nothing moved', () => {
		expect(() => readComparableReport(file('none.json', '[]'))).toThrow(/no rows.*none\.json/);
	});
});

describe('diffValidationReports', () => {
	it('reports identical reports as unchanged, whatever the key order of each row', () => {
		const a = row('rust', 'x', 'm');
		const reordered = Object.fromEntries(Object.entries(a).reverse()) as ValidationReportEntry;
		const diff = diffValidationReports([a], [reordered]);
		expect(diff.added).toEqual([]);
		expect(diff.removed).toEqual([]);
		expect(diff.codes).toEqual([]);
		expect(diff.grammars).toEqual([{ grammar: 'rust', base: 1, head: 1, added: 0, removed: 0 }]);
	});

	it('gives per-grammar row deltas and per-code count deltas, and the rows only one side has', () => {
		const base = [row('rust', 'x', 'm1'), row('rust', 'x', 'm2'), row('python', 'y', 'p')];
		const head = [row('rust', 'x', 'm1'), row('rust', 'z', 'n'), row('typescript', 'y', 't')];
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
		const diff = diffValidationReports([a], [a, a]);
		expect(diff.added).toEqual([a]);
		expect(diff.grammars).toEqual([{ grammar: 'rust', base: 1, head: 2, added: 1, removed: 0 }]);
		expect(diff.codes).toEqual([{ grammar: 'rust', code: 'x', base: 1, head: 2 }]);
	});
});

describe('formatReportDiff', () => {
	it('prints every grammar, every changed code and every moved row, without truncating', () => {
		const long = 'm'.repeat(400);
		const lines = formatReportDiff(diffValidationReports([row('rust', 'x', 'a')], [row('rust', 'x', long)]));
		expect(lines).toContain('rust: rows 1 -> 1 (+1 -1)');
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

	it('exits 0 for identical reports, 1 when rows moved, 2 when a side is missing, empty or has no rows', () => {
		const a = file('a.json', JSON.stringify([row('rust', 'x', 'm')]));
		const b = file('b.json', JSON.stringify([row('rust', 'x', 'n')]));
		expect(runValidationReportDiffCli(a, a)).toBe(0);
		expect(runValidationReportDiffCli(a, b)).toBe(1);
		expect(runValidationReportDiffCli(a, join(dir, 'absent.json'))).toBe(2);
		expect(runValidationReportDiffCli(file('empty.json', ''), a)).toBe(2);
		expect(runValidationReportDiffCli(a, file('none.json', '[]'))).toBe(2);
	});
});
