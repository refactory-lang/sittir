import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';

describe('a rust portable guard given a kind id before rust has loaded', () => {
	it('throws, naming the language and asking for an engine first', () => {
		expect(() => rust.is.portable.type.primitive.boolean(rust.kinds.BoolKeyword)).toThrow(
			'rust: a portable guard given a kind id reads the language\'s rows; create an engine for rust first'
		);
	});

	it('reads the rows an engine of a copied descriptor loaded', async () => {
		const copy = { ...rust };
		await copy.createEngine();
		expect(rust.is.portable.type.primitive.boolean(rust.kinds.BoolKeyword)).toBe(true);
	});
});
