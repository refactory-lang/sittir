import { describe, it, expect } from 'vitest';
import { render } from '../src/render.ts';
import type { RulesRegistry, JoinByMap } from '../src/render.ts';
import type { NodeData } from '../src/types.ts';

const registry: RulesRegistry = {
	function_item: '(function_item "fn" name: (_) "(" parameters: (_)* ")" return_type: (_)? body: (_)?)',
	block: '(block "{" (_)* "}")',
	parameter: '(parameter name: (_) ":" type: (_))',
	binary_expression: '(binary_expression left: (_) operator: (_) right: (_))',
};

const joinBy: JoinByMap = {
	function_item: ', ',  // parameters separated by comma
};

describe('render', () => {
	it('renders a terminal node as its text', () => {
		const node: NodeData = { type: 'identifier', fields: {}, text: 'main' };
		expect(render(node, registry)).toBe('main');
	});

	it('renders a simple branch node with required field', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', fields: {}, text: 'main' },
			},
		};
		expect(render(node, registry)).toBe('fn main ( )');
	});

	it('renders optional fields when present', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', fields: {}, text: 'add' },
				return_type: { type: 'primitive_type', fields: {}, text: 'i32' },
				body: { type: 'block', fields: {} },
			},
		};
		expect(render(node, registry)).toBe('fn add ( ) i32 { }');
	});

	it('skips optional fields when absent', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', fields: {}, text: 'noop' },
				body: { type: 'block', fields: {} },
			},
		};
		expect(render(node, registry)).toBe('fn noop ( ) { }');
	});

	it('renders multiple fields with joinBy separator', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', fields: {}, text: 'add' },
				parameters: [
					{
						type: 'parameter',
						fields: {
							name: { type: 'identifier', fields: {}, text: 'a' },
							type: { type: 'primitive_type', fields: {}, text: 'i32' },
						},
					},
					{
						type: 'parameter',
						fields: {
							name: { type: 'identifier', fields: {}, text: 'b' },
							type: { type: 'primitive_type', fields: {}, text: 'i32' },
						},
					},
				],
			},
		};
		expect(render(node, registry, joinBy)).toBe('fn add ( a : i32, b : i32 )');
	});

	it('defaults to space separator without joinBy', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', fields: {}, text: 'add' },
				parameters: [
					{ type: 'parameter', fields: { name: { type: 'identifier', fields: {}, text: 'a' }, type: { type: 'primitive_type', fields: {}, text: 'i32' } } },
					{ type: 'parameter', fields: { name: { type: 'identifier', fields: {}, text: 'b' }, type: { type: 'primitive_type', fields: {}, text: 'i32' } } },
				],
			},
		};
		expect(render(node, registry)).toBe('fn add ( a : i32 b : i32 )');
	});

	it('throws on missing required field', () => {
		const node: NodeData = { type: 'function_item', fields: {} };
		expect(() => render(node, registry)).toThrow("Required field 'name' missing");
	});

	it('throws on unknown node kind', () => {
		const node: NodeData = { type: 'nonexistent', fields: {} };
		expect(() => render(node, registry)).toThrow("No render rules for 'nonexistent'");
	});

	it('renders nested nodes recursively', () => {
		const node: NodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', text: 'main' },
				return_type: { type: 'primitive_type', text: 'i32' },
				body: {
					type: 'block',
					fields: {},
					children: [
						{ type: 'integer_literal', text: '42' },
					],
				},
			},
		};
		expect(render(node, registry)).toBe('fn main ( ) i32 { 42 }');
	});

	it('renders binary expression', () => {
		const node: NodeData = {
			type: 'binary_expression',
			fields: {
				left: { type: 'identifier', fields: {}, text: 'a' },
				operator: { type: 'operator', fields: {}, text: '+' },
				right: { type: 'identifier', fields: {}, text: 'b' },
			},
		};
		expect(render(node, registry)).toBe('a + b');
	});

	it('renders block with children', () => {
		const node: NodeData = {
			type: 'block',
			fields: {},
			children: [
				{ type: 'identifier', text: 'x' },
				{ type: 'identifier', text: 'y' },
			],
		};
		expect(render(node, registry)).toBe('{ x y }');
	});

	it('renders leaf node without fields property', () => {
		const node = { type: 'identifier', text: 'main' } as NodeData;
		expect(render(node, registry)).toBe('main');
	});

	it('throws on branch node without fields', () => {
		const node = { type: 'function_item' } as NodeData;
		expect(() => render(node, registry)).toThrow("has no 'fields'");
	});
});
