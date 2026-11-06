import type { GrammarMap, Slot } from './map.ts';
import type { Flag, SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Declaration<G extends GrammarMap, K extends Under<'declaration'> = 'declaration'> {
	readonly $path: K;
}

export interface DeclarationSynonyms {
	readonly constructor: 'initializer' | 'init';
	readonly enum_member: 'variant' | 'enumerator';
	readonly extension: 'impl';
	readonly foreign: 'extern';
	readonly index: 'indexer';
	readonly internal: 'crate';
	readonly module: 'mod';
	readonly parameters: 'param_spec';
	readonly receiver: 'self' | 'this';
	readonly special: 'dunder' | 'magic';
	readonly struct: 'record';
	readonly type_alias: 'typedef' | 'typealias';
}

export namespace Declaration {
	export interface Constant<G extends GrammarMap, K extends Under<'declaration.constant'> = 'declaration.constant'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by pr
		readonly $path: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		// r only
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly name?: Slot<
			G,
			K,
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
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
		// t only
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly body?: Slot<G, K, 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
		// p only
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
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
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> extends SubKindOf<V.Declaration.Function<G, K>> {
			// claimed by rt
			readonly $path: K;
			readonly functionModifiers?: Slot<G, K, 'functionModifiers', V.Modifier.Extern<G> | string>[];
			// r only
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
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
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly mutable?: Flag;
		// r only
		readonly name?: Slot<G, K, 'name', unknown>;
	}
	export namespace Parameter {
		export interface Default<G extends GrammarMap, K extends Under<'declaration.parameter.default'> = 'declaration.parameter.default'> extends SubKindOf<V.Declaration.Parameter<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Pattern.Tuple<G>>;
		}
		export interface Typed<G extends GrammarMap, K extends Under<'declaration.parameter.typed'> = 'declaration.parameter.typed'> extends SubKindOf<V.Declaration.Parameter<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Pattern.Rest.Any<G>>;
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> extends SubKindOf<V.Declaration.Parameter<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly alternative?: Slot<G, K, 'alternative', V.Statement.Block<G>>;
		// r only
		readonly declarators?: Slot<
			G,
			K,
			'declarators',
			| V.Declaration.Variable<G>
			| V.Declaration.Variable.Pattern<G>
			| V.Declaration.Variable.Constant<G>
			| V.Declaration.Variable.Reassignable<G>
		>[];
		// t only
		readonly mutable?: Flag;
		// r only
		readonly name?: Slot<G, K, 'name', unknown>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Declaration.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
	export namespace Variable {
		export interface Constant<G extends GrammarMap, K extends Under<'declaration.variable.constant'> = 'declaration.variable.constant'> extends SubKindOf<V.Declaration.Variable<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly declarators: Slot<
				G,
				K,
				'declarators',
				| V.Declaration.Variable<G>
				| V.Declaration.Variable.Pattern<G>
				| V.Declaration.Variable.Constant<G>
				| V.Declaration.Variable.Reassignable<G>
			>[];
		}
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> extends SubKindOf<V.Declaration.Variable<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Pattern.Any<G>>;
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
		export interface Reassignable<G extends GrammarMap, K extends Under<'declaration.variable.reassignable'> = 'declaration.variable.reassignable'> extends SubKindOf<V.Declaration.Variable<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly declarators: Slot<
				G,
				K,
				'declarators',
				| V.Declaration.Variable<G>
				| V.Declaration.Variable.Pattern<G>
				| V.Declaration.Variable.Constant<G>
				| V.Declaration.Variable.Reassignable<G>
			>[];
		}
		export namespace Reassignable {
			export interface FunctionScoped<G extends GrammarMap, K extends Under<'declaration.variable.reassignable.function_scoped'> = 'declaration.variable.reassignable.function_scoped'> extends SubKindOf<V.Declaration.Variable.Reassignable<G, K>> {
				// claimed by t
				readonly $path: K;
			}
		}
	}
}
