import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Macro<G extends GrammarMap, K extends Under<'element.macro'> = 'element.macro'> extends SubKindOf<V.Element<G, K>> {
		readonly $kind: K;
	}
	export namespace Macro {
		// claimed by r
		export type Fragment<G extends GrammarMap> = Text<G, 'element.macro.fragment'>;
		export interface TokenBinding<G extends GrammarMap, K extends Under<'element.macro.token_binding'> = 'element.macro.token_binding'> extends SubKindOf<V.Element.Macro<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly name: V.Identifier.Metavariable<G>;
			readonly fragment: V.Element.Macro.Fragment<G>;
		}
		export interface TokenRepetition<G extends GrammarMap, K extends Under<'element.macro.token_repetition'> = 'element.macro.token_repetition'> extends SubKindOf<V.Element.Macro<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly operator: Slot<G, 'element.macro.token_repetition', 'operator', string>;
			readonly separator?: Slot<G, 'element.macro.token_repetition', 'separator', string>;
			readonly tokens?: Slot<
				G,
				'element.macro.token_repetition',
				'tokens',
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| string
				| V.Element.Macro.Any<G>
				| V.Type.Primitive<G>
			>[];
		}
		export namespace TokenRepetition {
			export interface Pattern<G extends GrammarMap, K extends Under<'element.macro.token_repetition.pattern'> = 'element.macro.token_repetition.pattern'> extends SubKindOf<V.Element.Macro.TokenRepetition<G, K>, 'operator' | 'separator'> {
				// claimed by r
				readonly $kind: K;
				readonly operator: Slot<G, 'element.macro.token_repetition.pattern', 'operator', string>;
				readonly separator?: Slot<G, 'element.macro.token_repetition.pattern', 'separator', string>;
				readonly tokenPatterns?: Slot<
					G,
					'element.macro.token_repetition.pattern',
					'tokenPatterns',
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| string
					| V.Element.Macro.TokenBinding<G>
					| V.Element.Macro.TokenRepetition.Pattern<G>
					| V.Element.Macro.TokenTree.Pattern.Brace<G>
					| V.Element.Macro.TokenTree.Pattern.Bracket<G>
					| V.Element.Macro.TokenTree.Pattern.Paren<G>
					| V.Type.Primitive<G>
				>[];
			}
		}
		export interface TokenTree<G extends GrammarMap, K extends Under<'element.macro.token_tree'> = 'element.macro.token_tree'> extends SubKindOf<V.Element.Macro<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly tokens?: Slot<
				G,
				'element.macro.token_tree',
				'tokens',
				| V.Element.Macro.TokenBinding<G>
				| V.Element.Macro.TokenRepetition.Any<G>
				| V.Element.Macro.TokenTree.Brace<G>
				| V.Element.Macro.TokenTree.Bracket<G>
				| V.Element.Macro.TokenTree.Paren<G>
				| V.Element.Macro.TokenTree.Delimited.Brace<G>
				| V.Element.Macro.TokenTree.Delimited.Bracket<G>
				| V.Element.Macro.TokenTree.Delimited.Paren<G>
				| V.Element.Macro.TokenTree.Pattern.Brace<G>
				| V.Element.Macro.TokenTree.Pattern.Bracket<G>
				| V.Element.Macro.TokenTree.Pattern.Paren<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| string
			>[];
		}
		export namespace TokenTree {
			export interface Delimited<G extends GrammarMap, K extends Under<'element.macro.token_tree.delimited'> = 'element.macro.token_tree.delimited'> extends SubKindOf<V.Element.Macro.TokenTree<G, K>> {
				// claimed by r
				readonly $kind: K;
			}
			export namespace Delimited {
				export interface Paren<G extends GrammarMap, K extends Under<'element.macro.token_tree.delimited.paren'> = 'element.macro.token_tree.delimited.paren'> extends SubKindOf<V.Element.Macro.TokenTree.Delimited<G, K>> {
					// claimed by r
					readonly $kind: K;
				}
				export interface Bracket<G extends GrammarMap, K extends Under<'element.macro.token_tree.delimited.bracket'> = 'element.macro.token_tree.delimited.bracket'> extends SubKindOf<V.Element.Macro.TokenTree.Delimited<G, K>> {
					// claimed by r
					readonly $kind: K;
				}
				export interface Brace<G extends GrammarMap, K extends Under<'element.macro.token_tree.delimited.brace'> = 'element.macro.token_tree.delimited.brace'> extends SubKindOf<V.Element.Macro.TokenTree.Delimited<G, K>> {
					// claimed by r
					readonly $kind: K;
				}
			}
			export interface Pattern<G extends GrammarMap, K extends Under<'element.macro.token_tree.pattern'> = 'element.macro.token_tree.pattern'> extends SubKindOf<V.Element.Macro.TokenTree<G, K>> {
				// claimed by r
				readonly $kind: K;
			}
			export namespace Pattern {
				export interface Paren<G extends GrammarMap, K extends Under<'element.macro.token_tree.pattern.paren'> = 'element.macro.token_tree.pattern.paren'> extends SubKindOf<V.Element.Macro.TokenTree.Pattern<G, K>> {
					// claimed by r
					readonly $kind: K;
				}
				export interface Bracket<G extends GrammarMap, K extends Under<'element.macro.token_tree.pattern.bracket'> = 'element.macro.token_tree.pattern.bracket'> extends SubKindOf<V.Element.Macro.TokenTree.Pattern<G, K>> {
					// claimed by r
					readonly $kind: K;
				}
				export interface Brace<G extends GrammarMap, K extends Under<'element.macro.token_tree.pattern.brace'> = 'element.macro.token_tree.pattern.brace'> extends SubKindOf<V.Element.Macro.TokenTree.Pattern<G, K>> {
					// claimed by r
					readonly $kind: K;
				}
			}
			export interface Paren<G extends GrammarMap, K extends Under<'element.macro.token_tree.paren'> = 'element.macro.token_tree.paren'> extends SubKindOf<V.Element.Macro.TokenTree<G, K>> {
				// claimed by r
				readonly $kind: K;
			}
			export interface Bracket<G extends GrammarMap, K extends Under<'element.macro.token_tree.bracket'> = 'element.macro.token_tree.bracket'> extends SubKindOf<V.Element.Macro.TokenTree<G, K>> {
				// claimed by r
				readonly $kind: K;
			}
			export interface Brace<G extends GrammarMap, K extends Under<'element.macro.token_tree.brace'> = 'element.macro.token_tree.brace'> extends SubKindOf<V.Element.Macro.TokenTree<G, K>> {
				// claimed by r
				readonly $kind: K;
			}
		}
	}
}
