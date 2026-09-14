// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Pattern<G extends GrammarContext> {
	readonly alias?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
	readonly arguments?: V.Unmapped<'python:list_pattern_case_patterns'>; // p only   // unmapped: <python:list_pattern_case_patterns>
	readonly casePattern?: V.Pattern.Case<G>; // p only
	readonly condition?: G['expression'] | G['identifier'] | G['literal'] | V.Clause.Let.Kinds<G> | G['statement']; // r only
	readonly content?:
		| V.Unmapped<'python:simple_pattern_negative'>
		| V.Unmapped<'rust:field_pattern_named'>
		| V.Unmapped<'rust:or_pattern_binary'>
		| V.Unmapped<'rust:or_pattern_prefix'>
		| V.Unmapped<'rust:range_pattern_prefix'>
		| V.Unmapped<'rust:range_pattern_with_left'>
		| G['expression']
		| G['identifier']
		| G['literal']
		| V.Pattern.Case.Kinds<G>; // pr only   // unmapped: <python:simple_pattern_negative> <rust:field_pattern_named> <rust:or_pattern_binary> <rust:or_pattern_prefix> <rust:range_pattern_prefix> <rust:range_pattern_with_left> literal:WildcardPattern
	readonly default?: V.Unmapped<'typescript:pattern'> | V.Pattern.Assignment<G>; // t only   // unmapped: <typescript:pattern>
	readonly dictPatternElements?: V.Unmapped<'python:dict_pattern_elements'>; // p only   // unmapped: <python:dict_pattern_elements>
	readonly elements?:
		| V.Unmapped<'rust:tuple_pattern_elements'>
		| V.Unmapped<'typescript:pattern'>
		| V.Literal.Null.Undefined<G>
		| V.Pattern.Assignment<G>
		| (
				| V.Unmapped<'rust:tuple_pattern_elements'>
				| V.Unmapped<'typescript:pattern'>
				| V.Literal.Null.Undefined<G>
				| V.Pattern.Assignment<G>
		  )[]; // rt only   // unmapped: <rust:tuple_pattern_elements> <typescript:pattern>
	readonly expression?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
	readonly fields?: V.Unmapped<'rust:struct_pattern_elements'>; // r only   // unmapped: <rust:struct_pattern_elements>
	readonly identifier?: G['identifier']; // p only
	readonly imaginary?: V.Literal.Number.Kinds<G>; // p only
	readonly key?: V.Unmapped<'typescript:__property_identifier'> | G['literal'] | V.Identifier.Property.Kinds<G>; // t only   // unmapped: <typescript:__property_identifier>
	readonly left?:
		| V.Unmapped<'typescript:pattern'>
		| V.Unmapped<'typescript:shorthand_property_identifier_pattern'>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']; // prt only   // unmapped: <typescript:pattern> <typescript:shorthand_property_identifier_pattern> literal:Underscore
	readonly lhsExpression?: G['expression'] | G['identifier'] | V.Literal.Null.Undefined<G> | G['pattern']; // t only
	readonly listPatternCasePatterns?: V.Unmapped<'python:list_pattern_case_patterns'>; // p only   // unmapped: <python:list_pattern_case_patterns>
	readonly mutableSpecifier?: boolean; // r only
	readonly name?: G['identifier']; // r only
	readonly object?:
		| V.Unmapped<'python:simple_pattern_negative'>
		| V.Identifier.Dotted<G>
		| G['literal']
		| V.Pattern.Case.Kinds<G>; // p only   // unmapped: <python:simple_pattern_negative> literal:WildcardPattern
	readonly operator?: '*' | '**' | '+' | '-'; // p only
	readonly pattern?: V.Unmapped<'python:pattern'>; // p only   // unmapped: <python:pattern>
	readonly patterns?: V.Unmapped<'python:patterns'> | V.Unmapped<'rust:patterns'>; // pr only   // unmapped: <python:patterns> <rust:patterns>
	readonly real?: boolean; // p only
	readonly refMarker?: boolean; // r only
	readonly right?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
	readonly tail?: V.Unmapped<'python:pattern_list_patterns'>; // p only   // unmapped: <python:pattern_list_patterns> literal:Comma
	readonly typeArguments?: G['type'][]; // r only
	readonly value?: G['identifier'] | G['type']; // r only
}
export namespace Pattern {
	export interface Array<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by t
		readonly elements?: (V.Unmapped<'typescript:pattern'> | V.Literal.Null.Undefined<G> | V.Pattern.Assignment<G>)[]; // unmapped: <typescript:pattern>
	}
	export interface As<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by p
		readonly alias: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Assignment<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by t
		readonly left: V.Unmapped<'typescript:pattern'>; // unmapped: <typescript:pattern>
		readonly right: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
	}
	export interface Captured<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly left: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly name: G['identifier'];
	}
	export interface Case<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by p
		readonly arguments?: V.Unmapped<'python:list_pattern_case_patterns'>; // unmapped: <python:list_pattern_case_patterns>
		readonly casePattern?: V.Pattern.Case<G>;
		readonly content?:
			| V.Unmapped<'python:simple_pattern_negative'>
			| V.Identifier.Dotted<G>
			| G['literal']
			| V.Pattern.Case.Kinds<G>; // unmapped: <python:simple_pattern_negative> literal:WildcardPattern
		readonly dictPatternElements?: V.Unmapped<'python:dict_pattern_elements'>; // unmapped: <python:dict_pattern_elements>
		readonly identifier?: G['identifier'];
		readonly imaginary?: V.Literal.Number.Kinds<G>;
		readonly left?: G['identifier']; // unmapped: literal:Underscore
		readonly listPatternCasePatterns?: V.Unmapped<'python:list_pattern_case_patterns'>; // unmapped: <python:list_pattern_case_patterns>
		readonly object?:
			| V.Unmapped<'python:simple_pattern_negative'>
			| V.Identifier.Dotted<G>
			| G['literal']
			| V.Pattern.Case.Kinds<G>; // unmapped: <python:simple_pattern_negative> literal:WildcardPattern
		readonly operator?: '*' | '**' | '+' | '-';
		readonly real?: boolean;
	}
	export namespace Case {
		export interface As<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly casePattern: V.Pattern.Case<G>;
			readonly identifier: G['identifier'];
		}
		export interface Class<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly arguments?: V.Unmapped<'python:list_pattern_case_patterns'>; // unmapped: <python:list_pattern_case_patterns>
			readonly left: V.Identifier.Dotted<G>;
		}
		export interface Complex<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly content: V.Literal.Number.Kinds<G>;
			readonly imaginary: V.Literal.Number.Kinds<G>;
			readonly operator: '+' | '-';
			readonly real?: boolean;
		}
		export interface Dictionary<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly dictPatternElements?: V.Unmapped<'python:dict_pattern_elements'>; // unmapped: <python:dict_pattern_elements>
		}
		export interface Keyword<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly left: G['identifier'];
			readonly object:
				| V.Unmapped<'python:simple_pattern_negative'>
				| V.Identifier.Dotted<G>
				| G['literal']
				| V.Pattern.Case.Kinds<G>; // unmapped: <python:simple_pattern_negative> literal:WildcardPattern
		}
		export interface List<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly listPatternCasePatterns?: V.Unmapped<'python:list_pattern_case_patterns'>; // unmapped: <python:list_pattern_case_patterns>
		}
		export interface Or<G extends GrammarContext> extends V.Pattern.Case<G> {} // claimed by p
		export interface Splat<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly left: G['identifier']; // unmapped: literal:Underscore
			readonly operator: '*' | '**';
		}
		export interface Tuple<G extends GrammarContext> extends V.Pattern.Case<G> {
			// claimed by p
			readonly listPatternCasePatterns?: V.Unmapped<'python:list_pattern_case_patterns'>; // unmapped: <python:list_pattern_case_patterns>
		}
		export type Kinds<G extends GrammarContext> =
			| V.Pattern.Case<G>
			| V.Pattern.Case.As<G>
			| V.Pattern.Case.Class<G>
			| V.Pattern.Case.Complex<G>
			| V.Pattern.Case.Dictionary<G>
			| V.Pattern.Case.Keyword<G>
			| V.Pattern.Case.List<G>
			| V.Pattern.Case.Or<G>
			| V.Pattern.Case.Splat<G>
			| V.Pattern.Case.Tuple<G>;
	}
	export interface Generic<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly content: G['identifier'];
		readonly typeArguments: G['type'][];
	}
	export interface List<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by p
		readonly patterns?: V.Unmapped<'python:patterns'>; // unmapped: <python:patterns>
	}
	export interface Match<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly condition?: G['expression'] | G['identifier'] | G['literal'] | V.Clause.Let.Kinds<G> | G['statement'];
		readonly left: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Mutable<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly left: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Object<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by t
		readonly default?: V.Unmapped<'typescript:pattern'> | V.Pattern.Assignment<G>; // unmapped: <typescript:pattern>
		readonly key?: V.Unmapped<'typescript:__property_identifier'> | G['literal'] | V.Identifier.Property.Kinds<G>; // unmapped: <typescript:__property_identifier>
		readonly left?: V.Unmapped<'typescript:shorthand_property_identifier_pattern'> | G['pattern']; // unmapped: <typescript:shorthand_property_identifier_pattern>
		readonly right?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarContext> extends V.Pattern.Object<G> {
			// claimed by t
			readonly left: V.Unmapped<'typescript:shorthand_property_identifier_pattern'> | G['pattern']; // unmapped: <typescript:shorthand_property_identifier_pattern>
			readonly right: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		}
		export interface Pair<G extends GrammarContext> extends V.Pattern.Object<G> {
			// claimed by t
			readonly default: V.Unmapped<'typescript:pattern'> | V.Pattern.Assignment<G>; // unmapped: <typescript:pattern>
			readonly key: V.Unmapped<'typescript:__property_identifier'> | G['literal'] | V.Identifier.Property.Kinds<G>; // unmapped: <typescript:__property_identifier>
		}
		export type Kinds<G extends GrammarContext> =
			| V.Pattern.Object<G>
			| V.Pattern.Object.Assignment<G>
			| V.Pattern.Object.Pair<G>;
	}
	export interface Or<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly content: V.Unmapped<'rust:or_pattern_binary'> | V.Unmapped<'rust:or_pattern_prefix'>; // unmapped: <rust:or_pattern_binary> <rust:or_pattern_prefix>
	}
	export interface Range<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly content: V.Unmapped<'rust:range_pattern_prefix'> | V.Unmapped<'rust:range_pattern_with_left'>; // unmapped: <rust:range_pattern_prefix> <rust:range_pattern_with_left>
	}
	export interface Reference<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly left: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly mutableSpecifier?: boolean;
	}
	export namespace Reference {
		export interface Value<G extends GrammarContext> extends V.Pattern.Reference<G> {
			// claimed by r
			readonly left: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly mutableSpecifier?: boolean;
		}
		export type Kinds<G extends GrammarContext> = V.Pattern.Reference<G> | V.Pattern.Reference.Value<G>;
	}
	export interface Rest<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by t
		readonly lhsExpression: G['expression'] | G['identifier'] | V.Literal.Null.Undefined<G> | G['pattern'];
	}
	export interface Slice<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly patterns?: V.Unmapped<'rust:patterns'>; // unmapped: <rust:patterns>
	}
	export interface Splat<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by p
		readonly content: G['expression'] | G['identifier'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext> extends V.Pattern.Splat<G> {
			// claimed by p
			readonly content: G['expression'] | G['identifier'];
		}
		export type Kinds<G extends GrammarContext> = V.Pattern.Splat<G> | V.Pattern.Splat.Dictionary<G>;
	}
	export interface Struct<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by r
		readonly content?: V.Unmapped<'rust:field_pattern_named'> | G['identifier']; // unmapped: <rust:field_pattern_named>
		readonly fields?: V.Unmapped<'rust:struct_pattern_elements'>; // unmapped: <rust:struct_pattern_elements>
		readonly mutableSpecifier?: boolean;
		readonly refMarker?: boolean;
		readonly value?: G['identifier'] | V.Type.Scoped<G>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarContext> extends V.Pattern.Struct<G> {
			// claimed by r
			readonly content: V.Unmapped<'rust:field_pattern_named'> | G['identifier']; // unmapped: <rust:field_pattern_named>
			readonly mutableSpecifier?: boolean;
			readonly refMarker?: boolean;
		}
		export interface Rest<G extends GrammarContext> extends V.Pattern.Struct<G> {} // claimed by r
		export type Kinds<G extends GrammarContext> =
			| V.Pattern.Struct<G>
			| V.Pattern.Struct.Field<G>
			| V.Pattern.Struct.Rest<G>;
	}
	export interface Tuple<G extends GrammarContext> extends V.Pattern<G> {
		// claimed by pr
		readonly elements?: V.Unmapped<'rust:tuple_pattern_elements'>; // r only   // unmapped: <rust:tuple_pattern_elements>
		readonly pattern?: V.Unmapped<'python:pattern'>; // p only   // unmapped: <python:pattern>
		readonly patterns?: V.Unmapped<'python:patterns'> | V.Unmapped<'rust:patterns'>; // unmapped: <python:patterns> <rust:patterns>
		readonly tail?: V.Unmapped<'python:pattern_list_patterns'>; // p only   // unmapped: <python:pattern_list_patterns> literal:Comma
		readonly value?: G['identifier'] | V.Type.Generic.Turbofish<G>; // r only
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarContext> extends V.Pattern.Tuple<G> {
			// claimed by p
			readonly pattern: V.Unmapped<'python:pattern'>; // unmapped: <python:pattern>
			readonly tail: V.Unmapped<'python:pattern_list_patterns'>; // unmapped: <python:pattern_list_patterns> literal:Comma
		}
		export interface Struct<G extends GrammarContext> extends V.Pattern.Tuple<G> {
			// claimed by r
			readonly patterns?: V.Unmapped<'rust:patterns'>; // unmapped: <rust:patterns>
			readonly value: G['identifier'] | V.Type.Generic.Turbofish<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Pattern.Tuple<G>
			| V.Pattern.Tuple.Bare<G>
			| V.Pattern.Tuple.Struct<G>;
	}
	export type Kinds<G extends GrammarContext> =
		| V.Pattern.Array<G>
		| V.Pattern.As<G>
		| V.Pattern.Assignment<G>
		| V.Pattern.Captured<G>
		| V.Pattern.Case<G>
		| V.Pattern.Case.As<G>
		| V.Pattern.Case.Class<G>
		| V.Pattern.Case.Complex<G>
		| V.Pattern.Case.Dictionary<G>
		| V.Pattern.Case.Keyword<G>
		| V.Pattern.Case.List<G>
		| V.Pattern.Case.Or<G>
		| V.Pattern.Case.Splat<G>
		| V.Pattern.Case.Tuple<G>
		| V.Pattern.Generic<G>
		| V.Pattern.List<G>
		| V.Pattern.Match<G>
		| V.Pattern.Mutable<G>
		| V.Pattern.Object<G>
		| V.Pattern.Object.Assignment<G>
		| V.Pattern.Object.Pair<G>
		| V.Pattern.Or<G>
		| V.Pattern.Range<G>
		| V.Pattern.Reference<G>
		| V.Pattern.Reference.Value<G>
		| V.Pattern.Rest<G>
		| V.Pattern.Slice<G>
		| V.Pattern.Splat<G>
		| V.Pattern.Splat.Dictionary<G>
		| V.Pattern.Struct<G>
		| V.Pattern.Struct.Field<G>
		| V.Pattern.Struct.Rest<G>
		| V.Pattern.Tuple<G>
		| V.Pattern.Tuple.Bare<G>
		| V.Pattern.Tuple.Struct<G>;
}
