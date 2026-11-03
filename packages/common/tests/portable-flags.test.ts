import { describe, expect, it } from 'vitest';
import { Flags } from '../src/portable/index.ts';

describe('Flags', () => {
	it('gives each flag its bit, in name order', () => {
		expect(Flags.Abstract).toBe(1 << 0);
		expect(Flags.Async).toBe(1 << 1);
		expect(Flags.Prefix).toBe(1 << 19);
		expect(Object.keys(Flags).filter((key) => Number.isNaN(Number(key)))).toHaveLength(29);
	});

	it('combines flags with | and tests one with &', () => {
		const staticAsync: number = Flags.Static | Flags.Async;
		expect((staticAsync & Flags.Static) !== 0).toBe(true);
		expect((staticAsync & Flags.Const) !== 0).toBe(false);
		// @ts-expect-error a private name's flag is `privateName`
		expect(Flags.Private).toBeUndefined();
	});
});
