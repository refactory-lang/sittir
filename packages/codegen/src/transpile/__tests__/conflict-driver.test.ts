import { describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
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

function memoryStore(initial: ConflictResolutionsFile): ConflictResolutionsStore & { readonly writes: ConflictResolutionsFile[] } {
	const writes: ConflictResolutionsFile[] = [];
	let current = initial;
	return {
		writes,
		read: () => current,
		write: async (file) => {
			writes.push(file);
			current = file;
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

	it('keeps the stamp when the saved set is reused', async () => {
		const settled = memoryStore(EMPTY_CONFLICT_RESOLUTIONS);
		await settleConflictResolutions({ store: settled, inputs, runGenerate: async () => ({ kind: 'clean' }) });
		const store = memoryStore(settled.read());
		const result = await settleConflictResolutions({ store, inputs, runGenerate: async () => ({ kind: 'clean' }) });
		expect(result).toMatchObject({ kind: 'reused' });
		expect(store.read()).toEqual({ grammarHash: 'h1', resolutions: [] });
	});
});
