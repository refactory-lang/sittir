import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.extension';
		readonly body: Slot<
			G,
			'declaration.extension',
			'body',
			| V.Attribute.Any<G>
			| V.Declaration.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Statement.Any<G>
		>[];
		readonly implements?: Slot<G, 'declaration.extension', 'implements', unknown>;
		readonly traitClause?: Slot<G, 'declaration.extension', 'traitClause', unknown>;
		readonly type: Slot<
			G,
			'declaration.extension',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
}
