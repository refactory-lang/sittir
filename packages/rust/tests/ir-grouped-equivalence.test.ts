/**
 * SC-012: grouped sub-namespace access produces identical output to flat access.
 *
 * `ir.expression.binary(config)` and `ir.binaryExpression(config)` must resolve to the
 * same factory bundle — same callable, same `.strict` attachment.
 * (The flat `ir.*` already uses supertype-stripped short keys; the grouped
 * surface mirrors those under `ir.<supertype>.<member>`.)
 */
import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		const irExpression = rs.build.expression;
		// `ir.binaryExpression` (flat) and `ir.expression.binary` (grouped) point
		// at the same _attach bundle.
		expect(irExpression.binary).toBe(rs.build.binaryExpression);
		expect(irExpression.binary.strict).toBe(rs.build.binaryExpression.strict);
	});

	it('produces structurally identical output via flat vs grouped', () => {
		const irExpression = rs.build.expression;
		// ADR-0018 Phase 2: $type must be numeric TSKindId (string $type removed in Phase D).
		// binary_expression.operator now carries the merged operator union, so grouped
		// and flat IR entry points must agree when the same explicit operator is passed.
		const leaf = { $type: rs.kinds.IntegerLiteral, $text: '1' } as any;
		const leaf2 = { $type: rs.kinds.IntegerLiteral, $text: '2' } as any;
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
