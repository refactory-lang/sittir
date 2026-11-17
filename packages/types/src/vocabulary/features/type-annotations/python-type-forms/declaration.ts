import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> {
		readonly returnType?: Slot<
			G,
			K,
			'returnType',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Type.Any<G>
		>;
		// p only
	}
	export namespace Parameter {
		export interface Typed<G extends GrammarMap, K extends Under<'declaration.parameter.typed'> = 'declaration.parameter.typed'> {
			readonly type: Slot<
				G,
				K,
				'type',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
				| V.Type.Any<G>
			>;
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> {
			readonly type: Slot<
				G,
				K,
				'type',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
				| V.Type.Any<G>
			>;
		}
	}
}
