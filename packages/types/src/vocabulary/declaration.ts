// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Declaration<G extends GrammarContext> {
	readonly abstract?: boolean; // t only
	readonly accessor?: boolean; // t only
	readonly accessorKind?: '*' | 'get' | 'set'; // t only
	readonly alternative?: V.Statement.Block<G>; // r only
	readonly async?: boolean; // pt only
	readonly bases?: (G['expression'] | G['element'] | G['argument'])[]; // p only
	readonly body?:
		| V.Statement.Block<G>
		| G['declaration'][]
		| V.Declaration.EnumMember<G>[]
		| V.Declaration.Field<G>[]
		| V.Type.Object<G>; // prt only   // unmapped: literal:_SuiteEmpty
	readonly bounds?: V.Clause.Bounds<G>; // r only
	readonly const?: boolean; // t only
	readonly constraint?: G['clause']; // rt only
	readonly content?:
		| V.Unmapped<'python:assignment_eq'>
		| V.Unmapped<'python:assignment_type'>
		| V.Unmapped<'python:assignment_typed'>
		| G['declaration'][]
		| V.Unmapped<'rust:impl_item_body'>
		| V.Unmapped<'rust:macro_definition_brace'>
		| V.Unmapped<'rust:macro_definition_bracket'>
		| V.Unmapped<'rust:macro_definition_paren'>
		| V.Unmapped<'rust:struct_item_brace'>
		| V.Unmapped<'rust:struct_item_tuple'>
		| V.Unmapped<'typescript:index_signature_colon'>
		| V.Clause.MappedType<G>
		| G['identifier']
		| V.Pattern.Splat.Kinds<G>; // prt only   // unmapped: <python:assignment_eq> <python:assignment_type> <python:assignment_typed> <rust:impl_item_body> <rust:macro_definition_brace> <rust:macro_definition_bracket> <rust:macro_definition_paren> <rust:struct_item_brace> <rust:struct_item_tuple> <typescript:index_signature_colon> literal:ForeignModItemSemi literal:ImplItemSemi literal:ModItemExternal literal:StructItemUnit
	readonly declarators?: V.Unmapped<'typescript:variable_declarator'>[]; // t only   // unmapped: <typescript:variable_declarator>
	readonly declare?: boolean; // t only
	readonly decorator?: V.Attribute.Decorator<G>[]; // pt only
	readonly default?:
		| G['clause']
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| G['type']; // prt only // rt only
	readonly extern?: V.Modifier.Extern<G>; // r only
	readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>; // r only   // unmapped: <rust:function_modifiers>
	readonly extends?: V.Clause.Extends.Type<G> | V.Clause.Bounds<G> | G['expression']; // t only
	readonly implements?: G['type'][]; // t only
	readonly kind?: 'const' | 'let'; // t only
	readonly label?: V.Identifier.Label<G>; // t only
	readonly left?: G['type']; // p only
	readonly lifetime?: V.Identifier.Lifetime<G>; // r only
	readonly mutable?: boolean; // r only
	readonly mutableSpecifier?: boolean; // r only
	readonly name?:
		| V.Unmapped<'python:pattern'>
		| V.Unmapped<'typescript:__property_identifier'>
		| V.Unmapped<'typescript:pattern'>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']; // prt only   // unmapped: <python:pattern> <typescript:__property_identifier> <typescript:pattern>
	readonly optional?: boolean; // t only
	readonly optionality?: '!' | '?'; // t only
	readonly override?: boolean; // t only
	readonly parameters?: V.Declaration.Parameter<G>[]; // prt only
	readonly pattern?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // r only
	readonly readonly?: boolean; // t only
	readonly ref?: boolean; // r only
	readonly reference?: boolean; // r only
	readonly returnType?:
		| V.Type.Predicate.Asserts<G>
		| G['type']
		| V.Type.Predicate<G>
		| V.Clause.Bounds.Removed<G>
		| V.Expression.Call.Macro<G>
		| G['identifier']; // prt only
	readonly right?: G['type']; // p only
	readonly sign?: '+' | '-'; // t only
	readonly static?: boolean; // t only
	readonly trailingWhereClause?: V.Clause.Where<G>; // r only
	readonly traitClause?: V.Unmapped<'rust:impl_item_negative_clause'> | V.Unmapped<'rust:impl_item_positive_clause'>; // r only   // unmapped: <rust:impl_item_negative_clause> <rust:impl_item_positive_clause>
	readonly type?: G['type'] | V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier']; // prt only
	readonly typeParameters?: V.Declaration.TypeParameter<G>[] | V.Declaration.TypeParameter<G>; // prt only
	readonly types?: V.Unmapped<'python:types'>; // p only   // unmapped: <python:types>
	readonly unsafe?: boolean; // r only
	readonly value?:
		| V.Unmapped<'rust:literal'>
		| V.Clause.Bounds.Removed<G>
		| V.Declaration.Module<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['statement']
		| G['type']; // rt only   // unmapped: <rust:literal>
	readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public'; // rt only
	readonly whereClause?: V.Clause.Where<G>; // r only
}
export namespace Declaration {
	export interface Class<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by pt
		readonly bases?: (G['expression'] | G['element'] | G['argument'])[]; // p only
		readonly body: V.Statement.Block<G> | G['declaration'][]; // unmapped: literal:_SuiteEmpty
		readonly declare?: boolean; // t only
		readonly decorator?: V.Attribute.Decorator<G>[];
		readonly extends?: G['expression']; // t only
		readonly implements?: G['type'][]; // t only
		readonly label?: V.Identifier.Label<G>; // t only
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[] | V.Declaration.TypeParameter<G>;
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext> extends V.Declaration.Class<G> {
			// claimed by t
			readonly body: G['declaration'][];
			readonly declare?: boolean;
			readonly decorator?: V.Attribute.Decorator<G>[];
			readonly extends?: G['expression'];
			readonly implements?: G['type'][];
			readonly label?: V.Identifier.Label<G>;
			readonly name: G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export type Kinds<G extends GrammarContext> = V.Declaration.Class<G> | V.Declaration.Class.Abstract<G>;
	}
	export interface Constant<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by pr
		readonly name?: G['identifier']; // r only
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly visibility?: V.Modifier.Visibility<G>; // r only
	}
	export interface Constructor<G extends GrammarContext> extends V.Declaration<G> {} // claimed by pt
	export interface Enum<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly body: V.Declaration.EnumMember<G>[];
		readonly const?: boolean; // t only
		readonly declare?: boolean; // t only
		readonly label?: V.Identifier.Label<G>; // t only
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[]; // r only
		readonly visibility?: V.Modifier.Visibility<G>; // r only
		readonly whereClause?: V.Clause.Where<G>; // r only
	}
	export interface EnumMember<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly body?: V.Declaration.Field<G>[]; // r only
		readonly name: V.Unmapped<'typescript:__property_identifier'> | G['identifier'] | G['literal']; // unmapped: <typescript:__property_identifier>
		readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		readonly visibility?: V.Modifier.Visibility<G>; // r only
	}
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext> extends V.Declaration.EnumMember<G> {
			// claimed by r
			readonly body?: V.Declaration.Field<G>[];
			readonly name: G['identifier'];
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface Tuple<G extends GrammarContext> extends V.Declaration.EnumMember<G> {
			// claimed by r
			readonly body?: V.Declaration.Field<G>[];
			readonly name: G['identifier'];
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.EnumMember<G>
			| V.Declaration.EnumMember.Struct<G>
			| V.Declaration.EnumMember.Tuple<G>;
	}
	export interface Extension<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly content: V.Unmapped<'rust:impl_item_body'>; // unmapped: <rust:impl_item_body> literal:ImplItemSemi
		readonly traitClause?: V.Unmapped<'rust:impl_item_negative_clause'> | V.Unmapped<'rust:impl_item_positive_clause'>; // unmapped: <rust:impl_item_negative_clause> <rust:impl_item_positive_clause>
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		readonly unsafe?: boolean;
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext> extends V.Declaration.Extension<G> {
			// claimed by r
			readonly content: V.Unmapped<'rust:impl_item_body'>; // unmapped: <rust:impl_item_body> literal:ImplItemSemi
			readonly traitClause?:
				| V.Unmapped<'rust:impl_item_negative_clause'>
				| V.Unmapped<'rust:impl_item_positive_clause'>; // unmapped: <rust:impl_item_negative_clause> <rust:impl_item_positive_clause>
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly unsafe?: boolean;
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Declaration.Extension<G> | V.Declaration.Extension.Conformance<G>;
	}
	export interface Field<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly abstract?: boolean; // t only
		readonly accessor?: boolean; // t only
		readonly declare?: boolean; // t only
		readonly decorator?: V.Attribute.Decorator<G>[]; // t only
		readonly name: V.Unmapped<'typescript:__property_identifier'> | G['identifier'] | G['literal']; // unmapped: <typescript:__property_identifier>
		readonly optional?: boolean; // t only
		readonly optionality?: '!' | '?'; // t only
		readonly override?: boolean; // t only
		readonly readonly?: boolean; // t only
		readonly static?: boolean; // t only
		readonly type?: G['type'] | V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'];
		readonly value?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
		readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public';
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext> extends V.Declaration.Field<G> {
			// claimed by t
			readonly name: V.Unmapped<'typescript:__property_identifier'> | G['literal'] | V.Identifier.Property.Kinds<G>; // unmapped: <typescript:__property_identifier>
			readonly optional?: boolean;
			readonly override?: boolean;
			readonly readonly?: boolean;
			readonly static?: boolean;
			readonly type?: G['type'];
			readonly visibility?: 'private' | 'protected' | 'public';
		}
		export type Kinds<G extends GrammarContext> = V.Declaration.Field<G> | V.Declaration.Field.Signature<G>;
	}
	export interface Function<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly async?: boolean; // pt only
		readonly body?: V.Statement.Block<G>; // unmapped: literal:_SuiteEmpty
		readonly declare?: boolean; // t only
		readonly decorator?: V.Attribute.Decorator<G>[]; // p only
		readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>; // r only   // unmapped: <rust:function_modifiers>
		readonly label?: V.Identifier.Label<G>; // t only
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
		readonly visibility?: V.Modifier.Visibility<G>; // r only
		readonly whereClause?: V.Clause.Where<G>; // r only
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> extends V.Declaration.Function<G> {
			// claimed by t
			readonly async?: boolean;
			readonly body: V.Statement.Block<G>;
			readonly declare?: boolean;
			readonly label?: V.Identifier.Label<G>;
			readonly name: G['identifier'];
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Signature<G extends GrammarContext> extends V.Declaration.Function<G> {
			// claimed by rt
			readonly async?: boolean; // t only
			readonly declare?: boolean; // t only
			readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>; // r only   // unmapped: <rust:function_modifiers>
			readonly label?: V.Identifier.Label<G>; // t only
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
			readonly visibility?: V.Modifier.Visibility<G>; // r only
			readonly whereClause?: V.Clause.Where<G>; // r only
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.Function<G>
			| V.Declaration.Function.Generator<G>
			| V.Declaration.Function.Signature<G>;
	}
	export interface Getter<G extends GrammarContext> extends V.Declaration.Method<G> {
		readonly accessorKind: 'get';
	}
	export interface Interface<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by t
		readonly body: G['declaration'][] | V.Type.Object<G>; // rt only
		readonly declare?: boolean;
		readonly extends?: V.Clause.Extends.Type<G> | V.Clause.Bounds<G>; // rt only
		readonly label?: V.Identifier.Label<G>;
		readonly name: G['identifier']; // rt only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[]; // rt only
		readonly unsafe?: boolean; // r only
		readonly visibility?: V.Modifier.Visibility<G>; // r only
		readonly whereClause?: V.Clause.Where<G>; // r only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext> extends V.Declaration.Interface<G> {
			// claimed by r
			readonly body: G['declaration'][];
			readonly extends?: V.Clause.Bounds<G>;
			readonly name: G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly unsafe?: boolean;
			readonly visibility?: V.Modifier.Visibility<G>;
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Declaration.Interface<G> | V.Declaration.Interface.Trait<G>;
	}
	export interface Macro<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly content:
			| V.Unmapped<'rust:macro_definition_brace'>
			| V.Unmapped<'rust:macro_definition_bracket'>
			| V.Unmapped<'rust:macro_definition_paren'>; // unmapped: <rust:macro_definition_brace> <rust:macro_definition_bracket> <rust:macro_definition_paren>
		readonly name: G['identifier'];
	}
	export interface Method<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly accessorKind?: '*' | 'get' | 'set'; // t only
		readonly async?: boolean; // pt only
		readonly body?: V.Statement.Block<G>; // unmapped: literal:_SuiteEmpty
		readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>; // r only   // unmapped: <rust:function_modifiers>
		readonly name?: V.Unmapped<'typescript:__property_identifier'> | G['identifier'] | G['literal']; // unmapped: <typescript:__property_identifier>
		readonly optional?: boolean; // t only
		readonly override?: boolean; // t only
		readonly parameters?: V.Declaration.Parameter<G>[];
		readonly readonly?: boolean; // t only
		readonly returnType?:
			| V.Type.Predicate.Asserts<G>
			| G['type']
			| V.Type.Predicate<G>
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| G['identifier'];
		readonly static?: boolean; // t only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[] | V.Declaration.TypeParameter<G>;
		readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public'; // rt only
		readonly whereClause?: V.Clause.Where<G>; // r only
	}
	export namespace Method {
		export interface Class<G extends GrammarContext> extends V.Declaration.Method<G> {} // claimed by p
		export interface Dunder<G extends GrammarContext> extends V.Declaration.Method<G> {
			readonly name: `__${string}__`;
			readonly stem: string;
		} // claimed by p content-derived
		export interface Signature<G extends GrammarContext> extends V.Declaration.Method<G> {
			// claimed by rt
			readonly accessorKind?: '*' | 'get' | 'set'; // t only
			readonly async?: boolean; // t only
			readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>; // r only   // unmapped: <rust:function_modifiers>
			readonly name: V.Unmapped<'typescript:__property_identifier'> | G['identifier'] | G['literal']; // unmapped: <typescript:__property_identifier>
			readonly optional?: boolean; // t only
			readonly override?: boolean; // t only
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly readonly?: boolean; // t only
			readonly returnType?:
				| V.Type.Predicate.Asserts<G>
				| G['type']
				| V.Type.Predicate<G>
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier'];
			readonly static?: boolean; // t only
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly visibility?: V.Modifier.Visibility<G> | 'private' | 'protected' | 'public';
			readonly whereClause?: V.Clause.Where<G>; // r only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> extends V.Declaration.Method.Signature<G> {
				// claimed by t
				readonly accessorKind?: '*' | 'get' | 'set';
				readonly name: V.Unmapped<'typescript:__property_identifier'> | G['literal'] | V.Identifier.Property.Kinds<G>; // unmapped: <typescript:__property_identifier>
				readonly optional?: boolean;
				readonly override?: boolean;
				readonly parameters: V.Declaration.Parameter<G>[];
				readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
				readonly typeParameters?: V.Declaration.TypeParameter<G>[];
				readonly visibility?: 'private' | 'protected' | 'public';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Declaration.Method.Signature<G>
				| V.Declaration.Method.Signature.Abstract<G>;
		}
		export interface Static<G extends GrammarContext> extends V.Declaration.Method<G> {
			// claimed by pr
			readonly body?: V.Statement.Block<G>; // r only
			readonly functionModifiers?: V.Unmapped<'rust:function_modifiers'>; // r only   // unmapped: <rust:function_modifiers>
			readonly name?: G['identifier']; // r only
			readonly parameters?: V.Declaration.Parameter<G>[]; // r only
			readonly returnType?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
			readonly typeParameters?: V.Declaration.TypeParameter<G>[]; // r only
			readonly visibility?: V.Modifier.Visibility<G>; // r only
			readonly whereClause?: V.Clause.Where<G>; // r only
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.Method<G>
			| V.Declaration.Method.Class<G>
			| V.Declaration.Method.Dunder<G>
			| V.Declaration.Method.Signature<G>
			| V.Declaration.Method.Signature.Abstract<G>
			| V.Declaration.Method.Static<G>;
	}
	export interface Module<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by rt
		readonly body?: V.Statement.Block<G>; // t only
		readonly content?: G['declaration'][]; // r only   // unmapped: literal:ForeignModItemSemi literal:ModItemExternal
		readonly declare?: boolean; // t only
		readonly extern?: V.Modifier.Extern<G>; // r only
		readonly label?: V.Identifier.Label<G>; // t only
		readonly name?: G['identifier'] | V.Literal.String<G>;
		readonly visibility?: V.Modifier.Visibility<G>; // r only
	}
	export namespace Module {
		export interface External<G extends GrammarContext> extends V.Declaration.Module<G> {
			// claimed by t
			readonly body?: V.Statement.Block<G>;
			readonly declare?: boolean;
			readonly label?: V.Identifier.Label<G>;
			readonly name: G['identifier'] | V.Literal.String<G>;
		}
		export interface Foreign<G extends GrammarContext> extends V.Declaration.Module<G> {
			// claimed by r
			readonly content: G['declaration'][]; // unmapped: literal:ForeignModItemSemi
			readonly extern: V.Modifier.Extern<G>;
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.Module<G>
			| V.Declaration.Module.External<G>
			| V.Declaration.Module.Foreign<G>;
	}
	export interface Parameter<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly content?: G['identifier'] | V.Pattern.Splat.Kinds<G>; // p only
		readonly decorator?: V.Attribute.Decorator<G>[]; // t only
		readonly default?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // pt only
		readonly lifetime?: V.Identifier.Lifetime<G>; // r only
		readonly mutable?: boolean; // r only
		readonly mutableSpecifier?: boolean; // r only
		readonly name?: V.Unmapped<'typescript:pattern'> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // unmapped: <typescript:pattern>
		readonly override?: boolean; // t only
		readonly pattern?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // r only
		readonly readonly?: boolean; // t only
		readonly reference?: boolean; // r only
		readonly type?: G['type'] | V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'];
		readonly visibility?: 'private' | 'protected' | 'public'; // t only
	}
	export namespace Parameter {
		export interface Default<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by p
			readonly default: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly name: G['identifier'] | V.Pattern.Tuple<G>;
		}
		export interface Optional<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by t
			readonly decorator?: V.Attribute.Decorator<G>[];
			readonly default?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
			readonly name: V.Unmapped<'typescript:pattern'> | V.Identifier.Self<G>; // unmapped: <typescript:pattern>
			readonly override?: boolean;
			readonly readonly?: boolean;
			readonly type?: G['type'];
			readonly visibility?: 'private' | 'protected' | 'public';
		}
		export interface Self<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by pr
			readonly lifetime?: V.Identifier.Lifetime<G>; // r only
			readonly mutable?: boolean; // r only
			readonly reference?: boolean; // r only
		}
		export interface Typed<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by p
			readonly content: G['identifier'] | V.Pattern.Splat.Kinds<G>;
			readonly type: G['type'];
		}
		export interface TypedDefault<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by p
			readonly default: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
			readonly name: G['identifier'];
			readonly type: G['type'];
		}
		export interface Variadic<G extends GrammarContext> extends V.Declaration.Parameter<G> {
			// claimed by r
			readonly mutableSpecifier?: boolean;
			readonly pattern?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Default<G>
			| V.Declaration.Parameter.Optional<G>
			| V.Declaration.Parameter.Self<G>
			| V.Declaration.Parameter.Typed<G>
			| V.Declaration.Parameter.TypedDefault<G>
			| V.Declaration.Parameter.Variadic<G>;
	}
	export interface Setter<G extends GrammarContext> extends V.Declaration.Method<G> {
		readonly accessorKind: 'set';
	}
	export interface Signature<G extends GrammarContext> extends V.Declaration<G> {
		readonly abstract?: boolean; // t only
		readonly content?: V.Unmapped<'typescript:index_signature_colon'> | V.Clause.MappedType<G>; // t only   // unmapped: <typescript:index_signature_colon>
		readonly parameters?: V.Declaration.Parameter<G>[]; // t only
		readonly readonly?: boolean; // t only
		readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>; // t only
		readonly sign?: '+' | '-'; // t only
		readonly type?: G['type']; // t only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[]; // t only
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext> extends V.Declaration.Signature<G> {
			// claimed by t
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly returnType?: V.Type.Predicate.Asserts<G> | G['type'] | V.Type.Predicate<G>;
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Construct<G extends GrammarContext> extends V.Declaration.Signature<G> {
			// claimed by t
			readonly abstract?: boolean;
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly type?: G['type'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Index<G extends GrammarContext> extends V.Declaration.Signature<G> {
			// claimed by t
			readonly content: V.Unmapped<'typescript:index_signature_colon'> | V.Clause.MappedType<G>; // unmapped: <typescript:index_signature_colon>
			readonly readonly?: boolean;
			readonly sign?: '+' | '-';
			readonly type: G['type'];
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.Signature.Call<G>
			| V.Declaration.Signature.Construct<G>
			| V.Declaration.Signature.Index<G>;
	}
	export interface Struct<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly content: V.Unmapped<'rust:struct_item_brace'> | V.Unmapped<'rust:struct_item_tuple'>; // unmapped: <rust:struct_item_brace> <rust:struct_item_tuple> literal:StructItemUnit
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		readonly visibility?: V.Modifier.Visibility<G>;
	}
	export interface TypeAlias<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly bounds?: V.Clause.Bounds<G>; // r only
		readonly declare?: boolean; // t only
		readonly label?: V.Identifier.Label<G>; // t only
		readonly left?: G['type']; // p only
		readonly name?: G['identifier']; // rt only
		readonly right?: G['type']; // p only
		readonly trailingWhereClause?: V.Clause.Where<G>; // r only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[]; // rt only
		readonly value?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // rt only
		readonly visibility?: V.Modifier.Visibility<G>; // r only
		readonly whereClause?: V.Clause.Where<G>; // r only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext> extends V.Declaration.TypeAlias<G> {
			// claimed by r
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: G['identifier'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			readonly whereClause?: V.Clause.Where<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Declaration.TypeAlias<G> | V.Declaration.TypeAlias.Associated<G>;
	}
	export interface TypeParameter<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly bounds?: V.Clause.Bounds<G>; // r only
		readonly const?: boolean; // t only
		readonly constraint?: G['clause']; // rt only
		readonly default?: G['clause'] | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // rt only
		readonly name?: G['identifier']; // rt only
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
		readonly types?: V.Unmapped<'python:types'>; // p only   // unmapped: <python:types>
		readonly value?: V.Unmapped<'rust:literal'> | G['identifier'] | V.Literal.Number.Negative<G> | V.Statement.Block<G>; // r only   // unmapped: <rust:literal>
	}
	export namespace TypeParameter {
		export interface Const<G extends GrammarContext> extends V.Declaration.TypeParameter<G> {
			// claimed by r
			readonly name: G['identifier'];
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly value?:
				| V.Unmapped<'rust:literal'>
				| G['identifier']
				| V.Literal.Number.Negative<G>
				| V.Statement.Block<G>; // unmapped: <rust:literal>
		}
		export interface Lifetime<G extends GrammarContext> extends V.Declaration.TypeParameter<G> {
			// claimed by r
			readonly bounds?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Lifetime<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Const<G>
			| V.Declaration.TypeParameter.Lifetime<G>;
	}
	export interface Union<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by r
		readonly body: V.Declaration.Field<G>[];
		readonly name: G['identifier'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		readonly visibility?: V.Modifier.Visibility<G>;
		readonly whereClause?: V.Clause.Where<G>;
	}
	export interface Variable<G extends GrammarContext> extends V.Declaration<G> {
		// claimed by prt
		readonly alternative?: V.Statement.Block<G>; // r only
		readonly content?:
			| V.Unmapped<'python:assignment_eq'>
			| V.Unmapped<'python:assignment_type'>
			| V.Unmapped<'python:assignment_typed'>; // p only   // unmapped: <python:assignment_eq> <python:assignment_type> <python:assignment_typed>
		readonly declarators?: V.Unmapped<'typescript:variable_declarator'>[]; // t only   // unmapped: <typescript:variable_declarator>
		readonly declare?: boolean; // t only
		readonly kind?: 'const' | 'let'; // t only
		readonly label?: V.Identifier.Label<G>; // t only
		readonly mutableSpecifier?: boolean; // r only
		readonly name?: V.Unmapped<'python:pattern'> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // pr only   // unmapped: <python:pattern>
		readonly ref?: boolean; // r only
		readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
		readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly visibility?: V.Modifier.Visibility<G>; // r only
	}
	export namespace Variable {
		export interface Lexical<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by t
			readonly declarators: V.Unmapped<'typescript:variable_declarator'>[]; // unmapped: <typescript:variable_declarator>
			readonly declare?: boolean;
			readonly kind: 'const' | 'let';
			readonly label?: V.Identifier.Label<G>;
		}
		export interface Pattern<G extends GrammarContext> extends V.Declaration.Variable<G> {} // claimed by t
		export interface Static<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by r
			readonly mutableSpecifier?: boolean;
			readonly name: G['identifier'];
			readonly ref?: boolean;
			readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface Var<G extends GrammarContext> extends V.Declaration.Variable<G> {
			// claimed by t
			readonly declarators: V.Unmapped<'typescript:variable_declarator'>[]; // unmapped: <typescript:variable_declarator>
			readonly declare?: boolean;
			readonly label?: V.Identifier.Label<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Declaration.Variable<G>
			| V.Declaration.Variable.Lexical<G>
			| V.Declaration.Variable.Pattern<G>
			| V.Declaration.Variable.Static<G>
			| V.Declaration.Variable.Var<G>;
	}
	export type Kinds<G extends GrammarContext> =
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
		| V.Declaration.Getter<G>
		| V.Declaration.Interface<G>
		| V.Declaration.Interface.Trait<G>
		| V.Declaration.Macro<G>
		| V.Declaration.Method<G>
		| V.Declaration.Method.Class<G>
		| V.Declaration.Method.Dunder<G>
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
		| V.Declaration.Setter<G>
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
