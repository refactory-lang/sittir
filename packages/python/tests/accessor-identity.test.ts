import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const SOURCE = 'def f(x, y=1):\n    return x\n\n\nclass C:\n    pass\n';

describe.each([
	['a shallow read', 1],
	['a deep read', Infinity]
])('an accessor on %s', (_, depth) => {
	const root = py.parse(SOURCE, { depth });
	const fn = root.statements()[0]!;
	if (!py.is.functionDefinition(fn)) throw new Error('expected a function definition');

	it('returns the same list each time', () => {
		expect(root.statements()).toBe(root.statements());
	});

	it('returns the same node each time, for a single child and a list item', () => {
		expect(root.statements()[0]).toBe(fn);
		expect(fn.body()).toBe(fn.body());
		expect(fn.parameters()).toBe(fn.parameters());
	});

	it('returns the same leaf each time', () => {
		expect(fn.name()).toBe(fn.name());
	});

	it('hands out a list that cannot be changed through', () => {
		expect(Object.isFrozen(root.statements())).toBe(true);
	});

	it('still renders the untouched source', () => {
		expect(root.$render()).toBe(SOURCE);
	});
});
