import { describe, it, expect } from 'vitest';
import { emitAssign } from '../../../src/emitters/assign.ts';
import { listKeywordKinds, listLeafKinds } from '../../../src/grammar-reader.ts';
import { buildGrammarModel } from '../../../src/grammar-model.ts';
import type { StructuralNode } from '../../../src/emitters/utils.ts';

const grammar = 'rust';
const leafKinds = listLeafKinds(grammar);
const keywordKinds = listKeywordKinds(grammar);
const { model } = buildGrammarModel(grammar);
const nodes = ['function_item', 'struct_item', 'binary_expression'].map(k => model.nodes[k] as StructuralNode);

describe('emitAssign', () => {
	const source = emitAssign({ grammar, nodes, leafKinds, keywordKinds });

	it('emits assignByKind dispatch table', () => {
		expect(source).toContain('const _assignTable');
		expect(source).toContain("'function_item':");
		expect(source).toContain("'struct_item':");
	});

	it('emits assignByKind function', () => {
		expect(source).toContain('export function assignByKind(kind: string, target: any)');
		expect(source).toContain('const fn = _assignTable[kind]');
	});

	it('emits per-kind assign functions with named Tree interfaces', () => {
		expect(source).toContain('export function assignFunctionItem(target: FunctionItemTree)');
		expect(source).toContain('export function assignStructItem(target: StructItemTree)');
	});

	it('emits edit() with Simplify return type', () => {
		expect(source).toContain('export function edit<K extends NodeKind<RustGrammar>>(target: TreeNode<K>)');
		expect(source).toContain('Simplify<NodeData<K>');
	});

	it('imports from @sittir/types', () => {
		expect(source).toContain("import type { NodeKind, Edit, Simplify } from '@sittir/types'");
	});

	it('imports named Tree interfaces from types.js', () => {
		expect(source).toContain('FunctionItemTree');
		expect(source).toContain('StructItemTree');
	});

	it('assignByKind error includes grammar name', () => {
		expect(source).toContain('in RustGrammar grammar');
	});
});
