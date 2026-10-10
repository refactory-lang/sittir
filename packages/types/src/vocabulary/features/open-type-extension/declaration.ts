import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.extension';
		readonly implements?: G['slots']['declaration.extension']['implements'];
		readonly receiver?: V.Declaration.Parameter.Self<G>;
		readonly traitClause?: G['slots']['declaration.extension']['traitClause'];
		readonly type: G['slots']['declaration.extension']['type'];
	}
}
