import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap, K extends Under<'declaration.class'> = 'declaration.class'> {
		readonly abstract?: Flag;
		// t only
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly abstract?: Flag;
		// t only
	}
	export namespace Method {
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> extends SubKindOf<V.Declaration.Method.Signature<G, K>> {
				// claimed by t
				readonly $path: K;
				readonly name: Slot<
					G,
					K,
					'name',
					| V.Expression.Any<G>
					| V.Literal.Any<G>
					| V.Identifier<G>
					| string
					| V.Declaration.Module<G>
					| V.Identifier.Any<G>
				>;
				readonly parameters: Slot<
					G,
					K,
					'parameters',
					| V.Declaration.Parameter<G>
					| V.Declaration.Parameter.Private<G>
					| V.Declaration.Parameter.Protected<G>
					| V.Declaration.Parameter.Public<G>
					| V.Declaration.Parameter.Receiver<G>
				>[];
			}
		}
	}
	export namespace Signature {
		export interface Construct<G extends GrammarMap, K extends Under<'declaration.signature.construct'> = 'declaration.signature.construct'> {
			readonly abstract?: Flag;
		}
	}
}
