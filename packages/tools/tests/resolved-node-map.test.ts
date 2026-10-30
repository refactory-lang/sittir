import { describe, expect, it } from 'vitest';
import { buildNodeMap, compileNodeMap, load } from '../src/codegen-surface.ts';

// Full grammar compilation competes with other integration suites on CI.
const grammarCompilationTimeout = 60_000;

describe.each([
	['buildNodeMap', buildNodeMap],
	['compileNodeMap', compileNodeMap]
] as const)('%s resolves the factory surface', (_name, loader) => {
	it(
		'takes the statement terminator from preferences instead of caller config',
		async () => {
			const nodeMap = await loader('typescript');
			const { AbstractAssembledCompound } = await load('modelNodeMap');
			const { registeredSlots } = await load('emittersShared');
			const node = nodeMap.nodes.get('expression_statement');
			if (!(node instanceof AbstractAssembledCompound)) throw new Error('Expected expression_statement compound');

			expect(node.configSlots.map((slot) => slot.name)).toEqual(['expression']);
			expect(registeredSlots(node).map((slot) => slot.name)).toEqual(['terminator']);
			expect(node.slots.find((slot) => slot.name === 'terminator')?.optionDefaultArm).toBeDefined();
		},
		grammarCompilationTimeout
	);

	it(
		'classifies a kind with no content by what it stores: a leaf is constant, a compound is nullary',
		async () => {
			const nodeMap = await loader('rust');
			const { suppliesNoContent } = await load('modelNodeMap');
			const { classifyFactoryShape } = await load('emittersShared');
			const shapeOf = (kind: string) => {
				const node = nodeMap.nodes.get(kind);
				if (node === undefined) throw new Error(`Expected ${kind}`);
				return [suppliesNoContent(node), classifyFactoryShape(node, nodeMap)];
			};

			expect(shapeOf('self')).toEqual([true, 'constant']);
			expect(shapeOf('range_expression_bare')).toEqual([true, 'nullary']);
			expect(shapeOf('range_expression_prefix')).toEqual([false, 'direct']);
		},
		grammarCompilationTimeout
	);

	it(
		'recognizes a referenced fixed-text slot as filled when omitted',
		async () => {
			const nodeMap = await loader('python');
			const { AbstractAssembledCompound, holdsFixedText } = await load('modelNodeMap');
			const node = nodeMap.nodes.get('suite_empty');
			if (!(node instanceof AbstractAssembledCompound)) throw new Error('Expected suite_empty compound');
			const slot = node.slots[0];
			if (slot === undefined) throw new Error('Expected empty suite newline slot');

			expect(holdsFixedText(slot)).toBe(true);
			expect(node.argumentOptional(nodeMap)).toBe(true);
		},
		grammarCompilationTimeout
	);
});
