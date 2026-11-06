import type { GrammarMap } from './map.ts';
export interface Modifier<G extends GrammarMap> {
	readonly $kind: 'modifier';
}

export interface ModifierSynonyms {
	readonly internal: 'crate';
}
