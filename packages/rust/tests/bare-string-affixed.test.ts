import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('a bare string never names an affixed leaf', () => {
	it('is the text of an unaffixed leaf: identifier and integer', () => {
		const node = rs.build.binaryExpression({ left: 'x', operator: '+', right: '1' });
		expect(node.$render!()).toBe('x + 1');
		expect(node._right).toMatchObject({ $type: rs.build.integerLiteral('1').$type });
	});

	it('is not sniffed into a char literal by its quotes: no unaffixed pattern accepts it, so it throws', () => {
		expect(() => rs.build.binaryExpression({ left: "'a'", operator: '+', right: 'x' })).toThrow(/bare string/);
	});

	it('is the text of a float literal when its shape says so', () => {
		expect(rs.build.binaryExpression({ left: '1.5', operator: '+', right: 'x' }).$render!()).toBe('1.5 + x');
	});

	it('reaches a char literal only through its own factory, which takes content', () => {
		expect(rs.build.binaryExpression({ left: rs.build.charLiteral('a'), operator: '+', right: 'x' }).$render!()).toBe("'a' + x");
	});
});
