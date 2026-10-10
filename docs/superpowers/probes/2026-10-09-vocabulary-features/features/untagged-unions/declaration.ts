import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Union<G extends GrammarContext> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.union';
		readonly body: V.Declaration.Field<G>[];
		readonly name: V.Identifier.Type<G>;
	}
}
