import { describe, expect, it } from 'vitest';
import {
	buildValidationReport,
	checkCodeCeilings,
	countCodeEntries,
	readValidationReport,
	writeValidationReport,
	type CodeCeilings,
	type ValidationReport,
	type ValidationReportEntry
} from '../validation-report.ts';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('buildValidationReport', () => {
	it('records each grammar\'s diagnostics as counts per code and severity, with a digest of its entries', () => {
		const report = buildValidationReport(
			{
				typescript: {
					entries: [
						{ code: 'non-literal-separator', severity: 'warning', message: 'Separator is not a literal string.' },
						{ code: 'conflict-resolution', severity: 'info', message: 'a' },
						{ code: 'conflict-resolution', severity: 'info', message: 'b' }
					]
				}
			},
			{}
		);
		expect(report).toEqual({
			grammars: {
				typescript: {
					digest: expect.stringMatching(/^[0-9a-f]{64}$/),
					counts: { 'conflict-resolution': { info: 2 }, 'non-literal-separator': { warning: 1 } }
				}
			},
			rows: []
		});
	});

	it('digests the entries whatever their order or key order, so equal diagnostics compare equal across formats, and a changed field changes it', () => {
		const a = { code: 'x', severity: 'info' as const, message: 'm', details: { b: 1, a: 2 } };
		const b = { code: 'y', severity: 'error' as const, message: 'n' };
		const digest = (entries: readonly (typeof a | typeof b)[]) => buildValidationReport({ rust: { entries } }, {}).grammars.rust!.digest;
		expect(digest([a, b])).toBe(digest([b, { message: 'm', details: { a: 2, b: 1 }, severity: 'info', code: 'x' }]));
		expect(digest([a, b])).not.toBe(digest([{ ...a, message: 'other' }, b]));
	});

	it('keeps every validator failure as a row tagged source=validator, unbounded', () => {
		const report = buildValidationReport(
			{},
			{
				rust: [
					{ stage: 'read-render-parse', code: 'read-render-parse-error', severity: 'error', label: 'Async Block (async_block)', message: 're-parse error: "async "' }
				]
			}
		);
		expect(report.rows).toEqual([
			{
				source: 'validator',
				severity: 'error',
				code: 'read-render-parse-error',
				grammar: 'rust',
				backend: 'native',
				stage: 'read-render-parse',
				label: 'Async Block (async_block)',
				message: 're-parse error: "async "'
			}
		]);
	});
});

describe('countCodeEntries', () => {
	it('counts fail, error and warning rows per grammar per code, and leaves info rows out', () => {
		const rows = [entry('rust', 'a', 'error'), entry('rust', 'a', 'warning'), entry('rust', 'a', 'fail'), entry('rust', 'b', 'info'), entry('python', 'a', 'error')];
		expect(countCodeEntries(report(rows))).toEqual({ rust: { a: 3 }, python: { a: 1 } });
	});

	it('adds the recorded grammar diagnostic counts at error and warning severity', () => {
		const counted = countCodeEntries(report([entry('rust', 'a')], { rust: { digest: 'd', counts: { a: { error: 2, info: 5 }, b: { info: 1 } } } }));
		expect(counted).toEqual({ rust: { a: 3 } });
	});
});

