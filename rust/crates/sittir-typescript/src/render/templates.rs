// @generated from packages/typescript/node-model.json5 and packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
//
// Per-kind askama template structs + render functions for the typescript
// grammar. Every struct in this file is backed by a sibling `.jinja`
// template under `templates/`, copied from `packages/typescript/templates/`
// at codegen time (spec 012 T030).
//
// Askama parses each `.jinja` at `cargo build` time — any mismatch
// between a template's referenced variables and its backing struct's
// fields is caught at compile time (FR-008). If you see a build error
// here, the codegen is out of sync: regenerate via the command above.

#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]

use ::sittir_core::filters::{
    SingleNonterminalView, ListNonterminalView,
    OptionalNonterminalView,
};
use ::sittir_core::types::{
    NodeData, FieldValue, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,
};

#[cfg(feature = "napi-bindings")]
use ::napi_derive::napi;

use ::askama::Template as _AskamaTemplate;
use super::bridge::*;

pub mod filters {
    //! Askama resolves custom-filter names by searching for a
    //! sibling `filters` module at the derive-macro site. This
    //! module wraps the canonical sittir_core implementations with
    //! the `#[askama::filter_fn]` attribute so Askama can call them
    //! from templates.
    use ::sittir_core::filters::{Joined, JoinSource};

    #[::askama::filter_fn]
    pub fn joinby<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        _values: &dyn ::askama::Values,
        sep: &'a str,
        leading: bool,
        trailing: bool,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, leading, trailing)
    }

    #[::askama::filter_fn]
    pub fn join<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        _values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, false, false)
    }

    #[::askama::filter_fn]
    #[allow(non_snake_case)]
    pub fn joinWithTrailing<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinWithTrailing(xs, values, sep)
    }

    #[::askama::filter_fn]
    #[allow(non_snake_case)]
    pub fn joinWithLeading<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinWithLeading(xs, values, sep)
    }

    #[::askama::filter_fn]
    #[allow(non_snake_case)]
    pub fn joinWithFlanks<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinWithFlanks(xs, values, sep)
    }

    pub use ::sittir_core::filters::{
        upper, lower,
        isBlank, isPresent,
    };
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function__call_signature.jinja", escape = "none")]
pub struct _ArrowFunctionUCallSignatureTemplate<'a> {
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function_parameter.jinja", escape = "none")]
pub struct _ArrowFunctionParameterTemplate<'a> {
    pub parameter: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_call.jinja", escape = "none")]
pub struct CallExpressionCallTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_member.jinja", escape = "none")]
pub struct CallExpressionMemberTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_template_call.jinja", escape = "none")]
pub struct CallExpressionTemplateCallTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_member.jinja", escape = "none")]
pub struct ClassBodyMemberTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method_sig.jinja", escape = "none")]
pub struct ClassBodyMethodSigTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method.jinja", escape = "none")]
pub struct ClassBodyMethodTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_extends_clause.jinja", escape = "none")]
pub struct _ClassHeritageExtendsClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_implements_clause.jinja", escape = "none")]
pub struct _ClassHeritageImplementsClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw_value.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub declaration: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub declaration: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_clause_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmClauseFromTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub source: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_ns_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmNsFromTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub source: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_star_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmStarFromTemplate<'a> {
    pub source: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_equals_export.jinja", escape = "none")]
pub struct _ExportStatementEqualsExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_namespace_export.jinja", escape = "none")]
pub struct _ExportStatementNamespaceExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_type_export.jinja", escape = "none")]
pub struct _ExportStatementTypeExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub source: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_let_const_kind.jinja", escape = "none")]
pub struct ForHeaderLetConstKindTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub kind: SingleNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_lhs.jinja", escape = "none")]
pub struct ForHeaderLhsTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_var_kind.jinja", escape = "none")]
pub struct ForHeaderVarKindTemplate<'a> {
    pub kind: SingleNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_default_import.jinja", escape = "none")]
pub struct _ImportClauseDefaultImportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_named_imports.jinja", escape = "none")]
pub struct _ImportClauseNamedImportsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_namespace_import.jinja", escape = "none")]
pub struct _ImportClauseNamespaceImportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_as.jinja", escape = "none")]
pub struct ImportSpecifierAsTemplate<'a> {
    pub alias: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_name.jinja", escape = "none")]
pub struct _ImportSpecifierNameTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_colon.jinja", escape = "none")]
pub struct IndexSignatureColonTemplate<'a> {
    pub index_type: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct _IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_initializer.jinja", escape = "none")]
pub struct InitializerTemplate<'a> {
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_lhs_expression.jinja", escape = "none")]
pub struct LhsExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_number.jinja", escape = "none")]
pub struct _NumberTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_sequence.jinja", escape = "none")]
pub struct _ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_typed.jinja", escape = "none")]
pub struct ParenthesizedExpressionTypedTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_abstract_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAbstractFirstTemplate<'a> {
    pub abstract_marker: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_access_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessFirstTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub declare_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_accessor_opt.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessorOptTemplate<'a> {
    pub accessor_marker: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_declare_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionDeclareFirstTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_readonly_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionReadonlyFirstTemplate<'a> {
    pub abstract_marker: OptionalNonterminalView<'a>,
    pub readonly_marker: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_static_mods.jinja", escape = "none")]
pub struct PublicFieldDefinitionStaticModsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub static_marker: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_double.jinja", escape = "none")]
pub struct _StringDoubleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_single.jinja", escape = "none")]
pub struct _StringSingleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryCallExpressionInTypeAnnotationTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression.jinja", escape = "none")]
pub struct TypeQueryCallExpressionTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_instantiation_expression.jinja", escape = "none")]
pub struct TypeQueryInstantiationExpressionTemplate<'a> {
    pub function: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionInTypeAnnotationTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
    pub property: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
    pub property: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_subscript_expression.jinja", escape = "none")]
pub struct TypeQuerySubscriptExpressionTemplate<'a> {
    pub index: SingleNonterminalView<'a>,
    pub object: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_postfix.jinja", escape = "none")]
pub struct UpdateExpressionPostfixTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_prefix.jinja", escape = "none")]
pub struct UpdateExpressionPrefixTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_class_declaration.jinja", escape = "none")]
pub struct AbstractClassDeclarationTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub class_heritage: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_method_signature.jinja", escape = "none")]
pub struct AbstractMethodSignatureTemplate<'a> {
    pub accessibility_modifier: OptionalNonterminalView<'a>,
    pub accessor_kind: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub optional_marker: OptionalNonterminalView<'a>,
    pub override_modifier: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "adding_type_annotation.jinja", escape = "none")]
pub struct AddingTypeAnnotationTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub declaration: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_pattern.jinja", escape = "none")]
pub struct ArrayPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub primary_type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array.jinja", escape = "none")]
pub struct ArrayTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function__call_signature.jinja", escape = "none")]
pub struct ArrowFunctionUCallSignatureTemplate<'a> {
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function_parameter.jinja", escape = "none")]
pub struct ArrowFunctionParameterTemplate<'a> {
    pub parameter: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function.jinja", escape = "none")]
pub struct ArrowFunctionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "as_expression.jinja", escape = "none")]
pub struct AsExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub expression: SingleNonterminalView<'a>,
    pub type_annotation: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "asserts_annotation.jinja", escape = "none")]
pub struct AssertsAnnotationTemplate<'a> {
    pub asserts: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "asserts.jinja", escape = "none")]
pub struct AssertsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
    pub using_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment_pattern.jinja", escape = "none")]
pub struct AssignmentPatternTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment_expression.jinja", escape = "none")]
pub struct AugmentedAssignmentExpressionTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "break_statement.jinja", escape = "none")]
pub struct BreakStatementTemplate<'a> {
    pub label: OptionalNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call_signature.jinja", escape = "none")]
pub struct CallSignatureTemplate<'a> {
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "catch_clause.jinja", escape = "none")]
pub struct CatchClauseTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub parameter: OptionalNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_body.jinja", escape = "none")]
pub struct ClassBodyTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_declaration.jinja", escape = "none")]
pub struct ClassDeclarationTemplate<'a> {
    pub automatic_semicolon: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub class_heritage: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_extends_clause.jinja", escape = "none")]
pub struct ClassHeritageExtendsClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_implements_clause.jinja", escape = "none")]
pub struct ClassHeritageImplementsClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage.jinja", escape = "none")]
pub struct ClassHeritageTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_static_block.jinja", escape = "none")]
pub struct ClassStaticBlockTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class.jinja", escape = "none")]
pub struct ClassTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub class_heritage: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "computed_property_name.jinja", escape = "none")]
pub struct ComputedPropertyNameTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "conditional_type.jinja", escape = "none")]
pub struct ConditionalTypeTemplate<'a> {
    pub alternative: SingleNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "constraint.jinja", escape = "none")]
pub struct ConstraintTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "construct_signature.jinja", escape = "none")]
pub struct ConstructSignatureTemplate<'a> {
    pub abstract_marker: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "constructor_type.jinja", escape = "none")]
pub struct ConstructorTypeTemplate<'a> {
    pub abstract_marker: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "continue_statement.jinja", escape = "none")]
pub struct ContinueStatementTemplate<'a> {
    pub label: OptionalNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "debugger_statement.jinja", escape = "none")]
pub struct DebuggerStatementTemplate<'a> {
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator_call_expression.jinja", escape = "none")]
pub struct DecoratorCallExpressionTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator_member_expression.jinja", escape = "none")]
pub struct DecoratorMemberExpressionTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
    pub property: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator_parenthesized_expression.jinja", escape = "none")]
pub struct DecoratorParenthesizedExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "default_type.jinja", escape = "none")]
pub struct DefaultTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "do_statement.jinja", escape = "none")]
pub struct DoStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub statement: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_assignment.jinja", escape = "none")]
pub struct EnumAssignmentTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_body.jinja", escape = "none")]
pub struct EnumBodyTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub name: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_declaration.jinja", escape = "none")]
pub struct EnumDeclarationTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub const_marker: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_clause.jinja", escape = "none")]
pub struct ExportClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_specifier.jinja", escape = "none")]
pub struct ExportSpecifierTemplate<'a> {
    pub alias: OptionalNonterminalView<'a>,
    pub export_kind: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_equals_export.jinja", escape = "none")]
pub struct ExportStatementEqualsExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_namespace_export.jinja", escape = "none")]
pub struct ExportStatementNamespaceExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_type_export.jinja", escape = "none")]
pub struct ExportStatementTypeExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub source: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement.jinja", escape = "none")]
pub struct ExportStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extends_clause.jinja", escape = "none")]
pub struct ExtendsClauseTemplate<'a> {
    pub type_arguments: OptionalNonterminalView<'a>,
    pub value: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extends_type_clause.jinja", escape = "none")]
