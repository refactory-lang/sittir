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
#[template(path = "_as_pattern_target.jinja", escape = "none")]
pub struct AsPatternTargetTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern.jinja", escape = "none")]
pub struct _AsPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_eq.jinja", escape = "none")]
pub struct AssignmentEqTemplate<'a> {
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_type.jinja", escape = "none")]
pub struct AssignmentTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_typed.jinja", escape = "none")]
pub struct AssignmentTypedTemplate<'a> {
    pub right: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_comprehension_clauses.jinja", escape = "none")]
pub struct ComprehensionClausesTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_format_expression.jinja", escape = "none")]
pub struct FormatExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block_block.jinja", escape = "none")]
pub struct MatchBlockBlockTemplate<'a> {
    pub alternative: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_simple_pattern_negative.jinja", escape = "none")]
pub struct SimplePatternNegativeTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_simple_statements.jinja", escape = "none")]
pub struct SimpleStatementsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_suite.jinja", escape = "none")]
pub struct SuiteTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_with_clause_paren.jinja", escape = "none")]
pub struct _WithClauseParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "aliased_import.jinja", escape = "none")]
pub struct AliasedImportTemplate<'a> {
    pub alias: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "argument_list.jinja", escape = "none")]
pub struct ArgumentListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "as_pattern.jinja", escape = "none")]
pub struct AsPatternTemplate<'a> {
    pub alias: &'a str,
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "assert_statement.jinja", escape = "none")]
pub struct AssertStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment.jinja", escape = "none")]
pub struct AssignmentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
    pub attribute: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment.jinja", escape = "none")]
pub struct AugmentedAssignmentTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "await.jinja", escape = "none")]
pub struct AwaitTemplate<'a> {
    pub primary_expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "binary_operator.jinja", escape = "none")]
pub struct BinaryOperatorTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "boolean_operator.jinja", escape = "none")]
pub struct BooleanOperatorTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "call.jinja", escape = "none")]
pub struct CallTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "case_clause.jinja", escape = "none")]
pub struct CaseClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub consequence: &'a str,
    pub guard: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "case_pattern.jinja", escape = "none")]
pub struct CasePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "chevron.jinja", escape = "none")]
pub struct ChevronTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_definition.jinja", escape = "none")]
pub struct ClassDefinitionTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
    pub superclasses: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_pattern.jinja", escape = "none")]
pub struct ClassPatternTemplate<'a> {
    pub arguments: ::sittir_core::filters::FieldView<'a>,
    pub dotted_name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "comparison_operator.jinja", escape = "none")]
pub struct ComparisonOperatorTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub left: &'a str,
    pub operators: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "complex_pattern.jinja", escape = "none")]
pub struct ComplexPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub imaginary: &'a str,
    pub real: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "concatenated_string.jinja", escape = "none")]
pub struct ConcatenatedStringTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "conditional_expression.jinja", escape = "none")]
pub struct ConditionalExpressionTemplate<'a> {
    pub alternative: &'a str,
    pub body: &'a str,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "constrained_type.jinja", escape = "none")]
pub struct ConstrainedTypeTemplate<'a> {
    pub base_type: &'a str,
    pub constraint: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorated_definition.jinja", escape = "none")]
pub struct DecoratedDefinitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub definition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub expression: &'a str,
    pub newline: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "default_parameter.jinja", escape = "none")]
pub struct DefaultParameterTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "delete_statement.jinja", escape = "none")]
pub struct DeleteStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dict_pattern.jinja", escape = "none")]
pub struct DictPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_comprehension.jinja", escape = "none")]
pub struct DictionaryComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat_pattern.jinja", escape = "none")]
pub struct DictionarySplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat.jinja", escape = "none")]
pub struct DictionarySplatTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "dictionary.jinja", escape = "none")]
pub struct DictionaryTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dotted_name.jinja", escape = "none")]
pub struct DottedNameTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "elif_clause.jinja", escape = "none")]
pub struct ElifClauseTemplate<'a> {
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "except_clause.jinja", escape = "none")]
pub struct ExceptClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub alias: &'a str,
    pub value: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "exec_statement.jinja", escape = "none")]
