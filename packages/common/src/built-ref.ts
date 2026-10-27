import type { BuiltArena, BuiltText } from './built-arena.ts';

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

const refs = new WeakMap<object, BuiltRef>();

export function adoptBuilt(node: object, ref: BuiltRef): void {
	refs.set(node, ref);
}

export function builtRefOf(value: unknown): BuiltRef | undefined {
	return typeof value === 'object' && value !== null ? refs.get(value) : undefined;
}

export function builtLeafOf(value: unknown): BuiltLeafRef | undefined {
	const ref = builtRefOf(value);
	return ref?.text === undefined ? undefined : ref;
}

type LeafSites = number | number[];

const ITEM_RADIX = 2 ** 14;
const WORD_RADIX = 2 ** 7;
const HOLDER_RADIX = ITEM_RADIX * WORD_RADIX;

export function placeLeaf(leaf: object, holder: number, word: number, item: number): void {
	const held = leaf as { [LEAF_SITES]?: LeafSites };
	const sites = held[LEAF_SITES];
	if (sites === undefined && word < WORD_RADIX && item < ITEM_RADIX) {
		held[LEAF_SITES] = holder * HOLDER_RADIX + word * ITEM_RADIX + item;
		return;
	}
	const triples = sites === undefined ? [] : typeof sites === 'number' ? unpackedSite(sites) : sites;
	triples.push(holder, word, item);
	held[LEAF_SITES] = triples;
}

export function leafSitesOf(leaf: object): readonly number[] | undefined {
	const sites = (leaf as { readonly [LEAF_SITES]?: LeafSites })[LEAF_SITES];
	return typeof sites === 'number' ? unpackedSite(sites) : sites;
}

function unpackedSite(site: number): number[] {
	return [Math.floor(site / HOLDER_RADIX), Math.floor(site / ITEM_RADIX) % WORD_RADIX, site % ITEM_RADIX];
}
