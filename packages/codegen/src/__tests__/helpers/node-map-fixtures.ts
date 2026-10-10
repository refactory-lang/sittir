/**
 * Shared node-map fixtures for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype,
	isFixedTextLeaf
} from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import type { KindParserMetadata, NodeMap } from '../../compiler/types.ts';
import { collectGeneratedKindEntries } from '../../dsl/symbol-table.ts';
import type { GeneratedIdEntry, GeneratedIdTables, GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { flatten } from '../../compiler/flatten.ts';
import { queryRoutesOf } from '../../emitters/client-utils.ts';

export function makeNodeMapWith(nodes: Map<string, AssembledNode>): NodeMap {
	const nodeMap: NodeMap = {
		name: 'rust',
		fileTypes: [],
		nodes,
		nodeByRuleId: new Map(),
		nodeByKindId: new Map(),
		slotByRuleId: new Map(),
		signatures: { signatures: new Map() },
		derivations: {
			inferredFields: [],
			promotedRules: [],
			repeatedShapes: []
		},
		externals: [],
		word: undefined
	};
	stampIrSurface(nodeMap);
	return nodeMap;
}

export interface NodeMapWithIdTables {
	readonly nodeMap: NodeMap;
	readonly generatedIdTables: GeneratedIdTables;
}

export function withGeneratedIdTables(
	build: (kindEntries: readonly GeneratedKindEntry[]) => NodeMap,
	tokens: Readonly<Record<string, string>> = {}
): NodeMapWithIdTables {
	const generatedIdTables = generatedIdTablesOf(build([]), tokens);
	const nodeMap = build(collectGeneratedKindEntries(generatedIdTables));
	stampIrSurface(nodeMap, generatedIdTables);
	return { nodeMap, generatedIdTables };
}

function generatedIdTablesOf(nodeMap: NodeMap, tokens: Readonly<Record<string, string>>): GeneratedIdTables {
	const rows = new Map<string, GeneratedIdEntry>();
	const add = (kind: string, parser: KindParserMetadata): void => {
		if (rows.has(kind)) throw new Error(`fixture id tables: '${kind}' is both a node kind and a token`);
		rows.set(kind, { id: rows.size + 1, parser });
	};
	for (const node of nodeMap.nodes.values()) add(node.kind, nodeParserRow(node));
	for (const [kind, text] of Object.entries(tokens)) add(kind, tokenParserRow(kind, text));
	const fields = new Map<string, GeneratedIdEntry>();
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			for (const name of queryRoutesOf(slot, nodeMap).fields) if (!fields.has(name)) fields.set(name, { id: fields.size + 1 });
		}
	}
	return { kindIds: rows, fieldIds: fields, sourceArtifact: 'fixture' };
}

function nodeParserRow(node: AssembledNode): KindParserMetadata {
	return {
		cSymbol: `sym_${node.kind}`,
		parserName: node.kind,
		symbolName: node.kind,
		anon: false,
		aux: false,
		alias: false,
		hidden: node.hidden,
		...(isFixedTextLeaf(node) ? { literalText: node.text, literalRule: true } : {}),
		...(node instanceof AssembledSupertype ? { supertype: true } : {}),
		...(node.modelType === 'pattern' || isFixedTextLeaf(node) ? { terminal: true } : {})
	};
}

function tokenParserRow(kind: string, text: string): KindParserMetadata {
	return {
		cSymbol: `anon_sym_${kind}`,
		parserName: kind,
		symbolName: text,
		literalText: text,
		anon: true,
		aux: false,
		alias: false,
		hidden: false,
		terminal: true
	};
}

export function makeSiteKindsNodeMap<T extends { readonly kind: string; readonly seat?: { readonly kind: string } }>(
	sites: readonly T[],
	kindEntries?: readonly GeneratedKindEntry[]
): NodeMap {
	const kinds = new Set(sites.flatMap((site) => (site.seat === undefined ? [site.kind] : [site.kind, site.seat.kind])));
	return makeNodeMapWith(new Map([...kinds].map((kind) => [kind, new AssembledPattern(kind, { type: PATTERN, value: kind }, { kindEntries })])));
}

export function makeMinimalNodeMap(): NodeMap {
	const callRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'callee',
				content: { type: SYMBOL, name: '_expression' }
			},
			{
				type: FIELD,
				name: 'keyword',
				content: { type: SYMBOL, name: 'kw_fn' }
			},
			{
				type: FIELD,
				name: 'operator',
				content: { type: SYMBOL, name: 'operator' }
			},
			{
				type: FIELD,
				name: 'semicolon',
				content: { type: STRING, value: ';' }
			}
		]
	};
	const expressionRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'call_expression' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	const callRuleRender = flatten(callRule);
	nodes.set('call_expression', new AssembledBranch('call_expression', callRuleRender, callRuleRender));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: STRING, value: 'fn' }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }));
	nodes.set(
		'operator',
		new AssembledEnum('operator', {
			type: CHOICE,
			members: [
				{ type: STRING, value: '+' },
				{ type: STRING, value: '-' }
			]
		})
	);
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [{ name: 'identifier' }, { name: 'call_expression' }])
	);
	return makeNodeMapWith(nodes);
}
