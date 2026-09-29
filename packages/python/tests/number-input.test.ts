// An integer builder takes a JavaScript number or bigint and writes the
// literal in the radix its sub-factory names.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('python number input', () => {
	it('writes hex from a number or a bigint', () => {
		expect(py.build.integer.hex(255).$render()).toBe('0xff');
		expect(py.build.integer.hex(255n).$render()).toBe('0xff');
	});
	it('keeps a bigint past the safe range exact', () => {
		expect(py.build.integer(12345678901234567890n).$render()).toBe('12345678901234567890');
	});
});
