// @generated from packages/typescript/node-model.json5 and packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
//
// Per-kind askama template structs + direct render helpers + render_dispatch
// for the typescript grammar. Every struct in this file is backed by a
// sibling `.jinja` template under `templates/`, copied from
// `packages/typescript/templates/` at codegen time (spec 012 T030).
//
// Templates and fields are derived from:
//   - template bodies in packages/typescript/templates/*.jinja
//   - node-model metadata assembled by the codegen pipeline
//
// Askama parses each `.jinja` at `cargo build` time — any mismatch
// between a template's referenced variables and its backing struct's
// fields is caught at compile time (FR-008). If you see a build error
// here, the codegen is out of sync: regenerate via the command above.

#![allow(dead_code, unused_imports, non_snake_case)]

pub mod filters {
    //! Askama resolves custom-filter names by searching for a
    //! sibling `filters` module at the derive-macro site. This
    //! module just re-exports the canonical implementations
    //! from `sittir_core::filters`.
    pub fn joinby<S: AsRef<str>>(
        xs: &[S],
        _values: &dyn ::askama::Values,
        sep: &str,
        leading: impl std::borrow::Borrow<bool>,
        trailing: impl std::borrow::Borrow<bool>,
    ) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, *leading.borrow(), *trailing.borrow())
    }

    pub fn join<S: AsRef<str>>(
        xs: &[S],
        sep: &str,
    ) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, false, false)
    }

    pub use ::sittir_core::filters::{
        upper, lower,
        isBlank, isPresent,
        joinWithTrailing, joinWithLeading, joinWithFlanks,
    };
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function__call_signature.jinja", escape = "none")]
pub struct _ArrowFunctionUCallSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function_parameter.jinja", escape = "none")]
pub struct _ArrowFunctionParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameter: &'a str,
    pub parameter_list: &'a [String],
    pub parameter_leading_sep: bool,
    pub parameter_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_call.jinja", escape = "none")]
pub struct CallExpressionCallTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_member.jinja", escape = "none")]
pub struct CallExpressionMemberTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_template_call.jinja", escape = "none")]
pub struct CallExpressionTemplateCallTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_member.jinja", escape = "none")]
pub struct ClassBodyMemberTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method_sig.jinja", escape = "none")]
pub struct ClassBodyMethodSigTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method.jinja", escape = "none")]
pub struct ClassBodyMethodTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_extends_clause.jinja", escape = "none")]
pub struct _ClassHeritageExtendsClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_implements_clause.jinja", escape = "none")]
pub struct _ClassHeritageImplementsClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw_value.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declaration: &'a str,
    pub declaration_list: &'a [String],
    pub declaration_leading_sep: bool,
    pub declaration_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declaration: &'a str,
    pub declaration_list: &'a [String],
    pub declaration_leading_sep: bool,
    pub declaration_trailing_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_clause_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmClauseFromTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_ns_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmNsFromTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_star_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmStarFromTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_equals_export.jinja", escape = "none")]
pub struct _ExportStatementEqualsExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_namespace_export.jinja", escape = "none")]
pub struct _ExportStatementNamespaceExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_type_export.jinja", escape = "none")]
pub struct _ExportStatementTypeExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_let_const_kind.jinja", escape = "none")]
pub struct ForHeaderLetConstKindTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub kind: &'a str,
    pub kind_list: &'a [String],
    pub kind_leading_sep: bool,
    pub kind_trailing_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_lhs.jinja", escape = "none")]
pub struct ForHeaderLhsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_var_kind.jinja", escape = "none")]
pub struct ForHeaderVarKindTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub kind: &'a str,
    pub kind_list: &'a [String],
    pub kind_leading_sep: bool,
    pub kind_trailing_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_default_import.jinja", escape = "none")]
pub struct _ImportClauseDefaultImportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_named_imports.jinja", escape = "none")]
pub struct _ImportClauseNamedImportsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_namespace_import.jinja", escape = "none")]
pub struct _ImportClauseNamespaceImportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_as.jinja", escape = "none")]
pub struct ImportSpecifierAsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: &'a str,
    pub alias_list: &'a [String],
    pub alias_leading_sep: bool,
    pub alias_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_name.jinja", escape = "none")]
pub struct _ImportSpecifierNameTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_colon.jinja", escape = "none")]
pub struct IndexSignatureColonTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index_type: &'a str,
    pub index_type_list: &'a [String],
    pub index_type_leading_sep: bool,
    pub index_type_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct _IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_initializer.jinja", escape = "none")]
pub struct InitializerTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_interface_body.jinja", escape = "none")]
pub struct InterfaceBodyTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_lhs_expression.jinja", escape = "none")]
pub struct LhsExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_number.jinja", escape = "none")]
pub struct _NumberTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: &'a str,
    pub argument_list: &'a [String],
    pub argument_leading_sep: bool,
    pub argument_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_sequence.jinja", escape = "none")]
pub struct _ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_typed.jinja", escape = "none")]
pub struct ParenthesizedExpressionTypedTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_property_identifier.jinja", escape = "none")]
pub struct PropertyIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_abstract_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAbstractFirstTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub abstract_marker: &'a str,
    pub abstract_marker_list: &'a [String],
    pub abstract_marker_leading_sep: bool,
    pub abstract_marker_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_access_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessFirstTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declare_marker: &'a str,
    pub declare_marker_list: &'a [String],
    pub declare_marker_leading_sep: bool,
    pub declare_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_accessor_opt.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessorOptTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessor_marker: &'a str,
    pub accessor_marker_list: &'a [String],
    pub accessor_marker_leading_sep: bool,
    pub accessor_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_declare_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionDeclareFirstTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_readonly_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionReadonlyFirstTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub abstract_marker: &'a str,
    pub abstract_marker_list: &'a [String],
    pub abstract_marker_leading_sep: bool,
    pub abstract_marker_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_static_mods.jinja", escape = "none")]
pub struct PublicFieldDefinitionStaticModsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
    pub static_marker: &'a str,
    pub static_marker_list: &'a [String],
    pub static_marker_leading_sep: bool,
    pub static_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_statement_identifier.jinja", escape = "none")]
pub struct StatementIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_string_double.jinja", escape = "none")]
pub struct _StringDoubleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_string_fragment.jinja", escape = "none")]
pub struct StringFragmentTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_string_single.jinja", escape = "none")]
pub struct _StringSingleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryCallExpressionInTypeAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression.jinja", escape = "none")]
pub struct TypeQueryCallExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_instantiation_expression.jinja", escape = "none")]
pub struct TypeQueryInstantiationExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionInTypeAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
    pub property: &'a str,
    pub property_list: &'a [String],
    pub property_leading_sep: bool,
    pub property_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
    pub property: &'a str,
    pub property_list: &'a [String],
    pub property_leading_sep: bool,
    pub property_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_subscript_expression.jinja", escape = "none")]
pub struct TypeQuerySubscriptExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index: &'a str,
    pub index_list: &'a [String],
    pub index_leading_sep: bool,
    pub index_trailing_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_postfix.jinja", escape = "none")]
pub struct UpdateExpressionPostfixTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: &'a str,
    pub argument_list: &'a [String],
    pub argument_leading_sep: bool,
    pub argument_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_prefix.jinja", escape = "none")]
pub struct UpdateExpressionPrefixTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: &'a str,
    pub argument_list: &'a [String],
    pub argument_leading_sep: bool,
    pub argument_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "abstract_class_declaration.jinja", escape = "none")]
pub struct AbstractClassDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub class_heritage: &'a str,
    pub class_heritage_list: &'a [String],
    pub class_heritage_leading_sep: bool,
    pub class_heritage_trailing_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "abstract_method_signature.jinja", escape = "none")]
pub struct AbstractMethodSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: &'a str,
    pub accessibility_modifier_list: &'a [String],
    pub accessibility_modifier_leading_sep: bool,
    pub accessibility_modifier_trailing_sep: bool,
    pub accessor_kind: &'a str,
    pub accessor_kind_list: &'a [String],
    pub accessor_kind_leading_sep: bool,
    pub accessor_kind_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub optional_marker: &'a str,
    pub optional_marker_list: &'a [String],
    pub optional_marker_leading_sep: bool,
    pub optional_marker_trailing_sep: bool,
    pub override_modifier: &'a str,
    pub override_modifier_list: &'a [String],
    pub override_modifier_leading_sep: bool,
    pub override_modifier_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "adding_type_annotation.jinja", escape = "none")]
pub struct AddingTypeAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declaration: &'a str,
    pub declaration_list: &'a [String],
    pub declaration_leading_sep: bool,
    pub declaration_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "array_pattern.jinja", escape = "none")]
pub struct ArrayPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_type: &'a str,
    pub primary_type_list: &'a [String],
    pub primary_type_leading_sep: bool,
    pub primary_type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "array.jinja", escape = "none")]
pub struct ArrayTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function__call_signature.jinja", escape = "none")]
pub struct ArrowFunctionUCallSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function_parameter.jinja", escape = "none")]
pub struct ArrowFunctionParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameter: &'a str,
    pub parameter_list: &'a [String],
    pub parameter_leading_sep: bool,
    pub parameter_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function.jinja", escape = "none")]
pub struct ArrowFunctionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "as_expression.jinja", escape = "none")]
pub struct AsExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
    pub type_annotation: &'a str,
    pub type_annotation_list: &'a [String],
    pub type_annotation_leading_sep: bool,
    pub type_annotation_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "asserts_annotation.jinja", escape = "none")]
pub struct AssertsAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub asserts: &'a str,
    pub asserts_list: &'a [String],
    pub asserts_leading_sep: bool,
    pub asserts_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "asserts.jinja", escape = "none")]
pub struct AssertsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
    pub using_marker: &'a str,
    pub using_marker_list: &'a [String],
    pub using_marker_leading_sep: bool,
    pub using_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "assignment_pattern.jinja", escape = "none")]
pub struct AssignmentPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment_expression.jinja", escape = "none")]
pub struct AugmentedAssignmentExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "break_statement.jinja", escape = "none")]
pub struct BreakStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub label: &'a str,
    pub label_list: &'a [String],
    pub label_leading_sep: bool,
    pub label_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "call_signature.jinja", escape = "none")]
pub struct CallSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "catch_clause.jinja", escape = "none")]
pub struct CatchClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub parameter: &'a str,
    pub parameter_list: &'a [String],
    pub parameter_leading_sep: bool,
    pub parameter_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_body.jinja", escape = "none")]
pub struct ClassBodyTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_declaration.jinja", escape = "none")]
pub struct ClassDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub automatic_semicolon: &'a str,
    pub automatic_semicolon_list: &'a [String],
    pub automatic_semicolon_leading_sep: bool,
    pub automatic_semicolon_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub class_heritage: &'a str,
    pub class_heritage_list: &'a [String],
    pub class_heritage_leading_sep: bool,
    pub class_heritage_trailing_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_extends_clause.jinja", escape = "none")]
pub struct ClassHeritageExtendsClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_implements_clause.jinja", escape = "none")]
pub struct ClassHeritageImplementsClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage.jinja", escape = "none")]
pub struct ClassHeritageTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_static_block.jinja", escape = "none")]
pub struct ClassStaticBlockTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class.jinja", escape = "none")]
pub struct ClassTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub class_heritage: &'a str,
    pub class_heritage_list: &'a [String],
    pub class_heritage_leading_sep: bool,
    pub class_heritage_trailing_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "computed_property_name.jinja", escape = "none")]
pub struct ComputedPropertyNameTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "conditional_type.jinja", escape = "none")]
pub struct ConditionalTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: &'a str,
    pub alternative_list: &'a [String],
    pub alternative_leading_sep: bool,
    pub alternative_trailing_sep: bool,
    pub consequence: &'a str,
    pub consequence_list: &'a [String],
    pub consequence_leading_sep: bool,
    pub consequence_trailing_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "constraint.jinja", escape = "none")]
pub struct ConstraintTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "construct_signature.jinja", escape = "none")]
pub struct ConstructSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub abstract_marker: &'a str,
    pub abstract_marker_list: &'a [String],
    pub abstract_marker_leading_sep: bool,
    pub abstract_marker_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "constructor_type.jinja", escape = "none")]
pub struct ConstructorTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub abstract_marker: &'a str,
    pub abstract_marker_list: &'a [String],
    pub abstract_marker_leading_sep: bool,
    pub abstract_marker_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "continue_statement.jinja", escape = "none")]
pub struct ContinueStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub label: &'a str,
    pub label_list: &'a [String],
    pub label_leading_sep: bool,
    pub label_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "debugger_statement.jinja", escape = "none")]
pub struct DebuggerStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "decorator_call_expression.jinja", escape = "none")]
pub struct DecoratorCallExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub function: &'a str,
    pub function_list: &'a [String],
    pub function_leading_sep: bool,
    pub function_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "decorator_member_expression.jinja", escape = "none")]
pub struct DecoratorMemberExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
    pub property: &'a str,
    pub property_list: &'a [String],
    pub property_leading_sep: bool,
    pub property_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "decorator_parenthesized_expression.jinja", escape = "none")]
pub struct DecoratorParenthesizedExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "default_type.jinja", escape = "none")]
pub struct DefaultTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "do_statement.jinja", escape = "none")]
pub struct DoStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub condition: &'a str,
    pub condition_list: &'a [String],
    pub condition_leading_sep: bool,
    pub condition_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub statement: &'a str,
    pub statement_list: &'a [String],
    pub statement_leading_sep: bool,
    pub statement_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "enum_assignment.jinja", escape = "none")]
pub struct EnumAssignmentTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "enum_body.jinja", escape = "none")]
pub struct EnumBodyTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "enum_declaration.jinja", escape = "none")]
pub struct EnumDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub const_marker: &'a str,
    pub const_marker_list: &'a [String],
    pub const_marker_leading_sep: bool,
    pub const_marker_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_clause.jinja", escape = "none")]
pub struct ExportClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_specifier.jinja", escape = "none")]
pub struct ExportSpecifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: &'a str,
    pub alias_list: &'a [String],
    pub alias_leading_sep: bool,
    pub alias_trailing_sep: bool,
    pub export_kind: &'a str,
    pub export_kind_list: &'a [String],
    pub export_kind_leading_sep: bool,
    pub export_kind_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_equals_export.jinja", escape = "none")]
pub struct ExportStatementEqualsExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_namespace_export.jinja", escape = "none")]
pub struct ExportStatementNamespaceExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_type_export.jinja", escape = "none")]
pub struct ExportStatementTypeExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_statement.jinja", escape = "none")]
pub struct ExportStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "extends_clause.jinja", escape = "none")]
pub struct ExtendsClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "extends_type_clause.jinja", escape = "none")]
pub struct ExtendsTypeClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_definition.jinja", escape = "none")]
pub struct FieldDefinitionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub property: &'a str,
    pub property_list: &'a [String],
    pub property_leading_sep: bool,
    pub property_trailing_sep: bool,
    pub static_marker: &'a str,
    pub static_marker_list: &'a [String],
    pub static_marker_leading_sep: bool,
    pub static_marker_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "flow_maybe_type.jinja", escape = "none")]
pub struct FlowMaybeTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_type: &'a str,
    pub primary_type_list: &'a [String],
    pub primary_type_leading_sep: bool,
    pub primary_type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "for_in_statement.jinja", escape = "none")]
pub struct ForInStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub await_marker: &'a str,
    pub await_marker_list: &'a [String],
    pub await_marker_leading_sep: bool,
    pub await_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub condition: &'a str,
    pub condition_list: &'a [String],
    pub condition_leading_sep: bool,
    pub condition_trailing_sep: bool,
    pub increment: &'a str,
    pub increment_list: &'a [String],
    pub increment_leading_sep: bool,
    pub increment_trailing_sep: bool,
    pub initializer: &'a str,
    pub initializer_list: &'a [String],
    pub initializer_leading_sep: bool,
    pub initializer_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "formal_parameters.jinja", escape = "none")]
