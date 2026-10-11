import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Module<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.module';
		readonly body?: V.Statement.Block<G> | G['slots']['declaration.module']['body'][];
		readonly name?: G['slots']['declaration.module']['name'];
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace Module {
		export interface External<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Module<G>> {
			// claimed by t
			readonly $kind: 'declaration.module.external';
			readonly body?: V.Statement.Block<G>;
			readonly name: G['slots']['declaration.module.external']['name'];
		}
	}
}
