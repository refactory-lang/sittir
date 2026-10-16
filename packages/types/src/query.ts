import type { IsBooleanKeyword } from './keyword-presence.ts';
import type { FlagsHintOf, SlotFlagsHintOf, SlotHint, SlotHintsOf } from './node-surface.ts';

/**
 * A slot by its number in each kind that has it, keyed by stamped kind id: the slot's position among the kind's transport
 * slots, the numbering the native read routes children by. A node of a kind the map lacks holds nothing there.
 */
export interface SlotSubject {
	readonly slots: Readonly<Record<number, number>>;
}

/** A language's kind membership: which node types count as a given kind. */
export interface KindMembership {
	/** Whether a node whose type is `type` is a `kind`: a member of the supertype `kind`, an arm of the polymorph `kind`, or, for any other kind, `kind` itself. */
	isMember(kind: number, type: number): boolean;
	/** Every type a node that is a `kind` can have, the types `isMember` accepts for it. */
	membersOf(kind: number): readonly number[];
}

/** One slot of a kind: the accessor a node reads it through, its number (`SlotSubject`), and the keyword when the slot holds that keyword's presence. */
export type QuerySlotEntry = readonly [accessor: string, slot: number, keyword?: string];

/** Each kind's slots, by kind id. */
export type QuerySlots = Readonly<Record<number, readonly QuerySlotEntry[]>>;

/** The node's own text as a condition's subject, in place of a slot's. */
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
 * `holds` evaluates. An `is` leaf tests the stamped kinds (`$type`) of its subject, and a `child` step evaluates its condition on
 * the nodes its slot holds, narrowed by its anchor.
 */
export type QueryPlan<S extends QuerySubject = SlotSubject> =
	| ({ readonly op: 'eq'; readonly text: string } & S)
	| ({ readonly op: 'match'; readonly pattern: string } & S)
	| ({ readonly op: 'present' } & SlotSubject)
	| ({ readonly op: 'child'; readonly anchor?: StepAnchor; readonly of: QueryPlan<S> } & SlotSubject)
	| ({ readonly op: 'is'; readonly types: readonly number[] } & S)
	| { readonly op: 'not'; readonly of: QueryPlan<S> }
	| { readonly op: 'and' | 'or'; readonly of: readonly QueryPlan<S>[] };

/** Each kind's flags, by stamped kind id: the plan that tests the flag on a node of the kind, or `null` for a flag that depends on the node's context. */
export type QueryFlags = Readonly<Record<number, Readonly<Record<string, QueryPlan | null>>>>;

/**
 * A flag one kind declares in a way a slot test cannot read: through the node's own slots (`context: false`), or through its
 * context (`context: true`).
 */
export interface SlotFlagRefusal {
	readonly kind: number;
	readonly context: boolean;
}

/**
 * The flags the values of each kind's slots can carry, by stamped kind id and slot accessor: the types of the kinds the slot
 * can hold that always carry the flag, or the kind that declares it in a way a slot test cannot read.
 */
export type QuerySlotFlags = Readonly<Record<number, Readonly<Record<string, Readonly<Record<string, readonly number[] | SlotFlagRefusal>>>>>>;

declare const CONDITION: unique symbol;

/** A recorded `where` condition, combined with others by `and`, `or` and `not`. Only a recorder makes one. */
export interface Cond {
	readonly [CONDITION]: true;
	/** Holds when both this condition and `other` hold. */
	and(other: Cond): Cond;
	/** Holds when this condition or `other` holds. */
	or(other: Cond): Cond;
	/** Holds when this condition does not. */
	not(): Cond;
}

/** One slot of a `where` recorder. A comparison holds when some value in the slot has the text or matches, or carries the flag. */
export interface SlotRef<F extends string = never> {
	/** Holds when a value in the slot has exactly `text`. */
	eq(text: string): Cond;
	/**
	 * Holds when a value in the slot matches `pattern`, as the native `regex` crate reads the pattern's source.
	 *
	 * @throws When `pattern` carries a flag, or uses syntax the native matcher cannot compile (a back-reference, a look-around).
	 */
	match(pattern: RegExp): Cond;
	/**
	 * Holds when a value in the slot is of a kind that always carries the vocabulary flag `flag`, such as an enum member whose
	 * fixed text spells it.
	 *
	 * @throws When no kind the slot can hold declares `flag`, or one declares it only through its own slots or its context.
	 */
	is(flag: F): Cond;
}

/** One boolean slot of a `where` recorder: the slot holds a keyword's presence. */
export interface PresenceRef {
	/**
	 * Holds when the keyword is present (`true`) or absent (`false`).
	 *
	 * @throws When `present` is not a boolean.
	 */
	eq(present: boolean): Cond;
}

type HintsOrNone<N> = N extends unknown ? ([SlotHintsOf<N>] extends [never] ? {} : SlotHintsOf<N>) : never;

/** The slots of a parsed node type, by accessor name. Over a union, only the slots every member has. */
export type SlotNameOf<N> = keyof HintsOrNone<N> & string;

