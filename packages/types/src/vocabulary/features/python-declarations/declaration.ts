import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
		// p only
	}
	export namespace Parameter {
		export type Identifier<G extends GrammarMap> = V.Identifier.Any<G>;
		export type Rest<G extends GrammarMap> = V.Pattern.Rest.Any<G>;
		export type Tuple<G extends GrammarMap> = V.Pattern.Tuple.Any<G>;
		export interface Defaulted<G extends GrammarMap, K extends Under<'declaration.parameter.defaulted'> = 'declaration.parameter.defaulted'> extends SubKindOf<V.Declaration.Parameter<G, K>, 'default' | 'name'> {
			// claimed by p
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Pattern.Tuple<G>>;
		}
		export interface Typed<G extends GrammarMap, K extends Under<'declaration.parameter.typed'> = 'declaration.parameter.typed'> extends SubKindOf<V.Declaration.Parameter<G, K>, 'name' | 'type'> {
			// claimed by p
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Pattern.Rest.Any<G>>;
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> extends SubKindOf<V.Declaration.Parameter<G, K>, 'default' | 'name' | 'type'> {
			// claimed by p
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
}
