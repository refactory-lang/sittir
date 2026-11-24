import type { GrammarMap, Text } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Pattern {
	export namespace Struct {
		// claimed by r
		export type Rest<G extends GrammarMap> = Text<G, 'pattern.struct.rest'>;
		export interface Tuple<G extends GrammarMap, K extends Under<'pattern.struct.tuple'> = 'pattern.struct.tuple'> extends SubKindOf<V.Pattern.Struct<G, K>> {
			// claimed by r
			readonly $path: K;
		}
	}
}
