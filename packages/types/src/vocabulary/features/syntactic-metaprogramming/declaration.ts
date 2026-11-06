import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Macro<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.macro';
		readonly name: Slot<G, 'declaration.macro', 'name', V.Identifier.Any<G> | string>;
		readonly rules?: V.Clause.Macro.Rule<G>[];
	}
	export namespace Macro {
		export interface Paren<G extends GrammarMap> extends SubKindOf<V.Declaration.Macro<G>> {
			// claimed by r
			readonly $kind: 'declaration.macro.paren';
		}
		export interface Bracket<G extends GrammarMap> extends SubKindOf<V.Declaration.Macro<G>> {
			// claimed by r
			readonly $kind: 'declaration.macro.bracket';
		}
		export interface Brace<G extends GrammarMap> extends SubKindOf<V.Declaration.Macro<G>> {
			// claimed by r
			readonly $kind: 'declaration.macro.brace';
		}
	}
}
