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
		'recognizes a referenced fixed-text slot as filled when omitted',
		async () => {
			const nodeMap = await loader('rust');
			const { AbstractAssembledCompound, holdsFixedText } = await load('modelNodeMap');
			const node = nodeMap.nodes.get('range_expression_bare');
			if (!(node instanceof AbstractAssembledCompound)) throw new Error('Expected range_expression_bare compound');
			const slot = node.slots[0];
			if (slot === undefined) throw new Error('Expected bare range slot');

			expect(holdsFixedText(slot)).toBe(true);
			expect(node.argumentOptional(nodeMap)).toBe(true);
		},
		grammarCompilationTimeout
	);
});
