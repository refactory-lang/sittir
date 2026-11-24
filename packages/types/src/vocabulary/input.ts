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

type MemberInput<T, G extends GrammarMap, D> = T extends readonly unknown[]
	? { readonly [I in keyof T]: MemberInput<T[I], G, D> }
	: T extends { readonly $path: infer P }
		? Inputs<T, G> | (P extends D ? Pathless<T, G> : never) | Extra<G, P> | NodesAt<G, P>
		: T;

type Member<R, G extends GrammarMap, M extends keyof R> = MemberInput<R[M], G, Decided<G, R, M>>;

type Inputs<R, G extends GrammarMap> = { readonly [M in keyof R]: Member<R, G, M> };

type Pathless<R, G extends GrammarMap> = R extends { readonly $path: infer P }
	? { readonly [M in keyof R as M extends '$path' ? never : M]: Member<R, G, M> } & { readonly $path?: P }
	: never;

export type InputOf<R, G extends GrammarMap> = Inputs<NamedFlags<G, Formed<G, R>>, G> | Valued<G, R>;

export type BuildInput<G extends GrammarMap, P extends keyof Paths<G>> = InputOf<Paths<G>[P], G>;

export type PathInput<G extends GrammarMap, P extends keyof Paths<G>> = BuildInput<G, P> | Pathless<NamedFlags<G, Formed<G, Paths<G>[P]>>, G>;

type TextReads<G extends GrammarMap> = {
	readonly [P in keyof G['overrides']]: G['overrides'][P] extends { readonly $text: infer T } ? T : never;
}[keyof G['overrides']];

export type ReadOf<G extends GrammarMap> = Exclude<{ readonly [P in keyof Paths<G>]: Read<G, P> }[keyof Paths<G>], Missing<unknown>> | TextReads<G>;
