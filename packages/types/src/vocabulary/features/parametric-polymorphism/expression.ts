import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> {
		readonly typeArguments?: Slot<G, 'expression.call', 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
		// t only
	}
	export namespace Call {
		export interface Construct<G extends GrammarMap, K extends Under<'expression.call.construct'> = 'expression.call.construct'> {
			readonly typeArguments?: Slot<G, 'expression.call.construct', 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
		}
		export interface Member<G extends GrammarMap, K extends Under<'expression.call.member'> = 'expression.call.member'> {
			readonly typeArguments?: Slot<G, 'expression.call.member', 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
			// t only
		}
	}
	export interface Class<G extends GrammarMap, K extends Under<'expression.class'> = 'expression.class'> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Instantiation<G extends GrammarMap, K extends Under<'expression.instantiation'> = 'expression.instantiation'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by rt
		readonly $kind: K;
		readonly function: Slot<
			G,
			'expression.instantiation',
			'function',
			| V.Declaration.Module<G>
			| V.Expression.Member<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		readonly typeArguments: Slot<
			G,
			'expression.instantiation',
			'typeArguments',
			| V.Element.TypeArgument<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
	}
}
