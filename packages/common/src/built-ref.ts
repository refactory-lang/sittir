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

export function leafSitesOf(leaf: object): readonly number[] | undefined {
	return (leaf as { readonly [LEAF_SITES]?: readonly number[] })[LEAF_SITES];
}
