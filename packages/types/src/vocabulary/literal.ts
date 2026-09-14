// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Literal<G extends GrammarContext> {
	readonly content?:
		| V.Unmapped<'python:string_content'>
		| V.Unmapped<'typescript:string_double'>
		| V.Unmapped<'typescript:string_single'>
		| V.Expression.Interpolation<G>
		| (
				| V.Unmapped<'python:string_content'>
				| V.Unmapped<'typescript:string_double'>
				| V.Unmapped<'typescript:string_single'>
				| V.Expression.Interpolation<G>
		  )[]; // pt only   // unmapped: <python:string_content> <typescript:string_double> <typescript:string_single>
	readonly elements?: (
		| V.Unmapped<'rust:string_content'>
		| V.Unmapped<'typescript:template_chars'>
		| V.Expression.Interpolation<G>
		| V.Literal.String.Escape<G>
	)[]; // rt only   // unmapped: <rust:string_content> <typescript:template_chars>
	readonly flags?: V.Literal.Regex.Flags<G>; // t only
	readonly pattern?: V.Literal.Regex.Pattern<G>; // t only
	readonly rawStringLiteralEnd?: V.Unmapped<'rust:raw_string_literal_end'>; // r only   // unmapped: <rust:raw_string_literal_end>
	readonly rawStringLiteralStart?: V.Unmapped<'rust:raw_string_literal_start'>; // r only   // unmapped: <rust:raw_string_literal_start>
	readonly string?: V.Literal.String<G>[]; // p only
	readonly stringContent?: V.Unmapped<'rust:raw_string_literal_content'>; // r only   // unmapped: <rust:raw_string_literal_content>
	readonly value?: V.Literal.Number.Kinds<G>; // r only
}
export namespace Literal {
	export interface Boolean<G extends GrammarContext> extends V.Literal<G> {} // claimed by r
	export namespace Boolean {
		export interface False<G extends GrammarContext> extends V.Literal.Boolean<G> {} // claimed by prt
		export interface True<G extends GrammarContext> extends V.Literal.Boolean<G> {} // claimed by prt
		export type Kinds<G extends GrammarContext> =
			| V.Literal.Boolean<G>
			| V.Literal.Boolean.False<G>
			| V.Literal.Boolean.True<G>;
	}
	export interface Char<G extends GrammarContext> extends V.Literal<G> {} // claimed by r
	export interface Ellipsis<G extends GrammarContext> extends V.Literal<G> {} // claimed by p
	export interface HtmlEntity<G extends GrammarContext> extends V.Literal<G> {} // claimed by t
	export interface Null<G extends GrammarContext> extends V.Literal<G> {} // claimed by pt
	export namespace Null {
		export interface Undefined<G extends GrammarContext> extends V.Literal.Null<G> {} // claimed by t
		export type Kinds<G extends GrammarContext> = V.Literal.Null<G> | V.Literal.Null.Undefined<G>;
	}
	export interface Number<G extends GrammarContext> extends V.Literal<G> {
		// claimed by t
		readonly value?: V.Literal.Number.Kinds<G>; // r only
	}
	export namespace Number {
		export interface Float<G extends GrammarContext> extends V.Literal.Number<G> {} // claimed by pr
		export interface Integer<G extends GrammarContext> extends V.Literal.Number<G> {} // claimed by pr
		export namespace Integer {
			export interface Hex<G extends GrammarContext> extends V.Literal.Number.Integer<G> {} // claimed by p
			export type Kinds<G extends GrammarContext> = V.Literal.Number.Integer<G> | V.Literal.Number.Integer.Hex<G>;
		}
		export interface Negative<G extends GrammarContext> extends V.Literal.Number<G> {
			// claimed by r
			readonly value: V.Literal.Number.Kinds<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Literal.Number<G>
			| V.Literal.Number.Float<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Negative<G>;
	}
	export interface Regex<G extends GrammarContext> extends V.Literal<G> {
		// claimed by t
		readonly flags?: V.Literal.Regex.Flags<G>;
		readonly pattern?: V.Literal.Regex.Pattern<G>;
	}
	export namespace Regex {
		export interface Flags<G extends GrammarContext> extends V.Literal.Regex<G> {} // claimed by t
		export interface Pattern<G extends GrammarContext> extends V.Literal.Regex<G> {} // claimed by t
		export type Kinds<G extends GrammarContext> =
			| V.Literal.Regex<G>
			| V.Literal.Regex.Flags<G>
			| V.Literal.Regex.Pattern<G>;
	}
	export interface String<G extends GrammarContext> extends V.Literal<G> {
		// claimed by prt
		readonly content?:
			| V.Unmapped<'python:string_content'>
			| V.Unmapped<'typescript:string_double'>
			| V.Unmapped<'typescript:string_single'>
			| V.Expression.Interpolation<G>
			| (
					| V.Unmapped<'python:string_content'>
					| V.Unmapped<'typescript:string_double'>
					| V.Unmapped<'typescript:string_single'>
					| V.Expression.Interpolation<G>
			  )[]; // pt only   // unmapped: <python:string_content> <typescript:string_double> <typescript:string_single>
		readonly elements?: (V.Unmapped<'rust:string_content'> | V.Literal.String.Escape<G>)[]; // r only   // unmapped: <rust:string_content>
		readonly rawStringLiteralEnd?: V.Unmapped<'rust:raw_string_literal_end'>; // r only   // unmapped: <rust:raw_string_literal_end>
		readonly rawStringLiteralStart?: V.Unmapped<'rust:raw_string_literal_start'>; // r only   // unmapped: <rust:raw_string_literal_start>
		readonly string?: V.Literal.String<G>[]; // p only
		readonly stringContent?: V.Unmapped<'rust:raw_string_literal_content'>; // r only   // unmapped: <rust:raw_string_literal_content>
	}
	export namespace String {
		export interface Bytes<G extends GrammarContext> extends V.Literal.String<G> {} // claimed by p
		export interface Concatenated<G extends GrammarContext> extends V.Literal.String<G> {
			// claimed by p
			readonly string: V.Literal.String<G>[];
		}
		export interface Docstring<G extends GrammarContext> extends V.Literal.String<G> {
			// claimed by p
			readonly content?: (V.Unmapped<'python:string_content'> | V.Expression.Interpolation<G>)[]; // unmapped: <python:string_content>
		}
		export interface Escape<G extends GrammarContext> extends V.Literal.String<G> {} // claimed by prt
		export interface F<G extends GrammarContext> extends V.Literal.String<G> {} // claimed by p
		export interface Raw<G extends GrammarContext> extends V.Literal.String<G> {
			// claimed by pr
			readonly rawStringLiteralEnd?: V.Unmapped<'rust:raw_string_literal_end'>; // r only   // unmapped: <rust:raw_string_literal_end>
			readonly rawStringLiteralStart?: V.Unmapped<'rust:raw_string_literal_start'>; // r only   // unmapped: <rust:raw_string_literal_start>
			readonly stringContent?: V.Unmapped<'rust:raw_string_literal_content'>; // r only   // unmapped: <rust:raw_string_literal_content>
		}
		export interface Triple<G extends GrammarContext> extends V.Literal.String<G> {} // claimed by p
		export type Kinds<G extends GrammarContext> =
			| V.Literal.String<G>
			| V.Literal.String.Bytes<G>
			| V.Literal.String.Concatenated<G>
			| V.Literal.String.Docstring<G>
			| V.Literal.String.Escape<G>
			| V.Literal.String.F<G>
			| V.Literal.String.Raw<G>
			| V.Literal.String.Triple<G>;
	}
	export interface Template<G extends GrammarContext> extends V.Literal<G> {
		// claimed by t
		readonly elements?: (
			| V.Unmapped<'typescript:template_chars'>
			| V.Expression.Interpolation<G>
			| V.Literal.String.Escape<G>
		)[]; // unmapped: <typescript:template_chars>
	}
	export type Kinds<G extends GrammarContext> =
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
