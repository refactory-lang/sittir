import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('a number given to an integer or float arm is written in its base', () => {
	it('decimal, hex and float', () => {
		expect(ir.integer.decimal(255).$render()).toBe('255');
		expect(ir.integer.hex({ prefix: '0x', content: 255 }).$render()).toBe('0xff');
		expect(ir.float.point(1.5).$render()).toBe('1.5');
	});
	it('a bare number picks the arm its text fits', () => {
		expect(ir.list([1, 1.5]).$render()).toBe('[1, 1.5]');
	});
});
