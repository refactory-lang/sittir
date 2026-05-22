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
    NodeData, FieldValue, OneOrMany, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,
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
#[template(path = "_ambient_declaration_declaration.jinja", escape = "none")]
pub struct _AmbientDeclarationDeclarationTemplate<'a> {
    pub declaration: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_ambient_declaration_global.jinja", escape = "none")]
pub struct AmbientDeclarationGlobalTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_ambient_declaration_module.jinja", escape = "none")]
pub struct AmbientDeclarationModuleTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
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
    pub abstract_method_signature: ListNonterminalView<'a>,
    pub content: OptionalNonterminalView<'a>,
    pub semicolon: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method_sig.jinja", escape = "none")]
pub struct ClassBodyMethodSigTemplate<'a> {
    pub method_signature: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method.jinja", escape = "none")]
pub struct ClassBodyMethodTemplate<'a> {
    pub decorator: ListNonterminalView<'a>,
    pub method_definition: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_extends_clause.jinja", escape = "none")]
pub struct _ClassHeritageExtendsClauseTemplate<'a> {
    pub extends_clause: SingleNonterminalView<'a>,
    pub implements_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_implements_clause.jinja", escape = "none")]
pub struct _ClassHeritageImplementsClauseTemplate<'a> {
    pub implements_clause: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw_value.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTemplate<'a> {
    pub semicolon: OptionalNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwTemplate<'a> {
    pub declaration: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmTemplate<'a> {
    pub declaration: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_clause_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmClauseFromTemplate<'a> {
    pub export_clause: SingleNonterminalView<'a>,
    pub source: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_ns_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmNsFromTemplate<'a> {
    pub namespace_export: SingleNonterminalView<'a>,
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
    pub export_statement_default_from_arm_star_from: OptionalNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_equals_export.jinja", escape = "none")]
pub struct _ExportStatementEqualsExportTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_namespace_export.jinja", escape = "none")]
pub struct _ExportStatementNamespaceExportTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_type_export.jinja", escape = "none")]
pub struct _ExportStatementTypeExportTemplate<'a> {
    pub export_clause: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
    pub source: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_let_const_kind.jinja", escape = "none")]
pub struct ForHeaderLetConstKindTemplate<'a> {
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
    pub kind: OptionalNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_default_import.jinja", escape = "none")]
pub struct _ImportClauseDefaultImportTemplate<'a> {
    pub import_identifier: SingleNonterminalView<'a>,
    pub namespace_import: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_named_imports.jinja", escape = "none")]
pub struct _ImportClauseNamedImportsTemplate<'a> {
    pub named_imports: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_namespace_import.jinja", escape = "none")]
pub struct _ImportClauseNamespaceImportTemplate<'a> {
    pub namespace_import: SingleNonterminalView<'a>,
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
    pub mapped_type_clause: SingleNonterminalView<'a>,
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
    pub sequence_expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_typed.jinja", escape = "none")]
pub struct ParenthesizedExpressionTypedTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
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
    pub accessibility_modifier: SingleNonterminalView<'a>,
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
    pub accessibility_modifier: OptionalNonterminalView<'a>,
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
    pub override_modifier: OptionalNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub static_marker: SingleNonterminalView<'a>,
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
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationDeclarationTemplate<'a> {
    pub declaration: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationTemplate<'a> {
    pub variant: &'a str,
    pub ambient_declaration_declaration: SingleNonterminalView<'a>,
    pub ambient_declaration_global: SingleNonterminalView<'a>,
    pub ambient_declaration_module: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub arguments: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_pattern.jinja", escape = "none")]
pub struct ArrayPatternTemplate<'a> {
    pub elements: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub primary_type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array.jinja", escape = "none")]
pub struct ArrayTemplate<'a> {
    pub elements: ListNonterminalView<'a>,
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
    pub variant: &'a str,
    pub arrow_function__call_signature: SingleNonterminalView<'a>,
    pub arrow_function_parameter: SingleNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "as_expression.jinja", escape = "none")]
pub struct AsExpressionTemplate<'a> {
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
    pub type_predicate: OptionalNonterminalView<'a>,
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
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub variant: &'a str,
    pub call_expression_call: SingleNonterminalView<'a>,
    pub call_expression_member: SingleNonterminalView<'a>,
    pub call_expression_template_call: SingleNonterminalView<'a>,
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
    pub type_: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_body.jinja", escape = "none")]
pub struct ClassBodyTemplate<'a> {
    pub class_body_member: ListNonterminalView<'a>,
    pub class_body_method: ListNonterminalView<'a>,
    pub class_body_method_sig: ListNonterminalView<'a>,
    pub class_static_block: ListNonterminalView<'a>,
    pub content: ListNonterminalView<'a>,
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
    pub extends_clause: SingleNonterminalView<'a>,
    pub implements_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_implements_clause.jinja", escape = "none")]
pub struct ClassHeritageImplementsClauseTemplate<'a> {
    pub implements_clause: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage.jinja", escape = "none")]
