import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';
import { emptyForms, triviaKinds } from '../../compiler/model/trivia.ts';
import { emitTypes } from '../types.ts';

async function rust() {
	const generatedIdTables = await loadGeneratedIdTables('rust');
	const pkg = grammarPackage('rust');
	const { nodeMap } = await compileGrammar({ package: pkg, generatedIdTables });
	return { nodeMap, generatedIdTables };
}

describe('empty forms in the emitted types', () => {
	it('gives a kind that realizes empty its Empty form and type-map entry, and a kind that cannot none', async () => {
		const { nodeMap, generatedIdTables } = await rust();
		const types = emitTypes({ grammar: 'rust', nodeMap, generatedIdTables });
		expect(types).toContain('export interface EmptyBlock extends Block.Bound {');
		expect(types).toContain('InnerTrivia<this>;');
		expect(types).toContain('{ readonly node: Block; readonly empty: EmptyBlock }');
		expect(types).not.toContain('EmptyFunctionItem');
		expect(types).not.toContain('readonly node: FunctionItem;');
	});

	it('emits an empty form only for a kind with an inner gap', async () => {
		const { nodeMap } = await rust();
		for (const [kind, form] of emptyForms(nodeMap)) {
			const node = nodeMap.nodes.get(kind);
			expect(node instanceof AbstractAssembledCompound ? node.innerGaps.map((gap) => gap.key) : []).toEqual(form.gaps);
		}
	});

	it('keys inner trivia by gap only when some kind has more than one gap', async () => {
		const { nodeMap, generatedIdTables } = await rust();
		expect([...emptyForms(nodeMap).values()].every((form) => form.gaps.length === 1)).toBe(true);
		const types = emitTypes({ grammar: 'rust', nodeMap, generatedIdTables, triviaKinds: [...triviaKinds(nodeMap)] });
		expect(types).not.toContain('GrammarInnerTriviaAt<');
		expect(types).toContain("export type InnerTrivia<N> = GrammarInnerTrivia<N, RustTypeMap['trivia']>;");
	});
});
