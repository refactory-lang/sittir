import type { GrammarMap, Text } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Function<G extends GrammarMap> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// t only
	}
	// claimed by t
	export type Receiver<G extends GrammarMap> = Text<G, 'type.receiver'>;
}
