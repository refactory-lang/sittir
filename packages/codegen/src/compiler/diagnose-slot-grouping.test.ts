/**
 * Tests for `diagnoseSlotGrouping` — three-shape violation detection.
 *
 * Shapes:
 *   1. multi-slot-nested-seq   — countSlots≥2 seq in a genuine slot-creating position
 *      (inside repeat/optional, or top-level body of an inline-listed auto-group
 *      helper kind). Choice arms are SUPPRESSED (choice-distributed = handled by
 *      collectSlots union semantics, NOT a genuine group-lift violation).
 *   2. supertype-list          — repeat/repeat1 of single non-field-named symbol/supertype
 *   3. repeat-choice-with-literal — repeat(choice(..., literal, ...))
 *
 * KEY INVARIANT: the top-level rule body of a NORMAL grammar kind is NOT a
 * "slot" — it is the kind itself. Shape ① fires only at slot-creating positions.
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

describe('diagnoseSlotGrouping — multi-slot-nested-seq', () => {
	it('repeat(seq(sym a, sym b)) → one multi-slot-nested-seq record', () => {
		// repeat sets slot position; inner seq IS in a slot position
		const rule = repeat(seq(sym('a'), sym('b')));
		const records = diagnoseSlotGrouping({ foo: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.code).toBe('multi-slot-nested-seq');
		expect(records[0]!.ownerKind).toBe('foo');
		expect(records[0]!.slotCount).toBe(2);
	});

	it('repeat(seq(str comma, sym a)) → no diagnostic (single slot)', () => {
		// Only 1 slot (the sym); the string is terminal.
		const rule = repeat(seq(str(','), sym('a')));
		const records = diagnoseSlotGrouping({ bar: rule as any });
		expect(records).toHaveLength(0);
	});

	it('top-level rule body seq(field_a, field_b) → SILENT (not in slot position)', () => {
		// A plain multi-field rule body is NOT a slot — it is the rule itself.
		// Bug 1 regression: must not fire for normal grammar kinds.
		const rule = seq(
			{ type: 'symbol', name: 'left', fieldName: 'left' },
			{ type: 'symbol', name: 'right', fieldName: 'right' }
		);
		const records = diagnoseSlotGrouping({ assignment_expression: rule as any });
		expect(records).toHaveLength(0);
	});

	it('repeat(seq(field_a, field_b)) inside a rule → fires (slot position)', () => {
		// The seq is inside a repeat's content → slot position → should fire.
		const rule = repeat(seq(
			{ type: 'symbol', name: 'a', fieldName: 'a' },
			{ type: 'symbol', name: 'b', fieldName: 'b' }
		));
		const records = diagnoseSlotGrouping({ some_list: rule as any });
		expect(records.filter((r) => r.code === 'multi-slot-nested-seq')).toHaveLength(1);
	});

	it('auto-group helper body seq fires when kind is in inlineKinds', () => {
		// An auto-group helper like _parent_repeat1 has its body at the top level,
		// but since it's in inlineKinds, its body IS in slot position.
		const rule = seq(sym('a'), sym('b'));
		const inlineKinds = new Set(['_parent_repeat1']);
		const records = diagnoseSlotGrouping({ _parent_repeat1: rule as any }, inlineKinds);
		expect(records).toHaveLength(1);
		expect(records[0]!.code).toBe('multi-slot-nested-seq');
	});

	it('auto-group helper body seq is SILENT when NOT in inlineKinds', () => {
		// Same rule shape, but not in inlineKinds → treated as normal kind → silent.
		const rule = seq(sym('a'), sym('b'));
		const records = diagnoseSlotGrouping({ _parent_repeat1: rule as any });
		expect(records).toHaveLength(0);
	});

	it('already-registered visible group kind → SILENT (not in inlineKinds)', () => {
		// Bug 2 regression: visible groups like _attributed_argument are not
		// in inlineKinds → their top-level body must NOT fire.
		const rule = seq(
			{ type: 'symbol', name: 'attribute_item', multiplicity: 'array' },
			{ type: 'symbol', name: '_expression' }
		);
		// Not in inlineKinds → treated as normal grammar kind → silent.
		const records = diagnoseSlotGrouping({ _attributed_argument: rule as any });
		expect(records).toHaveLength(0);
	});

	it('seq inside a choice arm → SILENT (choice-distributed, not genuine group-lift)', () => {
		// choice(seq(sym a, sym b), seq(sym c, sym d)) — choice arms are slot position
		// per collectSlots, but the WHOLE choice is a single union slot boundary.
		// A multi-slot seq arm is NOT a genuine group-lift violation: the author does
		// NOT need to promote it — collectSlots already treats the choice as one slot.
		// Fix 3 (PR-P diagnostic narrowing): inChoiceArm=true suppresses checkSeq.
		const rule = choice(seq(sym('a'), sym('b')), seq(sym('c'), sym('d')));
		const records = diagnoseSlotGrouping({ choice_kind: rule as any });
		expect(records.filter((r) => r.code === 'multi-slot-nested-seq')).toHaveLength(0);
	});
});

describe('diagnoseSlotGrouping — supertype-list', () => {
	it('repeat(sym _type) → supertype-list', () => {
		const rule = repeat(sym('_type'));
		const records = diagnoseSlotGrouping({ tuple_type: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.code).toBe('supertype-list');
		expect(records[0]!.ownerKind).toBe('tuple_type');
	});

	it('repeat1(sym _expression) → supertype-list', () => {
		const rule = repeat1(sym('_expression'));
		const records = diagnoseSlotGrouping({ expr_list: rule as any });
		expect(records).toHaveLength(1);
		expect(records[0]!.code).toBe('supertype-list');
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
		expect(records[0]!.code).toBe('repeat-choice-with-literal');
	});

	it('repeat(choice(sym a, sym b)) → supertype-list (no literals)', () => {
		// No literal in the choice → not repeat-choice-with-literal.
		// Two symbols in a choice = one union slot → supertype-list shape.
		const rule = repeat(choice(sym('a'), sym('b')));
		const records = diagnoseSlotGrouping({ union: rule as any });
		// choice(a, b) is a single union slot → supertype-list
		expect(records.filter((r) => r.code === 'supertype-list')).toHaveLength(1);
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

	it('multi-field rule body seq(sym, sym) is silent (not in slot position)', () => {
		// binary_expression body: seq(left, operator, right) — 3 slots but
		// it's the rule body, not a nested seq in a slot position.
		const rule = seq(sym('left'), sym('operator'), sym('right'));
		expect(diagnoseSlotGrouping({ binary_expression: rule as any })).toHaveLength(0);
	});
});

describe('diagnoseSlotGrouping — polymorph skip-set', () => {
	// PolymorphRule was removed in PR-M-φ2; buildPolymorphSkipSet now always returns
	// an empty set. Form kinds are treated as regular rules.

	it('unknown rule type (e.g. legacy type: polymorph) is SILENT', () => {
		// An unknown rule type hits the default case in walkRule and produces no
		// diagnostic. This is a defensive check for any legacy/synthetic rule objects.
		const unknownRule = {
			type: 'polymorph',
			source: 'promoted',
			forms: [
				{ name: 'numeric', content: seq(sym('value'), sym('unit')) },
				{ name: 'string', content: seq(sym('quote'), sym('body')) },
			],
		};
		// A rule with an unrecognized type should not fire any diagnostic.
		const records = diagnoseSlotGrouping({ binary_expression: unknownRule as any });
		expect(records).toHaveLength(0);
	});

	it('non-polymorph structural choice with seq arms is SILENT (choice-distributed)', () => {
		// A regular choice with multi-slot seq arms is also suppressed by Fix 3 —
		// the polymorph skip-set does not affect this; the choice-arm position guard does.
		// collectSlots already treats the whole choice as one union slot boundary.
		const rule = choice(seq(sym('a'), sym('b')), seq(sym('c'), sym('d')));
		const records = diagnoseSlotGrouping({ structural_kind: rule as any });
		expect(records.filter((r) => r.code === 'multi-slot-nested-seq')).toHaveLength(0);
	});

	it('repeat-helper auto-group case unchanged (rust regression guard)', () => {
		// Simulates a _parent_repeat1 helper in inlineKinds with multi-slot body.
		// This must still fire — it is NOT a polymorph form.
		const rule = seq(sym('a'), sym('b'));
		const inlineKinds = new Set(['_foo_repeat1']);
		const records = diagnoseSlotGrouping({ _foo_repeat1: rule as any }, inlineKinds);
		expect(records).toHaveLength(1);
		expect(records[0]!.code).toBe('multi-slot-nested-seq');
	});
});
