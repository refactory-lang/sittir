import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Clause<G extends GrammarMap> {
	readonly $kind: 'clause';
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
	export interface Case<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.case';
	}
	export interface Else<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by prt
		readonly $kind: 'clause.else';
		readonly body: Slot<G, 'clause.else', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
	}
	export interface ElseIf<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.else_if';
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
