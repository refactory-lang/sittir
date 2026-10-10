// The three mapped types, written against the vocabulary's own shapes: a kind is an interface
// whose `$kind` is its dotted path, the vocabulary's kinds are one union, a flag is a member typed
// with the `Flag` marker, and a gated member is typed through `In` (Absent where it fails).

export declare const flag: unique symbol;
export type Flag = typeof flag;
export declare const absent: unique symbol;
export type Absent<F> = { readonly [absent]: F };
export type In<G, F, T, Otherwise = Absent<F>> = G extends F ? T : Otherwise;

type Kinded = { readonly $kind: string };
export type Paths<K extends Kinded> = K['$kind'];
export type KindOf<K extends Kinded, P extends string> = Extract<K, { readonly $kind: P }>;

// (2) A kind's flags: its members typed with the marker, gated like any member.
export type FlagNames<I> = {
	[M in keyof I]-?: [Exclude<I[M], undefined>] extends [never]
		? never
		: [Exclude<I[M], undefined>] extends [Flag]
			? M
			: never;
}[keyof I] &
	string;
export type KindFlags<K extends Kinded, P extends string> = FlagNames<KindOf<K, P>>;

// (1) Crossings: an owner that authors a shared axis's values crosses them with its own
// structural refinements, the structural segments first.
type ValuesOf<K extends Kinded, Root extends string> = Paths<K> extends infer P
	? P extends `${Root}.${infer V}`
		? V
		: never
	: never;
type Head<V extends string> = V extends `${infer H}.${string}` ? H : V;
type OwnersOf<K extends Kinded, Root extends string, V extends string = ValuesOf<K, Root>> = V extends string
	? Paths<K> extends infer P
		? P extends `${infer O}.${V}`
			? O extends Root | `${Root}.${string}`
				? never
				: O
			: never
		: never
	: never;
type OwnValues<K extends Kinded, Root extends string, O extends string> = Paths<K> extends infer P
	? P extends `${O}.${infer V}`
		? V extends ValuesOf<K, Root>
			? V
			: never
		: never
	: never;
type StatesValue<S extends string, H extends string> = S extends H | `${H}.${string}` | `${string}.${H}` | `${string}.${H}.${string}` ? true : false;
type StructuralOf<K extends Kinded, Root extends string, O extends string> = Paths<K> extends infer P
	? P extends `${O}.${infer S}`
		? StatesValue<S, Head<ValuesOf<K, Root>>> extends true
			? never
			: S
		: never
	: never;
// A shared axis's root is a modifier kind with values beneath it, so the namespace names it.
export type SharedRoots<K extends Kinded> = Paths<K> extends infer P
	? P extends `modifier.${infer R}.${string}`
		? `modifier.${R}`
		: never
	: never;
export type Crossings<K extends Kinded, Root extends string = SharedRoots<K>> = Root extends string ? CrossingsOf<K, Root> : never;
type CrossingsOf<K extends Kinded, Root extends string> = OwnersOf<K, Root> extends infer O
	? O extends string
		? StructuralOf<K, Root, O> extends infer S
			? S extends string
				? OwnValues<K, Root, O> extends infer V
					? V extends string
						? `${O}.${S}.${V}` extends Paths<K>
							? never
							: Omit<KindOf<K, `${O}.${S}`>, '$kind'> &
									Omit<KindOf<K, `${O}.${V}`>, keyof KindOf<K, O>> & { readonly $kind: `${O}.${S}.${V}` }
						: never
					: never
				: never
			: never
		: never
	: never;

// (3) The chain: a step leaves out the facts its flag excludes. The language's context carries
// its grammar's exclusions, pairs of facts keyed by the kind whose rule never spells both.
type Segments<P extends string> = P extends `${infer H}.${infer T}` ? H | Segments<T> : P;
type Lineage<P extends string> = P extends `${infer H}.${infer T}` ? H | `${H}.${Lineage<T>}` : P;
type PairsOf<G, P extends string> = G extends { readonly $exclusions: infer E }
	? E[keyof E & Lineage<P>] extends infer L
		? L extends readonly (infer Pair)[]
			? Pair
			: never
		: never
	: never;
type ExcludedBy<Pair, S> = Pair extends readonly [infer A, infer B] ? (A extends S ? B : B extends S ? A : never) : never;
export type Chain<G, K extends Kinded, P extends string, S extends string = Segments<P>> = {
	readonly [F in Exclude<KindFlags<K, P>, S | ExcludedBy<PairsOf<G, P>, S>>]: Chain<G, K, P, S | F>;
} & ((input: Omit<KindOf<K, P>, '$kind'>) => KindOf<K, P>);
