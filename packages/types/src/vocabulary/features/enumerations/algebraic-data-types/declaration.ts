import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace EnumMember {
		export interface Struct<G extends GrammarMap, K extends Under<'declaration.enum_member.struct'> = 'declaration.enum_member.struct'> extends SubKindOf<V.Declaration.EnumMember<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly body?: Slot<
				G,
				K,
				'body',
				| V.Declaration.Field<G>
				| V.Declaration.Field.Private<G>
				| V.Declaration.Field.Public.Any<G>
			>[];
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly value?: Slot<
				G,
				K,
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
		export interface Tuple<G extends GrammarMap, K extends Under<'declaration.enum_member.tuple'> = 'declaration.enum_member.tuple'> extends SubKindOf<V.Declaration.EnumMember<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly body?: Slot<
				G,
				K,
				'body',
				| V.Declaration.Field<G>
				| V.Declaration.Field.Private<G>
				| V.Declaration.Field.Public.Any<G>
			>[];
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly value?: Slot<
				G,
				K,
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
	}
}
