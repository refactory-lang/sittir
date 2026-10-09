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
				_optional: true
			} as AnyUntypedNode)
		).not.toThrow();
	});

	it('refuses a coordinate without the span its handle names', () => {
		expect(() => assertRenderableUntypedNode({ $type: 1, $treeHandle: 1 } as unknown as AnyUntypedNode)).toThrow('$span');
		expect(() =>
			assertRenderableUntypedNode({ $type: 1, $treeHandle: 1, $span: { start: 0, end: 1 } } as unknown as AnyUntypedNode)
		).not.toThrow();
	});
});
