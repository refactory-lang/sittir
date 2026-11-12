export type Unfolded<Args> = Args extends readonly unknown[]
	? number extends Args['length']
		? Args
		: Args extends readonly []
			? []
			: Args extends readonly [infer Head, ...infer Rest]
				? [Head, ...Unfolded<Rest>]
				: Args extends readonly [(infer Head)?, ...infer Rest]
					? [] | [Head | undefined, ...Unfolded<Rest>]
					: Args
	: Args;

type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type IdenticalToSome<M, B> = B extends unknown ? Identical<M, B> : never;

type Outside<A, B> = A extends unknown ? (true extends IdenticalToSome<A, B> ? never : A) : never;

type MembersWithin<A, B> = Identical<A, B> extends true ? true : [Outside<A, B>] extends [never] ? true : false;

type ListWithin<U extends readonly unknown[], V extends readonly unknown[]> = number extends U['length']
	? false
	: number extends V['length']
		? false
		: U['length'] extends V['length']
			? false extends { [I in keyof U]: I extends keyof V ? MembersWithin<U[I], V[I]> : false }[number]
				? false
				: true
			: false;

type ListCovered<List, By> = By extends readonly unknown[] ? (List extends readonly unknown[] ? ListWithin<List, By> : false) : false;

type Uncaught<Lists, By> = Lists extends unknown ? (true extends ListCovered<Lists, By> ? never : Lists) : never;

type TupleWithin<U, V> = [Uncaught<Unfolded<U>, Unfolded<V>>] extends [never] ? true : false;

type StrictlyCovering<U, Others> = Others extends unknown
	? TupleWithin<U, Others> extends true
		? TupleWithin<Others, U> extends true
			? never
			: Others
		: never
	: never;

type Restating<T, Later> = Later extends unknown
	? TupleWithin<T, Later> extends true
		? TupleWithin<Later, T> extends true
			? Later
			: never
		: never
	: never;

export type UnlessRestated<T, Later> = T extends readonly unknown[]
	? number extends T['length']
		? T
		: [Restating<T, Later>] extends [never]
			? T
			: never
	: T;

export type Uncovered<U, All = U> = U extends unknown ? ([StrictlyCovering<U, Exclude<All, U>>] extends [never] ? U : never) : never;
