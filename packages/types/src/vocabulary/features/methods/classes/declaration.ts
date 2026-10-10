import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.class';
		readonly body: G['slots']['declaration.class']['body'] | G['slots']['declaration.class']['body'][];
		readonly doc?: V.Literal.String<G>;
		readonly name: G['identifier'];
	}
	export interface Constructor<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.constructor';
	}
}