pub struct ExecStatementTemplate<'a> {
    pub code: &'a str,
    pub in_clause: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_list.jinja", escape = "none")]
pub struct ExpressionListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_tuple.jinja", escape = "none")]
pub struct ExpressionStatementTupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub variant: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub block: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_in_clause.jinja", escape = "none")]
pub struct ForInClauseTemplate<'a> {
    pub async_marker: &'a str,
    pub left: &'a str,
    pub right: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub alternative: &'a str,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "format_specifier.jinja", escape = "none")]
pub struct FormatSpecifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_definition.jinja", escape = "none")]
pub struct FunctionDefinitionTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "future_import_statement.jinja", escape = "none")]
pub struct FutureImportStatementTemplate<'a> {
    pub name: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generator_expression.jinja", escape = "none")]
pub struct GeneratorExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub identifier: &'a str,
    pub type_parameter: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "global_statement.jinja", escape = "none")]
pub struct GlobalStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_clause.jinja", escape = "none")]
pub struct IfClauseTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: ::sittir_core::filters::FieldView<'a>,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_from_statement.jinja", escape = "none")]
pub struct ImportFromStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub module_name: &'a str,
    pub name: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub name: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "interpolation.jinja", escape = "none")]
pub struct InterpolationTemplate<'a> {
    pub expression: &'a str,
    pub format_specifier: &'a str,
    pub type_conversion: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "keyword_argument.jinja", escape = "none")]
pub struct KeywordArgumentTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "keyword_pattern.jinja", escape = "none")]
pub struct KeywordPatternTemplate<'a> {
    pub identifier: &'a str,
    pub simple_pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lambda_parameters.jinja", escape = "none")]
pub struct LambdaParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_within_for_in_clause.jinja", escape = "none")]
pub struct LambdaWithinForInClauseTemplate<'a> {
    pub body: &'a str,
    pub parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lambda.jinja", escape = "none")]
pub struct LambdaTemplate<'a> {
    pub body: &'a str,
    pub parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "list_comprehension.jinja", escape = "none")]
pub struct ListComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "list_pattern.jinja", escape = "none")]
pub struct ListPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat_pattern.jinja", escape = "none")]
pub struct ListSplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat.jinja", escape = "none")]
pub struct ListSplatTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "list.jinja", escape = "none")]
pub struct ListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_statement.jinja", escape = "none")]
pub struct MatchStatementTemplate<'a> {
    pub body: &'a str,
    pub subject: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "member_type.jinja", escape = "none")]
pub struct MemberTypeTemplate<'a> {
    pub base_type: &'a str,
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "named_expression.jinja", escape = "none")]
pub struct NamedExpressionTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "nonlocal_statement.jinja", escape = "none")]
pub struct NonlocalStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "not_operator.jinja", escape = "none")]
pub struct NotOperatorTemplate<'a> {
    pub argument: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_list_splat.jinja", escape = "none")]
pub struct ParenthesizedListSplatTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pattern_list.jinja", escape = "none")]
pub struct PatternListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "print_statement.jinja", escape = "none")]
pub struct PrintStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub argument: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "raise_statement.jinja", escape = "none")]
pub struct RaiseStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub cause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "relative_import.jinja", escape = "none")]
pub struct RelativeImportTemplate<'a> {
    pub dotted_name: &'a str,
    pub import_prefix: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "set_comprehension.jinja", escape = "none")]
pub struct SetComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "set.jinja", escape = "none")]
pub struct SetTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "slice.jinja", escape = "none")]
pub struct SliceTemplate<'a> {
    pub start: &'a str,
    pub step: &'a str,
    pub stop: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "splat_pattern.jinja", escape = "none")]
pub struct SplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "splat_type.jinja", escape = "none")]
pub struct SplatTypeTemplate<'a> {
    pub identifier: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_content.jinja", escape = "none")]
