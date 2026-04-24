// @generated from packages/typescript/node-model.json5 and packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --rust-render
//
// Per-kind askama template structs + render_dispatch + GrammarMeta impl
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

#![allow(dead_code, unused_imports)]

pub mod filters {
    //! Askama resolves custom-filter names by searching for a
    //! sibling `filters` module at the derive-macro site. This
    //! module re-exports `sittir_core::filters::{upper, lower,
    //! joinby}` + the TS-dialect aliases (`joinWithTrailing`,
    //! `joinWithLeading`, `joinWithFlanks`) that the current
    //! jinja emitter references. Aliases are thin wrappers over
    //! `joinby` with preset flank flags.
    pub use ::sittir_core::filters::{upper, lower, joinby, isBlank, isPresent};

    pub fn joinWithTrailing<S: AsRef<str>>(xs: &[S], _values: &dyn ::askama::Values, sep: &str) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, false, true)
    }

    pub fn joinWithLeading<S: AsRef<str>>(xs: &[S], _values: &dyn ::askama::Values, sep: &str) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, true, false)
    }

    pub fn joinWithFlanks<S: AsRef<str>>(xs: &[S], _values: &dyn ::askama::Values, sep: &str) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, true, true)
    }
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function__call_signature.jinja", escape = "none")]
pub struct ArrowFunctionUCallSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function_parameter.jinja", escape = "none")]
pub struct ArrowFunctionParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameter: String,
    pub parameter_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_call.jinja", escape = "none")]
pub struct CallExpressionCallTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_member.jinja", escape = "none")]
pub struct CallExpressionMemberTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_template_call.jinja", escape = "none")]
pub struct CallExpressionTemplateCallTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_member.jinja", escape = "none")]
pub struct ClassBodyMemberTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method_sig.jinja", escape = "none")]
pub struct ClassBodyMethodSigTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method.jinja", escape = "none")]
pub struct ClassBodyMethodTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: String,
    pub decorator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_extends_clause.jinja", escape = "none")]
pub struct ClassHeritageExtendsClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_implements_clause.jinja", escape = "none")]
pub struct ClassHeritageImplementsClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw_value.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declaration: String,
    pub declaration_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_clause_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmClauseFromTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: String,
    pub source_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_ns_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmNsFromTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: String,
    pub source_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_star_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmStarFromTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: String,
    pub source_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_equals_export.jinja", escape = "none")]
pub struct ExportStatementEqualsExportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_namespace_export.jinja", escape = "none")]
pub struct ExportStatementNamespaceExportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_type_export.jinja", escape = "none")]
pub struct ExportStatementTypeExportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub source: String,
    pub source_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_let_const_kind.jinja", escape = "none")]
pub struct ForHeaderLetConstKindTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub kind: String,
    pub kind_list: Vec<String>,
    pub left: String,
    pub left_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_lhs.jinja", escape = "none")]
pub struct ForHeaderLhsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_var_kind.jinja", escape = "none")]
pub struct ForHeaderVarKindTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub kind: String,
    pub kind_list: Vec<String>,
    pub left: String,
    pub left_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_default_import.jinja", escape = "none")]
pub struct ImportClauseDefaultImportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_named_imports.jinja", escape = "none")]
pub struct ImportClauseNamedImportsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_namespace_import.jinja", escape = "none")]
pub struct ImportClauseNamespaceImportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_as.jinja", escape = "none")]
pub struct ImportSpecifierAsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_name.jinja", escape = "none")]
pub struct ImportSpecifierNameTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_colon.jinja", escape = "none")]
pub struct IndexSignatureColonTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index_type: String,
    pub index_type_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct IndexSignatureMappedTypeClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_initializer.jinja", escape = "none")]
pub struct InitializerTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_lhs_expression.jinja", escape = "none")]
pub struct LhsExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_number.jinja", escape = "none")]
pub struct _NumberTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_sequence.jinja", escape = "none")]
pub struct ParenthesizedExpressionSequenceTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_typed.jinja", escape = "none")]
pub struct ParenthesizedExpressionTypedTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_abstract_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAbstractFirstTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#abstract: String,
    pub r#abstract_list: Vec<String>,
    pub readonly: String,
    pub readonly_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_access_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessFirstTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declare: String,
    pub declare_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_accessor_opt.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessorOptTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessor: String,
    pub accessor_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_declare_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionDeclareFirstTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_static_mods.jinja", escape = "none")]
pub struct PublicFieldDefinitionStaticModsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub readonly: String,
    pub readonly_list: Vec<String>,
    pub r#static: String,
    pub r#static_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_string_double.jinja", escape = "none")]
pub struct StringDoubleTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_string_single.jinja", escape = "none")]
pub struct StringSingleTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryCallExpressionInTypeAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression.jinja", escape = "none")]
pub struct TypeQueryCallExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_instantiation_expression.jinja", escape = "none")]
pub struct TypeQueryInstantiationExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub function: String,
    pub function_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionInTypeAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: String,
    pub object_list: Vec<String>,
    pub property: String,
    pub property_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: String,
    pub object_list: Vec<String>,
    pub property: String,
    pub property_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_subscript_expression.jinja", escape = "none")]
pub struct TypeQuerySubscriptExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index: String,
    pub index_list: Vec<String>,
    pub object: String,
    pub object_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_postfix.jinja", escape = "none")]
pub struct UpdateExpressionPostfixTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_prefix.jinja", escape = "none")]
pub struct UpdateExpressionPrefixTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_class_declaration.jinja", escape = "none")]
pub struct AbstractClassDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub class_heritage: String,
    pub class_heritage_list: Vec<String>,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_method_signature.jinja", escape = "none")]
pub struct AbstractMethodSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: String,
    pub accessibility_modifier_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub override_modifier: String,
    pub override_modifier_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub question: String,
    pub question_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "adding_type_annotation.jinja", escape = "none")]
pub struct AddingTypeAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declaration: String,
    pub declaration_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "array_pattern.jinja", escape = "none")]
pub struct ArrayPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_type: String,
    pub primary_type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "array.jinja", escape = "none")]
