import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { assertRenderableUntypedNode } from '../src/native-boundary.ts';

describe('native boundary', () => {
	it('accepts numeric enum-style field storage', () => {
		expect(() =>
			assertRenderableUntypedNode({
				$type: 1,
				$source: 0,
				$named: true,
				_kind: 16,
				$text: 'const'
			} as AnyUntypedNode)
		).not.toThrow();
	});

	it('accepts boolean keyword-presence field storage', () => {
		expect(() =>
			assertRenderableUntypedNode({
				$type: 1,
				$source: 0,
				$named: true,
				_optional_marker: true
			} as AnyUntypedNode)
		).not.toThrow();
	});

	it('refuses a node naming two handles', () => {
		expect(() =>
			assertRenderableUntypedNode({ $type: 1, $source: 0, $named: true, $handle: 1, $treeHandle: 1 } as AnyUntypedNode)
		).toThrow('node names more than one of $handle, $parentHandle, $treeHandle');
	});

	it("refuses a parent handle without the child index that completes a stub's coordinate", () => {
		expect(() =>
			assertRenderableUntypedNode({ $type: 1, $source: 0, $named: true, $parentHandle: 2 } as AnyUntypedNode)
		).toThrow('node.$parentHandle needs a $childIndex: a stub is addressed by the pair');
		expect(() =>
			assertRenderableUntypedNode({ $type: 1, $source: 0, $named: true, $parentHandle: 2, $childIndex: 0 } as AnyUntypedNode)
		).not.toThrow();
	});
});