pub struct ExtendsTypeClauseTemplate<'a> {
    pub r#type: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_definition.jinja", escape = "none")]
pub struct FieldDefinitionTemplate<'a> {
    pub decorator: ListNonterminalView<'a>,
    pub property: SingleNonterminalView<'a>,
    pub static_marker: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "flow_maybe_type.jinja", escape = "none")]
pub struct FlowMaybeTypeTemplate<'a> {
    pub primary_type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_in_statement.jinja", escape = "none")]
pub struct ForInStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub await_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub increment: OptionalNonterminalView<'a>,
    pub initializer: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "formal_parameters.jinja", escape = "none")]
pub struct FormalParametersTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_declaration.jinja", escape = "none")]
pub struct FunctionDeclarationTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_expression.jinja", escape = "none")]
pub struct FunctionExpressionTemplate<'a> {
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_signature.jinja", escape = "none")]
pub struct FunctionSignatureTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate<'a> {
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generator_function_declaration.jinja", escape = "none")]
pub struct GeneratorFunctionDeclarationTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generator_function.jinja", escape = "none")]
pub struct GeneratorFunctionTemplate<'a> {
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: OptionalNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "implements_clause.jinja", escape = "none")]
pub struct ImplementsClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_alias.jinja", escape = "none")]
pub struct ImportAliasTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_attribute.jinja", escape = "none")]
pub struct ImportAttributeTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_default_import.jinja", escape = "none")]
pub struct ImportClauseDefaultImportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_named_imports.jinja", escape = "none")]
pub struct ImportClauseNamedImportsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_namespace_import.jinja", escape = "none")]
pub struct ImportClauseNamespaceImportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause.jinja", escape = "none")]
pub struct ImportClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_require_clause.jinja", escape = "none")]
pub struct ImportRequireClauseTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub source: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier_name.jinja", escape = "none")]
pub struct ImportSpecifierNameTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier.jinja", escape = "none")]
pub struct ImportSpecifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub import_kind: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub import_attribute: OptionalNonterminalView<'a>,
    pub import_clause: OptionalNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
    pub source: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature.jinja", escape = "none")]
pub struct IndexSignatureTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub sign: OptionalNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_type_query.jinja", escape = "none")]
pub struct IndexTypeQueryTemplate<'a> {
    pub primary_type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "infer_type.jinja", escape = "none")]
pub struct InferTypeTemplate<'a> {
    pub r#type: OptionalNonterminalView<'a>,
    pub type_identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "instantiation_expression.jinja", escape = "none")]
pub struct InstantiationExpressionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "interface_declaration.jinja", escape = "none")]
pub struct InterfaceDeclarationTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub extends_type_clause: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "internal_module.jinja", escape = "none")]
pub struct InternalModuleTemplate<'a> {
    pub body: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "intersection_type.jinja", escape = "none")]
pub struct IntersectionTypeTemplate<'a> {
    pub left: OptionalNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_attribute.jinja", escape = "none")]
pub struct JsxAttributeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_closing_element.jinja", escape = "none")]
pub struct JsxClosingElementTemplate<'a> {
    pub name: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_element.jinja", escape = "none")]
pub struct JsxElementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub close_tag: SingleNonterminalView<'a>,
    pub open_tag: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_expression.jinja", escape = "none")]
pub struct JsxExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_namespace_name.jinja", escape = "none")]
pub struct JsxNamespaceNameTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_opening_element.jinja", escape = "none")]
pub struct JsxOpeningElementTemplate<'a> {
    pub attribute: ListNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_self_closing_element.jinja", escape = "none")]
pub struct JsxSelfClosingElementTemplate<'a> {
    pub attribute: ListNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "labeled_statement.jinja", escape = "none")]
pub struct LabeledStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub label: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lexical_declaration.jinja", escape = "none")]
pub struct LexicalDeclarationTemplate<'a> {
    pub declarators: ListNonterminalView<'a>,
    pub kind: SingleNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "literal_type.jinja", escape = "none")]
pub struct LiteralTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lookup_type.jinja", escape = "none")]
pub struct LookupTypeTemplate<'a> {
    pub index_type: SingleNonterminalView<'a>,
    pub primary_type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mapped_type_clause.jinja", escape = "none")]
pub struct MappedTypeClauseTemplate<'a> {
    pub alias: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "member_expression.jinja", escape = "none")]
pub struct MemberExpressionTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
    pub optional_chain: OptionalNonterminalView<'a>,
    pub property: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "method_definition.jinja", escape = "none")]
pub struct MethodDefinitionTemplate<'a> {
    pub accessibility_modifier: OptionalNonterminalView<'a>,
    pub accessor_kind: OptionalNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub optional_marker: OptionalNonterminalView<'a>,
    pub override_modifier: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub static_marker: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "method_signature.jinja", escape = "none")]
pub struct MethodSignatureTemplate<'a> {
    pub accessibility_modifier: OptionalNonterminalView<'a>,
    pub accessor_kind: OptionalNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub optional_marker: OptionalNonterminalView<'a>,
    pub override_modifier: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub static_marker: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub body: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "named_imports.jinja", escape = "none")]
