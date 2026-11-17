import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
export interface Attribute<G extends GrammarMap, K extends Under<'attribute'> = 'attribute'> {
	readonly $path: K;
}

