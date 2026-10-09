import { describe, expect, it, vi } from 'vitest';

// Two regex sources, each holding a kind the typed read stores without a node
// of its own: inside its parent's text, or as its parent's presence or unit.
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

describe('validate-from: a kind no entry reads as a node of its own', () => {
	it('is tested through the nearest ancestor the read holds, not excluded', async () => {
		const result = await validateFrom('regex');
		const unread = new Set(['lazy', 'identity_escape']);
		expect(result.excluded.filter((skip) => skip.kind !== undefined && unread.has(skip.kind))).toEqual([]);
		expect(result.errors.filter((error) => unread.has(error.kind))).toEqual([]);
		expect(result.errors.filter((error) => error.severity === 'error')).toEqual([]);
		expect(result.pass).toBe(result.total);
	});
});
