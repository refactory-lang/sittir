import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap, K extends Under<'declaration.class'> = 'declaration.class'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by pt
		readonly $kind: K;
		readonly body: Slot<G, K, 'body', V.Declaration.Any<G> | V.Statement.Any<G>> | Slot<G, K, 'body', V.Declaration.Any<G> | V.Statement.Any<G>>[];
		readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
		// p only
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
	}
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by pt
		readonly $kind: K;
		readonly body: Slot<G, K, 'body', V.Statement.Block<G> | V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly parameters: Slot<
			G,
			K,
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
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly static?: Flag;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> {
			readonly static?: Flag;
		}
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly static?: Flag;
	}
}
