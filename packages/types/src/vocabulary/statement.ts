// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Statement<G extends GrammarContext> {
	readonly $kind: 'statement';
}

export namespace Statement {
	export interface Assert<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.assert';
		readonly expressions: G['slots']['statement.assert']['expressions'][];
	}
	export interface Block<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.block';
		readonly label?: V.Identifier.Label<G>;
		// r only
		readonly statements?: G['slots']['statement.block']['statements'][];
		readonly trailingExpression?: G['slots']['statement.block']['trailingExpression'];
		// r only
	}
	export namespace Block {
		export interface Static<G extends GrammarContext> extends SubKindOf<V.Statement.Block<G>> {
			// claimed by t
			readonly $kind: 'statement.block.static';
			readonly body: V.Statement.Block<G>;
		}
		export type Any<G extends GrammarContext> = V.Statement.Block<G> | V.Statement.Block.Static<G>;
	}
	export interface Break<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.break';
		readonly expression?: G['slots']['statement.break']['expression'];
		// r only
		readonly label?: V.Identifier.Label<G>;
		// rt only
	}
	export interface Continue<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.continue';
		readonly label?: V.Identifier.Label<G>;
		// rt only
	}
	export interface Debugger<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.debugger';
	}
	export interface Delete<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.delete';
		readonly expressions: G['slots']['statement.delete']['expressions'];
	}
	export interface Empty<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by rt
		readonly $kind: 'statement.empty';
	}
	export interface Exec<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.exec';
		readonly code: G['slots']['statement.exec']['code'];
		readonly inClauses?: G['slots']['statement.exec']['inClauses'][];
	}
	export interface Export<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.export';
	}
	export interface Expression<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.expression';
		readonly content?: G['slots']['statement.expression']['content'] | G['slots']['statement.expression']['content'][];
		// pr only
		readonly expression?: G['slots']['statement.expression']['expression'];
		// t only
	}
	export interface Global<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.global';
		readonly names: G['identifier'][];
	}
	export interface If<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.if';
		readonly alternative?: V.Clause.Else<G>;
		// rt only
		readonly alternatives?: G['clause'][];
		// p only
		readonly condition: G['slots']['statement.if']['condition'];
		readonly consequence: G['slots']['statement.if']['consequence'];
	}
	export interface Import<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.import';
		readonly argument?: G['slots']['statement.import']['argument'];
		// r only
		readonly fromClause?: G['slots']['statement.import']['fromClause'];
		// t only
		readonly importAttribute?: V.Clause.Import.Attribute<G>;
		// t only
		readonly importClause?: G['slots']['statement.import']['importClause'];
		// t only
		readonly names?: (V.Clause.Import.Alias<G> | V.Identifier.Dotted<G>)[];
		// p only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by r
			readonly $kind: 'statement.import.crate';
			readonly alias?: G['identifier'];
			readonly name: G['identifier'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface From<G extends GrammarContext> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by p
			readonly $kind: 'statement.import.from';
			readonly content:
				| V.Identifier.Dotted<G>
				| V.Clause.Import.Any<G>
				| (V.Identifier.Dotted<G> | V.Clause.Import.Any<G>)[];
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>;
		}
		export interface Future<G extends GrammarContext> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by p
			readonly $kind: 'statement.import.future';
			readonly content: (V.Clause.Import.Alias<G> | V.Identifier.Dotted<G>)[];
		}
		export type Any<G extends GrammarContext> =
			| V.Statement.Import<G>
			| V.Statement.Import.Crate<G>
			| V.Statement.Import.From<G>
			| V.Statement.Import.Future<G>;
	}
	export interface Labeled<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.labeled';
		readonly body: G['slots']['statement.labeled']['body'];
		readonly label: G['slots']['statement.labeled']['label'];
	}
	export interface Loop<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by r
		readonly $kind: 'statement.loop';
		readonly body: G['slots']['statement.loop']['body'];
		// prt only
		readonly label?: V.Identifier.Label<G>;
	}
	export namespace Loop {
		export interface Counted<G extends GrammarContext> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by t
			readonly $kind: 'statement.loop.counted';
			readonly body: G['slots']['statement.loop.counted']['body'];
			readonly condition: G['slots']['statement.loop.counted']['condition'];
			readonly increment?: G['slots']['statement.loop.counted']['increment'];
			readonly initializer: G['slots']['statement.loop.counted']['initializer'];
		}
		export interface DoWhile<G extends GrammarContext> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by t
			readonly $kind: 'statement.loop.do_while';
			readonly body: G['slots']['statement.loop.do_while']['body'];
			readonly condition: V.Expression.Parenthesized<G>;
		}
		export interface For<G extends GrammarContext> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by prt
			readonly $kind: 'statement.loop.for';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly async?: boolean;
			// p only
			readonly await?: boolean;
			// t only
			readonly body: G['slots']['statement.loop.for']['body'];
			readonly forHeader?: G['slots']['statement.loop.for']['forHeader'];
			// t only
			readonly label?: V.Identifier.Label<G>;
			// r only
			readonly left?: G['slots']['statement.loop.for']['left'];
			// pr only
			readonly right?: G['slots']['statement.loop.for']['right'];
			// pr only
		}
		export interface While<G extends GrammarContext> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by prt
			readonly $kind: 'statement.loop.while';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: G['slots']['statement.loop.while']['body'];
			readonly condition: G['slots']['statement.loop.while']['condition'];
			readonly label?: V.Identifier.Label<G>;
			// r only
		}
		export type Any<G extends GrammarContext> =
			| V.Statement.Loop<G>
			| V.Statement.Loop.Counted<G>
			| V.Statement.Loop.DoWhile<G>
			| V.Statement.Loop.For<G>
			| V.Statement.Loop.While<G>;
	}
	export interface Match<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by pr
		readonly $kind: 'statement.match';
		readonly body: G['slots']['statement.match']['body'] | G['slots']['statement.match']['body'][];
		readonly subject?: G['slots']['statement.match']['subject'] | G['slots']['statement.match']['subject'][];
	}
	export interface Nonlocal<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.nonlocal';
		readonly names: G['identifier'][];
	}
	export interface Pass<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.pass';
	}
	export interface Print<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.print';
		readonly content?: V.Statement.Print.Any<G>;
		readonly printArguments?: G['slots']['statement.print']['printArguments'][];
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext> extends SubKindOf<V.Statement.Print<G>> {
			// claimed by p
			readonly $kind: 'statement.print.chevron';
			readonly chevron: V.Clause.Print.Chevron<G>;
			readonly printChevronArguments?:
				| G['slots']['statement.print.chevron']['printChevronArguments']
				| G['slots']['statement.print.chevron']['printChevronArguments'][];
		}
		export type Any<G extends GrammarContext> = V.Statement.Print<G> | V.Statement.Print.Chevron<G>;
	}
	export interface Return<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.return';
		readonly expression?: G['slots']['statement.return']['expression'];
	}
	export interface Scope<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.scope';
		readonly body: G['slots']['statement.scope']['body'];
		readonly object: V.Expression.Parenthesized<G>;
	}
	export interface Switch<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.switch';
		readonly body: V.Clause.Case.Any<G>[];
		readonly value: V.Expression.Parenthesized<G>;
	}
	export interface Throw<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by pt
		readonly $kind: 'statement.throw';
		readonly cause?: G['slots']['statement.throw']['cause'];
		// p only
		readonly expression?: G['slots']['statement.throw']['expression'];
	}
	export interface Try<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by pt
		readonly $kind: 'statement.try';
		readonly alternative?: V.Clause.Else<G>;
		// p only
		readonly body: G['slots']['statement.try']['body'];
		readonly finalizer?: V.Clause.Finally<G>;
		readonly handlers?: G['clause'] | G['clause'][];
	}
	export interface With<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.with';
		readonly async?: boolean;
		readonly body: G['slots']['statement.with']['body'];
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
		| V.Statement.Labeled<G>
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
