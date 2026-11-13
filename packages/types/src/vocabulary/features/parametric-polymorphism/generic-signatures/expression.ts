import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> {
		readonly typeArguments?: Slot<
			G,
			K,
			'typeArguments',
			| V.Element.TypeArgument<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
		// rt only
	}
	export namespace Call {
		export interface Member<G extends GrammarMap, K extends Under<'expression.call.member'> = 'expression.call.member'> {
			readonly typeArguments?: Slot<
				G,
				K,
				'typeArguments',
				| V.Element.TypeArgument<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>[];
			// rt only
		}
	}
	export interface Instantiation<G extends GrammarMap, K extends Under<'expression.instantiation'> = 'expression.instantiation'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly function: Slot<
			G,
			K,
			'function',
			| V.Declaration.Module<G>
			| V.Expression.Member<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		readonly typeArguments: Slot<
			G,
			K,
			'typeArguments',
			| V.Element.TypeArgument<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
	}
}
