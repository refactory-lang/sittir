import type { AssembledList, AssembledNonterminal, AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { builtWithLines, type SetterEntry, type TriviaPositions } from './node-members.ts';
import { rustFieldIdent } from './node-common.ts';
import { firstBuiltCell, type RecordLayout, type RecordPlace } from './record-layout.ts';
import { nodeRecordLayout } from './render-module.ts';

export const RECORD_CONSTRUCTION_IMPORTS = [
	'builtArenaOf',
	'builtInputs',
	'storeCell',
	'storeFlag',
	'storeList',
	'storeListOptions',
	'patchCell',
	'carriedSlot',
	'patchFlag',
	'patchList',
	'patchListOptions',
	'applySetter',
	'handleOf',
	'leafText',
	'leafLeading',
	'leafTrailing',
	'leafInner',
	'LEAF_SITES',
	'handleRender',
	'handleToString',
	'handleEngine',
	'handleDispose'
] as const;

export const RECORD_VIEW_TYPES = ['BuiltText', 'BuiltViews', 'LeafSite', 'RecordHandle', 'TreeHandle'] as const;

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
	readonly check?: string;
	readonly result: string;
}

export interface RecordParts {
	readonly tail: readonly string[];
	readonly patchTail: readonly string[];
	readonly after: readonly string[];
}

interface PlacedSlot {
	readonly place: RecordPlace;
	readonly local: string;
	readonly accessor: string;
}

function slotStore({ place, local }: PlacedSlot): string {
	if ('bit' in place) return `  if (${local}) storeFlag(record.data, record.base + ${place.word}, ${2 ** place.bit});`;
	if (place.run !== undefined) return `  storeList(arena, record, ${place.built}, ${place.word}, ${local});`;
	return `  storeCell(arena, record, ${place.built}, ${place.word}, ${local});`;
}

function slotPatch({ place, local, accessor }: PlacedSlot): string {
	if ('bit' in place) return `  patchFlag(record, ${place.word}, ${2 ** place.bit}, ${local});`;
	if (place.run !== undefined) return `  patchList(arena, record, ${place.built}, ${place.word}, ${local});`;
	return `  patchCell(arena, record, ${place.built}, ${place.word}, carriedSlot(source, ${JSON.stringify(accessor)}, ${local}));`;
}

export function recordParts(spec: RecordConstruction, nodeMap: NodeMap, views: BuiltViewTable): RecordParts {
	const places = recordPlacesOf(spec.node, nodeMap);
	const layout = nodeRecordLayout(spec.node, nodeMap);
	if (places === undefined || layout === undefined) return { tail: recordRefusalLines(spec.node), patchTail: recordRefusalLines(spec.node), after: [] };
	views.width(spec.node, layout);
	const placed = spec.slots.map((slot): PlacedSlot => {
		const place = places.get(slot.storageKey);
		if (place === undefined) throw new Error(`recordTailLines: ${spec.node.kind}.${slot.name} has no record place`);
		return { place, local: slot.storageKey, accessor: slot.propertyName };
	});
	const options = spec.listOptions;
	const listOptions = options === undefined ? undefined : `arena, record, ${options.delimiter ? '_delimiter' : 'undefined'}, ${options.separator ? '_separator' : 'undefined'}`;
	const tailOf = (record: string, store: (slot: PlacedSlot) => string, storeOptions: string): string[] => [
		'  const arena = builtArenaOf(handle);',
		`  handle?.verifyStored?.(${spec.kind}, { ${spec.slots.map((slot) => slot.storageKey).join(', ')} });`,
		`  const record = ${record};`,
		...placed.map(store),
		...(listOptions === undefined ? [] : [`  ${storeOptions}(${listOptions});`]),
		`  const node = ${spec.check === undefined ? 'arena.view(record)' : `arena.checkedView(record, (node) => ${spec.check})`};`,
		`  return node as unknown as ${spec.result};`
	];
	const tail = tailOf(`arena.record(${spec.kind})`, slotStore, 'storeListOptions');
	const patchTail = tailOf(`arena.copy(source, ${spec.kind})`, slotPatch, 'patchListOptions');
	if (spec.inputs === 'kind') {
		views.requireWith(spec.node);
		return { tail, patchTail, after: [] };
	}
	return { tail, patchTail, after: views.with(spec.node, spec.inputs, spec.setters ?? []) };
}

export function patchTwinLines(head: readonly string[], impl: string, twin: string, patchTail: readonly string[]): string[] {
	const opening = new RegExp(`^(?:export )?function ${impl}\\(`);
	const at = head.findIndex((line) => line.endsWith('{') && opening.test(line));
	if (at < 0) throw new Error(`record views: ${impl} has no implementation signature to patch`);
	const signature = head[at]!.replace(opening, () => `function ${twin}$patch(source: object, `).replace('(source: object, )', () => '(source: object)');
	return [signature, ...head.slice(at + 1), ...patchTail, '}'];
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
		'    $tree: tree,',
		'    $entry: entry,',
		'    $site: site,',
		'    $_layout: undefined,',
		'    $text: leafText,',
		'    $render: handleRender,',
		'    toString: handleToString,',
		'    toJSON: refuseJSON,',
		...(trivia === undefined ? [] : ['    $trivia: undefined as unknown as object,']),
		'    $engine: handleEngine,',
		'    [LEAF_SITES]: null,',
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
	readonly #withs = new Map<number, string>();
	readonly #leaves = new Map<number, { readonly name: string; readonly body: string }>();
	readonly #required = new Map<number, string>();
	readonly #widths = new Map<number, number>();
	readonly #cells = new Map<number, number>();

	with(node: ViewKind, inputs: readonly string[], setters: readonly SetterEntry[]): string[] {
		const kindId = viewKindId(node);
		if (this.#withs.has(kindId)) throw new Error(`record views: ${node.kind} has two record builders that each write its setters`);
		const name = `with${node.typeName}`;
		this.#withs.set(kindId, name);
		return builtWithLines(name, node.kind, inputs, setters);
	}

	width(node: ViewKind, layout: RecordLayout): void {
		const kindId = viewKindId(node);
		const known = this.#widths.get(kindId);
		if (known !== undefined && known !== layout.builtWords) throw new Error(`record views: ${node.kind} has record builders of ${known} and ${layout.builtWords} words`);
		this.#widths.set(kindId, layout.builtWords);
		this.#cells.set(kindId, firstBuiltCell(layout));
	}

	requireWith(node: ViewKind): void {
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
			if (!this.#withs.has(kindId)) throw new Error(`record views: a form builder writes ${kind} records, and ${kind} has no setters`);
		}
		const entries = (table: ReadonlyMap<number, string | number>) => [...table].sort(([a], [b]) => a - b).map(([kindId, value]) => ` ${kindId}: ${value}`).join(',');
		return [
			'export const builtViews: BuiltViews = Object.freeze({',
			`  withs: Object.freeze({${entries(this.#withs)} }),`,
			`  words: Object.freeze({${entries(this.#widths)} }),`,
			`  cells: Object.freeze({${entries(this.#cells)} }),`,
			`  leaves: Object.freeze({${entries(new Map([...this.#leaves].map(([kindId, { name }]) => [kindId, name])))} })`,
			'});'
		];
	}
}

function viewKindId(node: ViewKind): number {
	if (node.kindId === undefined) throw new Error(`record views: ${node.kind} has no kind id, so its records have no view`);
	return node.kindId;
}
