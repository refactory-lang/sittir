// @generated from packages/rust/node-model.json5 and packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// Per-kind askama template structs + render functions for the rust
// grammar. Every struct in this file is backed by a sibling `.jinja`
// template under `templates/`, copied from `packages/rust/templates/`
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
    NodeData, FieldValue, OneOrMany, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,
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
#[template(path = "_array_expression_list.jinja", escape = "none")]
pub struct ArrayExpressionListTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub attributes: ListNonterminalView<'a>,
    pub elements: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_array_expression_semi.jinja", escape = "none")]
pub struct ArrayExpressionSemiTemplate<'a> {
    pub attributes: ListNonterminalView<'a>,
    pub elements: SingleNonterminalView<'a>,
    pub length: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_attributed_enum_variant.jinja", escape = "none")]
pub struct AttributedEnumVariantTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub enum_variant: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_attributed_field_declaration.jinja", escape = "none")]
pub struct AttributedFieldDeclarationTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub field_declaration: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_attributed_parameter.jinja", escape = "none")]
pub struct AttributedParameterTemplate<'a> {
    pub attribute_item: OptionalNonterminalView<'a>,
    pub parameter: SingleNonterminalView<'a>,
    pub self_parameter: ListNonterminalView<'a>,
    pub type_: ListNonterminalView<'a>,
    pub variadic_parameter: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_attributed_type_parameter.jinja", escape = "none")]
pub struct AttributedTypeParameterTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub metavariable: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_block.jinja", escape = "none")]
pub struct ClosureExpressionBlockTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_expr.jinja", escape = "none")]
pub struct _ClosureExpressionExprTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_brace.jinja", escape = "none")]
pub struct _DelimTokenTreeBraceTemplate<'a> {
    pub delim_tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_bracket.jinja", escape = "none")]
pub struct _DelimTokenTreeBracketTemplate<'a> {
    pub delim_tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_paren.jinja", escape = "none")]
pub struct _DelimTokenTreeParenTemplate<'a> {
    pub delim_tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_block_ending.jinja", escape = "none")]
pub struct _ExpressionStatementBlockEndingTemplate<'a> {
    pub expression_ending_with_block: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_with_semi.jinja", escape = "none")]
pub struct _ExpressionStatementWithSemiTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_named.jinja", escape = "none")]
pub struct FieldPatternNamedTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_shorthand.jinja", escape = "none")]
pub struct _FieldPatternShorthandTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_foreign_mod_item_body.jinja", escape = "none")]
pub struct _ForeignModItemBodyTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_fn_form.jinja", escape = "none")]
pub struct FunctionTypeFnFormTemplate<'a> {
    pub function_modifiers: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_trait_form.jinja", escape = "none")]
pub struct FunctionTypeTraitFormTemplate<'a> {
    pub trait_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_impl_item_body.jinja", escape = "none")]
pub struct _ImplItemBodyTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_let_chain.jinja", escape = "none")]
pub struct LetChainTemplate<'a> {
    pub expression: ListNonterminalView<'a>,
    pub let_chain: SingleNonterminalView<'a>,
    pub let_condition: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_line_comment_doc.jinja", escape = "none")]
pub struct LineCommentDocTemplate<'a> {
    pub doc: SingleNonterminalView<'a>,
    pub outer: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_brace.jinja", escape = "none")]
pub struct _MacroDefinitionBraceTemplate<'a> {
    pub macro_rule: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_bracket.jinja", escape = "none")]
pub struct _MacroDefinitionBracketTemplate<'a> {
    pub macro_rule: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_paren.jinja", escape = "none")]
pub struct _MacroDefinitionParenTemplate<'a> {
    pub macro_rule: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_arm_block_ending.jinja", escape = "none")]
pub struct _MatchArmBlockEndingTemplate<'a> {
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_arm_with_comma.jinja", escape = "none")]
pub struct MatchArmWithCommaTemplate<'a> {
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_mod_item_inline.jinja", escape = "none")]
pub struct _ModItemInlineTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_or_pattern_binary.jinja", escape = "none")]
pub struct OrPatternBinaryTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_or_pattern_prefix.jinja", escape = "none")]
pub struct OrPatternPrefixTemplate<'a> {
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_pointer_type_mut.jinja", escape = "none")]
pub struct _PointerTypeMutTemplate<'a> {
    pub mutable_specifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_bare.jinja", escape = "none")]
pub struct _RangeExpressionBareTemplate<'a> {
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_binary.jinja", escape = "none")]
pub struct RangeExpressionBinaryTemplate<'a> {
    pub end: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub start: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_postfix.jinja", escape = "none")]
