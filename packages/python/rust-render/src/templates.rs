// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --rust-render
//
// Per-kind askama template structs + render_dispatch + GrammarMeta impl
// for the python grammar. Every struct in this file is backed by a
// sibling `.jinja` template under `templates/`, copied from
// `packages/python/templates/` at codegen time (spec 012 T030).
//
// Templates and fields are derived from:
//   - template bodies in packages/python/templates/*.jinja
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
    pub use ::sittir_core::filters::{
        upper, lower, joinby,
        isBlank, isPresent,
        joinWithTrailing, joinWithLeading, joinWithFlanks,
    };
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern_target.jinja", escape = "none")]
pub struct AsPatternTargetTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern.jinja", escape = "none")]
pub struct _AsPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_eq.jinja", escape = "none")]
pub struct AssignmentEqTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_type.jinja", escape = "none")]
pub struct AssignmentTypeTemplate {
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
#[template(path = "_assignment_typed.jinja", escape = "none")]
pub struct AssignmentTypedTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub right: String,
    pub right_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_comprehension_clauses.jinja", escape = "none")]
pub struct ComprehensionClausesTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_format_expression.jinja", escape = "none")]
pub struct FormatExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_match_block_block.jinja", escape = "none")]
pub struct MatchBlockBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_simple_pattern_negative.jinja", escape = "none")]
pub struct SimplePatternNegativeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_simple_statements.jinja", escape = "none")]
pub struct SimpleStatementsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_suite.jinja", escape = "none")]
pub struct SuiteTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_with_clause_paren.jinja", escape = "none")]
pub struct _WithClauseParenTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "aliased_import.jinja", escape = "none")]
pub struct AliasedImportTemplate {
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
#[template(path = "argument_list.jinja", escape = "none")]
pub struct ArgumentListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "as_pattern.jinja", escape = "none")]
pub struct AsPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub expression: String,
    pub expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "assert_statement.jinja", escape = "none")]
pub struct AssertStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "assignment.jinja", escape = "none")]
pub struct AssignmentTemplate {
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
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: String,
    pub attribute_list: Vec<String>,
    pub object: String,
    pub object_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment.jinja", escape = "none")]
pub struct AugmentedAssignmentTemplate {
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
#[template(path = "await.jinja", escape = "none")]
pub struct AwaitTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_expression: String,
    pub primary_expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "binary_operator.jinja", escape = "none")]
pub struct BinaryOperatorTemplate {
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
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "boolean_operator.jinja", escape = "none")]
pub struct BooleanOperatorTemplate {
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
#[template(path = "call.jinja", escape = "none")]
pub struct CallTemplate {
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
#[template(path = "case_clause.jinja", escape = "none")]
pub struct CaseClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub consequence: String,
    pub consequence_list: Vec<String>,
    pub guard: String,
    pub guard_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "case_pattern.jinja", escape = "none")]
pub struct CasePatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "chevron.jinja", escape = "none")]
pub struct ChevronTemplate {
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
#[template(path = "class_definition.jinja", escape = "none")]
pub struct ClassDefinitionTemplate {
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
    pub superclasses: String,
    pub superclasses_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "class_pattern.jinja", escape = "none")]
pub struct ClassPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub dotted_name: String,
    pub dotted_name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "comparison_operator.jinja", escape = "none")]
pub struct ComparisonOperatorTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub left: String,
    pub left_list: Vec<String>,
    pub operators: String,
    pub operators_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "complex_pattern.jinja", escape = "none")]
pub struct ComplexPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub imaginary: String,
    pub imaginary_list: Vec<String>,
    pub real: String,
    pub real_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "concatenated_string.jinja", escape = "none")]
pub struct ConcatenatedStringTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "conditional_expression.jinja", escape = "none")]
pub struct ConditionalExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "constrained_type.jinja", escape = "none")]
pub struct ConstrainedTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub base_type: String,
    pub base_type_list: Vec<String>,
    pub constraint: String,
    pub constraint_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "decorated_definition.jinja", escape = "none")]
