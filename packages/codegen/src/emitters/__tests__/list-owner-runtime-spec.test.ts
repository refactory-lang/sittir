import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { listOptionKeys, listOwnerHint, listOwnerRuntimeSpec } from '../factories.ts';

const keysOf = (text: string): string[] => [...text.matchAll(/\b(separator|delimiter)\??:/g)].map((m) => m[1]!).sort();

describe('the list-owner runtime spec', () => {
	it('names an option key exactly when the list factory takes it', () => {
		expect(listOptionKeys({ hasSeparatorKindOption: false, hasDelimiterOption: true })).toEqual(['delimiter']);
		expect(listOptionKeys({ hasSeparatorKindOption: true, hasDelimiterOption: false })).toEqual(['separator']);
		expect(listOptionKeys({ hasSeparatorKindOption: false, hasDelimiterOption: false })).toEqual([]);
	});

	for (const grammar of ['rust', 'python', 'typescript'] as const) {
		it(`${grammar}: every owner's spec keys are the keys of its list-owner marker's options`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			let owners = 0;
			for (const node of nodeMap.nodes.values()) {
				const spec = listOwnerRuntimeSpec(node, nodeMap, undefined);
				const hint = listOwnerHint(node, nodeMap, undefined);
				expect(spec === undefined).toBe(hint === undefined);
				if (spec === undefined || hint === undefined) continue;
				owners++;
				const options = /options: \[([^\]]*)\]/.exec(spec)![1]!;
				expect([...options.matchAll(/"(\w+)"/g)].map((m) => m[1]!).sort()).toEqual(keysOf(hint.options));
			}
			expect(owners).toBeGreaterThan(0);
		});
	}
});