pub struct FormalParametersTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_declaration.jinja", escape = "none")]
pub struct FunctionDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_expression.jinja", escape = "none")]
pub struct FunctionExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_signature.jinja", escape = "none")]
pub struct FunctionSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "generator_function_declaration.jinja", escape = "none")]
pub struct GeneratorFunctionDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "generator_function.jinja", escape = "none")]
pub struct GeneratorFunctionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: &'a str,
    pub alternative_list: &'a [String],
    pub alternative_leading_sep: bool,
    pub alternative_trailing_sep: bool,
    pub condition: &'a str,
    pub condition_list: &'a [String],
    pub condition_leading_sep: bool,
    pub condition_trailing_sep: bool,
    pub consequence: &'a str,
    pub consequence_list: &'a [String],
    pub consequence_leading_sep: bool,
    pub consequence_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "implements_clause.jinja", escape = "none")]
pub struct ImplementsClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_alias.jinja", escape = "none")]
pub struct ImportAliasTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_attribute.jinja", escape = "none")]
pub struct ImportAttributeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_default_import.jinja", escape = "none")]
pub struct ImportClauseDefaultImportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_named_imports.jinja", escape = "none")]
pub struct ImportClauseNamedImportsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_namespace_import.jinja", escape = "none")]
pub struct ImportClauseNamespaceImportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_clause.jinja", escape = "none")]
pub struct ImportClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_require_clause.jinja", escape = "none")]
pub struct ImportRequireClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: &'a str,
    pub identifier_list: &'a [String],
    pub identifier_leading_sep: bool,
    pub identifier_trailing_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier_name.jinja", escape = "none")]
pub struct ImportSpecifierNameTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier.jinja", escape = "none")]
pub struct ImportSpecifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub import_kind: &'a str,
    pub import_kind_list: &'a [String],
    pub import_kind_leading_sep: bool,
    pub import_kind_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub import_attribute: &'a str,
    pub import_attribute_list: &'a [String],
    pub import_attribute_leading_sep: bool,
    pub import_attribute_trailing_sep: bool,
    pub import_clause: &'a str,
    pub import_clause_list: &'a [String],
    pub import_clause_leading_sep: bool,
    pub import_clause_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
    pub source: &'a str,
    pub source_list: &'a [String],
    pub source_leading_sep: bool,
    pub source_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "index_signature.jinja", escape = "none")]
pub struct IndexSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub sign: &'a str,
    pub sign_list: &'a [String],
    pub sign_leading_sep: bool,
    pub sign_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "index_type_query.jinja", escape = "none")]
pub struct IndexTypeQueryTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_type: &'a str,
    pub primary_type_list: &'a [String],
    pub primary_type_leading_sep: bool,
    pub primary_type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "infer_type.jinja", escape = "none")]
pub struct InferTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_identifier: &'a str,
    pub type_identifier_list: &'a [String],
    pub type_identifier_leading_sep: bool,
    pub type_identifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "instantiation_expression.jinja", escape = "none")]
pub struct InstantiationExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "interface_declaration.jinja", escape = "none")]
pub struct InterfaceDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub extends_type_clause: &'a str,
    pub extends_type_clause_list: &'a [String],
    pub extends_type_clause_leading_sep: bool,
    pub extends_type_clause_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "internal_module.jinja", escape = "none")]
pub struct InternalModuleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "intersection_type.jinja", escape = "none")]
pub struct IntersectionTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_attribute.jinja", escape = "none")]
pub struct JsxAttributeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_closing_element.jinja", escape = "none")]
pub struct JsxClosingElementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_element.jinja", escape = "none")]
pub struct JsxElementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub close_tag: &'a str,
    pub close_tag_list: &'a [String],
    pub close_tag_leading_sep: bool,
    pub close_tag_trailing_sep: bool,
    pub open_tag: &'a str,
    pub open_tag_list: &'a [String],
    pub open_tag_leading_sep: bool,
    pub open_tag_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_expression.jinja", escape = "none")]
pub struct JsxExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_namespace_name.jinja", escape = "none")]
pub struct JsxNamespaceNameTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_opening_element.jinja", escape = "none")]
pub struct JsxOpeningElementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: &'a str,
    pub attribute_list: &'a [String],
    pub attribute_leading_sep: bool,
    pub attribute_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_self_closing_element.jinja", escape = "none")]
pub struct JsxSelfClosingElementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: &'a str,
    pub attribute_list: &'a [String],
    pub attribute_leading_sep: bool,
    pub attribute_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "labeled_statement.jinja", escape = "none")]
pub struct LabeledStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub label: &'a str,
    pub label_list: &'a [String],
    pub label_leading_sep: bool,
    pub label_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lexical_declaration.jinja", escape = "none")]
pub struct LexicalDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declarators: &'a str,
    pub declarators_list: &'a [String],
    pub declarators_leading_sep: bool,
    pub declarators_trailing_sep: bool,
    pub kind: &'a str,
    pub kind_list: &'a [String],
    pub kind_leading_sep: bool,
    pub kind_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "literal_type.jinja", escape = "none")]
pub struct LiteralTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lookup_type.jinja", escape = "none")]
pub struct LookupTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index_type: &'a str,
    pub index_type_list: &'a [String],
    pub index_type_leading_sep: bool,
    pub index_type_trailing_sep: bool,
    pub primary_type: &'a str,
    pub primary_type_list: &'a [String],
    pub primary_type_leading_sep: bool,
    pub primary_type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "mapped_type_clause.jinja", escape = "none")]
pub struct MappedTypeClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: &'a str,
    pub alias_list: &'a [String],
    pub alias_leading_sep: bool,
    pub alias_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "member_expression.jinja", escape = "none")]
pub struct MemberExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
    pub optional_chain: &'a str,
    pub optional_chain_list: &'a [String],
    pub optional_chain_leading_sep: bool,
    pub optional_chain_trailing_sep: bool,
    pub property: &'a str,
    pub property_list: &'a [String],
    pub property_leading_sep: bool,
    pub property_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "method_definition.jinja", escape = "none")]
pub struct MethodDefinitionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: &'a str,
    pub accessibility_modifier_list: &'a [String],
    pub accessibility_modifier_leading_sep: bool,
    pub accessibility_modifier_trailing_sep: bool,
    pub accessor_kind: &'a str,
    pub accessor_kind_list: &'a [String],
    pub accessor_kind_leading_sep: bool,
    pub accessor_kind_trailing_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub optional_marker: &'a str,
    pub optional_marker_list: &'a [String],
    pub optional_marker_leading_sep: bool,
    pub optional_marker_trailing_sep: bool,
    pub override_modifier: &'a str,
    pub override_modifier_list: &'a [String],
    pub override_modifier_leading_sep: bool,
    pub override_modifier_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub static_marker: &'a str,
    pub static_marker_list: &'a [String],
    pub static_marker_leading_sep: bool,
    pub static_marker_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "method_signature.jinja", escape = "none")]
pub struct MethodSignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: &'a str,
    pub accessibility_modifier_list: &'a [String],
    pub accessibility_modifier_leading_sep: bool,
    pub accessibility_modifier_trailing_sep: bool,
    pub accessor_kind: &'a str,
    pub accessor_kind_list: &'a [String],
    pub accessor_kind_leading_sep: bool,
    pub accessor_kind_trailing_sep: bool,
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub optional_marker: &'a str,
    pub optional_marker_list: &'a [String],
    pub optional_marker_leading_sep: bool,
    pub optional_marker_trailing_sep: bool,
    pub override_modifier: &'a str,
    pub override_modifier_list: &'a [String],
    pub override_modifier_leading_sep: bool,
    pub override_modifier_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
    pub static_marker: &'a str,
    pub static_marker_list: &'a [String],
    pub static_marker_leading_sep: bool,
    pub static_marker_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "named_imports.jinja", escape = "none")]
pub struct NamedImportsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "namespace_export.jinja", escape = "none")]
pub struct NamespaceExportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "namespace_import.jinja", escape = "none")]
pub struct NamespaceImportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: &'a str,
    pub identifier_list: &'a [String],
    pub identifier_leading_sep: bool,
    pub identifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "nested_identifier.jinja", escape = "none")]
pub struct NestedIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
    pub property: &'a str,
    pub property_list: &'a [String],
    pub property_leading_sep: bool,
    pub property_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "nested_type_identifier.jinja", escape = "none")]
pub struct NestedTypeIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub module: &'a str,
    pub module_list: &'a [String],
    pub module_leading_sep: bool,
    pub module_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "new_expression.jinja", escape = "none")]
pub struct NewExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub constructor: &'a str,
    pub constructor_list: &'a [String],
    pub constructor_leading_sep: bool,
    pub constructor_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "non_null_expression.jinja", escape = "none")]
pub struct NonNullExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "object_assignment_pattern.jinja", escape = "none")]
pub struct ObjectAssignmentPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "object_pattern.jinja", escape = "none")]
pub struct ObjectPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "object_type.jinja", escape = "none")]
pub struct ObjectTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub closing: &'a str,
    pub closing_list: &'a [String],
    pub closing_leading_sep: bool,
    pub closing_trailing_sep: bool,
    pub members: &'a str,
    pub members_list: &'a [String],
    pub members_leading_sep: bool,
    pub members_trailing_sep: bool,
    pub opening: &'a str,
    pub opening_list: &'a [String],
    pub opening_leading_sep: bool,
    pub opening_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "object.jinja", escape = "none")]
pub struct ObjectTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "omitting_type_annotation.jinja", escape = "none")]
pub struct OmittingTypeAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "opting_type_annotation.jinja", escape = "none")]
pub struct OptingTypeAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "optional_parameter.jinja", escape = "none")]
pub struct OptionalParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "optional_tuple_parameter.jinja", escape = "none")]
pub struct OptionalTupleParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "optional_type.jinja", escape = "none")]
pub struct OptionalTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "pair_pattern.jinja", escape = "none")]
pub struct PairPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub key: &'a str,
    pub key_list: &'a [String],
    pub key_leading_sep: bool,
    pub key_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub key: &'a str,
    pub key_list: &'a [String],
    pub key_leading_sep: bool,
    pub key_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression_sequence.jinja", escape = "none")]
pub struct ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_type.jinja", escape = "none")]
pub struct ParenthesizedTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "program.jinja", escape = "none")]
pub struct ProgramTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub hash_bang_line: &'a str,
    pub hash_bang_line_list: &'a [String],
    pub hash_bang_line_leading_sep: bool,
    pub hash_bang_line_trailing_sep: bool,
    pub statements: &'a str,
    pub statements_list: &'a [String],
    pub statements_leading_sep: bool,
    pub statements_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "property_signature.jinja", escape = "none")]
pub struct PropertySignatureTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: &'a str,
    pub accessibility_modifier_list: &'a [String],
    pub accessibility_modifier_leading_sep: bool,
    pub accessibility_modifier_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub optional_marker: &'a str,
    pub optional_marker_list: &'a [String],
    pub optional_marker_leading_sep: bool,
    pub optional_marker_trailing_sep: bool,
    pub override_modifier: &'a str,
    pub override_modifier_list: &'a [String],
    pub override_modifier_leading_sep: bool,
    pub override_modifier_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
    pub static_marker: &'a str,
    pub static_marker_list: &'a [String],
    pub static_marker_leading_sep: bool,
    pub static_marker_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "public_field_definition.jinja", escape = "none")]
pub struct PublicFieldDefinitionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub optionality_marker: &'a str,
    pub optionality_marker_list: &'a [String],
    pub optionality_marker_leading_sep: bool,
    pub optionality_marker_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "readonly_type.jinja", escape = "none")]
pub struct ReadonlyTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "regex.jinja", escape = "none")]
pub struct RegexTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub flags: &'a str,
    pub flags_list: &'a [String],
    pub flags_leading_sep: bool,
    pub flags_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "required_parameter.jinja", escape = "none")]
pub struct RequiredParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: &'a str,
    pub decorator_list: &'a [String],
    pub decorator_leading_sep: bool,
    pub decorator_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
    pub readonly_marker: &'a str,
    pub readonly_marker_list: &'a [String],
    pub readonly_marker_leading_sep: bool,
    pub readonly_marker_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "rest_pattern.jinja", escape = "none")]
pub struct RestPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "rest_type.jinja", escape = "none")]
pub struct RestTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "satisfies_expression.jinja", escape = "none")]
pub struct SatisfiesExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
    pub type_annotation: &'a str,
    pub type_annotation_list: &'a [String],
    pub type_annotation_leading_sep: bool,
    pub type_annotation_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "sequence_expression.jinja", escape = "none")]
pub struct SequenceExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "spread_element.jinja", escape = "none")]
pub struct SpreadElementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "statement_block.jinja", escape = "none")]
pub struct StatementBlockTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub automatic_semicolon: &'a str,
    pub automatic_semicolon_list: &'a [String],
    pub automatic_semicolon_leading_sep: bool,
    pub automatic_semicolon_trailing_sep: bool,
    pub statements: &'a str,
    pub statements_list: &'a [String],
    pub statements_leading_sep: bool,
    pub statements_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "string_double.jinja", escape = "none")]
pub struct StringDoubleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "string_single.jinja", escape = "none")]
pub struct StringSingleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "subscript_expression.jinja", escape = "none")]
pub struct SubscriptExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index: &'a str,
    pub index_list: &'a [String],
    pub index_leading_sep: bool,
    pub index_trailing_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
    pub optional_chain: &'a str,
    pub optional_chain_list: &'a [String],
    pub optional_chain_leading_sep: bool,
    pub optional_chain_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "switch_body.jinja", escape = "none")]
pub struct SwitchBodyTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "switch_case.jinja", escape = "none")]
pub struct SwitchCaseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "switch_default.jinja", escape = "none")]
pub struct SwitchDefaultTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "switch_statement.jinja", escape = "none")]
pub struct SwitchStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_literal_type.jinja", escape = "none")]
pub struct TemplateLiteralTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_string.jinja", escape = "none")]
pub struct TemplateStringTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_substitution.jinja", escape = "none")]
pub struct TemplateSubstitutionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_type.jinja", escape = "none")]
pub struct TemplateTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ternary_expression.jinja", escape = "none")]
pub struct TernaryExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: &'a str,
    pub alternative_list: &'a [String],
    pub alternative_leading_sep: bool,
    pub alternative_trailing_sep: bool,
    pub condition: &'a str,
    pub condition_list: &'a [String],
    pub condition_leading_sep: bool,
    pub condition_trailing_sep: bool,
    pub consequence: &'a str,
    pub consequence_list: &'a [String],
    pub consequence_leading_sep: bool,
    pub consequence_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "throw_statement.jinja", escape = "none")]
pub struct ThrowStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub finalizer: &'a str,
    pub finalizer_list: &'a [String],
    pub finalizer_leading_sep: bool,
    pub finalizer_trailing_sep: bool,
    pub handler: &'a str,
    pub handler_list: &'a [String],
    pub handler_leading_sep: bool,
    pub handler_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "tuple_parameter.jinja", escape = "none")]
pub struct TupleParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_declaration.jinja", escape = "none")]
pub struct TypeAliasDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_annotation.jinja", escape = "none")]
pub struct TypeAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_assertion.jinja", escape = "none")]
pub struct TypeAssertionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub const_marker: &'a str,
    pub const_marker_list: &'a [String],
    pub const_marker_leading_sep: bool,
    pub const_marker_trailing_sep: bool,
    pub constraint: &'a str,
    pub constraint_list: &'a [String],
    pub constraint_leading_sep: bool,
    pub constraint_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate_annotation.jinja", escape = "none")]
