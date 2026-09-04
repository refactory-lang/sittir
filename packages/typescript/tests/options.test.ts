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
		empty_separator_space: TSKindId.Newline,
		statement_terminator: TSKindId.Semi,
		quote_style: TSKindId.StringSingle,
		formal_parameters: {
			formal_parameters_elements_comma_separator_space_after: TSKindId.Space,
			formal_parameters_elements_delimiter: Delimiter.Trailing
		},
		statement: { terminator_statement_terminator: TSKindId.AutomaticSemicolon },
		indent: '\t'
	};
	const bad: Options = {
		// @ts-expect-error a semicolon is not a whitespace kind
		comma_separator_space_after: TSKindId.Semi,
		// @ts-expect-error whitespace is not a terminator arm
		statement_terminator: TSKindId.Space,
		formal_parameters: {
			// @ts-expect-error the leading flank is fixed here
			formal_parameters_elements_delimiter: Delimiter.Leading
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
