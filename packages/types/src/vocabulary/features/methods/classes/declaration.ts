import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by pt
		readonly $kind: 'declaration.class';
		readonly body: Slot<G, 'declaration.class', 'body', V.Declaration.Any<G> | V.Statement.Any<G>> | Slot<G, 'declaration.class', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>[];
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly name: Slot<G, 'declaration.class', 'name', V.Identifier.Any<G>>;
	}
	export interface Constructor<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by pt
		readonly $kind: 'declaration.constructor';
		readonly body: V.Statement.Block<G>;
		readonly parameters: Slot<
			G,
			'declaration.constructor',
			'parameters',
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Default<G>
			| V.Declaration.Parameter.Private<G>
			| V.Declaration.Parameter.Protected<G>
			| V.Declaration.Parameter.Public<G>
			| V.Declaration.Parameter.Receiver<G>
			| V.Declaration.Parameter.Typed<G>
			| V.Declaration.Parameter.TypedDefault<G>
			| V.Identifier.Any<G>
			| V.Pattern.Rest<G>
			| V.Pattern.Rest.Map<G>
			| V.Pattern.Tuple<G>
			| string
		>[];
	}
	export interface Field<G extends GrammarMap> {
		readonly static?: Flag;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap> {
			readonly static?: Flag;
		}
	}
	export interface Property<G extends GrammarMap> {
		readonly static?: Flag;
	}
}
