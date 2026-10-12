// Three encodings tried for building through a feature bound, none adopted.
import { type AsyncAwait, type Flag, type GrammarContext, flag } from './base.ts';

interface Absent<F> {
	readonly absent: F;
}
interface Composed extends GrammarContext<Composed>, AsyncAwait {}
interface Bare extends GrammarContext<Bare> {}

// 1. A lookup on a feature fact the context states: builds through the bound and keeps the gate's other properties,
//    at the price of every context stating every feature.
interface FeatureFacts {
	readonly asyncAwait: boolean;
}
interface LookupContext<G extends LookupContext<G>> {
	readonly features: FeatureFacts;
	readonly self?: G;
}
interface AsyncAwaitFact {
	readonly features: { readonly asyncAwait: true };
}
type InLookup<G extends LookupContext<G>, K extends keyof FeatureFacts, F, T> = { true: T; false: Absent<F> }[`${G['features'][K]}`];
interface LookupFn<G extends LookupContext<G>> {
	readonly async?: InLookup<G, 'asyncAwait', AsyncAwaitFact, Flag>;
}
interface LookupComposed extends LookupContext<LookupComposed> {
	readonly features: { readonly asyncAwait: true };
}
interface LookupBare extends LookupContext<LookupBare> {
	readonly features: { readonly asyncAwait: false };
}
export const lookupBounded = <G extends LookupContext<G> & AsyncAwaitFact>(): LookupFn<G> => ({ async: flag });
export const lookupUnion = (x: LookupFn<LookupComposed>): LookupFn<LookupComposed | LookupBare> => x;
// @ts-expect-error the context lacks the feature
export const lookupAbsent: LookupFn<LookupBare> = { async: flag };

// 2. A requirement in a parameter position, so meeting it is the check "G is assignable to F": builds through the
//    bound, but makes the structure contravariant in the context.
interface Needs<F> {
	readonly needs?: (context: F) => void;
}
interface NeedsFn<G extends GrammarContext<G>> {
	readonly async?: Flag & Needs<G>;
}
declare const asyncFlag: Flag & Needs<AsyncAwait>;
export const needsBounded = <G extends GrammarContext<G> & AsyncAwait>(): NeedsFn<G> => ({ async: asyncFlag });
// @ts-expect-error the context lacks the feature
export const needsAbsent: NeedsFn<Bare> = { async: asyncFlag };
// @ts-expect-error a union of contexts is no longer a supertype of each
export const needsUnion = (x: NeedsFn<Composed>): NeedsFn<Composed | Bare> => x;

// 3. A variance annotation: refused where the interface reads G covariantly, and no help to building where accepted.
type In<G, F, T> = G extends F ? T : never;
// @ts-expect-error TS2636: Fn<super-G> is not assignable to Fn<sub-G> as implied by variance annotation
interface AnnotatedFn<in G extends GrammarContext<G>> {
	readonly name: G['identifier'];
}
interface GateOnlyFn<in G extends GrammarContext<G>> {
	readonly async?: In<G, AsyncAwait, Flag>;
}
// @ts-expect-error TS2322: still unresolved under the bound
export const annotatedBounded = <G extends GrammarContext<G> & AsyncAwait>(): GateOnlyFn<G> => ({ async: flag });
export type { AnnotatedFn };
