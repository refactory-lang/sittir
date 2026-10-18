import { describe, expect, it } from 'vitest';
import {
	buildValidationReportEntries,
	checkCodeCeilings,
	countCodeEntries,
	readValidationReport,
	writeValidationReport,
	type CodeCeilings,
	type ValidationReportEntry
} from '../validation-report.ts';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('buildValidationReportEntries', () => {
	it('maps grammar diagnostics into report entries tagged source=grammar', () => {
		const entries = buildValidationReportEntries(
			{
				typescript: [
					{
						code: 'non-literal-separator',
						severity: 'warning',
						location: 'interface_body.-',
						message: 'Separator is not a literal string.',
						proposal: 'See PR-T.'
					}
				]
			},
			{}
		);
		expect(entries).toEqual([
			{
				source: 'grammar',
				severity: 'warning',
				code: 'non-literal-separator',
				grammar: 'typescript',
				backend: 'native',
				location: 'interface_body.-',
				message: 'Separator is not a literal string.',
				proposal: 'See PR-T.'
			}
		]);
	});

	it('maps validator failures into report entries tagged source=validator, unbounded (no SITTIR_VALIDATOR_MAX_FAILURES cap)', () => {
		const entries = buildValidationReportEntries(
			{},
			{
				rust: [
					{
						stage: 'read-render-parse',
						code: 'read-render-parse-error',
						severity: 'error',
						label: 'Async Block (async_block)',
						message: 're-parse error: "async "'
					}
				]
			}
		);
		expect(entries).toEqual([
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
	it('counts error and warning rows per grammar per code, and leaves info rows out', () => {
		const rows = [entry('rust', 'a', 'error'), entry('rust', 'a', 'warning'), entry('rust', 'b', 'info'), entry('python', 'a', 'error')];
		expect(countCodeEntries(rows)).toEqual({ rust: { a: 2 }, python: { a: 1 } });
	});
});

describe('checkCodeCeilings', () => {
	const ceilings: CodeCeilings = { rust: { a: 2, b: 0 } };

	it('passes a code at its ceiling', () => {
		expect(checkCodeCeilings([entry('rust', 'a'), entry('rust', 'a')], ceilings, ['rust'])).toEqual({ violations: [], improvements: [] });
	});

	it('fails a code above its ceiling: new debt', () => {
		expect(checkCodeCeilings([entry('rust', 'a'), entry('rust', 'a'), entry('rust', 'a')], ceilings, ['rust']).violations).toEqual([
			{ grammar: 'rust', code: 'a', count: 3, ceiling: 2 }
		]);
	});

	it('gives a code the grammar does not list a ceiling of zero, so every error and warning code is guarded', () => {
		expect(checkCodeCeilings([entry('rust', 'new-code'), entry('python', 'a')], ceilings, ['rust', 'python']).violations).toEqual([
			{ grammar: 'python', code: 'a', count: 1, ceiling: 0 },
			{ grammar: 'rust', code: 'new-code', count: 1, ceiling: 0 }
		]);
	});

	it('reports a code below a non-zero ceiling as one to lower', () => {
		const verdict = checkCodeCeilings([entry('rust', 'a')], ceilings, ['rust']);
		expect(verdict.violations).toEqual([]);
		expect(verdict.improvements).toEqual([{ grammar: 'rust', code: 'a', count: 1, ceiling: 2 }]);
	});

	it('judges only the grammars validated in this run', () => {
		expect(checkCodeCeilings([entry('python', 'a')], ceilings, ['rust']).violations).toEqual([]);
	});

	it('guards a trivia or layout code like any other', () => {
		const rows = buildValidationReportEntries({}, { rust: [{ code: 'layout-unreached', severity: 'error', message: 'leading of 3 at 4..4', stage: 'layout-runs', label: 'entry' }] });
		expect(checkCodeCeilings(rows, { rust: { 'from-trivia': 0 } }, ['rust']).violations).toEqual([{ grammar: 'rust', code: 'layout-unreached', count: 1, ceiling: 0 }]);
	});
});

describe('committed diagnostic ratchet', () => {
	it('the committed validation-report.json stays within the committed diagnostic-ceilings.json', () => {
		const toolsRoot = fileURLToPath(new URL('../../..', import.meta.url));
		const report = readValidationReport(join(toolsRoot, 'validation-report.json'));
		const ceilings = JSON.parse(readFileSync(join(toolsRoot, 'diagnostic-ceilings.json'), 'utf8')) as CodeCeilings;
		const grammars = [...new Set(report.map((e) => e.grammar))];
		expect(checkCodeCeilings(report, ceilings, grammars).violations).toEqual([]);
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

describe('writeValidationReport', () => {
	it('writes the entries array as JSON, overwriting any previous report', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-report-test-'));
		const outPath = join(dir, 'validation-report.json');
		writeValidationReport(
			[{ source: 'grammar', severity: 'warning', code: 'x', grammar: 'rust', backend: 'native', message: 'y' }],
			outPath
		);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toHaveLength(1);
		writeValidationReport([], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual([]);
		rmSync(dir, { recursive: true, force: true });
	});
});

describe('writeValidationReport row lines', () => {
	it('writes each row on its own line, sorted by grammar, source and code', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-report-test-'));
		const outPath = join(dir, 'validation-report.json');
		const row = (grammar: string, source: 'grammar' | 'validator', code: string): ValidationReportEntry =>
			({ source, severity: 'warning', code, grammar, backend: 'native', message: 'm' }) as ValidationReportEntry;
		writeValidationReport([row('rust', 'validator', 'b'), row('python', 'validator', 'a'), row('rust', 'grammar', 'z'), row('rust', 'validator', 'a')], outPath);
		const lines = readFileSync(outPath, 'utf8').split('\n').map((line) => line.trim().replace(/,$/, ''));
		expect(lines.slice(1, -2).map((line) => JSON.parse(line) as ValidationReportEntry).map((entry) => `${entry.grammar}/${entry.source}/${entry.code}`)).toEqual([
			'python/validator/a',
			'rust/grammar/z',
			'rust/validator/a',
			'rust/validator/b'
		]);
		rmSync(dir, { recursive: true, force: true });
	});
});

