/**
 * Tests for `diagnoseSlotGrouping` — three-shape violation detection.
 *
 * Shapes:
 *   1. multi-slot-nested-seq   — countSlots≥2 nested seq (not already a group)
 *   2. supertype-list          — repeat/repeat1 of single non-field-named symbol/supertype
 *   3. repeat-choice-with-literal — repeat(choice(..., literal, ...))
 *
 * Already-field-named or already-group nodes are silent.
 */

import { describe, it, expect } from 'vitest';
import { diagnoseSlotGrouping } from './diagnose-slot-grouping.ts';
import type { SlotGroupingDiagnostic } from './diagnose-slot-grouping.ts';

// Rule helpers (simplified rules — no wrapper nodes in production path)
const sym = (name: string) => ({ type: 'symbol', name }) as any;
const str = (v: string) => ({ type: 'string', value: v }) as any;
const seq = (...m: any[]) => ({ type: 'seq', members: m }) as any;
const choice = (...m: any[]) => ({ type: 'choice', members: m }) as any;
const repeat = (content: any) => ({ type: 'repeat', content }) as any;
const repeat1 = (content: any) => ({ type: 'repeat1', content }) as any;
const fieldWrap = (name: string, content: any) => {
	// In simplified rules, field is pushed down to fieldName on the content.
	// We model this by attaching fieldName to the content node.
	return { ...content, fieldName: name };
};

describe('diagnoseSlotGrouping — multi-slot-nested-seq', () => {
	it('repeat(seq(sym a, sym b)) → one multi-slot-nested-seq record', () => {
		const rule = repeat(seq(sym('a'), sym('b')));
		const records = diagnoseSlotGrouping({ foo: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.shape).toBe('multi-slot-nested-seq');
		expect(records[0]!.ownerKind).toBe('foo');
		expect(records[0]!.slotCount).toBe(2);
	});

	it('repeat(seq(str comma, sym a)) → no diagnostic (single slot)', () => {
		// Only 1 slot (the sym); the string is terminal.
		const rule = repeat(seq(str(','), sym('a')));
		const records = diagnoseSlotGrouping({ bar: rule as any });
		expect(records).toHaveLength(0);
	});

	it('nested seq(sym a, sym b) inside another seq → both flagged', () => {
		// Parent seq: seq(sym x, inner_seq(sym a, sym b))
		// - outer seq has 3 slots (sym x + inner_seq distributes to sym a + sym b = 3)
		// - inner seq has 2 slots (sym a + sym b = 2)
		// Both fire as multi-slot-nested-seq records.
		const inner = seq(sym('a'), sym('b'));
		const rule = seq(sym('x'), inner);
		const records = diagnoseSlotGrouping({ baz: rule as any });
		const multiSlot = records.filter((r) => r.shape === 'multi-slot-nested-seq');
		// Outer seq (3 slots) AND inner seq (2 slots) both have ≥2 → 2 records.
		expect(multiSlot).toHaveLength(2);
		const slotCounts = multiSlot.map((r) => r.slotCount).sort();
		expect(slotCounts).toEqual([2, 3]);
	});
});

describe('diagnoseSlotGrouping — supertype-list', () => {
	it('repeat(sym _type) → supertype-list', () => {
		const rule = repeat(sym('_type'));
		const records = diagnoseSlotGrouping({ tuple_type: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.shape).toBe('supertype-list');
		expect(records[0]!.ownerKind).toBe('tuple_type');
	});

	it('repeat1(sym _expression) → supertype-list', () => {
		const rule = repeat1(sym('_expression'));
		const records = diagnoseSlotGrouping({ expr_list: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.shape).toBe('supertype-list');
	});

	it('field-named repeat(sym) is SILENT (already named)', () => {
		// When the symbol carries fieldName, it is already field-named → silent.
		const rule = repeat({ type: 'symbol', name: '_type', fieldName: 'type' } as any);
		const records = diagnoseSlotGrouping({ named: rule as any });
		expect(records).toHaveLength(0);
	});
});

describe('diagnoseSlotGrouping — repeat-choice-with-literal', () => {
	it('repeat(choice(sym a, str comma)) → repeat-choice-with-literal', () => {
		const rule = repeat(choice(sym('a'), str(',')));
		const records = diagnoseSlotGrouping({ obj: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.shape).toBe('repeat-choice-with-literal');
	});

	it('repeat(choice(sym a, sym b)) → supertype-list (no literals)', () => {
		// No literal in the choice → not repeat-choice-with-literal.
		// Two symbols in a choice = one union slot → supertype-list shape.
		const rule = repeat(choice(sym('a'), sym('b')));
		const records = diagnoseSlotGrouping({ union: rule as any });
		// choice(a, b) is a single union slot → supertype-list
		expect(records.filter((r) => r.shape === 'supertype-list')).toHaveLength(1);
	});
});

describe('diagnoseSlotGrouping — silent cases', () => {
	it('bare symbol is silent', () => {
		const rule = sym('expression');
		expect(diagnoseSlotGrouping({ x: rule as any })).toHaveLength(0);
	});

	it('seq of only literals is silent', () => {
		const rule = seq(str('('), str(')'));
		expect(diagnoseSlotGrouping({ x: rule as any })).toHaveLength(0);
	});
});
