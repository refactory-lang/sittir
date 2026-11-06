import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
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
		export interface Default<G extends GrammarMap, K extends Under<'declaration.parameter.default'> = 'declaration.parameter.default'> {
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
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> {
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
