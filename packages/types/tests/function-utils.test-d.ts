/**
 * Type-level tests for ArgsOf<F>, OmitEach<T,K>, and Hoisted<B> — the
 * generic factory-shape utilities every grammar package imports rather
 * than re-declaring.
 *
 * These are compile-time tests — they verify the projected shapes
 * directly. If any assertion fails, the file won't compile.
 *
 * Run with: pnpm --filter @sittir/types type-check
 */

import type { ArgsOf, FlavorPair, Hoisted, OmitEach } from '../src/index.ts';

// ---------------------------------------------------------------------------
// Helper: assert types are equal
// ---------------------------------------------------------------------------
type Expect<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// ---------------------------------------------------------------------------
// 1. ArgsOf<F> — always a tuple/array, even for a single fixed positional
//    parameter. Deliberate: the generated sub-factory overlay both spreads
//    it (`(...args: ArgsOf<CF>) => child(...args)`) and indexes it
//    (`ArgsOf<CF>[0]`) — either usage requires an array shape regardless of
//    how many parameters the underlying factory declares.
// ---------------------------------------------------------------------------

declare function single(value: string | { readonly kind: 'Identifier' }): unknown;
type SingleArgs = ArgsOf<typeof single>;
type _t1 = Expect<Equal<SingleArgs, [value: string | { readonly kind: 'Identifier' }]>>;
type _t1b = Expect<Equal<SingleArgs[0], string | { readonly kind: 'Identifier' }>>;

// ---------------------------------------------------------------------------
// 2. ArgsOf<F> — a genuinely variadic rest-parameter function yields the
//    element type as an array, same as a single-param function's 1-tuple.
// ---------------------------------------------------------------------------

declare function variadic(...children: readonly { readonly kind: 'Statement' }[]): unknown;
type VariadicArgs = ArgsOf<typeof variadic>;
type _t2 = Expect<Equal<VariadicArgs, { readonly kind: 'Statement' }[]>>;

// ---------------------------------------------------------------------------
// 3. ArgsOf<F> — the union of every declared overload's own tuple, not just
//    the last one (the historical S2/S3 bug this type was built to fix).
// ---------------------------------------------------------------------------

declare function mixed(value: { readonly kind: 'Block' }): unknown;
declare function mixed(...children: readonly { readonly kind: 'Statement' }[]): unknown;
type MixedArgs = ArgsOf<typeof mixed>;
type _t3 = Expect<Equal<MixedArgs, [value: { readonly kind: 'Block' }] | { readonly kind: 'Statement' }[]>>;

// ---------------------------------------------------------------------------
// 4. ArgsOf<F> — a genuinely multi-parameter overload arm keeps its tuple
//    shape, each parameter its own tuple slot.
// ---------------------------------------------------------------------------

declare function multi(a: string, b: number): unknown;
type MultiArgs = ArgsOf<typeof multi>;
type _t4 = Expect<Equal<MultiArgs, [a: string, b: number]>>;

// ---------------------------------------------------------------------------
// 5. OmitEach<T, K> — distributes Omit over a union rather than collapsing
//    it to the union's common shape first.
// ---------------------------------------------------------------------------

type Union = { kind: 'a'; a: string } | { kind: 'b'; b: number };
type WithoutKind = OmitEach<Union, 'kind'>;
type _t5 = Expect<Equal<WithoutKind, { a: string } | { b: number }>>;

// ---------------------------------------------------------------------------
// 6. Hoisted<B> — a FlavorPair collapses to its coerce flavor (preferred
//    over strict), with sibling keys still reachable on the callable.
// ---------------------------------------------------------------------------

interface Bundle extends FlavorPair<(v: { readonly kind: 'Strict' }) => number, (v: unknown) => number> {
	readonly form: FlavorPair<() => string, () => string>;
}
type HoistedBundle = Hoisted<Bundle>;
type _t6 = Expect<Equal<ReturnType<HoistedBundle>, number>>;
type _t7 = Expect<Equal<ReturnType<HoistedBundle['form']>, string>>;
