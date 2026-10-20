import { describe, expect, it } from 'vitest';
import { validateFrom } from '../src/validate/from.ts';

describe('validateFrom — a shared display is validated per storage kind', () => {
	it('typescript: string_fragment is not excluded as no-from-function, and none of its storage kinds is', async () => {
		const result = await validateFrom('typescript');
		const noFromFunction = result.excluded.filter((row) => row.reason === 'no-from-function').map((row) => row.kind);
		expect(noFromFunction).not.toContain('string_fragment');
		for (const storage of ['_template_chars', 'unescaped_double_string_fragment', 'unescaped_single_string_fragment']) {
			expect(noFromFunction).not.toContain(storage);
		}
	}, 120_000);
});
