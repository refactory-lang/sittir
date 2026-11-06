import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Generator<G extends GrammarMap, K extends Under<'expression.block.generator'> = 'expression.block.generator'> extends SubKindOf<V.Expression.Block<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
			readonly move?: Flag;
		}
	}
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> {
		readonly static?: Flag;
		// r only
	}
	export interface Yield<G extends GrammarMap, K extends Under<'expression.yield'> = 'expression.yield'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly content?: Slot<
			G,
			K,
			'content',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly expression?: Slot<
			G,
			K,
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