pub struct ArrayTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function.jinja", escape = "none")]
pub struct ArrowFunctionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "as_expression.jinja", escape = "none")]
pub struct AsExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
    pub type_annotation: String,
    pub type_annotation_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "asserts_annotation.jinja", escape = "none")]
pub struct AssertsAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub asserts: String,
    pub asserts_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "asserts.jinja", escape = "none")]
pub struct AssertsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
    pub using: String,
    pub using_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "assignment_pattern.jinja", escape = "none")]
pub struct AssignmentPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment_expression.jinja", escape = "none")]
pub struct AugmentedAssignmentExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "break_statement.jinja", escape = "none")]
pub struct BreakStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub label: String,
    pub label_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "call_signature.jinja", escape = "none")]
pub struct CallSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "catch_clause.jinja", escape = "none")]
pub struct CatchClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub parameter: String,
    pub parameter_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "class_body.jinja", escape = "none")]
pub struct ClassBodyTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_declaration.jinja", escape = "none")]
pub struct ClassDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub automatic_semicolon: String,
    pub automatic_semicolon_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub class_heritage: String,
    pub class_heritage_list: Vec<String>,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage.jinja", escape = "none")]
pub struct ClassHeritageTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_static_block.jinja", escape = "none")]
pub struct ClassStaticBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "class.jinja", escape = "none")]
pub struct ClassTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub class_heritage: String,
    pub class_heritage_list: Vec<String>,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "computed_property_name.jinja", escape = "none")]
pub struct ComputedPropertyNameTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "conditional_type.jinja", escape = "none")]
pub struct ConditionalTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub consequence: String,
    pub consequence_list: Vec<String>,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "constraint.jinja", escape = "none")]
pub struct ConstraintTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "construct_signature.jinja", escape = "none")]
pub struct ConstructSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#abstract: String,
    pub r#abstract_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "constructor_type.jinja", escape = "none")]
pub struct ConstructorTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#abstract: String,
    pub r#abstract_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "continue_statement.jinja", escape = "none")]
pub struct ContinueStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub label: String,
    pub label_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "debugger_statement.jinja", escape = "none")]
pub struct DebuggerStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "decorator_call_expression.jinja", escape = "none")]
pub struct DecoratorCallExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "decorator_member_expression.jinja", escape = "none")]
pub struct DecoratorMemberExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: String,
    pub object_list: Vec<String>,
    pub property: String,
    pub property_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "decorator_parenthesized_expression.jinja", escape = "none")]
pub struct DecoratorParenthesizedExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "default_type.jinja", escape = "none")]
pub struct DefaultTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "do_statement.jinja", escape = "none")]
pub struct DoStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub statement: String,
    pub statement_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "enum_assignment.jinja", escape = "none")]
pub struct EnumAssignmentTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "enum_body.jinja", escape = "none")]
pub struct EnumBodyTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub opening: String,
    pub opening_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "enum_declaration.jinja", escape = "none")]
pub struct EnumDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub r#const: String,
    pub r#const_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "export_clause.jinja", escape = "none")]
pub struct ExportClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "export_specifier.jinja", escape = "none")]
pub struct ExportSpecifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement.jinja", escape = "none")]
pub struct ExportStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "extends_clause.jinja", escape = "none")]
pub struct ExtendsClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "extends_type_clause.jinja", escape = "none")]
pub struct ExtendsTypeClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "field_definition.jinja", escape = "none")]
pub struct FieldDefinitionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub property: String,
    pub property_list: Vec<String>,
    pub r#static: String,
    pub r#static_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "flow_maybe_type.jinja", escape = "none")]
pub struct FlowMaybeTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_type: String,
    pub primary_type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "for_in_statement.jinja", escape = "none")]
pub struct ForInStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#await: String,
    pub r#await_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
    pub increment: String,
    pub increment_list: Vec<String>,
    pub initializer: String,
    pub initializer_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "formal_parameters.jinja", escape = "none")]
pub struct FormalParametersTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_declaration.jinja", escape = "none")]
pub struct FunctionDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "function_expression.jinja", escape = "none")]
pub struct FunctionExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "function_signature.jinja", escape = "none")]
pub struct FunctionSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "generator_function_declaration.jinja", escape = "none")]
pub struct GeneratorFunctionDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "generator_function.jinja", escape = "none")]
pub struct GeneratorFunctionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
    pub consequence: String,
    pub consequence_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "implements_clause.jinja", escape = "none")]
pub struct ImplementsClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_alias.jinja", escape = "none")]
pub struct ImportAliasTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "import_attribute.jinja", escape = "none")]
pub struct ImportAttributeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: String,
    pub object_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause.jinja", escape = "none")]
pub struct ImportClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_require_clause.jinja", escape = "none")]
pub struct ImportRequireClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: String,
    pub identifier_list: Vec<String>,
    pub source: String,
    pub source_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier.jinja", escape = "none")]
pub struct ImportSpecifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub from_clause: String,
    pub from_clause_list: Vec<String>,
    pub import_attribute: String,
    pub import_attribute_list: Vec<String>,
    pub import_clause: String,
    pub import_clause_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
    pub source: String,
    pub source_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature.jinja", escape = "none")]
pub struct IndexSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub sign: String,
    pub sign_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "index_type_query.jinja", escape = "none")]
pub struct IndexTypeQueryTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_type: String,
    pub primary_type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "infer_type.jinja", escape = "none")]
pub struct InferTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub constraint: String,
    pub constraint_list: Vec<String>,
    pub type_identifier: String,
    pub type_identifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "instantiation_expression.jinja", escape = "none")]
pub struct InstantiationExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "interface_declaration.jinja", escape = "none")]
pub struct InterfaceDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub extends_type_clause: String,
    pub extends_type_clause_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "internal_module.jinja", escape = "none")]
pub struct InternalModuleTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "intersection_type.jinja", escape = "none")]
pub struct IntersectionTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_attribute.jinja", escape = "none")]
pub struct JsxAttributeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_closing_element.jinja", escape = "none")]
pub struct JsxClosingElementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_element.jinja", escape = "none")]
pub struct JsxElementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub close_tag: String,
    pub close_tag_list: Vec<String>,
    pub open_tag: String,
    pub open_tag_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_expression.jinja", escape = "none")]
