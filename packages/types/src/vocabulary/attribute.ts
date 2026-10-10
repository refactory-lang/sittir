import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarContext<G>> {
	// claimed by r
	readonly $kind: 'attribute';
	readonly content?: G['slots']['attribute']['content'];
	// prt only
}

export namespace Attribute {
	export interface Content<G extends GrammarContext<G>> extends SubKindOf<V.Attribute<G>> {
		// claimed by r
		readonly $kind: 'attribute.content';
		readonly input?: G['slots']['attribute.content']['input'];
		readonly path?: G['identifier'];
	}
}
