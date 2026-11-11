import type { NodeMethods } from './engine-api.ts';

export type MatchedAlternative<I, Alts extends string, Side extends 'open' | 'close' = 'open'> = Alts extends string
	? I extends (Side extends 'open' ? `${Alts}${string}` : `${string}${Alts}`)
		? Alts
		: never
	: never;

export type SpelledAffix<I, Alts extends string, Default extends Alts, Side extends 'open' | 'close' = 'open'> = I extends string
	? [MatchedAlternative<I, Alts, Side>] extends [never]
		? Unbounded<I> extends true
			? Alts
			: Default
		: MatchedAlternative<I, Alts, Side>
	: Default;

export type CoercedSpelling<
	I,
	O,
	K extends string,
	Alts extends string,
	Default extends Alts,
	Side extends 'open' | 'close' = 'open'
> = 0 extends 1 & I
	? Alts
	: I extends NodeMethods
		? I extends Record<`_${K}`, infer P extends Alts>
			? P
			: Alts
		: 0 extends 1 & O
			? Alts
			: OptionedSpelling<O, K, SpelledAffix<I, Alts, Default, Side>>;

type OptionedSpelling<O, K extends string, Fallback> = O extends unknown
	? K extends keyof O
		? Exclude<O[K], undefined> | (MayLack<O, K> extends true ? Fallback : never)
		: Fallback
	: never;

type MayLack<O, K extends keyof O> = K extends NamedKeys<O>
	? {} extends Pick<O, K>
		? true
		: undefined extends O[K]
			? true
			: false
	: true;

type NamedKeys<O> = keyof { [P in keyof O as Unbounded<P> extends true ? never : P]: O[P] };

type Unbounded<K extends PropertyKey> = {} extends Record<K, true> ? true : false;

export type WithSpelling<B, K extends string, P> = { readonly [Key in `_${K}`]: P } & { [Key in K]: () => P } & B;

export type Interior<I extends string, Open extends string, Close extends string> = I extends `${Open}${infer Rest}`
	? Rest extends `${infer Inner}${Close}`
		? Inner
		: I
	: I;

export type LeadCheck<Inner extends string, Leads> = Leads extends readonly [
	readonly [infer L extends string, infer B extends string],
	...infer Rest
]
	? Inner extends `${L}${string}`
		? { readonly [K in `starts the way ${B} does; build it with ${B}`]: never }
		: LeadCheck<Inner, Rest>
	: unknown;

export type SiblingLeadRefusal<
	I,
	Open extends string,
	Close extends string,
	Leads extends readonly (readonly [string, string])[]
> = string extends I ? unknown : I extends string ? LeadCheck<Interior<I, Open, Close>, Leads> : unknown;

type AllOf<S extends string, C extends string> = S extends ''
	? true
	: S extends `${C}${infer Rest}`
		? AllOf<Rest, C>
		: false;

export type OnlyOf<I extends string, C extends string> = string extends I
	? I
	: I extends ''
		? never
		: AllOf<I, C> extends true
			? I
			: never;
