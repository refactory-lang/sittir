import { describe, expect, it } from 'vitest';
import { conflictKey, parseGenerateOutcome, type ConflictReport } from '../conflict-summary.ts';

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
			associativity: null
		},
		{
			preceding_symbols: [],
			variable_name: 'expression_statement_tuple',
			production_step_symbols: ['expression'],
			step_index: 1,
			done: true,
			conflicting_lookahead: "';'",
			precedence: null,
			associativity: null
		}
	],
	possible_resolutions: [
		{ Precedence: { symbols: ['expression_statement'] } },
		{ Precedence: { symbols: ['expression_statement_tuple'] } },
		{ AddConflict: { symbols: ['expression_statement', 'expression_statement_tuple'] } }
	]
};

const consoleNoise = "transform: override field('async_marker') on 'for_in_clause' wraps an enrich-labeled FIELD — duplicate name ('async_marker').";

describe('parseGenerateOutcome', () => {
	it('reads the conflict report that follows grammar console output on stderr', () => {
		const stderr = `${consoleNoise}\n${JSON.stringify({ BuildTables: { Conflict: report } }, null, 2)}\n`;
		expect(parseGenerateOutcome(1, stderr)).toEqual({ kind: 'conflict', report });
	});

	it('treats exit 0 as clean even when tree-sitter printed warnings', () => {
		expect(parseGenerateOutcome(0, 'Warning: unnecessary conflicts:\n  `a`, `b`\n')).toEqual({ kind: 'clean' });
	});

	it('surfaces a summary that is not a conflict as an error', () => {
		const summary = { LoadGrammarFile: { LoadJSGrammarFile: { JSRuntimeExit: { runtime: 'node', code: 1 } } } };
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
});