pub struct StringContentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "subscript.jinja", escape = "none")]
pub struct SubscriptTemplate<'a> {
    pub subscript: ::sittir_core::filters::FieldView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: &'a str,
    pub else_clause: &'a str,
    pub except_clauses: ::sittir_core::filters::FieldView<'a>,
    pub finally_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple.jinja", escape = "none")]
pub struct TupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_statement.jinja", escape = "none")]
pub struct TypeAliasStatementTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type.jinja", escape = "none")]
pub struct TypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "typed_default_parameter.jinja", escape = "none")]
pub struct TypedDefaultParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "typed_parameter.jinja", escape = "none")]
pub struct TypedParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "unary_operator.jinja", escape = "none")]
pub struct UnaryOperatorTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "union_pattern.jinja", escape = "none")]
pub struct UnionPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub alternative: &'a str,
    pub body: &'a str,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_bare.jinja", escape = "none")]
pub struct WithClauseBareTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_paren.jinja", escape = "none")]
pub struct WithClauseParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause.jinja", escape = "none")]
pub struct WithClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_item.jinja", escape = "none")]
pub struct WithItemTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub with_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "yield.jinja", escape = "none")]
pub struct YieldTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
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

fn render_hidden_as_pattern_target(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AsPatternTargetTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _AsPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_assignment_eq(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = AssignmentEqTemplate {
        right: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_assignment_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AssignmentTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_assignment_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right", "type"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = AssignmentTypedTemplate {
        right: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_comprehension_clauses(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ComprehensionClausesTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_format_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FormatExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_match_block_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let template = MatchBlockBlockTemplate {
        alternative: field_0.as_field_view(),
    };
    template.render()
}

fn render_hidden_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = MatchBlockTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_simple_pattern_negative(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = SimplePatternNegativeTemplate {
        text: text.as_str(),
    };
    template.render()
}

fn render_hidden_simple_statements(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SimpleStatementsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_suite(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SuiteTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _WithClauseParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_aliased_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = AliasedImportTemplate {
        alias: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_argument_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArgumentListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "expression"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "expression", true)?;
    let template = AsPatternTemplate {
        alias: field_0.as_scalar(),
        expression: field_1.as_scalar(),
    };
    template.render()
}

fn render_assert_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AssertStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let template = AssignmentTemplate {
        children: children.as_list_view(),
        left: field_0.as_scalar(),
    };
    template.render()
}

fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "object"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = AttributeTemplate {
        attribute: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_augmented_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_await(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_expression"])?;
    let field_0 = resolve_field(node, "primary_expression", true)?;
    let template = AwaitTemplate {
        primary_expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_binary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryOperatorTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = BlockTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_boolean_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BooleanOperatorTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_case_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["consequence", "guard"])?;
    let field_0 = resolve_field(node, "consequence", true)?;
    let field_1 = resolve_field(node, "guard", false)?;
    let template = CaseClauseTemplate {
        children: children.as_list_view(),
        consequence: field_0.as_scalar(),
        guard: field_1.as_scalar(),
    };
    template.render()
}

fn render_case_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = CasePatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_chevron(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ChevronTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_class_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "superclasses", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "superclasses", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ClassDefinitionTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
        superclasses: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_class_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "dotted_name"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "dotted_name", true)?;
    let template = ClassPatternTemplate {
        arguments: field_0.as_field_view(),
        dotted_name: field_1.as_scalar(),
    };
    template.render()
}

fn render_comparison_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operators"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operators", true)?;
    let template = ComparisonOperatorTemplate {
        children: children.as_list_view(),
        left: field_0.as_scalar(),
        operators: field_1.as_field_view(),
    };
    template.render()
}

fn render_complex_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["imaginary", "real"])?;
    let field_0 = resolve_field(node, "imaginary", true)?;
    let field_1 = resolve_field(node, "real", false)?;
    let template = ComplexPatternTemplate {
        children: children.as_list_view(),
        imaginary: field_0.as_scalar(),
        real: field_1.as_scalar(),
    };
    template.render()
}

