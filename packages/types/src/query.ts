import type { SlotHintsOf } from './node-surface.ts';

/** A slot as the parser spells it: the fields its children arrive under, and the kinds of its children that arrive under no field. */
export interface SlotRoutes {
	readonly fields: readonly string[];
	readonly kinds: readonly string[];
}

/** Each kind's slots, by kind id: the accessor a node reads a slot through and the slot's parser routes. */
export type QuerySlots = Readonly<Record<number, readonly (readonly [accessor: string, routes: SlotRoutes])[]>>;

/** The node's own text as a condition's subject, in place of a slot's. */
export interface SelfText {
	readonly self: true;
}

/** What a comparison reads: a slot by its parser routes, or the node's own text. */
export type QuerySubject = SlotRoutes | SelfText;

/**
 * A compiled condition, each slot it compares compiled to its parser routes. A `where` condition compares slots only and is
 * evaluated by the native walk; a comparison of the node's own text (`SelfText`) is evaluated by `holds` alone.
 */
export type QueryPlan =
	| ({ readonly op: 'eq'; readonly text: string } & QuerySubject)
	| ({ readonly op: 'match'; readonly pattern: string } & QuerySubject)
	| { readonly op: 'not'; readonly of: QueryPlan }
	| { readonly op: 'and' | 'or'; readonly of: readonly QueryPlan[] };

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

/** One slot of a `where` recorder. A comparison holds when some value in the slot has the text or matches. */
export interface SlotRef {
	/** Holds when a value in the slot has exactly `text`. */
	eq(text: string): Cond;
	/**
	 * Holds when a value in the slot matches `pattern`, as the native `regex` crate reads the pattern's source.
	 *
	 * @throws When `pattern` carries a flag, or uses syntax the native matcher cannot compile (a back-reference, a look-around).
	 */
	match(pattern: RegExp): Cond;
}

type HintsOrNone<N> = N extends unknown ? ([SlotHintsOf<N>] extends [never] ? {} : SlotHintsOf<N>) : never;

/** The slots of a parsed node type, by accessor name. Over a union, only the slots every member has. */
export type SlotNameOf<N> = keyof HintsOrNone<N> & string;

/** What a `where` callback receives: one `SlotRef` per slot of the view's element type. */
export type Recorder<N> = { readonly [S in SlotNameOf<N>]: SlotRef };

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
