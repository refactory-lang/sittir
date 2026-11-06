import type { Formed, GrammarMap, Paths, Read } from './map.ts';

type Extra<G extends GrammarMap, P> = P extends keyof G['inputs'] ? G['inputs'][P] : never;

type MemberInput<T, G extends GrammarMap> = T extends readonly unknown[]
	? { readonly [I in keyof T]: MemberInput<T[I], G> }
	: T extends { readonly $path: infer P }
		? Inputs<T, G> | Extra<G, P>
		: T;

type Inputs<R, G extends GrammarMap> = { readonly [M in keyof R]: MemberInput<R[M], G> };

export type InputOf<R, G extends GrammarMap> = Inputs<Formed<G, R>, G>;

type TextReads<G extends GrammarMap> = {
	readonly [P in keyof G['overrides']]: G['overrides'][P] extends { readonly $text: infer T } ? T : never;
}[keyof G['overrides']];

export type ReadOf<G extends GrammarMap> = { readonly [P in keyof Paths<G>]: Read<G, P> }[keyof Paths<G>] | TextReads<G>;
