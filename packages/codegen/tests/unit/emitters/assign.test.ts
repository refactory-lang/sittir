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
		expect(source).toContain('function wrapFunctionItem(data');
		expect(source).toContain('function wrapStructItem(data');
	});

	it('emits readTreeNode() entry point', () => {
		expect(source).toContain('export function readTreeNode');
	});

	it('emits wrapNode() dispatcher', () => {
		expect(source).toContain('export function wrapNode');
	});

	it('emits promote/drillIn helpers', () => {
		expect(source).toContain('function promote(');
		expect(source).toContain('function promoteAnon(');
		expect(source).toContain('function drillIn(');
	});

	it('emits lazy getters (not eager recursion)', () => {
		// Wrap functions should use getter syntax, not direct recursion
		expect(source).toContain('get ');
		expect(source).toContain('drillIn(');
	});
});
