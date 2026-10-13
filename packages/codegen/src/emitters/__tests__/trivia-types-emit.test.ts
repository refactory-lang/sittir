import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';
import { emptyForms, innerKinds, triviaKinds } from '../../compiler/model/trivia.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { emitTypes } from '../types.ts';

describe('empty forms in the emitted types', () => {
	let nodeMap: Awaited<ReturnType<typeof compileGrammar>>['nodeMap'];
	let generatedIdTables: Awaited<ReturnType<typeof loadGeneratedIdTables>>;

	beforeAll(async () => {
		generatedIdTables = await loadGeneratedIdTables('rust');
		({ nodeMap } = await compileGrammar({ package: grammarPackage('rust'), generatedIdTables }));
	}, FULL_PIPELINE_TIMEOUT);

	it('gives a kind that realizes empty its Empty form and type-map entry, and a kind that cannot none', () => {
		const types = emitTypes({ grammar: 'rust', nodeMap, generatedIdTables });
		expect(types).toContain('export interface EmptyBlock extends Block.Bound {');
		expect(types).toContain('InnerTrivia<this>;');
		expect(types).toContain('{ readonly node: Block; readonly empty: EmptyBlock }');
		expect(types).not.toContain('EmptyFunctionItem');
		expect(types).not.toContain('readonly node: FunctionItem;');
	});

	it('emits an empty form only for a kind with an inner side', () => {
		for (const kind of emptyForms(nodeMap).keys()) {
			const node = nodeMap.nodes.get(kind);
			expect(node instanceof AbstractAssembledCompound ? node.innerGaps.length : 0).toBe(1);
			expect(innerKinds(nodeMap).has(kind)).toBe(true);
		}
	});

	it('types the inner side with no gap name', () => {
		const types = emitTypes({ grammar: 'rust', nodeMap, generatedIdTables, triviaKinds: [...triviaKinds(nodeMap)] });
		expect(types).not.toMatch(/\binnerAt\b/);
		expect(types).toContain("export type InnerTrivia<N> = GrammarInnerTrivia<N, RustTypeMap['trivia']>;");
	});

	it('names the trivia members through each supertype that covers them', () => {
		const types = emitTypes({ grammar: 'rust', nodeMap, generatedIdTables, triviaKinds: [...triviaKinds(nodeMap)] });
		const admitted = types.match(/readonly trivia:([^;]*);/)?.[1]?.split('|').map((name) => name.trim()).filter((name) => name !== '');
		expect(admitted).toEqual(['Comment', 'Layout']);
	});

	it('puts the inner side of a kind with two inner gaps at its last', () => {
		const twoGaps = Object.create(AbstractAssembledCompound.prototype, {
			innerGaps: { value: [{ key: 'initializer', precedingTokens: 1 }, { key: 'elements', precedingTokens: 2 }] }
		});
		expect(twoGaps.innerSite).toEqual({ key: 'elements', precedingTokens: 2 });
		expect(innerKinds({ nodes: new Map([['switch', twoGaps]]) } as NodeMap)).toEqual(new Set(['switch']));
	});
});