fn render_concatenated_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ConcatenatedStringTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_conditional_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = ConditionalExpressionTemplate {
        alternative: field_0.as_scalar(),
        body: field_1.as_scalar(),
        condition: field_2.as_scalar(),
    };
    template.render()
}

fn render_constrained_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "constraint"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "constraint", true)?;
    let template = ConstrainedTypeTemplate {
        base_type: field_0.as_scalar(),
        constraint: field_1.as_scalar(),
    };
    template.render()
}

fn render_decorated_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["definition"])?;
    let field_0 = resolve_field(node, "definition", true)?;
    let template = DecoratedDefinitionTemplate {
        children: children.as_list_view(),
        definition: field_0.as_scalar(),
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "newline"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "newline", false)?;
    let template = DecoratorTemplate {
        expression: field_0.as_scalar(),
        newline: field_1.as_scalar(),
    };
    template.render()
}

fn render_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = DefaultParameterTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_delete_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DeleteStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dict_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DictPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dictionary_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = DictionaryComprehensionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_dictionary_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DictionarySplatPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dictionary_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = DictionarySplatTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_dictionary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DictionaryTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dotted_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DottedNameTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_elif_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition", "consequence"])?;
    let field_0 = resolve_field(node, "condition", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let template = ElifClauseTemplate {
        condition: field_0.as_scalar(),
        consequence: field_1.as_scalar(),
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ElseClauseTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_except_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "value"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "value", false)?;
    let template = ExceptClauseTemplate {
        children: children.as_list_view(),
        alias: field_0.as_scalar(),
        value: field_1.as_field_view(),
    };
    template.render()
}

fn render_exec_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["code", "in_clause"])?;
    let field_0 = resolve_field(node, "code", true)?;
    let field_1 = resolve_field(node, "in_clause", false)?;
    let template = ExecStatementTemplate {
        code: field_0.as_scalar(),
        in_clause: field_1.as_field_view(),
    };
    template.render()
}

fn render_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionStatementTupleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let template = ExpressionStatementTemplate {
        children: children.as_list_view(),
        variant,
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = FinallyClauseTemplate {
        block: field_0.as_scalar(),
    };
    template.render()
}

fn render_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "left", "right"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = ForInClauseTemplate {
        async_marker: field_0.as_scalar(),
        left: field_1.as_scalar(),
        right: field_2.as_field_view(),
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
    let template = ForStatementTemplate {
        alternative: field_0.as_scalar(),
        async_marker: field_1.as_scalar(),
        body: field_2.as_scalar(),
        left: field_3.as_scalar(),
        right: field_4.as_scalar(),
    };
    template.render()
}

fn render_format_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FormatSpecifierTemplate {
        children: children.as_list_view(),
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
    let template = FunctionDefinitionTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_future_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = FutureImportStatementTemplate {
        name: field_0.as_field_view(),
    };
    template.render()
}

fn render_generator_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = GeneratorExpressionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "type_parameter"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "type_parameter", true)?;
    let template = GenericTypeTemplate {
        identifier: field_0.as_scalar(),
        type_parameter: field_1.as_scalar(),
    };
    template.render()
}

fn render_global_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = GlobalStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_if_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = IfClauseTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfStatementTemplate {
        alternative: field_0.as_field_view(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_import_from_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module_name", "name"])?;
    let field_0 = resolve_field(node, "module_name", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let template = ImportFromStatementTemplate {
        children: children.as_list_view(),
        module_name: field_0.as_scalar(),
        name: field_1.as_list_view(),
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = ImportStatementTemplate {
        name: field_0.as_field_view(),
    };
    template.render()
}

fn render_interpolation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "format_specifier", "type_conversion"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "format_specifier", false)?;
    let field_2 = resolve_field(node, "type_conversion", false)?;
    let template = InterpolationTemplate {
        expression: field_0.as_scalar(),
        format_specifier: field_1.as_scalar(),
        type_conversion: field_2.as_scalar(),
    };
    template.render()
}

fn render_keyword_argument(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = KeywordArgumentTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_keyword_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "simple_pattern"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "simple_pattern", true)?;
    let template = KeywordPatternTemplate {
        identifier: field_0.as_scalar(),
        simple_pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_lambda_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LambdaParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_lambda_within_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaWithinForInClauseTemplate {
        body: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
    };
    template.render()
}

fn render_lambda(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaTemplate {
        body: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
    };
    template.render()
}

fn render_list_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ListComprehensionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_list_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ListPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_list_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ListSplatPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ListSplatTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_match_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "subject"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "subject", true)?;
    let template = MatchStatementTemplate {
        body: field_0.as_scalar(),
        subject: field_1.as_field_view(),
    };
    template.render()
}

