import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Declaration<G extends GrammarContext<G>> {
	readonly $kind: 'declaration';
}

export namespace Declaration {
	export interface Ambient<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.ambient';
		readonly content: G['slots']['declaration.ambient']['content'];
	}
	export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by pt
		readonly $kind: 'declaration.class';
		readonly bases?: G['slots']['declaration.class']['bases'][];
		// p only
		readonly body: G['slots']['declaration.class']['body'] | G['slots']['declaration.class']['body'][];
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly extends?: V.Clause.Extends<G>;
		// t only
		readonly implements?: G['slots']['declaration.class']['implements'][];
		// t only
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G> | V.Declaration.TypeParameter<G>[];
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Class<G>> {
			// claimed by t
			readonly $kind: 'declaration.class.abstract';
			readonly abstract?: boolean;
			readonly body: G['slots']['declaration.class.abstract']['body'][];
			readonly decorators?: V.Attribute.Decorator<G>[];
			readonly extends?: V.Clause.Extends<G>;
			readonly implements?: G['slots']['declaration.class.abstract']['implements'][];
			readonly name: V.Identifier.Type<G>;
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export type Any<G extends GrammarContext<G>> = V.Declaration.Class<G> | V.Declaration.Class.Abstract<G>;
	}
	export interface Constant<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by pr
		readonly $kind: 'declaration.constant';
		readonly name: G['identifier'];
		// r only
		readonly type: G['slots']['declaration.constant']['type'];
		// r only
		readonly value?: G['slots']['declaration.constant']['value'];
		// r only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export interface Constructor<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by pt
		readonly $kind: 'declaration.constructor';
	}
	export interface Enum<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.enum';
		readonly body: V.Declaration.EnumMember<G> | V.Declaration.EnumMember<G>[];
		readonly const?: boolean;
		// t only
		readonly name: G['identifier'];
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		// r only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export interface EnumMember<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.enum_member';
		readonly attributes?: G['attribute'][];
		// r only
		readonly body?: G['slots']['declaration.enum_member']['body'][];
		// r only
		readonly name: G['slots']['declaration.enum_member']['name'];
		readonly value?: G['slots']['declaration.enum_member']['value'];
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.EnumMember<G>> {
			// claimed by r
			readonly $kind: 'declaration.enum_member.struct';
			readonly body?: G['slots']['declaration.enum_member.struct']['body'][];
			readonly name: G['identifier'];
			readonly value?: G['slots']['declaration.enum_member.struct']['value'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.EnumMember<G>> {
			// claimed by r
			readonly $kind: 'declaration.enum_member.tuple';
			readonly body?: G['slots']['declaration.enum_member.tuple']['body'][];
			readonly name: G['identifier'];
			readonly value?: G['slots']['declaration.enum_member.tuple']['value'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.EnumMember<G>
			| V.Declaration.EnumMember.Struct<G>
			| V.Declaration.EnumMember.Tuple<G>;
	}
	export interface Extension<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.extension';
		readonly implements?: G['slots']['declaration.extension']['implements'];
		readonly receiver?: V.Declaration.Parameter.Self<G>;
		readonly traitClause?: G['slots']['declaration.extension']['traitClause'];
		readonly type: G['slots']['declaration.extension']['type'];
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		readonly unsafe?: boolean;
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Extension<G>> {
			// claimed by r
			readonly $kind: 'declaration.extension.conformance';
			readonly implements?: G['slots']['declaration.extension.conformance']['implements'];
			readonly receiver?: V.Declaration.Parameter.Self<G>;
			readonly traitClause?: G['slots']['declaration.extension.conformance']['traitClause'];
			readonly type: G['slots']['declaration.extension.conformance']['type'];
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
			readonly unsafe?: boolean;
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Any<G extends GrammarContext<G>> = V.Declaration.Extension<G> | V.Declaration.Extension.Conformance<G>;
	}
	export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.field';
		readonly abstract?: boolean;
		// t only
		readonly accessor?: boolean;
		// t only
		readonly attributes?: G['attribute'][];
		// r only
		readonly computed?: boolean;
		// t only
		readonly declare?: boolean;
		// t only
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
		readonly definite?: boolean;
		// t only
		readonly name: G['slots']['declaration.field']['name'];
		readonly optional?: boolean;
		// t only
		readonly optionality?: G['slots']['declaration.field']['optionality'];
		// t only
		readonly override?: boolean;
		// t only
		readonly private?: boolean;
		// t only
		readonly readonly?: boolean;
		// t only
		readonly static?: boolean;
		// t only
		readonly type?: G['slots']['declaration.field']['type'];
		readonly value?: G['slots']['declaration.field']['value'];
		// t only
		readonly visibility?: G['slots']['declaration.field']['visibility'];
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Field<G>> {
			// claimed by t
			readonly $kind: 'declaration.field.signature';
			readonly name: G['slots']['declaration.field.signature']['name'];
			readonly optional?: boolean;
			readonly override?: boolean;
			readonly readonly?: boolean;
			readonly static?: boolean;
			readonly type?: G['slots']['declaration.field.signature']['type'];
			readonly visibility?: G['slots']['declaration.field.signature']['visibility'];
		}
		export type Any<G extends GrammarContext<G>> = V.Declaration.Field<G> | V.Declaration.Field.Signature<G>;
	}
	export interface Function<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.function';
		readonly async?: boolean;
		readonly body?: G['slots']['declaration.function']['body'];
		readonly const?: boolean;
		// r only
		readonly decorators?: V.Attribute.Decorator<G>[];
		// p only
		readonly default?: boolean;
		// r only
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly extern?: V.Modifier.Extern<G>;
		// r only
		readonly name: G['identifier'];
		readonly parameters: G['slots']['declaration.function']['parameters'][];
		readonly returnType?: G['slots']['declaration.function']['returnType'];
		readonly typeParameters?:
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
			| (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		readonly unsafe?: boolean;
		// r only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Function<G>> {
			// claimed by t
			readonly $kind: 'declaration.function.generator';
			readonly async?: boolean;
			readonly body: V.Statement.Block<G>;
			readonly generator?: boolean;
			readonly name: G['identifier'];
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly returnType?: G['slots']['declaration.function.generator']['returnType'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Function<G>> {
			// claimed by rt
			readonly $kind: 'declaration.function.signature';
			readonly async?: boolean;
			// t only
			readonly functionModifiers?: G['slots']['declaration.function.signature']['functionModifiers'][];
			// r only
			readonly name: G['identifier'];
			readonly parameters: G['slots']['declaration.function.signature']['parameters'][];
			readonly returnType?: G['slots']['declaration.function.signature']['returnType'];
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
			readonly visibility?: V.Modifier.Visibility<G>;
			// r only
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.Function<G>
			| V.Declaration.Function.Generator<G>
			| V.Declaration.Function.Signature<G>;
	}
	export interface Interface<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.interface';
		readonly body: G['slots']['declaration.interface']['body'] | G['slots']['declaration.interface']['body'][];
		// rt only
		readonly extends?: G['clause'];
		// rt only
		readonly name: V.Identifier.Type<G>;
		// rt only
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		// rt only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Interface<G>> {
			// claimed by r
			readonly $kind: 'declaration.interface.trait';
			readonly body: G['slots']['declaration.interface.trait']['body'][];
			readonly extends?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Type<G>;
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
			readonly unsafe?: boolean;
			readonly visibility?: V.Modifier.Visibility<G>;
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Any<G extends GrammarContext<G>> = V.Declaration.Interface<G> | V.Declaration.Interface.Trait<G>;
	}
	export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.macro';
	}
	export interface Method<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.method';
		readonly accessor?: G['slots']['declaration.method']['accessor'];
		// t only
		readonly async?: boolean;
		readonly body?: G['slots']['declaration.method']['body'];
		readonly computed?: boolean;
		// t only
		readonly const?: boolean;
		// rt only
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
		readonly default?: boolean;
		// rt only
		readonly doc?: V.Literal.String<G>;
		// pt only
		readonly extern?: V.Modifier.Extern<G>;
		// rt only
		readonly generator?: boolean;
		// t only
		readonly name: G['slots']['declaration.method']['name'];
		readonly optional?: boolean;
		// t only
		readonly override?: boolean;
		// t only
		readonly parameters: G['slots']['declaration.method']['parameters'][];
		readonly private?: boolean;
		// t only
		readonly readonly?: boolean;
		// t only
		readonly returnType?: G['slots']['declaration.method']['returnType'];
		readonly static?: boolean;
		// t only
		readonly typeParameters?:
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
			| (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		readonly unsafe?: boolean;
		// rt only
		readonly visibility?: G['slots']['declaration.method']['visibility'];
		// rt only
		readonly whereClause?: V.Clause.Where<G>;
		// rt only
	}
	export namespace Method {
		export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by p
			readonly $kind: 'declaration.method.class';
		}
		export interface Dunder<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.dunder';
			readonly name: `__${string}__`;
			readonly stem: string;
		}
		// claimed by p content-derived
		export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.getter';
			readonly accessor: 'get';
		}
		export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.setter';
			readonly accessor: 'set';
		}
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by rt
			readonly $kind: 'declaration.method.signature';
			readonly accessor?: G['slots']['declaration.method.signature']['accessor'];
			// t only
			readonly async?: boolean;
			// t only
			readonly functionModifiers?: G['slots']['declaration.method.signature']['functionModifiers'][];
			// r only
			readonly name: G['slots']['declaration.method.signature']['name'];
			readonly optional?: boolean;
			// t only
			readonly override?: boolean;
			// t only
			readonly parameters: G['slots']['declaration.method.signature']['parameters'][];
			readonly readonly?: boolean;
			// t only
			readonly returnType?: G['slots']['declaration.method.signature']['returnType'];
			readonly static?: boolean;
			// t only
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
			readonly visibility?: G['slots']['declaration.method.signature']['visibility'];
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.signature.abstract';
				readonly abstract?: boolean;
				readonly accessorKind?: G['slots']['declaration.method.signature.abstract']['accessorKind'];
				readonly name: G['slots']['declaration.method.signature.abstract']['name'];
				readonly optional?: boolean;
				readonly override?: boolean;
				readonly parameters: V.Declaration.Parameter.Any<G>[];
				readonly returnType?: G['slots']['declaration.method.signature.abstract']['returnType'];
				readonly typeParameters?: V.Declaration.TypeParameter<G>[];
				readonly visibility?: G['slots']['declaration.method.signature.abstract']['visibility'];
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Declaration.Method.Signature<G>
				| V.Declaration.Method.Signature.Abstract<G>;
		}
		export interface Static<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by pr
			readonly $kind: 'declaration.method.static';
			readonly async?: boolean;
			// r only
			readonly body: V.Statement.Block<G>;
			// r only
			readonly const?: boolean;
			// r only
			readonly default?: boolean;
			// r only
			readonly extern?: V.Modifier.Extern<G>;
			// r only
			readonly name: G['identifier'];
			// r only
			readonly parameters: G['slots']['declaration.method.static']['parameters'][];
			// r only
			readonly returnType?: G['slots']['declaration.method.static']['returnType'];
			// r only
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
			// r only
			readonly unsafe?: boolean;
			// r only
			readonly visibility?: V.Modifier.Visibility<G>;
			// r only
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.Method<G>
			| V.Declaration.Method.Class<G>
			| V.Declaration.Method.Dunder<G>
			| V.Declaration.Method.Getter<G>
			| V.Declaration.Method.Setter<G>
			| V.Declaration.Method.Signature<G>
			| V.Declaration.Method.Signature.Abstract<G>
			| V.Declaration.Method.Static<G>;
	}
	export interface Module<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.module';
		readonly body?: V.Statement.Block<G>;
		// t only
		readonly name?: G['slots']['declaration.module']['name'];
		// t only
	}
	export namespace Module {
		export interface External<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Module<G>> {
			// claimed by t
			readonly $kind: 'declaration.module.external';
			readonly body?: V.Statement.Block<G>;
			readonly name: G['slots']['declaration.module.external']['name'];
		}
		export interface Foreign<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Module<G>> {
			// claimed by r
			readonly $kind: 'declaration.module.foreign';
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.Module<G>
			| V.Declaration.Module.External<G>
			| V.Declaration.Module.Foreign<G>;
	}
	export interface ModuleProperty<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.module_property';
		readonly name: V.Identifier.Property<G>;
		readonly type: G['slots']['declaration.module_property']['type'];
	}
	export interface Parameter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.parameter';
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
		readonly default?: G['slots']['declaration.parameter']['default'];
		// pt only
		readonly mutable?: boolean;
		// r only
		readonly name?: G['slots']['declaration.parameter']['name'];
		readonly override?: boolean;
		// t only
		readonly readonly?: boolean;
		// t only
		readonly type?: G['slots']['declaration.parameter']['type'];
		readonly visibility?: G['slots']['declaration.parameter']['visibility'];
		// t only
	}
	export namespace Parameter {
		export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by p
			readonly $kind: 'declaration.parameter.default';
			readonly default: G['slots']['declaration.parameter.default']['default'];
			readonly name: G['slots']['declaration.parameter.default']['name'];
		}
		export interface Optional<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by t
			readonly $kind: 'declaration.parameter.optional';
			readonly decorators?: V.Attribute.Decorator<G>[];
			readonly default?: G['slots']['declaration.parameter.optional']['default'];
			readonly name: G['slots']['declaration.parameter.optional']['name'];
			readonly optional?: boolean;
			readonly override?: boolean;
			readonly readonly?: boolean;
			readonly type?: G['slots']['declaration.parameter.optional']['type'];
			readonly visibility?: G['slots']['declaration.parameter.optional']['visibility'];
		}
		export interface Self<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by pr
			readonly $kind: 'declaration.parameter.self';
			readonly lifetime?: V.Identifier.Lifetime<G>;
			// r only
			readonly mutable?: boolean;
			// r only
			readonly reference?: boolean;
			// r only
		}
		export interface Typed<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by p
			readonly $kind: 'declaration.parameter.typed';
			readonly name: G['slots']['declaration.parameter.typed']['name'];
			readonly type: G['type'];
		}
		export interface TypedDefault<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by p
			readonly $kind: 'declaration.parameter.typed_default';
			readonly default: G['slots']['declaration.parameter.typed_default']['default'];
			readonly name: G['identifier'];
			readonly type: G['type'];
		}
		export interface Variadic<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.parameter.variadic';
			readonly mutable?: boolean;
			readonly pattern?: G['slots']['declaration.parameter.variadic']['pattern'];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Default<G>
			| V.Declaration.Parameter.Optional<G>
			| V.Declaration.Parameter.Self<G>
			| V.Declaration.Parameter.Typed<G>
			| V.Declaration.Parameter.TypedDefault<G>
			| V.Declaration.Parameter.Variadic<G>;
	}
	export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.signature';
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Signature<G>> {
			// claimed by t
			readonly $kind: 'declaration.signature.call';
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly returnType?: G['slots']['declaration.signature.call']['returnType'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Construct<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Signature<G>> {
			// claimed by t
			readonly $kind: 'declaration.signature.construct';
			readonly abstract?: boolean;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly type?: G['slots']['declaration.signature.construct']['type'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Index<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Signature<G>> {
			// claimed by t
			readonly $kind: 'declaration.signature.index';
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.Signature.Call<G>
			| V.Declaration.Signature.Construct<G>
			| V.Declaration.Signature.Index<G>;
	}
	export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.struct';
	}
	export interface TypeAlias<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.type_alias';
		readonly left?: G['type'];
		// p only
		readonly name?: V.Identifier.Type<G>;
		// rt only
		readonly right?: G['type'];
		// p only
		readonly trailingWhereClause?: V.Clause.Where<G>;
		// r only
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		// rt only
		readonly value?: G['slots']['declaration.type_alias']['value'];
		// rt only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeAlias<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_alias.associated';
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Type<G>;
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Any<G extends GrammarContext<G>> = V.Declaration.TypeAlias<G> | V.Declaration.TypeAlias.Associated<G>;
	}
	export interface TypeParameter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.type_parameter';
		readonly attributes?: G['attribute'][];
		// r only
		readonly const?: boolean;
		// t only
		readonly constraint?: G['clause'];
		// rt only
		readonly default?: G['slots']['declaration.type_parameter']['default'];
		// rt only
		readonly name?: G['identifier'];
		// rt only
		readonly types?: G['type'][];
		// p only
	}
	export namespace TypeParameter {
		export interface Const<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeParameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_parameter.const';
			readonly attributes?: G['attribute'][];
			readonly name: G['identifier'];
			readonly type: G['slots']['declaration.type_parameter.const']['type'];
			readonly value?: G['slots']['declaration.type_parameter.const']['value'];
		}
		export interface Lifetime<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.TypeParameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.type_parameter.lifetime';
			readonly attributes?: G['attribute'][];
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Lifetime<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Const<G>
			| V.Declaration.TypeParameter.Lifetime<G>;
	}
	export interface Union<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.union';
		readonly body: V.Declaration.Field<G>[];
		readonly name: V.Identifier.Type<G>;
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		readonly visibility?: V.Modifier.Visibility<G>;
		readonly whereClause?: V.Clause.Where<G>;
	}
	export interface Variable<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.variable';
		readonly alternative?: V.Statement.Block<G>;
		// r only
		readonly binding?: G['slots']['declaration.variable']['binding'];
		// t only
		readonly declarators?: V.Declaration.Variable<G>[];
		// t only
		readonly definite?: boolean;
		// t only
		readonly mutable?: boolean;
		// r only
		readonly name?: G['slots']['declaration.variable']['name'];
		readonly type?: G['slots']['declaration.variable']['type'];
		readonly value?: G['slots']['declaration.variable']['value'];
	}
	export namespace Variable {
		export interface Constant<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.constant';
			readonly binding: 'const';
			readonly declarators: V.Declaration.Variable<G>[];
		}
		export interface Pattern<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.pattern';
			readonly name: G['slots']['declaration.variable.pattern']['name'];
			readonly type?: G['slots']['declaration.variable.pattern']['type'];
			readonly value?: G['slots']['declaration.variable.pattern']['value'];
		}
		export interface Reassignable<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.reassignable';
			readonly binding?: 'let';
			readonly declarators: V.Declaration.Variable<G>[];
		}
		export namespace Reassignable {
			export interface FunctionScoped<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable.Reassignable<G>> {
				// claimed by t
				readonly $kind: 'declaration.variable.reassignable.function_scoped';
				readonly binding?: never;
			}
			export type Any<G extends GrammarContext<G>> =
				| V.Declaration.Variable.Reassignable<G>
				| V.Declaration.Variable.Reassignable.FunctionScoped<G>;
		}
		export interface Static<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by r
			readonly $kind: 'declaration.variable.static';
			readonly mutable?: boolean;
			readonly name: G['identifier'];
			readonly ref?: boolean;
			readonly type: G['slots']['declaration.variable.static']['type'];
			readonly value?: G['slots']['declaration.variable.static']['value'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Declaration.Variable<G>
			| V.Declaration.Variable.Constant<G>
			| V.Declaration.Variable.Pattern<G>
			| V.Declaration.Variable.Reassignable<G>
			| V.Declaration.Variable.Reassignable.FunctionScoped<G>
			| V.Declaration.Variable.Static<G>;
	}
	export type Any<G extends GrammarContext<G>> =
		| V.Declaration.Ambient<G>
		| V.Declaration.Class<G>
		| V.Declaration.Class.Abstract<G>
		| V.Declaration.Constant<G>
		| V.Declaration.Constructor<G>
		| V.Declaration.Enum<G>
		| V.Declaration.EnumMember<G>
		| V.Declaration.EnumMember.Struct<G>
		| V.Declaration.EnumMember.Tuple<G>
		| V.Declaration.Extension<G>
		| V.Declaration.Extension.Conformance<G>
		| V.Declaration.Field<G>
		| V.Declaration.Field.Signature<G>
		| V.Declaration.Function<G>
		| V.Declaration.Function.Generator<G>
		| V.Declaration.Function.Signature<G>
		| V.Declaration.Interface<G>
		| V.Declaration.Interface.Trait<G>
		| V.Declaration.Macro<G>
		| V.Declaration.Method<G>
		| V.Declaration.Method.Class<G>
		| V.Declaration.Method.Dunder<G>
		| V.Declaration.Method.Getter<G>
		| V.Declaration.Method.Setter<G>
		| V.Declaration.Method.Signature<G>
		| V.Declaration.Method.Signature.Abstract<G>
		| V.Declaration.Method.Static<G>
		| V.Declaration.Module<G>
		| V.Declaration.Module.External<G>
		| V.Declaration.Module.Foreign<G>
		| V.Declaration.ModuleProperty<G>
		| V.Declaration.Parameter<G>
		| V.Declaration.Parameter.Default<G>
		| V.Declaration.Parameter.Optional<G>
		| V.Declaration.Parameter.Self<G>
		| V.Declaration.Parameter.Typed<G>
		| V.Declaration.Parameter.TypedDefault<G>
		| V.Declaration.Parameter.Variadic<G>
		| V.Declaration.Signature.Call<G>
		| V.Declaration.Signature.Construct<G>
		| V.Declaration.Signature.Index<G>
		| V.Declaration.Struct<G>
		| V.Declaration.TypeAlias<G>
		| V.Declaration.TypeAlias.Associated<G>
		| V.Declaration.TypeParameter<G>
		| V.Declaration.TypeParameter.Const<G>
		| V.Declaration.TypeParameter.Lifetime<G>
		| V.Declaration.Union<G>
		| V.Declaration.Variable<G>
		| V.Declaration.Variable.Constant<G>
		| V.Declaration.Variable.Pattern<G>
		| V.Declaration.Variable.Reassignable<G>
		| V.Declaration.Variable.Reassignable.FunctionScoped<G>
		| V.Declaration.Variable.Static<G>;
}
