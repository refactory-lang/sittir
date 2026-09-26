import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledKeyword } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { computeFieldStorageInfo, isTextEnum, resolveFieldStorageInfo } from '../shared.ts';
import { interiorEnumArms, interiorOf } from '../interior.ts';

const suffixRule = {
	type: OPTIONAL,
	content: { type: FIELD, name: 'suffix', content: { type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'i8' }] } }
};
const interiorRule = {
	type: SEQ,
	members: [{ type: FIELD, name: 'content', content: { type: PATTERN, value: '[0-9]+' } }, suffixRule]
};

function nodeMapWith(lexed: boolean) {
	const flat = { ...(flatten(interiorRule as never) as object), ...(lexed ? { lexed: true } : {}) } as never;
	const nodes = new Map<string, AssembledNode>();
	nodes.set('integer_literal', new AssembledBranch('integer_literal', flat, flat));
	nodes.set('u8', new AssembledKeyword('u8', { type: STRING, value: 'u8' } as never));
	nodes.set('i8', new AssembledKeyword('i8', { type: STRING, value: 'i8' } as never));
	return makeNodeMapWith(nodes);
}

describe('an enum slot inside a lexed compound is text', () => {
	it('classifies as verbatim carrying its spellings, with no kind ids', () => {
		const nodeMap = nodeMapWith(true);
		computeFieldStorageInfo(nodeMap);
		const owner = nodeMap.nodes.get('integer_literal')!;
		const suffix = owner.slots.find((s) => s.name === 'suffix')!;
		const info = resolveFieldStorageInfo(suffix, nodeMap);
		expect(info.kind).toBe('verbatim');
		expect(info.texts).toEqual(['u8', 'i8']);
		expect(info.enumKinds).toEqual([]);
		expect(isTextEnum(info)).toBe(true);
	});

	it('the same slot on a compound that is not lexed keeps its enum storage', () => {
		const nodeMap = nodeMapWith(false);
		computeFieldStorageInfo(nodeMap);
		const suffix = nodeMap.nodes.get('integer_literal')!.slots.find((s) => s.name === 'suffix')!;
		expect(isTextEnum(resolveFieldStorageInfo(suffix, nodeMap))).toBe(false);
	});

	it('the interior guard alternation is the one the wrap pattern uses, longest spelling first', () => {
		expect(interiorEnumArms(['u8', 'u128', 'i8'])).toBe('u128|u8|i8');
		const interior = interiorOf(nodeMapWith(true).nodes.get('integer_literal')!)!;
		expect(interior.entries.some((e) => 'enum' in e && e.enum === 'suffix')).toBe(true);
	});
});
