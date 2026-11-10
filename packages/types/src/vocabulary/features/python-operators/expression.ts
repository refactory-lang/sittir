import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Assignment {
		export namespace Compound {
			export interface FloorDivide<G extends GrammarMap, K extends Under<'expression.assignment.compound.floor_divide'> = 'expression.assignment.compound.floor_divide'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface MatrixMultiply<G extends GrammarMap, K extends Under<'expression.assignment.compound.matrix_multiply'> = 'expression.assignment.compound.matrix_multiply'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
		}
	}
	export namespace Binary {
		export namespace Arithmetic {
			export interface FloorDivide<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.floor_divide'> = 'expression.binary.arithmetic.floor_divide'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator: '//';
			}
		}
		export namespace Comparison {
			export interface Chain<G extends GrammarMap, K extends Under<'expression.binary.comparison.chain'> = 'expression.binary.comparison.chain'> extends SubKindOf<V.Expression.Binary.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
				readonly comparators: Slot<
					G,
					K,
					'comparators',
					| V.Element.Comparator<G>
					| V.Element.Comparator.Comparison.Equal<G>
					| V.Element.Comparator.Comparison.Greater<G>
					| V.Element.Comparator.Comparison.GreaterEqual<G>
					| V.Element.Comparator.Comparison.Less<G>
					| V.Element.Comparator.Comparison.LessEqual<G>
					| V.Element.Comparator.Comparison.NotEqual.Any<G>
					| V.Element.Comparator.Identity.Is<G>
					| V.Element.Comparator.Identity.IsNot<G>
					| V.Element.Comparator.Membership.In<G>
					| V.Element.Comparator.Membership.NotIn<G>
				>[];
			}
			export namespace NotEqual {
				export interface Legacy<G extends GrammarMap, K extends Under<'expression.binary.comparison.not_equal.legacy'> = 'expression.binary.comparison.not_equal.legacy'> extends SubKindOf<V.Expression.Binary.Comparison.NotEqual<G, K>> {
					// claimed by p
					readonly $path: K;
					readonly operator: '<>';
				}
			}
		}
		export interface MatrixMultiply<G extends GrammarMap, K extends Under<'expression.binary.matrix_multiply'> = 'expression.binary.matrix_multiply'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
			readonly $path: K;
			readonly operator: '@';
		}
		export namespace Membership {
			export interface NotIn<G extends GrammarMap, K extends Under<'expression.binary.membership.not_in'> = 'expression.binary.membership.not_in'> extends SubKindOf<V.Expression.Binary.Membership<G, K>> {
				// claimed by p
				readonly $path: K;
				readonly left: Slot<
					G,
					K,
					'left',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
				>;
				readonly operator?: Slot<G, K, 'operator', unknown>;
			}
		}
	}
}
