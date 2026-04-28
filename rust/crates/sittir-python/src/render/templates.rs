// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
//
// Per-kind askama template structs + direct render helpers + render_dispatch
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
#[template(path = "_as_pattern_target.jinja", escape = "none")]
pub struct AsPatternTargetTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern.jinja", escape = "none")]
pub struct _AsPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_eq.jinja", escape = "none")]
pub struct AssignmentEqTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_type.jinja", escape = "none")]
pub struct AssignmentTypeTemplate<'a> {
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
#[template(path = "_assignment_typed.jinja", escape = "none")]
pub struct AssignmentTypedTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub right: &'a str,
    pub right_list: &'a [String],
    pub right_leading_sep: bool,
    pub right_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_comprehension_clauses.jinja", escape = "none")]
pub struct ComprehensionClausesTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_format_expression.jinja", escape = "none")]
pub struct FormatExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_match_block_block.jinja", escape = "none")]
pub struct MatchBlockBlockTemplate<'a> {
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
}

#[derive(::askama::Template)]
#[template(path = "_match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_simple_pattern_negative.jinja", escape = "none")]
pub struct SimplePatternNegativeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_simple_statements.jinja", escape = "none")]
pub struct SimpleStatementsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_suite.jinja", escape = "none")]
pub struct SuiteTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_with_clause_paren.jinja", escape = "none")]
pub struct _WithClauseParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "aliased_import.jinja", escape = "none")]
pub struct AliasedImportTemplate<'a> {
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
#[template(path = "argument_list.jinja", escape = "none")]
pub struct ArgumentListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "as_pattern.jinja", escape = "none")]
pub struct AsPatternTemplate<'a> {
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
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "assert_statement.jinja", escape = "none")]
pub struct AssertStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "assignment.jinja", escape = "none")]
pub struct AssignmentTemplate<'a> {
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
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
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
    pub object: &'a str,
    pub object_list: &'a [String],
    pub object_leading_sep: bool,
    pub object_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment.jinja", escape = "none")]
pub struct AugmentedAssignmentTemplate<'a> {
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
#[template(path = "await.jinja", escape = "none")]
pub struct AwaitTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub primary_expression: &'a str,
    pub primary_expression_list: &'a [String],
    pub primary_expression_leading_sep: bool,
    pub primary_expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "binary_operator.jinja", escape = "none")]
pub struct BinaryOperatorTemplate<'a> {
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
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "boolean_operator.jinja", escape = "none")]
pub struct BooleanOperatorTemplate<'a> {
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
#[template(path = "call.jinja", escape = "none")]
pub struct CallTemplate<'a> {
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
#[template(path = "case_clause.jinja", escape = "none")]
pub struct CaseClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub consequence: &'a str,
    pub consequence_list: &'a [String],
    pub consequence_leading_sep: bool,
    pub consequence_trailing_sep: bool,
    pub guard: &'a str,
    pub guard_list: &'a [String],
    pub guard_leading_sep: bool,
    pub guard_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "case_pattern.jinja", escape = "none")]
pub struct CasePatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "chevron.jinja", escape = "none")]
pub struct ChevronTemplate<'a> {
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
#[template(path = "class_definition.jinja", escape = "none")]
pub struct ClassDefinitionTemplate<'a> {
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
    pub superclasses: &'a str,
    pub superclasses_list: &'a [String],
    pub superclasses_leading_sep: bool,
    pub superclasses_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "class_pattern.jinja", escape = "none")]
pub struct ClassPatternTemplate<'a> {
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
    pub dotted_name: &'a str,
    pub dotted_name_list: &'a [String],
    pub dotted_name_leading_sep: bool,
    pub dotted_name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "comparison_operator.jinja", escape = "none")]
pub struct ComparisonOperatorTemplate<'a> {
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
    pub operators: &'a str,
    pub operators_list: &'a [String],
    pub operators_leading_sep: bool,
    pub operators_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "complex_pattern.jinja", escape = "none")]
pub struct ComplexPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub imaginary: &'a str,
    pub imaginary_list: &'a [String],
    pub imaginary_leading_sep: bool,
    pub imaginary_trailing_sep: bool,
    pub real: &'a str,
    pub real_list: &'a [String],
    pub real_leading_sep: bool,
    pub real_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "concatenated_string.jinja", escape = "none")]
pub struct ConcatenatedStringTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "conditional_expression.jinja", escape = "none")]
pub struct ConditionalExpressionTemplate<'a> {
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
#[template(path = "constrained_type.jinja", escape = "none")]
pub struct ConstrainedTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub base_type: &'a str,
    pub base_type_list: &'a [String],
    pub base_type_leading_sep: bool,
    pub base_type_trailing_sep: bool,
    pub constraint: &'a str,
    pub constraint_list: &'a [String],
    pub constraint_leading_sep: bool,
    pub constraint_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "decorated_definition.jinja", escape = "none")]
