// A list slot whose elements are a hoisted group takes each element as the
// group's own config object.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

describe('an element group seated in a list slot', () => {
	it('takes each element as the group config', () => {
		const built = ir.comparisonOperator.strict({
			left: ir.identifier('a'),
			comparators: [{ operators: TSKindId.EqEq, primaryExpression: ir.identifier('b') }]
		});
		expect(built.$render()).toBe('a == b');
	});
});