pub struct RangeExpressionPostfixTemplate<'a> {
    pub operator: SingleNonterminalView<'a>,
    pub start: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_prefix.jinja", escape = "none")]
pub struct RangeExpressionPrefixTemplate<'a> {
    pub end: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_pattern_left_with_right.jinja", escape = "none")]
pub struct RangePatternLeftWithRightTemplate<'a> {
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_pattern_prefix.jinja", escape = "none")]
pub struct RangePatternPrefixTemplate<'a> {
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_reference_expression_raw_mut.jinja", escape = "none")]
pub struct ReferenceExpressionRawMutTemplate<'a> {
    pub mutable_specifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_brace.jinja", escape = "none")]
pub struct StructItemBraceTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_tuple.jinja", escape = "none")]
pub struct StructItemTupleTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_brace.jinja", escape = "none")]
pub struct _TokenTreeBraceTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_bracket.jinja", escape = "none")]
pub struct _TokenTreeBracketTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_paren.jinja", escape = "none")]
pub struct _TokenTreeParenTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_brace.jinja", escape = "none")]
pub struct _TokenTreePatternBraceTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_bracket.jinja", escape = "none")]
pub struct _TokenTreePatternBracketTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_paren.jinja", escape = "none")]
pub struct _TokenTreePatternParenTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_crate.jinja", escape = "none")]
pub struct _VisibilityModifierCrateTemplate<'a> {
    pub crate_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_in_path.jinja", escape = "none")]
pub struct VisibilityModifierInPathTemplate<'a> {
    pub in_: SingleNonterminalView<'a>,
    pub path: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub_parens.jinja", escape = "none")]
pub struct VisibilityModifierPubParensTemplate<'a> {
    pub self_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub.jinja", escape = "none")]
pub struct VisibilityModifierPubTemplate<'a> {
    pub pub_: SingleNonterminalView<'a>,
    pub visibility_modifier_pub_parens: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_type.jinja", escape = "none")]
pub struct AbstractTypeTemplate<'a> {
    pub trait_: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub attributes: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_expression.jinja", escape = "none")]
pub struct ArrayExpressionTemplate<'a> {
    pub variant: &'a str,
    pub array_expression_list: SingleNonterminalView<'a>,
    pub array_expression_semi: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub element: SingleNonterminalView<'a>,
    pub length: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "associated_type.jinja", escape = "none")]
pub struct AssociatedTypeTemplate<'a> {
    pub bounds: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "async_block.jinja", escape = "none")]
pub struct AsyncBlockTemplate<'a> {
    pub block: SingleNonterminalView<'a>,
    pub move_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "attribute_item.jinja", escape = "none")]
pub struct AttributeItemTemplate<'a> {
    pub attribute: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
    pub arguments: OptionalNonterminalView<'a>,
    pub path: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "base_field_initializer.jinja", escape = "none")]
pub struct BaseFieldInitializerTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "block_comment.jinja", escape = "none")]
pub struct BlockCommentTemplate<'a> {
    pub doc: OptionalNonterminalView<'a>,
    pub outer: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub label: OptionalNonterminalView<'a>,
    pub statement: ListNonterminalView<'a>,
    pub trailing_expression: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "bounded_type.jinja", escape = "none")]
pub struct BoundedTypeTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub lifetime: ListNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
    pub type_: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "bracketed_type.jinja", escape = "none")]
pub struct BracketedTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "break_expression.jinja", escape = "none")]
pub struct BreakExpressionTemplate<'a> {
    pub expression: OptionalNonterminalView<'a>,
    pub label: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub arguments: SingleNonterminalView<'a>,
    pub function: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "captured_pattern.jinja", escape = "none")]
pub struct CapturedPatternTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression_expr.jinja", escape = "none")]
pub struct ClosureExpressionExprTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression.jinja", escape = "none")]
pub struct ClosureExpressionTemplate<'a> {
    pub variant: &'a str,
    pub async_marker: OptionalNonterminalView<'a>,
    pub closure_expression_block: SingleNonterminalView<'a>,
    pub closure_expression_expr: SingleNonterminalView<'a>,
    pub move_marker: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub static_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "closure_parameters.jinja", escape = "none")]
pub struct ClosureParametersTemplate<'a> {
    pub pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "comment.jinja", escape = "none")]
pub struct CommentTemplate<'a> {
    pub line_comment: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "compound_assignment_expr.jinja", escape = "none")]
