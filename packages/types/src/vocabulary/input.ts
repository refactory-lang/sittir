import type { Formed, GrammarMap, NodesAt, Paths, Read, Valued } from './map.ts';
import type { Missing, NamedFlags } from './utils.ts';

type Extra<G extends GrammarMap, P> = P extends keyof G['inputs'] ? G['inputs'][P] : never;

type Decided<G extends GrammarMap, R, M> = R extends { readonly $path: infer P }
	? P extends keyof G['decided']
		? M extends keyof G['decided'][P]
			? G['decided'][P][M]
			: never
		: never
	: never;

type Tails<G extends GrammarMap, R, M> = R extends { readonly $path: infer P }
	? P extends keyof G['tails']
		? M extends keyof G['tails'][P]
			? G['tails'][P][M]
			: {}
		: {}
	: {};

type MemberInput<T, G extends GrammarMap, D, S> = T extends readonly unknown[]
	? { readonly [I in keyof T]: MemberInput<T[I], G, D, S> }
	: T extends { readonly $path: infer P }
		? Inputs<T, G> | (P extends D ? Pathless<T, G> : never) | (P extends keyof S ? Tailed<T, G, S[P]> : never) | Extra<G, P> | NodesAt<G, P>
		: T;

type Member<R, G extends GrammarMap, M extends keyof R> = MemberInput<R[M], G, Decided<G, R, M>, Tails<G, R, M>>;

type Inputs<R, G extends GrammarMap> = { readonly [M in keyof R]: Member<R, G, M> };

type Members<R, G extends GrammarMap> = { readonly [M in keyof R as M extends '$path' ? never : M]: Member<R, G, M> };

type Pathless<R, G extends GrammarMap> = R extends { readonly $path: infer P } ? Members<R, G> & { readonly $path?: P } : never;

type Tailed<R, G extends GrammarMap, S> = [S] extends [never] ? never : R extends { readonly $path: unknown } ? Members<R, G> & { readonly $path: S } : never;

export type InputOf<R, G extends GrammarMap> = Inputs<NamedFlags<G, Formed<G, R>>, G> | Valued<G, R>;

export type BuildInput<G extends GrammarMap, P extends keyof Paths<G>> = InputOf<Paths<G>[P], G>;

export type TailInput<G extends GrammarMap, P extends keyof Paths<G>, S> = Tailed<NamedFlags<G, Formed<G, Paths<G>[P]>>, G, S>;

export type PathInput<G extends GrammarMap, P extends keyof Paths<G>, S = never> = BuildInput<G, P> | Pathless<NamedFlags<G, Formed<G, Paths<G>[P]>>, G> | TailInput<G, P, S>;

type TextReads<G extends GrammarMap> = {
	readonly [P in keyof G['overrides']]: G['overrides'][P] extends { readonly $text: infer T } ? T : never;
}[keyof G['overrides']];

export type ReadOf<G extends GrammarMap> = Exclude<{ readonly [P in keyof Paths<G>]: Read<G, P> }[keyof Paths<G>], Missing<unknown>> | TextReads<G>;
