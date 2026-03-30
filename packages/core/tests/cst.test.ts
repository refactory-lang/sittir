import { describe, it, expect } from 'vitest';
import { toCst } from '../src/cst.ts';
import { createRenderer } from '../src/render.ts';
import type { RulesConfig, AnyNodeData } from '../src/types.ts';

const config: RulesConfig = {
	language: 'test',
	extensions: ['test'],
	expandoChar: null,
	metadata: { grammarSha: 'test' },
	rules: {
		function_item: 'fn $NAME() $BODY',
		block: '{ }',
	},
};

const renderer = createRenderer(config);

describe('toCst', () => {
	it('produces a CSTNode for a terminal node', () => {
		const node: AnyNodeData = { type: 'identifier', text: 'main' };
		const cst = toCst(node, renderer);
		expect(cst.type).toBe('identifier');
		expect(cst.text).toBe('main');
		expect(cst.isNamed).toBe(true);
		expect(cst.startIndex).toBe(0);
		expect(cst.endIndex).toBe(4);
		expect(cst.children).toHaveLength(0);
	});

	it('produces a CSTNode for a branch node with correct text', () => {
		const node: AnyNodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', text: 'main' },
				body: { type: 'block', fields: {} },
			},
		};
		const cst = toCst(node, renderer);
		expect(cst.type).toBe('function_item');
		expect(cst.text).toBe('fn main() { }');
		expect(cst.isNamed).toBe(true);
		expect(cst.startIndex).toBe(0);
		expect(cst.endIndex).toBe(cst.text.length);
	});

	it('respects offset parameter', () => {
		const node: AnyNodeData = { type: 'identifier', text: 'x' };
		const cst = toCst(node, renderer, 100);
		expect(cst.startIndex).toBe(100);
		expect(cst.endIndex).toBe(101);
	});
});
