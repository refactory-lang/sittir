import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Object<G extends GrammarMap, K extends Under<'expression.collection.object'> = 'expression.collection.object'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly properties?: Slot<
				G,
				K,
				'properties',
				| V.Declaration.Method<G>
				| V.Element.Any<G>
				| string
				| V.Declaration.Property.Getter<G>
				| V.Declaration.Property.Setter<G>
				| V.Identifier.Any<G>
				| V.Declaration.Method.Private<G>
				| V.Declaration.Method.Protected<G>
				| V.Declaration.Method.Public<G>
				| V.Declaration.Property.Getter.Private<G>
				| V.Declaration.Property.Getter.Protected<G>
				| V.Declaration.Property.Getter.Public<G>
				| V.Declaration.Property.Setter.Private<G>
				| V.Declaration.Property.Setter.Protected<G>
				| V.Declaration.Property.Setter.Public<G>
			>[];
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G>>;
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
	export interface Meta<G extends GrammarMap, K extends Under<'expression.meta'> = 'expression.meta'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $path: K;
	}
	export interface Parenthesized<G extends GrammarMap, K extends Under<'expression.parenthesized'> = 'expression.parenthesized'> {
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export interface Sequence<G extends GrammarMap, K extends Under<'expression.sequence'> = 'expression.sequence'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly expressions: Slot<
			G,
			K,
			'expressions',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>[];
	}
}
