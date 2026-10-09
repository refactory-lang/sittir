import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Binary {
		export namespace Comparison {
			export namespace Equal {
				export interface Loose<G extends GrammarContext> extends SubKindOf<V.Expression.Binary.Comparison.Equal<G>> {
					readonly $kind: 'expression.binary.comparison.equal.loose';
					readonly operator: '==';
				}
			}
			export namespace NotEqual {
				export interface Loose<G extends GrammarContext> extends SubKindOf<V.Expression.Binary.Comparison.NotEqual<G>> {
					readonly $kind: 'expression.binary.comparison.not_equal.loose';
					readonly operator: '!=';
				}
			}
		}
	}
}
