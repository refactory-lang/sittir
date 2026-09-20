import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

describe('a bare string never names an affixed leaf', () => {
	it('is the text of an unaffixed leaf: identifier and integer', () => {
		const node = ir.binaryExpression({ left: 'x', operator: '+', right: '1' });
		expect(node.$render!()).toBe('x + 1');
		expect(node._right).toMatchObject({ $type: ir.integerLiteral('1').$type });
	});

	it('is not sniffed into a char literal by its quotes: no unaffixed pattern accepts it, so it throws', () => {
		expect(() => ir.binaryExpression({ left: "'a'", operator: '+', right: 'x' })).toThrow(/bare string/);
	});

	it('is the text of a float literal when its shape says so', () => {
		expect(ir.binaryExpression({ left: '1.5', operator: '+', right: 'x' }).$render!()).toBe('1.5 + x');
	});

	it('reaches a char literal only through its own factory, which takes content', () => {
		expect(ir.binaryExpression({ left: ir.charLiteral('a'), operator: '+', right: 'x' }).$render!()).toBe("'a' + x");
	});
});