pub struct DecoratedDefinitionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub definition: &'a str,
    pub definition_list: &'a [String],
    pub definition_leading_sep: bool,
    pub definition_trailing_sep: bool,
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
    pub expression: &'a str,
    pub expression_list: &'a [String],
    pub expression_leading_sep: bool,
    pub expression_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "default_parameter.jinja", escape = "none")]
pub struct DefaultParameterTemplate<'a> {
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
#[template(path = "delete_statement.jinja", escape = "none")]
pub struct DeleteStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dict_pattern.jinja", escape = "none")]
pub struct DictPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_comprehension.jinja", escape = "none")]
pub struct DictionaryComprehensionTemplate<'a> {
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
#[template(path = "dictionary_splat_pattern.jinja", escape = "none")]
pub struct DictionarySplatPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat.jinja", escape = "none")]
pub struct DictionarySplatTemplate<'a> {
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
#[template(path = "dictionary.jinja", escape = "none")]
pub struct DictionaryTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dotted_name.jinja", escape = "none")]
pub struct DottedNameTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "elif_clause.jinja", escape = "none")]
pub struct ElifClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
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
#[template(path = "except_clause.jinja", escape = "none")]
pub struct ExceptClauseTemplate<'a> {
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
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "exec_statement.jinja", escape = "none")]
pub struct ExecStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub code: &'a str,
    pub code_list: &'a [String],
    pub code_leading_sep: bool,
    pub code_trailing_sep: bool,
    pub in_clause: &'a str,
    pub in_clause_list: &'a [String],
    pub in_clause_leading_sep: bool,
    pub in_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_list.jinja", escape = "none")]
pub struct ExpressionListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_tuple.jinja", escape = "none")]
pub struct ExpressionStatementTupleTemplate<'a> {
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
    pub block: &'a str,
    pub block_list: &'a [String],
    pub block_leading_sep: bool,
    pub block_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "for_in_clause.jinja", escape = "none")]
pub struct ForInClauseTemplate<'a> {
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
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
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
    pub async_marker: &'a str,
    pub async_marker_list: &'a [String],
    pub async_marker_leading_sep: bool,
    pub async_marker_trailing_sep: bool,
    pub body: &'a str,
    pub body_list: &'a [String],
    pub body_leading_sep: bool,
    pub body_trailing_sep: bool,
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
#[template(path = "format_specifier.jinja", escape = "none")]
pub struct FormatSpecifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_definition.jinja", escape = "none")]
pub struct FunctionDefinitionTemplate<'a> {
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
#[template(path = "future_import_statement.jinja", escape = "none")]
pub struct FutureImportStatementTemplate<'a> {
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
#[template(path = "generator_expression.jinja", escape = "none")]
pub struct GeneratorExpressionTemplate<'a> {
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
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
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
    pub type_parameter: &'a str,
    pub type_parameter_list: &'a [String],
    pub type_parameter_leading_sep: bool,
    pub type_parameter_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "global_statement.jinja", escape = "none")]
pub struct GlobalStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "if_clause.jinja", escape = "none")]
pub struct IfClauseTemplate<'a> {
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
#[template(path = "import_from_statement.jinja", escape = "none")]
pub struct ImportFromStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub module_name: &'a str,
    pub module_name_list: &'a [String],
    pub module_name_leading_sep: bool,
    pub module_name_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
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
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "interpolation.jinja", escape = "none")]
pub struct InterpolationTemplate<'a> {
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
    pub format_specifier: &'a str,
    pub format_specifier_list: &'a [String],
    pub format_specifier_leading_sep: bool,
    pub format_specifier_trailing_sep: bool,
    pub type_conversion: &'a str,
    pub type_conversion_list: &'a [String],
    pub type_conversion_leading_sep: bool,
    pub type_conversion_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "keyword_argument.jinja", escape = "none")]
pub struct KeywordArgumentTemplate<'a> {
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
#[template(path = "keyword_pattern.jinja", escape = "none")]
pub struct KeywordPatternTemplate<'a> {
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
    pub simple_pattern: &'a str,
    pub simple_pattern_list: &'a [String],
    pub simple_pattern_leading_sep: bool,
    pub simple_pattern_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lambda_parameters.jinja", escape = "none")]
