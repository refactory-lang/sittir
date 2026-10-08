import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);

describe('singleton tuple patterns', () => {
	it('builds a tuple pattern with its semantic comma', () => {
		expect(py.build.tuplePattern('x').$render().toString()).toBe('(x,)');
	});

	it.each(['(x,) = y\n', '() = y\n', '(x, y) = z\n', '(a, b, c) = xs\n'])('preserves the parsed form of %s', (source) =>
		expect(py.parse(source, { errors: 'throw' }).$render().toString()).toBe(source)
	);
	it('rejects an uncommaed singleton tuple pattern', () => {
		expect(() => py.parse('(x) = y\n', { errors: 'throw' })).toThrow();
	});
});
