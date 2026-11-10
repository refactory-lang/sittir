import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Clause<G extends GrammarMap, K extends Under<'clause'> = 'clause'> {
	readonly $path: K;
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
		readonly $path: K;
	}
	export interface Else<G extends GrammarMap, K extends Under<'clause.else'> = 'clause.else'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly body: Slot<G, K, 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
	}
}
