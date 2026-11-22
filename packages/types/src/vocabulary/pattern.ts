import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
import type * as V from './index.ts';
export interface Pattern<G extends GrammarMap, K extends Under<'pattern'> = 'pattern'> {
	readonly $path: K;
}

export interface PatternSynonyms {
	readonly list: 'array' | 'slice';
	readonly map: 'dictionary' | 'dict';
	readonly rest: 'splat' | 'unpack';
	readonly struct: 'record';
}
export namespace Pattern {
	export type Identifier<G extends GrammarMap> = V.Identifier.Any<G>;
	export type Literal<G extends GrammarMap> = V.Literal.Any<G>;
	export type Member<G extends GrammarMap> = V.Expression.Member<G>;
	export type Subscript<G extends GrammarMap> = V.Expression.Subscript<G>;
}
