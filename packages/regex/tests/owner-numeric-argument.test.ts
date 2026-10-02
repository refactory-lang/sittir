import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';
import { buildCountQuantifierGroup } from '../src/factories/raw.ts';

const rx = await createEngine(regex);

describe('a strict builder whose one slot holds a numeric leaf', () => {
	it('takes the built leaf', () => {
		const digits = rx.build.decimalDigits(3);
		expect(buildCountQuantifierGroup(digits).decimalDigits()).toBe(digits);
	});

	it('does not take the leaf\'s number: a scalar to a leaf is coercion', () => {
		// @ts-expect-error a number is not a built leaf
		const fromNumber = buildCountQuantifierGroup(3);
		expect(() => rx.render(fromNumber as never).toString()).toThrow(/DecimalDigitsTransport renders from a node, not a kind id/);
		// @ts-expect-error a bigint is not a built leaf
		expect(() => buildCountQuantifierGroup(1n)).toThrow(/a strict factory takes a built node, not a bigint/);
	});

	it('leaves the number to the loose entry', () => {
		expect(rx.build.countQuantifier.strict).toBeTypeOf('function');
		expect(rx.build.decimalDigits(3).$text).toBe('3');
	});
});
