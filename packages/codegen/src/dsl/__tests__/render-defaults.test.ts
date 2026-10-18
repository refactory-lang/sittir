import { describe, expect, it } from 'vitest';
import { parseSpacingAddress, spacingLabelOf } from '../primitives/spacing.ts';

describe('spacing labels', () => {
	it('name a token side or the empty gap', () => {
		expect(parseSpacingAddress('comma_separator_space_before')).toEqual({ at: 'separator', token: 'comma', side: 'before' });
		expect(parseSpacingAddress('colon_colon_separator_space_after')).toEqual({ at: 'separator', token: 'colon_colon', side: 'after' });
		expect(parseSpacingAddress('empty_separator_space')).toEqual({ at: 'separator', token: 'empty' });
		expect(parseSpacingAddress('comma_separator_space')).toBeUndefined();
		expect(parseSpacingAddress('empty_separator_space_before')?.at).not.toBe('separator');
		expect(parseSpacingAddress('return_statement')).toBeUndefined();
	});
});

describe('seam labels', () => {
	it('name a punctuation token and a side, and never a separator label', () => {
		expect(spacingLabelOf({ at: 'seam', token: 'lparen', side: 'before' })).toBe('lparen_before');
		expect(parseSpacingAddress('lparen_before')).toEqual({ at: 'seam', token: 'lparen', side: 'before' });
		expect(parseSpacingAddress('colon_colon_after')).toEqual({ at: 'seam', token: 'colon_colon', side: 'after' });
		expect(parseSpacingAddress('comma_separator_space_before')?.at).toBe('separator');
		expect(parseSpacingAddress('lparen')).toBeUndefined();
		expect(parseSpacingAddress('block_start')?.at).toBe('flank');
	});
});
