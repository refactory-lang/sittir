import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Struct<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.struct';
		readonly body?: Slot<
			G,
			'declaration.struct',
			'body',
			| V.Declaration.Field<G>
			| V.Declaration.Field.Private<G>
			| V.Declaration.Field.Public.Any<G>
		>[];
		readonly name: V.Identifier<G>;
		readonly typeParameters?: (
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		)[];
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Struct {
		export interface Tuple<G extends GrammarMap> extends SubKindOf<V.Declaration.Struct<G>, 'body'> {
			// claimed by r
			readonly $kind: 'declaration.struct.tuple';
			readonly body: Slot<
				G,
				'declaration.struct.tuple',
				'body',
				| V.Declaration.Field<G>
				| V.Declaration.Field.Private<G>
				| V.Declaration.Field.Public.Any<G>
			>[];
		}
		export interface Unit<G extends GrammarMap> extends SubKindOf<V.Declaration.Struct<G>> {
			// claimed by r
			readonly $kind: 'declaration.struct.unit';
		}
	}
}
