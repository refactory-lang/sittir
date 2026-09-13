// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Clause<G extends GrammarContext> {
	readonly alias?: G['identifier'] | V.Literal.String<G> | G['type']; // prt only
	readonly asserts?: V.Type.Predicate.Asserts<G>; // t only
	readonly asyncMarker?: boolean; // p only
	readonly attributeKind?: 'assert' | 'with'; // t only
	readonly attributes?: G['attribute'][]; // r only
	readonly block?: V.Statement.Block<G>; // p only   // unmapped: literal:_SuiteEmpty
	readonly body?:
		| V.Statement.Block<G>
		| V.Clause.Import.Alias<G>
		| G['declaration']
		| G['statement']
		| (V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement'])[]; // pt only   // unmapped: literal:_SuiteEmpty
	readonly bounds?:
		| V.Unmapped<'rust:use_bounds_elements'>
		| G['clause']
		| V.Expression.Call.Macro<G>
		| G['identifier']
		| G['type']
		| (
				| V.Unmapped<'rust:use_bounds_elements'>
				| G['clause']
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type']
		  )[]; // r only   // unmapped: <rust:use_bounds_elements>
	readonly casePatterns?: V.Unmapped<'python:case_patterns'>; // p only   // unmapped: <python:case_patterns>
	readonly catchClauseGroup?: V.Unmapped<'typescript:catch_clause_group'>; // t only   // unmapped: <typescript:catch_clause_group>
	readonly comma?: boolean; // pr only
	readonly condition?: G['expression'] | G['identifier'] | G['literal']; // p only
	readonly consequence?: V.Statement.Block<G>; // p only   // unmapped: literal:_SuiteEmpty
	readonly content?:
		| V.Unmapped<'python:with_clause_bare'>
		| V.Unmapped<'python:with_clause_paren'>
		| V.Unmapped<'rust:match_arm_with_comma'>
		| V.Unmapped<'typescript:import_clause_default_import'>
		| V.Unmapped<'typescript:import_specifier_as'>
		| V.Clause.Import.Specifier<G>[]
		| G['clause']
		| G['expression']
		| G['identifier']
		| G['statement']
		| ':'
		| 'extends'
		| (
				| V.Unmapped<'python:with_clause_bare'>
				| V.Unmapped<'python:with_clause_paren'>
				| V.Unmapped<'rust:match_arm_with_comma'>
				| V.Unmapped<'typescript:import_clause_default_import'>
				| V.Unmapped<'typescript:import_specifier_as'>
				| V.Clause.Import.Specifier<G>[]
				| G['clause']
				| G['expression']
				| G['identifier']
				| G['statement']
				| ':'
				| 'extends'
		  )[]; // prt only   // unmapped: <python:with_clause_bare> <python:with_clause_paren> <rust:match_arm_with_comma> <typescript:import_clause_default_import> <typescript:import_specifier_as>
	readonly exception?: V.Unmapped<'python:except_clause_exception'>; // p only   // unmapped: <python:except_clause_exception>
	readonly exportKind?: 'type' | 'typeof'; // t only
	readonly exportSpecifiers?: V.Unmapped<'typescript:export_specifiers'>; // t only   // unmapped: <typescript:export_specifiers>
	readonly expression?: G['expression'] | G['identifier'] | G['literal']; // p only
	readonly extendsClauseSingle?: V.Unmapped<'typescript:extends_clause_single'>[]; // t only   // unmapped: <typescript:extends_clause_single>
	readonly guard?: V.Clause.Comprehension.If<G>; // p only
	readonly heritage?: (G['identifier'] | G['type'])[]; // t only
	readonly importKind?: 'type' | 'typeof'; // t only
	readonly left?:
		| V.Unmapped<'python:pattern'>
		| G['clause']
		| V.Element.Macro.TokenTree.Pattern<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| V.Pattern.Tuple.Bare<G>
		| G['statement']
		| G['type']; // pr only   // unmapped: <python:pattern>
	readonly lifetimes?: V.Unmapped<'rust:lifetimes'>; // r only   // unmapped: <rust:lifetimes>
	readonly list?: V.Clause.Import.List<G>; // r only
	readonly moduleExportName?: G['identifier'] | V.Literal.String<G>; // t only
	readonly name?: G['identifier'] | V.Literal.String<G>; // pt only
	readonly object?: V.Expression.Collection.Object<G>; // t only
	readonly path?: G['identifier']; // r only   // unmapped: literal:Crate literal:Self literal:Super
	readonly pattern?:
		| V.Expression.Block.Const<G>
		| V.Expression.Call.Macro<G>
		| G['identifier']
		| G['literal']
		| G['pattern']; // r only
	readonly prefix?: V.Clause.Import.Relative.Prefix<G>; // p only
	readonly right?:
		| V.Clause.Let<G>
		| V.Element.Macro.TokenTree<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['statement']
		| (
				| V.Clause.Let<G>
				| V.Element.Macro.TokenTree<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
		  )[]; // pr only
	readonly source?: V.Literal.String<G>; // t only
	readonly starMarker?: boolean; // p only
	readonly suite?: V.Statement.Block<G>; // p only   // unmapped: literal:_SuiteEmpty
	readonly type?:
		| V.Clause.Bounds.Removed<G>
		| V.Expression.Call.Macro<G>
		| G['identifier']
		| G['type']
		| (V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'])[]; // rt only
	readonly typeParameters?: V.Declaration.Parameter.Type<G>[]; // r only
	readonly typePredicate?: V.Type.Predicate<G>; // t only
	readonly useClauses?: V.Unmapped<'rust:use_clauses'>; // r only   // unmapped: <rust:use_clauses>
	readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // prt only
	readonly wherePredicates?: V.Unmapped<'rust:where_predicates'>; // r only   // unmapped: <rust:where_predicates>
}
export namespace Clause {
	export interface Annotation<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly asserts?: V.Type.Predicate.Asserts<G>;
		readonly type?: G['identifier'] | G['type'];
		readonly typePredicate?: V.Type.Predicate<G>;
	}
	export namespace Annotation {
		export interface Adding<G extends GrammarContext> extends V.Clause.Annotation<G> {
			// claimed by t
			readonly type: G['identifier'] | G['type'];
		}
		export interface Asserts<G extends GrammarContext> extends V.Clause.Annotation<G> {
			// claimed by t
			readonly asserts: V.Type.Predicate.Asserts<G>;
		}
		export interface Omitting<G extends GrammarContext> extends V.Clause.Annotation<G> {
			// claimed by t
			readonly type: G['identifier'] | G['type'];
		}
		export interface Opting<G extends GrammarContext> extends V.Clause.Annotation<G> {
			// claimed by t
			readonly type: G['identifier'] | G['type'];
		}
		export interface Predicate<G extends GrammarContext> extends V.Clause.Annotation<G> {
			// claimed by t
			readonly typePredicate: V.Type.Predicate<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Clause.Annotation.Adding<G>
			| V.Clause.Annotation.Asserts<G>
			| V.Clause.Annotation.Omitting<G>
			| V.Clause.Annotation.Opting<G>
			| V.Clause.Annotation.Predicate<G>;
	}
	export interface Bounds<G extends GrammarContext> extends V.Clause<G> {
		// claimed by r
		readonly bounds?:
			| V.Unmapped<'rust:use_bounds_elements'>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| G['identifier']
			| G['type']
			| (
					| V.Unmapped<'rust:use_bounds_elements'>
					| V.Clause.Bounds.HigherRanked<G>
					| V.Clause.Bounds.Removed<G>
					| V.Expression.Call.Macro<G>
					| G['identifier']
					| G['type']
			  )[]; // unmapped: <rust:use_bounds_elements>
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly typeParameters?: V.Declaration.Parameter.Type<G>[];
	}
	export namespace Bounds {
		export interface HigherRanked<G extends GrammarContext> extends V.Clause.Bounds<G> {
			// claimed by r
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly typeParameters: V.Declaration.Parameter.Type<G>[];
		}
		export interface Removed<G extends GrammarContext> extends V.Clause.Bounds<G> {
			// claimed by r
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		}
		export interface Use<G extends GrammarContext> extends V.Clause.Bounds<G> {
			// claimed by r
			readonly bounds?: V.Unmapped<'rust:use_bounds_elements'>; // unmapped: <rust:use_bounds_elements>
		}
		export type Kinds<G extends GrammarContext> =
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>;
	}
	export interface Case<G extends GrammarContext> extends V.Clause<G> {
		// claimed by pt
		readonly body?: (V.Clause.Import.Alias<G> | G['declaration'] | G['statement'])[]; // t only
		readonly casePatterns?: V.Unmapped<'python:case_patterns'>; // p only   // unmapped: <python:case_patterns>
		readonly consequence?: V.Statement.Block<G>; // p only   // unmapped: literal:_SuiteEmpty
		readonly guard?: V.Clause.Comprehension.If<G>; // p only
		readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
	}
	export namespace Case {
		export interface Default<G extends GrammarContext> extends V.Clause.Case<G> {
			// claimed by t
			readonly body?: (V.Clause.Import.Alias<G> | G['declaration'] | G['statement'])[];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Case.Default<G>;
	}
	export interface Catch<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly body: V.Statement.Block<G>;
		readonly catchClauseGroup?: V.Unmapped<'typescript:catch_clause_group'>; // unmapped: <typescript:catch_clause_group>
	}
	export interface Comprehension<G extends GrammarContext> extends V.Clause<G> {
		// claimed by p
		readonly asyncMarker?: boolean;
		readonly comma?: boolean;
		readonly condition?: G['expression'] | G['identifier'] | G['literal'];
		readonly content?: (V.Clause.Comprehension.For<G> | V.Clause.Comprehension.If<G>)[];
		readonly left?: V.Unmapped<'python:pattern'> | V.Pattern.Tuple.Bare<G>; // unmapped: <python:pattern>
		readonly right?: (G['expression'] | G['identifier'] | G['literal'])[];
	}
	export namespace Comprehension {
		export interface For<G extends GrammarContext> extends V.Clause.Comprehension<G> {
			// claimed by p
			readonly asyncMarker?: boolean;
			readonly comma?: boolean;
			readonly left: V.Unmapped<'python:pattern'> | V.Pattern.Tuple.Bare<G>; // unmapped: <python:pattern>
			readonly right: (G['expression'] | G['identifier'] | G['literal'])[];
		}
		export interface If<G extends GrammarContext> extends V.Clause.Comprehension<G> {
			// claimed by p
			readonly condition: G['expression'] | G['identifier'] | G['literal'];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Comprehension.For<G> | V.Clause.Comprehension.If<G>;
	}
	export interface Constraint<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly content: ':' | 'extends';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Default<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Elif<G extends GrammarContext> extends V.Clause<G> {
		// claimed by p
		readonly condition: G['expression'] | G['identifier'] | G['literal'];
		readonly consequence: V.Statement.Block<G>; // unmapped: literal:_SuiteEmpty
	}
	export interface Else<G extends GrammarContext> extends V.Clause<G> {
		// claimed by prt
		readonly body: V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement']; // pt only   // unmapped: literal:_SuiteEmpty
		readonly content: V.Statement.Block<G> | V.Statement.If<G>; // r only
	}
	export interface Except<G extends GrammarContext> extends V.Clause<G> {
		// claimed by p
		readonly exception?: V.Unmapped<'python:except_clause_exception'>; // unmapped: <python:except_clause_exception>
		readonly starMarker?: boolean;
		readonly suite: V.Statement.Block<G>; // unmapped: literal:_SuiteEmpty
	}
	export interface Export<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly alias?: G['identifier'] | V.Literal.String<G>;
		readonly exportKind?: 'type' | 'typeof';
		readonly exportSpecifiers?: V.Unmapped<'typescript:export_specifiers'>; // unmapped: <typescript:export_specifiers>
		readonly moduleExportName?: G['identifier'] | V.Literal.String<G>;
		readonly name?: G['identifier'] | V.Literal.String<G>;
	}
	export namespace Export {
		export interface Namespace<G extends GrammarContext> extends V.Clause.Export<G> {
			// claimed by t
			readonly moduleExportName: G['identifier'] | V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarContext> extends V.Clause.Export<G> {
			// claimed by t
			readonly alias?: G['identifier'] | V.Literal.String<G>;
			readonly exportKind?: 'type' | 'typeof';
			readonly name: G['identifier'] | V.Literal.String<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Export.Namespace<G> | V.Clause.Export.Specifier<G>;
	}
	export interface Extends<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly extendsClauseSingle?: V.Unmapped<'typescript:extends_clause_single'>[]; // unmapped: <typescript:extends_clause_single>
		readonly type?: (G['identifier'] | V.Type.Generic<G>)[];
	}
	export namespace Extends {
		export interface Type<G extends GrammarContext> extends V.Clause.Extends<G> {
			// claimed by t
			readonly type: (G['identifier'] | V.Type.Generic<G>)[];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Extends.Type<G>;
	}
	export interface Finally<G extends GrammarContext> extends V.Clause<G> {
		// claimed by pt
		readonly block: V.Statement.Block<G>; // p only   // unmapped: literal:_SuiteEmpty
		readonly body: V.Statement.Block<G>; // t only
	}
	export interface Implements<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly heritage: (G['identifier'] | G['type'])[];
	}
	export interface Import<G extends GrammarContext> extends V.Clause<G> {
		readonly alias?: G['identifier']; // pr only
		readonly attributeKind?: 'assert' | 'with'; // t only
		readonly content?:
			| V.Unmapped<'typescript:import_clause_default_import'>
			| V.Unmapped<'typescript:import_specifier_as'>
			| V.Clause.Import.Specifier<G>[]
			| V.Clause.Import.Namespace<G>
			| G['identifier']; // t only   // unmapped: <typescript:import_clause_default_import> <typescript:import_specifier_as>
		readonly importKind?: 'type' | 'typeof'; // t only
		readonly list?: V.Clause.Import.List<G>; // r only
		readonly name?: G['identifier']; // pt only
		readonly object?: V.Expression.Collection.Object<G>; // t only
		readonly path?: G['identifier']; // r only   // unmapped: literal:Crate literal:Self literal:Super
		readonly prefix?: V.Clause.Import.Relative.Prefix<G>; // p only
		readonly source?: V.Literal.String<G>; // t only
		readonly useClauses?: V.Unmapped<'rust:use_clauses'>; // r only   // unmapped: <rust:use_clauses>
		readonly value?: G['identifier']; // t only
	}
	export namespace Import {
		export interface Alias<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by pt
			readonly alias: G['identifier']; // p only
			readonly name: G['identifier'];
			readonly value: G['identifier']; // t only
		}
		export interface As<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by r
			readonly alias: G['identifier'];
			readonly path: G['identifier']; // unmapped: literal:Crate literal:Self literal:Super
		}
		export interface Attribute<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by t
			readonly attributeKind: 'assert' | 'with';
			readonly object: V.Expression.Collection.Object<G>;
		}
		export interface List<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by r
			readonly list?: V.Clause.Import.List<G>;
			readonly path?: G['identifier']; // unmapped: literal:Crate literal:Self literal:Super
			readonly useClauses?: V.Unmapped<'rust:use_clauses'>; // unmapped: <rust:use_clauses>
		}
		export namespace List {
			export interface Scoped<G extends GrammarContext> extends V.Clause.Import.List<G> {
				// claimed by r
				readonly list: V.Clause.Import.List<G>;
				readonly path?: G['identifier']; // unmapped: literal:Crate literal:Self literal:Super
			}
			export type Kinds<G extends GrammarContext> = V.Clause.Import.List.Scoped<G>;
		}
		export interface Names<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by t
			readonly content:
				| V.Unmapped<'typescript:import_clause_default_import'>
				| V.Clause.Import.Specifier<G>[]
				| V.Clause.Import.Namespace<G>; // unmapped: <typescript:import_clause_default_import>
		}
		export interface Namespace<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by t
			readonly name: G['identifier'];
		}
		export interface Relative<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by p
			readonly name?: V.Identifier.Dotted<G>;
			readonly prefix?: V.Clause.Import.Relative.Prefix<G>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarContext> extends V.Clause.Import.Relative<G> {} // claimed by p
			export type Kinds<G extends GrammarContext> = V.Clause.Import.Relative.Prefix<G>;
		}
		export interface Require<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by t
			readonly name: G['identifier'];
			readonly source: V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by t
			readonly content: V.Unmapped<'typescript:import_specifier_as'> | G['identifier']; // unmapped: <typescript:import_specifier_as>
			readonly importKind?: 'type' | 'typeof';
		}
		export interface Wildcard<G extends GrammarContext> extends V.Clause.Import<G> {
			// claimed by pr
			readonly path?: G['identifier']; // r only   // unmapped: literal:Crate literal:Self literal:Super
		}
		export type Kinds<G extends GrammarContext> =
			| V.Clause.Import.Alias<G>
			| V.Clause.Import.As<G>
			| V.Clause.Import.Attribute<G>
			| V.Clause.Import.List.Scoped<G>
			| V.Clause.Import.Names<G>
			| V.Clause.Import.Namespace<G>
			| V.Clause.Import.Relative.Prefix<G>
			| V.Clause.Import.Require<G>
			| V.Clause.Import.Specifier<G>
			| V.Clause.Import.Wildcard<G>;
	}
	export interface Let<G extends GrammarContext> extends V.Clause<G> {
		// claimed by r
		readonly left?:
			| V.Clause.Let<G>
			| V.Clause.Let.Chain<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['statement'];
		readonly pattern?:
			| V.Expression.Block.Const<G>
			| V.Expression.Call.Macro<G>
			| G['identifier']
			| G['literal']
			| G['pattern'];
		readonly right?: (V.Clause.Let<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'])[];
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
	}
	export namespace Let {
		export interface Chain<G extends GrammarContext> extends V.Clause.Let<G> {
			// claimed by r
			readonly left?:
				| V.Clause.Let<G>
				| V.Clause.Let.Chain<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
			readonly right?: (V.Clause.Let<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'])[];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Let.Chain<G>;
	}
	export interface Lifetimes<G extends GrammarContext> extends V.Clause<G> {
		// claimed by r
		readonly lifetimes: V.Unmapped<'rust:lifetimes'>; // unmapped: <rust:lifetimes>
	}
	export interface Macro<G extends GrammarContext> extends V.Clause<G> {
		readonly left?: V.Element.Macro.TokenTree.Pattern<G>; // r only
		readonly right?: V.Element.Macro.TokenTree<G>; // r only
	}
	export namespace Macro {
		export interface Rule<G extends GrammarContext> extends V.Clause.Macro<G> {
			// claimed by r
			readonly left: V.Element.Macro.TokenTree.Pattern<G>;
			readonly right: V.Element.Macro.TokenTree<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Macro.Rule<G>;
	}
	export interface MappedType<G extends GrammarContext> extends V.Clause<G> {
		// claimed by t
		readonly alias?: G['identifier'] | G['type'];
		readonly name: G['identifier'];
		readonly type: G['identifier'] | G['type'];
	}
	export interface Match<G extends GrammarContext> extends V.Clause<G> {
		readonly attributes?: G['attribute'][]; // r only
		readonly comma?: boolean; // r only
		readonly content?: V.Unmapped<'rust:match_arm_with_comma'> | G['expression'] | G['statement']; // r only   // unmapped: <rust:match_arm_with_comma>
		readonly pattern?: V.Pattern.Match<G>; // r only
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	}
	export namespace Match {
		export interface Arm<G extends GrammarContext> extends V.Clause.Match<G> {
			// claimed by r
			readonly attributes?: G['attribute'][];
			readonly comma?: boolean;
			readonly content?: V.Unmapped<'rust:match_arm_with_comma'> | G['expression'] | G['statement']; // unmapped: <rust:match_arm_with_comma>
			readonly pattern: V.Pattern.Match<G>;
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext> extends V.Clause.Match.Arm<G> {
				// claimed by r
				readonly attributes?: G['attribute'][];
				readonly comma?: boolean;
				readonly pattern: V.Pattern.Match<G>;
				readonly value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			}
			export type Kinds<G extends GrammarContext> = V.Clause.Match.Arm.Last<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Match.Arm.Last<G>;
	}
	export interface Print<G extends GrammarContext> extends V.Clause<G> {
		readonly expression?: G['expression'] | G['identifier'] | G['literal']; // p only
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext> extends V.Clause.Print<G> {
			// claimed by p
			readonly expression: G['expression'] | G['identifier'] | G['literal'];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Print.Chevron<G>;
	}
	export interface Where<G extends GrammarContext> extends V.Clause<G> {
		// claimed by r
		readonly bounds?: V.Clause.Bounds<G>;
		readonly left?: V.Clause.Bounds.HigherRanked<G> | G['identifier'] | G['type'];
		readonly wherePredicates?: V.Unmapped<'rust:where_predicates'>; // unmapped: <rust:where_predicates>
	}
	export namespace Where {
		export interface Predicate<G extends GrammarContext> extends V.Clause.Where<G> {
			// claimed by r
			readonly bounds: V.Clause.Bounds<G>;
			readonly left: V.Clause.Bounds.HigherRanked<G> | G['identifier'] | G['type'];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.Where.Predicate<G>;
	}
	export interface With<G extends GrammarContext> extends V.Clause<G> {
		// claimed by p
		readonly content?: V.Unmapped<'python:with_clause_bare'> | V.Unmapped<'python:with_clause_paren'>; // unmapped: <python:with_clause_bare> <python:with_clause_paren>
		readonly value?: G['expression'] | G['identifier'] | G['literal'];
	}
	export namespace With {
		export interface Item<G extends GrammarContext> extends V.Clause.With<G> {
			// claimed by p
			readonly value: G['expression'] | G['identifier'] | G['literal'];
		}
		export type Kinds<G extends GrammarContext> = V.Clause.With.Item<G>;
	}
	export type Kinds<G extends GrammarContext> =
		| V.Clause.Annotation.Adding<G>
		| V.Clause.Annotation.Asserts<G>
		| V.Clause.Annotation.Omitting<G>
		| V.Clause.Annotation.Opting<G>
		| V.Clause.Annotation.Predicate<G>
		| V.Clause.Bounds.HigherRanked<G>
		| V.Clause.Bounds.Removed<G>
		| V.Clause.Bounds.Use<G>
		| V.Clause.Case.Default<G>
		| V.Clause.Catch<G>
		| V.Clause.Comprehension.For<G>
		| V.Clause.Comprehension.If<G>
		| V.Clause.Constraint<G>
		| V.Clause.Default<G>
		| V.Clause.Elif<G>
		| V.Clause.Else<G>
		| V.Clause.Except<G>
		| V.Clause.Export.Namespace<G>
		| V.Clause.Export.Specifier<G>
		| V.Clause.Extends.Type<G>
		| V.Clause.Finally<G>
		| V.Clause.Implements<G>
		| V.Clause.Import.Alias<G>
		| V.Clause.Import.As<G>
		| V.Clause.Import.Attribute<G>
		| V.Clause.Import.List.Scoped<G>
		| V.Clause.Import.Names<G>
		| V.Clause.Import.Namespace<G>
		| V.Clause.Import.Relative.Prefix<G>
		| V.Clause.Import.Require<G>
		| V.Clause.Import.Specifier<G>
		| V.Clause.Import.Wildcard<G>
		| V.Clause.Let.Chain<G>
		| V.Clause.Lifetimes<G>
		| V.Clause.Macro.Rule<G>
		| V.Clause.MappedType<G>
		| V.Clause.Match.Arm.Last<G>
		| V.Clause.Print.Chevron<G>
		| V.Clause.Where.Predicate<G>
		| V.Clause.With.Item<G>;
}