pub struct TypePredicateAnnotationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub type_predicate: &'a str,
    pub type_predicate_list: &'a [String],
    pub type_predicate_leading_sep: bool,
    pub type_predicate_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate.jinja", escape = "none")]
pub struct TypePredicateTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_query.jinja", escape = "none")]
pub struct TypeQueryTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: &'a str,
    pub argument_list: &'a [String],
    pub argument_leading_sep: bool,
    pub argument_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "update_expression.jinja", escape = "none")]
pub struct UpdateExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "variable_declaration.jinja", escape = "none")]
pub struct VariableDeclarationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declarators: &'a str,
    pub declarators_list: &'a [String],
    pub declarators_leading_sep: bool,
    pub declarators_trailing_sep: bool,
    pub semicolon: &'a str,
    pub semicolon_list: &'a [String],
    pub semicolon_leading_sep: bool,
    pub semicolon_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "variable_declarator.jinja", escape = "none")]
pub struct VariableDeclaratorTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub condition: &'a str,
    pub condition_list: &'a [String],
    pub condition_leading_sep: bool,
    pub condition_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

use ::askama::Template as _AskamaTemplate;
use ::sittir_core::types::{FieldValue, NodeData};

#[derive(Debug, Default)]
struct ResolvedField {
    scalar: String,
    items: Vec<String>,
    leading_sep: bool,
    trailing_sep: bool,
}

impl ResolvedField {
    fn from_scalar(value: String) -> Self {
        let mut items = Vec::new();
        if !value.is_empty() {
            items.push(value.clone());
        }
        Self {
            scalar: value,
            items,
            leading_sep: false,
            trailing_sep: false,
        }
    }
}

fn separator_for(kind: &str) -> &'static str {
    match kind {
        "arguments" => ",",
        "array" => ",",
        "array_pattern" => ",",
        "export_clause" => ",",
        "named_imports" => ",",
        "sequence_expression" => ",",
        "tuple_type" => ",",
        "type_arguments" => ",",
        "type_parameters" => ",",
        _ => "",
    }
}

fn variant_for(parent_kind: &str, child_kind: &str) -> Option<&'static str> {
    match (parent_kind, child_kind) {
        ("arrow_function", "arrow_function__call_signature") => Some("parameter"),
        ("arrow_function", "arrow_function__form__call_signature") => Some("_call_signature"),
        ("arrow_function", "arrow_function__form_parameter") => Some("parameter"),
        ("arrow_function", "arrow_function_parameter") => Some("parameter"),
        ("call_expression", "call_expression__form_call") => Some("call"),
        ("call_expression", "call_expression__form_member") => Some("member"),
        ("call_expression", "call_expression__form_template_call") => Some("template_call"),
        ("call_expression", "call_expression_call") => Some("call"),
        ("call_expression", "call_expression_member") => Some("call"),
        ("call_expression", "call_expression_template_call") => Some("call"),
        ("class_heritage", "class_heritage__form_extends_clause") => Some("extends_clause"),
        ("class_heritage", "class_heritage__form_implements_clause") => Some("implements_clause"),
        ("class_heritage", "class_heritage_extends_clause") => Some("extends_clause"),
        ("class_heritage", "class_heritage_implements_clause") => Some("extends_clause"),
        ("export_statement", "export_statement__form_default") => Some("default"),
        ("export_statement", "export_statement__form_equals_export") => Some("equals_export"),
        ("export_statement", "export_statement__form_namespace_export") => Some("namespace_export"),
        ("export_statement", "export_statement__form_type_export") => Some("type_export"),
        ("export_statement", "export_statement_default") => Some("default"),
        ("export_statement", "export_statement_equals_export") => Some("default"),
        ("export_statement", "export_statement_namespace_export") => Some("default"),
        ("export_statement", "export_statement_type_export") => Some("default"),
        ("import_clause", "import_clause__form_default_import") => Some("default_import"),
        ("import_clause", "import_clause__form_named_imports") => Some("named_imports"),
        ("import_clause", "import_clause__form_namespace_import") => Some("namespace_import"),
        ("import_clause", "import_clause_default_import") => Some("namespace_import"),
        ("import_clause", "import_clause_named_imports") => Some("namespace_import"),
        ("import_clause", "import_clause_namespace_import") => Some("namespace_import"),
        ("import_specifier", "import_specifier__form_as") => Some("as"),
        ("import_specifier", "import_specifier__form_name") => Some("name"),
        ("import_specifier", "import_specifier_as") => Some("name"),
        ("import_specifier", "import_specifier_name") => Some("name"),
        ("index_signature", "index_signature__form_colon") => Some("colon"),
        ("index_signature", "index_signature__form_mapped_type_clause") => Some("mapped_type_clause"),
        ("index_signature", "index_signature_colon") => Some("colon"),
        ("index_signature", "index_signature_mapped_type_clause") => Some("colon"),
        ("parenthesized_expression", "parenthesized_expression__form_sequence") => Some("sequence"),
        ("parenthesized_expression", "parenthesized_expression__form_typed") => Some("typed"),
        ("parenthesized_expression", "parenthesized_expression_sequence") => Some("typed"),
        ("parenthesized_expression", "parenthesized_expression_typed") => Some("typed"),
        ("string", "string__form_double") => Some("double"),
        ("string", "string__form_single") => Some("single"),
        ("string", "string_double") => Some("double"),
        ("string", "string_single") => Some("double"),
        ("update_expression", "update_expression__form_postfix") => Some("postfix"),
        ("update_expression", "update_expression__form_prefix") => Some("prefix"),
        ("update_expression", "update_expression_postfix") => Some("postfix"),
        ("update_expression", "update_expression_prefix") => Some("postfix"),
        _ => None,
    }
}

fn first_named_child_kind(node: &NodeData) -> Option<&str> {
    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.as_str())
}

fn resolve_variant(node: &NodeData) -> &'static str {
    first_named_child_kind(node)
        .and_then(|child_kind| variant_for(node.type_.as_str(), child_kind))
        .unwrap_or("")
}

fn render_node_value(node: &NodeData) -> Result<String, ::askama::Error> {
    render_dispatch(node)
}

fn resolve_text(node: &NodeData) -> Result<String, ::askama::Error> {
    if let Some(text) = &node.text {
        return Ok(text.clone());
    }
    let mut parts = Vec::new();
    if let Some(fields) = &node.fields {
        for value in fields.values() {
            match value {
                FieldValue::Single(child) => parts.push(render_node_value(child)?),
                FieldValue::Multiple(items) => {
                    for child in items {
                        parts.push(render_node_value(child)?);
                    }
                }
                FieldValue::Text(text) => parts.push(text.clone()),
            }
        }
    }
    if let Some(children) = &node.children {
        for child in children {
            parts.push(render_node_value(child)?);
        }
    }
    Ok(parts.join(""))
}

fn resolve_leaf<'a>(node: &'a NodeData, name: &str) -> Option<&'a str> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        Some(FieldValue::Single(child)) => child.text.as_deref(),
        Some(FieldValue::Text(text)) => Some(text.as_str()),
        _ => None,
    }
}

fn resolve_optional(node: &NodeData, name: &str) -> Result<Option<String>, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Ok(None),
        Some(FieldValue::Text(text)) => Ok((!text.is_empty()).then(|| text.clone())),
        Some(FieldValue::Single(child)) => {
            let rendered = render_node_value(child)?;
            Ok((!rendered.is_empty()).then_some(rendered))
        }
        Some(FieldValue::Multiple(_)) => {
            let resolved = resolve_field(node, name)?;
            Ok((!resolved.scalar.is_empty()).then_some(resolved.scalar))
        }
    }
}

fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {
    Ok(resolve_optional(node, name)?.unwrap_or_default())
}

fn is_join_flank_token(text: &str) -> bool {
    matches!(text, "," | ";")
}

fn detect_field_trailing_sep(node: &NodeData, field_name: &str) -> bool {
    let fields = match &node.fields {
        Some(fields) => fields,
        None => return false,
    };
    let value = match fields.get(field_name) {
        Some(value) => value,
        None => return false,
    };
    let boundary = match value {
        FieldValue::Multiple(items) => items
            .iter()
            .filter(|item| item.named)
            .filter_map(|item| item.span.map(|span| span.end))
            .max(),
        _ => None,
    };
    let boundary = match boundary {
        Some(boundary) => boundary,
        None => return false,
    };
    for (name, raw) in fields {
        if name == field_name {
            continue;
        }
        let values: Vec<&NodeData> = match raw {
            FieldValue::Single(item) => vec![item.as_ref()],
            FieldValue::Multiple(items) => items.iter().collect(),
            FieldValue::Text(_) => Vec::new(),
        };
        for candidate in values {
            if candidate.named {
                continue;
            }
            if let Some(span) = candidate.span {
                if span.start >= boundary && candidate.text.as_deref().map_or(false, is_join_flank_token) {
                    return true;
                }
            }
        }
    }
    if let Some(children) = &node.children {
        for child in children {
            if child.named {
                continue;
            }
            if let Some(span) = child.span {
                if span.start >= boundary && child.text.as_deref().map_or(false, is_join_flank_token) {
                    return true;
                }
            }
        }
    }
    false
}

fn resolve_field(node: &NodeData, name: &str) -> Result<ResolvedField, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Ok(ResolvedField::default()),
        Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.clone())),
        Some(FieldValue::Single(child)) => {
            let rendered = render_node_value(child)?;
            Ok(ResolvedField::from_scalar(rendered))
        }
        Some(FieldValue::Multiple(items)) => {
            let mut rendered = Vec::new();
            for item in items {
                if !item.named {
                    continue;
                }
                rendered.push(render_node_value(item)?);
            }
            let scalar = if rendered.is_empty() {
                String::new()
            } else {
                ::sittir_core::filters::joinby(rendered.as_slice(), separator_for(node.type_.as_str()), false, false)?
            };
            Ok(ResolvedField {
                scalar,
                items: rendered,
                leading_sep: false,
                trailing_sep: detect_field_trailing_sep(node, name),
            })
        }
    }
}

fn resolve_children(node: &NodeData, consumed_fields: &[&str]) -> Result<ResolvedField, ::askama::Error> {
    let mut child_nodes: Vec<(u32, usize, &NodeData)> = Vec::new();
    let mut child_ordinal = 0usize;
    let mut first_named_idx: Option<usize> = None;
    let mut last_named_idx: Option<usize> = None;
    if let Some(items) = &node.children {
        for (index, child) in items.iter().enumerate() {
            if !child.named {
                continue;
            }
            if first_named_idx.is_none() {
                first_named_idx = Some(index);
            }
            last_named_idx = Some(index);
            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));
            child_ordinal += 1;
        }
    }
    if let Some(fields) = &node.fields {
        for (name, value) in fields {
            if consumed_fields.iter().any(|consumed| consumed == &name.as_str()) {
                continue;
            }
            match value {
                FieldValue::Single(child) => {
                    if child.named {
                        child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child.as_ref()));
                        child_ordinal += 1;
                    }
                }
                FieldValue::Multiple(items) => {
                    for child in items {
                        if child.named {
                            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));
                            child_ordinal += 1;
                        }
                    }
                }
                FieldValue::Text(_) => {}
            }
        }
    }
    child_nodes.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));
    let mut children = Vec::new();
    for (_, _, child) in child_nodes {
        children.push(render_node_value(child)?);
    }
    let mut leading_sep = false;
    let mut trailing_sep = false;
    if let Some(items) = &node.children {
        if let Some(first) = first_named_idx {
            if first > 0 {
                if let Some(before) = items.get(first - 1) {
                    leading_sep = !before.named && before.text.as_deref().map_or(false, is_join_flank_token);
                }
            }
        }
        if let Some(last) = last_named_idx {
            if let Some(after) = items.get(last + 1) {
                trailing_sep = !after.named && after.text.as_deref().map_or(false, is_join_flank_token);
            }
        }
    }
    let scalar = if children.is_empty() {
        String::new()
    } else {
        ::sittir_core::filters::joinby(children.as_slice(), separator_for(node.type_.as_str()), leading_sep, trailing_sep)?
    };
    Ok(ResolvedField {
        scalar,
        items: children,
        leading_sep,
        trailing_sep,
    })
}

fn token_shaped_fallback(node: &NodeData) -> Result<String, ::askama::Error> {
    let fields_all_anon = node.fields.as_ref().map_or(true, |fields| {
        fields.values().all(|value| match value {
            FieldValue::Single(item) => !item.named,
            FieldValue::Multiple(items) => items.iter().all(|item| !item.named),
            FieldValue::Text(_) => true,
        })
    });
    let children_all_anon = node.children.as_ref().map_or(true, |children| children.iter().all(|child| !child.named));
    if fields_all_anon && children_all_anon {
        if let Some(text) = &node.text {
            return Ok(text.clone());
        }
        let mut parts = Vec::new();
        if let Some(fields) = &node.fields {
            for value in fields.values() {
                match value {
                    FieldValue::Single(item) => {
                        if let Some(text) = &item.text {
                            parts.push(text.clone());
                        }
                    }
                    FieldValue::Multiple(items) => {
                        for item in items {
                            if let Some(text) = &item.text {
                                parts.push(text.clone());
                            }
                        }
                    }
                    FieldValue::Text(text) => parts.push(text.clone()),
                }
            }
        }
        if let Some(children) = &node.children {
            for child in children {
                if let Some(text) = &child.text {
                    parts.push(text.clone());
                }
            }
        }
        if !parts.is_empty() {
            return Ok(parts.join(""));
        }
    }
    Err(::askama::Error::Custom(
        format!("render_dispatch: no template for kind '{}'", node.type_).into(),
    ))
}

