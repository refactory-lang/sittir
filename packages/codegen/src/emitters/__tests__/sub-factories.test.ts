import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import {
	armConfigKeys,
	choiceSlotOf,
	subFactoriesOf,
	type KindArm,
	type SubFactory
} from '../overlays/sub-factories.ts';

function kindArmOf(entries: readonly SubFactory[], name: string): KindArm {
	const entry = entries.find((e) => e.name === name);
	if (entry === undefined || entry.arm.via !== 'kind') throw new Error(`no kind arm named '${name}'`);
	return entry.arm;
}

// ---------------------------------------------------------------------------
// Synthetic grammars.
//
// `comment: choice(comment_doc, comment_plain)` — `doc_comment`/`plain_comment`
// as sketched in the spec don't share the `comment_` prefix `armName` keys
// off of, so the arms are renamed `comment_doc`/`comment_plain` to exercise
// the intended `<parent>_<suffix>` naming convention. `logic` is declared
// first in each grammar's rule map because `link` only keeps rules reachable
// from the first-declared rule.
// ---------------------------------------------------------------------------

function commentNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		comment: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'comment_doc' },
				{ type: SYMBOL, name: 'comment_plain' }
			]
		},
		comment_doc: {
			type: SEQ,
			members: [
				{ type: STRING, value: '///' },
				{ type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }
			]
		},
		comment_plain: {
			type: SEQ,
			members: [
				{ type: STRING, value: '//' },
				{ type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }
			]
		}
	};
	return buildNodeMap(rules);
}

function logicNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		logic: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: FIELD,
					name: 'op',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'and' },
							{ type: STRING, value: 'or' }
						]
					}
				},
				{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		identifier: { type: PATTERN, value: '[a-z]+' }
	};
	return buildNodeMap(rules);
}

function pairNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		pair: {
			type: SEQ,
			members: [
				{
					type: FIELD,
					name: 'a',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'x' },
							{ type: STRING, value: 'y' }
						]
					}
				},
				{
					type: FIELD,
					name: 'b',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'm' },
							{ type: STRING, value: 'n' }
						]
					}
				}
			]
		}
	};
	return buildNodeMap(rules);
}

function flattenNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		grandparent: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'parent' },
				{ type: SYMBOL, name: 'leaf_a' }
			]
		},
		parent: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'leaf_a' },
				{ type: SYMBOL, name: 'leaf_b' }
			]
		},
		leaf_a: { type: PATTERN, value: '[a-z]+' },
		leaf_b: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'identifier' } },
				{ type: FIELD, name: 'y', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		identifier: { type: PATTERN, value: '[0-9]+' }
	};
	return buildNodeMap(rules);
}

function ambiguousNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		grandparent_b: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'parent_x' },
				{ type: SYMBOL, name: 'parent_y' }
			]
		},
		parent_x: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'shared_leaf' },
				{ type: SYMBOL, name: 'other_x' }
			]
		},
		parent_y: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'shared_leaf' },
				{ type: SYMBOL, name: 'other_y' }
			]
		},
		shared_leaf: { type: PATTERN, value: '[a-z]+' },
		other_x: { type: PATTERN, value: '[0-9]+' },
		other_y: { type: PATTERN, value: '[0-9]+' }
	};
	return buildNodeMap(rules);
}

function collideNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		collide_parent: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'shared', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: FIELD,
					name: 'picked',
					content: {
						type: CHOICE,
						members: [
							{ type: SYMBOL, name: 'shape_a' },
							{ type: SYMBOL, name: 'shape_b' }
						]
					}
				}
			]
		},
		shape_a: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'shared', content: { type: SYMBOL, name: 'identifier' } },
				{ type: FIELD, name: 'extra', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		shape_b: { type: PATTERN, value: '[0-9]+' },
		identifier: { type: PATTERN, value: '[a-z]+' }
	};
	return buildNodeMap(rules);
}

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>): NodeMap {
	const raw: RawGrammar = {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		word: null,
		references: []
	};
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	return assemble(AssembleCtx.from(normalized));
}

describe('sub-factories — subFactoriesOf', () => {
	it('envelope with a kind-choice sole slot yields one kind arm per child', () => {
		const nodeMap = commentNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('comment')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['doc', 'plain']);
		expect(set.entries.every((e) => e.residual.length === 0)).toBe(true);
		expect(set.diagnostics).toEqual([]);
	});

	it('branch with an enum slot yields literal arms with the residual', () => {
		const nodeMap = logicNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('logic')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['and', 'or']);
		expect(set.entries[0]!.residual.map((f) => f.name).sort()).toEqual(['left', 'right']);
		expect(armConfigKeys(set.entries[0]!, nodeMap)).toEqual([]);
	});

	it('a kind with two choice slots is not eligible', () => {
		const nodeMap = pairNodeMap();
		expect(choiceSlotOf(nodeMap.nodes.get('pair')!)).toBeUndefined();
	});

	it('a grand-arm flattens onto the grandparent, and a direct arm wins over a flattened one of the same name', () => {
		const nodeMap = flattenNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('grandparent')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['leafA', 'leafB', 'parent']);
		expect(set.diagnostics).toEqual([]);

		const leafA = kindArmOf(set.entries, 'leafA');
		expect(leafA.path).toEqual([]);
		expect(leafA.child.kind).toBe('leaf_a');

		const leafB = kindArmOf(set.entries, 'leafB');
		expect(leafB.path).toEqual(['leafB']);
		expect(leafB.child.kind).toBe('parent');
		expect(armConfigKeys(set.entries.find((e) => e.name === 'leafB')!, nodeMap)).toEqual(['x', 'y']);
	});

	it('two flattened claimants for the same name produce an ambiguous diagnostic naming both full paths', () => {
		const nodeMap = ambiguousNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('grandparent_b')!, nodeMap);
		expect(set.entries.some((e) => e.name === 'sharedLeaf')).toBe(false);
		expect(set.diagnostics).toEqual([
			{
				parent: 'grandparent_b',
				name: 'sharedLeaf',
				reason: 'ambiguous',
				claimants: ['parent_x.sharedLeaf', 'parent_y.sharedLeaf']
			}
		]);
	});

	it('a config-shaped arm whose configKey collides with a residual slot is dropped with a slot-collision diagnostic', () => {
		const nodeMap = collideNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('collide_parent')!, nodeMap);
		expect(set.entries.map((e) => e.name)).toEqual(['shapeB']);
		expect(set.diagnostics).toEqual([
			{ parent: 'collide_parent', name: 'shapeA', reason: 'slot-collision', claimants: ['shape_a'] }
		]);
	});
});
