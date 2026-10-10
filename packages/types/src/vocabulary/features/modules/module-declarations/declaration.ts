import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Module<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.module';
		readonly body?: V.Statement.Block<G>;
		readonly name?: G['slots']['declaration.module']['name'];
	}
	export namespace Module {
		export interface External<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Module<G>> {
			readonly $kind: 'declaration.module.external';
			readonly body?: V.Statement.Block<G>;
			readonly name: G['slots']['declaration.module.external']['name'];
		}
	}
}