pub struct NamedImportsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_export.jinja", escape = "none")]
pub struct NamespaceExportTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_import.jinja", escape = "none")]
pub struct NamespaceImportTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "nested_identifier.jinja", escape = "none")]
pub struct NestedIdentifierTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
    pub property: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "nested_type_identifier.jinja", escape = "none")]
pub struct NestedTypeIdentifierTemplate<'a> {
    pub module: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "new_expression.jinja", escape = "none")]
pub struct NewExpressionTemplate<'a> {
    pub arguments: OptionalNonterminalView<'a>,
    pub constructor: SingleNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "non_null_expression.jinja", escape = "none")]
pub struct NonNullExpressionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object_assignment_pattern.jinja", escape = "none")]
pub struct ObjectAssignmentPatternTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object_pattern.jinja", escape = "none")]
pub struct ObjectPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object_type.jinja", escape = "none")]
pub struct ObjectTypeTemplate<'a> {
    pub closing: SingleNonterminalView<'a>,
    pub members: ListNonterminalView<'a>,
    pub opening: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object.jinja", escape = "none")]
pub struct ObjectTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "omitting_type_annotation.jinja", escape = "none")]
pub struct OmittingTypeAnnotationTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "opting_type_annotation.jinja", escape = "none")]
pub struct OptingTypeAnnotationTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "optional_parameter.jinja", escape = "none")]
pub struct OptionalParameterTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "optional_tuple_parameter.jinja", escape = "none")]
pub struct OptionalTupleParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "optional_type.jinja", escape = "none")]
pub struct OptionalTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pair_pattern.jinja", escape = "none")]
pub struct PairPatternTemplate<'a> {
    pub key: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression_sequence.jinja", escape = "none")]
pub struct ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_type.jinja", escape = "none")]
pub struct ParenthesizedTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "program.jinja", escape = "none")]
pub struct ProgramTemplate<'a> {
    pub hash_bang_line: OptionalNonterminalView<'a>,
    pub statements: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "property_signature.jinja", escape = "none")]
pub struct PropertySignatureTemplate<'a> {
    pub accessibility_modifier: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub optional_marker: OptionalNonterminalView<'a>,
    pub override_modifier: OptionalNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub static_marker: OptionalNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "public_field_definition.jinja", escape = "none")]
pub struct PublicFieldDefinitionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub optionality_marker: OptionalNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "readonly_type.jinja", escape = "none")]
pub struct ReadonlyTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "regex.jinja", escape = "none")]
pub struct RegexTemplate<'a> {
    pub flags: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "required_parameter.jinja", escape = "none")]
pub struct RequiredParameterTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "rest_pattern.jinja", escape = "none")]
pub struct RestPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "rest_type.jinja", escape = "none")]
pub struct RestTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "satisfies_expression.jinja", escape = "none")]
pub struct SatisfiesExpressionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub type_annotation: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "sequence_expression.jinja", escape = "none")]
pub struct SequenceExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "spread_element.jinja", escape = "none")]
pub struct SpreadElementTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "statement_block.jinja", escape = "none")]
pub struct StatementBlockTemplate<'a> {
    pub automatic_semicolon: OptionalNonterminalView<'a>,
    pub statements: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_double.jinja", escape = "none")]
pub struct StringDoubleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_single.jinja", escape = "none")]
pub struct StringSingleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "subscript_expression.jinja", escape = "none")]
pub struct SubscriptExpressionTemplate<'a> {
    pub index: SingleNonterminalView<'a>,
    pub object: SingleNonterminalView<'a>,
    pub optional_chain: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_body.jinja", escape = "none")]
pub struct SwitchBodyTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_case.jinja", escape = "none")]
pub struct SwitchCaseTemplate<'a> {
    pub body: ListNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_default.jinja", escape = "none")]
pub struct SwitchDefaultTemplate<'a> {
    pub body: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_statement.jinja", escape = "none")]
pub struct SwitchStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_literal_type.jinja", escape = "none")]
pub struct TemplateLiteralTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_string.jinja", escape = "none")]
pub struct TemplateStringTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_substitution.jinja", escape = "none")]
pub struct TemplateSubstitutionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_type.jinja", escape = "none")]
pub struct TemplateTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ternary_expression.jinja", escape = "none")]
pub struct TernaryExpressionTemplate<'a> {
    pub alternative: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "throw_statement.jinja", escape = "none")]
pub struct ThrowStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub finalizer: OptionalNonterminalView<'a>,
    pub handler: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_parameter.jinja", escape = "none")]
pub struct TupleParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_declaration.jinja", escape = "none")]
pub struct TypeAliasDeclarationTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_annotation.jinja", escape = "none")]
pub struct TypeAnnotationTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_assertion.jinja", escape = "none")]
pub struct TypeAssertionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub const_marker: OptionalNonterminalView<'a>,
    pub constraint: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate_annotation.jinja", escape = "none")]
pub struct TypePredicateAnnotationTemplate<'a> {
    pub type_predicate: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate.jinja", escape = "none")]
pub struct TypePredicateTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_query.jinja", escape = "none")]
pub struct TypeQueryTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: OptionalNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "update_expression.jinja", escape = "none")]
pub struct UpdateExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declaration.jinja", escape = "none")]
pub struct VariableDeclarationTemplate<'a> {
    pub declarators: ListNonterminalView<'a>,
    pub semicolon: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declarator.jinja", escape = "none")]
