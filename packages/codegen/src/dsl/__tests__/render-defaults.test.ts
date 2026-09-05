import { describe, expect, it } from 'vitest';
import { wire } from '../wire/wire.ts';
import { preference } from '../primitives/preference.ts';
import { parseSpacingLabel } from '../primitives/spacing.ts';

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
