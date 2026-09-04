import { describe, expect, it } from 'vitest';
import { parseSpacingPhantomKind, spacingPhantomKind } from '../primitives/spacing.ts';
import { preference } from '../primitives/preference.ts';
import { wire } from '../wire/wire.ts';

describe('spacing phantom kinds', () => {
	it('round-trips a token side and the empty separator', () => {
		expect(spacingPhantomKind({ token: 'comma', side: 'before' })).toBe('comma_separator_space_before');
		expect(parseSpacingPhantomKind('comma_separator_space_before')).toEqual({ token: 'comma', side: 'before' });
		expect(parseSpacingPhantomKind('_colon_colon_separator_space_after')).toEqual({ token: 'colon_colon', side: 'after' });
		expect(parseSpacingPhantomKind('empty_separator_space')).toEqual({ token: 'empty' });
	});

	it('rejects a token without a side and the empty separator with one', () => {
		expect(parseSpacingPhantomKind('comma_separator_space')).toBeUndefined();
		expect(parseSpacingPhantomKind('empty_separator_space_before')).toBeUndefined();
		expect(parseSpacingPhantomKind('return_statement')).toBeUndefined();
	});
});

describe('patches on a spacing phantom', () => {
	const str = (value: string) => ({ type: 'STRING', value });

	it('are recorded as spacing preferences instead of rules', () => {
		const wired = wire({
			rules: { a: () => str('x') },
			patches: { comma_separator_space_before: preference('comma_spacing_before', 'tight') }
		} as never);
		expect(wired.__wireContext__?.spacingPreferences.get('comma_separator_space_before')).toEqual({
			label: 'comma_spacing_before',
			default: 'tight'
		});
		expect(Object.keys(wired.rules)).not.toContain('comma_separator_space_before');
	});

	it('take exactly one preference', () => {
		expect(() =>
			wire({ rules: { a: () => str('x') }, patches: { comma_separator_space_before: { 0: str('y') } } } as never)
		).toThrow(/exactly one preference/);
	});
});
