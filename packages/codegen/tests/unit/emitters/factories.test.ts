import { describe, it, expect } from 'vitest';
import { emitFactory, emitTerminalFactory } from '../../../src/emitters/factories.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';
import { buildProjectionContext } from '../../../src/emitters/kind-projections.ts';
import type { StructuralNode } from '../../../src/emitters/utils.ts';

const { newModel } = buildGrammarModel('rust');
const ctx = buildProjectionContext(newModel.models);

function getNode(kind: string): StructuralNode {
	const node = newModel.models.get(kind);
	if (!node || (node.modelType !== 'branch' && node.modelType !== 'container')) {
		throw new Error(`Node "${kind}" is not a structural node`);
	}
	return node;
}

describe('emitFactory', () => {
	it('generates factory for function_item with constructor field', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'], ctx });

		expect(source).toContain('export function functionItem(');
		expect(source).toContain('config: FunctionItemConfig,');
		expect(source).toContain("type: 'function_item' as const,");
		expect(source).toContain("body: (v: Block) => functionItem({");
		expect(source).toContain('returnType: (v:');
		expect(source).toContain('render() { return render(this); },');
		expect(source).toContain('toEdit(startOrRange:');
	});

	it('generates factory for block (no constructor field)', () => {
		const node = getNode('block');
		const source = emitFactory({ node, leafKinds: [], ctx });

		expect(source).toContain('export function block(');
		expect(source).toContain("type: 'block'");
	});

	it('generates factory for binary_expression with required fields', () => {
		const node = getNode('binary_expression');
		const source = emitFactory({ node, leafKinds: [], ctx });

		expect(source).toContain('export function binaryExpression(');
		expect(source).toContain("type: 'binary_expression'");
	});

	it('generates narrow NodeData for leaf-only fields in regular API', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'], ctx });

		// name field accepts named interfaces — narrowed types in regular API (FR-016)
		expect(source).toContain('Identifier | Metavariable');
	});

	it('generates positional children setters for nodes with tuple children', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: [], ctx });

		// function_item has 3 positional child slots (visibility_modifier, function_modifiers, where_clause)
		expect(source).toContain('children0: (v: VisibilityModifier)');
		expect(source).toContain('children1: (v: FunctionModifiers)');
		expect(source).toContain('children2: (v: WhereClause)');
	});

	it('generates single children setter for nodes with one child slot', () => {
		const node = getNode('expression_statement');
		const source = emitFactory({ node, leafKinds: [], ctx });

		expect(source).toContain('children: (');
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
