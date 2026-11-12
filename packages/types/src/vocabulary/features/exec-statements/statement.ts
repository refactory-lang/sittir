import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Exec<G extends GrammarMap, K extends Under<'statement.exec'> = 'statement.exec'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly code: Slot<
			G,
			K,
			'code',
			| V.Identifier.Any<G>
			| V.Literal.String<G>
			| V.Literal.String.Multiline<G>
			| V.Literal.String.Raw.Any<G>
			| V.Literal.String.Bytes.Any<G>
			| V.Literal.String.Interpolated.Any<G>
			| V.Literal.String.Unicode<G>
		>;
		readonly inClauses?: Slot<
			G,
			K,
			'inClauses',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>[];
	}
}
