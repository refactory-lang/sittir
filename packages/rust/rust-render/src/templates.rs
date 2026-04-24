// @generated from packages/rust/node-model.json5 and packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --rust-render
//
// Per-kind askama template structs + render_dispatch + GrammarMeta impl
// for the rust grammar. Every struct in this file is backed by a
// sibling `.jinja` template under `templates/`, copied from
// `packages/rust/templates/` at codegen time (spec 012 T030).
//
// Templates and fields are derived from:
//   - template bodies in packages/rust/templates/*.jinja
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
#[template(path = "_array_expression_list.jinja", escape = "none")]
pub struct ArrayExpressionListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: String,
    pub attributes_list: Vec<String>,
    pub elements: String,
    pub elements_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_array_expression_semi.jinja", escape = "none")]
pub struct ArrayExpressionSemiTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: String,
    pub attributes_list: Vec<String>,
    pub elements: String,
    pub elements_list: Vec<String>,
    pub length: String,
    pub length_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_block.jinja", escape = "none")]
pub struct ClosureExpressionBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_expr.jinja", escape = "none")]
pub struct ClosureExpressionExprTemplate {
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
#[template(path = "_delim_token_tree_brace.jinja", escape = "none")]
pub struct DelimTokenTreeBraceTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_bracket.jinja", escape = "none")]
pub struct DelimTokenTreeBracketTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_paren.jinja", escape = "none")]
pub struct DelimTokenTreeParenTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_block_ending.jinja", escape = "none")]
pub struct ExpressionStatementBlockEndingTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_with_semi.jinja", escape = "none")]
pub struct ExpressionStatementWithSemiTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_field_identifier.jinja", escape = "none")]
pub struct FieldIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_named.jinja", escape = "none")]
pub struct FieldPatternNamedTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_shorthand.jinja", escape = "none")]
pub struct FieldPatternShorthandTemplate {
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
#[template(path = "_foreign_mod_item_body.jinja", escape = "none")]
pub struct ForeignModItemBodyTemplate {
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
#[template(path = "_function_type_fn_form.jinja", escape = "none")]
pub struct FunctionTypeFnFormTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_trait_form.jinja", escape = "none")]
pub struct FunctionTypeTraitFormTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#trait: String,
    pub r#trait_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_impl_item_body.jinja", escape = "none")]
pub struct ImplItemBodyTemplate {
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
#[template(path = "_let_chain.jinja", escape = "none")]
pub struct LetChainTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_line_comment_doc.jinja", escape = "none")]
pub struct LineCommentDocTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub doc: String,
    pub doc_list: Vec<String>,
    pub inner: String,
    pub inner_list: Vec<String>,
    pub outer: String,
    pub outer_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_brace.jinja", escape = "none")]
pub struct MacroDefinitionBraceTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_bracket.jinja", escape = "none")]
pub struct MacroDefinitionBracketTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_paren.jinja", escape = "none")]
pub struct MacroDefinitionParenTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_match_arm_block_ending.jinja", escape = "none")]
pub struct MatchArmBlockEndingTemplate {
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
#[template(path = "_match_arm_with_comma.jinja", escape = "none")]
pub struct MatchArmWithCommaTemplate {
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
#[template(path = "_mod_item_inline.jinja", escape = "none")]
pub struct ModItemInlineTemplate {
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
#[template(path = "_or_pattern_binary.jinja", escape = "none")]
pub struct OrPatternBinaryTemplate {
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
#[template(path = "_or_pattern_prefix.jinja", escape = "none")]
pub struct OrPatternPrefixTemplate {
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
#[template(path = "_pointer_type_mut.jinja", escape = "none")]
pub struct PointerTypeMutTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_bare.jinja", escape = "none")]
pub struct RangeExpressionBareTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_binary.jinja", escape = "none")]
pub struct RangeExpressionBinaryTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub end: String,
    pub end_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
    pub start: String,
    pub start_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_postfix.jinja", escape = "none")]
pub struct RangeExpressionPostfixTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operator: String,
    pub operator_list: Vec<String>,
    pub start: String,
    pub start_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_prefix.jinja", escape = "none")]
pub struct RangeExpressionPrefixTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub end: String,
    pub end_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_range_pattern_prefix.jinja", escape = "none")]
pub struct RangePatternPrefixTemplate {
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
#[template(path = "_reference_expression_raw_mut.jinja", escape = "none")]
pub struct ReferenceExpressionRawMutTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_reserved_identifier.jinja", escape = "none")]
pub struct ReservedIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_string_content.jinja", escape = "none")]
pub struct _StringContentTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_brace.jinja", escape = "none")]
pub struct StructItemBraceTemplate {
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
#[template(path = "_struct_item_tuple.jinja", escape = "none")]
pub struct StructItemTupleTemplate {
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
#[template(path = "_token_tree_brace.jinja", escape = "none")]
pub struct TokenTreeBraceTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_bracket.jinja", escape = "none")]
pub struct TokenTreeBracketTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_paren.jinja", escape = "none")]
pub struct TokenTreeParenTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_brace.jinja", escape = "none")]
pub struct TokenTreePatternBraceTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_bracket.jinja", escape = "none")]
pub struct TokenTreePatternBracketTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_paren.jinja", escape = "none")]
pub struct TokenTreePatternParenTemplate {
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
#[template(path = "_visibility_modifier_crate.jinja", escape = "none")]
pub struct VisibilityModifierCrateTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub_in_path.jinja", escape = "none")]
pub struct VisibilityModifierPubInPathTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#in: String,
    pub r#in_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub.jinja", escape = "none")]
pub struct VisibilityModifierPubTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#pub: String,
    pub r#pub_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_type.jinja", escape = "none")]
pub struct AbstractTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#trait: String,
    pub r#trait_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
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
#[template(path = "array_expression.jinja", escape = "none")]
pub struct ArrayExpressionTemplate {
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
    pub element: String,
    pub element_list: Vec<String>,
    pub length: String,
    pub length_list: Vec<String>,
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
}

#[derive(::askama::Template)]
#[template(path = "associated_type.jinja", escape = "none")]
pub struct AssociatedTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bounds: String,
    pub bounds_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "async_block.jinja", escape = "none")]
pub struct AsyncBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub block: String,
    pub block_list: Vec<String>,
    pub r#move: String,
    pub r#move_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "attribute_item.jinja", escape = "none")]
pub struct AttributeItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: String,
    pub attribute_list: Vec<String>,
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
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
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
}

#[derive(::askama::Template)]
#[template(path = "base_field_initializer.jinja", escape = "none")]
pub struct BaseFieldInitializerTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "block_comment.jinja", escape = "none")]
pub struct BlockCommentTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub doc: String,
    pub doc_list: Vec<String>,
    pub inner: String,
    pub inner_list: Vec<String>,
    pub outer: String,
    pub outer_list: Vec<String>,
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
    pub label: String,
    pub label_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "bounded_type.jinja", escape = "none")]
pub struct BoundedTypeTemplate {
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
#[template(path = "bracketed_type.jinja", escape = "none")]
pub struct BracketedTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "break_expression.jinja", escape = "none")]
pub struct BreakExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub expression: String,
    pub expression_list: Vec<String>,
    pub label: String,
    pub label_list: Vec<String>,
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
    pub arguments: String,
    pub arguments_list: Vec<String>,
    pub function: String,
    pub function_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "captured_pattern.jinja", escape = "none")]
pub struct CapturedPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub identifier: String,
    pub identifier_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression.jinja", escape = "none")]
pub struct ClosureExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub r#move: String,
    pub r#move_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub r#static: String,
    pub r#static_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "closure_parameters.jinja", escape = "none")]
pub struct ClosureParametersTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "comment.jinja", escape = "none")]
pub struct CommentTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "compound_assignment_expr.jinja", escape = "none")]
pub struct CompoundAssignmentExprTemplate {
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
#[template(path = "const_block.jinja", escape = "none")]
pub struct ConstBlockTemplate {
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
#[template(path = "const_item.jinja", escape = "none")]
pub struct ConstItemTemplate {
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
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "const_parameter.jinja", escape = "none")]
pub struct ConstParameterTemplate {
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
#[template(path = "continue_expression.jinja", escape = "none")]
pub struct ContinueExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub label: String,
    pub label_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "declaration_list.jinja", escape = "none")]
