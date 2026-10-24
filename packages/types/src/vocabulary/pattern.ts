import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Pattern<G extends GrammarContext<G>> {
	readonly $kind: 'pattern';
}

export interface PatternSynonyms {
	readonly list: 'array' | 'slice';
	readonly map: 'dictionary' | 'dict';
	readonly rest: 'splat' | 'unpack';
	readonly struct: 'record';
}

export namespace Pattern {
	export interface Mutable<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.mutable';
		readonly pattern: G['slots']['pattern.mutable']['pattern'];
	}
}
