import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Binary {
		export namespace Comparison {
			export interface LooseEqual<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				// claimed by t
				readonly $kind: 'expression.binary.comparison.loose_equal';
				readonly operator: '==';
			}
			export interface LooseNotEqual<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				// claimed by t
				readonly $kind: 'expression.binary.comparison.loose_not_equal';
				readonly operator: '!=';
			}
		}
	}
}
