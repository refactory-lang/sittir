import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarMap, K extends Under<'declaration.constant'> = 'declaration.constant'> {
	}
	export namespace Member {
		export interface Constructor<G extends GrammarMap, K extends Under<'declaration.member.constructor'> = 'declaration.member.constructor'> {
		}
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
		}
		export namespace Field {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.field.signature'> = 'declaration.member.field.signature'> {
			}
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly returnType?: Slot<
			G,
			K,
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
		}
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
			readonly returnType?: Slot<
				G,
				K,
				'returnType',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
				| V.Type.Any<G>
			>;
		}
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
			}
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract'> = 'declaration.member.method.signature.abstract'> {
				}
			}
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly type?: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Parameter {
		export interface Typed<G extends GrammarMap, K extends Under<'declaration.parameter.typed'> = 'declaration.parameter.typed'> {
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> {
		}
	}
	export namespace Member {
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
		}
		export namespace Property {
			export interface Getter<G extends GrammarMap, K extends Under<'declaration.member.property.getter'> = 'declaration.member.property.getter'> {
			}
			export namespace Signature {
				export namespace Abstract {
					export interface Getter<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.getter'> = 'declaration.member.property.signature.abstract.getter'> {
					}
				}
				export interface Getter<G extends GrammarMap, K extends Under<'declaration.member.property.signature.getter'> = 'declaration.member.property.signature.getter'> {
				}
			}
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly type?: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> {
		}
	}
}
