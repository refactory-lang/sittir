/**
 * SC-012: grouped sub-namespace access produces identical output to flat access.
 *
 * `ir.expression.binary(config)` and `ir.binaryExpression(config)` resolve to the
 * same entry, in the default engine's builder table and in the strict one.
 * (The flat `ir.*` already uses supertype-stripped short keys; the grouped
 * surface mirrors those under `ir.<supertype>.<member>`.)
 */
import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const rsStrict = await createEngine(rust, { api: 'strict' });

describe('ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		expect(rs.build.expression.binary).toBe(rs.build.binaryExpression);
		expect(rsStrict.build.expression.binary).toBe(rsStrict.build.binaryExpression);
	});

	it('produces structurally identical output via flat vs grouped', () => {
		const irExpression = rs.build.expression;
		// $type must be numeric TSKindId.
		// binary_expression.operator now carries the merged operator union, so grouped
		// and flat IR entry points must agree when the same explicit operator is passed.
		const leaf = rs.build.integerLiteral('1');
		const leaf2 = rs.build.integerLiteral('2');
		const flat = rs.build.binaryExpression({ left: leaf, operator: '&&', right: leaf2 });
		const grouped = irExpression.binary({ left: leaf, operator: '&&', right: leaf2 });
		expect(JSON.stringify(grouped)).toBe(JSON.stringify(flat));
	});

	it('covers every supertype with at least one member', () => {
		const groups = ['expression', 'pattern', 'type', 'statement'] as const;
		for (const g of groups) {
			const obj = rs.build[g] as Record<string, unknown>;
			expect(Object.keys(obj).length).toBeGreaterThan(0);
		}
	});
});
