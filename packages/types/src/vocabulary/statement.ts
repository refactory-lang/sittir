import type { GrammarMap, Slot, Text } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Statement<G extends GrammarMap, K extends Under<'statement'> = 'statement'> {
	readonly $kind: K;
}

export interface StatementSynonyms {
	readonly empty: 'pass';
	readonly import: 'use';
	readonly package: 'crate';
	readonly resource: 'using';
	readonly throw: 'raise';
}

export namespace Statement {
	export interface Block<G extends GrammarMap, K extends Under<'statement.block'> = 'statement.block'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly statements?: Slot<
			G,
			'statement.block',
			'statements',
			| V.Attribute.Any<G>
			| V.Declaration.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Statement.Any<G>
		>[];
		readonly trailingExpression?: Slot<
			G,
			'statement.block',
			'trailingExpression',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
	export interface Break<G extends GrammarMap, K extends Under<'statement.break'> = 'statement.break'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly expression?: Slot<
			G,
			'statement.break',
			'expression',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
	export interface Continue<G extends GrammarMap, K extends Under<'statement.continue'> = 'statement.continue'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
	}
	export interface Delete<G extends GrammarMap, K extends Under<'statement.delete'> = 'statement.delete'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $kind: K;
		readonly expressions: Slot<
			G,
			'statement.delete',
			'expressions',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	// claimed by prt
	export type Empty<G extends GrammarMap> = Text<G, 'statement.empty'>;
	export interface Expression<G extends GrammarMap, K extends Under<'statement.expression'> = 'statement.expression'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly content?: Slot<
			G,
			'statement.expression',
			'content',
			| V.Declaration.Variable<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| V.Declaration.Constant<G>
		> | Slot<
			G,
			'statement.expression',
			'content',
			| V.Declaration.Variable<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| V.Declaration.Constant<G>
		>[];
		// pr only
		readonly expression?: Slot<
			G,
			'statement.expression',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		// t only
	}
	export interface If<G extends GrammarMap, K extends Under<'statement.if'> = 'statement.if'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly alternative?: V.Clause.Else<G>;
		// rt only
		readonly alternatives?: Slot<G, 'statement.if', 'alternatives', V.Clause.Any<G>>[];
		// p only
		readonly condition: Slot<
			G,
			'statement.if',
			'condition',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Clause.Let.Any<G>
			| V.Statement.Any<G>
		>;
		readonly consequence: Slot<G, 'statement.if', 'consequence', V.Declaration.Any<G> | V.Statement.Any<G>>;
	}
	export interface Loop<G extends GrammarMap, K extends Under<'statement.loop'> = 'statement.loop'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly body: Slot<G, 'statement.loop', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		// prt only
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> extends SubKindOf<V.Statement.Loop<G, K>, 'body'> {
			// claimed by prt
			readonly $kind: K;
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: Slot<G, 'statement.loop.for_each', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
			readonly header?: Slot<G, 'statement.loop.for_each', 'header', unknown>;
			// t only
			readonly left?: Slot<G, 'statement.loop.for_each', 'left', unknown>;
			// pr only
			readonly right?: Slot<
				G,
				'statement.loop.for_each',
				'right',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Statement.Any<G>
			>;
			// pr only
		}
		export interface While<G extends GrammarMap, K extends Under<'statement.loop.while'> = 'statement.loop.while'> extends SubKindOf<V.Statement.Loop<G, K>, 'body'> {
			// claimed by prt
			readonly $kind: K;
			readonly alternative?: V.Clause.Else<G>;
			// p only
			readonly body: Slot<G, 'statement.loop.while', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
			readonly condition: Slot<
				G,
				'statement.loop.while',
				'condition',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Clause.Let.Any<G>
				| V.Statement.Any<G>
			>;
		}
	}
	export interface Return<G extends GrammarMap, K extends Under<'statement.return'> = 'statement.return'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly expression?: Slot<
			G,
			'statement.return',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
}
