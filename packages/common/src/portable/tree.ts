import type { PortableKind } from '@sittir/types';

/** A portable guard: whether a value is a node that reads as the guard's vocabulary path or one under it. */
export type PortableGuard = (node: unknown) => node is { readonly $type: number };

/** A language's portable guard: whether a value is a node of the language, or a bare kind id of it, that reads as the guard's path or one under it. */
export type LanguageGuard = (value: unknown) => value is { readonly $type: number } | number;

type RootsOf<Paths extends string> = Paths extends `${string}.${string}` ? never : Paths;

type ChildrenOf<Paths extends string, Path extends string> = Paths extends `${Path}.${infer Rest}` ? (Rest extends `${string}.${string}` ? never : Rest) : never;

type KindAt<Paths extends string, Path extends string> = PortableKind<Path> & { readonly [Child in ChildrenOf<Paths, Path>]: KindAt<Paths, `${Path}.${Child}`> };

type GuardAt<Paths extends string, Path extends string, Guard> = Guard & { readonly [Child in ChildrenOf<Paths, Path>]: GuardAt<Paths, `${Path}.${Child}`, Guard> };

/** The portable kinds, one node per vocabulary path in `Paths`, nested by path segment. */
export type PortableKindTree<Paths extends string = string> = { readonly [Root in RootsOf<Paths>]: KindAt<Paths, Root> };

/** The portable guards, one per vocabulary path in `Paths`, nested like {@link PortableKindTree}. */
export type PortableGuardTree<Paths extends string = string, Guard = PortableGuard> = { readonly [Root in RootsOf<Paths>]: GuardAt<Paths, Root, Guard> };

/**
 * Builds the frozen kind and guard trees for a list of vocabulary paths.
 *
 * @param paths - every vocabulary path; each path's parent path must also be listed.
 * @param guardOf - the guard for a path.
 * @returns the two trees, with the same keys at every level.
 * @throws when a path's parent path is not listed.
 */
export function portableTrees<Paths extends string, Guard extends (value: unknown) => boolean = PortableGuard>(
	paths: readonly Paths[],
	guardOf: (path: Paths) => Guard
): { readonly kinds: PortableKindTree<Paths>; readonly is: PortableGuardTree<Paths, Guard> } {
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
	return Object.freeze({ kinds: kinds.get('') as PortableKindTree<Paths>, is: guards.get('') as PortableGuardTree<Paths, Guard> });
}
