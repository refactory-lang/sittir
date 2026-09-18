// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Declaration<G extends GrammarContext> {
	readonly kind: 'declaration';
}

export namespace Declaration {
	export interface Class<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by pt
		readonly kind: 'declaration.class';
		readonly bases?: (G['expression'] | G['element'] | G['argument'])[];
		// p only
		readonly body: V.Unmapped<'python:suite'> | G['declaration'][];
		// unmapped: <python:suite>
		readonly declare?: boolean;
		// t only
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly extends?: V.Clause.Extends<G>;
		// t only
		readonly implements?: (G['identifier'] | G['type'])[];
		// t only
		readonly label?: V.Identifier.Label<G>;
		// t only
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[] | V.Declaration.TypeParameter<G>;
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext> extends V.Declaration.Class<G> {
			// claimed by t
			readonly kind: 'declaration.class.abstract';
			readonly abstract?: boolean;
			readonly body: G['declaration'][];
			readonly declare?: boolean;
			readonly decorators?: V.Attribute.Decorator<G>[];
			readonly extends?: V.Clause.Extends<G>;
			readonly implements?: (G['identifier'] | G['type'])[];
			readonly label?: V.Identifier.Label<G>;
			readonly name: G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export type Any<G extends GrammarContext> = V.Declaration.Class<G> | V.Declaration.Class.Abstract<G>;
	}
	export interface Constant<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by pr
		readonly kind: 'declaration.constant';
		readonly name?: G['identifier'];
		// r only
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		// r only
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export interface Constructor<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by pt
		readonly kind: 'declaration.constructor';
	}
	export interface Enum<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly kind: 'declaration.enum';
		readonly body: V.Declaration.EnumMember<G>[];
		readonly const?: boolean;
		// t only
		readonly declare?: boolean;
		// t only
		readonly label?: V.Identifier.Label<G>;
		// t only
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// r only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export interface EnumMember<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly kind: 'declaration.enum_member';
		readonly body?: V.Declaration.Field<G>[] | V.Unmapped<'rust:ordered_field_declaration_list'>;
		// r only
		// unmapped: <rust:ordered_field_declaration_list>
		readonly name: G['identifier'] | G['literal'];
		readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext> extends V.Declaration.EnumMember<G> {
			// claimed by r
			readonly kind: 'declaration.enum_member.struct';
			readonly body?: V.Declaration.Field<G>[] | V.Unmapped<'rust:ordered_field_declaration_list'>;
			// unmapped: <rust:ordered_field_declaration_list>
			readonly name: G['identifier'];
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface Tuple<G extends GrammarContext> extends V.Declaration.EnumMember<G> {
			// claimed by r
			readonly kind: 'declaration.enum_member.tuple';
			readonly body?: V.Declaration.Field<G>[] | V.Unmapped<'rust:ordered_field_declaration_list'>;
			// unmapped: <rust:ordered_field_declaration_list>
			readonly name: G['identifier'];
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.EnumMember<G>
			| V.Declaration.EnumMember.Struct<G>
			| V.Declaration.EnumMember.Tuple<G>;
	}
	export interface Extension<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly kind: 'declaration.extension';
		readonly receiver?: V.Declaration.Parameter.Self<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext> extends V.Declaration.Extension<G> {
			// claimed by r
			readonly kind: 'declaration.extension.conformance';
			readonly receiver?: V.Declaration.Parameter.Self<G>;
		}
		export type Any<G extends GrammarContext> = V.Declaration.Extension<G> | V.Declaration.Extension.Conformance<G>;
	}
	export interface Field<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly kind: 'declaration.field';
		readonly abstract?: boolean;
		// t only
		readonly accessor?: boolean;
		// t only
		readonly declare?: boolean;
		// t only
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
		readonly definite?: boolean;
		// t only
		readonly name: G['identifier'] | G['literal'];
		readonly optional?: boolean;
		// t only
		readonly optionality?: '!' | '?';
		// t only
		readonly override?: boolean;
		// t only
		readonly readonly?: boolean;
		// t only
		readonly static?: boolean;
		// t only
		readonly type?: G['type'] | V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'];
		readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		// t only
		readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public';
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext> extends V.Declaration.Field<G> {
			// claimed by t
			readonly kind: 'declaration.field.signature';
			readonly name: G['literal'] | V.Identifier.Property.Any<G>;
			readonly optional?: boolean;
			readonly override?: boolean;
			readonly readonly?: boolean;
			readonly static?: boolean;
			readonly type?: G['type'];
			readonly visibility?: 'private' | 'protected' | 'public';
		}
		export type Any<G extends GrammarContext> = V.Declaration.Field<G> | V.Declaration.Field.Signature<G>;
	}
	export interface Function<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly kind: 'declaration.function';
		readonly async?: boolean;
		readonly body?: V.Unmapped<'python:suite'> | V.Statement.Block<G>;
		// unmapped: <python:suite>
		readonly const?: boolean;
		// r only
		readonly declare?: boolean;
		// t only
		readonly decorators?: V.Attribute.Decorator<G>[];
		// p only
		readonly default?: boolean;
		// r only
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly extern?: V.Modifier.Extern<G>;
		// r only
		readonly label?: V.Identifier.Label<G>;
		// t only
		readonly name: G['identifier'];
		readonly parameters: V.Declaration.Parameter<G>[];
		readonly returnType?:
			| V.Type.Predicate.Asserts<G>
			| G['type']
			| V.Type.Predicate<G>
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[] | V.Declaration.TypeParameter<G>;
		readonly unsafe?: boolean;
		// r only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> extends V.Declaration.Function<G> {
			// claimed by t
			readonly kind: 'declaration.function.generator';
			readonly async?: boolean;
			readonly body: V.Statement.Block<G>;
			readonly declare?: boolean;
			readonly generator?: boolean;
			readonly label?: V.Identifier.Label<G>;
			readonly name: G['identifier'];
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Signature<G extends GrammarContext> extends V.Declaration.Function<G> {
			// claimed by rt
			readonly kind: 'declaration.function.signature';
			readonly async?: boolean;
			// t only
			readonly declare?: boolean;
			// t only
			readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>;
			// r only
			// unmapped: <rust:function_modifiers>
			readonly label?: V.Identifier.Label<G>;
			// t only
			readonly name: G['identifier'];
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?:
				| V.Type.Predicate.Asserts<G>
				| G['type']
				| V.Type.Predicate<G>
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly visibility?: V.Modifier.Visibility<G>;
			// r only
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.Function<G>
			| V.Declaration.Function.Generator<G>
			| V.Declaration.Function.Signature<G>;
	}
	export interface Interface<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by t
		readonly kind: 'declaration.interface';
		readonly body: G['declaration'][] | V.Type.Object<G>;
		// rt only
		readonly declare?: boolean;
		readonly extends?: G['clause'];
		// rt only
		readonly label?: V.Identifier.Label<G>;
		readonly name: G['identifier'];
		// rt only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// rt only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext> extends V.Declaration.Interface<G> {
			// claimed by r
			readonly kind: 'declaration.interface.trait';
			readonly body: G['declaration'][];
			readonly extends?: V.Clause.Bounds<G>;
			readonly name: G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly unsafe?: boolean;
			readonly visibility?: V.Modifier.Visibility<G>;
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Any<G extends GrammarContext> = V.Declaration.Interface<G> | V.Declaration.Interface.Trait<G>;
	}
	export interface Macro<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly kind: 'declaration.macro';
	}
	export interface Method<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly kind: 'declaration.method';
		readonly accessorKind?: '*' | 'get' | 'set';
		// t only
		readonly async?: boolean;
		readonly body?: V.Unmapped<'python:suite'> | V.Statement.Block<G>;
		// unmapped: <python:suite>
		readonly const?: boolean;
		// rt only
		readonly default?: boolean;
		// rt only
		readonly doc?: V.Literal.String<G>;
		// pt only
		readonly extern?: V.Modifier.Extern<G>;
		// rt only
		readonly generator?: boolean;
		// t only
		readonly name?: G['identifier'] | G['literal'];
		readonly optional?: boolean;
		// t only
		readonly override?: boolean;
		// t only
		readonly parameters?: V.Declaration.Parameter<G>[];
		readonly readonly?: boolean;
		// t only
		readonly returnType?:
			| V.Type.Predicate.Asserts<G>
			| G['type']
			| V.Type.Predicate<G>
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| G['identifier'];
		readonly static?: boolean;
		// t only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[] | V.Declaration.TypeParameter<G>;
		readonly unsafe?: boolean;
		// rt only
		readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public';
		// rt only
		readonly whereClause?: V.Clause.Where<G>;
		// rt only
	}
	export namespace Method {
		export interface Class<G extends GrammarContext> extends V.Declaration.Method<G> {
			// claimed by p
			readonly kind: 'declaration.method.class';
		}
		export interface Dunder<G extends GrammarContext> extends V.Declaration.Method<G> {
			readonly name: `__ ${string}__`;
			readonly stem: string;
		}
		// claimed by p content-derived

		export interface Getter<G extends GrammarContext> extends V.Declaration.Method<G> {
			readonly kind: 'declaration.method.getter';
			readonly accessorKind: 'get';
		}
		export interface Setter<G extends GrammarContext> extends V.Declaration.Method<G> {
			readonly kind: 'declaration.method.setter';
			readonly accessorKind: 'set';
		}
		export interface Signature<G extends GrammarContext> extends V.Declaration.Method<G> {
			// claimed by rt
			readonly kind: 'declaration.method.signature';
			readonly accessorKind?: '*' | 'get' | 'set';
			// t only
			readonly async?: boolean;
			// t only
			readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>;
			// r only
			// unmapped: <rust:function_modifiers>
			readonly name: G['identifier'] | G['literal'];
			readonly optional?: boolean;
			// t only
			readonly override?: boolean;
			// t only
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly readonly?: boolean;
			// t only
			readonly returnType?:
				| V.Type.Predicate.Asserts<G>
				| G['type']
				| V.Type.Predicate<G>
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier'];
			readonly static?: boolean;
			// t only
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public';
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> extends V.Declaration.Method.Signature<G> {
				// claimed by t
				readonly kind: 'declaration.method.signature.abstract';
				readonly abstract?: boolean;
				readonly accessorKind?: '*' | 'get' | 'set';
				readonly name: G['literal'] | V.Identifier.Property.Any<G>;
				readonly optional?: boolean;
				readonly override?: boolean;
				readonly parameters: V.Declaration.Parameter<G>[];
				readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
				readonly typeParameters?: V.Declaration.TypeParameter<G>[];
				readonly visibility?: 'private' | 'protected' | 'public';
			}
			export type Any<G extends GrammarContext> =
				| V.Declaration.Method.Signature<G>
				| V.Declaration.Method.Signature.Abstract<G>;
		}
		export interface Static<G extends GrammarContext> extends V.Declaration.Method<G> {
			// claimed by pr
			readonly kind: 'declaration.method.static';
			readonly async?: boolean;
			// r only
			readonly body?: V.Statement.Block<G>;
			// r only
			readonly const?: boolean;
			// r only
			readonly default?: boolean;
			// r only
			readonly extern?: V.Modifier.Extern<G>;
			// r only
			readonly name?: G['identifier'];
			// r only
			readonly parameters?: V.Declaration.Parameter<G>[];
			// r only
			readonly returnType?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			// r only
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			// r only
			readonly unsafe?: boolean;
			// r only
			readonly visibility?: V.Modifier.Visibility<G>;
			// r only
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.Method<G>
			| V.Declaration.Method.Class<G>
			| V.Declaration.Method.Dunder<G>
			| V.Declaration.Method.Getter<G>
			| V.Declaration.Method.Setter<G>
			| V.Declaration.Method.Signature<G>
			| V.Declaration.Method.Signature.Abstract<G>
			| V.Declaration.Method.Static<G>;
	}
	export interface Module<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly kind: 'declaration.module';
		readonly body?: V.Statement.Block<G>;
		// t only
		readonly declare?: boolean;
		// t only
		readonly label?: V.Identifier.Label<G>;
		// t only
		readonly name?: G['identifier'] | V.Literal.String<G>;
		// t only
	}
	export namespace Module {
		export interface External<G extends GrammarContext> extends V.Declaration.Module<G> {
			// claimed by t
			readonly kind: 'declaration.module.external';
			readonly body?: V.Statement.Block<G>;
			readonly declare?: boolean;
			readonly label?: V.Identifier.Label<G>;
			readonly name: G['identifier'] | V.Literal.String<G>;
		}
		export interface Foreign<G extends GrammarContext> extends V.Declaration.Module<G> {
			// claimed by r
			readonly kind: 'declaration.module.foreign';
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.Module<G>
			| V.Declaration.Module.External<G>
			| V.Declaration.Module.Foreign<G>;
	}
	export interface Parameter<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly kind: 'declaration.parameter';
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
		readonly default?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// pt only
		readonly mutable?: boolean;
		// r only
		readonly name?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly override?: boolean;
		// t only
		readonly readonly?: boolean;
		// t only
		readonly type?: G['type'] | V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'];
		readonly visibility?: 'private' | 'protected' | 'public';
		// t only
	}
	export namespace Parameter {
		export interface Default<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by p
			readonly kind: 'declaration.parameter.default';
			readonly default: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly name: G['identifier'] | V.Pattern.Tuple<G>;
		}
		export interface Optional<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by t
			readonly kind: 'declaration.parameter.optional';
			readonly decorators?: V.Attribute.Decorator<G>[];
			readonly default?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly name: G['expression'] | G['identifier'] | V.Literal.Null.Undefined<G> | G['pattern'];
			readonly optional?: boolean;
			readonly override?: boolean;
			readonly readonly?: boolean;
			readonly type?: G['type'];
			readonly visibility?: 'private' | 'protected' | 'public';
		}
		export interface Self<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by pr
			readonly kind: 'declaration.parameter.self';
			readonly lifetime?: V.Identifier.Lifetime<G>;
			// r only
			readonly mutable?: boolean;
			// r only
			readonly reference?: boolean;
			// r only
		}
		export interface Typed<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by p
			readonly kind: 'declaration.parameter.typed';
			readonly content: G['identifier'] | V.Pattern.Splat.Any<G>;
			readonly type: G['type'];
		}
		export interface TypedDefault<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by p
			readonly kind: 'declaration.parameter.typed_default';
			readonly default: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly name: G['identifier'];
			readonly type: G['type'];
		}
		export interface Variadic<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by r
			readonly kind: 'declaration.parameter.variadic';
			readonly mutableSpecifier?: boolean;
			readonly pattern?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Default<G>
			| V.Declaration.Parameter.Optional<G>
			| V.Declaration.Parameter.Self<G>
			| V.Declaration.Parameter.Typed<G>
			| V.Declaration.Parameter.TypedDefault<G>
			| V.Declaration.Parameter.Variadic<G>;
	}
	export interface Signature<G extends GrammarContext> extends V.Declaration<G> {
		readonly kind: 'declaration.signature';
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext> extends V.Declaration.Signature<G> {
			// claimed by t
			readonly kind: 'declaration.signature.call';
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Construct<G extends GrammarContext> extends V.Declaration.Signature<G> {
			// claimed by t
			readonly kind: 'declaration.signature.construct';
			readonly abstract?: boolean;
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly type?: G['type'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Index<G extends GrammarContext> extends V.Declaration.Signature<G> {
			// claimed by t
			readonly kind: 'declaration.signature.index';
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.Signature.Call<G>
			| V.Declaration.Signature.Construct<G>
			| V.Declaration.Signature.Index<G>;
	}
	export interface Struct<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly kind: 'declaration.struct';
	}
	export interface TypeAlias<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly kind: 'declaration.type_alias';
		readonly declare?: boolean;
		// t only
		readonly label?: V.Identifier.Label<G>;
		// t only
		readonly left?: G['type'];
		// p only
		readonly name?: G['identifier'];
		// rt only
		readonly right?: G['type'];
		// p only
		readonly trailingWhereClause?: V.Clause.Where<G>;
		// r only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// rt only
		readonly value?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		// rt only
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext> extends V.Declaration.TypeAlias<G> {
			// claimed by r
			readonly kind: 'declaration.type_alias.associated';
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Any<G extends GrammarContext> = V.Declaration.TypeAlias<G> | V.Declaration.TypeAlias.Associated<G>;
	}
	export interface TypeParameter<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly kind: 'declaration.type_parameter';
		readonly const?: boolean;
		// t only
		readonly constraint?: G['clause'];
		// rt only
		readonly default?: G['clause'] | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		// rt only
		readonly name?: G['identifier'];
		// rt only
		readonly types?: V.Unmapped<'python:types'>;
		// p only
		// unmapped: <python:types>
	}
	export namespace TypeParameter {
		export interface Const<G extends GrammarContext> extends V.Declaration.TypeParameter<G> {
			// claimed by r
			readonly kind: 'declaration.type_parameter.const';
			readonly name: G['identifier'];
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly value?: G['identifier'] | G['literal'] | V.Statement.Block<G>;
		}
		export interface Lifetime<G extends GrammarContext> extends V.Declaration.TypeParameter<G> {
			// claimed by r
			readonly kind: 'declaration.type_parameter.lifetime';
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Lifetime<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Const<G>
			| V.Declaration.TypeParameter.Lifetime<G>;
	}
	export interface Union<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly kind: 'declaration.union';
		readonly body: V.Declaration.Field<G>[];
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		readonly visibility?: V.Modifier.Visibility<G>;
		readonly whereClause?: V.Clause.Where<G>;
	}
	export interface Variable<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly kind: 'declaration.variable';
		readonly alternative?: V.Statement.Block<G>;
		// r only
		readonly mutableSpecifier?: boolean;
		// r only
		readonly name?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// r only
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		// r only
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
	}
	export namespace Variable {
		export interface Lexical<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by t
			readonly kind: 'declaration.variable.lexical';
			readonly declarators: V.Unmapped<'typescript:variable_declarator'>[];
			// unmapped: <typescript:variable_declarator>
			readonly declare?: boolean;
			readonly keyword: 'const' | 'let';
			readonly label?: V.Identifier.Label<G>;
		}
		export interface Pattern<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by t
			readonly kind: 'declaration.variable.pattern';
		}
		export interface Static<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by r
			readonly kind: 'declaration.variable.static';
			readonly mutableSpecifier?: boolean;
			readonly name: G['identifier'];
			readonly ref?: boolean;
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface Var<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by t
			readonly kind: 'declaration.variable.var';
			readonly declarators: V.Unmapped<'typescript:variable_declarator'>[];
			// unmapped: <typescript:variable_declarator>
			readonly declare?: boolean;
			readonly label?: V.Identifier.Label<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Declaration.Variable<G>
			| V.Declaration.Variable.Lexical<G>
			| V.Declaration.Variable.Pattern<G>
			| V.Declaration.Variable.Static<G>
			| V.Declaration.Variable.Var<G>;
	}
	export type Any<G extends GrammarContext> =
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
		| V.Declaration.Variable.Lexical<G>
		| V.Declaration.Variable.Pattern<G>
		| V.Declaration.Variable.Static<G>
		| V.Declaration.Variable.Var<G>;
}
