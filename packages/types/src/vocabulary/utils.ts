import type { GrammarContext } from './context.ts';

export type SubKindOf<T extends { readonly $kind: string }> = {
	readonly [K in keyof T]: K extends '$kind' ? `${T['$kind']}.${string}` : T[K];
};

/**
 * A kind that is a token, typed as its text, declaring the flags its texts carry: `T` itself. The flags name the kind's flag segments,
 * which claims and portable guards use, without adding a member to the text.
 */
export type Flagged<T, F extends string> = [F] extends [never] ? T : T;

/**
 * An owner refined by one value of an axis many owners share: the owner's members, with a `$kind` beneath the owner's,
 * and the members the value's kind adds.
 */
export type RefinedBy<Owner extends { readonly $kind: string }, Value extends { readonly $kind: string }> = SubKindOf<Owner> &
	Omit<Value, '$kind'>;

/**
 * `T` where the context `G` has the feature `F`, else `never`: a member the context's features lack is absent, so a
 * language without the feature refuses it, and a node from such a language conforms wherever the member is present.
 * Over a union of contexts it is the union of each context's, so a union of contexts is a supertype of each of them,
 * member by member.
 */
export type In<G extends GrammarContext<G>, F, T> = G extends F ? T : never;

/**
 * `T` as one form a build accepts: the members `R` given, and the members `A` left out. A path whose forms differ by
 * what they need is the union of its forms, so a build the types admit is one the runtime picks a form for.
 */
export type RequiredBy<T, R extends PropertyKey, A extends PropertyKey = never> = Omit<T, (R | A) & keyof T> & {
	readonly [P in R & keyof T]-?: Exclude<T[P], undefined>;
} & { readonly [P in A & keyof T]?: never };

declare const flag: unique symbol;

export type Flag = typeof flag;

export interface FlagSynonyms {}
