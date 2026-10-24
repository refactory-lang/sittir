/**
 * Shared node-map fixtures for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { CHOICE, FIELD, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { LAYOUT_SUPERTYPE } from '../../dsl/primitives/spacing.ts';
import { TIGHT_MEMBER } from '../../dsl/whitespace.ts';
import type { SupertypeRule } from '../../types/rule.ts';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledPunctuation,
	AssembledSupertype,
	isFixedTextLeaf
} from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import type { KindParserMetadata, NodeMap } from '../../compiler/types.ts';
import { ERROR_KIND_ROW, collectGeneratedKindEntries } from '../../dsl/symbol-table.ts';
import { isParserHiddenName } from '../../dsl/rule-patterns.ts';
import { ERROR_KIND_NAME } from '@sittir/common/error-kind';
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
		externals: [],
		word: undefined
	};
	return nodeMap;
}

export interface NodeMapWithIdTables {
	readonly nodeMap: NodeMap;
	readonly generatedIdTables: GeneratedIdTables;
}

/**
 * A node map whose `memberKinds` share one display (`display`) through their parser symbol. The display union is
 * declared on the map only when `declared` is set, so the same sites can be built both as a family and as a
 * coincidental duplicate.
 */
export function displayFamilyNodeMap<T extends { readonly kind: string; readonly seat?: { readonly kind: string } }>(
	sites: readonly T[],
	memberKinds: readonly string[],
	display: string,
	declared: boolean
): NodeMapWithIdTables {
	const build = (kindEntries: readonly GeneratedKindEntry[]) => siteKindsNodeMapOf(sites, kindEntries);
	const { generatedIdTables } = withGeneratedIdTables(build);
	if (!(generatedIdTables.kindIds instanceof Map)) throw new Error('fixture kind IDs must be a map');
	for (const kind of memberKinds) {
		const row = generatedIdTables.kindIds.get(kind)!;
		generatedIdTables.kindIds.set(kind, { ...row, parser: { ...row.parser!, symbolName: display } });
	}
	generatedIdTables.kindIds.set(ERROR_KIND_NAME, ERROR_KIND_ROW);
	const baseModel = build(collectGeneratedKindEntries(generatedIdTables));
	const displayUnions = declared
		? new Map([[display, memberKinds.map((storage) => ({ storage, literal: false }))]])
		: undefined;
	const nodeMap = { ...baseModel, displayUnions };
	stampIrSurface(nodeMap, generatedIdTables);
	return { nodeMap, generatedIdTables };
}

export function layoutNodes(kindEntries: readonly GeneratedKindEntry[]): readonly (readonly [string, AssembledNode])[] {
	const rule = { type: SUPERTYPE, name: LAYOUT_SUPERTYPE, subtypes: [{ type: SYMBOL, name: TIGHT_MEMBER }] } as unknown as SupertypeRule;
	return [
		[LAYOUT_SUPERTYPE, new AssembledSupertype(LAYOUT_SUPERTYPE, rule, [{ name: TIGHT_MEMBER }], { kindEntries })],
		[TIGHT_MEMBER, new AssembledPunctuation(TIGHT_MEMBER, { type: STRING, value: '' }, { kindEntries })]
	];
}

export function withIdTables(
	build: (kindEntries: readonly GeneratedKindEntry[]) => NodeMap,
	generatedIdTables: GeneratedIdTables
): NodeMapWithIdTables {
	const nodeMap = build(collectGeneratedKindEntries(generatedIdTables));
	stampIrSurface(nodeMap, generatedIdTables);
	return { nodeMap, generatedIdTables };
}

