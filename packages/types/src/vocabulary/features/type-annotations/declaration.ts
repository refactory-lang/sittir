import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarMap, K extends Under<'declaration.constant'> = 'declaration.constant'> {
		readonly type?: Slot<
			G,
			'declaration.constant',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> {
		readonly returnType?: Slot<G, 'declaration.constructor', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		// p only
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly type?: Slot<
			G,
			'declaration.field',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> {
			readonly type?: Slot<G, 'declaration.field.signature', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly returnType?: Slot<
			G,
			'declaration.function',
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly returnType?: Slot<
				G,
				'declaration.function.signature',
				'returnType',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly returnType?: Slot<
			G,
			'declaration.method',
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
			readonly returnType?: Slot<
				G,
				'declaration.method.signature',
				'returnType',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> {
				readonly returnType?: Slot<G, 'declaration.method.signature.abstract', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly type?: Slot<
			G,
			'declaration.parameter',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Parameter {
		export interface Typed<G extends GrammarMap, K extends Under<'declaration.parameter.typed'> = 'declaration.parameter.typed'> {
			readonly type: Slot<G, 'declaration.parameter.typed', 'type', V.Type.Any<G>>;
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> {
			readonly type: Slot<G, 'declaration.parameter.typed_default', 'type', V.Type.Any<G>>;
		}
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly type?: Slot<G, 'declaration.property', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export namespace Property {
		export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.getter'> = 'declaration.property.getter'> {
			readonly returnType?: Slot<G, 'declaration.property.getter', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export namespace Signature {
			export namespace Abstract {
				export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter'> = 'declaration.property.signature.abstract.getter'> {
					readonly returnType?: Slot<
						G,
						'declaration.property.signature.abstract.getter',
						'returnType',
						| V.Identifier.Any<G>
						| V.Type.Any<G>
					>;
				}
			}
			export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.getter'> = 'declaration.property.signature.getter'> {
				readonly returnType?: Slot<G, 'declaration.property.signature.getter', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly type?: Slot<
			G,
			'declaration.variable',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> {
			readonly type?: Slot<G, 'declaration.variable.pattern', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
}
