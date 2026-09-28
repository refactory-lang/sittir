import { PATTERN, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledPattern, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { SupertypeRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flattenedVariantParents } from '../overlays/module.ts';

function leaf(kind: string): AssembledPattern {
	const node = new AssembledPattern(kind, { type: PATTERN, value: '[a-z]+' });
	node.userFacing = true;
	return node;
}

function nodeMapWith(parent: string, leafKinds: readonly string[]) {
	const arms = ['alpha', 'beta'];
	const rule = {
		type: SUPERTYPE,
		name: parent,
		subtypes: arms.map((name) => ({ type: SYMBOL, name, annotations: { variant: name, variantOf: parent } }))
	} as unknown as SupertypeRule;
	const nodes = new Map<string, AssembledNode>();
	nodes.set(parent, new AssembledSupertype(parent, rule, arms.map((name) => ({ name, variant: name, variantOf: parent }))) as unknown as AssembledNode);
	for (const kind of new Set([...arms, ...leafKinds])) nodes.set(kind, leaf(kind));
	return makeNodeMapWith(nodes);
}

describe('a flattened parent whose key is also a flat leaf key', () => {
	it('takes that leaf as its default arm when the leaf is one of its arms', () => {
		const [parent] = flattenedVariantParents(nodeMapWith('_alpha', []));
		expect(parent?.key).toBe('alpha');
		expect(parent?.variants.map((route) => [route.name, route.default === true])).toEqual([
			['alpha', true],
			['beta', false]
		]);
	});

	it('throws when the leaf is not one of its arms', () => {
		expect(() => flattenedVariantParents(nodeMapWith('_word', ['word']))).toThrow(
			"ir: '_word' and the leaf 'word' both take the key 'word', and the leaf is not one of its arms"
		);
	});
});
