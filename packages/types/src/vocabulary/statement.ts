import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Statement<G extends GrammarContext<G>> {
	readonly $kind: 'statement';
}

export namespace Statement {
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
	export interface Delete<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.delete';
		readonly expressions: G['slots']['statement.delete']['expressions'];
	}
	export interface Empty<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.empty';
	}
	export interface Expression<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.expression';
		readonly content?: G['slots']['statement.expression']['content'] | G['slots']['statement.expression']['content'][];
		// pr only
		readonly expression?: G['slots']['statement.expression']['expression'];
		// t only
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
		export interface ForEach<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Loop<G>> {
			// claimed by prt
			readonly $kind: 'statement.loop.for_each';
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: G['slots']['statement.loop.for_each']['body'];
			readonly header?: G['slots']['statement.loop.for_each']['header'];
			// t only
			readonly left?: G['slots']['statement.loop.for_each']['left'];
			// pr only
			readonly right?: G['slots']['statement.loop.for_each']['right'];
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
	export interface Return<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.return';
		readonly expression?: G['slots']['statement.return']['expression'];
	}
}
