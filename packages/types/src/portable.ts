import type { QueryFlags, QueryPlan, QuerySlots, QuerySubject, SlotSubject, StepAnchor } from './query.ts';

export type * from './portable-build.ts';

/** A portable kind: one vocabulary path, the same object for every language. */
export type PortableKind<Path extends string = string> = { readonly $path: Path };

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

/**
 * A bound grammar's portable classification: each path's kind ids, each kind's read entries in the order they are tried, the text of each
 * fixed-literal kind id, and the fixed-literal kinds whose meaning is a value, which read as their path and not as their text.
 */
export interface PortableTable {
	readonly paths: Readonly<Record<string, PortablePath>>;
	readonly entries: Readonly<Record<number, readonly PortableReadEntry[]>>;
	readonly facts?: Readonly<Record<number, readonly PortableFact[]>>;
	readonly fixedText: Readonly<Record<number, string>>;
	readonly literals: readonly number[];
}

/**
 * A fact a node's container spells beside it, with one item of its `items` slot (a decorator beside the definition it decorates). It holds
 * on the first item `test` holds on where, when `same` is set, the item's text at `same.item` equals the node's text at `same.node`. A
 * holding fact reads the node as `path`, or sets `flag`; the read leaves its item out of the container's `slot` and records where it sat
 * under `name` in `$at`, with the text of the item's `spelled` slot as its spelling.
 */
export interface PortableFact {
	readonly name: string;
	readonly path?: string;
	readonly flag?: string;
	readonly container: number;
	readonly slot: string;
	readonly items: SlotSubject;
	readonly test: QueryPlan<QuerySubject>;
	readonly spelled?: SlotSubject;
	readonly same?: { readonly item: readonly PortableStep[]; readonly node: readonly PortableStep[] };
}

/** What a bound grammar's engine reads portable classifications from: its {@link PortableTable}, the slots its conditions name, and each kind's flag plans. */
export interface PortableRows {
	readonly table: PortableTable;
	readonly querySlots: QuerySlots;
	readonly flags: QueryFlags;
}

/**
 * Whether `value` reads as a vocabulary path or one under it, narrowing it to the grammar kinds read there, or to their texts.
 *
 * @typeParam Ids - The grammar kinds read at or under the path.
 * @typeParam Node - The grammar's node union; a node of another language, or one whose language is unknown, is refused.
 * @typeParam Kind - The grammar's kind-id enum: a bare kind id of the language is read by its kind and fixed text. A value typed as
 * a plain `number` is still admitted by the type, since a numeric enum accepts one.
 * @typeParam Text - The fixed texts of the tokens read at or under the path. Where there are any, a string is admitted and holds when
 * it is the text of one of those tokens.
 * @param value - A node of the language, parsed or built, read by the rows of the engine that stamped it, a kind id of the
 * language, or a token's text, each read by the rows its engine loaded.
 * @throws When given a kind id or a text before an engine of the language has loaded.
 */
export type PortableGuard<
	Ids extends number,
	Node extends { readonly $type: number } = { readonly $type: number },
	Kind extends number = never,
	Text extends string = never
> = <T extends Node | Kind | ([Text] extends [never] ? never : string)>(
	value: T
) => value is T extends string ? T & Text : T extends number ? T & Ids : T & { readonly $type: Ids };

/** What a bound grammar adds for the portable engine: its vocabulary namespaces of kind ids and of guards. */
export interface PortableSurface {
	readonly kinds: object;
	readonly is: object;
}
