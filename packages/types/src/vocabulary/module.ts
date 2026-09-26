// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Module<G extends GrammarContext> {
	// claimed by prt
	readonly kind: 'module';
	readonly statements?: (
		| V.Statement.Block<G>
		| G['attribute']
		| V.Clause.Import.Alias<G>
		| G['declaration']
		| V.Expression.Call.Macro<G>
		| G['statement']
	)[];
}

export namespace Module {
	export type Any<G extends GrammarContext> = V.Module<G>;
}
