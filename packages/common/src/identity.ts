import type { TreeHandle } from './read.ts';

/** How a route reaches a node: as itself, or as the content of an alias envelope that shares its parser node. */
export type Role = 'node' | 'aliasContent';

type Wrappers = Map<number, WeakRef<object>>;

const registries = new WeakMap<TreeHandle, Wrappers>();
const collected = new FinalizationRegistry<{ readonly wrappers: Wrappers; readonly key: number; readonly ref: WeakRef<object> }>(
	({ wrappers, key, ref }) => {
		if (wrappers.get(key) === ref) wrappers.delete(key);
	}
);

function keyOf(index: number, role: Role): number {
	return index * 2 + (role === 'aliasContent' ? 1 : 0);
}

/** The wrapper registered for the node at `index` of `tree` in `role`, while it lives. */
export function registered(tree: TreeHandle, index: number, role: Role): object | undefined {
	return registries.get(tree)?.get(keyOf(index, role))?.deref();
}

/** Register `wrapper` as the node at `index` of `tree` in `role`, held weakly. */
export function register(tree: TreeHandle, index: number, role: Role, wrapper: object): void {
	let wrappers = registries.get(tree);
	if (wrappers === undefined) registries.set(tree, (wrappers = new Map()));
	const key = keyOf(index, role);
	const ref = new WeakRef(wrapper);
	wrappers.set(key, ref);
	collected.register(wrapper, { wrappers, key, ref });
}

/** Which side of a node's span an in-place write edits: its outside trivia (leading, trailing), or what lies inside the span. */
export type EditSide = 'inside' | 'outside';

const edited = new WeakMap<TreeHandle, Record<EditSide, number[]>>();

function lowerBound(sorted: readonly number[], value: number): number {
	let low = 0;
	let high = sorted.length;
	while (low < high) {
		const middle = (low + high) >>> 1;
		if ((sorted.at(middle) ?? Infinity) < value) low = middle + 1;
		else high = middle;
	}
	return low;
}

function anyWithin(sorted: readonly number[], from: number, end: number): boolean {
	return (sorted.at(lowerBound(sorted, from)) ?? Infinity) < end;
}

/** Record an in-place write on the node at `index` of `tree`, on `side` of its span. */
export function markIndexEdited(tree: TreeHandle, index: number, side: EditSide): void {
	let sides = edited.get(tree);
	if (sides === undefined) edited.set(tree, (sides = { inside: [], outside: [] }));
	const indexes = sides[side];
	const at = lowerBound(indexes, index);
	if (indexes.at(at) !== index) indexes.splice(at, 0, index);
}

/**
 * Whether a write lands in the bytes of the node whose subtree is `[index, end)`: one inside its range, or one
 * outside a descendant's span. A holder that carries the node's own trivia renders an outside write on the node
 * itself around its bytes; one that carries none (`ownTrivia` false) counts that write too.
 */
export function editedWithin(tree: TreeHandle, index: number, end: number, ownTrivia = true): boolean {
	const sides = edited.get(tree);
	return sides !== undefined && (anyWithin(sides.inside, index, end) || anyWithin(sides.outside, ownTrivia ? index + 1 : index, end));
}
