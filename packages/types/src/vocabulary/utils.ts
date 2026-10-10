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
