import type { GrammarMap, Slot } from './map.ts';
import type { Flag, SubKindOf } from './utils.ts';
import type * as V from './index.ts';
import type * as gate from './utils.ts';
import type * as features from './features/index.ts';
export interface Expression<G extends GrammarMap> {
	readonly $kind: 'expression';
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
	export interface Assignment<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.assignment';
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
		export interface Compound<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment<G>, 'left' | 'right'> {
			// claimed by prt
			readonly $kind: 'expression.assignment.compound';
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
			export interface Add<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.add';
			}
			export interface And<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.and';
			}
			export interface BitwiseAnd<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.bitwise_and';
			}
			export interface BitwiseOr<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.bitwise_or';
			}
			export interface BitwiseXor<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.bitwise_xor';
			}
			export interface Coalesce<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.coalesce';
			}
			export interface Divide<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.divide';
			}
			export interface Exponent<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.exponent';
			}
			export interface FloorDivide<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.floor_divide';
			}
			export interface MatrixMultiply<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.matrix_multiply';
			}
			export interface Modulo<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.modulo';
			}
			export interface Multiply<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.multiply';
			}
			export interface Or<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.or';
			}
			export interface ShiftLeft<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.shift_left';
			}
			export interface ShiftRight<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.shift_right';
			}
			export interface ShiftRightUnsigned<G extends GrammarMap> extends SubKindOf<
				V.Expression.Assignment.Compound<G>
			> {
				readonly $kind: 'expression.assignment.compound.shift_right_unsigned';
			}
			export interface Subtract<G extends GrammarMap> extends SubKindOf<V.Expression.Assignment.Compound<G>> {
				readonly $kind: 'expression.assignment.compound.subtract';
			}
		}
	}
	export interface Binary<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.binary';
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
		export interface Arithmetic<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.arithmetic';
		}
		export namespace Arithmetic {
			export interface Add<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.add';
				readonly operator: '+';
			}
			export interface Divide<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.divide';
				readonly operator: '/';
			}
			export interface Exponent<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.exponent';
				readonly operator: '**';
			}
			export interface FloorDivide<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.floor_divide';
				readonly operator: '//';
			}
			export interface Modulo<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.modulo';
				readonly operator: '%';
			}
			export interface Multiply<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.multiply';
				readonly operator: '*';
			}
			export interface Subtract<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.arithmetic.subtract';
				readonly operator: '-';
			}
		}
		export interface Bitwise<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.bitwise';
		}
		export namespace Bitwise {
			export interface And<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.bitwise.and';
				readonly operator: '&';
			}
			export interface Or<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.bitwise.or';
				readonly operator: '|';
			}
			export interface Xor<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.bitwise.xor';
				readonly operator: '^';
			}
		}
		export interface Coalesce<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
			readonly $kind: 'expression.binary.coalesce';
			readonly operator: '??';
		}
		export interface Comparison<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.comparison';
		}
		export namespace Comparison {
			export interface Chain<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Comparison<G>> {
				// claimed by p
				readonly $kind: 'expression.binary.comparison.chain';
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
			export interface Equal<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.comparison.equal';
				readonly operator: '==' | '===';
			}
			export interface Greater<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.comparison.greater';
				readonly operator: '>';
			}
			export interface GreaterEqual<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.comparison.greater_equal';
				readonly operator: '>=';
			}
			export interface Less<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.comparison.less';
				readonly operator: '<';
			}
			export interface LessEqual<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.comparison.less_equal';
				readonly operator: '<=';
			}
			export interface NotEqual<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.comparison.not_equal';
				readonly operator: '!=' | '!==' | '<>';
			}
			export namespace NotEqual {
				export interface Legacy<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Comparison.NotEqual<G>> {
					// claimed by p
					readonly $kind: 'expression.binary.comparison.not_equal.legacy';
					readonly operator: '<>';
				}
			}
		}
		// @ts-expect-error expression.binary.identity: its operator fill is unknown, outside expression.binary's string.
		export interface Identity<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.identity';
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
			export interface Is<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Identity<G>, 'left' | 'operator'> {
				// claimed by p
				readonly $kind: 'expression.binary.identity.is';
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
			export interface IsNot<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Identity<G>, 'left' | 'operator'> {
				// claimed by p
				readonly $kind: 'expression.binary.identity.is_not';
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
		export interface Logical<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'left' | 'operator' | 'right'> {
			// claimed by p
			readonly $kind: 'expression.binary.logical';
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
			export interface And<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Logical<G>, 'operator'> {
				readonly $kind: 'expression.binary.logical.and';
				readonly operator: '&&' | 'and';
			}
			export interface Or<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Logical<G>, 'operator'> {
				readonly $kind: 'expression.binary.logical.or';
				readonly operator: 'or' | '||';
			}
		}
		export interface MatrixMultiply<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
			readonly $kind: 'expression.binary.matrix_multiply';
			readonly operator: '@';
		}
		// @ts-expect-error expression.binary.membership: its operator fill is unknown, outside expression.binary's string.
		export interface Membership<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.membership';
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
			export interface In<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.membership.in';
				readonly operator: 'in';
			}
			export interface Instanceof<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.membership.instanceof';
				readonly operator: 'instanceof';
			}
			export interface NotIn<G extends GrammarMap> extends SubKindOf<V.Expression.Binary.Membership<G>, 'left' | 'operator'> {
				// claimed by p
				readonly $kind: 'expression.binary.membership.not_in';
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
		export interface Shift<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>> {
			readonly $kind: 'expression.binary.shift';
		}
		export namespace Shift {
			export interface Left<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.shift.left';
				readonly operator: '<<';
			}
			export interface Right<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.shift.right';
				readonly operator: '>>';
			}
			export interface RightUnsigned<G extends GrammarMap> extends SubKindOf<V.Expression.Binary<G>, 'operator'> {
				readonly $kind: 'expression.binary.shift.right_unsigned';
				readonly operator: '>>>';
			}
		}
	}
	export interface Block<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.block';
		readonly body: V.Statement.Block<G>;
		// r only
	}
	export interface Call<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.call';
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
		export interface Member<G extends GrammarMap> extends SubKindOf<V.Expression.Call<G>, 'arguments' | 'function' | 'typeArguments'> {
			// claimed by prt
			readonly $kind: 'expression.call.member';
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
		export interface Qualified<G extends GrammarMap> extends SubKindOf<V.Expression.Call<G>, 'arguments' | 'function'> {
			// claimed by r
			readonly $kind: 'expression.call.qualified';
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
	export interface Collection<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.collection';
	}
	export namespace Collection {
		export interface List<G extends GrammarMap> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by prt
			readonly $kind: 'expression.collection.list';
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
			export interface Repeat<G extends GrammarMap> extends SubKindOf<V.Expression.Collection.List<G>> {
				// claimed by r
				readonly $kind: 'expression.collection.list.repeat';
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
		export interface Map<G extends GrammarMap> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by p
			readonly $kind: 'expression.collection.map';
			readonly elements?: Slot<G, 'expression.collection.map', 'elements', V.Element.Any<G>>[];
		}
		export interface Object<G extends GrammarMap> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by t
			readonly $kind: 'expression.collection.object';
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
		export interface Set<G extends GrammarMap> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by p
			readonly $kind: 'expression.collection.set';
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
	export interface Function<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.function';
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
	export interface Lambda<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.lambda';
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
	export interface Member<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.member';
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
	export interface Meta<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.meta';
	}
	export interface Parenthesized<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.parenthesized';
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
	export interface Sequence<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.sequence';
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
	export interface Subscript<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.subscript';
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
	export interface Unary<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.unary';
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
		export interface BitwiseNot<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.bitwise_not';
		}
		export interface Delete<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.delete';
		}
		export interface Negation<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.negation';
		}
		export interface Not<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.not';
		}
		export interface Plus<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.plus';
		}
		export interface Typeof<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.typeof';
		}
		export interface Void<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.void';
		}
	}
	export interface Update<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.update';
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
		export interface Decrement<G extends GrammarMap> extends SubKindOf<V.Expression.Update<G>> {
			readonly $kind: 'expression.update.decrement';
		}
		export interface Increment<G extends GrammarMap> extends SubKindOf<V.Expression.Update<G>> {
			readonly $kind: 'expression.update.increment';
		}
	}
}
