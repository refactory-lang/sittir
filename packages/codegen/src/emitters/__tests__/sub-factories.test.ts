import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import {
	armConfigKeys,
	elementsSeatOf,
	flattenSeatOf,
	subFactoriesOf,
	type NodeArm,
	type SubFactory
} from '../overlays/sub-factories.ts';

function nodeArmOf(entries: readonly SubFactory[], name: string): NodeArm {
	const entry = entries.find((e) => e.name === name);
	if (entry === undefined || entry.arm.via !== 'node') throw new Error(`no node arm named '${name}'`);
	return entry.arm;
}

const label = (variantOf: string, variant: string) => ({ annotations: { variant, variantOf } });

function commentNodeMap(): NodeMap {
	return buildNodeMap({
		comment: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'comment_doc', ...label('comment', 'doc') },
				{ type: SYMBOL, name: 'comment_plain', ...label('comment', 'plain') }
			]
		},
		comment_doc: { type: SEQ, members: [{ type: STRING, value: '///' }, { type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }] },
		comment_plain: { type: SEQ, members: [{ type: STRING, value: '//' }, { type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }] }
	});
}

function logicNodeMap(labelled: boolean): NodeMap {
	const op = (value: string): Rule<'evaluate'> => ({ type: STRING, value, ...(labelled ? label('logic', value) : {}) });
	return buildNodeMap({
		logic: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' } },
				{ type: CHOICE, members: [op('and'), op('or')] },
				{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		identifier: { type: PATTERN, value: '[a-z]+' }
	});
}

function nestingNodeMap(): NodeMap {
	return buildNodeMap({
		grandparent: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'parent', ...label('grandparent', 'parent') },
				{ type: SYMBOL, name: 'leaf_a', ...label('grandparent', 'leaf_a') }
			]
		},
		parent: {
			type: SEQ,
			members: [
				{ type: STRING, value: '(' },
				{
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'leaf_a', ...label('parent', 'leaf_a') },
						{ type: SYMBOL, name: 'leaf_b', ...label('parent', 'leaf_b') }
					]
				},
				{ type: STRING, value: ')' }
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
	});
}

function ambiguousNodeMap(): NodeMap {
	return buildNodeMap({
		twice: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'first', ...label('twice', 'same') },
				{ type: SYMBOL, name: 'second', ...label('twice', 'same') }
			]
		},
		first: { type: PATTERN, value: '[a-z]+' },
		second: { type: PATTERN, value: '[0-9]+' }
	});
}

function collideNodeMap(): NodeMap {
	return buildNodeMap({
		collide_parent: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'shared', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'shape_a', ...label('collide_parent', 'shape_a') },
						{ type: SYMBOL, name: 'shape_b', ...label('collide_parent', 'shape_b') }
					]
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
	});
}

function supertypeNodeMap(): NodeMap {
	return buildNodeMap(
		{
			root: { type: SEQ, members: [{ type: SYMBOL, name: 'holder' }, { type: SYMBOL, name: 'fielded' }] },
			holder: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'hold' },
					{
						type: CHOICE,
						members: [
							{ type: SYMBOL, name: '_shape', ...label('holder', 'shape') },
							{ type: SYMBOL, name: 'other', ...label('holder', 'other') }
						]
					}
				]
			},
			fielded: { type: SEQ, members: [{ type: STRING, value: 'f' }, { type: FIELD, name: 'value', content: { type: SYMBOL, name: '_shape' } }] },
			_shape: {
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'circle', ...label('_shape', 'circle') },
					{ type: SYMBOL, name: 'square', ...label('_shape', 'square') }
				]
			},
			circle: { type: SEQ, members: [{ type: STRING, value: 'o' }, { type: FIELD, name: 'r', content: { type: PATTERN, value: '[0-9]+' } }] },
			square: { type: SEQ, members: [{ type: STRING, value: '#' }, { type: FIELD, name: 'side', content: { type: PATTERN, value: '[0-9]+' } }] },
			other: { type: PATTERN, value: '[a-z]+' }
		},
		{ supertypes: ['_shape'] }
	);
}

