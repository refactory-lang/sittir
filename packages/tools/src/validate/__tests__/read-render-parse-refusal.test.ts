import { describe, expect, it, vi } from 'vitest';

const REFUSED = 'injected read refusal';
const walk = { hideEveryCandidate: false };

vi.mock('../common.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../common.ts')>();
	return {
		...actual,
		loadCorpusEntries: (grammar: string) => actual.loadCorpusEntries(grammar).slice(0, 3),
		walkWrappedTree: (...[root, visit, onAccessorThrow]: Parameters<typeof actual.walkWrappedTree>) => {
			if (!walk.hideEveryCandidate) actual.walkWrappedTree(root, visit, onAccessorThrow);
			onAccessorThrow?.({ key: '_injected', accessor: 'injected', type: 0, message: REFUSED });
		}
	};
});

const { validateReadRenderParse } = await import('../read-render-parse.ts');

describe('read-render-parse: a read refusal anywhere in an entry', () => {
	it('fails the entry, with the refusal among its errors, though its candidates round-trip', async () => {
		walk.hideEveryCandidate = false;
		const result = await validateReadRenderParse('scm', { backend: 'native', recursive: true });
		expect(result.total).toBe(3);
		expect(result.skip).toBe(0);
		expect(result.pass).toBe(0);
		expect(result.fail).toBe(3);
		expect(result.errors.filter((error) => error.message.includes(REFUSED))).toHaveLength(3);
	});

	it('fails the entry, not skips it, when the refusal leaves no candidate to test', async () => {
		walk.hideEveryCandidate = true;
		const result = await validateReadRenderParse('scm', { backend: 'native', recursive: true });
		expect(result.skip).toBe(0);
		expect(result.fail).toBe(3);
		expect(result.errors.filter((error) => error.message.includes(REFUSED))).toHaveLength(3);
	});
});
