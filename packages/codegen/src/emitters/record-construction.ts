import type { AssembledList, AssembledNonterminal, AuthoredCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { seatPlanOf } from './factories.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';
import { builtRowLines, type InnerPositions, type SetterEntry } from './node-members.ts';
import { rustFieldIdent } from './node-common.ts';
import { RECORD_HEADER_WORDS, type RecordPlace } from './record-layout.ts';
import { nodeRecordLayout } from './render-module.ts';

export const RECORD_CONSTRUCTION_IMPORTS = ['bindRow', 'builtArenaOf', 'storeCell', 'storeFlag', 'storeList', 'storeListOptions'] as const;

export function recordPlacesOf(
	node: AuthoredCompound | AssembledList,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[]
): ReadonlyMap<string, RecordPlace> | undefined {
	if (seatPlanOf(node, nodeMap, kindEntries, 'RAW.').groups.length > 0) return undefined;
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
	readonly inner: InnerPositions;
	readonly checks: readonly string[];
	readonly result: string;
}

function slotStore(place: RecordPlace, local: string): string {
	const at = `record.base + ${place.word}`;
	if ('bit' in place) return `  if (${local}) storeFlag(record.data, ${at}, ${2 ** place.bit});`;
	if (place.run !== undefined) return `  storeList(arena, record.data, ${at}, ${local}, ${place.run});`;
	return `  storeCell(arena, record.data, ${at}, ${local});`;
}

export function recordTailLines(spec: RecordConstruction, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): string[] {
	const places = recordPlacesOf(spec.node, nodeMap, kindEntries);
	const layout = nodeRecordLayout(spec.node, nodeMap);
	if (places === undefined || layout === undefined) return recordRefusalLines(spec.node);
	const stores = spec.slots.map((slot) => {
		const place = places.get(slot.storageKey);
		if (place === undefined) throw new Error(`recordTailLines: ${spec.node.kind}.${slot.name} has no record place`);
		return slotStore(place, slot.storageKey);
	});
	const options = spec.listOptions;
	return [
		'  const arena = builtArenaOf(handle);',
		`  handle?.verifyStored?.(${spec.kind}, { ${spec.slots.map((slot) => slot.storageKey).join(', ')} });`,
		`  const record = arena.record(${spec.kind}, ${layout.words});`,
		...stores,
		...(options === undefined
			? []
			: [`  storeListOptions(arena, record, ${options.delimiter ? '_delimiter' : 'undefined'}, ${options.separator ? '_separator' : 'undefined'});`]),
		'  const node = arena.view(record);',
		...builtRowLines(spec.setters, spec.inner),
		...spec.checks,
		`  return stampBuilt(node) as unknown as ${spec.result};`
	];
}

export function recordRefusalLines(node: { readonly kind: string }): string[] {
	return [`  throw new Error(${JSON.stringify(`${node.kind} has no record view, so a record engine cannot build it yet`)});`];
}

export function leafAdoptLine(kind: string, textExpr: string): string {
	return `  builtArenaOf(handle).adoptLeaf(node, ${kind}, ${RECORD_HEADER_WORDS}, ${textExpr});`;
}