pub struct LambdaParametersTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lambda_within_for_in_clause.jinja", escape = "none")]
pub struct LambdaWithinForInClauseTemplate<'a> {
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
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lambda.jinja", escape = "none")]
pub struct LambdaTemplate<'a> {
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
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "list_comprehension.jinja", escape = "none")]
pub struct ListComprehensionTemplate<'a> {
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
#[template(path = "list_pattern.jinja", escape = "none")]
pub struct ListPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "list_splat_pattern.jinja", escape = "none")]
pub struct ListSplatPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "list_splat.jinja", escape = "none")]
pub struct ListSplatTemplate<'a> {
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
#[template(path = "list.jinja", escape = "none")]
pub struct ListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "match_statement.jinja", escape = "none")]
pub struct MatchStatementTemplate<'a> {
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
    pub subject: &'a str,
    pub subject_list: &'a [String],
    pub subject_leading_sep: bool,
    pub subject_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "member_type.jinja", escape = "none")]
pub struct MemberTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub base_type: &'a str,
    pub base_type_list: &'a [String],
    pub base_type_leading_sep: bool,
    pub base_type_trailing_sep: bool,
    pub identifier: &'a str,
    pub identifier_list: &'a [String],
    pub identifier_leading_sep: bool,
    pub identifier_trailing_sep: bool,
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
}

#[derive(::askama::Template)]
#[template(path = "named_expression.jinja", escape = "none")]
pub struct NamedExpressionTemplate<'a> {
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
#[template(path = "nonlocal_statement.jinja", escape = "none")]
pub struct NonlocalStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "not_operator.jinja", escape = "none")]
pub struct NotOperatorTemplate<'a> {
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
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate<'a> {
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
#[template(path = "parenthesized_list_splat.jinja", escape = "none")]
pub struct ParenthesizedListSplatTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "pattern_list.jinja", escape = "none")]
pub struct PatternListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "print_statement.jinja", escape = "none")]
pub struct PrintStatementTemplate<'a> {
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
}

#[derive(::askama::Template)]
#[template(path = "raise_statement.jinja", escape = "none")]
pub struct RaiseStatementTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub cause: &'a str,
    pub cause_list: &'a [String],
    pub cause_leading_sep: bool,
    pub cause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "relative_import.jinja", escape = "none")]
pub struct RelativeImportTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub dotted_name: &'a str,
    pub dotted_name_list: &'a [String],
    pub dotted_name_leading_sep: bool,
    pub dotted_name_trailing_sep: bool,
    pub import_prefix: &'a str,
    pub import_prefix_list: &'a [String],
    pub import_prefix_leading_sep: bool,
    pub import_prefix_trailing_sep: bool,
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
}

#[derive(::askama::Template)]
#[template(path = "set_comprehension.jinja", escape = "none")]
pub struct SetComprehensionTemplate<'a> {
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
#[template(path = "set.jinja", escape = "none")]
pub struct SetTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "slice.jinja", escape = "none")]
pub struct SliceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub start: &'a str,
    pub start_list: &'a [String],
    pub start_leading_sep: bool,
    pub start_trailing_sep: bool,
    pub step: &'a str,
    pub step_list: &'a [String],
    pub step_leading_sep: bool,
    pub step_trailing_sep: bool,
    pub stop: &'a str,
    pub stop_list: &'a [String],
    pub stop_leading_sep: bool,
    pub stop_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "splat_pattern.jinja", escape = "none")]
pub struct SplatPatternTemplate<'a> {
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
#[template(path = "splat_type.jinja", escape = "none")]
pub struct SplatTypeTemplate<'a> {
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
#[template(path = "string_content.jinja", escape = "none")]
pub struct StringContentTemplate<'a> {
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
#[template(path = "subscript.jinja", escape = "none")]
pub struct SubscriptTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub subscript: &'a str,
    pub subscript_list: &'a [String],
    pub subscript_leading_sep: bool,
    pub subscript_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
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
    pub else_clause: &'a str,
    pub else_clause_list: &'a [String],
    pub else_clause_leading_sep: bool,
    pub else_clause_trailing_sep: bool,
    pub except_clauses: &'a str,
    pub except_clauses_list: &'a [String],
    pub except_clauses_leading_sep: bool,
    pub except_clauses_trailing_sep: bool,
    pub finally_clause: &'a str,
    pub finally_clause_list: &'a [String],
    pub finally_clause_leading_sep: bool,
    pub finally_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "tuple.jinja", escape = "none")]
pub struct TupleTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_statement.jinja", escape = "none")]
pub struct TypeAliasStatementTemplate<'a> {
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
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
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
}

