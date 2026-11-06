import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Module<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.module';
		readonly body?: V.Statement.Block<G> | Slot<
			G,
			'declaration.module',
			'body',
			| V.Attribute.Any<G>
			| V.Declaration.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Statement.Any<G>
		>[];
		readonly name?: Slot<G, 'declaration.module', 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
	}
	export namespace Module {
		export interface External<G extends GrammarMap> extends SubKindOf<V.Declaration.Module<G>, 'name'> {
			// claimed by t
			readonly $kind: 'declaration.module.external';
			readonly body?: V.Statement.Block<G>;
			readonly name: Slot<G, 'declaration.module.external', 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
	}
}
