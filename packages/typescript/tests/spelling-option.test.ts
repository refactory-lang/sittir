import { describe, it, expect } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('a registered spelling site leaves the config and takes an option', () => {
	it('the value stands alone and the prefix defaults to the registered arm', () => {
		expect(ts.build.number.hex('ff').$render()).toBe('0xff');
		expect(ts.build.number.octal('17').$render()).toBe('0o17');
		expect(ts.build.number.binary('101').$render()).toBe('0b101');
	});

	it('the second parameter chooses the other spelling for each base', () => {
		expect(ts.build.number.hex('FF', { prefix: '0X' }).$render()).toBe('0XFF');
		expect(ts.build.number.octal('17', { prefix: '0O' }).$render()).toBe('0O17');
		expect(ts.build.number.binary('101', { prefix: '0B' }).$render()).toBe('0B101');
	});

	it('a prefix of another base is not admitted', () => {
		expect(() => ts.build.number.hex('ff', { prefix: '0o' as never })).toThrow(/does not match/);
	});
});
