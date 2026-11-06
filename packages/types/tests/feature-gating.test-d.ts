import type * as V from '../src/vocabulary/index.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type Lacking = V.Contract<V.PythonFeatures>;
type Holding = V.Contract<V.RustFeatures>;

export type LackedPathIsMissing = Expect<Equal<V.Paths<Lacking>['declaration.struct'], V.Missing<V.Structs>>>;

export type HeldPathIsItsInterface = Expect<Equal<V.Paths<Holding>['declaration.struct'], V.Declaration.Struct<Holding>>>;

export type LackedMemberIsMissing = Expect<
	Equal<V.Type.Reference<Lacking>['lifetime'], V.Missing<V.Lifetimes> | undefined>
>;

export type LevelHoldsAHeldPath = Expect<
	Equal<Extract<V.Declaration.Any<Holding>, { readonly $path: 'declaration.struct' }>, V.Declaration.Struct<Holding>>
>;

declare const marker: V.Structs;

// @ts-expect-error no value is Missing, the feature's own marker included
export const markerShaped: V.Missing<V.Structs> = { $missing: marker };
// @ts-expect-error no value is Missing, an empty object included
export const empty: V.Missing<V.Structs> = {};

export type ReadsNoLackedPath = Expect<Equal<Extract<V.ReadOf<Lacking>, V.Missing<unknown>>, never>>;

// @ts-expect-error a structure naming a path from a feature the map lacks has no input
export const struct: V.InputOf<V.Paths<Lacking>['declaration.struct'], Lacking> = { $path: 'declaration.struct', name: 'S' };
