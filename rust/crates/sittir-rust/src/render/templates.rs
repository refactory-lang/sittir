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
#[template(path = "_array_expression_list.jinja", escape = "none")]
pub struct ArrayExpressionListTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_bracket.jinja", escape = "none")]
pub struct _DelimTokenTreeBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_paren.jinja", escape = "none")]
pub struct _DelimTokenTreeParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_block_ending.jinja", escape = "none")]
pub struct _ExpressionStatementBlockEndingTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_with_semi.jinja", escape = "none")]
pub struct _ExpressionStatementWithSemiTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_field_identifier.jinja", escape = "none")]
pub struct FieldIdentifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_trait_form.jinja", escape = "none")]
pub struct FunctionTypeTraitFormTemplate<'a> {
    pub r#trait: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_impl_item_body.jinja", escape = "none")]
pub struct _ImplItemBodyTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_let_chain.jinja", escape = "none")]
pub struct LetChainTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_line_comment_doc.jinja", escape = "none")]
pub struct LineCommentDocTemplate<'a> {
    pub doc: SingleNonterminalView<'a>,
    pub inner: OptionalNonterminalView<'a>,
    pub outer: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_brace.jinja", escape = "none")]
pub struct _MacroDefinitionBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_bracket.jinja", escape = "none")]
pub struct _MacroDefinitionBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_paren.jinja", escape = "none")]
pub struct _MacroDefinitionParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_reserved_identifier.jinja", escape = "none")]
pub struct ReservedIdentifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_brace.jinja", escape = "none")]
pub struct StructItemBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_tuple.jinja", escape = "none")]
pub struct StructItemTupleTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_brace.jinja", escape = "none")]
pub struct _TokenTreeBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_bracket.jinja", escape = "none")]
pub struct _TokenTreeBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_paren.jinja", escape = "none")]
pub struct _TokenTreeParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_brace.jinja", escape = "none")]
pub struct _TokenTreePatternBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_bracket.jinja", escape = "none")]
pub struct _TokenTreePatternBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_paren.jinja", escape = "none")]
pub struct _TokenTreePatternParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_crate.jinja", escape = "none")]
pub struct _VisibilityModifierCrateTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_in_path.jinja", escape = "none")]
pub struct VisibilityModifierInPathTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#in: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub.jinja", escape = "none")]
pub struct VisibilityModifierPubTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#pub: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "abstract_type.jinja", escape = "none")]
pub struct AbstractTypeTemplate<'a> {
    pub r#trait: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "base_field_initializer.jinja", escape = "none")]
pub struct BaseFieldInitializerTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub inner: OptionalNonterminalView<'a>,
    pub outer: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub label: OptionalNonterminalView<'a>,
    pub trailing_expression: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "bounded_type.jinja", escape = "none")]
pub struct BoundedTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
    pub right: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "bracketed_type.jinja", escape = "none")]
pub struct BracketedTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "break_expression.jinja", escape = "none")]
pub struct BreakExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub identifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression_expr.jinja", escape = "none")]
pub struct ClosureExpressionExprTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression.jinja", escape = "none")]
pub struct ClosureExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub async_marker: OptionalNonterminalView<'a>,
    pub move_marker: OptionalNonterminalView<'a>,
    pub parameters: SingleNonterminalView<'a>,
    pub static_marker: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "closure_parameters.jinja", escape = "none")]
pub struct ClosureParametersTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "comment.jinja", escape = "none")]
pub struct CommentTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub r#type: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "const_parameter.jinja", escape = "none")]
pub struct ConstParameterTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_brace.jinja", escape = "none")]
pub struct DelimTokenTreeBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_bracket.jinja", escape = "none")]
pub struct DelimTokenTreeBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_paren.jinja", escape = "none")]
pub struct DelimTokenTreeParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree.jinja", escape = "none")]
pub struct DelimTokenTreeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dynamic_type.jinja", escape = "none")]
pub struct DynamicTypeTemplate<'a> {
    pub r#trait: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_with_semi.jinja", escape = "none")]
pub struct ExpressionStatementWithSemiTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration.jinja", escape = "none")]
pub struct FieldDeclarationTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer.jinja", escape = "none")]
pub struct FieldInitializerTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item_body.jinja", escape = "none")]
pub struct ForeignModItemBodyTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item.jinja", escape = "none")]
pub struct ForeignModItemTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub extern_modifier: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub for_lifetimes: OptionalNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type_with_turbofish.jinja", escape = "none")]
pub struct GenericTypeWithTurbofishTemplate<'a> {
    pub turbofish: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
    pub type_arguments: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "higher_ranked_trait_bound.jinja", escape = "none")]
pub struct HigherRankedTraitBoundTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub negative: OptionalNonterminalView<'a>,
    pub r#trait: OptionalNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub r#type: OptionalNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_bracket.jinja", escape = "none")]
pub struct MacroDefinitionBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_paren.jinja", escape = "none")]
pub struct MacroDefinitionParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition.jinja", escape = "none")]
pub struct MacroDefinitionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_invocation.jinja", escape = "none")]
pub struct MacroInvocationTemplate<'a> {
    pub r#macro: SingleNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub attributes: ListNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub condition: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mod_item_inline.jinja", escape = "none")]
pub struct ModItemInlineTemplate<'a> {
    pub body: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mod_item.jinja", escape = "none")]
pub struct ModItemTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "mut_pattern.jinja", escape = "none")]
pub struct MutPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub mutable_specifier: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "negative_literal.jinja", escape = "none")]
pub struct NegativeLiteralTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "or_pattern.jinja", escape = "none")]
pub struct OrPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ordered_field_declaration_list.jinja", escape = "none")]
pub struct OrderedFieldDeclarationListTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#type: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parameter.jinja", escape = "none")]
pub struct ParameterTemplate<'a> {
    pub mutable_specifier: OptionalNonterminalView<'a>,
    pub pattern: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
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
#[template(path = "pointer_type_mut.jinja", escape = "none")]
pub struct PointerTypeMutTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pointer_type.jinja", escape = "none")]
pub struct PointerTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "qualified_type.jinja", escape = "none")]
pub struct QualifiedTypeTemplate<'a> {
    pub alias: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_expression_bare.jinja", escape = "none")]
pub struct RangeExpressionBareTemplate<'a> {
    pub operator: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_expression.jinja", escape = "none")]
pub struct RangeExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_pattern.jinja", escape = "none")]
pub struct RangePatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub left: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "raw_string_literal.jinja", escape = "none")]
pub struct RawStringLiteralTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "ref_pattern.jinja", escape = "none")]
pub struct RefPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "reference_expression.jinja", escape = "none")]
pub struct ReferenceExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "removed_trait_bound.jinja", escape = "none")]
pub struct RemovedTraitBoundTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_expression.jinja", escape = "none")]
pub struct ReturnExpressionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub r#type: SingleNonterminalView<'a>,
    pub value: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_literal.jinja", escape = "none")]
pub struct StringLiteralTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
    pub name: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "struct_pattern.jinja", escape = "none")]
pub struct StructPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_binding_pattern.jinja", escape = "none")]
pub struct TokenBindingPatternTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition_pattern.jinja", escape = "none")]
pub struct TokenRepetitionPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition.jinja", escape = "none")]
pub struct TokenRepetitionTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_brace.jinja", escape = "none")]
pub struct TokenTreeBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_bracket.jinja", escape = "none")]
pub struct TokenTreeBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_paren.jinja", escape = "none")]
pub struct TokenTreeParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_brace.jinja", escape = "none")]
pub struct TokenTreePatternBraceTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_bracket.jinja", escape = "none")]
pub struct TokenTreePatternBracketTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_paren.jinja", escape = "none")]
pub struct TokenTreePatternParenTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern.jinja", escape = "none")]
pub struct TokenTreePatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree.jinja", escape = "none")]
pub struct TokenTreeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "trait_bounds.jinja", escape = "none")]
pub struct TraitBoundsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_struct_pattern.jinja", escape = "none")]
pub struct TupleStructPatternTemplate<'a> {
    pub children: ListNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_binding.jinja", escape = "none")]
pub struct TypeBindingTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
    pub type_arguments: OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_cast_expression.jinja", escape = "none")]
pub struct TypeCastExpressionTemplate<'a> {
    pub r#type: SingleNonterminalView<'a>,
    pub value: SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_item.jinja", escape = "none")]
