// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Expression<G extends GrammarContext> {
	readonly alternative?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // pt only
	readonly argument?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // prt only
	readonly arguments?:
		| (G['expression'] | G['element'] | G['argument'])[]
		| (G['expression'] | G['element'])[]
		| V.Element.Macro.TokenTree.Delimited<G>
		| V.Expression.Comprehension.Generator<G>
		| V.Literal.Template<G>; // prt only
	readonly asyncMarker?: boolean; // rt only
	readonly attributes?: G['attribute'][]; // r only
	readonly binaryExpressionIn?: V.Unmapped<'typescript:binary_expression_in'>; // t only   // unmapped: <typescript:binary_expression_in>
	readonly body?:
		| G['element'][]
		| G['declaration'][]
		| V.Declaration.Module<G>
		| V.Element.Pair<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| V.Statement.Block<G>; // prt only
	readonly collectionElements?: V.Unmapped<'python:collection_elements'>; // p only   // unmapped: <python:collection_elements>
	readonly comparators?: V.Unmapped<'python:comparison_operator_comparator'>[]; // p only   // unmapped: <python:comparison_operator_comparator>
	readonly comprehensionClauses?: V.Clause.Comprehension<G>; // p only
	readonly condition?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // pt only
	readonly consequence?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // pt only
	readonly content?:
		| V.Unmapped<'python:yield_from_clause'>
		| V.Unmapped<'rust:array_expression_list'>
		| V.Unmapped<'rust:array_expression_semi'>
		| V.Unmapped<'rust:closure_expression_block'>
		| V.Unmapped<'rust:closure_expression_expr'>
		| V.Unmapped<'rust:range_expression_binary'>
		| V.Unmapped<'rust:range_expression_postfix'>
		| V.Unmapped<'rust:range_expression_prefix'>
		| V.Unmapped<'rust:reference_expression_raw_mut'>
		| V.Unmapped<'typescript:arrow_function_parameter'>
		| V.Unmapped<'typescript:parenthesized_expression_typed'>
		| V.Unmapped<'typescript:update_expression_postfix'>
		| V.Unmapped<'typescript:update_expression_prefix'>
		| V.Attribute.Content.Call<G>
		| V.Attribute.Content.Member<G>
		| V.Declaration.Signature.Call<G>
		| V.Element.Splat<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| 'import.meta'
		| 'new.target'; // prt only   // unmapped: <python:yield_from_clause> <rust:array_expression_list> <rust:array_expression_semi> <rust:closure_expression_block> <rust:closure_expression_expr> <rust:range_expression_binary> <rust:range_expression_postfix> <rust:range_expression_prefix> <rust:reference_expression_raw_mut> <typescript:arrow_function_parameter> <typescript:parenthesized_expression_typed> <typescript:update_expression_postfix> <typescript:update_expression_prefix> literal:MutableSpecifier literal:RangeExpressionBare literal:ReferenceExpressionRawConst
	readonly decorator?: G['attribute'][]; // t only
	readonly elements?: (
		| V.Declaration.Module<G>
		| V.Element.Splat<G>
		| G['expression']
		| G['identifier']
		| G['literal']
	)[]; // t only
	readonly entries?: V.Unmapped<'python:dictionary_elements'>; // p only   // unmapped: <python:dictionary_elements>
	readonly eqMarker?: boolean; // p only
	readonly expression?:
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| V.Pattern.Tuple.Bare<G>
		| G['statement']
		| (
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Tuple.Bare<G>
				| G['statement']
		  )[]; // prt only
	readonly formatSpecifier?: V.Expression.Interpolation.Format<G>; // p only
	readonly function?:
		| V.Unmapped<'rust:literal'>
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['statement']; // prt only   // unmapped: <rust:literal> literal:Import literal:Self literal:UnitExpression
	readonly heritage?: (G['type'] | G['expression'])[]; // t only
	readonly index?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // rt only
	readonly left?:
		| V.Unmapped<'python:pattern'>
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| G['statement']; // prt only   // unmapped: <python:pattern>
	readonly moveMarker?: boolean; // r only
	readonly name?: G['identifier'] | V.Type.Generic.Turbofish<G> | V.Type.Scoped.Expression<G>; // rt only
	readonly object?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // prt only   // unmapped: literal:Import
	readonly operand?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	readonly operator?:
		| '!'
		| '!='
		| '!=='
		| '%'
		| '%='
		| '&'
		| '&&'
		| '&&='
		| '&='
		| '*'
		| '**'
		| '**='
		| '*='
		| '+'
		| '++'
		| '+='
		| '-'
		| '--'
		| '-='
		| '/'
		| '//'
		| '//='
		| '/='
		| '<'
		| '<<'
		| '<<='
		| '<='
		| '=='
		| '==='
		| '>'
		| '>='
		| '>>'
		| '>>='
		| '>>>'
		| '>>>='
		| '??'
		| '??='
		| '@'
		| '@='
		| '^'
		| '^='
		| 'and'
		| 'delete'
		| 'in'
		| 'instanceof'
		| 'or'
		| 'typeof'
		| 'void'
		| '|'
		| '|='
		| '||'
		| '||='
		| '~'; // prt only
	readonly operators: 'is' | 'is not' | 'not in'; // p only
	readonly optionalChain?: boolean; // t only
	readonly parameters?: V.Declaration.Parameter<G>[]; // prt only
	readonly properties?: (
		| V.Declaration.Method<G>
		| V.Element.Pair<G>
		| V.Element.Splat<G>
		| V.Identifier.Property.Shorthand<G>
		| V.Literal.Null.Undefined<G>
	)[]; // t only
	readonly property?: G['identifier'] | V.Literal.Number.Integer<G>; // prt only
	readonly returnType?: G['clause']; // t only
	readonly right?:
		| V.Declaration.Module<G>
		| V.Declaration.Variable<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| V.Pattern.Tuple.Bare<G>
		| G['statement']; // prt only
	readonly start?: G['expression'] | G['identifier'] | G['literal']; // p only
	readonly staticMarker?: boolean; // r only
	readonly step?: V.Unmapped<'python:slice_group'>; // p only   // unmapped: <python:slice_group>
	readonly stop?: G['expression'] | G['identifier'] | G['literal']; // p only
	readonly subscripts?: V.Unmapped<'python:subscripts'>; // p only   // unmapped: <python:subscripts>
	readonly tail?: V.Unmapped<'python:expression_list_expressions'>; // p only   // unmapped: <python:expression_list_expressions> literal:Comma
	readonly tupleExpressionElements?: V.Unmapped<'rust:tuple_expression_elements'>; // r only   // unmapped: <rust:tuple_expression_elements>
	readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
	readonly typeAnnotation?: G['identifier'] | G['type']; // t only
	readonly typeArguments?: G['type'][]; // rt only
	readonly typeConversion?: V.Expression.Interpolation.Conversion<G>; // p only
	readonly typeParameters?: V.Declaration.Parameter.Type<G>[]; // t only
	readonly usingMarker?: boolean; // t only
	readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
}
export namespace Expression {
	export interface Assignment<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly left:
			| V.Unmapped<'python:pattern'>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement']; // unmapped: <python:pattern>
		readonly operator?:
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
			| V.Declaration.Module<G>
			| V.Declaration.Variable<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| V.Pattern.Tuple.Bare<G>
			| G['statement'];
		readonly usingMarker?: boolean; // t only
	}
	export namespace Assignment {
		export interface Compound<G extends GrammarContext> extends V.Expression.Assignment<G> {
			// claimed by prt
			readonly left:
				| V.Unmapped<'python:pattern'>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Tuple.Bare<G>
				| G['statement']; // unmapped: <python:pattern>
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
				| V.Declaration.Module<G>
				| V.Declaration.Variable<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Tuple.Bare<G>
				| G['statement'];
		}
		export namespace Compound {
			export interface Add<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '+=';
			}
			export interface And<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '&&=';
			}
			export interface BitwiseAnd<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '&=';
			}
			export interface BitwiseOr<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '|=';
			}
			export interface BitwiseXor<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '^=';
			}
			export interface Divide<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '/=';
			}
			export interface Exponent<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '**=';
			}
			export interface FloorDivide<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '//=';
			}
			export interface Matmul<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '@=';
			}
			export interface Modulo<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '%=';
			}
			export interface Multiply<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '*=';
			}
			export interface Nullish<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '??=';
			}
			export interface Or<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '||=';
			}
			export interface ShiftLeft<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '<<=';
			}
			export interface ShiftRight<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '>>=';
			}
			export interface ShiftRightUnsigned<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '>>>=';
			}
			export interface Subtract<G extends GrammarContext> extends V.Expression.Assignment.Compound<G> {
				readonly operator: '-=';
			}
			export type Kinds<G extends GrammarContext> =
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
		readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export interface Binary<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly binaryExpressionIn?: V.Unmapped<'typescript:binary_expression_in'>; // t only   // unmapped: <typescript:binary_expression_in>
		readonly comparators?: V.Unmapped<'python:comparison_operator_comparator'>[]; // p only   // unmapped: <python:comparison_operator_comparator>
		readonly left?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
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
		readonly operators: 'is' | 'is not' | 'not in'; // p only
		readonly right?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export namespace Binary {
		export interface Arithmetic<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly operator: '%' | '*' | '**' | '+' | '-' | '/' | '//'; // prt only
		}
		export namespace Arithmetic {
			export interface Add<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '+';
			}
			export interface Divide<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '/';
			}
			export interface Exponent<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '**';
			}
			export interface FloorDivide<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '//';
			}
			export interface Modulo<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '%';
			}
			export interface Multiply<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '*';
			}
			export interface Subtract<G extends GrammarContext> extends V.Expression.Binary<G> {
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
			readonly operator: '&' | '^' | '|'; // prt only
		}
		export namespace Bitwise {
			export interface And<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '&';
			}
			export interface Or<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '|';
			}
			export interface Xor<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '^';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Bitwise.And<G>
				| V.Expression.Binary.Bitwise.Or<G>
				| V.Expression.Binary.Bitwise.Xor<G>;
		}
		export interface Comparison<G extends GrammarContext> extends V.Expression.Binary<G> {
			// claimed by p
			readonly comparators: V.Unmapped<'python:comparison_operator_comparator'>[]; // unmapped: <python:comparison_operator_comparator>
			readonly left: G['expression'] | G['identifier'] | G['literal'];
			readonly operator: '!=' | '!==' | '<' | '<=' | '==' | '===' | '>' | '>='; // prt only
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '==';
			}
			export interface Greater<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '>';
			}
			export interface GreaterEqual<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '>=';
			}
			export interface Less<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '<';
			}
			export interface LessEqual<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '<=';
			}
			export interface NotEqual<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '!=';
			}
			export interface StrictEqual<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '===';
			}
			export interface StrictNotEqual<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '!==';
			}
			export type Kinds<G extends GrammarContext> =
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
			readonly operators: 'is' | 'is not'; // p only
		}
		export namespace Identity {
			export interface Is<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly operators: 'is';
			}
			export interface IsNot<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly operators: 'is not';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Identity.Is<G>
				| V.Expression.Binary.Identity.IsNot<G>;
		}
		export interface Logical<G extends GrammarContext> extends V.Expression.Binary<G> {
			// claimed by p
			readonly left: G['expression'] | G['identifier'] | G['literal'];
			readonly operator: '&&' | 'and' | 'or' | '||'; // prt only
			readonly right: G['expression'] | G['identifier'] | G['literal'];
		}
		export namespace Logical {
			export interface And<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '&&';
			}
			export interface Or<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '||';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Logical.And<G>
				| V.Expression.Binary.Logical.Or<G>;
		}
		export interface Matmul<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly operator: '@';
		}
		export interface Membership<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly operator: 'in' | 'instanceof'; // pt only
			readonly operators: 'not in'; // p only
		}
		export namespace Membership {
			export interface In<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: 'in';
			}
			export interface Instanceof<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: 'instanceof';
			}
			export interface NotIn<G extends GrammarContext> extends V.Expression.Binary.Comparison<G> {
				readonly operators: 'not in';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Membership.In<G>
				| V.Expression.Binary.Membership.Instanceof<G>
				| V.Expression.Binary.Membership.NotIn<G>;
		}
		export interface Nullish<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly operator: '??';
		}
		export interface Shift<G extends GrammarContext> extends V.Expression.Binary<G> {
			readonly operator: '<<' | '>>' | '>>>'; // prt only
		}
		export namespace Shift {
			export interface Left<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '<<';
			}
			export interface Right<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '>>';
			}
			export interface RightUnsigned<G extends GrammarContext> extends V.Expression.Binary<G> {
				readonly operator: '>>>';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Binary.Shift.Left<G>
				| V.Expression.Binary.Shift.Right<G>
				| V.Expression.Binary.Shift.RightUnsigned<G>;
		}
		export type Kinds<G extends GrammarContext> =
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
		readonly body?: V.Statement.Block<G>; // r only
		readonly moveMarker?: boolean; // r only
	}
	export namespace Block {
		export interface Async<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly body: V.Statement.Block<G>;
			readonly moveMarker?: boolean;
		}
		export interface Const<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly body: V.Statement.Block<G>;
		}
		export interface Gen<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly body: V.Statement.Block<G>;
			readonly moveMarker?: boolean;
		}
		export interface Try<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
			readonly body: V.Statement.Block<G>;
		}
		export interface Unsafe<G extends GrammarContext> extends V.Expression.Block<G> {
			// claimed by r
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
		readonly arguments?:
			| (G['expression'] | G['element'] | G['argument'])[]
			| (G['expression'] | G['element'])[]
			| V.Element.Macro.TokenTree.Delimited<G>
			| V.Expression.Comprehension.Generator<G>
			| V.Literal.Template<G>;
		readonly function?:
			| V.Unmapped<'rust:literal'>
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['statement']; // unmapped: <rust:literal> literal:Import literal:Self literal:UnitExpression
		readonly typeArguments?: G['type'][]; // t only
	}
	export namespace Call {
		export interface Import<G extends GrammarContext> extends V.Expression.Call<G> {} // claimed by t
		export interface Macro<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by r
			readonly arguments: V.Element.Macro.TokenTree.Delimited<G>;
			readonly function: G['identifier'];
		}
		export interface Member<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by prt
			readonly arguments:
				| (G['expression'] | G['element'] | G['argument'])[]
				| (G['expression'] | G['element'])[]
				| V.Expression.Comprehension.Generator<G>;
			readonly function: V.Unmapped<'rust:literal'> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // unmapped: <rust:literal> literal:Self literal:UnitExpression
			readonly typeArguments?: G['type'][]; // t only
		}
		export interface New<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by t
			readonly arguments?: (G['expression'] | G['element'])[];
			readonly function: G['expression'] | G['identifier'] | G['literal'];
			readonly typeArguments?: G['type'][];
		}
		export interface Path<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by r
			readonly arguments: (G['expression'] | G['element'])[];
			readonly function: V.Unmapped<'rust:literal'> | G['expression'] | G['identifier'] | G['statement']; // unmapped: <rust:literal> literal:Self literal:UnitExpression
		}
		export interface Template<G extends GrammarContext> extends V.Expression.Call<G> {
			// claimed by t
			readonly arguments: V.Literal.Template<G>;
			readonly function: G['expression'] | G['identifier'] | G['literal'];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Call.Import<G>
			| V.Expression.Call.Macro<G>
			| V.Expression.Call.Member<G>
			| V.Expression.Call.New<G>
			| V.Expression.Call.Path<G>
			| V.Expression.Call.Template<G>;
	}
	export interface Cast<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly typeAnnotation?: G['identifier'] | G['type']; // t only
		readonly typeArguments?: G['type'][]; // t only
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export namespace Cast {
		export interface As<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly typeAnnotation: G['identifier'] | G['type'];
		}
		export interface Assertion<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly typeArguments: G['type'][];
		}
		export interface NonNull<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		}
		export interface Satisfies<G extends GrammarContext> extends V.Expression.Cast<G> {
			// claimed by t
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
		readonly body: G['declaration'][];
		readonly decorator?: G['attribute'][];
		readonly heritage?: (G['type'] | G['expression'])[];
		readonly name?: G['identifier'];
		readonly typeParameters?: V.Declaration.Parameter.Type<G>[];
	}
	export interface Collection<G extends GrammarContext> extends V.Expression<G> {
		readonly attributes?: G['attribute'][]; // r only
		readonly body?: G['element'][]; // r only
		readonly collectionElements?: V.Unmapped<'python:collection_elements'>; // p only   // unmapped: <python:collection_elements>
		readonly content?: V.Unmapped<'rust:array_expression_list'> | V.Unmapped<'rust:array_expression_semi'>; // r only   // unmapped: <rust:array_expression_list> <rust:array_expression_semi>
		readonly elements?: (
			| V.Declaration.Module<G>
			| V.Element.Splat<G>
			| G['expression']
			| G['identifier']
			| G['literal']
		)[]; // t only
		readonly entries?: V.Unmapped<'python:dictionary_elements'>; // p only   // unmapped: <python:dictionary_elements>
		readonly expression?: G['expression'] | G['identifier'] | G['literal']; // p only
		readonly name?: G['identifier'] | V.Type.Generic.Turbofish<G> | V.Type.Scoped.Expression<G>; // r only
		readonly properties?: (
			| V.Declaration.Method<G>
			| V.Element.Pair<G>
			| V.Element.Splat<G>
			| V.Identifier.Property.Shorthand<G>
			| V.Literal.Null.Undefined<G>
		)[]; // t only
		readonly tail?: V.Unmapped<'python:expression_list_expressions'>; // p only   // unmapped: <python:expression_list_expressions> literal:Comma
		readonly tupleExpressionElements?: V.Unmapped<'rust:tuple_expression_elements'>; // r only   // unmapped: <rust:tuple_expression_elements>
	}
	export namespace Collection {
		export interface Array<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by rt
			readonly content: V.Unmapped<'rust:array_expression_list'> | V.Unmapped<'rust:array_expression_semi'>; // r only   // unmapped: <rust:array_expression_list> <rust:array_expression_semi>
			readonly elements?: (
				| V.Declaration.Module<G>
				| V.Element.Splat<G>
				| G['expression']
				| G['identifier']
				| G['literal']
			)[]; // t only
		}
		export interface Dictionary<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by p
			readonly entries?: V.Unmapped<'python:dictionary_elements'>; // unmapped: <python:dictionary_elements>
		}
		export interface List<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by p
			readonly collectionElements?: V.Unmapped<'python:collection_elements'>; // unmapped: <python:collection_elements>
		}
		export interface Object<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by t
			readonly properties?: (
				| V.Declaration.Method<G>
				| V.Element.Pair<G>
				| V.Element.Splat<G>
				| V.Identifier.Property.Shorthand<G>
				| V.Literal.Null.Undefined<G>
			)[];
		}
		export interface Set<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by p
			readonly collectionElements: V.Unmapped<'python:collection_elements'>; // unmapped: <python:collection_elements>
		}
		export interface Struct<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by r
			readonly body: G['element'][];
			readonly name: G['identifier'] | V.Type.Generic.Turbofish<G> | V.Type.Scoped.Expression<G>;
		}
		export interface Tuple<G extends GrammarContext> extends V.Expression.Collection<G> {
			// claimed by pr
			readonly attributes?: G['attribute'][]; // r only
			readonly collectionElements?: V.Unmapped<'python:collection_elements'>; // p only   // unmapped: <python:collection_elements>
			readonly expression?: G['expression'] | G['identifier'] | G['literal']; // p only
			readonly tail?: V.Unmapped<'python:expression_list_expressions'>; // p only   // unmapped: <python:expression_list_expressions> literal:Comma
			readonly tupleExpressionElements?: V.Unmapped<'rust:tuple_expression_elements'>; // r only   // unmapped: <rust:tuple_expression_elements>
		}
		export namespace Tuple {
			export interface Bare<G extends GrammarContext> extends V.Expression.Collection.Tuple<G> {
				// claimed by p
				readonly expression: G['expression'] | G['identifier'] | G['literal'];
				readonly tail: V.Unmapped<'python:expression_list_expressions'>; // unmapped: <python:expression_list_expressions> literal:Comma
			}
			export type Kinds<G extends GrammarContext> = V.Expression.Collection.Tuple.Bare<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Collection.Array<G>
			| V.Expression.Collection.Dictionary<G>
			| V.Expression.Collection.List<G>
			| V.Expression.Collection.Object<G>
			| V.Expression.Collection.Set<G>
			| V.Expression.Collection.Struct<G>
			| V.Expression.Collection.Tuple.Bare<G>;
	}
	export interface Comprehension<G extends GrammarContext> extends V.Expression<G> {
		readonly body?: V.Element.Pair<G> | G['expression'] | G['identifier'] | G['literal']; // p only
		readonly comprehensionClauses?: V.Clause.Comprehension<G>; // p only
	}
	export namespace Comprehension {
		export interface Dictionary<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly body: V.Element.Pair<G>;
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Generator<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly body: G['expression'] | G['identifier'] | G['literal'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface List<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly body: G['expression'] | G['identifier'] | G['literal'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Set<G extends GrammarContext> extends V.Expression.Comprehension<G> {
			// claimed by p
			readonly body: G['expression'] | G['identifier'] | G['literal'];
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
		readonly alternative: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		readonly condition: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		readonly consequence: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
	}
	export interface Function<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly asyncMarker?: boolean;
		readonly body: V.Statement.Block<G>;
		readonly name?: G['identifier'];
		readonly parameters: V.Declaration.Parameter<G>[];
		readonly returnType?: G['clause'];
		readonly typeParameters?: V.Declaration.Parameter.Type<G>[];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> extends V.Expression.Function<G> {
			// claimed by t
			readonly asyncMarker?: boolean;
			readonly body: V.Statement.Block<G>;
			readonly name?: G['identifier'];
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?: G['clause'];
			readonly typeParameters?: V.Declaration.Parameter.Type<G>[];
		}
		export type Kinds<G extends GrammarContext> = V.Expression.Function.Generator<G>;
	}
	export interface Generic<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly function: V.Expression.Member<G> | G['identifier'];
		readonly typeArguments: G['type'][];
	}
	export interface Instantiation<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		readonly typeArguments: G['type'][];
	}
	export interface Interpolation<G extends GrammarContext> extends V.Expression<G> {
		// claimed by pt
		readonly eqMarker?: boolean; // p only
		readonly expression?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| V.Pattern.Tuple.Bare<G>;
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>; // p only
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>; // p only
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarContext> extends V.Expression.Interpolation<G> {} // claimed by p
		export interface Format<G extends GrammarContext> extends V.Expression.Interpolation<G> {} // claimed by p
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Interpolation.Conversion<G>
			| V.Expression.Interpolation.Format<G>;
	}
	export interface Jsx<G extends GrammarContext> extends V.Expression<G> {}
	export namespace Jsx {
		export interface Element<G extends GrammarContext> extends V.Expression.Jsx<G> {} // claimed by t
		export namespace Element {
			export interface Closing<G extends GrammarContext> extends V.Expression.Jsx.Element<G> {} // claimed by t
			export interface Opening<G extends GrammarContext> extends V.Expression.Jsx.Element<G> {} // claimed by t
			export interface SelfClosing<G extends GrammarContext> extends V.Expression.Jsx.Element<G> {} // claimed by t
			export type Kinds<G extends GrammarContext> =
				| V.Expression.Jsx.Element.Closing<G>
				| V.Expression.Jsx.Element.Opening<G>
				| V.Expression.Jsx.Element.SelfClosing<G>;
		}
		export interface Expression<G extends GrammarContext> extends V.Expression.Jsx<G> {} // claimed by t
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Jsx.Element.Closing<G>
			| V.Expression.Jsx.Element.Opening<G>
			| V.Expression.Jsx.Element.SelfClosing<G>
			| V.Expression.Jsx.Expression<G>;
	}
	export interface Lambda<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly asyncMarker?: boolean; // rt only
		readonly body: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | V.Statement.Block<G>; // pt only
		readonly content:
			| V.Unmapped<'rust:closure_expression_block'>
			| V.Unmapped<'rust:closure_expression_expr'>
			| V.Unmapped<'typescript:arrow_function_parameter'>
			| V.Declaration.Signature.Call<G>; // rt only   // unmapped: <rust:closure_expression_block> <rust:closure_expression_expr> <typescript:arrow_function_parameter>
		readonly moveMarker?: boolean; // r only
		readonly parameters?: V.Declaration.Parameter<G>[]; // pr only
		readonly staticMarker?: boolean; // r only
	}
	export interface Member<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly object: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // unmapped: literal:Import
		readonly property: G['identifier'] | V.Literal.Number.Integer<G>;
	}
	export interface Meta<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly content: 'import.meta' | 'new.target';
	}
	export interface Parenthesized<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly content:
			| V.Unmapped<'typescript:parenthesized_expression_typed'>
			| V.Attribute.Content.Call<G>
			| V.Attribute.Content.Member<G>
			| V.Element.Splat<G>
			| G['expression']
			| G['identifier']
			| G['literal']; // pt only   // unmapped: <typescript:parenthesized_expression_typed>
		readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	}
	export interface Range<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly content:
			| V.Unmapped<'rust:range_expression_binary'>
			| V.Unmapped<'rust:range_expression_postfix'>
			| V.Unmapped<'rust:range_expression_prefix'>; // unmapped: <rust:range_expression_binary> <rust:range_expression_postfix> <rust:range_expression_prefix> literal:RangeExpressionBare
	}
	export interface Reference<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly argument: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		readonly content?: V.Unmapped<'rust:reference_expression_raw_mut'>; // unmapped: <rust:reference_expression_raw_mut> literal:MutableSpecifier literal:ReferenceExpressionRawConst
	}
	export interface Sequence<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly expression: (V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'])[];
	}
	export interface Slice<G extends GrammarContext> extends V.Expression<G> {
		// claimed by p
		readonly start?: G['expression'] | G['identifier'] | G['literal'];
		readonly step?: V.Unmapped<'python:slice_group'>; // unmapped: <python:slice_group>
		readonly stop?: G['expression'] | G['identifier'] | G['literal'];
	}
	export interface Subscript<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly index: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // rt only
		readonly object: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		readonly optionalChain?: boolean; // t only
		readonly subscripts: V.Unmapped<'python:subscripts'>; // p only   // unmapped: <python:subscripts>
	}
	export interface Try<G extends GrammarContext> extends V.Expression<G> {
		// claimed by r
		readonly value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export interface Unary<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly argument?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // pt only
		readonly operand: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly operator: '!' | '*' | '+' | '-' | 'delete' | 'typeof' | 'void' | '~';
	}
	export namespace Unary {
		export interface BitwiseNot<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: '~';
		}
		export interface Delete<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: 'delete';
		}
		export interface Deref<G extends GrammarContext> extends V.Expression.Unary<G> {
			// claimed by r
			readonly operand: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly operator: '!' | '*' | '-';
		}
		export interface Negation<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: '-';
		}
		export interface Not<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: '!';
		}
		export interface Plus<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: '+';
		}
		export interface Typeof<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: 'typeof';
		}
		export interface Void<G extends GrammarContext> extends V.Expression.Unary<G> {
			readonly operator: 'void';
		}
		export type Kinds<G extends GrammarContext> =
			| V.Expression.Unary.BitwiseNot<G>
			| V.Expression.Unary.Delete<G>
			| V.Expression.Unary.Deref<G>
			| V.Expression.Unary.Negation<G>
			| V.Expression.Unary.Not<G>
			| V.Expression.Unary.Plus<G>
			| V.Expression.Unary.Typeof<G>
			| V.Expression.Unary.Void<G>;
	}
	export interface Unit<G extends GrammarContext> extends V.Expression<G> {} // claimed by r
	export interface Update<G extends GrammarContext> extends V.Expression<G> {
		// claimed by t
		readonly content:
			| V.Unmapped<'typescript:update_expression_postfix'>
			| V.Unmapped<'typescript:update_expression_prefix'>; // unmapped: <typescript:update_expression_postfix> <typescript:update_expression_prefix>
		readonly operator: '++' | '--';
	}
	export namespace Update {
		export interface Decrement<G extends GrammarContext> extends V.Expression.Update<G> {
			readonly operator: '--';
		}
		export interface Increment<G extends GrammarContext> extends V.Expression.Update<G> {
			readonly operator: '++';
		}
		export type Kinds<G extends GrammarContext> = V.Expression.Update.Decrement<G> | V.Expression.Update.Increment<G>;
	}
	export interface Yield<G extends GrammarContext> extends V.Expression<G> {
		// claimed by prt
		readonly content?: V.Unmapped<'python:yield_from_clause'> | G['expression'] | G['identifier'] | G['literal']; // p only   // unmapped: <python:yield_from_clause>
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // rt only
	}
	export type Kinds<G extends GrammarContext> =
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
		| V.Expression.Collection.Array<G>
		| V.Expression.Collection.Dictionary<G>
		| V.Expression.Collection.List<G>
		| V.Expression.Collection.Object<G>
		| V.Expression.Collection.Set<G>
		| V.Expression.Collection.Struct<G>
		| V.Expression.Collection.Tuple.Bare<G>
		| V.Expression.Comprehension.Dictionary<G>
		| V.Expression.Comprehension.Generator<G>
		| V.Expression.Comprehension.List<G>
		| V.Expression.Comprehension.Set<G>
		| V.Expression.Conditional<G>
		| V.Expression.Function.Generator<G>
		| V.Expression.Generic<G>
		| V.Expression.Instantiation<G>
		| V.Expression.Interpolation.Conversion<G>
		| V.Expression.Interpolation.Format<G>
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
		| V.Expression.Unary.BitwiseNot<G>
		| V.Expression.Unary.Delete<G>
		| V.Expression.Unary.Deref<G>
		| V.Expression.Unary.Negation<G>
		| V.Expression.Unary.Not<G>
		| V.Expression.Unary.Plus<G>
		| V.Expression.Unary.Typeof<G>
		| V.Expression.Unary.Void<G>
		| V.Expression.Unit<G>
		| V.Expression.Update.Decrement<G>
		| V.Expression.Update.Increment<G>
		| V.Expression.Yield<G>;
}
