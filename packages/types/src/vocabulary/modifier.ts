import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
export interface Modifier<G extends GrammarMap, K extends Under<'modifier'> = 'modifier'> {
	readonly $path: K;
}

export interface ModifierSynonyms {
	readonly internal: 'crate';
}
