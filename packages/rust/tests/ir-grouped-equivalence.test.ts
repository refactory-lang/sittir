/**
 * SC-012: grouped sub-namespace access produces identical output to flat access.
 *
 * `ir.expression.binary(config)` and `ir.binary(config)` must resolve to the
 * same factory bundle — same factory function, same `.from` attachment.
 * (The flat `ir.*` already uses supertype-stripped short keys; the grouped
 * surface mirrors those under `ir.<supertype>.<member>`.)
 */
import { describe, expect, it } from 'vitest';
import { ir, expression, pattern } from '@sittir/rust';
import { TSKindId } from '../src/types.ts';

describe('ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		const irExpression = ir.expression as typeof expression;
		// `ir.binary` (flat) and `ir.expression.binary` (grouped) point
		// at the same _attach bundle.
		expect(irExpression.binary).toBe(ir.binary);
		expect(irExpression.binary.from).toBe(ir.binary.from);
	});

	it('grouped namespace attached to ir is the same object as standalone export', () => {
		expect(ir.expression).toBe(expression);
		expect(ir.pattern).toBe(pattern);
	});

	it('produces structurally identical output via flat vs grouped', () => {
		const irExpression = ir.expression as typeof expression;
		// ADR-0018 Phase 2: $type must be numeric TSKindId (string $type removed in Phase D).
		// binary_expression's `operator` is an AutoStamp field (excluded from Config —
		// factory derives it from the grammar). Pass only user-supplied fields: left + right.
		const leaf = { $type: TSKindId.IntegerLiteral, $text: '1' } as any;
		const leaf2 = { $type: TSKindId.IntegerLiteral, $text: '2' } as any;
		const flat = ir.binary({ left: leaf, right: leaf2 });
		const grouped = irExpression.binary({ left: leaf, right: leaf2 });
		expect(JSON.stringify(grouped)).toBe(JSON.stringify(flat));
	});

	it('covers every supertype with at least one member', () => {
		const groups = ['expression', 'pattern', 'type', 'statement'] as const;
		for (const g of groups) {
			const obj = ir[g] as Record<string, unknown>;
			expect(Object.keys(obj).length).toBeGreaterThan(0);
		}
	});
});
