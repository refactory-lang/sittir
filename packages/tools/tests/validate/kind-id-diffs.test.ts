import { describe, expect, it } from 'vitest';
import { kindIdDiffs } from '../../src/validate/from.ts';

describe('kindIdDiffs', () => {
	it('is empty for the same kind id', () => {
		expect(kindIdDiffs(7, 7)).toEqual([]);
	});

	it('names two different kind ids, so a wrong constant fails validation', () => {
		expect(kindIdDiffs(7, 8)).toEqual(['kind id 7 vs 8']);
	});

	it('names a kind id against a node', () => {
		expect(kindIdDiffs(7, { $type: 7 })).toHaveLength(1);
	});

	it('leaves two nodes to the structural diff', () => {
		expect(kindIdDiffs({ $type: 7 }, { $type: 8 })).toBeUndefined();
	});
});
