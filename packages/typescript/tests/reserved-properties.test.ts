import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('the reserved set in effect at a position', () => {
	it('admits a keyword where a rule-level reserved set is empty', () => {
		const member = ts.build.memberExpression({ object: 'Symbol', separator: '.', property: 'for' } as never);
		expect(member.$render!()).toBe('Symbol.for');
		expect(ts.parse('Symbol.for;').$render!().toString()).toBe('Symbol.for;');
	});

	it('still refuses the keyword at a plain identifier', () => {
		expect(() => (ts.build.identifier as (text: string) => unknown)('for')).toThrow("identifier: 'for' is a reserved word");
	});
});
