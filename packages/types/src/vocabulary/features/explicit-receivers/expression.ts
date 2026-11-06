import type { GrammarMap } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
	}
}
