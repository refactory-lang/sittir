import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.macro';
	}
	export namespace Macro {
		export interface Fragment<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.fragment';
		}
		export interface TokenBinding<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.token_binding';
			readonly name: V.Identifier.Metavariable<G>;
			readonly type: V.Element.Macro.Fragment<G>;
		}
		export interface TokenRepetition<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.token_repetition';
			readonly operator: G['slots']['element.macro.token_repetition']['operator'];
			readonly separator?: G['slots']['element.macro.token_repetition']['separator'];
			readonly tokens?: G['slots']['element.macro.token_repetition']['tokens'][];
		}
		export namespace TokenRepetition {
			export interface Pattern<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro.TokenRepetition<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_repetition.pattern';
				readonly operator: G['slots']['element.macro.token_repetition.pattern']['operator'];
				readonly separator?: G['slots']['element.macro.token_repetition.pattern']['separator'];
				readonly tokenPatterns?: G['slots']['element.macro.token_repetition.pattern']['tokenPatterns'][];
			}
		}
		export interface TokenTree<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro<G>> {
			// claimed by r
			readonly $kind: 'element.macro.token_tree';
			readonly tokens?: G['slots']['element.macro.token_tree']['tokens'][];
		}
		export namespace TokenTree {
			export interface Delimited<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.delimited';
			}
			export interface Pattern<G extends GrammarContext<G>> extends SubKindOf<V.Element.Macro.TokenTree<G>> {
				// claimed by r
				readonly $kind: 'element.macro.token_tree.pattern';
			}
		}
	}
}
