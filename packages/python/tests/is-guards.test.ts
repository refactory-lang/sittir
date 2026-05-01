/**
 * is / assert / isTree / isNode guard composition on python grammar.
 * Mirrors the rust counterpart so cross-grammar emitter drift is caught.
 */

import { describe, it, expect } from 'vitest';
import { is, isNode, isTree, assert } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

describe('python is / isTree / isNode composition', () => {
	it('is.functionDefinition narrows on matching kind', () => {
		const v = { $type: 'function_definition' };
		expect(is.functionDefinition(v)).toBe(true);
		expect(is.functionDefinition({ $type: 'class_definition' })).toBe(false);
	});

	it('is.kind generic form accepts arbitrary kinds', () => {
		expect(is.kind({ $type: 'if_statement' }, 'if_statement')).toBe(true);
		expect(is.kind({ $type: 'if_statement' }, 'for_statement')).toBe(false);
	});

	it('isNode returns true for NodeData shapes', () => {
		expect(
			isNode({ $type: 'identifier', $text: 'foo' } as unknown as {
				readonly $type: string;
			})
		).toBe(true);
		expect(
			isNode({ $type: 'if_statement', $fields: {} } as unknown as {
				readonly $type: string;
			})
		).toBe(true);
		expect(
			isNode({ $type: 'function_definition' } as unknown as {
				readonly $type: string;
			})
		).toBe(false);
	});

	it('isTree returns true only when a range() method is present', () => {
		const withRange = {
			$type: 'identifier',
			range: () => ({ start: { index: 0 }, end: { index: 1 } })
		};
		const withoutRange = { $type: 'identifier', $fields: {} };
		expect(isTree(withRange)).toBe(true);
		expect(isTree(withoutRange)).toBe(false);
	});

	it('assert.kind throws with kind name in message on mismatch', () => {
		expect(() => assert.classDefinition({ $type: 'if_statement' })).toThrow(
			TypeError
		);
	});
});

/**
 * Phase A coexistence — guards must accept BOTH numeric `$type` (factory /
 * wrap output) AND string `$type` (readNode output) until Phase D removes
 * the string arm.
 */
describe('python Phase A coexistence: numeric and string $type', () => {
	it('per-kind guard accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.functionDefinition(node)).toBe(true);
	});

	it('per-kind guard accepts string $type from readNode output', () => {
		const node = {
			$type: 'function_definition',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.functionDefinition(node)).toBe(true);
	});

	it('per-kind guard rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.ClassDefinition,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.functionDefinition(node)).toBe(false);
	});

	it('is.kind() accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node, 'function_definition')).toBe(true);
	});

	it('is.kind() accepts string $type from readNode output', () => {
		const node = {
			$type: 'function_definition',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node, 'function_definition')).toBe(true);
	});

	it('is.kind() rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.ClassDefinition,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node, 'function_definition')).toBe(false);
	});

	it('supertype guard accepts numeric $type member from factory', () => {
		// `compoundStatement` is a supertype; `function_definition` is a member.
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.compoundStatement(node)).toBe(true);
	});

	it('supertype guard accepts string $type member from readNode', () => {
		const node = {
			$type: 'function_definition',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.compoundStatement(node)).toBe(true);
	});

	it('assert.functionDefinition passes on numeric $type from factory', () => {
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(() => assert.functionDefinition(node)).not.toThrow();
	});
});
