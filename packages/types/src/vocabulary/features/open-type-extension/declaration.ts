import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.extension';
		readonly body: G['slots']['declaration.extension']['body'][];
		readonly implements?: G['slots']['declaration.extension']['implements'];
		readonly traitClause?: G['slots']['declaration.extension']['traitClause'];
		readonly type: G['slots']['declaration.extension']['type'];
	}
}
