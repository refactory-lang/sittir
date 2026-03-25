import { describe, it, expect } from 'vitest';
import { emitTypes } from '../../../src/emitters/types.ts';

describe('emitTypes', () => {
	it('should emit const enum SyntaxKind', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain('export const enum SyntaxKind {');
		expect(source).toContain("StructItem = 'struct_item'");
		expect(source).toContain("FunctionItem = 'function_item'");
	});

	it('should emit construction types as NodeType projections', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain("export type StructItem = NodeType<RustGrammar, 'struct_item'>");
		expect(source).toContain("export type FunctionItem = NodeType<RustGrammar, 'function_item'>");
	});

	it('should emit navigation types with Node suffix', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['function_item'] });
		expect(source).toContain('export interface FunctionItemNode {');
		expect(source).toContain('readonly type: SyntaxKind.FunctionItem');
		expect(source).toContain('readonly text: string');
	});

	it('should emit discriminated union', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain('export type RustIrNode =');
		expect(source).toContain('| StructItem');
		expect(source).toContain('| FunctionItem');
	});

	it('should emit leaf types in SyntaxKind enum', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item'], leafKinds: ['identifier'] });
		expect(source).toContain("Identifier = 'identifier'");
		expect(source).toContain("export type Identifier = { kind: 'identifier' }");
		expect(source).toContain('export interface IdentifierNode {');
	});

	it('should emit scoped supertype enums', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodeKinds: ['binary_expression', 'call_expression'],
			supertypes: [{ name: '_expression', subtypes: ['binary_expression', 'call_expression'] }],
		});
		expect(source).toContain('export const enum ExpressionKind {');
		expect(source).toContain("BinaryExpression = 'binary_expression'");
		expect(source).toContain("CallExpression = 'call_expression'");
	});

	it('should emit supertype unions for both construction and navigation', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodeKinds: ['binary_expression', 'call_expression'],
			supertypes: [{ name: '_expression', subtypes: ['binary_expression', 'call_expression'] }],
		});
		expect(source).toContain('export type Expression =');
		expect(source).toContain('| BinaryExpression');
		expect(source).toContain('export type ExpressionNode =');
		expect(source).toContain('| BinaryExpressionNode');
	});

	it('should emit grammar alias and imports', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item'] });
		expect(source).toContain("import type { RustGrammar } from './grammar.js'");
		expect(source).toContain("export type { RustGrammar }");
	});

	it('should work for go grammar', () => {
		const source = emitTypes({ grammar: 'go', nodeKinds: ['function_declaration'] });
		expect(source).toContain("import type { GoGrammar } from './grammar.js'");
		expect(source).toContain('export type GoIrNode =');
	});
});
