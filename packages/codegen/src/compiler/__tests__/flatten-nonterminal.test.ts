/**
 * flatten's `nonterminal` stamping: `nonterminal` is the one slot switch.
 *  - repeat / repeat1 → nonterminal: true (array slot, even over a literal)
 *  - optional → nonterminal: true only when the content is slot-shaped
 *  - field / alias never change terminality
 *  - flattenRules stamps nonterminal: false on literals, layout tokens, and
 *    references to a literal rule
 */

import { ALIAS, DEDENT, FIELD, INDENT, NEWLINE, OPTIONAL, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { flatten, flattenRules } from '../flatten.ts';
import type { Rule } from '../../types/rule.ts';

const sym = (name: string): Rule => ({ type: SYMBOL, name });
const str = (value: string): Rule => ({ type: STRING, value });

describe('wrapper nonterminal push-down', () => {
	it('field(symbol) → true (a symbol is nonterminal; the field is neutral)', () => {
		const out = flatten({ type: FIELD, name: 'x', content: sym('y') });
		expect(out).toMatchObject({ fieldName: 'x', nonterminal: true });
	});

	it('field(string) → false (a field does not make a literal a slot)', () => {
		const out = flatten({ type: FIELD, name: 'x', content: str('kw') });
		expect(out.nonterminal).toBe(false);
	});

	it('choice → nonterminal: true on the choice itself; arms keep their own stamps', () => {
		const out = flatten({ type: 'CHOICE', members: [str('a'), sym('y')] } as Rule);
		expect(out.nonterminal).toBe(true);
		expect((out as { members: Rule[] }).members.map((m) => m.nonterminal)).toEqual([false, true]);
	});

	it('seq → nonterminal iff any member is', () => {
		expect(flatten({ type: SEQ, members: [str('a'), str('b')] }).nonterminal).toBe(false);
		expect(flatten({ type: SEQ, members: [str('a'), sym('y')] }).nonterminal).toBe(true);
	});

	it('repeat(terminal) → nonterminal: true (array slot)', () => {
		const out = flatten({ type: REPEAT, content: str(',') });
		expect(out.nonterminal).toBe(true);
	});

	it('repeat1(terminal) → nonterminal: true (nonEmptyArray slot)', () => {
		const out = flatten({ type: REPEAT1, content: str(',') });
		expect(out.nonterminal).toBe(true);
	});

	it('optional(terminal) → stays false (no slot)', () => {
		const out = flatten({ type: OPTIONAL, content: str(',') });
		expect(out.nonterminal).toBe(false);
	});

	it('optional(symbol) → nonterminal: true (slot)', () => {
		const out = flatten({ type: OPTIONAL, content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('alias keeps the content terminality', () => {
		expect(flatten({ type: ALIAS, named: true, value: 't', content: sym('y') })).toMatchObject({ aliasedTo: 't', nonterminal: true });
		expect(flatten({ type: ALIAS, named: true, value: 't', content: str(',') }).nonterminal).toBe(false);
	});
});

describe('flattenRules terminality stamps', () => {
	it('literals, layout tokens, and references to a literal rule → nonterminal: false', () => {
		const out = flattenRules({
			kw: str('mut'),
			lit_seq: { type: SEQ, members: [str('raw'), str('mut')] },
			ident: { type: 'PATTERN', value: '[a-z]+' } as Rule,
			owner: {
				type: SEQ,
				members: [str('&'), sym('kw'), sym('lit_seq'), sym('ident'), { type: INDENT }, { type: DEDENT }, { type: NEWLINE }]
			}
		});
		const owner = out['owner']!;
		expect(owner.type).toBe(SEQ);
		const members = (owner as { members: Rule[] }).members;
		expect(members.map((m) => m.nonterminal)).toEqual([false, false, false, true, false, false, false]);
	});

	it('a wrapper stamp wins over the literal-reference stamp', () => {
		const out = flattenRules({
			kw: str('mut'),
			kw2: str('ref'),
			owner: { type: SEQ, members: [{ type: OPTIONAL, content: sym('kw') }, { type: REPEAT, content: sym('kw2') }] }
		});
		const members = (out['owner'] as { members: Rule[] }).members;
		expect(members.map((m) => m.nonterminal)).toEqual([true, true]);
	});

	it('a choice of seq arms differing at one position factors into a seq with a choice there', () => {
		const out = flattenRules({
			amp: str('&&'),
			pipe: str('||'),
			owner: {
				type: 'CHOICE',
				members: [
					{ type: SEQ, members: [sym('left'), { type: FIELD, name: 'operator', content: sym('amp') }, sym('right')] },
					{ type: SEQ, members: [sym('left'), { type: FIELD, name: 'operator', content: sym('pipe') }, sym('right')] }
				]
			} as Rule
		});
		const owner = out['owner'] as { type: string; members: Rule[] };
		expect(owner.type).toBe(SEQ);
		const op = owner.members[1] as { type: string; fieldName?: string; members: Rule[] };
		expect(op.type).toBe('CHOICE');
		expect(op.fieldName).toBe('operator');
		expect((op as { nonterminal?: boolean }).nonterminal).toBe(true);
		expect(op.members.map((m) => [(m as { name: string }).name, m.nonterminal])).toEqual([['amp', false], ['pipe', false]]);
	});

	it('a permutation choice folds to one seq of optional members in the first arm\'s order', () => {
		const out = flattenRules({
			declare: str('declare'),
			owner: {
				type: 'CHOICE',
				members: [
					{ type: SEQ, members: [sym('declare'), { type: OPTIONAL, content: sym('access') }] },
					{ type: SEQ, members: [sym('access'), { type: OPTIONAL, content: sym('declare') }] }
				]
			} as Rule
		});
		const owner = out['owner'] as { type: string; members: Rule[] };
		expect(owner.type).toBe(SEQ);
		expect(owner.members.map((m) => [(m as { name: string }).name, m.multiplicity, m.nonterminal])).toEqual([
			['declare', 'optional', true],
			['access', 'optional', true]
		]);
	});

	it('a fielded reference to a literal stays terminal', () => {
		const out = flattenRules({
			kw: str('in'),
			owner: { type: SEQ, members: [sym('left'), { type: FIELD, name: 'operator', content: sym('kw') }, sym('right')] }
		});
		const members = (out['owner'] as { members: Rule[] }).members;
		expect(members[1]).toMatchObject({ fieldName: 'operator', nonterminal: false });
	});
});
