import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
export interface Pattern<G extends GrammarMap, K extends Under<'pattern'> = 'pattern'> {
	readonly $path: K;
}

export interface PatternSynonyms {
	readonly list: 'array' | 'slice';
	readonly map: 'dictionary' | 'dict';
	readonly rest: 'splat' | 'unpack';
	readonly struct: 'record';
}

