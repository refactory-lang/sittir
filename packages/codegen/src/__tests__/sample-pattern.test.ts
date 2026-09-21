import { describe, expect, it } from 'vitest';
import { samplePattern } from '../types/runtime-shapes.ts';

describe('samplePattern', () => {
	it.each(['0b[01_]+', '0o[0-7_]+', '[0-9][0-9_]*', '0x[0-9a-fA-F_]+', '(?:u8|i8)', '[^*]+', '\\d{2}', '#!(?:[a-z]+)?'])(
		'builds a string the pattern accepts: %s',
		(pattern) => {
			const sample = samplePattern(pattern);
			expect(sample).not.toBeNull();
			expect(new RegExp(`^(?:${pattern})$`, 'u').test(sample!)).toBe(true);
		}
	);
	it('gives up on a pattern that does not compile', () => {
		expect(samplePattern('[')).toBeNull();
	});
});
