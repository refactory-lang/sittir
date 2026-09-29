import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('ir.identifier is the identifier supertype, callable through its identifier arm', () => {
	it('coerces and builds strictly', () => {
		expect(ts.build.identifier('x').$render()).toBe('x');
		expect(ts.build.identifier.strict('y').$render()).toBe('y');
	});

	it('keeps both arms as members', () => {
		expect(ts.build.identifier.identifier('z').$render()).toBe('z');
		expect(ts.build.identifier.undefined()).toBe(ts.kinds.Undefined);
	});

	it('leaves the builder primaryExpression.identifier shares untouched', () => {
		expect(Object.keys(ts.build.primaryExpression.identifier)).toEqual([]);
		expect('undefined' in ts.build.primaryExpression.identifier).toBe(false);
	});
});
