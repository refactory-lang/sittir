// @generated from packages/rust/node-model.json5 and packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// Per-kind askama template structs + direct render helpers + render_dispatch
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
#[template(path = "_array_expression_list.jinja", escape = "none")]
pub struct ArrayExpressionListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: &'a str,
    pub attributes_list: &'a [String],
    pub attributes_leading_sep: bool,
    pub attributes_trailing_sep: bool,
    pub elements: &'a str,
    pub elements_list: &'a [String],
    pub elements_leading_sep: bool,
    pub elements_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_array_expression_semi.jinja", escape = "none")]
pub struct ArrayExpressionSemiTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: &'a str,
    pub attributes_list: &'a [String],
    pub attributes_leading_sep: bool,
    pub attributes_trailing_sep: bool,
    pub elements: &'a str,
    pub elements_list: &'a [String],
    pub elements_leading_sep: bool,
    pub elements_trailing_sep: bool,
    pub length: &'a str,
    pub length_list: &'a [String],
    pub length_leading_sep: bool,
    pub length_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_block.jinja", escape = "none")]
pub struct ClosureExpressionBlockTemplate<'a> {
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
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_expr.jinja", escape = "none")]
pub struct _ClosureExpressionExprTemplate<'a> {
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
#[template(path = "_delim_token_tree_brace.jinja", escape = "none")]
pub struct _DelimTokenTreeBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_bracket.jinja", escape = "none")]
pub struct _DelimTokenTreeBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_paren.jinja", escape = "none")]
pub struct _DelimTokenTreeParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_block_ending.jinja", escape = "none")]
pub struct _ExpressionStatementBlockEndingTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_with_semi.jinja", escape = "none")]
pub struct _ExpressionStatementWithSemiTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_field_identifier.jinja", escape = "none")]
pub struct FieldIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_named.jinja", escape = "none")]
pub struct FieldPatternNamedTemplate<'a> {
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
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_shorthand.jinja", escape = "none")]
pub struct _FieldPatternShorthandTemplate<'a> {
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
#[template(path = "_foreign_mod_item_body.jinja", escape = "none")]
pub struct _ForeignModItemBodyTemplate<'a> {
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
#[template(path = "_function_type_fn_form.jinja", escape = "none")]
pub struct FunctionTypeFnFormTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_trait_form.jinja", escape = "none")]
pub struct FunctionTypeTraitFormTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#trait: &'a str,
    pub r#trait_list: &'a [String],
    pub r#trait_leading_sep: bool,
    pub r#trait_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_impl_item_body.jinja", escape = "none")]
pub struct _ImplItemBodyTemplate<'a> {
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
#[template(path = "_let_chain.jinja", escape = "none")]
pub struct LetChainTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_line_comment_doc.jinja", escape = "none")]
pub struct LineCommentDocTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub doc: &'a str,
    pub doc_list: &'a [String],
    pub doc_leading_sep: bool,
    pub doc_trailing_sep: bool,
    pub inner: &'a str,
    pub inner_list: &'a [String],
    pub inner_leading_sep: bool,
    pub inner_trailing_sep: bool,
    pub outer: &'a str,
    pub outer_list: &'a [String],
    pub outer_leading_sep: bool,
    pub outer_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_brace.jinja", escape = "none")]
pub struct _MacroDefinitionBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_bracket.jinja", escape = "none")]
pub struct _MacroDefinitionBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_paren.jinja", escape = "none")]
pub struct _MacroDefinitionParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_match_arm_block_ending.jinja", escape = "none")]
pub struct _MatchArmBlockEndingTemplate<'a> {
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
#[template(path = "_match_arm_with_comma.jinja", escape = "none")]
pub struct MatchArmWithCommaTemplate<'a> {
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
#[template(path = "_mod_item_inline.jinja", escape = "none")]
pub struct _ModItemInlineTemplate<'a> {
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
#[template(path = "_or_pattern_binary.jinja", escape = "none")]
pub struct OrPatternBinaryTemplate<'a> {
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
#[template(path = "_or_pattern_prefix.jinja", escape = "none")]
pub struct OrPatternPrefixTemplate<'a> {
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
#[template(path = "_pointer_type_mut.jinja", escape = "none")]
pub struct _PointerTypeMutTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_bare.jinja", escape = "none")]
pub struct _RangeExpressionBareTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_binary.jinja", escape = "none")]
pub struct RangeExpressionBinaryTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub end: &'a str,
    pub end_list: &'a [String],
    pub end_leading_sep: bool,
    pub end_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
    pub start: &'a str,
    pub start_list: &'a [String],
    pub start_leading_sep: bool,
    pub start_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_postfix.jinja", escape = "none")]
pub struct RangeExpressionPostfixTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
    pub start: &'a str,
    pub start_list: &'a [String],
    pub start_leading_sep: bool,
    pub start_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_prefix.jinja", escape = "none")]
pub struct RangeExpressionPrefixTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub end: &'a str,
    pub end_list: &'a [String],
    pub end_leading_sep: bool,
    pub end_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_range_pattern_left_with_right.jinja", escape = "none")]
pub struct RangePatternLeftWithRightTemplate<'a> {
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
#[template(path = "_range_pattern_prefix.jinja", escape = "none")]
pub struct RangePatternPrefixTemplate<'a> {
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
#[template(path = "_reference_expression_raw_mut.jinja", escape = "none")]
pub struct ReferenceExpressionRawMutTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_reserved_identifier.jinja", escape = "none")]
pub struct ReservedIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_shorthand_field_identifier.jinja", escape = "none")]
pub struct ShorthandFieldIdentifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_string_content.jinja", escape = "none")]
pub struct _StringContentTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_brace.jinja", escape = "none")]
pub struct StructItemBraceTemplate<'a> {
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
#[template(path = "_struct_item_tuple.jinja", escape = "none")]
pub struct StructItemTupleTemplate<'a> {
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
#[template(path = "_token_tree_brace.jinja", escape = "none")]
pub struct _TokenTreeBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_bracket.jinja", escape = "none")]
pub struct _TokenTreeBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_paren.jinja", escape = "none")]
pub struct _TokenTreeParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_brace.jinja", escape = "none")]
pub struct _TokenTreePatternBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_bracket.jinja", escape = "none")]
pub struct _TokenTreePatternBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_paren.jinja", escape = "none")]
pub struct _TokenTreePatternParenTemplate<'a> {
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
#[template(path = "_visibility_modifier_crate.jinja", escape = "none")]
pub struct _VisibilityModifierCrateTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_in_path.jinja", escape = "none")]
pub struct VisibilityModifierInPathTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#in: &'a str,
    pub r#in_list: &'a [String],
    pub r#in_leading_sep: bool,
    pub r#in_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub.jinja", escape = "none")]
pub struct VisibilityModifierPubTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#pub: &'a str,
    pub r#pub_list: &'a [String],
    pub r#pub_leading_sep: bool,
    pub r#pub_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "abstract_type.jinja", escape = "none")]
pub struct AbstractTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#trait: &'a str,
    pub r#trait_list: &'a [String],
    pub r#trait_leading_sep: bool,
    pub r#trait_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
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
#[template(path = "array_expression.jinja", escape = "none")]
pub struct ArrayExpressionTemplate<'a> {
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
    pub element: &'a str,
    pub element_list: &'a [String],
    pub element_leading_sep: bool,
    pub element_trailing_sep: bool,
    pub length: &'a str,
    pub length_list: &'a [String],
    pub length_leading_sep: bool,
    pub length_trailing_sep: bool,
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
}

#[derive(::askama::Template)]
#[template(path = "associated_type.jinja", escape = "none")]
pub struct AssociatedTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bounds: &'a str,
    pub bounds_list: &'a [String],
    pub bounds_leading_sep: bool,
    pub bounds_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "async_block.jinja", escape = "none")]
pub struct AsyncBlockTemplate<'a> {
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
    pub move_marker: &'a str,
    pub move_marker_list: &'a [String],
    pub move_marker_leading_sep: bool,
    pub move_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "attribute_item.jinja", escape = "none")]
pub struct AttributeItemTemplate<'a> {
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
    pub arguments: &'a str,
    pub arguments_list: &'a [String],
    pub arguments_leading_sep: bool,
    pub arguments_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
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
}

#[derive(::askama::Template)]
#[template(path = "base_field_initializer.jinja", escape = "none")]
pub struct BaseFieldInitializerTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
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
#[template(path = "block_comment.jinja", escape = "none")]
pub struct BlockCommentTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub doc: &'a str,
    pub doc_list: &'a [String],
    pub doc_leading_sep: bool,
    pub doc_trailing_sep: bool,
    pub inner: &'a str,
    pub inner_list: &'a [String],
    pub inner_leading_sep: bool,
    pub inner_trailing_sep: bool,
    pub outer: &'a str,
    pub outer_list: &'a [String],
    pub outer_leading_sep: bool,
    pub outer_trailing_sep: bool,
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
    pub label: &'a str,
    pub label_list: &'a [String],
    pub label_leading_sep: bool,
    pub label_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "bounded_type.jinja", escape = "none")]
pub struct BoundedTypeTemplate<'a> {
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
#[template(path = "bracketed_type.jinja", escape = "none")]
pub struct BracketedTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "break_expression.jinja", escape = "none")]
pub struct BreakExpressionTemplate<'a> {
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
#[template(path = "captured_pattern.jinja", escape = "none")]
pub struct CapturedPatternTemplate<'a> {
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
#[template(path = "closure_expression_expr.jinja", escape = "none")]
pub struct ClosureExpressionExprTemplate<'a> {
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
#[template(path = "closure_expression.jinja", escape = "none")]
pub struct ClosureExpressionTemplate<'a> {
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
    pub move_marker: &'a str,
    pub move_marker_list: &'a [String],
    pub move_marker_leading_sep: bool,
    pub move_marker_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub static_marker: &'a str,
    pub static_marker_list: &'a [String],
    pub static_marker_leading_sep: bool,
    pub static_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "closure_parameters.jinja", escape = "none")]
pub struct ClosureParametersTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "comment.jinja", escape = "none")]
pub struct CommentTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "compound_assignment_expr.jinja", escape = "none")]
pub struct CompoundAssignmentExprTemplate<'a> {
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
#[template(path = "const_block.jinja", escape = "none")]
pub struct ConstBlockTemplate<'a> {
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
#[template(path = "const_item.jinja", escape = "none")]
pub struct ConstItemTemplate<'a> {
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
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "const_parameter.jinja", escape = "none")]
pub struct ConstParameterTemplate<'a> {
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
#[template(path = "continue_expression.jinja", escape = "none")]
pub struct ContinueExpressionTemplate<'a> {
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
}

#[derive(::askama::Template)]
#[template(path = "declaration_list.jinja", escape = "none")]
pub struct DeclarationListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_brace.jinja", escape = "none")]
pub struct DelimTokenTreeBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_bracket.jinja", escape = "none")]
pub struct DelimTokenTreeBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_paren.jinja", escape = "none")]
pub struct DelimTokenTreeParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree.jinja", escape = "none")]
pub struct DelimTokenTreeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "dynamic_type.jinja", escape = "none")]
pub struct DynamicTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#trait: &'a str,
    pub r#trait_list: &'a [String],
    pub r#trait_leading_sep: bool,
    pub r#trait_trailing_sep: bool,
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
}

