import { describe, expect, it } from 'vitest';
import { sourceChain, type DerivedResolution, type ResolutionSection } from '../../dsl/conflict-resolutions.ts';
import {
	chooseResolution,
	deriveConflictResolutions,
	pruneUnnecessary,
	reuseOrDeriveConflictResolutions,
	type UpstreamContext
} from '../derive-conflicts.ts';
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
			associativity: null,
			requires_eof_lookahead: false
		})),
		possible_resolutions: [{ Precedence: { symbols: [a] } }, { AddConflict: { symbols: [a, b] } }]
	};
}

const identity: UpstreamContext = {
	upstreamConflicts: [['pattern', 'primary_expression']],
	sourceEdges: {},
	baseNames: {}
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
		const upstream: UpstreamContext = { upstreamConflicts: [['a', 'b']], sourceEdges: { a_x: 'a' }, baseNames: {} };
		expect(chooseResolution(reportFor('a_x', 'b'), upstream)).toMatchObject({
			kind: 'chosen',
			resolution: { step: 'upstream-declared', resolution: { symbols: ['a_x', 'b'] }, sourceChains: [['a_x', 'a'], ['b']] }
		});
	});

	it('dedupes mapped sources before comparing: two variants of one upstream rule match its singleton set', () => {
		const upstream: UpstreamContext = { upstreamConflicts: [['a']], sourceEdges: { a_x: 'a', a_y: 'a' }, baseNames: {} };
		expect(chooseResolution(reportFor('a_x', 'a_y'), upstream)).toMatchObject({ resolution: { step: 'upstream-declared' } });
	});

	it('does not treat a strict subset of an upstream set as declared', () => {
		const upstream: UpstreamContext = { upstreamConflicts: [['a', 'b', 'c']], sourceEdges: {}, baseNames: {} };
		expect(chooseResolution(reportFor('a', 'b'), upstream)).toMatchObject({ resolution: { step: 'default' } });
	});

	it('falls to the default AddConflict otherwise', () => {
		expect(chooseResolution(reportFor('expression_statement', 'expression_statement_tuple'), identity)).toMatchObject({
			kind: 'chosen',
			resolution: { step: 'default', resolution: { kind: 'AddConflict' } }
		});
	});

	it('chains a bound name through its base name, apart from the base names it may reuse', () => {
		const upstream: UpstreamContext = { upstreamConflicts: [], sourceEdges: { parameter_x: 'parameter' }, baseNames: { value_parameter: 'parameter' } };
		expect(chooseResolution(reportFor('parameter', 'value_parameter'), upstream)).toMatchObject({
			resolution: { sourceChains: [['parameter'], ['value_parameter', 'parameter']] }
		});
		expect(chooseResolution(reportFor('parameter_x', 'value_parameter'), upstream)).toMatchObject({
			resolution: { sourceChains: [['parameter_x', 'parameter'], ['value_parameter', 'parameter']] }
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
				return next ? { kind: 'conflict', report: next } : { kind: 'clean', unnecessary: [] };
			}
		});
		expect(result).toMatchObject({ kind: 'converged', iterations: 3 });
		expect(symbolsOf(result.resolutions)).toEqual([['a', 'b'], ['c', 'd']]);
		expect(seen).toEqual([[], [['a', 'b']], [['a', 'b'], ['c', 'd']]]);
	});

	it('converges in one generate when nothing conflicts', async () => {
		expect(await deriveConflictResolutions({ ruleCount: 1, upstream: identity, generate: async () => ({ kind: 'clean', unnecessary: [] }) })).toEqual({
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

describe('reuseOrDeriveConflictResolutions', () => {
	const staleEntry = chooseResolution(reportFor('stale', 'x'), identity);
	if (staleEntry.kind !== 'chosen') throw new Error('fixture offers AddConflict');
	const saved: ResolutionSection = { grammarHash: 'h1', resolutions: [staleEntry.resolution] };

	function recordingGenerate(conflicts: readonly ConflictReport[]) {
		const calls: (readonly (readonly string[])[])[] = [];
		const generate = async (resolutions: readonly DerivedResolution[]): Promise<GenerateOutcome> => {
			calls.push(resolutions.map((entry) => entry.resolution.symbols));
			const next = conflicts[resolutions.length];
			return next ? { kind: 'conflict', report: next } : { kind: 'clean', unnecessary: [] };
		};
		return { calls, generate };
	}

	it('runs a single generate with the saved resolutions when the grammar hash is unchanged', async () => {
		const { calls, generate } = recordingGenerate([]);
		const result = await reuseOrDeriveConflictResolutions({ saved, grammarHash: 'h1', ruleCount: 10, upstream: identity, generate, generateSaved: () => generate(saved.resolutions) });
		expect(result).toEqual({ kind: 'reused', resolutions: saved.resolutions, iterations: 1 });
		expect(calls).toEqual([[['stale', 'x']]]);
	});

	it('re-derives from an empty list when the grammar hash changed, dropping stale entries', async () => {
		const { calls, generate } = recordingGenerate([reportFor('a', 'b')]);
		const result = await reuseOrDeriveConflictResolutions({ saved, grammarHash: 'h2', ruleCount: 10, upstream: identity, generate, generateSaved: () => generate(saved.resolutions) });
		expect(result).toMatchObject({ kind: 'converged', iterations: 2 });
		expect(result.resolutions.map((entry) => entry.resolution.symbols)).toEqual([['a', 'b']]);
		expect(calls[0]).toEqual([]);
	});

	it('reports the saved resolutions stale when they fail to generate under an unchanged hash', async () => {
		const { calls, generate } = recordingGenerate([reportFor('a', 'b'), reportFor('c', 'd')]);
		const result = await reuseOrDeriveConflictResolutions({ saved, grammarHash: 'h1', ruleCount: 10, upstream: identity, generate, generateSaved: () => generate(saved.resolutions) });
		expect(result).toEqual({ kind: 'stale', outcome: { kind: 'conflict', report: reportFor('c', 'd') }, resolutions: saved.resolutions });
		expect(calls).toEqual([[['stale', 'x']]]);
	});

	it('reports the saved resolutions stale, not a throw, when they fail to build under an unchanged hash', async () => {
		const summary = { UndefinedSymbol: 'bogus' };
		const result = await reuseOrDeriveConflictResolutions({
			saved,
			grammarHash: 'h1',
			ruleCount: 10,
			upstream: identity,
			generate: async () => {
				throw new Error('the reuse path never derives');
			},
			generateSaved: async () => ({ kind: 'error', summary })
		});
		expect(result).toEqual({ kind: 'stale', outcome: { kind: 'error', summary }, resolutions: saved.resolutions });
	});
});

describe('pruning the sets tree-sitter calls unnecessary', () => {
	const symbolsOf = (resolutions: readonly DerivedResolution[]) => resolutions.map((r) => r.resolution.symbols);
	const chosenFor = (a: string, b: string): DerivedResolution => {
		const choice = chooseResolution(reportFor(a, b), { upstreamConflicts: [], sourceEdges: {}, baseNames: {} });
		if (choice.kind !== 'chosen') throw new Error('no offer');
		return choice.resolution;
	};
	const converged = (resolutions: readonly DerivedResolution[]) => ({ kind: 'converged' as const, resolutions, iterations: resolutions.length + 1 });
	const clean = (...unnecessary: string[][]): GenerateOutcome => ({ kind: 'clean', unnecessary });

	it('drops a derived set the clean run calls unnecessary, regenerates, and counts the extra run', async () => {
		const seen: (readonly (readonly string[])[])[] = [];
		const result = await pruneUnnecessary(
			{ ruleCount: 10, upstream: identity, generate: async (resolutions) => (seen.push(symbolsOf(resolutions)), clean()) },
			converged([chosenFor('a', 'b'), chosenFor('c', 'd')]),
			[['a', 'b']]
		);
		expect(result).toMatchObject({ kind: 'converged', iterations: 4 });
		expect(symbolsOf((result as { resolutions: readonly DerivedResolution[] }).resolutions)).toEqual([['c', 'd']]);
		expect(seen).toEqual([[['c', 'd']]]);
	});

	it('repeats until a clean run reports nothing, since dropping one set can leave another unnecessary', async () => {
		const reports = [clean(['c', 'd']), clean()];
		const result = await pruneUnnecessary(
			{ ruleCount: 10, upstream: identity, generate: async () => reports.shift()! },
			converged([chosenFor('a', 'b'), chosenFor('c', 'd'), chosenFor('e', 'f')]),
			[['a', 'b']]
		);
		expect(symbolsOf((result as { resolutions: readonly DerivedResolution[] }).resolutions)).toEqual([['e', 'f']]);
		expect(result).toMatchObject({ kind: 'converged', iterations: 6 });
	});

	it('leaves a set it did not derive alone, and does not regenerate for it', async () => {
		let runs = 0;
		const result = await pruneUnnecessary(
			{ ruleCount: 10, upstream: identity, generate: async () => (runs++, clean()) },
			converged([chosenFor('a', 'b')]),
			[['x', 'y']]
		);
		expect(runs).toBe(0);
		expect(result).toMatchObject({ kind: 'converged', iterations: 2 });
		expect(symbolsOf((result as { resolutions: readonly DerivedResolution[] }).resolutions)).toEqual([['a', 'b']]);
	});

	it('fails when a dropped set comes back as a conflict', async () => {
		const result = await pruneUnnecessary(
			{ ruleCount: 10, upstream: identity, generate: async () => ({ kind: 'conflict', report: reportFor('a', 'b') }) },
			converged([chosenFor('a', 'b')]),
			[['a', 'b']]
		);
		expect(result).toMatchObject({ kind: 'unresolvable', reason: 'dropped-set-returned', resolutions: [] });
	});

	it('is a no-op through deriveConflictResolutions when tree-sitter reports nothing unnecessary', async () => {
		const queue = [reportFor('a', 'b')];
		const result = await deriveConflictResolutions({
			ruleCount: 10,
			upstream: identity,
			generate: async (resolutions): Promise<GenerateOutcome> => {
				const next = queue[resolutions.length];
				return next ? { kind: 'conflict', report: next } : clean();
			}
		});
		expect(result).toMatchObject({ kind: 'converged', iterations: 2 });
	});

	it('prunes through deriveConflictResolutions when the converging run calls a derived set unnecessary', async () => {
		const queue = [reportFor('a', 'b'), reportFor('a', 'c')];
		const result = await deriveConflictResolutions({
			ruleCount: 10,
			upstream: identity,
			generate: async (resolutions): Promise<GenerateOutcome> => {
				const next = queue[resolutions.length];
				if (next) return { kind: 'conflict', report: next };
				return symbolsOf(resolutions).some((symbols) => symbols.join() === 'a,b') ? clean(['a', 'b']) : clean();
			}
		});
		expect(symbolsOf((result as { resolutions: readonly DerivedResolution[] }).resolutions)).toEqual([['a', 'c']]);
	});
});
