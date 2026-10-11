import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Self<G extends GrammarContext<G>> {
			readonly lifetime?: V.Identifier.Lifetime<G>;
			// r only
		}
	}
	export namespace TypeParameter {
		export interface Lifetime<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeParameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_parameter.lifetime';
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Lifetime<G>;
		}
	}
}