type SlotRefOf<N, S> = N extends unknown
	? S extends keyof SlotHintsOf<N>
		? SlotHintsOf<N>[S] extends SlotHint<infer I, boolean, boolean, unknown>
			? IsBooleanKeyword<NonNullable<I>> extends true
				? PresenceRef
				: SlotRef<SlotFlagOf<N, S>>
			: SlotRef<SlotFlagOf<N, S>>
		: never
	: never;

type SlotFlagOf<N, S> = S extends keyof SlotFlagsHintOf<N> ? SlotFlagsHintOf<N>[S] & string : never;

type SharedFlags<N> = (N extends unknown ? (flags: FlagsHintOf<N>) => void : never) extends (flags: infer F) => void ? F : never;

/** The vocabulary flags a `where` condition can test on a node type: those its kind declares, and over a union only those every member declares. A flag that depends on the node's context is not one of them. */
export type FlagOf<N> = [N] extends [never] ? never : SharedFlags<N> & string;

/**
 * What a `where` callback receives: one member per slot of the view's element type, a `PresenceRef` for a slot that holds a
 * keyword's presence and a `SlotRef` for any other, and `is`, which tests a vocabulary flag.
 */
export type Recorder<N> = { readonly [S in SlotNameOf<N>]: SlotRefOf<N, S> } & {
	/**
	 * Holds when the node carries the vocabulary flag `flag`, as its kind spells it.
	 *
	 * @throws When the node's kind does not declare `flag`, or declares it only in a context a condition on the node cannot see.
	 */
	is(flag: FlagOf<N>): Cond;
};

type KindOf<T> = T extends { readonly $type: infer K extends number } ? K : never;

/**
 * A lazy sequence of nodes. Operators return a new view and run nothing; terminals and iteration run
 * the view's plan and read only as many nodes as they need.
 */
export interface View<T> extends Iterable<T> {
	/** The elements `guard` admits, narrowed to its type. */
	filter<S extends T>(guard: (node: T, index: number) => node is S): View<S>;
	/** The elements `predicate` admits. */
	filter(predicate: (node: T, index: number) => unknown): View<T>;
	/** Each element mapped by `fn`. */
	map<U>(fn: (node: T, index: number) => U): View<U>;
	/** Each element mapped by `fn`, an array result spread in place. */
	flatMap<U>(fn: (node: T, index: number) => U | readonly U[]): View<U>;
	/** The elements from `start` up to, not including, `end`, counted as an array's `slice` counts them. */
	slice(start?: number, end?: number): View<T>;
	/** The elements of kind `kind`, narrowed to it. */
	ofType<K extends KindOf<T>>(kind: K): View<Extract<T, { readonly $type: K }>>;
	/**
	 * The elements whose slots satisfy the condition `condition` records, evaluated natively.
	 *
	 * @throws When the callback returns anything but a recorded condition, or reads a slot the element type does not have.
	 */
	where(condition: (slots: Recorder<T>) => Cond): View<T>;
	/** The first element `predicate` admits, or the first element when it is absent. */
	find<S extends T>(predicate: (node: T, index: number) => node is S): S | undefined;
	find(predicate?: (node: T, index: number) => unknown): T | undefined;
	/** The position of the first element `predicate` admits, or -1. */
	findIndex(predicate: (node: T, index: number) => unknown): number;
	/** Whether some element satisfies `predicate`. */
	some(predicate: (node: T, index: number) => unknown): boolean;
	/** Whether every element satisfies `predicate`. */
	every(predicate: (node: T, index: number) => unknown): boolean;
	/** Whether `node` is one of the elements: the same occurrence in the same tree for a parsed node, the same object otherwise. */
	includes(node: T): boolean;
	/** The elements folded by `fn`, from the first element. @throws On an empty view. */
	reduce(fn: (accumulated: T, node: T, index: number) => T): T;
	/** The elements folded by `fn`, from `initial`. */
	reduce<U>(fn: (accumulated: U, node: T, index: number) => U, initial: U): U;
	/** Run `fn` on each element. */
	forEach(fn: (node: T, index: number) => void): void;
	/** The element at `index`, a negative index counting from the end, or `undefined`. */
	at(index: number): T | undefined;
}

type ItemsOf<R> = R extends { readonly $type: unknown } ? R : R extends readonly (infer E)[] ? E : R;
type SlotItem<N, K> = N[K & keyof N] extends () => infer R ? ItemsOf<Exclude<R, undefined>> : never;

/**
 * A parsed node's query facet: a lazy view per slot, over the items the slot's accessor returns,
 * and the views of the node's structural children and descendants. `ByParsed` maps each kind id of
 * the grammar to its parsed node type.
 */
export type QueryFacet<N, ByParsed> = { readonly [K in SlotNameOf<N>]: View<SlotItem<N, K>> } & {
	/** The node's direct structural children in source order: named, across its slots, without anonymous tokens or trivia. */
	readonly $children: View<ByParsed[keyof ByParsed]>;
	/** The node's structural descendants in depth-first pre-order, the node itself excluded. Comments and other extras are trivia, never descendants. */
	readonly $descendants: View<ByParsed[keyof ByParsed]>;
};
