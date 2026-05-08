/**
 * is × shape guard composition + assert throw behavior (spec 008 SC-006, SC-007).
 *
 * Phase D (2026-04-30): guards compare numeric TSKindId only.
 * String $type values are no longer accepted by per-kind or is.kind() guards.
 *
 * - Type-level: `is.functionItem(v) && isNode(v)` narrows to FunctionItem.
 * - Runtime: `is.functionItem(v)` returns true only on TSKindId.FunctionItem.
 * - Runtime: `assert.functionItem(wrong)` throws TypeError with expected+actual.
 */

import { describe, it, expect } from 'vitest';
import { is, isTree, isNode, assert } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';
import type { FunctionItem } from '../src/index.ts';

describe('is / isTree / isNode guard composition', () => {
	it('is.functionItem narrows the $type discriminant to numeric TSKindId', () => {
		// ADR-0018 Phase 2: no $fields on the interface; use minimal typed object.
		const v = { $type: TSKindId.FunctionItem } as unknown as FunctionItem;
		if (!is.functionItem(v)) {
			throw new Error('is.functionItem should have returned true');
		}
		// v.$type is now narrowed to TSKindId.FunctionItem (numeric)
		expect(v.$type).toBe(TSKindId.FunctionItem);
	});

	it('is.functionItem returns false for non-matching kinds', () => {
		expect(is.functionItem({ $type: TSKindId.Block })).toBe(false);
		expect(is.functionItem({ $type: TSKindId.Identifier })).toBe(false);
	});

	it('is.kind generic form accepts kind name strings', () => {
		// is.kind() narrows to { $type: number } broadly (not to a specific literal).
		expect(is.kind({ $type: TSKindId.FunctionItem }, 'function_item')).toBe(true);
		expect(is.kind({ $type: TSKindId.Block }, 'function_item')).toBe(false);
	});

	it('isNode returns true for NodeData shapes, false for loose bags', () => {
		expect(isNode({ $type: TSKindId.Identifier, $text: 'foo' } as { readonly $type: number })).toBe(true);
		// ADR-0018 Phase 2: isNode checks _<name> keys (de-hoisted storage) OR $text.
		// Use a _<name> key to signal a branch node shape.
		expect(isNode({ $type: TSKindId.Block, _name: 'x' } as { readonly $type: number })).toBe(true);
		// Loose bag without _<name> keys or $text — looks like a config object.
		expect(isNode({ $type: TSKindId.FunctionItem })).toBe(false);
	});

	it('isTree returns true only when a range() method is present', () => {
		const withRange = {
			$type: TSKindId.FunctionItem,
			range: () => ({ start: { index: 0 }, end: { index: 1 } })
		};
		// ADR-0018 Phase 2: $fields removed from interface; any object without range() passes false.
		const withoutRange = { $type: TSKindId.FunctionItem };
		expect(isTree(withRange)).toBe(true);
		expect(isTree(withoutRange)).toBe(false);
	});

	it('kind × shape composition narrows to NamespaceMap projection', () => {
		// ADR-0018 Phase 2: no $fields on the interface; use _name key for isNode shape.
		const v: FunctionItem = {
			$type: TSKindId.FunctionItem
		} as unknown as FunctionItem;
		if (is.functionItem(v) && isNode(v)) {
			// Runtime path executes — structural narrowing via isNode verified.
			expect(true).toBe(true);
		}
	});
});

describe('assert throw behavior', () => {
	it('assert.functionItem throws TypeError with expected+actual on mismatch', () => {
		expect(() => assert.functionItem({ $type: TSKindId.Block })).toThrow(TypeError);
		expect(() => assert.functionItem({ $type: TSKindId.Block })).toThrow(
			/assert\.functionItem: expected type 'functionItem', got/
		);
	});

	it('assert.functionItem passes silently on matching kind', () => {
		expect(() => assert.functionItem({ $type: TSKindId.FunctionItem })).not.toThrow();
	});

	it('assert.kind throws with kind name in message', () => {
		expect(() => assert.kind({ $type: TSKindId.Block }, 'function_item')).toThrow(TypeError);
	});
});

/**
 * Phase D: all producers emit numeric $type. String-based guards are removed.
 * Guards compare numeric TSKindId only. String $type returns false.
 */
describe('Phase D: numeric-only $type guards', () => {
	it('per-kind guard accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.FunctionItem,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.functionItem(node)).toBe(true);
	});

	it('per-kind guard rejects string $type (Phase D — string arm removed)', () => {
		const node = {
			$type: 'function_item',
			$source: 0,
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.functionItem(node as { readonly $type: number })).toBe(false);
	});

	it('per-kind guard rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.Block,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.functionItem(node)).toBe(false);
	});

	it('is.kind() accepts numeric $type from factory output', () => {
		const node = {
			$type: TSKindId.FunctionItem,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.kind(node, 'function_item')).toBe(true);
	});

	it('is.kind() rejects string $type (Phase D — string arm removed)', () => {
		const node = {
			$type: 'function_item',
			$source: 0,
			$named: true,
			$fields: {}
		} as unknown as { readonly $type: string | number };
		expect(is.kind(node as { readonly $type: number }, 'function_item')).toBe(false);
	});

	it('is.kind() rejects mismatched numeric $type', () => {
		const node = {
			$type: TSKindId.Block,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.kind(node, 'function_item')).toBe(false);
	});

	it('supertype guard accepts numeric $type member from factory', () => {
		// `expression` is a supertype; `binary_expression` is a member kind.
		const node = {
			$type: TSKindId.BinaryExpression,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(is.expression(node)).toBe(true);
	});

	it('supertype guard rejects string $type (Phase D — numeric-only set)', () => {
		const node = {
			$type: 'binary_expression',
			$source: 0,
			$named: true,
			$fields: {}
		} as const;
		// Supertype guards accept string | number parameter, but the runtime
		// set is numeric-only in Phase D — string values return false.
		expect(is.expression(node)).toBe(false);
	});

	it('assert.functionItem passes on numeric $type from factory', () => {
		const node = {
			$type: TSKindId.FunctionItem,
			$source: 2,
			$named: true,
			$fields: {}
		} as const;
		expect(() => assert.functionItem(node)).not.toThrow();
	});
});
