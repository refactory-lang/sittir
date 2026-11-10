import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Binary {
		export namespace Comparison {
			export interface LooseEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.loose_equal'> = 'expression.binary.comparison.loose_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				// claimed by t
				readonly $path: K;
				readonly operator: '==';
			}
			export interface LooseNotEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.loose_not_equal'> = 'expression.binary.comparison.loose_not_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				// claimed by t
				readonly $path: K;
				readonly operator: '!=';
			}
		}
	}
}
