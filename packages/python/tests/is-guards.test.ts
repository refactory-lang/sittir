/**
 * is / assert / isTree / isNode guard composition on python grammar.
 * Mirrors the rust counterpart so cross-grammar emitter drift is caught.
 *
 * Phase D (2026-04-30): all guards operate on numeric TSKindId $type only.
 * String $type values (hidden/synthetic kinds, anonymous tokens) are no longer
 * accepted by per-kind or is.kind() guards.
 */

import { describe, it, expect } from 'vitest';
import { is, isNode, isTree, assert } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

describe('python is / isTree / isNode composition', () => {
	it('is.functionDefinition narrows on matching numeric kind', () => {
		const v = { $type: TSKindId.FunctionDefinition };
		expect(is.functionDefinition(v)).toBe(true);
		expect(is.functionDefinition({ $type: TSKindId.ClassDefinition })).toBe(false);
	});

	it('is.kind generic form accepts numeric kinds', () => {
		expect(is.kind({ $type: TSKindId.IfStatement }, 'if_statement')).toBe(true);
		expect(is.kind({ $type: TSKindId.IfStatement }, 'for_statement')).toBe(false);
	});

	it('isNode returns true for NodeData shapes', () => {
		expect(isNode({ $type: 1, $text: 'foo' } as { readonly $type: number })).toBe(true);
		// ADR-0018 Phase 2: isNode checks _<name> keys (de-hoisted storage) OR $text.
		expect(isNode({ $type: TSKindId.IfStatement, _body: {} } as { readonly $type: number })).toBe(true);
		expect(isNode({ $type: TSKindId.FunctionDefinition })).toBe(false);
	});

	it('isTree returns true only when a range() method is present', () => {
		const withRange = {
			$type: 1,
			range: () => ({ start: { index: 0 }, end: { index: 1 } })
		};
		// ADR-0018 Phase 2: $fields removed from interface; use simple object without range().
		const withoutRange = { $type: TSKindId.IfStatement };
		expect(isTree(withRange)).toBe(true);
		expect(isTree(withoutRange)).toBe(false);
	});

	it('assert.kind throws with kind name in message on mismatch', () => {
		expect(() => assert.classDefinition({ $type: TSKindId.IfStatement })).toThrow(TypeError);
	});
});

/**
 * Phase D: all producers emit numeric $type. String-based guards are removed.
 * Guards compare numeric TSKindId only.
 */
describe('python Phase D: numeric-only $type guards', () => {
	it('per-kind guard accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.functionDefinition(node)).toBe(true);
	});

	it('per-kind guard rejects string $type (Phase D — string arm removed)', () => {
		const node = {
			$type: 'function_definition',
			$source: 0,
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.functionDefinition(node as { readonly $type: number })).toBe(false);
	});

	it('per-kind guard rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.ClassDefinition,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.functionDefinition(node)).toBe(false);
	});

	it('is.kind() accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.kind(node, 'function_definition')).toBe(true);
	});

	it('is.kind() rejects string $type (Phase D — string arm removed)', () => {
		const node = {
			$type: 'function_definition',
			$source: 0,
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node as { readonly $type: number }, 'function_definition')).toBe(false);
	});

	it('is.kind() rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.ClassDefinition,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.kind(node, 'function_definition')).toBe(false);
	});

	it('supertype guard accepts numeric $type member from factory', () => {
		// `compoundStatement` is a supertype; `function_definition` is a member.
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.compoundStatement(node)).toBe(true);
	});

	it('supertype guard rejects string $type (Phase D — numeric-only set)', () => {
		const node = {
			$type: 'function_definition',
			$source: 0,
			$named: true,
			$fields: {}
		} as const;
		// Supertype guards accept string | number parameter, but the runtime
		// set is numeric-only in Phase D — string values return false.
		expect(is.compoundStatement(node)).toBe(false);
	});

	it('assert.functionDefinition passes on numeric $type from factory', () => {
		const node = {
			$type: TSKindId.FunctionDefinition,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(() => assert.functionDefinition(node)).not.toThrow();
	});
});
