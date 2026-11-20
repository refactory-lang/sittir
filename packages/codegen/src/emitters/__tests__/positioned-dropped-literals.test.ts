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
	seq(symbol('_for_initializer', 'initializer'), literal(';')),
	seq(symbol('_expressions', 'initializer'), literal(';')),
	symbol('empty_statement', 'initializer')
);
const node = { slots: [{ name: 'initializer', values: [{ multiplicity: 'single', kind: 'expression' }, { multiplicity: 'single', kind: 'lexical_declaration' }] }] } as never;

describe('positionedDroppedLiterals', () => {
	it('flags the `;` after the initializer when the template writes it nowhere beside that slot, though the same token is written elsewhere in the body', () => {
		const body = joined(slot('initializer'), slot('condition'), branches([{ test: 'condition', body: text(';') }], undefined));
		expect(positionedDroppedLiterals(forHeader, body, node)).toEqual([{ token: ';', side: 'after', slot: 'initializer' }, { token: ';', side: 'after', slot: 'initializer' }]);
	});

	it('is satisfied by a gated literal written straight after the slot when the gate admits every kind the slot holds', () => {
		const body = joined(slot('initializer'), branches([{ test: 'initializer', kinds: ['expression', 'lexical_declaration'], body: text(';') }], undefined), slot('condition'));
		expect(positionedDroppedLiterals(forHeader, body, node)).toEqual([]);
	});

	it('flags a literal gated on only some of the kinds the slot holds, since the others never reach it', () => {
		const body = joined(slot('initializer'), branches([{ test: 'initializer', kinds: ['expression'], body: text(';') }], undefined), slot('condition'));
		expect(positionedDroppedLiterals(forHeader, body, node)).toEqual([{ token: ';', side: 'after', slot: 'initializer' }, { token: ';', side: 'after', slot: 'initializer' }]);
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
