import type { BuiltArena, BuiltText } from './built-arena.ts';

/** What a built node names: its arena and its record, and for a leaf the text its cells hold. */
export interface BuiltRef {
	readonly arena: BuiltArena;
	readonly at: number;
	readonly text: BuiltText | undefined;
}

const refs = new WeakMap<object, BuiltRef>();

/** Makes `node` the node of the built record `ref` names. */
export function adoptBuilt(node: object, ref: BuiltRef): void {
	refs.set(node, ref);
}

/** What the built node `value` names; `undefined` for any other value. */
export function builtRefOf(value: unknown): BuiltRef | undefined {
	return typeof value === 'object' && value !== null ? refs.get(value) : undefined;
}
