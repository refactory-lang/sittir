// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Argument<G extends GrammarContext> {
	readonly left?: G['identifier']; // p only
	readonly object?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
}
export namespace Argument {
	export interface Keyword<G extends GrammarContext> extends V.Argument<G> {
		// claimed by p
		readonly left: G['identifier'];
		readonly object: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export type Kinds<G extends GrammarContext> = V.Argument.Keyword<G>;
}
