import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';

it('accepts every family with a valid literal and rejects a wrong one at compile time', () => {
	const ok: Options = {
		arguments_elements: { separator: 'space', trailing: 'never' },
		declaration_list_declarations: { separator: 'newline' },
		impl_item_trait_clause: 'impl_item_positive_clause',
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error 'wide' is not a whitespace class
		arguments_elements: { separator: 'wide' }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
