import type { GrammarMap, Text } from '../../../map.ts';
export namespace Pattern {
	// claimed by r
	export type Wildcard<G extends GrammarMap> = Text<G, 'pattern.wildcard'>;
}
