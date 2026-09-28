// An integer builder takes a JavaScript number or bigint and writes the
// literal in the radix its sub-factory names.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';

describe('python number input', () => {
	it('writes hex from a number or a bigint', () => {
		expect(ir.integer.hex(255).$render()).toBe('0xff');
		expect(ir.integer.hex(255n).$render()).toBe('0xff');
	});
	it('keeps a bigint past the safe range exact', () => {
		expect(ir.integer(12345678901234567890n).$render()).toBe('12345678901234567890');
	});
});
