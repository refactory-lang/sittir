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
});
