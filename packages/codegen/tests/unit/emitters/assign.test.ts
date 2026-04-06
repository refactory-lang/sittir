import { describe, it, expect } from 'vitest';
import { emitWrap } from '../../../src/emitters/wrap.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';

const grammar = 'rust';
const { newModel } = buildGrammarModel(grammar);
const allNodes = [...newModel.models.values()];

describe('emitWrap', () => {
	const source = emitWrap({ grammar, nodes: allNodes });

	it('emits _wrapTable dispatch table', () => {
		expect(source).toContain('const _wrapTable');
		expect(source).toContain("'function_item':");
		expect(source).toContain("'struct_item':");
	});

	it('emits per-kind wrap functions', () => {
		expect(source).toContain('function wrapFunctionItem(target');
		expect(source).toContain('function wrapStructItem(target');
	});

	it('emits readNode() entry point', () => {
		expect(source).toContain('export function readNode');
	});

	it('emits edit() as alias for readNode', () => {
		expect(source).toContain('export const edit = readNode');
	});
});
