import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeParameter {
		export interface Const<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeParameter<G>> {
			readonly $kind: 'declaration.type_parameter.const';
			readonly name: G['identifier'];
			readonly type: G['slots']['declaration.type_parameter.const']['type'];
			readonly value?: G['slots']['declaration.type_parameter.const']['value'];
		}
	}
}
