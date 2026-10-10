import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Statement<G extends GrammarContext<G>> {
	readonly $kind: 'statement';
}

export namespace Statement {
	export interface Assert<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.assert';
		readonly expressions: G['slots']['statement.assert']['expressions'][];
	}
	export interface Block<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.block';
		readonly statements?: G['slots']['statement.block']['statements'][];
		readonly trailingExpression?: G['slots']['statement.block']['trailingExpression'];
		// r only
	}
	export interface Break<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.break';
		readonly expression?: G['slots']['statement.break']['expression'];
		// r only
	}
	export interface Continue<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.continue';
	}
	export interface Debugger<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.debugger';
	}
	export interface Delete<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.delete';
		readonly expressions: G['slots']['statement.delete']['expressions'];
	}
	export interface Empty<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by rt
		readonly $kind: 'statement.empty';
	}
	export interface Exec<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.exec';
		readonly code: G['slots']['statement.exec']['code'];
		readonly inClauses?: G['slots']['statement.exec']['inClauses'][];
	}
	export interface Expression<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.expression';
		readonly content?: G['slots']['statement.expression']['content'] | G['slots']['statement.expression']['content'][];
		// pr only
		readonly expression?: G['slots']['statement.expression']['expression'];
		// t only
	}
	export interface Global<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.global';
		readonly names: G['identifier'][];
	}
	export interface If<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.if';
		readonly alternative?: V.Clause.Else<G>;
		// rt only
		readonly alternatives?: G['clause'][];
		// p only
		readonly condition: G['slots']['statement.if']['condition'];
		readonly consequence: G['slots']['statement.if']['consequence'];
	}
	export interface Loop<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by r
		readonly $kind: 'statement.loop';
		readonly body: G['slots']['statement.loop']['body'];
		// prt only
	}
	export namespace Loop {
		export interface For<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by prt
			readonly $kind: 'statement.loop.for';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: G['slots']['statement.loop.for']['body'];
			readonly forHeader?: G['slots']['statement.loop.for']['forHeader'];
			// t only
			readonly left?: G['slots']['statement.loop.for']['left'];
			// pr only
			readonly right?: G['slots']['statement.loop.for']['right'];
			// pr only
		}
		export interface While<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by prt
			readonly $kind: 'statement.loop.while';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: G['slots']['statement.loop.while']['body'];
			readonly condition: G['slots']['statement.loop.while']['condition'];
		}
	}
	export interface Nonlocal<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.nonlocal';
		readonly names: G['identifier'][];
	}
	export interface Pass<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.pass';
	}
	export interface Print<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.print';
		readonly content?: V.Statement.Print.Any<G>;
		readonly printArguments?: G['slots']['statement.print']['printArguments'][];
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Print<G>> {
			// claimed by p
			readonly $kind: 'statement.print.chevron';
			readonly chevron: V.Clause.Print.Chevron<G>;
			readonly printChevronArguments?:
				| G['slots']['statement.print.chevron']['printChevronArguments']
				| G['slots']['statement.print.chevron']['printChevronArguments'][];
		}
	}
	export interface Return<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.return';
		readonly expression?: G['slots']['statement.return']['expression'];
	}
	export interface Scope<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.scope';
		readonly body: G['slots']['statement.scope']['body'];
		readonly object: V.Expression.Parenthesized<G>;
	}
}
