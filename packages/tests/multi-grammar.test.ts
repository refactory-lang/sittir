/**
 * Multi-grammar integration tests.
 * Verifies the same codegen produces working packages for Rust, TypeScript, and Python.
 */
import { describe, it, expect } from 'vitest';
import { ir as rustIr } from '../rust/src/ir.ts';
import { ir as tsIr } from '../typescript/src/ir.ts';
import { ir as pyIr } from '../python/src/ir.ts';
import { render } from '../core/src/render.ts';
import { rules as rustRules } from '../rust/src/rules.ts';
import { rules as tsRules } from '../typescript/src/rules.ts';
import { rules as pyRules } from '../python/src/rules.ts';

describe('Rust grammar', () => {
	it('renders function_item', () => {
		const fn = rustIr.function(rustIr.identifier('main'))
			.parameters(rustIr.parameters())
			.body(rustIr.block());
		expect(fn.render()).toContain('fn');
		expect(fn.render()).toContain('main');
	});

	it('renders binary_expression', () => {
		const expr = rustIr.binaryExpression({
			left: rustIr.identifier('a'),
			operator: rustIr.add(),
			right: rustIr.integerLiteral('1'),
		});
		expect(render(expr, rustRules)).toBe('a + 1');
	});
});

describe('TypeScript grammar', () => {
	it('renders function_declaration', () => {
		const fn = tsIr.functionDeclaration(tsIr.identifier('greet'))
			.parameters(tsIr.formalParameters())
			.body(tsIr.statementBlock());
		const source = fn.render();
		expect(source).toContain('function');
		expect(source).toContain('greet');
	});

	it('renders identifier', () => {
		const id = tsIr.identifier('hello');
		expect(id.type).toBe('identifier');
		expect(id.text).toBe('hello');
		expect(id.render()).toBe('hello');
	});
});

describe('Python grammar', () => {
	it('renders function_definition', () => {
		const fn = pyIr.functionDefinition({
			name: pyIr.identifier('greet'),
			parameters: pyIr.parameters(),
			body: pyIr.block(),
		});
		const source = fn.render();
		expect(source).toContain('def');
		expect(source).toContain('greet');
	});

	it('renders binary_operator', () => {
		const expr = pyIr.binaryOperator({
			left: pyIr.identifier('a'),
			operator: pyIr.add(),
			right: pyIr.integer('1'),
		});
		const source = render(expr, pyRules);
		expect(source).toContain('a');
		expect(source).toContain('+');
		expect(source).toContain('1');
	});
});

describe('Cross-grammar consistency', () => {
	it('all grammars produce identifiers with same shape', () => {
		const rustId = rustIr.identifier('x');
		const tsId = tsIr.identifier('x');
		const pyId = pyIr.identifier('x');

		expect(rustId.type).toBe('identifier');
		expect(tsId.type).toBe('identifier');
		expect(pyId.type).toBe('identifier');

		expect(rustId.text).toBe('x');
		expect(tsId.text).toBe('x');
		expect(pyId.text).toBe('x');
	});

	it('all grammars have render() on factory output', () => {
		expect(typeof rustIr.identifier('x').render).toBe('function');
		expect(typeof tsIr.identifier('x').render).toBe('function');
		expect(typeof pyIr.identifier('x').render).toBe('function');
	});
});
