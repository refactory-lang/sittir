import { describe, it, expect } from 'vitest';
import { createRenderer } from '../src/render.ts';
import type { RulesConfig } from '../src/types.ts';
import type { AnyNodeData } from '../src/types.ts';

const config: RulesConfig = {
	language: 'test',
	extensions: ['test'],
	expandoChar: null,
	metadata: { grammarSha: 'test' },
	rules: {
		function_item: {
			template: 'fn $NAME($$$PARAMETERS) $RETURN_TYPE_CLAUSE$BODY_CLAUSE',
			return_type_clause: '-> $RETURN_TYPE ',
			body_clause: '$BODY',
			joinBy: { PARAMETERS: ', ' },
		},
		block: {
			template: '{ $$$CHILDREN }',
			joinBy: ' ',
		},
		parameter: '$NAME: $TYPE',
		binary_expression: '$LEFT $OPERATOR $RIGHT',
	},
};

const { render } = createRenderer(config);

describe('render', () => {
	it('renders a terminal node as its text', () => {
		const node: AnyNodeData = { type: 'identifier', text: 'main' };
		expect(render(node)).toBe('main');
	});

	it('renders a simple branch node with required field', () => {
		const node: AnyNodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', text: 'main' },
			},
		};
		// Absent clauses resolve to empty, template is literal
		expect(render(node)).toContain('fn main()');
	});

	it('renders optional clause when field is present', () => {
		const node: AnyNodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', text: 'add' },
				return_type: { type: 'primitive_type', text: 'i32' },
				body: { type: 'block', fields: {} },
			},
		};
		expect(render(node)).toContain('fn add()');
		expect(render(node)).toContain('-> i32');
	});

	it('omits clause when field is absent', () => {
		const node: AnyNodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', text: 'noop' },
				body: { type: 'block', fields: {} },
			},
		};
		const result = render(node);
		expect(result).toContain('fn noop()');
		expect(result).not.toContain('->');
	});

	it('renders multiple fields with per-rule joinBy separator', () => {
		const node: AnyNodeData = {
			type: 'function_item',
			fields: {
				name: { type: 'identifier', text: 'add' },
				parameters: [
					{ type: 'parameter', fields: { name: { type: 'identifier', text: 'a' }, type: { type: 'primitive_type', text: 'i32' } } },
					{ type: 'parameter', fields: { name: { type: 'identifier', text: 'b' }, type: { type: 'primitive_type', text: 'i32' } } },
				],
				body: { type: 'block', fields: {} },
			},
		};
		expect(render(node)).toContain('fn add(a: i32, b: i32)');
	});

	it('throws on unknown node kind', () => {
		const node: AnyNodeData = { type: 'nonexistent', fields: {} };
		expect(() => render(node)).toThrow("No render rule for 'nonexistent'");
	});

	it('renders nested nodes recursively', () => {
		const node: AnyNodeData = {
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
		expect(render(node)).toContain('fn main()');
		expect(render(node)).toContain('-> i32');
		expect(render(node)).toContain('42');
	});

	it('renders binary expression', () => {
		const node: AnyNodeData = {
			type: 'binary_expression',
			fields: {
				left: { type: 'identifier', text: 'a' },
				operator: '+',
				right: { type: 'identifier', text: 'b' },
			},
		};
		expect(render(node)).toBe('a + b');
	});

	it('renders block with children', () => {
		const node: AnyNodeData = {
			type: 'block',
			fields: {},
			children: [
				{ type: 'identifier', text: 'x' },
				{ type: 'identifier', text: 'y' },
			],
		};
		expect(render(node)).toBe('{ x y }');
	});

	it('renders leaf node without fields property', () => {
		const node = { type: 'identifier', text: 'main' } as AnyNodeData;
		expect(render(node)).toBe('main');
	});

	it('throws on branch node without fields', () => {
		const node = { type: 'function_item' } as AnyNodeData;
		expect(() => render(node)).toThrow("has no 'fields'");
	});
});