fn render_member_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "identifier"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let template = MemberTypeTemplate {
        base_type: field_0.as_scalar(),
        identifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ModuleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_named_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = NamedExpressionTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_nonlocal_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = NonlocalStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_not_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let template = NotOperatorTemplate {
        argument: field_0.as_scalar(),
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

fn render_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParametersTemplate {
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

fn render_parenthesized_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParenthesizedListSplatTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_pattern_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PatternListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_print_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", false)?;
    let template = PrintStatementTemplate {
        children: children.as_list_view(),
        argument: field_0.as_field_view(),
    };
    template.render()
}

fn render_raise_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["cause"])?;
    let field_0 = resolve_field(node, "cause", false)?;
    let template = RaiseStatementTemplate {
        children: children.as_list_view(),
        cause: field_0.as_scalar(),
    };
    template.render()
}

fn render_relative_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["dotted_name", "import_prefix"])?;
    let field_0 = resolve_field(node, "dotted_name", false)?;
    let field_1 = resolve_field(node, "import_prefix", true)?;
    let template = RelativeImportTemplate {
        dotted_name: field_0.as_scalar(),
        import_prefix: field_1.as_scalar(),
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ReturnStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_set_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = SetComprehensionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_set(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SetTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_slice(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["start", "step", "stop"])?;
    let field_0 = resolve_field(node, "start", false)?;
    let field_1 = resolve_field(node, "step", false)?;
    let field_2 = resolve_field(node, "stop", false)?;
    let template = SliceTemplate {
        start: field_0.as_scalar(),
        step: field_1.as_scalar(),
        stop: field_2.as_scalar(),
    };
    template.render()
}

fn render_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = SplatPatternTemplate {
        children: children.as_list_view(),
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_splat_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = SplatTypeTemplate {
        identifier: field_0.as_field_view(),
    };
    template.render()
}

fn render_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringContentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = StringTemplate {
        text: text.as_str(),
    };
    template.render()
}

fn render_subscript(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["subscript", "value"])?;
    let field_0 = resolve_field(node, "subscript", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SubscriptTemplate {
        subscript: field_0.as_field_view(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "else_clause", "except_clauses", "finally_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "else_clause", false)?;
    let field_2 = resolve_field(node, "except_clauses", false)?;
    let field_3 = resolve_field(node, "finally_clause", false)?;
    let template = TryStatementTemplate {
        body: field_0.as_scalar(),
        else_clause: field_1.as_scalar(),
        except_clauses: field_2.as_field_view(),
        finally_clause: field_3.as_scalar(),
    };
    template.render()
}

fn render_tuple_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TuplePatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TupleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_alias_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "type"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = TypeAliasStatementTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeParameterTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_typed_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let template = TypedDefaultParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_typed_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = TypedParameterTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_unary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryOperatorTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_union_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = UnionPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        alternative: field_0.as_scalar(),
        body: field_1.as_scalar(),
        condition: field_2.as_scalar(),
    };
    template.render()
}

fn render_with_clause_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WithClauseBareTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WithClauseParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_with_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WithClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_with_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = WithItemTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "with_clause"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "with_clause", true)?;
    let template = WithStatementTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        with_clause: field_2.as_scalar(),
    };
    template.render()
}

fn render_yield(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = YieldTemplate {
        children: children.as_list_view(),
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
