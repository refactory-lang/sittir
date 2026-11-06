import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarMap> {
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
	export interface Constructor<G extends GrammarMap> {
		readonly returnType?: Slot<G, 'declaration.constructor', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		// p only
	}
	export interface Field<G extends GrammarMap> {
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
		export interface Signature<G extends GrammarMap> {
			readonly type?: Slot<G, 'declaration.field.signature', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Function<G extends GrammarMap> {
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
		export interface Signature<G extends GrammarMap> {
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
	export interface Method<G extends GrammarMap> {
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
		export interface Signature<G extends GrammarMap> {
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
			export interface Abstract<G extends GrammarMap> {
				readonly returnType?: Slot<G, 'declaration.method.signature.abstract', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
	export interface Parameter<G extends GrammarMap> {
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
		export interface Typed<G extends GrammarMap> {
			readonly type: Slot<G, 'declaration.parameter.typed', 'type', V.Type.Any<G>>;
		}
		export interface TypedDefault<G extends GrammarMap> {
			readonly type: Slot<G, 'declaration.parameter.typed_default', 'type', V.Type.Any<G>>;
		}
	}
	export interface Property<G extends GrammarMap> {
		readonly type?: Slot<G, 'declaration.property', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export namespace Property {
		export interface Getter<G extends GrammarMap> {
			readonly returnType?: Slot<G, 'declaration.property.getter', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export namespace Signature {
			export namespace Abstract {
				export interface Getter<G extends GrammarMap> {
					readonly returnType?: Slot<
						G,
						'declaration.property.signature.abstract.getter',
						'returnType',
						| V.Identifier.Any<G>
						| V.Type.Any<G>
					>;
				}
			}
			export interface Getter<G extends GrammarMap> {
				readonly returnType?: Slot<G, 'declaration.property.signature.getter', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
	export interface Variable<G extends GrammarMap> {
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
		export interface Pattern<G extends GrammarMap> {
			readonly type?: Slot<G, 'declaration.variable.pattern', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
}
