import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';
import { emptyForms, triviaKinds } from '../../compiler/model/trivia.ts';
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

	it('emits an empty form only for a kind with an inner gap', () => {
		for (const [kind, form] of emptyForms(nodeMap)) {
			const node = nodeMap.nodes.get(kind);
			expect(node instanceof AbstractAssembledCompound ? node.innerGaps.map((gap) => gap.key) : []).toEqual(form.gaps);
		}
	});

	it('keys inner trivia by gap only when some kind has more than one gap', () => {
		expect([...emptyForms(nodeMap).values()].every((form) => form.gaps.length === 1)).toBe(true);
		const types = emitTypes({ grammar: 'rust', nodeMap, generatedIdTables, triviaKinds: [...triviaKinds(nodeMap)] });
		expect(types).not.toContain('GrammarInnerTriviaAt<');
		expect(types).toContain("export type InnerTrivia<N> = GrammarInnerTrivia<N, RustTypeMap['trivia']>;");
	});
});
