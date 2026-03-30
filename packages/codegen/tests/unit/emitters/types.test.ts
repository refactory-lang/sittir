import { describe, it, expect } from 'vitest';
import { emitTypes } from '../../../src/emitters/types.ts';
import type { HydratedNodeModel } from '../../../src/node-model.ts';

function branchNode(kind: string): HydratedNodeModel {
	return { modelType: 'branch', kind, fields: [], members: [], children: [] } as unknown as HydratedNodeModel;
}
function leafNode(kind: string): HydratedNodeModel {
	return { modelType: 'leaf', kind, pattern: null, rule: null } as unknown as HydratedNodeModel;
}
function keywordNode(kind: string, text: string): HydratedNodeModel {
	return { modelType: 'keyword', kind, text, rule: null } as unknown as HydratedNodeModel;
}
function supertypeNode(name: string, subtypes: string[]): HydratedNodeModel {
	return { modelType: 'supertype', kind: name, subtypes, rule: null } as unknown as HydratedNodeModel;
}

describe('emitTypes', () => {
	it('should emit const enum SyntaxKind', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [branchNode('struct_item'), branchNode('function_item')] });
		expect(source).toContain('export const enum SyntaxKind {');
		expect(source).toContain("StructItem = 'struct_item'");
		expect(source).toContain("FunctionItem = 'function_item'");
	});

	it('should emit concrete interface for branch kinds', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [branchNode('struct_item'), branchNode('function_item')] });
		expect(source).toContain("export interface StructItem {");
		expect(source).toContain("readonly type: 'struct_item'");
		expect(source).toContain("export interface FunctionItem {");
		expect(source).toContain("readonly type: 'function_item'");
	});

	it('should emit Config as ConfigOf and Tree/FromInput as grammar projections', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [branchNode('function_item')] });
		expect(source).toContain("export type FunctionItemConfig = ConfigOf<FunctionItem>;");
		expect(source).toContain("export interface FunctionItemTree extends TreeNode<'function_item'> {}");
		expect(source).toContain("export interface FunctionItemFromInput extends NodeFromInput<'function_item'> {}");
	});

	it('should emit discriminated union', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [branchNode('struct_item'), branchNode('function_item')] });
		expect(source).toContain('export type RustNode =');
		expect(source).toContain('| StructItem');
		expect(source).toContain('| FunctionItem');
	});

	it('should emit concrete interface for leaf types', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [branchNode('struct_item'), leafNode('identifier')] });
		expect(source).toContain("Identifier = 'identifier'");
		expect(source).toContain("export interface Identifier {");
		expect(source).toContain("readonly type: 'identifier'");
		expect(source).toContain("readonly text: string");
		expect(source).toContain("export interface IdentifierTree extends TreeNode<'identifier'> {}");
	});

	it('should emit keyword types with literal text', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [keywordNode('mutable_specifier', 'mut')] });
		expect(source).toContain("export interface MutableSpecifier {");
		expect(source).toContain("readonly text: 'mut'");
	});

	it('should emit scoped supertype enums', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodes: [
				branchNode('binary_expression'),
				branchNode('call_expression'),
				supertypeNode('_expression', ['binary_expression', 'call_expression']),
			],
		});
		expect(source).toContain('export const enum ExpressionKind {');
		expect(source).toContain("BinaryExpression = 'binary_expression'");
		expect(source).toContain("CallExpression = 'call_expression'");
	});

	it('should emit supertype unions for node, config, and tree', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodes: [
				branchNode('binary_expression'),
				branchNode('call_expression'),
				supertypeNode('_expression', ['binary_expression', 'call_expression']),
			],
		});
		expect(source).toContain('export type Expression =');
		expect(source).toContain('| BinaryExpression');
		expect(source).toContain('export type ExpressionConfig =');
		expect(source).toContain('| BinaryExpressionConfig');
		expect(source).toContain('export type ExpressionTree =');
		expect(source).toContain('| BinaryExpressionTree');
	});

	it('should emit grammar alias and imports', () => {
		const source = emitTypes({ grammar: 'rust', nodes: [branchNode('struct_item')] });
		expect(source).toContain("import type { RustGrammar } from './grammar.js'");
		expect(source).toContain("export type { RustGrammar }");
	});

	it('should work for go grammar', () => {
		const source = emitTypes({ grammar: 'go', nodes: [branchNode('function_declaration')] });
		expect(source).toContain("import type { GoGrammar } from './grammar.js'");
		expect(source).toContain('export type GoNode =');
	});

	it('should emit TreeNode types for branch and leaf kinds', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodes: [
				branchNode('function_item'),
				leafNode('identifier'),
				keywordNode('mutable_specifier', 'mut'),
			],
		});
		// Branch TreeNode
		expect(source).toContain("export interface FunctionItemTree extends TreeNode<'function_item'> {}");
		// Leaf TreeNode
		expect(source).toContain("export interface IdentifierTree extends TreeNode<'identifier'> {}");
		// Keyword TreeNode
		expect(source).toContain("export interface MutableSpecifierTree extends TreeNode<'mutable_specifier'> {}");
	});

	it('should use camelCase field names in concrete interfaces', () => {
		const nodes: HydratedNodeModel[] = [
			{
				modelType: 'branch',
				kind: 'function_item',
				fields: [
					{ name: 'return_type', required: false, multiple: false, kinds: [], propertyName: 'returnType' },
					{ name: 'type_parameters', required: false, multiple: false, kinds: [], propertyName: 'typeParameters' },
				],
				members: [],
				children: [],
			} as unknown as HydratedNodeModel,
		];
		const source = emitTypes({ grammar: 'rust', nodes });
		expect(source).toContain('returnType?:');
		expect(source).toContain('typeParameters?:');
		expect(source).not.toContain('return_type');
		expect(source).not.toContain('type_parameters');
	});

	it('should emit supertype TreeNode unions', () => {
		const source = emitTypes({
			grammar: 'rust',
			nodes: [
				branchNode('binary_expression'),
				branchNode('call_expression'),
				supertypeNode('_expression', ['binary_expression', 'call_expression']),
			],
		});
		expect(source).toContain('export type ExpressionTree =');
		expect(source).toContain('| BinaryExpressionTree');
		expect(source).toContain('| CallExpressionTree');
	});
});
