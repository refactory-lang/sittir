import { describe, expect, it } from 'vitest';
import { findInUntypedNode } from '../src/probe/kind.ts';

const names = new Map<number, string>([
	[1, 'program'],
	[2, 'identifier'],
	[3, 'other']
]);
const kindNameFromId = (id: number): string | undefined => names.get(id);

describe('findInUntypedNode', () => {
	it('matches a numeric $type through the catalog id, not by comparing a name to a number', () => {
		const leaf = { $type: 2 };
		const root = { $type: 1, _body: [{ $type: 3 }, leaf] };
		expect(findInUntypedNode(root, 'identifier', kindNameFromId)).toBe(leaf);
	});

	it('finds nothing for an absent kind', () => {
		expect(findInUntypedNode({ $type: 1 }, 'identifier', kindNameFromId)).toBeNull();
	});
});
