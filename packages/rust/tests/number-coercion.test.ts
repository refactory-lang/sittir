import { describe, it, expect } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('a number given to an integer or float literal is written in its base', () => {
	it('every base, strict and loose', () => {
		expect(rs.build.integerLiteral.decimal(255).$render()).toBe('255');
		expect(rs.build.integerLiteral.decimal.strict({ content: 255 }).$render()).toBe('255');
		expect(rs.build.integerLiteral.hex(255).$render()).toBe('0xff');
		expect(rs.build.integerLiteral.hex.strict({ content: 255 }).$render()).toBe('0xff');
		expect(rs.build.integerLiteral.hex({ content: 255, suffix: 'u8' }).$render()).toBe('0xffu8');
		expect(rs.build.integerLiteral.binary(5).$render()).toBe('0b101');
		expect(rs.build.integerLiteral.octal(8).$render()).toBe('0o10');
		expect(rs.build.floatLiteral(1.5).$render()).toBe('1.5');
	});
	it('a bare number picks the arm its text fits', () => {
		expect(rs.build.callExpression({ function: 'f', arguments: [1, 1.5, 1e21] }).$render()).toBe('f(1, 1.5, 1e+21)');
	});
});