function inlineNodeMap(): NodeMap {
	const inlinedEnd = (): Rule<'evaluate'> => ({
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'semi', ...label('_end', 'semi') },
			{ type: SYMBOL, name: 'newline', ...label('_end', 'newline') }
		]
	});
	return buildNodeMap({
		root: { type: SEQ, members: [{ type: SYMBOL, name: 'statement' }, { type: SYMBOL, name: 'bare' }] },
		statement: { type: SEQ, members: [{ type: STRING, value: 'go' }, { type: FIELD, name: 'terminator', content: inlinedEnd() }] },
		bare: { type: SEQ, members: [{ type: STRING, value: 'stop' }, inlinedEnd()] },
		semi: { type: PATTERN, value: ';+' },
		newline: { type: PATTERN, value: '\\n+' }
	});
}

function buildNodeMap(
	rules: Record<string, Rule<'evaluate'>>,
	lists: { readonly supertypes?: readonly string[]; readonly inline?: readonly string[] } = {}
): NodeMap {
	const raw: RawGrammar = {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [...(lists.supertypes ?? [])],
		factoryInline: [],
		inline: [...(lists.inline ?? [])],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	return assemble(AssembleCtx.from(normalized));
}

describe('sub-factories — subFactoriesOf', () => {
	it('a labelled choice yields one arm per label, named by the label', () => {
		const nodeMap = commentNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('comment')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['doc', 'plain']);
		expect(set.entries.every((e) => e.residual.length === 0)).toBe(true);
		expect(set.diagnostics).toEqual([]);
	});

	it('labelled literals are value arms carrying the residual slots', () => {
		const nodeMap = logicNodeMap(true);
		const set = subFactoriesOf(nodeMap.nodes.get('logic')!, nodeMap);
		expect(set.entries.map((e) => [e.name, e.arm.via])).toEqual([
			['and', 'value'],
			['or', 'value']
		]);
		expect(set.entries[0]!.residual.map((f) => f.name).sort()).toEqual(['left', 'right']);
		expect(armConfigKeys(set.entries[0]!, nodeMap)).toEqual([]);
	});

	it('an unlabelled choice yields no arms', () => {
		const nodeMap = logicNodeMap(false);
		expect(subFactoriesOf(nodeMap.nodes.get('logic')!, nodeMap).entries).toEqual([]);
	});

	it("a child's own arms nest under its host and never flatten onto the parent", () => {
		const nodeMap = nestingNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('grandparent')!, nodeMap);
		expect(set.entries.map((e) => [e.name, e.depth])).toEqual([
			['parent', 0],
			['leafA', 0],
			['parent$leafA', 1],
			['parent$leafB', 1]
		]);
		expect(nodeArmOf(set.entries, 'parent$leafB')).toMatchObject({ path: ['leafB'] });
		expect(nodeArmOf(set.entries, 'parent$leafB').child.kind).toBe('parent');
		expect(set.diagnostics).toEqual([]);
	});

	it('two arms with one label are ambiguous and neither is kept', () => {
		const nodeMap = ambiguousNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('twice')!, nodeMap);
		expect(set.entries).toEqual([]);
		expect(set.diagnostics).toEqual([{ parent: 'twice', name: 'same', reason: 'ambiguous', claimants: ['first', 'second'] }]);
	});

	it('a config-shaped arm whose key is also a residual slot is seated as a tuple, with the shared key reported', () => {
		const nodeMap = collideNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('collide_parent')!, nodeMap);
		expect(set.entries.map((e) => [e.name, e.merges])).toEqual([
			['shapeA', false],
			['shapeB', false]
		]);
		expect(set.diagnostics).toEqual([
			{ parent: 'collide_parent', name: 'shapeA', reason: 'shared-key', claimants: ['shape_a'], keys: ['shared'] }
		]);
	});

	it('a config-shaped arm with no shared key merges its keys into the parent config', () => {
		const nodeMap = nestingNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('parent')!, nodeMap);
		expect(set.entries.find((e) => e.name === 'leafB')!.merges).toBe(true);
	});

	it("a labelled supertype value mounts its labelled members; an inlined member is never the parent's arm", () => {
		const nodeMap = supertypeNodeMap();
		const held = subFactoriesOf(nodeMap.nodes.get('holder')!, nodeMap);
		expect(held.entries.map((e) => e.name).sort()).toEqual(['circle', 'other', 'square']);
		expect(subFactoriesOf(nodeMap.nodes.get('fielded')!, nodeMap).entries).toEqual([]);
	});

	it("an inline rule's labels are arms only in the host's unnamed slot", () => {
		const nodeMap = inlineNodeMap();
		expect(subFactoriesOf(nodeMap.nodes.get('statement')!, nodeMap).entries).toEqual([]);
		expect(subFactoriesOf(nodeMap.nodes.get('bare')!, nodeMap).entries.map((e) => e.name).sort()).toEqual(['newline', 'semi']);
	});
});