#[derive(::askama::Template)]
#[template(path = "type.jinja", escape = "none")]
pub struct TypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "typed_default_parameter.jinja", escape = "none")]
pub struct TypedDefaultParameterTemplate<'a> {
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
#[template(path = "typed_parameter.jinja", escape = "none")]
pub struct TypedParameterTemplate<'a> {
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
#[template(path = "unary_operator.jinja", escape = "none")]
pub struct UnaryOperatorTemplate<'a> {
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
#[template(path = "union_pattern.jinja", escape = "none")]
pub struct UnionPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
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
#[template(path = "with_clause_bare.jinja", escape = "none")]
pub struct WithClauseBareTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_paren.jinja", escape = "none")]
pub struct WithClauseParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_clause.jinja", escape = "none")]
pub struct WithClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "with_item.jinja", escape = "none")]
pub struct WithItemTemplate<'a> {
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
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
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
    pub with_clause: &'a str,
    pub with_clause_list: &'a [String],
    pub with_clause_leading_sep: bool,
    pub with_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "yield.jinja", escape = "none")]
pub struct YieldTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
        "_with_clause_paren" => ",",
        "dict_pattern" => ",",
        "dictionary" => ",",
        "dotted_name" => ".",
        "expression_statement_tuple" => ",",
        "lambda_parameters" => ",",
        "set" => ",",
        "type_parameter" => ",",
        "with_clause_bare" => ",",
        "with_clause_paren" => ",",
        _ => "",
    }
}

fn variant_for(parent_kind: &str, child_kind: &str) -> Option<&'static str> {
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

