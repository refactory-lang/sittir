import type { GrammarMap, Text } from '../../map.ts';
export namespace Type {
	export namespace Primitive {
		// claimed by r
		export type Character<G extends GrammarMap> = Text<G, 'type.primitive.character'>;
	}
}
