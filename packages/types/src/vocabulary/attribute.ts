import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarMap> {
	// claimed by r
	readonly $kind: 'attribute';
	readonly content?: Slot<
		G,
		'attribute',
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
	export interface Content<G extends GrammarMap> extends SubKindOf<V.Attribute<G>> {
		// claimed by r
		readonly $kind: 'attribute.content';
		readonly input?: Slot<
			G,
			'attribute.content',
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
		readonly path?: Slot<G, 'attribute.content', 'path', V.Identifier.Any<G>>;
	}
}
