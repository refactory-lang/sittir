// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Attribute<G extends GrammarContext> {
	// claimed by prt
	readonly arguments?: (G['expression'] | G['element'])[]; // t only
	readonly content?: G['attribute'] | G['identifier']; // rt only
	readonly expression?: G['expression'] | G['identifier'] | G['literal']; // p only
	readonly function?: V.Attribute.Content.Member<G> | G['identifier']; // t only
	readonly input?: V.Unmapped<'rust:attribute_input'>; // r only   // unmapped: <rust:attribute_input>
	readonly object?: V.Attribute.Content.Member<G> | G['identifier']; // t only
	readonly path?: G['identifier']; // r only   // unmapped: literal:Crate literal:Self literal:Super
	readonly property?: G['identifier']; // t only
	readonly typeArguments?: G['type'][]; // t only
}
export namespace Attribute {
	export interface Content<G extends GrammarContext> extends V.Attribute<G> {
		// claimed by r
		readonly arguments?: (G['expression'] | G['element'])[]; // t only
		readonly content?: V.Attribute.Content.Call<G> | V.Attribute.Content.Member<G> | G['identifier']; // t only
		readonly function?: V.Attribute.Content.Member<G> | G['identifier']; // t only
		readonly input?: V.Unmapped<'rust:attribute_input'>; // unmapped: <rust:attribute_input>
		readonly object?: V.Attribute.Content.Member<G> | G['identifier']; // t only
		readonly path?: G['identifier']; // unmapped: literal:Crate literal:Self literal:Super
		readonly property?: G['identifier']; // t only
		readonly typeArguments?: G['type'][]; // t only
	}
	export namespace Content {
		export interface Call<G extends GrammarContext> extends V.Attribute.Content<G> {
			// claimed by t
			readonly arguments: (G['expression'] | G['element'])[];
			readonly function: V.Attribute.Content.Member<G> | G['identifier'];
			readonly typeArguments?: G['type'][];
		}
		export interface Member<G extends GrammarContext> extends V.Attribute.Content<G> {
			// claimed by t
			readonly object: V.Attribute.Content.Member<G> | G['identifier'];
			readonly property: G['identifier'];
		}
		export interface Parenthesized<G extends GrammarContext> extends V.Attribute.Content<G> {
			// claimed by t
			readonly content: V.Attribute.Content.Call<G> | V.Attribute.Content.Member<G> | G['identifier'];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Attribute.Content.Call<G>
			| V.Attribute.Content.Member<G>
			| V.Attribute.Content.Parenthesized<G>;
	}
	export interface Inner<G extends GrammarContext> extends V.Attribute<G> {
		// claimed by r
		readonly content: V.Attribute.Content<G>;
	}
	export type Kinds<G extends GrammarContext> =
		| V.Attribute.Content.Call<G>
		| V.Attribute.Content.Member<G>
		| V.Attribute.Content.Parenthesized<G>
		| V.Attribute.Inner<G>;
}
