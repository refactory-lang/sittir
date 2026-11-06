import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Ambient<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.ambient';
		readonly content: Slot<
			G,
			'declaration.ambient',
			'content',
			| V.Declaration.Any<G>
			| V.Statement.Block<G>
			| V.Statement.Any<G>
		>;
	}
	export interface Field<G extends GrammarMap> {
		readonly declare?: Flag;
		// t only
	}
	export interface ModuleProperty<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.module_property';
		readonly name: V.Identifier<G>;
		readonly type: Slot<G, 'declaration.module_property', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