pub struct DecoratedDefinitionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub definition: String,
    pub definition_list: Vec<String>,
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
    pub expression: String,
    pub expression_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "default_parameter.jinja", escape = "none")]
pub struct DefaultParameterTemplate {
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
#[template(path = "delete_statement.jinja", escape = "none")]
pub struct DeleteStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dict_pattern.jinja", escape = "none")]
pub struct DictPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_comprehension.jinja", escape = "none")]
pub struct DictionaryComprehensionTemplate {
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
#[template(path = "dictionary_splat_pattern.jinja", escape = "none")]
pub struct DictionarySplatPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat.jinja", escape = "none")]
pub struct DictionarySplatTemplate {
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
#[template(path = "dictionary.jinja", escape = "none")]
pub struct DictionaryTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dotted_name.jinja", escape = "none")]
pub struct DottedNameTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "elif_clause.jinja", escape = "none")]
pub struct ElifClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub condition: String,
    pub condition_list: Vec<String>,
    pub consequence: String,
    pub consequence_list: Vec<String>,
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
    pub body: String,
    pub body_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "except_clause.jinja", escape = "none")]
pub struct ExceptClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "exec_statement.jinja", escape = "none")]
pub struct ExecStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub code: String,
    pub code_list: Vec<String>,
    pub in_clause: String,
    pub in_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "expression_list.jinja", escape = "none")]
pub struct ExpressionListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_tuple.jinja", escape = "none")]
pub struct ExpressionStatementTupleTemplate {
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
    pub block: String,
    pub block_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "for_in_clause.jinja", escape = "none")]
pub struct ForInClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: String,
    pub async_marker_list: Vec<String>,
    pub left: String,
    pub left_list: Vec<String>,
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
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub async_marker: String,
    pub async_marker_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub left: String,
    pub left_list: Vec<String>,
    pub right: String,
    pub right_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "format_specifier.jinja", escape = "none")]
pub struct FormatSpecifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_definition.jinja", escape = "none")]
pub struct FunctionDefinitionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: String,
    pub async_marker_list: Vec<String>,
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
#[template(path = "future_import_statement.jinja", escape = "none")]
pub struct FutureImportStatementTemplate {
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
#[template(path = "generator_expression.jinja", escape = "none")]
pub struct GeneratorExpressionTemplate {
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
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: String,
    pub identifier_list: Vec<String>,
    pub type_parameter: String,
    pub type_parameter_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "global_statement.jinja", escape = "none")]
pub struct GlobalStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "if_clause.jinja", escape = "none")]
pub struct IfClauseTemplate {
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
#[template(path = "import_from_statement.jinja", escape = "none")]
pub struct ImportFromStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub module_name: String,
    pub module_name_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
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
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "interpolation.jinja", escape = "none")]
pub struct InterpolationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
    pub format_specifier: String,
    pub format_specifier_list: Vec<String>,
    pub type_conversion: String,
    pub type_conversion_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "keyword_argument.jinja", escape = "none")]
pub struct KeywordArgumentTemplate {
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
#[template(path = "keyword_pattern.jinja", escape = "none")]
pub struct KeywordPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: String,
    pub identifier_list: Vec<String>,
    pub simple_pattern: String,
    pub simple_pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_parameters.jinja", escape = "none")]
pub struct LambdaParametersTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lambda_within_for_in_clause.jinja", escape = "none")]
pub struct LambdaWithinForInClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "lambda.jinja", escape = "none")]
pub struct LambdaTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "list_comprehension.jinja", escape = "none")]
pub struct ListComprehensionTemplate {
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
#[template(path = "list_pattern.jinja", escape = "none")]
pub struct ListPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "list_splat_pattern.jinja", escape = "none")]
pub struct ListSplatPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "list_splat.jinja", escape = "none")]
pub struct ListSplatTemplate {
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
#[template(path = "list.jinja", escape = "none")]
pub struct ListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "match_statement.jinja", escape = "none")]
pub struct MatchStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub subject: String,
    pub subject_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "member_type.jinja", escape = "none")]
