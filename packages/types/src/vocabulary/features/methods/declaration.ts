import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap> {
		readonly default?: Flag;
		// r only
	}
	export interface Method<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.method';
		readonly body?: Slot<G, 'declaration.method', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly default?: Flag;
		// rt only
		readonly doc?: V.Literal.String<G>;
		// pt only
		readonly name: Slot<
			G,
			'declaration.method',
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
		readonly parameters: Slot<
			G,
			'declaration.method',
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
		export interface Signature<G extends GrammarMap> extends SubKindOf<V.Declaration.Method<G>, 'name' | 'parameters' | 'returnType' | 'typeParameters'> {
			// claimed by rt
			readonly $kind: 'declaration.method.signature';
			readonly functionModifiers?: Slot<G, 'declaration.method.signature', 'functionModifiers', V.Modifier.Extern<G> | string>[];
			// r only
			readonly name: Slot<
				G,
				'declaration.method.signature',
				'name',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| string
				| V.Declaration.Module<G>
			>;
			readonly parameters: Slot<
				G,
				'declaration.method.signature',
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
		export interface Special<G extends GrammarMap> extends SubKindOf<V.Declaration.Method<G>, 'name'> {
			readonly $kind: 'declaration.method.special';
			readonly name: `__${string}__`;
			readonly stem: string;
		}
	}
}
