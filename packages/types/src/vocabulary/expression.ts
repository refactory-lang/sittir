import type { GrammarMap, Slot } from './map.ts';
import type { Flag, SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
import type * as gate from './utils.ts';
import type * as features from './features/index.ts';
export interface Expression<G extends GrammarMap, K extends Under<'expression'> = 'expression'> {
	readonly $kind: K;
}

export interface ExpressionSynonyms {
	readonly coalesce: 'nullish';
	readonly compound: 'augmented';
	readonly conditional: 'ternary';
	readonly construct: 'new';
	readonly generator: 'gen';
	readonly lambda: 'closure' | 'arrow';
	readonly list: 'array';
	readonly map: 'dictionary' | 'dict';
	readonly matrix_multiply: 'matmul';
	readonly member: 'attribute' | 'field' | 'property';
	readonly propagate: 'try';
	readonly qualified: 'path' | 'scoped';
	readonly reference: 'borrow';
	readonly subscript: 'index';
}

export namespace Expression {
	export interface Assignment<G extends GrammarMap, K extends Under<'expression.assignment'> = 'expression.assignment'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly left: Slot<
			G,
			'expression.assignment',
			'left',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| string
		>;
		readonly right: Slot<
			G,
			'expression.assignment',
			'right',
			| V.Declaration.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
	export namespace Assignment {
		export interface Compound<G extends GrammarMap, K extends Under<'expression.assignment.compound'> = 'expression.assignment.compound'> extends SubKindOf<V.Expression.Assignment<G, K>, 'left' | 'right'> {
			// claimed by prt
			readonly $kind: K;
			readonly left: Slot<
				G,
				'expression.assignment.compound',
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Statement.Any<G>
				| string
			>;
			readonly right: Slot<
				G,
				'expression.assignment.compound',
				'right',
				| V.Declaration.Any<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Statement.Any<G>
			>;
		}
		export namespace Compound {
			export interface Add<G extends GrammarMap, K extends Under<'expression.assignment.compound.add'> = 'expression.assignment.compound.add'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface And<G extends GrammarMap, K extends Under<'expression.assignment.compound.and'> = 'expression.assignment.compound.and'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface BitwiseAnd<G extends GrammarMap, K extends Under<'expression.assignment.compound.bitwise_and'> = 'expression.assignment.compound.bitwise_and'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface BitwiseOr<G extends GrammarMap, K extends Under<'expression.assignment.compound.bitwise_or'> = 'expression.assignment.compound.bitwise_or'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface BitwiseXor<G extends GrammarMap, K extends Under<'expression.assignment.compound.bitwise_xor'> = 'expression.assignment.compound.bitwise_xor'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface Coalesce<G extends GrammarMap, K extends Under<'expression.assignment.compound.coalesce'> = 'expression.assignment.compound.coalesce'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface Divide<G extends GrammarMap, K extends Under<'expression.assignment.compound.divide'> = 'expression.assignment.compound.divide'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface Exponent<G extends GrammarMap, K extends Under<'expression.assignment.compound.exponent'> = 'expression.assignment.compound.exponent'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface FloorDivide<G extends GrammarMap, K extends Under<'expression.assignment.compound.floor_divide'> = 'expression.assignment.compound.floor_divide'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface MatrixMultiply<G extends GrammarMap, K extends Under<'expression.assignment.compound.matrix_multiply'> = 'expression.assignment.compound.matrix_multiply'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface Modulo<G extends GrammarMap, K extends Under<'expression.assignment.compound.modulo'> = 'expression.assignment.compound.modulo'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface Multiply<G extends GrammarMap, K extends Under<'expression.assignment.compound.multiply'> = 'expression.assignment.compound.multiply'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface Or<G extends GrammarMap, K extends Under<'expression.assignment.compound.or'> = 'expression.assignment.compound.or'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface ShiftLeft<G extends GrammarMap, K extends Under<'expression.assignment.compound.shift_left'> = 'expression.assignment.compound.shift_left'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface ShiftRight<G extends GrammarMap, K extends Under<'expression.assignment.compound.shift_right'> = 'expression.assignment.compound.shift_right'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
			export interface ShiftRightUnsigned<G extends GrammarMap, K extends Under<'expression.assignment.compound.shift_right_unsigned'> = 'expression.assignment.compound.shift_right_unsigned'> extends SubKindOf<
				V.Expression.Assignment.Compound<G, K>
			> {
				readonly $kind: K;
			}
			export interface Subtract<G extends GrammarMap, K extends Under<'expression.assignment.compound.subtract'> = 'expression.assignment.compound.subtract'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $kind: K;
			}
		}
	}
	export interface Binary<G extends GrammarMap, K extends Under<'expression.binary'> = 'expression.binary'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly left?: Slot<
			G,
			'expression.binary',
			'left',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
		readonly operator?: Slot<G, 'expression.binary', 'operator', string>;
		readonly right?: Slot<
			G,
			'expression.binary',
			'right',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
	export namespace Binary {
		export interface Arithmetic<G extends GrammarMap, K extends Under<'expression.binary.arithmetic'> = 'expression.binary.arithmetic'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $kind: K;
		}
		export namespace Arithmetic {
			export interface Add<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.add'> = 'expression.binary.arithmetic.add'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '+';
			}
			export interface Divide<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.divide'> = 'expression.binary.arithmetic.divide'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '/';
			}
			export interface Exponent<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.exponent'> = 'expression.binary.arithmetic.exponent'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '**';
			}
			export interface FloorDivide<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.floor_divide'> = 'expression.binary.arithmetic.floor_divide'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '//';
			}
			export interface Modulo<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.modulo'> = 'expression.binary.arithmetic.modulo'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '%';
			}
			export interface Multiply<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.multiply'> = 'expression.binary.arithmetic.multiply'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '*';
			}
			export interface Subtract<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.subtract'> = 'expression.binary.arithmetic.subtract'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '-';
			}
		}
		export interface Bitwise<G extends GrammarMap, K extends Under<'expression.binary.bitwise'> = 'expression.binary.bitwise'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $kind: K;
		}
		export namespace Bitwise {
			export interface And<G extends GrammarMap, K extends Under<'expression.binary.bitwise.and'> = 'expression.binary.bitwise.and'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '&';
			}
			export interface Or<G extends GrammarMap, K extends Under<'expression.binary.bitwise.or'> = 'expression.binary.bitwise.or'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '|';
			}
			export interface Xor<G extends GrammarMap, K extends Under<'expression.binary.bitwise.xor'> = 'expression.binary.bitwise.xor'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '^';
			}
		}
		export interface Coalesce<G extends GrammarMap, K extends Under<'expression.binary.coalesce'> = 'expression.binary.coalesce'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
			readonly $kind: K;
			readonly operator: '??';
		}
		export interface Comparison<G extends GrammarMap, K extends Under<'expression.binary.comparison'> = 'expression.binary.comparison'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $kind: K;
		}
		export namespace Comparison {
			export interface Chain<G extends GrammarMap, K extends Under<'expression.binary.comparison.chain'> = 'expression.binary.comparison.chain'> extends SubKindOf<V.Expression.Binary.Comparison<G, K>> {
				// claimed by p
				readonly $kind: K;
				readonly comparators: (
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
				)[];
			}
			export interface Equal<G extends GrammarMap, K extends Under<'expression.binary.comparison.equal'> = 'expression.binary.comparison.equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '==' | '===';
			}
			export interface Greater<G extends GrammarMap, K extends Under<'expression.binary.comparison.greater'> = 'expression.binary.comparison.greater'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '>';
			}
			export interface GreaterEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.greater_equal'> = 'expression.binary.comparison.greater_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '>=';
			}
			export interface Less<G extends GrammarMap, K extends Under<'expression.binary.comparison.less'> = 'expression.binary.comparison.less'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '<';
			}
			export interface LessEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.less_equal'> = 'expression.binary.comparison.less_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '<=';
			}
			export interface NotEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.not_equal'> = 'expression.binary.comparison.not_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '!=' | '!==' | '<>';
			}
			export namespace NotEqual {
				export interface Legacy<G extends GrammarMap, K extends Under<'expression.binary.comparison.not_equal.legacy'> = 'expression.binary.comparison.not_equal.legacy'> extends SubKindOf<V.Expression.Binary.Comparison.NotEqual<G, K>> {
					// claimed by p
					readonly $kind: K;
					readonly operator: '<>';
				}
			}
		}
		// @ts-expect-error expression.binary.identity: its operator fill is unknown, outside expression.binary's string.
		export interface Identity<G extends GrammarMap, K extends Under<'expression.binary.identity'> = 'expression.binary.identity'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $kind: K;
			readonly left: Slot<
				G,
				'expression.binary.identity',
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
			>;
			// p only
			readonly operator?: Slot<G, 'expression.binary.identity', 'operator', unknown>;
			// p only
		}
		export namespace Identity {
			export interface Is<G extends GrammarMap, K extends Under<'expression.binary.identity.is'> = 'expression.binary.identity.is'> extends SubKindOf<V.Expression.Binary.Identity<G, K>, 'left' | 'operator'> {
				// claimed by p
				readonly $kind: K;
				readonly left: Slot<
					G,
					'expression.binary.identity.is',
					'left',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
				>;
				readonly operator?: Slot<G, 'expression.binary.identity.is', 'operator', unknown>;
			}
			export interface IsNot<G extends GrammarMap, K extends Under<'expression.binary.identity.is_not'> = 'expression.binary.identity.is_not'> extends SubKindOf<V.Expression.Binary.Identity<G, K>, 'left' | 'operator'> {
				// claimed by p
				readonly $kind: K;
				readonly left: Slot<
					G,
					'expression.binary.identity.is_not',
					'left',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
				>;
				readonly operator?: Slot<G, 'expression.binary.identity.is_not', 'operator', unknown>;
			}
		}
		export interface Logical<G extends GrammarMap, K extends Under<'expression.binary.logical'> = 'expression.binary.logical'> extends SubKindOf<V.Expression.Binary<G, K>, 'left' | 'operator' | 'right'> {
			// claimed by p
			readonly $kind: K;
			readonly left: Slot<
				G,
				'expression.binary.logical',
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Declaration.Module<G>
				| V.Statement.Any<G>
			>;
			// prt only
			readonly operator: Slot<G, 'expression.binary.logical', 'operator', string>;
			// prt only
			readonly right: Slot<
				G,
				'expression.binary.logical',
				'right',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Declaration.Module<G>
				| V.Statement.Any<G>
			>;
			// prt only
		}
		export namespace Logical {
			export interface And<G extends GrammarMap, K extends Under<'expression.binary.logical.and'> = 'expression.binary.logical.and'> extends SubKindOf<V.Expression.Binary.Logical<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '&&' | 'and';
			}
			export interface Or<G extends GrammarMap, K extends Under<'expression.binary.logical.or'> = 'expression.binary.logical.or'> extends SubKindOf<V.Expression.Binary.Logical<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: 'or' | '||';
			}
		}
		export interface MatrixMultiply<G extends GrammarMap, K extends Under<'expression.binary.matrix_multiply'> = 'expression.binary.matrix_multiply'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
			readonly $kind: K;
			readonly operator: '@';
		}
		// @ts-expect-error expression.binary.membership: its operator fill is unknown, outside expression.binary's string.
		export interface Membership<G extends GrammarMap, K extends Under<'expression.binary.membership'> = 'expression.binary.membership'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $kind: K;
			readonly left: Slot<
				G,
				'expression.binary.membership',
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
			>;
			// p only
			readonly operator?: Slot<G, 'expression.binary.membership', 'operator', unknown>;
			// p only
		}
		export namespace Membership {
			export interface In<G extends GrammarMap, K extends Under<'expression.binary.membership.in'> = 'expression.binary.membership.in'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: 'in';
			}
			export interface Instanceof<G extends GrammarMap, K extends Under<'expression.binary.membership.instanceof'> = 'expression.binary.membership.instanceof'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: 'instanceof';
			}
			export interface NotIn<G extends GrammarMap, K extends Under<'expression.binary.membership.not_in'> = 'expression.binary.membership.not_in'> extends SubKindOf<V.Expression.Binary.Membership<G, K>, 'left' | 'operator'> {
				// claimed by p
				readonly $kind: K;
				readonly left: Slot<
					G,
					'expression.binary.membership.not_in',
					'left',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
				>;
				readonly operator?: Slot<G, 'expression.binary.membership.not_in', 'operator', unknown>;
			}
		}
		export interface Shift<G extends GrammarMap, K extends Under<'expression.binary.shift'> = 'expression.binary.shift'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $kind: K;
		}
		export namespace Shift {
			export interface Left<G extends GrammarMap, K extends Under<'expression.binary.shift.left'> = 'expression.binary.shift.left'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '<<';
			}
			export interface Right<G extends GrammarMap, K extends Under<'expression.binary.shift.right'> = 'expression.binary.shift.right'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '>>';
			}
			export interface RightUnsigned<G extends GrammarMap, K extends Under<'expression.binary.shift.right_unsigned'> = 'expression.binary.shift.right_unsigned'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $kind: K;
				readonly operator: '>>>';
			}
		}
	}
	export interface Block<G extends GrammarMap, K extends Under<'expression.block'> = 'expression.block'> extends SubKindOf<V.Expression<G, K>> {
		readonly $kind: K;
		readonly body: V.Statement.Block<G>;
		// r only
	}
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly arguments?: Slot<
			G,
			'expression.call',
			'arguments',
			| V.Argument.Any<G>
			| V.Declaration.Module<G>
			| V.Element.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		> | Slot<
			G,
			'expression.call',
			'arguments',
			| V.Argument.Any<G>
			| V.Declaration.Module<G>
			| V.Element.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>[];
		readonly function?: Slot<
			G,
			'expression.call',
			'function',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Statement.Any<G>
			| string
		>;
	}
	export namespace Call {
		export interface Member<G extends GrammarMap, K extends Under<'expression.call.member'> = 'expression.call.member'> extends SubKindOf<V.Expression.Call<G, K>, 'arguments' | 'function' | 'typeArguments'> {
			// claimed by prt
			readonly $kind: K;
			readonly arguments:
				Slot<
				G,
				'expression.call.member',
				'arguments',
				| V.Argument.Any<G>
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Element.Spread.Any<G>
				| V.Statement.Any<G>
			> | Slot<
				G,
				'expression.call.member',
				'arguments',
				| V.Argument.Any<G>
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Element.Spread.Any<G>
				| V.Statement.Any<G>
			>[];
			readonly function: Slot<
				G,
				'expression.call.member',
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
				| string
				| V.Declaration.Module<G>
				| V.Pattern.Rest<G>
			>;
		}
		export interface Qualified<G extends GrammarMap, K extends Under<'expression.call.qualified'> = 'expression.call.qualified'> extends SubKindOf<V.Expression.Call<G, K>, 'arguments' | 'function'> {
			// claimed by r
			readonly $kind: K;
			readonly arguments: Slot<
				G,
				'expression.call.qualified',
				'arguments',
				| V.Argument.Any<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>[];
			readonly function: Slot<
				G,
				'expression.call.qualified',
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
				| string
			>;
		}
	}
	export interface Collection<G extends GrammarMap, K extends Under<'expression.collection'> = 'expression.collection'> extends SubKindOf<V.Expression<G, K>> {
		readonly $kind: K;
	}
	export namespace Collection {
		export interface List<G extends GrammarMap, K extends Under<'expression.collection.list'> = 'expression.collection.list'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly elements?: Slot<
				G,
				'expression.collection.list',
				'elements',
				| V.Declaration.Module<G>
				| V.Element.Spread<G>
				| V.Element.Spread.Parenthesized<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Modifier.Any<G>
				| V.Pattern.Any<G>
				| V.Statement.Any<G>
				| V.Type.Primitive<G>
				| gate.In<G, features.Elisions, null>
			>[];
		}
		export namespace List {
			export interface Repeat<G extends GrammarMap, K extends Under<'expression.collection.list.repeat'> = 'expression.collection.list.repeat'> extends SubKindOf<V.Expression.Collection.List<G, K>> {
				// claimed by r
				readonly $kind: K;
				readonly element: Slot<
					G,
					'expression.collection.list.repeat',
					'element',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Statement.Any<G>
					| V.Type.Primitive<G>
				>;
				readonly length: Slot<
					G,
					'expression.collection.list.repeat',
					'length',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Statement.Any<G>
					| V.Type.Primitive<G>
				>;
			}
		}
		export interface Map<G extends GrammarMap, K extends Under<'expression.collection.map'> = 'expression.collection.map'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly elements?: Slot<G, 'expression.collection.map', 'elements', V.Element.Any<G>>[];
		}
		export interface Object<G extends GrammarMap, K extends Under<'expression.collection.object'> = 'expression.collection.object'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly properties?: Slot<
				G,
				'expression.collection.object',
				'properties',
				| V.Declaration.Method<G>
				| V.Element.Any<G>
				| string
				| V.Declaration.Property.Getter<G>
				| V.Declaration.Property.Setter<G>
				| V.Identifier.Any<G>
				| V.Declaration.Method.Private<G>
				| V.Declaration.Method.Protected<G>
				| V.Declaration.Method.Public<G>
				| V.Declaration.Property.Getter.Private<G>
				| V.Declaration.Property.Getter.Protected<G>
				| V.Declaration.Property.Getter.Public<G>
				| V.Declaration.Property.Setter.Private<G>
				| V.Declaration.Property.Setter.Protected<G>
				| V.Declaration.Property.Setter.Public<G>
			>[];
		}
		export interface Set<G extends GrammarMap, K extends Under<'expression.collection.set'> = 'expression.collection.set'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly elements: Slot<
				G,
				'expression.collection.set',
				'elements',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Element.Spread<G>
				| V.Element.Spread.Parenthesized<G>
			>[];
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly body: V.Statement.Block<G>;
		readonly name?: Slot<G, 'expression.function', 'name', V.Identifier.Any<G>>;
		readonly parameters: (
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Private<G>
			| V.Declaration.Parameter.Protected<G>
			| V.Declaration.Parameter.Public<G>
			| V.Declaration.Parameter.Receiver<G>
		)[];
	}
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly body: Slot<
			G,
			'expression.lambda',
			'body',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Modifier.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
			| string
		>;
		readonly parameters?:
			Slot<
			G,
			'expression.lambda',
			'parameters',
			| V.Identifier.Any<G>
			| V.Pattern.Any<G>
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Default<G>
			| V.Declaration.Parameter.Private<G>
			| V.Declaration.Parameter.Protected<G>
			| V.Declaration.Parameter.Public<G>
			| V.Declaration.Parameter.Receiver<G>
			| V.Declaration.Parameter.Typed<G>
			| V.Declaration.Parameter.TypedDefault<G>
		> | Slot<
			G,
			'expression.lambda',
			'parameters',
			| V.Identifier.Any<G>
			| V.Pattern.Any<G>
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Default<G>
			| V.Declaration.Parameter.Private<G>
			| V.Declaration.Parameter.Protected<G>
			| V.Declaration.Parameter.Public<G>
			| V.Declaration.Parameter.Receiver<G>
			| V.Declaration.Parameter.Typed<G>
			| V.Declaration.Parameter.TypedDefault<G>
		>[];
		readonly returnType?: Slot<
			G,
			'expression.lambda',
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		// r only
	}
	export interface Member<G extends GrammarMap, K extends Under<'expression.member'> = 'expression.member'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly object: Slot<
			G,
			'expression.member',
			'object',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Statement.Any<G>
		>;
		readonly property: Slot<
			G,
			'expression.member',
			'property',
			| V.Identifier.Any<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Octal<G>
		>;
	}
	export interface Meta<G extends GrammarMap, K extends Under<'expression.meta'> = 'expression.meta'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $kind: K;
	}
	export interface Parenthesized<G extends GrammarMap, K extends Under<'expression.parenthesized'> = 'expression.parenthesized'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly expression: Slot<
			G,
			'expression.parenthesized',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Modifier.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly type?: Slot<G, 'expression.parenthesized', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export interface Sequence<G extends GrammarMap, K extends Under<'expression.sequence'> = 'expression.sequence'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly expressions: Slot<
			G,
			'expression.sequence',
			'expressions',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>[];
	}
	export interface Subscript<G extends GrammarMap, K extends Under<'expression.subscript'> = 'expression.subscript'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly index?: Slot<
			G,
			'expression.subscript',
			'index',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Pattern.Rest<G>
		>;
		readonly object: Slot<
			G,
			'expression.subscript',
			'object',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Statement.Any<G>
		>;
	}
	export interface Unary<G extends GrammarMap, K extends Under<'expression.unary'> = 'expression.unary'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly argument: Slot<
			G,
			'expression.unary',
			'argument',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Statement.Any<G>
		>;
	}
	export namespace Unary {
		export interface BitwiseNot<G extends GrammarMap, K extends Under<'expression.unary.bitwise_not'> = 'expression.unary.bitwise_not'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
		export interface Delete<G extends GrammarMap, K extends Under<'expression.unary.delete'> = 'expression.unary.delete'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
		export interface Negation<G extends GrammarMap, K extends Under<'expression.unary.negation'> = 'expression.unary.negation'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
		export interface Not<G extends GrammarMap, K extends Under<'expression.unary.not'> = 'expression.unary.not'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
		export interface Plus<G extends GrammarMap, K extends Under<'expression.unary.plus'> = 'expression.unary.plus'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
		export interface Typeof<G extends GrammarMap, K extends Under<'expression.unary.typeof'> = 'expression.unary.typeof'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
		export interface Void<G extends GrammarMap, K extends Under<'expression.unary.void'> = 'expression.unary.void'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $kind: K;
		}
	}
	export interface Update<G extends GrammarMap, K extends Under<'expression.update'> = 'expression.update'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly argument: Slot<
			G,
			'expression.update',
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
			readonly $kind: K;
		}
		export interface Increment<G extends GrammarMap, K extends Under<'expression.update.increment'> = 'expression.update.increment'> extends SubKindOf<V.Expression.Update<G, K>> {
			readonly $kind: K;
		}
	}
}