pub struct ClassHeritageTemplate<'a> {
    pub variant: &'a str,
    pub class_heritage_extends_clause: SingleNonterminalView<'a>,
    pub class_heritage_implements_clause: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_static_block.jinja", escape = "none")]
pub struct ClassStaticBlockTemplate<'a> {
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
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "construct_signature.jinja", escape = "none")]
pub struct ConstructSignatureTemplate<'a> {
    pub abstract_marker: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "constructor_type.jinja", escape = "none")]
pub struct ConstructorTypeTemplate<'a> {
    pub abstract_marker: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "continue_statement.jinja", escape = "none")]
pub struct ContinueStatementTemplate<'a> {
    pub label: OptionalNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "debugger_statement.jinja", escape = "none")]
pub struct DebuggerStatementTemplate<'a> {
    pub semicolon: OptionalNonterminalView<'a>,
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
    pub identifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub identifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "default_type.jinja", escape = "none")]
pub struct DefaultTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
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
    pub enum_assignment: ListNonterminalView<'a>,
    pub name: ListNonterminalView<'a>,
    pub opening: ListNonterminalView<'a>,
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
    pub export_specifier: ListNonterminalView<'a>,
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
    pub expression: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_namespace_export.jinja", escape = "none")]
pub struct ExportStatementNamespaceExportTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_type_export.jinja", escape = "none")]
pub struct ExportStatementTypeExportTemplate<'a> {
    pub export_clause: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
    pub source: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement.jinja", escape = "none")]
pub struct ExportStatementTemplate<'a> {
    pub variant: &'a str,
    pub export_statement_default: SingleNonterminalView<'a>,
    pub export_statement_equals_export: SingleNonterminalView<'a>,
    pub export_statement_namespace_export: SingleNonterminalView<'a>,
    pub export_statement_type_export: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub expressions: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extends_clause.jinja", escape = "none")]
pub struct ExtendsClauseTemplate<'a> {
    pub type_arguments: ListNonterminalView<'a>,
    pub value: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extends_type_clause.jinja", escape = "none")]
pub struct ExtendsTypeClauseTemplate<'a> {
    pub type_: ListNonterminalView<'a>,
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
    pub await_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub for_header_lhs: OptionalNonterminalView<'a>,
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
    pub formal_parameter: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_declaration.jinja", escape = "none")]
pub struct FunctionDeclarationTemplate<'a> {
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
    pub async_marker: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
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
    pub type_: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_alias.jinja", escape = "none")]
pub struct ImportAliasTemplate<'a> {
    pub identifier: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
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
    pub import_identifier: SingleNonterminalView<'a>,
    pub namespace_import: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_named_imports.jinja", escape = "none")]
pub struct ImportClauseNamedImportsTemplate<'a> {
    pub named_imports: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_namespace_import.jinja", escape = "none")]
pub struct ImportClauseNamespaceImportTemplate<'a> {
    pub namespace_import: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause.jinja", escape = "none")]
pub struct ImportClauseTemplate<'a> {
    pub variant: &'a str,
    pub import_clause_default_import: SingleNonterminalView<'a>,
    pub import_clause_named_imports: SingleNonterminalView<'a>,
    pub import_clause_namespace_import: SingleNonterminalView<'a>,
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
    pub variant: &'a str,
    pub import_kind: OptionalNonterminalView<'a>,
    pub import_specifier_as: SingleNonterminalView<'a>,
    pub import_specifier_name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub from_clause: SingleNonterminalView<'a>,
    pub import_attribute: OptionalNonterminalView<'a>,
    pub import_clause: OptionalNonterminalView<'a>,
    pub import_require_clause: ListNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
    pub source: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct IndexSignatureMappedTypeClauseTemplate<'a> {
    pub mapped_type_clause: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature.jinja", escape = "none")]
pub struct IndexSignatureTemplate<'a> {
    pub variant: &'a str,
    pub index_signature_colon: SingleNonterminalView<'a>,
    pub index_signature_mapped_type_clause: SingleNonterminalView<'a>,
    pub sign: OptionalNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_type_query.jinja", escape = "none")]
pub struct IndexTypeQueryTemplate<'a> {
    pub primary_type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "infer_type.jinja", escape = "none")]
pub struct InferTypeTemplate<'a> {
    pub type_: OptionalNonterminalView<'a>,
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
    pub type1: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_attribute.jinja", escape = "none")]
pub struct JsxAttributeTemplate<'a> {
    pub jsx_attribute_name: SingleNonterminalView<'a>,
    pub jsx_attribute_value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_closing_element.jinja", escape = "none")]
pub struct JsxClosingElementTemplate<'a> {
    pub name: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_element.jinja", escape = "none")]
pub struct JsxElementTemplate<'a> {
    pub close_tag: SingleNonterminalView<'a>,
    pub jsx_child: ListNonterminalView<'a>,
    pub open_tag: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_expression.jinja", escape = "none")]
pub struct JsxExpressionTemplate<'a> {
    pub expression: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_namespace_name.jinja", escape = "none")]
