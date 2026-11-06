import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly name: Slot<
			G,
			K,
			'name',
			| V.Expression.Any<G>
			| V.Literal.Any<G>
			| V.Identifier<G>
			| string
			| V.Declaration.Module<G>
			| V.Identifier.Any<G>
		>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
	}
	export namespace Property {
		export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.getter'> = 'declaration.property.getter'> extends SubKindOf<V.Declaration.Property<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
			readonly parameters: Slot<G, K, 'parameters', V.Declaration.Parameter.Any<G>>[];
		}
		export interface Setter<G extends GrammarMap, K extends Under<'declaration.property.setter'> = 'declaration.property.setter'> extends SubKindOf<V.Declaration.Property<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			>[];
		}
	}
}