pub struct VariableDeclaratorTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub object: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub expression: OptionalNonterminalView<'a>,
}

pub(crate) fn render_hidden_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = _ArrowFunctionUCallSignatureTemplate {
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        return_type: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter", true)?;
    let template = _ArrowFunctionParameterTemplate {
        parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_call_expression_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = CallExpressionCallTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_call_expression_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = CallExpressionMemberTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_call_expression_template_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallExpressionTemplateCallTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_class_body_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClassBodyMemberTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_class_body_method_sig(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClassBodyMethodSigTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_class_body_method(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator"])?;
    let field_0 = resolve_field(node, "decorator", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = ClassBodyMethodTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        decorator: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ClassHeritageExtendsClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ClassHeritageImplementsClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_decl_arm_default_kw_value(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_decl_arm_default_kw(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration", false)?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementDefaultDeclArmDefaultKwTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        declaration: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_decl_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration", "decorator"])?;
    let field_0 = resolve_field(node, "declaration", false)?;
    let field_1 = resolve_field(node, "decorator", true)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ExportStatementDefaultDeclArmTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        declaration: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        decorator: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_from_arm_clause_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementDefaultFromArmClauseFromTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_from_arm_ns_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementDefaultFromArmNsFromTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_from_arm_star_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmStarFromTemplate {
        source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_default_from_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementDefaultFromArmTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ExportStatementEqualsExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ExportStatementNamespaceExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", false)?;
    let children_renderables = children.renderable_items();
    let template = _ExportStatementTypeExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        source: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_for_header_let_const_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left"])?;
    let field_0 = resolve_field(node, "kind", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let children_renderables = children.renderable_items();
    let template = ForHeaderLetConstKindTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_for_header_lhs(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let template = ForHeaderLhsTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_for_header_var_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left", "value"])?;
    let field_0 = resolve_field(node, "kind", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = ForHeaderVarKindTemplate {
        kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ImportClauseDefaultImportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ImportClauseNamedImportsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ImportClauseNamespaceImportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_import_specifier_as(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = ImportSpecifierAsTemplate {
        alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = _ImportSpecifierNameTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_index_signature_colon(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "name"])?;
    let field_0 = resolve_field(node, "index_type", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = IndexSignatureColonTemplate {
        index_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _IndexSignatureMappedTypeClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = InitializerTemplate {
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_lhs_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = LhsExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_number(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = _NumberTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ParenthesizedExpressionSequenceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_parenthesized_expression_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let children_renderables = children.renderable_items();
    let template = ParenthesizedExpressionTypedTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        r#type: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_public_field_definition_abstract_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker", true)?;
    let field_1 = resolve_field(node, "readonly_marker", false)?;
    let template = PublicFieldDefinitionAbstractFirstTemplate {
        abstract_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        readonly_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_public_field_definition_access_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declare_marker"])?;
    let field_0 = resolve_field(node, "declare_marker", false)?;
    let children_renderables = children.renderable_items();
    let template = PublicFieldDefinitionAccessFirstTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        declare_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_public_field_definition_accessor_opt(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessor_marker"])?;
    let field_0 = resolve_field(node, "accessor_marker", true)?;
    let template = PublicFieldDefinitionAccessorOptTemplate {
        accessor_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_public_field_definition_declare_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = PublicFieldDefinitionDeclareFirstTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_public_field_definition_readonly_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "readonly_marker", true)?;
    let template = PublicFieldDefinitionReadonlyFirstTemplate {
        abstract_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        readonly_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_public_field_definition_static_mods(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["readonly_marker", "static_marker"])?;
    let field_0 = resolve_field(node, "readonly_marker", false)?;
    let field_1 = resolve_field(node, "static_marker", true)?;
    let children_renderables = children.renderable_items();
    let template = PublicFieldDefinitionStaticModsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        readonly_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        static_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _StringDoubleTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _StringSingleTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeIdentifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_type_query_call_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = TypeQueryCallExpressionInTypeAnnotationTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_type_query_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = TypeQueryCallExpressionTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_type_query_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = TypeQueryInstantiationExpressionTemplate {
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_type_query_member_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = TypeQueryMemberExpressionInTypeAnnotationTemplate {
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_type_query_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = TypeQueryMemberExpressionTemplate {
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_type_query_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = TypeQuerySubscriptExpressionTemplate {
        index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_update_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UpdateExpressionPostfixTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_update_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UpdateExpressionPrefixTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_abstract_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "class_heritage", false)?;
    let field_2 = resolve_field(node, "decorator", true)?;
    let field_3 = resolve_field(node, "name", true)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let field_2_renderables = field_2.renderable_items();
    let template = AbstractClassDeclarationTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        class_heritage: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        decorator: ListNonterminalView {
            items: field_2_renderables.as_slice(),
            separator: field_2.separator,
            leading: field_2.leading_sep,
            trailing: field_2.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        type_parameters: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_abstract_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "name", "optional_marker", "override_modifier", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "accessor_kind", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "optional_marker", false)?;
    let field_4 = resolve_field(node, "override_modifier", false)?;
    let field_5 = resolve_field(node, "parameters", true)?;
    let field_6 = resolve_field(node, "return_type", false)?;
    let field_7 = resolve_field(node, "type_parameters", false)?;
    let template = AbstractMethodSignatureTemplate {
        accessibility_modifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        accessor_kind: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        optional_marker: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        override_modifier: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        return_type: match field_6.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        },
        type_parameters: match field_7.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_adding_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AddingTypeAnnotationTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_ambient_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = AmbientDeclarationTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        declaration: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ArgumentsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_array_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ArrayPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_array_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = ArrayTypeTemplate {
        primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_array(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ArrayTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = ArrowFunctionUCallSignatureTemplate {
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        return_type: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter", true)?;
    let template = ArrowFunctionParameterTemplate {
        parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_arrow_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = ArrowFunctionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_as_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_annotation", true)?;
    let children_renderables = children.renderable_items();
    let template = AsExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_annotation: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_asserts_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["asserts"])?;
    let field_0 = resolve_field(node, "asserts", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = AssertsAnnotationTemplate {
        asserts: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_asserts(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = AssertsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "using_marker"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "using_marker", false)?;
    let template = AssignmentExpressionTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        using_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = AssignmentPatternTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_augmented_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentExpressionTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = AwaitExpressionTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_binary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryExpressionTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_break_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = BreakStatementTemplate {
        label: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = CallExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = CallSignatureTemplate {
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        return_type: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_catch_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameter", "type"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameter", false)?;
    let field_2 = resolve_field(node, "type", false)?;
    let template = CatchClauseTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        parameter: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        r#type: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_class_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClassBodyTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "automatic_semicolon", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "class_heritage", false)?;
    let field_3 = resolve_field(node, "decorator", true)?;
    let field_4 = resolve_field(node, "name", true)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let field_3_renderables = field_3.renderable_items();
    let template = ClassDeclarationTemplate {
        automatic_semicolon: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        class_heritage: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        decorator: ListNonterminalView {
            items: field_3_renderables.as_slice(),
            separator: field_3.separator,
            leading: field_3.leading_sep,
            trailing: field_3.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClassHeritageExtendsClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClassHeritageImplementsClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_class_heritage(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClassHeritageTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_class_static_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = ClassStaticBlockTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_class(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "class_heritage", false)?;
    let field_2 = resolve_field(node, "decorator", true)?;
    let field_3 = resolve_field(node, "name", false)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let field_2_renderables = field_2.renderable_items();
    let template = ClassTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        class_heritage: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        decorator: ListNonterminalView {
            items: field_2_renderables.as_slice(),
            separator: field_2.separator,
            leading: field_2.leading_sep,
            trailing: field_2.trailing_sep,
        },
        name: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        type_parameters: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_computed_property_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ComputedPropertyNameTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_conditional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "consequence", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let field_2 = resolve_field(node, "left", true)?;
    let field_3 = resolve_field(node, "right", true)?;
    let template = ConditionalTypeTemplate {
        alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_constraint(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ConstraintTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_construct_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "type", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ConstructSignatureTemplate {
        abstract_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        r#type: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_constructor_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ConstructorTypeTemplate {
        abstract_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_continue_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = ContinueStatementTemplate {
        label: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_debugger_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = DebuggerStatementTemplate {
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_decorator_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = DecoratorCallExpressionTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_decorator_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = DecoratorMemberExpressionTemplate {
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_decorator_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DecoratorParenthesizedExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DecoratorTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_default_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = DefaultTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_do_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "semicolon"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "semicolon", false)?;
    let template = DoStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        semicolon: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["statement"])?;
    let field_0 = resolve_field(node, "statement", true)?;
    let template = ElseClauseTemplate {
        statement: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_enum_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = EnumAssignmentTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_enum_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", false)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = EnumBodyTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        name: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_enum_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "const_marker", "name"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "const_marker", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = EnumDeclarationTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        const_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_export_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExportClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_export_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "export_kind", "name"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "export_kind", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = ExportSpecifierTemplate {
        alias: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        export_kind: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementEqualsExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementNamespaceExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", false)?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementTypeExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        source: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_export_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExportStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments", "value"])?;
    let field_0 = resolve_field(node, "type_arguments", false)?;
    let field_1 = resolve_field(node, "value", true)?;
    let field_0_renderables = field_0.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ExtendsClauseTemplate {
        type_arguments: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        value: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_extends_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ExtendsTypeClauseTemplate {
        r#type: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "property", "static_marker", "value"])?;
    let field_0 = resolve_field(node, "decorator", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let field_2 = resolve_field(node, "static_marker", false)?;
    let field_3 = resolve_field(node, "value", false)?;
    let field_0_renderables = field_0.renderable_items();
    let template = FieldDefinitionTemplate {
        decorator: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        static_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        value: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = FinallyClauseTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_flow_maybe_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = FlowMaybeTypeTemplate {
        primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_for_in_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["await_marker", "body", "operator", "right"])?;
    let field_0 = resolve_field(node, "await_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "operator", true)?;
    let field_3 = resolve_field(node, "right", true)?;
    let children_renderables = children.renderable_items();
    let template = ForInStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        await_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "increment", "initializer"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "increment", false)?;
    let field_3 = resolve_field(node, "initializer", true)?;
    let template = ForStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        increment: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        initializer: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_formal_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FormalParametersTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let children_renderables = children.renderable_items();
    let template = FunctionDeclarationTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        return_type: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_function_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", false)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionExpressionTemplate {
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        name: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        return_type: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_function_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "name", "parameters", "return_type", "semicolon", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "return_type", false)?;
    let field_4 = resolve_field(node, "semicolon", true)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let children_renderables = children.renderable_items();
    let template = FunctionSignatureTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        return_type: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionTypeTemplate {
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        return_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_generator_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let children_renderables = children.renderable_items();
    let template = GeneratorFunctionDeclarationTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        return_type: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_generator_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", false)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = GeneratorFunctionTemplate {
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        name: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        return_type: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_arguments"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfStatementTemplate {
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ImplementsClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_import_alias(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let children_renderables = children.renderable_items();
    let template = ImportAliasTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_import_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ImportAttributeTemplate {
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ImportClauseDefaultImportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ImportClauseNamedImportsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ImportClauseNamespaceImportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_import_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ImportClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_import_require_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "source"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "source", true)?;
    let template = ImportRequireClauseTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = ImportSpecifierNameTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_import_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_kind"])?;
    let field_0 = resolve_field(node, "import_kind", false)?;
    let children_renderables = children.renderable_items();
    let template = ImportSpecifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        import_kind: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_attribute", "import_clause", "semicolon", "source"])?;
    let field_0 = resolve_field(node, "import_attribute", false)?;
    let field_1 = resolve_field(node, "import_clause", false)?;
    let field_2 = resolve_field(node, "semicolon", true)?;
    let field_3 = resolve_field(node, "source", false)?;
    let children_renderables = children.renderable_items();
    let template = ImportStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        import_attribute: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        import_clause: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        source: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = IndexSignatureMappedTypeClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_index_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["sign", "type"])?;
    let field_0 = resolve_field(node, "sign", false)?;
    let field_1 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let template = IndexSignatureTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        sign: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_index_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = IndexTypeQueryTemplate {
        primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_infer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_identifier"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let field_1 = resolve_field(node, "type_identifier", true)?;
    let template = InferTypeTemplate {
        r#type: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        type_identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = InstantiationExpressionTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_interface_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "extends_type_clause", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "extends_type_clause", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = InterfaceDeclarationTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        extends_type_clause: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_internal_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = InternalModuleTemplate {
        body: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_intersection_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = IntersectionTypeTemplate {
        left: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_jsx_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = JsxAttributeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_jsx_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", false)?;
    let template = JsxClosingElementTemplate {
        name: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_jsx_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["close_tag", "open_tag"])?;
    let field_0 = resolve_field(node, "close_tag", true)?;
    let field_1 = resolve_field(node, "open_tag", true)?;
    let children_renderables = children.renderable_items();
    let template = JsxElementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        close_tag: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        open_tag: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_jsx_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = JsxExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_jsx_namespace_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = JsxNamespaceNameTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_jsx_opening_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let field_0_renderables = field_0.renderable_items();
    let template = JsxOpeningElementTemplate {
        attribute: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        name: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_jsx_self_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let field_0_renderables = field_0.renderable_items();
    let template = JsxSelfClosingElementTemplate {
        attribute: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        name: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_labeled_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", true)?;
    let template = LabeledStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        label: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_lexical_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "kind", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators", true)?;
    let field_1 = resolve_field(node, "kind", true)?;
    let field_2 = resolve_field(node, "semicolon", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = LexicalDeclarationTemplate {
        declarators: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = LiteralTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_lookup_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "primary_type"])?;
    let field_0 = resolve_field(node, "index_type", true)?;
    let field_1 = resolve_field(node, "primary_type", true)?;
    let template = LookupTypeTemplate {
        index_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name", "type"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = MappedTypeClauseTemplate {
        alias: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "optional_chain", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "optional_chain", false)?;
    let field_2 = resolve_field(node, "property", true)?;
    let template = MemberExpressionTemplate {
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        optional_chain: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_method_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "body", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "accessor_kind", false)?;
    let field_2 = resolve_field(node, "async_marker", false)?;
    let field_3 = resolve_field(node, "body", true)?;
    let field_4 = resolve_field(node, "name", true)?;
    let field_5 = resolve_field(node, "optional_marker", false)?;
    let field_6 = resolve_field(node, "override_modifier", false)?;
    let field_7 = resolve_field(node, "parameters", true)?;
    let field_8 = resolve_field(node, "readonly_marker", false)?;
    let field_9 = resolve_field(node, "return_type", false)?;
    let field_10 = resolve_field(node, "static_marker", false)?;
    let field_11 = resolve_field(node, "type_parameters", false)?;
    let template = MethodDefinitionTemplate {
        accessibility_modifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        accessor_kind: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        async_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        optional_marker: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
        override_modifier: match field_6.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
        readonly_marker: match field_8.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_8.as_scalar())),
        },
        return_type: match field_9.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_9.as_scalar())),
        },
        static_marker: match field_10.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_10.as_scalar())),
        },
        type_parameters: match field_11.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_11.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "accessor_kind", false)?;
    let field_2 = resolve_field(node, "async_marker", false)?;
    let field_3 = resolve_field(node, "name", true)?;
    let field_4 = resolve_field(node, "optional_marker", false)?;
    let field_5 = resolve_field(node, "override_modifier", false)?;
    let field_6 = resolve_field(node, "parameters", true)?;
    let field_7 = resolve_field(node, "readonly_marker", false)?;
    let field_8 = resolve_field(node, "return_type", false)?;
    let field_9 = resolve_field(node, "static_marker", false)?;
    let field_10 = resolve_field(node, "type_parameters", false)?;
    let template = MethodSignatureTemplate {
        accessibility_modifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        accessor_kind: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        async_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        optional_marker: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        override_modifier: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        readonly_marker: match field_7.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
        },
        return_type: match field_8.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_8.as_scalar())),
        },
        static_marker: match field_9.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_9.as_scalar())),
        },
        type_parameters: match field_10.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_10.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = ModuleTemplate {
        body: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = NamedImportsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = NamespaceExportTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = NamespaceImportTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_nested_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = NestedIdentifierTemplate {
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_nested_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module", "name"])?;
    let field_0 = resolve_field(node, "module", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = NestedTypeIdentifierTemplate {
        module: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_new_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "constructor", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "constructor", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = NewExpressionTemplate {
        arguments: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        constructor: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_non_null_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = NonNullExpressionTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_object_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = ObjectAssignmentPatternTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_object_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ObjectPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_object_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["closing", "members", "opening"])?;
    let field_0 = resolve_field(node, "closing", true)?;
    let field_1 = resolve_field(node, "members", false)?;
    let field_2 = resolve_field(node, "opening", true)?;
    let field_1_renderables = field_1.renderable_items();
    let template = ObjectTypeTemplate {
        closing: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        members: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
        opening: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_object(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ObjectTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_omitting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OmittingTypeAnnotationTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_opting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OptingTypeAnnotationTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_optional_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", true)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "readonly_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = OptionalParameterTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        decorator: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        readonly_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        r#type: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        value: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_optional_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = OptionalTupleParameterTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_optional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OptionalTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_pair_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairPatternTemplate {
        key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_pair(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairTemplate {
        key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParenthesizedExpressionSequenceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParenthesizedExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_parenthesized_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ParenthesizedTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_program(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["hash_bang_line", "statements"])?;
    let field_0 = resolve_field(node, "hash_bang_line", false)?;
    let field_1 = resolve_field(node, "statements", true)?;
    let field_1_renderables = field_1.renderable_items();
    let template = ProgramTemplate {
        hash_bang_line: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        statements: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_property_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "name", "optional_marker", "override_modifier", "readonly_marker", "static_marker", "type"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "optional_marker", false)?;
    let field_3 = resolve_field(node, "override_modifier", false)?;
    let field_4 = resolve_field(node, "readonly_marker", false)?;
    let field_5 = resolve_field(node, "static_marker", false)?;
    let field_6 = resolve_field(node, "type", false)?;
    let template = PropertySignatureTemplate {
        accessibility_modifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        optional_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        override_modifier: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        readonly_marker: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        static_marker: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
        r#type: match field_6.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_public_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "name", "optionality_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "optionality_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = PublicFieldDefinitionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        decorator: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        optionality_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        r#type: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        value: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_readonly_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ReadonlyTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_regex(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["flags", "pattern"])?;
    let field_0 = resolve_field(node, "flags", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = RegexTemplate {
        flags: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_required_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", true)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "readonly_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = RequiredParameterTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        decorator: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        readonly_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        r#type: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        value: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_rest_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = RestPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_rest_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = RestTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let children_renderables = children.renderable_items();
    let template = ReturnStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_satisfies_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_annotation", true)?;
    let template = SatisfiesExpressionTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_annotation: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_sequence_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SequenceExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_spread_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = SpreadElementTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_statement_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "statements"])?;
    let field_0 = resolve_field(node, "automatic_semicolon", false)?;
    let field_1 = resolve_field(node, "statements", true)?;
    let field_1_renderables = field_1.renderable_items();
    let template = StatementBlockTemplate {
        automatic_semicolon: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        statements: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = StringDoubleTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = StringSingleTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = StringTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object", "optional_chain"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let field_2 = resolve_field(node, "optional_chain", false)?;
    let template = SubscriptExpressionTemplate {
        index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        optional_chain: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_switch_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SwitchBodyTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_switch_case(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = SwitchCaseTemplate {
        body: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_switch_default(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = SwitchDefaultTemplate {
        body: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_switch_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SwitchStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_template_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TemplateLiteralTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_template_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TemplateStringTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_template_substitution(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TemplateSubstitutionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_template_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TemplateTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_ternary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = TernaryExpressionTemplate {
        alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_throw_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let children_renderables = children.renderable_items();
    let template = ThrowStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "finalizer", "handler"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "finalizer", false)?;
    let field_2 = resolve_field(node, "handler", false)?;
    let template = TryStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        finalizer: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        handler: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TupleParameterTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_tuple_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TupleTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type_alias_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "type_parameters", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "value", true)?;
    let template = TypeAliasDeclarationTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = TypeAnnotationTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeArgumentsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type_assertion(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = TypeAssertionTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["const_marker", "constraint", "name", "value"])?;
    let field_0 = resolve_field(node, "const_marker", false)?;
    let field_1 = resolve_field(node, "constraint", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "value", false)?;
    let template = TypeParameterTemplate {
        const_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        constraint: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        value: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_type_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeParametersTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type_predicate_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_predicate"])?;
    let field_0 = resolve_field(node, "type_predicate", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = TypePredicateAnnotationTemplate {
        type_predicate: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TypePredicateTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeQueryTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryExpressionTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_update_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = UpdateExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_variable_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = VariableDeclarationTemplate {
        declarators: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_variable_declarator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", false)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = VariableDeclaratorTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        value: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "object"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = WithStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", false)?;
    let children_renderables = children.renderable_items();
    let template = YieldExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        expression: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

