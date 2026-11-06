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

/**
 * `T` where the grammar map `G` has the feature `F`, else `never`: a member the map's features lack is absent, so a
 * language without the feature refuses it, and a node from such a language conforms wherever the member is present.
 * Over a union of maps it is the union of each map's, so a union of maps is a supertype of each of them, member by
 * member.
 */
export type In<G extends GrammarMap, F, T> = G extends GrammarMap ? (G['features'] extends F ? T : never) : never;

declare const flag: unique symbol;

export type Flag = typeof flag;

export interface FlagSynonyms {}