pub struct MemberTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub base_type: String,
    pub base_type_list: Vec<String>,
    pub identifier: String,
    pub identifier_list: Vec<String>,
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
}

#[derive(::askama::Template)]
#[template(path = "named_expression.jinja", escape = "none")]
pub struct NamedExpressionTemplate {
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
#[template(path = "nonlocal_statement.jinja", escape = "none")]
pub struct NonlocalStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "not_operator.jinja", escape = "none")]
pub struct NotOperatorTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
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
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "parenthesized_list_splat.jinja", escape = "none")]
pub struct ParenthesizedListSplatTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "pattern_list.jinja", escape = "none")]
pub struct PatternListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "print_statement.jinja", escape = "none")]
pub struct PrintStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "raise_statement.jinja", escape = "none")]
pub struct RaiseStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub cause: String,
    pub cause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "relative_import.jinja", escape = "none")]
pub struct RelativeImportTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub dotted_name: String,
    pub dotted_name_list: Vec<String>,
    pub import_prefix: String,
    pub import_prefix_list: Vec<String>,
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
}

#[derive(::askama::Template)]
#[template(path = "set_comprehension.jinja", escape = "none")]
pub struct SetComprehensionTemplate {
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
#[template(path = "set.jinja", escape = "none")]
pub struct SetTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "slice.jinja", escape = "none")]
pub struct SliceTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub start: String,
    pub start_list: Vec<String>,
    pub step: String,
    pub step_list: Vec<String>,
    pub stop: String,
    pub stop_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "splat_pattern.jinja", escape = "none")]
pub struct SplatPatternTemplate {
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
#[template(path = "splat_type.jinja", escape = "none")]
pub struct SplatTypeTemplate {
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
#[template(path = "string_content.jinja", escape = "none")]
pub struct StringContentTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "subscript.jinja", escape = "none")]
pub struct SubscriptTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub subscript: String,
    pub subscript_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
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
    pub else_clause: String,
    pub else_clause_list: Vec<String>,
    pub except_clauses: String,
    pub except_clauses_list: Vec<String>,
    pub finally_clause: String,
    pub finally_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "tuple.jinja", escape = "none")]
pub struct TupleTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_statement.jinja", escape = "none")]
pub struct TypeAliasStatementTemplate {
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
    pub r#type: String,
    pub r#type_list: Vec<String>,
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
}