pub struct DeclarationListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree.jinja", escape = "none")]
pub struct DelimTokenTreeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dynamic_type.jinja", escape = "none")]
pub struct DynamicTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#trait: String,
    pub r#trait_list: Vec<String>,
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
}

#[derive(::askama::Template)]
#[template(path = "enum_item.jinja", escape = "none")]
pub struct EnumItemTemplate {
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
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant_list.jinja", escape = "none")]
pub struct EnumVariantListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant.jinja", escape = "none")]
pub struct EnumVariantTemplate {
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
    pub value: String,
    pub value_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
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
#[template(path = "extern_crate_declaration.jinja", escape = "none")]
pub struct ExternCrateDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub crate_: String,
    pub crate__list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "extern_modifier.jinja", escape = "none")]
pub struct ExternModifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub string_literal: String,
    pub string_literal_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration_list.jinja", escape = "none")]
pub struct FieldDeclarationListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration.jinja", escape = "none")]
pub struct FieldDeclarationTemplate {
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
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "field_expression.jinja", escape = "none")]
pub struct FieldExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub field: String,
    pub field_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer_list.jinja", escape = "none")]
pub struct FieldInitializerListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer.jinja", escape = "none")]
pub struct FieldInitializerTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub field: String,
    pub field_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "field_pattern.jinja", escape = "none")]
pub struct FieldPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub r#ref: String,
    pub r#ref_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "for_expression.jinja", escape = "none")]
pub struct ForExpressionTemplate {
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
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "for_lifetimes.jinja", escape = "none")]
pub struct ForLifetimesTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item.jinja", escape = "none")]
pub struct ForeignModItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub extern_modifier: String,
    pub extern_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "function_item.jinja", escape = "none")]
pub struct FunctionItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub function_modifiers: String,
    pub function_modifiers_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "function_modifiers.jinja", escape = "none")]
pub struct FunctionModifiersTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#async: String,
    pub r#async_list: Vec<String>,
    pub r#const: String,
    pub r#const_list: Vec<String>,
    pub default: String,
    pub default_list: Vec<String>,
    pub r#unsafe: String,
    pub r#unsafe_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "function_signature_item.jinja", escape = "none")]
pub struct FunctionSignatureItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub function_modifiers: String,
    pub function_modifiers_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
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
    pub for_lifetimes: String,
    pub for_lifetimes_list: Vec<String>,
    pub parameters: String,
    pub parameters_list: Vec<String>,
    pub return_type: String,
    pub return_type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "gen_block.jinja", escape = "none")]
pub struct GenBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub block: String,
    pub block_list: Vec<String>,
    pub r#move: String,
    pub r#move_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "generic_function.jinja", escape = "none")]
pub struct GenericFunctionTemplate {
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
#[template(path = "generic_pattern.jinja", escape = "none")]
pub struct GenericPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type_with_turbofish.jinja", escape = "none")]
pub struct GenericTypeWithTurbofishTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub turbofish: String,
    pub turbofish_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
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
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "higher_ranked_trait_bound.jinja", escape = "none")]
pub struct HigherRankedTraitBoundTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "if_expression.jinja", escape = "none")]
pub struct IfExpressionTemplate {
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
#[template(path = "impl_item.jinja", escape = "none")]
pub struct ImplItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bang: String,
    pub bang_list: Vec<String>,
    pub r#trait: String,
    pub r#trait_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub r#unsafe: String,
    pub r#unsafe_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "index_expression.jinja", escape = "none")]
pub struct IndexExpressionTemplate {
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
#[template(path = "inner_attribute_item.jinja", escape = "none")]
pub struct InnerAttributeItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attribute: String,
    pub attribute_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "label.jinja", escape = "none")]
pub struct LabelTemplate {
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
#[template(path = "last_match_arm.jinja", escape = "none")]
pub struct LastMatchArmTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "let_condition.jinja", escape = "none")]
pub struct LetConditionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "let_declaration.jinja", escape = "none")]
pub struct LetDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alternative: String,
    pub alternative_list: Vec<String>,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "lifetime_parameter.jinja", escape = "none")]
pub struct LifetimeParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bounds: String,
    pub bounds_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "lifetime.jinja", escape = "none")]
pub struct LifetimeTemplate {
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
#[template(path = "line_comment.jinja", escape = "none")]
pub struct LineCommentTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "loop_expression.jinja", escape = "none")]
pub struct LoopExpressionTemplate {
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
#[template(path = "macro_definition.jinja", escape = "none")]
pub struct MacroDefinitionTemplate {
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
#[template(path = "macro_invocation.jinja", escape = "none")]
pub struct MacroInvocationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#macro: String,
    pub r#macro_list: Vec<String>,
    pub token_tree: String,
    pub token_tree_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "macro_rule.jinja", escape = "none")]
pub struct MacroRuleTemplate {
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
#[template(path = "match_arm.jinja", escape = "none")]
pub struct MatchArmTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "match_expression.jinja", escape = "none")]
pub struct MatchExpressionTemplate {
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
#[template(path = "match_pattern.jinja", escape = "none")]
pub struct MatchPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub condition: String,
    pub condition_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "mod_item.jinja", escape = "none")]
