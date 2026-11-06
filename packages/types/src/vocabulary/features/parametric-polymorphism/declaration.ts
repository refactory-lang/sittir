import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap, K extends Under<'declaration.class'> = 'declaration.class'> {
		readonly typeParameters?:
			Slot<
			G,
			'declaration.class',
			'typeParameters',
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Parameters<G>
			| V.Declaration.TypeParameter.Variadic<G>
		> | Slot<
			G,
			'declaration.class',
			'typeParameters',
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Parameters<G>
			| V.Declaration.TypeParameter.Variadic<G>
		>[];
	}
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> {
		readonly typeParameters?:
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Parameters<G>
			| V.Declaration.TypeParameter.Variadic<G>
			| (
					| V.Declaration.TypeParameter<G>
					| V.Declaration.TypeParameter.Parameters<G>
					| V.Declaration.TypeParameter.Variadic<G>
			  )[];
		// p only
	}
	export interface Enum<G extends GrammarMap, K extends Under<'declaration.enum'> = 'declaration.enum'> {
		readonly typeParameters?: (
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		)[];
		// r only
	}
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
		readonly typeParameters?: (
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		)[];
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
			readonly typeParameters?: (
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			)[];
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly typeParameters?:
			Slot<
			G,
			'declaration.function',
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		> | Slot<
			G,
			'declaration.function',
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		>[];
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly typeParameters?: Slot<
				G,
				'declaration.function.signature',
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			>[];
		}
	}
	export interface Interface<G extends GrammarMap, K extends Under<'declaration.interface'> = 'declaration.interface'> {
		readonly typeParameters?: Slot<
			G,
			'declaration.interface',
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		>[];
		// rt only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarMap, K extends Under<'declaration.interface.trait'> = 'declaration.interface.trait'> {
			readonly typeParameters?: (
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			)[];
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly typeParameters?:
			Slot<
			G,
			'declaration.method',
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		> | Slot<
			G,
			'declaration.method',
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		>[];
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
			readonly typeParameters?: Slot<
				G,
				'declaration.method.signature',
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			>[];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> {
				readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			}
		}
	}
	export namespace Signature {
		export interface Call<G extends GrammarMap, K extends Under<'declaration.signature.call'> = 'declaration.signature.call'> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Construct<G extends GrammarMap, K extends Under<'declaration.signature.construct'> = 'declaration.signature.construct'> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
	export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type_alias'> = 'declaration.type_alias'> {
		readonly typeParameters?: Slot<
			G,
			'declaration.type_alias',
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		>[];
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarMap, K extends Under<'declaration.type_alias.associated'> = 'declaration.type_alias.associated'> {
			readonly typeParameters?: (
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			)[];
		}
	}
	export interface TypeParameter<G extends GrammarMap, K extends Under<'declaration.type_parameter'> = 'declaration.type_parameter'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly const?: Flag;
		// t only
		readonly default?: Slot<
			G,
			'declaration.type_parameter',
			'default',
			| V.Clause.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Block<G>
			| V.Type.Any<G>
		>;
		// rt only
		readonly name?: Slot<G, 'declaration.type_parameter', 'name', V.Identifier.Any<G>>;
	}
	export namespace TypeParameter {
		export interface Parameters<G extends GrammarMap, K extends Under<'declaration.type_parameter.parameters'> = 'declaration.type_parameter.parameters'> extends SubKindOf<V.Declaration.TypeParameter<G, K>, 'name'> {
			// claimed by p
			readonly $kind: K;
			readonly const?: never;
			readonly name: Slot<G, 'declaration.type_parameter.parameters', 'name', V.Identifier.Any<G>>;
		}
		export interface Variadic<G extends GrammarMap, K extends Under<'declaration.type_parameter.variadic'> = 'declaration.type_parameter.variadic'> extends SubKindOf<V.Declaration.TypeParameter<G, K>, 'name'> {
			// claimed by p
			readonly $kind: K;
			readonly const?: never;
			readonly name: Slot<G, 'declaration.type_parameter.variadic', 'name', V.Identifier.Any<G>>;
		}
	}
	export interface Union<G extends GrammarMap, K extends Under<'declaration.union'> = 'declaration.union'> {
		readonly typeParameters?: (
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		)[];
	}
}
