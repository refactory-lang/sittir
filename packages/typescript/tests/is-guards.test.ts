/**
 * is / assert / isTree / isNode guard composition on typescript grammar.
 * Mirrors the rust counterpart.
 */

import { describe, it, expect } from 'vitest';
import { is, isNode, isTree, assert } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

describe('typescript is / isTree / isNode composition', () => {
	it('is.classDeclaration narrows on matching kind', () => {
		const v = { $type: 'class_declaration' };
		expect(is.classDeclaration(v)).toBe(true);
		expect(is.classDeclaration({ $type: 'function_declaration' })).toBe(false);
	});

	it('is.kind generic form accepts arbitrary kinds', () => {
		expect(
			is.kind({ $type: 'function_declaration' }, 'function_declaration')
		).toBe(true);
		expect(
			is.kind({ $type: 'function_declaration' }, 'class_declaration')
		).toBe(false);
	});

	it('isNode returns true for NodeData shapes', () => {
		expect(
			isNode({ $type: 'identifier', $text: 'foo' } as unknown as {
				readonly $type: string;
			})
		).toBe(true);
		expect(
			isNode({ $type: 'class_declaration', $fields: {} } as unknown as {
				readonly $type: string;
			})
		).toBe(true);
		expect(
			isNode({ $type: 'function_declaration' } as unknown as {
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

	it('assert.kind throws on mismatch', () => {
		expect(() =>
			assert.functionDeclaration({ $type: 'class_declaration' })
		).toThrow(TypeError);
	});
});

/**
 * Phase A coexistence — guards must accept BOTH numeric `$type` (factory /
 * wrap output) AND string `$type` (readNode output) until Phase D removes
 * the string arm.
 */
describe('typescript Phase A coexistence: numeric and string $type', () => {
	it('per-kind guard accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.ClassDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.classDeclaration(node)).toBe(true);
	});

	it('per-kind guard accepts string $type from readNode output', () => {
		const node = {
			$type: 'class_declaration',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.classDeclaration(node)).toBe(true);
	});

	it('per-kind guard rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.FunctionDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.classDeclaration(node)).toBe(false);
	});

	it('is.kind() accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.ClassDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node, 'class_declaration')).toBe(true);
	});

	it('is.kind() accepts string $type from readNode output', () => {
		const node = {
			$type: 'class_declaration',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node, 'class_declaration')).toBe(true);
	});

	it('is.kind() rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.FunctionDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node, 'class_declaration')).toBe(false);
	});

	it('supertype guard accepts numeric $type member from factory', () => {
		const node = {
			$type: TSKindId.BinaryExpression,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.expression(node)).toBe(true);
	});

	it('supertype guard accepts string $type member from readNode', () => {
		const node = {
			$type: 'binary_expression',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.expression(node)).toBe(true);
	});

	it('assert.classDeclaration passes on numeric $type from factory', () => {
		const node = {
			$type: TSKindId.ClassDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(() => assert.classDeclaration(node)).not.toThrow();
	});
});
