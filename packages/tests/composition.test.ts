/**
 * Integration tests for the unified factory API.
 * Tests all three modes: declarative, fluent, mixed.
 * Verifies render produces valid output.
 */
import { describe, it, expect } from 'vitest';
import { ir } from '../rust/src/ir.ts';
import { render } from '../core/src/render.ts';
import { rules } from '../rust/src/rules.ts';
import { joinBy } from '../rust/src/joinby.ts';

describe('Declarative composition', () => {
	it('builds a function with declarative config', () => {
		const fn = ir.function({
			name: ir.identifier('main'),
			body: ir.block(),
		});
		expect(fn.type).toBe('function_item');
		expect(fn.fields.name.type).toBe('identifier');
	});

	it('renders a function from declarative config', () => {
		const fn = ir.function({
			name: ir.identifier('main'),
			parameters: ir.parameters(),
			body: ir.block(),
		});
		const source = render(fn, rules, joinBy);
		expect(source).toContain('fn');
		expect(source).toContain('main');
	});
});

describe('Fluent composition', () => {
	it('builds a function with fluent chaining', () => {
		const fn = ir.function(ir.identifier('add'))
			.body(ir.block());
		expect(fn.type).toBe('function_item');
		expect(fn.fields.name.type).toBe('identifier');
		expect(fn.fields.body.type).toBe('block');
	});

	it('renders a function from fluent chaining', () => {
		const fn = ir.function(ir.identifier('add'))
			.parameters(ir.parameters())
			.body(ir.block());
		const source = render(fn, rules, joinBy);
		expect(source).toContain('fn');
		expect(source).toContain('add');
	});
});

describe('Mixed composition', () => {
	it('builds a function with mixed args', () => {
		const fn = ir.function(ir.identifier('compute'), {
			body: ir.block(),
		});
		expect(fn.type).toBe('function_item');
		expect(fn.fields.name.type).toBe('identifier');
		expect(fn.fields.body.type).toBe('block');
	});
});

describe('Keyword factories', () => {
	it('ir.self() produces correct NodeData', () => {
		const node = ir.self();
		expect(node.type).toBe('self');
		expect(node.text).toBe('self');
	});

	it('ir.crate() produces correct NodeData', () => {
		const node = ir.crate();
		expect(node.type).toBe('crate');
		expect(node.text).toBe('crate');
	});

	it('ir.mutableSpecifier() produces mut', () => {
		const node = ir.mutableSpecifier();
		expect(node.type).toBe('mutable_specifier');
		expect(node.text).toBe('mut');
	});
});

describe('Leaf factories', () => {
	it('ir.identifier() produces NodeData with text', () => {
		const node = ir.identifier('main');
		expect(node.type).toBe('identifier');
		expect(node.text).toBe('main');
	});

	it('ir.integerLiteral() produces NodeData with text', () => {
		const node = ir.integerLiteral('42');
		expect(node.type).toBe('integer_literal');
		expect(node.text).toBe('42');
	});
});

describe('Operator aliases', () => {
	it('ir.add() produces + operator', () => {
		const node = ir.add();
		expect(node.text).toBe('+');
	});

	it('ir.eq() produces == operator', () => {
		const node = ir.eq();
		expect(node.text).toBe('==');
	});
});

describe('Binary expression render', () => {
	it('renders a + b', () => {
		const expr = ir.binaryExpression({
			left: ir.identifier('a'),
			operator: ir.add(),
			right: ir.identifier('b'),
		});
		const source = render(expr, rules, joinBy);
		expect(source).toBe('a + b');
	});
});

describe('Template literal types (FR-020)', () => {
	it('ir.booleanLiteral accepts only true/false', () => {
		const t = ir.booleanLiteral('true');
		const f = ir.booleanLiteral('false');
		expect(t.text).toBe('true');
		expect(f.text).toBe('false');
	});

	it('ir.escapeSequence accepts backslash-prefixed strings', () => {
		const n = ir.escapeSequence('\\n');
		expect(n.type).toBe('escape_sequence');
		expect(n.text).toBe('\\n');
	});
});

describe('Input validation (FR-023)', () => {
	it('ir.identifier rejects reserved keywords', () => {
		expect(() => ir.identifier('fn')).toThrow('reserved keyword');
		expect(() => ir.identifier('let')).toThrow('reserved keyword');
		expect(() => ir.identifier('struct')).toThrow('reserved keyword');
	});

	it('ir.identifier accepts valid identifiers', () => {
		expect(ir.identifier('main').text).toBe('main');
		expect(ir.identifier('my_var').text).toBe('my_var');
	});
});

describe('String shorthand sugar (FR-021, FR-022)', () => {
	it('ir.stringLiteral accepts string directly (single-field compression)', () => {
		const node = ir.stringLiteral('hello');
		expect(node.type).toBe('string_literal');
		expect(node.fields.children).toHaveLength(1);
		expect((node.fields.children as any)[0].type).toBe('string_content');
		expect((node.fields.children as any)[0].text).toBe('hello');
	});

	it('ir.stringLiteral accepts NodeData array', () => {
		const node = ir.stringLiteral([
			ir.stringContent('hello'),
			ir.escapeSequence('\\n'),
		]);
		expect(node.type).toBe('string_literal');
		expect(node.fields.children).toHaveLength(2);
	});
});

describe('Node.render() method', () => {
	it('renders via attached method', () => {
		const fn = ir.function(ir.identifier('main'))
			.parameters(ir.parameters())
			.body(ir.block());
		const source = fn.render();
		expect(source).toContain('fn');
		expect(source).toContain('main');
	});
});

describe('Render representative Rust nodes (T026)', () => {
	it('renders function_item', () => {
		const fn = ir.function(ir.identifier('add'))
			.parameters(ir.parameters())
			.returnType(ir.primitiveType('i32'))
			.body(ir.block());
		const source = fn.render();
		expect(source).toContain('fn');
		expect(source).toContain('add');
		expect(source).toContain('i32');
	});

	it('renders struct_item', () => {
		const s = ir.struct(ir.identifier('Point'));
		const source = s.render();
		expect(source).toContain('struct');
		expect(source).toContain('Point');
	});

	it('renders if_expression', () => {
		const node = ir.ifExpression({
			condition: ir.identifier('x'),
			consequence: ir.block(),
		});
		const source = render(node, rules, joinBy);
		expect(source).toContain('if');
		expect(source).toContain('x');
	});

	it('renders use_declaration', () => {
		const node = ir.useDeclaration(ir.scopedIdentifier({
			path: ir.identifier('std'),
			name: ir.identifier('io'),
		}));
		const source = node.render();
		expect(source).toContain('use');
	});

	it('renders binary_expression', () => {
		const expr = ir.binaryExpression({
			left: ir.identifier('a'),
			operator: ir.add(),
			right: ir.integerLiteral('1'),
		});
		const source = render(expr, rules, joinBy);
		expect(source).toBe('a + 1');
	});

	it('renders let_declaration', () => {
		const node = ir.letDeclaration({
			pattern: ir.identifier('x'),
			value: ir.integerLiteral('42'),
		});
		const source = render(node, rules, joinBy);
		expect(source).toContain('let');
		expect(source).toContain('x');
		expect(source).toContain('42');
	});
});
