import { describe, expect, it } from 'vitest';
import { mapTailsOf, tailsOf } from '../grammar-map.ts';
import type { ExactSet } from '../exact.ts';

const set = (kinds: readonly string[]): ExactSet => ({ arms: [], kinds, unmapped: [], texts: [], scalars: [], raw: [] });

describe("a slot's tails", () => {
	it('gives each admitted path its shortest suffix no other admitted path ends with', () => {
		expect(tailsOf(['identifier', 'identifier.metavariable'])).toEqual([['identifier.metavariable', 'metavariable']]);
		expect(tailsOf(['expression.binary.arithmetic.add', 'expression.assignment.compound.add'])).toEqual([
			['expression.binary.arithmetic.add', 'arithmetic.add'],
			['expression.assignment.compound.add', 'compound.add']
		]);
	});

	it('never collides a prefix, and gives no admitted path a suffix another admitted path also ends with', () => {
		expect(tailsOf(['expression.call', 'expression.call.member', 'expression.member'])).toEqual([
			['expression.call', 'call'],
			['expression.call.member', 'call.member']
		]);
	});

	it('gives no tail to a path in a one-path slot, to a one-segment path, or to a path whose shorter suffix is another admitted path', () => {
		expect(tailsOf(['identifier.metavariable'])).toEqual([]);
		expect(tailsOf(['x', 'a.x'])).toEqual([]);
	});

	it('fails generation when a tail is the full name of another path in the grammar', () => {
		const slots = new Map([['statement.return', new Map([['expression', set(['expression.member', 'expression.call'])]])]]);
		expect(mapTailsOf(slots, new Set(['statement.return', 'expression.member', 'expression.call']))).toEqual([
			['statement.return', [['expression', [['expression.member', 'member'], ['expression.call', 'call']]]]]
		]);
		expect(() => mapTailsOf(slots, new Set(['member']))).toThrow(/portable-emit-tail-is-path: statement\.return\.expression: expression\.member's tail member is the full name of the path member/);
	});
});
