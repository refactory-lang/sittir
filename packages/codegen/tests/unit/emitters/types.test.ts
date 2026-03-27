import { describe, it, expect } from 'vitest';
import { emitTypes } from '../../../src/emitters/types.ts';

describe('emitTypes', () => {
	it('should emit const enum SyntaxKind', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain('export const enum SyntaxKind {');
		expect(source).toContain("StructItem = 'struct_item'");
		expect(source).toContain("FunctionItem = 'function_item'");
	});

	it('should emit interface extends NodeData for branch kinds', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain("export interface StructItem extends NodeData<'struct_item'> {}");
		expect(source).toContain("export interface FunctionItem extends NodeData<'function_item'> {}");
	});

	it('should emit Config and Tree interfaces', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['function_item'] });
		expect(source).toContain("export interface FunctionItemConfig extends NodeConfig<'function_item'> {}");
		expect(source).toContain("export interface FunctionItemTree extends TreeNode<'function_item'> {}");
	});

	it('should emit discriminated union', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
		expect(source).toContain('export type RustNode =');
		expect(source).toContain('| StructItem');
		expect(source).toContain('| FunctionItem');
	});

	it('should emit leaf types as interface extends NodeData', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item'], leafKinds: ['identifier'] });
		expect(source).toContain("Identifier = 'identifier'");
		expect(source).toContain("export interface Identifier extends NodeData<'identifier'> {}");
		expect(source).toContain("export interface IdentifierTree extends TreeNode<'identifier'> {}");
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

	it('should emit supertype unions for node, config, and tree', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodeKinds: ['binary_expression', 'call_expression'],
			supertypes: [{ name: '_expression', subtypes: ['binary_expression', 'call_expression'] }],
		});
		expect(source).toContain('export type Expression =');
		expect(source).toContain('| BinaryExpression');
		expect(source).toContain('export type ExpressionConfig =');
		expect(source).toContain('| BinaryExpressionConfig');
		expect(source).toContain('export type ExpressionTree =');
		expect(source).toContain('| BinaryExpressionTree');
	});

	it('should emit grammar alias and imports', () => {
		const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item'] });
		expect(source).toContain("import type { RustGrammar } from './grammar.js'");
		expect(source).toContain("export type { RustGrammar }");
	});

	it('should work for go grammar', () => {
		const source = emitTypes({ grammar: 'go', nodeKinds: ['function_declaration'] });
		expect(source).toContain("import type { GoGrammar } from './grammar.js'");
		expect(source).toContain('export type GoNode =');
	});
});
