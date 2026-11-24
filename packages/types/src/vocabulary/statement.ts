import type { GrammarMap, Slot, Text } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Statement<G extends GrammarMap, K extends Under<'statement'> = 'statement'> {
	readonly $path: K;
}

export interface StatementSynonyms {
	readonly empty: 'pass';
	readonly import: 'use';
	readonly package: 'crate';
	readonly resource: 'using';
	readonly throw: 'raise';
}

export namespace Statement {
	export type Declaration<G extends GrammarMap> = V.Declaration.Any<G>;
	export type Expression<G extends GrammarMap> = V.Expression.Any<G>;
	export interface Block<G extends GrammarMap, K extends Under<'statement.block'> = 'statement.block'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
	}
	export interface Break<G extends GrammarMap, K extends Under<'statement.break'> = 'statement.break'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
	}
	export interface Continue<G extends GrammarMap, K extends Under<'statement.continue'> = 'statement.continue'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
	}
	// claimed by prt
	export type Empty<G extends GrammarMap> = Text<G, 'statement.empty'>;
	export interface If<G extends GrammarMap, K extends Under<'statement.if'> = 'statement.if'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly condition: Slot<G, K, 'condition', V.Expression.AnyWithLet<G>>;
		readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
	}
	export interface Loop<G extends GrammarMap, K extends Under<'statement.loop'> = 'statement.loop'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
		// prt only
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> extends SubKindOf<V.Statement.Loop<G, K>, 'label' | 'statements'> {
			// claimed by prt
			readonly $path: K;
			readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
		}
		export interface While<G extends GrammarMap, K extends Under<'statement.loop.while'> = 'statement.loop.while'> extends SubKindOf<V.Statement.Loop<G, K>, 'label' | 'statements'> {
			// claimed by prt
			readonly $path: K;
			readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
			readonly condition: Slot<G, K, 'condition', V.Expression.AnyWithLet<G>>;
		}
	}
	export interface Return<G extends GrammarMap, K extends Under<'statement.return'> = 'statement.return'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly expression?: Slot<G, K, 'expression', V.Expression.Any<G>>;
	}
}
