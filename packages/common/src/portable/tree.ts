/** A portable kind: one vocabulary path, the same object for every language. */
export type PortableKind = { readonly $path: string };

/** A portable guard: whether a node is of the guard's vocabulary path. */
export type PortableGuard = (node: unknown) => boolean;

/** The portable kinds, one node per vocabulary path, nested by path segment; a language types it with its own paths. */
export type PortableKindTree = object;

/** The portable guards, one per vocabulary path, nested like {@link PortableKindTree}. */
export type PortableGuardTree = object;

/**
 * Builds the frozen kind and guard trees for a list of vocabulary paths.
 *
 * @param paths - every vocabulary path; each path's parent path must also be listed.
 * @param guardOf - the guard for a path.
 * @returns the two trees, with the same keys at every level.
 * @throws when a path's parent path is not listed.
 */
export function portableTrees(
	paths: readonly string[],
	guardOf: (path: string) => PortableGuard
): { readonly kinds: PortableKindTree; readonly is: PortableGuardTree } {
	const kinds = new Map<string, object>([['', {}]]);
	const guards = new Map<string, object>([['', {}]]);
	for (const path of paths) {
		kinds.set(path, { $path: path });
		guards.set(path, guardOf(path));
	}
	for (const path of paths) {
		const cut = path.lastIndexOf('.');
		const parent = cut < 0 ? '' : path.slice(0, cut);
		if (!kinds.has(parent)) throw new Error(`portable path ${path} has no parent path ${parent}`);
		for (const nodes of [kinds, guards])
			Object.defineProperty(nodes.get(parent)!, path.slice(cut + 1), {
				value: nodes.get(path),
				enumerable: true,
				configurable: false,
				writable: false
			});
	}
	for (const node of [...kinds.values(), ...guards.values()]) Object.freeze(node);
	return Object.freeze({ kinds: kinds.get('') as PortableKindTree, is: guards.get('') as PortableGuardTree });
}
