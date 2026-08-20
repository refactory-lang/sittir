import { describe, expect, it } from 'vitest';
import {
	buildValidationReportEntries,
	checkSClassCeilings,
	classifySClass,
	countSClassEntries,
	writeValidationReport,
	type SClassCeilings,
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

describe('classifySClass', () => {
	it.each([
		['parsekind-noninjective', 'x', 'S1'],
		['seq-with-nested-seq', 'x', 'S3'],
		['union-slot-unaddressable', 'x', 'S4'],
		['union-slot-mixed-row', 'x', 'S4'],
		['accessor-throw', 'x', 'S4'],
		['coverage-missing-field', 'x', 'S5']
	] as const)('direct code %s -> %s regardless of message', (code, message, expected) => {
		expect(classifySClass({ code, message })).toBe(expected);
	});

	it.each([
		['from-error', 'kind not found at rendered offset 3', 'S8'],
		['read-render-parse-error', 'render: expected u16 kind_id, string, or object with $type', 'S2'],
		['read-render-parse-ast-mismatch', 'childCount 7 ≠ 6 [...,automatic_semicolon]', 'S7'],
		['read-render-parse-error', 'render: Missing field `_content`', 'S6'],
		['factory-render-parse-ast-mismatch', 'root._line_continuation: missing on factory output', 'S6'],
		['from-error', 'native coords unresolved for alias target — comparing against a mismatched WASM id would be unsound', 'S1'],
		['read-render-parse-error', 'render: alias-wrapper kind id 436: no kind-keyed child slot to unwrap', 'S1'],
		['read-render-parse-error', 'render: unknown kind id 428 in EnumBodyGroup1Content', 'S1']
	] as const)('message fallback for %s: %s -> %s', (code, message, expected) => {
		expect(classifySClass({ code, message })).toBe(expected);
	});

	it('leaves a message-fallback code unclassified when the message matches no known signature', () => {
		expect(classifySClass({ code: 'read-render-parse-ast-mismatch', message: 'childCount 3 ≠ 2' })).toBeUndefined();
	});

	it('leaves a code outside the round-trip-fidelity taxonomy unclassified', () => {
		expect(classifySClass({ code: 'kindid-unstamped-symbols', message: 'anything' })).toBeUndefined();
	});

	it('does not mistake an unrelated missing-field message for the line_comment S6 bug just because `_content` appears mid-chain', () => {
		expect(
			classifySClass({
				code: 'read-render-parse-error',
				message: 'render: Missing field `_left` on IfExpressionTransport._condition on ExpressionStatementTransport._content on SourceFileTransport._statements'
			})
		).toBeUndefined();
	});
});

function entry(grammar: string, sClass?: ValidationReportEntry['sClass']): ValidationReportEntry {
	return { source: 'validator', grammar, backend: 'native', code: 'x', severity: 'error', message: 'm', sClass };
}

describe('countSClassEntries', () => {
	it('counts classified entries per grammar per class, skipping unclassified ones', () => {
		const counts = countSClassEntries([entry('rust', 'S1'), entry('rust', 'S1'), entry('rust'), entry('python', 'S8')]);
		expect(counts).toEqual({ rust: { S1: 2 }, python: { S8: 1 } });
	});
});

describe('checkSClassCeilings', () => {
	const ceilings: SClassCeilings = { rust: { S1: 2 } };

	it('passes when every class is at its ceiling', () => {
		const verdict = checkSClassCeilings([entry('rust', 'S1'), entry('rust', 'S1')], ceilings, ['rust']);
		expect(verdict.violations).toEqual([]);
		expect(verdict.improvements).toEqual([]);
	});

	it('flags a count above its ceiling as a violation', () => {
		const verdict = checkSClassCeilings([entry('rust', 'S1'), entry('rust', 'S1'), entry('rust', 'S1')], ceilings, [
			'rust'
		]);
		expect(verdict.violations).toEqual([{ grammar: 'rust', sClass: 'S1', count: 3, ceiling: 2 }]);
	});

	it('treats a class (or grammar) absent from the ceilings file as ceiling 0 — cleared classes stay cleared by omission', () => {
		const verdict = checkSClassCeilings([entry('rust', 'S7'), entry('python', 'S2')], ceilings, ['rust', 'python']);
		expect(verdict.violations).toEqual([
			{ grammar: 'rust', sClass: 'S7', count: 1, ceiling: 0 },
			{ grammar: 'python', sClass: 'S2', count: 1, ceiling: 0 }
		]);
	});

	it('reports a count below a non-zero ceiling as an improvement (ceiling should be ratcheted down), not a violation', () => {
		const verdict = checkSClassCeilings([entry('rust', 'S1')], ceilings, ['rust']);
		expect(verdict.violations).toEqual([]);
		expect(verdict.improvements).toEqual([{ grammar: 'rust', sClass: 'S1', count: 1, ceiling: 2 }]);
	});

	it('judges only the grammars actually validated this run', () => {
		const verdict = checkSClassCeilings([entry('python', 'S2')], ceilings, ['rust']);
		expect(verdict.violations).toEqual([]);
	});
});

describe('committed S-class ratchet', () => {
	// The committed validation-report.json is refreshed by every
	// `validate counts` run (which also enforces the ceilings live). This
	// pins the same invariant on the committed pair of artifacts, so a
	// report committed past the gate — or a ceilings edit that loosens one —
	// fails the suite.
	it('committed validation-report.json stays within committed sclass-ceilings.json', () => {
		const toolsRoot = fileURLToPath(new URL('../../..', import.meta.url));
		const report = JSON.parse(
			readFileSync(join(toolsRoot, 'validation-report.json'), 'utf8')
		) as ValidationReportEntry[];
		const ceilings = JSON.parse(readFileSync(join(toolsRoot, 'sclass-ceilings.json'), 'utf8')) as SClassCeilings;
		const grammars = [...new Set(report.map((e) => e.grammar))];
		const { violations } = checkSClassCeilings(report, ceilings, grammars);
		expect(violations).toEqual([]);
	});
});

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
