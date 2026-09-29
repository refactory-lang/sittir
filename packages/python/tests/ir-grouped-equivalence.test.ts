/**
 * SC-012 on python — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('python ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		expect(py.build.statement.if).toBe(py.build.ifStatement);
		expect(py.build.statement.if.strict).toBe(py.build.ifStatement.strict);
	});

	it('covers known supertypes with at least one member', () => {
		const groups = ['statement', 'expression'] as const;
		for (const g of groups) {
			const obj = py.build[g] as Record<string, unknown>;
			expect(Object.keys(obj).length).toBeGreaterThan(0);
		}
	});
});
