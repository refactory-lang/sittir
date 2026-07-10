import { describe, expect, it } from 'vitest';
import { buildValidationReportEntries, writeValidationReport } from '../validation-report.ts';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('buildValidationReportEntries', () => {
	it('maps grammar diagnostics into report entries tagged source=grammar', () => {
		const entries = buildValidationReportEntries(
			{
				typescript: [
					{ code: 'non-literal-separator', severity: 'warning', location: 'interface_body.-', message: 'Separator is not a literal string.', proposal: 'See PR-T.' }
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
				message: 'Separator is not a literal string.'
			}
		]);
	});

	it('maps validator failures into report entries tagged source=validator, unbounded (no SITTIR_VALIDATOR_MAX_FAILURES cap)', () => {
		const entries = buildValidationReportEntries(
			{},
			{
				rust: [
					{ stage: 'read-render-parse', label: 'Async Block (async_block)', message: 're-parse error: "async "' }
				]
			}
		);
		expect(entries).toEqual([
			{
				source: 'validator',
				severity: 'error',
				code: 'validation-failure',
				grammar: 'rust',
				backend: 'native',
				stage: 'read-render-parse',
				location: 'Async Block (async_block)',
				message: 're-parse error: "async "'
			}
		]);
	});
});

describe('writeValidationReport', () => {
	it('writes the entries array as JSON, overwriting any previous report', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-report-test-'));
		const outPath = join(dir, 'validation-report.json');
		writeValidationReport([{ source: 'grammar', severity: 'warning', code: 'x', grammar: 'rust', backend: 'native', message: 'y' }], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toHaveLength(1);
		writeValidationReport([], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual([]);
		rmSync(dir, { recursive: true, force: true });
	});
});
