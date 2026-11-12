import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Expression {
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly async?: Flag;
	}
}
