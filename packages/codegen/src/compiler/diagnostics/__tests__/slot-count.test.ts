/**
 * Tests for `countSlots` — the shared slot-count primitive built on
 * `isNonterminalRuleType` (Table 1).
 *
 * Distribution semantics mirror `collectSlots`:
 *   - seq       → sum of member counts (distribute)
 *   - choice    → 1 (union slot — do NOT distribute)
 *   - symbol / supertype / pattern / enum → 1
 *   - field / optional / repeat / repeat1 → 1 boundary
 *   - variant / group / clause            → transparent recurse
 *   - string / terminal / indent / dedent / newline → 0
 */

import { describe, it, expect } from 'vitest';
import { countSlots } from '../slot-grouping.ts';
import { collectSlots, setUnnamedChoiceWarner } from '../../collect-slots.ts';
import { deleteWrapper } from '../../wrapper-deletion.ts';
import type { Rule } from '../../../types/rule.ts';
import { afterEach } from 'vitest';

const sym = (name: string) => ({ type: 'symbol', name }) as any;
const str = (v: string) => ({ type: 'string', value: v }) as any;
const seq = (...m: any[]) => ({ type: 'seq', members: m }) as any;
const choice = (...m: any[]) => ({ type: 'choice', members: m }) as any;
const repeat = (content: any) => ({ type: 'repeat', content }) as any;
const field = (fieldName: string, content: any) => ({ type: 'field', fieldName, content }) as any;

describe('countSlots — Table 1 distribution', () => {
	it('symbol = 1', () => expect(countSlots(sym('x'))).toBe(1));
	it('bare literal = 0', () => expect(countSlots(str(','))).toBe(0));
	it('seq distributes nested seq', () =>
		expect(countSlots(seq(str('('), seq(sym('a'), str(','), sym('b')), str(')')))).toBe(2));
	it('choice is ONE union slot (not distributed)', () =>
		expect(countSlots(choice(sym('a'), sym('b'), str('lit')))).toBe(1));
	it('literal-only choice still 1 slot', () =>
		expect(countSlots(choice(str('<'), str('>')))).toBe(1));
	it('field = 1', () => expect(countSlots(field('n', seq(sym('a'), sym('b'))))).toBe(1));
	it('repeat of single symbol = 1', () => expect(countSlots(repeat(sym('x')))).toBe(1));
	it('seq of only literals = 0', () => expect(countSlots(seq(str(','), str(';')))).toBe(0));
});

// ---------------------------------------------------------------------------
// Task 2: Convergence — countSlots(rule) === collectSlots(rule).length
//
// These cases use wrapper-free simplified rules (no field/optional/repeat
// wrappers — exactly the shape collectSlots receives from production).
// Structural choices (arms with multi-member seqs AND distinct named fields)
// are intentionally excluded: collectSlots distributes them into per-arm
// slots (multi-slot expansion), while countSlots counts them as 1 (the
// union-slot model). The diagnostic operates on the structural seq / repeat /
// symbol layer, not on structural-choice arms.
// ---------------------------------------------------------------------------

function slotsLen(rule: Rule): number {
	// Suppress unnamed-choice warnings in convergence tests.
	setUnnamedChoiceWarner(() => {});
	const result = collectSlots(deleteWrapper(rule) as Rule);
	setUnnamedChoiceWarner((kind) => console.warn(`unnamed choice slot: ${kind ?? '(unknown)'}`));
	return result.length;
}

describe('countSlots ≡ collectSlots.length (convergence)', () => {
	afterEach(() => {
		setUnnamedChoiceWarner((kind) => console.warn(`unnamed choice slot: ${kind ?? '(unknown)'}`));
	});

	it('multi-slot nested seq: seq(sym a, sym b) → 2', () => {
		const rule = seq(sym('a'), str(','), sym('b'));
		expect(countSlots(rule)).toBe(2);
		expect(slotsLen(rule)).toBe(2);
	});

	it('field-named choice: field(operator, choice(+, -)) → 1', () => {
		// The field wrapper is a slot boundary; collectSlots receives it wrapper-free
		// (deleteWrapper pushes field down to fieldName attr on the choice).
		const rule = field('operator', choice(str('+'), str('-')));
		expect(countSlots(rule)).toBe(1);
		expect(slotsLen(rule)).toBe(1);
	});

	it('symbol with array multiplicity (repeat-pushed-down) → 1', () => {
		// repeat pushed down to a symbol leaf with multiplicity='array' by
		// deleteWrapper. Both sides count it as 1 array slot.
		const rule: Rule = {
			type: 'symbol',
			name: '_type',
			multiplicity: 'array',
		} as any;
		expect(countSlots(rule)).toBe(1);
		expect(slotsLen(rule)).toBe(1);
	});

	it('seq(sym, str, sym): two symbols around a literal → 2', () => {
		const rule = seq(sym('left'), str('+'), sym('right'));
		expect(countSlots(rule)).toBe(2);
		expect(slotsLen(rule)).toBe(2);
	});

	it('bare symbol: 1', () => {
		const rule = sym('expression');
		expect(countSlots(rule)).toBe(1);
		expect(slotsLen(rule)).toBe(1);
	});

	it('seq of only strings: 0', () => {
		const rule = seq(str('('), str(')'));
		expect(countSlots(rule)).toBe(0);
		expect(slotsLen(rule)).toBe(0);
	});
});
