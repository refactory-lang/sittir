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
    #[::askama::filter_fn]
    pub fn joinby<T: ::sittir_core::filters::JoinSource + ?Sized>(
        xs: &T,
        _values: &dyn ::askama::Values,
        sep: &str,
        leading: bool,
        trailing: bool,
    ) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, leading, trailing)
    }

    #[::askama::filter_fn]
    pub fn join<T: ::sittir_core::filters::JoinSource + ?Sized>(
        xs: &T,
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
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function_parameter.jinja", escape = "none")]
pub struct _ArrowFunctionParameterTemplate<'a> {
    pub parameter: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_call.jinja", escape = "none")]
pub struct CallExpressionCallTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_member.jinja", escape = "none")]
pub struct CallExpressionMemberTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_template_call.jinja", escape = "none")]
pub struct CallExpressionTemplateCallTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_member.jinja", escape = "none")]
pub struct ClassBodyMemberTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method_sig.jinja", escape = "none")]
pub struct ClassBodyMethodSigTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method.jinja", escape = "none")]
pub struct ClassBodyMethodTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_extends_clause.jinja", escape = "none")]
pub struct _ClassHeritageExtendsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_implements_clause.jinja", escape = "none")]
pub struct _ClassHeritageImplementsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw_value.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declaration: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declaration: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_clause_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmClauseFromTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_ns_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmNsFromTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_star_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmStarFromTemplate<'a> {
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_equals_export.jinja", escape = "none")]
pub struct _ExportStatementEqualsExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_namespace_export.jinja", escape = "none")]
pub struct _ExportStatementNamespaceExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_type_export.jinja", escape = "none")]
pub struct _ExportStatementTypeExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_let_const_kind.jinja", escape = "none")]
pub struct ForHeaderLetConstKindTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub kind: &'a str,
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_lhs.jinja", escape = "none")]
pub struct ForHeaderLhsTemplate<'a> {
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_var_kind.jinja", escape = "none")]
pub struct ForHeaderVarKindTemplate<'a> {
    pub kind: &'a str,
    pub left: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_default_import.jinja", escape = "none")]
pub struct _ImportClauseDefaultImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_named_imports.jinja", escape = "none")]
pub struct _ImportClauseNamedImportsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_namespace_import.jinja", escape = "none")]
pub struct _ImportClauseNamespaceImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_as.jinja", escape = "none")]
pub struct ImportSpecifierAsTemplate<'a> {
    pub alias: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_name.jinja", escape = "none")]
pub struct _ImportSpecifierNameTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_colon.jinja", escape = "none")]
pub struct IndexSignatureColonTemplate<'a> {
    pub index_type: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct _IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_initializer.jinja", escape = "none")]
pub struct InitializerTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_interface_body.jinja", escape = "none")]
pub struct InterfaceBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_lhs_expression.jinja", escape = "none")]
pub struct LhsExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_number.jinja", escape = "none")]
pub struct _NumberTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_sequence.jinja", escape = "none")]
pub struct _ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_typed.jinja", escape = "none")]
pub struct ParenthesizedExpressionTypedTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_property_identifier.jinja", escape = "none")]
pub struct PropertyIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_abstract_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAbstractFirstTemplate<'a> {
    pub abstract_marker: &'a str,
    pub readonly_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_access_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessFirstTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declare_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_accessor_opt.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessorOptTemplate<'a> {
    pub accessor_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_declare_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionDeclareFirstTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_readonly_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionReadonlyFirstTemplate<'a> {
    pub abstract_marker: &'a str,
    pub readonly_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_static_mods.jinja", escape = "none")]
pub struct PublicFieldDefinitionStaticModsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub readonly_marker: &'a str,
    pub static_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_statement_identifier.jinja", escape = "none")]
pub struct StatementIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_double.jinja", escape = "none")]
pub struct _StringDoubleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_fragment.jinja", escape = "none")]
pub struct StringFragmentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_single.jinja", escape = "none")]
pub struct _StringSingleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryCallExpressionInTypeAnnotationTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression.jinja", escape = "none")]
pub struct TypeQueryCallExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_instantiation_expression.jinja", escape = "none")]
pub struct TypeQueryInstantiationExpressionTemplate<'a> {
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionInTypeAnnotationTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_subscript_expression.jinja", escape = "none")]
pub struct TypeQuerySubscriptExpressionTemplate<'a> {
    pub index: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_postfix.jinja", escape = "none")]
pub struct UpdateExpressionPostfixTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_prefix.jinja", escape = "none")]
pub struct UpdateExpressionPrefixTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "abstract_class_declaration.jinja", escape = "none")]
pub struct AbstractClassDeclarationTemplate<'a> {
    pub body: &'a str,
    pub class_heritage: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "abstract_method_signature.jinja", escape = "none")]
pub struct AbstractMethodSignatureTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub accessor_kind: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "adding_type_annotation.jinja", escape = "none")]
pub struct AddingTypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declaration: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_pattern.jinja", escape = "none")]
pub struct ArrayPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "array.jinja", escape = "none")]
pub struct ArrayTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function__call_signature.jinja", escape = "none")]
pub struct ArrowFunctionUCallSignatureTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function_parameter.jinja", escape = "none")]
pub struct ArrowFunctionParameterTemplate<'a> {
    pub parameter: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function.jinja", escape = "none")]
pub struct ArrowFunctionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "as_expression.jinja", escape = "none")]
pub struct AsExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub expression: &'a str,
    pub type_annotation: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "asserts_annotation.jinja", escape = "none")]
pub struct AssertsAnnotationTemplate<'a> {
    pub asserts: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "asserts.jinja", escape = "none")]
pub struct AssertsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
    pub using_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "assignment_pattern.jinja", escape = "none")]
