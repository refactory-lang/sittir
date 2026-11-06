import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Function<G extends GrammarMap> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
	}
}
