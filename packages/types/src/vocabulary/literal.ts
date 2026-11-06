import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Literal<G extends GrammarMap> {
	readonly $kind: 'literal';
}

export interface LiteralSynonyms {
	readonly character: 'char' | 'rune';
	readonly interpolated: 'f' | 'template';
	readonly multiline: 'triple';
	readonly null: 'none' | 'nil';
}

export namespace Literal {
	export interface Boolean<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by r
		readonly $kind: 'literal.boolean';
		readonly $value: boolean;
	}
	export namespace Boolean {
		export interface False<G extends GrammarMap> extends SubKindOf<V.Literal.Boolean<G>> {
			// claimed by prt
			readonly $kind: 'literal.boolean.false';
			readonly $value: false;
		}
		export interface True<G extends GrammarMap> extends SubKindOf<V.Literal.Boolean<G>> {
			// claimed by prt
			readonly $kind: 'literal.boolean.true';
			readonly $value: true;
		}
	}
	export interface Ellipsis<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by p
		readonly $kind: 'literal.ellipsis';
	}
	export interface Null<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by pt
		readonly $kind: 'literal.null';
	}
	export namespace Null {
		export interface Undefined<G extends GrammarMap> extends SubKindOf<V.Literal.Null<G>> {
			// claimed by t
			readonly $kind: 'literal.null.undefined';
		}
	}
	export interface Number<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by t
		readonly $kind: 'literal.number';
		readonly $value: number | bigint;
	}
	export namespace Number {
		export interface Float<G extends GrammarMap> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by prt
			readonly $kind: 'literal.number.float';
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
			export interface LeadingPoint<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Float<G>, 'exponent' | 'fraction' | 'integer' | 'marker' | 'exponentSign' | 'imaginary'> {
				// claimed by pt
				readonly $kind: 'literal.number.float.leading_point';
				readonly exponent: Slot<G, 'literal.number.float.leading_point', 'exponent', unknown>;
				readonly fraction: Slot<G, 'literal.number.float.leading_point', 'fraction', unknown>;
				readonly integer?: Slot<G, 'literal.number.float.leading_point', 'integer', unknown>;
				// p only
				readonly marker: Slot<G, 'literal.number.float.leading_point', 'marker', string>;
				readonly exponentSign?: Slot<G, 'literal.number.float.leading_point', 'exponentSign', string>;
				// t only
			}
			export interface Scientific<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Float<G>, 'exponent' | 'integer' | 'marker' | 'exponentSign' | 'imaginary'> {
				// claimed by pt
				readonly $kind: 'literal.number.float.scientific';
				readonly exponent: Slot<G, 'literal.number.float.scientific', 'exponent', unknown>;
				readonly integer: Slot<G, 'literal.number.float.scientific', 'integer', unknown>;
				readonly marker: Slot<G, 'literal.number.float.scientific', 'marker', string>;
				readonly exponentSign?: Slot<G, 'literal.number.float.scientific', 'exponentSign', string>;
				// t only
			}
		}
		export interface Integer<G extends GrammarMap> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by prt
			readonly $kind: 'literal.number.integer';
			readonly content?: Slot<G, 'literal.number.integer', 'content', unknown>;
			// r only
			readonly suffix?: Slot<G, 'literal.number.integer', 'suffix', string>;
			// r only
		}
		export namespace Integer {
			export interface Binary<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer<G>, 'content' | 'suffix'> {
				// claimed by prt
				readonly $kind: 'literal.number.integer.binary';
				readonly content: Slot<G, 'literal.number.integer.binary', 'content', unknown>;
				readonly radixPrefix?: Slot<G, 'literal.number.integer.binary', 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, 'literal.number.integer.binary', 'suffix', string>;
				// r only
			}
			export interface Hex<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer<G>, 'content' | 'suffix'> {
				// claimed by prt
				readonly $kind: 'literal.number.integer.hex';
				readonly content: Slot<G, 'literal.number.integer.hex', 'content', unknown>;
				readonly radixPrefix?: Slot<G, 'literal.number.integer.hex', 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, 'literal.number.integer.hex', 'suffix', string>;
				// r only
			}
			export interface Octal<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer<G>, 'content' | 'suffix'> {
				// claimed by prt
				readonly $kind: 'literal.number.integer.octal';
				readonly content: Slot<G, 'literal.number.integer.octal', 'content', unknown>;
				readonly radixPrefix?: Slot<G, 'literal.number.integer.octal', 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, 'literal.number.integer.octal', 'suffix', string>;
				// r only
			}
		}
		export interface Negative<G extends GrammarMap> extends SubKindOf<V.Literal.Number<G>> {
			// claimed by prt
			readonly $kind: 'literal.number.negative';
			readonly value: Slot<
				G,
				'literal.number.negative',
				'value',
				| V.Literal.Number.Integer.Any<G>
				| V.Literal.Number.Float.Any<G>
			>;
		}
	}
	export interface String<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by prt
		readonly $kind: 'literal.string';
		readonly elements?: Slot<G, 'literal.string', 'elements', unknown>[];
	}
	export namespace String {
		export interface Concatenated<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.concatenated';
			readonly strings: (
				| V.Literal.String<G>
				| V.Literal.String.Multiline<G>
				| V.Literal.String.Raw.Any<G>
				| V.Literal.String.Bytes.Any<G>
				| V.Literal.String.Interpolated.Any<G>
				| V.Literal.String.Unicode<G>
			)[];
		}
		export interface Escape<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by prt
			readonly $kind: 'literal.string.escape';
			readonly content?: Slot<G, 'literal.string.escape', 'content', unknown>;
			// t only
		}
		export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.multiline';
		}
		export interface Text<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by prt
			readonly $kind: 'literal.string.text';
		}
	}
}
