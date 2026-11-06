import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Pattern<G extends GrammarMap> {
	readonly $kind: 'pattern';
}

export interface PatternSynonyms {
	readonly list: 'array' | 'slice';
	readonly map: 'dictionary' | 'dict';
	readonly rest: 'splat' | 'unpack';
	readonly struct: 'record';
}

export namespace Pattern {
	export interface Mutable<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.mutable';
		readonly pattern: Slot<G, 'pattern.mutable', 'pattern', unknown>;
	}
}
