// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type { Simplify } from 'type-fest';

import type { SubKindOf } from './utils.ts';

import type * as V from './index.ts';

export interface Statement<G extends GrammarContext> {
	readonly kind: 'statement';
}

export namespace Statement {
	export interface Assert<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.assert';
		readonly expressions: (G['expression'] | G['identifier'] | G['literal'] | G['pattern'])[];
	}
	export interface Block<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.block';
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
		// rt only
		readonly statements?: (
			| V.Statement.Block<G>
			| G['attribute']
			| V.Clause.Import.Alias<G>
			| G['declaration']
			| V.Expression.Call.Macro<G>
			| G['statement']
		)[];
		readonly trailingExpression?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
	}
	export namespace Block {
		export interface Static<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Block<G>>> {
			// claimed by t
			readonly kind: 'statement.block.static';
			readonly body: V.Statement.Block<G>;
		}
		export type Any<G extends GrammarContext> = V.Statement.Block<G> | V.Statement.Block.Static<G>;
	}
	export interface Break<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.break';
		readonly expression?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
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
		// rt only
	}
	export interface Continue<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.continue';
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
		// rt only
	}
	export interface Debugger<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by t
		readonly kind: 'statement.debugger';
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
	}
	export interface Delete<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.delete';
		readonly expressions: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Empty<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by rt
		readonly kind: 'statement.empty';
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
	}
	export interface Exec<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.exec';
		readonly code: G['identifier'] | V.Literal.String<G>;
		readonly inClauses?: (G['expression'] | G['identifier'] | G['literal'] | G['pattern'])[];
	}
	export interface Export<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by t
		readonly kind: 'statement.export';
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
	}
	export interface Expression<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.expression';
		readonly content?:
			| V.Unmapped<'python:expression_statement_tuple'>
			| V.Unmapped<'rust:expression_statement_with_semi'>
			| V.Declaration.Variable<G>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| G['statement'];
		// pr only
		// unmapped: <python:expression_statement_tuple> <rust:expression_statement_with_semi>
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
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
	}
	export interface Global<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.global';
		readonly names: G['identifier'][];
	}
	export interface If<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.if';
		readonly alternative?: V.Clause.Else<G>;
		// rt only
		readonly alternatives?: G['clause'][];
		// p only
		readonly condition:
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']
			| V.Clause.Let.Any<G>
			| G['statement'];
		readonly consequence: V.Unmapped<'python:suite'> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		// unmapped: <python:suite>
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
	}
	export interface Import<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.import';
		readonly argument?:
			| G['identifier']
			| V.Clause.Import.Any<G>
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
		// r only
		readonly fromClause?:
			| V.Unmapped<'typescript:import_statement_clause_from'>
			| V.Clause.Import.Require<G>
			| V.Literal.String<G>;
		// t only
		// unmapped: <typescript:import_statement_clause_from>
		readonly importAttribute?: V.Clause.Import.Attribute<G>;
		// t only
		readonly importClause?: 'type' | 'typeof';
		// t only
		readonly importList?: V.Unmapped<'python:import_list'>;
		// p only
		// unmapped: <python:import_list>
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
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Import<G>>> {
			// claimed by r
			readonly kind: 'statement.import.crate';
			readonly alias?: G['identifier'];
			readonly name: G['identifier'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface From<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Import<G>>> {
			// claimed by p
			readonly kind: 'statement.import.from';
			readonly content:
				| V.Unmapped<'python:import_list'>
				| V.Unmapped<'python:parenthesized_import_list'>
				| V.Clause.Import.Wildcard<G>;
			// unmapped: <python:import_list> <python:parenthesized_import_list>
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>;
		}
		export interface Future<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Import<G>>> {
			// claimed by p
			readonly kind: 'statement.import.future';
			readonly content: V.Unmapped<'python:import_list'> | V.Unmapped<'python:parenthesized_import_list'>;
			// unmapped: <python:import_list> <python:parenthesized_import_list>
		}
		export type Any<G extends GrammarContext> =
			| V.Statement.Import<G>
			| V.Statement.Import.Crate<G>
			| V.Statement.Import.From<G>
			| V.Statement.Import.Future<G>;
	}
	export interface Loop<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by r
		readonly kind: 'statement.loop';
		readonly body: V.Unmapped<'python:suite'> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		// prt only
		// unmapped: <python:suite>
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
		// rt only
	}
	export namespace Loop {
		export interface Counted<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Loop<G>>> {
			// claimed by t
			readonly kind: 'statement.loop.counted';
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly condition:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Statement.Empty<G>;
			readonly increment?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly initializer: G['declaration'] | G['expression'] | G['identifier'] | G['literal'] | V.Statement.Empty<G>;
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
		}
		export interface DoWhile<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Loop<G>>> {
			// claimed by t
			readonly kind: 'statement.loop.do_while';
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly condition: V.Expression.Parenthesized<G>;
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
		}
		export interface For<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Loop<G>>> {
			// claimed by prt
			readonly kind: 'statement.loop.for';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly async?: boolean;
			// p only
			readonly await?: boolean;
			// t only
			readonly body: V.Unmapped<'python:suite'> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			// unmapped: <python:suite>
			readonly forHeader?: V.Unmapped<'typescript:for_header'>;
			// t only
			// unmapped: <typescript:for_header>
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
			// rt only
			readonly left?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			// pr only
			readonly right?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'] | G['statement'];
			// pr only
		}
		export interface While<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Loop<G>>> {
			// claimed by prt
			readonly kind: 'statement.loop.while';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: V.Unmapped<'python:suite'> | V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			// unmapped: <python:suite>
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Clause.Let.Any<G>
				| G['statement'];
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
			// rt only
		}
		export type Any<G extends GrammarContext> =
			| V.Statement.Loop<G>
			| V.Statement.Loop.Counted<G>
			| V.Statement.Loop.DoWhile<G>
			| V.Statement.Loop.For<G>
			| V.Statement.Loop.While<G>;
	}
	export interface Match<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by pr
		readonly kind: 'statement.match';
		readonly body: V.Unmapped<'python:match_block'> | V.Unmapped<'rust:match_block'>;
		// unmapped: <python:match_block> <rust:match_block>
		readonly subject?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
		readonly subjects?: V.Unmapped<'python:subjects'>;
		// p only
		// unmapped: <python:subjects>
	}
	export interface Nonlocal<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.nonlocal';
		readonly names: G['identifier'][];
	}
	export interface Pass<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.pass';
	}
	export interface Print<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.print';
		readonly content?: V.Statement.Print.Any<G>;
		readonly printArguments?: V.Unmapped<'python:print_arguments'>;
		// unmapped: <python:print_arguments>
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement.Print<G>>> {
			// claimed by p
			readonly kind: 'statement.print.chevron';
			readonly chevron: V.Clause.Print.Chevron<G>;
			readonly printChevronArguments?: V.Unmapped<'python:print_chevron_arguments'> | ',';
			// unmapped: <python:print_chevron_arguments>
		}
		export type Any<G extends GrammarContext> = V.Statement.Print<G> | V.Statement.Print.Chevron<G>;
	}
	export interface Return<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by prt
		readonly kind: 'statement.return';
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// rt only
		readonly expressions?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// p only
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
	}
	export interface Scope<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by t
		readonly kind: 'statement.scope';
		readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
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
		readonly object: V.Expression.Parenthesized<G>;
	}
	export interface Switch<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by t
		readonly kind: 'statement.switch';
		readonly body: V.Clause.Case<G>[];
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
		readonly value: V.Expression.Parenthesized<G>;
	}
	export interface Throw<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by pt
		readonly kind: 'statement.throw';
		readonly cause?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// p only
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		// t only
		readonly expressions?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// p only
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
	}
	export interface Try<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by pt
		readonly kind: 'statement.try';
		readonly alternative?: V.Clause.Else<G>;
		// p only
		readonly body: V.Unmapped<'python:suite'> | V.Statement.Block<G>;
		// unmapped: <python:suite>
		readonly exceptClauses?: V.Clause.Except<G>[];
		// p only
		readonly finalizer?: V.Clause.Finally<G>;
		readonly handlers?: V.Clause.Catch<G>;
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
	}
	export interface With<G extends GrammarContext> extends Simplify<SubKindOf<V.Statement<G>>> {
		// claimed by p
		readonly kind: 'statement.with';
		readonly async?: boolean;
		readonly body: V.Unmapped<'python:suite'>;
		// unmapped: <python:suite>
		readonly withClause: V.Clause.With<G>;
	}
	export type Any<G extends GrammarContext> =
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
