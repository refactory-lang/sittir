import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Throw<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by pt
		readonly $kind: 'statement.throw';
		readonly cause?: Slot<
			G,
			'statement.throw',
			'cause',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly expression?: Slot<
			G,
			'statement.throw',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	export interface Try<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by pt
		readonly $kind: 'statement.try';
		readonly alternative?: V.Clause.Else<G>;
		// p only
		readonly body: Slot<G, 'statement.try', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly finalizer?: V.Clause.Finally<G>;
		readonly handlers?: Slot<G, 'statement.try', 'handlers', V.Clause.Any<G>>[];
	}
}
