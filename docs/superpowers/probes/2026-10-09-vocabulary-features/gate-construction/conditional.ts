// The gate as the vocabulary has it: reading through a feature bound works, building through one does not.
import { type AsyncAwait, type Flag, type GrammarContext, flag } from './base.ts';

type In<G, F, T> = G extends F ? T : never;
interface Fn<G extends GrammarContext<G>> {
	readonly name: G['identifier'];
	readonly async?: In<G, AsyncAwait, Flag>;
}
interface Composed extends GrammarContext<Composed>, AsyncAwait {}
interface Bare extends GrammarContext<Bare> {}

export const readBounded = <G extends GrammarContext<G> & AsyncAwait>(f: Fn<G>): Flag | undefined => f.async;
// Unbounded, an absent member reads as undefined.
export const readAny = <G extends GrammarContext<G>>(f: Fn<G>): Flag | undefined => f.async;
export const builtOverDeclared: Fn<Composed> = { name: { $kind: 'identifier' }, async: flag };
// The gate on a type parameter stays unresolved, so a value must fit both branches, and nothing fits never.
// @ts-expect-error TS2322: unique symbol is not assignable to In<G, AsyncAwait, unique symbol>
export const buildBounded = <G extends GrammarContext<G> & AsyncAwait>(name: G['identifier']): Fn<G> => ({ name, async: flag });
// @ts-expect-error TS2322: not assignable to type 'undefined'
export const bare: Fn<Bare> = { name: { $kind: 'identifier' }, async: flag };
