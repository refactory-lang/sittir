/**
 * is / assert / isTree / isNode guard composition on typescript grammar.
 * Mirrors the rust counterpart.
 *
 * Phase D (2026-04-30): guards compare numeric TSKindId only.
 * String $type values are no longer accepted by per-kind or is.kind() guards.
 */

import { describe, it, expect } from 'vitest';
import { is, isNode, isTree, assert } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

describe('typescript is / isTree / isNode composition', () => {
	it('is.classDeclaration narrows on matching numeric kind', () => {
		const v = { $type: TSKindId.ClassDeclaration };
		expect(is.classDeclaration(v)).toBe(true);
		expect(is.classDeclaration({ $type: TSKindId.FunctionDeclaration })).toBe(false);
	});

	it('is.kind generic form accepts numeric kinds', () => {
		expect(
			is.kind({ $type: TSKindId.FunctionDeclaration }, 'function_declaration')
		).toBe(true);
		expect(
			is.kind({ $type: TSKindId.FunctionDeclaration }, 'class_declaration')
		).toBe(false);
	});

	it('isNode returns true for NodeData shapes', () => {
		expect(
			isNode({ $type: 1, $text: 'foo' } as { readonly $type: number })
		).toBe(true);
		expect(
			isNode({ $type: TSKindId.ClassDeclaration, $fields: {} } as { readonly $type: number })
		).toBe(true);
		expect(
			isNode({ $type: TSKindId.FunctionDeclaration })
		).toBe(false);
	});

	it('isTree returns true only when a range() method is present', () => {
		const withRange = {
			$type: TSKindId.ClassDeclaration,
			range: () => ({ start: { index: 0 }, end: { index: 1 } })
		};
		const withoutRange = { $type: TSKindId.ClassDeclaration, $fields: {} };
		expect(isTree(withRange)).toBe(true);
		expect(isTree(withoutRange)).toBe(false);
	});

	it('assert.kind throws on mismatch', () => {
		expect(() =>
			assert.functionDeclaration({ $type: TSKindId.ClassDeclaration })
		).toThrow(TypeError);
	});
});

/**
 * Phase D: all producers emit numeric $type. String-based guards are removed.
 * Guards compare numeric TSKindId only. String $type returns false.
 */
describe('typescript Phase D: numeric-only $type guards', () => {
	it('per-kind guard accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.ClassDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as const;
		expect(is.classDeclaration(node)).toBe(true);
	});

	it('per-kind guard rejects string $type (Phase D — string arm removed)', () => {
		const node = {
			$type: 'class_declaration',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.classDeclaration(node as { readonly $type: number })).toBe(false);
	});

	it('per-kind guard rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.FunctionDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as const;
		expect(is.classDeclaration(node)).toBe(false);
	});

	it('is.kind() accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.ClassDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as const;
		expect(is.kind(node, 'class_declaration')).toBe(true);
	});

	it('is.kind() rejects string $type (Phase D — string arm removed)', () => {
		const node = {
			$type: 'class_declaration',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node as { readonly $type: number }, 'class_declaration')).toBe(false);
	});

	it('is.kind() rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.FunctionDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as const;
		expect(is.kind(node, 'class_declaration')).toBe(false);
	});

	it('supertype guard accepts numeric $type member from factory', () => {
		const node = {
			$type: TSKindId.BinaryExpression,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as const;
		expect(is.expression(node)).toBe(true);
	});

	it('supertype guard rejects string $type (Phase D — numeric-only set)', () => {
		const node = {
			$type: 'binary_expression',
			$source: 'ts',
			$named: true,
			$fields: {}
		} as const;
		// Supertype guards accept string | number parameter, but the runtime
		// set is numeric-only in Phase D — string values return false.
		expect(is.expression(node)).toBe(false);
	});

	it('assert.classDeclaration passes on numeric $type from factory', () => {
		const node = {
			$type: TSKindId.ClassDeclaration,
			$source: 'factory',
			$named: true,
			$fields: {}
		} as const;
		expect(() => assert.classDeclaration(node)).not.toThrow();
	});
});
