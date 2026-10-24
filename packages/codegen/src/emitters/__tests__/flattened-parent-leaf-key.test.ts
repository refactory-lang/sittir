import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { PATTERN, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledPattern, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { SupertypeRule } from '../../types/rule.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flattenedVariantParents } from '../../compiler/model/ir-surface.ts';

function leaf(kind: string, kindEntries: readonly GeneratedKindEntry[]): AssembledPattern {
	const node = new AssembledPattern(kind, { type: PATTERN, value: '[a-z]+' }, { kindEntries });
	node.userFacing = true;
	return node;
}

function nodeMapWith(parent: string, leafKinds: readonly string[], kindEntries: readonly GeneratedKindEntry[]) {
	const arms = ['alpha', 'beta'];
	const rule = {
		type: SUPERTYPE,
		name: parent,
		declared: true,
		subtypes: arms.map((name) => ({ type: SYMBOL, name, annotations: { variant: name, variantOf: parent } }))
	} as unknown as SupertypeRule;
	const nodes = new Map<string, AssembledNode>();
	nodes.set(parent, new AssembledSupertype(parent, rule, arms.map((name) => ({ name, variant: name, variantOf: parent })), { kindEntries }) as unknown as AssembledNode);
	for (const kind of new Set([...arms, ...leafKinds])) nodes.set(kind, leaf(kind, kindEntries));
	return makeNodeMapWith(nodes);
}

describe('a flattened parent named like a flat leaf is refused at its kind-id member', () => {
	it('throws when the leaf is one of its arms', () => {
		expect(() => flattenedVariantParents(withGeneratedIdTables((kindEntries) => nodeMapWith('_alpha', [], kindEntries)).nodeMap)).toThrow("TSKindId: kinds '_alpha' and 'alpha' both name member 'Alpha'");
	});

	it('throws when the leaf is not one of its arms', () => {
		expect(() => flattenedVariantParents(withGeneratedIdTables((kindEntries) => nodeMapWith('_word', ['word'], kindEntries)).nodeMap)).toThrow("TSKindId: kinds '_word' and 'word' both name member 'Word'");
	});
});
