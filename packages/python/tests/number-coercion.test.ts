import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('a number given to an integer or float arm is written in its base', () => {
	it('decimal, hex and float', () => {
		expect(py.build.integer.decimal(255).$render()).toBe('255');
		expect(py.build.integer.hex(255).$render()).toBe('0xff');
		expect(py.build.float.point(1.5).$render()).toBe('1.5');
	});
	it('a bare number picks the arm its text fits', () => {
		expect(py.build.list([1, 1.5]).$render()).toBe('[1, 1.5]');
	});
});
