import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Array<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.array';
		readonly elements?: G['slots']['pattern.array']['elements'][];
	}
	export interface Assignment<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.assignment';
		readonly left: G['slots']['pattern.assignment']['left'];
		readonly right: G['slots']['pattern.assignment']['right'];
	}
	export interface List<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.list';
		readonly patterns?: G['slots']['pattern.list']['patterns'][];
	}
	export interface Object<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.object';
		readonly properties?: G['slots']['pattern.object']['properties'][];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarContext> extends SubKindOf<V.Pattern.Object<G>> {
			readonly $kind: 'pattern.object.assignment';
			readonly left: G['slots']['pattern.object.assignment']['left'];
			readonly right: G['slots']['pattern.object.assignment']['right'];
		}
		export interface Pair<G extends GrammarContext> extends SubKindOf<V.Pattern.Object<G>> {
			readonly $kind: 'pattern.object.pair';
			readonly key: G['slots']['pattern.object.pair']['key'];
			readonly value: G['slots']['pattern.object.pair']['value'];
		}
	}
	export interface Rest<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.rest';
		readonly lhsExpression: G['slots']['pattern.rest']['lhsExpression'];
	}
	export interface Slice<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.slice';
		readonly patterns?: G['slots']['pattern.slice']['patterns'][];
	}
	export interface Splat<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.splat';
		readonly target: G['slots']['pattern.splat']['target'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext> extends SubKindOf<V.Pattern.Splat<G>> {
			readonly $kind: 'pattern.splat.dictionary';
			readonly target: G['slots']['pattern.splat.dictionary']['target'];
		}
	}
	export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.tuple';
		readonly elements?: G['slots']['pattern.tuple']['elements'][];
		readonly patterns?: G['slots']['pattern.tuple']['patterns'][];
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarContext> extends SubKindOf<V.Pattern.Tuple<G>> {
			readonly $kind: 'pattern.tuple.bare';
		}
	}
	export interface Wildcard<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.wildcard';
	}
}
