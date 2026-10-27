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

export function builtRefOf(value: unknown): BuiltRef | undefined {
	if (typeof value !== 'object' || value === null) return undefined;
	const arena = (value as { readonly $tree?: TreeHandle }).$tree?.built;
	if (arena === undefined || !isHandle(value)) return undefined;
	const at = (value as { readonly $at?: unknown }).$at;
	if (typeof at === 'number') return { arena, at };
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

export function packSite(holder: number, word: number, item: number): LeafSite {
	return word < WORD_RADIX && item < ITEM_RADIX ? holder * HOLDER_RADIX + word * ITEM_RADIX + item : [holder, word, item];
}

export function siteOf(site: LeafSite): readonly number[] {
	return typeof site === 'number' ? [Math.floor(site / HOLDER_RADIX), Math.floor(site / ITEM_RADIX) % WORD_RADIX, site % ITEM_RADIX] : site;
}

export function placeLeaf(leaf: object, holder: number, word: number, item: number): void {
	const held = leaf as { [LEAF_SITES]?: LeafSite };
	const sites = held[LEAF_SITES];
	held[LEAF_SITES] = sites === undefined ? packSite(holder, word, item) : [...siteOf(sites), holder, word, item];
}

export function leafSitesOf(leaf: object): readonly number[] | undefined {
	const sites = (leaf as { readonly [LEAF_SITES]?: LeafSite })[LEAF_SITES];
	return sites === undefined ? undefined : siteOf(sites);
}
