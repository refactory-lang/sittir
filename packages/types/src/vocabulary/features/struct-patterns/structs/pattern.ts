import type { GrammarMap, Text } from '../../../map.ts';
export namespace Pattern {
	export namespace Struct {
		// claimed by r
		export type Rest<G extends GrammarMap> = Text<G, 'pattern.struct.rest'>;
	}
}
