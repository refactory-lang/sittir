import { describe, expect, it } from 'vitest';
import { wire } from '../wire/wire.ts';
import { preference } from '../primitives/preference.ts';
import { parseSeamLabel, parseSpacingLabel, seamLabel } from '../primitives/spacing.ts';

describe('spacing labels', () => {
	it('name a token side or the empty gap', () => {
		expect(parseSpacingLabel('comma_separator_space_before')).toEqual({ token: 'comma', side: 'before' });
		expect(parseSpacingLabel('colon_colon_separator_space_after')).toEqual({ token: 'colon_colon', side: 'after' });
		expect(parseSpacingLabel('empty_separator_space')).toEqual({ token: 'empty' });
		expect(parseSpacingLabel('comma_separator_space')).toBeUndefined();
		expect(parseSpacingLabel('empty_separator_space_before')).toBeUndefined();
		expect(parseSpacingLabel('return_statement')).toBeUndefined();
	});
});

describe('seam labels', () => {
	it('name a punctuation token and a side, and never a separator label', () => {
		expect(seamLabel('lparen', 'before')).toBe('lparen_before');
		expect(parseSeamLabel('lparen_before')).toEqual({ token: 'lparen', side: 'before' });
		expect(parseSeamLabel('colon_colon_after')).toEqual({ token: 'colon_colon', side: 'after' });
		expect(parseSeamLabel('comma_separator_space_before')).toBeUndefined();
		expect(parseSeamLabel('lparen')).toBeUndefined();
		expect(parseSeamLabel('block_start')).toBeUndefined();
	});
});

