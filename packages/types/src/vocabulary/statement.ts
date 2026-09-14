// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Statement<G extends GrammarContext> {
	readonly alias?: G['identifier']; // r only
	readonly alternative?: G['clause'] | G['clause'][]; // prt only
	readonly argument?: G['identifier'] | V.Clause.Import.Kinds<G>; // r only
	readonly async?: boolean; // p only
	readonly await?: boolean; // t only
	readonly body?:
		| V.Unmapped<'python:match_block'>
		| V.Statement.Block<G>
		| V.Unmapped<'rust:match_block'>
		| V.Clause.Case<G>[]
		| V.Clause.Import.Alias<G>
		| G['declaration']
		| G['statement']; // prt only   // unmapped: <python:match_block> <rust:match_block> literal:_SuiteEmpty
	readonly cause?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
	readonly chevron?: V.Clause.Print.Chevron<G>; // p only
	readonly code?: G['identifier'] | V.Literal.String<G>; // p only
	readonly condition?:
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| V.Clause.Let.Kinds<G>
		| G['statement']; // prt only
	readonly consequence?: V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement']; // prt only   // unmapped: literal:_SuiteEmpty
	readonly content?:
		| V.Unmapped<'python:expression_statement_tuple'>
		| V.Unmapped<'python:import_list'>
		| V.Unmapped<'python:parenthesized_import_list'>
		| V.Unmapped<'rust:expression_statement_with_semi'>
		| V.Unmapped<'typescript:export_statement_default'>
		| V.Unmapped<'typescript:export_statement_equals_export'>
		| V.Unmapped<'typescript:export_statement_namespace_export'>
		| V.Unmapped<'typescript:export_statement_type_export'>
		| V.Unmapped<'typescript:for_header_let_const_kind'>
		| V.Unmapped<'typescript:for_header_lhs'>
		| V.Unmapped<'typescript:for_header_var_kind'>
		| V.Clause.Import.Wildcard<G>
		| V.Declaration.Variable<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| G['statement']; // prt only   // unmapped: <python:expression_statement_tuple> <python:import_list> <python:parenthesized_import_list> <rust:expression_statement_with_semi> <typescript:export_statement_default> <typescript:export_statement_equals_export> <typescript:export_statement_namespace_export> <typescript:export_statement_type_export> <typescript:for_header_let_const_kind> <typescript:for_header_lhs> <typescript:for_header_var_kind>
	readonly exceptClauses?: V.Clause.Except<G>[]; // p only
	readonly expression?:
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| G['statement']
		| (V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'] | G['statement'])[]; // prt only
	readonly expressions?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
	readonly finalizer?: V.Clause.Finally<G>; // pt only
	readonly fromClause?:
		| V.Unmapped<'typescript:import_statement_clause_from'>
		| V.Clause.Import.Require<G>
		| V.Literal.String<G>; // t only   // unmapped: <typescript:import_statement_clause_from>
	readonly handlers?: V.Clause.Catch<G>; // t only
	readonly importAttribute?: V.Clause.Import.Attribute<G>; // t only
	readonly importClause?: 'type' | 'typeof'; // t only
	readonly importList?: V.Unmapped<'python:import_list'>; // p only   // unmapped: <python:import_list>
	readonly inClause?: (G['expression'] | G['identifier'] | G['literal'] | G['pattern'])[]; // p only
	readonly increment?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
	readonly initializer?: G['declaration'] | G['expression'] | G['identifier'] | G['literal'] | V.Statement.Empty<G>; // t only
	readonly label?: G['identifier']; // rt only
	readonly left?: V.Unmapped<'python:pattern'> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // pr only   // unmapped: <python:pattern>
	readonly moduleName?: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>; // p only
	readonly name?: G['identifier']; // r only
	readonly names?: G['identifier'][]; // p only
	readonly object?: V.Expression.Parenthesized<G>; // t only
	readonly operator?: 'in' | 'of'; // t only
	readonly printArguments?: V.Unmapped<'python:print_arguments'>; // p only   // unmapped: <python:print_arguments>
	readonly printChevronArguments?: V.Unmapped<'python:print_chevron_arguments'>; // p only   // unmapped: <python:print_chevron_arguments> literal:Comma
	readonly right?:
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| G['statement']; // prt only
	readonly statements?: (
		| V.Statement.Block<G>
		| G['attribute']
		| V.Clause.Import.Alias<G>
		| G['declaration']
		| V.Expression.Call.Macro<G>
		| G['statement']
	)[]; // prt only
	readonly subject?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	readonly subjects?: V.Unmapped<'python:subjects'>; // p only   // unmapped: <python:subjects>
	readonly trailingExpression?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	readonly value?: V.Expression.Parenthesized<G>; // t only
	readonly visibility?: V.Modifier.Visibility<G>; // r only
	readonly withClause?: V.Clause.With<G>; // p only
}
export namespace Statement {
	export interface Assert<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly expression: (G['expression'] | G['identifier'] | G['literal'] | G['pattern'])[];
	}
	export interface Block<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly body?: V.Statement.Block<G>; // t only
		readonly label?: V.Identifier.Label<G>; // rt only
		readonly statements?: (
			| V.Statement.Block<G>
			| G['attribute']
			| V.Clause.Import.Alias<G>
			| G['declaration']
			| V.Expression.Call.Macro<G>
			| G['statement']
		)[];
		readonly trailingExpression?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	}
	export namespace Block {
		export interface Static<G extends GrammarContext> extends V.Statement.Block<G> {
			// claimed by t
			readonly body: V.Statement.Block<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Statement.Block<G> | V.Statement.Block.Static<G>;
	}
	export interface Break<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly expression?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly label?: G['identifier']; // rt only
	}
	export interface Continue<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly label?: G['identifier']; // rt only
	}
	export interface Debugger<G extends GrammarContext> extends V.Statement<G> {
		// claimed by t
		readonly label?: V.Identifier.Label<G>;
	}
	export interface Delete<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly expressions: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Empty<G extends GrammarContext> extends V.Statement<G> {
		// claimed by rt
		readonly label?: V.Identifier.Label<G>; // t only
	}
	export interface Exec<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly code: G['identifier'] | V.Literal.String<G>;
		readonly inClause?: (G['expression'] | G['identifier'] | G['literal'] | G['pattern'])[];
	}
	export interface Export<G extends GrammarContext> extends V.Statement<G> {
		// claimed by t
		readonly content:
			| V.Unmapped<'typescript:export_statement_default'>
			| V.Unmapped<'typescript:export_statement_equals_export'>
			| V.Unmapped<'typescript:export_statement_namespace_export'>
			| V.Unmapped<'typescript:export_statement_type_export'>; // unmapped: <typescript:export_statement_default> <typescript:export_statement_equals_export> <typescript:export_statement_namespace_export> <typescript:export_statement_type_export>
		readonly label?: V.Identifier.Label<G>;
	}
	export interface Expression<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly content?:
			| V.Unmapped<'python:expression_statement_tuple'>
			| V.Unmapped<'rust:expression_statement_with_semi'>
			| V.Declaration.Variable<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement']; // pr only   // unmapped: <python:expression_statement_tuple> <rust:expression_statement_with_semi>
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
		readonly label?: V.Identifier.Label<G>; // t only
	}
	export interface Global<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly names: G['identifier'][];
	}
	export interface If<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly alternative?: G['clause'] | G['clause'][];
		readonly condition:
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| V.Clause.Let.Kinds<G>
			| G['statement'];
		readonly consequence: V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement']; // unmapped: literal:_SuiteEmpty
		readonly label?: V.Identifier.Label<G>; // t only
	}
	export interface Import<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly alias?: G['identifier']; // r only
		readonly argument?: G['identifier'] | V.Clause.Import.Kinds<G>; // r only
		readonly content?:
			| V.Unmapped<'python:import_list'>
			| V.Unmapped<'python:parenthesized_import_list'>
			| V.Clause.Import.Wildcard<G>; // p only   // unmapped: <python:import_list> <python:parenthesized_import_list>
		readonly fromClause?:
			| V.Unmapped<'typescript:import_statement_clause_from'>
			| V.Clause.Import.Require<G>
			| V.Literal.String<G>; // t only   // unmapped: <typescript:import_statement_clause_from>
		readonly importAttribute?: V.Clause.Import.Attribute<G>; // t only
		readonly importClause?: 'type' | 'typeof'; // t only
		readonly importList?: V.Unmapped<'python:import_list'>; // p only   // unmapped: <python:import_list>
		readonly label?: V.Identifier.Label<G>; // t only
		readonly moduleName?: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>; // p only
		readonly name?: G['identifier']; // r only
		readonly visibility?: V.Modifier.Visibility<G>; // r only
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext> extends V.Statement.Import<G> {
			// claimed by r
			readonly alias?: G['identifier'];
			readonly name: G['identifier'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface From<G extends GrammarContext> extends V.Statement.Import<G> {
			// claimed by p
			readonly content:
				| V.Unmapped<'python:import_list'>
				| V.Unmapped<'python:parenthesized_import_list'>
				| V.Clause.Import.Wildcard<G>; // unmapped: <python:import_list> <python:parenthesized_import_list>
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>;
		}
		export interface Future<G extends GrammarContext> extends V.Statement.Import<G> {
			// claimed by p
			readonly content: V.Unmapped<'python:import_list'> | V.Unmapped<'python:parenthesized_import_list'>; // unmapped: <python:import_list> <python:parenthesized_import_list>
		}
		export type Kinds<G extends GrammarContext> =
			| V.Statement.Import<G>
			| V.Statement.Import.Crate<G>
			| V.Statement.Import.From<G>
			| V.Statement.Import.Future<G>;
	}
	export interface Loop<G extends GrammarContext> extends V.Statement<G> {
		// claimed by r
		readonly alternative?: V.Clause.Else<G>; // p only
		readonly async?: boolean; // p only
		readonly await?: boolean; // t only
		readonly body: V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement']; // prt only   // unmapped: literal:_SuiteEmpty
		readonly condition?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| V.Clause.Let.Kinds<G>
			| G['statement']; // prt only
		readonly content?:
			| V.Unmapped<'typescript:for_header_let_const_kind'>
			| V.Unmapped<'typescript:for_header_lhs'>
			| V.Unmapped<'typescript:for_header_var_kind'>; // t only   // unmapped: <typescript:for_header_let_const_kind> <typescript:for_header_lhs> <typescript:for_header_var_kind>
		readonly increment?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
		readonly initializer?: G['declaration'] | G['expression'] | G['identifier'] | G['literal'] | V.Statement.Empty<G>; // t only
		readonly label?: V.Identifier.Label<G>; // rt only
		readonly left?: V.Unmapped<'python:pattern'> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // pr only   // unmapped: <python:pattern>
		readonly operator?: 'in' | 'of'; // t only
		readonly right?:
			| V.Declaration.Module<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement']; // prt only
	}
	export namespace Loop {
		export interface Counted<G extends GrammarContext> extends V.Statement.Loop<G> {
			// claimed by t
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly condition:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Statement.Empty<G>;
			readonly increment?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly initializer: G['declaration'] | G['expression'] | G['identifier'] | G['literal'] | V.Statement.Empty<G>;
			readonly label?: V.Identifier.Label<G>;
		}
		export interface DoWhile<G extends GrammarContext> extends V.Statement.Loop<G> {
			// claimed by t
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly condition: V.Expression.Parenthesized<G>;
			readonly label?: V.Identifier.Label<G>;
		}
		export interface For<G extends GrammarContext> extends V.Statement.Loop<G> {
			// claimed by prt
			readonly alternative?: V.Clause.Else<G>; // p only
			readonly async?: boolean; // p only
			readonly await?: boolean; // t only
			readonly body: V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement']; // unmapped: literal:_SuiteEmpty
			readonly content?:
				| V.Unmapped<'typescript:for_header_let_const_kind'>
				| V.Unmapped<'typescript:for_header_lhs'>
				| V.Unmapped<'typescript:for_header_var_kind'>; // t only   // unmapped: <typescript:for_header_let_const_kind> <typescript:for_header_lhs> <typescript:for_header_var_kind>
			readonly label?: V.Identifier.Label<G>; // rt only
			readonly left?: V.Unmapped<'python:pattern'> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // pr only   // unmapped: <python:pattern>
			readonly operator?: 'in' | 'of'; // t only
			readonly right:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		}
		export interface While<G extends GrammarContext> extends V.Statement.Loop<G> {
			// claimed by prt
			readonly alternative?: V.Clause.Else<G>; // p only
			readonly body: V.Statement.Block<G> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement']; // unmapped: literal:_SuiteEmpty
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Clause.Let.Kinds<G>
				| G['statement'];
			readonly label?: V.Identifier.Label<G>; // rt only
		}
		export type Kinds<G extends GrammarContext> =
			| V.Statement.Loop<G>
			| V.Statement.Loop.Counted<G>
			| V.Statement.Loop.DoWhile<G>
			| V.Statement.Loop.For<G>
			| V.Statement.Loop.While<G>;
	}
	export interface Match<G extends GrammarContext> extends V.Statement<G> {
		// claimed by pr
		readonly body: V.Unmapped<'python:match_block'> | V.Unmapped<'rust:match_block'>; // unmapped: <python:match_block> <rust:match_block>
		readonly subject?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly subjects?: V.Unmapped<'python:subjects'>; // p only   // unmapped: <python:subjects>
	}
	export interface Nonlocal<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly names: G['identifier'][];
	}
	export interface Pass<G extends GrammarContext> extends V.Statement<G> {} // claimed by p
	export interface Print<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly chevron?: V.Clause.Print.Chevron<G>;
		readonly content?: V.Statement.Print.Kinds<G>;
		readonly printArguments?: V.Unmapped<'python:print_arguments'>; // unmapped: <python:print_arguments>
		readonly printChevronArguments?: V.Unmapped<'python:print_chevron_arguments'>; // unmapped: <python:print_chevron_arguments> literal:Comma
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext> extends V.Statement.Print<G> {
			// claimed by p
			readonly chevron: V.Clause.Print.Chevron<G>;
			readonly printChevronArguments?: V.Unmapped<'python:print_chevron_arguments'>; // unmapped: <python:print_chevron_arguments> literal:Comma
		}
		export type Kinds<G extends GrammarContext> = V.Statement.Print<G> | V.Statement.Print.Chevron<G>;
	}
	export interface Return<G extends GrammarContext> extends V.Statement<G> {
		// claimed by prt
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement']; // rt only
		readonly expressions?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
		readonly label?: V.Identifier.Label<G>; // t only
	}
	export interface Scope<G extends GrammarContext> extends V.Statement<G> {
		// claimed by t
		readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		readonly label?: V.Identifier.Label<G>;
		readonly object: V.Expression.Parenthesized<G>;
	}
	export interface Switch<G extends GrammarContext> extends V.Statement<G> {
		// claimed by t
		readonly body: V.Clause.Case<G>[];
		readonly label?: V.Identifier.Label<G>;
		readonly value: V.Expression.Parenthesized<G>;
	}
	export interface Throw<G extends GrammarContext> extends V.Statement<G> {
		// claimed by pt
		readonly cause?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
		readonly expressions?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
		readonly label?: V.Identifier.Label<G>; // t only
	}
	export interface Try<G extends GrammarContext> extends V.Statement<G> {
		// claimed by pt
		readonly alternative?: V.Clause.Else<G>; // p only
		readonly body: V.Statement.Block<G>; // unmapped: literal:_SuiteEmpty
		readonly exceptClauses?: V.Clause.Except<G>[]; // p only
		readonly finalizer?: V.Clause.Finally<G>;
		readonly handlers?: V.Clause.Catch<G>; // t only
		readonly label?: V.Identifier.Label<G>; // t only
	}
	export interface With<G extends GrammarContext> extends V.Statement<G> {
		// claimed by p
		readonly async?: boolean;
		readonly body: V.Statement.Block<G>; // unmapped: literal:_SuiteEmpty
		readonly withClause: V.Clause.With<G>;
	}
	export type Kinds<G extends GrammarContext> =
		| V.Statement.Assert<G>
		| V.Statement.Block<G>
		| V.Statement.Block.Static<G>
		| V.Statement.Break<G>
		| V.Statement.Continue<G>
		| V.Statement.Debugger<G>
		| V.Statement.Delete<G>
		| V.Statement.Empty<G>
		| V.Statement.Exec<G>
		| V.Statement.Export<G>
		| V.Statement.Expression<G>
		| V.Statement.Global<G>
		| V.Statement.If<G>
		| V.Statement.Import<G>
		| V.Statement.Import.Crate<G>
		| V.Statement.Import.From<G>
		| V.Statement.Import.Future<G>
		| V.Statement.Loop<G>
		| V.Statement.Loop.Counted<G>
		| V.Statement.Loop.DoWhile<G>
		| V.Statement.Loop.For<G>
		| V.Statement.Loop.While<G>
		| V.Statement.Match<G>
		| V.Statement.Nonlocal<G>
		| V.Statement.Pass<G>
		| V.Statement.Print<G>
		| V.Statement.Print.Chevron<G>
		| V.Statement.Return<G>
		| V.Statement.Scope<G>
		| V.Statement.Switch<G>
		| V.Statement.Throw<G>
		| V.Statement.Try<G>
		| V.Statement.With<G>;
}
