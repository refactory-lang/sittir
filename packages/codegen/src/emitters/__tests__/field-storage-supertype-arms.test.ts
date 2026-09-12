import { CHOICE, FIELD, PATTERN, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype
} from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { enumArmsOf, resolveFieldStorageInfo, kindEnumTextIdPairs } from '../shared.ts';

const kindEntries = [
	{ id: 1, kind: 'u8', symbolName: 'primitive_type', literalText: 'u8', anon: true },
	{ id: 2, kind: 'bool', symbolName: 'primitive_type', literalText: 'bool', anon: true },
	{ id: 3, kind: 'self', symbolName: 'self', literalText: 'self', anon: false, literalRule: true }
];

// token_tree: seq(field('tokens', repeat($._token))); _token is a supertype over
// a pattern, a keyword and an enum-of-literals — the shape of rust's
// `_delim_tokens` → `_non_special_token` → `token_tree_punctuation`.
function makeTokenTreeNodeMap() {
	const treeRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'tokens', content: { type: REPEAT, content: { type: SYMBOL, name: '_token' } } }]
	};
	const tokenRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'self' },
			{ type: SYMBOL, name: '_primitive_type' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('token_tree', new AssembledBranch('token_tree', flatten(treeRule), flatten(treeRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }, { kindEntries }));
	nodes.set(
		'_primitive_type',
		new AssembledEnum(
			'_primitive_type',
			{ type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'bool' }] },
			{ kindEntries }
		)
	);
	nodes.set(
		'_token',
		new AssembledSupertype('_token', tokenRule, [{ name: 'identifier' }, { name: 'self' }, { name: '_primitive_type' }])
	);
	return makeNodeMapWith(nodes);
}

describe('enum and keyword arms reached through a supertype', () => {
	it('enumArmsOf lists the enum members and the keyword, and notes the pattern as a node arm', () => {
		const nodeMap = makeTokenTreeNodeMap();
		const tree = nodeMap.nodes.get('token_tree')!;
		const slot = tree.slots.find((s) => s.name === 'tokens')!;
		const arms = enumArmsOf(slot, nodeMap);
		expect(arms.arms.map((a) => [a.kind, a.id, a.text])).toEqual([
			['self', 3, 'self'],
			['u8', 1, 'u8'],
			['bool', 2, 'bool']
		]);
		expect(arms.texts).toEqual(['self', 'u8', 'bool']);
		expect(arms.sawNodeArm).toBe(true);
		expect(arms.verbatim).toBe(false);
	});

	it('the slot classifies mixedEnum with the members as its enum kinds', () => {
		const nodeMap = makeTokenTreeNodeMap();
		const slot = nodeMap.nodes.get('token_tree')!.slots.find((s) => s.name === 'tokens')!;
		const info = resolveFieldStorageInfo(slot, nodeMap);
		expect(info.kind).toBe('mixedEnum');
		expect(info.enumKinds).toEqual(['self', 'u8', 'bool']);
		expect([...info.enumKindsById.entries()]).toEqual([
			['self', 3],
			['u8', 1],
			['bool', 2]
		]);
		expect(info.texts).toEqual(['self', 'u8', 'bool']);
	});

	it('the wrap text→id pairs come from the same walk', () => {
		const nodeMap = makeTokenTreeNodeMap();
		const slot = nodeMap.nodes.get('token_tree')!.slots.find((s) => s.name === 'tokens')!;
		expect(kindEnumTextIdPairs(slot, nodeMap, kindEntries)).toEqual([
			['self', 3],
			['u8', 1],
			['bool', 2]
		]);
	});
});
