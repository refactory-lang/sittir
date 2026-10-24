import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledList,
	AssembledNonterminal,
	AssembledPattern,
	type AssembledNode,
	type SeparatedListElementRule
} from '../../compiler/model/node-map.ts';
import type { RenderRule, SeqRule, SimplifiedRule } from '../../types/rule.ts';
import { buildNodeModel, emitNodeModel, printNodeModel } from '../node-model.ts';
import { makeNodeMapWith, withGeneratedIdTables, type NodeMapWithIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';
import { clauseNodeMap, comparisonNodeMap, twoChoiceSlotsNodeMap } from '../../compiler/model/__tests__/sub-factories.test.ts';

describe('node-model emitter', () => {
	it('serializes the canonical display family without deriving aliases again', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(() => makeNodeMapWith(new Map()));
		const family = [
			{ storage: 'string_content', literal: false },
			{ storage: 'raw_string_literal_content', literal: false }
		];
		const withFamily = { ...nodeMap, displayUnions: new Map([['string_content', family]]) };
		expect(buildNodeModel(withFamily, generatedIdTables)).toHaveProperty('displayUnions', { string_content: family });
	});
	it('serializes a list\'s item slot beside its element kinds', () => {
		const rule: SeparatedListElementRule = { type: SYMBOL, name: 'member', multiplicity: 'array', separator: { value: { type: STRING, value: ',' } } };
		const simplified: SimplifiedRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
		const render: RenderRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) =>
			makeNodeMapWith(
				new Map<string, AssembledNode>([
					['member_list', new AssembledList('member_list', rule, { kindEntries }, { kindEntries, separatorRule: undefined, simplifiedRule: simplified, renderRule: render })],
					['member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }, { kindEntries })]
				])
			)
		);
		const list = buildNodeModel(nodeMap, generatedIdTables).nodes.find((node) => node.kind === 'member_list');
		expect(list).toMatchObject({ modelType: 'list', elementKinds: ['member'], slots: [{ multiple: true, values: [{ parseKind: 'member' }] }] });
	});

	it('writes no field a reader derives or nothing reads', () => {
		const rule: SeparatedListElementRule = { type: SYMBOL, name: 'member', multiplicity: 'array', separator: { value: { type: STRING, value: ',' } } };
		const simplified: SimplifiedRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
		const render: RenderRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) =>
			makeNodeMapWith(
				new Map<string, AssembledNode>([
					['member_list', new AssembledList('member_list', rule, { kindEntries }, { kindEntries, separatorRule: undefined, simplifiedRule: simplified, renderRule: render })],
					['member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }, { kindEntries })]
				])
			)
		);
		const model = buildNodeModel(nodeMap, generatedIdTables);
		for (const key of ['factorySlots', 'supertypes', 'nodeCount', 'word', 'externals', 'extras']) expect(model).not.toHaveProperty(key);
		for (const node of model.nodes)
			for (const key of ['factoryName', 'hidden', 'annotations', 'isParameterless', 'stampExpression', 'interior', 'transparent', 'hasNonterminalSeparator'])
				expect(node).not.toHaveProperty(key);
		const slot = (model.nodes.find((node) => node.kind === 'member_list') as { slots: object[] }).slots[0]!;
		for (const key of ['kinds', 'propertyName', 'paramName']) expect(slot).not.toHaveProperty(key);
	});

	it('writes a value\'s name only where it differs from the kind it parses as', () => {
		const rule: SeparatedListElementRule = { type: SYMBOL, name: 'member', multiplicity: 'array', separator: { value: { type: STRING, value: ',' } } };
		const simplified: SimplifiedRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
		const render: RenderRule = { type: SYMBOL, name: 'member', multiplicity: 'array' };
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) =>
			makeNodeMapWith(
				new Map<string, AssembledNode>([
					['member_list', new AssembledList('member_list', rule, { kindEntries }, { kindEntries, separatorRule: undefined, simplifiedRule: simplified, renderRule: render })],
					['member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }, { kindEntries })]
				])
			)
		);
		const list = buildNodeModel(nodeMap, generatedIdTables).nodes.find((node) => node.kind === 'member_list') as { slots: { values: object[] }[] };
		const value = list.slots[0]!.values[0]!;
		expect(value).toMatchObject({ parseKind: 'member' });
		expect(value).not.toHaveProperty('name');
	});

	it('records the grammar root kind', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(() => makeNodeMapWith(new Map()));
		expect(buildNodeModel({ ...nodeMap, root: 'program' }, generatedIdTables).root).toBe('program');
	});

	it('serializes the kind each renamed or split kind came from', () => {
		const provenance = { renamedFrom: { binding: 'let_item' }, splitFrom: { method: 'function' } };
		const pattern = (kind: string, kindEntries: readonly GeneratedKindEntry[]) => new AssembledPattern(kind, { type: PATTERN, value: '[a-z]+' }, { kindEntries, provenance });
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) => makeNodeMapWith(new Map([['binding', pattern('binding', kindEntries)], ['method', pattern('method', kindEntries)], ['plain', pattern('plain', kindEntries)]])));
		const model = buildNodeModel(nodeMap, generatedIdTables);
		const byKind = new Map(model.nodes.map((node) => [node.kind, node]));
		expect(byKind.get('binding')).toMatchObject({ renamedFrom: 'let_item' });
		expect(byKind.get('method')).toMatchObject({ splitFrom: 'function' });
		expect(byKind.get('binding')).not.toHaveProperty('splitFrom');
		expect(byKind.get('plain')).not.toHaveProperty('renamedFrom');
		expect(byKind.get('plain')).not.toHaveProperty('splitFrom');
	});

	it('serializes the kind an owned variant is a form of', () => {
		const provenance = { variantOf: { struct_unit: 'struct' } };
		const pattern = (kind: string, kindEntries: readonly GeneratedKindEntry[]) => new AssembledPattern(kind, { type: PATTERN, value: '[a-z]+' }, { kindEntries, provenance });
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) => makeNodeMapWith(new Map([['struct_unit', pattern('struct_unit', kindEntries)], ['plain', pattern('plain', kindEntries)]])));
		const model = buildNodeModel(nodeMap, generatedIdTables);
		const byKind = new Map(model.nodes.map((node) => [node.kind, node]));
		expect(byKind.get('struct_unit')).toMatchObject({ variantOf: 'struct' });
		expect(byKind.get('plain')).not.toHaveProperty('variantOf');
	});

	it('serializes per-value parseKind without slot-level aliasSources', () => {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'identifier' } }]
		};
		const render = flatten(rule);
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) => {
		const nodes = new Map<string, AssembledNode>();
		nodes.set(
			'alias_host',
			new AssembledBranch('alias_host', render, render, { kindEntries,
				slots: Object.freeze([
					new AssembledNonterminal({
						fieldName: 'value',
						values: [
							{
								node: { kind: 'unresolved-ref', name: 'identifier' },
								// Kind-id stamps stay in memory: names are the identity
								// on disk, since a regen renumbers parser ids.
								storageKindId: 42,
								parseKind: { kind: 'unresolved-ref', name: 'decorator' },
								parseKindId: 7,
								multiplicity: 'single'
							}
						],
						hasTrailingDelimiter: false,
						hasLeadingDelimiter: false,
						sourceRuleIds: []
					})
				])
			})
		);
		nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
		return makeNodeMapWith(nodes);
		});

		const model = buildNodeModel(nodeMap, generatedIdTables);
		const branch = model.nodes.find((node) => node.kind === 'alias_host');
		if (!branch || branch.modelType !== 'branch') throw new Error('expected alias_host branch');
		const field = branch.slots[0];
		const value = field?.values[0];

		expect(field).toBeDefined();
		expect(field).not.toHaveProperty('aliasSources');
		expect(value).toMatchObject({ kind: 'node-ref', name: 'identifier', parseKind: 'decorator' });

		const serialized = emitNodeModel({ grammar: 'synth', nodeMap, generatedIdTables });
		expect(serialized).toContain('"parseKind":"decorator"');
		expect(serialized).not.toContain('aliasSources');
		expect(serialized).not.toContain('storageKindId');
		expect(serialized).not.toContain('parseKindId');
		expect(serialized).not.toContain('resolvedKindId');
	});
});

