import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { withDslGlobals } from '../../dsl/evaluate.ts';
import { enrich, getEnrichWordMatcher } from '../../dsl/enrich.ts';
import { allGrammars, BASE_ENTRY, grammarPackage, grammarPackageDir } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';

const shapeOf = (matcher: RegExp | undefined) => (matcher === undefined ? undefined : { source: matcher.source, flags: matcher.flags });

describe('the grammar word matcher is one fact', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: enrich's compiled matcher is link's pin`, { timeout: 600_000 }, async () => {
			const enriched = await withDslGlobals(async () => {
				const base = (await import(pathToFileURL(join(grammarPackageDir(grammar), BASE_ENTRY)).href)).default;
				return enrich(base);
			});
			const compiled = await compileGrammar({ package: grammarPackage(grammar) });
			expect(shapeOf(getEnrichWordMatcher(enriched))).toEqual(shapeOf(compiled.linked.wordMatcher));
		});
	}
});
