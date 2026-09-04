import { describe, expect, it } from 'vitest';
import { wire } from '../wire/wire.ts';

describe('grammar-declared render defaults', () => {
	const str = (value: string) => ({ type: 'STRING', value });

	it('travel on the wire context as declared, in the shape of the Options type', () => {
		const defaults = {
			empty_separator_space: 'newline',
			block: { statements_empty_separator_space: 'tight' }
		};
		const wired = wire({ rules: { a: () => str('x') }, defaults } as never);
		expect(wired.__wireContext__?.defaults).toBe(defaults);
		expect(Object.keys(wired.rules)).toEqual(['a']);
	});

	it('are absent when the grammar declares none', () => {
		const wired = wire({ rules: { a: () => str('x') } } as never);
		expect(wired.__wireContext__?.defaults).toBeUndefined();
	});
});
