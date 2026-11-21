import { describe, expect, it } from 'vitest';
import { branches, type Body } from '../render-body.ts';
import { positionedDroppedLiterals } from '../templates.ts';
import type { RenderRule } from '../../types/rule.ts';

const literal = (value: string) => ({ type: 'STRING', value, nonterminal: false }) as unknown as RenderRule;
const symbol = (name: string, fieldName?: string) => ({ type: 'SYMBOL', name, ...(fieldName === undefined ? {} : { fieldName }) }) as unknown as RenderRule;
const seq = (...members: RenderRule[]) => ({ type: 'SEQ', members }) as unknown as RenderRule;
const choice = (...members: RenderRule[]) => ({ type: 'CHOICE', members }) as unknown as RenderRule;
const slot = (name: string): Body => [{ kind: 'slot', name }];
const text = (value: string): Body => [{ kind: 'text', text: value }];
const joined = (...bodies: Body[]): Body => bodies.flat();
const singleSlots = (...names: string[]) => ({ slots: names.map((name) => ({ name, values: [{ multiplicity: 'single' }] })) }) as never;

const forHeader = choice(
	seq(symbol('expression', 'initializer'), literal(';')),
	seq(symbol('lexical_declaration', 'initializer'), literal(';')),
	symbol('empty_statement', 'initializer')
);
const holding = (...kinds: string[]) => ({ slots: [{ name: 'initializer', values: kinds.map((kind) => ({ multiplicity: 'single', node: { kind } })) }] }) as never;
const node = holding('expression', 'lexical_declaration', 'empty_statement');

