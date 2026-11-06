import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> extends SubKindOf<V.Declaration.Function<G, K>, 'async' | 'returnType' | 'typeParameters'> {
			// claimed by rt
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
				| V.Declaration.Parameter.Variadic<G>
				| string
				| V.Type.Any<G>
			>[];
		}
	}
}
