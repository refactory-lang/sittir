import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';

it('accepts every family with a valid literal and rejects a wrong one at compile time', () => {
	const ok: Options = {
		formal_parameters_elements: { separator: 'space', trailing: 'never' },
		statement_block_statements: { separator: 'newline' },
		statement_terminator: ';',
		quote_style: 'single',
		indent: '\t'
	};
	const bad: Options = {
		// @ts-expect-error 'wide' is not a whitespace class
		formal_parameters_elements: { separator: 'wide' },
		// @ts-expect-error a form name the split does not have
		quote_style: 'backtick'
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
