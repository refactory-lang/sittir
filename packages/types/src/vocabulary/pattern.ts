import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Pattern<G extends GrammarContext<G>> {
	readonly $kind: 'pattern';
}

export namespace Pattern {
	export interface As<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.as';
		readonly alias: G['slots']['pattern.as']['alias'];
		readonly expression: G['slots']['pattern.as']['expression'];
	}
	export interface Mutable<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.mutable';
		readonly pattern: G['slots']['pattern.mutable']['pattern'];
	}
}
