import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Element<G extends GrammarMap, K extends Under<'element'> = 'element'> {
	readonly $path: K;
}

export interface ElementSynonyms {
	readonly map: 'dictionary' | 'dict';
	readonly spread: 'splat' | 'unpack';
}

export namespace Element {
	export interface Comparator<G extends GrammarMap, K extends Under<'element.comparator'> = 'element.comparator'> extends SubKindOf<V.Element<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly right: Slot<
			G,
			K,
			'right',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
		>;
	}
	export namespace Comparator {
		export interface Comparison<G extends GrammarMap, K extends Under<'element.comparator.comparison'> = 'element.comparator.comparison'> extends SubKindOf<V.Element.Comparator<G, K>> {
			readonly $path: K;
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarMap, K extends Under<'element.comparator.comparison.equal'> = 'element.comparator.comparison.equal'> extends SubKindOf<V.Element.Comparator.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface Greater<G extends GrammarMap, K extends Under<'element.comparator.comparison.greater'> = 'element.comparator.comparison.greater'> extends SubKindOf<V.Element.Comparator.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface GreaterEqual<G extends GrammarMap, K extends Under<'element.comparator.comparison.greater_equal'> = 'element.comparator.comparison.greater_equal'> extends SubKindOf<V.Element.Comparator.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface Less<G extends GrammarMap, K extends Under<'element.comparator.comparison.less'> = 'element.comparator.comparison.less'> extends SubKindOf<V.Element.Comparator.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface LessEqual<G extends GrammarMap, K extends Under<'element.comparator.comparison.less_equal'> = 'element.comparator.comparison.less_equal'> extends SubKindOf<V.Element.Comparator.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface NotEqual<G extends GrammarMap, K extends Under<'element.comparator.comparison.not_equal'> = 'element.comparator.comparison.not_equal'> extends SubKindOf<V.Element.Comparator.Comparison<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export namespace NotEqual {
				export interface Legacy<G extends GrammarMap, K extends Under<'element.comparator.comparison.not_equal.legacy'> = 'element.comparator.comparison.not_equal.legacy'> extends SubKindOf<V.Element.Comparator.Comparison.NotEqual<G, K>> {
					// claimed by p
					readonly $path: K;
				}
			}
		}
		export interface Identity<G extends GrammarMap, K extends Under<'element.comparator.identity'> = 'element.comparator.identity'> extends SubKindOf<V.Element.Comparator<G, K>> {
			readonly $path: K;
		}
		export namespace Identity {
			export interface Is<G extends GrammarMap, K extends Under<'element.comparator.identity.is'> = 'element.comparator.identity.is'> extends SubKindOf<V.Element.Comparator.Identity<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface IsNot<G extends GrammarMap, K extends Under<'element.comparator.identity.is_not'> = 'element.comparator.identity.is_not'> extends SubKindOf<V.Element.Comparator.Identity<G, K>> {
				// claimed by p
				readonly $path: K;
			}
		}
		export interface Membership<G extends GrammarMap, K extends Under<'element.comparator.membership'> = 'element.comparator.membership'> extends SubKindOf<V.Element.Comparator<G, K>> {
			readonly $path: K;
		}
		export namespace Membership {
			export interface In<G extends GrammarMap, K extends Under<'element.comparator.membership.in'> = 'element.comparator.membership.in'> extends SubKindOf<V.Element.Comparator.Membership<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export interface NotIn<G extends GrammarMap, K extends Under<'element.comparator.membership.not_in'> = 'element.comparator.membership.not_in'> extends SubKindOf<V.Element.Comparator.Membership<G, K>> {
				// claimed by p
				readonly $path: K;
			}
		}
	}
	export interface Pair<G extends GrammarMap, K extends Under<'element.pair'> = 'element.pair'> extends SubKindOf<V.Element<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly key: Slot<
			G,
			K,
			'key',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	export interface Spread<G extends GrammarMap, K extends Under<'element.spread'> = 'element.spread'> extends SubKindOf<V.Element<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly expression?: Slot<
			G,
			K,
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	export namespace Spread {
		export interface Map<G extends GrammarMap, K extends Under<'element.spread.map'> = 'element.spread.map'> extends SubKindOf<V.Element.Spread<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
		export interface Parenthesized<G extends GrammarMap, K extends Under<'element.spread.parenthesized'> = 'element.spread.parenthesized'> extends SubKindOf<V.Element.Spread<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Element.Spread<G> | V.Element.Spread.Parenthesized<G>>;
		}
	}
}
