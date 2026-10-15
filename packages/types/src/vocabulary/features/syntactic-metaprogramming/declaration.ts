import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.macro';
		readonly name: G['slots']['declaration.macro']['name'];
		readonly rules?: V.Clause.Macro.Rule<G>[];
	}
}
