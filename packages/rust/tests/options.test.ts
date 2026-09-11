import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter, TSKindId } from '../src/types.ts';

it('the emitted Options type is pinned', () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every site by kind id at its address and rejects a wrong member at compile time', () => {
	const ok: Options = {
		arguments_elements: {
			element: { separator: { ',': { before: TSKindId.Tight, after: TSKindId.Newline } }, delimiter: Delimiter.Trailing }
		},
		binary_expression: { operator: { before: TSKindId.Space, after: TSKindId.Space } },
		parameters: { '(': { after: TSKindId.Tight } },
		body: { before: TSKindId.Indent, after: TSKindId.Dedent },
		block: { '{': { after: TSKindId.Indent }, '}': { before: TSKindId.Dedent } },
		abstract_type: { for: { before: TSKindId.Space } },
		token_tree_punctuation: { '/': { after: TSKindId.Tight }, '::': { after: TSKindId.Tight } },
		indent: '    '
	};
	const bad: Options = {
		arguments_elements: {
			element: {
				// @ts-expect-error a comma is not a whitespace kind, and a separator admits no indent
				separator: { ',': { after: TSKindId.Comma, before: TSKindId.Indent } },
				// @ts-expect-error the leading flank is fixed here
				delimiter: Delimiter.Leading
			}
		},
		// @ts-expect-error a brace has no 'sideways' edge
		block: { '{': { sideways: TSKindId.Space } },
		// @ts-expect-error a comma is not a whitespace kind
		abstract_type: { for: { before: TSKindId.Comma } }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
	expect(ok.block?.['{']?.after).toBe(TSKindId.Indent);
	expect(ok.token_tree_punctuation?.['::']?.after).toBe(TSKindId.Tight);
});