#[derive(::askama::Template)]
#[template(path = "type.jinja", escape = "none")]
pub struct TypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "typed_default_parameter.jinja", escape = "none")]
pub struct TypedDefaultParameterTemplate {
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
#[template(path = "typed_parameter.jinja", escape = "none")]
pub struct TypedParameterTemplate {
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
#[template(path = "unary_operator.jinja", escape = "none")]
pub struct UnaryOperatorTemplate {
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
#[template(path = "union_pattern.jinja", escape = "none")]
pub struct UnionPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub condition: String,
    pub condition_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_bare.jinja", escape = "none")]
pub struct WithClauseBareTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_paren.jinja", escape = "none")]
pub struct WithClauseParenTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_clause.jinja", escape = "none")]
pub struct WithClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_item.jinja", escape = "none")]
pub struct WithItemTemplate {
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
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub async_marker: String,
    pub async_marker_list: Vec<String>,
    pub body: String,
    pub body_list: Vec<String>,
    pub with_clause: String,
    pub with_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "yield.jinja", escape = "none")]
pub struct YieldTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

use ::askama::Template as _AskamaTemplate;

/// Render the given NodeData kind using its generated askama template struct.
/// Matches on the source kind name (`_X` for hidden user-facing aliases,
/// `X` for visible) — mirrors what NodeData.$type carries at runtime.
///
/// The render uses `render_with_values(ctx.as_values())` so the
/// flank-aware filters (`joinWithTrailing` / `joinWithLeading` /
/// `joinWithFlanks`) can read `trailing_anon` / `leading_anon` from
/// the context — matching the TS engine's `_trailing_anon` /
/// `_leading_anon` side-channel on the children array.
pub fn render_dispatch(
    kind: &str,
    ctx: &::sittir_core::prepare::TemplateContext,
) -> Result<String, ::askama::Error> {
    let _values = ctx.as_values();
    match kind {
        "_as_pattern_target" => {
            let t = AsPatternTargetTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_as_pattern" => {
            let t = _AsPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_assignment_eq" => {
            let t = AssignmentEqTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_assignment_type" => {
            let t = AssignmentTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_assignment_typed" => {
            let t = AssignmentTypedTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_comprehension_clauses" => {
            let t = ComprehensionClausesTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_format_expression" => {
            let t = FormatExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_match_block_block" => {
            let t = MatchBlockBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_match_block" => {
            let t = MatchBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_simple_pattern_negative" => {
            let t = SimplePatternNegativeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_simple_statements" => {
            let t = SimpleStatementsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_suite" => {
            let t = SuiteTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_with_clause_paren" => {
            let t = _WithClauseParenTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "aliased_import" => {
            let t = AliasedImportTemplate {
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
            t.render_with_values(&_values)
        }
        "argument_list" => {
            let t = ArgumentListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "as_pattern" => {
            let t = AsPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "assert_statement" => {
            let t = AssertStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "assignment" => {
            let t = AssignmentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "attribute" => {
            let t = AttributeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attribute: ctx.fields.get("attribute").cloned().unwrap_or_default(),
                attribute_list: ctx.fields_list.get("attribute").cloned().unwrap_or_default(),
                object: ctx.fields.get("object").cloned().unwrap_or_default(),
                object_list: ctx.fields_list.get("object").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "augmented_assignment" => {
            let t = AugmentedAssignmentTemplate {
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
            t.render_with_values(&_values)
        }
        "await" => {
            let t = AwaitTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                primary_expression: ctx.fields.get("primary_expression").cloned().unwrap_or_default(),
                primary_expression_list: ctx.fields_list.get("primary_expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "binary_operator" => {
            let t = BinaryOperatorTemplate {
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
            t.render_with_values(&_values)
        }
        "block" => {
            let t = BlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "boolean_operator" => {
            let t = BooleanOperatorTemplate {
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
            t.render_with_values(&_values)
        }
        "call" => {
            let t = CallTemplate {
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
            t.render_with_values(&_values)
        }
        "case_clause" => {
            let t = CaseClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                consequence: ctx.fields.get("consequence").cloned().unwrap_or_default(),
                consequence_list: ctx.fields_list.get("consequence").cloned().unwrap_or_default(),
                guard: ctx.fields.get("guard").cloned().unwrap_or_default(),
                guard_list: ctx.fields_list.get("guard").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "case_pattern" => {
            let t = CasePatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "chevron" => {
            let t = ChevronTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "class_definition" => {
            let t = ClassDefinitionTemplate {
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
                superclasses: ctx.fields.get("superclasses").cloned().unwrap_or_default(),
                superclasses_list: ctx.fields_list.get("superclasses").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "class_pattern" => {
            let t = ClassPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                dotted_name: ctx.fields.get("dotted_name").cloned().unwrap_or_default(),
                dotted_name_list: ctx.fields_list.get("dotted_name").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "comparison_operator" => {
            let t = ComparisonOperatorTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                operators: ctx.fields.get("operators").cloned().unwrap_or_default(),
                operators_list: ctx.fields_list.get("operators").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "complex_pattern" => {
            let t = ComplexPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                imaginary: ctx.fields.get("imaginary").cloned().unwrap_or_default(),
                imaginary_list: ctx.fields_list.get("imaginary").cloned().unwrap_or_default(),
                real: ctx.fields.get("real").cloned().unwrap_or_default(),
                real_list: ctx.fields_list.get("real").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "concatenated_string" => {
            let t = ConcatenatedStringTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "conditional_expression" => {
            let t = ConditionalExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "constrained_type" => {
            let t = ConstrainedTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                base_type: ctx.fields.get("base_type").cloned().unwrap_or_default(),
                base_type_list: ctx.fields_list.get("base_type").cloned().unwrap_or_default(),
                constraint: ctx.fields.get("constraint").cloned().unwrap_or_default(),
                constraint_list: ctx.fields_list.get("constraint").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "decorated_definition" => {
            let t = DecoratedDefinitionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                definition: ctx.fields.get("definition").cloned().unwrap_or_default(),
                definition_list: ctx.fields_list.get("definition").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "decorator" => {
            let t = DecoratorTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "default_parameter" => {
            let t = DefaultParameterTemplate {
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
            t.render_with_values(&_values)
        }
        "delete_statement" => {
            let t = DeleteStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "dict_pattern" => {
            let t = DictPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "dictionary_comprehension" => {
            let t = DictionaryComprehensionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "dictionary_splat_pattern" => {
            let t = DictionarySplatPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "dictionary_splat" => {
            let t = DictionarySplatTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "dictionary" => {
            let t = DictionaryTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "dotted_name" => {
            let t = DottedNameTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "elif_clause" => {
            let t = ElifClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
                consequence: ctx.fields.get("consequence").cloned().unwrap_or_default(),
                consequence_list: ctx.fields_list.get("consequence").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "else_clause" => {
            let t = ElseClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "except_clause" => {
            let t = ExceptClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "exec_statement" => {
            let t = ExecStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                code: ctx.fields.get("code").cloned().unwrap_or_default(),
                code_list: ctx.fields_list.get("code").cloned().unwrap_or_default(),
                in_clause: ctx.fields.get("in_clause").cloned().unwrap_or_default(),
                in_clause_list: ctx.fields_list.get("in_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "expression_list" => {
            let t = ExpressionListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "expression_statement_tuple" => {
            let t = ExpressionStatementTupleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "expression_statement" => {
            let t = ExpressionStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "finally_clause" => {
            let t = FinallyClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                block: ctx.fields.get("block").cloned().unwrap_or_default(),
                block_list: ctx.fields_list.get("block").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "for_in_clause" => {
            let t = ForInClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                async_marker: ctx.fields.get("async_marker").cloned().unwrap_or_default(),
                async_marker_list: ctx.fields_list.get("async_marker").cloned().unwrap_or_default(),
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "for_statement" => {
            let t = ForStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                async_marker: ctx.fields.get("async_marker").cloned().unwrap_or_default(),
                async_marker_list: ctx.fields_list.get("async_marker").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
                right: ctx.fields.get("right").cloned().unwrap_or_default(),
                right_list: ctx.fields_list.get("right").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "format_specifier" => {
            let t = FormatSpecifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "function_definition" => {
            let t = FunctionDefinitionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                async_marker: ctx.fields.get("async_marker").cloned().unwrap_or_default(),
                async_marker_list: ctx.fields_list.get("async_marker").cloned().unwrap_or_default(),
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
            t.render_with_values(&_values)
        }
        "future_import_statement" => {
            let t = FutureImportStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "generator_expression" => {
            let t = GeneratorExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "generic_type" => {
            let t = GenericTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
                type_parameter: ctx.fields.get("type_parameter").cloned().unwrap_or_default(),
                type_parameter_list: ctx.fields_list.get("type_parameter").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "global_statement" => {
            let t = GlobalStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "if_clause" => {
            let t = IfClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "import_from_statement" => {
            let t = ImportFromStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                module_name: ctx.fields.get("module_name").cloned().unwrap_or_default(),
                module_name_list: ctx.fields_list.get("module_name").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "import_statement" => {
            let t = ImportStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "interpolation" => {
            let t = InterpolationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
                format_specifier: ctx.fields.get("format_specifier").cloned().unwrap_or_default(),
                format_specifier_list: ctx.fields_list.get("format_specifier").cloned().unwrap_or_default(),
                type_conversion: ctx.fields.get("type_conversion").cloned().unwrap_or_default(),
                type_conversion_list: ctx.fields_list.get("type_conversion").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "keyword_argument" => {
            let t = KeywordArgumentTemplate {
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
            t.render_with_values(&_values)
        }
        "keyword_pattern" => {
            let t = KeywordPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
                simple_pattern: ctx.fields.get("simple_pattern").cloned().unwrap_or_default(),
                simple_pattern_list: ctx.fields_list.get("simple_pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "lambda_parameters" => {
            let t = LambdaParametersTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "lambda_within_for_in_clause" => {
            let t = LambdaWithinForInClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "lambda" => {
            let t = LambdaTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "list_comprehension" => {
            let t = ListComprehensionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "list_pattern" => {
            let t = ListPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "list_splat_pattern" => {
            let t = ListSplatPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "list_splat" => {
            let t = ListSplatTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "list" => {
            let t = ListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "match_statement" => {
            let t = MatchStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                subject: ctx.fields.get("subject").cloned().unwrap_or_default(),
                subject_list: ctx.fields_list.get("subject").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "member_type" => {
            let t = MemberTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                base_type: ctx.fields.get("base_type").cloned().unwrap_or_default(),
                base_type_list: ctx.fields_list.get("base_type").cloned().unwrap_or_default(),
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "module" => {
            let t = ModuleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "named_expression" => {
            let t = NamedExpressionTemplate {
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
            t.render_with_values(&_values)
        }
        "nonlocal_statement" => {
            let t = NonlocalStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "not_operator" => {
            let t = NotOperatorTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "parameters" => {
            let t = ParametersTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "parenthesized_list_splat" => {
            let t = ParenthesizedListSplatTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "pattern_list" => {
            let t = PatternListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "print_statement" => {
            let t = PrintStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "raise_statement" => {
            let t = RaiseStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                cause: ctx.fields.get("cause").cloned().unwrap_or_default(),
                cause_list: ctx.fields_list.get("cause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "relative_import" => {
            let t = RelativeImportTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                dotted_name: ctx.fields.get("dotted_name").cloned().unwrap_or_default(),
                dotted_name_list: ctx.fields_list.get("dotted_name").cloned().unwrap_or_default(),
                import_prefix: ctx.fields.get("import_prefix").cloned().unwrap_or_default(),
                import_prefix_list: ctx.fields_list.get("import_prefix").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "return_statement" => {
            let t = ReturnStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "set_comprehension" => {
            let t = SetComprehensionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "set" => {
            let t = SetTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "slice" => {
            let t = SliceTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                start: ctx.fields.get("start").cloned().unwrap_or_default(),
                start_list: ctx.fields_list.get("start").cloned().unwrap_or_default(),
                step: ctx.fields.get("step").cloned().unwrap_or_default(),
                step_list: ctx.fields_list.get("step").cloned().unwrap_or_default(),
                stop: ctx.fields.get("stop").cloned().unwrap_or_default(),
                stop_list: ctx.fields_list.get("stop").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "splat_pattern" => {
            let t = SplatPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "splat_type" => {
            let t = SplatTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "string_content" => {
            let t = StringContentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "subscript" => {
            let t = SubscriptTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                subscript: ctx.fields.get("subscript").cloned().unwrap_or_default(),
                subscript_list: ctx.fields_list.get("subscript").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
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
                else_clause: ctx.fields.get("else_clause").cloned().unwrap_or_default(),
                else_clause_list: ctx.fields_list.get("else_clause").cloned().unwrap_or_default(),
                except_clauses: ctx.fields.get("except_clauses").cloned().unwrap_or_default(),
                except_clauses_list: ctx.fields_list.get("except_clauses").cloned().unwrap_or_default(),
                finally_clause: ctx.fields.get("finally_clause").cloned().unwrap_or_default(),
                finally_clause_list: ctx.fields_list.get("finally_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "tuple_pattern" => {
            let t = TuplePatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "tuple" => {
            let t = TupleTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "type_alias_statement" => {
            let t = TypeAliasStatementTemplate {
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
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "type_parameter" => {
            let t = TypeParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "type" => {
            let t = TypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "typed_default_parameter" => {
            let t = TypedDefaultParameterTemplate {
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
            t.render_with_values(&_values)
        }
        "typed_parameter" => {
            let t = TypedParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "unary_operator" => {
            let t = UnaryOperatorTemplate {
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
            t.render_with_values(&_values)
        }
        "union_pattern" => {
            let t = UnionPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "while_statement" => {
            let t = WhileStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "with_clause_bare" => {
            let t = WithClauseBareTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "with_clause_paren" => {
            let t = WithClauseParenTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "with_clause" => {
            let t = WithClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "with_item" => {
            let t = WithItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "with_statement" => {
            let t = WithStatementTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                async_marker: ctx.fields.get("async_marker").cloned().unwrap_or_default(),
                async_marker_list: ctx.fields_list.get("async_marker").cloned().unwrap_or_default(),
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                with_clause: ctx.fields.get("with_clause").cloned().unwrap_or_default(),
                with_clause_list: ctx.fields_list.get("with_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "yield" => {
            let t = YieldTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        other => Err(::askama::Error::Custom(
            format!("render_dispatch: no template for kind '{}'", other).into(),
        )),
    }
}

/// Per-grammar metadata — separator / variant-label / list-container tables.
/// Implements the `sittir_core::prepare::GrammarMeta` trait.
pub struct PythonGrammarMeta;

impl ::sittir_core::prepare::GrammarMeta for PythonGrammarMeta {
    fn separator_for(&self, kind: &str) -> Option<&str> {
        match kind {
            "_with_clause_paren" => Some(","),
            "dict_pattern" => Some(","),
            "dictionary" => Some(","),
            "dotted_name" => Some("."),
            "expression_statement_tuple" => Some(","),
            "lambda_parameters" => Some(","),
            "set" => Some(","),
            "type_parameter" => Some(","),
            "with_clause_bare" => Some(","),
            "with_clause_paren" => Some(","),
            _ => None,
        }
    }
    fn variant_for(&self, parent_kind: &str, child_kind: &str) -> Option<&str> {
        match (parent_kind, child_kind) {
            ("assignment", "assignment__form_eq") => Some("eq"),
            ("assignment", "assignment__form_type") => Some("type"),
            ("assignment", "assignment__form_typed") => Some("typed"),
            ("assignment", "assignment_eq") => Some("eq"),
            ("assignment", "assignment_type") => Some("eq"),
            ("assignment", "assignment_typed") => Some("eq"),
            ("expression_statement", "expression_statement__form_tuple") => Some("tuple"),
            ("expression_statement", "expression_statement_tuple") => Some("tuple"),
            ("with_clause", "with_clause__form_bare") => Some("bare"),
            ("with_clause", "with_clause__form_paren") => Some("paren"),
            ("with_clause", "with_clause_bare") => Some("bare"),
            ("with_clause", "with_clause_paren") => Some("bare"),
            _ => None,
        }
    }
    fn is_list_container(&self, kind: &str) -> bool {
        matches!(kind,
            "_as_pattern" | "_as_pattern_target" | "_comprehension_clauses" | "_format_expression" | "_match_block" | "_simple_pattern_negative" | "_simple_statements" | "_suite" | "_with_clause_paren" | "argument_list" | "assert_statement" | "block" | "case_pattern" | "concatenated_string" | "delete_statement" | "dict_pattern" | "dictionary" | "dictionary_splat_pattern" | "dotted_name" | "expression_list" | "expression_statement_tuple" | "format_specifier" | "global_statement" | "lambda_parameters" | "list" | "list_pattern" | "list_splat_pattern" | "module" | "nonlocal_statement" | "parameters" | "parenthesized_expression" | "parenthesized_list_splat" | "pattern_list" | "return_statement" | "set" | "string_content" | "tuple" | "tuple_pattern" | "type" | "type_parameter" | "union_pattern" | "with_clause_bare" | "with_clause_paren" | "yield"
        )
    }
}
