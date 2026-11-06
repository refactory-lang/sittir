import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Literal<G extends GrammarMap, K extends Under<'literal'> = 'literal'> {
	readonly $path: K;
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
		readonly $path: K;
		readonly $value: boolean;
	}
	export namespace Boolean {
		export interface False<G extends GrammarMap, K extends Under<'literal.boolean.false'> = 'literal.boolean.false'> extends SubKindOf<V.Literal.Boolean<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly $value: false;
		}
		export interface True<G extends GrammarMap, K extends Under<'literal.boolean.true'> = 'literal.boolean.true'> extends SubKindOf<V.Literal.Boolean<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly $value: true;
		}
	}
	export interface Ellipsis<G extends GrammarMap, K extends Under<'literal.ellipsis'> = 'literal.ellipsis'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by p
		readonly $path: K;
	}
	export interface Null<G extends GrammarMap, K extends Under<'literal.null'> = 'literal.null'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by pt
		readonly $path: K;
	}
	export namespace Null {
		export interface Undefined<G extends GrammarMap, K extends Under<'literal.null.undefined'> = 'literal.null.undefined'> extends SubKindOf<V.Literal.Null<G, K>> {
			// claimed by t
			readonly $path: K;
		}
	}
	export interface Number<G extends GrammarMap, K extends Under<'literal.number'> = 'literal.number'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly $value: number | bigint;
	}
	export namespace Number {
		export interface Float<G extends GrammarMap, K extends Under<'literal.number.float'> = 'literal.number.float'> extends SubKindOf<V.Literal.Number<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly $value: number;
			readonly exponent?: Slot<G, K, 'exponent', unknown>;
			// pt only
			readonly fraction?: Slot<G, K, 'fraction', unknown>;
			// pt only
			readonly integer?: Slot<G, K, 'integer', unknown>;
			// pt only
			readonly marker?: Slot<G, K, 'marker', string>;
			// pt only
			readonly exponentSign?: Slot<G, K, 'exponentSign', string>;
			// t only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap, K extends Under<'literal.number.float.leading_point'> = 'literal.number.float.leading_point'> extends SubKindOf<V.Literal.Number.Float<G, K>> {
				// claimed by pt
				readonly $path: K;
				readonly fraction: Slot<G, K, 'fraction', unknown>;
				readonly integer?: Slot<G, K, 'integer', unknown>;
				// p only
				readonly exponentSign?: Slot<G, K, 'exponentSign', string>;
				// t only
			}
			export interface Scientific<G extends GrammarMap, K extends Under<'literal.number.float.scientific'> = 'literal.number.float.scientific'> extends SubKindOf<V.Literal.Number.Float<G, K>> {
				// claimed by pt
				readonly $path: K;
				readonly exponent: Slot<G, K, 'exponent', unknown>;
				readonly integer: Slot<G, K, 'integer', unknown>;
				readonly marker: Slot<G, K, 'marker', string>;
				readonly exponentSign?: Slot<G, K, 'exponentSign', string>;
				// t only
			}
		}
		export interface Integer<G extends GrammarMap, K extends Under<'literal.number.integer'> = 'literal.number.integer'> extends SubKindOf<V.Literal.Number<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly content?: Slot<G, K, 'content', unknown>;
			// r only
			readonly suffix?: Slot<G, K, 'suffix', string>;
			// r only
		}
		export namespace Integer {
			export interface Binary<G extends GrammarMap, K extends Under<'literal.number.integer.binary'> = 'literal.number.integer.binary'> extends SubKindOf<V.Literal.Number.Integer<G, K>> {
				// claimed by prt
				readonly $path: K;
				readonly content: Slot<G, K, 'content', unknown>;
				readonly radixPrefix?: Slot<G, K, 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, K, 'suffix', string>;
				// r only
			}
			export interface Hex<G extends GrammarMap, K extends Under<'literal.number.integer.hex'> = 'literal.number.integer.hex'> extends SubKindOf<V.Literal.Number.Integer<G, K>> {
				// claimed by prt
				readonly $path: K;
				readonly content: Slot<G, K, 'content', unknown>;
				readonly radixPrefix?: Slot<G, K, 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, K, 'suffix', string>;
				// r only
			}
			export interface Octal<G extends GrammarMap, K extends Under<'literal.number.integer.octal'> = 'literal.number.integer.octal'> extends SubKindOf<V.Literal.Number.Integer<G, K>> {
				// claimed by prt
				readonly $path: K;
				readonly content: Slot<G, K, 'content', unknown>;
				readonly radixPrefix?: Slot<G, K, 'radixPrefix', string>;
				// pt only
				readonly suffix?: Slot<G, K, 'suffix', string>;
				// r only
			}
		}
		export interface Negative<G extends GrammarMap, K extends Under<'literal.number.negative'> = 'literal.number.negative'> extends SubKindOf<V.Literal.Number<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly value: Slot<
				G,
				K,
				'value',
				| V.Literal.Number.Integer.Any<G>
				| V.Literal.Number.Float.Any<G>
			>;
		}
	}
	export interface String<G extends GrammarMap, K extends Under<'literal.string'> = 'literal.string'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly elements?: Slot<G, K, 'elements', unknown>[];
	}
	export namespace String {
		export interface Concatenated<G extends GrammarMap, K extends Under<'literal.string.concatenated'> = 'literal.string.concatenated'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly strings: Slot<
				G,
				K,
				'strings',
				| V.Literal.String<G>
				| V.Literal.String.Multiline<G>
				| V.Literal.String.Raw.Any<G>
				| V.Literal.String.Bytes.Any<G>
				| V.Literal.String.Interpolated.Any<G>
				| V.Literal.String.Unicode<G>
			>[];
		}
		export interface Escape<G extends GrammarMap, K extends Under<'literal.string.escape'> = 'literal.string.escape'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly content?: Slot<G, K, 'content', unknown>;
			// t only
		}
		export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.multiline'> = 'literal.string.multiline'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $path: K;
		}
		export interface Text<G extends GrammarMap, K extends Under<'literal.string.text'> = 'literal.string.text'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by prt
			readonly $path: K;
		}
	}
}
