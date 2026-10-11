import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Union<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.union';
		readonly body: G['slots']['declaration.union']['body'][];
		readonly name: V.Identifier.Type<G>;
	}
}
