// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type { Simplify } from 'type-fest';

import type { SubKindOf } from './utils.ts';

import type * as V from './index.ts';

export interface Literal<G extends GrammarContext> {
	readonly kind: 'literal';
}

export namespace Literal {
	export interface Boolean<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by r
		readonly kind: 'literal.boolean';
	}
	export namespace Boolean {
		export interface False<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Boolean<G>>> {
			// claimed by prt
			readonly kind: 'literal.boolean.false';
		}
		export interface True<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Boolean<G>>> {
			// claimed by prt
			readonly kind: 'literal.boolean.true';
		}
		export type Any<G extends GrammarContext> =
			| V.Literal.Boolean<G>
			| V.Literal.Boolean.False<G>
			| V.Literal.Boolean.True<G>;
	}
	export interface Char<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by r
		readonly kind: 'literal.char';
	}
	export interface Ellipsis<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by p
		readonly kind: 'literal.ellipsis';
	}
	export interface HtmlEntity<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by t
		readonly kind: 'literal.html_entity';
	}
	export interface Null<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by pt
		readonly kind: 'literal.null';
	}
	export namespace Null {
		export interface Undefined<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Null<G>>> {
			// claimed by t
			readonly kind: 'literal.null.undefined';
		}
		export type Any<G extends GrammarContext> = V.Literal.Null<G> | V.Literal.Null.Undefined<G>;
	}
	export interface Number<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by t
		readonly kind: 'literal.number';
	}
	export namespace Number {
		export interface Float<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Number<G>>> {
			// claimed by prt
			readonly kind: 'literal.number.float';
			readonly marker?: 'E' | 'e';
			// t only
			readonly sign?: '+' | '-';
			// t only
		}
		export interface Integer<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Number<G>>> {
			// claimed by prt
			readonly kind: 'literal.number.integer';
			readonly prefix?: '0B' | '0O' | '0X' | '0b' | '0o' | '0x';
			// pt only
		}
		export namespace Integer {
			export interface Hex<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Number.Integer<G>>> {
				// claimed by prt
				readonly kind: 'literal.number.integer.hex';
				readonly prefix?: '0X' | '0x';
				// pt only
				readonly suffix?:
					| 'f32'
					| 'f64'
					| 'i128'
					| 'i16'
					| 'i32'
					| 'i64'
					| 'i8'
					| 'isize'
					| 'u128'
					| 'u16'
					| 'u32'
					| 'u64'
					| 'u8'
					| 'usize';
				// r only
			}
			export type Any<G extends GrammarContext> = V.Literal.Number.Integer<G> | V.Literal.Number.Integer.Hex<G>;
		}
		export interface Negative<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Number<G>>> {
			// claimed by r
			readonly kind: 'literal.number.negative';
			readonly value: V.Literal.Number.Any<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Literal.Number<G>
			| V.Literal.Number.Float<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Negative<G>;
	}
	export interface Regex<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by t
		readonly kind: 'literal.regex';
		readonly flags?: V.Literal.Regex.Flags<G>;
		readonly pattern?: V.Literal.Regex.Pattern<G>;
	}
	export namespace Regex {
		export interface Flags<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Regex<G>>> {
			// claimed by t
			readonly kind: 'literal.regex.flags';
		}
		export interface Pattern<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.Regex<G>>> {
			// claimed by t
			readonly kind: 'literal.regex.pattern';
		}
		export type Any<G extends GrammarContext> =
			| V.Literal.Regex<G>
			| V.Literal.Regex.Flags<G>
			| V.Literal.Regex.Pattern<G>;
	}
	export interface String<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by prt
		readonly kind: 'literal.string';
		readonly contents?: (V.Unmapped<'python:string_content'> | V.Expression.Interpolation<G>)[];
		// p only
		// unmapped: <python:string_content>
		readonly elements?: (V.Unmapped<'rust:string_content'> | V.Literal.String.Escape<G>)[];
		// r only
		// unmapped: <rust:string_content>
	}
	export namespace String {
		export interface Bytes<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by p
			readonly kind: 'literal.string.bytes';
		}
		export interface Concatenated<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by p
			readonly kind: 'literal.string.concatenated';
			readonly strings: V.Literal.String<G>[];
		}
		export interface Docstring<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by p
			readonly kind: 'literal.string.docstring';
			readonly contents?: (V.Unmapped<'python:string_content'> | V.Expression.Interpolation<G>)[];
			// unmapped: <python:string_content>
		}
		export interface Escape<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by prt
			readonly kind: 'literal.string.escape';
		}
		export interface F<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by p
			readonly kind: 'literal.string.f';
		}
		export interface Raw<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by pr
			readonly kind: 'literal.string.raw';
			readonly rawStringLiteralEnd: V.Unmapped<'rust:raw_string_literal_end'>;
			// r only
			// unmapped: <rust:raw_string_literal_end>
			readonly rawStringLiteralStart: V.Unmapped<'rust:raw_string_literal_start'>;
			// r only
			// unmapped: <rust:raw_string_literal_start>
			readonly stringContent: V.Unmapped<'rust:raw_string_literal_content'>;
			// r only
			// unmapped: <rust:raw_string_literal_content>
		}
		export interface Triple<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal.String<G>>> {
			// claimed by p
			readonly kind: 'literal.string.triple';
		}
		export type Any<G extends GrammarContext> =
			| V.Literal.String<G>
			| V.Literal.String.Bytes<G>
			| V.Literal.String.Concatenated<G>
			| V.Literal.String.Docstring<G>
			| V.Literal.String.Escape<G>
			| V.Literal.String.F<G>
			| V.Literal.String.Raw<G>
			| V.Literal.String.Triple<G>;
	}
	export interface Template<G extends GrammarContext> extends Simplify<SubKindOf<V.Literal<G>>> {
		// claimed by t
		readonly kind: 'literal.template';
		readonly elements?: (
			| V.Unmapped<'typescript:template_chars'>
			| V.Expression.Interpolation<G>
			| V.Literal.String.Escape<G>
		)[];
		// unmapped: <typescript:template_chars>
	}
	export type Any<G extends GrammarContext> =
		| V.Literal.Boolean<G>
		| V.Literal.Boolean.False<G>
		| V.Literal.Boolean.True<G>
		| V.Literal.Char<G>
		| V.Literal.Ellipsis<G>
		| V.Literal.HtmlEntity<G>
		| V.Literal.Null<G>
		| V.Literal.Null.Undefined<G>
		| V.Literal.Number<G>
		| V.Literal.Number.Float<G>
		| V.Literal.Number.Integer<G>
		| V.Literal.Number.Integer.Hex<G>
		| V.Literal.Number.Negative<G>
		| V.Literal.Regex<G>
		| V.Literal.Regex.Flags<G>
		| V.Literal.Regex.Pattern<G>
		| V.Literal.String<G>
		| V.Literal.String.Bytes<G>
		| V.Literal.String.Concatenated<G>
		| V.Literal.String.Docstring<G>
		| V.Literal.String.Escape<G>
		| V.Literal.String.F<G>
		| V.Literal.String.Raw<G>
		| V.Literal.String.Triple<G>
		| V.Literal.Template<G>;
}
