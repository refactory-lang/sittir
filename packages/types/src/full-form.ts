export type MatchedAlternative<I, Alts extends string> = Alts extends string
	? I extends `${Alts}${string}`
		? Alts
		: never
	: never;

export type SpelledAffix<I, Alts extends string, Default extends Alts> = string extends I
	? Alts
	: [MatchedAlternative<I, Alts>] extends [never]
		? Default
		: MatchedAlternative<I, Alts>;

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
