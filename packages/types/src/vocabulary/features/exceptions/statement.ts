import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Throw<G extends GrammarMap, K extends Under<'statement.throw'> = 'statement.throw'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly cause?: Slot<
			G,
			K,
			'cause',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly expression?: Slot<G, K, 'expression', V.Expression.Any<G>>;
	}
	export interface Try<G extends GrammarMap, K extends Under<'statement.try'> = 'statement.try'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly alternative?: Slot<G, K, 'alternative', V.Clause.Else<G>>;
		// p only
		readonly finalizer?: Slot<G, K, 'finalizer', V.Clause.Finally<G>>;
		readonly handlers?: Slot<G, K, 'handlers', V.Clause.Any<G>>[];
		readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
	}
}