pub struct AssignmentPatternTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment_expression.jinja", escape = "none")]
pub struct AugmentedAssignmentExpressionTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "break_statement.jinja", escape = "none")]
pub struct BreakStatementTemplate<'a> {
    pub label: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call_signature.jinja", escape = "none")]
pub struct CallSignatureTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "catch_clause.jinja", escape = "none")]
pub struct CatchClauseTemplate<'a> {
    pub body: &'a str,
    pub parameter: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_body.jinja", escape = "none")]
pub struct ClassBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_declaration.jinja", escape = "none")]
pub struct ClassDeclarationTemplate<'a> {
    pub automatic_semicolon: &'a str,
    pub body: &'a str,
    pub class_heritage: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_extends_clause.jinja", escape = "none")]
pub struct ClassHeritageExtendsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_implements_clause.jinja", escape = "none")]
pub struct ClassHeritageImplementsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage.jinja", escape = "none")]
pub struct ClassHeritageTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_static_block.jinja", escape = "none")]
pub struct ClassStaticBlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class.jinja", escape = "none")]
pub struct ClassTemplate<'a> {
    pub body: &'a str,
    pub class_heritage: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "computed_property_name.jinja", escape = "none")]
pub struct ComputedPropertyNameTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "conditional_type.jinja", escape = "none")]
pub struct ConditionalTypeTemplate<'a> {
    pub alternative: &'a str,
    pub consequence: &'a str,
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "constraint.jinja", escape = "none")]
pub struct ConstraintTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "construct_signature.jinja", escape = "none")]
pub struct ConstructSignatureTemplate<'a> {
    pub abstract_marker: &'a str,
    pub parameters: &'a str,
    pub r#type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "constructor_type.jinja", escape = "none")]
pub struct ConstructorTypeTemplate<'a> {
    pub abstract_marker: &'a str,
    pub parameters: &'a str,
    pub r#type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "continue_statement.jinja", escape = "none")]
pub struct ContinueStatementTemplate<'a> {
    pub label: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "debugger_statement.jinja", escape = "none")]
pub struct DebuggerStatementTemplate<'a> {
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator_call_expression.jinja", escape = "none")]
pub struct DecoratorCallExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator_member_expression.jinja", escape = "none")]
pub struct DecoratorMemberExpressionTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator_parenthesized_expression.jinja", escape = "none")]
pub struct DecoratorParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "default_type.jinja", escape = "none")]
pub struct DefaultTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "do_statement.jinja", escape = "none")]
pub struct DoStatementTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub statement: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "enum_assignment.jinja", escape = "none")]
pub struct EnumAssignmentTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "enum_body.jinja", escape = "none")]
pub struct EnumBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_declaration.jinja", escape = "none")]
pub struct EnumDeclarationTemplate<'a> {
    pub body: &'a str,
    pub const_marker: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "export_clause.jinja", escape = "none")]
pub struct ExportClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_specifier.jinja", escape = "none")]
pub struct ExportSpecifierTemplate<'a> {
    pub alias: &'a str,
    pub export_kind: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_equals_export.jinja", escape = "none")]
pub struct ExportStatementEqualsExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_namespace_export.jinja", escape = "none")]
pub struct ExportStatementNamespaceExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_type_export.jinja", escape = "none")]
pub struct ExportStatementTypeExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "export_statement.jinja", escape = "none")]
pub struct ExportStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "extends_clause.jinja", escape = "none")]
pub struct ExtendsClauseTemplate<'a> {
    pub type_arguments: ::sittir_core::filters::FieldView<'a>,
    pub value: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extends_type_clause.jinja", escape = "none")]
pub struct ExtendsTypeClauseTemplate<'a> {
    pub r#type: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_definition.jinja", escape = "none")]
pub struct FieldDefinitionTemplate<'a> {
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub property: &'a str,
    pub static_marker: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "flow_maybe_type.jinja", escape = "none")]
pub struct FlowMaybeTypeTemplate<'a> {
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_in_statement.jinja", escape = "none")]
pub struct ForInStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub await_marker: &'a str,
    pub body: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
    pub increment: &'a str,
    pub initializer: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "formal_parameters.jinja", escape = "none")]
pub struct FormalParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_declaration.jinja", escape = "none")]
pub struct FunctionDeclarationTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_expression.jinja", escape = "none")]
pub struct FunctionExpressionTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_signature.jinja", escape = "none")]
pub struct FunctionSignatureTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub semicolon: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generator_function_declaration.jinja", escape = "none")]
pub struct GeneratorFunctionDeclarationTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generator_function.jinja", escape = "none")]
pub struct GeneratorFunctionTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub name: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: &'a str,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "implements_clause.jinja", escape = "none")]
pub struct ImplementsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_alias.jinja", escape = "none")]
pub struct ImportAliasTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: &'a str,
    pub semicolon: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_attribute.jinja", escape = "none")]
pub struct ImportAttributeTemplate<'a> {
    pub object: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_default_import.jinja", escape = "none")]
pub struct ImportClauseDefaultImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_named_imports.jinja", escape = "none")]
pub struct ImportClauseNamedImportsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_namespace_import.jinja", escape = "none")]
pub struct ImportClauseNamespaceImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause.jinja", escape = "none")]
pub struct ImportClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_require_clause.jinja", escape = "none")]
pub struct ImportRequireClauseTemplate<'a> {
    pub identifier: &'a str,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier_name.jinja", escape = "none")]
pub struct ImportSpecifierNameTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier.jinja", escape = "none")]
pub struct ImportSpecifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub import_kind: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub import_attribute: &'a str,
    pub import_clause: &'a str,
    pub semicolon: &'a str,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature.jinja", escape = "none")]
pub struct IndexSignatureTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub sign: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "index_type_query.jinja", escape = "none")]
pub struct IndexTypeQueryTemplate<'a> {
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "infer_type.jinja", escape = "none")]
pub struct InferTypeTemplate<'a> {
    pub r#type: &'a str,
    pub type_identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "instantiation_expression.jinja", escape = "none")]
