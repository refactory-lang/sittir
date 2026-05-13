import { describe, expect, it } from 'vitest';
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
			})
		).not.toThrow();
	});

	it('accepts boolean keyword-presence field storage', () => {
		expect(() =>
			assertRenderableNodeData({
				$type: 1,
				$source: 0,
				$named: true,
				_optional_marker: true
			})
		).not.toThrow();
	});

	it('accepts scalarized unnamed-slot members in $children', () => {
		expect(() =>
			assertRenderableNodeData({
				$type: 1,
				$source: 0,
				$named: true,
				$children: [
					16,
					{
						$type: 2,
						$source: 0,
						$named: true,
						$text: 'x'
					}
				]
			})
		).not.toThrow();
	});
});
