import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('a registered spelling site leaves the config and takes an option', () => {
	it('the value stands alone and the prefix defaults to the registered arm', () => {
		expect(ir.number.hex('ff').$render()).toBe('0xff');
		expect(ir.number.octal('17').$render()).toBe('0o17');
		expect(ir.number.binary('101').$render()).toBe('0b101');
	});

	it('the second parameter chooses the other spelling for each base', () => {
		expect(ir.number.hex('FF', { prefix: '0X' }).$render()).toBe('0XFF');
		expect(ir.number.octal('17', { prefix: '0O' }).$render()).toBe('0O17');
		expect(ir.number.binary('101', { prefix: '0B' }).$render()).toBe('0B101');
	});

	it('a prefix of another base is not admitted', () => {
		expect(() => ir.number.hex('ff', { prefix: '0o' as never })).toThrow(/does not match/);
	});
});