pub struct InstantiationExpressionTemplate<'a> {
    pub expression: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "interface_declaration.jinja", escape = "none")]
pub struct InterfaceDeclarationTemplate<'a> {
    pub body: &'a str,
    pub extends_type_clause: &'a str,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "internal_module.jinja", escape = "none")]
pub struct InternalModuleTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "intersection_type.jinja", escape = "none")]
pub struct IntersectionTypeTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_attribute.jinja", escape = "none")]
pub struct JsxAttributeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_closing_element.jinja", escape = "none")]
pub struct JsxClosingElementTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_element.jinja", escape = "none")]
pub struct JsxElementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub close_tag: &'a str,
    pub open_tag: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_expression.jinja", escape = "none")]
pub struct JsxExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_namespace_name.jinja", escape = "none")]
pub struct JsxNamespaceNameTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_opening_element.jinja", escape = "none")]
pub struct JsxOpeningElementTemplate<'a> {
    pub attribute: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_self_closing_element.jinja", escape = "none")]
pub struct JsxSelfClosingElementTemplate<'a> {
    pub attribute: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "labeled_statement.jinja", escape = "none")]
pub struct LabeledStatementTemplate<'a> {
    pub body: &'a str,
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lexical_declaration.jinja", escape = "none")]
pub struct LexicalDeclarationTemplate<'a> {
    pub declarators: ::sittir_core::filters::FieldView<'a>,
    pub kind: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "literal_type.jinja", escape = "none")]
pub struct LiteralTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lookup_type.jinja", escape = "none")]
pub struct LookupTypeTemplate<'a> {
    pub index_type: &'a str,
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "mapped_type_clause.jinja", escape = "none")]
pub struct MappedTypeClauseTemplate<'a> {
    pub alias: &'a str,
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "member_expression.jinja", escape = "none")]
pub struct MemberExpressionTemplate<'a> {
    pub object: &'a str,
    pub optional_chain: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "method_definition.jinja", escape = "none")]
pub struct MethodDefinitionTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub accessor_kind: &'a str,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub parameters: &'a str,
    pub readonly_marker: &'a str,
    pub return_type: &'a str,
    pub static_marker: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "method_signature.jinja", escape = "none")]
pub struct MethodSignatureTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub accessor_kind: &'a str,
    pub async_marker: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub parameters: &'a str,
    pub readonly_marker: &'a str,
    pub return_type: &'a str,
    pub static_marker: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "named_imports.jinja", escape = "none")]
pub struct NamedImportsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_export.jinja", escape = "none")]
pub struct NamespaceExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_import.jinja", escape = "none")]
pub struct NamespaceImportTemplate<'a> {
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "nested_identifier.jinja", escape = "none")]
pub struct NestedIdentifierTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "nested_type_identifier.jinja", escape = "none")]
pub struct NestedTypeIdentifierTemplate<'a> {
    pub module: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "new_expression.jinja", escape = "none")]
pub struct NewExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub constructor: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "non_null_expression.jinja", escape = "none")]
pub struct NonNullExpressionTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "object_assignment_pattern.jinja", escape = "none")]
pub struct ObjectAssignmentPatternTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "object_pattern.jinja", escape = "none")]
pub struct ObjectPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object_type.jinja", escape = "none")]
pub struct ObjectTypeTemplate<'a> {
    pub closing: &'a str,
    pub members: ::sittir_core::filters::FieldView<'a>,
    pub opening: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "object.jinja", escape = "none")]
pub struct ObjectTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "omitting_type_annotation.jinja", escape = "none")]
pub struct OmittingTypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "opting_type_annotation.jinja", escape = "none")]
pub struct OptingTypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "optional_parameter.jinja", escape = "none")]
pub struct OptionalParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub pattern: &'a str,
    pub readonly_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "optional_tuple_parameter.jinja", escape = "none")]
pub struct OptionalTupleParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "optional_type.jinja", escape = "none")]
pub struct OptionalTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "pair_pattern.jinja", escape = "none")]
pub struct PairPatternTemplate<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression_sequence.jinja", escape = "none")]
pub struct ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_type.jinja", escape = "none")]
pub struct ParenthesizedTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "program.jinja", escape = "none")]
pub struct ProgramTemplate<'a> {
    pub hash_bang_line: &'a str,
    pub statements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "property_signature.jinja", escape = "none")]
pub struct PropertySignatureTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub readonly_marker: &'a str,
    pub static_marker: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "public_field_definition.jinja", escape = "none")]
pub struct PublicFieldDefinitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub optionality_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "readonly_type.jinja", escape = "none")]
pub struct ReadonlyTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "regex.jinja", escape = "none")]
pub struct RegexTemplate<'a> {
    pub flags: &'a str,
    pub pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "required_parameter.jinja", escape = "none")]
pub struct RequiredParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub pattern: &'a str,
    pub readonly_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "rest_pattern.jinja", escape = "none")]
pub struct RestPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "rest_type.jinja", escape = "none")]
pub struct RestTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "satisfies_expression.jinja", escape = "none")]
pub struct SatisfiesExpressionTemplate<'a> {
    pub expression: &'a str,
    pub type_annotation: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "sequence_expression.jinja", escape = "none")]
pub struct SequenceExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "spread_element.jinja", escape = "none")]
pub struct SpreadElementTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "statement_block.jinja", escape = "none")]
pub struct StatementBlockTemplate<'a> {
    pub automatic_semicolon: &'a str,
    pub statements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_double.jinja", escape = "none")]
pub struct StringDoubleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_single.jinja", escape = "none")]
pub struct StringSingleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "subscript_expression.jinja", escape = "none")]
pub struct SubscriptExpressionTemplate<'a> {
    pub index: &'a str,
    pub object: &'a str,
    pub optional_chain: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "switch_body.jinja", escape = "none")]
