import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('a keyword member of a mixed enum slot passes through as itself', () => {
	it('keeps a stored keyword node beside the extern_modifier branch instead of wrapping it', () => {
		const async_ = { $type: rs.kinds.AsyncKeyword, $text: 'async', $source: 2, $named: true } as never;
		expect(rs.build.functionModifiers(async_).$render()).toBe('async');
	});

	it('still takes the keyword text and the branch', () => {
		expect(rs.build.functionModifiers('async', 'unsafe').$render()).toBe('async unsafe');
	});
});
