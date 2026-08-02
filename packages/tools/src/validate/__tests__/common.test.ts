import { describe, expect, it } from 'vitest';
import { dedupeMismatchesByContainment } from '../common.ts';

describe('dedupeMismatchesByContainment', () => {
	it('drops an ancestor mismatch whose span strictly contains a descendant mismatch in the same entry', () => {
		const outer = { entry: 'e1', start: 0, end: 20, kind: 'tuple_expression' };
		const inner = { entry: 'e1', start: 4, end: 10, kind: 'expression' };
		expect(dedupeMismatchesByContainment([outer, inner])).toEqual([inner]);
	});

	it('keeps both mismatches when spans are disjoint', () => {
		const a = { entry: 'e1', start: 0, end: 5, kind: 'a' };
		const b = { entry: 'e1', start: 6, end: 10, kind: 'b' };
		expect(dedupeMismatchesByContainment([a, b])).toEqual([a, b]);
	});

	it('keeps both mismatches when spans are equal (not a strict-containment relationship)', () => {
		const a = { entry: 'e1', start: 0, end: 10, kind: 'a' };
		const b = { entry: 'e1', start: 0, end: 10, kind: 'b' };
		expect(dedupeMismatchesByContainment([a, b])).toEqual([a, b]);
	});

	it('keeps identical spans across different entries — containment is scoped per entry', () => {
		const a = { entry: 'e1', start: 0, end: 20, kind: 'a' };
		const b = { entry: 'e2', start: 4, end: 10, kind: 'b' };
		expect(dedupeMismatchesByContainment([a, b])).toEqual([a, b]);
	});

	it('collapses a three-level ancestor chain to only the innermost mismatch', () => {
		const grandparent = { entry: 'e1', start: 0, end: 30, kind: 'program' };
		const parent = { entry: 'e1', start: 2, end: 20, kind: 'statement' };
		const child = { entry: 'e1', start: 4, end: 10, kind: 'expression' };
		expect(dedupeMismatchesByContainment([grandparent, parent, child])).toEqual([child]);
	});
});
