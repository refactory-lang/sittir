import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { loadPackageNodeTypes } from '../../validate/node-types-loader.ts';
import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';
import { emptyForms, triviaKinds } from '../../compiler/model/trivia.ts';
import { emitClientUtils } from '../client-utils.ts';
import { emitTypes } from '../types.ts';

async function rust() {
	const generatedIdTables = await loadGeneratedIdTables('rust');
	const pkg = grammarPackage('rust');
	const { nodeMap } = await compileGrammar({ package: pkg, generatedIdTables });
	return { nodeMap, generatedIdTables, nodeTypes: loadPackageNodeTypes(pkg) };
}

describe('empty forms in the emitted types', () => {
	it('gives a kind that realizes empty its Empty form and isEmpty overload, and a kind that cannot none', async () => {
		const { nodeMap, generatedIdTables, nodeTypes } = await rust();
		const types = emitTypes({ grammar: 'rust', nodeTypes, nodeMap, generatedIdTables });
		const utils = emitClientUtils({ nodeMap, triviaKinds: [...triviaKinds(nodeMap)] });
		expect(types).toContain('export interface EmptyBlock extends Block.Built {');
		expect(types).toContain('InnerTrivia<this>;');
		expect(utils).toContain('export function isEmpty(node: T.Block): node is T.EmptyBlock;');
		expect(types).not.toContain('EmptyFunctionItem');
		expect(utils).not.toContain('T.FunctionItem)');
	});

	it('emits an empty form only for a kind with an inner gap', async () => {
		const { nodeMap } = await rust();
		for (const [kind, form] of emptyForms(nodeMap)) {
			const node = nodeMap.nodes.get(kind);
			expect(node instanceof AbstractAssembledCompound ? node.innerGaps.map((gap) => gap.key) : []).toEqual(form.gaps);
		}
	});

	it('keys inner trivia by gap only when some kind has more than one gap', async () => {
		const { nodeMap } = await rust();
		expect([...emptyForms(nodeMap).values()].every((form) => form.gaps.length === 1)).toBe(true);
		const utils = emitClientUtils({ nodeMap, triviaKinds: [...triviaKinds(nodeMap)] });
		expect(utils).not.toContain('innerAt(');
		expect(utils).toContain('export interface InnerTrivia<N> {');
	});
});
