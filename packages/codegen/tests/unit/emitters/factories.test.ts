import { describe, it, expect } from 'vitest';
import { emitFactory, emitTerminalFactory } from '../../../src/emitters/factories.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';
import type { StructuralNode } from '../../../src/emitters/utils.ts';

const { model } = buildGrammarModel('rust');

function getNode(kind: string): StructuralNode {
	const node = model.nodes[kind];
	if (!node || (node.modelType !== 'branch' && node.modelType !== 'leafWithChildren')) {
		throw new Error(`Node "${kind}" is not a structural node`);
	}
	return node as StructuralNode;
}

describe('emitFactory', () => {
	it('generates factory for function_item with constructor field', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'] });

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
		const source = emitFactory({ node, leafKinds: [] });

		expect(source).toContain('export function block(');
		expect(source).toContain("type: 'block'");
	});

	it('generates factory for binary_expression with required fields', () => {
		const node = getNode('binary_expression');
		const source = emitFactory({ node, leafKinds: [] });

		expect(source).toContain('export function binaryExpression(');
		expect(source).toContain("type: 'binary_expression'");
	});

	it('generates narrow NodeData for leaf-only fields in regular API', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: ['identifier', 'metavariable'] });

		// name field accepts named interfaces — narrowed types in regular API (FR-016)
		expect(source).toContain('Identifier | Metavariable');
	});

	it('generates children fluent setter for nodes with children', () => {
		const node = getNode('function_item');
		const source = emitFactory({ node, leafKinds: [] });

		expect(source).toContain('children: (');
		expect(source).toContain("=> functionItem({ ...config, children:");
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
