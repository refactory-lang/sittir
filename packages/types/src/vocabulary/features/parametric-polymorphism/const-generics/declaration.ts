import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeParameter {
		export interface Value<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeParameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_parameter.value';
			readonly default?: G['slots']['declaration.type_parameter.value']['default'];
			readonly name: G['identifier'];
			readonly type: G['slots']['declaration.type_parameter.value']['type'];
		}
	}
}
