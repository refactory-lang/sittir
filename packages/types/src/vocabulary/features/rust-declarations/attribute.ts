import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export interface Attribute<G extends GrammarMap, K extends Under<'attribute'> = 'attribute'> {
	readonly input?: Slot<G, K, 'input', V.Expression.Any<G> | V.Element.Macro.TokenTree.Delimited.Brace<G> | V.Element.Macro.TokenTree.Delimited.Bracket<G> | V.Element.Macro.TokenTree.Delimited.Paren<G>>;
	readonly inner?: Flag;
	readonly path?: Slot<G, K, 'path', V.Identifier.Any<G>>;
}
