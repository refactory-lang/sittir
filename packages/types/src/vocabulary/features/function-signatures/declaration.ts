import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> extends SubKindOf<V.Declaration.Function<G, K>, 'async' | 'name' | 'parameters' | 'receiver' | 'returnType' | 'typeParameters' | 'whereClause'> {
			// claimed by rt
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly parameters: Slot<G, K, 'parameters', V.Declaration.Parameter.AnyWithType<G> | V.Clause.Bounds.Removed<G> | string>[];
		}
	}
}
