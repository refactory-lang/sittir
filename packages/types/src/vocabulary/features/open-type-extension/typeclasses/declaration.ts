import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> extends SubKindOf<V.Declaration.Extension<G, K>, 'body' | 'implements' | 'traitClause' | 'type'> {
			// claimed by r
			readonly $kind: K;
			readonly body: Slot<
				G,
				'declaration.extension.conformance',
				'body',
				| V.Attribute.Any<G>
				| V.Declaration.Any<G>
				| V.Expression.Call.Macro<G>
				| V.Statement.Any<G>
			>[];
			readonly implements?: Slot<G, 'declaration.extension.conformance', 'implements', unknown>;
			readonly traitClause?: Slot<G, 'declaration.extension.conformance', 'traitClause', unknown>;
			readonly type: Slot<
				G,
				'declaration.extension.conformance',
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
}
