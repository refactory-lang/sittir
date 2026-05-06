// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
//
// Per-kind askama template structs + render functions for the python
// grammar. Every struct in this file is backed by a sibling `.jinja`
// template under `templates/`, copied from `packages/python/templates/`
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
#[template(path = "_as_pattern.jinja", escape = "none")]
pub struct _AsPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_eq.jinja", escape = "none")]
pub struct AssignmentEqTemplate<'a> {
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_type.jinja", escape = "none")]
pub struct AssignmentTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_typed.jinja", escape = "none")]
pub struct AssignmentTypedTemplate<'a> {
    pub right: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_comprehension_clauses.jinja", escape = "none")]
pub struct ComprehensionClausesTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block_block.jinja", escape = "none")]
pub struct MatchBlockBlockTemplate<'a> {
    pub alternative: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_simple_pattern_negative.jinja", escape = "none")]
pub struct SimplePatternNegativeTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_simple_statements.jinja", escape = "none")]
pub struct SimpleStatementsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_suite.jinja", escape = "none")]
pub struct SuiteTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_with_clause_paren.jinja", escape = "none")]
pub struct _WithClauseParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "aliased_import.jinja", escape = "none")]
pub struct AliasedImportTemplate<'a> {
    pub alias: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "argument_list.jinja", escape = "none")]
pub struct ArgumentListTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "as_pattern.jinja", escape = "none")]
pub struct AsPatternTemplate<'a> {
    pub alias: SingleNonterminalView<'a>,
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assert_statement.jinja", escape = "none")]
pub struct AssertStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment.jinja", escape = "none")]
pub struct AssignmentTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
    pub attribute: SingleNonterminalView<'a>,
    pub object: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment.jinja", escape = "none")]
pub struct AugmentedAssignmentTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "await.jinja", escape = "none")]
pub struct AwaitTemplate<'a> {
    pub primary_expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "binary_operator.jinja", escape = "none")]
pub struct BinaryOperatorTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "boolean_operator.jinja", escape = "none")]
pub struct BooleanOperatorTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call.jinja", escape = "none")]
pub struct CallTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "case_clause.jinja", escape = "none")]
pub struct CaseClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
    pub guard: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "case_pattern.jinja", escape = "none")]
pub struct CasePatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "chevron.jinja", escape = "none")]
pub struct ChevronTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_definition.jinja", escape = "none")]
pub struct ClassDefinitionTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub superclasses: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_pattern.jinja", escape = "none")]
pub struct ClassPatternTemplate<'a> {
    pub arguments: ListNonterminalView<'a>,
    pub dotted_name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "comparison_operator.jinja", escape = "none")]
pub struct ComparisonOperatorTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub operators: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "complex_pattern.jinja", escape = "none")]
pub struct ComplexPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub imaginary: SingleNonterminalView<'a>,
    pub real: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "concatenated_string.jinja", escape = "none")]
pub struct ConcatenatedStringTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "conditional_expression.jinja", escape = "none")]
pub struct ConditionalExpressionTemplate<'a> {
    pub alternative: SingleNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "constrained_type.jinja", escape = "none")]
pub struct ConstrainedTypeTemplate<'a> {
    pub base_type: SingleNonterminalView<'a>,
    pub constraint: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorated_definition.jinja", escape = "none")]
pub struct DecoratedDefinitionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub definition: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub newline: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "default_parameter.jinja", escape = "none")]
pub struct DefaultParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delete_statement.jinja", escape = "none")]
pub struct DeleteStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dict_pattern.jinja", escape = "none")]
pub struct DictPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_comprehension.jinja", escape = "none")]
pub struct DictionaryComprehensionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat_pattern.jinja", escape = "none")]
pub struct DictionarySplatPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat.jinja", escape = "none")]
pub struct DictionarySplatTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary.jinja", escape = "none")]
pub struct DictionaryTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dotted_name.jinja", escape = "none")]
pub struct DottedNameTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "elif_clause.jinja", escape = "none")]
pub struct ElifClauseTemplate<'a> {
    pub condition: SingleNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "except_clause.jinja", escape = "none")]
pub struct ExceptClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub alias: OptionalNonterminalView<'a>,
    pub value: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "exec_statement.jinja", escape = "none")]
pub struct ExecStatementTemplate<'a> {
    pub code: SingleNonterminalView<'a>,
    pub in_clause: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_list.jinja", escape = "none")]
