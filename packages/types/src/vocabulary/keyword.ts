// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type { Simplify } from 'type-fest';

import type { SubKindOf } from './utils.ts';

import type * as V from './index.ts';

export interface Keyword<G extends GrammarContext> {
	readonly kind: 'keyword';
}

export namespace Keyword {
	export interface Import<G extends GrammarContext> extends Simplify<SubKindOf<V.Keyword<G>>> {
		// claimed by r
		readonly kind: 'keyword.import';
	}
	export interface Modifier<G extends GrammarContext> extends Simplify<SubKindOf<V.Keyword<G>>> {
		// claimed by r
		readonly kind: 'keyword.modifier';
	}
	export type Any<G extends GrammarContext> = V.Keyword.Import<G> | V.Keyword.Modifier<G>;
}