pub struct CompoundAssignmentExprTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "const_block.jinja", escape = "none")]
pub struct ConstBlockTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "const_item.jinja", escape = "none")]
pub struct ConstItemTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "const_parameter.jinja", escape = "none")]
pub struct ConstParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "continue_expression.jinja", escape = "none")]
pub struct ContinueExpressionTemplate<'a> {
    pub label: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "declaration_list.jinja", escape = "none")]
pub struct DeclarationListTemplate<'a> {
    pub declaration_statement: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_brace.jinja", escape = "none")]
pub struct DelimTokenTreeBraceTemplate<'a> {
    pub delim_tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_bracket.jinja", escape = "none")]
pub struct DelimTokenTreeBracketTemplate<'a> {
    pub delim_tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_paren.jinja", escape = "none")]
pub struct DelimTokenTreeParenTemplate<'a> {
    pub delim_tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree.jinja", escape = "none")]
pub struct DelimTokenTreeTemplate<'a> {
    pub variant: &'a str,
    pub delim_token_tree_brace: SingleNonterminalView<'a>,
    pub delim_token_tree_bracket: SingleNonterminalView<'a>,
    pub delim_token_tree_paren: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dynamic_type.jinja", escape = "none")]
pub struct DynamicTypeTemplate<'a> {
    pub trait_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub block: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_item.jinja", escape = "none")]
pub struct EnumItemTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant_list.jinja", escape = "none")]
pub struct EnumVariantListTemplate<'a> {
    pub attributed_enum_variant: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant.jinja", escape = "none")]
pub struct EnumVariantTemplate<'a> {
    pub body: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_block_ending.jinja", escape = "none")]
pub struct ExpressionStatementBlockEndingTemplate<'a> {
    pub expression_ending_with_block: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_with_semi.jinja", escape = "none")]
pub struct ExpressionStatementWithSemiTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub variant: &'a str,
    pub expression_statement_block_ending: SingleNonterminalView<'a>,
    pub expression_statement_with_semi: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extern_crate_declaration.jinja", escape = "none")]
pub struct ExternCrateDeclarationTemplate<'a> {
    pub alias: OptionalNonterminalView<'a>,
    pub crate_: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extern_modifier.jinja", escape = "none")]
pub struct ExternModifierTemplate<'a> {
    pub string_literal: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration_list.jinja", escape = "none")]
pub struct FieldDeclarationListTemplate<'a> {
    pub attributed_field_declaration: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration.jinja", escape = "none")]
pub struct FieldDeclarationTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_expression.jinja", escape = "none")]
pub struct FieldExpressionTemplate<'a> {
    pub field: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer_list.jinja", escape = "none")]
pub struct FieldInitializerListTemplate<'a> {
    pub shorthand_field_initializer: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer.jinja", escape = "none")]
pub struct FieldInitializerTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub field: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_pattern_shorthand.jinja", escape = "none")]
pub struct FieldPatternShorthandTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_pattern.jinja", escape = "none")]
pub struct FieldPatternTemplate<'a> {
    pub variant: &'a str,
    pub field_pattern_named: SingleNonterminalView<'a>,
    pub field_pattern_shorthand: SingleNonterminalView<'a>,
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub ref_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_expression.jinja", escape = "none")]
pub struct ForExpressionTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub label: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_lifetimes.jinja", escape = "none")]
pub struct ForLifetimesTemplate<'a> {
    pub lifetime: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item_body.jinja", escape = "none")]
pub struct ForeignModItemBodyTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item.jinja", escape = "none")]
pub struct ForeignModItemTemplate<'a> {
    pub variant: &'a str,
    pub extern_modifier: SingleNonterminalView<'a>,
    pub foreign_mod_item_body: SingleNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_item.jinja", escape = "none")]
pub struct FunctionItemTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub function_modifiers: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_modifiers.jinja", escape = "none")]
pub struct FunctionModifiersTemplate<'a> {
    pub modifier: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_signature_item.jinja", escape = "none")]
pub struct FunctionSignatureItemTemplate<'a> {
    pub function_modifiers: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate<'a> {
    pub for_lifetimes: OptionalNonterminalView<'a>,
    pub function_type_fn_form: ListNonterminalView<'a>,
    pub function_type_trait_form: SingleNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub return_type: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "gen_block.jinja", escape = "none")]
pub struct GenBlockTemplate<'a> {
    pub block: SingleNonterminalView<'a>,
    pub move_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_function.jinja", escape = "none")]
