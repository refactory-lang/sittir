import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Literal<G extends GrammarMap, K extends Under<'literal'> = 'literal'> {
	readonly $kind: K;
}

export interface LiteralSynonyms {
	readonly character: 'char' | 'rune';
	readonly interpolated: 'f' | 'template';
	readonly multiline: 'triple';
	readonly null: 'none' | 'nil';
}

export namespace Literal {
	export interface Boolean<G extends GrammarMap, K extends Under<'literal.boolean'> = 'literal.boolean'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly $value: boolean;
	}
	export namespace Boolean {
		export interface False<G extends GrammarMap, K extends Under<'literal.boolean.false'> = 'literal.boolean.false'> extends SubKindOf<V.Literal.Boolean<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly $value: false;
		}
		export interface True<G extends GrammarMap, K extends Under<'literal.boolean.true'> = 'literal.boolean.true'> extends SubKindOf<V.Literal.Boolean<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly $value: true;
		}
	}
	export interface Ellipsis<G extends GrammarMap, K extends Under<'literal.ellipsis'> = 'literal.ellipsis'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by p
		readonly $kind: K;
	}
	export interface Null<G extends GrammarMap, K extends Under<'literal.null'> = 'literal.null'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by pt
		readonly $kind: K;
	}
	export namespace Null {
		export interface Undefined<G extends GrammarMap, K extends Under<'literal.null.undefined'> = 'literal.null.undefined'> extends SubKindOf<V.Literal.Null<G, K>> {
			// claimed by t
			readonly $kind: K;
		}
	}
	export interface Number<G extends GrammarMap, K extends Under<'literal.number'> = 'literal.number'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly $value: number | bigint;
	}
	export namespace Number {
		export interface Float<G extends GrammarMap, K extends Under<'literal.number.float'> = 'literal.number.float'> extends SubKindOf<V.Literal.Number<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly $value: number;
			readonly exponent?: Slot<G, 'literal.number.float', 'exponent', unknown>;
			// pt only
			readonly fraction?: Slot<G, 'literal.number.float', 'fraction', unknown>;
			// pt only
			readonly integer?: Slot<G, 'literal.number.float', 'integer', unknown>;
			// pt only
			readonly marker?: Slot<G, 'literal.number.float', 'marker', string>;
			// pt only
			readonly exponentSign?: Slot<G, 'literal.number.float', 'exponentSign', string>;
			// t only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap, K extends Under<'literal.number.float.leading_point'> = 'literal.number.float.leading_point'> extends SubKindOf<V.Literal.Number.Float<G, K>, 'exponent' | 'fraction' | 'integer' | 'marker' | 'exponentSign' | 'imaginary'> {
				// claimed by pt
				readonly $kind: K;
				readonly exponent: Slot<G, 'literal.number.float.leading_point', 'exponent', unknown>;
				readonly fraction: Slot<G, 'literal.number.float.leading_point', 'fraction', unknown>;
				readonly integer?: Slot<G, 'literal.number.float.leading_point', 'integer', unknown>;
				// p only
				readonly marker: Slot<G, 'literal.number.float.leading_point', 'marker', string>;
				readonly exponentSign?: Slot<G, 'literal.number.float.leading_point', 'exponentSign', string>;
				// t only
			}
			export interface Scientific<G extends GrammarMap, K extends Under<'literal.number.float.scientific'> = 'literal.number.float.scientific'> extends SubKindOf<V.Literal.Number.Float<G, K>, 'exponent' | 'integer' | 'marker' | 'exponentSign' | 'imaginary'> {
				// claimed by pt
				readonly $kind: K;
				readonly exponent: Slot<G, 'literal.number.float.scientific', 'exponent', unknown>;
				readonly integer: Slot<G, 'literal.number.float.scientific', 'integer', unknown>;
				readonly marker: Slot<G, 'literal.number.float.scientific', 'marker', string>;
				readonly exponentSign?: Slot<G, 'literal.number.float.scientific', 'exponentSign', string>;
				// t only
			}
		}
		export interface Integer<G extends GrammarMap, K extends Under<'literal.number.integer'> = 'literal.number.integer'> extends SubKindOf<V.Literal.Number<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly content?: Slot<G, 'literal.number.integer', 'content', unknown>;
			// r only
			readonly suffix?: Slot<G, 'literal.number.integer', 'suffix', string>;
			// r only
		}
		export namespace Integer {
			export interface Binary<G extends GrammarMap, K extends Under<'literal.number.integer.binary'> = 'literal.number.integer.binary'> extends SubKindOf<V.Literal.Number.Integer<G, K>, 'content' | 'suffix'> {
				// claimed by prt
				readonly $kind: K;
				readonly content: Slot<G, 'literal.number.integer.binary', 'content', unknown>;
				readonly radixPrefix?: Slot<G, 'literal.number.integer.binary', 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, 'literal.number.integer.binary', 'suffix', string>;
				// r only
			}
			export interface Hex<G extends GrammarMap, K extends Under<'literal.number.integer.hex'> = 'literal.number.integer.hex'> extends SubKindOf<V.Literal.Number.Integer<G, K>, 'content' | 'suffix'> {
				// claimed by prt
				readonly $kind: K;
				readonly content: Slot<G, 'literal.number.integer.hex', 'content', unknown>;
				readonly radixPrefix?: Slot<G, 'literal.number.integer.hex', 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, 'literal.number.integer.hex', 'suffix', string>;
				// r only
			}
			export interface Octal<G extends GrammarMap, K extends Under<'literal.number.integer.octal'> = 'literal.number.integer.octal'> extends SubKindOf<V.Literal.Number.Integer<G, K>, 'content' | 'suffix'> {
				// claimed by prt
				readonly $kind: K;
				readonly content: Slot<G, 'literal.number.integer.octal', 'content', unknown>;
				readonly radixPrefix?: Slot<G, 'literal.number.integer.octal', 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, 'literal.number.integer.octal', 'suffix', string>;
				// r only
			}
		}
		export interface Negative<G extends GrammarMap, K extends Under<'literal.number.negative'> = 'literal.number.negative'> extends SubKindOf<V.Literal.Number<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly value: Slot<
				G,
				'literal.number.negative',
				'value',
				| V.Literal.Number.Integer.Any<G>
				| V.Literal.Number.Float.Any<G>
			>;
		}
	}
	export interface String<G extends GrammarMap, K extends Under<'literal.string'> = 'literal.string'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly elements?: Slot<G, 'literal.string', 'elements', unknown>[];
	}
	export namespace String {
		export interface Concatenated<G extends GrammarMap, K extends Under<'literal.string.concatenated'> = 'literal.string.concatenated'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly strings: (
				| V.Literal.String<G>
				| V.Literal.String.Multiline<G>
				| V.Literal.String.Raw.Any<G>
				| V.Literal.String.Bytes.Any<G>
				| V.Literal.String.Interpolated.Any<G>
				| V.Literal.String.Unicode<G>
			)[];
		}
		export interface Escape<G extends GrammarMap, K extends Under<'literal.string.escape'> = 'literal.string.escape'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by prt
			readonly $kind: K;
			readonly content?: Slot<G, 'literal.string.escape', 'content', unknown>;
			// t only
		}
		export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.multiline'> = 'literal.string.multiline'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $kind: K;
		}
		export interface Text<G extends GrammarMap, K extends Under<'literal.string.text'> = 'literal.string.text'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by prt
			readonly $kind: K;
		}
	}
}