pub struct ExpressionListTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_tuple.jinja", escape = "none")]
pub struct ExpressionStatementTupleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub variant: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub block: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_in_clause.jinja", escape = "none")]
pub struct ForInClauseTemplate<'a> {
    pub async_marker: OptionalNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub right: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub alternative: OptionalNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "format_specifier.jinja", escape = "none")]
pub struct FormatSpecifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_definition.jinja", escape = "none")]
pub struct FunctionDefinitionTemplate<'a> {
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "future_import_statement.jinja", escape = "none")]
pub struct FutureImportStatementTemplate<'a> {
    pub name: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generator_expression.jinja", escape = "none")]
pub struct GeneratorExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub type_parameter: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "global_statement.jinja", escape = "none")]
pub struct GlobalStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_clause.jinja", escape = "none")]
pub struct IfClauseTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: ListNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_from_statement.jinja", escape = "none")]
pub struct ImportFromStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub module_name: SingleNonterminalView<'a>,
    pub name: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub name: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "interpolation.jinja", escape = "none")]
pub struct InterpolationTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
    pub format_specifier: OptionalNonterminalView<'a>,
    pub type_conversion: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "keyword_argument.jinja", escape = "none")]
pub struct KeywordArgumentTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "keyword_pattern.jinja", escape = "none")]
pub struct KeywordPatternTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub simple_pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_parameters.jinja", escape = "none")]
pub struct LambdaParametersTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_within_for_in_clause.jinja", escape = "none")]
pub struct LambdaWithinForInClauseTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda.jinja", escape = "none")]
pub struct LambdaTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_comprehension.jinja", escape = "none")]
pub struct ListComprehensionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_pattern.jinja", escape = "none")]
pub struct ListPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat_pattern.jinja", escape = "none")]
pub struct ListSplatPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat.jinja", escape = "none")]
pub struct ListSplatTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list.jinja", escape = "none")]
pub struct ListTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_statement.jinja", escape = "none")]
pub struct MatchStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub subject: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "member_type.jinja", escape = "none")]
pub struct MemberTypeTemplate<'a> {
    pub base_type: SingleNonterminalView<'a>,
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "named_expression.jinja", escape = "none")]
pub struct NamedExpressionTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "nonlocal_statement.jinja", escape = "none")]
pub struct NonlocalStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "not_operator.jinja", escape = "none")]
pub struct NotOperatorTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_list_splat.jinja", escape = "none")]
pub struct ParenthesizedListSplatTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pattern_list.jinja", escape = "none")]
pub struct PatternListTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "print_statement.jinja", escape = "none")]
pub struct PrintStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub argument: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "raise_statement.jinja", escape = "none")]
pub struct RaiseStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub cause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "relative_import.jinja", escape = "none")]
pub struct RelativeImportTemplate<'a> {
    pub dotted_name: OptionalNonterminalView<'a>,
    pub import_prefix: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "set_comprehension.jinja", escape = "none")]
pub struct SetComprehensionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "set.jinja", escape = "none")]
pub struct SetTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "slice.jinja", escape = "none")]
pub struct SliceTemplate<'a> {
    pub start: OptionalNonterminalView<'a>,
    pub step: OptionalNonterminalView<'a>,
    pub stop: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "splat_pattern.jinja", escape = "none")]
pub struct SplatPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "splat_type.jinja", escape = "none")]
pub struct SplatTypeTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_content.jinja", escape = "none")]
pub struct StringContentTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "subscript.jinja", escape = "none")]
pub struct SubscriptTemplate<'a> {
    pub subscript: ListNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub else_clause: OptionalNonterminalView<'a>,
    pub except_clauses: ListNonterminalView<'a>,
    pub finally_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple.jinja", escape = "none")]
pub struct TupleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_statement.jinja", escape = "none")]
pub struct TypeAliasStatementTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type.jinja", escape = "none")]
pub struct TypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "typed_default_parameter.jinja", escape = "none")]
pub struct TypedDefaultParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "typed_parameter.jinja", escape = "none")]
pub struct TypedParameterTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_operator.jinja", escape = "none")]
pub struct UnaryOperatorTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_pattern.jinja", escape = "none")]
pub struct UnionPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub alternative: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_bare.jinja", escape = "none")]
pub struct WithClauseBareTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_paren.jinja", escape = "none")]
pub struct WithClauseParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause.jinja", escape = "none")]
pub struct WithClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_item.jinja", escape = "none")]
pub struct WithItemTemplate<'a> {
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub async_marker: OptionalNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
    pub with_clause: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "yield.jinja", escape = "none")]