pub struct TypeItemTemplate<'a> {
    pub name: SingleNonterminalView<'a>,
    pub trailing_where_clause: OptionalNonterminalView<'a>,
    pub r#type: SingleNonterminalView<'a>,
    pub type_parameters: OptionalNonterminalView<'a>,
    pub visibility_modifier: OptionalNonterminalView<'a>,
    pub where_clause: OptionalNonterminalView<'a>,
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
    pub attributes: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier.jinja", escape = "none")]
pub struct VisibilityModifierTemplate<'a> {
    pub children: ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "where_clause.jinja", escape = "none")]
pub struct WhereClauseTemplate<'a> {
    pub children: ListNonterminalView<'a>,
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
    pub children: ListNonterminalView<'a>,
}

pub(crate) fn render_hidden_array_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_1 = resolve_field(node, "elements", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ArrayExpressionListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        elements: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_array_expression_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements", "length"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_1 = resolve_field(node, "elements", true)?;
    let field_2 = resolve_field(node, "length", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ArrayExpressionSemiTemplate {
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        elements: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        length: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_closure_expression_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "return_type"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let template = ClosureExpressionBlockTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        return_type: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_closure_expression_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ClosureExpressionExprTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_delim_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _DelimTokenTreeBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_delim_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _DelimTokenTreeBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_delim_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _DelimTokenTreeParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_expression_statement_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ExpressionStatementBlockEndingTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_expression_statement_with_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _ExpressionStatementWithSemiTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_field_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FieldIdentifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_field_pattern_named(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "pattern"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = FieldPatternNamedTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_field_pattern_shorthand(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = _FieldPatternShorthandTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_foreign_mod_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ForeignModItemBodyTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_function_type_fn_form(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FunctionTypeFnFormTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_function_type_trait_form(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait"])?;
    let field_0 = resolve_field(node, "trait", true)?;
    let template = FunctionTypeTraitFormTemplate {
        r#trait: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_impl_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ImplItemBodyTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_let_chain(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = LetChainTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_line_comment_doc(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["doc", "inner", "outer"])?;
    let field_0 = resolve_field(node, "doc", true)?;
    let field_1 = resolve_field(node, "inner", false)?;
    let field_2 = resolve_field(node, "outer", false)?;
    let template = LineCommentDocTemplate {
        doc: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        inner: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        outer: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_hidden_macro_definition_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _MacroDefinitionBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_macro_definition_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _MacroDefinitionBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_macro_definition_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _MacroDefinitionParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_match_arm_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = _MatchArmBlockEndingTemplate {
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_match_arm_with_comma(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = MatchArmWithCommaTemplate {
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_mod_item_inline(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ModItemInlineTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_or_pattern_binary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = OrPatternBinaryTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_or_pattern_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = OrPatternPrefixTemplate {
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_pointer_type_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _PointerTypeMutTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_range_expression_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator"])?;
    let field_0 = resolve_field(node, "operator", true)?;
    let template = _RangeExpressionBareTemplate {
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_range_expression_binary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["end", "operator", "start"])?;
    let field_0 = resolve_field(node, "end", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "start", true)?;
    let template = RangeExpressionBinaryTemplate {
        end: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        start: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_range_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator", "start"])?;
    let field_0 = resolve_field(node, "operator", true)?;
    let field_1 = resolve_field(node, "start", true)?;
    let template = RangeExpressionPostfixTemplate {
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        start: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_range_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["end", "operator"])?;
    let field_0 = resolve_field(node, "end", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = RangeExpressionPrefixTemplate {
        end: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_range_pattern_left_with_right(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = RangePatternLeftWithRightTemplate {
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_range_pattern_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = RangePatternPrefixTemplate {
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_reference_expression_raw_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ReferenceExpressionRawMutTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_reserved_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ReservedIdentifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_struct_item_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = StructItemBraceTemplate {
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

pub(crate) fn render_hidden_struct_item_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = StructItemTupleTemplate {
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

pub(crate) fn render_hidden_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _TokenTreeBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _TokenTreeBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _TokenTreeParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_token_tree_pattern_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _TokenTreePatternBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_token_tree_pattern_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _TokenTreePatternBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_token_tree_pattern_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _TokenTreePatternParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeIdentifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_visibility_modifier_crate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _VisibilityModifierCrateTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_hidden_visibility_modifier_in_path(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["in"])?;
    let field_0 = resolve_field(node, "in", true)?;
    let children_renderables = children.renderable_items();
    let template = VisibilityModifierInPathTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        r#in: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_hidden_visibility_modifier_pub(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pub"])?;
    let field_0 = resolve_field(node, "pub", true)?;
    let children_renderables = children.renderable_items();
    let template = VisibilityModifierPubTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        r#pub: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_abstract_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait", "type_parameters"])?;
    let field_0 = resolve_field(node, "trait", true)?;
    let field_1 = resolve_field(node, "type_parameters", false)?;
    let template = AbstractTypeTemplate {
        r#trait: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_parameters: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ArgumentsTemplate {
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_array_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ArrayExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_array_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["element", "length"])?;
    let field_0 = resolve_field(node, "element", true)?;
    let field_1 = resolve_field(node, "length", false)?;
    let template = ArrayTypeTemplate {
        element: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        length: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = AssignmentExpressionTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_associated_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "name", "type_parameters", "where_clause"])?;
    let field_0 = resolve_field(node, "bounds", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "where_clause", false)?;
    let template = AssociatedTypeTemplate {
        bounds: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        where_clause: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_async_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block", "move_marker"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let field_1 = resolve_field(node, "move_marker", false)?;
    let template = AsyncBlockTemplate {
        block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        move_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_attribute_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let template = AttributeItemTemplate {
        attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "path", "value"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "path", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = AttributeTemplate {
        arguments: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        path: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = AwaitExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_base_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = BaseFieldInitializerTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_binary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryExpressionTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_block_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["doc", "inner", "outer"])?;
    let field_0 = resolve_field(node, "doc", false)?;
    let field_1 = resolve_field(node, "inner", false)?;
    let field_2 = resolve_field(node, "outer", false)?;
    let template = BlockCommentTemplate {
        doc: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        inner: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        outer: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "trailing_expression"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "trailing_expression", false)?;
    let children_renderables = children.renderable_items();
    let template = BlockTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        label: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        trailing_expression: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_bounded_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let children_renderables = children.renderable_items();
    let template = BoundedTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_bracketed_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = BracketedTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_break_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let children_renderables = children.renderable_items();
    let template = BreakExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        label: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallExpressionTemplate {
        arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_captured_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let children_renderables = children.renderable_items();
    let template = CapturedPatternTemplate {
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

pub(crate) fn render_closure_expression_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ClosureExpressionExprTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_closure_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "move_marker", "parameters", "static_marker"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "move_marker", false)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "static_marker", false)?;
    let children_renderables = children.renderable_items();
    let template = ClosureExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        move_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        static_marker: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_closure_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ClosureParametersTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = CommentTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_compound_assignment_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = CompoundAssignmentExprTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_const_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ConstBlockTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_const_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let template = ConstItemTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        visibility_modifier: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_const_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = ConstParameterTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_continue_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let template = ContinueExpressionTemplate {
        label: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DeclarationListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_delim_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DelimTokenTreeBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_delim_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DelimTokenTreeBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_delim_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DelimTokenTreeParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_delim_token_tree(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DelimTokenTreeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_dynamic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait"])?;
    let field_0 = resolve_field(node, "trait", true)?;
    let template = DynamicTypeTemplate {
        r#trait: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ElseClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_enum_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let field_4 = resolve_field(node, "where_clause", false)?;
    let template = EnumItemTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        visibility_modifier: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        where_clause: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_enum_variant_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = EnumVariantListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_enum_variant(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let template = EnumVariantTemplate {
        body: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        visibility_modifier: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_expression_statement_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementBlockEndingTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_expression_statement_with_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementWithSemiTemplate {
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
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_extern_crate_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "crate", "name", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "crate", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let template = ExternCrateDeclarationTemplate {
        alias: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        crate_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        visibility_modifier: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_extern_modifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["string_literal"])?;
    let field_0 = resolve_field(node, "string_literal", false)?;
    let template = ExternModifierTemplate {
        string_literal: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_field_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FieldDeclarationListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_field_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "visibility_modifier", false)?;
    let template = FieldDeclarationTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        visibility_modifier: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_field_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["field", "value"])?;
    let field_0 = resolve_field(node, "field", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = FieldExpressionTemplate {
        field: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_field_initializer_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FieldInitializerListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["field", "value"])?;
    let field_0 = resolve_field(node, "field", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let children_renderables = children.renderable_items();
    let template = FieldInitializerTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        field: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_field_pattern_shorthand(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = FieldPatternShorthandTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_field_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "ref_marker"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "ref_marker", false)?;
    let children_renderables = children.renderable_items();
    let template = FieldPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        mutable_specifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        ref_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_for_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label", "pattern", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", false)?;
    let field_2 = resolve_field(node, "pattern", true)?;
    let field_3 = resolve_field(node, "value", true)?;
    let template = ForExpressionTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        label: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_for_lifetimes(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ForLifetimesTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_foreign_mod_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ForeignModItemBodyTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_foreign_mod_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["extern_modifier", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "extern_modifier", true)?;
    let field_1 = resolve_field(node, "visibility_modifier", false)?;
    let children_renderables = children.renderable_items();
    let template = ForeignModItemTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        extern_modifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        visibility_modifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_function_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "function_modifiers", "name", "parameters", "return_type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "function_modifiers", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let field_6 = resolve_field(node, "visibility_modifier", false)?;
    let field_7 = resolve_field(node, "where_clause", false)?;
    let template = FunctionItemTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function_modifiers: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
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
        visibility_modifier: match field_6.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        },
        where_clause: match field_7.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_function_modifiers(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["modifier"])?;
    let field_0 = resolve_field(node, "modifier", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = FunctionModifiersTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        modifier: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_function_signature_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function_modifiers", "name", "parameters", "return_type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "function_modifiers", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "return_type", false)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let field_5 = resolve_field(node, "visibility_modifier", false)?;
    let field_6 = resolve_field(node, "where_clause", false)?;
    let template = FunctionSignatureItemTemplate {
        function_modifiers: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        return_type: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        type_parameters: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        visibility_modifier: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
        where_clause: match field_6.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["for_lifetimes", "parameters", "return_type"])?;
    let field_0 = resolve_field(node, "for_lifetimes", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "return_type", false)?;
    let children_renderables = children.renderable_items();
    let template = FunctionTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        for_lifetimes: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        return_type: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_gen_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block", "move_marker"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let field_1 = resolve_field(node, "move_marker", false)?;
    let template = GenBlockTemplate {
        block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        move_marker: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_generic_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericFunctionTemplate {
        function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_generic_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments"])?;
    let field_0 = resolve_field(node, "type_arguments", true)?;
    let children_renderables = children.renderable_items();
    let template = GenericPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_generic_type_with_turbofish(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["turbofish", "type", "type_arguments"])?;
    let field_0 = resolve_field(node, "turbofish", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeWithTurbofishTemplate {
        turbofish: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_arguments"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_higher_ranked_trait_bound(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_parameters"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_1 = resolve_field(node, "type_parameters", true)?;
    let template = HigherRankedTraitBoundTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_if_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfExpressionTemplate {
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_impl_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ImplItemBodyTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_impl_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["negative", "trait", "type", "type_parameters", "unsafe_marker", "where_clause"])?;
    let field_0 = resolve_field(node, "negative", false)?;
    let field_1 = resolve_field(node, "trait", false)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let field_4 = resolve_field(node, "unsafe_marker", false)?;
    let field_5 = resolve_field(node, "where_clause", false)?;
    let children_renderables = children.renderable_items();
    let template = ImplItemTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        negative: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        r#trait: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        unsafe_marker: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        where_clause: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_index_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = IndexExpressionTemplate {
        index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_inner_attribute_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let template = InnerAttributeItemTemplate {
        attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_label(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = LabelTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_last_match_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern", "value"])?;
    let field_0 = resolve_field(node, "pattern", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let children_renderables = children.renderable_items();
    let template = LastMatchArmTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_let_condition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern", "value"])?;
    let field_0 = resolve_field(node, "pattern", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = LetConditionTemplate {
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_let_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "mutable_specifier", "pattern", "type", "value"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "mutable_specifier", false)?;
    let field_2 = resolve_field(node, "pattern", true)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = LetDeclarationTemplate {
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        mutable_specifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        r#type: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        value: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_lifetime_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "name"])?;
    let field_0 = resolve_field(node, "bounds", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = LifetimeParameterTemplate {
        bounds: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_lifetime(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = LifetimeTemplate {
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_line_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = LineCommentTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_loop_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", false)?;
    let template = LoopExpressionTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        label: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_macro_definition_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = MacroDefinitionBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_macro_definition_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = MacroDefinitionBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_macro_definition_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = MacroDefinitionParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_macro_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let children_renderables = children.renderable_items();
    let template = MacroDefinitionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_macro_invocation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["macro", "token_tree"])?;
    let field_0 = resolve_field(node, "macro", true)?;
    let field_1 = resolve_field(node, "token_tree", true)?;
    let template = MacroInvocationTemplate {
        r#macro: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        token_tree: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_macro_rule(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = MacroRuleTemplate {
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_match_arm_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = MatchArmBlockEndingTemplate {
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_match_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "pattern"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = MatchArmTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
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

pub(crate) fn render_match_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = MatchExpressionTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_match_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition"])?;
    let field_0 = resolve_field(node, "condition", false)?;
    let children_renderables = children.renderable_items();
    let template = MatchPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        condition: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_mod_item_inline(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ModItemInlineTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_mod_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "visibility_modifier", false)?;
    let children_renderables = children.renderable_items();
    let template = ModItemTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        visibility_modifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_mut_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier"])?;
    let field_0 = resolve_field(node, "mutable_specifier", true)?;
    let children_renderables = children.renderable_items();
    let template = MutPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        mutable_specifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_negative_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let children_renderables = children.renderable_items();
    let template = NegativeLiteralTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_or_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = OrPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_ordered_field_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = OrderedFieldDeclarationListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        r#type: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern", "type"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = ParameterTemplate {
        mutable_specifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
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

pub(crate) fn render_pointer_type_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = PointerTypeMutTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_pointer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let template = PointerTypeTemplate {
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

pub(crate) fn render_qualified_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "type"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = QualifiedTypeTemplate {
        alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_range_expression_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator"])?;
    let field_0 = resolve_field(node, "operator", true)?;
    let template = RangeExpressionBareTemplate {
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_range_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = RangeExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_range_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let children_renderables = children.renderable_items();
    let template = RangePatternTemplate {
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

pub(crate) fn render_raw_string_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = RawStringLiteralTemplate {
        text: text.as_str(),
    };
    template.render()
}

pub(crate) fn render_ref_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = RefPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_reference_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let children_renderables = children.renderable_items();
    let template = ReferenceExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_reference_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = ReferencePatternTemplate {
        mutable_specifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_reference_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["lifetime", "mutable_specifier", "type"])?;
    let field_0 = resolve_field(node, "lifetime", false)?;
    let field_1 = resolve_field(node, "mutable_specifier", false)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = ReferenceTypeTemplate {
        lifetime: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        mutable_specifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_removed_trait_bound(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = RemovedTraitBoundTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_return_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ReturnExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_scoped_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedIdentifierTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        path: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_scoped_type_identifier_in_expression_position(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedTypeIdentifierInExpressionPositionTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        path: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_scoped_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedTypeIdentifierTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        path: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_scoped_use_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["list", "path"])?;
    let field_0 = resolve_field(node, "list", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedUseListTemplate {
        list: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        path: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_self_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["lifetime", "mutable_specifier", "reference", "self"])?;
    let field_0 = resolve_field(node, "lifetime", false)?;
    let field_1 = resolve_field(node, "mutable_specifier", false)?;
    let field_2 = resolve_field(node, "reference", false)?;
    let field_3 = resolve_field(node, "self", true)?;
    let template = SelfParameterTemplate {
        lifetime: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        mutable_specifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        reference: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        self_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_shorthand_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "identifier"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ShorthandFieldInitializerTemplate {
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_slice_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SlicePatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_source_file(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["shebang", "statements"])?;
    let field_0 = resolve_field(node, "shebang", false)?;
    let field_1 = resolve_field(node, "statements", true)?;
    let field_1_renderables = field_1.renderable_items();
    let template = SourceFileTemplate {
        shebang: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        statements: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_static_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "name", "ref_marker", "type", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "ref_marker", false)?;
    let field_3 = resolve_field(node, "type", true)?;
    let field_4 = resolve_field(node, "value", false)?;
    let field_5 = resolve_field(node, "visibility_modifier", false)?;
    let template = StaticItemTemplate {
        mutable_specifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        ref_marker: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        value: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        visibility_modifier: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_string_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = StringLiteralTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_struct_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = StructExpressionTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_struct_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_parameters", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type_parameters", false)?;
    let field_2 = resolve_field(node, "visibility_modifier", false)?;
    let children_renderables = children.renderable_items();
    let template = StructItemTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_parameters: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        visibility_modifier: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_struct_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let template = StructPatternTemplate {
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

pub(crate) fn render_token_binding_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TokenBindingPatternTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_token_repetition_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenRepetitionPatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_repetition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenRepetitionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreeBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreeBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreeParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_pattern_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreePatternBraceTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_pattern_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreePatternBracketTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_pattern_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreePatternParenTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreePatternTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_token_tree(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TokenTreeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_trait_bounds(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TraitBoundsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_trait_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "bounds", "name", "type_parameters", "unsafe_marker", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "bounds", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let field_4 = resolve_field(node, "unsafe_marker", false)?;
    let field_5 = resolve_field(node, "visibility_modifier", false)?;
    let field_6 = resolve_field(node, "where_clause", false)?;
    let template = TraitItemTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        bounds: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        unsafe_marker: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        visibility_modifier: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
        where_clause: match field_6.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_try_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = TryBlockTemplate {
        block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_try_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = TryExpressionTemplate {
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_tuple_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_1 = resolve_field(node, "elements", false)?;
    let field_0_renderables = field_0.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = TupleExpressionTemplate {
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        elements: ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
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

pub(crate) fn render_tuple_struct_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let template = TupleStructPatternTemplate {
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

pub(crate) fn render_tuple_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TupleTypeTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeArgumentsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_type_binding(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "type_arguments"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = TypeBindingTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_arguments: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_type_cast_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "value"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = TypeCastExpressionTemplate {
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "trailing_where_clause", "type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "trailing_where_clause", false)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let field_4 = resolve_field(node, "visibility_modifier", false)?;
    let field_5 = resolve_field(node, "where_clause", false)?;
    let template = TypeItemTemplate {
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        trailing_where_clause: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        visibility_modifier: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        where_clause: match field_5.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "default_type", "name"])?;
    let field_0 = resolve_field(node, "bounds", false)?;
    let field_1 = resolve_field(node, "default_type", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = TypeParameterTemplate {
        bounds: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        default_type: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_type_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes"])?;
    let field_0 = resolve_field(node, "attributes", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = TypeParametersTemplate {
        attributes: ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operand", "operator"])?;
    let field_0 = resolve_field(node, "operand", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryExpressionTemplate {
        operand: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_union_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let field_4 = resolve_field(node, "where_clause", false)?;
    let template = UnionItemTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        type_parameters: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        visibility_modifier: match field_3.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
        where_clause: match field_4.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_unsafe_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = UnsafeBlockTemplate {
        block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_use_as_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "path"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "path", true)?;
    let template = UseAsClauseTemplate {
        alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        path: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_use_bounds(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = UseBoundsTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_use_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "visibility_modifier", false)?;
    let template = UseDeclarationTemplate {
        argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        visibility_modifier: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_use_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = UseListTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_use_wildcard(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["path"])?;
    let field_0 = resolve_field(node, "path", false)?;
    let template = UseWildcardTemplate {
        path: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_variadic_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "pattern", false)?;
    let template = VariadicParameterTemplate {
        mutable_specifier: match field_0.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        pattern: match field_1.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_visibility_modifier_crate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = VisibilityModifierCrateTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_visibility_modifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = VisibilityModifierTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_where_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WhereClauseTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

pub(crate) fn render_where_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "left"])?;
    let field_0 = resolve_field(node, "bounds", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let template = WherePredicateTemplate {
        bounds: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

pub(crate) fn render_while_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "label", false)?;
    let template = WhileExpressionTemplate {
        body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        label: match field_2.kind {
            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

pub(crate) fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = YieldExpressionTemplate {
        children: ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

