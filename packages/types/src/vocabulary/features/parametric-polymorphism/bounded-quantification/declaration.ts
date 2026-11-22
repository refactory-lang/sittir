import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Enum<G extends GrammarMap, K extends Under<'declaration.type.enum'> = 'declaration.type.enum'> {
		}
	}
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
		}
	}
	export namespace Type {
		export namespace Interface {
			export interface Trait<G extends GrammarMap, K extends Under<'declaration.type.interface.trait'> = 'declaration.type.interface.trait'> {
			}
		}
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
		}
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
			}
		}
	}
	export namespace Type {
		export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type.type_alias'> = 'declaration.type.type_alias'> {
		}
		export namespace TypeAlias {
			export interface Associated<G extends GrammarMap, K extends Under<'declaration.type.type_alias.associated'> = 'declaration.type.type_alias.associated'> {
			}
		}
	}
	export interface TypeParameter<G extends GrammarMap, K extends Under<'declaration.type_parameter'> = 'declaration.type_parameter'> {
		readonly bounds?: Slot<
			G,
			K,
			'bounds',
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Type.Any<G>
		>[];
	}
	export namespace TypeParameter {
		export interface Parameters<G extends GrammarMap, K extends Under<'declaration.type_parameter.parameters'> = 'declaration.type_parameter.parameters'> {
			readonly bounds?: never;
		}
		export interface Value<G extends GrammarMap, K extends Under<'declaration.type_parameter.value'> = 'declaration.type_parameter.value'> {
			readonly bounds?: never;
		}
		export interface Variadic<G extends GrammarMap, K extends Under<'declaration.type_parameter.variadic'> = 'declaration.type_parameter.variadic'> {
			readonly bounds?: never;
		}
	}
	export namespace Type {
		export interface Union<G extends GrammarMap, K extends Under<'declaration.type.union'> = 'declaration.type.union'> {
		}
	}
}
