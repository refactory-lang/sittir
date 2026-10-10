import type { GrammarContext } from './context.ts';

export type SubKindOf<T extends { readonly $kind: string }> = {
	readonly [K in keyof T]: K extends '$kind' ? `${T['$kind']}.${string}` : T[K];
};

/** A gated member where the context lacks the feature `F` that owns it. */
export interface Absent<F> {
	readonly absent: F;
}

/**
 * `T` where the context `G` has the feature `F`, else `Otherwise`. Over a union of contexts it is the union of each
 * context's, so a union of contexts is a supertype of each of them, member by member.
 */
export type In<G extends GrammarContext<G>, F, T, Otherwise = Absent<F>> = G extends F ? T : Otherwise;

/** The values of an enumeration of kinds: the path of every kind of `Level` beneath `Root`. */
export type Beneath<Level extends { readonly $kind: string }, Root extends string> = Extract<Level['$kind'], `${Root}.${string}`>;

/** The values of `Values` at or beneath `Value`: what a value refinement pins its member to. */
export type AtOrBeneath<Values extends string, Value extends Values> = Extract<Values, Value | `${Value}.${string}`>;

type ParentPath<P extends string> = P extends `${infer Head}.${infer Rest}` ? (Rest extends `${string}.${string}` ? `${Head}.${ParentPath<Rest>}` : Head) : never;

type EnumRoot<Values extends string> = { [P in Values]: ParentPath<P> extends Values ? never : ParentPath<P> }[Values];

/**
 * A value's short form: its path beneath the root of `Values`, the parent of every value whose own parent is not a
 * value. `EnumLeaf<V.AccessLevel>` is every level's short form, and
 * `EnumLeaf<V.AccessLevel, 'modifier.visibility.public.internal'>` is `'public.internal'`.
 */
export type EnumLeaf<Values extends string, Value extends Values = Values> = Value extends `${EnumRoot<Values>}.${infer Leaf}` ? Leaf : never;