pub struct SwitchBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_case.jinja", escape = "none")]
pub struct SwitchCaseTemplate<'a> {
    pub body: ::sittir_core::filters::FieldView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "switch_default.jinja", escape = "none")]
pub struct SwitchDefaultTemplate<'a> {
    pub body: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_statement.jinja", escape = "none")]
pub struct SwitchStatementTemplate<'a> {
    pub body: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "template_literal_type.jinja", escape = "none")]
pub struct TemplateLiteralTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_string.jinja", escape = "none")]
pub struct TemplateStringTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_substitution.jinja", escape = "none")]
pub struct TemplateSubstitutionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_type.jinja", escape = "none")]
pub struct TemplateTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ternary_expression.jinja", escape = "none")]
pub struct TernaryExpressionTemplate<'a> {
    pub alternative: &'a str,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "throw_statement.jinja", escape = "none")]
pub struct ThrowStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: &'a str,
    pub finalizer: &'a str,
    pub handler: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_parameter.jinja", escape = "none")]
pub struct TupleParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_declaration.jinja", escape = "none")]
pub struct TypeAliasDeclarationTemplate<'a> {
    pub name: &'a str,
    pub semicolon: &'a str,
    pub type_parameters: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_annotation.jinja", escape = "none")]
pub struct TypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_assertion.jinja", escape = "none")]
pub struct TypeAssertionTemplate<'a> {
    pub expression: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub const_marker: &'a str,
    pub constraint: &'a str,
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate_annotation.jinja", escape = "none")]
pub struct TypePredicateAnnotationTemplate<'a> {
    pub type_predicate: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate.jinja", escape = "none")]
pub struct TypePredicateTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_query.jinja", escape = "none")]
pub struct TypeQueryTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "update_expression.jinja", escape = "none")]
pub struct UpdateExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declaration.jinja", escape = "none")]
pub struct VariableDeclarationTemplate<'a> {
    pub declarators: ::sittir_core::filters::FieldView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "variable_declarator.jinja", escape = "none")]
pub struct VariableDeclaratorTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub body: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub expression: &'a str,
}

use ::askama::Template as _AskamaTemplate;
use ::sittir_core::types::{FieldValue, NodeData};

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
enum ResolvedFieldKind {
    #[default]
    Missing,
    Scalar,
    List,
}

#[derive(Debug, Default)]
struct ResolvedField {
    kind: ResolvedFieldKind,
    scalar: String,
    items: Vec<String>,
    separator: &'static str,
    leading_sep: bool,
    trailing_sep: bool,
}

impl ResolvedField {
    fn from_scalar(value: String) -> Self {
        Self {
            kind: ResolvedFieldKind::Scalar,
            scalar: value,
            items: Vec::new(),
            separator: "",
            leading_sep: false,
            trailing_sep: false,
        }
    }

    fn from_items(items: Vec<String>, separator: &'static str, leading_sep: bool, trailing_sep: bool) -> Self {
        Self {
            kind: ResolvedFieldKind::List,
            scalar: ::sittir_core::filters::joinby(&items, separator, leading_sep, trailing_sep).unwrap_or_default(),
            items,
            separator,
            leading_sep,
            trailing_sep,
        }
    }

    fn as_scalar(&self) -> &str {
        self.scalar.as_str()
    }

    fn as_list_view(&self) -> ::sittir_core::filters::ListView<'_> {
        ::sittir_core::filters::ListView {
            items: self.items.as_slice(),
            separator: self.separator,
            leading: self.leading_sep,
            trailing: self.trailing_sep,
        }
    }

    fn as_field_view(&self) -> ::sittir_core::filters::FieldView<'_> {
        match self.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::FieldView::Missing,
            ResolvedFieldKind::Scalar => ::sittir_core::filters::FieldView::Scalar(self.scalar.as_str()),
            ResolvedFieldKind::List => ::sittir_core::filters::FieldView::List(self.as_list_view()),
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

fn missing_required_field(node: &NodeData, name: &str) -> ::askama::Error {
    ::askama::Error::Custom(
        format!("render_dispatch: missing required field '{}' on '{}'", name, node.type_).into(),
    )
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
            let resolved = resolve_field(node, name, false)?;
            Ok((!resolved.scalar.is_empty()).then_some(resolved.scalar))
        }
    }
}

fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Err(missing_required_field(node, name)),
        Some(_) => Ok(resolve_optional(node, name)?.unwrap_or_default()),
    }
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

fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => {
            if required {
                Err(missing_required_field(node, name))
            } else {
                Ok(ResolvedField::default())
            }
        }
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
            Ok(ResolvedField::from_items(
                rendered,
                separator_for(node.type_.as_str()),
                false,
                detect_field_trailing_sep(node, name),
            ))
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
    Ok(ResolvedField::from_items(
        children,
        separator_for(node.type_.as_str()),
        leading_sep,
        trailing_sep,
    ))
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
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = _ArrowFunctionUCallSignatureTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter", true)?;
    let template = _ArrowFunctionParameterTemplate {
        parameter: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_call_expression_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = CallExpressionCallTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_call_expression_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = CallExpressionMemberTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_call_expression_template_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallExpressionTemplateCallTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_class_body_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassBodyMemberTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_class_body_method_sig(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassBodyMethodSigTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_class_body_method(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let template = ClassBodyMethodTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
    };
    template.render()
}

fn render_hidden_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ClassHeritageExtendsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ClassHeritageImplementsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm_default_kw_value(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
        children: children.as_list_view(),
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm_default_kw(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration", false)?;
    let template = ExportStatementDefaultDeclArmDefaultKwTemplate {
        children: children.as_list_view(),
        declaration: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration", "decorator"])?;
    let field_0 = resolve_field(node, "declaration", false)?;
    let field_1 = resolve_field(node, "decorator", false)?;
    let template = ExportStatementDefaultDeclArmTemplate {
        children: children.as_list_view(),
        declaration: field_0.as_scalar(),
        decorator: field_1.as_field_view(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_clause_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmClauseFromTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_ns_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmNsFromTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_star_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmStarFromTemplate {
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementDefaultFromArmTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ExportStatementEqualsExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ExportStatementNamespaceExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", false)?;
    let template = _ExportStatementTypeExportTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_for_header_let_const_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left"])?;
    let field_0 = resolve_field(node, "kind", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let template = ForHeaderLetConstKindTemplate {
        children: children.as_list_view(),
        kind: field_0.as_scalar(),
        left: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_for_header_lhs(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let template = ForHeaderLhsTemplate {
        left: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_for_header_var_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left", "value"])?;
    let field_0 = resolve_field(node, "kind", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = ForHeaderVarKindTemplate {
        kind: field_0.as_scalar(),
        left: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ImportClauseDefaultImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ImportClauseNamedImportsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ImportClauseNamespaceImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_import_specifier_as(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = ImportSpecifierAsTemplate {
        alias: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = _ImportSpecifierNameTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_index_signature_colon(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "name"])?;
    let field_0 = resolve_field(node, "index_type", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = IndexSignatureColonTemplate {
        index_type: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _IndexSignatureMappedTypeClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = InitializerTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_interface_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = InterfaceBodyTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_lhs_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LhsExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_number(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = _NumberTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ParenthesizedExpressionSequenceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_parenthesized_expression_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let template = ParenthesizedExpressionTypedTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_property_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PropertyIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_public_field_definition_abstract_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker", true)?;
    let field_1 = resolve_field(node, "readonly_marker", false)?;
    let template = PublicFieldDefinitionAbstractFirstTemplate {
        abstract_marker: field_0.as_scalar(),
        readonly_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_access_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declare_marker"])?;
    let field_0 = resolve_field(node, "declare_marker", false)?;
    let template = PublicFieldDefinitionAccessFirstTemplate {
        children: children.as_list_view(),
        declare_marker: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_accessor_opt(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessor_marker"])?;
    let field_0 = resolve_field(node, "accessor_marker", true)?;
    let template = PublicFieldDefinitionAccessorOptTemplate {
        accessor_marker: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_declare_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PublicFieldDefinitionDeclareFirstTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_public_field_definition_readonly_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "readonly_marker", true)?;
    let template = PublicFieldDefinitionReadonlyFirstTemplate {
        abstract_marker: field_0.as_scalar(),
        readonly_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_static_mods(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["readonly_marker", "static_marker"])?;
    let field_0 = resolve_field(node, "readonly_marker", false)?;
    let field_1 = resolve_field(node, "static_marker", true)?;
    let template = PublicFieldDefinitionStaticModsTemplate {
        children: children.as_list_view(),
        readonly_marker: field_0.as_scalar(),
        static_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_statement_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StatementIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _StringDoubleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_fragment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringFragmentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _StringSingleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_type_query_call_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = TypeQueryCallExpressionInTypeAnnotationTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = TypeQueryCallExpressionTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = TypeQueryInstantiationExpressionTemplate {
        function: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_member_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = TypeQueryMemberExpressionInTypeAnnotationTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = TypeQueryMemberExpressionTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = TypeQuerySubscriptExpressionTemplate {
        index: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_update_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UpdateExpressionPostfixTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_update_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UpdateExpressionPrefixTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_abstract_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "class_heritage", false)?;
    let field_2 = resolve_field(node, "decorator", false)?;
    let field_3 = resolve_field(node, "name", true)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let template = AbstractClassDeclarationTemplate {
        body: field_0.as_scalar(),
        class_heritage: field_1.as_scalar(),
        decorator: field_2.as_field_view(),
        name: field_3.as_scalar(),
        type_parameters: field_4.as_scalar(),
    };
    template.render()
}

fn render_abstract_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
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
        accessibility_modifier: field_0.as_scalar(),
        accessor_kind: field_1.as_scalar(),
        name: field_2.as_scalar(),
        optional_marker: field_3.as_scalar(),
        override_modifier: field_4.as_scalar(),
        parameters: field_5.as_scalar(),
        return_type: field_6.as_scalar(),
        type_parameters: field_7.as_scalar(),
    };
    template.render()
}

fn render_adding_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AddingTypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_ambient_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration", true)?;
    let template = AmbientDeclarationTemplate {
        children: children.as_list_view(),
        declaration: field_0.as_field_view(),
    };
    template.render()
}

fn render_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArgumentsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_array_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArrayPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_array_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = ArrayTypeTemplate {
        primary_type: field_0.as_scalar(),
    };
    template.render()
}

fn render_array(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArrayTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = ArrowFunctionUCallSignatureTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter", true)?;
    let template = ArrowFunctionParameterTemplate {
        parameter: field_0.as_scalar(),
    };
    template.render()
}

fn render_arrow_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let template = ArrowFunctionTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
    };
    template.render()
}

fn render_as_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_annotation", true)?;
    let template = AsExpressionTemplate {
        children: children.as_list_view(),
        expression: field_0.as_scalar(),
        type_annotation: field_1.as_scalar(),
    };
    template.render()
}

fn render_asserts_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["asserts"])?;
    let field_0 = resolve_field(node, "asserts", true)?;
    let template = AssertsAnnotationTemplate {
        asserts: field_0.as_field_view(),
    };
    template.render()
}

fn render_asserts(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AssertsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "using_marker"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "using_marker", false)?;
    let template = AssignmentExpressionTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
        using_marker: field_2.as_scalar(),
    };
    template.render()
}

fn render_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = AssignmentPatternTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_augmented_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentExpressionTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = AwaitExpressionTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_binary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryExpressionTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_break_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = BreakStatementTemplate {
        label: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
    };
    template.render()
}

fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = CallExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = CallSignatureTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_catch_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameter", "type"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameter", false)?;
    let field_2 = resolve_field(node, "type", false)?;
    let template = CatchClauseTemplate {
        body: field_0.as_scalar(),
        parameter: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_class_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassBodyTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "automatic_semicolon", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "class_heritage", false)?;
    let field_3 = resolve_field(node, "decorator", false)?;
    let field_4 = resolve_field(node, "name", true)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = ClassDeclarationTemplate {
        automatic_semicolon: field_0.as_scalar(),
        body: field_1.as_scalar(),
        class_heritage: field_2.as_scalar(),
        decorator: field_3.as_field_view(),
        name: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassHeritageExtendsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassHeritageImplementsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_heritage(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassHeritageTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_static_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ClassStaticBlockTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_class(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "class_heritage", false)?;
    let field_2 = resolve_field(node, "decorator", false)?;
    let field_3 = resolve_field(node, "name", false)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let template = ClassTemplate {
        body: field_0.as_scalar(),
        class_heritage: field_1.as_scalar(),
        decorator: field_2.as_field_view(),
        name: field_3.as_scalar(),
        type_parameters: field_4.as_scalar(),
    };
    template.render()
}

fn render_computed_property_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ComputedPropertyNameTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_conditional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "consequence", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let field_2 = resolve_field(node, "left", true)?;
    let field_3 = resolve_field(node, "right", true)?;
    let template = ConditionalTypeTemplate {
        alternative: field_0.as_scalar(),
        consequence: field_1.as_scalar(),
        left: field_2.as_scalar(),
        right: field_3.as_scalar(),
    };
    template.render()
}

fn render_constraint(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ConstraintTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_construct_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "type", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ConstructSignatureTemplate {
        abstract_marker: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_constructor_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ConstructorTypeTemplate {
        abstract_marker: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_continue_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = ContinueStatementTemplate {
        label: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
    };
    template.render()
}

fn render_debugger_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = DebuggerStatementTemplate {
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_decorator_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = DecoratorCallExpressionTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_decorator_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = DecoratorMemberExpressionTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_decorator_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DecoratorParenthesizedExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DecoratorTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_default_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = DefaultTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_do_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "semicolon"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "semicolon", false)?;
    let template = DoStatementTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        semicolon: field_2.as_scalar(),
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["statement"])?;
    let field_0 = resolve_field(node, "statement", true)?;
    let template = ElseClauseTemplate {
        statement: field_0.as_scalar(),
    };
    template.render()
}

fn render_enum_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = EnumAssignmentTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_enum_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", false)?;
    let template = EnumBodyTemplate {
        children: children.as_list_view(),
        name: field_0.as_list_view(),
    };
    template.render()
}

fn render_enum_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "const_marker", "name"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "const_marker", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = EnumDeclarationTemplate {
        body: field_0.as_scalar(),
        const_marker: field_1.as_scalar(),
        name: field_2.as_scalar(),
    };
    template.render()
}

fn render_export_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_export_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "export_kind", "name"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "export_kind", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = ExportSpecifierTemplate {
        alias: field_0.as_scalar(),
        export_kind: field_1.as_scalar(),
        name: field_2.as_scalar(),
    };
    template.render()
}

fn render_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementEqualsExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementNamespaceExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", false)?;
    let template = ExportStatementTypeExportTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_export_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = ExpressionStatementTemplate {
        children: children.as_list_view(),
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments", "value"])?;
    let field_0 = resolve_field(node, "type_arguments", false)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = ExtendsClauseTemplate {
        type_arguments: field_0.as_field_view(),
        value: field_1.as_field_view(),
    };
    template.render()
}

fn render_extends_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ExtendsTypeClauseTemplate {
        r#type: field_0.as_field_view(),
    };
    template.render()
}

fn render_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "property", "static_marker", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "property", true)?;
    let field_2 = resolve_field(node, "static_marker", false)?;
    let field_3 = resolve_field(node, "value", false)?;
    let template = FieldDefinitionTemplate {
        decorator: field_0.as_field_view(),
        property: field_1.as_scalar(),
        static_marker: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = FinallyClauseTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_flow_maybe_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = FlowMaybeTypeTemplate {
        primary_type: field_0.as_scalar(),
    };
    template.render()
}

fn render_for_in_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["await_marker", "body", "operator", "right"])?;
    let field_0 = resolve_field(node, "await_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "operator", true)?;
    let field_3 = resolve_field(node, "right", true)?;
    let template = ForInStatementTemplate {
        children: children.as_list_view(),
        await_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        operator: field_2.as_scalar(),
        right: field_3.as_scalar(),
    };
    template.render()
}

fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "increment", "initializer"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "increment", false)?;
    let field_3 = resolve_field(node, "initializer", true)?;
    let template = ForStatementTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        increment: field_2.as_scalar(),
        initializer: field_3.as_scalar(),
    };
    template.render()
}

