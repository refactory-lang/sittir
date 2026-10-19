import type { QueryPlan, QuerySlots, QuerySubject, SlotSubject, StepAnchor } from './query.ts';

/** One step of a condition: a slot by its numbers, narrowed to its first or last node when `anchor` is set, or reaching its node only when it holds exactly one (`only`). */
export interface PortableStep extends SlotSubject {
	readonly anchor?: StepAnchor;
}

/** One condition of a read entry's test: `plan` holds over the nodes the `via` steps reach, together, from the tested node (`up` 0) or its `up`-th enclosing context node. */
export interface PortableCondition {
	readonly up: number;
	readonly via: readonly PortableStep[];
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

/** A bound grammar's portable classification: each path's kind ids, each kind's read entries in the order they are tried, and the text of each fixed-literal kind id. */
export interface PortableTable {
	readonly paths: Readonly<Record<string, PortablePath>>;
	readonly entries: Readonly<Record<number, readonly PortableReadEntry[]>>;
	readonly fixedText: Readonly<Record<number, string>>;
}

/** What a bound grammar's engine reads portable classifications from: its {@link PortableTable} and the slots its conditions name. */
export interface PortableRows {
	readonly table: PortableTable;
	readonly querySlots: QuerySlots;
}

/**
 * Whether `node` reads as a vocabulary path or one under it, narrowing it to the grammar kinds read there.
 *
 * @typeParam Ids - The grammar kinds read at or under the path.
 * @typeParam Kind - The grammar's kind-id type; a node of another language is refused.
 * @param node - A node of the language, parsed or built, read by the rows of the engine that stamped it.
 */
export type PortableGuard<Ids extends Kind, Kind extends number = number> = <T extends { readonly $type: Kind }>(node: T) => node is T & { readonly $type: Ids };

/** What a bound grammar adds for the portable engine: its vocabulary namespaces of kind ids and of guards. */
export interface PortableSurface {
	readonly kinds: object;
	readonly is: object;
}