export function kindIdTablesOf(
	rows: readonly {
		readonly id: number;
		readonly kind: string;
		readonly symbolName?: string;
		readonly literalText?: string;
		readonly anon?: boolean;
		readonly lexicalRank?: number;
	}[]
): GeneratedIdTables {
	const kindIds = new Map<string, GeneratedIdEntry>(
		rows.map((row) => [
			row.kind,
			{
				id: row.id,
				parser: {
					cSymbol: row.anon === true ? `anon_sym_${row.kind}` : `sym_${row.kind}`,
					parserName: row.kind,
					symbolName: row.symbolName ?? row.kind,
					anon: row.anon === true,
					aux: false,
					alias: false,
					hidden: false,
					lexicalRank: row.lexicalRank ?? row.id,
					...(row.literalText === undefined ? {} : { literalText: row.literalText, terminal: true })
				}
			}
		])
	);
	kindIds.set(ERROR_KIND_NAME, ERROR_KIND_ROW);
	return { kindIds, fieldIds: new Map(), folds: new Map(), sourceArtifact: 'fixture' };
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

export function withGeneratedIdTablesFixture<T extends { readonly nodeMap: NodeMap }>(
	build: (kindEntries: readonly GeneratedKindEntry[]) => T,
	tokens: Readonly<Record<string, string>> = {}
): T & NodeMapWithIdTables {
	let built: T | undefined;
	const { generatedIdTables } = withGeneratedIdTables((kindEntries) => (built = build(kindEntries)).nodeMap, tokens);
	return { ...built!, generatedIdTables };
}

export function withGeneratedIdTablesNode<N extends AssembledNode>(
	build: (kindEntries: readonly GeneratedKindEntry[]) => N,
	tokens: Readonly<Record<string, string>> = {}
): N {
	let built: N | undefined;
	withGeneratedIdTables((kindEntries) => {
		built = build(kindEntries);
		return makeNodeMapWith(new Map([[built.kind, built]]));
	}, tokens);
	return built!;
}

function generatedIdTablesOf(nodeMap: NodeMap, tokens: Readonly<Record<string, string>>): GeneratedIdTables {
	const rows = new Map<string, GeneratedIdEntry>();
	const add = (kind: string, parser: KindParserMetadata): void => {
		if (rows.has(kind)) throw new Error(`fixture id tables: '${kind}' is both a node kind and a token`);
		rows.set(kind, { id: rows.size + 1, parser: { ...parser, lexicalRank: rows.size + 1 } });
	};
	for (const node of nodeMap.nodes.values()) add(node.kind, nodeParserRow(node));
	for (const [kind, text] of Object.entries(tokens)) add(kind, tokenParserRow(kind, text));
	rows.set(ERROR_KIND_NAME, ERROR_KIND_ROW);
	const fields = new Map<string, GeneratedIdEntry>();
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			for (const name of queryRoutesOf(slot, nodeMap).fields) if (!fields.has(name)) fields.set(name, { id: fields.size + 1 });
		}
	}
	return { kindIds: rows, fieldIds: fields, folds: new Map(), sourceArtifact: 'fixture' };
}

function nodeParserRow(node: AssembledNode): KindParserMetadata {
	return {
		cSymbol: `sym_${node.kind}`,
		parserName: node.kind,
		symbolName: node.kind,
		anon: false,
		aux: false,
		alias: false,
		hidden: node.hidden || isParserHiddenName(node.kind),
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
	if (kindEntries !== undefined) return siteKindsNodeMapOf(sites, kindEntries);
	return withGeneratedIdTables((entries) => siteKindsNodeMapOf(sites, entries)).nodeMap;
}

function siteKindsNodeMapOf<T extends { readonly kind: string; readonly seat?: { readonly kind: string } }>(
	sites: readonly T[],
	kindEntries: readonly GeneratedKindEntry[]
): NodeMap {
	const kinds = new Set(sites.flatMap((site) => (site.seat === undefined ? [site.kind] : [site.kind, site.seat.kind])));
	return makeNodeMapWith(new Map([...kinds].map((kind) => [kind, new AssembledPattern(kind, { type: PATTERN, value: kind }, { kindEntries })])));
}

export function makeMinimalNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
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
	nodes.set('call_expression', new AssembledBranch('call_expression', callRuleRender, callRuleRender, { kindEntries }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: STRING, value: 'fn' }, { kindEntries }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }, { kindEntries }));
	nodes.set(
		'operator',
		new AssembledEnum('operator', {
			type: CHOICE,
			members: [
				{ type: STRING, value: '+' },
				{ type: STRING, value: '-' }
			]
		}, { kindEntries })
	);
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [{ name: 'identifier' }, { name: 'call_expression' }], { kindEntries })
	);
	return makeNodeMapWith(nodes);
}
