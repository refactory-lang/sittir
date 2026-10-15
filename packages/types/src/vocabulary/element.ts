import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Element<G extends GrammarContext<G>> {
	readonly $kind: 'element';
}

export namespace Element {
	export interface Comparator<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		// claimed by p
		readonly $kind: 'element.comparator';
		readonly right: G['slots']['element.comparator']['right'];
	}
	export namespace Comparator {
		export interface Comparison<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator<G>> {
			readonly $kind: 'element.comparator.comparison';
		}
		export namespace Comparison {
			export interface Equal<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.equal';
			}
			export interface Greater<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.greater';
			}
			export interface GreaterEqual<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.greater_equal';
			}
			export interface Less<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.less';
			}
			export interface LessEqual<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.less_equal';
			}
			export interface NotEqual<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Comparison<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.comparison.not_equal';
			}
		}
		export interface Identity<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator<G>> {
			readonly $kind: 'element.comparator.identity';
		}
		export namespace Identity {
			export interface Is<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Identity<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.identity.is';
			}
			export interface IsNot<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Identity<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.identity.is_not';
			}
		}
		export interface Membership<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator<G>> {
			readonly $kind: 'element.comparator.membership';
		}
		export namespace Membership {
			export interface In<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Membership<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.membership.in';
			}
			export interface NotIn<G extends GrammarContext<G>> extends SubKindOf<V.Element.Comparator.Membership<G>> {
				// claimed by p
				readonly $kind: 'element.comparator.membership.not_in';
			}
		}
	}
	export interface Pair<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		// claimed by pt
		readonly $kind: 'element.pair';
		readonly key: G['slots']['element.pair']['key'];
		readonly value?: G['slots']['element.pair']['value'];
	}
	export interface Spread<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		// claimed by pt
		readonly $kind: 'element.spread';
		readonly expression?: G['slots']['element.spread']['expression'];
	}
	export namespace Spread {
		export interface Map<G extends GrammarContext<G>> extends SubKindOf<V.Element.Spread<G>> {
			// claimed by p
			readonly $kind: 'element.spread.map';
			readonly expression: G['slots']['element.spread.map']['expression'];
		}
		export interface Parenthesized<G extends GrammarContext<G>> extends SubKindOf<V.Element.Spread<G>> {
			// claimed by p
			readonly $kind: 'element.spread.parenthesized';
			readonly content: V.Element.Spread.Any<G>;
		}
	}
}
