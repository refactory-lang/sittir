import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Flag, SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap> {
		readonly abstract?: Flag;
		// t only
	}
	export interface Field<G extends GrammarMap> {
		readonly abstract?: Flag;
		// t only
	}
	export namespace Method {
		export namespace Signature {
			export interface Abstract<G extends GrammarMap> extends SubKindOf<V.Declaration.Method.Signature<G>, 'name' | 'parameters' | 'returnType' | 'typeParameters'> {
				// claimed by t
				readonly $kind: 'declaration.method.signature.abstract';
				readonly name: Slot<
					G,
					'declaration.method.signature.abstract',
					'name',
					| V.Expression.Any<G>
					| V.Literal.Any<G>
					| V.Identifier<G>
					| string
					| V.Declaration.Module<G>
					| V.Identifier.Any<G>
				>;
				readonly parameters: (
					| V.Declaration.Parameter<G>
					| V.Declaration.Parameter.Private<G>
					| V.Declaration.Parameter.Protected<G>
					| V.Declaration.Parameter.Public<G>
					| V.Declaration.Parameter.Receiver<G>
				)[];
			}
		}
	}
	export namespace Signature {
		export interface Construct<G extends GrammarMap> {
			readonly abstract?: Flag;
		}
	}
}
