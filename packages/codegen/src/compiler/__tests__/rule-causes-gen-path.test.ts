import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../compile.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { blockedRecords } from '../diagnostics/grammar-diagnostics.ts';
import { grammarPackage } from '../../grammars.ts';

const RULE_CAUSE_CODES = /^(rule-|render-only|vocabulary-)/;

describe('rule-cause diagnostics on the gen path (with generated id tables)', () => {
	for (const grammar of ['python', 'rust']) {
		it(`${grammar}: renderAs keys are judged by their authored names, so none is reported as not external`, async () => {
			const compilation = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) });
			const ruleCauses = compilation.grammarDiagnostics.filter((d) => RULE_CAUSE_CODES.test(d.code));
			expect(ruleCauses.filter((d) => d.code === 'render-only-not-external')).toEqual([]);
			expect(blockedRecords(ruleCauses, compilation.raw.expectDiagnostics)).toEqual([]);
		}, 120_000);
	}
});
