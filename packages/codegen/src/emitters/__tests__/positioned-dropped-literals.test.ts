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
