// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Expression<G extends GrammarContext> {
	readonly kind:
		| 'expression.assignment'
		| 'expression.assignment.compound'
		| 'expression.assignment.compound.add'
		| 'expression.assignment.compound.and'
		| 'expression.assignment.compound.bitwise_and'
		| 'expression.assignment.compound.bitwise_or'
		| 'expression.assignment.compound.bitwise_xor'
		| 'expression.assignment.compound.divide'
		| 'expression.assignment.compound.exponent'
		| 'expression.assignment.compound.floor_divide'
		| 'expression.assignment.compound.matmul'
		| 'expression.assignment.compound.modulo'
		| 'expression.assignment.compound.multiply'
		| 'expression.assignment.compound.nullish'
		| 'expression.assignment.compound.or'
		| 'expression.assignment.compound.shift_left'
		| 'expression.assignment.compound.shift_right'
		| 'expression.assignment.compound.shift_right_unsigned'
		| 'expression.assignment.compound.subtract'
		| 'expression.await'
		| 'expression.binary'
		| 'expression.binary.arithmetic.add'
		| 'expression.binary.arithmetic.divide'
		| 'expression.binary.arithmetic.exponent'
		| 'expression.binary.arithmetic.floor_divide'
		| 'expression.binary.arithmetic.modulo'
		| 'expression.binary.arithmetic.multiply'
		| 'expression.binary.arithmetic.subtract'
		| 'expression.binary.bitwise.and'
		| 'expression.binary.bitwise.or'
		| 'expression.binary.bitwise.xor'
		| 'expression.binary.comparison'
		| 'expression.binary.comparison.equal'
		| 'expression.binary.comparison.greater'
		| 'expression.binary.comparison.greater_equal'
		| 'expression.binary.comparison.less'
		| 'expression.binary.comparison.less_equal'
		| 'expression.binary.comparison.not_equal'
		| 'expression.binary.comparison.strict_equal'
		| 'expression.binary.comparison.strict_not_equal'
		| 'expression.binary.identity.is'
		| 'expression.binary.identity.is_not'
		| 'expression.binary.logical'
		| 'expression.binary.logical.and'
		| 'expression.binary.logical.or'
		| 'expression.binary.matmul'
		| 'expression.binary.membership.in'
		| 'expression.binary.membership.instanceof'
		| 'expression.binary.membership.not_in'
		| 'expression.binary.nullish'
		| 'expression.binary.shift.left'
		| 'expression.binary.shift.right'
		| 'expression.binary.shift.right_unsigned'
		| 'expression.block.async'
		| 'expression.block.const'
		| 'expression.block.gen'
		| 'expression.block.try'
		| 'expression.block.unsafe'
		| 'expression.call'
		| 'expression.call.import'
		| 'expression.call.macro'
		| 'expression.call.member'
		| 'expression.call.new'
		| 'expression.call.path'
		| 'expression.call.template'
		| 'expression.cast.as'
		| 'expression.cast.assertion'
		| 'expression.cast.non_null'
		| 'expression.cast.satisfies'
		| 'expression.class'
		| 'expression.collection.dictionary'
		| 'expression.collection.list'
		| 'expression.collection.object'
		| 'expression.collection.set'
		| 'expression.collection.struct'
		| 'expression.collection.tuple'
		| 'expression.collection.tuple.bare'
		| 'expression.comprehension.dictionary'
		| 'expression.comprehension.generator'
		| 'expression.comprehension.list'
		| 'expression.comprehension.set'
		| 'expression.conditional'
		| 'expression.function'
		| 'expression.function.generator'
		| 'expression.instantiation'
		| 'expression.interpolation'
		| 'expression.interpolation.conversion'
		| 'expression.interpolation.format'
		| 'expression.jsx.element'
		| 'expression.jsx.element.closing'
		| 'expression.jsx.element.opening'
		| 'expression.jsx.element.self_closing'
		| 'expression.jsx.expression'
		| 'expression.lambda'
		| 'expression.member'
		| 'expression.meta'
		| 'expression.parenthesized'
		| 'expression.range'
		| 'expression.reference'
		| 'expression.sequence'
		| 'expression.slice'
		| 'expression.subscript'
		| 'expression.try'
		| 'expression.unary'
		| 'expression.unary.bitwise_not'
		| 'expression.unary.delete'
		| 'expression.unary.deref'
		| 'expression.unary.negation'
		| 'expression.unary.not'
		| 'expression.unary.plus'
		| 'expression.unary.typeof'
		| 'expression.unary.void'
		| 'expression.unit'
		| 'expression.update'
		| 'expression.update.decrement'
		| 'expression.update.increment'
		| 'expression.yield';
}

