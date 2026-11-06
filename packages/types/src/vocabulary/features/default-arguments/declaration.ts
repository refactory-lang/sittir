import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Parameter<G extends GrammarMap> {
		readonly default?: Slot<
			G,
			'declaration.parameter',
			'default',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// pt only
	}
	export namespace Parameter {
		export interface Default<G extends GrammarMap> {
			readonly default: Slot<
				G,
				'declaration.parameter.default',
				'default',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
		export interface TypedDefault<G extends GrammarMap> {
			readonly default: Slot<
				G,
				'declaration.parameter.typed_default',
				'default',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
	}
}
