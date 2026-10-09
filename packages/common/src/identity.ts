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
