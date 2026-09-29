import { describe, expect, it } from 'vitest';
import type { AnyNodeData } from '@sittir/types';
import regex from '../src/index.ts';

const rxNative = (await regex.load()).createNative();

describe('a grammar whose extras admit no space renders its seams tight', () => {
	for (const source of ['^$', '^|$', '(a)|b', 'a{1,2}']) {
		it(JSON.stringify(source), () => {
			const { root } = rxNative.parseAndRead(source);
			expect(String(rxNative.render(root as AnyNodeData))).toBe(source);
		});
	}
});
