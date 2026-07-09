/**
 * Tests for `collectSlots` — the nonterminal-node slot enumeration that
 * replaces the `deriveSlotsRaw` fold/merge/effectiveMultiplicity walker.
 *
 * Model (spec §2): walk a wrapper-free RenderRule; emit ONE
 * AssembledNonterminal per `nonterminal` node.
 *  - symbol / choice / pattern / enum (or push-down-stamped) → 1 slot.
 *  - choice = ONE union slot — arms are NOT recursed into separate slots.
 *  - seq → flatMap member slots (distribute; seq itself emits none).
 *  - non-nonterminal leaf → [].
 *
 * Witnesses are run through `deleteWrapper` first (production feeds
 * `collectSlots` wrapper-free input).
 */

import { CHOICE, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, afterEach } from 'vitest';
import { collectSlots, setUnnamedChoiceWarner } from '../collect-slots.ts';
import { deleteWrapper } from '../wrapper-deletion.ts';
import { isTerminalValue } from '../model/node-map.ts';
import type { Rule } from '../../types/rule.ts';

const sym = (name: string): Rule<'link'> => ({ type: SYMBOL, name });
const str = (value: string): Rule<'link'> => ({ type: STRING, value });

function slots(rule: Rule<'link'>) {
	return collectSlots(deleteWrapper(rule) as Rule);
}

describe('collectSlots — nonterminal-node enumeration', () => {
	afterEach(() => {
		// Restore the default console.warn-backed warner between tests.
		setUnnamedChoiceWarner((kind) => console.warn(`unnamed choice slot found in branch '${kind ?? '(unknown)'}'`));
	});

	it('field(body, symbol) → one body slot', () => {
		const out = slots({ type: FIELD, name: 'body', content: sym('_suite') });
		expect(out).toHaveLength(1);
		expect(out[0]!.name).toBe('body');
		expect(out[0]!.storageName).toBe('body');
		expect(out[0]!.values).toHaveLength(1);
		expect(out[0]!.values[0]!.multiplicity).toBe('single');
	});

	it('field(modifiers, repeat(string)) → one array slot (enum)', () => {
		// A repeat(terminal) becomes an array slot only when nameable — here
		// via the field wrapper. The bare unnamed `repeat(',')` has no name
		// source and elides (it is pure syntactic separation).
		const out = slots({ type: FIELD, name: 'modifiers', content: { type: REPEAT, content: str('kw') } });
		expect(out).toHaveLength(1);
		expect(out[0]!.name).toBe('modifiers');
		expect(out[0]!.values.every((v) => v.multiplicity === 'array')).toBe(true);
	});

	it('bare unnamed repeat(string) → [] (no name source, syntactic only)', () => {
		const out = slots({ type: REPEAT, content: str(',') });
		expect(out).toHaveLength(0);
	});

	it('optional(string) → [] (no slot)', () => {
		const out = slots({ type: OPTIONAL, content: str(',') });
		expect(out).toHaveLength(0);
	});

	it('optional(symbol) → one optional slot', () => {
		const out = slots({ type: OPTIONAL, content: sym('y') });
		expect(out).toHaveLength(1);
		expect(out[0]!.values[0]!.multiplicity).toBe('optional');
	});

	it('bare string leaf → [] (terminal, no slot)', () => {
		const out = slots(str(','));
		expect(out).toHaveLength(0);
	});

	it('comparison_operator inner seq: operators choice NOT folded into operand slot', () => {
		// seq{f:comparators, m:nonEmpty}( choice{f:operators}, symbol(primary_expression) )
		// → operators slot (choice) + a symbol slot; operators NOT folded in.
		const inner: Rule<'link'> = {
			type: REPEAT1,
			content: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'operators',
						content: {
							type: CHOICE,
							members: [str('<'), str('<='), str('=='), str('>')]
						}
					},
					sym('primary_expression')
				]
			}
		};
		const out = collectSlots(deleteWrapper(inner) as Rule);
		const names = out.map((s) => s.name);
		// operators is its OWN slot — not merged into the symbol slot.
		expect(names).toContain('operators');
		// the symbol member is its own distinct slot.
		expect(out.length).toBe(2);
		const operators = out.find((s) => s.name === 'operators')!;
		// operators slot holds the literal union (terminals), not folded away.
		expect(operators.values.every((v) => isTerminalValue(v))).toBe(true);
		expect(operators.values.map((v) => (v as { value: string }).value)).toEqual(['<', '<=', '==', '>']);
	});

	it('unnamed top-level choice → content slot + warning', () => {
		const warned: (string | undefined)[] = [];
		setUnnamedChoiceWarner((k) => warned.push(k));
		const rule: Rule<'link'> = { type: CHOICE, members: [sym('a'), sym('b')] };
		const out = collectSlots(deleteWrapper(rule) as Rule, 'my_kind');
		expect(out).toHaveLength(1);
		expect(out[0]!.name).toBe('content');
		expect(warned).toEqual(['my_kind']);
	});

	it('field-named choice → fieldName slot, no warning', () => {
		const warned: (string | undefined)[] = [];
		setUnnamedChoiceWarner((k) => warned.push(k));
		const rule: Rule<'link'> = { type: FIELD, name: 'value', content: { type: CHOICE, members: [sym('a'), sym('b')] } };
		const out = collectSlots(deleteWrapper(rule) as Rule, 'my_kind');
		expect(out).toHaveLength(1);
		expect(out[0]!.name).toBe('value');
		expect(warned).toEqual([]);
	});

	it('polymorph → content slot, no unnamed-choice warning', () => {
		const warned: (string | undefined)[] = [];
		setUnnamedChoiceWarner((k) => warned.push(k));
		const rule: Rule<'link'> = {
			type: 'polymorph',
			name: 'except_clause',
			forms: [
				{ name: 'as', content: sym('as_pattern') },
				{ name: 'list', content: sym('expression_list') }
			]
		} as unknown as Rule;
		const out = collectSlots(deleteWrapper(rule) as Rule, 'except_clause');
		expect(out).toHaveLength(1);
		expect(out[0]!.name).toBe('content');
		expect(warned).toEqual([]); // polymorph metadata is type-surface-only; no warn
	});

	it('seq distributes — two symbol members → two slots', () => {
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'left', content: sym('a') },
				{ type: FIELD, name: 'right', content: sym('b') }
			]
		};
		const out = collectSlots(deleteWrapper(rule) as Rule);
		expect(out.map((s) => s.name)).toEqual(['left', 'right']);
	});
});
