// A number filling a slot is refused when it is built, never at render, and
// the same way in both storages: a loose builder refuses it by the numeric
// leaf's own guard, a strict builder refuses a number that is no kind id.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { TSKindId } from '../src/kinds.ts';

const NEGATIVE = /a negative number is a unary minus applied to a positive literal; build the literal from its absolute value/;
const UNSPELLED = /has no literal spelling/;

for (const nodeStorage of ['arena', 'object'] as const) {
	const loose = await createEngine(typescript, { nodeStorage });
	const strict = await createEngine(typescript, { api: 'strict', nodeStorage });
	const binary = (left: unknown) => loose.build.binaryExpression({ left: left as never, operator: '+', right: 2 });

	describe(`a number in a slot, ${nodeStorage} storage`, () => {
		it('builds the numeric leaf its spelling names', () => {
			expect(binary(2).$render()).toBe('2 + 2');
			expect(binary(1.5).$render()).toBe('1.5 + 2');
			expect(binary(2n).$render()).toBe('2 + 2');
		});

		it.each([
			['-1', -1, NEGATIVE],
			['-0', -0, NEGATIVE],
			['-1.5', -1.5, NEGATIVE],
			['-1n', -1n, NEGATIVE],
			['NaN', Number.NaN, UNSPELLED],
			['Infinity', Number.POSITIVE_INFINITY, UNSPELLED],
			['an unsafe integer', 2 ** 53 + 2, /pass it as a bigint/]
		])('refuses %s when the loose builder is called', (_label, value, refusal) => {
			expect(() => binary(value)).toThrow(refusal);
		});

		it('refuses a negative item of a list the same way', () => {
			expect(() => loose.build.arguments(1, -1 as never)).toThrow(NEGATIVE);
		});

		it.each([
			['-1', -1],
			['1.5', 1.5],
			['NaN', Number.NaN],
			['Infinity', Number.POSITIVE_INFINITY],
			['-1n', -1n],
			['an unsafe integer', 2 ** 53 + 2]
		])('refuses %s as a kind id when the strict builder is called', (_label, value) => {
			const right = strict.build.number.decimal('2');
			expect(() => strict.build.binaryExpression({ left: value as never, operator: TSKindId.Plus as never, right })).toThrow(
				`a kind id is a non-negative safe integer, not ${typeof value === 'bigint' ? `${value}n` : value}`
			);
		});
	});
}
