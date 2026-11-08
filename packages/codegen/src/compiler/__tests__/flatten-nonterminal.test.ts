/**
 * flatten's `nonterminal` stamping: `nonterminal` is the one slot switch.
 *  - repeat / repeat1 → nonterminal: true (array slot, even over a literal)
 *  - optional → nonterminal: true only when the content is slot-shaped
 *  - field / alias never change terminality
 *  - flattenRules stamps nonterminal: false on literals, layout tokens, and
 *    references to a literal rule, except a lone field whose stored kind the
 *    parser names
 */

import {
	ALIAS,
	DEDENT,
	FIELD,
	INDENT,
	NEWLINE,
	OPTIONAL,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SYMBOL
} from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { flatten, flattenRules, storedNamedOf } from '../flatten.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
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
		expect(flatten({ type: ALIAS, named: true, value: 't', content: sym('y') })).toMatchObject({
			aliasedTo: 't',
			nonterminal: true
		});
		expect(flatten({ type: ALIAS, named: false, value: 't', content: str(',') }).nonterminal).toBe(false);
	});

	it('a literal aliased to a named symbol is a slot: the parser produces a node for it', () => {
		expect(flatten({ type: ALIAS, named: true, value: 't', content: str(',') })).toMatchObject({
			aliasedTo: 't',
			nonterminal: true
		});
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
				members: [
					str('&'),
					sym('kw'),
					sym('lit_seq'),
					sym('ident'),
					{ type: INDENT },
					{ type: DEDENT },
					{ type: NEWLINE }
				]
			}
		}, () => false);
		const owner = out['owner']!;
		expect(owner.type).toBe(SEQ);
		const members = (owner as { members: Rule[] }).members;
		expect(members.map((m) => m.nonterminal)).toEqual([false, false, false, true, false, false, false]);
	});

	it('a wrapper stamp wins over the literal-reference stamp', () => {
		const out = flattenRules({
			kw: str('mut'),
			kw2: str('ref'),
			owner: {
				type: SEQ,
				members: [
					{ type: OPTIONAL, content: sym('kw') },
					{ type: REPEAT, content: sym('kw2') }
				]
			}
		}, () => false);
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
		}, () => false);
		const owner = out['owner'] as { type: string; members: Rule[] };
		expect(owner.type).toBe(SEQ);
		const op = owner.members[1] as { type: string; fieldName?: string; members: Rule[] };
		expect(op.type).toBe('CHOICE');
		expect(op.fieldName).toBe('operator');
		expect((op as { nonterminal?: boolean }).nonterminal).toBe(true);
		expect(op.members.map((m) => [(m as { name: string }).name, m.nonterminal])).toEqual([
			['amp', false],
			['pipe', false]
		]);
	});

	it("a permutation choice folds to one seq of optional members in the first arm's order", () => {
		const out = flattenRules({
			declare: str('declare'),
			owner: {
				type: 'CHOICE',
				members: [
					{ type: SEQ, members: [sym('declare'), { type: OPTIONAL, content: sym('access') }] },
					{ type: SEQ, members: [sym('access'), { type: OPTIONAL, content: sym('declare') }] }
				]
			} as Rule
		}, () => false);
		const owner = out['owner'] as { type: string; members: Rule[] };
		expect(owner.type).toBe(SEQ);
		expect(owner.members.map((m) => [(m as { name: string }).name, m.multiplicity, m.nonterminal])).toEqual([
			['declare', 'optional', true],
			['access', 'optional', true]
		]);
	});

	it("a fielded literal arm whose field no other arm of the choice carries is a slot: it records which arm was taken", () => {
		const out = flattenRules({
			comma: str(','),
			plus: str('+'),
			minus: str('-'),
			owner: { type: SEQ, members: [sym('chevron'), { type: 'CHOICE', members: [{ type: FIELD, name: 'arguments', content: sym('list') }, { type: FIELD, name: 'trailing_comma', content: sym('comma') }] }] } as Rule,
			shared: { type: SEQ, members: [sym('left'), { type: 'CHOICE', members: [{ type: FIELD, name: 'operator', content: sym('plus') }, { type: FIELD, name: 'operator', content: sym('minus') }] }, sym('right')] } as Rule
		}, () => false);
		const arms = (rule: string) => ((out[rule] as { members: Rule[] }).members[1] as { members: Rule[] }).members.map((m) => [m.fieldName, m.nonterminal]);
		expect(arms('owner')).toEqual([['arguments', true], ['trailing_comma', true]]);
		expect(arms('shared')).toEqual([['operator', false], ['operator', false]]);
	});

	it('a fielded reference to a literal stays terminal', () => {
		const out = flattenRules({
			kw: str('in'),
			owner: { type: SEQ, members: [sym('left'), { type: FIELD, name: 'operator', content: sym('kw') }, sym('right')] }
		}, () => false);
		const members = (out['owner'] as { members: Rule[] }).members;
		expect(members[1]).toMatchObject({ fieldName: 'operator', nonterminal: false });
	});

	it('a lone fielded reference to a literal whose stored kind the parser names stays a slot; a shared label stays text', () => {
		const out = flattenRules({
			self: str('self'),
			kw: str('in'),
			owner: { type: SEQ, members: [{ type: FIELD, name: 'receiver', content: sym('self') }, { type: FIELD, name: 'operator', content: sym('kw') }, sym('right')] },
			shared: { type: SEQ, members: [sym('left'), { type: 'CHOICE', members: [{ type: FIELD, name: 'operator', content: sym('self') }, { type: FIELD, name: 'operator', content: sym('kw') }] }] } as Rule
		}, (ref) => ref.name === 'self');
		const owner = (out['owner'] as { members: Rule[] }).members;
		expect(owner.slice(0, 2).map((m) => [m.fieldName, m.nonterminal])).toEqual([['receiver', true], ['operator', false]]);
		const shared = ((out['shared'] as { members: Rule[] }).members[1] as { members: Rule[] }).members;
		expect(shared.map((m) => [m.fieldName, m.nonterminal])).toEqual([['operator', false], ['operator', false]]);
	});

	it('a lone fielded layout token stays text even when the parser names its stored kind', () => {
		const out = flattenRules({
			_layout: { type: 'CHOICE', members: [sym('_space'), sym('_newline')] } as Rule,
			_space: str(' '),
			_newline: str('\n'),
			decorator: { type: SEQ, members: [str('@'), { type: FIELD, name: 'expression', content: sym('expression') }, { type: FIELD, name: 'newline', content: sym('_newline') }] }
		}, () => true);
		const members = (out['decorator'] as { members: Rule[] }).members;
		expect(members.filter((m) => m.fieldName === 'newline').map((m) => m.nonterminal)).toEqual([false]);
	});

	it("reads the parser's named bit through the stored kind id and fails when a field has none", () => {
		const diagnostics = new DiagnosticSink();
		const named = storedNamedOf({ kindIds: { this: { id: 7, parser: { anon: false, hidden: false } as never }, in_keyword: { id: 8, parser: { anon: true, hidden: false } as never }, _formal_parameters: { id: 9, parser: { anon: false, hidden: true } as never }, formal_parameters: { id: 10, parser: { anon: false, hidden: false } as never } }, fieldIds: {}, folds: new Map(), sourceArtifact: 'test' }, diagnostics);
		expect(named({ type: SYMBOL, name: 'this', kindId: 7 }, 'owner')).toBe(true);
		expect(named({ type: SYMBOL, name: 'in_keyword', kindId: 8 }, 'owner')).toBe(false);
		expect(named({ type: SYMBOL, name: '_formal_parameters', kindId: 9 }, 'owner')).toBe(false);
		expect(named({ type: SYMBOL, name: '_formal_parameters', kindId: 9, aliasedTo: 'formal_parameters', aliasedToId: 10 }, 'owner')).toBe(true);
		expect(diagnostics.hasBlocking()).toBe(false);
		named({ type: SYMBOL, name: 'phantom', fieldName: 'name' }, 'owner');
		expect(diagnostics.all()).toMatchObject([{ code: 'field-kind-unstamped', severity: 'fail', details: { owner: 'owner', field: 'name', symbol: 'phantom' } }]);
	});

	it('a body that is one layout token keeps it as a slot; beside other parts it is fixed text', () => {
		const out = flattenRules({
			_layout: { type: 'CHOICE', members: [sym('_space'), sym('_newline')] } as Rule,
			_space: str(' '),
			_newline: str('\n'),
			empty: sym('_newline'),
			terminated: { type: SEQ, members: [sym('statement'), sym('_newline')] }
		}, () => false);
		expect(out['empty']).toMatchObject({ type: SYMBOL, name: '_newline', nonterminal: true });
		expect((out['terminated'] as { members: Rule[] }).members.map((m) => m.nonterminal)).toEqual([true, false]);
	});

	it('re-flattening keeps a stamped reference to a literal rule terminal', () => {
		const out = flattenRules({ dots: str('..'), bare: sym('dots') }, () => false);
		expect(out['bare']).toMatchObject({ type: SYMBOL, name: 'dots', nonterminal: false });
		expect(flatten(out['bare'] as Rule)).toMatchObject({ nonterminal: false });
	});

	it('re-flattening keeps every leaf stamp it is given', () => {
		const leaves: Rule[] = [
			{ ...str('a'), nonterminal: true },
			{ ...sym('x'), nonterminal: false },
			{ type: 'PATTERN', value: 'a', nonterminal: false } as Rule,
			{ type: NEWLINE, nonterminal: true } as Rule
		];
		expect(leaves.map((leaf) => flatten(leaf).nonterminal)).toEqual([true, false, false, true]);
	});
});