pub struct ModItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "mut_pattern.jinja", escape = "none")]
pub struct MutPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "negative_literal.jinja", escape = "none")]
pub struct NegativeLiteralTemplate {
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
#[template(path = "or_pattern.jinja", escape = "none")]
pub struct OrPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ordered_field_declaration_list.jinja", escape = "none")]
pub struct OrderedFieldDeclarationListTemplate {
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
#[template(path = "parameter.jinja", escape = "none")]
pub struct ParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
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
#[template(path = "pointer_type.jinja", escape = "none")]
pub struct PointerTypeTemplate {
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
#[template(path = "qualified_type.jinja", escape = "none")]
pub struct QualifiedTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "range_expression.jinja", escape = "none")]
pub struct RangeExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "range_pattern.jinja", escape = "none")]
pub struct RangePatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "raw_string_literal.jinja", escape = "none")]
pub struct RawStringLiteralTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ref_pattern.jinja", escape = "none")]
pub struct RefPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "reference_expression.jinja", escape = "none")]
pub struct ReferenceExpressionTemplate {
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
#[template(path = "reference_pattern.jinja", escape = "none")]
pub struct ReferencePatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "reference_type.jinja", escape = "none")]
pub struct ReferenceTypeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub lifetime: String,
    pub lifetime_list: Vec<String>,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "removed_trait_bound.jinja", escape = "none")]
pub struct RemovedTraitBoundTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "return_expression.jinja", escape = "none")]
pub struct ReturnExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "scoped_identifier.jinja", escape = "none")]
pub struct ScopedIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub path: String,
    pub path_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier_in_expression_position.jinja", escape = "none")]
pub struct ScopedTypeIdentifierInExpressionPositionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub path: String,
    pub path_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier.jinja", escape = "none")]
pub struct ScopedTypeIdentifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub path: String,
    pub path_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_use_list.jinja", escape = "none")]
pub struct ScopedUseListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub list: String,
    pub list_list: Vec<String>,
    pub path: String,
    pub path_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "self_parameter.jinja", escape = "none")]
pub struct SelfParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub lifetime: String,
    pub lifetime_list: Vec<String>,
    pub lifetime_name: String,
    pub lifetime_name_list: Vec<String>,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub self_: String,
    pub self__list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "shorthand_field_initializer.jinja", escape = "none")]
pub struct ShorthandFieldInitializerTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: String,
    pub attributes_list: Vec<String>,
    pub identifier: String,
    pub identifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "slice_pattern.jinja", escape = "none")]
pub struct SlicePatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "source_file.jinja", escape = "none")]
pub struct SourceFileTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub shebang: String,
    pub shebang_list: Vec<String>,
    pub statements: String,
    pub statements_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "static_item.jinja", escape = "none")]
pub struct StaticItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "string_literal.jinja", escape = "none")]
pub struct StringLiteralTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "struct_expression.jinja", escape = "none")]
pub struct StructExpressionTemplate {
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
#[template(path = "struct_item.jinja", escape = "none")]
pub struct StructItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "struct_pattern.jinja", escape = "none")]
pub struct StructPatternTemplate {
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
#[template(path = "token_binding_pattern.jinja", escape = "none")]
pub struct TokenBindingPatternTemplate {
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
#[template(path = "token_repetition_pattern.jinja", escape = "none")]
pub struct TokenRepetitionPatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition.jinja", escape = "none")]
pub struct TokenRepetitionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern.jinja", escape = "none")]
pub struct TokenTreePatternTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree.jinja", escape = "none")]
pub struct TokenTreeTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "trait_bounds.jinja", escape = "none")]
pub struct TraitBoundsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "trait_item.jinja", escape = "none")]
pub struct TraitItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub body: String,
    pub body_list: Vec<String>,
    pub bounds: String,
    pub bounds_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub r#unsafe: String,
    pub r#unsafe_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "try_block.jinja", escape = "none")]
pub struct TryBlockTemplate {
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
#[template(path = "try_expression.jinja", escape = "none")]
pub struct TryExpressionTemplate {
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
#[template(path = "tuple_expression.jinja", escape = "none")]
pub struct TupleExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: String,
    pub attributes_list: Vec<String>,
    pub elements: String,
    pub elements_list: Vec<String>,
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
#[template(path = "tuple_struct_pattern.jinja", escape = "none")]
pub struct TupleStructPatternTemplate {
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
#[template(path = "type_binding.jinja", escape = "none")]
pub struct TypeBindingTemplate {
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
    pub type_arguments: String,
    pub type_arguments_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_cast_expression.jinja", escape = "none")]
pub struct TypeCastExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub value: String,
    pub value_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "type_item.jinja", escape = "none")]
pub struct TypeItemTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub name: String,
    pub name_list: Vec<String>,
    pub trailing_where_clause: String,
    pub trailing_where_clause_list: Vec<String>,
    pub r#type: String,
    pub r#type_list: Vec<String>,
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
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
    pub bounds: String,
    pub bounds_list: Vec<String>,
    pub default_type: String,
    pub default_type_list: Vec<String>,
    pub name: String,
    pub name_list: Vec<String>,
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
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operand: String,
    pub operand_list: Vec<String>,
    pub operator: String,
    pub operator_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "union_item.jinja", escape = "none")]
pub struct UnionItemTemplate {
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
    pub type_parameters: String,
    pub type_parameters_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
    pub where_clause: String,
    pub where_clause_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "unsafe_block.jinja", escape = "none")]
pub struct UnsafeBlockTemplate {
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
#[template(path = "use_as_clause.jinja", escape = "none")]
pub struct UseAsClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub alias: String,
    pub alias_list: Vec<String>,
    pub path: String,
    pub path_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "use_bounds.jinja", escape = "none")]
pub struct UseBoundsTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "use_declaration.jinja", escape = "none")]
pub struct UseDeclarationTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub argument: String,
    pub argument_list: Vec<String>,
    pub visibility_modifier: String,
    pub visibility_modifier_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "use_list.jinja", escape = "none")]
pub struct UseListTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "use_wildcard.jinja", escape = "none")]
pub struct UseWildcardTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub path: String,
    pub path_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "variadic_parameter.jinja", escape = "none")]
pub struct VariadicParameterTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: String,
    pub mutable_specifier_list: Vec<String>,
    pub pattern: String,
    pub pattern_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier.jinja", escape = "none")]
pub struct VisibilityModifierTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "where_clause.jinja", escape = "none")]
pub struct WhereClauseTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "where_predicate.jinja", escape = "none")]
pub struct WherePredicateTemplate {
    pub children: Vec<String>,
    pub children_list: Vec<String>,
    pub variant: String,
    pub text: String,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bounds: String,
    pub bounds_list: Vec<String>,
    pub left: String,
    pub left_list: Vec<String>,
}

