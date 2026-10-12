import { describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile, type DerivedResolution } from '../../dsl/conflict-resolutions.ts';
import type { ConflictReport, GenerateOutcome } from '../conflict-summary.ts';
import { settleConflictResolutions, type ConflictResolutionsStore, type GeneratedGrammar } from '../conflict-driver.ts';
import type { DerivationInputs } from '../evaluate-for-derivation.ts';

function reportFor(a: string, b: string): ConflictReport {
	return {
		symbol_sequence: ['expression'],
		conflicting_lookahead: "';'",
		possible_interpretations: [],
		possible_resolutions: [{ AddConflict: { symbols: [a, b] } }]
	};
}

function memoryStore(
	initial: ConflictResolutionsFile
): ConflictResolutionsStore & { readonly writes: ConflictResolutionsFile[] } {
	const writes: ConflictResolutionsFile[] = [];
	let current = initial;
	return {
		writes,
		read: () => current,
		write: (file) => {
			writes.push(file);
			current = file;
		}
	};
}

const grammarInputs = { ruleCount: 10, upstreamConflicts: [], sourceEdges: {}, baseNames: {} };
const inputs: DerivationInputs = { base: { grammarHash: 'h1', ...grammarInputs }, bound: { grammarHash: 'b1', ...grammarInputs } };
const UNSET = EMPTY_CONFLICT_RESOLUTIONS.bound;

function savedFile(file: Partial<ConflictResolutionsFile>): ConflictResolutionsFile {
	return { ...EMPTY_CONFLICT_RESOLUTIONS, ...file };
}

function oneConflictThenClean(store: ConflictResolutionsStore): () => Promise<GenerateOutcome> {
	return async () => (store.read().resolutions.length === 0 ? { kind: 'conflict', report: reportFor('a', 'b') } : { kind: 'clean' });
}

const bogus: DerivedResolution = {
	resolution: { kind: 'AddConflict', symbols: ['bogus_rule'] },
	step: 'default',
	sourceChains: [['bogus_rule']],
	conflict: { symbolSequence: [], lookahead: '', interpretations: ['bogus_rule'] }
};

