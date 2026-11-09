import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		// t only
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly declarators?: Slot<
			G,
			K,
			'declarators',
			| V.Declaration.Variable<G>
			| V.Declaration.Variable.Pattern<G>
			| V.Declaration.Variable.Constant<G>
			| V.Declaration.Variable.Reassignable<G>
		>[];
		// t only
	}
	export namespace Variable {
		export interface Constant<G extends GrammarMap, K extends Under<'declaration.variable.constant'> = 'declaration.variable.constant'> extends SubKindOf<V.Declaration.Variable<G, K>, 'declarators'> {
			// claimed by t
			readonly $path: K;
			readonly declarators: Slot<
				G,
				K,
				'declarators',
				| V.Declaration.Variable<G>
				| V.Declaration.Variable.Pattern<G>
				| V.Declaration.Variable.Constant<G>
				| V.Declaration.Variable.Reassignable<G>
			>[];
		}
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> extends SubKindOf<V.Declaration.Variable<G, K>, 'type'> {
			// claimed by t
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Pattern.Any<G>>;
			readonly value?: Slot<
				G,
				K,
				'value',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
		export interface Reassignable<G extends GrammarMap, K extends Under<'declaration.variable.reassignable'> = 'declaration.variable.reassignable'> extends SubKindOf<V.Declaration.Variable<G, K>, 'declarators'> {
			// claimed by t
			readonly $path: K;
			readonly declarators: Slot<
				G,
				K,
				'declarators',
				| V.Declaration.Variable<G>
				| V.Declaration.Variable.Pattern<G>
				| V.Declaration.Variable.Constant<G>
				| V.Declaration.Variable.Reassignable<G>
			>[];
		}
		export namespace Reassignable {
			export interface FunctionScoped<G extends GrammarMap, K extends Under<'declaration.variable.reassignable.function_scoped'> = 'declaration.variable.reassignable.function_scoped'> extends SubKindOf<V.Declaration.Variable.Reassignable<G, K>> {
				// claimed by t
				readonly $path: K;
			}
		}
	}
}