pub struct JsxExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_namespace_name.jinja", escape = "none")]
pub struct JsxNamespaceNameTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "jsx_opening_element.jinja", escape = "none")]
pub struct JsxOpeningElementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: String,
    pub attribute_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_self_closing_element.jinja", escape = "none")]
pub struct JsxSelfClosingElementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: String,
    pub attribute_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "labeled_statement.jinja", escape = "none")]
pub struct LabeledStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub label: String,
    pub label_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "lexical_declaration.jinja", escape = "none")]
pub struct LexicalDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declarators: String,
    pub declarators_list: Vec<String>,
    pub kind: String,
    pub kind_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "literal_type.jinja", escape = "none")]
pub struct LiteralTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lookup_type.jinja", escape = "none")]
pub struct LookupTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index_type: String,
    pub index_type_list: Vec<String>,
    pub primary_type: String,
    pub primary_type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "mapped_type_clause.jinja", escape = "none")]
pub struct MappedTypeClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "member_expression.jinja", escape = "none")]
pub struct MemberExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: String,
    pub object_list: Vec<String>,
    pub optional_chain: String,
    pub optional_chain_list: Vec<String>,
    pub property: String,
    pub property_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "method_definition.jinja", escape = "none")]
pub struct MethodDefinitionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: String,
    pub accessibility_modifier_list: Vec<String>,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub override_modifier: String,
    pub override_modifier_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub question: String,
    pub question_list: Vec<String>,
    pub readonly: String,
    pub readonly_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "method_signature.jinja", escape = "none")]
pub struct MethodSignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: String,
    pub accessibility_modifier_list: Vec<String>,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub override_modifier: String,
    pub override_modifier_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub question: String,
    pub question_list: Vec<String>,
    pub readonly: String,
    pub readonly_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "named_imports.jinja", escape = "none")]
pub struct NamedImportsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "namespace_export.jinja", escape = "none")]
pub struct NamespaceExportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "namespace_import.jinja", escape = "none")]
pub struct NamespaceImportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: String,
    pub identifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "nested_identifier.jinja", escape = "none")]
pub struct NestedIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub object: String,
    pub object_list: Vec<String>,
    pub property: String,
    pub property_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "nested_type_identifier.jinja", escape = "none")]
pub struct NestedTypeIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub module: String,
    pub module_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "new_expression.jinja", escape = "none")]
pub struct NewExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub constructor: String,
    pub constructor_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "non_null_expression.jinja", escape = "none")]
pub struct NonNullExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "object_assignment_pattern.jinja", escape = "none")]
pub struct ObjectAssignmentPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "object_pattern.jinja", escape = "none")]
pub struct ObjectPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "object_type.jinja", escape = "none")]
pub struct ObjectTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub closing: String,
    pub closing_list: Vec<String>,
    pub members: String,
    pub members_list: Vec<String>,
    pub opening: String,
    pub opening_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "object.jinja", escape = "none")]
pub struct ObjectTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "omitting_type_annotation.jinja", escape = "none")]
pub struct OmittingTypeAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "opting_type_annotation.jinja", escape = "none")]
pub struct OptingTypeAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "optional_parameter.jinja", escape = "none")]
pub struct OptionalParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub readonly: String,
    pub readonly_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "optional_tuple_parameter.jinja", escape = "none")]
pub struct OptionalTupleParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "optional_type.jinja", escape = "none")]
pub struct OptionalTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "pair_pattern.jinja", escape = "none")]
pub struct PairPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub key: String,
    pub key_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub key: String,
    pub key_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_type.jinja", escape = "none")]
pub struct ParenthesizedTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "program.jinja", escape = "none")]
pub struct ProgramTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub hash_bang_line: String,
    pub hash_bang_line_list: Vec<String>,
    pub statements: String,
    pub statements_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "property_signature.jinja", escape = "none")]
pub struct PropertySignatureTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub accessibility_modifier: String,
    pub accessibility_modifier_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub override_modifier: String,
    pub override_modifier_list: Vec<String>,
    pub question: String,
    pub question_list: Vec<String>,
    pub readonly: String,
    pub readonly_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "public_field_definition.jinja", escape = "none")]
pub struct PublicFieldDefinitionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "readonly_type.jinja", escape = "none")]
pub struct ReadonlyTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "regex.jinja", escape = "none")]
pub struct RegexTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub flags: String,
    pub flags_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "required_parameter.jinja", escape = "none")]
pub struct RequiredParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub decorator: String,
    pub decorator_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub readonly: String,
    pub readonly_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "rest_pattern.jinja", escape = "none")]
pub struct RestPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "rest_type.jinja", escape = "none")]
pub struct RestTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "satisfies_expression.jinja", escape = "none")]
pub struct SatisfiesExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
    pub type_annotation: String,
    pub type_annotation_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "sequence_expression.jinja", escape = "none")]
pub struct SequenceExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "spread_element.jinja", escape = "none")]
pub struct SpreadElementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "statement_block.jinja", escape = "none")]
pub struct StatementBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub automatic_semicolon: String,
    pub automatic_semicolon_list: Vec<String>,
    pub statements: String,
    pub statements_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "subscript_expression.jinja", escape = "none")]
pub struct SubscriptExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub index: String,
    pub index_list: Vec<String>,
    pub object: String,
    pub object_list: Vec<String>,
    pub optional_chain: String,
    pub optional_chain_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "switch_body.jinja", escape = "none")]
pub struct SwitchBodyTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "switch_case.jinja", escape = "none")]
pub struct SwitchCaseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "switch_default.jinja", escape = "none")]
pub struct SwitchDefaultTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "switch_statement.jinja", escape = "none")]
pub struct SwitchStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "template_literal_type.jinja", escape = "none")]
pub struct TemplateLiteralTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_string.jinja", escape = "none")]
pub struct TemplateStringTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_substitution.jinja", escape = "none")]
pub struct TemplateSubstitutionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "template_type.jinja", escape = "none")]
pub struct TemplateTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ternary_expression.jinja", escape = "none")]
pub struct TernaryExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
    pub consequence: String,
    pub consequence_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "throw_statement.jinja", escape = "none")]
