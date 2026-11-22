import type { PortableKind, PortableNamespace } from '@sittir/types';

/** A portable guard: whether a value is a node that reads as the guard's vocabulary path or one under it. */
export type PortableGuard = (node: unknown) => node is { readonly $type: number };

/** A language's portable guard: whether a value is a node of the language, a bare kind id of it, or a token's text, that reads as the guard's path or one under it. */
export type LanguageGuard = (value: unknown) => value is { readonly $type: number } | number | string;

type RootsOf<Paths extends string> = Paths extends `${infer Root}.${string}` ? Root : Paths;

type ChildrenOf<Paths extends string, Path extends string> = Paths extends `${Path}.${infer Rest}` ? (Rest extends `${infer Child}.${string}` ? Child : Rest) : never;

type KindAt<Kinds extends string, Paths extends string, Path extends string> = (Path extends Kinds ? PortableKind<Path> : PortableNamespace<Path>) & {
	readonly [Child in ChildrenOf<Paths, Path>]: KindAt<Kinds, Paths, `${Path}.${Child}`>;
};

type GuardAt<Paths extends string, Path extends string, Guard> = Guard & { readonly [Child in ChildrenOf<Paths, Path>]: GuardAt<Paths, `${Path}.${Child}`, Guard> };

/** The portable kinds, one node per vocabulary path in `Paths`, per namespace among them and per alias path in `Aliases`, nested by path segment; a namespace's or an alias's node carries `$namespace` in place of `$path`. */
export type PortableKindTree<Paths extends string = string, Aliases extends string = never> = { readonly [Root in RootsOf<Paths | Aliases>]: KindAt<Paths, Paths | Aliases, Root> };

/** The portable guards, one per vocabulary path in `Paths` and per namespace among them, nested like {@link PortableKindTree}. */
export type PortableGuardTree<Paths extends string = string, Guard = PortableGuard> = { readonly [Root in RootsOf<Paths>]: GuardAt<Paths, Root, Guard> };

/**
 * Builds the frozen kind and guard trees for a list of vocabulary paths, the namespaces among them and the alias paths.
 *
 * A namespace or an alias gets a node in each tree: among the kinds it carries its path as `$namespace`, not `$path`, and among the guards it is `guardOf` of its path.
 *
 * @param paths - every vocabulary path.
 * @param namespaces - every prefix of a path that is no path itself.
 * @param aliases - every alias path.
 * @param guardOf - the guard for a path, a namespace or an alias.
 * @returns the two trees, with the same keys at every level.
 * @throws when a path's parent is neither a listed path nor a namespace.
 */
export function portableTrees<Paths extends string, Guard extends (value: unknown) => boolean = PortableGuard, Aliases extends string = never>(
	paths: readonly Paths[],
	namespaces: readonly string[],
	aliases: readonly Aliases[],
	guardOf: (path: string) => Guard
): { readonly kinds: PortableKindTree<Paths, Aliases>; readonly is: PortableGuardTree<Paths | Aliases, Guard> } {
	const kinds = new Map<string, object>([['', {}]]);
	const guards = new Map<string, object>([['', {}]]);
	for (const path of paths) kinds.set(path, { $path: path });
	for (const path of [...namespaces, ...aliases]) kinds.set(path, { $namespace: path });
	const placed = [...paths, ...namespaces, ...aliases];
	for (const path of placed) guards.set(path, guardOf(path));
	for (const path of placed) {
		const cut = path.lastIndexOf('.');
		const parent = cut < 0 ? '' : path.slice(0, cut);
		if (!kinds.has(parent)) throw new Error(`portable path ${path} has no parent path or namespace ${parent}`);
		for (const nodes of [kinds, guards]) (nodes.get(parent) as Record<string, object>)[path.slice(cut + 1)] = nodes.get(path)!;
	}
	for (const node of [...kinds.values(), ...guards.values()]) Object.freeze(node);
	return Object.freeze({ kinds: kinds.get('') as PortableKindTree<Paths, Aliases>, is: guards.get('') as PortableGuardTree<Paths | Aliases, Guard> });
}
