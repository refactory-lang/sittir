import { describe, expect, it } from 'vitest';
import type { AnyNodeData } from '@sittir/types';
import { assertRenderableNodeData } from '../src/native-boundary.ts';

describe('native boundary', () => {
	it('accepts numeric enum-style field storage', () => {
		expect(() =>
			assertRenderableNodeData({
				$type: 1,
				$source: 0,
				$named: true,
				_kind: 16,
				$text: 'const'
			} as AnyNodeData)
		).not.toThrow();
	});

	it('accepts boolean keyword-presence field storage', () => {
		expect(() =>
			assertRenderableNodeData({
				$type: 1,
				$source: 0,
				$named: true,
				_optional_marker: true
			} as AnyNodeData)
		).not.toThrow();
	});

	it('refuses a node naming two handles', () => {
		expect(() =>
			assertRenderableNodeData({ $type: 1, $source: 0, $named: true, $handle: 1, $treeHandle: 1 } as AnyNodeData)
		).toThrow('node names more than one of $handle, $parentHandle, $treeHandle');
	});

	it("refuses a parent handle without the child index that completes a stub's coordinate", () => {
		expect(() =>
			assertRenderableNodeData({ $type: 1, $source: 0, $named: true, $parentHandle: 2 } as AnyNodeData)
		).toThrow('node.$parentHandle needs a $childIndex: a stub is addressed by the pair');
		expect(() =>
			assertRenderableNodeData({ $type: 1, $source: 0, $named: true, $parentHandle: 2, $childIndex: 0 } as AnyNodeData)
		).not.toThrow();
	});
});
