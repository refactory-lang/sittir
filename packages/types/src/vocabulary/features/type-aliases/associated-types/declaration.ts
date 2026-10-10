import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeAlias<G>> {
			readonly $kind: 'declaration.type_alias.associated';
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Type<G>;
		}
	}
}