describe('settleConflictResolutions', () => {
	it('stamps the grammar hash only on the settled set, after the clean run', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const result = await settleConflictResolutions({ store, inputs, runGenerate: oneConflictThenClean(store) });
		expect(result).toMatchObject({ kind: 'settled', base: { kind: 'converged', iterations: 2 } });
		expect(store.writes.map((file) => file.grammarHash)).toEqual(['', '', 'h1', 'h1', 'h1']);
		expect(store.read().resolutions.map((entry) => entry.resolution.symbols)).toEqual([['a', 'b']]);
	});

	it('leaves a failed derivation unverified, so the next run derives again instead of reporting it stale', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const failing = await settleConflictResolutions({
			store,
			inputs,
			runGenerate: async () => ({ kind: 'conflict', report: reportFor('a', 'b') })
		});
		expect(failing).toMatchObject({ kind: 'failed', grammar: 'base', result: { kind: 'unresolvable' } });
		expect(store.read().grammarHash).toBe('');
		const retry = await settleConflictResolutions({
			store,
			inputs,
			runGenerate: oneConflictThenClean(store)
		});
		expect(retry).toMatchObject({ kind: 'settled', base: { kind: 'converged', iterations: 2 } });
		expect(store.read().grammarHash).toBe('h1');
	});

	it('leaves a reused file untouched: no write for its one generate', async () => {
		const saved = savedFile({ grammarHash: 'h1', bound: { grammarHash: 'b1', resolutions: [] } });
		const store = memoryStore(saved);
		const result = await settleConflictResolutions({ store, inputs, runGenerate: async () => ({ kind: 'clean' }) });
		expect(result).toMatchObject({ kind: 'settled', base: { kind: 'reused' }, bound: { kind: 'reused' } });
		expect(store.writes).toEqual([]);
		expect(store.read()).toBe(saved);
	});

	it('keeps a stale saved base set stale on every run until someone intervenes', async () => {
		const saved = savedFile({ grammarHash: 'h1', resolutions: [bogus], bound: { grammarHash: 'b1', resolutions: [] } });
		const store = memoryStore(saved);
		const runGenerate = async (): Promise<GenerateOutcome> => ({ kind: 'error', summary: { UndefinedSymbol: 'bogus_rule' } });
		for (const _run of [1, 2]) {
			expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
				kind: 'failed',
				result: { kind: 'stale', outcome: { kind: 'error' } }
			});
		}
		expect(store.writes).toEqual([]);
		expect(store.read()).toBe(saved);
	});

	it('derives against the base grammar, then derives the bound sets against the bound grammar', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const grammars: string[] = [];
		const derive = oneConflictThenClean(store);
		const runGenerate = async (grammar: GeneratedGrammar): Promise<GenerateOutcome> => {
			grammars.push(grammar);
			return grammar === 'bound' ? { kind: 'clean' } : derive();
		};
		expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
			kind: 'settled',
			base: { kind: 'converged', iterations: 2 },
			bound: { kind: 'converged', iterations: 1 }
		});
		expect(grammars).toEqual(['base', 'base', 'bound']);
		expect(store.read().bound).toEqual({ grammarHash: 'b1', resolutions: [] });
	});

	it('derives a conflict only the bound grammar reports into the bound section, stamped after its clean run', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const runGenerate = async (grammar: GeneratedGrammar): Promise<GenerateOutcome> =>
			grammar === 'base' || store.read().bound.resolutions.length > 0 ? { kind: 'clean' } : { kind: 'conflict', report: reportFor('this_parameter', 'identifier') };
		expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
			kind: 'settled',
			base: { kind: 'converged', iterations: 1 },
			bound: { kind: 'converged', iterations: 2 }
		});
		expect(store.read().resolutions).toEqual([]);
		expect(store.read().bound.resolutions.map((entry) => entry.resolution.symbols)).toEqual([['this_parameter', 'identifier']]);
		expect(store.writes.map((file) => file.bound.grammarHash)).toEqual(['', '', '', '', 'b1']);
	});

	it('chains a bound set through its base names', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const bound = { ...inputs.bound, upstreamConflicts: [['parameter', 'identifier']], baseNames: { this_parameter: 'parameter' } };
		const runGenerate = async (grammar: GeneratedGrammar): Promise<GenerateOutcome> =>
			grammar === 'base' || store.read().bound.resolutions.length > 0 ? { kind: 'clean' } : { kind: 'conflict', report: reportFor('this_parameter', 'identifier') };
		await settleConflictResolutions({ store, inputs: { ...inputs, bound }, runGenerate });
		expect(store.read().bound.resolutions.map((entry) => [entry.step, entry.sourceChains])).toEqual([
			['upstream-declared', [['this_parameter', 'parameter'], ['identifier']]]
		]);
	});

	it('keeps the base sets and derives only the bound sets when only the bound hash changed', async () => {
		const base = [{ ...bogus, resolution: { kind: 'AddConflict' as const, symbols: ['a', 'b'] } }];
		const store = memoryStore(savedFile({ grammarHash: 'h1', resolutions: base, bound: { grammarHash: 'b0', resolutions: [bogus] } }));
		const grammars: string[] = [];
		const runGenerate = async (grammar: GeneratedGrammar): Promise<GenerateOutcome> => (grammars.push(grammar), { kind: 'clean' });
		expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
			kind: 'settled',
			base: { kind: 'reused' },
			bound: { kind: 'converged', iterations: 1 }
		});
		expect(grammars).toEqual(['base', 'bound']);
		expect(store.read().resolutions).toBe(base);
		expect(store.read().bound).toEqual({ grammarHash: 'b1', resolutions: [] });
	});

	it('reports a reused base section stale before deriving the bound one, when the base grammar no longer generates with it', async () => {
		const store = memoryStore(savedFile({ grammarHash: 'h1', bound: { grammarHash: 'b0', resolutions: [] } }));
		const grammars: string[] = [];
		const runGenerate = async (grammar: GeneratedGrammar): Promise<GenerateOutcome> =>
			(grammars.push(grammar), grammar === 'base' ? { kind: 'conflict', report: reportFor('a', 'b') } : { kind: 'clean' });
		expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
			kind: 'failed',
			grammar: 'base',
			result: { kind: 'stale', outcome: { kind: 'conflict' } }
		});
		expect(grammars).toEqual(['base']);
		expect(store.writes).toEqual([]);
	});

	it('reports a bound section stale when it carries the current bound hash but no longer generates', async () => {
		const saved = savedFile({ grammarHash: 'h1', bound: { grammarHash: 'b1', resolutions: [] } });
		const store = memoryStore(saved);
		const runGenerate = async (): Promise<GenerateOutcome> => ({ kind: 'conflict', report: reportFor('this_parameter', 'identifier') });
		for (const _run of [1, 2]) {
			expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
				kind: 'failed',
				grammar: 'bound',
				result: { kind: 'stale', outcome: { kind: 'conflict' } }
			});
		}
		expect(store.writes).toEqual([]);
	});

	it('leaves a failed bound derivation unverified, with the base sets stamped', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const runGenerate = async (grammar: GeneratedGrammar): Promise<GenerateOutcome> =>
			grammar === 'base' ? { kind: 'clean' } : { kind: 'conflict', report: reportFor('c', 'd') };
		expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({
			kind: 'failed',
			grammar: 'bound',
			result: { kind: 'unresolvable' }
		});
		expect(store.read().grammarHash).toBe('h1');
		expect(store.read().bound.grammarHash).toBe(UNSET.grammarHash);
	});

	it('generates only the bound parser when it reuses both sections', async () => {
		const store = memoryStore(savedFile({ grammarHash: 'h1', bound: { grammarHash: 'b1', resolutions: [] } }));
		const grammars: string[] = [];
		await settleConflictResolutions({ store, inputs, runGenerate: async (grammar: GeneratedGrammar) => (grammars.push(grammar), { kind: 'clean' }) });
		expect(grammars).toEqual(['bound']);
	});
});
