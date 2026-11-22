import type { PortableKind } from '@sittir/types';

/** A portable guard: whether a value is a node that reads as the guard's vocabulary path or one under it. */
export type PortableGuard = (node: unknown) => node is { readonly $type: number };

/** A language's portable guard: whether a value is a node of the language, a bare kind id of it, or a token's text, that reads as the guard's path or one under it. */
export type LanguageGuard = (value: unknown) => value is { readonly $type: number } | number | string;

type RootsOf<Paths extends string> = Paths extends `${infer Root}.${string}` ? Root : Paths;

type ChildrenOf<Paths extends string, Path extends string> = Paths extends `${Path}.${infer Rest}` ? (Rest extends `${infer Child}.${string}` ? Child : Rest) : never;

type KindAt<Paths extends string, Path extends string> = (Path extends Paths ? PortableKind<Path> : unknown) & {
	readonly [Child in ChildrenOf<Paths, Path>]: KindAt<Paths, `${Path}.${Child}`>;
};

type GuardAt<Paths extends string, Path extends string, Guard> = Guard & { readonly [Child in ChildrenOf<Paths, Path>]: GuardAt<Paths, `${Path}.${Child}`, Guard> };

/** The portable kinds, one node per vocabulary path in `Paths` and per namespace among them, nested by path segment; a namespace's node has no `$path`. */
export type PortableKindTree<Paths extends string = string> = { readonly [Root in RootsOf<Paths>]: KindAt<Paths, Root> };

/** The portable guards, one per vocabulary path in `Paths` and per namespace among them, nested like {@link PortableKindTree}. */
export type PortableGuardTree<Paths extends string = string, Guard = PortableGuard> = { readonly [Root in RootsOf<Paths>]: GuardAt<Paths, Root, Guard> };

/**
 * Builds the frozen kind and guard trees for a list of vocabulary paths and the namespaces among them.
 *
 * A namespace gets a node in each tree: among the kinds it has no `$path`, and among the guards it is `guardOf` of its path.
 *
 * @param paths - every vocabulary path.
 * @param namespaces - every prefix of a path that is no path itself.
 * @param guardOf - the guard for a path or a namespace.
 * @returns the two trees, with the same keys at every level.
 * @throws when a path's parent is neither a listed path nor a namespace.
 */
export function portableTrees<Paths extends string, Guard extends (value: unknown) => boolean = PortableGuard>(
	paths: readonly Paths[],
	namespaces: readonly string[],
	guardOf: (path: string) => Guard
): { readonly kinds: PortableKindTree<Paths>; readonly is: PortableGuardTree<Paths, Guard> } {
	const kinds = new Map<string, object>([['', {}]]);
	const guards = new Map<string, object>([['', {}]]);
	for (const path of paths) kinds.set(path, { $path: path });
	for (const path of namespaces) kinds.set(path, {});
	const placed = [...paths, ...namespaces];
	for (const path of placed) guards.set(path, guardOf(path));
	for (const path of placed) {
		const cut = path.lastIndexOf('.');
		const parent = cut < 0 ? '' : path.slice(0, cut);
		if (!kinds.has(parent)) throw new Error(`portable path ${path} has no parent path or namespace ${parent}`);
		for (const nodes of [kinds, guards]) (nodes.get(parent) as Record<string, object>)[path.slice(cut + 1)] = nodes.get(path)!;
	}
	for (const node of [...kinds.values(), ...guards.values()]) Object.freeze(node);
	return Object.freeze({ kinds: kinds.get('') as PortableKindTree<Paths>, is: guards.get('') as PortableGuardTree<Paths, Guard> });
}
