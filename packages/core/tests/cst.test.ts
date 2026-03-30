import { describe, it, expect } from 'vitest';
import { toCst } from '../src/cst.ts';
import type { RulesRegistry } from '../src/render.ts';
import type { NodeData } from '../src/types.ts';

const registry: RulesRegistry = {
	function_item: '(function_item "fn" name: (_) "(" ")" body: (_)?)',
	block: '(block "{" "}")',
};

describe('toCst', () => {
	it('produces a CSTNode for a terminal node', () => {
		const node: NodeData = { type: 'identifier', fields: {}, text: 'main' };
		const cst = toCst(node, registry);
		expect(cst.type).toBe('identifier');
		expect(cst.text).toBe('main');
		expect(cst.isNamed).toBe(true);
		expect(cst.startIndex).toBe(0);
		expect(cst.endIndex).toBe(4);
		expect(cst.children).toHaveLength(0);
	});

	it('produces a CSTNode for a branch node with correct text', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', fields: {}, text: 'main' },
				body: { type: 'block', fields: {} },
			},
		};
		const cst = toCst(node, registry);
		expect(cst.type).toBe('function_item');
		expect(cst.text).toBe('fn main ( ) { }');
		expect(cst.isNamed).toBe(true);
		expect(cst.startIndex).toBe(0);
		expect(cst.endIndex).toBe(cst.text.length);
	});

	it('respects offset parameter', () => {
		const node: NodeData = { type: 'identifier', fields: {}, text: 'x' };
		const cst = toCst(node, registry, 100);
		expect(cst.startIndex).toBe(100);
		expect(cst.endIndex).toBe(101);
	});
});
