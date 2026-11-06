import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Await<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.await';
		readonly expression: Slot<
			G,
			'expression.await',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Statement.Any<G>
		>;
	}
	export interface Function<G extends GrammarMap> {
		readonly async?: Flag;
	}
	export interface Lambda<G extends GrammarMap> {
		readonly async?: Flag;
		// rt only
	}
}
