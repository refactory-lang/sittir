// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
//
// render_dispatch match table — routes KindId to per-kind render functions
// in the sibling templates module.

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

use super::bridge::*;
use super::templates::*;

pub fn render_dispatch(node: &NodeData) -> Result<String, ::askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return Ok(text.to_owned());
        }
    }
    match node.type_.0 {
        165 | 185 => render_hidden_as_pattern(node), // "_as_pattern" | "as_pattern"
        240 => render_hidden_assignment_eq(node), // "_assignment_eq" | "assignment_eq"
        241 => render_hidden_assignment_type(node), // "_assignment_type" | "assignment_type"
        242 => render_hidden_assignment_typed(node), // "_assignment_typed" | "assignment_typed"
        224 => render_hidden_comprehension_clauses(node), // "_comprehension_clauses"
        246 => render_hidden_match_block_block(node), // "_match_block_block" | "match_block_block"
        135 => render_hidden_match_block(node), // "_match_block"
        248 => render_hidden_simple_pattern_negative(node), // "_simple_pattern_negative" | "simple_pattern_negative"
        110 => render_hidden_simple_statements(node), // "_simple_statements"
        245 => render_hidden_with_clause_paren(node), // "_with_clause_paren" | "with_clause_paren"
        117 => render_aliased_import(node), // "aliased_import"
        157 => render_argument_list(node), // "argument_list"
        121 => render_assert_statement(node), // "assert_statement"
        198 => render_assignment(node), // "assignment"
        203 => render_attribute(node), // "attribute"
        199 => render_augmented_assignment(node), // "augmented_assignment"
        237 => render_await(node), // "await"
        191 => render_binary_operator(node), // "binary_operator"
        160 => render_block(node), // "block"
        190 => render_boolean_operator(node), // "boolean_operator"
        206 => render_call(node), // "call"
        136 => render_case_clause(node), // "case_clause"
        163 => render_case_pattern(node), // "case_pattern"
        120 => render_chevron(node), // "chevron"
        154 => render_class_definition(node), // "class_definition"
        173 => render_class_pattern(node), // "class_pattern"
        195 => render_comparison_operator(node), // "comparison_operator"
        174 => render_complex_pattern(node), // "complex_pattern"
        230 => render_concatenated_string(node), // "concatenated_string"
        229 => render_conditional_expression(node), // "conditional_expression"
        212 => render_constrained_type(node), // "constrained_type"
        158 => render_decorated_definition(node), // "decorated_definition"
        159 => render_decorator(node), // "decorator"
        181 => render_default_parameter(node), // "default_parameter"
        126 => render_delete_statement(node), // "delete_statement"
        169 => render_dict_pattern(node), // "dict_pattern"
        221 => render_dictionary_comprehension(node), // "dictionary_comprehension"
        184 => render_dictionary_splat_pattern(node), // "dictionary_splat_pattern"
        149 => render_dictionary_splat(node), // "dictionary_splat"
        218 => render_dictionary(node), // "dictionary"
        162 => render_dotted_name(node), // "dotted_name"
        132 => render_elif_clause(node), // "elif_clause"
        133 => render_else_clause(node), // "else_clause"
        140 => render_except_clause(node), // "except_clause"
        152 => render_exec_statement(node), // "exec_statement"
        161 => render_expression_list(node), // "expression_list"
        243 => render_expression_statement_tuple(node), // "expression_statement_tuple"
        122 => render_expression_statement(node), // "expression_statement"
        141 => render_finally_clause(node), // "finally_clause"
        227 => render_for_in_clause(node), // "for_in_clause"
        137 => render_for_statement(node), // "for_statement"
        236 => render_format_specifier(node), // "format_specifier"
        145 => render_function_definition(node), // "function_definition"
        114 => render_future_import_statement(node), // "future_import_statement"
        223 => render_generator_expression(node), // "generator_expression"
        210 => render_generic_type(node), // "generic_type"
        150 => render_global_statement(node), // "global_statement"
        228 => render_if_clause(node), // "if_clause"
        131 => render_if_statement(node), // "if_statement"
        115 => render_import_from_statement(node), // "import_from_statement"
        111 => render_import_statement(node), // "import_statement"
        233 => render_interpolation(node), // "interpolation"
        214 => render_keyword_argument(node), // "keyword_argument"
        171 => render_keyword_pattern(node), // "keyword_pattern"
        147 => render_lambda_parameters(node), // "lambda_parameters"
        197 => render_lambda_within_for_in_clause(node), // "lambda_within_for_in_clause"
        196 => render_lambda(node), // "lambda"
        220 => render_list_comprehension(node), // "list_comprehension"
        180 => render_list_pattern(node), // "list_pattern"
        183 => render_list_splat_pattern(node), // "list_splat_pattern"
        148 => render_list_splat(node), // "list_splat"
        215 => render_list(node), // "list"
        134 => render_match_statement(node), // "match_statement"
        213 => render_member_type(node), // "member_type"
        108 => render_module(node), // "module"
        123 => render_named_expression(node), // "named_expression"
        151 => render_nonlocal_statement(node), // "nonlocal_statement"
        189 => render_not_operator(node), // "not_operator"
        219 => render_pair(node), // "pair"
        146 => render_parameters(node), // "parameters"
        225 => render_parenthesized_expression(node), // "parenthesized_expression"
        156 => render_parenthesized_list_splat(node), // "parenthesized_list_splat"
        200 => render_pattern_list(node), // "pattern_list"
        119 => render_print_statement(node), // "print_statement"
        127 => render_raise_statement(node), // "raise_statement"
        113 => render_relative_import(node), // "relative_import"
        125 => render_return_statement(node), // "return_statement"
        222 => render_set_comprehension(node), // "set_comprehension"
        216 => render_set(node), // "set"
        205 => render_slice(node), // "slice"
        172 => render_splat_pattern(node), // "splat_pattern"
        209 => render_splat_type(node), // "splat_type"
        232 => render_string_content(node), // "string_content"
        231 => render_string(node), // "string"
        204 => render_subscript(node), // "subscript"
        139 => render_try_statement(node), // "try_statement"
        179 => render_tuple_pattern(node), // "tuple_pattern"
        217 => render_tuple(node), // "tuple"
        153 => render_type_alias_statement(node), // "type_alias_statement"
        155 => render_type_parameter(node), // "type_parameter"
        208 => render_type(node), // "type"
        182 => render_typed_default_parameter(node), // "typed_default_parameter"
        207 => render_typed_parameter(node), // "typed_parameter"
        192 => render_unary_operator(node), // "unary_operator"
        166 => render_union_pattern(node), // "union_pattern"
        211 => render_union_type(node), // "union_type"
        138 => render_while_statement(node), // "while_statement"
        244 => render_with_clause_bare(node), // "with_clause_bare"
        143 => render_with_clause(node), // "with_clause"
        144 => render_with_item(node), // "with_item"
        142 => render_with_statement(node), // "with_statement"
        202 => render_yield(node), // "yield"
        _ => token_shaped_fallback(node),
    }
}
