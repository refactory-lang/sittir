import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter, TSKindId } from '../src/types.ts';

it('the emitted Options type is pinned', () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every tier by kind id and rejects a wrong member at compile time', () => {
	const ok: Options = {
		comma_separator_space_after: TSKindId.Newline,
		plus_separator_space_before: TSKindId.Space,
		lparen_before: TSKindId.Space,
		block_before: TSKindId.Space,
		operator_before: TSKindId.Space,
		binary_expression: { operator_after: TSKindId.Space },
		parameters: { lparen_after: TSKindId.Tight, parameters_before: TSKindId.Newline },
		body: { before: TSKindId.Indent, after: TSKindId.Dedent },
		block: { lbrace_after: TSKindId.Indent, rbrace_before: TSKindId.Dedent },
		block_end: TSKindId.Newline,
		empty_separator_space: TSKindId.Newline,
		arguments_elements: {
			element_separator_space_after: TSKindId.Space,
			element_delimiter: Delimiter.Trailing
		},
		expression: { statements_separator_space: TSKindId.Newline },
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error a comma is not a whitespace kind
		comma_separator_space_after: TSKindId.Comma,
		// @ts-expect-error a separator admits no indent
		comma_separator_space_before: TSKindId.Indent,
		arguments_elements: {
			// @ts-expect-error the leading flank is fixed here
			element_delimiter: Delimiter.Leading
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});

it('addresses a site by its path, nested as the address is written', () => {
	const nested: Options = {
		block: { '{': { after: TSKindId.Indent }, '}': { before: TSKindId.Dedent } },
		abstract_type: { for: { before: TSKindId.Space } },
		token_tree_punctuation: { '/': { after: TSKindId.Tight }, '::': { after: TSKindId.Tight } }
	};
	expect(nested.block?.['{']?.after).toBe(TSKindId.Indent);
	expect(nested.token_tree_punctuation?.['::']?.after).toBe(TSKindId.Tight);
});

it('rejects an address that names no site, and an arm the site does not admit', () => {
	const bad: Options = {
		// @ts-expect-error a brace has no 'sideways' edge
		block: { '{': { sideways: TSKindId.Space } },
		// @ts-expect-error a comma is not a whitespace kind
		abstract_type: { for: { before: TSKindId.Comma } }
	};
	expect(bad).toBeDefined();
});
