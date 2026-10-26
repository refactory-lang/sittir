import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface As<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.as';
		readonly name: G['identifier'];
		readonly pattern: G['slots']['pattern.as']['pattern'];
	}
	export interface Map<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.map';
		readonly elements?: G['slots']['pattern.map']['elements'][];
	}
	export interface Or<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.or';
		readonly left?: G['slots']['pattern.or']['left'];
		readonly right: G['slots']['pattern.or']['right'];
	}
}