fn render_hidden_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters")?;
    let field_1 = resolve_field(node, "return_type")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ArrowFunctionUCallSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        parameters: field_0.scalar.as_str(),
        parameters_list: field_0.items.as_slice(),
        parameters_leading_sep: field_0.leading_sep,
        parameters_trailing_sep: field_0.trailing_sep,
        return_type: field_1.scalar.as_str(),
        return_type_list: field_1.items.as_slice(),
        return_type_leading_sep: field_1.leading_sep,
        return_type_trailing_sep: field_1.trailing_sep,
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ArrowFunctionParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        parameter: field_0.scalar.as_str(),
        parameter_list: field_0.items.as_slice(),
        parameter_leading_sep: field_0.leading_sep,
        parameter_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_call_expression_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallExpressionCallTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        function: field_1.scalar.as_str(),
        function_list: field_1.items.as_slice(),
        function_leading_sep: field_1.leading_sep,
        function_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_call_expression_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallExpressionMemberTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        function: field_1.scalar.as_str(),
        function_list: field_1.items.as_slice(),
        function_leading_sep: field_1.leading_sep,
        function_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_call_expression_template_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallExpressionTemplateCallTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        function: field_1.scalar.as_str(),
        function_list: field_1.items.as_slice(),
        function_leading_sep: field_1.leading_sep,
        function_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_class_body_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassBodyMemberTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_class_body_method_sig(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassBodyMethodSigTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_class_body_method(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator"])?;
    let field_0 = resolve_field(node, "decorator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassBodyMethodTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        decorator: field_0.scalar.as_str(),
        decorator_list: field_0.items.as_slice(),
        decorator_leading_sep: field_0.leading_sep,
        decorator_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ClassHeritageExtendsClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ClassHeritageImplementsClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm_default_kw_value(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        value: field_0.scalar.as_str(),
        value_list: field_0.items.as_slice(),
        value_leading_sep: field_0.leading_sep,
        value_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm_default_kw(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultDeclArmDefaultKwTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        declaration: field_0.scalar.as_str(),
        declaration_list: field_0.items.as_slice(),
        declaration_leading_sep: field_0.leading_sep,
        declaration_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration", "decorator"])?;
    let field_0 = resolve_field(node, "declaration")?;
    let field_1 = resolve_field(node, "decorator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultDeclArmTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        declaration: field_0.scalar.as_str(),
        declaration_list: field_0.items.as_slice(),
        declaration_leading_sep: field_0.leading_sep,
        declaration_trailing_sep: field_0.trailing_sep,
        decorator: field_1.scalar.as_str(),
        decorator_list: field_1.items.as_slice(),
        decorator_leading_sep: field_1.leading_sep,
        decorator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_clause_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultFromArmClauseFromTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        source: field_0.scalar.as_str(),
        source_list: field_0.items.as_slice(),
        source_leading_sep: field_0.leading_sep,
        source_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_ns_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultFromArmNsFromTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        source: field_0.scalar.as_str(),
        source_list: field_0.items.as_slice(),
        source_leading_sep: field_0.leading_sep,
        source_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_star_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultFromArmStarFromTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        source: field_0.scalar.as_str(),
        source_list: field_0.items.as_slice(),
        source_leading_sep: field_0.leading_sep,
        source_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementDefaultFromArmTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ExportStatementEqualsExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ExportStatementNamespaceExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ExportStatementTypeExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        source: field_0.scalar.as_str(),
        source_list: field_0.items.as_slice(),
        source_leading_sep: field_0.leading_sep,
        source_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_for_header_let_const_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left"])?;
    let field_0 = resolve_field(node, "kind")?;
    let field_1 = resolve_field(node, "left")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForHeaderLetConstKindTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        kind: field_0.scalar.as_str(),
        kind_list: field_0.items.as_slice(),
        kind_leading_sep: field_0.leading_sep,
        kind_trailing_sep: field_0.trailing_sep,
        left: field_1.scalar.as_str(),
        left_list: field_1.items.as_slice(),
        left_leading_sep: field_1.leading_sep,
        left_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_for_header_lhs(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForHeaderLhsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_for_header_var_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left", "value"])?;
    let field_0 = resolve_field(node, "kind")?;
    let field_1 = resolve_field(node, "left")?;
    let field_2 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForHeaderVarKindTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        kind: field_0.scalar.as_str(),
        kind_list: field_0.items.as_slice(),
        kind_leading_sep: field_0.leading_sep,
        kind_trailing_sep: field_0.trailing_sep,
        left: field_1.scalar.as_str(),
        left_list: field_1.items.as_slice(),
        left_leading_sep: field_1.leading_sep,
        left_trailing_sep: field_1.trailing_sep,
        value: field_2.scalar.as_str(),
        value_list: field_2.items.as_slice(),
        value_leading_sep: field_2.leading_sep,
        value_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ImportClauseDefaultImportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ImportClauseNamedImportsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ImportClauseNamespaceImportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_import_specifier_as(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportSpecifierAsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        alias: field_0.scalar.as_str(),
        alias_list: field_0.items.as_slice(),
        alias_leading_sep: field_0.leading_sep,
        alias_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ImportSpecifierNameTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_index_signature_colon(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "name"])?;
    let field_0 = resolve_field(node, "index_type")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IndexSignatureColonTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        index_type: field_0.scalar.as_str(),
        index_type_list: field_0.items.as_slice(),
        index_type_leading_sep: field_0.leading_sep,
        index_type_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _IndexSignatureMappedTypeClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InitializerTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        value: field_0.scalar.as_str(),
        value_list: field_0.items.as_slice(),
        value_leading_sep: field_0.leading_sep,
        value_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_interface_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InterfaceBodyTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_lhs_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LhsExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_number(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument")?;
    let field_1 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _NumberTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        argument: field_0.scalar.as_str(),
        argument_list: field_0.items.as_slice(),
        argument_leading_sep: field_0.leading_sep,
        argument_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ParenthesizedExpressionSequenceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_parenthesized_expression_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParenthesizedExpressionTypedTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_property_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PropertyIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_public_field_definition_abstract_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker")?;
    let field_1 = resolve_field(node, "readonly_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionAbstractFirstTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        abstract_marker: field_0.scalar.as_str(),
        abstract_marker_list: field_0.items.as_slice(),
        abstract_marker_leading_sep: field_0.leading_sep,
        abstract_marker_trailing_sep: field_0.trailing_sep,
        readonly_marker: field_1.scalar.as_str(),
        readonly_marker_list: field_1.items.as_slice(),
        readonly_marker_leading_sep: field_1.leading_sep,
        readonly_marker_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_public_field_definition_access_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declare_marker"])?;
    let field_0 = resolve_field(node, "declare_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionAccessFirstTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        declare_marker: field_0.scalar.as_str(),
        declare_marker_list: field_0.items.as_slice(),
        declare_marker_leading_sep: field_0.leading_sep,
        declare_marker_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_public_field_definition_accessor_opt(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessor_marker"])?;
    let field_0 = resolve_field(node, "accessor_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionAccessorOptTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        accessor_marker: field_0.scalar.as_str(),
        accessor_marker_list: field_0.items.as_slice(),
        accessor_marker_leading_sep: field_0.leading_sep,
        accessor_marker_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_public_field_definition_declare_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionDeclareFirstTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_public_field_definition_readonly_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker")?;
    let field_1 = resolve_field(node, "readonly_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionReadonlyFirstTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        abstract_marker: field_0.scalar.as_str(),
        abstract_marker_list: field_0.items.as_slice(),
        abstract_marker_leading_sep: field_0.leading_sep,
        abstract_marker_trailing_sep: field_0.trailing_sep,
        readonly_marker: field_1.scalar.as_str(),
        readonly_marker_list: field_1.items.as_slice(),
        readonly_marker_leading_sep: field_1.leading_sep,
        readonly_marker_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_public_field_definition_static_mods(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["readonly_marker", "static_marker"])?;
    let field_0 = resolve_field(node, "readonly_marker")?;
    let field_1 = resolve_field(node, "static_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionStaticModsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        readonly_marker: field_0.scalar.as_str(),
        readonly_marker_list: field_0.items.as_slice(),
        readonly_marker_leading_sep: field_0.leading_sep,
        readonly_marker_trailing_sep: field_0.trailing_sep,
        static_marker: field_1.scalar.as_str(),
        static_marker_list: field_1.items.as_slice(),
        static_marker_leading_sep: field_1.leading_sep,
        static_marker_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_statement_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StatementIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _StringDoubleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_string_fragment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StringFragmentTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _StringSingleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_type_query_call_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQueryCallExpressionInTypeAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        function: field_1.scalar.as_str(),
        function_list: field_1.items.as_slice(),
        function_leading_sep: field_1.leading_sep,
        function_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_type_query_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQueryCallExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        function: field_1.scalar.as_str(),
        function_list: field_1.items.as_slice(),
        function_leading_sep: field_1.leading_sep,
        function_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_type_query_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function")?;
    let field_1 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQueryInstantiationExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        function: field_0.scalar.as_str(),
        function_list: field_0.items.as_slice(),
        function_leading_sep: field_0.leading_sep,
        function_trailing_sep: field_0.trailing_sep,
        type_arguments: field_1.scalar.as_str(),
        type_arguments_list: field_1.items.as_slice(),
        type_arguments_leading_sep: field_1.leading_sep,
        type_arguments_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_type_query_member_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object")?;
    let field_1 = resolve_field(node, "property")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQueryMemberExpressionInTypeAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        object: field_0.scalar.as_str(),
        object_list: field_0.items.as_slice(),
        object_leading_sep: field_0.leading_sep,
        object_trailing_sep: field_0.trailing_sep,
        property: field_1.scalar.as_str(),
        property_list: field_1.items.as_slice(),
        property_leading_sep: field_1.leading_sep,
        property_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_type_query_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object")?;
    let field_1 = resolve_field(node, "property")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQueryMemberExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        object: field_0.scalar.as_str(),
        object_list: field_0.items.as_slice(),
        object_leading_sep: field_0.leading_sep,
        object_trailing_sep: field_0.trailing_sep,
        property: field_1.scalar.as_str(),
        property_list: field_1.items.as_slice(),
        property_leading_sep: field_1.leading_sep,
        property_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_type_query_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index")?;
    let field_1 = resolve_field(node, "object")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQuerySubscriptExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        index: field_0.scalar.as_str(),
        index_list: field_0.items.as_slice(),
        index_leading_sep: field_0.leading_sep,
        index_trailing_sep: field_0.trailing_sep,
        object: field_1.scalar.as_str(),
        object_list: field_1.items.as_slice(),
        object_leading_sep: field_1.leading_sep,
        object_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_update_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument")?;
    let field_1 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UpdateExpressionPostfixTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        argument: field_0.scalar.as_str(),
        argument_list: field_0.items.as_slice(),
        argument_leading_sep: field_0.leading_sep,
        argument_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_update_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument")?;
    let field_1 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UpdateExpressionPrefixTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        argument: field_0.scalar.as_str(),
        argument_list: field_0.items.as_slice(),
        argument_leading_sep: field_0.leading_sep,
        argument_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_abstract_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "class_heritage")?;
    let field_2 = resolve_field(node, "decorator")?;
    let field_3 = resolve_field(node, "name")?;
    let field_4 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AbstractClassDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        class_heritage: field_1.scalar.as_str(),
        class_heritage_list: field_1.items.as_slice(),
        class_heritage_leading_sep: field_1.leading_sep,
        class_heritage_trailing_sep: field_1.trailing_sep,
        decorator: field_2.scalar.as_str(),
        decorator_list: field_2.items.as_slice(),
        decorator_leading_sep: field_2.leading_sep,
        decorator_trailing_sep: field_2.trailing_sep,
        name: field_3.scalar.as_str(),
        name_list: field_3.items.as_slice(),
        name_leading_sep: field_3.leading_sep,
        name_trailing_sep: field_3.trailing_sep,
        type_parameters: field_4.scalar.as_str(),
        type_parameters_list: field_4.items.as_slice(),
        type_parameters_leading_sep: field_4.leading_sep,
        type_parameters_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_abstract_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "name", "optional_marker", "override_modifier", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier")?;
    let field_1 = resolve_field(node, "accessor_kind")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "optional_marker")?;
    let field_4 = resolve_field(node, "override_modifier")?;
    let field_5 = resolve_field(node, "parameters")?;
    let field_6 = resolve_field(node, "return_type")?;
    let field_7 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AbstractMethodSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        accessibility_modifier: field_0.scalar.as_str(),
        accessibility_modifier_list: field_0.items.as_slice(),
        accessibility_modifier_leading_sep: field_0.leading_sep,
        accessibility_modifier_trailing_sep: field_0.trailing_sep,
        accessor_kind: field_1.scalar.as_str(),
        accessor_kind_list: field_1.items.as_slice(),
        accessor_kind_leading_sep: field_1.leading_sep,
        accessor_kind_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        optional_marker: field_3.scalar.as_str(),
        optional_marker_list: field_3.items.as_slice(),
        optional_marker_leading_sep: field_3.leading_sep,
        optional_marker_trailing_sep: field_3.trailing_sep,
        override_modifier: field_4.scalar.as_str(),
        override_modifier_list: field_4.items.as_slice(),
        override_modifier_leading_sep: field_4.leading_sep,
        override_modifier_trailing_sep: field_4.trailing_sep,
        parameters: field_5.scalar.as_str(),
        parameters_list: field_5.items.as_slice(),
        parameters_leading_sep: field_5.leading_sep,
        parameters_trailing_sep: field_5.trailing_sep,
        return_type: field_6.scalar.as_str(),
        return_type_list: field_6.items.as_slice(),
        return_type_leading_sep: field_6.leading_sep,
        return_type_trailing_sep: field_6.trailing_sep,
        type_parameters: field_7.scalar.as_str(),
        type_parameters_list: field_7.items.as_slice(),
        type_parameters_leading_sep: field_7.leading_sep,
        type_parameters_trailing_sep: field_7.trailing_sep,
    };
    template.render()
}

fn render_adding_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AddingTypeAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_ambient_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AmbientDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        declaration: field_0.scalar.as_str(),
        declaration_list: field_0.items.as_slice(),
        declaration_leading_sep: field_0.leading_sep,
        declaration_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArgumentsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_array_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_array_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        primary_type: field_0.scalar.as_str(),
        primary_type_list: field_0.items.as_slice(),
        primary_type_leading_sep: field_0.leading_sep,
        primary_type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_array(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters")?;
    let field_1 = resolve_field(node, "return_type")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrowFunctionUCallSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        parameters: field_0.scalar.as_str(),
        parameters_list: field_0.items.as_slice(),
        parameters_leading_sep: field_0.leading_sep,
        parameters_trailing_sep: field_0.trailing_sep,
        return_type: field_1.scalar.as_str(),
        return_type_list: field_1.items.as_slice(),
        return_type_leading_sep: field_1.leading_sep,
        return_type_trailing_sep: field_1.trailing_sep,
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrowFunctionParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        parameter: field_0.scalar.as_str(),
        parameter_list: field_0.items.as_slice(),
        parameter_leading_sep: field_0.leading_sep,
        parameter_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_arrow_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrowFunctionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        async_marker: field_0.scalar.as_str(),
        async_marker_list: field_0.items.as_slice(),
        async_marker_leading_sep: field_0.leading_sep,
        async_marker_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_as_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression")?;
    let field_1 = resolve_field(node, "type_annotation")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AsExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
        type_annotation: field_1.scalar.as_str(),
        type_annotation_list: field_1.items.as_slice(),
        type_annotation_leading_sep: field_1.leading_sep,
        type_annotation_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_asserts_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["asserts"])?;
    let field_0 = resolve_field(node, "asserts")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssertsAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        asserts: field_0.scalar.as_str(),
        asserts_list: field_0.items.as_slice(),
        asserts_leading_sep: field_0.leading_sep,
        asserts_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_asserts(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssertsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "using_marker"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let field_2 = resolve_field(node, "using_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssignmentExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        right: field_1.scalar.as_str(),
        right_list: field_1.items.as_slice(),
        right_leading_sep: field_1.leading_sep,
        right_trailing_sep: field_1.trailing_sep,
        using_marker: field_2.scalar.as_str(),
        using_marker_list: field_2.items.as_slice(),
        using_marker_leading_sep: field_2.leading_sep,
        using_marker_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssignmentPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        right: field_1.scalar.as_str(),
        right_list: field_1.items.as_slice(),
        right_leading_sep: field_1.leading_sep,
        right_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_augmented_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "operator")?;
    let field_2 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AugmentedAssignmentExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
        right: field_2.scalar.as_str(),
        right_list: field_2.items.as_slice(),
        right_leading_sep: field_2.leading_sep,
        right_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AwaitExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_binary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "operator")?;
    let field_2 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BinaryExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
        right: field_2.scalar.as_str(),
        right_list: field_2.items.as_slice(),
        right_leading_sep: field_2.leading_sep,
        right_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_break_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label")?;
    let field_1 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BreakStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        label: field_0.scalar.as_str(),
        label_list: field_0.items.as_slice(),
        label_leading_sep: field_0.leading_sep,
        label_trailing_sep: field_0.trailing_sep,
        semicolon: field_1.scalar.as_str(),
        semicolon_list: field_1.items.as_slice(),
        semicolon_leading_sep: field_1.leading_sep,
        semicolon_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters")?;
    let field_1 = resolve_field(node, "return_type")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        parameters: field_0.scalar.as_str(),
        parameters_list: field_0.items.as_slice(),
        parameters_leading_sep: field_0.leading_sep,
        parameters_trailing_sep: field_0.trailing_sep,
        return_type: field_1.scalar.as_str(),
        return_type_list: field_1.items.as_slice(),
        return_type_leading_sep: field_1.leading_sep,
        return_type_trailing_sep: field_1.trailing_sep,
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_catch_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameter", "type"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "parameter")?;
    let field_2 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CatchClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        parameter: field_1.scalar.as_str(),
        parameter_list: field_1.items.as_slice(),
        parameter_leading_sep: field_1.leading_sep,
        parameter_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_class_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassBodyTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "automatic_semicolon")?;
    let field_1 = resolve_field(node, "body")?;
    let field_2 = resolve_field(node, "class_heritage")?;
    let field_3 = resolve_field(node, "decorator")?;
    let field_4 = resolve_field(node, "name")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        automatic_semicolon: field_0.scalar.as_str(),
        automatic_semicolon_list: field_0.items.as_slice(),
        automatic_semicolon_leading_sep: field_0.leading_sep,
        automatic_semicolon_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        class_heritage: field_2.scalar.as_str(),
        class_heritage_list: field_2.items.as_slice(),
        class_heritage_leading_sep: field_2.leading_sep,
        class_heritage_trailing_sep: field_2.trailing_sep,
        decorator: field_3.scalar.as_str(),
        decorator_list: field_3.items.as_slice(),
        decorator_leading_sep: field_3.leading_sep,
        decorator_trailing_sep: field_3.trailing_sep,
        name: field_4.scalar.as_str(),
        name_list: field_4.items.as_slice(),
        name_leading_sep: field_4.leading_sep,
        name_trailing_sep: field_4.trailing_sep,
        type_parameters: field_5.scalar.as_str(),
        type_parameters_list: field_5.items.as_slice(),
        type_parameters_leading_sep: field_5.leading_sep,
        type_parameters_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassHeritageExtendsClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassHeritageImplementsClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_class_heritage(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassHeritageTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_class_static_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassStaticBlockTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_class(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "class_heritage")?;
    let field_2 = resolve_field(node, "decorator")?;
    let field_3 = resolve_field(node, "name")?;
    let field_4 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        class_heritage: field_1.scalar.as_str(),
        class_heritage_list: field_1.items.as_slice(),
        class_heritage_leading_sep: field_1.leading_sep,
        class_heritage_trailing_sep: field_1.trailing_sep,
        decorator: field_2.scalar.as_str(),
        decorator_list: field_2.items.as_slice(),
        decorator_leading_sep: field_2.leading_sep,
        decorator_trailing_sep: field_2.trailing_sep,
        name: field_3.scalar.as_str(),
        name_list: field_3.items.as_slice(),
        name_leading_sep: field_3.leading_sep,
        name_trailing_sep: field_3.trailing_sep,
        type_parameters: field_4.scalar.as_str(),
        type_parameters_list: field_4.items.as_slice(),
        type_parameters_leading_sep: field_4.leading_sep,
        type_parameters_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_computed_property_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ComputedPropertyNameTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_conditional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "consequence", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative")?;
    let field_1 = resolve_field(node, "consequence")?;
    let field_2 = resolve_field(node, "left")?;
    let field_3 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConditionalTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        alternative: field_0.scalar.as_str(),
        alternative_list: field_0.items.as_slice(),
        alternative_leading_sep: field_0.leading_sep,
        alternative_trailing_sep: field_0.trailing_sep,
        consequence: field_1.scalar.as_str(),
        consequence_list: field_1.items.as_slice(),
        consequence_leading_sep: field_1.leading_sep,
        consequence_trailing_sep: field_1.trailing_sep,
        left: field_2.scalar.as_str(),
        left_list: field_2.items.as_slice(),
        left_leading_sep: field_2.leading_sep,
        left_trailing_sep: field_2.trailing_sep,
        right: field_3.scalar.as_str(),
        right_list: field_3.items.as_slice(),
        right_leading_sep: field_3.leading_sep,
        right_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_constraint(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstraintTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_construct_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker")?;
    let field_1 = resolve_field(node, "parameters")?;
    let field_2 = resolve_field(node, "type")?;
    let field_3 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstructSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        abstract_marker: field_0.scalar.as_str(),
        abstract_marker_list: field_0.items.as_slice(),
        abstract_marker_leading_sep: field_0.leading_sep,
        abstract_marker_trailing_sep: field_0.trailing_sep,
        parameters: field_1.scalar.as_str(),
        parameters_list: field_1.items.as_slice(),
        parameters_leading_sep: field_1.leading_sep,
        parameters_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_constructor_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker")?;
    let field_1 = resolve_field(node, "parameters")?;
    let field_2 = resolve_field(node, "type")?;
    let field_3 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstructorTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        abstract_marker: field_0.scalar.as_str(),
        abstract_marker_list: field_0.items.as_slice(),
        abstract_marker_leading_sep: field_0.leading_sep,
        abstract_marker_trailing_sep: field_0.trailing_sep,
        parameters: field_1.scalar.as_str(),
        parameters_list: field_1.items.as_slice(),
        parameters_leading_sep: field_1.leading_sep,
        parameters_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_continue_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label")?;
    let field_1 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ContinueStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        label: field_0.scalar.as_str(),
        label_list: field_0.items.as_slice(),
        label_leading_sep: field_0.leading_sep,
        label_trailing_sep: field_0.trailing_sep,
        semicolon: field_1.scalar.as_str(),
        semicolon_list: field_1.items.as_slice(),
        semicolon_leading_sep: field_1.leading_sep,
        semicolon_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_debugger_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DebuggerStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        semicolon: field_0.scalar.as_str(),
        semicolon_list: field_0.items.as_slice(),
        semicolon_leading_sep: field_0.leading_sep,
        semicolon_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_decorator_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DecoratorCallExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        function: field_1.scalar.as_str(),
        function_list: field_1.items.as_slice(),
        function_leading_sep: field_1.leading_sep,
        function_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_decorator_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object")?;
    let field_1 = resolve_field(node, "property")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DecoratorMemberExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        object: field_0.scalar.as_str(),
        object_list: field_0.items.as_slice(),
        object_leading_sep: field_0.leading_sep,
        object_trailing_sep: field_0.trailing_sep,
        property: field_1.scalar.as_str(),
        property_list: field_1.items.as_slice(),
        property_leading_sep: field_1.leading_sep,
        property_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_decorator_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DecoratorParenthesizedExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DecoratorTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_default_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DefaultTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_do_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "semicolon"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "condition")?;
    let field_2 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DoStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        condition: field_1.scalar.as_str(),
        condition_list: field_1.items.as_slice(),
        condition_leading_sep: field_1.leading_sep,
        condition_trailing_sep: field_1.trailing_sep,
        semicolon: field_2.scalar.as_str(),
        semicolon_list: field_2.items.as_slice(),
        semicolon_leading_sep: field_2.leading_sep,
        semicolon_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["statement"])?;
    let field_0 = resolve_field(node, "statement")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ElseClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        statement: field_0.scalar.as_str(),
        statement_list: field_0.items.as_slice(),
        statement_leading_sep: field_0.leading_sep,
        statement_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_enum_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = EnumAssignmentTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_enum_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = EnumBodyTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_enum_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "const_marker", "name"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "const_marker")?;
    let field_2 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = EnumDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        const_marker: field_1.scalar.as_str(),
        const_marker_list: field_1.items.as_slice(),
        const_marker_leading_sep: field_1.leading_sep,
        const_marker_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_export_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_export_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "export_kind", "name"])?;
    let field_0 = resolve_field(node, "alias")?;
    let field_1 = resolve_field(node, "export_kind")?;
    let field_2 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportSpecifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        alias: field_0.scalar.as_str(),
        alias_list: field_0.items.as_slice(),
        alias_leading_sep: field_0.leading_sep,
        alias_trailing_sep: field_0.trailing_sep,
        export_kind: field_1.scalar.as_str(),
        export_kind_list: field_1.items.as_slice(),
        export_kind_leading_sep: field_1.leading_sep,
        export_kind_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementEqualsExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementNamespaceExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementTypeExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        source: field_0.scalar.as_str(),
        source_list: field_0.items.as_slice(),
        source_leading_sep: field_0.leading_sep,
        source_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_export_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExportStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExpressionStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        semicolon: field_0.scalar.as_str(),
        semicolon_list: field_0.items.as_slice(),
        semicolon_leading_sep: field_0.leading_sep,
        semicolon_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments", "value"])?;
    let field_0 = resolve_field(node, "type_arguments")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExtendsClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        type_arguments: field_0.scalar.as_str(),
        type_arguments_list: field_0.items.as_slice(),
        type_arguments_leading_sep: field_0.leading_sep,
        type_arguments_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_extends_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExtendsTypeClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "property", "static_marker", "value"])?;
    let field_0 = resolve_field(node, "decorator")?;
    let field_1 = resolve_field(node, "property")?;
    let field_2 = resolve_field(node, "static_marker")?;
    let field_3 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldDefinitionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        decorator: field_0.scalar.as_str(),
        decorator_list: field_0.items.as_slice(),
        decorator_leading_sep: field_0.leading_sep,
        decorator_trailing_sep: field_0.trailing_sep,
        property: field_1.scalar.as_str(),
        property_list: field_1.items.as_slice(),
        property_leading_sep: field_1.leading_sep,
        property_trailing_sep: field_1.trailing_sep,
        static_marker: field_2.scalar.as_str(),
        static_marker_list: field_2.items.as_slice(),
        static_marker_leading_sep: field_2.leading_sep,
        static_marker_trailing_sep: field_2.trailing_sep,
        value: field_3.scalar.as_str(),
        value_list: field_3.items.as_slice(),
        value_leading_sep: field_3.leading_sep,
        value_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FinallyClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_flow_maybe_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FlowMaybeTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        primary_type: field_0.scalar.as_str(),
        primary_type_list: field_0.items.as_slice(),
        primary_type_leading_sep: field_0.leading_sep,
        primary_type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_for_in_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["await_marker", "body", "operator", "right"])?;
    let field_0 = resolve_field(node, "await_marker")?;
    let field_1 = resolve_field(node, "body")?;
    let field_2 = resolve_field(node, "operator")?;
    let field_3 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForInStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        await_marker: field_0.scalar.as_str(),
        await_marker_list: field_0.items.as_slice(),
        await_marker_leading_sep: field_0.leading_sep,
        await_marker_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        operator: field_2.scalar.as_str(),
        operator_list: field_2.items.as_slice(),
        operator_leading_sep: field_2.leading_sep,
        operator_trailing_sep: field_2.trailing_sep,
        right: field_3.scalar.as_str(),
        right_list: field_3.items.as_slice(),
        right_leading_sep: field_3.leading_sep,
        right_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "increment", "initializer"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "condition")?;
    let field_2 = resolve_field(node, "increment")?;
    let field_3 = resolve_field(node, "initializer")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        condition: field_1.scalar.as_str(),
        condition_list: field_1.items.as_slice(),
        condition_leading_sep: field_1.leading_sep,
        condition_trailing_sep: field_1.trailing_sep,
        increment: field_2.scalar.as_str(),
        increment_list: field_2.items.as_slice(),
        increment_leading_sep: field_2.leading_sep,
        increment_trailing_sep: field_2.trailing_sep,
        initializer: field_3.scalar.as_str(),
        initializer_list: field_3.items.as_slice(),
        initializer_leading_sep: field_3.leading_sep,
        initializer_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_formal_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FormalParametersTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "body")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "parameters")?;
    let field_4 = resolve_field(node, "return_type")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        async_marker: field_0.scalar.as_str(),
        async_marker_list: field_0.items.as_slice(),
        async_marker_leading_sep: field_0.leading_sep,
        async_marker_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        parameters: field_3.scalar.as_str(),
        parameters_list: field_3.items.as_slice(),
        parameters_leading_sep: field_3.leading_sep,
        parameters_trailing_sep: field_3.trailing_sep,
        return_type: field_4.scalar.as_str(),
        return_type_list: field_4.items.as_slice(),
        return_type_leading_sep: field_4.leading_sep,
        return_type_trailing_sep: field_4.trailing_sep,
        type_parameters: field_5.scalar.as_str(),
        type_parameters_list: field_5.items.as_slice(),
        type_parameters_leading_sep: field_5.leading_sep,
        type_parameters_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_function_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "body")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "parameters")?;
    let field_4 = resolve_field(node, "return_type")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        async_marker: field_0.scalar.as_str(),
        async_marker_list: field_0.items.as_slice(),
        async_marker_leading_sep: field_0.leading_sep,
        async_marker_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        parameters: field_3.scalar.as_str(),
        parameters_list: field_3.items.as_slice(),
        parameters_leading_sep: field_3.leading_sep,
        parameters_trailing_sep: field_3.trailing_sep,
        return_type: field_4.scalar.as_str(),
        return_type_list: field_4.items.as_slice(),
        return_type_leading_sep: field_4.leading_sep,
        return_type_trailing_sep: field_4.trailing_sep,
        type_parameters: field_5.scalar.as_str(),
        type_parameters_list: field_5.items.as_slice(),
        type_parameters_leading_sep: field_5.leading_sep,
        type_parameters_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_function_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "name", "parameters", "return_type", "semicolon", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "parameters")?;
    let field_3 = resolve_field(node, "return_type")?;
    let field_4 = resolve_field(node, "semicolon")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        async_marker: field_0.scalar.as_str(),
        async_marker_list: field_0.items.as_slice(),
        async_marker_leading_sep: field_0.leading_sep,
        async_marker_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        parameters: field_2.scalar.as_str(),
        parameters_list: field_2.items.as_slice(),
        parameters_leading_sep: field_2.leading_sep,
        parameters_trailing_sep: field_2.trailing_sep,
        return_type: field_3.scalar.as_str(),
        return_type_list: field_3.items.as_slice(),
        return_type_leading_sep: field_3.leading_sep,
        return_type_trailing_sep: field_3.trailing_sep,
        semicolon: field_4.scalar.as_str(),
        semicolon_list: field_4.items.as_slice(),
        semicolon_leading_sep: field_4.leading_sep,
        semicolon_trailing_sep: field_4.trailing_sep,
        type_parameters: field_5.scalar.as_str(),
        type_parameters_list: field_5.items.as_slice(),
        type_parameters_leading_sep: field_5.leading_sep,
        type_parameters_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters")?;
    let field_1 = resolve_field(node, "return_type")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        parameters: field_0.scalar.as_str(),
        parameters_list: field_0.items.as_slice(),
        parameters_leading_sep: field_0.leading_sep,
        parameters_trailing_sep: field_0.trailing_sep,
        return_type: field_1.scalar.as_str(),
        return_type_list: field_1.items.as_slice(),
        return_type_leading_sep: field_1.leading_sep,
        return_type_trailing_sep: field_1.trailing_sep,
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_generator_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "body")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "parameters")?;
    let field_4 = resolve_field(node, "return_type")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GeneratorFunctionDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        async_marker: field_0.scalar.as_str(),
        async_marker_list: field_0.items.as_slice(),
        async_marker_leading_sep: field_0.leading_sep,
        async_marker_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        parameters: field_3.scalar.as_str(),
        parameters_list: field_3.items.as_slice(),
        parameters_leading_sep: field_3.leading_sep,
        parameters_trailing_sep: field_3.trailing_sep,
        return_type: field_4.scalar.as_str(),
        return_type_list: field_4.items.as_slice(),
        return_type_leading_sep: field_4.leading_sep,
        return_type_trailing_sep: field_4.trailing_sep,
        type_parameters: field_5.scalar.as_str(),
        type_parameters_list: field_5.items.as_slice(),
        type_parameters_leading_sep: field_5.leading_sep,
        type_parameters_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_generator_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "body")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "parameters")?;
    let field_4 = resolve_field(node, "return_type")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GeneratorFunctionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        async_marker: field_0.scalar.as_str(),
        async_marker_list: field_0.items.as_slice(),
        async_marker_leading_sep: field_0.leading_sep,
        async_marker_trailing_sep: field_0.trailing_sep,
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        parameters: field_3.scalar.as_str(),
        parameters_list: field_3.items.as_slice(),
        parameters_leading_sep: field_3.leading_sep,
        parameters_trailing_sep: field_3.trailing_sep,
        return_type: field_4.scalar.as_str(),
        return_type_list: field_4.items.as_slice(),
        return_type_leading_sep: field_4.leading_sep,
        return_type_trailing_sep: field_4.trailing_sep,
        type_parameters: field_5.scalar.as_str(),
        type_parameters_list: field_5.items.as_slice(),
        type_parameters_leading_sep: field_5.leading_sep,
        type_parameters_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_arguments"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GenericTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        type_arguments: field_1.scalar.as_str(),
        type_arguments_list: field_1.items.as_slice(),
        type_arguments_leading_sep: field_1.leading_sep,
        type_arguments_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative")?;
    let field_1 = resolve_field(node, "condition")?;
    let field_2 = resolve_field(node, "consequence")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IfStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        alternative: field_0.scalar.as_str(),
        alternative_list: field_0.items.as_slice(),
        alternative_leading_sep: field_0.leading_sep,
        alternative_trailing_sep: field_0.trailing_sep,
        condition: field_1.scalar.as_str(),
        condition_list: field_1.items.as_slice(),
        condition_leading_sep: field_1.leading_sep,
        condition_trailing_sep: field_1.trailing_sep,
        consequence: field_2.scalar.as_str(),
        consequence_list: field_2.items.as_slice(),
        consequence_leading_sep: field_2.leading_sep,
        consequence_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImplementsClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_import_alias(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "value"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "semicolon")?;
    let field_2 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportAliasTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        semicolon: field_1.scalar.as_str(),
        semicolon_list: field_1.items.as_slice(),
        semicolon_leading_sep: field_1.leading_sep,
        semicolon_trailing_sep: field_1.trailing_sep,
        value: field_2.scalar.as_str(),
        value_list: field_2.items.as_slice(),
        value_leading_sep: field_2.leading_sep,
        value_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_import_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object"])?;
    let field_0 = resolve_field(node, "object")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportAttributeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        object: field_0.scalar.as_str(),
        object_list: field_0.items.as_slice(),
        object_leading_sep: field_0.leading_sep,
        object_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportClauseDefaultImportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportClauseNamedImportsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportClauseNamespaceImportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_import_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_import_require_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "source"])?;
    let field_0 = resolve_field(node, "identifier")?;
    let field_1 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportRequireClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        identifier: field_0.scalar.as_str(),
        identifier_list: field_0.items.as_slice(),
        identifier_leading_sep: field_0.leading_sep,
        identifier_trailing_sep: field_0.trailing_sep,
        source: field_1.scalar.as_str(),
        source_list: field_1.items.as_slice(),
        source_leading_sep: field_1.leading_sep,
        source_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportSpecifierNameTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_import_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_kind"])?;
    let field_0 = resolve_field(node, "import_kind")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportSpecifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        import_kind: field_0.scalar.as_str(),
        import_kind_list: field_0.items.as_slice(),
        import_kind_leading_sep: field_0.leading_sep,
        import_kind_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_attribute", "import_clause", "semicolon", "source"])?;
    let field_0 = resolve_field(node, "import_attribute")?;
    let field_1 = resolve_field(node, "import_clause")?;
    let field_2 = resolve_field(node, "semicolon")?;
    let field_3 = resolve_field(node, "source")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        import_attribute: field_0.scalar.as_str(),
        import_attribute_list: field_0.items.as_slice(),
        import_attribute_leading_sep: field_0.leading_sep,
        import_attribute_trailing_sep: field_0.trailing_sep,
        import_clause: field_1.scalar.as_str(),
        import_clause_list: field_1.items.as_slice(),
        import_clause_leading_sep: field_1.leading_sep,
        import_clause_trailing_sep: field_1.trailing_sep,
        semicolon: field_2.scalar.as_str(),
        semicolon_list: field_2.items.as_slice(),
        semicolon_leading_sep: field_2.leading_sep,
        semicolon_trailing_sep: field_2.trailing_sep,
        source: field_3.scalar.as_str(),
        source_list: field_3.items.as_slice(),
        source_leading_sep: field_3.leading_sep,
        source_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IndexSignatureMappedTypeClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_index_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["sign", "type"])?;
    let field_0 = resolve_field(node, "sign")?;
    let field_1 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IndexSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        sign: field_0.scalar.as_str(),
        sign_list: field_0.items.as_slice(),
        sign_leading_sep: field_0.leading_sep,
        sign_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_index_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IndexTypeQueryTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        primary_type: field_0.scalar.as_str(),
        primary_type_list: field_0.items.as_slice(),
        primary_type_leading_sep: field_0.leading_sep,
        primary_type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_infer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_identifier"])?;
    let field_0 = resolve_field(node, "type")?;
    let field_1 = resolve_field(node, "type_identifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InferTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
        type_identifier: field_1.scalar.as_str(),
        type_identifier_list: field_1.items.as_slice(),
        type_identifier_leading_sep: field_1.leading_sep,
        type_identifier_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression")?;
    let field_1 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InstantiationExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
        type_arguments: field_1.scalar.as_str(),
        type_arguments_list: field_1.items.as_slice(),
        type_arguments_leading_sep: field_1.leading_sep,
        type_arguments_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_interface_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "extends_type_clause", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "extends_type_clause")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InterfaceDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        extends_type_clause: field_1.scalar.as_str(),
        extends_type_clause_list: field_1.items.as_slice(),
        extends_type_clause_leading_sep: field_1.leading_sep,
        extends_type_clause_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_internal_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InternalModuleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_intersection_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IntersectionTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        right: field_1.scalar.as_str(),
        right_list: field_1.items.as_slice(),
        right_leading_sep: field_1.leading_sep,
        right_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_jsx_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxAttributeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_jsx_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxClosingElementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_jsx_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["close_tag", "open_tag"])?;
    let field_0 = resolve_field(node, "close_tag")?;
    let field_1 = resolve_field(node, "open_tag")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxElementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        close_tag: field_0.scalar.as_str(),
        close_tag_list: field_0.items.as_slice(),
        close_tag_leading_sep: field_0.leading_sep,
        close_tag_trailing_sep: field_0.trailing_sep,
        open_tag: field_1.scalar.as_str(),
        open_tag_list: field_1.items.as_slice(),
        open_tag_leading_sep: field_1.leading_sep,
        open_tag_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_jsx_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_jsx_namespace_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxNamespaceNameTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_jsx_opening_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxOpeningElementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        attribute: field_0.scalar.as_str(),
        attribute_list: field_0.items.as_slice(),
        attribute_leading_sep: field_0.leading_sep,
        attribute_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_jsx_self_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = JsxSelfClosingElementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        attribute: field_0.scalar.as_str(),
        attribute_list: field_0.items.as_slice(),
        attribute_leading_sep: field_0.leading_sep,
        attribute_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_labeled_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "label")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LabeledStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        label: field_1.scalar.as_str(),
        label_list: field_1.items.as_slice(),
        label_leading_sep: field_1.leading_sep,
        label_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_lexical_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "kind", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators")?;
    let field_1 = resolve_field(node, "kind")?;
    let field_2 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LexicalDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        declarators: field_0.scalar.as_str(),
        declarators_list: field_0.items.as_slice(),
        declarators_leading_sep: field_0.leading_sep,
        declarators_trailing_sep: field_0.trailing_sep,
        kind: field_1.scalar.as_str(),
        kind_list: field_1.items.as_slice(),
        kind_leading_sep: field_1.leading_sep,
        kind_trailing_sep: field_1.trailing_sep,
        semicolon: field_2.scalar.as_str(),
        semicolon_list: field_2.items.as_slice(),
        semicolon_leading_sep: field_2.leading_sep,
        semicolon_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LiteralTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_lookup_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "primary_type"])?;
    let field_0 = resolve_field(node, "index_type")?;
    let field_1 = resolve_field(node, "primary_type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LookupTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        index_type: field_0.scalar.as_str(),
        index_type_list: field_0.items.as_slice(),
        index_type_leading_sep: field_0.leading_sep,
        index_type_trailing_sep: field_0.trailing_sep,
        primary_type: field_1.scalar.as_str(),
        primary_type_list: field_1.items.as_slice(),
        primary_type_leading_sep: field_1.leading_sep,
        primary_type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name", "type"])?;
    let field_0 = resolve_field(node, "alias")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MappedTypeClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        alias: field_0.scalar.as_str(),
        alias_list: field_0.items.as_slice(),
        alias_leading_sep: field_0.leading_sep,
        alias_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "optional_chain", "property"])?;
    let field_0 = resolve_field(node, "object")?;
    let field_1 = resolve_field(node, "optional_chain")?;
    let field_2 = resolve_field(node, "property")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MemberExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        object: field_0.scalar.as_str(),
        object_list: field_0.items.as_slice(),
        object_leading_sep: field_0.leading_sep,
        object_trailing_sep: field_0.trailing_sep,
        optional_chain: field_1.scalar.as_str(),
        optional_chain_list: field_1.items.as_slice(),
        optional_chain_leading_sep: field_1.leading_sep,
        optional_chain_trailing_sep: field_1.trailing_sep,
        property: field_2.scalar.as_str(),
        property_list: field_2.items.as_slice(),
        property_leading_sep: field_2.leading_sep,
        property_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_method_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "body", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier")?;
    let field_1 = resolve_field(node, "accessor_kind")?;
    let field_2 = resolve_field(node, "async_marker")?;
    let field_3 = resolve_field(node, "body")?;
    let field_4 = resolve_field(node, "name")?;
    let field_5 = resolve_field(node, "optional_marker")?;
    let field_6 = resolve_field(node, "override_modifier")?;
    let field_7 = resolve_field(node, "parameters")?;
    let field_8 = resolve_field(node, "readonly_marker")?;
    let field_9 = resolve_field(node, "return_type")?;
    let field_10 = resolve_field(node, "static_marker")?;
    let field_11 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MethodDefinitionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        accessibility_modifier: field_0.scalar.as_str(),
        accessibility_modifier_list: field_0.items.as_slice(),
        accessibility_modifier_leading_sep: field_0.leading_sep,
        accessibility_modifier_trailing_sep: field_0.trailing_sep,
        accessor_kind: field_1.scalar.as_str(),
        accessor_kind_list: field_1.items.as_slice(),
        accessor_kind_leading_sep: field_1.leading_sep,
        accessor_kind_trailing_sep: field_1.trailing_sep,
        async_marker: field_2.scalar.as_str(),
        async_marker_list: field_2.items.as_slice(),
        async_marker_leading_sep: field_2.leading_sep,
        async_marker_trailing_sep: field_2.trailing_sep,
        body: field_3.scalar.as_str(),
        body_list: field_3.items.as_slice(),
        body_leading_sep: field_3.leading_sep,
        body_trailing_sep: field_3.trailing_sep,
        name: field_4.scalar.as_str(),
        name_list: field_4.items.as_slice(),
        name_leading_sep: field_4.leading_sep,
        name_trailing_sep: field_4.trailing_sep,
        optional_marker: field_5.scalar.as_str(),
        optional_marker_list: field_5.items.as_slice(),
        optional_marker_leading_sep: field_5.leading_sep,
        optional_marker_trailing_sep: field_5.trailing_sep,
        override_modifier: field_6.scalar.as_str(),
        override_modifier_list: field_6.items.as_slice(),
        override_modifier_leading_sep: field_6.leading_sep,
        override_modifier_trailing_sep: field_6.trailing_sep,
        parameters: field_7.scalar.as_str(),
        parameters_list: field_7.items.as_slice(),
        parameters_leading_sep: field_7.leading_sep,
        parameters_trailing_sep: field_7.trailing_sep,
        readonly_marker: field_8.scalar.as_str(),
        readonly_marker_list: field_8.items.as_slice(),
        readonly_marker_leading_sep: field_8.leading_sep,
        readonly_marker_trailing_sep: field_8.trailing_sep,
        return_type: field_9.scalar.as_str(),
        return_type_list: field_9.items.as_slice(),
        return_type_leading_sep: field_9.leading_sep,
        return_type_trailing_sep: field_9.trailing_sep,
        static_marker: field_10.scalar.as_str(),
        static_marker_list: field_10.items.as_slice(),
        static_marker_leading_sep: field_10.leading_sep,
        static_marker_trailing_sep: field_10.trailing_sep,
        type_parameters: field_11.scalar.as_str(),
        type_parameters_list: field_11.items.as_slice(),
        type_parameters_leading_sep: field_11.leading_sep,
        type_parameters_trailing_sep: field_11.trailing_sep,
    };
    template.render()
}

