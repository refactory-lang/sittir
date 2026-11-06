import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface TypeAlias<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.type_alias';
		readonly name?: V.Identifier<G>;
		readonly value?: G['slots']['declaration.type_alias']['value'];
	}
}
