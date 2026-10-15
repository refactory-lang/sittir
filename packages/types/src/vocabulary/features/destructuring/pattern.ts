import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Assignment<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.assignment';
		readonly left: G['slots']['pattern.assignment']['left'];
		readonly right: G['slots']['pattern.assignment']['right'];
	}
	export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by prt
		readonly $kind: 'pattern.list';
		readonly elements?: G['slots']['pattern.list']['elements'][];
	}
	export interface Object<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.object';
		readonly properties?: G['slots']['pattern.object']['properties'][];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Object<G>> {
			// claimed by t
			readonly $kind: 'pattern.object.assignment';
			readonly left: G['slots']['pattern.object.assignment']['left'];
			readonly right: G['slots']['pattern.object.assignment']['right'];
		}
		export interface Pair<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Object<G>> {
			// claimed by t
			readonly $kind: 'pattern.object.pair';
			readonly key: G['slots']['pattern.object.pair']['key'];
			readonly value?: G['slots']['pattern.object.pair']['value'];
		}
	}
	export interface Rest<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by pt
		readonly $kind: 'pattern.rest';
		readonly pattern: G['slots']['pattern.rest']['pattern'];
	}
	export namespace Rest {
		export interface Map<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Rest<G>> {
			// claimed by p
			readonly $kind: 'pattern.rest.map';
		}
	}
	export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.tuple';
		readonly elements?: G['slots']['pattern.tuple']['elements'][];
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Tuple<G>> {
			// claimed by p
			readonly $kind: 'pattern.tuple.bare';
		}
	}
	export interface Wildcard<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.wildcard';
	}
}
