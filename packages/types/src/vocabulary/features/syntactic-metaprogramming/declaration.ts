import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Macro<G extends GrammarMap, K extends Under<'declaration.macro'> = 'declaration.macro'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | string>;
		readonly rules?: Slot<G, K, 'rules', V.Clause.Macro.Rule<G>>[];
	}
	export namespace Macro {
		export interface Paren<G extends GrammarMap, K extends Under<'declaration.macro.paren'> = 'declaration.macro.paren'> extends SubKindOf<V.Declaration.Macro<G, K>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Bracket<G extends GrammarMap, K extends Under<'declaration.macro.bracket'> = 'declaration.macro.bracket'> extends SubKindOf<V.Declaration.Macro<G, K>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Brace<G extends GrammarMap, K extends Under<'declaration.macro.brace'> = 'declaration.macro.brace'> extends SubKindOf<V.Declaration.Macro<G, K>> {
			// claimed by r
			readonly $path: K;
		}
	}
}
