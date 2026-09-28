import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

describe('ir.identifier is the identifier supertype, callable through its identifier arm', () => {
	it('coerces and builds strictly', () => {
		expect(ir.identifier('x').$render()).toBe('x');
		expect(ir.identifier.strict('y').$render()).toBe('y');
	});

	it('keeps both arms as members', () => {
		expect(ir.identifier.identifier('z').$render()).toBe('z');
		expect(ir.identifier.undefined()).toBe(TSKindId.Undefined);
	});

	it('leaves the builder primaryExpression.identifier shares untouched', () => {
		expect(Object.keys(ir.primaryExpression.identifier)).toEqual([]);
		expect('undefined' in ir.primaryExpression.identifier).toBe(false);
	});
});
