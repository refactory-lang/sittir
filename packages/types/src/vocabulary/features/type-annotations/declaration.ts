import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarMap, K extends Under<'declaration.constant'> = 'declaration.constant'> {
	}
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> {
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> {
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly returnType?: Slot<
			G,
			K,
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly returnType?: Slot<
			G,
			K,
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> {
			}
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly type?: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Parameter {
		export interface Typed<G extends GrammarMap, K extends Under<'declaration.parameter.typed'> = 'declaration.parameter.typed'> {
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> {
		}
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
	}
	export namespace Property {
		export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.getter'> = 'declaration.property.getter'> {
		}
		export namespace Signature {
			export namespace Abstract {
				export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter'> = 'declaration.property.signature.abstract.getter'> {
				}
			}
			export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.getter'> = 'declaration.property.signature.getter'> {
			}
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly type?: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> {
		}
	}
}
