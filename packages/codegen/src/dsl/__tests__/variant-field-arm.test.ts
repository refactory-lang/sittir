import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

describe('variant() on a field arm', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('keeps the field of a single-symbol field arm', () => {
		const { result } = withWireContext('suffix', () => {
			const original = {
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: 'capture' },
					{ type: 'FIELD', name: 'quantifier', content: { type: 'SYMBOL', name: 'quantifier' } }
				]
			} as any;
			return transform(original, { 1: variant('quantifier') }) as any;
		});
		const arm = result.members[1];
		expect(arm.type).toBe('FIELD');
		expect(arm.name).toBe('quantifier');
		expect(arm.content).toMatchObject({ type: 'SYMBOL', name: 'quantifier' });
	});
});
