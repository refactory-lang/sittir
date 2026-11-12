import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Comment<G extends GrammarMap, K extends Under<'comment'> = 'comment'> {
	readonly $path: K;
	readonly content?: Slot<G, K, 'content', unknown>;
	// prt only
}

export namespace Comment {
	export interface Line<G extends GrammarMap, K extends Under<'comment.line'> = 'comment.line'> extends SubKindOf<V.Comment<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly content: Slot<G, K, 'content', V.Comment.Text<G> | string>;
		// pr only
	}
}
