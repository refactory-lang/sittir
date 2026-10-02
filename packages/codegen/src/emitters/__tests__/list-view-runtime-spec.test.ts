import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { listOptionKeys, listViewHint, listViewPlanOf } from '../factories.ts';

const keysOf = (text: string): string[] => [...text.matchAll(/\b(separator|delimiter)\??:/g)].map((m) => m[1]!).sort();

describe('the list-view plan', () => {
	it('names an option key exactly when the list factory takes it', () => {
		expect(listOptionKeys({ hasSeparatorKindOption: false, hasDelimiterOption: true })).toEqual(['delimiter']);
		expect(listOptionKeys({ hasSeparatorKindOption: true, hasDelimiterOption: false })).toEqual(['separator']);
		expect(listOptionKeys({ hasSeparatorKindOption: false, hasDelimiterOption: false })).toEqual([]);
	});

	for (const grammar of allGrammars()) {
		it(`${grammar}: every list view's spec keys are the keys of its marker's options`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			let views = 0;
			for (const node of nodeMap.nodes.values()) {
				const plan = listViewPlanOf(node, nodeMap, undefined);
				const hint = listViewHint(node, nodeMap, undefined);
				expect(plan === undefined).toBe(hint === undefined);
				if (plan === undefined || hint === undefined) continue;
				views++;
				expect(plan.options.map((option) => option.key).sort()).toEqual(keysOf(hint.options));
				expect(plan.count).toMatch(/^_\w+$/);
			}
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(views).toBeGreaterThan(0);
		});
	}
});
