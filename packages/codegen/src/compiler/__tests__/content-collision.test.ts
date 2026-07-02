/**
 * §4c content-collision counting — `countContentSlots` counts the UNNAMED
 * nonterminal slots a rule body yields that resolve to the generic `content`
 * storage name. >1 on one node means they'd share the `_content` key (an
 * unemittable ambiguity) → at least one needs a `field()` name.
 *
 * Key subtleties exercised here:
 *   - a FIELD-NAMED seq is ONE named slot, NOT distributed into;
 *   - a single unnamed symbol is named by its kind (not `content`);
 *   - a string literal inside a choice IS a slot value (makes the choice
 *     unnamed-multi → `content`).
 */
import { describe, it, expect } from 'vitest';
import { countContentSlots } from '../diagnostics/slot-grouping.ts';
import type { Rule } from '../../types/rule.ts';

const sym = (name: string): Rule => ({ type: 'SYMBOL', name }) as unknown as Rule;
const str = (value: string): Rule => ({ type: 'STRING', value }) as unknown as Rule;
const choice = (...members: Rule[]): Rule => ({ type: 'CHOICE', members }) as unknown as Rule;
const seq = (members: Rule[], fieldName?: string): Rule =>
	({ type: 'SEQ', members, ...(fieldName !== undefined ? { fieldName } : {}) }) as unknown as Rule;

describe('countContentSlots — §4c content-collision', () => {
	it('counts 2 for an unnamed seq of two unnamed multi-kind choices (_class_body_member shape)', () => {
		// seq(choice(member kinds…), choice(_semicolon | ',')) → both content.
		const rule = seq([choice(sym('a'), sym('b')), choice(sym('_semicolon'), str(','))]);
		expect(countContentSlots(rule)).toBe(2);
	});

	it('does NOT distribute a FIELD-NAMED seq (object_type shape → 0, not 3)', () => {
		// seq(opening, field=members seq(choice, choice), closing) — opening/closing
		// are single named kinds, the members seq is field-named (one slot).
		const members = seq([choice(sym('a'), sym('b')), choice(sym('c'), sym('d'))], 'members');
		const rule = seq([sym('_object_type_opening'), members, sym('_object_type_closing')]);
		expect(countContentSlots(rule)).toBe(0);
	});

	it('a single unnamed multi-kind choice is ONE content slot (sanctioned, no collision)', () => {
		expect(countContentSlots(choice(sym('a'), sym('b')))).toBe(1);
	});

	it('a single unnamed symbol is named by its kind, not content', () => {
		expect(countContentSlots(sym('expression'))).toBe(0);
	});

	it('a field-named choice is not content', () => {
		const c = { type: 'CHOICE', fieldName: 'operator', members: [sym('a'), sym('b')] } as unknown as Rule;
		expect(countContentSlots(c)).toBe(0);
	});
});
