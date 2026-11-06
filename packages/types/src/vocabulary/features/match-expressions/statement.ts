import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Match<G extends GrammarMap, K extends Under<'statement.match'> = 'statement.match'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by pr
		readonly $kind: K;
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
