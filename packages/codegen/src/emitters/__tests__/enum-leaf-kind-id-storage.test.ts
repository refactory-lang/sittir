import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledPattern,
	AssembledSupertype,
	isFixedTextLeaf,
	isKindIdStored
} from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { classifyValueStorage, enumArmsOf, fieldTypeComponents, kindEnumOwnSymbolIds, resolveFieldStorageInfo } from '../shared.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

const kindEntries = [
	{ id: 1, kind: 'u8', symbolName: 'primitive_type', literalText: 'u8', anon: true },
	{ id: 2, kind: 'bool', symbolName: 'primitive_type', literalText: 'bool', anon: true }
];

// parameter: seq(field('type', $._type)); _type is a supertype over a pattern and
// an enum-of-literals — rust's `_type` → `_primitive_type`.
function makeNodeMap() {
	const rule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'type', content: { type: SYMBOL, name: '_type' } }]
	};
	const typeRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: '_primitive_type' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parameter', new AssembledBranch('parameter', flatten(rule), flatten(rule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set(
		'_primitive_type',
		new AssembledEnum(
			'_primitive_type',
			{ type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'bool' }] },
			{ kindEntries }
		)
	);
	nodes.set('_type', new AssembledSupertype('_type', typeRule, [{ name: 'identifier' }, { name: '_primitive_type' }]));
	return makeNodeMapWith(nodes);
}

describe('an enum leaf is kind-id-stored', () => {
	it('the model stamps it, and it is not a fixed-text leaf', () => {
		const node = makeNodeMap().nodes.get('_primitive_type')!;
		expect(isKindIdStored(node)).toBe(true);
		expect(isFixedTextLeaf(node)).toBe(false);
	});

	it('a reference to it stamps the member set', () => {
		const nodeMap = makeNodeMap();
		const storage = classifyValueStorage(
			{ node: nodeMap.nodes.get('_primitive_type')!, multiplicity: 'single' },
			nodeMap
		);
		expect(storage).toEqual({
			via: 'kindId',
			kind: '_primitive_type',
			members: [
				{ kind: 'u8', kindId: 1, text: 'u8' },
				{ kind: 'bool', kindId: 2, text: 'bool' }
			]
		});
	});

	it('a slot reaching it through a supertype classifies mixedEnum over the members', () => {
		const nodeMap = makeNodeMap();
		const slot = nodeMap.nodes.get('parameter')!.slots.find((s) => s.name === 'type')!;
		const info = resolveFieldStorageInfo(slot, nodeMap);
		expect(info.kind).toBe('mixedEnum');
		expect(info.enumKinds).toEqual(['u8', 'bool']);
		expect([...info.enumKindsById.entries()]).toEqual([
			['u8', 1],
			['bool', 2]
		]);
	});

	it('the type components of a direct enum slot list one literal per member', () => {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [{ type: FIELD, name: 'type', content: { type: SYMBOL, name: '_primitive_type' } }]
		};
		const nodeMap = makeNodeMap();
		nodeMap.nodes.set('typed', new AssembledBranch('typed', flatten(rule), flatten(rule)));
		const slot = nodeMap.nodes.get('typed')!.slots.find((s) => s.name === 'type')!;
		expect(fieldTypeComponents(slot, nodeMap)).toEqual([
			{ kind: 'literal', value: 'u8', rawKind: 'u8', resolvedKindId: 1, immediate: undefined },
			{ kind: 'literal', value: 'bool', rawKind: 'bool', resolvedKindId: 2, immediate: undefined }
		]);
	});
});

const wrapKindEntries: KindEnumEntry[] = [
	{ id: 1, kind: 'u8', member: 'U8', symbolName: 'primitive_type', literalText: 'u8', anon: true },
	{ id: 2, kind: 'bool', member: 'Bool', symbolName: 'primitive_type', literalText: 'bool', anon: true },
	{ id: 3, kind: 'holder', member: 'Holder' },
	{ id: 4, kind: 'identifier', member: 'Identifier' }
];

// holder: seq(field('name', choice($.identifier, $.<enumKind>))) — a mixed slot
// whose enum arm is a parser symbol of its own (typescript's predefined_type).
function makeMixedEnumNodeMap(enumKind: string) {
	const rule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'name',
				content: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'identifier' },
						{ type: SYMBOL, name: enumKind }
					]
				}
			}
		]
	};
	const nodeMap = makeNodeMap();
	nodeMap.nodes.set('holder', new AssembledBranch('holder', flatten(rule), flatten(rule), { kindEntries: wrapKindEntries }));
	nodeMap.nodes.set(
		enumKind,
		new AssembledEnum(
			enumKind,
			{ type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'bool' }] },
			{ kindEntries }
		)
	);
	const slot = nodeMap.nodes.get('holder')!.slots.find((s) => s.name === 'name')!;
	for (const value of slot.values) Object.assign(value, { storageKindId: 346 });
	return { nodeMap, slot };
}

describe('a visible enum leaf reads as its own parser symbol', () => {
	it('the walk records the enum symbol of a visible enum arm', () => {
		const { nodeMap, slot } = makeMixedEnumNodeMap('primitive_type');
		expect(enumArmsOf(slot, nodeMap).ownSymbolIds).toEqual([346]);
		expect(kindEnumOwnSymbolIds(slot, nodeMap)).toEqual([346]);
	});

	it('the wrap projection folds a read enum node onto its member id by text', () => {
		const { nodeMap } = makeMixedEnumNodeMap('primitive_type');
		const source = emitWrap({ grammar: 'synth', nodeMap, kindEntries: wrapKindEntries });
		expect(source).toContain('ownSymbols?.includes(entry.$type) && typeof entry.$text === "string"');
		expect(source).toMatch(/projectMixedEnumStorage\([\s\S]*?\{ "?u8"?: 1, "?bool"?: 2 \}, undefined, \[346\]/);
	});
});
