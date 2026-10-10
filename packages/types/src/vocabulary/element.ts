import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Element<G extends GrammarContext<G>> {
	readonly $kind: 'element';
}

export namespace Element {
	export interface Pair<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		// claimed by pt
		readonly $kind: 'element.pair';
		readonly key: G['slots']['element.pair']['key'];
		readonly value?: G['slots']['element.pair']['value'];
	}
	export interface Splat<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		// claimed by pt
		readonly $kind: 'element.splat';
		readonly expression?: G['slots']['element.splat']['expression'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext<G>> extends SubKindOf<V.Element.Splat<G>> {
			// claimed by p
			readonly $kind: 'element.splat.dictionary';
			readonly expression: G['slots']['element.splat.dictionary']['expression'];
		}
		export interface Parenthesized<G extends GrammarContext<G>> extends SubKindOf<V.Element.Splat<G>> {
			// claimed by p
			readonly $kind: 'element.splat.parenthesized';
			readonly content: V.Element.Splat.Any<G>;
		}
	}
}