export function twoChoiceSlotsNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		root: { type: SEQ, members: [{ type: STRING, value: 'for' }, { type: SYMBOL, name: 'header' }] },
		header: {
			type: SEQ,
			members: [
				{
					type: FIELD,
					name: 'content',
					content: {
						type: CHOICE,
						members: [
							{ type: SYMBOL, name: '_header_lhs', annotations: { variant: 'lhs', variantOf: 'header' } },
							{ type: SYMBOL, name: '_header_kind', annotations: { variant: 'kind', variantOf: 'header' } }
						]
					}
				},
				{
					type: FIELD,
					name: 'operator',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'in' },
							{ type: STRING, value: 'of' }
						]
					}
				}
			]
		},
		_header_lhs: {
			type: SEQ,
			members: [{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } }],
			annotations: { hoisted: true, variant: 'lhs', variantOf: 'header' }
		},
		_header_kind: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'kind', content: { type: STRING, value: 'const' } },
				{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } }
			],
			annotations: { hoisted: true, variant: 'kind', variantOf: 'header' }
		}
	};
	return buildNodeMap(rules);
}

describe('hoisted arms in a parent with two choice slots', () => {
	it('mounts every hoisted arm under its variant name, seated on its own slot', () => {
		const nodeMap = twoChoiceSlotsNodeMap();
		const header = nodeMap.nodes.get('header')!;
		const set = subFactoriesOf(header, nodeMap);
		const names = set.entries.map((e) => e.name);
		expect(names).toContain('lhs');
		expect(names).toContain('kind');
		expect(nodeArmOf(set.entries, 'kind').child.kind).toBe('_header_kind');
		expect(nodeArmOf(set.entries, 'lhs').child.kind).toBe('_header_lhs');
		for (const name of ['lhs', 'kind']) {
			const entry = set.entries.find((e) => e.name === name)!;
			expect(entry.slot.name).toBe('content');
			expect(entry.residual.map((f) => f.name)).toEqual(['operator']);
		}
	});
});

export function clauseNodeMap(): NodeMap {
	return buildNodeMap({
		root: { type: SEQ, members: [{ type: STRING, value: 'try' }, { type: SYMBOL, name: 'clause' }] },
		clause: {
			type: SEQ,
			members: [
				{ type: STRING, value: 'catch' },
				{ type: OPTIONAL, content: { type: SYMBOL, name: '_clause_group' } },
				{ type: FIELD, name: 'body', content: { type: PATTERN, value: '.+' } }
			]
		},
		_clause_group: {
			type: SEQ,
			members: [
				{ type: STRING, value: '(' },
				{ type: FIELD, name: 'parameter', content: { type: PATTERN, value: '[a-z]+' } },
				{ type: OPTIONAL, content: { type: FIELD, name: 'type', content: { type: PATTERN, value: '[A-Z]+' } } },
				{ type: STRING, value: ')' }
			],
			annotations: { hoisted: true }
		}
	});
}

describe('flattenSeatOf', () => {
	it('finds the single hoisted config-shaped group in an optional seat', () => {
		const nodeMap = clauseNodeMap();
		const seat = flattenSeatOf(nodeMap.nodes.get('clause')!, nodeMap);
		expect(seat?.group.kind).toBe('_clause_group');
		expect(seat?.slot.values.length).toBe(1);
		expect(subFactoriesOf(nodeMap.nodes.get('clause')!, nodeMap).entries).toEqual([]);
	});
	it('returns nothing for a choice of arms', () => {
		const nodeMap = twoChoiceSlotsNodeMap();
		expect(flattenSeatOf(nodeMap.nodes.get('header')!, nodeMap)).toBeUndefined();
	});
});

