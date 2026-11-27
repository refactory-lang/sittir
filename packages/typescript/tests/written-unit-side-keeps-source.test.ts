import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { writeUnitSides } from '@sittir/common/utils';
import typescript from '../src/index.ts';

describe.each(['object', 'arena'] as const)("a side written to a parsed node's unit replaces its range of the source, and every other byte stays (%s storage)", async (nodeStorage) => {
	const engine = await sharedEngine(() => createEngine(typescript, { nodeStorage }));

	it('finds the unit of a node that shares its bytes with its parent by its kind', () => {
		const root = engine.parse('x  +=  1\n');
		const assignment = root.$query().$descendants.ofType(engine.kinds.AugmentedAssignmentExpression).at(0);
		if (assignment === undefined || typeof assignment !== 'object') throw new Error('expected an augmented assignment');
		writeUnitSides(assignment, [{ slot: '_operator', item: 0, leading: [engine.build.comment.block(' c ')] }]);
		const out = root.$render();
		expect(out).toBe('x  /* c */ +=  1\n');
		expect(engine.parse(out).$errors).toEqual([]);
	});
});
