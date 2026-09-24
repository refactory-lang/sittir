import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('a registered spelling site leaves the config and takes an option', () => {
	it('the value stands alone and the prefix defaults to the registered arm', () => {
		expect(ir.integer.hex('ff').$render()).toBe('0xff');
		expect(ir.integer.hex.strict('ff').$render()).toBe('0xff');
		expect(ir.integer.hex(255).$render()).toBe('0xff');
	});

	it('the second parameter chooses the other spelling', () => {
		expect(ir.integer.hex('FF', { prefix: '0X' }).$render()).toBe('0XFF');
		expect(ir.integer.hex.strict('ff', { prefix: '0X' }).$render()).toBe('0Xff');
	});

	it('the setter for the option keeps the value', () => {
		expect(ir.integer.hex('ff').$with.prefix('0X').$render()).toBe('0Xff');
		expect(ir.integer.hex('ff', { prefix: '0X' }).$with.content('aa').$render()).toBe('0Xaa');
	});

	it('a spelling the site does not admit is rejected by the slot guard', () => {
		expect(() => ir.integer.hex('ff', { prefix: '0q' as never })).toThrow(/does not match/);
	});
});
