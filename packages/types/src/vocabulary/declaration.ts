import type { GrammarMap, Slot } from './map.ts';
import type { Flag, SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Declaration<G extends GrammarMap> {
	readonly $kind: 'declaration';
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
	export interface Constant<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by pr
		readonly $kind: 'declaration.constant';
		readonly name: Slot<G, 'declaration.constant', 'name', V.Identifier.Any<G>>;
		// r only
		readonly value?: Slot<
			G,
			'declaration.constant',
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
	export interface Field<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.field';
		readonly name?: Slot<
			G,
			'declaration.field',
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
		readonly value?: Slot<
			G,
			'declaration.field',
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		// t only
	}
	export interface Function<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.function';
		readonly body?: Slot<G, 'declaration.function', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly name: Slot<G, 'declaration.function', 'name', V.Identifier.Any<G>>;
		readonly parameters: Slot<
			G,
			'declaration.function',
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
		export interface Signature<G extends GrammarMap> extends SubKindOf<V.Declaration.Function<G>, 'name' | 'parameters' | 'returnType' | 'typeParameters'> {
			// claimed by rt
			readonly $kind: 'declaration.function.signature';
			readonly functionModifiers?: Slot<G, 'declaration.function.signature', 'functionModifiers', V.Modifier.Extern<G> | string>[];
			// r only
			readonly name: Slot<G, 'declaration.function.signature', 'name', V.Identifier.Any<G>>;
			readonly parameters: Slot<
				G,
				'declaration.function.signature',
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
	export interface Parameter<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.parameter';
		readonly mutable?: Flag;
		// r only
		readonly name?: Slot<G, 'declaration.parameter', 'name', unknown>;
	}
	export namespace Parameter {
		export interface Default<G extends GrammarMap> extends SubKindOf<V.Declaration.Parameter<G>, 'name' | 'default'> {
			// claimed by p
			readonly $kind: 'declaration.parameter.default';
			readonly name: Slot<G, 'declaration.parameter.default', 'name', V.Identifier.Any<G> | V.Pattern.Tuple<G>>;
		}
		export interface Typed<G extends GrammarMap> extends SubKindOf<V.Declaration.Parameter<G>, 'name' | 'type'> {
			// claimed by p
			readonly $kind: 'declaration.parameter.typed';
			readonly name: Slot<G, 'declaration.parameter.typed', 'name', V.Identifier.Any<G> | V.Pattern.Rest.Any<G>>;
		}
		export interface TypedDefault<G extends GrammarMap> extends SubKindOf<V.Declaration.Parameter<G>, 'name' | 'default' | 'type'> {
			// claimed by p
			readonly $kind: 'declaration.parameter.typed_default';
			readonly name: Slot<G, 'declaration.parameter.typed_default', 'name', V.Identifier.Any<G>>;
		}
	}
	export interface Variable<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.variable';
		readonly alternative?: V.Statement.Block<G>;
		// r only
		readonly declarators?: (V.Declaration.Variable<G> | V.Declaration.Variable.Pattern<G>)[];
		// t only
		readonly mutable?: Flag;
		// r only
		readonly name?: Slot<G, 'declaration.variable', 'name', unknown>;
		readonly value?: Slot<
			G,
			'declaration.variable',
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
		export interface Constant<G extends GrammarMap> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.constant';
			readonly declarators: (V.Declaration.Variable<G> | V.Declaration.Variable.Pattern<G>)[];
		}
		export interface Pattern<G extends GrammarMap> extends SubKindOf<V.Declaration.Variable<G>, 'name' | 'value' | 'type'> {
			// claimed by t
			readonly $kind: 'declaration.variable.pattern';
			readonly name: Slot<G, 'declaration.variable.pattern', 'name', V.Identifier.Any<G> | V.Pattern.Any<G>>;
			readonly value?: Slot<
				G,
				'declaration.variable.pattern',
				'value',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
		export interface Reassignable<G extends GrammarMap> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.reassignable';
			readonly declarators: (V.Declaration.Variable<G> | V.Declaration.Variable.Pattern<G>)[];
		}
		export namespace Reassignable {
			export interface FunctionScoped<G extends GrammarMap> extends SubKindOf<V.Declaration.Variable.Reassignable<G>> {
				// claimed by t
				readonly $kind: 'declaration.variable.reassignable.function_scoped';
			}
		}
	}
}