fn render_formal_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FormalParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionDeclarationTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_function_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", false)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionExpressionTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_function_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "name", "parameters", "return_type", "semicolon", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "return_type", false)?;
    let field_4 = resolve_field(node, "semicolon", true)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionSignatureTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        name: field_1.as_scalar(),
        parameters: field_2.as_scalar(),
        return_type: field_3.as_scalar(),
        semicolon: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionTypeTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_generator_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = GeneratorFunctionDeclarationTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_generator_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", false)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = GeneratorFunctionTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_arguments"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeTemplate {
        name: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfStatementTemplate {
        alternative: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImplementsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_alias(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let template = ImportAliasTemplate {
        children: children.as_list_view(),
        name: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_import_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let template = ImportAttributeTemplate {
        object: field_0.as_field_view(),
    };
    template.render()
}

fn render_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseDefaultImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseNamedImportsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseNamespaceImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_require_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "source"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "source", true)?;
    let template = ImportRequireClauseTemplate {
        identifier: field_0.as_scalar(),
        source: field_1.as_scalar(),
    };
    template.render()
}

fn render_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = ImportSpecifierNameTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_import_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_kind"])?;
    let field_0 = resolve_field(node, "import_kind", false)?;
    let template = ImportSpecifierTemplate {
        children: children.as_list_view(),
        import_kind: field_0.as_scalar(),
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_attribute", "import_clause", "semicolon", "source"])?;
    let field_0 = resolve_field(node, "import_attribute", false)?;
    let field_1 = resolve_field(node, "import_clause", false)?;
    let field_2 = resolve_field(node, "semicolon", true)?;
    let field_3 = resolve_field(node, "source", false)?;
    let template = ImportStatementTemplate {
        children: children.as_list_view(),
        import_attribute: field_0.as_scalar(),
        import_clause: field_1.as_scalar(),
        semicolon: field_2.as_scalar(),
        source: field_3.as_scalar(),
    };
    template.render()
}

fn render_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = IndexSignatureMappedTypeClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_index_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["sign", "type"])?;
    let field_0 = resolve_field(node, "sign", false)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = IndexSignatureTemplate {
        children: children.as_list_view(),
        sign: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_index_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = IndexTypeQueryTemplate {
        primary_type: field_0.as_scalar(),
    };
    template.render()
}

