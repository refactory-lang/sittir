import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.enum';
		readonly body: Slot<G, 'declaration.enum', 'body', V.Declaration.EnumMember.Any<G>>[];
		readonly const?: Flag;
		// t only
		readonly name: Slot<G, 'declaration.enum', 'name', V.Identifier.Any<G>>;
	}
	export interface EnumMember<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.enum_member';
		readonly body?: Slot<
			G,
			'declaration.enum_member',
			'body',
			| V.Declaration.Field<G>
			| V.Declaration.Field.Private<G>
			| V.Declaration.Field.Public.Any<G>
		>[];
		// r only
		readonly name: Slot<
			G,
			'declaration.enum_member',
			'name',
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
		>;
		readonly value?: Slot<
			G,
			'declaration.enum_member',
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
	}
}
