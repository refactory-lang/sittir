import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter, TSKindId } from '../src/types.ts';
import { createEngine, ir } from '../src/index.ts';

it('the emitted Options type is pinned', () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every tier by kind id and rejects a wrong member at compile time', () => {
	const ok: Options = {
		comma_separator_space_after: TSKindId.Newline,
		empty_separator_space: TSKindId.Newline,
		statement_terminator: TSKindId.Semi,
		quote_style: TSKindId.StringSingle,
		formal_parameters_elements: {
			formal_parameter_separator_space_after: TSKindId.Space,
			formal_parameter_delimiter: Delimiter.Trailing
		},
		statement: { terminator_statement_terminator: TSKindId.AutomaticSemicolon },
		indent: '\t'
	};
	const bad: Options = {
		// @ts-expect-error a semicolon is not a whitespace kind
		comma_separator_space_after: TSKindId.Semi,
		// @ts-expect-error whitespace is not a terminator arm
		statement_terminator: TSKindId.Space,
		formal_parameters_elements: {
			// @ts-expect-error the leading flank is fixed here
			formal_parameter_delimiter: Delimiter.Leading
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});

it('engine options set the spacing of a built list and per-call options override them', () => {
	const tight = createEngine({ options: { comma_separator_space_after: TSKindId.Tight } });
	const spaced = createEngine({ options: { comma_separator_space_after: TSKindId.Space } });
	const list = ir.array({ elements: ['a', 'b'] });
	expect(tight.render(list).toString()).toBe('[a,b]');
	expect(spaced.render(list).toString()).toBe('[a, b]');
	expect(
		tight.render(list, { options: { array: { elements_separator_space_after: TSKindId.Newline } } }).toString()
	).toBe('[a,\nb]');
	expect(
		spaced.render(list, { options: { array: { elements_separator_space_before: TSKindId.Space } } }).toString()
	).toBe('[a , b]');
});

it('an unknown option key is refused at construction', () => {
	expect(() => createEngine({ options: { nope: 1 } as never })).toThrow(/nope/);
});

