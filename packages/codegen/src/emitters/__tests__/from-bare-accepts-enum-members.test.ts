import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { AssembledBranch, AssembledEnum, AssembledPattern, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { bareAcceptClosure } from '../from.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

/**
 * Mirrors typescript's `function_declaration.return_type`: the slot admits
 * only the wrapper `type_annotation`, whose sole slot is the `_type`
 * supertype, one member of which is the enum `predefined_type`. A bare
 * member id (`TSKindId.StringKeyword`) given at the parent slot is what the
 * wrapper's slot admits, so rule 5 hoists it through the wrapper exactly as
 * it would a node — which needs the enum's member ids in the wrapper's
 * bare-accept set.
 */
const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: 'string_keyword', symbolName: 'predefined_type', literalText: 'string', anon: true },
	{ id: 2, kind: 'number_keyword', symbolName: 'predefined_type', literalText: 'number', anon: true },
	{ id: 3, kind: 'identifier', member: 'Identifier' },
	{ id: 4, kind: 'type_annotation', member: 'TypeAnnotation' },
	{ id: 5, kind: 'predefined_type', member: 'PredefinedType' }
];

function makeNodeMap() {
	const wrapperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: STRING, value: ':' },
			{ type: FIELD, name: 'type', content: { type: SYMBOL, name: '_type' } }
		]
	};
	const typeRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'predefined_type' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('type_annotation', new AssembledBranch('type_annotation', flatten(wrapperRule), flatten(wrapperRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set(
		'predefined_type',
		new AssembledEnum(
			'predefined_type',
			{
				type: CHOICE,
				members: [
					{ type: STRING, value: 'string' },
					{ type: STRING, value: 'number' }
				]
			},
			{ kindEntries: KIND_ENTRIES }
		)
	);
	nodes.set('_type', new AssembledSupertype('_type', typeRule, [{ name: 'identifier' }, { name: 'predefined_type' }]));
	return makeNodeMapWith(nodes);
}

describe('a wrapper over an enum-bearing slot accepts the enum members bare (rule 5)', () => {
	const nodeMap = makeNodeMap();

	it('the closure names the enum and each of its member kinds', () => {
		const accepted = bareAcceptClosure(nodeMap, KIND_ENTRIES).get('type_annotation');
		expect(accepted).toBeDefined();
		expect([...accepted!]).toEqual(
			expect.arrayContaining(['identifier', 'predefined_type', 'string_keyword', 'number_keyword'])
		);
	});

	it('the emitted _BARE_ACCEPTS row carries the member ids', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap, kindEntries: KIND_ENTRIES });
		expect(emitted).toContain('"type_annotation": new Set([1,2,3,5])');
	});
});
