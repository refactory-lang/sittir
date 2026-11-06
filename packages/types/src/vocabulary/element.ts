import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Element<G extends GrammarMap> {
	readonly $kind: 'element';
}

export interface ElementSynonyms {
	readonly map: 'dictionary' | 'dict';
	readonly spread: 'splat' | 'unpack';
}

export namespace Element {
	export interface Comparator<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		// claimed by p
		readonly $kind: 'element.comparator';
		readonly right: Slot<
			G,
			'element.comparator',
			'right',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
		>;
	}
	export namespace Comparator {
		export interface Comparison<G extends GrammarMap> extends SubKindOf<V.Element.Comparator<G>> {
			readonly $kind: 'element.comparator.comparison';
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.equal';
			}
			export interface Greater<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.greater';
			}
			export interface GreaterEqual<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.greater_equal';
			}
			export interface Less<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.less';
			}
			export interface LessEqual<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.less_equal';
			}
			export interface NotEqual<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.not_equal';
			}
			export namespace NotEqual {
				export interface Legacy<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Comparison.NotEqual<G>> {
					// claimed by p
					readonly $kind: 'element.comparator.comparison.not_equal.legacy';
				}
			}
		}
		export interface Identity<G extends GrammarMap> extends SubKindOf<V.Element.Comparator<G>> {
			readonly $kind: 'element.comparator.identity';
		}
		export namespace Identity {
			export interface Is<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Identity<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.identity.is';
			}
			export interface IsNot<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Identity<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.identity.is_not';
			}
		}
		export interface Membership<G extends GrammarMap> extends SubKindOf<V.Element.Comparator<G>> {
			readonly $kind: 'element.comparator.membership';
		}
		export namespace Membership {
			export interface In<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Membership<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.membership.in';
			}
			export interface NotIn<G extends GrammarMap> extends SubKindOf<V.Element.Comparator.Membership<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.membership.not_in';
			}
		}
	}
	export interface Pair<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		// claimed by pt
		readonly $kind: 'element.pair';
		readonly key: Slot<
			G,
			'element.pair',
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
			'element.pair',
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	export interface Spread<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		// claimed by pt
		readonly $kind: 'element.spread';
		readonly expression?: Slot<
			G,
			'element.spread',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	export namespace Spread {
		export interface Map<G extends GrammarMap> extends SubKindOf<V.Element.Spread<G>, 'expression'> {
			// claimed by p
			readonly $kind: 'element.spread.map';
			readonly expression: Slot<
				G,
				'element.spread.map',
				'expression',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
		export interface Parenthesized<G extends GrammarMap> extends SubKindOf<V.Element.Spread<G>> {
			// claimed by p
			readonly $kind: 'element.spread.parenthesized';
			readonly content: V.Element.Spread<G> | V.Element.Spread.Parenthesized<G>;
		}
	}
}
