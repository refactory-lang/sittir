import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Enum<G extends GrammarMap, K extends Under<'declaration.type.enum'> = 'declaration.type.enum'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by rt
			readonly $path: K;
			readonly members: Slot<G, K, 'members', V.Declaration.Member.EnumMember.Any<G>>[];
			readonly const?: Flag;
			// t only
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
	export namespace Member {
		export interface EnumMember<G extends GrammarMap, K extends Under<'declaration.member.enum_member'> = 'declaration.member.enum_member'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by rt
			readonly $path: K;
			readonly fields?: Slot<
				G,
				K,
				'fields',
				| V.Declaration.Member.Field<G>
				| V.Declaration.Member.Field.Private<G>
				| V.Declaration.Member.Field.Public.Any<G>
			>[];
			// r only
			readonly name: Slot<
				G,
				K,
				'name',
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| string
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
			>;
			readonly value?: Slot<
				G,
				K,
				'value',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
	}
}