fn render_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier")?;
    let field_1 = resolve_field(node, "accessor_kind")?;
    let field_2 = resolve_field(node, "async_marker")?;
    let field_3 = resolve_field(node, "name")?;
    let field_4 = resolve_field(node, "optional_marker")?;
    let field_5 = resolve_field(node, "override_modifier")?;
    let field_6 = resolve_field(node, "parameters")?;
    let field_7 = resolve_field(node, "readonly_marker")?;
    let field_8 = resolve_field(node, "return_type")?;
    let field_9 = resolve_field(node, "static_marker")?;
    let field_10 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MethodSignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        accessibility_modifier: field_0.scalar.as_str(),
        accessibility_modifier_list: field_0.items.as_slice(),
        accessibility_modifier_leading_sep: field_0.leading_sep,
        accessibility_modifier_trailing_sep: field_0.trailing_sep,
        accessor_kind: field_1.scalar.as_str(),
        accessor_kind_list: field_1.items.as_slice(),
        accessor_kind_leading_sep: field_1.leading_sep,
        accessor_kind_trailing_sep: field_1.trailing_sep,
        async_marker: field_2.scalar.as_str(),
        async_marker_list: field_2.items.as_slice(),
        async_marker_leading_sep: field_2.leading_sep,
        async_marker_trailing_sep: field_2.trailing_sep,
        name: field_3.scalar.as_str(),
        name_list: field_3.items.as_slice(),
        name_leading_sep: field_3.leading_sep,
        name_trailing_sep: field_3.trailing_sep,
        optional_marker: field_4.scalar.as_str(),
        optional_marker_list: field_4.items.as_slice(),
        optional_marker_leading_sep: field_4.leading_sep,
        optional_marker_trailing_sep: field_4.trailing_sep,
        override_modifier: field_5.scalar.as_str(),
        override_modifier_list: field_5.items.as_slice(),
        override_modifier_leading_sep: field_5.leading_sep,
        override_modifier_trailing_sep: field_5.trailing_sep,
        parameters: field_6.scalar.as_str(),
        parameters_list: field_6.items.as_slice(),
        parameters_leading_sep: field_6.leading_sep,
        parameters_trailing_sep: field_6.trailing_sep,
        readonly_marker: field_7.scalar.as_str(),
        readonly_marker_list: field_7.items.as_slice(),
        readonly_marker_leading_sep: field_7.leading_sep,
        readonly_marker_trailing_sep: field_7.trailing_sep,
        return_type: field_8.scalar.as_str(),
        return_type_list: field_8.items.as_slice(),
        return_type_leading_sep: field_8.leading_sep,
        return_type_trailing_sep: field_8.trailing_sep,
        static_marker: field_9.scalar.as_str(),
        static_marker_list: field_9.items.as_slice(),
        static_marker_leading_sep: field_9.leading_sep,
        static_marker_trailing_sep: field_9.trailing_sep,
        type_parameters: field_10.scalar.as_str(),
        type_parameters_list: field_10.items.as_slice(),
        type_parameters_leading_sep: field_10.leading_sep,
        type_parameters_trailing_sep: field_10.trailing_sep,
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ModuleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NamedImportsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NamespaceExportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NamespaceImportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        identifier: field_0.scalar.as_str(),
        identifier_list: field_0.items.as_slice(),
        identifier_leading_sep: field_0.leading_sep,
        identifier_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_nested_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object")?;
    let field_1 = resolve_field(node, "property")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NestedIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        object: field_0.scalar.as_str(),
        object_list: field_0.items.as_slice(),
        object_leading_sep: field_0.leading_sep,
        object_trailing_sep: field_0.trailing_sep,
        property: field_1.scalar.as_str(),
        property_list: field_1.items.as_slice(),
        property_leading_sep: field_1.leading_sep,
        property_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_nested_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module", "name"])?;
    let field_0 = resolve_field(node, "module")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NestedTypeIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        module: field_0.scalar.as_str(),
        module_list: field_0.items.as_slice(),
        module_leading_sep: field_0.leading_sep,
        module_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_new_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "constructor", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "constructor")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NewExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        arguments: field_0.scalar.as_str(),
        arguments_list: field_0.items.as_slice(),
        arguments_leading_sep: field_0.leading_sep,
        arguments_trailing_sep: field_0.trailing_sep,
        constructor: field_1.scalar.as_str(),
        constructor_list: field_1.items.as_slice(),
        constructor_leading_sep: field_1.leading_sep,
        constructor_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_non_null_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NonNullExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_object_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ObjectAssignmentPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        right: field_1.scalar.as_str(),
        right_list: field_1.items.as_slice(),
        right_leading_sep: field_1.leading_sep,
        right_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_object_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ObjectPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_object_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["closing", "members", "opening"])?;
    let field_0 = resolve_field(node, "closing")?;
    let field_1 = resolve_field(node, "members")?;
    let field_2 = resolve_field(node, "opening")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ObjectTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        closing: field_0.scalar.as_str(),
        closing_list: field_0.items.as_slice(),
        closing_leading_sep: field_0.leading_sep,
        closing_trailing_sep: field_0.trailing_sep,
        members: field_1.scalar.as_str(),
        members_list: field_1.items.as_slice(),
        members_leading_sep: field_1.leading_sep,
        members_trailing_sep: field_1.trailing_sep,
        opening: field_2.scalar.as_str(),
        opening_list: field_2.items.as_slice(),
        opening_leading_sep: field_2.leading_sep,
        opening_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_object(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ObjectTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_omitting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OmittingTypeAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_opting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OptingTypeAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_optional_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator")?;
    let field_1 = resolve_field(node, "pattern")?;
    let field_2 = resolve_field(node, "readonly_marker")?;
    let field_3 = resolve_field(node, "type")?;
    let field_4 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OptionalParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        decorator: field_0.scalar.as_str(),
        decorator_list: field_0.items.as_slice(),
        decorator_leading_sep: field_0.leading_sep,
        decorator_trailing_sep: field_0.trailing_sep,
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
        readonly_marker: field_2.scalar.as_str(),
        readonly_marker_list: field_2.items.as_slice(),
        readonly_marker_leading_sep: field_2.leading_sep,
        readonly_marker_trailing_sep: field_2.trailing_sep,
        r#type: field_3.scalar.as_str(),
        r#type_list: field_3.items.as_slice(),
        r#type_leading_sep: field_3.leading_sep,
        r#type_trailing_sep: field_3.trailing_sep,
        value: field_4.scalar.as_str(),
        value_list: field_4.items.as_slice(),
        value_leading_sep: field_4.leading_sep,
        value_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_optional_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OptionalTupleParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_optional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OptionalTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_pair_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PairPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        key: field_0.scalar.as_str(),
        key_list: field_0.items.as_slice(),
        key_leading_sep: field_0.leading_sep,
        key_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_pair(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PairTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        key: field_0.scalar.as_str(),
        key_list: field_0.items.as_slice(),
        key_leading_sep: field_0.leading_sep,
        key_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParenthesizedExpressionSequenceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParenthesizedExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_parenthesized_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParenthesizedTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_program(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["hash_bang_line", "statements"])?;
    let field_0 = resolve_field(node, "hash_bang_line")?;
    let field_1 = resolve_field(node, "statements")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ProgramTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        hash_bang_line: field_0.scalar.as_str(),
        hash_bang_line_list: field_0.items.as_slice(),
        hash_bang_line_leading_sep: field_0.leading_sep,
        hash_bang_line_trailing_sep: field_0.trailing_sep,
        statements: field_1.scalar.as_str(),
        statements_list: field_1.items.as_slice(),
        statements_leading_sep: field_1.leading_sep,
        statements_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_property_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "name", "optional_marker", "override_modifier", "readonly_marker", "static_marker", "type"])?;
    let field_0 = resolve_field(node, "accessibility_modifier")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "optional_marker")?;
    let field_3 = resolve_field(node, "override_modifier")?;
    let field_4 = resolve_field(node, "readonly_marker")?;
    let field_5 = resolve_field(node, "static_marker")?;
    let field_6 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PropertySignatureTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        accessibility_modifier: field_0.scalar.as_str(),
        accessibility_modifier_list: field_0.items.as_slice(),
        accessibility_modifier_leading_sep: field_0.leading_sep,
        accessibility_modifier_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        optional_marker: field_2.scalar.as_str(),
        optional_marker_list: field_2.items.as_slice(),
        optional_marker_leading_sep: field_2.leading_sep,
        optional_marker_trailing_sep: field_2.trailing_sep,
        override_modifier: field_3.scalar.as_str(),
        override_modifier_list: field_3.items.as_slice(),
        override_modifier_leading_sep: field_3.leading_sep,
        override_modifier_trailing_sep: field_3.trailing_sep,
        readonly_marker: field_4.scalar.as_str(),
        readonly_marker_list: field_4.items.as_slice(),
        readonly_marker_leading_sep: field_4.leading_sep,
        readonly_marker_trailing_sep: field_4.trailing_sep,
        static_marker: field_5.scalar.as_str(),
        static_marker_list: field_5.items.as_slice(),
        static_marker_leading_sep: field_5.leading_sep,
        static_marker_trailing_sep: field_5.trailing_sep,
        r#type: field_6.scalar.as_str(),
        r#type_list: field_6.items.as_slice(),
        r#type_leading_sep: field_6.leading_sep,
        r#type_trailing_sep: field_6.trailing_sep,
    };
    template.render()
}

