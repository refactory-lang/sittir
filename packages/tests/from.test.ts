/**
 * Integration tests for the .from() API.
 * Tests recursive resolution of plain objects + scalars into NodeData.
 */
import { describe, it, expect } from 'vitest';
import { ir } from '../rust/src/ir.ts';
import { render } from '../core/src/render.ts';
import { rules } from '../rust/src/rules.ts';
import { joinBy } from '../rust/src/joinby.ts';

describe('.from() — basic resolution', () => {
	it('resolves string to identifier for name field', () => {
		const fn = ir.function.from({
			name: 'main',
			parameters: ir.parameters(),
			body: ir.block(),
		});
		expect(fn.type).toBe('function_item');
		expect(fn.fields.name.type).toBe('identifier');
		expect(fn.fields.name.text).toBe('main');
	});

	it('resolves string to primitive_type for return_type field', () => {
		const fn = ir.function.from({
			name: 'add',
			parameters: ir.parameters(),
			return_type: 'i32',
			body: ir.block(),
		});
		expect(fn.fields.return_type.type).toBe('primitive_type');
		expect(fn.fields.return_type.text).toBe('i32');
	});

	it('resolves string to type_identifier for non-primitive types', () => {
		const fn = ir.function.from({
			name: 'get',
			parameters: ir.parameters(),
			return_type: 'MyType',
			body: ir.block(),
		});
		// MyType is not a primitive_type enum value, so it should resolve to type_identifier
		expect(fn.fields.return_type.type).toBe('type_identifier');
	});

	it('passes through NodeData unchanged', () => {
		const params = ir.parameters();
		const fn = ir.function.from({
			name: ir.identifier('main'),
			parameters: params,
			body: ir.block(),
		});
		expect(fn.fields.parameters).toBe(params);
	});
});

describe('.from() — array resolution', () => {
	it('wraps array in single accepted branch type (parameters)', () => {
		const fn = ir.function.from({
			name: 'process',
			parameters: [
				ir.parameter({
					pattern: ir.identifier('x'),
					type: ir.primitiveType('i32'),
				}),
			],
			body: ir.block(),
		});
		expect(fn.fields.parameters.type).toBe('parameters');
	});

	it('wraps empty array as empty block for body field', () => {
		const fn = ir.function.from({
			name: 'main',
			parameters: [],
			body: [],
		});
		expect(fn.fields.parameters.type).toBe('parameters');
		expect(fn.fields.body.type).toBe('block');
	});
});

describe('.from() — nested object resolution', () => {
	it('resolves nested object with kind', () => {
		const fn = ir.function.from({
			name: 'process',
			parameters: [],
			return_type: { kind: 'reference_type', type: 'str' },
			body: [],
		});
		expect(fn.fields.return_type.type).toBe('reference_type');
	});

	it('resolves deeply nested objects', () => {
		const fn = ir.function.from({
			name: 'process',
			parameters: [],
			return_type: {
				kind: 'generic_type',
				type: 'Result',
				type_arguments: [ir.primitiveType('i32'), ir.typeIdentifier('Error')],
			},
			body: [],
		});
		expect(fn.fields.return_type.type).toBe('generic_type');
		// type field should be resolved to type_identifier 'Result'
		expect(fn.fields.return_type.fields.type.type).toBe('type_identifier');
	});
});

describe('.from() — operator resolution', () => {
	it('resolves operator string in binary_expression', () => {
		const expr = ir.binaryExpression.from({
			left: 'a',
			operator: '+',
			right: 'b',
		});
		expect(expr.type).toBe('binary_expression');
		expect(expr.fields.left.type).toBe('identifier');
		expect(expr.fields.operator.text).toBe('+');
		expect(expr.fields.right.type).toBe('identifier');
	});
});

describe('.from() — number and boolean resolution', () => {
	it('resolves number to integer_literal', () => {
		const decl = ir.letDeclaration.from({
			pattern: 'count',
			value: 42,
		});
		expect(decl.fields.value.type).toBe('integer_literal');
		expect(decl.fields.value.text).toBe('42');
	});

	it('resolves boolean to boolean_literal', () => {
		const decl = ir.letDeclaration.from({
			pattern: 'flag',
			value: true,
		});
		expect(decl.fields.value.type).toBe('boolean_literal');
		expect(decl.fields.value.text).toBe('true');
	});
});

describe('.from() — children resolution', () => {
	it('resolves children in expression_statement', () => {
		const stmt = ir.expressionStatement.from({
			children: [
				{ kind: 'binary_expression', left: 'total', operator: '+', right: 'count' },
			],
		});
		expect(stmt.type).toBe('expression_statement');
	});
});

describe('.from() — render integration', () => {
	it('renders simple function from .from()', () => {
		const fn = ir.function.from({
			name: 'main',
			parameters: [],
			body: [],
		});
		const source = fn.render();
		expect(source).toContain('fn');
		expect(source).toContain('main');
	});

	it('renders function with return type', () => {
		const fn = ir.function.from({
			name: 'main',
			parameters: [],
			return_type: 'i32',
			body: [],
		});
		const source = fn.render();
		expect(source).toContain('fn');
		expect(source).toContain('main');
		expect(source).toContain('i32');
	});

	it('renders binary expression from .from()', () => {
		const expr = ir.binaryExpression.from({
			left: 'a',
			operator: '+',
			right: 'b',
		});
		const source = render(expr, rules, joinBy);
		expect(source).toBe('a + b');
	});

	it('renders let declaration from .from()', () => {
		const decl = ir.letDeclaration.from({
			pattern: 'total',
			type: 'i32',
			value: 0,
		});
		const source = decl.render();
		expect(source).toContain('let');
		expect(source).toContain('total');
		expect(source).toContain('i32');
		expect(source).toContain('0');
	});

	it('renders function with parameters from .from()', () => {
		const fn = ir.function.from({
			name: 'add',
			parameters: [
				{ pattern: 'a', type: 'i32' },
				{ pattern: 'b', type: 'i32' },
			],
			return_type: 'i32',
			body: [{ kind: 'binary_expression', left: 'a', operator: '+', right: 'b' }],
		});
		const source = fn.render();
		expect(source).toContain('fn');
		expect(source).toContain('add');
		expect(source).toContain('a');
		expect(source).toContain('i32');
	});

	it('renders struct from .from() with explicit body kind', () => {
		const s = ir.struct.from({
			name: 'Point',
			body: {
				kind: 'field_declaration_list',
				children: [
					{ kind: 'field_declaration', name: 'x', type: 'f64' },
					{ kind: 'field_declaration', name: 'y', type: 'f64' },
				],
			},
		});
		const source = s.render();
		expect(source).toContain('struct');
		expect(source).toContain('Point');
		expect(source).toContain('x');
		expect(source).toContain('y');
		expect(source).toContain('f64');
	});
});