fn render_hidden_as_pattern_target(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AsPatternTargetTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _AsPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_assignment_eq(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssignmentEqTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        right: field_0.scalar.as_str(),
        right_list: field_0.items.as_slice(),
        right_leading_sep: field_0.leading_sep,
        right_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_assignment_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssignmentTypeTemplate {
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

fn render_hidden_assignment_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right", "type"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssignmentTypedTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        right: field_0.scalar.as_str(),
        right_list: field_0.items.as_slice(),
        right_leading_sep: field_0.leading_sep,
        right_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_comprehension_clauses(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ComprehensionClausesTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_format_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FormatExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_match_block_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchBlockBlockTemplate {
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
    };
    template.render()
}

fn render_hidden_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchBlockTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_simple_pattern_negative(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SimplePatternNegativeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_simple_statements(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SimpleStatementsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_suite(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SuiteTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _WithClauseParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_aliased_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AliasedImportTemplate {
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

fn render_argument_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArgumentListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "expression"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AsPatternTemplate {
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
        expression: field_1.scalar.as_str(),
        expression_list: field_1.items.as_slice(),
        expression_leading_sep: field_1.leading_sep,
        expression_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_assert_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssertStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssignmentTemplate {
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

fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "object"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AttributeTemplate {
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
        object: field_1.scalar.as_str(),
        object_list: field_1.items.as_slice(),
        object_leading_sep: field_1.leading_sep,
        object_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_augmented_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AugmentedAssignmentTemplate {
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

fn render_await(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_expression"])?;
    let field_0 = resolve_field(node, "primary_expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AwaitTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        primary_expression: field_0.scalar.as_str(),
        primary_expression_list: field_0.items.as_slice(),
        primary_expression_leading_sep: field_0.leading_sep,
        primary_expression_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_binary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BinaryOperatorTemplate {
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

fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BlockTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_boolean_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BooleanOperatorTemplate {
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

fn render_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallTemplate {
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

fn render_case_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["consequence", "guard"])?;
    let field_0 = resolve_field(node, "consequence", true)?;
    let field_1 = resolve_field(node, "guard", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CaseClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        consequence: field_0.scalar.as_str(),
        consequence_list: field_0.items.as_slice(),
        consequence_leading_sep: field_0.leading_sep,
        consequence_trailing_sep: field_0.trailing_sep,
        guard: field_1.scalar.as_str(),
        guard_list: field_1.items.as_slice(),
        guard_leading_sep: field_1.leading_sep,
        guard_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_case_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CasePatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_chevron(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ChevronTemplate {
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

fn render_class_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "superclasses", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "superclasses", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassDefinitionTemplate {
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
        superclasses: field_2.scalar.as_str(),
        superclasses_list: field_2.items.as_slice(),
        superclasses_leading_sep: field_2.leading_sep,
        superclasses_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_class_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "dotted_name"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "dotted_name", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClassPatternTemplate {
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
        dotted_name: field_1.scalar.as_str(),
        dotted_name_list: field_1.items.as_slice(),
        dotted_name_leading_sep: field_1.leading_sep,
        dotted_name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_comparison_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operators"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operators", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ComparisonOperatorTemplate {
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
        operators: field_1.scalar.as_str(),
        operators_list: field_1.items.as_slice(),
        operators_leading_sep: field_1.leading_sep,
        operators_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_complex_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["imaginary", "real"])?;
    let field_0 = resolve_field(node, "imaginary", true)?;
    let field_1 = resolve_field(node, "real", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ComplexPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        imaginary: field_0.scalar.as_str(),
        imaginary_list: field_0.items.as_slice(),
        imaginary_leading_sep: field_0.leading_sep,
        imaginary_trailing_sep: field_0.trailing_sep,
        real: field_1.scalar.as_str(),
        real_list: field_1.items.as_slice(),
        real_leading_sep: field_1.leading_sep,
        real_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_concatenated_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConcatenatedStringTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_conditional_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConditionalExpressionTemplate {
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
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        condition: field_2.scalar.as_str(),
        condition_list: field_2.items.as_slice(),
        condition_leading_sep: field_2.leading_sep,
        condition_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_constrained_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "constraint"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "constraint", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstrainedTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        base_type: field_0.scalar.as_str(),
        base_type_list: field_0.items.as_slice(),
        base_type_leading_sep: field_0.leading_sep,
        base_type_trailing_sep: field_0.trailing_sep,
        constraint: field_1.scalar.as_str(),
        constraint_list: field_1.items.as_slice(),
        constraint_leading_sep: field_1.leading_sep,
        constraint_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_decorated_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["definition"])?;
    let field_0 = resolve_field(node, "definition", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DecoratedDefinitionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        definition: field_0.scalar.as_str(),
        definition_list: field_0.items.as_slice(),
        definition_leading_sep: field_0.leading_sep,
        definition_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DecoratorTemplate {
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

fn render_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DefaultParameterTemplate {
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

fn render_delete_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DeleteStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_dict_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DictPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_dictionary_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DictionaryComprehensionTemplate {
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

fn render_dictionary_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DictionarySplatPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_dictionary_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DictionarySplatTemplate {
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

fn render_dictionary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DictionaryTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_dotted_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DottedNameTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_elif_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition", "consequence"])?;
    let field_0 = resolve_field(node, "condition", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ElifClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        condition: field_0.scalar.as_str(),
        condition_list: field_0.items.as_slice(),
        condition_leading_sep: field_0.leading_sep,
        condition_trailing_sep: field_0.trailing_sep,
        consequence: field_1.scalar.as_str(),
        consequence_list: field_1.items.as_slice(),
        consequence_leading_sep: field_1.leading_sep,
        consequence_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ElseClauseTemplate {
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

fn render_except_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "value"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "value", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExceptClauseTemplate {
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
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_exec_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["code", "in_clause"])?;
    let field_0 = resolve_field(node, "code", true)?;
    let field_1 = resolve_field(node, "in_clause", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExecStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        code: field_0.scalar.as_str(),
        code_list: field_0.items.as_slice(),
        code_leading_sep: field_0.leading_sep,
        code_trailing_sep: field_0.trailing_sep,
        in_clause: field_1.scalar.as_str(),
        in_clause_list: field_1.items.as_slice(),
        in_clause_leading_sep: field_1.leading_sep,
        in_clause_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExpressionListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_expression_statement_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExpressionStatementTupleTemplate {
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
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExpressionStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FinallyClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        block: field_0.scalar.as_str(),
        block_list: field_0.items.as_slice(),
        block_leading_sep: field_0.leading_sep,
        block_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "left", "right"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForInClauseTemplate {
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
        left: field_1.scalar.as_str(),
        left_list: field_1.items.as_slice(),
        left_leading_sep: field_1.leading_sep,
        left_trailing_sep: field_1.trailing_sep,
        right: field_2.scalar.as_str(),
        right_list: field_2.items.as_slice(),
        right_leading_sep: field_2.leading_sep,
        right_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "async_marker", "body", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "async_marker", false)?;
    let field_2 = resolve_field(node, "body", true)?;
    let field_3 = resolve_field(node, "left", true)?;
    let field_4 = resolve_field(node, "right", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForStatementTemplate {
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
        async_marker: field_1.scalar.as_str(),
        async_marker_list: field_1.items.as_slice(),
        async_marker_leading_sep: field_1.leading_sep,
        async_marker_trailing_sep: field_1.trailing_sep,
        body: field_2.scalar.as_str(),
        body_list: field_2.items.as_slice(),
        body_leading_sep: field_2.leading_sep,
        body_trailing_sep: field_2.trailing_sep,
        left: field_3.scalar.as_str(),
        left_list: field_3.items.as_slice(),
        left_leading_sep: field_3.leading_sep,
        left_trailing_sep: field_3.trailing_sep,
        right: field_4.scalar.as_str(),
        right_list: field_4.items.as_slice(),
        right_leading_sep: field_4.leading_sep,
        right_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_format_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FormatSpecifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_function_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionDefinitionTemplate {
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

fn render_future_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FutureImportStatementTemplate {
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

fn render_generator_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GeneratorExpressionTemplate {
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

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "type_parameter"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "type_parameter", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GenericTypeTemplate {
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
        type_parameter: field_1.scalar.as_str(),
        type_parameter_list: field_1.items.as_slice(),
        type_parameter_leading_sep: field_1.leading_sep,
        type_parameter_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_global_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GlobalStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_if_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IfClauseTemplate {
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

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
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

fn render_import_from_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module_name", "name"])?;
    let field_0 = resolve_field(node, "module_name", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportFromStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        module_name: field_0.scalar.as_str(),
        module_name_list: field_0.items.as_slice(),
        module_name_leading_sep: field_0.leading_sep,
        module_name_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImportStatementTemplate {
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

fn render_interpolation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "format_specifier", "type_conversion"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "format_specifier", false)?;
    let field_2 = resolve_field(node, "type_conversion", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InterpolationTemplate {
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
        format_specifier: field_1.scalar.as_str(),
        format_specifier_list: field_1.items.as_slice(),
        format_specifier_leading_sep: field_1.leading_sep,
        format_specifier_trailing_sep: field_1.trailing_sep,
        type_conversion: field_2.scalar.as_str(),
        type_conversion_list: field_2.items.as_slice(),
        type_conversion_leading_sep: field_2.leading_sep,
        type_conversion_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_keyword_argument(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = KeywordArgumentTemplate {
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

fn render_keyword_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "simple_pattern"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "simple_pattern", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = KeywordPatternTemplate {
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
        simple_pattern: field_1.scalar.as_str(),
        simple_pattern_list: field_1.items.as_slice(),
        simple_pattern_leading_sep: field_1.leading_sep,
        simple_pattern_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_lambda_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LambdaParametersTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_lambda_within_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LambdaWithinForInClauseTemplate {
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
        parameters: field_1.scalar.as_str(),
        parameters_list: field_1.items.as_slice(),
        parameters_leading_sep: field_1.leading_sep,
        parameters_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_lambda(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LambdaTemplate {
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
        parameters: field_1.scalar.as_str(),
        parameters_list: field_1.items.as_slice(),
        parameters_leading_sep: field_1.leading_sep,
        parameters_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_list_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ListComprehensionTemplate {
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

fn render_list_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ListPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_list_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ListSplatPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ListSplatTemplate {
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

fn render_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_match_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "subject"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "subject", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchStatementTemplate {
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
        subject: field_1.scalar.as_str(),
        subject_list: field_1.items.as_slice(),
        subject_leading_sep: field_1.leading_sep,
        subject_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_member_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "identifier"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MemberTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        base_type: field_0.scalar.as_str(),
        base_type_list: field_0.items.as_slice(),
        base_type_leading_sep: field_0.leading_sep,
        base_type_trailing_sep: field_0.trailing_sep,
        identifier: field_1.scalar.as_str(),
        identifier_list: field_1.items.as_slice(),
        identifier_leading_sep: field_1.leading_sep,
        identifier_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ModuleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_named_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NamedExpressionTemplate {
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

fn render_nonlocal_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NonlocalStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_not_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NotOperatorTemplate {
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
    };
    template.render()
}

fn render_pair(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
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

fn render_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParametersTemplate {
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

fn render_parenthesized_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParenthesizedListSplatTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_pattern_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PatternListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_print_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PrintStatementTemplate {
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
    };
    template.render()
}

fn render_raise_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["cause"])?;
    let field_0 = resolve_field(node, "cause", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RaiseStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        cause: field_0.scalar.as_str(),
        cause_list: field_0.items.as_slice(),
        cause_leading_sep: field_0.leading_sep,
        cause_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_relative_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["dotted_name", "import_prefix"])?;
    let field_0 = resolve_field(node, "dotted_name", false)?;
    let field_1 = resolve_field(node, "import_prefix", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RelativeImportTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        dotted_name: field_0.scalar.as_str(),
        dotted_name_list: field_0.items.as_slice(),
        dotted_name_leading_sep: field_0.leading_sep,
        dotted_name_trailing_sep: field_0.trailing_sep,
        import_prefix: field_1.scalar.as_str(),
        import_prefix_list: field_1.items.as_slice(),
        import_prefix_leading_sep: field_1.leading_sep,
        import_prefix_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReturnStatementTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_set_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SetComprehensionTemplate {
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

fn render_set(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SetTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_slice(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["start", "step", "stop"])?;
    let field_0 = resolve_field(node, "start", false)?;
    let field_1 = resolve_field(node, "step", false)?;
    let field_2 = resolve_field(node, "stop", false)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SliceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        start: field_0.scalar.as_str(),
        start_list: field_0.items.as_slice(),
        start_leading_sep: field_0.leading_sep,
        start_trailing_sep: field_0.trailing_sep,
        step: field_1.scalar.as_str(),
        step_list: field_1.items.as_slice(),
        step_leading_sep: field_1.leading_sep,
        step_trailing_sep: field_1.trailing_sep,
        stop: field_2.scalar.as_str(),
        stop_list: field_2.items.as_slice(),
        stop_leading_sep: field_2.leading_sep,
        stop_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SplatPatternTemplate {
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

fn render_splat_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SplatTypeTemplate {
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

fn render_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StringContentTemplate {
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

fn render_subscript(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["subscript", "value"])?;
    let field_0 = resolve_field(node, "subscript", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SubscriptTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        subscript: field_0.scalar.as_str(),
        subscript_list: field_0.items.as_slice(),
        subscript_leading_sep: field_0.leading_sep,
        subscript_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "else_clause", "except_clauses", "finally_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "else_clause", false)?;
    let field_2 = resolve_field(node, "except_clauses", false)?;
    let field_3 = resolve_field(node, "finally_clause", false)?;
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
        else_clause: field_1.scalar.as_str(),
        else_clause_list: field_1.items.as_slice(),
        else_clause_leading_sep: field_1.leading_sep,
        else_clause_trailing_sep: field_1.trailing_sep,
        except_clauses: field_2.scalar.as_str(),
        except_clauses_list: field_2.items.as_slice(),
        except_clauses_leading_sep: field_2.leading_sep,
        except_clauses_trailing_sep: field_2.trailing_sep,
        finally_clause: field_3.scalar.as_str(),
        finally_clause_list: field_3.items.as_slice(),
        finally_clause_leading_sep: field_3.leading_sep,
        finally_clause_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_tuple_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TuplePatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TupleTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_type_alias_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "type"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeAliasStatementTemplate {
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
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_typed_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypedDefaultParameterTemplate {
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

fn render_typed_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypedParameterTemplate {
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

fn render_unary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UnaryOperatorTemplate {
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

fn render_union_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UnionPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
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

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WhileStatementTemplate {
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
        body: field_1.scalar.as_str(),
        body_list: field_1.items.as_slice(),
        body_leading_sep: field_1.leading_sep,
        body_trailing_sep: field_1.trailing_sep,
        condition: field_2.scalar.as_str(),
        condition_list: field_2.items.as_slice(),
        condition_leading_sep: field_2.leading_sep,
        condition_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_with_clause_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WithClauseBareTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WithClauseParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_with_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WithClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_with_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WithItemTemplate {
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

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "with_clause"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "with_clause", true)?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WithStatementTemplate {
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
        with_clause: field_2.scalar.as_str(),
        with_clause_list: field_2.items.as_slice(),
        with_clause_leading_sep: field_2.leading_sep,
        with_clause_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_yield(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = YieldTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
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
        "_as_pattern_target" | "as_pattern_target" => render_hidden_as_pattern_target(node),
        "_as_pattern" => render_hidden_as_pattern(node),
        "_assignment_eq" | "assignment_eq" => render_hidden_assignment_eq(node),
        "_assignment_type" | "assignment_type" => render_hidden_assignment_type(node),
        "_assignment_typed" | "assignment_typed" => render_hidden_assignment_typed(node),
        "_comprehension_clauses" | "comprehension_clauses" => render_hidden_comprehension_clauses(node),
        "_format_expression" | "format_expression" => render_hidden_format_expression(node),
        "_match_block_block" | "match_block_block" => render_hidden_match_block_block(node),
        "_match_block" | "match_block" => render_hidden_match_block(node),
        "_simple_pattern_negative" | "simple_pattern_negative" => render_hidden_simple_pattern_negative(node),
        "_simple_statements" | "simple_statements" => render_hidden_simple_statements(node),
        "_suite" | "suite" => render_hidden_suite(node),
        "_with_clause_paren" => render_hidden_with_clause_paren(node),
        "aliased_import" => render_aliased_import(node),
        "argument_list" => render_argument_list(node),
        "as_pattern" => render_as_pattern(node),
        "assert_statement" => render_assert_statement(node),
        "assignment" => render_assignment(node),
        "attribute" => render_attribute(node),
        "augmented_assignment" => render_augmented_assignment(node),
        "await" => render_await(node),
        "binary_operator" => render_binary_operator(node),
        "block" => render_block(node),
        "boolean_operator" => render_boolean_operator(node),
        "call" => render_call(node),
        "case_clause" => render_case_clause(node),
        "case_pattern" => render_case_pattern(node),
        "chevron" => render_chevron(node),
        "class_definition" => render_class_definition(node),
        "class_pattern" => render_class_pattern(node),
        "comparison_operator" => render_comparison_operator(node),
        "complex_pattern" => render_complex_pattern(node),
        "concatenated_string" => render_concatenated_string(node),
        "conditional_expression" => render_conditional_expression(node),
        "constrained_type" => render_constrained_type(node),
        "decorated_definition" => render_decorated_definition(node),
        "decorator" => render_decorator(node),
        "default_parameter" => render_default_parameter(node),
        "delete_statement" => render_delete_statement(node),
        "dict_pattern" => render_dict_pattern(node),
        "dictionary_comprehension" => render_dictionary_comprehension(node),
        "dictionary_splat_pattern" => render_dictionary_splat_pattern(node),
        "dictionary_splat" => render_dictionary_splat(node),
        "dictionary" => render_dictionary(node),
        "dotted_name" => render_dotted_name(node),
        "elif_clause" => render_elif_clause(node),
        "else_clause" => render_else_clause(node),
        "except_clause" => render_except_clause(node),
        "exec_statement" => render_exec_statement(node),
        "expression_list" => render_expression_list(node),
        "expression_statement_tuple" => render_expression_statement_tuple(node),
        "expression_statement" => render_expression_statement(node),
        "finally_clause" => render_finally_clause(node),
        "for_in_clause" => render_for_in_clause(node),
        "for_statement" => render_for_statement(node),
        "format_specifier" => render_format_specifier(node),
        "function_definition" => render_function_definition(node),
        "future_import_statement" => render_future_import_statement(node),
        "generator_expression" => render_generator_expression(node),
        "generic_type" => render_generic_type(node),
        "global_statement" => render_global_statement(node),
        "if_clause" => render_if_clause(node),
        "if_statement" => render_if_statement(node),
        "import_from_statement" => render_import_from_statement(node),
        "import_statement" => render_import_statement(node),
        "interpolation" => render_interpolation(node),
        "keyword_argument" => render_keyword_argument(node),
        "keyword_pattern" => render_keyword_pattern(node),
        "lambda_parameters" => render_lambda_parameters(node),
        "lambda_within_for_in_clause" => render_lambda_within_for_in_clause(node),
        "lambda" => render_lambda(node),
        "list_comprehension" => render_list_comprehension(node),
        "list_pattern" => render_list_pattern(node),
        "list_splat_pattern" => render_list_splat_pattern(node),
        "list_splat" => render_list_splat(node),
        "list" => render_list(node),
        "match_statement" => render_match_statement(node),
        "member_type" => render_member_type(node),
        "module" => render_module(node),
        "named_expression" => render_named_expression(node),
        "nonlocal_statement" => render_nonlocal_statement(node),
        "not_operator" => render_not_operator(node),
        "pair" => render_pair(node),
        "parameters" => render_parameters(node),
        "parenthesized_expression" => render_parenthesized_expression(node),
        "parenthesized_list_splat" => render_parenthesized_list_splat(node),
        "pattern_list" => render_pattern_list(node),
        "print_statement" => render_print_statement(node),
        "raise_statement" => render_raise_statement(node),
        "relative_import" => render_relative_import(node),
        "return_statement" => render_return_statement(node),
        "set_comprehension" => render_set_comprehension(node),
        "set" => render_set(node),
        "slice" => render_slice(node),
        "splat_pattern" => render_splat_pattern(node),
        "splat_type" => render_splat_type(node),
        "string_content" => render_string_content(node),
        "string" => render_string(node),
        "subscript" => render_subscript(node),
        "try_statement" => render_try_statement(node),
        "tuple_pattern" => render_tuple_pattern(node),
        "tuple" => render_tuple(node),
        "type_alias_statement" => render_type_alias_statement(node),
        "type_parameter" => render_type_parameter(node),
        "type" => render_type(node),
        "typed_default_parameter" => render_typed_default_parameter(node),
        "typed_parameter" => render_typed_parameter(node),
        "unary_operator" => render_unary_operator(node),
        "union_pattern" => render_union_pattern(node),
        "union_type" => render_union_type(node),
        "while_statement" => render_while_statement(node),
        "with_clause_bare" => render_with_clause_bare(node),
        "with_clause_paren" => render_with_clause_paren(node),
        "with_clause" => render_with_clause(node),
        "with_item" => render_with_item(node),
        "with_statement" => render_with_statement(node),
        "yield" => render_yield(node),
        _ => token_shaped_fallback(node),
    }
}
