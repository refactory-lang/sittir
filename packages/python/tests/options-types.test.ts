import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';

it('accepts every family with a valid literal and rejects a wrong one at compile time', () => {
	const ok: Options = {
		argument_list_elements: { separator: 'space', trailing: 'never' },
		block_statements: { separator: 'newline' },
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error 'wide' is not a whitespace class
		argument_list_elements: { separator: 'wide' }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
