import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Expression<G extends GrammarContext<G>> {
	readonly $kind: 'expression';
}

export namespace Expression {
	export interface Assignment<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.assignment';
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
		}
	}
	export interface Binary<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.binary';
		readonly binaryExpressionIn?: G['slots']['expression.binary']['binaryExpressionIn'];
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
		}
	}
	export interface Block<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.block';
		readonly body: V.Statement.Block<G>;
		// r only
	}
	export interface Call<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.call';
		readonly arguments?: G['slots']['expression.call']['arguments'] | G['slots']['expression.call']['arguments'][];
		readonly function?: G['slots']['expression.call']['function'];
	}
	export namespace Call {
		export interface Member<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by prt
			readonly $kind: 'expression.call.member';
			readonly arguments:
				| G['slots']['expression.call.member']['arguments']
				| G['slots']['expression.call.member']['arguments'][];
			readonly function: G['slots']['expression.call.member']['function'];
		}
		export interface Path<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by r
			readonly $kind: 'expression.call.path';
			readonly arguments: G['slots']['expression.call.path']['arguments'][];
			readonly function: G['slots']['expression.call.path']['function'];
		}
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
			readonly collectionElements?: G['slots']['expression.collection.list']['collectionElements'][];
			// p only
			readonly elements?: G['slots']['expression.collection.list']['elements'][];
			// t only
		}
		export interface Object<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by t
			readonly $kind: 'expression.collection.object';
			readonly properties?: G['slots']['expression.collection.object']['properties'][];
		}
		export interface Set<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by p
			readonly $kind: 'expression.collection.set';
			readonly collectionElements: G['slots']['expression.collection.set']['collectionElements'][];
		}
	}
	export interface Function<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.function';
		readonly body: V.Statement.Block<G>;
		readonly name?: G['identifier'];
		readonly parameters: V.Declaration.Parameter.Any<G>[];
	}
	export interface Lambda<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.lambda';
		readonly body?: G['slots']['expression.lambda']['body'];
		// pt only
		readonly parameters?:
			| G['slots']['expression.lambda']['parameters']
			| G['slots']['expression.lambda']['parameters'][];
		// pt only
	}
	export interface Member<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.member';
		readonly object: G['slots']['expression.member']['object'];
		readonly property: G['slots']['expression.member']['property'];
	}
	export interface Meta<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.meta';
	}
	export interface Parenthesized<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.parenthesized';
		readonly expression?: G['slots']['expression.parenthesized']['expression'];
		// pr only
	}
	export interface Sequence<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.sequence';
		readonly expressions: G['slots']['expression.sequence']['expressions'][];
	}
	export interface Subscript<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.subscript';
		readonly index?: G['slots']['expression.subscript']['index'] | G['slots']['expression.subscript']['index'][];
		readonly object: G['slots']['expression.subscript']['object'];
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
	}
}