pub struct GenericFunctionTemplate<'a> {
    pub function: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_pattern.jinja", escape = "none")]
pub struct GenericPatternTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type_with_turbofish.jinja", escape = "none")]
pub struct GenericTypeWithTurbofishTemplate<'a> {
    pub turbofish: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "higher_ranked_trait_bound.jinja", escape = "none")]
pub struct HigherRankedTraitBoundTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
    pub type_parameters: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_expression.jinja", escape = "none")]
pub struct IfExpressionTemplate<'a> {
    pub alternative: OptionalNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub consequence: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "impl_item_body.jinja", escape = "none")]
pub struct ImplItemBodyTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "impl_item.jinja", escape = "none")]
pub struct ImplItemTemplate<'a> {
    pub variant: &'a str,
    pub impl_item_body: SingleNonterminalView<'a>,
    pub negative: OptionalNonterminalView<'a>,
    pub trait_: OptionalNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub unsafe_marker: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_expression.jinja", escape = "none")]
pub struct IndexExpressionTemplate<'a> {
    pub index: SingleNonterminalView<'a>,
    pub object: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "inner_attribute_item.jinja", escape = "none")]
pub struct InnerAttributeItemTemplate<'a> {
    pub attribute: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "label.jinja", escape = "none")]
pub struct LabelTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "last_match_arm.jinja", escape = "none")]
pub struct LastMatchArmTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "let_condition.jinja", escape = "none")]
pub struct LetConditionTemplate<'a> {
    pub pattern: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "let_declaration.jinja", escape = "none")]
pub struct LetDeclarationTemplate<'a> {
    pub alternative: OptionalNonterminalView<'a>,
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub type_: OptionalNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lifetime_parameter.jinja", escape = "none")]
pub struct LifetimeParameterTemplate<'a> {
    pub bounds: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lifetime.jinja", escape = "none")]
pub struct LifetimeTemplate<'a> {
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "line_comment.jinja", escape = "none")]
pub struct LineCommentTemplate<'a> {
    pub variant: &'a str,
    pub line_comment_content: SingleNonterminalView<'a>,
    pub line_comment_doc: SingleNonterminalView<'a>,
    pub line_comment_regular_dslash: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "loop_expression.jinja", escape = "none")]
pub struct LoopExpressionTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub label: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_brace.jinja", escape = "none")]
pub struct MacroDefinitionBraceTemplate<'a> {
    pub macro_rule: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_bracket.jinja", escape = "none")]
pub struct MacroDefinitionBracketTemplate<'a> {
    pub macro_rule: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_paren.jinja", escape = "none")]
pub struct MacroDefinitionParenTemplate<'a> {
    pub macro_rule: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition.jinja", escape = "none")]
pub struct MacroDefinitionTemplate<'a> {
    pub variant: &'a str,
    pub macro_definition_brace: SingleNonterminalView<'a>,
    pub macro_definition_bracket: SingleNonterminalView<'a>,
    pub macro_definition_paren: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_invocation.jinja", escape = "none")]
pub struct MacroInvocationTemplate<'a> {
    pub macro_: SingleNonterminalView<'a>,
    pub token_tree: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_rule.jinja", escape = "none")]
pub struct MacroRuleTemplate<'a> {
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_arm_block_ending.jinja", escape = "none")]
pub struct MatchArmBlockEndingTemplate<'a> {
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_arm.jinja", escape = "none")]
pub struct MatchArmTemplate<'a> {
    pub variant: &'a str,
    pub attributes: ListNonterminalView<'a>,
    pub match_arm_block_ending: SingleNonterminalView<'a>,
    pub match_arm_with_comma: SingleNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub match_arm: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_expression.jinja", escape = "none")]
pub struct MatchExpressionTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_pattern.jinja", escape = "none")]
pub struct MatchPatternTemplate<'a> {
    pub condition: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mod_item_inline.jinja", escape = "none")]
pub struct ModItemInlineTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mod_item.jinja", escape = "none")]
pub struct ModItemTemplate<'a> {
    pub variant: &'a str,
    pub mod_item_inline: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mut_pattern.jinja", escape = "none")]
pub struct MutPatternTemplate<'a> {
    pub mutable_specifier: SingleNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "negative_literal.jinja", escape = "none")]
pub struct NegativeLiteralTemplate<'a> {
    pub integer_literal: ListNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "or_pattern.jinja", escape = "none")]
pub struct OrPatternTemplate<'a> {
    pub variant: &'a str,
    pub or_pattern_binary: SingleNonterminalView<'a>,
    pub or_pattern_prefix: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ordered_field_declaration_list.jinja", escape = "none")]
