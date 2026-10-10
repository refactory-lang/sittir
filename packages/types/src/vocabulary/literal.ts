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
		export type Any<G extends GrammarContext<G>> =
			| V.Literal.Boolean<G>
			| V.Literal.Boolean.False<G>
			| V.Literal.Boolean.True<G>;
	}
	export interface Char<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by r
		readonly $kind: 'literal.char';
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
		export type Any<G extends GrammarContext<G>> = V.Literal.Null<G> | V.Literal.Null.Undefined<G>;
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
			readonly imaginary?: G['slots']['literal.number.float']['imaginary'];
			// p only
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
				readonly imaginary?: G['slots']['literal.number.float.leading_point']['imaginary'];
				// p only
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
				readonly imaginary?: G['slots']['literal.number.float.scientific']['imaginary'];
				// p only
				readonly integer: G['slots']['literal.number.float.scientific']['integer'];
				readonly marker: G['slots']['literal.number.float.scientific']['marker'];
				readonly sign?: G['slots']['literal.number.float.scientific']['sign'];
				// t only
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Literal.Number.Float<G>
				| V.Literal.Number.Float.LeadingPoint<G>
				| V.Literal.Number.Float.Scientific<G>;
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
			export interface Big<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by pt
				readonly $kind: 'literal.number.integer.big';
			}
			export namespace Big {
				export interface Binary<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer.Big<G>> {
					// claimed by t
					readonly $kind: 'literal.number.integer.big.binary';
					readonly content: G['slots']['literal.number.integer.big.binary']['content'];
				}
				export interface Hex<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer.Big<G>> {
					// claimed by t
					readonly $kind: 'literal.number.integer.big.hex';
					readonly content: G['slots']['literal.number.integer.big.hex']['content'];
				}
				export interface Octal<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer.Big<G>> {
					// claimed by t
					readonly $kind: 'literal.number.integer.big.octal';
					readonly content: G['slots']['literal.number.integer.big.octal']['content'];
				}
				export type Any<G extends GrammarContext<G>> =
					| V.Literal.Number.Integer.Big<G>
					| V.Literal.Number.Integer.Big.Binary<G>
					| V.Literal.Number.Integer.Big.Hex<G>
					| V.Literal.Number.Integer.Big.Octal<G>;
			}
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
			export interface Imaginary<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by p
				readonly $kind: 'literal.number.integer.imaginary';
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
			export type Any<G extends GrammarContext<G>> =
				| V.Literal.Number.Integer<G>
				| V.Literal.Number.Integer.Big<G>
				| V.Literal.Number.Integer.Big.Binary<G>
				| V.Literal.Number.Integer.Big.Hex<G>
				| V.Literal.Number.Integer.Big.Octal<G>
				| V.Literal.Number.Integer.Binary<G>
				| V.Literal.Number.Integer.Hex<G>
				| V.Literal.Number.Integer.Imaginary<G>
				| V.Literal.Number.Integer.Octal<G>;
		}
		export interface Negative<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by r
			readonly $kind: 'literal.number.negative';
			readonly value: V.Literal.Number.Any<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Literal.Number<G>
			| V.Literal.Number.Float<G>
			| V.Literal.Number.Float.LeadingPoint<G>
			| V.Literal.Number.Float.Scientific<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Big<G>
			| V.Literal.Number.Integer.Big.Binary<G>
			| V.Literal.Number.Integer.Big.Hex<G>
			| V.Literal.Number.Integer.Big.Octal<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Imaginary<G>
			| V.Literal.Number.Integer.Octal<G>
			| V.Literal.Number.Negative<G>;
	}
	export interface Regex<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by t
		readonly $kind: 'literal.regex';
		readonly flags?: V.Literal.Regex.Flags<G>;
		readonly pattern?: V.Literal.Regex.Pattern<G>;
	}
	export namespace Regex {
		export interface Flags<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Regex<G>> {
			// claimed by t
			readonly $kind: 'literal.regex.flags';
		}
		export interface Pattern<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Regex<G>> {
			// claimed by t
			readonly $kind: 'literal.regex.pattern';
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Literal.Regex<G>
			| V.Literal.Regex.Flags<G>
			| V.Literal.Regex.Pattern<G>;
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
		export interface Bytes<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.bytes';
		}
		export interface Concatenated<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.concatenated';
			readonly strings: V.Literal.String<G>[];
		}
		export interface Escape<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by prt
			readonly $kind: 'literal.string.escape';
			readonly content?: G['slots']['literal.string.escape']['content'];
			// t only
		}
		export interface F<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.f';
		}
		export interface Raw<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by pr
			readonly $kind: 'literal.string.raw';
			readonly content: G['slots']['literal.string.raw']['content'];
			// r only
		}
		export interface Triple<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.triple';
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Literal.String<G>
			| V.Literal.String.Bytes<G>
			| V.Literal.String.Concatenated<G>
			| V.Literal.String.Escape<G>
			| V.Literal.String.F<G>
			| V.Literal.String.Raw<G>
			| V.Literal.String.Triple<G>;
	}
	export interface Template<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by t
		readonly $kind: 'literal.template';
		readonly elements?: G['slots']['literal.template']['elements'][];
	}
	export type Any<G extends GrammarContext<G>> =
		| V.Literal.Boolean<G>
		| V.Literal.Boolean.False<G>
		| V.Literal.Boolean.True<G>
		| V.Literal.Char<G>
		| V.Literal.Ellipsis<G>
		| V.Literal.Null<G>
		| V.Literal.Null.Undefined<G>
		| V.Literal.Number<G>
		| V.Literal.Number.Float<G>
		| V.Literal.Number.Float.LeadingPoint<G>
		| V.Literal.Number.Float.Scientific<G>
		| V.Literal.Number.Integer<G>
		| V.Literal.Number.Integer.Big<G>
		| V.Literal.Number.Integer.Big.Binary<G>
		| V.Literal.Number.Integer.Big.Hex<G>
		| V.Literal.Number.Integer.Big.Octal<G>
		| V.Literal.Number.Integer.Binary<G>
		| V.Literal.Number.Integer.Hex<G>
		| V.Literal.Number.Integer.Imaginary<G>
		| V.Literal.Number.Integer.Octal<G>
		| V.Literal.Number.Negative<G>
		| V.Literal.Regex<G>
		| V.Literal.Regex.Flags<G>
		| V.Literal.Regex.Pattern<G>
		| V.Literal.String<G>
		| V.Literal.String.Bytes<G>
		| V.Literal.String.Concatenated<G>
		| V.Literal.String.Escape<G>
		| V.Literal.String.F<G>
		| V.Literal.String.Raw<G>
		| V.Literal.String.Triple<G>
		| V.Literal.Template<G>;
}
