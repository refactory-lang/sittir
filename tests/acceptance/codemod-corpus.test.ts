import { describe, expect, it } from 'vitest';
import { CODEMOD_CORPUS, rewriteWithInline, runCodemodCorpus } from '../../packages/tools/src/exercise/codemod-corpus.ts';

describe('codemod-corpus selection', () => {
	it('leaves a function that already carries an outer #[inline]', async () => {
		expect(await rewriteWithInline('#[inline]\nfn f() {}\n')).toEqual({ output: '#[inline]\nfn f() {}\n', insertions: 0 });
	});

	it('leaves a function preceded by an inner #![inline]', async () => {
		expect(await rewriteWithInline('#![inline]\nfn f() {}\n')).toEqual({ output: '#![inline]\nfn f() {}\n', insertions: 0 });
	});

	it('inserts #[inline] above the attributes of a short function that has none', async () => {
		expect(await rewriteWithInline('#[cfg(x)]\nfn f() {}\n')).toEqual({ output: '#[inline]\n#[cfg(x)]\nfn f() {}\n', insertions: 1 });
	});
});

describe('codemod-corpus on the acceptance sample', () => {
	it('matches the acceptance baseline on at least 19 files, differing only on the impl-nested one', async () => {
		const result = await runCodemodCorpus(CODEMOD_CORPUS);
		expect(result.total).toBe(20);
		expect(result.identical).toBeGreaterThanOrEqual(19);
		expect(result.files.filter((file) => !file.identical).map((file) => file.file)).toEqual(result.identical === 20 ? [] : ['08.rs']);
	});
});
