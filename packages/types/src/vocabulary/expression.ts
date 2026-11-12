import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
import type * as gate from './utils.ts';
import type * as features from './features/index.ts';
export interface Expression<G extends GrammarMap, K extends Under<'expression'> = 'expression'> {
	readonly $path: K;
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
		readonly $path: K;
		readonly left: Slot<
			G,
			K,
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
			K,
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
		export interface Compound<G extends GrammarMap, K extends Under<'expression.assignment.compound'> = 'expression.assignment.compound'> extends SubKindOf<V.Expression.Assignment<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly left: Slot<
				G,
				K,
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
				K,
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
				readonly $path: K;
			}
			export interface BitwiseAnd<G extends GrammarMap, K extends Under<'expression.assignment.compound.bitwise_and'> = 'expression.assignment.compound.bitwise_and'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface BitwiseOr<G extends GrammarMap, K extends Under<'expression.assignment.compound.bitwise_or'> = 'expression.assignment.compound.bitwise_or'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface BitwiseXor<G extends GrammarMap, K extends Under<'expression.assignment.compound.bitwise_xor'> = 'expression.assignment.compound.bitwise_xor'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface Divide<G extends GrammarMap, K extends Under<'expression.assignment.compound.divide'> = 'expression.assignment.compound.divide'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface Modulo<G extends GrammarMap, K extends Under<'expression.assignment.compound.modulo'> = 'expression.assignment.compound.modulo'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface Multiply<G extends GrammarMap, K extends Under<'expression.assignment.compound.multiply'> = 'expression.assignment.compound.multiply'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface ShiftLeft<G extends GrammarMap, K extends Under<'expression.assignment.compound.shift_left'> = 'expression.assignment.compound.shift_left'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface ShiftRight<G extends GrammarMap, K extends Under<'expression.assignment.compound.shift_right'> = 'expression.assignment.compound.shift_right'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
			export interface Subtract<G extends GrammarMap, K extends Under<'expression.assignment.compound.subtract'> = 'expression.assignment.compound.subtract'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
		}
	}
	export interface Binary<G extends GrammarMap, K extends Under<'expression.binary'> = 'expression.binary'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly left?: Slot<
			G,
			K,
			'left',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
		readonly operator?: Slot<G, K, 'operator', string>;
		readonly right?: Slot<
			G,
			K,
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
			readonly $path: K;
		}
		export namespace Arithmetic {
			export interface Add<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.add'> = 'expression.binary.arithmetic.add'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Divide<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.divide'> = 'expression.binary.arithmetic.divide'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Modulo<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.modulo'> = 'expression.binary.arithmetic.modulo'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Multiply<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.multiply'> = 'expression.binary.arithmetic.multiply'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Subtract<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.subtract'> = 'expression.binary.arithmetic.subtract'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
		export interface Bitwise<G extends GrammarMap, K extends Under<'expression.binary.bitwise'> = 'expression.binary.bitwise'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $path: K;
		}
		export namespace Bitwise {
			export interface And<G extends GrammarMap, K extends Under<'expression.binary.bitwise.and'> = 'expression.binary.bitwise.and'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Or<G extends GrammarMap, K extends Under<'expression.binary.bitwise.or'> = 'expression.binary.bitwise.or'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Xor<G extends GrammarMap, K extends Under<'expression.binary.bitwise.xor'> = 'expression.binary.bitwise.xor'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
		export interface Comparison<G extends GrammarMap, K extends Under<'expression.binary.comparison'> = 'expression.binary.comparison'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $path: K;
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarMap, K extends Under<'expression.binary.comparison.equal'> = 'expression.binary.comparison.equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Greater<G extends GrammarMap, K extends Under<'expression.binary.comparison.greater'> = 'expression.binary.comparison.greater'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface GreaterEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.greater_equal'> = 'expression.binary.comparison.greater_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Less<G extends GrammarMap, K extends Under<'expression.binary.comparison.less'> = 'expression.binary.comparison.less'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface LessEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.less_equal'> = 'expression.binary.comparison.less_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface NotEqual<G extends GrammarMap, K extends Under<'expression.binary.comparison.not_equal'> = 'expression.binary.comparison.not_equal'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
		export interface Logical<G extends GrammarMap, K extends Under<'expression.binary.logical'> = 'expression.binary.logical'> extends SubKindOf<V.Expression.Binary<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly left: Slot<
				G,
				K,
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Declaration.Module<G>
				| V.Statement.Any<G>
			>;
			// prt only
			readonly operator: Slot<G, K, 'operator', string>;
			// prt only
			readonly right: Slot<
				G,
				K,
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
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Or<G extends GrammarMap, K extends Under<'expression.binary.logical.or'> = 'expression.binary.logical.or'> extends SubKindOf<V.Expression.Binary.Logical<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
		export interface Shift<G extends GrammarMap, K extends Under<'expression.binary.shift'> = 'expression.binary.shift'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $path: K;
		}
		export namespace Shift {
			export interface Left<G extends GrammarMap, K extends Under<'expression.binary.shift.left'> = 'expression.binary.shift.left'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
			export interface Right<G extends GrammarMap, K extends Under<'expression.binary.shift.right'> = 'expression.binary.shift.right'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
	}
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly arguments?: Slot<
			G,
			K,
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
			K,
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
			K,
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
		export interface Member<G extends GrammarMap, K extends Under<'expression.call.member'> = 'expression.call.member'> extends SubKindOf<V.Expression.Call<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly arguments:
				Slot<
				G,
				K,
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
				K,
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
				K,
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
	}
	export interface Collection<G extends GrammarMap, K extends Under<'expression.collection'> = 'expression.collection'> extends SubKindOf<V.Expression<G, K>> {
		readonly $path: K;
	}
	export namespace Collection {
		export interface List<G extends GrammarMap, K extends Under<'expression.collection.list'> = 'expression.collection.list'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly elements?: Slot<
				G,
				K,
				'elements',
				| V.Declaration.Module<G>
				| V.Element.Attributed<G>
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
	}
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly body: Slot<
			G,
			K,
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
			K,
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
			K,
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
	}
	export interface Member<G extends GrammarMap, K extends Under<'expression.member'> = 'expression.member'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly object: Slot<
			G,
			K,
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
			K,
			'property',
			| V.Identifier.Any<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Octal<G>
		>;
	}
	export interface Parenthesized<G extends GrammarMap, K extends Under<'expression.parenthesized'> = 'expression.parenthesized'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly expression: Slot<
			G,
			K,
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
	}
	export interface Subscript<G extends GrammarMap, K extends Under<'expression.subscript'> = 'expression.subscript'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly index?: Slot<
			G,
			K,
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
			K,
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
		readonly $path: K;
		readonly argument: Slot<
			G,
			K,
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
		export interface Negation<G extends GrammarMap, K extends Under<'expression.unary.negation'> = 'expression.unary.negation'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
		export interface Not<G extends GrammarMap, K extends Under<'expression.unary.not'> = 'expression.unary.not'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
	}
}
