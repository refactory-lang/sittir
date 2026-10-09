import { describe, expect, it, vi } from 'vitest';

// Two regex sources, each holding a kind whose occurrence the typed read
// stores without a node of its own.
const SOURCES = { 'lazy quantifier': 'a*?', 'escaped dash in a class': '[\\-]' };

vi.mock('../common.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../common.ts')>();
	return {
		...actual,
		loadCorpusEntries: (grammar: string) => {
			const [template] = actual.loadCorpusEntries(grammar);
			return Object.entries(SOURCES).map(([name, source]) => ({ ...template!, name, source }));
		}
	};
});

const { validateFrom } = await import('../from.ts');

describe('validate-from: an occurrence the read holds no node for', () => {
	it('is excluded with the model fact that explains it, not failed', async () => {
		const result = await validateFrom('regex', 'native');
		const reasons = Object.fromEntries(
			result.excluded.filter((skip) => skip.kind !== undefined).map((skip) => [skip.kind, skip.reason])
		);
		expect(reasons.lazy).toBe('folded-into-parent-text');
		expect(reasons.identity_escape).toBe('read-as-unit-variant');
		expect(result.errors.filter((error) => error.severity === 'error')).toEqual([]);
	});
});
