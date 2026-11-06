import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Clause<G extends GrammarMap, K extends Under<'clause'> = 'clause'> {
	readonly $kind: K;
}

export interface ClauseSynonyms {
	readonly bounds: 'constraint';
	readonly case: 'arm';
	readonly catch: 'except' | 'rescue';
	readonly else_if: 'elif' | 'elsif' | 'elseif';
	readonly finally: 'ensure';
	readonly resource: 'using';
	readonly wildcard: 'glob';
}

export namespace Clause {
	export interface Case<G extends GrammarMap, K extends Under<'clause.case'> = 'clause.case'> extends SubKindOf<V.Clause<G, K>> {
		readonly $kind: K;
	}
	export interface Else<G extends GrammarMap, K extends Under<'clause.else'> = 'clause.else'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly body: Slot<G, 'clause.else', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
	}
	export interface ElseIf<G extends GrammarMap, K extends Under<'clause.else_if'> = 'clause.else_if'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by p
		readonly $kind: K;
		readonly condition: Slot<
			G,
			'clause.else_if',
			'condition',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly consequence: Slot<G, 'clause.else_if', 'consequence', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
	}
}