describe('positionedDroppedLiterals', () => {
	it('flags the `;` after the initializer when the template writes it nowhere beside that slot, though the same token is written elsewhere in the body', () => {
		const body = joined(slot('initializer'), slot('condition'), branches([{ test: 'condition', body: text(';') }], undefined));
		expect(positionedDroppedLiterals(forHeader, body, node)).toEqual([{ token: ';', side: 'after', slot: 'initializer' }, { token: ';', side: 'after', slot: 'initializer' }]);
	});

	it('is satisfied by gated literals that together cover each arm that requires the token', () => {
		const body = joined(
			slot('initializer'),
			branches([{ test: 'initializer', kinds: ['expression'], body: text(';') }, { test: 'initializer', kinds: ['lexical_declaration'], body: text(';') }], undefined),
			slot('condition')
		);
		expect(positionedDroppedLiterals(forHeader, body, node)).toEqual([]);
	});

	it('flags a literal gated on the kinds of one arm when another arm requires it too, since that arm\'s kinds never reach it', () => {
		const body = joined(slot('initializer'), branches([{ test: 'initializer', kinds: ['expression'], body: text(';') }], undefined), slot('condition'));
		expect(positionedDroppedLiterals(forHeader, body, node)).toEqual([{ token: ';', side: 'after', slot: 'initializer' }]);
	});

	it('does not require every arm\'s gate to admit the other arms\' kinds: each token is checked against its own arm', () => {
		const rule = choice(seq(symbol('identifier', 'value'), literal(';')), seq(symbol('number', 'value'), literal(',')));
		const body = joined(
			slot('value'),
			branches([{ test: 'value', kinds: ['identifier'], body: text(';') }, { test: 'value', kinds: ['number'], body: text(',') }], undefined)
		);
		const held = { slots: [{ name: 'value', values: ['identifier', 'number'].map((kind) => ({ multiplicity: 'single', node: { kind } })) }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([]);
	});

	it('flags a literal written only by the fallback of a gate whose arm takes the slot\'s kind first', () => {
		const rule = seq(symbol('identifier', 'value'), literal(';'));
		const body = joined(slot('value'), branches([{ test: 'value', kinds: ['identifier'], body: text(',') }], text(';')));
		const held = { slots: [{ name: 'value', values: [{ multiplicity: 'single', node: { kind: 'identifier' } }] }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([{ token: ';', side: 'after', slot: 'value' }]);
	});

	it('is satisfied by the fallback of a gate for a kind none of its arms take', () => {
		const rule = seq(symbol('number', 'value'), literal(';'));
		const body = joined(slot('value'), branches([{ test: 'value', kinds: ['identifier'], body: text(',') }], text(';')));
		const held = { slots: [{ name: 'value', values: [{ multiplicity: 'single', node: { kind: 'number' } }] }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([]);
	});

	it('flags a literal in an arm shadowed by an earlier arm for the same kind', () => {
		const rule = seq(symbol('identifier', 'value'), literal(';'));
		const body = joined(
			slot('value'),
			branches([{ test: 'value', kinds: ['identifier'], body: text(',') }, { test: 'value', kinds: ['identifier'], body: text(';') }], undefined)
		);
		const held = { slots: [{ name: 'value', values: [{ multiplicity: 'single', node: { kind: 'identifier' } }] }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([{ token: ';', side: 'after', slot: 'value' }]);
	});

	it('flags a literal gated on the presence of another slot, which a missing value of that slot skips', () => {
		const rule = seq(symbol('expression', 'initializer'), literal(';'));
		const body = joined(slot('initializer'), branches([{ test: 'condition', body: text(';') }], undefined), slot('condition'));
		const held = { slots: [{ name: 'initializer', values: [{ multiplicity: 'single', node: { kind: 'expression' } }] }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([{ token: ';', side: 'after', slot: 'initializer' }]);
	});

	it('credits a literal gated on another slot that the arm requiring it also holds', () => {
		const rule = seq(symbol('a', 'left'), symbol('b', 'right'), literal(','), symbol('c', 'value'));
		const body = joined(branches([{ test: 'left', body: joined(slot('left'), slot('right'), text(',')) }], undefined), slot('value'));
		expect(positionedDroppedLiterals(rule, body, singleSlots('left', 'right', 'value'))).toEqual([]);
	});

	it('does not credit a literal under the fallback of a gate on a required slot, nor one gated on only some kinds of it', () => {
		const rule = seq(symbol('a', 'left'), symbol('b', 'right'), literal(';'));
		const fallback = joined(slot('left'), slot('right'), branches([{ test: 'left', body: text(',') }], text(';')));
		expect(positionedDroppedLiterals(rule, fallback, singleSlots('left', 'right'))).toEqual([{ token: ';', side: 'after', slot: 'right' }]);
		const kinded = joined(slot('left'), slot('right'), branches([{ test: 'left', kinds: ['z'], body: text(';') }], undefined));
		expect(positionedDroppedLiterals(rule, kinded, singleSlots('left', 'right'))).toEqual([{ token: ';', side: 'after', slot: 'right' }]);
	});

	it('evaluates each arm of a choice on its own when the arms share a trailing slot', () => {
		const rule = choice(
			seq(symbol('a', 'left'), literal('x'), literal(';'), symbol('b', 'right')),
			seq(symbol('c', 'other'), literal('y'), literal(';'), symbol('b', 'right'))
		);
		const body = joined(
			branches(
				[
					{ test: 'left', body: joined(slot('left'), text('x'), text(';')) },
					{ test: 'other', body: joined(slot('other'), text('y'), text(';')) }
				],
				undefined
			),
			slot('right')
		);
		expect(positionedDroppedLiterals(rule, body, singleSlots('left', 'other', 'right'))).toEqual([]);
	});

	it('fails a body that omits the anchor slot for a kind the arm requires', () => {
		const rule = seq(symbol('a', 'value'), literal(';'));
		const body = joined(text(';'), branches([{ test: 'value', kinds: ['b'], body: slot('value') }], undefined));
		const held = { slots: [{ name: 'value', values: [{ multiplicity: 'single', node: { kind: 'a' } }] }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([{ token: ';', side: 'after', slot: 'value' }]);
	});

	it('takes the anchor\'s kinds from its own member of the arm, not from every arm of the slot', () => {
		const rule = choice(
			seq(symbol('a', 'value'), literal(';'), symbol('z', 'tail')),
			seq(symbol('b', 'value'), literal(','), symbol('z', 'tail'))
		);
		const body = joined(
			slot('value'),
			branches([{ test: 'value', kinds: ['a'], body: text(';') }, { test: 'value', kinds: ['b'], body: text(',') }], undefined),
			slot('tail')
		);
		const held = { slots: [{ name: 'value', values: ['a', 'b'].map((kind) => ({ multiplicity: 'single', node: { kind } })) }, { name: 'tail', values: [{ multiplicity: 'single' }] }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([]);
	});

	it('matches a gate on a supertype to the concrete kinds it stands for', () => {
		const rule = seq(symbol('identifier', 'value'), literal(';'));
		const body = joined(slot('value'), branches([{ test: 'value', kinds: ['_name'], body: text(';') }], undefined));
		const held = { slots: [{ name: 'value', values: [{ multiplicity: 'single', node: { kind: 'identifier' } }] }] } as never;
		const members = (kind: string): readonly string[] => (kind === '_name' ? ['identifier', 'number'] : [kind]);
		expect(positionedDroppedLiterals(rule, body, held, members)).toEqual([]);
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([{ token: ';', side: 'after', slot: 'value' }]);
	});

	it('judges each concrete kind a supertype stands for on its own: an earlier gate on one member shadows a later gate on the supertype for it', () => {
		const rule = choice(seq(symbol('identifier', 'value'), literal(';')), seq(symbol('_name', 'value'), literal(',')));
		const body = joined(
			slot('value'),
			branches([{ test: 'value', kinds: ['identifier'], body: text(';') }, { test: 'value', kinds: ['_name'], body: text(',') }], undefined)
		);
		const held = { slots: [{ name: 'value', values: ['identifier', '_name'].map((kind) => ({ multiplicity: 'single', node: { kind } })) }] } as never;
		const members = (kind: string): readonly string[] => (kind === '_name' ? ['identifier', 'number'] : [kind]);
		expect(positionedDroppedLiterals(rule, body, held, members)).toEqual([{ token: ',', side: 'after', slot: 'value' }]);
	});

	it('is satisfied by subtype gates that together cover a supertype', () => {
		const rule = seq(symbol('_name', 'value'), literal(';'));
		const body = joined(
			slot('value'),
			branches([{ test: 'value', kinds: ['identifier'], body: text(';') }, { test: 'value', kinds: ['number'], body: text(';') }], undefined)
		);
		const held = { slots: [{ name: 'value', values: [{ multiplicity: 'single', node: { kind: '_name' } }] }] } as never;
		const members = (kind: string): readonly string[] => (kind === '_name' ? ['identifier', 'number'] : [kind]);
		expect(positionedDroppedLiterals(rule, body, held, members)).toEqual([]);
	});

	it('credits a gate on another slot only when it holds for every kind that slot holds in the arm', () => {
		const rule = seq(symbol('_pick', 'left'), symbol('b', 'right'), literal(';'));
		const held = { slots: [{ name: 'left', values: ['a', 'b'].map((kind) => ({ multiplicity: 'single', node: { kind } })) }, { name: 'right', values: [{ multiplicity: 'single', node: { kind: 'b' } }] }] } as never;
		const members = (kind: string): readonly string[] => (kind === '_pick' ? ['a', 'b'] : [kind]);
		const partial = joined(slot('left'), slot('right'), branches([{ test: 'left', kinds: ['a'], body: text(';') }], undefined));
		expect(positionedDroppedLiterals(rule, partial, held, members)).toEqual([{ token: ';', side: 'after', slot: 'right' }]);
		const covering = joined(slot('left'), slot('right'), branches([{ test: 'left', kinds: ['_pick'], body: text(';') }], undefined));
		expect(positionedDroppedLiterals(rule, covering, held, members)).toEqual([]);
	});

	it('keeps the slots an enclosing sequence requires when it checks a token of a nested choice arm', () => {
		const rule = seq(symbol('a', 'left'), choice(seq(symbol('b', 'right'), literal(';')), seq(symbol('c', 'right'), literal(','))));
		const body = joined(
			branches(
				[{ test: 'left', body: joined(slot('left'), slot('right'), branches([{ test: 'right', kinds: ['b'], body: text(';') }, { test: 'right', kinds: ['c'], body: text(',') }], undefined)) }],
				undefined
			)
		);
		const held = { slots: [{ name: 'left', values: [{ multiplicity: 'single', node: { kind: 'a' } }] }, { name: 'right', values: ['b', 'c'].map((kind) => ({ multiplicity: 'single', node: { kind } })) }] } as never;
		expect(positionedDroppedLiterals(rule, body, held)).toEqual([]);
	});

	it('evaluates the body for every concrete kind of each tested slot, so a branch that only some kinds take is neither skipped nor assumed', () => {
		const rule = seq(symbol('_pick', 'left'), symbol('b', 'right'), literal(';'));
		const held = { slots: [{ name: 'left', values: ['a', 'b'].map((kind) => ({ multiplicity: 'single', node: { kind } })) }, { name: 'right', values: [{ multiplicity: 'single', node: { kind: 'b' } }] }] } as never;
		const members = (kind: string): readonly string[] => (kind === '_pick' ? ['a', 'b'] : [kind]);
		const comma = joined(slot('left'), slot('right'), branches([{ test: 'left', kinds: ['a'], body: text(',') }], text(';')));
		expect(positionedDroppedLiterals(rule, comma, held, members)).toEqual([{ token: ';', side: 'after', slot: 'right' }]);
		const apart = joined(slot('left'), slot('right'), branches([{ test: 'left', kinds: ['a'], body: text(';') }, { test: 'left', kinds: ['b'], body: text(';') }], undefined));
		expect(positionedDroppedLiterals(rule, apart, held, members)).toEqual([]);
	});

	it('groups the kinds of a slot that no gate tells apart, so many kinds neither explode the cases nor lift the check', () => {
		const kinds = Array.from({ length: 40 }, (_, i) => `k${i}`);
		const rule = seq(symbol('_l', 'left'), symbol('_r', 'right'), literal(';'), symbol('x', 'tail'));
		const members = (kind: string): readonly string[] => (kind === '_l' || kind === '_r' ? kinds : [kind]);
		const held = {
			slots: [
				{ name: 'left', values: [{ multiplicity: 'single', node: { kind: '_l' } }] },
				{ name: 'right', values: [{ multiplicity: 'single', node: { kind: '_r' } }] },
				{ name: 'tail', values: [{ multiplicity: 'single', node: { kind: 'x' } }] }
			]
		} as never;
		const late = joined(slot('left'), slot('right'), slot('tail'), text(';'));
		expect(positionedDroppedLiterals(rule, late, held, members)).toEqual([{ token: ';', side: 'after', slot: 'right' }]);
		const gated = joined(slot('left'), slot('right'), branches([{ test: 'left', kinds: ['k0'], body: text(';') }], undefined), slot('tail'));
		expect(positionedDroppedLiterals(rule, gated, held, members)).toEqual([{ token: ';', side: 'after', slot: 'right' }]);
	});

	it('does not anchor a literal to a fielded group whose members carry their own fields', () => {
		const group = { type: 'SEQ', fieldName: 'name', members: [symbol('prefix', 'prefix'), symbol('identifier', 'name')] } as unknown as RenderRule;
		const body = joined(text('('), slot('prefix'), slot('name'));
		expect(positionedDroppedLiterals(seq(literal('('), group), body, singleSlots('name', 'prefix'))).toEqual([]);
	});

	it('does not require an optional literal, which the canonical render omits, even when the same token is required elsewhere', () => {
		const optionalSemi = { type: 'STRING', value: ';', nonterminal: false, multiplicity: 'optional' } as unknown as RenderRule;
		const rule = seq(symbol('identifier', 'value'), optionalSemi, literal(','), symbol('identifier', 'other'), literal(';'));
		const body = joined(slot('value'), text(','), slot('other'), text(';'));
		expect(positionedDroppedLiterals(rule, body, singleSlots('value', 'other'))).toEqual([]);
	});

	it('leaves a token between the items of a list slot to the list, and a token a slot holds as a terminal value to the slot', () => {
		const listNode = { slots: [{ name: 'items', values: [{ multiplicity: 'multiple' }] }] } as never;
		expect(positionedDroppedLiterals(seq(symbol('x', 'items'), literal(','), symbol('x', 'items')), slot('items'), listNode)).toEqual([]);
		const held = { slots: [{ name: 'operator', values: [{ multiplicity: 'single', isTerminal: true, value: '+', type: 'STRING' }] }] } as never;
		expect(positionedDroppedLiterals(seq(symbol('x', 'left'), literal('+'), symbol('x', 'operator')), slot('operator'), held)).toEqual([]);
	});
});
