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

		expect(source).toContain('export function function_item_(');
		expect(source).toContain('config: FunctionItemConfig,');
		expect(source).toContain("type: 'function_item' as const,");
		expect(source).toContain('fields,');
		expect(source).toContain('body(v?:');
		expect(source).toContain('returnType(v?:');
		expect(source).toContain('render() { return render(this); },');
		expect(source).toContain('toEdit(startOrRange:');
	});

	it('generates factory for block (no constructor field)', () => {
		const node = getNode('block');
		const source = emitFactory({ node, leafKinds: [], ctx });

		expect(source).toContain('export function block_(');
		expect(source).toContain("type: 'block'");
	});

	it('generates factory for binary_expression with required fields', () => {
		const node = getNode('binary_expression');
		const source = emitFactory({ node, leafKinds: [], ctx });

		expect(source).toContain('export function binary_expression_(');
		expect(source).toContain("type: 'binary_expression'");
	});

	it('generates narrow NodeData for leaf-only fields in regular API', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'], ctx });

		// name field accepts named interfaces — narrowed types in regular API (FR-016)
		expect(source).toContain('Identifier | Metavariable');
	});

	it('generates named positional children setters for nodes with tuple children', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: [], ctx });

		// function_item has 3 positional child slots — getter/setter methods
		expect(source).toContain('visibilityModifier(v?: VisibilityModifier)');
		expect(source).toContain('functionModifiers(v?: FunctionModifiers)');
		expect(source).toContain('whereClause(v?: WhereClause)');
	});

	it('stores children in top-level children array for single-slot nodes', () => {
		const node = getNode('expression_statement');
		const source = emitFactory({ node, leafKinds: [], ctx });

		// Single children slot — no getter method, children array is the API
		expect(source).toContain('children,');
		expect(source).not.toMatch(/children\([^)]*\).*return/);
	});
});

describe('emitTerminalFactory', () => {
	it('generates keyword factory with fixed text', () => {
		const source = emitTerminalFactory('self', 'self');

		expect(source).toContain('export function self_(');
		expect(source).toContain("type: 'self'");
		expect(source).toContain("text: 'self'");
		expect(source).not.toContain('text: string');
	});

	it('generates text factory for identifiers', () => {
		const source = emitTerminalFactory('identifier');

		expect(source).toContain('export function identifier_(text: string)');
		expect(source).toContain("type: 'identifier'");
	});
});
