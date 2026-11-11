import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const ts = await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' }));

describe('an arena $with of a slot a spelling is present with', () => {
	it('adding an exponent adds the marker to a parsed literal', () => {
		const statement = ts.parse('1.5;\n').statements()[0];
		if (statement === undefined || !ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const value = statement.expression();
		if (!ts.is.numberFloatPoint(value)) throw new Error('expected a float literal');
		expect(ts.render(value.$with.exponent(10)).toString()).toBe('1.5e10');
	});

	it('adding an exponent adds the marker to a built literal', () => {
		const built = ts.build.numberFloatPoint({ integer: 1, fraction: 5 });
		expect(ts.render(built.$with.exponent(10)).toString()).toBe('1.5e10');
	});
});
