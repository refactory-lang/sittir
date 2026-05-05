import { describe, it, expect } from 'vitest';
import {
	deriveSlots,
	isNonEmpty,
	isMultiple
} from '../compiler/node-map.ts';
import type { Rule } from '../compiler/rule.ts';

// Helper — children-equivalent view over deriveSlots: kind-derived
// positional slots (source='inferred'). This regression test predates
// the Phase 1d.iv unification and was scoped to the children walker;
// the same expectations hold over the unified slots view.
function deriveChildren(rule: Rule) {
	return deriveSlots(rule).filter((s) => s.source === 'inferred');
}

/**
 * Regression: `seq(LIT, optional(repeat1(symbol, sep)), LIT)` (the canonical
 * lift of `seq('(', optional(commaSep1(X)), ')')`) used to produce a slot
 * marked `nonEmptyArray` even though the empty case `()` is valid input.
 *
 * The bug lived in `collectChildFromMember` (deriveChildren) and in the
 * mirror in `deriveValuesForRule`: the `optional` case recursed with
 * multiplicity 'optional', but the inner `repeat1` case unconditionally
 * recursed with 'nonEmptyArray' — clobbering the outer-optional semantics.
 * Result: every container with the optional-commaSep1 shape (python
 * `parameters`, ts `formal_parameters`, python `dotted_name` after
 * commaSep1 lift, etc.) had its factory generated as `_assertNonEmpty`-
 * gated, refusing to construct the empty form.
 *
 * Fix: when `optional` directly wraps `repeat1`, recurse with 'array'
 * instead — mirroring `fieldContentMultiplicity`'s field-level rule.
 */
describe('node-map — optional(repeat1(...)) multiplicity', () => {
	it('treats optional(repeat1(symbol, sep)) as array, not nonEmptyArray', () => {
		// Body shape after evaluate's commaSep1 lift:
		//   seq('(', optional(repeat1(parameter, sep=',')), ')')
		const rule: Rule = {
			type: 'seq',
			members: [
				{ type: 'string', value: '(' },
				{
					type: 'optional',
					content: {
						type: 'repeat1',
						content: { type: 'symbol', name: 'parameter' },
						separator: ','
					}
				},
				{ type: 'string', value: ')' }
			]
		};
		const children = deriveChildren(rule);
		expect(children).toHaveLength(1);
		const slot = children[0]!;
		expect(slot.name).toBe('parameter');
		expect(isMultiple(slot)).toBe(true);
		expect(isNonEmpty(slot)).toBe(false); // CRITICAL: outer optional makes empty valid
	});

	it('still treats bare repeat1(symbol) as nonEmptyArray', () => {
		// Sanity: removing the outer optional → nonEmpty signal must survive.
		const rule: Rule = {
			type: 'repeat1',
			content: { type: 'symbol', name: 'parameter' }
		};
		const children = deriveChildren(rule);
		expect(children).toHaveLength(1);
		expect(isNonEmpty(children[0]!)).toBe(true);
	});

	it('treats optional(repeat(symbol)) as array (unchanged behaviour)', () => {
		// Pre-existing repeat (not repeat1) inside optional: already 'array',
		// not affected by the fix. Asserted to lock the contract.
		const rule: Rule = {
			type: 'optional',
			content: {
				type: 'repeat',
				content: { type: 'symbol', name: 'parameter' }
			}
		};
		const children = deriveChildren(rule);
		expect(children).toHaveLength(1);
		expect(isMultiple(children[0]!)).toBe(true);
		expect(isNonEmpty(children[0]!)).toBe(false);
	});
});