fn render_infer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_identifier"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let field_1 = resolve_field(node, "type_identifier", true)?;
    let template = InferTypeTemplate {
        r#type: field_0.as_scalar(),
        type_identifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = InstantiationExpressionTemplate {
        expression: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_interface_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "extends_type_clause", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "extends_type_clause", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = InterfaceDeclarationTemplate {
        body: field_0.as_scalar(),
        extends_type_clause: field_1.as_scalar(),
        name: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_internal_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = InternalModuleTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_intersection_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = IntersectionTypeTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_jsx_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = JsxAttributeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_jsx_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", false)?;
    let template = JsxClosingElementTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_jsx_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["close_tag", "open_tag"])?;
    let field_0 = resolve_field(node, "close_tag", true)?;
    let field_1 = resolve_field(node, "open_tag", true)?;
    let template = JsxElementTemplate {
        children: children.as_list_view(),
        close_tag: field_0.as_scalar(),
        open_tag: field_1.as_scalar(),
    };
    template.render()
}

fn render_jsx_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = JsxExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_jsx_namespace_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = JsxNamespaceNameTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_jsx_opening_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute", false)?;
    let field_1 = resolve_field(node, "name", false)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = JsxOpeningElementTemplate {
        attribute: field_0.as_field_view(),
        name: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_jsx_self_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute", false)?;
    let field_1 = resolve_field(node, "name", false)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = JsxSelfClosingElementTemplate {
        attribute: field_0.as_field_view(),
        name: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_labeled_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", true)?;
    let template = LabeledStatementTemplate {
        body: field_0.as_scalar(),
        label: field_1.as_scalar(),
    };
    template.render()
}

fn render_lexical_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "kind", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators", true)?;
    let field_1 = resolve_field(node, "kind", true)?;
    let field_2 = resolve_field(node, "semicolon", true)?;
    let template = LexicalDeclarationTemplate {
        declarators: field_0.as_field_view(),
        kind: field_1.as_scalar(),
        semicolon: field_2.as_scalar(),
    };
    template.render()
}

fn render_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LiteralTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_lookup_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "primary_type"])?;
    let field_0 = resolve_field(node, "index_type", true)?;
    let field_1 = resolve_field(node, "primary_type", true)?;
    let template = LookupTypeTemplate {
        index_type: field_0.as_scalar(),
        primary_type: field_1.as_scalar(),
    };
    template.render()
}

fn render_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name", "type"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = MappedTypeClauseTemplate {
        alias: field_0.as_scalar(),
        name: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "optional_chain", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "optional_chain", false)?;
    let field_2 = resolve_field(node, "property", true)?;
    let template = MemberExpressionTemplate {
        object: field_0.as_scalar(),
        optional_chain: field_1.as_scalar(),
        property: field_2.as_scalar(),
    };
    template.render()
}

fn render_method_definition(node: &NodeData) -> Result<String, ::askama::Error> {
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
        accessibility_modifier: field_0.as_scalar(),
        accessor_kind: field_1.as_scalar(),
        async_marker: field_2.as_scalar(),
        body: field_3.as_scalar(),
        name: field_4.as_scalar(),
        optional_marker: field_5.as_scalar(),
        override_modifier: field_6.as_scalar(),
        parameters: field_7.as_scalar(),
        readonly_marker: field_8.as_scalar(),
        return_type: field_9.as_scalar(),
        static_marker: field_10.as_scalar(),
        type_parameters: field_11.as_scalar(),
    };
    template.render()
}