describe('checkCodeCeilings', () => {
	const ceilings: CodeCeilings = { rust: { a: 2, b: 0 } };

	it('passes a code at its ceiling', () => {
		expect(checkCodeCeilings(report([entry('rust', 'a'), entry('rust', 'a')]), ceilings, ['rust'])).toEqual({ violations: [], improvements: [] });
	});

	it('fails a code above its ceiling: new debt', () => {
		expect(checkCodeCeilings(report([entry('rust', 'a'), entry('rust', 'a'), entry('rust', 'a')]), ceilings, ['rust']).violations).toEqual([
			{ grammar: 'rust', code: 'a', count: 3, ceiling: 2 }
		]);
	});

	it('gives a code the grammar does not list a ceiling of zero, so every error and warning code is guarded', () => {
		expect(checkCodeCeilings(report([entry('rust', 'new-code'), entry('python', 'a')]), ceilings, ['rust', 'python']).violations).toEqual([
			{ grammar: 'python', code: 'a', count: 1, ceiling: 0 },
			{ grammar: 'rust', code: 'new-code', count: 1, ceiling: 0 }
		]);
	});

	it('reports a code below a non-zero ceiling as one to lower', () => {
		const verdict = checkCodeCeilings(report([entry('rust', 'a')]), ceilings, ['rust']);
		expect(verdict.violations).toEqual([]);
		expect(verdict.improvements).toEqual([{ grammar: 'rust', code: 'a', count: 1, ceiling: 2 }]);
	});

	it('fails any fatal row whatever its ceiling, from a validator row or a recorded grammar count', () => {
		const lenient: CodeCeilings = { rust: { stale: 5 }, python: { stale: 5 } };
		const fatal = report([entry('rust', 'stale', 'fail')], { python: { digest: 'd', counts: { stale: { fail: 1 } } } });
		expect(checkCodeCeilings(fatal, lenient, ['python', 'rust']).violations).toEqual([
			{ grammar: 'python', code: 'stale', count: 1, ceiling: 0 },
			{ grammar: 'rust', code: 'stale', count: 1, ceiling: 0 }
		]);
	});

	it('judges only the grammars validated in this run', () => {
		expect(checkCodeCeilings(report([entry('python', 'a')]), ceilings, ['rust']).violations).toEqual([]);
	});

	it('guards a trivia or layout code like any other', () => {
		const built = buildValidationReport({}, { rust: [{ code: 'layout-unreached', severity: 'error', message: 'leading of 3 at 4..4', stage: 'layout-runs', label: 'entry' }] });
		expect(checkCodeCeilings(built, { rust: { 'from-trivia': 0 } }, ['rust']).violations).toEqual([{ grammar: 'rust', code: 'layout-unreached', count: 1, ceiling: 0 }]);
	});
});

describe('committed diagnostic ratchet', () => {
	it('the committed validation-report.json stays within the committed diagnostic-ceilings.json', () => {
		const toolsRoot = fileURLToPath(new URL('../../..', import.meta.url));
		const committed = readValidationReport(join(toolsRoot, 'validation-report.json'));
		const ceilings = JSON.parse(readFileSync(join(toolsRoot, 'diagnostic-ceilings.json'), 'utf8')) as CodeCeilings;
		const grammars = [...new Set([...Object.keys(committed.grammars), ...committed.rows.map((e) => e.grammar)])];
		expect(checkCodeCeilings(committed, ceilings, grammars).violations).toEqual([]);
	});

	it('holds no negative ceiling', () => {
		const toolsRoot = fileURLToPath(new URL('../../..', import.meta.url));
		const ceilings = JSON.parse(readFileSync(join(toolsRoot, 'diagnostic-ceilings.json'), 'utf8')) as CodeCeilings;
		for (const codes of Object.values(ceilings)) for (const ceiling of Object.values(codes)) expect(ceiling).toBeGreaterThanOrEqual(0);
	});
});

function entry(grammar: string, code: string, severity: ValidationReportEntry['severity'] = 'error'): ValidationReportEntry {
	return { source: 'validator', grammar, backend: 'native', code, severity, message: 'm' };
}

function report(rows: readonly ValidationReportEntry[], grammars: ValidationReport['grammars'] = {}): ValidationReport {
	return { grammars, rows };
}

describe('writeValidationReport', () => {
	it('writes the grammar records and the validator rows, overwriting any previous report', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-report-test-'));
		const outPath = join(dir, 'validation-report.json');
		const written = report([entry('rust', 'x')], { rust: { digest: 'd', counts: { y: { info: 1 } } } });
		writeValidationReport(written, outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual(written);
		writeValidationReport(report([]), outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual({ grammars: {}, rows: [] });
		rmSync(dir, { recursive: true, force: true });
	});

	it('writes each grammar record and each row on its own line, rows sorted by grammar, backend and code', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-report-test-'));
		const outPath = join(dir, 'validation-report.json');
		writeValidationReport(report([entry('rust', 'b'), entry('python', 'a'), entry('rust', 'a')], { rust: { digest: 'd', counts: {} }, python: { digest: 'e', counts: {} } }), outPath);
		const lines = readFileSync(outPath, 'utf8').split('\n').map((line) => line.trim().replace(/,$/, ''));
		const rows = lines.filter((line) => line.startsWith('{"')).map((line) => JSON.parse(line) as ValidationReportEntry);
		expect(rows.map((row) => `${row.grammar}/${row.code}`)).toEqual(['python/a', 'rust/a', 'rust/b']);
		expect(lines).toContain('"python": {"digest":"e","counts":{}}');
		rmSync(dir, { recursive: true, force: true });
	});
});