pub struct JsxNamespaceNameTemplate<'a> {
    pub jsx_identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_opening_element.jinja", escape = "none")]
pub struct JsxOpeningElementTemplate<'a> {
    pub attribute: ListNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_self_closing_element.jinja", escape = "none")]
pub struct JsxSelfClosingElementTemplate<'a> {
    pub attribute: ListNonterminalView<'a>,
    pub name: OptionalNonterminalView<'a>,
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
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "literal_type.jinja", escape = "none")]
pub struct LiteralTypeTemplate<'a> {
    pub content: SingleNonterminalView<'a>,
    pub unary_expression: ListNonterminalView<'a>,
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
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "member_expression.jinja", escape = "none")]
pub struct MemberExpressionTemplate<'a> {
    pub object: SingleNonterminalView<'a>,
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
    pub import_specifier: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_export.jinja", escape = "none")]
pub struct NamespaceExportTemplate<'a> {
    pub module_export_name: SingleNonterminalView<'a>,
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
    pub properties: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object_type.jinja", escape = "none")]
pub struct ObjectTypeTemplate<'a> {
    pub closing: SingleNonterminalView<'a>,
    pub content: ListNonterminalView<'a>,
    pub members: ListNonterminalView<'a>,
    pub opening: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object.jinja", escape = "none")]
pub struct ObjectTemplate<'a> {
    pub properties: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "omitting_type_annotation.jinja", escape = "none")]
pub struct OmittingTypeAnnotationTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "opting_type_annotation.jinja", escape = "none")]
pub struct OptingTypeAnnotationTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "optional_parameter.jinja", escape = "none")]
pub struct OptionalParameterTemplate<'a> {
    pub accessibility_modifier: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub override_modifier: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "optional_tuple_parameter.jinja", escape = "none")]
pub struct OptionalTupleParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "optional_type.jinja", escape = "none")]
pub struct OptionalTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
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
    pub sequence_expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub variant: &'a str,
    pub parenthesized_expression_sequence: SingleNonterminalView<'a>,
    pub parenthesized_expression_typed: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_type.jinja", escape = "none")]
pub struct ParenthesizedTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
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
    pub type_: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "public_field_definition.jinja", escape = "none")]
pub struct PublicFieldDefinitionTemplate<'a> {
    pub decorator: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub optionality_marker: OptionalNonterminalView<'a>,
    pub public_field_definition_declare_first: OptionalNonterminalView<'a>,
    pub public_field_definition_static_mods: OptionalNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "readonly_type.jinja", escape = "none")]
pub struct ReadonlyTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
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
    pub accessibility_modifier: OptionalNonterminalView<'a>,
    pub decorator: ListNonterminalView<'a>,
    pub override_modifier: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub readonly_marker: OptionalNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "rest_pattern.jinja", escape = "none")]
pub struct RestPatternTemplate<'a> {
    pub content: SingleNonterminalView<'a>,
    pub member_expression: ListNonterminalView<'a>,
    pub non_null_expression: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "rest_type.jinja", escape = "none")]
pub struct RestTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub expressions: OptionalNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
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
    pub expression: ListNonterminalView<'a>,
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
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub closing: SingleNonterminalView<'a>,
    pub contents: ListNonterminalView<'a>,
    pub escape_sequence: ListNonterminalView<'a>,
    pub opening: SingleNonterminalView<'a>,
    pub string_fragment: ListNonterminalView<'a>,
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
    pub cases: ListNonterminalView<'a>,
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
    pub content: ListNonterminalView<'a>,
    pub string_fragment: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_string.jinja", escape = "none")]
pub struct TemplateStringTemplate<'a> {
    pub content: ListNonterminalView<'a>,
    pub string_fragment: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_substitution.jinja", escape = "none")]
pub struct TemplateSubstitutionTemplate<'a> {
    pub expressions: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_type.jinja", escape = "none")]
pub struct TemplateTypeTemplate<'a> {
    pub primary_type: OptionalNonterminalView<'a>,
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
    pub expressions: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
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
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub tuple_type_member: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_declaration.jinja", escape = "none")]
pub struct TypeAliasDeclarationTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_annotation.jinja", escape = "none")]
pub struct TypeAnnotationTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub type_: ListNonterminalView<'a>,
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
    pub type_parameter: ListNonterminalView<'a>,
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
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_query.jinja", escape = "none")]
pub struct TypeQueryTemplate<'a> {
    pub subscript_expression: OptionalNonterminalView<'a>,
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
    pub type1: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "update_expression.jinja", escape = "none")]
pub struct UpdateExpressionTemplate<'a> {
    pub variant: &'a str,
    pub update_expression_postfix: SingleNonterminalView<'a>,
    pub update_expression_prefix: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declaration.jinja", escape = "none")]
pub struct VariableDeclarationTemplate<'a> {
    pub declarators: ListNonterminalView<'a>,
    pub semicolon: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declarator.jinja", escape = "none")]
pub struct VariableDeclaratorTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
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
    pub expression: SingleNonterminalView<'a>,
}

