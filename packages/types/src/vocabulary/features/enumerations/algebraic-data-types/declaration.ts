import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace EnumMember {
		export interface Struct<G extends GrammarMap> extends SubKindOf<V.Declaration.EnumMember<G>, 'body' | 'name' | 'value'> {
			// claimed by r
			readonly $kind: 'declaration.enum_member.struct';
			readonly body?: Slot<
				G,
				'declaration.enum_member.struct',
				'body',
				| V.Declaration.Field<G>
				| V.Declaration.Field.Private<G>
				| V.Declaration.Field.Public.Any<G>
			>[];
			readonly name: Slot<G, 'declaration.enum_member.struct', 'name', V.Identifier.Any<G>>;
			readonly value?: Slot<
				G,
				'declaration.enum_member.struct',
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
		export interface Tuple<G extends GrammarMap> extends SubKindOf<V.Declaration.EnumMember<G>, 'body' | 'name' | 'value'> {
			// claimed by r
			readonly $kind: 'declaration.enum_member.tuple';
			readonly body?: Slot<
				G,
				'declaration.enum_member.tuple',
				'body',
				| V.Declaration.Field<G>
				| V.Declaration.Field.Private<G>
				| V.Declaration.Field.Public.Any<G>
			>[];
			readonly name: Slot<G, 'declaration.enum_member.tuple', 'name', V.Identifier.Any<G>>;
			readonly value?: Slot<
				G,
				'declaration.enum_member.tuple',
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
	}
}
