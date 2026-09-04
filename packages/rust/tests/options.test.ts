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
		empty_separator_space: TSKindId.Newline,
		arguments: {
			arguments_elements_comma_separator_space_after: TSKindId.Space,
			arguments_elements_delimiter: Delimiter.Trailing
		},
		expression: { tuple_expression_elements_delimiter: Delimiter.Trailing },
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error a comma is not a whitespace kind
		comma_separator_space_after: TSKindId.Comma,
		arguments: {
			// @ts-expect-error the leading flank is fixed here
			arguments_elements_delimiter: Delimiter.Leading
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
