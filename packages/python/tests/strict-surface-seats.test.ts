// A list slot whose elements are a hoisted group takes each element as the
// group's own config object.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('an element group seated in a list slot', () => {
	it('takes each element as the group config', () => {
		const built = py.build.comparisonOperator.strict({
			left: py.build.identifier('a'),
			comparators: [{ operators: py.kinds.EqEq, primaryExpression: py.build.identifier('b') }]
		});
		expect(built.$render()).toBe('a == b');
	});
});
