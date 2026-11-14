import type { Formed, GrammarMap, Paths, Read } from './map.ts';
import type { Missing, NamedFlags } from './utils.ts';

type Extra<G extends GrammarMap, P> = P extends keyof G['inputs'] ? G['inputs'][P] : never;

type MemberInput<T, G extends GrammarMap> = T extends readonly unknown[]
	? { readonly [I in keyof T]: MemberInput<T[I], G> }
	: T extends { readonly $path: infer P }
		? Inputs<T, G> | Extra<G, P>
		: T;

type Inputs<R, G extends GrammarMap> = { readonly [M in keyof R]: MemberInput<R[M], G> };

export type InputOf<R, G extends GrammarMap> = Inputs<NamedFlags<G, Formed<G, R>>, G>;

export type BuildInput<G extends GrammarMap, P extends keyof Paths<G>> = InputOf<Paths<G>[P], G>;

export type BuildItem<G extends GrammarMap, P extends keyof Paths<G>, M extends keyof BuildInput<G, P>> =
	NonNullable<BuildInput<G, P>[M]> extends readonly (infer I)[] ? I : NonNullable<BuildInput<G, P>[M]>;

type TextReads<G extends GrammarMap> = {
	readonly [P in keyof G['overrides']]: G['overrides'][P] extends { readonly $text: infer T } ? T : never;
}[keyof G['overrides']];

export type ReadOf<G extends GrammarMap> = Exclude<{ readonly [P in keyof Paths<G>]: Read<G, P> }[keyof Paths<G>], Missing<unknown>> | TextReads<G>;
