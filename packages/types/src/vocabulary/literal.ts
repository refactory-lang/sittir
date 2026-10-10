import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Literal<G extends GrammarContext<G>> {
	readonly $kind: 'literal';
}

export namespace Literal {
	export interface Boolean<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by r
		readonly $kind: 'literal.boolean';
	}
	export namespace Boolean {
		export interface False<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Boolean<G>> {
			// claimed by prt
			readonly $kind: 'literal.boolean.false';
		}
		export interface True<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Boolean<G>> {
			// claimed by prt
			readonly $kind: 'literal.boolean.true';
		}
	}
	export interface Ellipsis<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by p
		readonly $kind: 'literal.ellipsis';
	}
	export interface Null<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by pt
		readonly $kind: 'literal.null';
	}
	export namespace Null {
		export interface Undefined<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Null<G>> {
			// claimed by t
			readonly $kind: 'literal.null.undefined';
		}
	}
	export interface Number<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by t
		readonly $kind: 'literal.number';
	}
	export namespace Number {
		export interface Float<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by prt
			readonly $kind: 'literal.number.float';
			readonly exponent?: G['slots']['literal.number.float']['exponent'];
			// pt only
			readonly fraction?: G['slots']['literal.number.float']['fraction'];
			// pt only
			readonly integer?: G['slots']['literal.number.float']['integer'];
			// pt only
			readonly marker?: G['slots']['literal.number.float']['marker'];
			// pt only
			readonly sign?: G['slots']['literal.number.float']['sign'];
			// t only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Float<G>> {
				// claimed by pt
				readonly $kind: 'literal.number.float.leading_point';
				readonly exponent: G['slots']['literal.number.float.leading_point']['exponent'];
				readonly fraction: G['slots']['literal.number.float.leading_point']['fraction'];
				readonly integer?: G['slots']['literal.number.float.leading_point']['integer'];
				// p only
				readonly marker: G['slots']['literal.number.float.leading_point']['marker'];
				readonly sign?: G['slots']['literal.number.float.leading_point']['sign'];
				// t only
			}
			export interface Scientific<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Float<G>> {
				// claimed by pt
				readonly $kind: 'literal.number.float.scientific';
				readonly exponent: G['slots']['literal.number.float.scientific']['exponent'];
				readonly integer: G['slots']['literal.number.float.scientific']['integer'];
				readonly marker: G['slots']['literal.number.float.scientific']['marker'];
				readonly sign?: G['slots']['literal.number.float.scientific']['sign'];
				// t only
			}
		}
		export interface Integer<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by prt
			readonly $kind: 'literal.number.integer';
			readonly content?: G['slots']['literal.number.integer']['content'];
			// r only
			readonly suffix?: G['slots']['literal.number.integer']['suffix'];
			// r only
		}
		export namespace Integer {
			export interface Binary<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by prt
				readonly $kind: 'literal.number.integer.binary';
				readonly content: G['slots']['literal.number.integer.binary']['content'];
				readonly prefix?: G['slots']['literal.number.integer.binary']['prefix'];
				// pt only
				readonly suffix?: G['slots']['literal.number.integer.binary']['suffix'];
				// r only
			}
			export interface Hex<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by prt
				readonly $kind: 'literal.number.integer.hex';
				readonly content: G['slots']['literal.number.integer.hex']['content'];
				readonly prefix?: G['slots']['literal.number.integer.hex']['prefix'];
				// pt only
				readonly suffix?: G['slots']['literal.number.integer.hex']['suffix'];
				// r only
			}
			export interface Octal<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by prt
				readonly $kind: 'literal.number.integer.octal';
				readonly content: G['slots']['literal.number.integer.octal']['content'];
				readonly prefix?: G['slots']['literal.number.integer.octal']['prefix'];
				// pt only
				readonly suffix?: G['slots']['literal.number.integer.octal']['suffix'];
				// r only
			}
		}
		export interface Negative<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by r
			readonly $kind: 'literal.number.negative';
			readonly value: V.Literal.Number.Any<G>;
		}
	}
	export interface String<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by prt
		readonly $kind: 'literal.string';
		readonly content?: G['slots']['literal.string']['content'] | G['slots']['literal.string']['content'][];
		// rt only
		readonly contents?: G['slots']['literal.string']['contents'][];
		// p only
	}
	export namespace String {
		export interface Concatenated<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.concatenated';
			readonly strings: V.Literal.String<G>[];
		}
		export interface Docstring<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.docstring';
			readonly contents?: G['slots']['literal.string.docstring']['contents'][];
		}
		export interface Escape<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by prt
			readonly $kind: 'literal.string.escape';
			readonly content?: G['slots']['literal.string.escape']['content'];
			// t only
		}
		export interface Triple<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.triple';
		}
	}
}