pub struct YieldTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

pub(crate) fn render_hidden_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _AsPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_assignment_eq(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = AssignmentEqTemplate {
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_assignment_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AssignmentTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_assignment_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right", "type"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = AssignmentTypedTemplate {
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_comprehension_clauses(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ComprehensionClausesTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_match_block_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = MatchBlockBlockTemplate {
        alternative: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = MatchBlockTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_simple_pattern_negative(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = SimplePatternNegativeTemplate {
        text: text.as_str(),
    };
    template.render()
}

pub(crate) fn render_hidden_simple_statements(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SimpleStatementsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_suite(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SuiteTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _WithClauseParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_aliased_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = AliasedImportTemplate {
        alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_argument_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ArgumentListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "expression"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "expression", true)?;
    let template = AsPatternTemplate {
        alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_assert_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = AssertStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let children_renderables = children.renderable_items();
    let template = AssignmentTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "object"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = AttributeTemplate {
        attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_augmented_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_await(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_expression"])?;
    let field_0 = resolve_field(node, "primary_expression", true)?;
    let template = AwaitTemplate {
        primary_expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_binary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryOperatorTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = BlockTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_boolean_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BooleanOperatorTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_case_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["consequence", "guard"])?;
    let field_0 = resolve_field(node, "consequence", true)?;
    let field_1 = resolve_field(node, "guard", false)?;
    let children_renderables = children.renderable_items();
    let template = CaseClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        guard: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_case_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = CasePatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_chevron(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ChevronTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_class_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "superclasses", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "superclasses", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ClassDefinitionTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        superclasses: match field_2.kind {
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

pub(crate) fn render_class_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "dotted_name"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "dotted_name", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ClassPatternTemplate {
        arguments: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        dotted_name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_comparison_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operators"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operators", true)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ComparisonOperatorTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operators: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_complex_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["imaginary", "real"])?;
    let field_0 = resolve_field(node, "imaginary", true)?;
    let field_1 = resolve_field(node, "real", false)?;
    let children_renderables = children.renderable_items();
    let template = ComplexPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        imaginary: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        real: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_concatenated_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ConcatenatedStringTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_conditional_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = ConditionalExpressionTemplate {
        alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_constrained_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "constraint"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "constraint", true)?;
    let template = ConstrainedTypeTemplate {
        base_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        constraint: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_decorated_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["definition"])?;
    let field_0 = resolve_field(node, "definition", true)?;
    let children_renderables = children.renderable_items();
    let template = DecoratedDefinitionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        definition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "newline"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "newline", false)?;
    let template = DecoratorTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        newline: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = DefaultParameterTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_delete_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DeleteStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_dict_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DictPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_dictionary_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = DictionaryComprehensionTemplate {
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

pub(crate) fn render_dictionary_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DictionarySplatPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_dictionary_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = DictionarySplatTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_dictionary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DictionaryTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_dotted_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DottedNameTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_elif_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition", "consequence"])?;
    let field_0 = resolve_field(node, "condition", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let template = ElifClauseTemplate {
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ElseClauseTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_except_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "value"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "value", false)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ExceptClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        alias: match field_0.kind {
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

pub(crate) fn render_exec_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["code", "in_clause"])?;
    let field_0 = resolve_field(node, "code", true)?;
    let field_1 = resolve_field(node, "in_clause", false)?;
    let field_1_renderables = field_1.renderable_items();
    let template = ExecStatementTemplate {
        code: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        in_clause: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExpressionListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_expression_statement_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementTupleTemplate {
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
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        variant,
    };
    template.render()
}

pub(crate) fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = FinallyClauseTemplate {
        block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "left", "right"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let field_2_renderables = field_2.renderable_items();
    let template = ForInClauseTemplate {
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: ListNonterminalView {
            items: field_2_renderables.as_slice(),
            separator: field_2.separator,
            leading: field_2.leading_sep,
            trailing: field_2.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "async_marker", "body", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "async_marker", false)?;
    let field_2 = resolve_field(node, "body", true)?;
    let field_3 = resolve_field(node, "left", true)?;
    let field_4 = resolve_field(node, "right", true)?;
    let template = ForStatementTemplate {
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        async_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_format_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FormatSpecifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_function_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionDefinitionTemplate {
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

pub(crate) fn render_future_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = FutureImportStatementTemplate {
        name: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_generator_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = GeneratorExpressionTemplate {
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

pub(crate) fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "type_parameter"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "type_parameter", true)?;
    let template = GenericTypeTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_global_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = GlobalStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_if_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = IfClauseTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = IfStatementTemplate {
        alternative: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_import_from_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module_name", "name"])?;
    let field_0 = resolve_field(node, "module_name", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ImportFromStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        module_name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ImportStatementTemplate {
        name: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_interpolation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "format_specifier", "type_conversion"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "format_specifier", false)?;
    let field_2 = resolve_field(node, "type_conversion", false)?;
    let template = InterpolationTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        format_specifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_conversion: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_keyword_argument(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = KeywordArgumentTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_keyword_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "simple_pattern"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "simple_pattern", true)?;
    let template = KeywordPatternTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        simple_pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_lambda_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = LambdaParametersTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_lambda_within_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaWithinForInClauseTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        parameters: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_lambda(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        parameters: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_list_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = ListComprehensionTemplate {
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

pub(crate) fn render_list_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ListPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_list_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ListSplatPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ListSplatTemplate {
        expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_match_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "subject"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "subject", true)?;
    let field_1_renderables = field_1.renderable_items();
    let template = MatchStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        subject: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_member_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "identifier"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let template = MemberTypeTemplate {
        base_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ModuleTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_named_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = NamedExpressionTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_nonlocal_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = NonlocalStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_not_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let template = NotOperatorTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
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

pub(crate) fn render_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParametersTemplate {
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

pub(crate) fn render_parenthesized_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParenthesizedListSplatTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_pattern_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = PatternListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_print_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = PrintStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        argument: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_raise_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["cause"])?;
    let field_0 = resolve_field(node, "cause", false)?;
    let children_renderables = children.renderable_items();
    let template = RaiseStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        cause: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_relative_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["dotted_name", "import_prefix"])?;
    let field_0 = resolve_field(node, "dotted_name", false)?;
    let field_1 = resolve_field(node, "import_prefix", true)?;
    let template = RelativeImportTemplate {
        dotted_name: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        import_prefix: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ReturnStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_set_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = SetComprehensionTemplate {
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

pub(crate) fn render_set(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SetTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_slice(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["start", "step", "stop"])?;
    let field_0 = resolve_field(node, "start", false)?;
    let field_1 = resolve_field(node, "step", false)?;
    let field_2 = resolve_field(node, "stop", false)?;
    let template = SliceTemplate {
        start: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        step: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        stop: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let children_renderables = children.renderable_items();
    let template = SplatPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_splat_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = SplatTypeTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = StringContentTemplate {
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
    let text = resolve_text(node)?;
    let template = StringTemplate {
        text: text.as_str(),
    };
    template.render()
}

pub(crate) fn render_subscript(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["subscript", "value"])?;
    let field_0 = resolve_field(node, "subscript", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = SubscriptTemplate {
        subscript: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "else_clause", "except_clauses", "finally_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "else_clause", false)?;
    let field_2 = resolve_field(node, "except_clauses", true)?;
    let field_3 = resolve_field(node, "finally_clause", false)?;
    let field_2_renderables = field_2.renderable_items();
    let template = TryStatementTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        else_clause: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        except_clauses: ListNonterminalView {
            items: field_2_renderables.as_slice(),
            separator: field_2.separator,
            leading: field_2.leading_sep,
            trailing: field_2.trailing_sep,
        },
        finally_clause: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_tuple_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TuplePatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TupleTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type_alias_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "type"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = TypeAliasStatementTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeParameterTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_typed_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let template = TypedDefaultParameterTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_typed_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let template = TypedParameterTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_unary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryOperatorTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_union_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = UnionPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_with_clause_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WithClauseBareTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WithClauseParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_with_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WithClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_with_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = WithItemTemplate {
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "with_clause"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "with_clause", true)?;
    let template = WithStatementTemplate {
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        with_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_yield(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = YieldTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

