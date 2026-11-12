import type { GrammarMap, Slot, Text } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Function<G extends GrammarMap, K extends Under<'type.function'> = 'type.function'> {
		readonly receiver?: Slot<
			G,
			K,
			'receiver',
			| V.Declaration.Parameter.Receiver<G>
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Private<G>
			| V.Declaration.Parameter.Protected<G>
			| V.Declaration.Parameter.Public<G>
		>;
		// t only
	}
	// claimed by t
	export type Receiver<G extends GrammarMap> = Text<G, 'type.receiver'>;
}
