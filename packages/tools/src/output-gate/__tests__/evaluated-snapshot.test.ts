import { describe, expect, it } from 'vitest';
import { evaluatedGrammarOf, evaluatedSnapshot, snapshotOf } from '../index.ts';

describe('evaluated-grammar snapshots', () => {
	it('gives one grammar and layer the same snapshot twice in one process', async () => {
		expect(await evaluatedSnapshot('scm', 'top')).toBe(await evaluatedSnapshot('scm', 'top'));
	});

	it('changes when the evaluated grammar changes, and not when only its key order does', async () => {
		const evaluated = (await evaluatedGrammarOf('scm', 'top')) as Record<string, unknown>;
		const snapshot = await snapshotOf(evaluated);
		expect(await snapshotOf({ ...evaluated, options: { ...(evaluated.options as object), extra: true } })).not.toBe(snapshot);
		const reordered = Object.fromEntries(Object.entries(evaluated).reverse());
		expect(await snapshotOf(reordered)).toBe(snapshot);
	});
});