fn render_public_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "name", "optionality_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "optionality_marker")?;
    let field_3 = resolve_field(node, "type")?;
    let field_4 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PublicFieldDefinitionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        decorator: field_0.scalar.as_str(),
        decorator_list: field_0.items.as_slice(),
        decorator_leading_sep: field_0.leading_sep,
        decorator_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        optionality_marker: field_2.scalar.as_str(),
        optionality_marker_list: field_2.items.as_slice(),
        optionality_marker_leading_sep: field_2.leading_sep,
        optionality_marker_trailing_sep: field_2.trailing_sep,
        r#type: field_3.scalar.as_str(),
        r#type_list: field_3.items.as_slice(),
        r#type_leading_sep: field_3.leading_sep,
        r#type_trailing_sep: field_3.trailing_sep,
        value: field_4.scalar.as_str(),
        value_list: field_4.items.as_slice(),
        value_leading_sep: field_4.leading_sep,
        value_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_readonly_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReadonlyTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_regex(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["flags", "pattern"])?;
    let field_0 = resolve_field(node, "flags")?;
    let field_1 = resolve_field(node, "pattern")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RegexTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        flags: field_0.scalar.as_str(),
        flags_list: field_0.items.as_slice(),
        flags_leading_sep: field_0.leading_sep,
        flags_trailing_sep: field_0.trailing_sep,
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_required_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator")?;
    let field_1 = resolve_field(node, "pattern")?;
    let field_2 = resolve_field(node, "readonly_marker")?;
    let field_3 = resolve_field(node, "type")?;
    let field_4 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RequiredParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        decorator: field_0.scalar.as_str(),
        decorator_list: field_0.items.as_slice(),
        decorator_leading_sep: field_0.leading_sep,
        decorator_trailing_sep: field_0.trailing_sep,
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
        readonly_marker: field_2.scalar.as_str(),
        readonly_marker_list: field_2.items.as_slice(),
        readonly_marker_leading_sep: field_2.leading_sep,
        readonly_marker_trailing_sep: field_2.trailing_sep,
        r#type: field_3.scalar.as_str(),
        r#type_list: field_3.items.as_slice(),
        r#type_leading_sep: field_3.leading_sep,
        r#type_trailing_sep: field_3.trailing_sep,
        value: field_4.scalar.as_str(),
        value_list: field_4.items.as_slice(),
        value_leading_sep: field_4.leading_sep,
        value_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_rest_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RestPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_rest_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RestTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReturnStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        semicolon: field_0.scalar.as_str(),
        semicolon_list: field_0.items.as_slice(),
        semicolon_leading_sep: field_0.leading_sep,
        semicolon_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_satisfies_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression")?;
    let field_1 = resolve_field(node, "type_annotation")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SatisfiesExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
        type_annotation: field_1.scalar.as_str(),
        type_annotation_list: field_1.items.as_slice(),
        type_annotation_leading_sep: field_1.leading_sep,
        type_annotation_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_sequence_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SequenceExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_spread_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SpreadElementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_statement_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "statements"])?;
    let field_0 = resolve_field(node, "automatic_semicolon")?;
    let field_1 = resolve_field(node, "statements")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StatementBlockTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        automatic_semicolon: field_0.scalar.as_str(),
        automatic_semicolon_list: field_0.items.as_slice(),
        automatic_semicolon_leading_sep: field_0.leading_sep,
        automatic_semicolon_trailing_sep: field_0.trailing_sep,
        statements: field_1.scalar.as_str(),
        statements_list: field_1.items.as_slice(),
        statements_leading_sep: field_1.leading_sep,
        statements_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StringDoubleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StringSingleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StringTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object", "optional_chain"])?;
    let field_0 = resolve_field(node, "index")?;
    let field_1 = resolve_field(node, "object")?;
    let field_2 = resolve_field(node, "optional_chain")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SubscriptExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        index: field_0.scalar.as_str(),
        index_list: field_0.items.as_slice(),
        index_leading_sep: field_0.leading_sep,
        index_trailing_sep: field_0.trailing_sep,
        object: field_1.scalar.as_str(),
        object_list: field_1.items.as_slice(),
        object_leading_sep: field_1.leading_sep,
        object_trailing_sep: field_1.trailing_sep,
        optional_chain: field_2.scalar.as_str(),
        optional_chain_list: field_2.items.as_slice(),
        optional_chain_leading_sep: field_2.leading_sep,
        optional_chain_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_switch_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SwitchBodyTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_switch_case(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SwitchCaseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_switch_default(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SwitchDefaultTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_switch_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SwitchStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_template_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TemplateLiteralTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_template_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TemplateStringTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_template_substitution(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TemplateSubstitutionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_template_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TemplateTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_ternary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative")?;
    let field_1 = resolve_field(node, "condition")?;
    let field_2 = resolve_field(node, "consequence")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TernaryExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        alternative: field_0.scalar.as_str(),
        alternative_list: field_0.items.as_slice(),
        alternative_leading_sep: field_0.leading_sep,
        alternative_trailing_sep: field_0.trailing_sep,
        condition: field_1.scalar.as_str(),
        condition_list: field_1.items.as_slice(),
        condition_leading_sep: field_1.leading_sep,
        condition_trailing_sep: field_1.trailing_sep,
        consequence: field_2.scalar.as_str(),
        consequence_list: field_2.items.as_slice(),
        consequence_leading_sep: field_2.leading_sep,
        consequence_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_throw_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ThrowStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        semicolon: field_0.scalar.as_str(),
        semicolon_list: field_0.items.as_slice(),
        semicolon_leading_sep: field_0.leading_sep,
        semicolon_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "finalizer", "handler"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "finalizer")?;
    let field_2 = resolve_field(node, "handler")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TryStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        finalizer: field_1.scalar.as_str(),
        finalizer_list: field_1.items.as_slice(),
        finalizer_leading_sep: field_1.leading_sep,
        finalizer_trailing_sep: field_1.trailing_sep,
        handler: field_2.scalar.as_str(),
        handler_list: field_2.items.as_slice(),
        handler_leading_sep: field_2.leading_sep,
        handler_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TupleParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_tuple_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TupleTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_type_alias_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "type_parameters", "value"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "semicolon")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let field_3 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeAliasDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        semicolon: field_1.scalar.as_str(),
        semicolon_list: field_1.items.as_slice(),
        semicolon_leading_sep: field_1.leading_sep,
        semicolon_trailing_sep: field_1.trailing_sep,
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
        value: field_3.scalar.as_str(),
        value_list: field_3.items.as_slice(),
        value_leading_sep: field_3.leading_sep,
        value_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_type_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeArgumentsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_type_assertion(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression")?;
    let field_1 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeAssertionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
        type_arguments: field_1.scalar.as_str(),
        type_arguments_list: field_1.items.as_slice(),
        type_arguments_leading_sep: field_1.leading_sep,
        type_arguments_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["const_marker", "constraint", "name", "value"])?;
    let field_0 = resolve_field(node, "const_marker")?;
    let field_1 = resolve_field(node, "constraint")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        const_marker: field_0.scalar.as_str(),
        const_marker_list: field_0.items.as_slice(),
        const_marker_leading_sep: field_0.leading_sep,
        const_marker_trailing_sep: field_0.trailing_sep,
        constraint: field_1.scalar.as_str(),
        constraint_list: field_1.items.as_slice(),
        constraint_leading_sep: field_1.leading_sep,
        constraint_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        value: field_3.scalar.as_str(),
        value_list: field_3.items.as_slice(),
        value_leading_sep: field_3.leading_sep,
        value_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_type_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeParametersTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_type_predicate_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_predicate"])?;
    let field_0 = resolve_field(node, "type_predicate")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypePredicateAnnotationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        type_predicate: field_0.scalar.as_str(),
        type_predicate_list: field_0.items.as_slice(),
        type_predicate_leading_sep: field_0.leading_sep,
        type_predicate_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_type_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypePredicateTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeQueryTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument")?;
    let field_1 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UnaryExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        argument: field_0.scalar.as_str(),
        argument_list: field_0.items.as_slice(),
        argument_leading_sep: field_0.leading_sep,
        argument_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UnionTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        left: field_0.scalar.as_str(),
        left_list: field_0.items.as_slice(),
        left_leading_sep: field_0.leading_sep,
        left_trailing_sep: field_0.trailing_sep,
        right: field_1.scalar.as_str(),
        right_list: field_1.items.as_slice(),
        right_leading_sep: field_1.leading_sep,
        right_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_update_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UpdateExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_variable_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators")?;
    let field_1 = resolve_field(node, "semicolon")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VariableDeclarationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        declarators: field_0.scalar.as_str(),
        declarators_list: field_0.items.as_slice(),
        declarators_leading_sep: field_0.leading_sep,
        declarators_trailing_sep: field_0.trailing_sep,
        semicolon: field_1.scalar.as_str(),
        semicolon_list: field_1.items.as_slice(),
        semicolon_leading_sep: field_1.leading_sep,
        semicolon_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_variable_declarator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let field_2 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VariableDeclaratorTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        name: field_0.scalar.as_str(),
        name_list: field_0.items.as_slice(),
        name_leading_sep: field_0.leading_sep,
        name_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
        value: field_2.scalar.as_str(),
        value_list: field_2.items.as_slice(),
        value_leading_sep: field_2.leading_sep,
        value_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "condition")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WhileStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        condition: field_1.scalar.as_str(),
        condition_list: field_1.items.as_slice(),
        condition_leading_sep: field_1.leading_sep,
        condition_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "object"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "object")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WithStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        body: field_0.scalar.as_str(),
        body_list: field_0.items.as_slice(),
        body_leading_sep: field_0.leading_sep,
        body_trailing_sep: field_0.trailing_sep,
        object: field_1.scalar.as_str(),
        object_list: field_1.items.as_slice(),
        object_leading_sep: field_1.leading_sep,
        object_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = YieldExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        expression: field_0.scalar.as_str(),
        expression_list: field_0.items.as_slice(),
        expression_leading_sep: field_0.leading_sep,
        expression_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}


