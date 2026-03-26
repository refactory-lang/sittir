import { describe, it, expect } from 'vitest';
import { emitFactory, emitTerminalFactory } from '../../../src/emitters/factories.ts';
import { readGrammarKind } from '../../../src/grammar-reader.ts';

describe('emitFactory', () => {
	it('generates factory for function_item with constructor field', () => {
		const node = readGrammarKind('rust', 'function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'] });

		expect(source).toContain('export interface FunctionItem');
		expect(source).toContain('export function functionItem(');
		expect(source).toContain('nameOrConfig');
		expect(source).toContain("type: 'function_item'");
		expect(source).toContain('node.body =');
		expect(source).toContain('node.returnType =');
		expect(source).toContain('node.render =');
		expect(source).toContain('node.toEdit =');
	});

	it('generates factory for block (no constructor field)', () => {
		const node = readGrammarKind('rust', 'block');
		const source = emitFactory({ node, leafKinds: [] });

		expect(source).toContain('export function block(');
		expect(source).toContain("type: 'block'");
	});

	it('generates factory for binary_expression with required fields', () => {
		const node = readGrammarKind('rust', 'binary_expression');
		const source = emitFactory({ node, leafKinds: [] });

		expect(source).toContain('export function binaryExpression(');
		expect(source).toContain("type: 'binary_expression'");
	});

	it('generates narrow NodeData for leaf-only fields in regular API', () => {
		const node = readGrammarKind('rust', 'function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'] });

		// name field accepts named interfaces — narrowed types in regular API (FR-016)
		expect(source).toContain('Identifier | Metavariable');
	});

	it('generates children setter for nodes with children', () => {
		const node = readGrammarKind('rust', 'function_item');
		const source = emitFactory({ node, leafKinds: [] });

		expect(source).toContain('node.children =');
	});
});

describe('emitTerminalFactory', () => {
	it('generates keyword factory with fixed text', () => {
		const source = emitTerminalFactory('self', 'self');

		expect(source).toContain('export function self(');
		expect(source).toContain("type: 'self'");
		expect(source).toContain("text: 'self'");
		expect(source).not.toContain('text: string');
	});

	it('generates text factory for identifiers', () => {
		const source = emitTerminalFactory('identifier');

		expect(source).toContain('export function identifier(text: string)');
		expect(source).toContain("type: 'identifier'");
	});
});
