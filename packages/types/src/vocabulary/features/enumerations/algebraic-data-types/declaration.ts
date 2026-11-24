import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace EnumMember {
			export interface Struct<G extends GrammarMap, K extends Under<'declaration.member.enum_member.struct'> = 'declaration.member.enum_member.struct'> extends SubKindOf<V.Declaration.Member.EnumMember<G, K>, 'fields' | 'name' | 'value'> {
				// claimed by r
				readonly $path: K;
				readonly fields?: Slot<
					G,
					K,
					'fields',
					| V.Declaration.Member.Field<G>
					| V.Declaration.Member.Field.Private<G>
					| V.Declaration.Member.Field.Public.Any<G>
				>[];
				readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
				readonly value?: Slot<G, K, 'value', V.Expression.Any<G>>;
			}
			export interface Tuple<G extends GrammarMap, K extends Under<'declaration.member.enum_member.tuple'> = 'declaration.member.enum_member.tuple'> extends SubKindOf<V.Declaration.Member.EnumMember<G, K>, 'fields' | 'name' | 'value'> {
				// claimed by r
				readonly $path: K;
				readonly fields?: Slot<
					G,
					K,
					'fields',
					| V.Declaration.Member.Field<G>
					| V.Declaration.Member.Field.Private<G>
					| V.Declaration.Member.Field.Public.Any<G>
				>[];
				readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
				readonly value?: Slot<G, K, 'value', V.Expression.Any<G>>;
			}
		}
	}
}
