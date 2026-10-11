import type { GrammarContext } from './context.ts';
import type { Flag, SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Expression<G extends GrammarContext<G>> {
	readonly $kind: 'expression';
}

export namespace Expression {
	export interface Assignment<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.assignment';
		readonly disposable?: Flag;
		readonly left: G['slots']['expression.assignment']['left'];
		readonly right: G['slots']['expression.assignment']['right'];
	}
	export namespace Assignment {
		export interface Compound<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment<G>> {
			// claimed by prt
			readonly $kind: 'expression.assignment.compound';
			readonly left: G['slots']['expression.assignment.compound']['left'];
			readonly operator: G['slots']['expression.assignment.compound']['operator'];
			readonly right: G['slots']['expression.assignment.compound']['right'];
		}
		export namespace Compound {
			export interface Add<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.add';
				readonly operator: '+=';
			}
			export interface And<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.and';
				readonly operator: '&&=';
			}
			export interface BitwiseAnd<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.bitwise_and';
				readonly operator: '&=';
			}
			export interface BitwiseOr<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.bitwise_or';
				readonly operator: '|=';
			}
			export interface BitwiseXor<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.bitwise_xor';
				readonly operator: '^=';
			}
			export interface Divide<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.divide';
				readonly operator: '/=';
			}
			export interface Exponent<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.exponent';
				readonly operator: '**=';
			}
			export interface FloorDivide<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.floor_divide';
				readonly operator: '//=';
			}
			export interface Matmul<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.matmul';
				readonly operator: '@=';
			}
			export interface Modulo<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.modulo';
				readonly operator: '%=';
			}
			export interface Multiply<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.multiply';
				readonly operator: '*=';
			}
			export interface Nullish<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.nullish';
				readonly operator: '??=';
			}
			export interface Or<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.or';
				readonly operator: '||=';
			}
			export interface ShiftLeft<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.shift_left';
				readonly operator: '<<=';
			}
			export interface ShiftRight<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.shift_right';
				readonly operator: '>>=';
			}
			export interface ShiftRightUnsigned<G extends GrammarContext<G>> extends SubKindOf<
				V.Expression.Assignment.Compound<G>
			> {
				readonly $kind: 'expression.assignment.compound.shift_right_unsigned';
				readonly operator: '>>>=';
			}
			export interface Subtract<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.subtract';
				readonly operator: '-=';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Assignment.Compound<G>
				| V.Expression.Assignment.Compound.Add<G>
				| V.Expression.Assignment.Compound.And<G>
				| V.Expression.Assignment.Compound.BitwiseAnd<G>
				| V.Expression.Assignment.Compound.BitwiseOr<G>
				| V.Expression.Assignment.Compound.BitwiseXor<G>
				| V.Expression.Assignment.Compound.Divide<G>
				| V.Expression.Assignment.Compound.Exponent<G>
				| V.Expression.Assignment.Compound.FloorDivide<G>
				| V.Expression.Assignment.Compound.Matmul<G>
				| V.Expression.Assignment.Compound.Modulo<G>
				| V.Expression.Assignment.Compound.Multiply<G>
				| V.Expression.Assignment.Compound.Nullish<G>
				| V.Expression.Assignment.Compound.Or<G>
				| V.Expression.Assignment.Compound.ShiftLeft<G>
				| V.Expression.Assignment.Compound.ShiftRight<G>
				| V.Expression.Assignment.Compound.ShiftRightUnsigned<G>
				| V.Expression.Assignment.Compound.Subtract<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Assignment<G>
			| V.Expression.Assignment.Compound<G>
			| V.Expression.Assignment.Compound.Add<G>
			| V.Expression.Assignment.Compound.And<G>
			| V.Expression.Assignment.Compound.BitwiseAnd<G>
			| V.Expression.Assignment.Compound.BitwiseOr<G>
			| V.Expression.Assignment.Compound.BitwiseXor<G>
			| V.Expression.Assignment.Compound.Divide<G>
			| V.Expression.Assignment.Compound.Exponent<G>
			| V.Expression.Assignment.Compound.FloorDivide<G>
			| V.Expression.Assignment.Compound.Matmul<G>
			| V.Expression.Assignment.Compound.Modulo<G>
			| V.Expression.Assignment.Compound.Multiply<G>
			| V.Expression.Assignment.Compound.Nullish<G>
			| V.Expression.Assignment.Compound.Or<G>
			| V.Expression.Assignment.Compound.ShiftLeft<G>
			| V.Expression.Assignment.Compound.ShiftRight<G>
			| V.Expression.Assignment.Compound.ShiftRightUnsigned<G>
			| V.Expression.Assignment.Compound.Subtract<G>;
	}
	export interface Await<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.await';
		readonly expression: G['slots']['expression.await']['expression'];
	}
	export interface Binary<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.binary';
		readonly left?: G['slots']['expression.binary']['left'];
		readonly operator?: G['slots']['expression.binary']['operator'];
		readonly right?: G['slots']['expression.binary']['right'];
	}
	export namespace Binary {
		export interface Arithmetic<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.arithmetic';
		}
		export namespace Arithmetic {
			export interface Add<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.add';
				readonly operator: '+';
			}
			export interface Divide<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.divide';
				readonly operator: '/';
			}
			export interface Exponent<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.exponent';
				readonly operator: '**';
			}
			export interface FloorDivide<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.floor_divide';
				readonly operator: '//';
			}
			export interface Modulo<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.modulo';
				readonly operator: '%';
			}
			export interface Multiply<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.multiply';
				readonly operator: '*';
			}
			export interface Subtract<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.arithmetic.subtract';
				readonly operator: '-';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Arithmetic.Add<G>
				| V.Expression.Binary.Arithmetic.Divide<G>
				| V.Expression.Binary.Arithmetic.Exponent<G>
				| V.Expression.Binary.Arithmetic.FloorDivide<G>
				| V.Expression.Binary.Arithmetic.Modulo<G>
				| V.Expression.Binary.Arithmetic.Multiply<G>
				| V.Expression.Binary.Arithmetic.Subtract<G>;
		}
		export interface Bitwise<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.bitwise';
		}
		export namespace Bitwise {
			export interface And<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.bitwise.and';
				readonly operator: '&';
			}
			export interface Or<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.bitwise.or';
				readonly operator: '|';
			}
			export interface Xor<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.bitwise.xor';
				readonly operator: '^';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Bitwise.And<G>
				| V.Expression.Binary.Bitwise.Or<G>
				| V.Expression.Binary.Bitwise.Xor<G>;
		}
		export interface Comparison<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.comparison';
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.equal';
				readonly operator: '==';
			}
			export interface Greater<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.greater';
				readonly operator: '>';
			}
			export interface GreaterEqual<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.greater_equal';
				readonly operator: '>=';
			}
			export interface Less<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.less';
				readonly operator: '<';
			}
			export interface LessEqual<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.less_equal';
				readonly operator: '<=';
			}
			export interface NotEqual<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.not_equal';
				readonly operator: '!=';
			}
			export interface StrictEqual<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.strict_equal';
				readonly operator: '===';
			}
			export interface StrictNotEqual<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.comparison.strict_not_equal';
				readonly operator: '!==';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Comparison.Equal<G>
				| V.Expression.Binary.Comparison.Greater<G>
				| V.Expression.Binary.Comparison.GreaterEqual<G>
				| V.Expression.Binary.Comparison.Less<G>
				| V.Expression.Binary.Comparison.LessEqual<G>
				| V.Expression.Binary.Comparison.NotEqual<G>
				| V.Expression.Binary.Comparison.StrictEqual<G>
				| V.Expression.Binary.Comparison.StrictNotEqual<G>;
		}
		// @ts-expect-error expression.binary.identity: its operator fill is unknown, outside expression.binary's string.
		export interface Identity<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.identity';
			readonly left: G['slots']['expression.binary.identity']['left'];
			// p only
			readonly operator?: G['slots']['expression.binary.identity']['operator'];
			// p only
		}
		export namespace Identity {
			export interface Is<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary.Identity<G>> {
				// claimed by p
				readonly $kind: 'expression.binary.identity.is';
				readonly left: G['slots']['expression.binary.identity.is']['left'];
				readonly operator?: G['slots']['expression.binary.identity.is']['operator'];
			}
			export interface IsNot<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary.Identity<G>> {
				// claimed by p
				readonly $kind: 'expression.binary.identity.is_not';
				readonly left: G['slots']['expression.binary.identity.is_not']['left'];
				readonly operator?: G['slots']['expression.binary.identity.is_not']['operator'];
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Identity.Is<G>
				| V.Expression.Binary.Identity.IsNot<G>;
		}
		export interface Logical<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			// claimed by p
			readonly $kind: 'expression.binary.logical';
			readonly left: G['slots']['expression.binary.logical']['left'];
			// prt only
			readonly operator: G['slots']['expression.binary.logical']['operator'];
			// prt only
			readonly right: G['slots']['expression.binary.logical']['right'];
			// prt only
		}
		export namespace Logical {
			export interface And<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary.Logical<G>> {
				readonly $kind: 'expression.binary.logical.and';
				readonly operator: '&&' | 'and';
			}
			export interface Or<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary.Logical<G>> {
				readonly $kind: 'expression.binary.logical.or';
				readonly operator: 'or' | '||';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Logical<G>
				| V.Expression.Binary.Logical.And<G>
				| V.Expression.Binary.Logical.Or<G>;
		}
		export interface Matmul<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.matmul';
			readonly operator: '@';
		}
		// @ts-expect-error expression.binary.membership: its operator fill is unknown, outside expression.binary's string.
		export interface Membership<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.membership';
			readonly left: G['slots']['expression.binary.membership']['left'];
			// p only
			readonly operator?: G['slots']['expression.binary.membership']['operator'];
			// p only
		}
		export namespace Membership {
			export interface In<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.membership.in';
				readonly operator: 'in';
			}
			export interface Instanceof<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.membership.instanceof';
				readonly operator: 'instanceof';
			}
			export interface NotIn<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary.Membership<G>> {
				// claimed by p
				readonly $kind: 'expression.binary.membership.not_in';
				readonly left: G['slots']['expression.binary.membership.not_in']['left'];
				readonly operator?: G['slots']['expression.binary.membership.not_in']['operator'];
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Membership.In<G>
				| V.Expression.Binary.Membership.Instanceof<G>
				| V.Expression.Binary.Membership.NotIn<G>;
		}
		export interface Nullish<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.nullish';
			readonly operator: '??';
		}
		export interface Shift<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.shift';
		}
		export namespace Shift {
			export interface Left<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.shift.left';
				readonly operator: '<<';
			}
			export interface Right<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.shift.right';
				readonly operator: '>>';
			}
			export interface RightUnsigned<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Binary<G>> {
				readonly $kind: 'expression.binary.shift.right_unsigned';
				readonly operator: '>>>';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Binary.Shift.Left<G>
				| V.Expression.Binary.Shift.Right<G>
				| V.Expression.Binary.Shift.RightUnsigned<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Binary<G>
			| V.Expression.Binary.Arithmetic.Add<G>
			| V.Expression.Binary.Arithmetic.Divide<G>
			| V.Expression.Binary.Arithmetic.Exponent<G>
			| V.Expression.Binary.Arithmetic.FloorDivide<G>
			| V.Expression.Binary.Arithmetic.Modulo<G>
			| V.Expression.Binary.Arithmetic.Multiply<G>
			| V.Expression.Binary.Arithmetic.Subtract<G>
			| V.Expression.Binary.Bitwise.And<G>
			| V.Expression.Binary.Bitwise.Or<G>
			| V.Expression.Binary.Bitwise.Xor<G>
			| V.Expression.Binary.Comparison.Equal<G>
			| V.Expression.Binary.Comparison.Greater<G>
			| V.Expression.Binary.Comparison.GreaterEqual<G>
			| V.Expression.Binary.Comparison.Less<G>
			| V.Expression.Binary.Comparison.LessEqual<G>
			| V.Expression.Binary.Comparison.NotEqual<G>
			| V.Expression.Binary.Comparison.StrictEqual<G>
			| V.Expression.Binary.Comparison.StrictNotEqual<G>
			| V.Expression.Binary.Identity.Is<G>
			| V.Expression.Binary.Identity.IsNot<G>
			| V.Expression.Binary.Logical<G>
			| V.Expression.Binary.Logical.And<G>
			| V.Expression.Binary.Logical.Or<G>
			| V.Expression.Binary.Matmul<G>
			| V.Expression.Binary.Membership.In<G>
			| V.Expression.Binary.Membership.Instanceof<G>
			| V.Expression.Binary.Membership.NotIn<G>
			| V.Expression.Binary.Nullish<G>
			| V.Expression.Binary.Shift.Left<G>
			| V.Expression.Binary.Shift.Right<G>
			| V.Expression.Binary.Shift.RightUnsigned<G>;
	}
	export interface Block<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.block';
		readonly body: V.Statement.Block<G>;
		// r only
	}
	export namespace Block {
		export interface Async<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.async';
			readonly body: V.Statement.Block<G>;
			readonly move?: Flag;
		}
		export interface Const<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.const';
			readonly body: V.Statement.Block<G>;
		}
		export interface Gen<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.gen';
			readonly body: V.Statement.Block<G>;
			readonly move?: Flag;
		}
		export interface Try<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.try';
			readonly body: V.Statement.Block<G>;
		}
		export interface Unsafe<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.unsafe';
			readonly body: V.Statement.Block<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Block.Async<G>
			| V.Expression.Block.Const<G>
			| V.Expression.Block.Gen<G>
			| V.Expression.Block.Try<G>
			| V.Expression.Block.Unsafe<G>;
	}
	export interface Call<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.call';
		readonly arguments?: G['slots']['expression.call']['arguments'] | G['slots']['expression.call']['arguments'][];
		readonly function?: G['slots']['expression.call']['function'];
		readonly typeArguments?: G['slots']['expression.call']['typeArguments'][];
		// t only
	}
	export namespace Call {
		export interface Import<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by t
			readonly $kind: 'expression.call.import';
		}
		export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by r
			readonly $kind: 'expression.call.macro';
			readonly arguments: V.Element.Macro.TokenTree.Delimited<G>;
			readonly function: G['identifier'];
		}
		export interface Member<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by prt
			readonly $kind: 'expression.call.member';
			readonly arguments:
				| G['slots']['expression.call.member']['arguments']
				| G['slots']['expression.call.member']['arguments'][];
			readonly function: G['slots']['expression.call.member']['function'];
			readonly typeArguments?: G['slots']['expression.call.member']['typeArguments'][];
			// t only
		}
		export interface New<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by t
			readonly $kind: 'expression.call.new';
			readonly arguments?: G['slots']['expression.call.new']['arguments'][];
			readonly function: G['slots']['expression.call.new']['function'];
			readonly typeArguments?: G['slots']['expression.call.new']['typeArguments'][];
		}
		export interface Path<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by r
			readonly $kind: 'expression.call.path';
			readonly arguments: G['slots']['expression.call.path']['arguments'][];
			readonly function: G['slots']['expression.call.path']['function'];
		}
		export interface Template<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by t
			readonly $kind: 'expression.call.template';
			readonly arguments: V.Literal.Template<G>;
			readonly function: G['slots']['expression.call.template']['function'];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Call<G>
			| V.Expression.Call.Import<G>
			| V.Expression.Call.Macro<G>
			| V.Expression.Call.Member<G>
			| V.Expression.Call.New<G>
			| V.Expression.Call.Path<G>
			| V.Expression.Call.Template<G>;
	}
	export interface Cast<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.cast';
		readonly expression?: G['slots']['expression.cast']['expression'];
		// t only
	}
	export namespace Cast {
		export interface As<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by rt
			readonly $kind: 'expression.cast.as';
			readonly expression?: G['slots']['expression.cast.as']['expression'];
			// t only
			readonly type?: G['slots']['expression.cast.as']['type'];
			// r only
			readonly typeAnnotation?: G['slots']['expression.cast.as']['typeAnnotation'];
			// t only
			readonly value?: G['slots']['expression.cast.as']['value'];
			// r only
		}
		export interface Assertion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.assertion';
			readonly expression: G['slots']['expression.cast.assertion']['expression'];
			readonly typeArguments: G['slots']['expression.cast.assertion']['typeArguments'][];
		}
		export interface NonNull<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.non_null';
			readonly expression: G['slots']['expression.cast.non_null']['expression'];
		}
		export interface Satisfies<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.satisfies';
			readonly expression: G['slots']['expression.cast.satisfies']['expression'];
			readonly typeAnnotation: G['slots']['expression.cast.satisfies']['typeAnnotation'];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Cast.As<G>
			| V.Expression.Cast.Assertion<G>
			| V.Expression.Cast.NonNull<G>
			| V.Expression.Cast.Satisfies<G>;
	}
	export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.class';
		readonly body: G['slots']['expression.class']['body'][];
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly extends?: V.Clause.Extends<G>;
		readonly implements?: G['slots']['expression.class']['implements'][];
		readonly name?: V.Identifier.Type<G>;
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Collection<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.collection';
	}
	export namespace Collection {
		export interface Dictionary<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by p
			readonly $kind: 'expression.collection.dictionary';
			readonly elements?: G['element'][];
		}
		export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by prt
			readonly $kind: 'expression.collection.list';
			readonly attributes?: G['attribute'][];
			// r only
			readonly elements?: G['slots']['expression.collection.list']['elements'][];
		}
		export namespace List {
			export interface Repeat<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection.List<G>> {
				// claimed by r
				readonly $kind: 'expression.collection.list.repeat';
				readonly element: G['slots']['expression.collection.list.repeat']['element'];
				readonly length: G['slots']['expression.collection.list.repeat']['length'];
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Collection.List<G>
				| V.Expression.Collection.List.Repeat<G>;
		}
		export interface Object<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by t
			readonly $kind: 'expression.collection.object';
			readonly properties?: G['slots']['expression.collection.object']['properties'][];
		}
		export interface Set<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by p
			readonly $kind: 'expression.collection.set';
			readonly elements: G['slots']['expression.collection.set']['elements'][];
		}
		export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by r
			readonly $kind: 'expression.collection.struct';
			readonly body: V.Element.Struct.Any<G>[];
			readonly name: G['slots']['expression.collection.struct']['name'];
		}
		export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by pr
			readonly $kind: 'expression.collection.tuple';
			readonly attributes?: G['attribute'][];
			// r only
			readonly elements?: G['slots']['expression.collection.tuple']['elements'][];
		}
		export namespace Tuple {
			export interface Bare<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection.Tuple<G>> {
				// claimed by p
				readonly $kind: 'expression.collection.tuple.bare';
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Expression.Collection.Tuple<G>
				| V.Expression.Collection.Tuple.Bare<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Collection.Dictionary<G>
			| V.Expression.Collection.List<G>
			| V.Expression.Collection.List.Repeat<G>
			| V.Expression.Collection.Object<G>
			| V.Expression.Collection.Set<G>
			| V.Expression.Collection.Struct<G>
			| V.Expression.Collection.Tuple<G>
			| V.Expression.Collection.Tuple.Bare<G>;
	}
	export interface Comprehension<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.comprehension';
		readonly body: G['slots']['expression.comprehension']['body'];
		// p only
		readonly comprehensionClauses: V.Clause.Comprehension<G>;
		// p only
	}
	export namespace Comprehension {
		export interface Dictionary<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.dictionary';
			readonly body: V.Element.Pair<G>;
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Generator<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.generator';
			readonly body: G['slots']['expression.comprehension.generator']['body'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.list';
			readonly body: G['slots']['expression.comprehension.list']['body'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Set<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.set';
			readonly body: G['slots']['expression.comprehension.set']['body'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Comprehension.Dictionary<G>
			| V.Expression.Comprehension.Generator<G>
			| V.Expression.Comprehension.List<G>
			| V.Expression.Comprehension.Set<G>;
	}
	export interface Conditional<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by pt
		readonly $kind: 'expression.conditional';
		readonly alternative: G['slots']['expression.conditional']['alternative'];
		readonly condition: G['slots']['expression.conditional']['condition'];
		readonly consequence: G['slots']['expression.conditional']['consequence'];
	}
	export interface Function<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.function';
		readonly async?: Flag;
		readonly body: V.Statement.Block<G>;
		readonly generator?: Flag;
		readonly name?: G['identifier'];
		readonly parameters: V.Declaration.Parameter.Any<G>[];
		readonly returnType?: G['slots']['expression.function']['returnType'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Instantiation<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by rt
		readonly $kind: 'expression.instantiation';
		readonly expression?: G['slots']['expression.instantiation']['expression'];
		// t only
		readonly function?: G['slots']['expression.instantiation']['function'];
		// r only
		readonly typeArguments: G['slots']['expression.instantiation']['typeArguments'][];
	}
	export interface Interpolation<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by pt
		readonly $kind: 'expression.interpolation';
		readonly debug?: Flag;
		// p only
		readonly expression?: G['slots']['expression.interpolation']['expression'];
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>;
		// p only
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>;
		// p only
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Interpolation<G>> {
			// claimed by p
			readonly $kind: 'expression.interpolation.conversion';
		}
		export interface Format<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Interpolation<G>> {
			// claimed by p
			readonly $kind: 'expression.interpolation.format';
			readonly elements?: G['slots']['expression.interpolation.format']['elements'][];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Interpolation<G>
			| V.Expression.Interpolation.Conversion<G>
			| V.Expression.Interpolation.Format<G>;
	}
	export interface Lambda<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.lambda';
		readonly async?: Flag;
		// rt only
		readonly body: G['slots']['expression.lambda']['body'];
		readonly move?: Flag;
		// r only
		readonly parameters?:
			| G['slots']['expression.lambda']['parameters']
			| G['slots']['expression.lambda']['parameters'][];
		readonly returnType?: G['slots']['expression.lambda']['returnType'];
		// r only
		readonly static?: Flag;
		// r only
	}
	export interface Member<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.member';
		readonly object: G['slots']['expression.member']['object'];
		readonly privateName?: Flag;
		// t only
		readonly property: G['slots']['expression.member']['property'];
	}
	export interface Meta<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.meta';
	}
	export interface Parenthesized<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.parenthesized';
		readonly expression: G['slots']['expression.parenthesized']['expression'];
		readonly type?: G['slots']['expression.parenthesized']['type'];
		// t only
	}
	export interface Range<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.range';
		readonly end?: G['slots']['expression.range']['end'];
		readonly operator?: G['slots']['expression.range']['operator'];
		readonly start?: G['slots']['expression.range']['start'];
	}
	export interface Reference<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.reference';
		readonly argument: G['slots']['expression.reference']['argument'];
		readonly exclusive?: Flag;
		readonly raw?: Flag;
		readonly writable?: Flag;
	}
	export interface Sequence<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.sequence';
		readonly expressions: G['slots']['expression.sequence']['expressions'][];
	}
	export interface Slice<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by p
		readonly $kind: 'expression.slice';
		readonly start?: G['slots']['expression.slice']['start'];
		readonly step?: G['slots']['expression.slice']['step'];
		readonly stop?: G['slots']['expression.slice']['stop'];
	}
	export interface Subscript<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.subscript';
		readonly index?: G['slots']['expression.subscript']['index'] | G['slots']['expression.subscript']['index'][];
		readonly object: G['slots']['expression.subscript']['object'];
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Try<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.try';
		readonly argument: G['slots']['expression.try']['argument'];
	}
	export interface Unary<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.unary';
		readonly argument: G['slots']['expression.unary']['argument'];
		readonly operator: G['slots']['expression.unary']['operator'];
	}
	export namespace Unary {
		export interface BitwiseNot<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.bitwise_not';
			readonly operator: '~';
		}
		export interface Delete<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.delete';
			readonly operator: 'delete';
		}
		export interface Deref<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.deref';
			readonly operator: '*';
		}
		export interface Negation<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.negation';
			readonly operator: '-';
		}
		export interface Not<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.not';
			readonly operator: '!';
		}
		export interface Plus<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.plus';
			readonly operator: '+';
		}
		export interface Typeof<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.typeof';
			readonly operator: 'typeof';
		}
		export interface Void<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.void';
			readonly operator: 'void';
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Unary<G>
			| V.Expression.Unary.BitwiseNot<G>
			| V.Expression.Unary.Delete<G>
			| V.Expression.Unary.Deref<G>
			| V.Expression.Unary.Negation<G>
			| V.Expression.Unary.Not<G>
			| V.Expression.Unary.Plus<G>
			| V.Expression.Unary.Typeof<G>
			| V.Expression.Unary.Void<G>;
	}
	export interface Unit<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.unit';
	}
	export interface Update<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.update';
		readonly argument: G['slots']['expression.update']['argument'];
		readonly operator: G['slots']['expression.update']['operator'];
	}
	export namespace Update {
		export interface Decrement<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Update<G>> {
			readonly $kind: 'expression.update.decrement';
			readonly operator: '--';
		}
		export interface Increment<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Update<G>> {
			readonly $kind: 'expression.update.increment';
			readonly operator: '++';
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Expression.Update<G>
			| V.Expression.Update.Decrement<G>
			| V.Expression.Update.Increment<G>;
	}
	export interface Yield<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.yield';
		readonly content?: G['slots']['expression.yield']['content'];
		// p only
		readonly expression?: G['slots']['expression.yield']['expression'];
		// rt only
	}
	export namespace Yield {
		export interface Delegate<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Yield<G>> {
			// claimed by t
			readonly $kind: 'expression.yield.delegate';
			readonly expression: G['slots']['expression.yield.delegate']['expression'];
		}
		export type Any<G extends GrammarContext<G>> = V.Expression.Yield<G> | V.Expression.Yield.Delegate<G>;
	}
	export type Any<G extends GrammarContext<G>> =
		| V.Expression.Assignment<G>
		| V.Expression.Assignment.Compound<G>
		| V.Expression.Assignment.Compound.Add<G>
		| V.Expression.Assignment.Compound.And<G>
		| V.Expression.Assignment.Compound.BitwiseAnd<G>
		| V.Expression.Assignment.Compound.BitwiseOr<G>
		| V.Expression.Assignment.Compound.BitwiseXor<G>
		| V.Expression.Assignment.Compound.Divide<G>
		| V.Expression.Assignment.Compound.Exponent<G>
		| V.Expression.Assignment.Compound.FloorDivide<G>
		| V.Expression.Assignment.Compound.Matmul<G>
		| V.Expression.Assignment.Compound.Modulo<G>
		| V.Expression.Assignment.Compound.Multiply<G>
		| V.Expression.Assignment.Compound.Nullish<G>
		| V.Expression.Assignment.Compound.Or<G>
		| V.Expression.Assignment.Compound.ShiftLeft<G>
		| V.Expression.Assignment.Compound.ShiftRight<G>
		| V.Expression.Assignment.Compound.ShiftRightUnsigned<G>
		| V.Expression.Assignment.Compound.Subtract<G>
		| V.Expression.Await<G>
		| V.Expression.Binary<G>
		| V.Expression.Binary.Arithmetic.Add<G>
		| V.Expression.Binary.Arithmetic.Divide<G>
		| V.Expression.Binary.Arithmetic.Exponent<G>
		| V.Expression.Binary.Arithmetic.FloorDivide<G>
		| V.Expression.Binary.Arithmetic.Modulo<G>
		| V.Expression.Binary.Arithmetic.Multiply<G>
		| V.Expression.Binary.Arithmetic.Subtract<G>
		| V.Expression.Binary.Bitwise.And<G>
		| V.Expression.Binary.Bitwise.Or<G>
		| V.Expression.Binary.Bitwise.Xor<G>
		| V.Expression.Binary.Comparison.Equal<G>
		| V.Expression.Binary.Comparison.Greater<G>
		| V.Expression.Binary.Comparison.GreaterEqual<G>
		| V.Expression.Binary.Comparison.Less<G>
		| V.Expression.Binary.Comparison.LessEqual<G>
		| V.Expression.Binary.Comparison.NotEqual<G>
		| V.Expression.Binary.Comparison.StrictEqual<G>
		| V.Expression.Binary.Comparison.StrictNotEqual<G>
		| V.Expression.Binary.Identity.Is<G>
		| V.Expression.Binary.Identity.IsNot<G>
		| V.Expression.Binary.Logical<G>
		| V.Expression.Binary.Logical.And<G>
		| V.Expression.Binary.Logical.Or<G>
		| V.Expression.Binary.Matmul<G>
		| V.Expression.Binary.Membership.In<G>
		| V.Expression.Binary.Membership.Instanceof<G>
		| V.Expression.Binary.Membership.NotIn<G>
		| V.Expression.Binary.Nullish<G>
		| V.Expression.Binary.Shift.Left<G>
		| V.Expression.Binary.Shift.Right<G>
		| V.Expression.Binary.Shift.RightUnsigned<G>
		| V.Expression.Block.Async<G>
		| V.Expression.Block.Const<G>
		| V.Expression.Block.Gen<G>
		| V.Expression.Block.Try<G>
		| V.Expression.Block.Unsafe<G>
		| V.Expression.Call<G>
		| V.Expression.Call.Import<G>
		| V.Expression.Call.Macro<G>
		| V.Expression.Call.Member<G>
		| V.Expression.Call.New<G>
		| V.Expression.Call.Path<G>
		| V.Expression.Call.Template<G>
		| V.Expression.Cast.As<G>
		| V.Expression.Cast.Assertion<G>
		| V.Expression.Cast.NonNull<G>
		| V.Expression.Cast.Satisfies<G>
		| V.Expression.Class<G>
		| V.Expression.Collection.Dictionary<G>
		| V.Expression.Collection.List<G>
		| V.Expression.Collection.List.Repeat<G>
		| V.Expression.Collection.Object<G>
		| V.Expression.Collection.Set<G>
		| V.Expression.Collection.Struct<G>
		| V.Expression.Collection.Tuple<G>
		| V.Expression.Collection.Tuple.Bare<G>
		| V.Expression.Comprehension.Dictionary<G>
		| V.Expression.Comprehension.Generator<G>
		| V.Expression.Comprehension.List<G>
		| V.Expression.Comprehension.Set<G>
		| V.Expression.Conditional<G>
		| V.Expression.Function<G>
		| V.Expression.Instantiation<G>
		| V.Expression.Interpolation<G>
		| V.Expression.Interpolation.Conversion<G>
		| V.Expression.Interpolation.Format<G>
		| V.Expression.Lambda<G>
		| V.Expression.Member<G>
		| V.Expression.Meta<G>
		| V.Expression.Parenthesized<G>
		| V.Expression.Range<G>
		| V.Expression.Reference<G>
		| V.Expression.Sequence<G>
		| V.Expression.Slice<G>
		| V.Expression.Subscript<G>
		| V.Expression.Try<G>
		| V.Expression.Unary<G>
		| V.Expression.Unary.BitwiseNot<G>
		| V.Expression.Unary.Delete<G>
		| V.Expression.Unary.Deref<G>
		| V.Expression.Unary.Negation<G>
		| V.Expression.Unary.Not<G>
		| V.Expression.Unary.Plus<G>
		| V.Expression.Unary.Typeof<G>
		| V.Expression.Unary.Void<G>
		| V.Expression.Unit<G>
		| V.Expression.Update<G>
		| V.Expression.Update.Decrement<G>
		| V.Expression.Update.Increment<G>
		| V.Expression.Yield<G>
		| V.Expression.Yield.Delegate<G>;
}
