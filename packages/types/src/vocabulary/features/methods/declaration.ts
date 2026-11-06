import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly default?: Flag;
		// r only
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly body?: Slot<G, K, 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly default?: Flag;
		// rt only
		readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
		// pt only
		readonly name: Slot<
			G,
			K,
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
		readonly parameters: Slot<
			G,
			K,
			'parameters',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Pattern.Any<G>
			| V.Declaration.Parameter.Any<G>
			| string
			| V.Type.Any<G>
		>[];
		readonly static?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> extends SubKindOf<V.Declaration.Method<G, K>> {
			// claimed by rt
			readonly $kind: K;
			readonly functionModifiers?: Slot<G, K, 'functionModifiers', V.Modifier.Extern<G> | string>[];
			// r only
			readonly name: Slot<
				G,
				K,
				'name',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| string
				| V.Declaration.Module<G>
			>;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
				| V.Declaration.Parameter.Variadic<G>
				| string
				| V.Type.Any<G>
			>[];
			readonly static?: Flag;
			// t only
		}
		export interface Special<G extends GrammarMap, K extends Under<'declaration.method.special'> = 'declaration.method.special'> extends SubKindOf<V.Declaration.Method<G, K>, 'name'> {
			readonly $kind: K;
			readonly name: `__${string}__`;
			readonly stem: string;
		}
	}
}
