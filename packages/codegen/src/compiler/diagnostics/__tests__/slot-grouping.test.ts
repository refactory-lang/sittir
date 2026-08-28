/**
 * Tests for `diagnoseSlotGrouping`'s multi-slot-nested-seq shape — a
 * countSlots≥2 seq in a genuine slot-creating position (the top-level body
 * of an inline-listed auto-group helper kind, or a choice arm). Choice arms
 * are SUPPRESSED (choice-distributed = handled by collectSlots union
 * semantics, NOT a genuine group-lift violation).
 *
 * KEY INVARIANT: the top-level rule body of a NORMAL grammar kind is NOT a
 * "slot" — it is the kind itself. The shape fires only at slot-creating
 * positions.
 *
 * A repeat/optional/field-wrapped multi-slot seq never reaches this walker in
 * the first place: flatten() converts those wrappers into `multiplicity`/
 * `fieldName` attributes on the leaf they wrapped, and a multi-field repeated
 * body is hoisted to its own named kind (referenced by symbol) well before
 * simplify's canonical-shape pass runs — so the walker has no REPEAT/REPEAT1/
 * OPTIONAL/FIELD case to dispatch on. `diagnoseSlotGrouping`'s other shape,
 * content-collision, is covered separately in grammar-diagnostics.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { diagnoseSlotGrouping } from '../slot-grouping.ts';

// Rule helpers (simplified rules — no wrapper nodes in production path)
const sym = (name: string) => ({ type: 'SYMBOL', name }) as any;
const str = (v: string) => ({ type: 'STRING', value: v }) as any;
const seq = (...m: any[]) => ({ type: 'SEQ', members: m }) as any;
const choice = (...m: any[]) => ({ type: 'CHOICE', members: m }) as any;

describe('diagnoseSlotGrouping — multi-slot-nested-seq', () => {
	it('top-level rule body seq(field_a, field_b) → SILENT (not in slot position)', () => {
		// A plain multi-field rule body is NOT a slot — it is the rule itself.
		// Bug 1 regression: must not fire for normal grammar kinds.
		const rule = seq(
			{ type: 'SYMBOL', name: 'left', fieldName: 'left' },
			{ type: 'SYMBOL', name: 'right', fieldName: 'right' }
		);
		const records = diagnoseSlotGrouping({ assignment_expression: rule as any });
		expect(records).toHaveLength(0);
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
			{ type: 'SYMBOL', name: 'attribute_item', multiplicity: 'array' },
			{ type: 'SYMBOL', name: '_expression' }
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
	//
	// A former case here ("unknown rule type (e.g. legacy type: polymorph) is
	// SILENT") constructed a `type: 'polymorph'` rule expecting the diagnostic
	// walk to gracefully no-op on it. That's no longer satisfiable:
	// rule-patterns.ts's ruleChildren (used transitively by isContentSlot/countContentSlots)
	// is exhaustive over every real AnyRule variant and throws via assertNever
	// on anything outside it — deliberately, so a genuinely-retired shape like
	// `polymorph` resurfacing anywhere is a loud bug signal, not silently
	// swallowed. Removed rather than fixed — no fixture can satisfy both
	// "must not throw on unknown input" and "must assertNever on unknown input".

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
