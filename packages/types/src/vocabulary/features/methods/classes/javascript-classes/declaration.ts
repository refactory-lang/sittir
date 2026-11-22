import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly static?: Flag;
			// t only
		}
		export namespace Field {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.field.signature'> = 'declaration.member.field.signature'> {
				readonly static?: Flag;
			}
		}
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
			readonly static?: Flag;
		}
		export interface StaticBlock<G extends GrammarMap, K extends Under<'declaration.member.static_block'> = 'declaration.member.static_block'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly statements: Slot<
				G,
				K,
				'statements',
				| V.Attribute.Any<G>
				| V.Declaration.Any<G>
				| V.Expression.Call.Macro<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
				| V.Statement.Any<G>
			>[];
		}
	}
}
