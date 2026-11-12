import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Assignment {
		export namespace Compound {
			export interface And<G extends GrammarMap, K extends Under<'expression.assignment.compound.and'> = 'expression.assignment.compound.and'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface Coalesce<G extends GrammarMap, K extends Under<'expression.assignment.compound.coalesce'> = 'expression.assignment.compound.coalesce'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface Or<G extends GrammarMap, K extends Under<'expression.assignment.compound.or'> = 'expression.assignment.compound.or'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface ShiftRightUnsigned<G extends GrammarMap, K extends Under<'expression.assignment.compound.shift_right_unsigned'> = 'expression.assignment.compound.shift_right_unsigned'> extends SubKindOf<
				V.Expression.Assignment.Compound<G, K>
			> {
				readonly $path: K;
			}
		}
	}
	export namespace Binary {
		export interface Coalesce<G extends GrammarMap, K extends Under<'expression.binary.coalesce'> = 'expression.binary.coalesce'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
			readonly $path: K;
			readonly operator?: never;
		}
		export namespace Membership {
			export interface Instanceof<G extends GrammarMap, K extends Under<'expression.binary.membership.instanceof'> = 'expression.binary.membership.instanceof'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
		export namespace Shift {
			export interface RightUnsigned<G extends GrammarMap, K extends Under<'expression.binary.shift.right_unsigned'> = 'expression.binary.shift.right_unsigned'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
	}
	export namespace Unary {
		export interface Delete<G extends GrammarMap, K extends Under<'expression.unary.delete'> = 'expression.unary.delete'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
		export interface Typeof<G extends GrammarMap, K extends Under<'expression.unary.typeof'> = 'expression.unary.typeof'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
		export interface Void<G extends GrammarMap, K extends Under<'expression.unary.void'> = 'expression.unary.void'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
	}
	export interface Update<G extends GrammarMap, K extends Under<'expression.update'> = 'expression.update'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly argument: Slot<
			G,
			K,
			'argument',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		readonly prefix?: Flag;
	}
	export namespace Update {
		export interface Decrement<G extends GrammarMap, K extends Under<'expression.update.decrement'> = 'expression.update.decrement'> extends SubKindOf<V.Expression.Update<G, K>> {
			readonly $path: K;
		}
		export interface Increment<G extends GrammarMap, K extends Under<'expression.update.increment'> = 'expression.update.increment'> extends SubKindOf<V.Expression.Update<G, K>> {
			readonly $path: K;
		}
	}
}