pub fn render_dispatch(node: &::sittir_core::types::NodeData) -> Result<String, ::askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return Ok(text.clone());
        }
    }
    match node.type_.as_str() {
        "_arrow_function__call_signature" => render_hidden_arrow_function_call_signature(node),
        "_arrow_function_parameter" => render_hidden_arrow_function_parameter(node),
        "_call_expression_call" | "call_expression_call" => render_hidden_call_expression_call(node),
        "_call_expression_member" | "call_expression_member" => render_hidden_call_expression_member(node),
        "_call_expression_template_call" | "call_expression_template_call" => render_hidden_call_expression_template_call(node),
        "_class_body_member" | "class_body_member" => render_hidden_class_body_member(node),
        "_class_body_method_sig" | "class_body_method_sig" => render_hidden_class_body_method_sig(node),
        "_class_body_method" | "class_body_method" => render_hidden_class_body_method(node),
        "_class_heritage_extends_clause" => render_hidden_class_heritage_extends_clause(node),
        "_class_heritage_implements_clause" => render_hidden_class_heritage_implements_clause(node),
        "_export_statement_default_decl_arm_default_kw_value" | "export_statement_default_decl_arm_default_kw_value" => render_hidden_export_statement_default_decl_arm_default_kw_value(node),
        "_export_statement_default_decl_arm_default_kw" | "export_statement_default_decl_arm_default_kw" => render_hidden_export_statement_default_decl_arm_default_kw(node),
        "_export_statement_default_decl_arm" | "export_statement_default_decl_arm" => render_hidden_export_statement_default_decl_arm(node),
        "_export_statement_default_from_arm_clause_from" | "export_statement_default_from_arm_clause_from" => render_hidden_export_statement_default_from_arm_clause_from(node),
        "_export_statement_default_from_arm_ns_from" | "export_statement_default_from_arm_ns_from" => render_hidden_export_statement_default_from_arm_ns_from(node),
        "_export_statement_default_from_arm_star_from" | "export_statement_default_from_arm_star_from" => render_hidden_export_statement_default_from_arm_star_from(node),
        "_export_statement_default_from_arm" | "export_statement_default_from_arm" => render_hidden_export_statement_default_from_arm(node),
        "_export_statement_equals_export" => render_hidden_export_statement_equals_export(node),
        "_export_statement_namespace_export" => render_hidden_export_statement_namespace_export(node),
        "_export_statement_type_export" => render_hidden_export_statement_type_export(node),
        "_for_header_let_const_kind" | "for_header_let_const_kind" => render_hidden_for_header_let_const_kind(node),
        "_for_header_lhs" | "for_header_lhs" => render_hidden_for_header_lhs(node),
        "_for_header_var_kind" | "for_header_var_kind" => render_hidden_for_header_var_kind(node),
        "_import_clause_default_import" => render_hidden_import_clause_default_import(node),
        "_import_clause_named_imports" => render_hidden_import_clause_named_imports(node),
        "_import_clause_namespace_import" => render_hidden_import_clause_namespace_import(node),
        "_import_specifier_as" | "import_specifier_as" => render_hidden_import_specifier_as(node),
        "_import_specifier_name" => render_hidden_import_specifier_name(node),
        "_index_signature_colon" | "index_signature_colon" => render_hidden_index_signature_colon(node),
        "_index_signature_mapped_type_clause" => render_hidden_index_signature_mapped_type_clause(node),
        "_initializer" | "initializer" => render_hidden_initializer(node),
        "_interface_body" | "interface_body" => render_hidden_interface_body(node),
        "_lhs_expression" | "lhs_expression" => render_hidden_lhs_expression(node),
        "_number" | "number" => render_hidden_number(node),
        "_parenthesized_expression_sequence" => render_hidden_parenthesized_expression_sequence(node),
        "_parenthesized_expression_typed" | "parenthesized_expression_typed" => render_hidden_parenthesized_expression_typed(node),
        "_property_identifier" | "property_identifier" => render_hidden_property_identifier(node),
        "_public_field_definition_abstract_first" | "public_field_definition_abstract_first" => render_hidden_public_field_definition_abstract_first(node),
        "_public_field_definition_access_first" | "public_field_definition_access_first" => render_hidden_public_field_definition_access_first(node),
        "_public_field_definition_accessor_opt" | "public_field_definition_accessor_opt" => render_hidden_public_field_definition_accessor_opt(node),
        "_public_field_definition_declare_first" | "public_field_definition_declare_first" => render_hidden_public_field_definition_declare_first(node),
        "_public_field_definition_readonly_first" | "public_field_definition_readonly_first" => render_hidden_public_field_definition_readonly_first(node),
        "_public_field_definition_static_mods" | "public_field_definition_static_mods" => render_hidden_public_field_definition_static_mods(node),
        "_statement_identifier" | "statement_identifier" => render_hidden_statement_identifier(node),
        "_string_double" => render_hidden_string_double(node),
        "_string_fragment" | "string_fragment" => render_hidden_string_fragment(node),
        "_string_single" => render_hidden_string_single(node),
        "_type_identifier" | "type_identifier" => render_hidden_type_identifier(node),
        "_type_query_call_expression_in_type_annotation" | "type_query_call_expression_in_type_annotation" => render_hidden_type_query_call_expression_in_type_annotation(node),
        "_type_query_call_expression" | "type_query_call_expression" => render_hidden_type_query_call_expression(node),
        "_type_query_instantiation_expression" | "type_query_instantiation_expression" => render_hidden_type_query_instantiation_expression(node),
        "_type_query_member_expression_in_type_annotation" | "type_query_member_expression_in_type_annotation" => render_hidden_type_query_member_expression_in_type_annotation(node),
        "_type_query_member_expression" | "type_query_member_expression" => render_hidden_type_query_member_expression(node),
        "_type_query_subscript_expression" | "type_query_subscript_expression" => render_hidden_type_query_subscript_expression(node),
        "_update_expression_postfix" | "update_expression_postfix" => render_hidden_update_expression_postfix(node),
        "_update_expression_prefix" | "update_expression_prefix" => render_hidden_update_expression_prefix(node),
        "abstract_class_declaration" => render_abstract_class_declaration(node),
        "abstract_method_signature" => render_abstract_method_signature(node),
        "adding_type_annotation" => render_adding_type_annotation(node),
        "ambient_declaration" => render_ambient_declaration(node),
        "arguments" => render_arguments(node),
        "array_pattern" => render_array_pattern(node),
        "array_type" => render_array_type(node),
        "array" => render_array(node),
        "arrow_function__call_signature" => render_arrow_function_call_signature(node),
        "arrow_function_parameter" => render_arrow_function_parameter(node),
        "arrow_function" => render_arrow_function(node),
        "as_expression" => render_as_expression(node),
        "asserts_annotation" => render_asserts_annotation(node),
        "asserts" => render_asserts(node),
        "assignment_expression" => render_assignment_expression(node),
        "assignment_pattern" => render_assignment_pattern(node),
        "augmented_assignment_expression" => render_augmented_assignment_expression(node),
        "await_expression" => render_await_expression(node),
        "binary_expression" => render_binary_expression(node),
        "break_statement" => render_break_statement(node),
        "call_expression" => render_call_expression(node),
        "call_signature" => render_call_signature(node),
        "catch_clause" => render_catch_clause(node),
        "class_body" => render_class_body(node),
        "class_declaration" => render_class_declaration(node),
        "class_heritage_extends_clause" => render_class_heritage_extends_clause(node),
        "class_heritage_implements_clause" => render_class_heritage_implements_clause(node),
        "class_heritage" => render_class_heritage(node),
        "class_static_block" => render_class_static_block(node),
        "class" => render_class(node),
        "computed_property_name" => render_computed_property_name(node),
        "conditional_type" => render_conditional_type(node),
        "constraint" => render_constraint(node),
        "construct_signature" => render_construct_signature(node),
        "constructor_type" => render_constructor_type(node),
        "continue_statement" => render_continue_statement(node),
        "debugger_statement" => render_debugger_statement(node),
        "decorator_call_expression" => render_decorator_call_expression(node),
        "decorator_member_expression" => render_decorator_member_expression(node),
        "decorator_parenthesized_expression" => render_decorator_parenthesized_expression(node),
        "decorator" => render_decorator(node),
        "default_type" => render_default_type(node),
        "do_statement" => render_do_statement(node),
        "else_clause" => render_else_clause(node),
        "enum_assignment" => render_enum_assignment(node),
        "enum_body" => render_enum_body(node),
        "enum_declaration" => render_enum_declaration(node),
        "export_clause" => render_export_clause(node),
        "export_specifier" => render_export_specifier(node),
        "export_statement_equals_export" => render_export_statement_equals_export(node),
        "export_statement_namespace_export" => render_export_statement_namespace_export(node),
        "export_statement_type_export" => render_export_statement_type_export(node),
        "export_statement" => render_export_statement(node),
        "expression_statement" => render_expression_statement(node),
        "extends_clause" => render_extends_clause(node),
        "extends_type_clause" => render_extends_type_clause(node),
        "field_definition" => render_field_definition(node),
        "finally_clause" => render_finally_clause(node),
        "flow_maybe_type" => render_flow_maybe_type(node),
        "for_in_statement" => render_for_in_statement(node),
        "for_statement" => render_for_statement(node),
        "formal_parameters" => render_formal_parameters(node),
        "function_declaration" => render_function_declaration(node),
        "function_expression" => render_function_expression(node),
        "function_signature" => render_function_signature(node),
        "function_type" => render_function_type(node),
        "generator_function_declaration" => render_generator_function_declaration(node),
        "generator_function" => render_generator_function(node),
        "generic_type" => render_generic_type(node),
        "if_statement" => render_if_statement(node),
        "implements_clause" => render_implements_clause(node),
        "import_alias" => render_import_alias(node),
        "import_attribute" => render_import_attribute(node),
        "import_clause_default_import" => render_import_clause_default_import(node),
        "import_clause_named_imports" => render_import_clause_named_imports(node),
        "import_clause_namespace_import" => render_import_clause_namespace_import(node),
        "import_clause" => render_import_clause(node),
        "import_require_clause" => render_import_require_clause(node),
        "import_specifier_name" => render_import_specifier_name(node),
        "import_specifier" => render_import_specifier(node),
        "import_statement" => render_import_statement(node),
        "index_signature_mapped_type_clause" => render_index_signature_mapped_type_clause(node),
        "index_signature" => render_index_signature(node),
        "index_type_query" => render_index_type_query(node),
        "infer_type" => render_infer_type(node),
        "instantiation_expression" => render_instantiation_expression(node),
        "interface_declaration" => render_interface_declaration(node),
        "internal_module" => render_internal_module(node),
        "intersection_type" => render_intersection_type(node),
        "jsx_attribute" => render_jsx_attribute(node),
        "jsx_closing_element" => render_jsx_closing_element(node),
        "jsx_element" => render_jsx_element(node),
        "jsx_expression" => render_jsx_expression(node),
        "jsx_namespace_name" => render_jsx_namespace_name(node),
        "jsx_opening_element" => render_jsx_opening_element(node),
        "jsx_self_closing_element" => render_jsx_self_closing_element(node),
        "labeled_statement" => render_labeled_statement(node),
        "lexical_declaration" => render_lexical_declaration(node),
        "literal_type" => render_literal_type(node),
        "lookup_type" => render_lookup_type(node),
        "mapped_type_clause" => render_mapped_type_clause(node),
        "member_expression" => render_member_expression(node),
        "method_definition" => render_method_definition(node),
        "method_signature" => render_method_signature(node),
        "module" => render_module(node),
        "named_imports" => render_named_imports(node),
        "namespace_export" => render_namespace_export(node),
        "namespace_import" => render_namespace_import(node),
        "nested_identifier" => render_nested_identifier(node),
        "nested_type_identifier" => render_nested_type_identifier(node),
        "new_expression" => render_new_expression(node),
        "non_null_expression" => render_non_null_expression(node),
        "object_assignment_pattern" => render_object_assignment_pattern(node),
        "object_pattern" => render_object_pattern(node),
        "object_type" => render_object_type(node),
        "object" => render_object(node),
        "omitting_type_annotation" => render_omitting_type_annotation(node),
        "opting_type_annotation" => render_opting_type_annotation(node),
        "optional_parameter" => render_optional_parameter(node),
        "optional_tuple_parameter" => render_optional_tuple_parameter(node),
        "optional_type" => render_optional_type(node),
        "pair_pattern" => render_pair_pattern(node),
        "pair" => render_pair(node),
        "parenthesized_expression_sequence" => render_parenthesized_expression_sequence(node),
        "parenthesized_expression" => render_parenthesized_expression(node),
        "parenthesized_type" => render_parenthesized_type(node),
        "program" => render_program(node),
        "property_signature" => render_property_signature(node),
        "public_field_definition" => render_public_field_definition(node),
        "readonly_type" => render_readonly_type(node),
        "regex" => render_regex(node),
        "required_parameter" => render_required_parameter(node),
        "rest_pattern" => render_rest_pattern(node),
        "rest_type" => render_rest_type(node),
        "return_statement" => render_return_statement(node),
        "satisfies_expression" => render_satisfies_expression(node),
        "sequence_expression" => render_sequence_expression(node),
        "spread_element" => render_spread_element(node),
        "statement_block" => render_statement_block(node),
        "string_double" => render_string_double(node),
        "string_single" => render_string_single(node),
        "string" => render_string(node),
        "subscript_expression" => render_subscript_expression(node),
        "switch_body" => render_switch_body(node),
        "switch_case" => render_switch_case(node),
        "switch_default" => render_switch_default(node),
        "switch_statement" => render_switch_statement(node),
        "template_literal_type" => render_template_literal_type(node),
        "template_string" => render_template_string(node),
        "template_substitution" => render_template_substitution(node),
        "template_type" => render_template_type(node),
        "ternary_expression" => render_ternary_expression(node),
        "throw_statement" => render_throw_statement(node),
        "try_statement" => render_try_statement(node),
        "tuple_parameter" => render_tuple_parameter(node),
        "tuple_type" => render_tuple_type(node),
        "type_alias_declaration" => render_type_alias_declaration(node),
        "type_annotation" => render_type_annotation(node),
        "type_arguments" => render_type_arguments(node),
        "type_assertion" => render_type_assertion(node),
        "type_parameter" => render_type_parameter(node),
        "type_parameters" => render_type_parameters(node),
        "type_predicate_annotation" => render_type_predicate_annotation(node),
        "type_predicate" => render_type_predicate(node),
        "type_query" => render_type_query(node),
        "unary_expression" => render_unary_expression(node),
        "union_type" => render_union_type(node),
        "update_expression" => render_update_expression(node),
        "variable_declaration" => render_variable_declaration(node),
        "variable_declarator" => render_variable_declarator(node),
        "while_statement" => render_while_statement(node),
        "with_statement" => render_with_statement(node),
        "yield_expression" => render_yield_expression(node),
        _ => token_shaped_fallback(node),
    }
}
