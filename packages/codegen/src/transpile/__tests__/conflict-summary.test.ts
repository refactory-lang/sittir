import { describe, expect, it } from 'vitest';
import { conflictKey, parseGenerateOutcome, unnecessaryConflictsOf, type ConflictReport } from '../conflict-summary.ts';

const report: ConflictReport = {
	symbol_sequence: ['expression'],
	conflicting_lookahead: "';'",
	possible_interpretations: [
		{
			preceding_symbols: [],
			variable_name: 'expression_statement',
			production_step_symbols: ['expression'],
			step_index: 1,
			done: true,
			conflicting_lookahead: "';'",
			precedence: null,
			associativity: null,
			requires_eof_lookahead: false
		},
		{
			preceding_symbols: [],
			variable_name: 'expression_statement_tuple',
			production_step_symbols: ['expression'],
			step_index: 1,
			done: true,
			conflicting_lookahead: "';'",
			precedence: null,
			associativity: null,
			requires_eof_lookahead: false
		}
	],
	possible_resolutions: [
		{ Precedence: { symbols: ['expression_statement'] } },
		{ Precedence: { symbols: ['expression_statement_tuple'] } },
		{ AddConflict: { symbols: ['expression_statement', 'expression_statement_tuple'] } }
	]
};

const consoleNoise = "transform: override field('async') on 'for_in_clause' wraps an enrich-labeled FIELD — duplicate name ('async').";

describe('parseGenerateOutcome', () => {
	it('reads the conflict report that follows grammar console output on stderr', () => {
		const summary = { diagnostics: [{ SupertypeInlined: { name: '_statement' } }], error: { BuildTables: { Conflict: report } } };
		const stderr = `${consoleNoise}\n${JSON.stringify(summary, null, 2)}\n`;
		expect(parseGenerateOutcome(1, stderr)).toEqual({ kind: 'conflict', report });
	});

	it('treats exit 0 as clean even when tree-sitter printed warnings', () => {
		expect(parseGenerateOutcome(0, 'Warning: unnecessary conflicts:\n  `a`, `b`\n')).toEqual({ kind: 'clean', unnecessary: [] });
	});

	it('surfaces a summary that is not a conflict as an error', () => {
		const summary = { diagnostics: [], error: { LoadGrammarFile: { LoadJSGrammarFile: { JSRuntimeExit: { runtime: 'node', code: 1 } } } } };
		expect(parseGenerateOutcome(1, `ReferenceError: module is not defined\n${JSON.stringify(summary, null, 2)}\n`)).toEqual({
			kind: 'error',
			summary
		});
	});

	it('surfaces a failure with no summary on stderr as an error carrying the raw text', () => {
		expect(parseGenerateOutcome(1, 'segfault')).toEqual({ kind: 'error', summary: 'segfault' });
	});
});

describe('conflictKey', () => {
	it('ignores the order of the offered resolutions', () => {
		const reordered: ConflictReport = { ...report, possible_resolutions: [...report.possible_resolutions].reverse() };
		expect(conflictKey(reordered)).toBe(conflictKey(report));
	});

	it('distinguishes a different lookahead', () => {
		expect(conflictKey({ ...report, conflicting_lookahead: "','" })).not.toBe(conflictKey(report));
	});

	it('distinguishes a different interpretation', () => {
		const [first, second] = report.possible_interpretations;
		const other: ConflictReport = { ...report, possible_interpretations: [first!, { ...second!, variable_name: 'assignment' }] };
		expect(conflictKey(other)).not.toBe(conflictKey(report));
	});

	it('reads every unnecessary set from the summary the CLI prints on a clean run', () => {
		const summary = JSON.stringify({ diagnostics: [{ UnnecessaryConflicts: [['a', 'b'], ['c', 'd', 'e']] }], error: null }, null, 2);
		expect(unnecessaryConflictsOf(summary + '\n')).toEqual([['a', 'b'], ['c', 'd', 'e']]);
		expect(unnecessaryConflictsOf('Warning: rule e contains a seq rule with a single element.\n' + summary + '\n')).toEqual([['a', 'b'], ['c', 'd', 'e']]);
		expect(unnecessaryConflictsOf(JSON.stringify({ diagnostics: [], error: null }, null, 2) + '\n')).toEqual([]);
		expect(unnecessaryConflictsOf('')).toEqual([]);
	});
});
