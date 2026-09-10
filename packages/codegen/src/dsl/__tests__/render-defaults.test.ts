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

	it('collect a slot default in the shape of the Options type, leaving no rule behind', () => {
		const wired = wire({
			rules,
			patches: {
				block: { statements: preference('empty_separator_space', 'tight') },
				_token_tree_paren: { tokens: preference('empty_separator_space', 'tight') }
			}
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: {},
			sites: {
				block: { statements_separator_space: { label: 'empty_separator_space', arm: 'tight' } },
				_token_tree_paren: { tokens_separator_space: { label: 'empty_separator_space', arm: 'tight' } }
			}
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['a', 'block']);
	});

	it('refuse a top-level gap, seam or flank spelling, which the options block now addresses', () => {
		for (const key of ['empty_separator_space', 'comma_separator_space_before', 'lparen_before', 'block_start']) {
			expect(() => wire({ rules, patches: { [key]: preference('x', 'tight') } } as never)).toThrow(
				/is a spacing address; declare it under options:/
			);
		}
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

	it('refuse an arm outside the whitespace kinds', () => {
		expect(() =>
			wire({ rules, patches: { block: { statements: preference('empty_separator_space', 'wide') } } } as never)
		).toThrow(/not one of tight, space, newline/);
	});

	it('leaves a rule spelled like a flank address to the patch machinery', () => {
		const wired = wire({
			rules: { ...rules, string_start: () => str('"') },
			patches: { string_start: preference('quote', '"') }
		} as never);
		expect(wired.__wireContext__?.defaults).toBeUndefined();
		expect(Object.keys(wired.rules).sort()).toEqual(['a', 'block', 'string_start']);
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

	it('collect a kind-level token seam, leaving no rule behind', () => {
		const wired = wire({
			rules,
			patches: { call: { rparen_before: preference('rparen_before', 'newline') } }
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: {},
			sites: { call: { rparen_before: { label: 'rparen_before', arm: 'newline' } } }
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['call', 'lparen_after']);
	});

	it('leave a rule spelled like a seam label to the patch machinery', () => {
		const wired = wire({ rules, patches: { lparen_after: preference('quote', '"') } } as never);
		expect(wired.__wireContext__?.defaults).toBeUndefined();
		expect(Object.keys(wired.rules).sort()).toEqual(['call', 'lparen_after']);
	});

	it('take indent and dedent with a declared label on a kind-level seam', () => {
		const wired = wire({
			rules: { ...rules, arms: () => str('z') },
			patches: {
				call: { lparen_after: preference('body_before', 'indent'), rparen_before: preference('body_after', 'dedent') }
			}
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: {},
			sites: { call: { lparen_after: { label: 'body_before', arm: 'indent' }, rparen_before: { label: 'body_after', arm: 'dedent' } } }
		});
	});

	it('refuse a kind-level label not spelled as a seam', () => {
		expect(() => wire({ rules, patches: { call: { lparen_before: preference('paren_gap', 'space') } } } as never)).toThrow(
			/call\.lparen_before labels a token seam 'paren_gap', which is not spelled <token>_before \/ <token>_after/
		);
	});

	it('lifts a separator default under a list slot with its arm unchecked, beside the delimiter default', () => {
		const wired = wire({
			rules: { ...rules, list: () => str('l') },
			patches: {
				list: [{ content: preference('separator', 'semi') }, { content: preference('delimiter', 'Delimiter.Trailing') }]
			}
		} as never);
		expect(wired.__wireContext__?.defaults?.sites).toEqual({
			list: {
				content_separator: { label: 'separator', arm: 'semi' },
				content_delimiter: { label: 'delimiter', arm: 'Delimiter.Trailing' }
			}
		});
	});
});
