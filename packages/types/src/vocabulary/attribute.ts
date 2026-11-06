import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarMap, K extends Under<'attribute'> = 'attribute'> {
	// claimed by r
	readonly $path: K;
	readonly content?: Slot<
		G,
		K,
		'content',
		| V.Expression.Any<G>
		| V.Identifier.Any<G>
		| V.Literal.Any<G>
		| V.Pattern.Any<G>
		| V.Attribute.Content.Any<G>
	>;
	// prt only
}

export namespace Attribute {
	export interface Content<G extends GrammarMap, K extends Under<'attribute.content'> = 'attribute.content'> extends SubKindOf<V.Attribute<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly input?: Slot<
			G,
			K,
			'input',
			| V.Element.Macro.TokenTree.Delimited.Brace<G>
			| V.Element.Macro.TokenTree.Delimited.Bracket<G>
			| V.Element.Macro.TokenTree.Delimited.Paren<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly path?: Slot<G, K, 'path', V.Identifier.Any<G>>;
	}
}
