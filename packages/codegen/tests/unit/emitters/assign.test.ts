import { describe, it, expect } from 'vitest';
import { emitAssign } from '../../../src/emitters/assign.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';

const grammar = 'rust';
const { model } = buildGrammarModel(grammar);
const allNodes = Object.values(model.nodes);
const selectedNodes = allNodes.filter(n => ['function_item', 'struct_item', 'binary_expression'].includes(n.kind));

describe('emitAssign', () => {
	const source = emitAssign({ grammar, nodes: allNodes });

	it('emits assignByKind dispatch table', () => {
		expect(source).toContain('const _assignTable');
		expect(source).toContain("'function_item':");
		expect(source).toContain("'struct_item':");
	});

	it('emits per-kind assign functions', () => {
		expect(source).toContain('function assignFunctionItem(target');
		expect(source).toContain('function assignStructItem(target');
	});

	it('emits edit() entry point', () => {
		expect(source).toContain('export function edit');
	});
});
