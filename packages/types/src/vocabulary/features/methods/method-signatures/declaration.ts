import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> extends SubKindOf<V.Declaration.Method<G, K>, 'async' | 'override' | 'returnType' | 'typeParameters'> {
			// claimed by rt
			readonly $path: K;
			readonly functionModifiers?: Slot<G, K, 'functionModifiers', V.Modifier.Extern<G> | string>[];
			// r only
			readonly name: Slot<
				G,
				K,
				'name',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| string
				| V.Declaration.Module<G>
			>;
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
			readonly static?: Flag;
			// t only
		}
	}
}