#[derive(::askama::Template)]
#[template(path = "enum_item.jinja", escape = "none")]
pub struct EnumItemTemplate<'a> {
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
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant_list.jinja", escape = "none")]
pub struct EnumVariantListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant.jinja", escape = "none")]
pub struct EnumVariantTemplate<'a> {
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
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_block_ending.jinja", escape = "none")]
pub struct ExpressionStatementBlockEndingTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_with_semi.jinja", escape = "none")]
pub struct ExpressionStatementWithSemiTemplate<'a> {
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
#[template(path = "extern_crate_declaration.jinja", escape = "none")]
pub struct ExternCrateDeclarationTemplate<'a> {
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
    pub crate_: &'a str,
    pub crate__list: &'a [String],
    pub crate__leading_sep: bool,
    pub crate__trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "extern_modifier.jinja", escape = "none")]
pub struct ExternModifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub string_literal: &'a str,
    pub string_literal_list: &'a [String],
    pub string_literal_leading_sep: bool,
    pub string_literal_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration_list.jinja", escape = "none")]
pub struct FieldDeclarationListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration.jinja", escape = "none")]
pub struct FieldDeclarationTemplate<'a> {
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
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_expression.jinja", escape = "none")]
pub struct FieldExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub field: &'a str,
    pub field_list: &'a [String],
    pub field_leading_sep: bool,
    pub field_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer_list.jinja", escape = "none")]
pub struct FieldInitializerListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer.jinja", escape = "none")]
pub struct FieldInitializerTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub field: &'a str,
    pub field_list: &'a [String],
    pub field_leading_sep: bool,
    pub field_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "field_pattern_shorthand.jinja", escape = "none")]
pub struct FieldPatternShorthandTemplate<'a> {
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
#[template(path = "field_pattern.jinja", escape = "none")]
pub struct FieldPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub ref_marker: &'a str,
    pub ref_marker_list: &'a [String],
    pub ref_marker_leading_sep: bool,
    pub ref_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "for_expression.jinja", escape = "none")]
pub struct ForExpressionTemplate<'a> {
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
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "for_lifetimes.jinja", escape = "none")]
pub struct ForLifetimesTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item_body.jinja", escape = "none")]
pub struct ForeignModItemBodyTemplate<'a> {
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
#[template(path = "foreign_mod_item.jinja", escape = "none")]
pub struct ForeignModItemTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub extern_modifier: &'a str,
    pub extern_modifier_list: &'a [String],
    pub extern_modifier_leading_sep: bool,
    pub extern_modifier_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_item.jinja", escape = "none")]
pub struct FunctionItemTemplate<'a> {
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
    pub function_modifiers: &'a str,
    pub function_modifiers_list: &'a [String],
    pub function_modifiers_leading_sep: bool,
    pub function_modifiers_trailing_sep: bool,
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
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_modifiers.jinja", escape = "none")]
pub struct FunctionModifiersTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub modifier: &'a str,
    pub modifier_list: &'a [String],
    pub modifier_leading_sep: bool,
    pub modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "function_signature_item.jinja", escape = "none")]
pub struct FunctionSignatureItemTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub function_modifiers: &'a str,
    pub function_modifiers_list: &'a [String],
    pub function_modifiers_leading_sep: bool,
    pub function_modifiers_trailing_sep: bool,
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
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
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
    pub for_lifetimes: &'a str,
    pub for_lifetimes_list: &'a [String],
    pub for_lifetimes_leading_sep: bool,
    pub for_lifetimes_trailing_sep: bool,
    pub parameters: &'a str,
    pub parameters_list: &'a [String],
    pub parameters_leading_sep: bool,
    pub parameters_trailing_sep: bool,
    pub return_type: &'a str,
    pub return_type_list: &'a [String],
    pub return_type_leading_sep: bool,
    pub return_type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "gen_block.jinja", escape = "none")]
pub struct GenBlockTemplate<'a> {
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
    pub move_marker: &'a str,
    pub move_marker_list: &'a [String],
    pub move_marker_leading_sep: bool,
    pub move_marker_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "generic_function.jinja", escape = "none")]
pub struct GenericFunctionTemplate<'a> {
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
#[template(path = "generic_pattern.jinja", escape = "none")]
pub struct GenericPatternTemplate<'a> {
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
}

#[derive(::askama::Template)]
#[template(path = "generic_type_with_turbofish.jinja", escape = "none")]
pub struct GenericTypeWithTurbofishTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub turbofish: &'a str,
    pub turbofish_list: &'a [String],
    pub turbofish_leading_sep: bool,
    pub turbofish_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
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
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "higher_ranked_trait_bound.jinja", escape = "none")]
pub struct HigherRankedTraitBoundTemplate<'a> {
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
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "if_expression.jinja", escape = "none")]
pub struct IfExpressionTemplate<'a> {
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
#[template(path = "impl_item_body.jinja", escape = "none")]
pub struct ImplItemBodyTemplate<'a> {
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
#[template(path = "impl_item.jinja", escape = "none")]
pub struct ImplItemTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub negative: &'a str,
    pub negative_list: &'a [String],
    pub negative_leading_sep: bool,
    pub negative_trailing_sep: bool,
    pub r#trait: &'a str,
    pub r#trait_list: &'a [String],
    pub r#trait_leading_sep: bool,
    pub r#trait_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub unsafe_marker: &'a str,
    pub unsafe_marker_list: &'a [String],
    pub unsafe_marker_leading_sep: bool,
    pub unsafe_marker_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "index_expression.jinja", escape = "none")]
pub struct IndexExpressionTemplate<'a> {
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
#[template(path = "inner_attribute_item.jinja", escape = "none")]
pub struct InnerAttributeItemTemplate<'a> {
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
}

#[derive(::askama::Template)]
#[template(path = "label.jinja", escape = "none")]
pub struct LabelTemplate<'a> {
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
#[template(path = "last_match_arm.jinja", escape = "none")]
pub struct LastMatchArmTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "let_condition.jinja", escape = "none")]
pub struct LetConditionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "let_declaration.jinja", escape = "none")]
pub struct LetDeclarationTemplate<'a> {
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
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
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
#[template(path = "lifetime_parameter.jinja", escape = "none")]
pub struct LifetimeParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bounds: &'a str,
    pub bounds_list: &'a [String],
    pub bounds_leading_sep: bool,
    pub bounds_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "lifetime.jinja", escape = "none")]
pub struct LifetimeTemplate<'a> {
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
#[template(path = "line_comment.jinja", escape = "none")]
pub struct LineCommentTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "loop_expression.jinja", escape = "none")]
pub struct LoopExpressionTemplate<'a> {
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
#[template(path = "macro_definition_brace.jinja", escape = "none")]
pub struct MacroDefinitionBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_bracket.jinja", escape = "none")]
pub struct MacroDefinitionBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_paren.jinja", escape = "none")]
pub struct MacroDefinitionParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition.jinja", escape = "none")]
pub struct MacroDefinitionTemplate<'a> {
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
#[template(path = "macro_invocation.jinja", escape = "none")]
pub struct MacroInvocationTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub r#macro: &'a str,
    pub r#macro_list: &'a [String],
    pub r#macro_leading_sep: bool,
    pub r#macro_trailing_sep: bool,
    pub token_tree: &'a str,
    pub token_tree_list: &'a [String],
    pub token_tree_leading_sep: bool,
    pub token_tree_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "macro_rule.jinja", escape = "none")]
pub struct MacroRuleTemplate<'a> {
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
#[template(path = "match_arm_block_ending.jinja", escape = "none")]
pub struct MatchArmBlockEndingTemplate<'a> {
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
#[template(path = "match_arm.jinja", escape = "none")]
pub struct MatchArmTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "match_expression.jinja", escape = "none")]
pub struct MatchExpressionTemplate<'a> {
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
#[template(path = "match_pattern.jinja", escape = "none")]
pub struct MatchPatternTemplate<'a> {
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
}

#[derive(::askama::Template)]
#[template(path = "mod_item_inline.jinja", escape = "none")]
pub struct ModItemInlineTemplate<'a> {
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
#[template(path = "mod_item.jinja", escape = "none")]
pub struct ModItemTemplate<'a> {
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
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "mut_pattern.jinja", escape = "none")]
pub struct MutPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "negative_literal.jinja", escape = "none")]
pub struct NegativeLiteralTemplate<'a> {
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
#[template(path = "or_pattern.jinja", escape = "none")]
pub struct OrPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ordered_field_declaration_list.jinja", escape = "none")]
pub struct OrderedFieldDeclarationListTemplate<'a> {
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
#[template(path = "parameter.jinja", escape = "none")]
pub struct ParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
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
#[template(path = "pointer_type_mut.jinja", escape = "none")]
pub struct PointerTypeMutTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "pointer_type.jinja", escape = "none")]
pub struct PointerTypeTemplate<'a> {
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
#[template(path = "qualified_type.jinja", escape = "none")]
pub struct QualifiedTypeTemplate<'a> {
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
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "range_expression_bare.jinja", escape = "none")]
pub struct RangeExpressionBareTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "range_expression.jinja", escape = "none")]
pub struct RangeExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "range_pattern.jinja", escape = "none")]
pub struct RangePatternTemplate<'a> {
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
#[template(path = "raw_string_literal.jinja", escape = "none")]
pub struct RawStringLiteralTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "ref_pattern.jinja", escape = "none")]
pub struct RefPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "reference_expression.jinja", escape = "none")]
pub struct ReferenceExpressionTemplate<'a> {
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
#[template(path = "reference_pattern.jinja", escape = "none")]
pub struct ReferencePatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "reference_type.jinja", escape = "none")]
pub struct ReferenceTypeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub lifetime: &'a str,
    pub lifetime_list: &'a [String],
    pub lifetime_leading_sep: bool,
    pub lifetime_trailing_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "removed_trait_bound.jinja", escape = "none")]
pub struct RemovedTraitBoundTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "return_expression.jinja", escape = "none")]
pub struct ReturnExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "scoped_identifier.jinja", escape = "none")]
pub struct ScopedIdentifierTemplate<'a> {
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
    pub path: &'a str,
    pub path_list: &'a [String],
    pub path_leading_sep: bool,
    pub path_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier_in_expression_position.jinja", escape = "none")]
pub struct ScopedTypeIdentifierInExpressionPositionTemplate<'a> {
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
    pub path: &'a str,
    pub path_list: &'a [String],
    pub path_leading_sep: bool,
    pub path_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier.jinja", escape = "none")]
pub struct ScopedTypeIdentifierTemplate<'a> {
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
    pub path: &'a str,
    pub path_list: &'a [String],
    pub path_leading_sep: bool,
    pub path_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "scoped_use_list.jinja", escape = "none")]
pub struct ScopedUseListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub list: &'a str,
    pub list_list: &'a [String],
    pub list_leading_sep: bool,
    pub list_trailing_sep: bool,
    pub path: &'a str,
    pub path_list: &'a [String],
    pub path_leading_sep: bool,
    pub path_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "self_parameter.jinja", escape = "none")]
pub struct SelfParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub lifetime: &'a str,
    pub lifetime_list: &'a [String],
    pub lifetime_leading_sep: bool,
    pub lifetime_trailing_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub reference: &'a str,
    pub reference_list: &'a [String],
    pub reference_leading_sep: bool,
    pub reference_trailing_sep: bool,
    pub self_: &'a str,
    pub self__list: &'a [String],
    pub self__leading_sep: bool,
    pub self__trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "shorthand_field_initializer.jinja", escape = "none")]
pub struct ShorthandFieldInitializerTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: &'a str,
    pub attributes_list: &'a [String],
    pub attributes_leading_sep: bool,
    pub attributes_trailing_sep: bool,
    pub identifier: &'a str,
    pub identifier_list: &'a [String],
    pub identifier_leading_sep: bool,
    pub identifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "slice_pattern.jinja", escape = "none")]
pub struct SlicePatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "source_file.jinja", escape = "none")]
pub struct SourceFileTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub shebang: &'a str,
    pub shebang_list: &'a [String],
    pub shebang_leading_sep: bool,
    pub shebang_trailing_sep: bool,
    pub statements: &'a str,
    pub statements_list: &'a [String],
    pub statements_leading_sep: bool,
    pub statements_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "static_item.jinja", escape = "none")]
pub struct StaticItemTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub ref_marker: &'a str,
    pub ref_marker_list: &'a [String],
    pub ref_marker_leading_sep: bool,
    pub ref_marker_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "string_literal.jinja", escape = "none")]
pub struct StringLiteralTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "struct_expression.jinja", escape = "none")]
pub struct StructExpressionTemplate<'a> {
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
#[template(path = "struct_item.jinja", escape = "none")]
pub struct StructItemTemplate<'a> {
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
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "struct_pattern.jinja", escape = "none")]
pub struct StructPatternTemplate<'a> {
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
#[template(path = "token_binding_pattern.jinja", escape = "none")]
pub struct TokenBindingPatternTemplate<'a> {
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
#[template(path = "token_repetition_pattern.jinja", escape = "none")]
pub struct TokenRepetitionPatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition.jinja", escape = "none")]
pub struct TokenRepetitionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_brace.jinja", escape = "none")]
pub struct TokenTreeBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_bracket.jinja", escape = "none")]
pub struct TokenTreeBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_paren.jinja", escape = "none")]
pub struct TokenTreeParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_brace.jinja", escape = "none")]
pub struct TokenTreePatternBraceTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_bracket.jinja", escape = "none")]
pub struct TokenTreePatternBracketTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_paren.jinja", escape = "none")]
pub struct TokenTreePatternParenTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern.jinja", escape = "none")]
pub struct TokenTreePatternTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "token_tree.jinja", escape = "none")]
pub struct TokenTreeTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "trait_bounds.jinja", escape = "none")]
pub struct TraitBoundsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "trait_item.jinja", escape = "none")]
pub struct TraitItemTemplate<'a> {
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
    pub bounds: &'a str,
    pub bounds_list: &'a [String],
    pub bounds_leading_sep: bool,
    pub bounds_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub unsafe_marker: &'a str,
    pub unsafe_marker_list: &'a [String],
    pub unsafe_marker_leading_sep: bool,
    pub unsafe_marker_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "try_block.jinja", escape = "none")]
pub struct TryBlockTemplate<'a> {
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
#[template(path = "try_expression.jinja", escape = "none")]
pub struct TryExpressionTemplate<'a> {
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
#[template(path = "tuple_expression.jinja", escape = "none")]
pub struct TupleExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub attributes: &'a str,
    pub attributes_list: &'a [String],
    pub attributes_leading_sep: bool,
    pub attributes_trailing_sep: bool,
    pub elements: &'a str,
    pub elements_list: &'a [String],
    pub elements_leading_sep: bool,
    pub elements_trailing_sep: bool,
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
#[template(path = "tuple_struct_pattern.jinja", escape = "none")]
pub struct TupleStructPatternTemplate<'a> {
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
#[template(path = "type_binding.jinja", escape = "none")]
pub struct TypeBindingTemplate<'a> {
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
    pub type_arguments: &'a str,
    pub type_arguments_list: &'a [String],
    pub type_arguments_leading_sep: bool,
    pub type_arguments_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_cast_expression.jinja", escape = "none")]
pub struct TypeCastExpressionTemplate<'a> {
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
    pub value: &'a str,
    pub value_list: &'a [String],
    pub value_leading_sep: bool,
    pub value_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "type_item.jinja", escape = "none")]
pub struct TypeItemTemplate<'a> {
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
    pub trailing_where_clause: &'a str,
    pub trailing_where_clause_list: &'a [String],
    pub trailing_where_clause_leading_sep: bool,
    pub trailing_where_clause_trailing_sep: bool,
    pub r#type: &'a str,
    pub r#type_list: &'a [String],
    pub r#type_leading_sep: bool,
    pub r#type_trailing_sep: bool,
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
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
    pub bounds: &'a str,
    pub bounds_list: &'a [String],
    pub bounds_leading_sep: bool,
    pub bounds_trailing_sep: bool,
    pub default_type: &'a str,
    pub default_type_list: &'a [String],
    pub default_type_leading_sep: bool,
    pub default_type_trailing_sep: bool,
    pub name: &'a str,
    pub name_list: &'a [String],
    pub name_leading_sep: bool,
    pub name_trailing_sep: bool,
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
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub operand: &'a str,
    pub operand_list: &'a [String],
    pub operand_leading_sep: bool,
    pub operand_trailing_sep: bool,
    pub operator: &'a str,
    pub operator_list: &'a [String],
    pub operator_leading_sep: bool,
    pub operator_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "union_item.jinja", escape = "none")]
pub struct UnionItemTemplate<'a> {
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
    pub type_parameters: &'a str,
    pub type_parameters_list: &'a [String],
    pub type_parameters_leading_sep: bool,
    pub type_parameters_trailing_sep: bool,
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
    pub where_clause: &'a str,
    pub where_clause_list: &'a [String],
    pub where_clause_leading_sep: bool,
    pub where_clause_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "unsafe_block.jinja", escape = "none")]
pub struct UnsafeBlockTemplate<'a> {
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
#[template(path = "use_as_clause.jinja", escape = "none")]
pub struct UseAsClauseTemplate<'a> {
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
    pub path: &'a str,
    pub path_list: &'a [String],
    pub path_leading_sep: bool,
    pub path_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "use_bounds.jinja", escape = "none")]
pub struct UseBoundsTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "use_declaration.jinja", escape = "none")]
pub struct UseDeclarationTemplate<'a> {
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
    pub visibility_modifier: &'a str,
    pub visibility_modifier_list: &'a [String],
    pub visibility_modifier_leading_sep: bool,
    pub visibility_modifier_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "use_list.jinja", escape = "none")]
pub struct UseListTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "use_wildcard.jinja", escape = "none")]
pub struct UseWildcardTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub path: &'a str,
    pub path_list: &'a [String],
    pub path_leading_sep: bool,
    pub path_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "variadic_parameter.jinja", escape = "none")]
pub struct VariadicParameterTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub mutable_specifier: &'a str,
    pub mutable_specifier_list: &'a [String],
    pub mutable_specifier_leading_sep: bool,
    pub mutable_specifier_trailing_sep: bool,
    pub pattern: &'a str,
    pub pattern_list: &'a [String],
    pub pattern_leading_sep: bool,
    pub pattern_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier_crate.jinja", escape = "none")]
pub struct VisibilityModifierCrateTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier.jinja", escape = "none")]
pub struct VisibilityModifierTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "where_clause.jinja", escape = "none")]
pub struct WhereClauseTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "where_predicate.jinja", escape = "none")]
pub struct WherePredicateTemplate<'a> {
    pub children: &'a [String],
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    pub bounds: &'a str,
    pub bounds_list: &'a [String],
    pub bounds_leading_sep: bool,
    pub bounds_trailing_sep: bool,
    pub left: &'a str,
    pub left_list: &'a [String],
    pub left_leading_sep: bool,
    pub left_trailing_sep: bool,
}

#[derive(::askama::Template)]
#[template(path = "while_expression.jinja", escape = "none")]
pub struct WhileExpressionTemplate<'a> {
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
    pub label: &'a str,
    pub label_list: &'a [String],
    pub label_leading_sep: bool,
    pub label_trailing_sep: bool,
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
        "closure_parameters" => ",",
        "enum_variant_list" => ",",
        "field_declaration_list" => ",",
        "field_initializer_list" => ",",
        "parameters" => ",",
        "slice_pattern" => ",",
        "trait_bounds" => "+",
        "tuple_pattern" => ",",
        "tuple_type" => ",",
        "type_arguments" => ",",
        "type_parameters" => ",",
        "use_list" => ",",
        _ => "",
    }
}

fn variant_for(parent_kind: &str, child_kind: &str) -> Option<&'static str> {
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
        ("range_pattern", "range_pattern_left_bare") => Some("left_with_right"),
        ("range_pattern", "range_pattern_left_with_right") => Some("left_with_right"),
        ("range_pattern", "range_pattern_prefix") => Some("left_with_right"),
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
        ("visibility_modifier", "visibility_modifier__form_in_path") => Some("in_path"),
        ("visibility_modifier", "visibility_modifier__form_pub") => Some("pub"),
        ("visibility_modifier", "visibility_modifier_crate") => Some("in_path"),
        ("visibility_modifier", "visibility_modifier_in_path") => Some("in_path"),
        ("visibility_modifier", "visibility_modifier_pub") => Some("in_path"),
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

