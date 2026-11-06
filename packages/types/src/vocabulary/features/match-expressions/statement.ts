import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Match<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by pr
		readonly $kind: 'statement.match';
		readonly body: Slot<G, 'statement.match', 'body', V.Clause.Case.Match<G>>[];
		readonly subject?: Slot<
			G,
			'statement.match',
			'subject',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Pattern.Rest<G>
		>;
	}
}
