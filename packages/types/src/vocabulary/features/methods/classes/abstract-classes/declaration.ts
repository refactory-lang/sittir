import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Class<G extends GrammarMap, K extends Under<'declaration.type.class'> = 'declaration.type.class'> {
			readonly abstract?: Flag;
			// t only
		}
	}
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly abstract?: Flag;
			// t only
		}
		export namespace Method {
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract'> = 'declaration.member.method.signature.abstract'> extends SubKindOf<V.Declaration.Member.Method.Signature<G, K>, 'name' | 'optional' | 'override' | 'parameters' | 'returnType' | 'typeParameters'> {
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
			export interface Construct<G extends GrammarMap, K extends Under<'declaration.member.signature.construct'> = 'declaration.member.signature.construct'> {
				readonly abstract?: Flag;
			}
		}
	}
}