const nodeModelArgs = ({ nodeMap, generatedIdTables }: NodeMapWithIdTables) => [nodeMap, generatedIdTables] as const;

describe('seats', () => {
	it('serializes the seat of every hoisted slot value', () => {
		const model = buildNodeModel(...nodeModelArgs(twoChoiceSlotsNodeMap()));
		const header = model.nodes.find((n) => n.kind === 'header')!;
		const content = (header as { slots: { name: string; values: { seat?: unknown }[] }[] }).slots.find((s) => s.name === 'content')!;
		expect(content.values.map((v) => v.seat)).toEqual([
			{ kind: 'header_lhs', shape: 'arm', mount: 'lhs', seated: true },
			{ kind: 'header_kind', shape: 'arm', mount: 'kind', seated: true }
		]);
		const clause = buildNodeModel(...nodeModelArgs(clauseNodeMap())).nodes.find((n) => n.kind === 'clause')! as {
			slots: { values: { seat?: unknown }[] }[];
		};
		expect(clause.slots.flatMap((s) => s.values).find((v) => v.seat)?.seat).toEqual({
			kind: 'clause_group',
			shape: 'flatten'
		});
		const comparison = buildNodeModel(...nodeModelArgs(comparisonNodeMap())).nodes.find((n) => n.kind === 'comparison')! as {
			slots: { name: string; values: { seat?: unknown }[] }[];
		};
		expect(comparison.slots.find((s) => s.name === 'comparators')!.values[0]!.seat).toEqual({
			kind: 'comparison_comparator',
			shape: 'elements'
		});
	});
});

describe('printNodeModel', () => {
	it('prints each node on its own line', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) =>
			makeNodeMapWith(
				new Map<string, AssembledNode>([
					['alpha', new AssembledPattern('alpha', { type: PATTERN, value: '[a-z]+' }, { kindEntries })],
					['beta', new AssembledPattern('beta', { type: PATTERN, value: '[0-9]+' }, { kindEntries })]
				])
			)
		);
		const model = buildNodeModel(nodeMap, generatedIdTables);
		const lines = printNodeModel(model).split('\n').map((line) => line.trim().replace(/,$/, ''));
		for (const node of model.nodes) expect(lines).toContain(JSON.stringify(node));
	});
});
