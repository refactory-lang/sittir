import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Pattern<G extends GrammarMap, K extends Under<'pattern'> = 'pattern'> {
	readonly $kind: K;
}

export interface PatternSynonyms {
	readonly list: 'array' | 'slice';
	readonly map: 'dictionary' | 'dict';
	readonly rest: 'splat' | 'unpack';
	readonly struct: 'record';
}

export namespace Pattern {
	export interface Mutable<G extends GrammarMap, K extends Under<'pattern.mutable'> = 'pattern.mutable'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly pattern: Slot<G, K, 'pattern', unknown>;
	}
}