pub struct ThrowStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub finalizer: String,
    pub finalizer_list: Vec<String>,
    pub handler: String,
    pub handler_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_parameter.jinja", escape = "none")]
pub struct TupleParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_declaration.jinja", escape = "none")]
pub struct TypeAliasDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_annotation.jinja", escape = "none")]
pub struct TypeAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_assertion.jinja", escape = "none")]
pub struct TypeAssertionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#const: String,
    pub r#const_list: Vec<String>,
    pub constraint: String,
    pub constraint_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate_annotation.jinja", escape = "none")]
pub struct TypePredicateAnnotationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub type_predicate: String,
    pub type_predicate_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate.jinja", escape = "none")]
pub struct TypePredicateTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_query.jinja", escape = "none")]
pub struct TypeQueryTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "update_expression.jinja", escape = "none")]
pub struct UpdateExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "variable_declaration.jinja", escape = "none")]
pub struct VariableDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub declarators: String,
    pub declarators_list: Vec<String>,
    pub semicolon: String,
    pub semicolon_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declarator.jinja", escape = "none")]
pub struct VariableDeclaratorTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub object: String,
    pub object_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
}

use ::askama::Template as _AskamaTemplate;

/// Render the given NodeData kind using its generated askama template struct.
/// Matches on the source kind name (`_X` for hidden user-facing aliases,
/// `X` for visible) — mirrors what NodeData.$type carries at runtime.
pub fn render_dispatch(
    kind: &str,
    ctx: &::sittir_core::prepare::TemplateContext,
) -> Result<String, ::askama::Error> {
    match kind {
        "_arrow_function__call_signature" => {
            let t = ArrowFunctionUCallSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_arrow_function_parameter" => {
            let t = ArrowFunctionParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                parameter: ctx.fields.get("parameter").cloned().unwrap_or_default(),
                parameter_list: ctx.fields_list.get("parameter").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_call_expression_call" => {
            let t = CallExpressionCallTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_call_expression_member" => {
            let t = CallExpressionMemberTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_call_expression_template_call" => {
            let t = CallExpressionTemplateCallTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_class_body_member" => {
            let t = ClassBodyMemberTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_class_body_method_sig" => {
            let t = ClassBodyMethodSigTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_class_body_method" => {
            let t = ClassBodyMethodTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_class_heritage_extends_clause" => {
            let t = ClassHeritageExtendsClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_class_heritage_implements_clause" => {
            let t = ClassHeritageImplementsClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_export_statement_default_decl_arm_default_kw_value" => {
            let t = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_export_statement_default_decl_arm_default_kw" => {
            let t = ExportStatementDefaultDeclArmDefaultKwTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                declaration: ctx.fields.get("declaration").cloned().unwrap_or_default(),
                declaration_list: ctx.fields_list.get("declaration").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_export_statement_default_from_arm_clause_from" => {
            let t = ExportStatementDefaultFromArmClauseFromTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                source: ctx.fields.get("source").cloned().unwrap_or_default(),
                source_list: ctx.fields_list.get("source").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_export_statement_default_from_arm_ns_from" => {
            let t = ExportStatementDefaultFromArmNsFromTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                source: ctx.fields.get("source").cloned().unwrap_or_default(),
                source_list: ctx.fields_list.get("source").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_export_statement_default_from_arm_star_from" => {
            let t = ExportStatementDefaultFromArmStarFromTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                source: ctx.fields.get("source").cloned().unwrap_or_default(),
                source_list: ctx.fields_list.get("source").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_export_statement_equals_export" => {
            let t = ExportStatementEqualsExportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_export_statement_namespace_export" => {
            let t = ExportStatementNamespaceExportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_export_statement_type_export" => {
            let t = ExportStatementTypeExportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                source: ctx.fields.get("source").cloned().unwrap_or_default(),
                source_list: ctx.fields_list.get("source").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_for_header_let_const_kind" => {
            let t = ForHeaderLetConstKindTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                kind: ctx.fields.get("kind").cloned().unwrap_or_default(),
                kind_list: ctx.fields_list.get("kind").cloned().unwrap_or_default(),
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_for_header_lhs" => {
            let t = ForHeaderLhsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_for_header_var_kind" => {
            let t = ForHeaderVarKindTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                kind: ctx.fields.get("kind").cloned().unwrap_or_default(),
                kind_list: ctx.fields_list.get("kind").cloned().unwrap_or_default(),
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_import_clause_default_import" => {
            let t = ImportClauseDefaultImportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_import_clause_named_imports" => {
            let t = ImportClauseNamedImportsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_import_clause_namespace_import" => {
            let t = ImportClauseNamespaceImportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_import_specifier_as" => {
            let t = ImportSpecifierAsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_import_specifier_name" => {
            let t = ImportSpecifierNameTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_index_signature_colon" => {
            let t = IndexSignatureColonTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                index_type: ctx.fields.get("index_type").cloned().unwrap_or_default(),
                index_type_list: ctx.fields_list.get("index_type").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_index_signature_mapped_type_clause" => {
            let t = IndexSignatureMappedTypeClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_initializer" => {
            let t = InitializerTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_lhs_expression" => {
            let t = LhsExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_number" => {
            let t = _NumberTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_parenthesized_expression_sequence" => {
            let t = ParenthesizedExpressionSequenceTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_parenthesized_expression_typed" => {
            let t = ParenthesizedExpressionTypedTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_public_field_definition_abstract_first" => {
            let t = PublicFieldDefinitionAbstractFirstTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#abstract: ctx.fields.get("abstract").cloned().unwrap_or_default(),
                r#abstract_list: ctx.fields_list.get("abstract").cloned().unwrap_or_default(),
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_public_field_definition_access_first" => {
            let t = PublicFieldDefinitionAccessFirstTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                declare: ctx.fields.get("declare").cloned().unwrap_or_default(),
                declare_list: ctx.fields_list.get("declare").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_public_field_definition_accessor_opt" => {
            let t = PublicFieldDefinitionAccessorOptTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                accessor: ctx.fields.get("accessor").cloned().unwrap_or_default(),
                accessor_list: ctx.fields_list.get("accessor").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_public_field_definition_declare_first" => {
            let t = PublicFieldDefinitionDeclareFirstTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_public_field_definition_static_mods" => {
            let t = PublicFieldDefinitionStaticModsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
                r#static: ctx.fields.get("static").cloned().unwrap_or_default(),
                r#static_list: ctx.fields_list.get("static").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_string_double" => {
            let t = StringDoubleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_string_single" => {
            let t = StringSingleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_type_identifier" => {
            let t = TypeIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "_type_query_call_expression_in_type_annotation" => {
            let t = TypeQueryCallExpressionInTypeAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_type_query_call_expression" => {
            let t = TypeQueryCallExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_type_query_instantiation_expression" => {
            let t = TypeQueryInstantiationExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_type_query_member_expression_in_type_annotation" => {
            let t = TypeQueryMemberExpressionInTypeAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
                property: ctx.fields.get("property").cloned().unwrap_or_default(),
                property_list: ctx.fields_list.get("property").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_type_query_member_expression" => {
            let t = TypeQueryMemberExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
                property: ctx.fields.get("property").cloned().unwrap_or_default(),
                property_list: ctx.fields_list.get("property").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_type_query_subscript_expression" => {
            let t = TypeQuerySubscriptExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                index: ctx.fields.get("index").cloned().unwrap_or_default(),
                index_list: ctx.fields_list.get("index").cloned().unwrap_or_default(),
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_update_expression_postfix" => {
            let t = UpdateExpressionPostfixTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "_update_expression_prefix" => {
            let t = UpdateExpressionPrefixTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "abstract_class_declaration" => {
            let t = AbstractClassDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                class_heritage: ctx.fields.get("class_heritage").cloned().unwrap_or_default(),
                class_heritage_list: ctx.fields_list.get("class_heritage").cloned().unwrap_or_default(),
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "abstract_method_signature" => {
            let t = AbstractMethodSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                accessibility_modifier: ctx.fields.get("accessibility_modifier").cloned().unwrap_or_default(),
                accessibility_modifier_list: ctx.fields_list.get("accessibility_modifier").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                override_modifier: ctx.fields.get("override_modifier").cloned().unwrap_or_default(),
                override_modifier_list: ctx.fields_list.get("override_modifier").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                question: ctx.fields.get("question").cloned().unwrap_or_default(),
                question_list: ctx.fields_list.get("question").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "adding_type_annotation" => {
            let t = AddingTypeAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "ambient_declaration" => {
            let t = AmbientDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                declaration: ctx.fields.get("declaration").cloned().unwrap_or_default(),
                declaration_list: ctx.fields_list.get("declaration").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "arguments" => {
            let t = ArgumentsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "array_pattern" => {
            let t = ArrayPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "array_type" => {
            let t = ArrayTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                primary_type: ctx.fields.get("primary_type").cloned().unwrap_or_default(),
                primary_type_list: ctx.fields_list.get("primary_type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "array" => {
            let t = ArrayTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "arrow_function" => {
            let t = ArrowFunctionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "as_expression" => {
            let t = AsExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
                type_annotation: ctx.fields.get("type_annotation").cloned().unwrap_or_default(),
                type_annotation_list: ctx.fields_list.get("type_annotation").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "asserts_annotation" => {
            let t = AssertsAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                asserts: ctx.fields.get("asserts").cloned().unwrap_or_default(),
                asserts_list: ctx.fields_list.get("asserts").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "asserts" => {
            let t = AssertsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "assignment_expression" => {
            let t = AssignmentExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
                using: ctx.fields.get("using").cloned().unwrap_or_default(),
                using_list: ctx.fields_list.get("using").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "assignment_pattern" => {
            let t = AssignmentPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "augmented_assignment_expression" => {
            let t = AugmentedAssignmentExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "await_expression" => {
            let t = AwaitExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "binary_expression" => {
            let t = BinaryExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "break_statement" => {
            let t = BreakStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "call_expression" => {
            let t = CallExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "call_signature" => {
            let t = CallSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "catch_clause" => {
            let t = CatchClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                parameter: ctx.fields.get("parameter").cloned().unwrap_or_default(),
                parameter_list: ctx.fields_list.get("parameter").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "class_body" => {
            let t = ClassBodyTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "class_declaration" => {
            let t = ClassDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                automatic_semicolon: ctx.fields.get("automatic_semicolon").cloned().unwrap_or_default(),
                automatic_semicolon_list: ctx.fields_list.get("automatic_semicolon").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                class_heritage: ctx.fields.get("class_heritage").cloned().unwrap_or_default(),
                class_heritage_list: ctx.fields_list.get("class_heritage").cloned().unwrap_or_default(),
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "class_heritage" => {
            let t = ClassHeritageTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "class_static_block" => {
            let t = ClassStaticBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "class" => {
            let t = ClassTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                class_heritage: ctx.fields.get("class_heritage").cloned().unwrap_or_default(),
                class_heritage_list: ctx.fields_list.get("class_heritage").cloned().unwrap_or_default(),
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "computed_property_name" => {
            let t = ComputedPropertyNameTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "conditional_type" => {
            let t = ConditionalTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                consequence: ctx.fields.get("consequence").cloned().unwrap_or_default(),
                consequence_list: ctx.fields_list.get("consequence").cloned().unwrap_or_default(),
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "constraint" => {
            let t = ConstraintTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "construct_signature" => {
            let t = ConstructSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#abstract: ctx.fields.get("abstract").cloned().unwrap_or_default(),
                r#abstract_list: ctx.fields_list.get("abstract").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "constructor_type" => {
            let t = ConstructorTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#abstract: ctx.fields.get("abstract").cloned().unwrap_or_default(),
                r#abstract_list: ctx.fields_list.get("abstract").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "continue_statement" => {
            let t = ContinueStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "debugger_statement" => {
            let t = DebuggerStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "decorator_call_expression" => {
            let t = DecoratorCallExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                function: ctx.fields.get("function").cloned().unwrap_or_default(),
                function_list: ctx.fields_list.get("function").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "decorator_member_expression" => {
            let t = DecoratorMemberExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
                property: ctx.fields.get("property").cloned().unwrap_or_default(),
                property_list: ctx.fields_list.get("property").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "decorator_parenthesized_expression" => {
            let t = DecoratorParenthesizedExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "decorator" => {
            let t = DecoratorTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "default_type" => {
            let t = DefaultTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "do_statement" => {
            let t = DoStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "else_clause" => {
            let t = ElseClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                statement: ctx.fields.get("statement").cloned().unwrap_or_default(),
                statement_list: ctx.fields_list.get("statement").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "enum_assignment" => {
            let t = EnumAssignmentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "enum_body" => {
            let t = EnumBodyTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                opening: ctx.fields.get("opening").cloned().unwrap_or_default(),
                opening_list: ctx.fields_list.get("opening").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "enum_declaration" => {
            let t = EnumDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                r#const: ctx.fields.get("const").cloned().unwrap_or_default(),
                r#const_list: ctx.fields_list.get("const").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "export_clause" => {
            let t = ExportClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "export_specifier" => {
            let t = ExportSpecifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "export_statement" => {
            let t = ExportStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "expression_statement" => {
            let t = ExpressionStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "extends_clause" => {
            let t = ExtendsClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "extends_type_clause" => {
            let t = ExtendsTypeClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "field_definition" => {
            let t = FieldDefinitionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                property: ctx.fields.get("property").cloned().unwrap_or_default(),
                property_list: ctx.fields_list.get("property").cloned().unwrap_or_default(),
                r#static: ctx.fields.get("static").cloned().unwrap_or_default(),
                r#static_list: ctx.fields_list.get("static").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "finally_clause" => {
            let t = FinallyClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "flow_maybe_type" => {
            let t = FlowMaybeTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                primary_type: ctx.fields.get("primary_type").cloned().unwrap_or_default(),
                primary_type_list: ctx.fields_list.get("primary_type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "for_in_statement" => {
            let t = ForInStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#await: ctx.fields.get("await").cloned().unwrap_or_default(),
                r#await_list: ctx.fields_list.get("await").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "for_statement" => {
            let t = ForStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
                increment: ctx.fields.get("increment").cloned().unwrap_or_default(),
                increment_list: ctx.fields_list.get("increment").cloned().unwrap_or_default(),
                initializer: ctx.fields.get("initializer").cloned().unwrap_or_default(),
                initializer_list: ctx.fields_list.get("initializer").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "formal_parameters" => {
            let t = FormalParametersTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "function_declaration" => {
            let t = FunctionDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "function_expression" => {
            let t = FunctionExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "function_signature" => {
            let t = FunctionSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "function_type" => {
            let t = FunctionTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "generator_function_declaration" => {
            let t = GeneratorFunctionDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "generator_function" => {
            let t = GeneratorFunctionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "generic_type" => {
            let t = GenericTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "if_statement" => {
            let t = IfStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
                consequence: ctx.fields.get("consequence").cloned().unwrap_or_default(),
                consequence_list: ctx.fields_list.get("consequence").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "implements_clause" => {
            let t = ImplementsClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "import_alias" => {
            let t = ImportAliasTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "import_attribute" => {
            let t = ImportAttributeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "import_clause" => {
            let t = ImportClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "import_require_clause" => {
            let t = ImportRequireClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
                source: ctx.fields.get("source").cloned().unwrap_or_default(),
                source_list: ctx.fields_list.get("source").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "import_specifier" => {
            let t = ImportSpecifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "import_statement" => {
            let t = ImportStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                from_clause: ctx.fields.get("from_clause").cloned().unwrap_or_default(),
                from_clause_list: ctx.fields_list.get("from_clause").cloned().unwrap_or_default(),
                import_attribute: ctx.fields.get("import_attribute").cloned().unwrap_or_default(),
                import_attribute_list: ctx.fields_list.get("import_attribute").cloned().unwrap_or_default(),
                import_clause: ctx.fields.get("import_clause").cloned().unwrap_or_default(),
                import_clause_list: ctx.fields_list.get("import_clause").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
                source: ctx.fields.get("source").cloned().unwrap_or_default(),
                source_list: ctx.fields_list.get("source").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "index_signature" => {
            let t = IndexSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                sign: ctx.fields.get("sign").cloned().unwrap_or_default(),
                sign_list: ctx.fields_list.get("sign").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "index_type_query" => {
            let t = IndexTypeQueryTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                primary_type: ctx.fields.get("primary_type").cloned().unwrap_or_default(),
                primary_type_list: ctx.fields_list.get("primary_type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "infer_type" => {
            let t = InferTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                constraint: ctx.fields.get("constraint").cloned().unwrap_or_default(),
                constraint_list: ctx.fields_list.get("constraint").cloned().unwrap_or_default(),
                type_identifier: ctx.fields.get("type_identifier").cloned().unwrap_or_default(),
                type_identifier_list: ctx.fields_list.get("type_identifier").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "instantiation_expression" => {
            let t = InstantiationExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "interface_declaration" => {
            let t = InterfaceDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                extends_type_clause: ctx.fields.get("extends_type_clause").cloned().unwrap_or_default(),
                extends_type_clause_list: ctx.fields_list.get("extends_type_clause").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "internal_module" => {
            let t = InternalModuleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "intersection_type" => {
            let t = IntersectionTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "jsx_attribute" => {
            let t = JsxAttributeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "jsx_closing_element" => {
            let t = JsxClosingElementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "jsx_element" => {
            let t = JsxElementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                close_tag: ctx.fields.get("close_tag").cloned().unwrap_or_default(),
                close_tag_list: ctx.fields_list.get("close_tag").cloned().unwrap_or_default(),
                open_tag: ctx.fields.get("open_tag").cloned().unwrap_or_default(),
                open_tag_list: ctx.fields_list.get("open_tag").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "jsx_expression" => {
            let t = JsxExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "jsx_namespace_name" => {
            let t = JsxNamespaceNameTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "jsx_opening_element" => {
            let t = JsxOpeningElementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attribute: ctx.fields.get("attribute").cloned().unwrap_or_default(),
                attribute_list: ctx.fields_list.get("attribute").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "jsx_self_closing_element" => {
            let t = JsxSelfClosingElementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attribute: ctx.fields.get("attribute").cloned().unwrap_or_default(),
                attribute_list: ctx.fields_list.get("attribute").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "labeled_statement" => {
            let t = LabeledStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "lexical_declaration" => {
            let t = LexicalDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                declarators: ctx.fields.get("declarators").cloned().unwrap_or_default(),
                declarators_list: ctx.fields_list.get("declarators").cloned().unwrap_or_default(),
                kind: ctx.fields.get("kind").cloned().unwrap_or_default(),
                kind_list: ctx.fields_list.get("kind").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "literal_type" => {
            let t = LiteralTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "lookup_type" => {
            let t = LookupTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                index_type: ctx.fields.get("index_type").cloned().unwrap_or_default(),
                index_type_list: ctx.fields_list.get("index_type").cloned().unwrap_or_default(),
                primary_type: ctx.fields.get("primary_type").cloned().unwrap_or_default(),
                primary_type_list: ctx.fields_list.get("primary_type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "mapped_type_clause" => {
            let t = MappedTypeClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "member_expression" => {
            let t = MemberExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
                optional_chain: ctx.fields.get("optional_chain").cloned().unwrap_or_default(),
                optional_chain_list: ctx.fields_list.get("optional_chain").cloned().unwrap_or_default(),
                property: ctx.fields.get("property").cloned().unwrap_or_default(),
                property_list: ctx.fields_list.get("property").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "method_definition" => {
            let t = MethodDefinitionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                accessibility_modifier: ctx.fields.get("accessibility_modifier").cloned().unwrap_or_default(),
                accessibility_modifier_list: ctx.fields_list.get("accessibility_modifier").cloned().unwrap_or_default(),
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                override_modifier: ctx.fields.get("override_modifier").cloned().unwrap_or_default(),
                override_modifier_list: ctx.fields_list.get("override_modifier").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                question: ctx.fields.get("question").cloned().unwrap_or_default(),
                question_list: ctx.fields_list.get("question").cloned().unwrap_or_default(),
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "method_signature" => {
            let t = MethodSignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                accessibility_modifier: ctx.fields.get("accessibility_modifier").cloned().unwrap_or_default(),
                accessibility_modifier_list: ctx.fields_list.get("accessibility_modifier").cloned().unwrap_or_default(),
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                override_modifier: ctx.fields.get("override_modifier").cloned().unwrap_or_default(),
                override_modifier_list: ctx.fields_list.get("override_modifier").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                question: ctx.fields.get("question").cloned().unwrap_or_default(),
                question_list: ctx.fields_list.get("question").cloned().unwrap_or_default(),
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "module" => {
            let t = ModuleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "named_imports" => {
            let t = NamedImportsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "namespace_export" => {
            let t = NamespaceExportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "namespace_import" => {
            let t = NamespaceImportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "nested_identifier" => {
            let t = NestedIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
                property: ctx.fields.get("property").cloned().unwrap_or_default(),
                property_list: ctx.fields_list.get("property").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "nested_type_identifier" => {
            let t = NestedTypeIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                module: ctx.fields.get("module").cloned().unwrap_or_default(),
                module_list: ctx.fields_list.get("module").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "new_expression" => {
            let t = NewExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                constructor: ctx.fields.get("constructor").cloned().unwrap_or_default(),
                constructor_list: ctx.fields_list.get("constructor").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "non_null_expression" => {
            let t = NonNullExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "object_assignment_pattern" => {
            let t = ObjectAssignmentPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "object_pattern" => {
            let t = ObjectPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "object_type" => {
            let t = ObjectTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                closing: ctx.fields.get("closing").cloned().unwrap_or_default(),
                closing_list: ctx.fields_list.get("closing").cloned().unwrap_or_default(),
                members: ctx.fields.get("members").cloned().unwrap_or_default(),
                members_list: ctx.fields_list.get("members").cloned().unwrap_or_default(),
                opening: ctx.fields.get("opening").cloned().unwrap_or_default(),
                opening_list: ctx.fields_list.get("opening").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "object" => {
            let t = ObjectTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "omitting_type_annotation" => {
            let t = OmittingTypeAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "opting_type_annotation" => {
            let t = OptingTypeAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "optional_parameter" => {
            let t = OptionalParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "optional_tuple_parameter" => {
            let t = OptionalTupleParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "optional_type" => {
            let t = OptionalTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "pair_pattern" => {
            let t = PairPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                key: ctx.fields.get("key").cloned().unwrap_or_default(),
                key_list: ctx.fields_list.get("key").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "pair" => {
            let t = PairTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                key: ctx.fields.get("key").cloned().unwrap_or_default(),
                key_list: ctx.fields_list.get("key").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "parenthesized_expression" => {
            let t = ParenthesizedExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "parenthesized_type" => {
            let t = ParenthesizedTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "program" => {
            let t = ProgramTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                hash_bang_line: ctx.fields.get("hash_bang_line").cloned().unwrap_or_default(),
                hash_bang_line_list: ctx.fields_list.get("hash_bang_line").cloned().unwrap_or_default(),
                statements: ctx.fields.get("statements").cloned().unwrap_or_default(),
                statements_list: ctx.fields_list.get("statements").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "property_signature" => {
            let t = PropertySignatureTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                accessibility_modifier: ctx.fields.get("accessibility_modifier").cloned().unwrap_or_default(),
                accessibility_modifier_list: ctx.fields_list.get("accessibility_modifier").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                override_modifier: ctx.fields.get("override_modifier").cloned().unwrap_or_default(),
                override_modifier_list: ctx.fields_list.get("override_modifier").cloned().unwrap_or_default(),
                question: ctx.fields.get("question").cloned().unwrap_or_default(),
                question_list: ctx.fields_list.get("question").cloned().unwrap_or_default(),
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "public_field_definition" => {
            let t = PublicFieldDefinitionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "readonly_type" => {
            let t = ReadonlyTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "regex" => {
            let t = RegexTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                flags: ctx.fields.get("flags").cloned().unwrap_or_default(),
                flags_list: ctx.fields_list.get("flags").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "required_parameter" => {
            let t = RequiredParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                decorator: ctx.fields.get("decorator").cloned().unwrap_or_default(),
                decorator_list: ctx.fields_list.get("decorator").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                readonly: ctx.fields.get("readonly").cloned().unwrap_or_default(),
                readonly_list: ctx.fields_list.get("readonly").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "rest_pattern" => {
            let t = RestPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "rest_type" => {
            let t = RestTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "return_statement" => {
            let t = ReturnStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "satisfies_expression" => {
            let t = SatisfiesExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
                type_annotation: ctx.fields.get("type_annotation").cloned().unwrap_or_default(),
                type_annotation_list: ctx.fields_list.get("type_annotation").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "sequence_expression" => {
            let t = SequenceExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "spread_element" => {
            let t = SpreadElementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "statement_block" => {
            let t = StatementBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                automatic_semicolon: ctx.fields.get("automatic_semicolon").cloned().unwrap_or_default(),
                automatic_semicolon_list: ctx.fields_list.get("automatic_semicolon").cloned().unwrap_or_default(),
                statements: ctx.fields.get("statements").cloned().unwrap_or_default(),
                statements_list: ctx.fields_list.get("statements").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "string" => {
            let t = StringTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "subscript_expression" => {
            let t = SubscriptExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                index: ctx.fields.get("index").cloned().unwrap_or_default(),
                index_list: ctx.fields_list.get("index").cloned().unwrap_or_default(),
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
                optional_chain: ctx.fields.get("optional_chain").cloned().unwrap_or_default(),
                optional_chain_list: ctx.fields_list.get("optional_chain").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "switch_body" => {
            let t = SwitchBodyTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "switch_case" => {
            let t = SwitchCaseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "switch_default" => {
            let t = SwitchDefaultTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "switch_statement" => {
            let t = SwitchStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "template_literal_type" => {
            let t = TemplateLiteralTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "template_string" => {
            let t = TemplateStringTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "template_substitution" => {
            let t = TemplateSubstitutionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "template_type" => {
            let t = TemplateTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "ternary_expression" => {
            let t = TernaryExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
                consequence: ctx.fields.get("consequence").cloned().unwrap_or_default(),
                consequence_list: ctx.fields_list.get("consequence").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "throw_statement" => {
            let t = ThrowStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "try_statement" => {
            let t = TryStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                finalizer: ctx.fields.get("finalizer").cloned().unwrap_or_default(),
                finalizer_list: ctx.fields_list.get("finalizer").cloned().unwrap_or_default(),
                handler: ctx.fields.get("handler").cloned().unwrap_or_default(),
                handler_list: ctx.fields_list.get("handler").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "tuple_parameter" => {
            let t = TupleParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "tuple_type" => {
            let t = TupleTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "type_alias_declaration" => {
            let t = TypeAliasDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "type_annotation" => {
            let t = TypeAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "type_arguments" => {
            let t = TypeArgumentsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "type_assertion" => {
            let t = TypeAssertionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "type_parameter" => {
            let t = TypeParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#const: ctx.fields.get("const").cloned().unwrap_or_default(),
                r#const_list: ctx.fields_list.get("const").cloned().unwrap_or_default(),
                constraint: ctx.fields.get("constraint").cloned().unwrap_or_default(),
                constraint_list: ctx.fields_list.get("constraint").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "type_parameters" => {
            let t = TypeParametersTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "type_predicate_annotation" => {
            let t = TypePredicateAnnotationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                type_predicate: ctx.fields.get("type_predicate").cloned().unwrap_or_default(),
                type_predicate_list: ctx.fields_list.get("type_predicate").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "type_predicate" => {
            let t = TypePredicateTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "type_query" => {
            let t = TypeQueryTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "unary_expression" => {
            let t = UnaryExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "union_type" => {
            let t = UnionTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "update_expression" => {
            let t = UpdateExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render()
        }
        "variable_declaration" => {
            let t = VariableDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                declarators: ctx.fields.get("declarators").cloned().unwrap_or_default(),
                declarators_list: ctx.fields_list.get("declarators").cloned().unwrap_or_default(),
                semicolon: ctx.fields.get("semicolon").cloned().unwrap_or_default(),
                semicolon_list: ctx.fields_list.get("semicolon").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "variable_declarator" => {
            let t = VariableDeclaratorTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "while_statement" => {
            let t = WhileStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "with_statement" => {
            let t = WithStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
            };
            t.render()
        }
        "yield_expression" => {
            let t = YieldExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render()
        }
        other => Err(::askama::Error::Custom(
            format!("render_dispatch: no template for kind '{}'", other).into(),
        )),
    }
}

/// Per-grammar metadata — separator / variant-label / list-container tables.
/// Implements the `sittir_core::prepare::GrammarMeta` trait.
pub struct TypescriptGrammarMeta;

impl ::sittir_core::prepare::GrammarMeta for TypescriptGrammarMeta {
    fn separator_for(&self, kind: &str) -> Option<&str> {
        match kind {
            "arguments" => Some(","),
            "array" => Some(","),
            "array_pattern" => Some(","),
            "export_clause" => Some(","),
            "named_imports" => Some(","),
            "sequence_expression" => Some(","),
            "tuple_type" => Some(","),
            "type_arguments" => Some(","),
            "type_parameters" => Some(","),
            _ => None,
        }
    }
    fn variant_for(&self, parent_kind: &str, child_kind: &str) -> Option<&str> {
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
    fn is_list_container(&self, kind: &str) -> bool {
        matches!(kind,
            "_class_body_member" | "_class_body_method_sig" | "_class_heritage_extends_clause" | "_class_heritage_implements_clause" | "_export_statement_equals_export" | "_export_statement_namespace_export" | "_import_clause_default_import" | "_import_clause_named_imports" | "_import_clause_namespace_import" | "_index_signature_mapped_type_clause" | "_lhs_expression" | "_parenthesized_expression_sequence" | "_public_field_definition_declare_first" | "_string_double" | "_string_single" | "_type_identifier" | "arguments" | "array" | "array_pattern" | "asserts" | "class_body" | "decorator" | "decorator_parenthesized_expression" | "export_clause" | "formal_parameters" | "implements_clause" | "jsx_attribute" | "jsx_expression" | "jsx_namespace_name" | "literal_type" | "named_imports" | "namespace_export" | "object" | "object_pattern" | "rest_pattern" | "sequence_expression" | "switch_body" | "template_literal_type" | "template_string" | "template_substitution" | "template_type" | "tuple_type" | "type_arguments" | "type_parameters" | "type_query"
        )
    }
}
