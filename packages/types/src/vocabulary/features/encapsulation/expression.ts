import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Expression {
	export interface Member<G extends GrammarMap, K extends Under<'expression.member'> = 'expression.member'> {
		readonly privateName?: Flag;
		// t only
	}
}
