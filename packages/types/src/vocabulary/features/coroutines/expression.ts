import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Generator<G extends GrammarMap> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.generator';
			readonly body: V.Statement.Block<G>;
			readonly move?: Flag;
		}
	}
	export interface Lambda<G extends GrammarMap> {
		readonly static?: Flag;
		// r only
	}
	export interface Yield<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.yield';
		readonly content?: Slot<
			G,
			'expression.yield',
			'content',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly expression?: Slot<
			G,
			'expression.yield',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// rt only
	}
}