pub struct OrderedFieldDeclarationListTemplate<'a> {
    pub attribute_item: ListNonterminalView<'a>,
    pub type_: ListNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parameter.jinja", escape = "none")]
pub struct ParameterTemplate<'a> {
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate<'a> {
    pub attributed_parameter: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub expression: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pointer_type_mut.jinja", escape = "none")]
pub struct PointerTypeMutTemplate<'a> {
    pub mutable_specifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pointer_type.jinja", escape = "none")]
pub struct PointerTypeTemplate<'a> {
    pub variant: &'a str,
    pub mutable_specifier: ListNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "qualified_type.jinja", escape = "none")]
pub struct QualifiedTypeTemplate<'a> {
    pub alias: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_expression_bare.jinja", escape = "none")]
pub struct RangeExpressionBareTemplate<'a> {
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_expression.jinja", escape = "none")]
pub struct RangeExpressionTemplate<'a> {
    pub variant: &'a str,
    pub operator: SingleNonterminalView<'a>,
    pub range_expression_binary: SingleNonterminalView<'a>,
    pub range_expression_postfix: SingleNonterminalView<'a>,
    pub range_expression_prefix: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_pattern.jinja", escape = "none")]
pub struct RangePatternTemplate<'a> {
    pub variant: &'a str,
    pub left: SingleNonterminalView<'a>,
    pub range_pattern_left_with_right: SingleNonterminalView<'a>,
    pub range_pattern_prefix: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "raw_string_literal.jinja", escape = "none")]
pub struct RawStringLiteralTemplate<'a> {
    pub string_content: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ref_pattern.jinja", escape = "none")]
pub struct RefPatternTemplate<'a> {
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "reference_expression.jinja", escape = "none")]
pub struct ReferenceExpressionTemplate<'a> {
    pub mutable_specifier: ListNonterminalView<'a>,
    pub reference_expression_raw_const: OptionalNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "reference_pattern.jinja", escape = "none")]
pub struct ReferencePatternTemplate<'a> {
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "reference_type.jinja", escape = "none")]
pub struct ReferenceTypeTemplate<'a> {
    pub lifetime: OptionalNonterminalView<'a>,
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "removed_trait_bound.jinja", escape = "none")]
pub struct RemovedTraitBoundTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_expression.jinja", escape = "none")]
pub struct ReturnExpressionTemplate<'a> {
    pub expression: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_identifier.jinja", escape = "none")]
pub struct ScopedIdentifierTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub path: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier_in_expression_position.jinja", escape = "none")]
pub struct ScopedTypeIdentifierInExpressionPositionTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub path: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier.jinja", escape = "none")]
pub struct ScopedTypeIdentifierTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub path: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_use_list.jinja", escape = "none")]
pub struct ScopedUseListTemplate<'a> {
    pub list: SingleNonterminalView<'a>,
    pub path: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "self_parameter.jinja", escape = "none")]
pub struct SelfParameterTemplate<'a> {
    pub lifetime: OptionalNonterminalView<'a>,
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub reference: OptionalNonterminalView<'a>,
    pub self_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "shorthand_field_initializer.jinja", escape = "none")]
pub struct ShorthandFieldInitializerTemplate<'a> {
    pub attributes: ListNonterminalView<'a>,
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "slice_pattern.jinja", escape = "none")]
pub struct SlicePatternTemplate<'a> {
    pub pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "source_file.jinja", escape = "none")]
pub struct SourceFileTemplate<'a> {
    pub shebang: OptionalNonterminalView<'a>,
    pub statements: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "static_item.jinja", escape = "none")]
pub struct StaticItemTemplate<'a> {
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub ref_marker: OptionalNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_literal.jinja", escape = "none")]
pub struct StringLiteralTemplate<'a> {
    pub escape_sequence: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "struct_expression.jinja", escape = "none")]
pub struct StructExpressionTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "struct_item.jinja", escape = "none")]
pub struct StructItemTemplate<'a> {
    pub variant: &'a str,
    pub name: SingleNonterminalView<'a>,
    pub struct_item_brace: SingleNonterminalView<'a>,
    pub struct_item_tuple: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "struct_pattern.jinja", escape = "none")]
pub struct StructPatternTemplate<'a> {
    pub field_pattern: ListNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_binding_pattern.jinja", escape = "none")]
