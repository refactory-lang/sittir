import { describe, expect, it } from 'vitest';
import { allGrammars } from '@sittir/codegen/grammars';
import { languageByName, type LanguageApis } from '../src/languages.ts';

describe('languageByName', () => {
	for (const grammar of allGrammars()) {
		it(`resolves the ${grammar} descriptor and loads its hooks`, async () => {
			const language = await languageByName(grammar);
			expect(language.name).toBe(grammar);
			const hooks = await language.load();
			expect(hooks.name).toBe(grammar);
		});
	}

	it('types exactly the grammars on disk', () => {
		const typed: Record<keyof LanguageApis, true> = { python: true, regex: true, rust: true, scm: true, typescript: true };
		expect(Object.keys(typed).sort()).toEqual([...allGrammars()].sort());
	});

	it('refuses a name with no grammar package', async () => {
		await expect(languageByName('not-a-grammar')).rejects.toThrow();
	});
});
