import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Ambient<G extends GrammarMap, K extends Under<'declaration.ambient'> = 'declaration.ambient'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly content: Slot<
			G,
			K,
			'content',
			| V.Declaration.Any<G>
			| V.Statement.Block<G>
			| V.Statement.Any<G>
		>;
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly declare?: Flag;
		// t only
	}
	export interface ModuleProperty<G extends GrammarMap, K extends Under<'declaration.module_property'> = 'declaration.module_property'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