export namespace Expression {
	export interface Assignment<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind:
			| 'expression.assignment'
			| 'expression.assignment.compound'
			| 'expression.assignment.compound.add'
			| 'expression.assignment.compound.and'
			| 'expression.assignment.compound.bitwise_and'
			| 'expression.assignment.compound.bitwise_or'
			| 'expression.assignment.compound.bitwise_xor'
			| 'expression.assignment.compound.divide'
			| 'expression.assignment.compound.exponent'
			| 'expression.assignment.compound.floor_divide'
			| 'expression.assignment.compound.matmul'
			| 'expression.assignment.compound.modulo'
			| 'expression.assignment.compound.multiply'
			| 'expression.assignment.compound.nullish'
			| 'expression.assignment.compound.or'
			| 'expression.assignment.compound.shift_left'
			| 'expression.assignment.compound.shift_right'
			| 'expression.assignment.compound.shift_right_unsigned'
			| 'expression.assignment.compound.subtract';
		readonly left:
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement']
			| 'any'
			| 'async'
			| 'boolean'
			| 'declare'
			| 'export'
			| 'get'
			| 'let'
			| 'module'
			| 'namespace'
			| 'new'
			| 'number'
			| 'object'
			| 'override'
			| 'private'
			| 'protected'
			| 'public'
			| 'readonly'
			| 'set'
			| 'static'
			| 'string'
			| 'symbol'
			| 'type';
		readonly right: G['declaration'] | G['expression'] | G['identifier'] | G['literal'] | G['pattern'] | G['statement'];
		readonly using?: boolean;
	}
	export namespace Assignment {
		export interface Compound<G extends GrammarContext> extends V.Expression.Assignment<G> {
			// claimed by prt
			readonly kind:
				| 'expression.assignment.compound'
				| 'expression.assignment.compound.add'
				| 'expression.assignment.compound.and'
				| 'expression.assignment.compound.bitwise_and'
				| 'expression.assignment.compound.bitwise_or'
				| 'expression.assignment.compound.bitwise_xor'
				| 'expression.assignment.compound.divide'
				| 'expression.assignment.compound.exponent'
				| 'expression.assignment.compound.floor_divide'
				| 'expression.assignment.compound.matmul'
				| 'expression.assignment.compound.modulo'
				| 'expression.assignment.compound.multiply'
				| 'expression.assignment.compound.nullish'
				| 'expression.assignment.compound.or'
				| 'expression.assignment.compound.shift_left'
				| 'expression.assignment.compound.shift_right'
				| 'expression.assignment.compound.shift_right_unsigned'
				| 'expression.assignment.compound.subtract';
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement']
				| 'any'
				| 'async'
				| 'boolean'
				| 'declare'
				| 'export'
				| 'get'
				| 'let'
				| 'module'
				| 'namespace'
				| 'new'
				| 'number'
				| 'object'
				| 'override'
				| 'private'
				| 'protected'
				| 'public'
				| 'readonly'
				| 'set'
				| 'static'
				| 'string'
				| 'symbol'
				| 'type';
			readonly operator:
				| '%='
				| '&&='
				| '&='
				| '**='
				| '*='
				| '+='
				| '-='
				| '//='
				| '/='
				| '<<='
				| '>>='
				| '>>>='
				| '??='
				| '@='
				| '^='
				| '|='
				| '||=';
			readonly right:
				| G['declaration']
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		}
		export namespace Compound {
			export interface Add<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.add';
				readonly operator: '+=';
			}
			export interface And<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.and';
				readonly operator: '&&=';
			}
			export interface BitwiseAnd<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.bitwise_and';
				readonly operator: '&=';
			}
			export interface BitwiseOr<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.bitwise_or';
				readonly operator: '|=';
			}
			export interface BitwiseXor<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.bitwise_xor';
				readonly operator: '^=';
			}
			export interface Divide<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.divide';
				readonly operator: '/=';
			}
			export interface Exponent<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.exponent';
				readonly operator: '**=';
			}
			export interface FloorDivide<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.floor_divide';
				readonly operator: '//=';
			}
			export interface Matmul<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.matmul';
				readonly operator: '@=';
			}
			export interface Modulo<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.modulo';
				readonly operator: '%=';
			}
			export interface Multiply<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.multiply';
				readonly operator: '*=';
			}
			export interface Nullish<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.nullish';
				readonly operator: '??=';
			}
			export interface Or<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.or';
				readonly operator: '||=';
			}
			export interface ShiftLeft<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.shift_left';
				readonly operator: '<<=';
			}
			export interface ShiftRight<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.shift_right';
				readonly operator: '>>=';
			}
			export interface ShiftRightUnsigned<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.shift_right_unsigned';
				readonly operator: '>>>=';
			}
			export interface Subtract<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly kind: 'expression.assignment.compound.subtract';
				readonly operator: '-=';
			}
			export type Kinds<G extends GrammarContext> =
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
		export type Kinds<G extends GrammarContext> =
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
	export interface Await<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind: 'expression.await';
		readonly expression:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| V.Pattern.Splat<G>
			| G['statement'];
	}
	export interface Binary<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind:
			| 'expression.binary'
			| 'expression.binary.arithmetic.add'
			| 'expression.binary.arithmetic.divide'
			| 'expression.binary.arithmetic.exponent'
			| 'expression.binary.arithmetic.floor_divide'
			| 'expression.binary.arithmetic.modulo'
			| 'expression.binary.arithmetic.multiply'
			| 'expression.binary.arithmetic.subtract'
			| 'expression.binary.bitwise.and'
			| 'expression.binary.bitwise.or'
			| 'expression.binary.bitwise.xor'
			| 'expression.binary.comparison'
			| 'expression.binary.comparison.equal'
			| 'expression.binary.comparison.greater'
			| 'expression.binary.comparison.greater_equal'
			| 'expression.binary.comparison.less'
			| 'expression.binary.comparison.less_equal'
			| 'expression.binary.comparison.not_equal'
			| 'expression.binary.comparison.strict_equal'
			| 'expression.binary.comparison.strict_not_equal'
			| 'expression.binary.identity.is'
			| 'expression.binary.identity.is_not'
			| 'expression.binary.logical'
			| 'expression.binary.logical.and'
			| 'expression.binary.logical.or'
			| 'expression.binary.matmul'
			| 'expression.binary.membership.in'
			| 'expression.binary.membership.instanceof'
			| 'expression.binary.membership.not_in'
			| 'expression.binary.nullish'
			| 'expression.binary.shift.left'
			| 'expression.binary.shift.right'
			| 'expression.binary.shift.right_unsigned';
		readonly binaryExpressionIn?: V.Unmapped<'typescript:binary_expression_in'>;
		// unmapped: <typescript:binary_expression_in>
		readonly left?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement'];
		readonly operator?:
			| '!='
			| '!=='
			| '%'
			| '&'
			| '&&'
			| '*'
			| '**'
			| '+'
			| '-'
			| '/'
			| '//'
			| '<'
			| '<<'
			| '<='
			| '=='
			| '==='
			| '>'
			| '>='
			| '>>'
			| '>>>'
			| '??'
			| '@'
			| '^'
			| 'and'
			| 'in'
			| 'instanceof'
			| 'or'
			| '|'
			| '||';
		readonly right?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement'];
	}
	export namespace Binary {
		export interface Arithmetic<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind:
				| 'expression.binary.arithmetic.add'
				| 'expression.binary.arithmetic.divide'
				| 'expression.binary.arithmetic.exponent'
				| 'expression.binary.arithmetic.floor_divide'
				| 'expression.binary.arithmetic.modulo'
				| 'expression.binary.arithmetic.multiply'
				| 'expression.binary.arithmetic.subtract';
		}
		export namespace Arithmetic {
			export interface Add<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.add';
				readonly operator: '+';
			}
			export interface Divide<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.divide';
				readonly operator: '/';
			}
			export interface Exponent<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.exponent';
				readonly operator: '**';
			}
			export interface FloorDivide<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.floor_divide';
				readonly operator: '//';
			}
			export interface Modulo<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.modulo';
				readonly operator: '%';
			}
			export interface Multiply<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.multiply';
				readonly operator: '*';
			}
			export interface Subtract<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.arithmetic.subtract';
				readonly operator: '-';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Arithmetic.Add<G>
				| V.Expression.Binary.Arithmetic.Divide<G>
				| V.Expression.Binary.Arithmetic.Exponent<G>
				| V.Expression.Binary.Arithmetic.FloorDivide<G>
				| V.Expression.Binary.Arithmetic.Modulo<G>
				| V.Expression.Binary.Arithmetic.Multiply<G>
				| V.Expression.Binary.Arithmetic.Subtract<G>;
		}
		export interface Bitwise<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind: 'expression.binary.bitwise.and' | 'expression.binary.bitwise.or' | 'expression.binary.bitwise.xor';
		}
		export namespace Bitwise {
			export interface And<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.bitwise.and';
				readonly operator: '&';
			}
			export interface Or<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.bitwise.or';
				readonly operator: '|';
			}
			export interface Xor<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.bitwise.xor';
				readonly operator: '^';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Bitwise.And<G>
				| V.Expression.Binary.Bitwise.Or<G>
				| V.Expression.Binary.Bitwise.Xor<G>;
		}
		export interface Comparison<G extends GrammarContext> extends V.Expression.Binary<G> {
			// claimed by p
			readonly kind:
				| 'expression.binary.comparison'
				| 'expression.binary.comparison.equal'
				| 'expression.binary.comparison.greater'
				| 'expression.binary.comparison.greater_equal'
				| 'expression.binary.comparison.less'
				| 'expression.binary.comparison.less_equal'
				| 'expression.binary.comparison.not_equal'
				| 'expression.binary.comparison.strict_equal'
				| 'expression.binary.comparison.strict_not_equal'
				| 'expression.binary.identity.is'
				| 'expression.binary.identity.is_not'
				| 'expression.binary.membership.in'
				| 'expression.binary.membership.not_in';
			readonly comparators: V.Unmapped<'python:comparison_operator_comparator'>[];
			// prt only
			// unmapped: <python:comparison_operator_comparator>
			readonly left: G['expression'] | G['identifier'] | G['literal'] | V.Pattern.Splat<G>;
			// prt only
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.equal';
				readonly operators: '==';
				readonly operator: '==';
			}
			export interface Greater<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.greater';
				readonly operators: '>';
				readonly operator: '>';
			}
			export interface GreaterEqual<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.greater_equal';
				readonly operators: '>=';
				readonly operator: '>=';
			}
			export interface Less<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.less';
				readonly operators: '<';
				readonly operator: '<';
			}
			export interface LessEqual<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.less_equal';
				readonly operators: '<=';
				readonly operator: '<=';
			}
			export interface NotEqual<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.not_equal';
				readonly operators: '!=';
				readonly operator: '!=';
			}
			export interface StrictEqual<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.strict_equal';
				readonly operator: '===';
			}
			export interface StrictNotEqual<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.comparison.strict_not_equal';
				readonly operator: '!==';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Comparison<G>
				| V.Expression.Binary.Comparison.Equal<G>
				| V.Expression.Binary.Comparison.Greater<G>
				| V.Expression.Binary.Comparison.GreaterEqual<G>
				| V.Expression.Binary.Comparison.Less<G>
				| V.Expression.Binary.Comparison.LessEqual<G>
				| V.Expression.Binary.Comparison.NotEqual<G>
				| V.Expression.Binary.Comparison.StrictEqual<G>
				| V.Expression.Binary.Comparison.StrictNotEqual<G>;
		}
		export interface Identity<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind: 'expression.binary.identity.is' | 'expression.binary.identity.is_not';
		}
		export namespace Identity {
			export interface Is<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.identity.is';
				readonly operators: 'is';
			}
			export interface IsNot<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.identity.is_not';
				readonly operators: 'is not';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Identity.Is<G>
				| V.Expression.Binary.Identity.IsNot<G>;
		}
		export interface Logical<G extends GrammarContext> extends V.Expression.Binary<G> {
			// claimed by p
			readonly kind: 'expression.binary.logical' | 'expression.binary.logical.and' | 'expression.binary.logical.or';
			readonly left: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			// prt only
			readonly operator: '&&' | 'and' | 'or' | '||';
			// prt only
			readonly right: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			// prt only
		}
		export namespace Logical {
			export interface And<G extends GrammarContext> extends V.Expression.Binary.Logical<G> {
				readonly kind: 'expression.binary.logical.and';
				readonly operator: '&&' | 'and';
			}
			export interface Or<G extends GrammarContext> extends V.Expression.Binary.Logical<G> {
				readonly kind: 'expression.binary.logical.or';
				readonly operator: 'or' | '||';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Logical<G>
				| V.Expression.Binary.Logical.And<G>
				| V.Expression.Binary.Logical.Or<G>;
		}
		export interface Matmul<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind: 'expression.binary.matmul';
			readonly operator: '@';
		}
		export interface Membership<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind:
				| 'expression.binary.membership.in'
				| 'expression.binary.membership.instanceof'
				| 'expression.binary.membership.not_in';
		}
		export namespace Membership {
			export interface In<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.membership.in';
				readonly operators: 'in';
				readonly operator: 'in';
			}
			export interface Instanceof<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.membership.instanceof';
				readonly operator: 'instanceof';
			}
			export interface NotIn<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly kind: 'expression.binary.membership.not_in';
				readonly operators: 'not in';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Membership.In<G>
				| V.Expression.Binary.Membership.Instanceof<G>
				| V.Expression.Binary.Membership.NotIn<G>;
		}
		export interface Nullish<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind: 'expression.binary.nullish';
			readonly operator: '??';
		}
		export interface Shift<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly kind:
				| 'expression.binary.shift.left'
				| 'expression.binary.shift.right'
				| 'expression.binary.shift.right_unsigned';
		}
		export namespace Shift {
			export interface Left<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.shift.left';
				readonly operator: '<<';
			}
			export interface Right<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.shift.right';
				readonly operator: '>>';
			}
			export interface RightUnsigned<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly kind: 'expression.binary.shift.right_unsigned';
				readonly operator: '>>>';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Shift.Left<G>
				| V.Expression.Binary.Shift.Right<G>
				| V.Expression.Binary.Shift.RightUnsigned<G>;
		}
		export type Kinds<G extends GrammarContext> =
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
			| V.Expression.Binary.Comparison<G>
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
	export interface Block<G extends GrammarContext> extends V.Expression<G> {
		readonly kind:
			| 'expression.block.async'
			| 'expression.block.const'
			| 'expression.block.gen'
			| 'expression.block.try'
			| 'expression.block.unsafe';
		readonly body: V.Statement.Block<G>;
		// r only
	}
	export namespace Block {
		export interface Async<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly kind: 'expression.block.async';
			readonly body: V.Statement.Block<G>;
			readonly move?: boolean;
		}
		export interface Const<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly kind: 'expression.block.const';
			readonly body: V.Statement.Block<G>;
		}
		export interface Gen<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly kind: 'expression.block.gen';
			readonly body: V.Statement.Block<G>;
			readonly move?: boolean;
		}
		export interface Try<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly kind: 'expression.block.try';
			readonly body: V.Statement.Block<G>;
		}
		export interface Unsafe<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly kind: 'expression.block.unsafe';
			readonly body: V.Statement.Block<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Block.Async<G>
			| V.Expression.Block.Const<G>
			| V.Expression.Block.Gen<G>
			| V.Expression.Block.Try<G>
			| V.Expression.Block.Unsafe<G>;
	}
	export interface Call<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind:
			| 'expression.call'
			| 'expression.call.import'
			| 'expression.call.macro'
			| 'expression.call.member'
			| 'expression.call.new'
			| 'expression.call.path'
			| 'expression.call.template';
		readonly arguments?:
			| (G['expression'] | G['element'] | G['argument'])[]
			| (G['expression'] | G['element'])[]
			| V.Element.Macro.TokenTree.Delimited<G>
			| V.Expression.Comprehension.Generator<G>
			| V.Literal.Template<G>;
		readonly function?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| V.Pattern.Splat<G>
			| G['statement'];
		readonly typeArguments?: G['type'][];
		// t only
	}
	export namespace Call {
		export interface Import<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by t
			readonly kind: 'expression.call.import';
		}
		export interface Macro<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by r
			readonly kind: 'expression.call.macro';
			readonly arguments: V.Element.Macro.TokenTree.Delimited<G>;
			readonly function: G['identifier'];
		}
		export interface Member<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by prt
			readonly kind: 'expression.call.member';
			readonly arguments:
				| (G['expression'] | G['element'] | G['argument'])[]
				| (G['expression'] | G['element'])[]
				| V.Expression.Comprehension.Generator<G>;
			readonly function: G['expression'] | G['identifier'] | G['literal'] | V.Pattern.Splat<G> | G['statement'];
			readonly typeArguments?: G['type'][];
			// t only
		}
		export interface New<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by t
			readonly kind: 'expression.call.new';
			readonly arguments?: (G['expression'] | G['element'])[];
			readonly function: G['expression'] | G['identifier'] | G['literal'];
			readonly typeArguments?: G['type'][];
		}
		export interface Path<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by r
			readonly kind: 'expression.call.path';
			readonly arguments: (G['expression'] | G['element'])[];
			readonly function: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		}
		export interface Template<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by t
			readonly kind: 'expression.call.template';
			readonly arguments: V.Literal.Template<G>;
			readonly function: G['expression'] | G['identifier'] | G['literal'];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Call<G>
			| V.Expression.Call.Import<G>
			| V.Expression.Call.Macro<G>
			| V.Expression.Call.Member<G>
			| V.Expression.Call.New<G>
			| V.Expression.Call.Path<G>
			| V.Expression.Call.Template<G>;
	}
	export interface Cast<G extends GrammarContext> extends V.Expression<G> {
		readonly kind:
			| 'expression.cast.as'
			| 'expression.cast.assertion'
			| 'expression.cast.non_null'
			| 'expression.cast.satisfies';
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		// t only
	}
	export namespace Cast {
		export interface As<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by rt
			readonly kind: 'expression.cast.as';
			readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			// t only
			readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			// r only
			readonly typeAnnotation?: G['identifier'] | 'const' | G['type'];
			// t only
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			// r only
		}
		export interface Assertion<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
			readonly kind: 'expression.cast.assertion';
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly typeArguments: G['type'][];
		}
		export interface NonNull<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
			readonly kind: 'expression.cast.non_null';
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		}
		export interface Satisfies<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
			readonly kind: 'expression.cast.satisfies';
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly typeAnnotation: G['identifier'] | G['type'];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Cast.As<G>
			| V.Expression.Cast.Assertion<G>
			| V.Expression.Cast.NonNull<G>
			| V.Expression.Cast.Satisfies<G>;
	}
	export interface Class<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly kind: 'expression.class';
		readonly body: G['declaration'][];
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly extends?: V.Clause.Extends<G>;
		readonly implements?: (G['identifier'] | G['type'])[];
		readonly name?: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Collection<G extends GrammarContext> extends V.Expression<G> {
		readonly kind:
			| 'expression.collection.dictionary'
			| 'expression.collection.list'
			| 'expression.collection.object'
			| 'expression.collection.set'
			| 'expression.collection.struct'
			| 'expression.collection.tuple'
			| 'expression.collection.tuple.bare';
	}
	export namespace Collection {
		export interface Dictionary<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by p
			readonly kind: 'expression.collection.dictionary';
			readonly entries?: V.Unmapped<'python:dictionary_elements'>;
			// unmapped: <python:dictionary_elements>
		}
		export interface List<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by prt
			readonly kind: 'expression.collection.list';
			readonly collectionElements?: V.Unmapped<'python:collection_elements'>;
			// p only
			// unmapped: <python:collection_elements>
			readonly content?: V.Unmapped<'rust:array_expression_list'> | V.Unmapped<'rust:array_expression_semi'>;
			// r only
			// unmapped: <rust:array_expression_list> <rust:array_expression_semi>
			readonly elements?: (
				| V.Declaration.Module<G>
				| V.Element.Splat<G>
				| G['expression']
				| G['identifier']
				| G['literal']
			)[];
			// t only
		}
		export interface Object<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by t
			readonly kind: 'expression.collection.object';
			readonly properties?: (V.Declaration.Method<G> | G['element'] | V.Identifier.Property.Shorthand<G>)[];
		}
		export interface Set<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by p
			readonly kind: 'expression.collection.set';
			readonly collectionElements: V.Unmapped<'python:collection_elements'>;
			// unmapped: <python:collection_elements>
		}
		export interface Struct<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by r
			readonly kind: 'expression.collection.struct';
			readonly body: V.Unmapped<'rust:field_initializer_list'>;
			// unmapped: <rust:field_initializer_list>
			readonly name: G['identifier'] | G['type'];
		}
		export interface Tuple<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by pr
			readonly kind: 'expression.collection.tuple' | 'expression.collection.tuple.bare';
			readonly attributes?: G['attribute'][];
			// r only
			readonly collectionElements?: V.Unmapped<'python:collection_elements'>;
			// p only
			// unmapped: <python:collection_elements>
			readonly tupleExpressionElements?: V.Unmapped<'rust:tuple_expression_elements'>;
			// r only
			// unmapped: <rust:tuple_expression_elements>
		}
		export namespace Tuple {
			export interface Bare<G extends GrammarContext> extends V.Expression.Collection.Tuple<G> {
				// claimed by p
				readonly kind: 'expression.collection.tuple.bare';
				readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
				readonly tail: V.Unmapped<'python:expression_list_expressions'> | ',';
				// unmapped: <python:expression_list_expressions>
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Collection.Tuple<G>
				| V.Expression.Collection.Tuple.Bare<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Collection.Dictionary<G>
			| V.Expression.Collection.List<G>
			| V.Expression.Collection.Object<G>
			| V.Expression.Collection.Set<G>
			| V.Expression.Collection.Struct<G>
			| V.Expression.Collection.Tuple<G>
			| V.Expression.Collection.Tuple.Bare<G>;
	}
	export interface Comprehension<G extends GrammarContext> extends V.Expression<G> {
		readonly kind:
			| 'expression.comprehension.dictionary'
			| 'expression.comprehension.generator'
			| 'expression.comprehension.list'
			| 'expression.comprehension.set';
		readonly body: V.Element.Pair<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// p only
		readonly comprehensionClauses: V.Clause.Comprehension<G>;
		// p only
	}
	export namespace Comprehension {
		export interface Dictionary<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly kind: 'expression.comprehension.dictionary';
			readonly body: V.Element.Pair<G>;
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Generator<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly kind: 'expression.comprehension.generator';
			readonly body: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface List<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly kind: 'expression.comprehension.list';
			readonly body: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Set<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly kind: 'expression.comprehension.set';
			readonly body: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Comprehension.Dictionary<G>
			| V.Expression.Comprehension.Generator<G>
			| V.Expression.Comprehension.List<G>
			| V.Expression.Comprehension.Set<G>;
	}
	export interface Conditional<G extends GrammarContext> extends V.Expression<G> {
		// claimed by pt
		readonly kind: 'expression.conditional';
		readonly alternative: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly condition: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly consequence: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Function<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly kind: 'expression.function' | 'expression.function.generator';
		readonly async?: boolean;
		readonly body: V.Statement.Block<G>;
		readonly name?: G['identifier'];
		readonly parameters: V.Declaration.Parameter<G>[];
		readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> extends V.Expression.Function<G> {
			// claimed by t
			readonly kind: 'expression.function.generator';
			readonly async?: boolean;
			readonly body: V.Statement.Block<G>;
			readonly generator?: boolean;
			readonly name?: G['identifier'];
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export type Kinds<G extends GrammarContext> = V.Expression.Function<G> | V.Expression.Function.Generator<G>;
	}
	export interface Instantiation<G extends GrammarContext> extends V.Expression<G> {
		// claimed by rt
		readonly kind: 'expression.instantiation';
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		// t only
		readonly function?: V.Expression.Member<G> | G['identifier'];
		// r only
		readonly typeArguments: G['type'][];
	}
	export interface Interpolation<G extends GrammarContext> extends V.Expression<G> {
		// claimed by pt
		readonly kind:
			| 'expression.interpolation'
			| 'expression.interpolation.conversion'
			| 'expression.interpolation.format';
		readonly eq?: boolean;
		// p only
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>;
		// p only
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>;
		// p only
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarContext> extends V.Expression.Interpolation<G> {
			// claimed by p
			readonly kind: 'expression.interpolation.conversion';
		}
		export interface Format<G extends GrammarContext> extends V.Expression.Interpolation<G> {
			// claimed by p
			readonly kind: 'expression.interpolation.format';
			readonly contents?: (V.Expression.Interpolation<G> | '[^{}\\n]+')[];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Interpolation<G>
			| V.Expression.Interpolation.Conversion<G>
			| V.Expression.Interpolation.Format<G>;
	}
	export interface Jsx<G extends GrammarContext> extends V.Expression<G> {
		readonly kind:
			| 'expression.jsx.element'
			| 'expression.jsx.element.closing'
			| 'expression.jsx.element.opening'
			| 'expression.jsx.element.self_closing'
			| 'expression.jsx.expression';
	}
	export namespace Jsx {
		export interface Element<G extends GrammarContext> extends V.Expression.Jsx<G> {
			// claimed by t
			readonly kind:
				| 'expression.jsx.element'
				| 'expression.jsx.element.closing'
				| 'expression.jsx.element.opening'
				| 'expression.jsx.element.self_closing';
		}
		export namespace Element {
			export interface Closing<G extends GrammarContext> extends V.Expression.Jsx.Element<G> {
				// claimed by t
				readonly kind: 'expression.jsx.element.closing';
			}
			export interface Opening<G extends GrammarContext> extends V.Expression.Jsx.Element<G> {
				// claimed by t
				readonly kind: 'expression.jsx.element.opening';
			}
			export interface SelfClosing<G extends GrammarContext> extends V.Expression.Jsx.Element<G> {
				// claimed by t
				readonly kind: 'expression.jsx.element.self_closing';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Jsx.Element<G>
				| V.Expression.Jsx.Element.Closing<G>
				| V.Expression.Jsx.Element.Opening<G>
				| V.Expression.Jsx.Element.SelfClosing<G>;
		}
		export interface Expression<G extends GrammarContext> extends V.Expression.Jsx<G> {
			// claimed by t
			readonly kind: 'expression.jsx.expression';
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Jsx.Element<G>
			| V.Expression.Jsx.Element.Closing<G>
			| V.Expression.Jsx.Element.Opening<G>
			| V.Expression.Jsx.Element.SelfClosing<G>
			| V.Expression.Jsx.Expression<G>;
	}
	export interface Lambda<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind: 'expression.lambda';
		readonly async?: boolean;
		// rt only
		readonly body?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| V.Statement.Block<G>;
		// pt only
		readonly content?:
			| V.Unmapped<'rust:closure_expression_block'>
			| V.Unmapped<'rust:closure_expression_expr'>
			| V.Unmapped<'typescript:arrow_function_parameter'>
			| V.Declaration.Signature.Call<G>;
		// rt only
		// unmapped: <rust:closure_expression_block> <rust:closure_expression_expr> <typescript:arrow_function_parameter>
		readonly move?: boolean;
		// r only
		readonly parameters?: V.Declaration.Parameter<G>[];
		// pr only
		readonly static?: boolean;
		// r only
	}
	export interface Member<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind: 'expression.member';
		readonly object:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| V.Pattern.Splat<G>
			| G['statement'];
		readonly property: G['identifier'] | V.Literal.Number.Integer<G>;
	}
	export interface Meta<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly kind: 'expression.meta';
		readonly content: unknown;
		// unmapped: literal:_meta_property_import_meta literal:_meta_property_new_target
	}
	export interface Parenthesized<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind: 'expression.parenthesized';
		readonly content?:
			| V.Unmapped<'typescript:parenthesized_expression_typed'>
			| V.Element.Splat<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| V.Attribute.Content.Kinds<G>;
		// pt only
		// unmapped: <typescript:parenthesized_expression_typed>
		readonly expression?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
	}
	export interface Range<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly kind: 'expression.range';
		readonly content:
			| V.Unmapped<'rust:range_expression_binary'>
			| V.Unmapped<'rust:range_expression_postfix'>
			| V.Unmapped<'rust:range_expression_prefix'>;
		// unmapped: <rust:range_expression_binary> <rust:range_expression_postfix> <rust:range_expression_prefix> literal:_range_expression_bare
	}
	export interface Reference<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly kind: 'expression.reference';
		readonly argument: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		readonly content?: V.Unmapped<'rust:reference_expression_raw_mut'>;
		// unmapped: <rust:reference_expression_raw_mut> literal:_reference_expression_raw_const literal:mutable_specifier
	}
	export interface Sequence<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly kind: 'expression.sequence';
		readonly expressions: (V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'])[];
	}
	export interface Slice<G extends GrammarContext> extends V.Expression<G> {
		// claimed by p
		readonly kind: 'expression.slice';
		readonly start?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly step?: V.Unmapped<'python:slice_group'>;
		// unmapped: <python:slice_group>
		readonly stop?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Subscript<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind: 'expression.subscript';
		readonly index?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// rt only
		readonly object:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| V.Pattern.Splat<G>
			| G['statement'];
		readonly optionalChain?: boolean;
		// t only
		readonly subscripts?: V.Unmapped<'python:subscripts'>;
		// p only
		// unmapped: <python:subscripts>
	}
	export interface Try<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly kind: 'expression.try';
		readonly value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export interface Unary<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind:
			| 'expression.unary'
			| 'expression.unary.bitwise_not'
			| 'expression.unary.delete'
			| 'expression.unary.deref'
			| 'expression.unary.negation'
			| 'expression.unary.not'
			| 'expression.unary.plus'
			| 'expression.unary.typeof'
			| 'expression.unary.void';
		readonly argument?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | V.Pattern.Splat<G>;
		readonly operand?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		readonly operator: '!' | '*' | '+' | '-' | 'delete' | 'typeof' | 'void' | '~';
	}
	export namespace Unary {
		export interface BitwiseNot<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.bitwise_not';
			readonly operator: '~';
		}
		export interface Delete<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.delete';
			readonly operator: 'delete';
		}
		export interface Deref<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.deref';
			readonly operator: '*';
		}
		export interface Negation<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.negation';
			readonly operator: '-';
		}
		export interface Not<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.not';
			readonly operator: '!';
		}
		export interface Plus<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.plus';
			readonly operator: '+';
		}
		export interface Typeof<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.typeof';
			readonly operator: 'typeof';
		}
		export interface Void<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly kind: 'expression.unary.void';
			readonly operator: 'void';
		}
		export type Kinds<G extends GrammarContext> =
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
	export interface Unit<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly kind: 'expression.unit';
	}
	export interface Update<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly kind: 'expression.update' | 'expression.update.decrement' | 'expression.update.increment';
		readonly content:
			| V.Unmapped<'typescript:update_expression_postfix'>
			| V.Unmapped<'typescript:update_expression_prefix'>;
		// unmapped: <typescript:update_expression_postfix> <typescript:update_expression_prefix>
	}
	export namespace Update {
		export interface Decrement<G extends GrammarContext> extends V.Expression.Update<G> {
			readonly kind: 'expression.update.decrement';
			readonly operator: '--';
		}
		export interface Increment<G extends GrammarContext> extends V.Expression.Update<G> {
			readonly kind: 'expression.update.increment';
			readonly operator: '++';
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Update<G>
			| V.Expression.Update.Decrement<G>
			| V.Expression.Update.Increment<G>;
	}
	export interface Yield<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly kind: 'expression.yield';
		readonly content?:
			| V.Unmapped<'python:yield_from_clause'>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern'];
		// p only
		// unmapped: <python:yield_from_clause>
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// rt only
	}
	export type Kinds<G extends GrammarContext> =
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
		| V.Expression.Binary.Comparison<G>
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
		| V.Expression.Function.Generator<G>
		| V.Expression.Instantiation<G>
		| V.Expression.Interpolation<G>
		| V.Expression.Interpolation.Conversion<G>
		| V.Expression.Interpolation.Format<G>
		| V.Expression.Jsx.Element<G>
		| V.Expression.Jsx.Element.Closing<G>
		| V.Expression.Jsx.Element.Opening<G>
		| V.Expression.Jsx.Element.SelfClosing<G>
		| V.Expression.Jsx.Expression<G>
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
		| V.Expression.Yield<G>;
}
