import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
export interface Element<G extends GrammarMap, K extends Under<'element'> = 'element'> {
	readonly $path: K;
}

export interface ElementSynonyms {
	readonly map: 'dictionary' | 'dict';
	readonly spread: 'splat' | 'unpack';
}

