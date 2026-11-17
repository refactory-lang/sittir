import { describe, expect, it } from 'vitest';
import { preference } from '../../dsl/primitives/preference.ts';
import { layoutSlots, renamedFromOf, slotModelOf } from '../index.ts';
import type { Rule } from '../../types/rule.ts';
import { CHOICE, FIELD, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts';

const RECORD = {
	nodes: [
		{
			kind: 'binary',
			modelType: 'branch',
			slots: [
				{ name: 'left', accessor: 'left', required: true, values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'expr' }] },
				{
					name: 'operator',
					accessor: 'operator',
					required: true,
					values: [
						{ kind: 'terminal', multiplicity: 'single', value: '+' },
						{ kind: 'node-ref', multiplicity: 'single', name: 'minus', parseKind: 'dash' }
					]
				},
				{ name: 'argument', accessor: 'arguments', multiple: true, values: [{ kind: 'node-ref', multiplicity: 'array', parseKind: 'expr' }] }
			]
		},
		{ kind: 'call_expression', renamedFrom: 'call', subtypes: [] },
		{
			kind: 'items',
			modelType: 'list',
			elementKinds: ['entry'],
			slots: [{ name: 'item', accessor: 'items', multiple: true, values: [{ kind: 'node-ref', multiplicity: 'array', name: 'item', parseKind: 'entry' }] }]
		}
	]
};

describe('slotModelOf', () => {
	it('reads each node\'s slots with their accessors and terminals, deriving the kinds the record leaves out', () => {
		const model = slotModelOf(RECORD, {});
		expect(model.get('binary')?.slots).toEqual([
			{ name: 'left', propertyName: 'left', required: true, multiple: false, storage: 'verbatim', kinds: ['expr'], terminals: [] },
			{ name: 'operator', propertyName: 'operator', required: true, multiple: false, storage: 'verbatim', kinds: ['minus'], terminals: ['+'] },
			{ name: 'argument', propertyName: 'arguments', required: false, multiple: true, storage: 'verbatim', kinds: ['expr'], terminals: [] }
		]);
		expect(model.get('items')).toMatchObject({ modelType: 'list', elementKinds: ['item'] });
		expect(model.get('call_expression')?.modelType).toBe('branch');
	});

	it('records the tokens every parse of a kind spells outside its slots', () => {
		const text = (value: string): Rule<'evaluate'> => ({ type: STRING, value });
		const rules: Record<string, Rule<'evaluate'>> = {
			lexed: { type: SEQ, members: [{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'x' } }, { type: TOKEN, content: text(';') }] },
			immediate: { type: SEQ, members: [text('#'), { type: 'IMMEDIATE_TOKEN', content: { type: 'PREC', value: 1, content: text('!') } }] },
			composite: { type: TOKEN, content: { type: SEQ, members: [text('a'), text('b')] } },
			either: { type: CHOICE, members: [{ type: SEQ, members: [text('('), text(')')] }, { type: SEQ, members: [text('('), text(','), text(')')] }] },
			maybe: { type: SEQ, members: [text('x'), { type: CHOICE, members: [text(';'), { type: 'BLANK' }] }] },
			hidden: { type: SEQ, members: [text('let'), { type: SYMBOL, name: '_semi' }] },
			typed: { type: SEQ, members: [text(':'), { type: SYMBOL, name: '_type' }] },
			_semi: text(';'),
			_type: text('int')
		};
		const kinds = ['lexed', 'immediate', 'composite', 'either', 'maybe', 'hidden', 'typed'];
		const model = slotModelOf({ nodes: kinds.map((kind) => ({ kind, modelType: 'branch' })) }, { rules, supertypes: ['_type'] });
		expect(Object.fromEntries(kinds.map((kind) => [kind, model.get(kind)?.spells]))).toEqual({
			lexed: [';'],
			immediate: ['#', '!'],
			composite: [],
			either: ['(', ')'],
			maybe: ['x'],
			hidden: ['let', ';'],
			typed: [':']
		});
	});
});

describe('renamedFromOf', () => {
	it('maps each renamed kind to its base kind', () => {
		expect(renamedFromOf(RECORD)).toEqual({ call_expression: 'call' });
	});
});

describe('layoutSlots', () => {
	it('names the slots an options block addresses, by owner or any, and no slot by its name alone', () => {
		const options = {
			gap: { before: preference('space') },
			_labels: { '_/attributes:': 'gap/before', 'binary/operator:': 'gap/before', 'block/"{"/after': 'gap/before' }
		};
		expect(layoutSlots(options, new Set(['binary', 'block']))).toEqual([
			{ kind: null, slot: 'attributes' },
			{ kind: 'binary', slot: 'operator' }
		]);
	});
});