#[derive(::askama::Template)]
#[template(path = "while_expression.jinja", escape = "none")]
pub struct WhileExpressionTemplate {
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
    pub label: String,
    pub label_list: Vec<String>,
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
        "_array_expression_list" => {
            let t = ArrayExpressionListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attributes: ctx.fields.get("attributes").cloned().unwrap_or_default(),
                attributes_list: ctx.fields_list.get("attributes").cloned().unwrap_or_default(),
                elements: ctx.fields.get("elements").cloned().unwrap_or_default(),
                elements_list: ctx.fields_list.get("elements").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_array_expression_semi" => {
            let t = ArrayExpressionSemiTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attributes: ctx.fields.get("attributes").cloned().unwrap_or_default(),
                attributes_list: ctx.fields_list.get("attributes").cloned().unwrap_or_default(),
                elements: ctx.fields.get("elements").cloned().unwrap_or_default(),
                elements_list: ctx.fields_list.get("elements").cloned().unwrap_or_default(),
                length: ctx.fields.get("length").cloned().unwrap_or_default(),
                length_list: ctx.fields_list.get("length").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_closure_expression_block" => {
            let t = ClosureExpressionBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_closure_expression_expr" => {
            let t = ClosureExpressionExprTemplate {
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
        "_delim_token_tree_brace" => {
            let t = DelimTokenTreeBraceTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_delim_token_tree_bracket" => {
            let t = DelimTokenTreeBracketTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_delim_token_tree_paren" => {
            let t = DelimTokenTreeParenTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_expression_statement_block_ending" => {
            let t = ExpressionStatementBlockEndingTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_expression_statement_with_semi" => {
            let t = ExpressionStatementWithSemiTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_field_identifier" => {
            let t = FieldIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_field_pattern_named" => {
            let t = FieldPatternNamedTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_field_pattern_shorthand" => {
            let t = FieldPatternShorthandTemplate {
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
        "_foreign_mod_item_body" => {
            let t = ForeignModItemBodyTemplate {
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
        "_function_type_fn_form" => {
            let t = FunctionTypeFnFormTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_function_type_trait_form" => {
            let t = FunctionTypeTraitFormTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#trait: ctx.fields.get("trait").cloned().unwrap_or_default(),
                r#trait_list: ctx.fields_list.get("trait").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_impl_item_body" => {
            let t = ImplItemBodyTemplate {
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
        "_let_chain" => {
            let t = LetChainTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_line_comment_doc" => {
            let t = LineCommentDocTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                doc: ctx.fields.get("doc").cloned().unwrap_or_default(),
                doc_list: ctx.fields_list.get("doc").cloned().unwrap_or_default(),
                inner: ctx.fields.get("inner").cloned().unwrap_or_default(),
                inner_list: ctx.fields_list.get("inner").cloned().unwrap_or_default(),
                outer: ctx.fields.get("outer").cloned().unwrap_or_default(),
                outer_list: ctx.fields_list.get("outer").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_macro_definition_brace" => {
            let t = MacroDefinitionBraceTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_macro_definition_bracket" => {
            let t = MacroDefinitionBracketTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_macro_definition_paren" => {
            let t = MacroDefinitionParenTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_match_arm_block_ending" => {
            let t = MatchArmBlockEndingTemplate {
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
        "_match_arm_with_comma" => {
            let t = MatchArmWithCommaTemplate {
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
        "_mod_item_inline" => {
            let t = ModItemInlineTemplate {
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
        "_or_pattern_binary" => {
            let t = OrPatternBinaryTemplate {
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
        "_or_pattern_prefix" => {
            let t = OrPatternPrefixTemplate {
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
        "_pointer_type_mut" => {
            let t = PointerTypeMutTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_range_expression_bare" => {
            let t = RangeExpressionBareTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_range_expression_binary" => {
            let t = RangeExpressionBinaryTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                end: ctx.fields.get("end").cloned().unwrap_or_default(),
                end_list: ctx.fields_list.get("end").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
                start: ctx.fields.get("start").cloned().unwrap_or_default(),
                start_list: ctx.fields_list.get("start").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_range_expression_postfix" => {
            let t = RangeExpressionPostfixTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
                start: ctx.fields.get("start").cloned().unwrap_or_default(),
                start_list: ctx.fields_list.get("start").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_range_expression_prefix" => {
            let t = RangeExpressionPrefixTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                end: ctx.fields.get("end").cloned().unwrap_or_default(),
                end_list: ctx.fields_list.get("end").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_range_pattern_prefix" => {
            let t = RangePatternPrefixTemplate {
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
        "_reference_expression_raw_mut" => {
            let t = ReferenceExpressionRawMutTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_reserved_identifier" => {
            let t = ReservedIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_string_content" => {
            let t = _StringContentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_struct_item_brace" => {
            let t = StructItemBraceTemplate {
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
        "_struct_item_tuple" => {
            let t = StructItemTupleTemplate {
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
        "_token_tree_brace" => {
            let t = TokenTreeBraceTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_token_tree_bracket" => {
            let t = TokenTreeBracketTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_token_tree_paren" => {
            let t = TokenTreeParenTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_token_tree_pattern_brace" => {
            let t = TokenTreePatternBraceTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_token_tree_pattern_bracket" => {
            let t = TokenTreePatternBracketTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_token_tree_pattern_paren" => {
            let t = TokenTreePatternParenTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "_visibility_modifier_crate" => {
            let t = VisibilityModifierCrateTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "_visibility_modifier_pub_in_path" => {
            let t = VisibilityModifierPubInPathTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#in: ctx.fields.get("in").cloned().unwrap_or_default(),
                r#in_list: ctx.fields_list.get("in").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "_visibility_modifier_pub" => {
            let t = VisibilityModifierPubTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#pub: ctx.fields.get("pub").cloned().unwrap_or_default(),
                r#pub_list: ctx.fields_list.get("pub").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "abstract_type" => {
            let t = AbstractTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#trait: ctx.fields.get("trait").cloned().unwrap_or_default(),
                r#trait_list: ctx.fields_list.get("trait").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "array_expression" => {
            let t = ArrayExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "array_type" => {
            let t = ArrayTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                element: ctx.fields.get("element").cloned().unwrap_or_default(),
                element_list: ctx.fields_list.get("element").cloned().unwrap_or_default(),
                length: ctx.fields.get("length").cloned().unwrap_or_default(),
                length_list: ctx.fields_list.get("length").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
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
            };
            t.render_with_values(&_values)
        }
        "associated_type" => {
            let t = AssociatedTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                bounds: ctx.fields.get("bounds").cloned().unwrap_or_default(),
                bounds_list: ctx.fields_list.get("bounds").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "async_block" => {
            let t = AsyncBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                block: ctx.fields.get("block").cloned().unwrap_or_default(),
                block_list: ctx.fields_list.get("block").cloned().unwrap_or_default(),
                r#move: ctx.fields.get("move").cloned().unwrap_or_default(),
                r#move_list: ctx.fields_list.get("move").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "attribute_item" => {
            let t = AttributeItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attribute: ctx.fields.get("attribute").cloned().unwrap_or_default(),
                attribute_list: ctx.fields_list.get("attribute").cloned().unwrap_or_default(),
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
                arguments: ctx.fields.get("arguments").cloned().unwrap_or_default(),
                arguments_list: ctx.fields_list.get("arguments").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "await_expression" => {
            let t = AwaitExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "base_field_initializer" => {
            let t = BaseFieldInitializerTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "block_comment" => {
            let t = BlockCommentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                doc: ctx.fields.get("doc").cloned().unwrap_or_default(),
                doc_list: ctx.fields_list.get("doc").cloned().unwrap_or_default(),
                inner: ctx.fields.get("inner").cloned().unwrap_or_default(),
                inner_list: ctx.fields_list.get("inner").cloned().unwrap_or_default(),
                outer: ctx.fields.get("outer").cloned().unwrap_or_default(),
                outer_list: ctx.fields_list.get("outer").cloned().unwrap_or_default(),
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
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "bounded_type" => {
            let t = BoundedTypeTemplate {
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
        "bracketed_type" => {
            let t = BracketedTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "break_expression" => {
            let t = BreakExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                expression: ctx.fields.get("expression").cloned().unwrap_or_default(),
                expression_list: ctx.fields_list.get("expression").cloned().unwrap_or_default(),
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "call_expression" => {
            let t = CallExpressionTemplate {
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
        "captured_pattern" => {
            let t = CapturedPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "closure_expression" => {
            let t = ClosureExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                r#move: ctx.fields.get("move").cloned().unwrap_or_default(),
                r#move_list: ctx.fields_list.get("move").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                r#static: ctx.fields.get("static").cloned().unwrap_or_default(),
                r#static_list: ctx.fields_list.get("static").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "closure_parameters" => {
            let t = ClosureParametersTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "comment" => {
            let t = CommentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "compound_assignment_expr" => {
            let t = CompoundAssignmentExprTemplate {
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
        "const_block" => {
            let t = ConstBlockTemplate {
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
        "const_item" => {
            let t = ConstItemTemplate {
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
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "const_parameter" => {
            let t = ConstParameterTemplate {
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
        "continue_expression" => {
            let t = ContinueExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "declaration_list" => {
            let t = DeclarationListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "delim_token_tree" => {
            let t = DelimTokenTreeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "dynamic_type" => {
            let t = DynamicTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#trait: ctx.fields.get("trait").cloned().unwrap_or_default(),
                r#trait_list: ctx.fields_list.get("trait").cloned().unwrap_or_default(),
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
            };
            t.render_with_values(&_values)
        }
        "enum_item" => {
            let t = EnumItemTemplate {
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
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "enum_variant_list" => {
            let t = EnumVariantListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "enum_variant" => {
            let t = EnumVariantTemplate {
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
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
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
        "extern_crate_declaration" => {
            let t = ExternCrateDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                crate_: ctx.fields.get("crate").cloned().unwrap_or_default(),
                crate__list: ctx.fields_list.get("crate").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "extern_modifier" => {
            let t = ExternModifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                string_literal: ctx.fields.get("string_literal").cloned().unwrap_or_default(),
                string_literal_list: ctx.fields_list.get("string_literal").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "field_declaration_list" => {
            let t = FieldDeclarationListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "field_declaration" => {
            let t = FieldDeclarationTemplate {
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
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "field_expression" => {
            let t = FieldExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                field: ctx.fields.get("field").cloned().unwrap_or_default(),
                field_list: ctx.fields_list.get("field").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "field_initializer_list" => {
            let t = FieldInitializerListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "field_initializer" => {
            let t = FieldInitializerTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                field: ctx.fields.get("field").cloned().unwrap_or_default(),
                field_list: ctx.fields_list.get("field").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "field_pattern" => {
            let t = FieldPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                r#ref: ctx.fields.get("ref").cloned().unwrap_or_default(),
                r#ref_list: ctx.fields_list.get("ref").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "for_expression" => {
            let t = ForExpressionTemplate {
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
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "for_lifetimes" => {
            let t = ForLifetimesTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "foreign_mod_item" => {
            let t = ForeignModItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                extern_modifier: ctx.fields.get("extern_modifier").cloned().unwrap_or_default(),
                extern_modifier_list: ctx.fields_list.get("extern_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "function_item" => {
            let t = FunctionItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                function_modifiers: ctx.fields.get("function_modifiers").cloned().unwrap_or_default(),
                function_modifiers_list: ctx.fields_list.get("function_modifiers").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "function_modifiers" => {
            let t = FunctionModifiersTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#async: ctx.fields.get("async").cloned().unwrap_or_default(),
                r#async_list: ctx.fields_list.get("async").cloned().unwrap_or_default(),
                r#const: ctx.fields.get("const").cloned().unwrap_or_default(),
                r#const_list: ctx.fields_list.get("const").cloned().unwrap_or_default(),
                default: ctx.fields.get("default").cloned().unwrap_or_default(),
                default_list: ctx.fields_list.get("default").cloned().unwrap_or_default(),
                r#unsafe: ctx.fields.get("unsafe").cloned().unwrap_or_default(),
                r#unsafe_list: ctx.fields_list.get("unsafe").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "function_signature_item" => {
            let t = FunctionSignatureItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                function_modifiers: ctx.fields.get("function_modifiers").cloned().unwrap_or_default(),
                function_modifiers_list: ctx.fields_list.get("function_modifiers").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "function_type" => {
            let t = FunctionTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                for_lifetimes: ctx.fields.get("for_lifetimes").cloned().unwrap_or_default(),
                for_lifetimes_list: ctx.fields_list.get("for_lifetimes").cloned().unwrap_or_default(),
                parameters: ctx.fields.get("parameters").cloned().unwrap_or_default(),
                parameters_list: ctx.fields_list.get("parameters").cloned().unwrap_or_default(),
                return_type: ctx.fields.get("return_type").cloned().unwrap_or_default(),
                return_type_list: ctx.fields_list.get("return_type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "gen_block" => {
            let t = GenBlockTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                block: ctx.fields.get("block").cloned().unwrap_or_default(),
                block_list: ctx.fields_list.get("block").cloned().unwrap_or_default(),
                r#move: ctx.fields.get("move").cloned().unwrap_or_default(),
                r#move_list: ctx.fields_list.get("move").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "generic_function" => {
            let t = GenericFunctionTemplate {
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
            t.render_with_values(&_values)
        }
        "generic_pattern" => {
            let t = GenericPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "generic_type_with_turbofish" => {
            let t = GenericTypeWithTurbofishTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                turbofish: ctx.fields.get("turbofish").cloned().unwrap_or_default(),
                turbofish_list: ctx.fields_list.get("turbofish").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
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
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "higher_ranked_trait_bound" => {
            let t = HigherRankedTraitBoundTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "if_expression" => {
            let t = IfExpressionTemplate {
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
        "impl_item" => {
            let t = ImplItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                bang: ctx.fields.get("bang").cloned().unwrap_or_default(),
                bang_list: ctx.fields_list.get("bang").cloned().unwrap_or_default(),
                r#trait: ctx.fields.get("trait").cloned().unwrap_or_default(),
                r#trait_list: ctx.fields_list.get("trait").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                r#unsafe: ctx.fields.get("unsafe").cloned().unwrap_or_default(),
                r#unsafe_list: ctx.fields_list.get("unsafe").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "index_expression" => {
            let t = IndexExpressionTemplate {
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
            t.render_with_values(&_values)
        }
        "inner_attribute_item" => {
            let t = InnerAttributeItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attribute: ctx.fields.get("attribute").cloned().unwrap_or_default(),
                attribute_list: ctx.fields_list.get("attribute").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "label" => {
            let t = LabelTemplate {
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
        "last_match_arm" => {
            let t = LastMatchArmTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "let_condition" => {
            let t = LetConditionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "let_declaration" => {
            let t = LetDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alternative: ctx.fields.get("alternative").cloned().unwrap_or_default(),
                alternative_list: ctx.fields_list.get("alternative").cloned().unwrap_or_default(),
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "lifetime_parameter" => {
            let t = LifetimeParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                bounds: ctx.fields.get("bounds").cloned().unwrap_or_default(),
                bounds_list: ctx.fields_list.get("bounds").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "lifetime" => {
            let t = LifetimeTemplate {
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
        "line_comment" => {
            let t = LineCommentTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "loop_expression" => {
            let t = LoopExpressionTemplate {
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
            t.render_with_values(&_values)
        }
        "macro_definition" => {
            let t = MacroDefinitionTemplate {
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
        "macro_invocation" => {
            let t = MacroInvocationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#macro: ctx.fields.get("macro").cloned().unwrap_or_default(),
                r#macro_list: ctx.fields_list.get("macro").cloned().unwrap_or_default(),
                token_tree: ctx.fields.get("token_tree").cloned().unwrap_or_default(),
                token_tree_list: ctx.fields_list.get("token_tree").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "macro_rule" => {
            let t = MacroRuleTemplate {
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
        "match_arm" => {
            let t = MatchArmTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "match_block" => {
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
        "match_expression" => {
            let t = MatchExpressionTemplate {
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
            t.render_with_values(&_values)
        }
        "match_pattern" => {
            let t = MatchPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                condition: ctx.fields.get("condition").cloned().unwrap_or_default(),
                condition_list: ctx.fields_list.get("condition").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "mod_item" => {
            let t = ModItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "mut_pattern" => {
            let t = MutPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "negative_literal" => {
            let t = NegativeLiteralTemplate {
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
        "or_pattern" => {
            let t = OrPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "ordered_field_declaration_list" => {
            let t = OrderedFieldDeclarationListTemplate {
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
        "parameter" => {
            let t = ParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
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
        "pointer_type" => {
            let t = PointerTypeTemplate {
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
        "qualified_type" => {
            let t = QualifiedTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "range_expression" => {
            let t = RangeExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "range_pattern" => {
            let t = RangePatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "raw_string_literal" => {
            let t = RawStringLiteralTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "ref_pattern" => {
            let t = RefPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "reference_expression" => {
            let t = ReferenceExpressionTemplate {
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
        "reference_pattern" => {
            let t = ReferencePatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "reference_type" => {
            let t = ReferenceTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                lifetime: ctx.fields.get("lifetime").cloned().unwrap_or_default(),
                lifetime_list: ctx.fields_list.get("lifetime").cloned().unwrap_or_default(),
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "removed_trait_bound" => {
            let t = RemovedTraitBoundTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "return_expression" => {
            let t = ReturnExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "scoped_identifier" => {
            let t = ScopedIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                path: ctx.fields.get("path").cloned().unwrap_or_default(),
                path_list: ctx.fields_list.get("path").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "scoped_type_identifier_in_expression_position" => {
            let t = ScopedTypeIdentifierInExpressionPositionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                path: ctx.fields.get("path").cloned().unwrap_or_default(),
                path_list: ctx.fields_list.get("path").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "scoped_type_identifier" => {
            let t = ScopedTypeIdentifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                path: ctx.fields.get("path").cloned().unwrap_or_default(),
                path_list: ctx.fields_list.get("path").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "scoped_use_list" => {
            let t = ScopedUseListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                list: ctx.fields.get("list").cloned().unwrap_or_default(),
                list_list: ctx.fields_list.get("list").cloned().unwrap_or_default(),
                path: ctx.fields.get("path").cloned().unwrap_or_default(),
                path_list: ctx.fields_list.get("path").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "self_parameter" => {
            let t = SelfParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                lifetime: ctx.fields.get("lifetime").cloned().unwrap_or_default(),
                lifetime_list: ctx.fields_list.get("lifetime").cloned().unwrap_or_default(),
                lifetime_name: ctx.fields.get("lifetime_name").cloned().unwrap_or_default(),
                lifetime_name_list: ctx.fields_list.get("lifetime_name").cloned().unwrap_or_default(),
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                self_: ctx.fields.get("self").cloned().unwrap_or_default(),
                self__list: ctx.fields_list.get("self").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "shorthand_field_initializer" => {
            let t = ShorthandFieldInitializerTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attributes: ctx.fields.get("attributes").cloned().unwrap_or_default(),
                attributes_list: ctx.fields_list.get("attributes").cloned().unwrap_or_default(),
                identifier: ctx.fields.get("identifier").cloned().unwrap_or_default(),
                identifier_list: ctx.fields_list.get("identifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "slice_pattern" => {
            let t = SlicePatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "source_file" => {
            let t = SourceFileTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                shebang: ctx.fields.get("shebang").cloned().unwrap_or_default(),
                shebang_list: ctx.fields_list.get("shebang").cloned().unwrap_or_default(),
                statements: ctx.fields.get("statements").cloned().unwrap_or_default(),
                statements_list: ctx.fields_list.get("statements").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "static_item" => {
            let t = StaticItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "string_literal" => {
            let t = StringLiteralTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "struct_expression" => {
            let t = StructExpressionTemplate {
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
            t.render_with_values(&_values)
        }
        "struct_item" => {
            let t = StructItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "struct_pattern" => {
            let t = StructPatternTemplate {
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
        "token_binding_pattern" => {
            let t = TokenBindingPatternTemplate {
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
            t.render_with_values(&_values)
        }
        "token_repetition_pattern" => {
            let t = TokenRepetitionPatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "token_repetition" => {
            let t = TokenRepetitionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "token_tree_pattern" => {
            let t = TokenTreePatternTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "token_tree" => {
            let t = TokenTreeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "trait_bounds" => {
            let t = TraitBoundsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "trait_item" => {
            let t = TraitItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                body: ctx.fields.get("body").cloned().unwrap_or_default(),
                body_list: ctx.fields_list.get("body").cloned().unwrap_or_default(),
                bounds: ctx.fields.get("bounds").cloned().unwrap_or_default(),
                bounds_list: ctx.fields_list.get("bounds").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                r#unsafe: ctx.fields.get("unsafe").cloned().unwrap_or_default(),
                r#unsafe_list: ctx.fields_list.get("unsafe").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "try_block" => {
            let t = TryBlockTemplate {
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
        "try_expression" => {
            let t = TryExpressionTemplate {
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
        "tuple_expression" => {
            let t = TupleExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                attributes: ctx.fields.get("attributes").cloned().unwrap_or_default(),
                attributes_list: ctx.fields_list.get("attributes").cloned().unwrap_or_default(),
                elements: ctx.fields.get("elements").cloned().unwrap_or_default(),
                elements_list: ctx.fields_list.get("elements").cloned().unwrap_or_default(),
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
        "tuple_struct_pattern" => {
            let t = TupleStructPatternTemplate {
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
        "tuple_type" => {
            let t = TupleTypeTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "type_binding" => {
            let t = TypeBindingTemplate {
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
                type_arguments: ctx.fields.get("type_arguments").cloned().unwrap_or_default(),
                type_arguments_list: ctx.fields_list.get("type_arguments").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "type_cast_expression" => {
            let t = TypeCastExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                value: ctx.fields.get("value").cloned().unwrap_or_default(),
                value_list: ctx.fields_list.get("value").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "type_item" => {
            let t = TypeItemTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
                trailing_where_clause: ctx.fields.get("trailing_where_clause").cloned().unwrap_or_default(),
                trailing_where_clause_list: ctx.fields_list.get("trailing_where_clause").cloned().unwrap_or_default(),
                r#type: ctx.fields.get("type").cloned().unwrap_or_default(),
                r#type_list: ctx.fields_list.get("type").cloned().unwrap_or_default(),
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
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
                bounds: ctx.fields.get("bounds").cloned().unwrap_or_default(),
                bounds_list: ctx.fields_list.get("bounds").cloned().unwrap_or_default(),
                default_type: ctx.fields.get("default_type").cloned().unwrap_or_default(),
                default_type_list: ctx.fields_list.get("default_type").cloned().unwrap_or_default(),
                name: ctx.fields.get("name").cloned().unwrap_or_default(),
                name_list: ctx.fields_list.get("name").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
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
            t.render_with_values(&_values)
        }
        "unary_expression" => {
            let t = UnaryExpressionTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                operand: ctx.fields.get("operand").cloned().unwrap_or_default(),
                operand_list: ctx.fields_list.get("operand").cloned().unwrap_or_default(),
                operator: ctx.fields.get("operator").cloned().unwrap_or_default(),
                operator_list: ctx.fields_list.get("operator").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "union_item" => {
            let t = UnionItemTemplate {
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
                type_parameters: ctx.fields.get("type_parameters").cloned().unwrap_or_default(),
                type_parameters_list: ctx.fields_list.get("type_parameters").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
                where_clause: ctx.fields.get("where_clause").cloned().unwrap_or_default(),
                where_clause_list: ctx.fields_list.get("where_clause").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "unsafe_block" => {
            let t = UnsafeBlockTemplate {
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
        "use_as_clause" => {
            let t = UseAsClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                alias: ctx.fields.get("alias").cloned().unwrap_or_default(),
                alias_list: ctx.fields_list.get("alias").cloned().unwrap_or_default(),
                path: ctx.fields.get("path").cloned().unwrap_or_default(),
                path_list: ctx.fields_list.get("path").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "use_bounds" => {
            let t = UseBoundsTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "use_declaration" => {
            let t = UseDeclarationTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                argument: ctx.fields.get("argument").cloned().unwrap_or_default(),
                argument_list: ctx.fields_list.get("argument").cloned().unwrap_or_default(),
                visibility_modifier: ctx.fields.get("visibility_modifier").cloned().unwrap_or_default(),
                visibility_modifier_list: ctx.fields_list.get("visibility_modifier").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "use_list" => {
            let t = UseListTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "use_wildcard" => {
            let t = UseWildcardTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                path: ctx.fields.get("path").cloned().unwrap_or_default(),
                path_list: ctx.fields_list.get("path").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "variadic_parameter" => {
            let t = VariadicParameterTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                mutable_specifier: ctx.fields.get("mutable_specifier").cloned().unwrap_or_default(),
                mutable_specifier_list: ctx.fields_list.get("mutable_specifier").cloned().unwrap_or_default(),
                pattern: ctx.fields.get("pattern").cloned().unwrap_or_default(),
                pattern_list: ctx.fields_list.get("pattern").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "visibility_modifier" => {
            let t = VisibilityModifierTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "where_clause" => {
            let t = WhereClauseTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
            };
            t.render_with_values(&_values)
        }
        "where_predicate" => {
            let t = WherePredicateTemplate {
                children: ctx.children_list.clone(),
                children_list: ctx.children_list.clone(),
                variant: ctx.variant.clone(),
                text: ctx.text.clone(),
                trailing_sep: ctx.trailing_sep,
                leading_sep: ctx.leading_sep,
                bounds: ctx.fields.get("bounds").cloned().unwrap_or_default(),
                bounds_list: ctx.fields_list.get("bounds").cloned().unwrap_or_default(),
                left: ctx.fields.get("left").cloned().unwrap_or_default(),
                left_list: ctx.fields_list.get("left").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "while_expression" => {
            let t = WhileExpressionTemplate {
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
                label: ctx.fields.get("label").cloned().unwrap_or_default(),
                label_list: ctx.fields_list.get("label").cloned().unwrap_or_default(),
            };
            t.render_with_values(&_values)
        }
        "yield_expression" => {
            let t = YieldExpressionTemplate {
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
pub struct RustGrammarMeta;

impl ::sittir_core::prepare::GrammarMeta for RustGrammarMeta {
    fn separator_for(&self, kind: &str) -> Option<&str> {
        match kind {
            "arguments" => Some(","),
            "closure_parameters" => Some(","),
            "enum_variant_list" => Some(","),
            "field_declaration_list" => Some(","),
            "field_initializer_list" => Some(","),
            "parameters" => Some(","),
            "slice_pattern" => Some(","),
            "trait_bounds" => Some("+"),
            "tuple_pattern" => Some(","),
            "tuple_type" => Some(","),
            "type_arguments" => Some(","),
            "type_parameters" => Some(","),
            "use_list" => Some(","),
            _ => None,
        }
    }
    fn variant_for(&self, parent_kind: &str, child_kind: &str) -> Option<&str> {
        match (parent_kind, child_kind) {
            ("array_expression", "array_expression__form_list") => Some("list"),
            ("array_expression", "array_expression__form_semi") => Some("semi"),
            ("array_expression", "array_expression_list") => Some("semi"),
            ("array_expression", "array_expression_semi") => Some("semi"),
            ("closure_expression", "closure_expression__form_block") => Some("block"),
            ("closure_expression", "closure_expression__form_expr") => Some("expr"),
            ("closure_expression", "closure_expression_block") => Some("block"),
            ("closure_expression", "closure_expression_expr") => Some("block"),
            ("delim_token_tree", "delim_token_tree__form_brace") => Some("brace"),
            ("delim_token_tree", "delim_token_tree__form_bracket") => Some("bracket"),
            ("delim_token_tree", "delim_token_tree__form_paren") => Some("paren"),
            ("delim_token_tree", "delim_token_tree_brace") => Some("paren"),
            ("delim_token_tree", "delim_token_tree_bracket") => Some("paren"),
            ("delim_token_tree", "delim_token_tree_paren") => Some("paren"),
            ("expression_statement", "expression_statement__form_block_ending") => Some("block_ending"),
            ("expression_statement", "expression_statement__form_with_semi") => Some("with_semi"),
            ("expression_statement", "expression_statement_block_ending") => Some("with_semi"),
            ("expression_statement", "expression_statement_with_semi") => Some("with_semi"),
            ("field_pattern", "field_pattern__form_named") => Some("named"),
            ("field_pattern", "field_pattern__form_shorthand") => Some("shorthand"),
            ("field_pattern", "field_pattern_named") => Some("shorthand"),
            ("field_pattern", "field_pattern_shorthand") => Some("shorthand"),
            ("foreign_mod_item", "foreign_mod_item__form_body") => Some("body"),
            ("foreign_mod_item", "foreign_mod_item__form_semi") => Some("semi"),
            ("foreign_mod_item", "foreign_mod_item_body") => Some("semi"),
            ("foreign_mod_item", "foreign_mod_item_semi") => Some("semi"),
            ("impl_item", "impl_item__form_body") => Some("body"),
            ("impl_item", "impl_item__form_semi") => Some("semi"),
            ("impl_item", "impl_item_body") => Some("body"),
            ("impl_item", "impl_item_semi") => Some("body"),
            ("line_comment", "line_comment__form_content") => Some("content"),
            ("line_comment", "line_comment__form_doc") => Some("doc"),
            ("line_comment", "line_comment__form_regular_dslash") => Some("regular_dslash"),
            ("line_comment", "line_comment_content") => Some("regular_dslash"),
            ("line_comment", "line_comment_doc") => Some("regular_dslash"),
            ("line_comment", "line_comment_regular_dslash") => Some("regular_dslash"),
            ("macro_definition", "macro_definition__form_brace") => Some("brace"),
            ("macro_definition", "macro_definition__form_bracket") => Some("bracket"),
            ("macro_definition", "macro_definition__form_paren") => Some("paren"),
            ("macro_definition", "macro_definition_brace") => Some("paren"),
            ("macro_definition", "macro_definition_bracket") => Some("paren"),
            ("macro_definition", "macro_definition_paren") => Some("paren"),
            ("match_arm", "match_arm__form_block_ending") => Some("block_ending"),
            ("match_arm", "match_arm__form_with_comma") => Some("with_comma"),
            ("match_arm", "match_arm_block_ending") => Some("with_comma"),
            ("match_arm", "match_arm_with_comma") => Some("with_comma"),
            ("mod_item", "mod_item__form_external") => Some("external"),
            ("mod_item", "mod_item__form_inline") => Some("inline"),
            ("mod_item", "mod_item_external") => Some("external"),
            ("mod_item", "mod_item_inline") => Some("external"),
            ("or_pattern", "or_pattern__form_binary") => Some("binary"),
            ("or_pattern", "or_pattern__form_prefix") => Some("prefix"),
            ("or_pattern", "or_pattern_binary") => Some("binary"),
            ("or_pattern", "or_pattern_prefix") => Some("binary"),
            ("pointer_type", "pointer_type__form_const") => Some("const"),
            ("pointer_type", "pointer_type__form_mut") => Some("mut"),
            ("pointer_type", "pointer_type_const") => Some("const"),
            ("pointer_type", "pointer_type_mut") => Some("const"),
            ("range_expression", "range_expression__form_bare") => Some("bare"),
            ("range_expression", "range_expression__form_binary") => Some("binary"),
            ("range_expression", "range_expression__form_postfix") => Some("postfix"),
            ("range_expression", "range_expression__form_prefix") => Some("prefix"),
            ("range_expression", "range_expression_bare") => Some("binary"),
            ("range_expression", "range_expression_binary") => Some("binary"),
            ("range_expression", "range_expression_postfix") => Some("binary"),
            ("range_expression", "range_expression_prefix") => Some("binary"),
            ("range_pattern", "range_pattern__form_left_bare") => Some("left_bare"),
            ("range_pattern", "range_pattern__form_left_with_right") => Some("left_with_right"),
            ("range_pattern", "range_pattern__form_prefix") => Some("prefix"),
            ("range_pattern", "range_pattern_left_bare") => Some("prefix"),
            ("range_pattern", "range_pattern_left_with_right") => Some("prefix"),
            ("range_pattern", "range_pattern_prefix") => Some("prefix"),
            ("struct_item", "struct_item__form_brace") => Some("brace"),
            ("struct_item", "struct_item__form_tuple") => Some("tuple"),
            ("struct_item", "struct_item__form_unit") => Some("unit"),
            ("struct_item", "struct_item_brace") => Some("brace"),
            ("struct_item", "struct_item_tuple") => Some("brace"),
            ("struct_item", "struct_item_unit") => Some("brace"),
            ("token_tree", "token_tree__form_brace") => Some("brace"),
            ("token_tree", "token_tree__form_bracket") => Some("bracket"),
            ("token_tree", "token_tree__form_paren") => Some("paren"),
            ("token_tree", "token_tree_brace") => Some("paren"),
            ("token_tree", "token_tree_bracket") => Some("paren"),
            ("token_tree", "token_tree_paren") => Some("paren"),
            ("token_tree_pattern", "token_tree_pattern__form_brace") => Some("brace"),
            ("token_tree_pattern", "token_tree_pattern__form_bracket") => Some("bracket"),
            ("token_tree_pattern", "token_tree_pattern__form_paren") => Some("paren"),
            ("token_tree_pattern", "token_tree_pattern_brace") => Some("paren"),
            ("token_tree_pattern", "token_tree_pattern_bracket") => Some("paren"),
            ("token_tree_pattern", "token_tree_pattern_paren") => Some("paren"),
            ("visibility_modifier", "visibility_modifier__form_crate") => Some("crate"),
            ("visibility_modifier", "visibility_modifier__form_pub") => Some("pub"),
            ("visibility_modifier", "visibility_modifier_crate") => Some("crate"),
            ("visibility_modifier", "visibility_modifier_pub") => Some("crate"),
            _ => None,
        }
    }
    fn is_list_container(&self, kind: &str) -> bool {
        matches!(kind,
            "_delim_token_tree_brace" | "_delim_token_tree_bracket" | "_delim_token_tree_paren" | "_expression_statement_block_ending" | "_expression_statement_with_semi" | "_field_identifier" | "_function_type_fn_form" | "_let_chain" | "_macro_definition_brace" | "_macro_definition_bracket" | "_macro_definition_paren" | "_pointer_type_mut" | "_reference_expression_raw_mut" | "_reserved_identifier" | "_string_content" | "_token_tree_brace" | "_token_tree_bracket" | "_token_tree_paren" | "_token_tree_pattern_brace" | "_token_tree_pattern_bracket" | "_token_tree_pattern_paren" | "_type_identifier" | "_visibility_modifier_crate" | "arguments" | "await_expression" | "base_field_initializer" | "bracketed_type" | "closure_parameters" | "comment" | "declaration_list" | "else_clause" | "enum_variant_list" | "field_declaration_list" | "field_initializer_list" | "for_lifetimes" | "match_block" | "parameters" | "parenthesized_expression" | "ref_pattern" | "removed_trait_bound" | "return_expression" | "slice_pattern" | "string_literal" | "token_repetition" | "token_repetition_pattern" | "trait_bounds" | "tuple_pattern" | "tuple_type" | "type_arguments" | "type_parameters" | "use_bounds" | "use_list" | "where_clause" | "yield_expression"
        )
    }
}
