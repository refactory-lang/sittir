import type { QueryPlan, QuerySubject, SlotRoutes } from './query.ts';

/** One condition of a read entry's test: `plan` holds on some node the `via` slots reach from the tested node (`up` 0) or its `up`-th enclosing context node. */
export interface PortableCondition {
	readonly up: number;
	readonly via: readonly SlotRoutes[];
	readonly plan: QueryPlan<QuerySubject>;
}

/** A way a kind reads as a vocabulary path: its placement, nearest enclosing kind first (`null` admits any kind), and the conditions that must all hold. */
export interface PortableReadEntry {
	readonly path: string;
	readonly within: readonly (number | null)[];
	readonly test: readonly PortableCondition[];
}

/** A vocabulary path's kind ids, and whether they decide it: every way those kinds read lands at or under the path, one of them unconditionally. */
export interface PortablePath {
	readonly ids: readonly number[];
	readonly exact: boolean;
}

/** A bound grammar's portable classification: each path's kind ids, the alias links, each kind's read entries in the order they are tried, and the text of each fixed-literal kind id. */
export interface PortableTable {
	readonly paths: Readonly<Record<string, PortablePath>>;
	readonly aliases: readonly (readonly [under: string, name: string, path: string])[];
	readonly entries: Readonly<Record<number, readonly PortableReadEntry[]>>;
	readonly fixedText: Readonly<Record<number, string>>;
}

/**
 * Whether `node` reads as a vocabulary path or one under it, narrowing it to the grammar kinds read there.
 *
 * @param node - A node of the language, parsed or built.
 * @param context - The nodes enclosing `node`, outermost first. A way of reading that depends on where the node sits matches
 * only when the context places it there; without context the node is read the next way that matches.
 */
export type PortableGuard<Ids extends number> = <T extends { readonly $type: number }>(
	node: T,
	context?: readonly { readonly $type: number }[]
) => node is T & { readonly $type: Ids };

/** What a bound grammar adds for the portable engine: its vocabulary namespaces of kind ids and of guards. */
export interface PortableSurface {
	readonly kinds: object;
	readonly is: object;
}
