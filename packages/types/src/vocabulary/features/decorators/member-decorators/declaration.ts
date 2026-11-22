import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly decorators?: Slot<G, K, 'decorators', V.Attribute.AnyWithExpression<G>>[];
			// t only
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly decorators?: Slot<G, K, 'decorators', V.Attribute.AnyWithExpression<G>>[];
		// t only
	}
}
