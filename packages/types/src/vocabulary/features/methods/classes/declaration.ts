import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Class<G extends GrammarMap, K extends Under<'declaration.type.class'> = 'declaration.type.class'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by pt
			readonly $path: K;
			readonly members: Slot<G, K, 'members', V.Declaration.Member.AnyWithStatement<G>>[];
			readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
			// p only
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
	export namespace Member {
		export interface Constructor<G extends GrammarMap, K extends Under<'declaration.member.constructor'> = 'declaration.member.constructor'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by pt
			readonly $path: K;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Defaulted<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
				| V.Declaration.Parameter.Typed<G>
				| V.Declaration.Parameter.TypedDefault<G>
				| V.Identifier.Any<G>
				| V.Pattern.Rest<G>
				| V.Pattern.Rest.Map<G>
				| V.Pattern.Tuple<G>
				| string
			>[];
			readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
		}
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
		}
		export namespace Field {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.field.signature'> = 'declaration.member.field.signature'> {
			}
		}
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
		}
	}
}