pub struct TokenBindingPatternTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition_pattern.jinja", escape = "none")]
pub struct TokenRepetitionPatternTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition.jinja", escape = "none")]
pub struct TokenRepetitionTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_brace.jinja", escape = "none")]
pub struct TokenTreeBraceTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_bracket.jinja", escape = "none")]
pub struct TokenTreeBracketTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_paren.jinja", escape = "none")]
pub struct TokenTreeParenTemplate<'a> {
    pub tokens: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_brace.jinja", escape = "none")]
pub struct TokenTreePatternBraceTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_bracket.jinja", escape = "none")]
pub struct TokenTreePatternBracketTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_paren.jinja", escape = "none")]
pub struct TokenTreePatternParenTemplate<'a> {
    pub token_pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern.jinja", escape = "none")]
pub struct TokenTreePatternTemplate<'a> {
    pub variant: &'a str,
    pub token_tree_pattern_brace: SingleNonterminalView<'a>,
    pub token_tree_pattern_bracket: SingleNonterminalView<'a>,
    pub token_tree_pattern_paren: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree.jinja", escape = "none")]
pub struct TokenTreeTemplate<'a> {
    pub variant: &'a str,
    pub token_tree_brace: SingleNonterminalView<'a>,
    pub token_tree_bracket: SingleNonterminalView<'a>,
    pub token_tree_paren: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "trait_bounds.jinja", escape = "none")]
pub struct TraitBoundsTemplate<'a> {
    pub type_: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "trait_item.jinja", escape = "none")]
pub struct TraitItemTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub bounds: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub unsafe_marker: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "try_block.jinja", escape = "none")]
pub struct TryBlockTemplate<'a> {
    pub block: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "try_expression.jinja", escape = "none")]
pub struct TryExpressionTemplate<'a> {
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_expression.jinja", escape = "none")]
pub struct TupleExpressionTemplate<'a> {
    pub attributes: ListNonterminalView<'a>,
    pub elements: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub pattern: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_struct_pattern.jinja", escape = "none")]
pub struct TupleStructPatternTemplate<'a> {
    pub pattern: ListNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub type_: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub trait_bounds: OptionalNonterminalView<'a>,
    pub type_: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_binding.jinja", escape = "none")]
pub struct TypeBindingTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_cast_expression.jinja", escape = "none")]
pub struct TypeCastExpressionTemplate<'a> {
    pub type_: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_item.jinja", escape = "none")]
pub struct TypeItemTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub type_: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause1: OptionalNonterminalView<'a>,
    pub where_clause2: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub bounds: OptionalNonterminalView<'a>,
    pub default_type: OptionalNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate<'a> {
    pub attributed_type_parameter: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub operand: SingleNonterminalView<'a>,
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_item.jinja", escape = "none")]
pub struct UnionItemTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unsafe_block.jinja", escape = "none")]
pub struct UnsafeBlockTemplate<'a> {
    pub block: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_as_clause.jinja", escape = "none")]
pub struct UseAsClauseTemplate<'a> {
    pub alias: SingleNonterminalView<'a>,
    pub path: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_bounds.jinja", escape = "none")]
pub struct UseBoundsTemplate<'a> {
    pub lifetime: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_declaration.jinja", escape = "none")]
pub struct UseDeclarationTemplate<'a> {
    pub argument: SingleNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_list.jinja", escape = "none")]
pub struct UseListTemplate<'a> {
    pub use_clause: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_wildcard.jinja", escape = "none")]
pub struct UseWildcardTemplate<'a> {
    pub path: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variadic_parameter.jinja", escape = "none")]
pub struct VariadicParameterTemplate<'a> {
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub pattern: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier_crate.jinja", escape = "none")]
pub struct VisibilityModifierCrateTemplate<'a> {
    pub crate_: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier.jinja", escape = "none")]
pub struct VisibilityModifierTemplate<'a> {
    pub variant: &'a str,
    pub crate_: ListNonterminalView<'a>,
    pub pub_: SingleNonterminalView<'a>,
    pub visibility_modifier_in_path: SingleNonterminalView<'a>,
    pub visibility_modifier_pub_parens: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "where_clause.jinja", escape = "none")]
pub struct WhereClauseTemplate<'a> {
    pub where_predicate: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "where_predicate.jinja", escape = "none")]
pub struct WherePredicateTemplate<'a> {
    pub bounds: SingleNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "while_expression.jinja", escape = "none")]
pub struct WhileExpressionTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
    pub condition: SingleNonterminalView<'a>,
    pub label: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate<'a> {
    pub expression: OptionalNonterminalView<'a>,
}

