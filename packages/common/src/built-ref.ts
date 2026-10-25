import type { BuiltArena, BuiltText } from './built-arena.ts';

export interface BuiltRef {
	readonly arena: BuiltArena;
	readonly at: number;
	readonly text: BuiltText | undefined;
}

const refs = new WeakMap<object, BuiltRef>();

export function adoptBuilt(node: object, ref: BuiltRef): void {
	refs.set(node, ref);
}

export function builtRefOf(value: unknown): BuiltRef | undefined {
	return typeof value === 'object' && value !== null ? refs.get(value) : undefined;
}