export function comparisonNodeMap(): NodeMap {
	return buildNodeMap({
		root: { type: SEQ, members: [{ type: STRING, value: 'cmp' }, { type: SYMBOL, name: 'comparison' }] },
		comparison: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } },
				{ type: FIELD, name: 'comparators', content: { type: REPEAT1, content: { type: SYMBOL, name: '_comparison_comparator' } } }
			]
		},
		_comparison_comparator: {
			type: SEQ,
			members: [
				{
					type: FIELD,
					name: 'operators',
					content: { type: CHOICE, members: [{ type: STRING, value: '<' }, { type: STRING, value: '==' }] }
				},
				{ type: FIELD, name: 'right', content: { type: PATTERN, value: '[a-z]+' } }
			],
			annotations: { hoisted: true }
		}
	});
}

describe('elementsSeatOf', () => {
	it('finds a repeated hoisted config-shaped group', () => {
		const nodeMap = comparisonNodeMap();
		const seats = elementsSeatOf(nodeMap.nodes.get('comparison')!, nodeMap);
		expect(seats.map((s) => [s.slot.name, s.group.kind])).toEqual([['comparators', '_comparison_comparator']]);
		expect(flattenSeatOf(nodeMap.nodes.get('comparison')!, nodeMap)).toBeUndefined();
	});
	it('returns nothing for a single-valued seat', () => {
		const nodeMap = clauseNodeMap();
		expect(elementsSeatOf(nodeMap.nodes.get('clause')!, nodeMap)).toEqual([]);
	});
});

describe('flattenSeatOf on a direct-shaped group', () => {
	it('names the one key of the group so the flatten calls it positionally', () => {
		const nodeMap = buildNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'x' }, { type: SYMBOL, name: 'slice' }] },
			slice: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'start', content: { type: PATTERN, value: '[0-9]+' } },
					{ type: OPTIONAL, content: { type: SYMBOL, name: '_slice_step' } }
				]
			},
			_slice_step: {
				type: SEQ,
				members: [{ type: STRING, value: ':' }, { type: FIELD, name: 'step', content: { type: PATTERN, value: '[0-9]+' } }],
				annotations: { hoisted: true }
			}
		});
		const seat = flattenSeatOf(nodeMap.nodes.get('slice')!, nodeMap);
		expect(seat?.group.kind).toBe('_slice_step');
		expect(seat?.directKey).toBe('step');
	});
});

describe('flattenSeatOf refuses a group whose keys collide with the parent', () => {
	it('leaves a group unseated when one of its keys is also a slot of the parent', () => {
		const nodeMap = buildNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'x' }, { type: SYMBOL, name: 'binary' }] },
			binary: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } },
					{ type: OPTIONAL, content: { type: SYMBOL, name: '_binary_in' } }
				]
			},
			_binary_in: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } },
					{ type: STRING, value: 'in' },
					{ type: FIELD, name: 'right', content: { type: PATTERN, value: '[a-z]+' } }
				],
				annotations: { hoisted: true }
			}
		});
		expect(flattenSeatOf(nodeMap.nodes.get('binary')!, nodeMap)).toBeUndefined();
	});
});

describe('a hoisted token the factories do not emit mounts as a value arm', () => {
	it('carries the token text instead of a builder reference', () => {
		const nodeMap = buildNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'x' }, { type: SYMBOL, name: 'pointer' }] },
			pointer: {
				type: SEQ,
				members: [
					{ type: STRING, value: '*' },
					{
						type: FIELD,
						name: 'content',
						content: {
							type: CHOICE,
							members: [
								{ type: SYMBOL, name: '_pointer_const', annotations: { variant: 'const', variantOf: 'pointer' } },
								{ type: SYMBOL, name: 'mutable', annotations: { variant: 'mutable', variantOf: 'pointer' } }
							]
						}
					},
					{ type: FIELD, name: 'type', content: { type: PATTERN, value: '[a-z]+' } }
				]
			},
			_pointer_const: { type: STRING, value: 'const', annotations: { hoisted: true } },
			mutable: { type: STRING, value: 'mut' }
		});
		const set = subFactoriesOf(nodeMap.nodes.get('pointer')!, nodeMap, { isEmitted: (k) => k !== '_pointer_const' });
		const arm = set.entries.find((e) => e.name === 'const');
		expect(arm?.arm.via).toBe('value');
		expect(arm?.arm.via === 'value' ? arm.arm.storage.text : undefined).toBe('const');
	});
});
