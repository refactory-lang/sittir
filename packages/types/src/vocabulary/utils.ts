import type { GrammarContext } from './context.ts';

export type SubKindOf<T extends { readonly $kind: string }> = {
	readonly [K in keyof T]: K extends '$kind' ? `${T['$kind']}.${string}` : T[K];
};

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

declare const flag: unique symbol;

export type Flag = typeof flag;

export interface FlagSynonyms {}
