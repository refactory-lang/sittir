// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type { Simplify } from 'type-fest';

import type { SubKindOf } from './utils.ts';

import type * as V from './index.ts';

export interface Clause<G extends GrammarContext> {
	readonly kind: 'clause';
}

export namespace Clause {
	export interface Bounds<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by r
		readonly kind: 'clause.bounds';
		readonly bounds?:
			| V.Unmapped<'rust:use_bounds_elements'>
			| V.Expression.Call.Macro<G>
			| G['identifier']
			| V.Clause.Bounds.Any<G>
			| G['type']
			| (
					| V.Unmapped<'rust:use_bounds_elements'>
					| V.Expression.Call.Macro<G>
					| G['identifier']
					| V.Clause.Bounds.Any<G>
					| G['type']
			  )[];
		// unmapped: <rust:use_bounds_elements>
	}
	export namespace Bounds {
		export interface HigherRanked<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Bounds<G>>> {
			// claimed by r
			readonly kind: 'clause.bounds.higher_ranked';
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly typeParameters: V.Declaration.TypeParameter<G>[];
		}
		export interface Removed<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Bounds<G>>> {
			// claimed by r
			readonly kind: 'clause.bounds.removed';
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		}
		export interface Use<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Bounds<G>>> {
			// claimed by r
			readonly kind: 'clause.bounds.use';
			readonly bounds?: V.Unmapped<'rust:use_bounds_elements'>;
			// unmapped: <rust:use_bounds_elements>
		}
		export type Any<G extends GrammarContext> =
			| V.Clause.Bounds<G>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>;
	}
	export interface Case<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by pt
		readonly kind: 'clause.case';
		readonly bodies?: (V.Clause.Import.Alias<G> | G['declaration'] | G['statement'])[];
		// t only
		readonly casePatterns?: V.Unmapped<'python:case_patterns'>;
		// p only
		// unmapped: <python:case_patterns>
		readonly consequence?: V.Unmapped<'python:suite'>;
		// p only
		// unmapped: <python:suite>
		readonly guard?: V.Clause.Comprehension.If<G>;
		// p only
		readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		// t only
	}
	export namespace Case {
		export interface Default<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Case<G>>> {
			// claimed by t
			readonly kind: 'clause.case.default';
			readonly bodies?: (V.Clause.Import.Alias<G> | G['declaration'] | G['statement'])[];
		}
		export type Any<G extends GrammarContext> = V.Clause.Case<G> | V.Clause.Case.Default<G>;
	}
	export interface Catch<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.catch';
		readonly body: V.Statement.Block<G>;
		readonly catchClauseGroup?: V.Unmapped<'typescript:catch_clause_group'>;
		// unmapped: <typescript:catch_clause_group>
	}
	export interface Comprehension<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by p
		readonly kind: 'clause.comprehension';
		readonly contents?: V.Clause.Comprehension.Any<G>[];
	}
	export namespace Comprehension {
		export interface For<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Comprehension<G>>> {
			// claimed by p
			readonly kind: 'clause.comprehension.for';
			readonly async?: boolean;
			readonly comma?: boolean;
			readonly left: G['expression'] | G['identifier'] | G['pattern'];
			readonly rights: (G['expression'] | G['identifier'] | G['literal'] | G['pattern'])[];
		}
		export interface If<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Comprehension<G>>> {
			// claimed by p
			readonly kind: 'clause.comprehension.if';
			readonly condition: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export type Any<G extends GrammarContext> =
			| V.Clause.Comprehension<G>
			| V.Clause.Comprehension.For<G>
			| V.Clause.Comprehension.If<G>;
	}
	export interface Constraint<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.constraint';
		readonly content: ':' | 'extends';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Default<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.default';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Elif<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by p
		readonly kind: 'clause.elif';
		readonly condition: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly consequence: V.Unmapped<'python:suite'>;
		// unmapped: <python:suite>
	}
	export interface Else<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by prt
		readonly kind: 'clause.else';
		readonly body?: V.Unmapped<'python:suite'> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		// pt only
		// unmapped: <python:suite>
		readonly content?: G['statement'];
		// r only
	}
	export interface Except<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by p
		readonly kind: 'clause.except';
		readonly exception?: V.Unmapped<'python:except_clause_exception'>;
		// unmapped: <python:except_clause_exception>
		readonly star?: boolean;
		readonly suite: V.Unmapped<'python:suite'>;
		// unmapped: <python:suite>
	}
	export interface Export<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.export';
		readonly exportSpecifiers?: V.Unmapped<'typescript:export_specifiers'>;
		// unmapped: <typescript:export_specifiers>
	}
	export namespace Export {
		export interface Namespace<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Export<G>>> {
			// claimed by t
			readonly kind: 'clause.export.namespace';
			readonly moduleExportName: G['identifier'] | V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Export<G>>> {
			// claimed by t
			readonly kind: 'clause.export.specifier';
			readonly alias?: G['identifier'] | V.Literal.String<G>;
			readonly exportKind?: 'type' | 'typeof';
			readonly name: G['identifier'] | V.Literal.String<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Clause.Export<G>
			| V.Clause.Export.Namespace<G>
			| V.Clause.Export.Specifier<G>;
	}
	export interface Extends<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.extends';
		readonly extendsClauseSingles?: V.Unmapped<'typescript:extends_clause_single'>[];
		// unmapped: <typescript:extends_clause_single>
	}
	export namespace Extends {
		export interface Type<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Extends<G>>> {
			// claimed by t
			readonly kind: 'clause.extends.type';
			readonly types: (V.Identifier.Type<G> | G['type'])[];
		}
		export type Any<G extends GrammarContext> = V.Clause.Extends<G> | V.Clause.Extends.Type<G>;
	}
	export interface Finally<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by pt
		readonly kind: 'clause.finally';
		readonly block?: V.Unmapped<'python:suite'>;
		// p only
		// unmapped: <python:suite>
		readonly body?: V.Statement.Block<G>;
		// t only
	}
	export interface Implements<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.implements';
		readonly types: (G['identifier'] | G['type'])[];
	}
	export interface Import<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		readonly kind: 'clause.import';
	}
	export namespace Import {
		export interface Alias<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by pt
			readonly kind: 'clause.import.alias';
			readonly alias?: G['identifier'];
			// p only
			readonly declare?: boolean;
			// t only
			readonly label?:
				| V.Identifier.Label<G>
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
			// t only
			readonly name: G['identifier'];
			readonly value?: G['identifier'];
			// t only
		}
		export interface As<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by r
			readonly kind: 'clause.import.as';
			readonly alias: G['identifier'];
			readonly path:
				| G['identifier']
				| 'bool'
				| 'char'
				| 'default'
				| 'f32'
				| 'f64'
				| 'gen'
				| 'i128'
				| 'i16'
				| 'i32'
				| 'i64'
				| 'i8'
				| 'isize'
				| 'str'
				| 'u128'
				| 'u16'
				| 'u32'
				| 'u64'
				| 'u8'
				| 'union'
				| 'usize';
		}
		export interface Attribute<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by t
			readonly kind: 'clause.import.attribute';
			readonly attributeKind: 'assert' | 'with';
			readonly object: V.Expression.Collection.Object<G>;
		}
		export interface List<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by r
			readonly kind: 'clause.import.list';
			readonly useClauses?: V.Unmapped<'rust:use_clauses'>;
			// unmapped: <rust:use_clauses>
		}
		export namespace List {
			export interface Scoped<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import.List<G>>> {
				// claimed by r
				readonly kind: 'clause.import.list.scoped';
				readonly list: V.Clause.Import.List<G>;
				readonly path?:
					| G['identifier']
					| 'bool'
					| 'char'
					| 'default'
					| 'f32'
					| 'f64'
					| 'gen'
					| 'i128'
					| 'i16'
					| 'i32'
					| 'i64'
					| 'i8'
					| 'isize'
					| 'str'
					| 'u128'
					| 'u16'
					| 'u32'
					| 'u64'
					| 'u8'
					| 'union'
					| 'usize';
			}
			export type Any<G extends GrammarContext> = V.Clause.Import.List<G> | V.Clause.Import.List.Scoped<G>;
		}
		export interface Names<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by t
			readonly kind: 'clause.import.names';
			readonly content:
				| V.Unmapped<'typescript:import_clause_default_import'>
				| V.Unmapped<'typescript:named_imports'>
				| V.Clause.Import.Namespace<G>;
			// unmapped: <typescript:import_clause_default_import> <typescript:named_imports>
		}
		export interface Namespace<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by t
			readonly kind: 'clause.import.namespace';
			readonly name: G['identifier'];
		}
		export interface Relative<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by p
			readonly kind: 'clause.import.relative';
			readonly name?: V.Identifier.Dotted<G>;
			readonly prefix?: V.Clause.Import.Relative.Prefix<G>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import.Relative<G>>> {
				// claimed by p
				readonly kind: 'clause.import.relative.prefix';
			}
			export type Any<G extends GrammarContext> = V.Clause.Import.Relative<G> | V.Clause.Import.Relative.Prefix<G>;
		}
		export interface Require<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by t
			readonly kind: 'clause.import.require';
			readonly name: G['identifier'];
			readonly source: V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by t
			readonly kind: 'clause.import.specifier';
		}
		export interface Wildcard<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Import<G>>> {
			// claimed by pr
			readonly kind: 'clause.import.wildcard';
			readonly useWildcardGroup?: V.Unmapped<'rust:use_wildcard_group'>;
			// r only
			// unmapped: <rust:use_wildcard_group>
		}
		export type Any<G extends GrammarContext> =
			| V.Clause.Import.Alias<G>
			| V.Clause.Import.As<G>
			| V.Clause.Import.Attribute<G>
			| V.Clause.Import.List<G>
			| V.Clause.Import.List.Scoped<G>
			| V.Clause.Import.Names<G>
			| V.Clause.Import.Namespace<G>
			| V.Clause.Import.Relative<G>
			| V.Clause.Import.Relative.Prefix<G>
			| V.Clause.Import.Require<G>
			| V.Clause.Import.Specifier<G>
			| V.Clause.Import.Wildcard<G>;
	}
	export interface Let<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by r
		readonly kind: 'clause.let';
		readonly pattern?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export namespace Let {
		export interface Chain<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Let<G>>> {
			// claimed by r
			readonly kind: 'clause.let.chain';
			readonly left?: G['expression'] | G['identifier'] | G['literal'] | V.Clause.Let.Any<G> | G['statement'];
			readonly rights?: (V.Clause.Let<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'])[];
		}
		export type Any<G extends GrammarContext> = V.Clause.Let<G> | V.Clause.Let.Chain<G>;
	}
	export interface Lifetimes<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by r
		readonly kind: 'clause.lifetimes';
		readonly lifetimes: V.Unmapped<'rust:lifetimes'>;
		// unmapped: <rust:lifetimes>
	}
	export interface Macro<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		readonly kind: 'clause.macro';
		readonly left: V.Element.Macro.TokenTree.Pattern<G>;
		// r only
		readonly right: V.Element.Macro.TokenTree<G>;
		// r only
	}
	export namespace Macro {
		export interface Rule<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Macro<G>>> {
			// claimed by r
			readonly kind: 'clause.macro.rule';
			readonly left: V.Element.Macro.TokenTree.Pattern<G>;
			readonly right: V.Element.Macro.TokenTree<G>;
		}
		export type Any<G extends GrammarContext> = V.Clause.Macro.Rule<G>;
	}
	export interface MappedType<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by t
		readonly kind: 'clause.mapped_type';
		readonly alias?: G['identifier'] | G['type'];
		readonly name: V.Identifier.Type<G>;
		readonly type: G['identifier'] | G['type'];
	}
	export interface Match<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		readonly kind: 'clause.match';
	}
	export namespace Match {
		export interface Arm<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Match<G>>> {
			// claimed by r
			readonly kind: 'clause.match.arm';
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Match.Arm<G>>> {
				// claimed by r
				readonly kind: 'clause.match.arm.last';
				readonly attributes?: G['attribute'][];
				readonly comma?: boolean;
				readonly pattern: V.Pattern.Match<G>;
				readonly value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			}
			export type Any<G extends GrammarContext> = V.Clause.Match.Arm<G> | V.Clause.Match.Arm.Last<G>;
		}
		export type Any<G extends GrammarContext> = V.Clause.Match.Arm<G> | V.Clause.Match.Arm.Last<G>;
	}
	export interface Print<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		readonly kind: 'clause.print';
		readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// p only
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Print<G>>> {
			// claimed by p
			readonly kind: 'clause.print.chevron';
			readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export type Any<G extends GrammarContext> = V.Clause.Print.Chevron<G>;
	}
	export interface Where<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by r
		readonly kind: 'clause.where';
		readonly wherePredicates?: V.Unmapped<'rust:where_predicates'>;
		// unmapped: <rust:where_predicates>
	}
	export namespace Where {
		export interface Predicate<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.Where<G>>> {
			// claimed by r
			readonly kind: 'clause.where.predicate';
			readonly bounds: V.Clause.Bounds<G>;
			readonly left: V.Clause.Bounds.HigherRanked<G> | G['identifier'] | G['type'];
		}
		export type Any<G extends GrammarContext> = V.Clause.Where<G> | V.Clause.Where.Predicate<G>;
	}
	export interface With<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause<G>>> {
		// claimed by p
		readonly kind: 'clause.with';
	}
	export namespace With {
		export interface Item<G extends GrammarContext> extends Simplify<SubKindOf<V.Clause.With<G>>> {
			// claimed by p
			readonly kind: 'clause.with.item';
			readonly value: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export type Any<G extends GrammarContext> = V.Clause.With<G> | V.Clause.With.Item<G>;
	}
	export type Any<G extends GrammarContext> =
		| V.Clause.Bounds<G>
		| V.Clause.Bounds.HigherRanked<G>
		| V.Clause.Bounds.Removed<G>
		| V.Clause.Bounds.Use<G>
		| V.Clause.Case<G>
		| V.Clause.Case.Default<G>
		| V.Clause.Catch<G>
		| V.Clause.Comprehension<G>
		| V.Clause.Comprehension.For<G>
		| V.Clause.Comprehension.If<G>
		| V.Clause.Constraint<G>
		| V.Clause.Default<G>
		| V.Clause.Elif<G>
		| V.Clause.Else<G>
		| V.Clause.Except<G>
		| V.Clause.Export<G>
		| V.Clause.Export.Namespace<G>
		| V.Clause.Export.Specifier<G>
		| V.Clause.Extends<G>
		| V.Clause.Extends.Type<G>
		| V.Clause.Finally<G>
		| V.Clause.Implements<G>
		| V.Clause.Import.Alias<G>
		| V.Clause.Import.As<G>
		| V.Clause.Import.Attribute<G>
		| V.Clause.Import.List<G>
		| V.Clause.Import.List.Scoped<G>
		| V.Clause.Import.Names<G>
		| V.Clause.Import.Namespace<G>
		| V.Clause.Import.Relative<G>
		| V.Clause.Import.Relative.Prefix<G>
		| V.Clause.Import.Require<G>
		| V.Clause.Import.Specifier<G>
		| V.Clause.Import.Wildcard<G>
		| V.Clause.Let<G>
		| V.Clause.Let.Chain<G>
		| V.Clause.Lifetimes<G>
		| V.Clause.Macro.Rule<G>
		| V.Clause.MappedType<G>
		| V.Clause.Match.Arm<G>
		| V.Clause.Match.Arm.Last<G>
		| V.Clause.Print.Chevron<G>
		| V.Clause.Where<G>
		| V.Clause.Where.Predicate<G>
		| V.Clause.With<G>
		| V.Clause.With.Item<G>;
}
