import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
export interface Modifier<G extends GrammarMap, K extends Under<'modifier'> = 'modifier'> {
	readonly $kind: K;
}

export interface ModifierSynonyms {
	readonly internal: 'crate';
}
