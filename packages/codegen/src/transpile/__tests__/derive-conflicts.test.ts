import { describe, expect, it } from 'vitest';
import type { DerivedResolution } from '../../dsl/conflict-resolutions.ts';
import { chooseResolution, deriveConflictResolutions, sourceChain, type UpstreamContext } from '../derive-conflicts.ts';
import type { ConflictReport, GenerateOutcome } from '../conflict-summary.ts';

function reportFor(a: string, b: string, lookahead = "';'"): ConflictReport {
	return {
		symbol_sequence: ['expression'],
		conflicting_lookahead: lookahead,
		possible_interpretations: [a, b].map((variable_name) => ({
			preceding_symbols: [],
			variable_name,
			production_step_symbols: ['expression'],
			step_index: 1,
			done: true,
			conflicting_lookahead: lookahead,
			precedence: null,
			associativity: null
		})),
		possible_resolutions: [{ Precedence: { symbols: [a] } }, { AddConflict: { symbols: [a, b] } }]
	};
}

const identity: UpstreamContext = {
	upstreamConflicts: [['pattern', 'primary_expression']],
	sourceEdges: {}
};

describe('chooseResolution', () => {
	it('applies AddConflict for a set upstream declared, and records that step', () => {
		expect(chooseResolution(reportFor('primary_expression', 'pattern'), identity)).toEqual({
			kind: 'chosen',
			resolution: {
				resolution: { kind: 'AddConflict', symbols: ['primary_expression', 'pattern'] },
				step: 'upstream-declared',
				sourceChains: [['primary_expression'], ['pattern']],
				conflict: {
					symbolSequence: ['expression'],
					lookahead: "';'",
					interpretations: ['primary_expression', 'pattern']
				}
			}
		});
	});

	it('maps reshaped names back to their upstream source before the declared test', () => {
		const upstream: UpstreamContext = { upstreamConflicts: [['a', 'b']], sourceEdges: { a_x: 'a' } };
		expect(chooseResolution(reportFor('a_x', 'b'), upstream)).toMatchObject({
			kind: 'chosen',
			resolution: { step: 'upstream-declared', resolution: { symbols: ['a_x', 'b'] }, sourceChains: [['a_x', 'a'], ['b']] }
		});
	});

	it('dedupes mapped sources before comparing: two variants of one upstream rule match its singleton set', () => {
		const upstream: UpstreamContext = { upstreamConflicts: [['a']], sourceEdges: { a_x: 'a', a_y: 'a' } };
		expect(chooseResolution(reportFor('a_x', 'a_y'), upstream)).toMatchObject({ resolution: { step: 'upstream-declared' } });
	});

	it('does not treat a strict subset of an upstream set as declared', () => {
		const upstream: UpstreamContext = { upstreamConflicts: [['a', 'b', 'c']], sourceEdges: {} };
		expect(chooseResolution(reportFor('a', 'b'), upstream)).toMatchObject({ resolution: { step: 'default' } });
	});

	it('falls to the default AddConflict otherwise', () => {
		expect(chooseResolution(reportFor('expression_statement', 'expression_statement_tuple'), identity)).toMatchObject({
			kind: 'chosen',
			resolution: { step: 'default', resolution: { kind: 'AddConflict' } }
		});
	});

	it('is unusable when tree-sitter offers no AddConflict', () => {
		const report: ConflictReport = { ...reportFor('x', 'y'), possible_resolutions: [{ Precedence: { symbols: ['x'] } }] };
		expect(chooseResolution(report, identity)).toEqual({ kind: 'unusable' });
	});
});

describe('sourceChain', () => {
	it('follows edges to a fixpoint', () => {
		expect(sourceChain('a_x_y', { a_x_y: 'a_x', a_x: 'a' })).toEqual(['a_x_y', 'a_x', 'a']);
	});
	it('is the name alone when it has no edge', () => {
		expect(sourceChain('a', { b: 'c' })).toEqual(['a']);
	});
	it('throws with the chain on a cycle', () => {
		expect(() => sourceChain('a', { a: 'b', b: 'a' })).toThrow('reshaping records form a cycle: a → b → a');
	});
});

describe('deriveConflictResolutions', () => {
	const symbolsOf = (resolutions: readonly DerivedResolution[]) => resolutions.map((r) => r.resolution.symbols);

	it('adds one resolution per reported conflict until generate is clean', async () => {
		const queue = [reportFor('a', 'b'), reportFor('c', 'd')];
		const seen: (readonly (readonly string[])[])[] = [];
		const result = await deriveConflictResolutions({
			ruleCount: 10,
			upstream: identity,
			generate: async (resolutions): Promise<GenerateOutcome> => {
				seen.push(symbolsOf(resolutions));
				const next = queue[resolutions.length];
				return next ? { kind: 'conflict', report: next } : { kind: 'clean' };
			}
		});
		expect(result).toMatchObject({ kind: 'converged', iterations: 3 });
		expect(symbolsOf(result.resolutions)).toEqual([['a', 'b'], ['c', 'd']]);
		expect(seen).toEqual([[], [['a', 'b']], [['a', 'b'], ['c', 'd']]]);
	});

	it('converges in one generate when nothing conflicts', async () => {
		expect(await deriveConflictResolutions({ ruleCount: 1, upstream: identity, generate: async () => ({ kind: 'clean' }) })).toEqual({
			kind: 'converged',
			resolutions: [],
			iterations: 1
		});
	});

	it('stops when the same conflict is reported twice', async () => {
		const result = await deriveConflictResolutions({
			ruleCount: 10,
			upstream: identity,
			generate: async () => ({ kind: 'conflict', report: reportFor('a', 'b') })
		});
		expect(result).toMatchObject({ kind: 'unresolvable', reason: 'repeated', report: reportFor('a', 'b') });
		expect(symbolsOf(result.resolutions)).toEqual([['a', 'b']]);
	});

	it('stops when no usable resolution is offered', async () => {
		const report: ConflictReport = { ...reportFor('x', 'y'), possible_resolutions: [{ Precedence: { symbols: ['x'] } }] };
		const result = await deriveConflictResolutions({ ruleCount: 10, upstream: identity, generate: async () => ({ kind: 'conflict', report }) });
		expect(result).toMatchObject({ kind: 'unresolvable', reason: 'no-usable-offer', report });
	});

	it('stops at the rule-count cap', async () => {
		let n = 0;
		const result = await deriveConflictResolutions({
			ruleCount: 2,
			upstream: identity,
			generate: async (): Promise<GenerateOutcome> => ({ kind: 'conflict', report: reportFor(`r${n}`, `s${n++}`) })
		});
		expect(result).toMatchObject({ kind: 'unresolvable', reason: 'cap' });
		expect(result.resolutions).toHaveLength(2);
	});

	it('throws on a generate error rather than resolving it', async () => {
		await expect(
			deriveConflictResolutions({ ruleCount: 2, upstream: identity, generate: async () => ({ kind: 'error', summary: { LoadGrammarFile: {} } }) })
		).rejects.toThrow(/LoadGrammarFile/);
	});
});
