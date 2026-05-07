/**
 * SC-012 on python — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest';
import { ir, statement, expression } from '@sittir/python';

describe('python ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		// `statement.if` === `ir.statement.if` (reserved words are valid property keys).
		expect(ir.statement.if).toBe(statement.if);
		expect(ir.statement.if.from).toBe(statement.if.from);
	});

	it('grouped namespace attached to ir is the same object as standalone export', () => {
		expect(ir.statement).toBe(statement);
		expect(ir.expression).toBe(expression);
	});

	it('covers known supertypes with at least one member', () => {
		const groups = ['statement', 'expression'] as const;
		for (const g of groups) {
			const obj = ir[g] as Record<string, unknown>;
			expect(Object.keys(obj).length).toBeGreaterThan(0);
		}
	});
});
