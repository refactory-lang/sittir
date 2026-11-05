import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';

describe('a rust portable guard given a kind id or a token text before rust has loaded', () => {
	it('throws, naming the language and asking for an engine first', () => {
		const message = "rust: a portable guard given a kind id or a token's text reads the language's rows; create an engine for rust first";
		expect(() => rust.is.portable.type.primitive.boolean(rust.kinds.BoolKeyword)).toThrow(message);
		expect(() => rust.is.portable.type.primitive.boolean('bool')).toThrow(message);
	});

	it('reads the rows an engine of a copied descriptor loaded', async () => {
		const copy = { ...rust };
		await copy.createEngine();
		expect(rust.is.portable.type.primitive.boolean(rust.kinds.BoolKeyword)).toBe(true);
		expect(rust.is.portable.type.primitive.boolean('bool')).toBe(true);
		expect(rust.is.portable.type.primitive.boolean('boolean')).toBe(false);
	});
});
