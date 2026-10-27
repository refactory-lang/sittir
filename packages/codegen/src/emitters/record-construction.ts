import type { AssembledList, AssembledNonterminal, AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { builtRowLines, type SetterEntry, type TriviaPositions } from './node-members.ts';
import { rustFieldIdent } from './node-common.ts';
import type { RecordPlace } from './record-layout.ts';
import { nodeRecordLayout } from './render-module.ts';

export const RECORD_CONSTRUCTION_IMPORTS = [
	'builtArenaOf',
	'builtInputs',
	'storeCell',
	'storeFlag',
	'storeList',
	'storeListOptions',
	'leafText',
	'leafLeading',
	'leafTrailing',
	'leafInner',
	'handleRender',
	'handleToString',
	'handleEngine',
	'handleDispose'
] as const;

export const RECORD_VIEW_TYPES = ['BuiltRow', 'BuiltText', 'BuiltViews', 'EngineHandle', 'LeafSite', 'TreeHandle'] as const;

export function recordPlacesOf(
	node: AuthoredCompound | AssembledList,
	nodeMap: NodeMap
): ReadonlyMap<string, RecordPlace> | undefined {
	const layout = nodeRecordLayout(node, nodeMap);
	if (layout === undefined) return undefined;
	const fields = new Map(layout.places.map((place) => [place.field, place]));
	const places = new Map<string, RecordPlace>();
	for (const slot of node.slots) {
		const place = fields.get(rustFieldIdent(slot.storageName));
		if (place === undefined) return undefined;
		places.set(slot.storageKey, place);
	}
	return places;
}

export interface RecordConstruction {
	readonly node: AuthoredCompound | AssembledList;
	readonly kind: string;
	readonly slots: readonly AssembledNonterminal[];
	readonly listOptions?: { readonly delimiter: boolean; readonly separator: boolean };
	readonly setters: readonly SetterEntry[] | undefined;
	readonly inputs: readonly string[] | 'kind';
	readonly trivia: TriviaPositions | undefined;
	readonly checks: readonly string[];
	readonly result: string;
}

export interface RecordParts {
	readonly tail: readonly string[];
	readonly after: readonly string[];
}

function slotStore(place: RecordPlace, local: string): string {
	if ('bit' in place) return `  if (${local}) storeFlag(record.data, record.base + ${place.word}, ${2 ** place.bit});`;
	if (place.run !== undefined) return `  storeList(arena, record, ${place.word}, ${local}, ${place.run});`;
	return `  storeCell(arena, record, ${place.word}, ${local});`;
}

export function recordParts(spec: RecordConstruction, nodeMap: NodeMap, views: BuiltViewTable): RecordParts {
	const places = recordPlacesOf(spec.node, nodeMap);
	const layout = nodeRecordLayout(spec.node, nodeMap);
	if (places === undefined || layout === undefined) return { tail: recordRefusalLines(spec.node), after: [] };
	views.width(spec.node, layout.words);
	const placed = spec.slots.map((slot) => {
		const place = places.get(slot.storageKey);
		if (place === undefined) throw new Error(`recordTailLines: ${spec.node.kind}.${slot.name} has no record place`);
		return { place, local: slot.storageKey };
	});
	const stores = placed.map(({ place, local }) => slotStore(place, local));
	const options = spec.listOptions;
	const tail = [
		'  const arena = builtArenaOf(handle);',
		`  handle?.verifyStored?.(${spec.kind}, { ${spec.slots.map((slot) => slot.storageKey).join(', ')} });`,
		`  const record = arena.record(${spec.kind});`,
		...stores,
		...(options === undefined
			? []
			: [`  storeListOptions(arena, record, ${options.delimiter ? '_delimiter' : 'undefined'}, ${options.separator ? '_separator' : 'undefined'});`]),
		'  const node = arena.view(record);',
		...spec.checks,
		`  return node as unknown as ${spec.result};`
	];
	if (spec.inputs === 'kind') {
		views.requireRow(spec.node);
		return { tail, after: [] };
	}
	return { tail, after: views.row(spec.node, spec.inputs, spec.setters, spec.trivia) };
}

export function recordRefusalLines(node: { readonly kind: string }): string[] {
	return [`  throw new Error(${JSON.stringify(`${node.kind} has no record view, so a record engine cannot build it yet`)});`];
}

export function leafAdoptLines(maker: string, textExpr: string, result: string): string[] {
	return [`  return builtArenaOf(handle).leaf(${maker}, ${textExpr}) as unknown as ${result};`];
}

function leafMakerLines(name: string, typeExpr: string, trivia: TriviaPositions | undefined): string[] {
	return [
		`function ${name}(tree: TreeHandle, entry: BuiltText, site: LeafSite | undefined): object {`,
		'  const node = {',
		`    $type: ${typeExpr},`,
		'    $named: true as const,',
		'    $tree: tree,',
		'    $entry: entry,',
		'    $site: site,',
		'    $owned: site === undefined,',
		'    $text: leafText,',
		'    $render: handleRender,',
		'    toString: handleToString,',
		'    toJSON: refuseJSON,',
		...(trivia === undefined ? [] : ['    $trivia: undefined as unknown as object,']),
		'    $engine: handleEngine,',
		'    [Symbol.dispose]: handleDispose',
		'  };',
		...(trivia === undefined ? [] : [`  node.$trivia = { node, leading: leafLeading, trailing: leafTrailing${trivia.inner ? ', inner: leafInner' : ''} };`]),
		'  return node;',
		'}'
	];
}

interface ViewKind {
	readonly kind: string;
	readonly kindId?: number;
	readonly typeName: string;
}

export class BuiltViewTable {
	readonly #rows = new Map<number, string>();
	readonly #leaves = new Map<number, { readonly name: string; readonly body: string }>();
	readonly #required = new Map<number, string>();
	readonly #widths = new Map<number, number>();

	row(node: ViewKind, inputs: readonly string[], setters: readonly SetterEntry[] | undefined, trivia: TriviaPositions | undefined): string[] {
		const kindId = viewKindId(node);
		if (this.#rows.has(kindId)) throw new Error(`record views: ${node.kind} has two record builders that each make its row`);
		const name = `row${node.typeName}`;
		this.#rows.set(kindId, name);
		return builtRowLines(name, inputs, setters, trivia);
	}

	width(node: ViewKind, words: number): void {
		const kindId = viewKindId(node);
		const known = this.#widths.get(kindId);
		if (known !== undefined && known !== words) throw new Error(`record views: ${node.kind} has record builders of ${known} and ${words} words`);
		this.#widths.set(kindId, words);
	}

	requireRow(node: ViewKind): void {
		this.#required.set(viewKindId(node), node.kind);
	}

	leaf(node: ViewKind, typeExpr: string, trivia: TriviaPositions | undefined): { readonly name: string; readonly lines: readonly string[] } {
		const kindId = viewKindId(node);
		const lines = leafMakerLines(`leaf${node.typeName}`, typeExpr, trivia);
		const body = lines.join('\n');
		const known = this.#leaves.get(kindId);
		if (known !== undefined) {
			if (known.body !== body) throw new Error(`record views: ${node.kind} has two leaf builders whose nodes differ`);
			return { name: known.name, lines: [] };
		}
		const name = `leaf${node.typeName}`;
		this.#leaves.set(kindId, { name, body });
		return { name, lines };
	}

	tableLines(): string[] {
		for (const [kindId, kind] of this.#required) {
			if (!this.#rows.has(kindId)) throw new Error(`record views: a form builder writes ${kind} records, and ${kind} has no row`);
		}
		const entries = (table: ReadonlyMap<number, string | number>) => [...table].sort(([a], [b]) => a - b).map(([kindId, value]) => ` ${kindId}: ${value}`).join(',');
		return [
			'export const builtViews: BuiltViews = Object.freeze({',
			`  rows: Object.freeze({${entries(this.#rows)} }),`,
			`  words: Object.freeze({${entries(this.#widths)} }),`,
			`  leaves: Object.freeze({${entries(new Map([...this.#leaves].map(([kindId, { name }]) => [kindId, name])))} })`,
			'});'
		];
	}
}

function viewKindId(node: ViewKind): number {
	if (node.kindId === undefined) throw new Error(`record views: ${node.kind} has no kind id, so its records have no view`);
	return node.kindId;
}
