import { describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile, type DerivedResolution } from '../../dsl/conflict-resolutions.ts';
import type { ConflictReport, GenerateOutcome } from '../conflict-summary.ts';
import { settleConflictResolutions, type ConflictResolutionsStore } from '../conflict-driver.ts';
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
): ConflictResolutionsStore & { readonly writes: ConflictResolutionsFile[]; readonly bundles: { count: number } } {
	const writes: ConflictResolutionsFile[] = [];
	const bundles = { count: 0 };
	let current = initial;
	return {
		writes,
		bundles,
		read: () => current,
		write: async (file) => {
			writes.push(file);
			current = file;
		},
		bundle: async () => {
			bundles.count++;
		}
	};
}

const inputs: DerivationInputs = { grammarHash: 'h1', ruleCount: 10, upstreamConflicts: [], sourceEdges: {} };

function oneConflictThenClean(store: ConflictResolutionsStore): () => Promise<GenerateOutcome> {
	return async () => (store.read().resolutions.length === 0 ? { kind: 'conflict', report: reportFor('a', 'b') } : { kind: 'clean' });
}

describe('settleConflictResolutions', () => {
	it('stamps the grammar hash only on the settled set, after the clean run', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const result = await settleConflictResolutions({ store, inputs, runGenerate: oneConflictThenClean(store) });
		expect(result).toMatchObject({ kind: 'converged', iterations: 2 });
		expect(store.writes.map((file) => file.grammarHash)).toEqual(['', '', 'h1']);
		expect(store.read().resolutions.map((entry) => entry.resolution.symbols)).toEqual([['a', 'b']]);
	});

	it('leaves a failed derivation unverified, so the next run derives again instead of reporting it stale', async () => {
		const store = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		const failing = await settleConflictResolutions({
			store,
			inputs,
			runGenerate: async () => ({ kind: 'conflict', report: reportFor('a', 'b') })
		});
		expect(failing.kind).toBe('unresolvable');
		expect(store.read().grammarHash).toBe('');
		const retry = await settleConflictResolutions({
			store,
			inputs,
			runGenerate: oneConflictThenClean(store)
		});
		expect(retry).toMatchObject({ kind: 'converged', iterations: 2 });
		expect(store.read().grammarHash).toBe('h1');
	});

	it('leaves a reused set untouched: no write, only a bundle for its one generate', async () => {
		const saved: ConflictResolutionsFile = { grammarHash: 'h1', resolutions: [] };
		const store = memoryStore(saved);
		const result = await settleConflictResolutions({ store, inputs, runGenerate: async () => ({ kind: 'clean' }) });
		expect(result).toMatchObject({ kind: 'reused' });
		expect(store.writes).toEqual([]);
		expect(store.bundles.count).toBe(1);
		expect(store.read()).toBe(saved);
	});

	it('keeps a stale saved set stale on every run until someone intervenes', async () => {
		const bogus: DerivedResolution = {
			resolution: { kind: 'AddConflict', symbols: ['bogus_rule'] },
			step: 'default',
			sourceChains: [['bogus_rule']],
			conflict: { symbolSequence: [], lookahead: '', interpretations: ['bogus_rule'] }
		};
		const saved: ConflictResolutionsFile = { grammarHash: 'h1', resolutions: [bogus] };
		const store = memoryStore(saved);
		const runGenerate = async (): Promise<GenerateOutcome> => ({ kind: 'error', summary: { UndefinedSymbol: 'bogus_rule' } });
		for (const _run of [1, 2]) {
			expect(await settleConflictResolutions({ store, inputs, runGenerate })).toMatchObject({ kind: 'stale', outcome: { kind: 'error' } });
		}
		expect(store.writes).toEqual([]);
		expect(store.read()).toBe(saved);
	});
});
