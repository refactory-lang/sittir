import type { BuiltArena, BuiltText } from './built-arena.ts';
import { isHandle, type LeafSite } from './handle.ts';
import type { TreeHandle } from './read.ts';

export interface BuiltRecordRef {
	readonly arena: BuiltArena;
	readonly at: number;
	readonly text?: undefined;
}

export interface BuiltLeafRef {
	readonly arena: BuiltArena;
	readonly at?: undefined;
	readonly text: BuiltText;
}

export type BuiltRef = BuiltRecordRef | BuiltLeafRef;

export const LEAF_SITES = Symbol.for('sittir.leafSites');

export function handleArenaOf(value: unknown): BuiltArena | undefined {
	if (typeof value !== 'object' || value === null) return undefined;
	const arena = (value as { readonly $tree?: TreeHandle }).$tree?.built;
	return arena !== undefined && isHandle(value) ? arena : undefined;
}

export function builtRefOf(value: unknown): BuiltRef | undefined {
	const arena = handleArenaOf(value);
	if (arena === undefined) return undefined;
	const at = (value as { readonly $at?: unknown }).$at;
	if (typeof at === 'number') return { arena, at: arena.liveAt(value as object, at) };
	const text = (value as { readonly $entry?: BuiltText }).$entry;
	return text === undefined ? undefined : { arena, text };
}

export function builtLeafOf(value: unknown): BuiltLeafRef | undefined {
	const ref = builtRefOf(value);
	return ref?.text === undefined ? undefined : ref;
}

const ITEM_RADIX = 2 ** 14;
const WORD_RADIX = 2 ** 7;
const HOLDER_RADIX = ITEM_RADIX * WORD_RADIX;

interface SiteList {
	readonly data: number[];
	readonly length: number;
	readonly pruneAt: number;
}

type PlacedSites = LeafSite | SiteList;
type PlacedLeaf = { [LEAF_SITES]?: PlacedSites | null };
type LiveSite = (holder: number) => boolean;

function flatSites(sites: PlacedSites): readonly number[] {
	return typeof sites === 'number' ? siteOf(sites) : 'data' in sites ? sites.data.slice(0, sites.length) : sites;
}

function liveSites(sites: PlacedSites, live: LiveSite): number[] {
	const list = typeof sites !== 'number' && 'data' in sites ? sites : undefined;
	const flat = list?.data ?? flatSites(sites);
	const length = list?.length ?? flat.length;
	const kept: number[] = [];
	for (let n = 0; n < length; n += 3) if (live(flat[n]!)) kept.push(flat[n]!, flat[n + 1]!, flat[n + 2]!);
	return kept;
}

function keepSites(leaf: PlacedLeaf, data: number[], pruneAt = Math.max(6, data.length * 2)): void {
	leaf[LEAF_SITES] = data.length === 0 ? null : data.length === 3 ? packSite(data[0]!, data[1]!, data[2]!) : { data, length: data.length, pruneAt };
}

export function packSite(holder: number, word: number, item: number): LeafSite {
	return word < WORD_RADIX && item < ITEM_RADIX ? holder * HOLDER_RADIX + word * ITEM_RADIX + item : [holder, word, item];
}

export function siteOf(site: LeafSite): readonly number[] {
	return typeof site === 'number' ? [Math.floor(site / HOLDER_RADIX), Math.floor(site / ITEM_RADIX) % WORD_RADIX, site % ITEM_RADIX] : site;
}

export function placeLeaf(leaf: object, holder: number, word: number, item: number, live?: LiveSite): void {
	const held = leaf as PlacedLeaf;
	const sites = held[LEAF_SITES];
	if (sites == null) {
		held[LEAF_SITES] = packSite(holder, word, item);
		return;
	}
	const list = typeof sites !== 'number' && 'data' in sites ? sites : undefined;
	const length = list?.length ?? 3;
	const pruneAt = list?.pruneAt ?? 6;
	if (live !== undefined && length + 3 >= pruneAt) {
		const data = liveSites(sites, live);
		data.push(holder, word, item);
		keepSites(held, data);
		return;
	}
	const data = list === undefined ? [...flatSites(sites)] : list.length === list.data.length ? list.data : list.data.slice(0, list.length);
	data.push(holder, word, item);
	keepSites(held, data, pruneAt);
}

export function moveLeafSite(leaf: object, from: number, to: number, word: number, item: number): void {
	const held = leaf as PlacedLeaf;
	const sites = held[LEAF_SITES];
	if (sites == null) return;
	const flat = [...flatSites(sites)];
	for (let n = 0; n < flat.length; n += 3) if (flat[n] === from && flat[n + 1] === word && flat[n + 2] === item) flat[n] = to;
	keepSites(held, flat);
}

export function leafSitesOf(leaf: object, live?: LiveSite): readonly number[] | undefined {
	const held = leaf as PlacedLeaf;
	const sites = held[LEAF_SITES];
	if (sites == null) return undefined;
	if (live === undefined) return flatSites(sites);
	const kept = liveSites(sites, live);
	keepSites(held, kept);
	return kept.length === 0 ? undefined : kept;
}
