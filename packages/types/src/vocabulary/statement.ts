import type { GrammarMap, Slot, Text } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Statement<G extends GrammarMap> {
	readonly $kind: 'statement';
}

export interface StatementSynonyms {
	readonly empty: 'pass';
	readonly import: 'use';
	readonly package: 'crate';
	readonly resource: 'using';
	readonly throw: 'raise';
}

export namespace Statement {
	export interface Block<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.block';
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
	export interface Break<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.break';
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
	export interface Continue<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.continue';
	}
	export interface Delete<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.delete';
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
	export interface Expression<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.expression';
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
	export interface If<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.if';
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
	export interface Loop<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by r
		readonly $kind: 'statement.loop';
		readonly body: Slot<G, 'statement.loop', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		// prt only
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap> extends SubKindOf<V.Statement.Loop<G>, 'body'> {
			// claimed by prt
			readonly $kind: 'statement.loop.for_each';
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
		export interface While<G extends GrammarMap> extends SubKindOf<V.Statement.Loop<G>, 'body'> {
			// claimed by prt
			readonly $kind: 'statement.loop.while';
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
	export interface Return<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.return';
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
