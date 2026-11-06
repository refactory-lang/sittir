import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Module<G extends GrammarMap, K extends Under<'declaration.module'> = 'declaration.module'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by rt
		readonly $kind: K;
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
		export interface External<G extends GrammarMap, K extends Under<'declaration.module.external'> = 'declaration.module.external'> extends SubKindOf<V.Declaration.Module<G, K>, 'name'> {
			// claimed by t
			readonly $kind: K;
			readonly body?: V.Statement.Block<G>;
			readonly name: Slot<G, 'declaration.module.external', 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
	}
}
