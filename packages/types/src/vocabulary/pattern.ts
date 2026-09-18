// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type { Simplify } from 'type-fest';

import type { SubKindOf } from './utils.ts';

import type * as V from './index.ts';

export interface Pattern<G extends GrammarContext> {
	readonly kind: 'pattern';
}

export namespace Pattern {
	export interface Array<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by t
		readonly kind: 'pattern.array';
		readonly elements?: (G['expression'] | G['identifier'] | V.Literal.Null.Undefined<G> | G['pattern'])[];
	}
	export interface As<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by p
		readonly kind: 'pattern.as';
		readonly alias: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Assignment<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by t
		readonly kind: 'pattern.assignment';
		readonly left: G['expression'] | G['identifier'] | V.Literal.Null.Undefined<G> | G['pattern'];
		readonly right: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
	}
	export interface Captured<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.captured';
		readonly name: G['identifier'];
		readonly pattern: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Case<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by p
		readonly kind: 'pattern.case';
		readonly content?:
			| V.Unmapped<'python:simple_pattern_negative'>
			| V.Identifier.Dotted<G>
			| G['literal']
			| V.Pattern.Case.Any<G>;
		// unmapped: <python:simple_pattern_negative> literal:_wildcard_pattern
	}
	export namespace Case {
		export interface As<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.as';
			readonly casePattern: V.Pattern.Case<G>;
			readonly identifier: G['identifier'];
		}
		export interface Class<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.class';
			readonly arguments?: V.Unmapped<'python:list_pattern_case_patterns'>;
			// unmapped: <python:list_pattern_case_patterns>
			readonly name: V.Identifier.Dotted<G>;
		}
		export interface Complex<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.complex';
			readonly content: V.Literal.Number.Any<G>;
			readonly imaginary: V.Literal.Number.Any<G>;
			readonly operator: '+' | '-';
			readonly real?: boolean;
		}
		export interface Dictionary<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.dictionary';
			readonly dictPatternElements?: V.Unmapped<'python:dict_pattern_elements'>;
			// unmapped: <python:dict_pattern_elements>
		}
		export interface Keyword<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.keyword';
			readonly name: G['identifier'];
			readonly value:
				| V.Unmapped<'python:simple_pattern_negative'>
				| V.Identifier.Dotted<G>
				| G['literal']
				| V.Pattern.Case.Any<G>;
			// unmapped: <python:simple_pattern_negative> literal:_wildcard_pattern
		}
		export interface List<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.list';
			readonly listPatternCasePatterns?: V.Unmapped<'python:list_pattern_case_patterns'>;
			// unmapped: <python:list_pattern_case_patterns>
		}
		export interface Or<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.or';
			readonly patterns: (
				| V.Unmapped<'python:simple_pattern_negative'>
				| V.Identifier.Dotted<G>
				| G['literal']
				| V.Pattern.Case.Any<G>
			)[];
			// unmapped: <python:simple_pattern_negative> literal:_wildcard_pattern
		}
		export interface Splat<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.splat';
			readonly name: G['identifier'] | '_';
			readonly operator: '*' | '**';
		}
		export interface Tuple<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Case<G>>> {
			// claimed by p
			readonly kind: 'pattern.case.tuple';
			readonly listPatternCasePatterns?: V.Unmapped<'python:list_pattern_case_patterns'>;
			// unmapped: <python:list_pattern_case_patterns>
		}
		export type Any<G extends GrammarContext> =
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
	export interface Generic<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.generic';
		readonly content: G['identifier'];
		readonly typeArguments: G['type'][];
	}
	export interface List<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by p
		readonly kind: 'pattern.list';
		readonly patterns?: V.Unmapped<'python:patterns'>;
		// unmapped: <python:patterns>
	}
	export interface Match<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.match';
		readonly condition?: G['expression'] | G['identifier'] | G['literal'] | V.Clause.Let.Any<G> | G['statement'];
		readonly pattern: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Mutable<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.mutable';
		readonly pattern: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Object<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by t
		readonly kind: 'pattern.object';
		readonly properties?: (V.Unmapped<'typescript:shorthand_property_identifier_pattern'> | G['pattern'])[];
		// unmapped: <typescript:shorthand_property_identifier_pattern>
	}
	export namespace Object {
		export interface Assignment<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Object<G>>> {
			// claimed by t
			readonly kind: 'pattern.object.assignment';
			readonly left: V.Unmapped<'typescript:shorthand_property_identifier_pattern'> | G['pattern'];
			// unmapped: <typescript:shorthand_property_identifier_pattern>
			readonly right: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		}
		export interface Pair<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Object<G>>> {
			// claimed by t
			readonly kind: 'pattern.object.pair';
			readonly key: G['literal'] | V.Identifier.Property.Any<G>;
			readonly value: G['expression'] | G['identifier'] | V.Literal.Null.Undefined<G> | G['pattern'];
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Object<G>
			| V.Pattern.Object.Assignment<G>
			| V.Pattern.Object.Pair<G>;
	}
	export interface Or<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.or';
	}
	export interface Range<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.range';
	}
	export interface Reference<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.reference';
		readonly pattern: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export namespace Reference {
		export interface Value<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Reference<G>>> {
			// claimed by r
			readonly kind: 'pattern.reference.value';
			readonly mutableSpecifier?: boolean;
			readonly pattern: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export type Any<G extends GrammarContext> = V.Pattern.Reference<G> | V.Pattern.Reference.Value<G>;
	}
	export interface Rest<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by t
		readonly kind: 'pattern.rest';
		readonly lhsExpression:
			| G['expression']
			| G['identifier']
			| V.Literal.Null.Undefined<G>
			| G['pattern']
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
	}
	export interface Slice<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.slice';
		readonly patterns?: V.Unmapped<'rust:patterns'>;
		// unmapped: <rust:patterns>
	}
	export interface Splat<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by p
		readonly kind: 'pattern.splat';
		readonly content: G['expression'] | G['identifier'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Splat<G>>> {
			// claimed by p
			readonly kind: 'pattern.splat.dictionary';
			readonly content: G['expression'] | G['identifier'];
		}
		export type Any<G extends GrammarContext> = V.Pattern.Splat<G> | V.Pattern.Splat.Dictionary<G>;
	}
	export interface Struct<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by r
		readonly kind: 'pattern.struct';
		readonly fields?: V.Unmapped<'rust:struct_pattern_elements'>;
		// unmapped: <rust:struct_pattern_elements>
		readonly type?: G['identifier'] | V.Type.Path<G>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Struct<G>>> {
			// claimed by r
			readonly kind: 'pattern.struct.field';
		}
		export interface Rest<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Struct<G>>> {
			// claimed by r
			readonly kind: 'pattern.struct.rest';
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Struct<G>
			| V.Pattern.Struct.Field<G>
			| V.Pattern.Struct.Rest<G>;
	}
	export interface Tuple<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern<G>>> {
		// claimed by pr
		readonly kind: 'pattern.tuple';
		readonly elements?: V.Unmapped<'rust:tuple_pattern_elements'>;
		// r only
		// unmapped: <rust:tuple_pattern_elements>
		readonly patterns?: V.Unmapped<'python:patterns'> | V.Unmapped<'rust:patterns'>;
		// unmapped: <python:patterns> <rust:patterns>
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Tuple<G>>> {
			// claimed by p
			readonly kind: 'pattern.tuple.bare';
			readonly pattern: G['expression'] | G['identifier'] | G['pattern'];
			readonly tail: V.Unmapped<'python:pattern_list_patterns'> | ',';
			// unmapped: <python:pattern_list_patterns>
		}
		export interface Struct<G extends GrammarContext> extends Simplify<SubKindOf<V.Pattern.Tuple<G>>> {
			// claimed by r
			readonly kind: 'pattern.tuple.struct';
			readonly patterns?: V.Unmapped<'rust:patterns'>;
			// unmapped: <rust:patterns>
			readonly type: G['identifier'] | V.Type.Generic.Turbofish<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Tuple<G>
			| V.Pattern.Tuple.Bare<G>
			| V.Pattern.Tuple.Struct<G>;
	}
	export type Any<G extends GrammarContext> =
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
