import { describe, expect, it } from 'vitest';
import { buildCountQuantifierGroup } from '../src/factories/raw.ts';

describe('a forwarding factory given a number for its target', () => {
	const digits = (value: number | bigint) => buildCountQuantifierGroup(value).decimalDigits();

	it('builds the target from a bigint', () => {
		expect(typeof digits(1n)).toBe('object');
	});

	it('builds the target from a number', () => {
		expect(typeof digits(3)).toBe('object');
	});
});
