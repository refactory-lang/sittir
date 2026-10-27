// A list slot whose elements are a hoisted group takes each element as the
// group's own config object.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyStrict = await createEngine(python, { api: 'strict' });

describe('an element group seated in a list slot', () => {
	it('takes each element as the group config', () => {
		const built = pyStrict.build.comparisonOperator({
			left: pyStrict.build.identifier('a'),
			comparators: [{ operators: py.kinds.EqEq, primaryExpression: pyStrict.build.identifier('b') }]
		});
		expect(built.$render()).toBe('a == b');
	});
});
