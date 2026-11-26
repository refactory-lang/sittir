/**
 * A slot by its number in each kind that has it, keyed by stamped kind id: the slot's position among the kind's node
 * slots, the numbering the native read routes children by. A node of a kind the map lacks holds nothing there.
 */
export interface SlotSubject {
	readonly slots: Readonly<Record<number, number>>;
}

/**
 * One slot of a kind: the accessor a node reads it through, its number (`SlotSubject`), the keyword
 * when the slot holds that keyword's presence (`undefined` otherwise), the key the node stores it under, the keyword's kind id
 * when its storage stamps one, `true` when the slot is an optional preference whose blank arm its accessor reads as `null`,
 * and, for a slot whose grammar spells a member more than one way, each other spelling mapped to the member its accessor reads.
 */
export type QuerySlotEntry = readonly [
	accessor: string,
	slot: number,
	keyword: string | undefined,
	storageKey: string,
	keywordKind?: number,
	blank?: true,
	spellings?: Readonly<Record<string, string>>
];

/** Each kind's slots, by kind id. */
export type QuerySlots = Readonly<Record<number, readonly QuerySlotEntry[]>>;

/** The node itself as a condition's subject, in place of a slot: its own text, or its own kind for an `is` leaf. */
export interface SelfText {
	readonly self: true;
}

/** What a comparison reads: a slot by its numbers, or the node's own text. */
export type QuerySubject = SlotSubject | SelfText;

/** Which of the nodes a step's slot holds it reaches: the first, the last, or the one node when the slot holds exactly one. */
export type StepAnchor = 'first' | 'last' | 'only';

/**
 * A compiled condition, each comparison reading the subject `S`. A `where` condition reads slots only (the default) and is
 * evaluated by the native walk; a portable read test may also read the node's own text (`QueryPlan<QuerySubject>`), which only
 * `holds` evaluates. An `is` leaf tests the kinds of the values its slot holds, or the stamped kind of the node itself, a
 * `count` leaf holds when its slot holds at least `min` values, a `delimiter` leaf holds when the node is a list whose
 * delimiter flags hold one of `delimiter`'s (`Delimiter`), and a `child` step evaluates its condition on the nodes its slot
 * holds, narrowed by its anchor.
 */
export type QueryPlan<S extends QuerySubject = SlotSubject> =
	| ({ readonly op: 'eq'; readonly text: string } & S)
	| ({ readonly op: 'match'; readonly pattern: string } & S)
	| ({ readonly op: 'present' } & SlotSubject)
	| ({ readonly op: 'count'; readonly min: number } & SlotSubject)
	| { readonly op: 'delimiter'; readonly delimiter: number }
	| ({ readonly op: 'child'; readonly anchor?: StepAnchor; readonly of: QueryPlan<S> } & SlotSubject)
	| ({ readonly op: 'is'; readonly types: readonly number[] } & (S | SelfText))
	| { readonly op: 'not'; readonly of: QueryPlan<S> }
	| { readonly op: 'and' | 'or'; readonly of: readonly QueryPlan<S>[] };

/** Each kind's flags, by stamped kind id: the plan that tests the flag on a node of the kind, or `null` for a flag that depends on the node's context. */
export type QueryFlags = Readonly<Record<number, Readonly<Record<string, QueryPlan | null>>>>;

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

/**
 * A vocabulary path's kind ids, and whether they decide it: every way those kinds read lands at or under the path or one of its `targets`, one of
 * them unconditionally. `targets` lists what the aliases the language holds at or beneath the path reach, where there are any.
 */
export interface PortablePath {
	readonly ids: readonly number[];
	readonly exact: boolean;
	readonly targets?: readonly string[];
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
 * on the first item `test` holds on where, when `same` is set, the item's text at `same.item` equals the node's text at `same.node`, and,
 * when `own` is set, `own` holds on the node itself (python's getter takes a lone `self`). A holding fact reads the node as `path`, or
 * sets `flag`; the read leaves its item out of the container's `slot` and records where it sat under `name` in `$at`, with the text of
 * the item's `spelled` slot as its spelling.
 */
export interface PortableFact {
	readonly name: string;
	readonly path?: string;
	readonly flag?: string;
	readonly container: number;
	readonly slot: string;
	readonly items: SlotSubject;
	readonly test: QueryPlan<QuerySubject>;
	readonly own?: QueryPlan<QuerySubject>;
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
 * The read rows a grammar's projection is emitted from: the slots its plans name, each kind's flag plans and placed facts,
 * each kind's readable entries in order with the indices of the entries that refine it, the text of each fixed token by kind id,
 * each path's arms that build as text (by index), the seats each kind is read through when no path of its own claims it, the
 * path each fixed token reads as, and the slots (by accessor) of each kind that can hold a delimiter token with read-only spellings.
 */
export interface PortableProjectRows<Seat> {
	readonly querySlots: QuerySlots;
	readonly flags: QueryFlags;
	readonly facts: Readonly<Record<number, readonly PortableFact[]>>;
	readonly entries: Readonly<Record<number, readonly (PortableReadEntry & { readonly refinedBy: readonly number[] })[]>>;
	readonly fixedText: Readonly<Record<number, string>>;
	readonly textBuilt: Readonly<Record<string, readonly number[]>>;
	readonly unwrap: Readonly<Record<number, readonly Seat[]>>;
	readonly numbers: Readonly<Record<number, string>>;
	readonly readOnlyHolders: Readonly<Record<number, readonly string[]>>;
}