fn render_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
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
        accessibility_modifier: field_0.as_scalar(),
        accessor_kind: field_1.as_scalar(),
        async_marker: field_2.as_scalar(),
        name: field_3.as_scalar(),
        optional_marker: field_4.as_scalar(),
        override_modifier: field_5.as_scalar(),
        parameters: field_6.as_scalar(),
        readonly_marker: field_7.as_scalar(),
        return_type: field_8.as_scalar(),
        static_marker: field_9.as_scalar(),
        type_parameters: field_10.as_scalar(),
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = ModuleTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = NamedImportsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = NamespaceExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = NamespaceImportTemplate {
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_nested_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = NestedIdentifierTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_nested_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module", "name"])?;
    let field_0 = resolve_field(node, "module", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = NestedTypeIdentifierTemplate {
        module: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_new_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "constructor", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "constructor", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = NewExpressionTemplate {
        arguments: field_0.as_scalar(),
        constructor: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_non_null_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = NonNullExpressionTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_object_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = ObjectAssignmentPatternTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_object_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ObjectPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_object_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["closing", "members", "opening"])?;
    let field_0 = resolve_field(node, "closing", true)?;
    let field_1 = resolve_field(node, "members", false)?;
    let field_2 = resolve_field(node, "opening", true)?;
    let template = ObjectTypeTemplate {
        closing: field_0.as_scalar(),
        members: field_1.as_field_view(),
        opening: field_2.as_scalar(),
    };
    template.render()
}

fn render_object(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ObjectTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_omitting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OmittingTypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_opting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OptingTypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_optional_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "readonly_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = OptionalParameterTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
        pattern: field_1.as_scalar(),
        readonly_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_optional_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = OptionalTupleParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_optional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OptionalTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_pair_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairPatternTemplate {
        key: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_pair(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairTemplate {
        key: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParenthesizedExpressionSequenceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParenthesizedExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_parenthesized_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ParenthesizedTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_program(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["hash_bang_line", "statements"])?;
    let field_0 = resolve_field(node, "hash_bang_line", false)?;
    let field_1 = resolve_field(node, "statements", false)?;
    let template = ProgramTemplate {
        hash_bang_line: field_0.as_scalar(),
        statements: field_1.as_field_view(),
    };
    template.render()
}

fn render_property_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "name", "optional_marker", "override_modifier", "readonly_marker", "static_marker", "type"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "optional_marker", false)?;
    let field_3 = resolve_field(node, "override_modifier", false)?;
    let field_4 = resolve_field(node, "readonly_marker", false)?;
    let field_5 = resolve_field(node, "static_marker", false)?;
    let field_6 = resolve_field(node, "type", false)?;
    let template = PropertySignatureTemplate {
        accessibility_modifier: field_0.as_scalar(),
        name: field_1.as_scalar(),
        optional_marker: field_2.as_scalar(),
        override_modifier: field_3.as_scalar(),
        readonly_marker: field_4.as_scalar(),
        static_marker: field_5.as_scalar(),
        r#type: field_6.as_scalar(),
    };
    template.render()
}

fn render_public_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "name", "optionality_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "optionality_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = PublicFieldDefinitionTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
        name: field_1.as_scalar(),
        optionality_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_readonly_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ReadonlyTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_regex(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["flags", "pattern"])?;
    let field_0 = resolve_field(node, "flags", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = RegexTemplate {
        flags: field_0.as_scalar(),
        pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_required_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "readonly_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = RequiredParameterTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
        pattern: field_1.as_scalar(),
        readonly_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_rest_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = RestPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_rest_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = RestTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = ReturnStatementTemplate {
        children: children.as_list_view(),
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_satisfies_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_annotation", true)?;
    let template = SatisfiesExpressionTemplate {
        expression: field_0.as_scalar(),
        type_annotation: field_1.as_scalar(),
    };
    template.render()
}

fn render_sequence_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SequenceExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_spread_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = SpreadElementTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_statement_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "statements"])?;
    let field_0 = resolve_field(node, "automatic_semicolon", false)?;
    let field_1 = resolve_field(node, "statements", false)?;
    let template = StatementBlockTemplate {
        automatic_semicolon: field_0.as_scalar(),
        statements: field_1.as_field_view(),
    };
    template.render()
}

fn render_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringDoubleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringSingleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object", "optional_chain"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let field_2 = resolve_field(node, "optional_chain", false)?;
    let template = SubscriptExpressionTemplate {
        index: field_0.as_scalar(),
        object: field_1.as_scalar(),
        optional_chain: field_2.as_scalar(),
    };
    template.render()
}

fn render_switch_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SwitchBodyTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_switch_case(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SwitchCaseTemplate {
        body: field_0.as_field_view(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_switch_default(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let template = SwitchDefaultTemplate {
        body: field_0.as_field_view(),
    };
    template.render()
}

fn render_switch_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SwitchStatementTemplate {
        body: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_template_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateLiteralTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_template_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateStringTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_template_substitution(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateSubstitutionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_template_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_ternary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = TernaryExpressionTemplate {
        alternative: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_throw_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = ThrowStatementTemplate {
        children: children.as_list_view(),
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "finalizer", "handler"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "finalizer", false)?;
    let field_2 = resolve_field(node, "handler", false)?;
    let template = TryStatementTemplate {
        body: field_0.as_scalar(),
        finalizer: field_1.as_scalar(),
        handler: field_2.as_scalar(),
    };
    template.render()
}

fn render_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TupleParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_tuple_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TupleTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_alias_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "type_parameters", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "value", true)?;
    let template = TypeAliasDeclarationTemplate {
        name: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = TypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_type_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeArgumentsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_assertion(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = TypeAssertionTemplate {
        expression: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["const_marker", "constraint", "name", "value"])?;
    let field_0 = resolve_field(node, "const_marker", false)?;
    let field_1 = resolve_field(node, "constraint", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "value", false)?;
    let template = TypeParameterTemplate {
        const_marker: field_0.as_scalar(),
        constraint: field_1.as_scalar(),
        name: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_type_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_predicate_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_predicate"])?;
    let field_0 = resolve_field(node, "type_predicate", true)?;
    let template = TypePredicateAnnotationTemplate {
        type_predicate: field_0.as_field_view(),
    };
    template.render()
}

fn render_type_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TypePredicateTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeQueryTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryExpressionTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_update_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = UpdateExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_variable_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = VariableDeclarationTemplate {
        declarators: field_0.as_field_view(),
        semicolon: field_1.as_scalar(),
    };
    template.render()
}

fn render_variable_declarator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", false)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = VariableDeclaratorTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
    };
    template.render()
}

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "object"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = WithStatementTemplate {
        body: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", false)?;
    let template = YieldExpressionTemplate {
        children: children.as_list_view(),
        expression: field_0.as_scalar(),
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
