import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Macro<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.macro';
	}
	export namespace Macro {
		// claimed by r
		export type Fragment<G extends GrammarMap> = Text<G, 'element.macro.fragment'>;
		export interface TokenBinding<G extends GrammarMap> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.token_binding';
			readonly name: V.Identifier.Metavariable<G>;
			readonly fragment: V.Element.Macro.Fragment<G>;
		}
		export interface TokenRepetition<G extends GrammarMap> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.token_repetition';
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
			export interface Pattern<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenRepetition<G>, 'operator' | 'separator'> {
				// claimed by r
				readonly $kind: 'element.macro.token_repetition.pattern';
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
		export interface TokenTree<G extends GrammarMap> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.token_tree';
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
			export interface Delimited<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.delimited';
			}
			export namespace Delimited {
				export interface Paren<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree.Delimited<G>> {
					// claimed by r
					readonly $kind: 'element.macro.token_tree.delimited.paren';
				}
				export interface Bracket<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree.Delimited<G>> {
					// claimed by r
					readonly $kind: 'element.macro.token_tree.delimited.bracket';
				}
				export interface Brace<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree.Delimited<G>> {
					// claimed by r
					readonly $kind: 'element.macro.token_tree.delimited.brace';
				}
			}
			export interface Pattern<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.pattern';
			}
			export namespace Pattern {
				export interface Paren<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree.Pattern<G>> {
					// claimed by r
					readonly $kind: 'element.macro.token_tree.pattern.paren';
				}
				export interface Bracket<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree.Pattern<G>> {
					// claimed by r
					readonly $kind: 'element.macro.token_tree.pattern.bracket';
				}
				export interface Brace<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree.Pattern<G>> {
					// claimed by r
					readonly $kind: 'element.macro.token_tree.pattern.brace';
				}
			}
			export interface Paren<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.paren';
			}
			export interface Bracket<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.bracket';
			}
			export interface Brace<G extends GrammarMap> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.brace';
			}
		}
	}
}
