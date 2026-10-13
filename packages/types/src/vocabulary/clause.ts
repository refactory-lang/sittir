import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Clause<G extends GrammarContext<G>> {
	readonly $kind: 'clause';
}

export namespace Clause {
	export interface Case<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.case';
	}
	export interface Else<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by prt
		readonly $kind: 'clause.else';
		readonly body: G['slots']['clause.else']['body'];
	}
	export interface ElseIf<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.else_if';
		readonly condition: G['slots']['clause.else_if']['condition'];
		readonly consequence: G['slots']['clause.else_if']['consequence'];
	}
}
