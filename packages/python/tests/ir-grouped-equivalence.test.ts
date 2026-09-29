/**
 * SC-012 on python — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest';
import { statement, expression } from '@sittir/python';
import python from '@sittir/python';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('python ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		// `statement.if` === `ir.statement.if` (reserved words are valid property keys).
		expect(py.build.statement.if).toBe(statement.if);
		expect(py.build.statement.if.strict).toBe(statement.if.strict);
	});

	it('grouped namespace attached to ir is the same object as standalone export', () => {
		expect(py.build.statement).toBe(statement);
		expect(py.build.expression).toBe(expression);
	});

	it('covers known supertypes with at least one member', () => {
		const groups = ['statement', 'expression'] as const;
		for (const g of groups) {
			const obj = py.build[g] as Record<string, unknown>;
			expect(Object.keys(obj).length).toBeGreaterThan(0);
		}
	});
});