fn render_hidden_array_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements"])?;
    let field_0 = resolve_field(node, "attributes")?;
    let field_1 = resolve_field(node, "elements")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayExpressionListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        attributes: field_0.scalar.as_str(),
        attributes_list: field_0.items.as_slice(),
        attributes_leading_sep: field_0.leading_sep,
        attributes_trailing_sep: field_0.trailing_sep,
        elements: field_1.scalar.as_str(),
        elements_list: field_1.items.as_slice(),
        elements_leading_sep: field_1.leading_sep,
        elements_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_array_expression_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements", "length"])?;
    let field_0 = resolve_field(node, "attributes")?;
    let field_1 = resolve_field(node, "elements")?;
    let field_2 = resolve_field(node, "length")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayExpressionSemiTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        attributes: field_0.scalar.as_str(),
        attributes_list: field_0.items.as_slice(),
        attributes_leading_sep: field_0.leading_sep,
        attributes_trailing_sep: field_0.trailing_sep,
        elements: field_1.scalar.as_str(),
        elements_list: field_1.items.as_slice(),
        elements_leading_sep: field_1.leading_sep,
        elements_trailing_sep: field_1.trailing_sep,
        length: field_2.scalar.as_str(),
        length_list: field_2.items.as_slice(),
        length_leading_sep: field_2.leading_sep,
        length_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_closure_expression_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "return_type"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "return_type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClosureExpressionBlockTemplate {
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
        return_type: field_1.scalar.as_str(),
        return_type_list: field_1.items.as_slice(),
        return_type_leading_sep: field_1.leading_sep,
        return_type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_closure_expression_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ClosureExpressionExprTemplate {
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

fn render_hidden_delim_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _DelimTokenTreeBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_delim_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _DelimTokenTreeBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_delim_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _DelimTokenTreeParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_expression_statement_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ExpressionStatementBlockEndingTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_expression_statement_with_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ExpressionStatementWithSemiTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_field_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_field_pattern_named(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "pattern"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "pattern")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldPatternNamedTemplate {
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
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_field_pattern_shorthand(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _FieldPatternShorthandTemplate {
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

fn render_hidden_foreign_mod_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ForeignModItemBodyTemplate {
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

fn render_hidden_function_type_fn_form(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionTypeFnFormTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_function_type_trait_form(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait"])?;
    let field_0 = resolve_field(node, "trait")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionTypeTraitFormTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#trait: field_0.scalar.as_str(),
        r#trait_list: field_0.items.as_slice(),
        r#trait_leading_sep: field_0.leading_sep,
        r#trait_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_impl_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ImplItemBodyTemplate {
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

fn render_hidden_let_chain(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LetChainTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_line_comment_doc(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["doc", "inner", "outer"])?;
    let field_0 = resolve_field(node, "doc")?;
    let field_1 = resolve_field(node, "inner")?;
    let field_2 = resolve_field(node, "outer")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LineCommentDocTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        doc: field_0.scalar.as_str(),
        doc_list: field_0.items.as_slice(),
        doc_leading_sep: field_0.leading_sep,
        doc_trailing_sep: field_0.trailing_sep,
        inner: field_1.scalar.as_str(),
        inner_list: field_1.items.as_slice(),
        inner_leading_sep: field_1.leading_sep,
        inner_trailing_sep: field_1.trailing_sep,
        outer: field_2.scalar.as_str(),
        outer_list: field_2.items.as_slice(),
        outer_leading_sep: field_2.leading_sep,
        outer_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_macro_definition_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _MacroDefinitionBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_macro_definition_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _MacroDefinitionBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_macro_definition_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _MacroDefinitionParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_match_arm_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _MatchArmBlockEndingTemplate {
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

fn render_hidden_match_arm_with_comma(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchArmWithCommaTemplate {
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

fn render_hidden_mod_item_inline(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _ModItemInlineTemplate {
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

fn render_hidden_or_pattern_binary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OrPatternBinaryTemplate {
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

fn render_hidden_or_pattern_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OrPatternPrefixTemplate {
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

fn render_hidden_pointer_type_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _PointerTypeMutTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_range_expression_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator"])?;
    let field_0 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _RangeExpressionBareTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        operator: field_0.scalar.as_str(),
        operator_list: field_0.items.as_slice(),
        operator_leading_sep: field_0.leading_sep,
        operator_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_range_expression_binary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["end", "operator", "start"])?;
    let field_0 = resolve_field(node, "end")?;
    let field_1 = resolve_field(node, "operator")?;
    let field_2 = resolve_field(node, "start")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangeExpressionBinaryTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        end: field_0.scalar.as_str(),
        end_list: field_0.items.as_slice(),
        end_leading_sep: field_0.leading_sep,
        end_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
        start: field_2.scalar.as_str(),
        start_list: field_2.items.as_slice(),
        start_leading_sep: field_2.leading_sep,
        start_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_hidden_range_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator", "start"])?;
    let field_0 = resolve_field(node, "operator")?;
    let field_1 = resolve_field(node, "start")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangeExpressionPostfixTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        operator: field_0.scalar.as_str(),
        operator_list: field_0.items.as_slice(),
        operator_leading_sep: field_0.leading_sep,
        operator_trailing_sep: field_0.trailing_sep,
        start: field_1.scalar.as_str(),
        start_list: field_1.items.as_slice(),
        start_leading_sep: field_1.leading_sep,
        start_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_range_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["end", "operator"])?;
    let field_0 = resolve_field(node, "end")?;
    let field_1 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangeExpressionPrefixTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        end: field_0.scalar.as_str(),
        end_list: field_0.items.as_slice(),
        end_leading_sep: field_0.leading_sep,
        end_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_hidden_range_pattern_left_with_right(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangePatternLeftWithRightTemplate {
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

fn render_hidden_range_pattern_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangePatternPrefixTemplate {
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

fn render_hidden_reference_expression_raw_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReferenceExpressionRawMutTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_reserved_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReservedIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_shorthand_field_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ShorthandFieldIdentifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _StringContentTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_struct_item_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StructItemBraceTemplate {
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

fn render_hidden_struct_item_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StructItemTupleTemplate {
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

fn render_hidden_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _TokenTreeBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _TokenTreeBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _TokenTreeParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_token_tree_pattern_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _TokenTreePatternBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_token_tree_pattern_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _TokenTreePatternBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_token_tree_pattern_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _TokenTreePatternParenTemplate {
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

fn render_hidden_visibility_modifier_crate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = _VisibilityModifierCrateTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_hidden_visibility_modifier_in_path(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["in"])?;
    let field_0 = resolve_field(node, "in")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VisibilityModifierInPathTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#in: field_0.scalar.as_str(),
        r#in_list: field_0.items.as_slice(),
        r#in_leading_sep: field_0.leading_sep,
        r#in_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_hidden_visibility_modifier_pub(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pub"])?;
    let field_0 = resolve_field(node, "pub")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VisibilityModifierPubTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#pub: field_0.scalar.as_str(),
        r#pub_list: field_0.items.as_slice(),
        r#pub_leading_sep: field_0.leading_sep,
        r#pub_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_abstract_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait", "type_parameters"])?;
    let field_0 = resolve_field(node, "trait")?;
    let field_1 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AbstractTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#trait: field_0.scalar.as_str(),
        r#trait_list: field_0.items.as_slice(),
        r#trait_leading_sep: field_0.leading_sep,
        r#trait_trailing_sep: field_0.trailing_sep,
        type_parameters: field_1.scalar.as_str(),
        type_parameters_list: field_1.items.as_slice(),
        type_parameters_leading_sep: field_1.leading_sep,
        type_parameters_trailing_sep: field_1.trailing_sep,
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

fn render_array_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayExpressionTemplate {
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
    let children = resolve_children(node, &["element", "length"])?;
    let field_0 = resolve_field(node, "element")?;
    let field_1 = resolve_field(node, "length")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ArrayTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        element: field_0.scalar.as_str(),
        element_list: field_0.items.as_slice(),
        element_leading_sep: field_0.leading_sep,
        element_trailing_sep: field_0.trailing_sep,
        length: field_1.scalar.as_str(),
        length_list: field_1.items.as_slice(),
        length_leading_sep: field_1.leading_sep,
        length_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
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
    };
    template.render()
}

fn render_associated_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "name", "type_parameters", "where_clause"])?;
    let field_0 = resolve_field(node, "bounds")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let field_3 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AssociatedTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        bounds: field_0.scalar.as_str(),
        bounds_list: field_0.items.as_slice(),
        bounds_leading_sep: field_0.leading_sep,
        bounds_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
        where_clause: field_3.scalar.as_str(),
        where_clause_list: field_3.items.as_slice(),
        where_clause_leading_sep: field_3.leading_sep,
        where_clause_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_async_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block", "move_marker"])?;
    let field_0 = resolve_field(node, "block")?;
    let field_1 = resolve_field(node, "move_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AsyncBlockTemplate {
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
        move_marker: field_1.scalar.as_str(),
        move_marker_list: field_1.items.as_slice(),
        move_marker_leading_sep: field_1.leading_sep,
        move_marker_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_attribute_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute"])?;
    let field_0 = resolve_field(node, "attribute")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AttributeItemTemplate {
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
    };
    template.render()
}

fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "value"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AttributeTemplate {
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
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = AwaitExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_base_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BaseFieldInitializerTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
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

fn render_block_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["doc", "inner", "outer"])?;
    let field_0 = resolve_field(node, "doc")?;
    let field_1 = resolve_field(node, "inner")?;
    let field_2 = resolve_field(node, "outer")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BlockCommentTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        doc: field_0.scalar.as_str(),
        doc_list: field_0.items.as_slice(),
        doc_leading_sep: field_0.leading_sep,
        doc_trailing_sep: field_0.trailing_sep,
        inner: field_1.scalar.as_str(),
        inner_list: field_1.items.as_slice(),
        inner_leading_sep: field_1.leading_sep,
        inner_trailing_sep: field_1.trailing_sep,
        outer: field_2.scalar.as_str(),
        outer_list: field_2.items.as_slice(),
        outer_leading_sep: field_2.leading_sep,
        outer_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BlockTemplate {
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
    };
    template.render()
}

fn render_bounded_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BoundedTypeTemplate {
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

fn render_bracketed_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BracketedTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_break_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = BreakExpressionTemplate {
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
    };
    template.render()
}

fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments")?;
    let field_1 = resolve_field(node, "function")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CallExpressionTemplate {
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

fn render_captured_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CapturedPatternTemplate {
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

fn render_closure_expression_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClosureExpressionExprTemplate {
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

fn render_closure_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "move_marker", "parameters", "static_marker"])?;
    let field_0 = resolve_field(node, "async_marker")?;
    let field_1 = resolve_field(node, "move_marker")?;
    let field_2 = resolve_field(node, "parameters")?;
    let field_3 = resolve_field(node, "static_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClosureExpressionTemplate {
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
        move_marker: field_1.scalar.as_str(),
        move_marker_list: field_1.items.as_slice(),
        move_marker_leading_sep: field_1.leading_sep,
        move_marker_trailing_sep: field_1.trailing_sep,
        parameters: field_2.scalar.as_str(),
        parameters_list: field_2.items.as_slice(),
        parameters_leading_sep: field_2.leading_sep,
        parameters_trailing_sep: field_2.trailing_sep,
        static_marker: field_3.scalar.as_str(),
        static_marker_list: field_3.items.as_slice(),
        static_marker_leading_sep: field_3.leading_sep,
        static_marker_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_closure_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ClosureParametersTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CommentTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_compound_assignment_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "operator")?;
    let field_2 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = CompoundAssignmentExprTemplate {
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

fn render_const_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstBlockTemplate {
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

fn render_const_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let field_2 = resolve_field(node, "value")?;
    let field_3 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstItemTemplate {
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
        visibility_modifier: field_3.scalar.as_str(),
        visibility_modifier_list: field_3.items.as_slice(),
        visibility_modifier_leading_sep: field_3.leading_sep,
        visibility_modifier_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_const_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let field_2 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ConstParameterTemplate {
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

fn render_continue_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ContinueExpressionTemplate {
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
    };
    template.render()
}

fn render_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DeclarationListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_delim_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DelimTokenTreeBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_delim_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DelimTokenTreeBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_delim_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DelimTokenTreeParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_delim_token_tree(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DelimTokenTreeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_dynamic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait"])?;
    let field_0 = resolve_field(node, "trait")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = DynamicTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#trait: field_0.scalar.as_str(),
        r#trait_list: field_0.items.as_slice(),
        r#trait_leading_sep: field_0.leading_sep,
        r#trait_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ElseClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_enum_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let field_3 = resolve_field(node, "visibility_modifier")?;
    let field_4 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = EnumItemTemplate {
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
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
        visibility_modifier: field_3.scalar.as_str(),
        visibility_modifier_list: field_3.items.as_slice(),
        visibility_modifier_leading_sep: field_3.leading_sep,
        visibility_modifier_trailing_sep: field_3.trailing_sep,
        where_clause: field_4.scalar.as_str(),
        where_clause_list: field_4.items.as_slice(),
        where_clause_leading_sep: field_4.leading_sep,
        where_clause_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_enum_variant_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = EnumVariantListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_enum_variant(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "value")?;
    let field_3 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = EnumVariantTemplate {
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
        value: field_2.scalar.as_str(),
        value_list: field_2.items.as_slice(),
        value_leading_sep: field_2.leading_sep,
        value_trailing_sep: field_2.trailing_sep,
        visibility_modifier: field_3.scalar.as_str(),
        visibility_modifier_list: field_3.items.as_slice(),
        visibility_modifier_leading_sep: field_3.leading_sep,
        visibility_modifier_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_expression_statement_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExpressionStatementBlockEndingTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_expression_statement_with_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExpressionStatementWithSemiTemplate {
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

fn render_extern_crate_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "crate", "name", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "alias")?;
    let field_1 = resolve_field(node, "crate")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExternCrateDeclarationTemplate {
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
        crate_: field_1.scalar.as_str(),
        crate__list: field_1.items.as_slice(),
        crate__leading_sep: field_1.leading_sep,
        crate__trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        visibility_modifier: field_3.scalar.as_str(),
        visibility_modifier_list: field_3.items.as_slice(),
        visibility_modifier_leading_sep: field_3.leading_sep,
        visibility_modifier_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_extern_modifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["string_literal"])?;
    let field_0 = resolve_field(node, "string_literal")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ExternModifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        string_literal: field_0.scalar.as_str(),
        string_literal_list: field_0.items.as_slice(),
        string_literal_leading_sep: field_0.leading_sep,
        string_literal_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_field_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldDeclarationListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_field_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let field_2 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldDeclarationTemplate {
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
        visibility_modifier: field_2.scalar.as_str(),
        visibility_modifier_list: field_2.items.as_slice(),
        visibility_modifier_leading_sep: field_2.leading_sep,
        visibility_modifier_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_field_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["field", "value"])?;
    let field_0 = resolve_field(node, "field")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        field: field_0.scalar.as_str(),
        field_list: field_0.items.as_slice(),
        field_leading_sep: field_0.leading_sep,
        field_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_field_initializer_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldInitializerListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["field", "value"])?;
    let field_0 = resolve_field(node, "field")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldInitializerTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        field: field_0.scalar.as_str(),
        field_list: field_0.items.as_slice(),
        field_leading_sep: field_0.leading_sep,
        field_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_field_pattern_shorthand(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldPatternShorthandTemplate {
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

fn render_field_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "ref_marker"])?;
    let field_0 = resolve_field(node, "mutable_specifier")?;
    let field_1 = resolve_field(node, "ref_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FieldPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        mutable_specifier: field_0.scalar.as_str(),
        mutable_specifier_list: field_0.items.as_slice(),
        mutable_specifier_leading_sep: field_0.leading_sep,
        mutable_specifier_trailing_sep: field_0.trailing_sep,
        ref_marker: field_1.scalar.as_str(),
        ref_marker_list: field_1.items.as_slice(),
        ref_marker_leading_sep: field_1.leading_sep,
        ref_marker_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_for_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label", "pattern", "value"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "label")?;
    let field_2 = resolve_field(node, "pattern")?;
    let field_3 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForExpressionTemplate {
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
        pattern: field_2.scalar.as_str(),
        pattern_list: field_2.items.as_slice(),
        pattern_leading_sep: field_2.leading_sep,
        pattern_trailing_sep: field_2.trailing_sep,
        value: field_3.scalar.as_str(),
        value_list: field_3.items.as_slice(),
        value_leading_sep: field_3.leading_sep,
        value_trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_for_lifetimes(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForLifetimesTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_foreign_mod_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForeignModItemBodyTemplate {
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

fn render_foreign_mod_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["extern_modifier", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "extern_modifier")?;
    let field_1 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ForeignModItemTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        extern_modifier: field_0.scalar.as_str(),
        extern_modifier_list: field_0.items.as_slice(),
        extern_modifier_leading_sep: field_0.leading_sep,
        extern_modifier_trailing_sep: field_0.trailing_sep,
        visibility_modifier: field_1.scalar.as_str(),
        visibility_modifier_list: field_1.items.as_slice(),
        visibility_modifier_leading_sep: field_1.leading_sep,
        visibility_modifier_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_function_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "function_modifiers", "name", "parameters", "return_type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "function_modifiers")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "parameters")?;
    let field_4 = resolve_field(node, "return_type")?;
    let field_5 = resolve_field(node, "type_parameters")?;
    let field_6 = resolve_field(node, "visibility_modifier")?;
    let field_7 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionItemTemplate {
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
        function_modifiers: field_1.scalar.as_str(),
        function_modifiers_list: field_1.items.as_slice(),
        function_modifiers_leading_sep: field_1.leading_sep,
        function_modifiers_trailing_sep: field_1.trailing_sep,
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
        visibility_modifier: field_6.scalar.as_str(),
        visibility_modifier_list: field_6.items.as_slice(),
        visibility_modifier_leading_sep: field_6.leading_sep,
        visibility_modifier_trailing_sep: field_6.trailing_sep,
        where_clause: field_7.scalar.as_str(),
        where_clause_list: field_7.items.as_slice(),
        where_clause_leading_sep: field_7.leading_sep,
        where_clause_trailing_sep: field_7.trailing_sep,
    };
    template.render()
}

fn render_function_modifiers(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["modifier"])?;
    let field_0 = resolve_field(node, "modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionModifiersTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        modifier: field_0.scalar.as_str(),
        modifier_list: field_0.items.as_slice(),
        modifier_leading_sep: field_0.leading_sep,
        modifier_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_function_signature_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function_modifiers", "name", "parameters", "return_type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "function_modifiers")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "parameters")?;
    let field_3 = resolve_field(node, "return_type")?;
    let field_4 = resolve_field(node, "type_parameters")?;
    let field_5 = resolve_field(node, "visibility_modifier")?;
    let field_6 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionSignatureItemTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        function_modifiers: field_0.scalar.as_str(),
        function_modifiers_list: field_0.items.as_slice(),
        function_modifiers_leading_sep: field_0.leading_sep,
        function_modifiers_trailing_sep: field_0.trailing_sep,
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
        type_parameters: field_4.scalar.as_str(),
        type_parameters_list: field_4.items.as_slice(),
        type_parameters_leading_sep: field_4.leading_sep,
        type_parameters_trailing_sep: field_4.trailing_sep,
        visibility_modifier: field_5.scalar.as_str(),
        visibility_modifier_list: field_5.items.as_slice(),
        visibility_modifier_leading_sep: field_5.leading_sep,
        visibility_modifier_trailing_sep: field_5.trailing_sep,
        where_clause: field_6.scalar.as_str(),
        where_clause_list: field_6.items.as_slice(),
        where_clause_leading_sep: field_6.leading_sep,
        where_clause_trailing_sep: field_6.trailing_sep,
    };
    template.render()
}

fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["for_lifetimes", "parameters", "return_type"])?;
    let field_0 = resolve_field(node, "for_lifetimes")?;
    let field_1 = resolve_field(node, "parameters")?;
    let field_2 = resolve_field(node, "return_type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = FunctionTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        for_lifetimes: field_0.scalar.as_str(),
        for_lifetimes_list: field_0.items.as_slice(),
        for_lifetimes_leading_sep: field_0.leading_sep,
        for_lifetimes_trailing_sep: field_0.trailing_sep,
        parameters: field_1.scalar.as_str(),
        parameters_list: field_1.items.as_slice(),
        parameters_leading_sep: field_1.leading_sep,
        parameters_trailing_sep: field_1.trailing_sep,
        return_type: field_2.scalar.as_str(),
        return_type_list: field_2.items.as_slice(),
        return_type_leading_sep: field_2.leading_sep,
        return_type_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_gen_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block", "move_marker"])?;
    let field_0 = resolve_field(node, "block")?;
    let field_1 = resolve_field(node, "move_marker")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GenBlockTemplate {
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
        move_marker: field_1.scalar.as_str(),
        move_marker_list: field_1.items.as_slice(),
        move_marker_leading_sep: field_1.leading_sep,
        move_marker_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_generic_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function")?;
    let field_1 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GenericFunctionTemplate {
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

fn render_generic_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments"])?;
    let field_0 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GenericPatternTemplate {
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
    };
    template.render()
}

fn render_generic_type_with_turbofish(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["turbofish", "type", "type_arguments"])?;
    let field_0 = resolve_field(node, "turbofish")?;
    let field_1 = resolve_field(node, "type")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = GenericTypeWithTurbofishTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        turbofish: field_0.scalar.as_str(),
        turbofish_list: field_0.items.as_slice(),
        turbofish_leading_sep: field_0.leading_sep,
        turbofish_trailing_sep: field_0.trailing_sep,
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_arguments"])?;
    let field_0 = resolve_field(node, "type")?;
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
        r#type: field_0.scalar.as_str(),
        r#type_list: field_0.items.as_slice(),
        r#type_leading_sep: field_0.leading_sep,
        r#type_trailing_sep: field_0.trailing_sep,
        type_arguments: field_1.scalar.as_str(),
        type_arguments_list: field_1.items.as_slice(),
        type_arguments_leading_sep: field_1.leading_sep,
        type_arguments_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_higher_ranked_trait_bound(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_parameters"])?;
    let field_0 = resolve_field(node, "type")?;
    let field_1 = resolve_field(node, "type_parameters")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = HigherRankedTraitBoundTemplate {
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
        type_parameters: field_1.scalar.as_str(),
        type_parameters_list: field_1.items.as_slice(),
        type_parameters_leading_sep: field_1.leading_sep,
        type_parameters_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_if_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative")?;
    let field_1 = resolve_field(node, "condition")?;
    let field_2 = resolve_field(node, "consequence")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IfExpressionTemplate {
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

fn render_impl_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImplItemBodyTemplate {
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

fn render_impl_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["negative", "trait", "type", "type_parameters", "unsafe_marker", "where_clause"])?;
    let field_0 = resolve_field(node, "negative")?;
    let field_1 = resolve_field(node, "trait")?;
    let field_2 = resolve_field(node, "type")?;
    let field_3 = resolve_field(node, "type_parameters")?;
    let field_4 = resolve_field(node, "unsafe_marker")?;
    let field_5 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ImplItemTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        negative: field_0.scalar.as_str(),
        negative_list: field_0.items.as_slice(),
        negative_leading_sep: field_0.leading_sep,
        negative_trailing_sep: field_0.trailing_sep,
        r#trait: field_1.scalar.as_str(),
        r#trait_list: field_1.items.as_slice(),
        r#trait_leading_sep: field_1.leading_sep,
        r#trait_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
        unsafe_marker: field_4.scalar.as_str(),
        unsafe_marker_list: field_4.items.as_slice(),
        unsafe_marker_leading_sep: field_4.leading_sep,
        unsafe_marker_trailing_sep: field_4.trailing_sep,
        where_clause: field_5.scalar.as_str(),
        where_clause_list: field_5.items.as_slice(),
        where_clause_leading_sep: field_5.leading_sep,
        where_clause_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_index_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index")?;
    let field_1 = resolve_field(node, "object")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = IndexExpressionTemplate {
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

fn render_inner_attribute_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute"])?;
    let field_0 = resolve_field(node, "attribute")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = InnerAttributeItemTemplate {
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
    };
    template.render()
}

fn render_label(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LabelTemplate {
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

fn render_last_match_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern", "value"])?;
    let field_0 = resolve_field(node, "pattern")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LastMatchArmTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        pattern: field_0.scalar.as_str(),
        pattern_list: field_0.items.as_slice(),
        pattern_leading_sep: field_0.leading_sep,
        pattern_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_let_condition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern", "value"])?;
    let field_0 = resolve_field(node, "pattern")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LetConditionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        pattern: field_0.scalar.as_str(),
        pattern_list: field_0.items.as_slice(),
        pattern_leading_sep: field_0.leading_sep,
        pattern_trailing_sep: field_0.trailing_sep,
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_let_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "mutable_specifier", "pattern", "type", "value"])?;
    let field_0 = resolve_field(node, "alternative")?;
    let field_1 = resolve_field(node, "mutable_specifier")?;
    let field_2 = resolve_field(node, "pattern")?;
    let field_3 = resolve_field(node, "type")?;
    let field_4 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LetDeclarationTemplate {
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
        mutable_specifier: field_1.scalar.as_str(),
        mutable_specifier_list: field_1.items.as_slice(),
        mutable_specifier_leading_sep: field_1.leading_sep,
        mutable_specifier_trailing_sep: field_1.trailing_sep,
        pattern: field_2.scalar.as_str(),
        pattern_list: field_2.items.as_slice(),
        pattern_leading_sep: field_2.leading_sep,
        pattern_trailing_sep: field_2.trailing_sep,
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

fn render_lifetime_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "name"])?;
    let field_0 = resolve_field(node, "bounds")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LifetimeParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        bounds: field_0.scalar.as_str(),
        bounds_list: field_0.items.as_slice(),
        bounds_leading_sep: field_0.leading_sep,
        bounds_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_lifetime(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LifetimeTemplate {
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

fn render_line_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LineCommentTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_loop_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "label")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = LoopExpressionTemplate {
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

fn render_macro_definition_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MacroDefinitionBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_macro_definition_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MacroDefinitionBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_macro_definition_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MacroDefinitionParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_macro_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MacroDefinitionTemplate {
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

fn render_macro_invocation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["macro", "token_tree"])?;
    let field_0 = resolve_field(node, "macro")?;
    let field_1 = resolve_field(node, "token_tree")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MacroInvocationTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        r#macro: field_0.scalar.as_str(),
        r#macro_list: field_0.items.as_slice(),
        r#macro_leading_sep: field_0.leading_sep,
        r#macro_trailing_sep: field_0.trailing_sep,
        token_tree: field_1.scalar.as_str(),
        token_tree_list: field_1.items.as_slice(),
        token_tree_leading_sep: field_1.leading_sep,
        token_tree_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_macro_rule(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left")?;
    let field_1 = resolve_field(node, "right")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MacroRuleTemplate {
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

fn render_match_arm_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchArmBlockEndingTemplate {
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

fn render_match_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern"])?;
    let field_0 = resolve_field(node, "pattern")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchArmTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        pattern: field_0.scalar.as_str(),
        pattern_list: field_0.items.as_slice(),
        pattern_leading_sep: field_0.leading_sep,
        pattern_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
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

fn render_match_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchExpressionTemplate {
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

fn render_match_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition"])?;
    let field_0 = resolve_field(node, "condition")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MatchPatternTemplate {
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
    };
    template.render()
}

fn render_mod_item_inline(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ModItemInlineTemplate {
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

fn render_mod_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ModItemTemplate {
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
        visibility_modifier: field_1.scalar.as_str(),
        visibility_modifier_list: field_1.items.as_slice(),
        visibility_modifier_leading_sep: field_1.leading_sep,
        visibility_modifier_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_mut_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier"])?;
    let field_0 = resolve_field(node, "mutable_specifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = MutPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        mutable_specifier: field_0.scalar.as_str(),
        mutable_specifier_list: field_0.items.as_slice(),
        mutable_specifier_leading_sep: field_0.leading_sep,
        mutable_specifier_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_negative_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = NegativeLiteralTemplate {
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

fn render_or_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OrPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_ordered_field_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = OrderedFieldDeclarationListTemplate {
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

fn render_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern", "type"])?;
    let field_0 = resolve_field(node, "mutable_specifier")?;
    let field_1 = resolve_field(node, "pattern")?;
    let field_2 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        mutable_specifier: field_0.scalar.as_str(),
        mutable_specifier_list: field_0.items.as_slice(),
        mutable_specifier_leading_sep: field_0.leading_sep,
        mutable_specifier_trailing_sep: field_0.trailing_sep,
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
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

fn render_pointer_type_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PointerTypeMutTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_pointer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = PointerTypeTemplate {
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

fn render_qualified_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "type"])?;
    let field_0 = resolve_field(node, "alias")?;
    let field_1 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = QualifiedTypeTemplate {
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
        r#type: field_1.scalar.as_str(),
        r#type_list: field_1.items.as_slice(),
        r#type_leading_sep: field_1.leading_sep,
        r#type_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_range_expression_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator"])?;
    let field_0 = resolve_field(node, "operator")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangeExpressionBareTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        operator: field_0.scalar.as_str(),
        operator_list: field_0.items.as_slice(),
        operator_leading_sep: field_0.leading_sep,
        operator_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_range_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangeExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_range_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RangePatternTemplate {
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

fn render_raw_string_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RawStringLiteralTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_ref_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RefPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_reference_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReferenceExpressionTemplate {
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

fn render_reference_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern"])?;
    let field_0 = resolve_field(node, "mutable_specifier")?;
    let field_1 = resolve_field(node, "pattern")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReferencePatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        mutable_specifier: field_0.scalar.as_str(),
        mutable_specifier_list: field_0.items.as_slice(),
        mutable_specifier_leading_sep: field_0.leading_sep,
        mutable_specifier_trailing_sep: field_0.trailing_sep,
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_reference_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["lifetime", "mutable_specifier", "type"])?;
    let field_0 = resolve_field(node, "lifetime")?;
    let field_1 = resolve_field(node, "mutable_specifier")?;
    let field_2 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReferenceTypeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        lifetime: field_0.scalar.as_str(),
        lifetime_list: field_0.items.as_slice(),
        lifetime_leading_sep: field_0.leading_sep,
        lifetime_trailing_sep: field_0.trailing_sep,
        mutable_specifier: field_1.scalar.as_str(),
        mutable_specifier_list: field_1.items.as_slice(),
        mutable_specifier_leading_sep: field_1.leading_sep,
        mutable_specifier_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_removed_trait_bound(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = RemovedTraitBoundTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_return_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ReturnExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_scoped_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "path")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ScopedIdentifierTemplate {
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
        path: field_1.scalar.as_str(),
        path_list: field_1.items.as_slice(),
        path_leading_sep: field_1.leading_sep,
        path_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_scoped_type_identifier_in_expression_position(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "path")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ScopedTypeIdentifierInExpressionPositionTemplate {
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
        path: field_1.scalar.as_str(),
        path_list: field_1.items.as_slice(),
        path_leading_sep: field_1.leading_sep,
        path_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_scoped_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "path")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ScopedTypeIdentifierTemplate {
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
        path: field_1.scalar.as_str(),
        path_list: field_1.items.as_slice(),
        path_leading_sep: field_1.leading_sep,
        path_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_scoped_use_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["list", "path"])?;
    let field_0 = resolve_field(node, "list")?;
    let field_1 = resolve_field(node, "path")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ScopedUseListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        list: field_0.scalar.as_str(),
        list_list: field_0.items.as_slice(),
        list_leading_sep: field_0.leading_sep,
        list_trailing_sep: field_0.trailing_sep,
        path: field_1.scalar.as_str(),
        path_list: field_1.items.as_slice(),
        path_leading_sep: field_1.leading_sep,
        path_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_self_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["lifetime", "mutable_specifier", "reference", "self"])?;
    let field_0 = resolve_field(node, "lifetime")?;
    let field_1 = resolve_field(node, "mutable_specifier")?;
    let field_2 = resolve_field(node, "reference")?;
    let field_3 = resolve_field(node, "self")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SelfParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        lifetime: field_0.scalar.as_str(),
        lifetime_list: field_0.items.as_slice(),
        lifetime_leading_sep: field_0.leading_sep,
        lifetime_trailing_sep: field_0.trailing_sep,
        mutable_specifier: field_1.scalar.as_str(),
        mutable_specifier_list: field_1.items.as_slice(),
        mutable_specifier_leading_sep: field_1.leading_sep,
        mutable_specifier_trailing_sep: field_1.trailing_sep,
        reference: field_2.scalar.as_str(),
        reference_list: field_2.items.as_slice(),
        reference_leading_sep: field_2.leading_sep,
        reference_trailing_sep: field_2.trailing_sep,
        self_: field_3.scalar.as_str(),
        self__list: field_3.items.as_slice(),
        self__leading_sep: field_3.leading_sep,
        self__trailing_sep: field_3.trailing_sep,
    };
    template.render()
}

fn render_shorthand_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "identifier"])?;
    let field_0 = resolve_field(node, "attributes")?;
    let field_1 = resolve_field(node, "identifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = ShorthandFieldInitializerTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        attributes: field_0.scalar.as_str(),
        attributes_list: field_0.items.as_slice(),
        attributes_leading_sep: field_0.leading_sep,
        attributes_trailing_sep: field_0.trailing_sep,
        identifier: field_1.scalar.as_str(),
        identifier_list: field_1.items.as_slice(),
        identifier_leading_sep: field_1.leading_sep,
        identifier_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_slice_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SlicePatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_source_file(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["shebang", "statements"])?;
    let field_0 = resolve_field(node, "shebang")?;
    let field_1 = resolve_field(node, "statements")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = SourceFileTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        shebang: field_0.scalar.as_str(),
        shebang_list: field_0.items.as_slice(),
        shebang_leading_sep: field_0.leading_sep,
        shebang_trailing_sep: field_0.trailing_sep,
        statements: field_1.scalar.as_str(),
        statements_list: field_1.items.as_slice(),
        statements_leading_sep: field_1.leading_sep,
        statements_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_static_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "name", "ref_marker", "type", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "mutable_specifier")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "ref_marker")?;
    let field_3 = resolve_field(node, "type")?;
    let field_4 = resolve_field(node, "value")?;
    let field_5 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StaticItemTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        mutable_specifier: field_0.scalar.as_str(),
        mutable_specifier_list: field_0.items.as_slice(),
        mutable_specifier_leading_sep: field_0.leading_sep,
        mutable_specifier_trailing_sep: field_0.trailing_sep,
        name: field_1.scalar.as_str(),
        name_list: field_1.items.as_slice(),
        name_leading_sep: field_1.leading_sep,
        name_trailing_sep: field_1.trailing_sep,
        ref_marker: field_2.scalar.as_str(),
        ref_marker_list: field_2.items.as_slice(),
        ref_marker_leading_sep: field_2.leading_sep,
        ref_marker_trailing_sep: field_2.trailing_sep,
        r#type: field_3.scalar.as_str(),
        r#type_list: field_3.items.as_slice(),
        r#type_leading_sep: field_3.leading_sep,
        r#type_trailing_sep: field_3.trailing_sep,
        value: field_4.scalar.as_str(),
        value_list: field_4.items.as_slice(),
        value_leading_sep: field_4.leading_sep,
        value_trailing_sep: field_4.trailing_sep,
        visibility_modifier: field_5.scalar.as_str(),
        visibility_modifier_list: field_5.items.as_slice(),
        visibility_modifier_leading_sep: field_5.leading_sep,
        visibility_modifier_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_string_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StringLiteralTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_struct_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StructExpressionTemplate {
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

fn render_struct_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_parameters", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type_parameters")?;
    let field_2 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StructItemTemplate {
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
        type_parameters: field_1.scalar.as_str(),
        type_parameters_list: field_1.items.as_slice(),
        type_parameters_leading_sep: field_1.leading_sep,
        type_parameters_trailing_sep: field_1.trailing_sep,
        visibility_modifier: field_2.scalar.as_str(),
        visibility_modifier_list: field_2.items.as_slice(),
        visibility_modifier_leading_sep: field_2.leading_sep,
        visibility_modifier_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_struct_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = StructPatternTemplate {
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

fn render_token_binding_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenBindingPatternTemplate {
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

fn render_token_repetition_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenRepetitionPatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_repetition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenRepetitionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreeBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreeBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreeParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_pattern_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreePatternBraceTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_pattern_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreePatternBracketTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_pattern_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreePatternParenTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreePatternTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_token_tree(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TokenTreeTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_trait_bounds(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TraitBoundsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_trait_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "bounds", "name", "type_parameters", "unsafe_marker", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "bounds")?;
    let field_2 = resolve_field(node, "name")?;
    let field_3 = resolve_field(node, "type_parameters")?;
    let field_4 = resolve_field(node, "unsafe_marker")?;
    let field_5 = resolve_field(node, "visibility_modifier")?;
    let field_6 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TraitItemTemplate {
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
        bounds: field_1.scalar.as_str(),
        bounds_list: field_1.items.as_slice(),
        bounds_leading_sep: field_1.leading_sep,
        bounds_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
        unsafe_marker: field_4.scalar.as_str(),
        unsafe_marker_list: field_4.items.as_slice(),
        unsafe_marker_leading_sep: field_4.leading_sep,
        unsafe_marker_trailing_sep: field_4.trailing_sep,
        visibility_modifier: field_5.scalar.as_str(),
        visibility_modifier_list: field_5.items.as_slice(),
        visibility_modifier_leading_sep: field_5.leading_sep,
        visibility_modifier_trailing_sep: field_5.trailing_sep,
        where_clause: field_6.scalar.as_str(),
        where_clause_list: field_6.items.as_slice(),
        where_clause_leading_sep: field_6.leading_sep,
        where_clause_trailing_sep: field_6.trailing_sep,
    };
    template.render()
}

fn render_try_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TryBlockTemplate {
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

fn render_try_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TryExpressionTemplate {
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

fn render_tuple_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements"])?;
    let field_0 = resolve_field(node, "attributes")?;
    let field_1 = resolve_field(node, "elements")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TupleExpressionTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        attributes: field_0.scalar.as_str(),
        attributes_list: field_0.items.as_slice(),
        attributes_leading_sep: field_0.leading_sep,
        attributes_trailing_sep: field_0.trailing_sep,
        elements: field_1.scalar.as_str(),
        elements_list: field_1.items.as_slice(),
        elements_leading_sep: field_1.leading_sep,
        elements_trailing_sep: field_1.trailing_sep,
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

fn render_tuple_struct_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TupleStructPatternTemplate {
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

fn render_type_binding(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "type_arguments"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "type")?;
    let field_2 = resolve_field(node, "type_arguments")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeBindingTemplate {
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
        type_arguments: field_2.scalar.as_str(),
        type_arguments_list: field_2.items.as_slice(),
        type_arguments_leading_sep: field_2.leading_sep,
        type_arguments_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_type_cast_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "value"])?;
    let field_0 = resolve_field(node, "type")?;
    let field_1 = resolve_field(node, "value")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeCastExpressionTemplate {
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
        value: field_1.scalar.as_str(),
        value_list: field_1.items.as_slice(),
        value_leading_sep: field_1.leading_sep,
        value_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_type_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "trailing_where_clause", "type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "name")?;
    let field_1 = resolve_field(node, "trailing_where_clause")?;
    let field_2 = resolve_field(node, "type")?;
    let field_3 = resolve_field(node, "type_parameters")?;
    let field_4 = resolve_field(node, "visibility_modifier")?;
    let field_5 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeItemTemplate {
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
        trailing_where_clause: field_1.scalar.as_str(),
        trailing_where_clause_list: field_1.items.as_slice(),
        trailing_where_clause_leading_sep: field_1.leading_sep,
        trailing_where_clause_trailing_sep: field_1.trailing_sep,
        r#type: field_2.scalar.as_str(),
        r#type_list: field_2.items.as_slice(),
        r#type_leading_sep: field_2.leading_sep,
        r#type_trailing_sep: field_2.trailing_sep,
        type_parameters: field_3.scalar.as_str(),
        type_parameters_list: field_3.items.as_slice(),
        type_parameters_leading_sep: field_3.leading_sep,
        type_parameters_trailing_sep: field_3.trailing_sep,
        visibility_modifier: field_4.scalar.as_str(),
        visibility_modifier_list: field_4.items.as_slice(),
        visibility_modifier_leading_sep: field_4.leading_sep,
        visibility_modifier_trailing_sep: field_4.trailing_sep,
        where_clause: field_5.scalar.as_str(),
        where_clause_list: field_5.items.as_slice(),
        where_clause_leading_sep: field_5.leading_sep,
        where_clause_trailing_sep: field_5.trailing_sep,
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "default_type", "name"])?;
    let field_0 = resolve_field(node, "bounds")?;
    let field_1 = resolve_field(node, "default_type")?;
    let field_2 = resolve_field(node, "name")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = TypeParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        bounds: field_0.scalar.as_str(),
        bounds_list: field_0.items.as_slice(),
        bounds_leading_sep: field_0.leading_sep,
        bounds_trailing_sep: field_0.trailing_sep,
        default_type: field_1.scalar.as_str(),
        default_type_list: field_1.items.as_slice(),
        default_type_leading_sep: field_1.leading_sep,
        default_type_trailing_sep: field_1.trailing_sep,
        name: field_2.scalar.as_str(),
        name_list: field_2.items.as_slice(),
        name_leading_sep: field_2.leading_sep,
        name_trailing_sep: field_2.trailing_sep,
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

fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operand", "operator"])?;
    let field_0 = resolve_field(node, "operand")?;
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
        operand: field_0.scalar.as_str(),
        operand_list: field_0.items.as_slice(),
        operand_leading_sep: field_0.leading_sep,
        operand_trailing_sep: field_0.trailing_sep,
        operator: field_1.scalar.as_str(),
        operator_list: field_1.items.as_slice(),
        operator_leading_sep: field_1.leading_sep,
        operator_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_union_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "name")?;
    let field_2 = resolve_field(node, "type_parameters")?;
    let field_3 = resolve_field(node, "visibility_modifier")?;
    let field_4 = resolve_field(node, "where_clause")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UnionItemTemplate {
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
        type_parameters: field_2.scalar.as_str(),
        type_parameters_list: field_2.items.as_slice(),
        type_parameters_leading_sep: field_2.leading_sep,
        type_parameters_trailing_sep: field_2.trailing_sep,
        visibility_modifier: field_3.scalar.as_str(),
        visibility_modifier_list: field_3.items.as_slice(),
        visibility_modifier_leading_sep: field_3.leading_sep,
        visibility_modifier_trailing_sep: field_3.trailing_sep,
        where_clause: field_4.scalar.as_str(),
        where_clause_list: field_4.items.as_slice(),
        where_clause_leading_sep: field_4.leading_sep,
        where_clause_trailing_sep: field_4.trailing_sep,
    };
    template.render()
}

fn render_unsafe_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UnsafeBlockTemplate {
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

fn render_use_as_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "path"])?;
    let field_0 = resolve_field(node, "alias")?;
    let field_1 = resolve_field(node, "path")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UseAsClauseTemplate {
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
        path: field_1.scalar.as_str(),
        path_list: field_1.items.as_slice(),
        path_leading_sep: field_1.leading_sep,
        path_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_use_bounds(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UseBoundsTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_use_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "argument")?;
    let field_1 = resolve_field(node, "visibility_modifier")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UseDeclarationTemplate {
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
        visibility_modifier: field_1.scalar.as_str(),
        visibility_modifier_list: field_1.items.as_slice(),
        visibility_modifier_leading_sep: field_1.leading_sep,
        visibility_modifier_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_use_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UseListTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_use_wildcard(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["path"])?;
    let field_0 = resolve_field(node, "path")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = UseWildcardTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        path: field_0.scalar.as_str(),
        path_list: field_0.items.as_slice(),
        path_leading_sep: field_0.leading_sep,
        path_trailing_sep: field_0.trailing_sep,
    };
    template.render()
}

fn render_variadic_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern"])?;
    let field_0 = resolve_field(node, "mutable_specifier")?;
    let field_1 = resolve_field(node, "pattern")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VariadicParameterTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        mutable_specifier: field_0.scalar.as_str(),
        mutable_specifier_list: field_0.items.as_slice(),
        mutable_specifier_leading_sep: field_0.leading_sep,
        mutable_specifier_trailing_sep: field_0.trailing_sep,
        pattern: field_1.scalar.as_str(),
        pattern_list: field_1.items.as_slice(),
        pattern_leading_sep: field_1.leading_sep,
        pattern_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_visibility_modifier_crate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VisibilityModifierCrateTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_visibility_modifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = VisibilityModifierTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_where_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WhereClauseTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
    };
    template.render()
}

fn render_where_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "left"])?;
    let field_0 = resolve_field(node, "bounds")?;
    let field_1 = resolve_field(node, "left")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WherePredicateTemplate {
        children: children.items.as_slice(),
        children_list: children.items.as_slice(),
        variant,
        text: text.as_str(),
        trailing_sep: children.trailing_sep,
        leading_sep: children.leading_sep,
        bounds: field_0.scalar.as_str(),
        bounds_list: field_0.items.as_slice(),
        bounds_leading_sep: field_0.leading_sep,
        bounds_trailing_sep: field_0.trailing_sep,
        left: field_1.scalar.as_str(),
        left_list: field_1.items.as_slice(),
        left_leading_sep: field_1.leading_sep,
        left_trailing_sep: field_1.trailing_sep,
    };
    template.render()
}

fn render_while_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "label"])?;
    let field_0 = resolve_field(node, "body")?;
    let field_1 = resolve_field(node, "condition")?;
    let field_2 = resolve_field(node, "label")?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = WhileExpressionTemplate {
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
        label: field_2.scalar.as_str(),
        label_list: field_2.items.as_slice(),
        label_leading_sep: field_2.leading_sep,
        label_trailing_sep: field_2.trailing_sep,
    };
    template.render()
}

fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let text = resolve_text(node)?;
    let template = YieldExpressionTemplate {
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
        "_array_expression_list" | "array_expression_list" => render_hidden_array_expression_list(node),
        "_array_expression_semi" | "array_expression_semi" => render_hidden_array_expression_semi(node),
        "_closure_expression_block" | "closure_expression_block" => render_hidden_closure_expression_block(node),
        "_closure_expression_expr" => render_hidden_closure_expression_expr(node),
        "_delim_token_tree_brace" => render_hidden_delim_token_tree_brace(node),
        "_delim_token_tree_bracket" => render_hidden_delim_token_tree_bracket(node),
        "_delim_token_tree_paren" => render_hidden_delim_token_tree_paren(node),
        "_expression_statement_block_ending" => render_hidden_expression_statement_block_ending(node),
        "_expression_statement_with_semi" => render_hidden_expression_statement_with_semi(node),
        "_field_identifier" | "field_identifier" => render_hidden_field_identifier(node),
        "_field_pattern_named" | "field_pattern_named" => render_hidden_field_pattern_named(node),
        "_field_pattern_shorthand" => render_hidden_field_pattern_shorthand(node),
        "_foreign_mod_item_body" => render_hidden_foreign_mod_item_body(node),
        "_function_type_fn_form" | "function_type_fn_form" => render_hidden_function_type_fn_form(node),
        "_function_type_trait_form" | "function_type_trait_form" => render_hidden_function_type_trait_form(node),
        "_impl_item_body" => render_hidden_impl_item_body(node),
        "_let_chain" | "let_chain" => render_hidden_let_chain(node),
        "_line_comment_doc" | "line_comment_doc" => render_hidden_line_comment_doc(node),
        "_macro_definition_brace" => render_hidden_macro_definition_brace(node),
        "_macro_definition_bracket" => render_hidden_macro_definition_bracket(node),
        "_macro_definition_paren" => render_hidden_macro_definition_paren(node),
        "_match_arm_block_ending" => render_hidden_match_arm_block_ending(node),
        "_match_arm_with_comma" | "match_arm_with_comma" => render_hidden_match_arm_with_comma(node),
        "_mod_item_inline" => render_hidden_mod_item_inline(node),
        "_or_pattern_binary" | "or_pattern_binary" => render_hidden_or_pattern_binary(node),
        "_or_pattern_prefix" | "or_pattern_prefix" => render_hidden_or_pattern_prefix(node),
        "_pointer_type_mut" => render_hidden_pointer_type_mut(node),
        "_range_expression_bare" => render_hidden_range_expression_bare(node),
        "_range_expression_binary" | "range_expression_binary" => render_hidden_range_expression_binary(node),
        "_range_expression_postfix" | "range_expression_postfix" => render_hidden_range_expression_postfix(node),
        "_range_expression_prefix" | "range_expression_prefix" => render_hidden_range_expression_prefix(node),
        "_range_pattern_left_with_right" | "range_pattern_left_with_right" => render_hidden_range_pattern_left_with_right(node),
        "_range_pattern_prefix" | "range_pattern_prefix" => render_hidden_range_pattern_prefix(node),
        "_reference_expression_raw_mut" | "reference_expression_raw_mut" => render_hidden_reference_expression_raw_mut(node),
        "_reserved_identifier" | "reserved_identifier" => render_hidden_reserved_identifier(node),
        "_shorthand_field_identifier" | "shorthand_field_identifier" => render_hidden_shorthand_field_identifier(node),
        "_string_content" | "string_content" => render_hidden_string_content(node),
        "_struct_item_brace" | "struct_item_brace" => render_hidden_struct_item_brace(node),
        "_struct_item_tuple" | "struct_item_tuple" => render_hidden_struct_item_tuple(node),
        "_token_tree_brace" => render_hidden_token_tree_brace(node),
        "_token_tree_bracket" => render_hidden_token_tree_bracket(node),
        "_token_tree_paren" => render_hidden_token_tree_paren(node),
        "_token_tree_pattern_brace" => render_hidden_token_tree_pattern_brace(node),
        "_token_tree_pattern_bracket" => render_hidden_token_tree_pattern_bracket(node),
        "_token_tree_pattern_paren" => render_hidden_token_tree_pattern_paren(node),
        "_type_identifier" | "type_identifier" => render_hidden_type_identifier(node),
        "_visibility_modifier_crate" => render_hidden_visibility_modifier_crate(node),
        "_visibility_modifier_in_path" | "visibility_modifier_in_path" => render_hidden_visibility_modifier_in_path(node),
        "_visibility_modifier_pub" | "visibility_modifier_pub" => render_hidden_visibility_modifier_pub(node),
        "abstract_type" => render_abstract_type(node),
        "arguments" => render_arguments(node),
        "array_expression" => render_array_expression(node),
        "array_type" => render_array_type(node),
        "assignment_expression" => render_assignment_expression(node),
        "associated_type" => render_associated_type(node),
        "async_block" => render_async_block(node),
        "attribute_item" => render_attribute_item(node),
        "attribute" => render_attribute(node),
        "await_expression" => render_await_expression(node),
        "base_field_initializer" => render_base_field_initializer(node),
        "binary_expression" => render_binary_expression(node),
        "block_comment" => render_block_comment(node),
        "block" => render_block(node),
        "bounded_type" => render_bounded_type(node),
        "bracketed_type" => render_bracketed_type(node),
        "break_expression" => render_break_expression(node),
        "call_expression" => render_call_expression(node),
        "captured_pattern" => render_captured_pattern(node),
        "closure_expression_expr" => render_closure_expression_expr(node),
        "closure_expression" => render_closure_expression(node),
        "closure_parameters" => render_closure_parameters(node),
        "comment" => render_comment(node),
        "compound_assignment_expr" => render_compound_assignment_expr(node),
        "const_block" => render_const_block(node),
        "const_item" => render_const_item(node),
        "const_parameter" => render_const_parameter(node),
        "continue_expression" => render_continue_expression(node),
        "declaration_list" => render_declaration_list(node),
        "delim_token_tree_brace" => render_delim_token_tree_brace(node),
        "delim_token_tree_bracket" => render_delim_token_tree_bracket(node),
        "delim_token_tree_paren" => render_delim_token_tree_paren(node),
        "delim_token_tree" => render_delim_token_tree(node),
        "dynamic_type" => render_dynamic_type(node),
        "else_clause" => render_else_clause(node),
        "enum_item" => render_enum_item(node),
        "enum_variant_list" => render_enum_variant_list(node),
        "enum_variant" => render_enum_variant(node),
        "expression_statement_block_ending" => render_expression_statement_block_ending(node),
        "expression_statement_with_semi" => render_expression_statement_with_semi(node),
        "expression_statement" => render_expression_statement(node),
        "extern_crate_declaration" => render_extern_crate_declaration(node),
        "extern_modifier" => render_extern_modifier(node),
        "field_declaration_list" => render_field_declaration_list(node),
        "field_declaration" => render_field_declaration(node),
        "field_expression" => render_field_expression(node),
        "field_initializer_list" => render_field_initializer_list(node),
        "field_initializer" => render_field_initializer(node),
        "field_pattern_shorthand" => render_field_pattern_shorthand(node),
        "field_pattern" => render_field_pattern(node),
        "for_expression" => render_for_expression(node),
        "for_lifetimes" => render_for_lifetimes(node),
        "foreign_mod_item_body" => render_foreign_mod_item_body(node),
        "foreign_mod_item" => render_foreign_mod_item(node),
        "function_item" => render_function_item(node),
        "function_modifiers" => render_function_modifiers(node),
        "function_signature_item" => render_function_signature_item(node),
        "function_type" => render_function_type(node),
        "gen_block" => render_gen_block(node),
        "generic_function" => render_generic_function(node),
        "generic_pattern" => render_generic_pattern(node),
        "generic_type_with_turbofish" => render_generic_type_with_turbofish(node),
        "generic_type" => render_generic_type(node),
        "higher_ranked_trait_bound" => render_higher_ranked_trait_bound(node),
        "if_expression" => render_if_expression(node),
        "impl_item_body" => render_impl_item_body(node),
        "impl_item" => render_impl_item(node),
        "index_expression" => render_index_expression(node),
        "inner_attribute_item" => render_inner_attribute_item(node),
        "label" => render_label(node),
        "last_match_arm" => render_last_match_arm(node),
        "let_condition" => render_let_condition(node),
        "let_declaration" => render_let_declaration(node),
        "lifetime_parameter" => render_lifetime_parameter(node),
        "lifetime" => render_lifetime(node),
        "line_comment" => render_line_comment(node),
        "loop_expression" => render_loop_expression(node),
        "macro_definition_brace" => render_macro_definition_brace(node),
        "macro_definition_bracket" => render_macro_definition_bracket(node),
        "macro_definition_paren" => render_macro_definition_paren(node),
        "macro_definition" => render_macro_definition(node),
        "macro_invocation" => render_macro_invocation(node),
        "macro_rule" => render_macro_rule(node),
        "match_arm_block_ending" => render_match_arm_block_ending(node),
        "match_arm" => render_match_arm(node),
        "match_block" => render_match_block(node),
        "match_expression" => render_match_expression(node),
        "match_pattern" => render_match_pattern(node),
        "mod_item_inline" => render_mod_item_inline(node),
        "mod_item" => render_mod_item(node),
        "mut_pattern" => render_mut_pattern(node),
        "negative_literal" => render_negative_literal(node),
        "or_pattern" => render_or_pattern(node),
        "ordered_field_declaration_list" => render_ordered_field_declaration_list(node),
        "parameter" => render_parameter(node),
        "parameters" => render_parameters(node),
        "parenthesized_expression" => render_parenthesized_expression(node),
        "pointer_type_mut" => render_pointer_type_mut(node),
        "pointer_type" => render_pointer_type(node),
        "qualified_type" => render_qualified_type(node),
        "range_expression_bare" => render_range_expression_bare(node),
        "range_expression" => render_range_expression(node),
        "range_pattern" => render_range_pattern(node),
        "raw_string_literal" => render_raw_string_literal(node),
        "ref_pattern" => render_ref_pattern(node),
        "reference_expression" => render_reference_expression(node),
        "reference_pattern" => render_reference_pattern(node),
        "reference_type" => render_reference_type(node),
        "removed_trait_bound" => render_removed_trait_bound(node),
        "return_expression" => render_return_expression(node),
        "scoped_identifier" => render_scoped_identifier(node),
        "scoped_type_identifier_in_expression_position" => render_scoped_type_identifier_in_expression_position(node),
        "scoped_type_identifier" => render_scoped_type_identifier(node),
        "scoped_use_list" => render_scoped_use_list(node),
        "self_parameter" => render_self_parameter(node),
        "shorthand_field_initializer" => render_shorthand_field_initializer(node),
        "slice_pattern" => render_slice_pattern(node),
        "source_file" => render_source_file(node),
        "static_item" => render_static_item(node),
        "string_literal" => render_string_literal(node),
        "struct_expression" => render_struct_expression(node),
        "struct_item" => render_struct_item(node),
        "struct_pattern" => render_struct_pattern(node),
        "token_binding_pattern" => render_token_binding_pattern(node),
        "token_repetition_pattern" => render_token_repetition_pattern(node),
        "token_repetition" => render_token_repetition(node),
        "token_tree_brace" => render_token_tree_brace(node),
        "token_tree_bracket" => render_token_tree_bracket(node),
        "token_tree_paren" => render_token_tree_paren(node),
        "token_tree_pattern_brace" => render_token_tree_pattern_brace(node),
        "token_tree_pattern_bracket" => render_token_tree_pattern_bracket(node),
        "token_tree_pattern_paren" => render_token_tree_pattern_paren(node),
        "token_tree_pattern" => render_token_tree_pattern(node),
        "token_tree" => render_token_tree(node),
        "trait_bounds" => render_trait_bounds(node),
        "trait_item" => render_trait_item(node),
        "try_block" => render_try_block(node),
        "try_expression" => render_try_expression(node),
        "tuple_expression" => render_tuple_expression(node),
        "tuple_pattern" => render_tuple_pattern(node),
        "tuple_struct_pattern" => render_tuple_struct_pattern(node),
        "tuple_type" => render_tuple_type(node),
        "type_arguments" => render_type_arguments(node),
        "type_binding" => render_type_binding(node),
        "type_cast_expression" => render_type_cast_expression(node),
        "type_item" => render_type_item(node),
        "type_parameter" => render_type_parameter(node),
        "type_parameters" => render_type_parameters(node),
        "unary_expression" => render_unary_expression(node),
        "union_item" => render_union_item(node),
        "unsafe_block" => render_unsafe_block(node),
        "use_as_clause" => render_use_as_clause(node),
        "use_bounds" => render_use_bounds(node),
        "use_declaration" => render_use_declaration(node),
        "use_list" => render_use_list(node),
        "use_wildcard" => render_use_wildcard(node),
        "variadic_parameter" => render_variadic_parameter(node),
        "visibility_modifier_crate" => render_visibility_modifier_crate(node),
        "visibility_modifier" => render_visibility_modifier(node),
        "where_clause" => render_where_clause(node),
        "where_predicate" => render_where_predicate(node),
        "while_expression" => render_while_expression(node),
        "yield_expression" => render_yield_expression(node),
        _ => token_shaped_fallback(node),
    }
}
