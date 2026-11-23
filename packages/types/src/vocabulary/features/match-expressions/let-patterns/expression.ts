import type { GrammarMap } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export type AnyWithLet<G extends GrammarMap> = V.Expression.Any<G> | V.Clause.Let.Any<G>;
}
