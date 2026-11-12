import type { GrammarMap } from './map.ts';

export type Under<P extends string> = P | `${P}.${string}`;

export type SubKindOf<T extends { readonly $path: string }, Restated extends keyof T = never> = {
	readonly [K in keyof T as K extends Restated ? never : K]: T[K];
};

/**
 * A kind that is a token, typed as its text, declaring the flags its texts carry: `T` itself. The flags name the kind's flag segments,
 * which claims and portable guards use, without adding a member to the text.
 */
export type Flagged<T, F extends string> = [F] extends [never] ? T : T;

/**
 * An owner refined by one value of an axis many owners share: the owner's members, with a `$path` beneath the owner's,
 * and the members the value's kind adds.
 */
export type RefinedBy<Owner extends { readonly $path: string }, Value extends { readonly $path: string }> = SubKindOf<Owner> &
	Omit<Value, '$path'>;

type Composing<C, F, T> = C extends F ? T : Missing<F>;

/**
 * `T` where the grammar map `G` has the feature `F`, else `Missing<F>`: a path or member the map's features lack
 * holds no value, so a language without the feature refuses it by naming the feature. Over a union of maps it is the
 * union of each map's, so a union of maps is a supertype of each of them, member by member.
 */
export type In<G extends GrammarMap, F, T> = Composing<G['features'], F, T>;

/** What a path or member of the feature `F` is under a grammar map without `F`: a type no value has. */
export interface Missing<F> {
	readonly $missing: F;
	readonly $absent: never;
}

declare const flag: unique symbol;

export type Flag = typeof flag;

export interface FlagSynonyms {}

export interface FlagFeatures {}

type Has<C, F, N> = C extends F ? N : never;

type FlagsAt<G extends GrammarMap, P> = P extends keyof FlagFeatures
	? { readonly [N in keyof FlagFeatures[P]]-?: Has<G['features'], FlagFeatures[P][N], N> }[keyof FlagFeatures[P]] & string
	: never;

type Dropped<T, N> = { readonly [M in keyof T as M extends N ? never : M]: T[M] };

type Named<T, N extends string> = [N] extends [never] ? T : Dropped<T & { readonly $flags?: readonly N[] }, N>;

export type NamedFlags<G extends GrammarMap, T> = T extends readonly unknown[]
	? { readonly [I in keyof T]: NamedFlags<G, T[I]> }
	: T extends { readonly $path: infer P }
		? Named<T, FlagsAt<G, P>>
		: T;
