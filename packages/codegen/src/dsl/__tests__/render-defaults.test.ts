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

describe('render defaults declared in patches', () => {
	const str = (value: string) => ({ type: 'STRING', value });
	const rules = { a: () => str('x'), block: () => str('y') };

	it('collect a label default and a slot default in the shape of the Options type, leaving no rule behind', () => {
		const wired = wire({
			rules,
			patches: {
				empty_separator_space: preference('empty_separator_space', 'newline'),
				block: { statements: preference('empty_separator_space', 'tight') },
				_token_tree_paren: { tokens: preference('empty_separator_space', 'tight') }
			}
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: { empty_separator_space: 'newline' },
			sites: {
				block: { statements_separator_space: { label: 'empty_separator_space', arm: 'tight' } },
				_token_tree_paren: { tokens_separator_space: { label: 'empty_separator_space', arm: 'tight' } }
			}
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['a', 'block']);
	});

	it('keep structural patches beside slot defaults on the same kind', () => {
		const wired = wire({
			rules,
			patches: { block: [{ 0: str('z') }, { statements: preference('empty_separator_space', 'tight') }] }
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: {},
			sites: { block: { statements_separator_space: { label: 'empty_separator_space', arm: 'tight' } } }
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['a', 'block']);
	});

	it('take a Delimiter member for a delimiter preference under a slot key', () => {
		const wired = wire({
			rules,
			patches: { block: [{ statements: preference('empty_separator_space', 'newline') }, { statements: preference('delimiter', 'Delimiter.Trailing') }] }
		} as never);
		expect(wired.__wireContext__?.defaults?.sites).toEqual({
			block: {
				statements_separator_space: { label: 'empty_separator_space', arm: 'newline' },
				statements_delimiter: { label: 'delimiter', arm: 'Delimiter.Trailing' }
			}
		});
		expect(() => wire({ rules, patches: { block: { statements: preference('delimiter', 'space') } } } as never)).toThrow(/not one of Delimiter.None/);
	});

	it('are absent when the grammar declares none', () => {
		expect(wire({ rules } as never).__wireContext__?.defaults).toBeUndefined();
	});

	it('refuse a relabel, a structural patch on a label, and an arm outside the whitespace kinds', () => {
		expect(() =>
			wire({ rules, patches: { comma_separator_space_before: preference('comma_spacing', 'tight') } } as never)
		).toThrow(/named by its gap/);
		expect(() => wire({ rules, patches: { comma_separator_space_before: { 0: str('y') } } } as never)).toThrow(
			/exactly one preference/
		);
		expect(() =>
			wire({ rules, patches: { block: { statements: preference('empty_separator_space', 'wide') } } } as never)
		).toThrow(/not one of tight, space, newline/);
	});

	it('read a kind-level flank address that is not a rule name, and leave a rule of that spelling to the patch machinery', () => {
		const wired = wire({
			rules: { ...rules, string_start: () => str('"') },
			patches: {
				block_start: preference('body_start', 'indent'),
				block_end: preference('body_end', 'dedent'),
				string_start: preference('quote', '"')
			}
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: {},
			sites: { block: { start: { label: 'body_start', arm: 'indent' }, end: { label: 'body_end', arm: 'dedent' } } }
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['a', 'block', 'string_start']);
		expect(() => wire({ rules, patches: { block_start: preference('x', 'wide') } } as never)).toThrow(
			/not one of tight, space, newline, indent, dedent/
		);
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

describe('seam defaults declared in patches', () => {
	const str = (value: string) => ({ type: 'STRING', value });
	const rules = { call: () => str('x'), lparen_after: () => str('y') };

	it('collect a top-level token seam and a kind-level one, leaving no rule behind', () => {
		const wired = wire({
			rules,
			patches: {
				lparen_before: preference('lparen_before', 'space'),
				call: { rparen_before: preference('rparen_before', 'newline') }
			}
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: { lparen_before: 'space' },
			sites: { call: { rparen_before: { label: 'rparen_before', arm: 'newline' } } }
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['call', 'lparen_after']);
	});

	it('leave a rule spelled like a seam label to the patch machinery', () => {
		const wired = wire({ rules, patches: { lparen_after: preference('quote', '"') } } as never);
		expect(wired.__wireContext__?.defaults).toBeUndefined();
		expect(Object.keys(wired.rules).sort()).toEqual(['call', 'lparen_after']);
	});

	it('refuse a relabel, a whitespace arm outside tight/space/newline, and a mismatched kind-level key', () => {
		expect(() => wire({ rules, patches: { lparen_before: preference('paren_gap', 'space') } } as never)).toThrow(
			/'lparen_before' is named by its token and side/
		);
		expect(() => wire({ rules, patches: { lparen_before: preference('lparen_before', 'indent') } } as never)).toThrow(
			/'lparen_before' defaults to 'indent', not one of tight, space, newline/
		);
		expect(() => wire({ rules, patches: { call: { lparen_before: preference('rparen_before', 'space') } } } as never)).toThrow(
			/call\.lparen_before names a token seam by 'rparen_before'/
		);
	});
});
