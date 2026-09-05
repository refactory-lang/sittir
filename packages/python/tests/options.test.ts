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
		dot_separator_space_after: TSKindId.Tight,
		empty_separator_space: TSKindId.Newline,
		argument_list_elements: {
			element_separator_space_after: TSKindId.Space,
			element_delimiter: Delimiter.Trailing
		},
		block: { statements_separator_space: TSKindId.Newline },
		statement: { decorator_separator_space: TSKindId.Newline },
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error a comma is not a whitespace kind
		comma_separator_space_after: TSKindId.Comma,
		argument_list_elements: {
			// @ts-expect-error the leading flank is fixed here
			element_delimiter: Delimiter.Leading
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
