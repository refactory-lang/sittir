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
#[template(path = "_array_expression_list.jinja", escape = "none")]
pub struct ArrayExpressionListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub attributes: ::sittir_core::filters::FieldView<'a>,
    pub elements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_array_expression_semi.jinja", escape = "none")]
pub struct ArrayExpressionSemiTemplate<'a> {
    pub attributes: ::sittir_core::filters::FieldView<'a>,
    pub elements: &'a str,
    pub length: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_block.jinja", escape = "none")]
pub struct ClosureExpressionBlockTemplate<'a> {
    pub body: &'a str,
    pub return_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_closure_expression_expr.jinja", escape = "none")]
pub struct _ClosureExpressionExprTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_brace.jinja", escape = "none")]
pub struct _DelimTokenTreeBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_bracket.jinja", escape = "none")]
pub struct _DelimTokenTreeBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_delim_token_tree_paren.jinja", escape = "none")]
pub struct _DelimTokenTreeParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_block_ending.jinja", escape = "none")]
pub struct _ExpressionStatementBlockEndingTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_expression_statement_with_semi.jinja", escape = "none")]
pub struct _ExpressionStatementWithSemiTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_field_identifier.jinja", escape = "none")]
pub struct FieldIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_named.jinja", escape = "none")]
pub struct FieldPatternNamedTemplate<'a> {
    pub name: &'a str,
    pub pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_field_pattern_shorthand.jinja", escape = "none")]
pub struct _FieldPatternShorthandTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_foreign_mod_item_body.jinja", escape = "none")]
pub struct _ForeignModItemBodyTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_fn_form.jinja", escape = "none")]
pub struct FunctionTypeFnFormTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_function_type_trait_form.jinja", escape = "none")]
pub struct FunctionTypeTraitFormTemplate<'a> {
    pub r#trait: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_impl_item_body.jinja", escape = "none")]
pub struct _ImplItemBodyTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_let_chain.jinja", escape = "none")]
pub struct LetChainTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_line_comment_doc.jinja", escape = "none")]
pub struct LineCommentDocTemplate<'a> {
    pub doc: &'a str,
    pub inner: &'a str,
    pub outer: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_brace.jinja", escape = "none")]
pub struct _MacroDefinitionBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_bracket.jinja", escape = "none")]
pub struct _MacroDefinitionBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_macro_definition_paren.jinja", escape = "none")]
pub struct _MacroDefinitionParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_arm_block_ending.jinja", escape = "none")]
pub struct _MatchArmBlockEndingTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_match_arm_with_comma.jinja", escape = "none")]
pub struct MatchArmWithCommaTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_mod_item_inline.jinja", escape = "none")]
pub struct _ModItemInlineTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_or_pattern_binary.jinja", escape = "none")]
pub struct OrPatternBinaryTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_or_pattern_prefix.jinja", escape = "none")]
pub struct OrPatternPrefixTemplate<'a> {
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_pointer_type_mut.jinja", escape = "none")]
pub struct _PointerTypeMutTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_bare.jinja", escape = "none")]
pub struct _RangeExpressionBareTemplate<'a> {
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_binary.jinja", escape = "none")]
pub struct RangeExpressionBinaryTemplate<'a> {
    pub end: &'a str,
    pub operator: &'a str,
    pub start: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_postfix.jinja", escape = "none")]
pub struct RangeExpressionPostfixTemplate<'a> {
    pub operator: &'a str,
    pub start: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_range_expression_prefix.jinja", escape = "none")]
pub struct RangeExpressionPrefixTemplate<'a> {
    pub end: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_range_pattern_left_with_right.jinja", escape = "none")]
pub struct RangePatternLeftWithRightTemplate<'a> {
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_range_pattern_prefix.jinja", escape = "none")]
pub struct RangePatternPrefixTemplate<'a> {
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_reference_expression_raw_mut.jinja", escape = "none")]
pub struct ReferenceExpressionRawMutTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_reserved_identifier.jinja", escape = "none")]
pub struct ReservedIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_shorthand_field_identifier.jinja", escape = "none")]
pub struct ShorthandFieldIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_content.jinja", escape = "none")]
pub struct _StringContentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_brace.jinja", escape = "none")]
pub struct StructItemBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_struct_item_tuple.jinja", escape = "none")]
pub struct StructItemTupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_brace.jinja", escape = "none")]
pub struct _TokenTreeBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_bracket.jinja", escape = "none")]
pub struct _TokenTreeBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_paren.jinja", escape = "none")]
pub struct _TokenTreeParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_brace.jinja", escape = "none")]
pub struct _TokenTreePatternBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_bracket.jinja", escape = "none")]
pub struct _TokenTreePatternBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_token_tree_pattern_paren.jinja", escape = "none")]
pub struct _TokenTreePatternParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_crate.jinja", escape = "none")]
pub struct _VisibilityModifierCrateTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_in_path.jinja", escape = "none")]
pub struct VisibilityModifierInPathTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#in: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_visibility_modifier_pub.jinja", escape = "none")]
pub struct VisibilityModifierPubTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#pub: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "abstract_type.jinja", escape = "none")]
pub struct AbstractTypeTemplate<'a> {
    pub r#trait: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_expression.jinja", escape = "none")]
pub struct ArrayExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub element: &'a str,
    pub length: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "associated_type.jinja", escape = "none")]
pub struct AssociatedTypeTemplate<'a> {
    pub bounds: &'a str,
    pub name: &'a str,
    pub type_parameters: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "async_block.jinja", escape = "none")]
pub struct AsyncBlockTemplate<'a> {
    pub block: &'a str,
    pub move_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "attribute_item.jinja", escape = "none")]
pub struct AttributeItemTemplate<'a> {
    pub attribute: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub arguments: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "base_field_initializer.jinja", escape = "none")]
pub struct BaseFieldInitializerTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "block_comment.jinja", escape = "none")]
pub struct BlockCommentTemplate<'a> {
    pub doc: &'a str,
    pub inner: &'a str,
    pub outer: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "bounded_type.jinja", escape = "none")]
pub struct BoundedTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "bracketed_type.jinja", escape = "none")]
pub struct BracketedTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "break_expression.jinja", escape = "none")]
pub struct BreakExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "captured_pattern.jinja", escape = "none")]
pub struct CapturedPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression_expr.jinja", escape = "none")]
pub struct ClosureExpressionExprTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "closure_expression.jinja", escape = "none")]
pub struct ClosureExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub move_marker: &'a str,
    pub parameters: &'a str,
    pub static_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "closure_parameters.jinja", escape = "none")]
pub struct ClosureParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "comment.jinja", escape = "none")]
pub struct CommentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "compound_assignment_expr.jinja", escape = "none")]
pub struct CompoundAssignmentExprTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "const_block.jinja", escape = "none")]
pub struct ConstBlockTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "const_item.jinja", escape = "none")]
pub struct ConstItemTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "const_parameter.jinja", escape = "none")]
pub struct ConstParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "continue_expression.jinja", escape = "none")]
pub struct ContinueExpressionTemplate<'a> {
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "declaration_list.jinja", escape = "none")]
pub struct DeclarationListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_brace.jinja", escape = "none")]
pub struct DelimTokenTreeBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_bracket.jinja", escape = "none")]
pub struct DelimTokenTreeBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree_paren.jinja", escape = "none")]
pub struct DelimTokenTreeParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delim_token_tree.jinja", escape = "none")]
pub struct DelimTokenTreeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dynamic_type.jinja", escape = "none")]
pub struct DynamicTypeTemplate<'a> {
    pub r#trait: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_item.jinja", escape = "none")]
pub struct EnumItemTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
    pub type_parameters: &'a str,
    pub visibility_modifier: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant_list.jinja", escape = "none")]
pub struct EnumVariantListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_variant.jinja", escape = "none")]
pub struct EnumVariantTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
    pub value: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_block_ending.jinja", escape = "none")]
pub struct ExpressionStatementBlockEndingTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_with_semi.jinja", escape = "none")]
pub struct ExpressionStatementWithSemiTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extern_crate_declaration.jinja", escape = "none")]
pub struct ExternCrateDeclarationTemplate<'a> {
    pub alias: &'a str,
    pub crate_: &'a str,
    pub name: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "extern_modifier.jinja", escape = "none")]
pub struct ExternModifierTemplate<'a> {
    pub string_literal: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration_list.jinja", escape = "none")]
pub struct FieldDeclarationListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_declaration.jinja", escape = "none")]
pub struct FieldDeclarationTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "field_expression.jinja", escape = "none")]
pub struct FieldExpressionTemplate<'a> {
    pub field: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer_list.jinja", escape = "none")]
pub struct FieldInitializerListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_initializer.jinja", escape = "none")]
pub struct FieldInitializerTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub field: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "field_pattern_shorthand.jinja", escape = "none")]
pub struct FieldPatternShorthandTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "field_pattern.jinja", escape = "none")]
pub struct FieldPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub mutable_specifier: &'a str,
    pub ref_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_expression.jinja", escape = "none")]
pub struct ForExpressionTemplate<'a> {
    pub body: &'a str,
    pub label: &'a str,
    pub pattern: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_lifetimes.jinja", escape = "none")]
pub struct ForLifetimesTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item_body.jinja", escape = "none")]
pub struct ForeignModItemBodyTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "foreign_mod_item.jinja", escape = "none")]
pub struct ForeignModItemTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub extern_modifier: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_item.jinja", escape = "none")]
pub struct FunctionItemTemplate<'a> {
    pub body: &'a str,
    pub function_modifiers: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
    pub visibility_modifier: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_modifiers.jinja", escape = "none")]
pub struct FunctionModifiersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub modifier: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_signature_item.jinja", escape = "none")]
pub struct FunctionSignatureItemTemplate<'a> {
    pub function_modifiers: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
    pub visibility_modifier: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub for_lifetimes: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "gen_block.jinja", escape = "none")]
pub struct GenBlockTemplate<'a> {
    pub block: &'a str,
    pub move_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_function.jinja", escape = "none")]
pub struct GenericFunctionTemplate<'a> {
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_pattern.jinja", escape = "none")]
pub struct GenericPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_type_with_turbofish.jinja", escape = "none")]
pub struct GenericTypeWithTurbofishTemplate<'a> {
    pub turbofish: &'a str,
    pub r#type: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub r#type: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "higher_ranked_trait_bound.jinja", escape = "none")]
pub struct HigherRankedTraitBoundTemplate<'a> {
    pub r#type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "if_expression.jinja", escape = "none")]
pub struct IfExpressionTemplate<'a> {
    pub alternative: &'a str,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "impl_item_body.jinja", escape = "none")]
pub struct ImplItemBodyTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "impl_item.jinja", escape = "none")]
pub struct ImplItemTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub negative: &'a str,
    pub r#trait: &'a str,
    pub r#type: &'a str,
    pub type_parameters: &'a str,
    pub unsafe_marker: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "index_expression.jinja", escape = "none")]
pub struct IndexExpressionTemplate<'a> {
    pub index: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "inner_attribute_item.jinja", escape = "none")]
pub struct InnerAttributeItemTemplate<'a> {
    pub attribute: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "label.jinja", escape = "none")]
pub struct LabelTemplate<'a> {
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "last_match_arm.jinja", escape = "none")]
pub struct LastMatchArmTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub pattern: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "let_condition.jinja", escape = "none")]
pub struct LetConditionTemplate<'a> {
    pub pattern: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "let_declaration.jinja", escape = "none")]
pub struct LetDeclarationTemplate<'a> {
    pub alternative: &'a str,
    pub mutable_specifier: &'a str,
    pub pattern: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lifetime_parameter.jinja", escape = "none")]
pub struct LifetimeParameterTemplate<'a> {
    pub bounds: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lifetime.jinja", escape = "none")]
pub struct LifetimeTemplate<'a> {
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "line_comment.jinja", escape = "none")]
pub struct LineCommentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "loop_expression.jinja", escape = "none")]
pub struct LoopExpressionTemplate<'a> {
    pub body: &'a str,
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_brace.jinja", escape = "none")]
pub struct MacroDefinitionBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_bracket.jinja", escape = "none")]
pub struct MacroDefinitionBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition_paren.jinja", escape = "none")]
pub struct MacroDefinitionParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "macro_definition.jinja", escape = "none")]
pub struct MacroDefinitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "macro_invocation.jinja", escape = "none")]
pub struct MacroInvocationTemplate<'a> {
    pub r#macro: &'a str,
    pub token_tree: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "macro_rule.jinja", escape = "none")]
pub struct MacroRuleTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "match_arm_block_ending.jinja", escape = "none")]
pub struct MatchArmBlockEndingTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "match_arm.jinja", escape = "none")]
pub struct MatchArmTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_expression.jinja", escape = "none")]
pub struct MatchExpressionTemplate<'a> {
    pub body: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "match_pattern.jinja", escape = "none")]
pub struct MatchPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "mod_item_inline.jinja", escape = "none")]
pub struct ModItemInlineTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "mod_item.jinja", escape = "none")]
pub struct ModItemTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "mut_pattern.jinja", escape = "none")]
pub struct MutPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub mutable_specifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "negative_literal.jinja", escape = "none")]
pub struct NegativeLiteralTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "or_pattern.jinja", escape = "none")]
pub struct OrPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ordered_field_declaration_list.jinja", escape = "none")]
pub struct OrderedFieldDeclarationListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parameter.jinja", escape = "none")]
pub struct ParameterTemplate<'a> {
    pub mutable_specifier: &'a str,
    pub pattern: &'a str,
    pub r#type: &'a str,
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
#[template(path = "pointer_type_mut.jinja", escape = "none")]
pub struct PointerTypeMutTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pointer_type.jinja", escape = "none")]
pub struct PointerTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "qualified_type.jinja", escape = "none")]
pub struct QualifiedTypeTemplate<'a> {
    pub alias: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "range_expression_bare.jinja", escape = "none")]
pub struct RangeExpressionBareTemplate<'a> {
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "range_expression.jinja", escape = "none")]
pub struct RangeExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "range_pattern.jinja", escape = "none")]
pub struct RangePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "raw_string_literal.jinja", escape = "none")]
pub struct RawStringLiteralTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "ref_pattern.jinja", escape = "none")]
pub struct RefPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "reference_expression.jinja", escape = "none")]
pub struct ReferenceExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "reference_pattern.jinja", escape = "none")]
pub struct ReferencePatternTemplate<'a> {
    pub mutable_specifier: &'a str,
    pub pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "reference_type.jinja", escape = "none")]
pub struct ReferenceTypeTemplate<'a> {
    pub lifetime: &'a str,
    pub mutable_specifier: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "removed_trait_bound.jinja", escape = "none")]
pub struct RemovedTraitBoundTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_expression.jinja", escape = "none")]
pub struct ReturnExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "scoped_identifier.jinja", escape = "none")]
pub struct ScopedIdentifierTemplate<'a> {
    pub name: &'a str,
    pub path: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier_in_expression_position.jinja", escape = "none")]
pub struct ScopedTypeIdentifierInExpressionPositionTemplate<'a> {
    pub name: &'a str,
    pub path: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "scoped_type_identifier.jinja", escape = "none")]
pub struct ScopedTypeIdentifierTemplate<'a> {
    pub name: &'a str,
    pub path: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "scoped_use_list.jinja", escape = "none")]
pub struct ScopedUseListTemplate<'a> {
    pub list: &'a str,
    pub path: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "self_parameter.jinja", escape = "none")]
pub struct SelfParameterTemplate<'a> {
    pub lifetime: &'a str,
    pub mutable_specifier: &'a str,
    pub reference: &'a str,
    pub self_: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "shorthand_field_initializer.jinja", escape = "none")]
pub struct ShorthandFieldInitializerTemplate<'a> {
    pub attributes: ::sittir_core::filters::FieldView<'a>,
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "slice_pattern.jinja", escape = "none")]
pub struct SlicePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "source_file.jinja", escape = "none")]
pub struct SourceFileTemplate<'a> {
    pub shebang: &'a str,
    pub statements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "static_item.jinja", escape = "none")]
pub struct StaticItemTemplate<'a> {
    pub mutable_specifier: &'a str,
    pub name: &'a str,
    pub ref_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "string_literal.jinja", escape = "none")]
pub struct StringLiteralTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "struct_expression.jinja", escape = "none")]
pub struct StructExpressionTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "struct_item.jinja", escape = "none")]
pub struct StructItemTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "struct_pattern.jinja", escape = "none")]
pub struct StructPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "token_binding_pattern.jinja", escape = "none")]
pub struct TokenBindingPatternTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition_pattern.jinja", escape = "none")]
pub struct TokenRepetitionPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_repetition.jinja", escape = "none")]
pub struct TokenRepetitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_brace.jinja", escape = "none")]
pub struct TokenTreeBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_bracket.jinja", escape = "none")]
pub struct TokenTreeBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_paren.jinja", escape = "none")]
pub struct TokenTreeParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_brace.jinja", escape = "none")]
pub struct TokenTreePatternBraceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_bracket.jinja", escape = "none")]
pub struct TokenTreePatternBracketTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern_paren.jinja", escape = "none")]
pub struct TokenTreePatternParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree_pattern.jinja", escape = "none")]
pub struct TokenTreePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "token_tree.jinja", escape = "none")]
pub struct TokenTreeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "trait_bounds.jinja", escape = "none")]
pub struct TraitBoundsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "trait_item.jinja", escape = "none")]
pub struct TraitItemTemplate<'a> {
    pub body: &'a str,
    pub bounds: &'a str,
    pub name: &'a str,
    pub type_parameters: &'a str,
    pub unsafe_marker: &'a str,
    pub visibility_modifier: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "try_block.jinja", escape = "none")]
pub struct TryBlockTemplate<'a> {
    pub block: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "try_expression.jinja", escape = "none")]
pub struct TryExpressionTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_expression.jinja", escape = "none")]
pub struct TupleExpressionTemplate<'a> {
    pub attributes: ::sittir_core::filters::FieldView<'a>,
    pub elements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_struct_pattern.jinja", escape = "none")]
pub struct TupleStructPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_binding.jinja", escape = "none")]
pub struct TypeBindingTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_cast_expression.jinja", escape = "none")]
pub struct TypeCastExpressionTemplate<'a> {
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_item.jinja", escape = "none")]
pub struct TypeItemTemplate<'a> {
    pub name: &'a str,
    pub trailing_where_clause: &'a str,
    pub r#type: &'a str,
    pub type_parameters: &'a str,
    pub visibility_modifier: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub bounds: &'a str,
    pub default_type: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub operand: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "union_item.jinja", escape = "none")]
pub struct UnionItemTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
    pub type_parameters: &'a str,
    pub visibility_modifier: &'a str,
    pub where_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "unsafe_block.jinja", escape = "none")]
pub struct UnsafeBlockTemplate<'a> {
    pub block: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "use_as_clause.jinja", escape = "none")]
pub struct UseAsClauseTemplate<'a> {
    pub alias: &'a str,
    pub path: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "use_bounds.jinja", escape = "none")]
pub struct UseBoundsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_declaration.jinja", escape = "none")]
pub struct UseDeclarationTemplate<'a> {
    pub argument: &'a str,
    pub visibility_modifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "use_list.jinja", escape = "none")]
pub struct UseListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "use_wildcard.jinja", escape = "none")]
pub struct UseWildcardTemplate<'a> {
    pub path: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "variadic_parameter.jinja", escape = "none")]
pub struct VariadicParameterTemplate<'a> {
    pub mutable_specifier: &'a str,
    pub pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier_crate.jinja", escape = "none")]
pub struct VisibilityModifierCrateTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "visibility_modifier.jinja", escape = "none")]
pub struct VisibilityModifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "where_clause.jinja", escape = "none")]
pub struct WhereClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "where_predicate.jinja", escape = "none")]
pub struct WherePredicateTemplate<'a> {
    pub bounds: &'a str,
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "while_expression.jinja", escape = "none")]
pub struct WhileExpressionTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate<'a> {
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

fn render_hidden_array_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements"])?;
    let field_0 = resolve_field(node, "attributes", false)?;
    let field_1 = resolve_field(node, "elements", false)?;
    let template = ArrayExpressionListTemplate {
        children: children.as_list_view(),
        attributes: field_0.as_field_view(),
        elements: field_1.as_field_view(),
    };
    template.render()
}

fn render_hidden_array_expression_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements", "length"])?;
    let field_0 = resolve_field(node, "attributes", false)?;
    let field_1 = resolve_field(node, "elements", true)?;
    let field_2 = resolve_field(node, "length", true)?;
    let template = ArrayExpressionSemiTemplate {
        attributes: field_0.as_field_view(),
        elements: field_1.as_scalar(),
        length: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_closure_expression_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "return_type"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let template = ClosureExpressionBlockTemplate {
        body: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_closure_expression_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ClosureExpressionExprTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_delim_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _DelimTokenTreeBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_delim_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _DelimTokenTreeBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_delim_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _DelimTokenTreeParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_expression_statement_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ExpressionStatementBlockEndingTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_expression_statement_with_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ExpressionStatementWithSemiTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_field_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FieldIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_field_pattern_named(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "pattern"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = FieldPatternNamedTemplate {
        name: field_0.as_scalar(),
        pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_field_pattern_shorthand(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = _FieldPatternShorthandTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_foreign_mod_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ForeignModItemBodyTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_function_type_fn_form(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FunctionTypeFnFormTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_function_type_trait_form(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait"])?;
    let field_0 = resolve_field(node, "trait", true)?;
    let template = FunctionTypeTraitFormTemplate {
        r#trait: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_impl_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ImplItemBodyTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_let_chain(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LetChainTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_line_comment_doc(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["doc", "inner", "outer"])?;
    let field_0 = resolve_field(node, "doc", true)?;
    let field_1 = resolve_field(node, "inner", false)?;
    let field_2 = resolve_field(node, "outer", false)?;
    let template = LineCommentDocTemplate {
        doc: field_0.as_scalar(),
        inner: field_1.as_scalar(),
        outer: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_macro_definition_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _MacroDefinitionBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_macro_definition_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _MacroDefinitionBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_macro_definition_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _MacroDefinitionParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_match_arm_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = _MatchArmBlockEndingTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_match_arm_with_comma(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = MatchArmWithCommaTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_mod_item_inline(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = _ModItemInlineTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_or_pattern_binary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = OrPatternBinaryTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_or_pattern_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = OrPatternPrefixTemplate {
        right: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_pointer_type_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _PointerTypeMutTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_range_expression_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator"])?;
    let field_0 = resolve_field(node, "operator", true)?;
    let template = _RangeExpressionBareTemplate {
        operator: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_range_expression_binary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["end", "operator", "start"])?;
    let field_0 = resolve_field(node, "end", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "start", true)?;
    let template = RangeExpressionBinaryTemplate {
        end: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        start: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_range_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator", "start"])?;
    let field_0 = resolve_field(node, "operator", true)?;
    let field_1 = resolve_field(node, "start", true)?;
    let template = RangeExpressionPostfixTemplate {
        operator: field_0.as_scalar(),
        start: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_range_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["end", "operator"])?;
    let field_0 = resolve_field(node, "end", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = RangeExpressionPrefixTemplate {
        end: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_range_pattern_left_with_right(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = RangePatternLeftWithRightTemplate {
        right: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_range_pattern_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = RangePatternPrefixTemplate {
        right: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_reference_expression_raw_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ReferenceExpressionRawMutTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_reserved_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ReservedIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_shorthand_field_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ShorthandFieldIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _StringContentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_struct_item_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = StructItemBraceTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_struct_item_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = StructItemTupleTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _TokenTreeBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _TokenTreeBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _TokenTreeParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_token_tree_pattern_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _TokenTreePatternBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_token_tree_pattern_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _TokenTreePatternBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_token_tree_pattern_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _TokenTreePatternParenTemplate {
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

fn render_hidden_visibility_modifier_crate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _VisibilityModifierCrateTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_visibility_modifier_in_path(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["in"])?;
    let field_0 = resolve_field(node, "in", true)?;
    let template = VisibilityModifierInPathTemplate {
        children: children.as_list_view(),
        r#in: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_visibility_modifier_pub(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pub"])?;
    let field_0 = resolve_field(node, "pub", true)?;
    let template = VisibilityModifierPubTemplate {
        children: children.as_list_view(),
        r#pub: field_0.as_scalar(),
    };
    template.render()
}

fn render_abstract_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait", "type_parameters"])?;
    let field_0 = resolve_field(node, "trait", true)?;
    let field_1 = resolve_field(node, "type_parameters", false)?;
    let template = AbstractTypeTemplate {
        r#trait: field_0.as_scalar(),
        type_parameters: field_1.as_scalar(),
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

fn render_array_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArrayExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_array_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["element", "length"])?;
    let field_0 = resolve_field(node, "element", true)?;
    let field_1 = resolve_field(node, "length", false)?;
    let template = ArrayTypeTemplate {
        element: field_0.as_scalar(),
        length: field_1.as_scalar(),
    };
    template.render()
}

fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = AssignmentExpressionTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_associated_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "name", "type_parameters", "where_clause"])?;
    let field_0 = resolve_field(node, "bounds", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "where_clause", false)?;
    let template = AssociatedTypeTemplate {
        bounds: field_0.as_scalar(),
        name: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
        where_clause: field_3.as_scalar(),
    };
    template.render()
}

fn render_async_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block", "move_marker"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let field_1 = resolve_field(node, "move_marker", false)?;
    let template = AsyncBlockTemplate {
        block: field_0.as_scalar(),
        move_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_attribute_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let template = AttributeItemTemplate {
        attribute: field_0.as_scalar(),
    };
    template.render()
}

fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "value"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "value", false)?;
    let template = AttributeTemplate {
        children: children.as_list_view(),
        arguments: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AwaitExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_base_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = BaseFieldInitializerTemplate {
        children: children.as_list_view(),
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

fn render_block_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["doc", "inner", "outer"])?;
    let field_0 = resolve_field(node, "doc", false)?;
    let field_1 = resolve_field(node, "inner", false)?;
    let field_2 = resolve_field(node, "outer", false)?;
    let template = BlockCommentTemplate {
        doc: field_0.as_scalar(),
        inner: field_1.as_scalar(),
        outer: field_2.as_scalar(),
    };
    template.render()
}

fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let template = BlockTemplate {
        children: children.as_list_view(),
        label: field_0.as_scalar(),
    };
    template.render()
}

fn render_bounded_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = BoundedTypeTemplate {
        children: children.as_list_view(),
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_bracketed_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = BracketedTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_break_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let template = BreakExpressionTemplate {
        children: children.as_list_view(),
        label: field_0.as_scalar(),
    };
    template.render()
}

fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallExpressionTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_captured_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = CapturedPatternTemplate {
        children: children.as_list_view(),
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_closure_expression_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ClosureExpressionExprTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_closure_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "move_marker", "parameters", "static_marker"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "move_marker", false)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "static_marker", false)?;
    let template = ClosureExpressionTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        move_marker: field_1.as_scalar(),
        parameters: field_2.as_scalar(),
        static_marker: field_3.as_scalar(),
    };
    template.render()
}

fn render_closure_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClosureParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = CommentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_compound_assignment_expr(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = CompoundAssignmentExprTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_const_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ConstBlockTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_const_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let template = ConstItemTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        value: field_2.as_scalar(),
        visibility_modifier: field_3.as_scalar(),
    };
    template.render()
}

fn render_const_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = ConstParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_continue_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let template = ContinueExpressionTemplate {
        label: field_0.as_scalar(),
    };
    template.render()
}

fn render_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DeclarationListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_delim_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DelimTokenTreeBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_delim_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DelimTokenTreeBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_delim_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DelimTokenTreeParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_delim_token_tree(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DelimTokenTreeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dynamic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["trait"])?;
    let field_0 = resolve_field(node, "trait", true)?;
    let template = DynamicTypeTemplate {
        r#trait: field_0.as_scalar(),
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ElseClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_enum_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let field_4 = resolve_field(node, "where_clause", false)?;
    let template = EnumItemTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
        visibility_modifier: field_3.as_scalar(),
        where_clause: field_4.as_scalar(),
    };
    template.render()
}

fn render_enum_variant_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = EnumVariantListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_enum_variant(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let template = EnumVariantTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
        value: field_2.as_scalar(),
        visibility_modifier: field_3.as_scalar(),
    };
    template.render()
}

fn render_expression_statement_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionStatementBlockEndingTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement_with_semi(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionStatementWithSemiTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_extern_crate_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "crate", "name", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "crate", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let template = ExternCrateDeclarationTemplate {
        alias: field_0.as_scalar(),
        crate_: field_1.as_scalar(),
        name: field_2.as_scalar(),
        visibility_modifier: field_3.as_scalar(),
    };
    template.render()
}

fn render_extern_modifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["string_literal"])?;
    let field_0 = resolve_field(node, "string_literal", false)?;
    let template = ExternModifierTemplate {
        string_literal: field_0.as_scalar(),
    };
    template.render()
}

fn render_field_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FieldDeclarationListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_field_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "visibility_modifier", false)?;
    let template = FieldDeclarationTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        visibility_modifier: field_2.as_scalar(),
    };
    template.render()
}

fn render_field_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["field", "value"])?;
    let field_0 = resolve_field(node, "field", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = FieldExpressionTemplate {
        field: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_field_initializer_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FieldInitializerListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["field", "value"])?;
    let field_0 = resolve_field(node, "field", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = FieldInitializerTemplate {
        children: children.as_list_view(),
        field: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_field_pattern_shorthand(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = FieldPatternShorthandTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_field_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "ref_marker"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "ref_marker", false)?;
    let template = FieldPatternTemplate {
        children: children.as_list_view(),
        mutable_specifier: field_0.as_scalar(),
        ref_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_for_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label", "pattern", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", false)?;
    let field_2 = resolve_field(node, "pattern", true)?;
    let field_3 = resolve_field(node, "value", true)?;
    let template = ForExpressionTemplate {
        body: field_0.as_scalar(),
        label: field_1.as_scalar(),
        pattern: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_for_lifetimes(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ForLifetimesTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_foreign_mod_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ForeignModItemBodyTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_foreign_mod_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["extern_modifier", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "extern_modifier", true)?;
    let field_1 = resolve_field(node, "visibility_modifier", false)?;
    let template = ForeignModItemTemplate {
        children: children.as_list_view(),
        extern_modifier: field_0.as_scalar(),
        visibility_modifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_function_item(node: &NodeData) -> Result<String, ::askama::Error> {
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
        body: field_0.as_scalar(),
        function_modifiers: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
        visibility_modifier: field_6.as_scalar(),
        where_clause: field_7.as_scalar(),
    };
    template.render()
}

fn render_function_modifiers(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["modifier"])?;
    let field_0 = resolve_field(node, "modifier", true)?;
    let template = FunctionModifiersTemplate {
        children: children.as_list_view(),
        modifier: field_0.as_field_view(),
    };
    template.render()
}

fn render_function_signature_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function_modifiers", "name", "parameters", "return_type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "function_modifiers", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "return_type", false)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let field_5 = resolve_field(node, "visibility_modifier", false)?;
    let field_6 = resolve_field(node, "where_clause", false)?;
    let template = FunctionSignatureItemTemplate {
        function_modifiers: field_0.as_scalar(),
        name: field_1.as_scalar(),
        parameters: field_2.as_scalar(),
        return_type: field_3.as_scalar(),
        type_parameters: field_4.as_scalar(),
        visibility_modifier: field_5.as_scalar(),
        where_clause: field_6.as_scalar(),
    };
    template.render()
}

fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["for_lifetimes", "parameters", "return_type"])?;
    let field_0 = resolve_field(node, "for_lifetimes", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "return_type", false)?;
    let template = FunctionTypeTemplate {
        children: children.as_list_view(),
        for_lifetimes: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
        return_type: field_2.as_scalar(),
    };
    template.render()
}

fn render_gen_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block", "move_marker"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let field_1 = resolve_field(node, "move_marker", false)?;
    let template = GenBlockTemplate {
        block: field_0.as_scalar(),
        move_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_generic_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericFunctionTemplate {
        function: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_generic_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments"])?;
    let field_0 = resolve_field(node, "type_arguments", true)?;
    let template = GenericPatternTemplate {
        children: children.as_list_view(),
        type_arguments: field_0.as_scalar(),
    };
    template.render()
}

fn render_generic_type_with_turbofish(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["turbofish", "type", "type_arguments"])?;
    let field_0 = resolve_field(node, "turbofish", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeWithTurbofishTemplate {
        turbofish: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_arguments"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeTemplate {
        r#type: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_higher_ranked_trait_bound(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_parameters"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_1 = resolve_field(node, "type_parameters", true)?;
    let template = HigherRankedTraitBoundTemplate {
        r#type: field_0.as_scalar(),
        type_parameters: field_1.as_scalar(),
    };
    template.render()
}

fn render_if_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfExpressionTemplate {
        alternative: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_impl_item_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ImplItemBodyTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_impl_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["negative", "trait", "type", "type_parameters", "unsafe_marker", "where_clause"])?;
    let field_0 = resolve_field(node, "negative", false)?;
    let field_1 = resolve_field(node, "trait", false)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let field_4 = resolve_field(node, "unsafe_marker", false)?;
    let field_5 = resolve_field(node, "where_clause", false)?;
    let template = ImplItemTemplate {
        children: children.as_list_view(),
        negative: field_0.as_scalar(),
        r#trait: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
        unsafe_marker: field_4.as_scalar(),
        where_clause: field_5.as_scalar(),
    };
    template.render()
}

fn render_index_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = IndexExpressionTemplate {
        index: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_inner_attribute_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let template = InnerAttributeItemTemplate {
        attribute: field_0.as_scalar(),
    };
    template.render()
}

fn render_label(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = LabelTemplate {
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_last_match_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern", "value"])?;
    let field_0 = resolve_field(node, "pattern", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = LastMatchArmTemplate {
        children: children.as_list_view(),
        pattern: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_let_condition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern", "value"])?;
    let field_0 = resolve_field(node, "pattern", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = LetConditionTemplate {
        pattern: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_let_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "mutable_specifier", "pattern", "type", "value"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "mutable_specifier", false)?;
    let field_2 = resolve_field(node, "pattern", true)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = LetDeclarationTemplate {
        alternative: field_0.as_scalar(),
        mutable_specifier: field_1.as_scalar(),
        pattern: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_lifetime_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "name"])?;
    let field_0 = resolve_field(node, "bounds", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = LifetimeParameterTemplate {
        bounds: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_lifetime(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = LifetimeTemplate {
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_line_comment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LineCommentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_loop_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", false)?;
    let template = LoopExpressionTemplate {
        body: field_0.as_scalar(),
        label: field_1.as_scalar(),
    };
    template.render()
}

fn render_macro_definition_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = MacroDefinitionBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_macro_definition_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = MacroDefinitionBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_macro_definition_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = MacroDefinitionParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_macro_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = MacroDefinitionTemplate {
        children: children.as_list_view(),
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_macro_invocation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["macro", "token_tree"])?;
    let field_0 = resolve_field(node, "macro", true)?;
    let field_1 = resolve_field(node, "token_tree", true)?;
    let template = MacroInvocationTemplate {
        r#macro: field_0.as_scalar(),
        token_tree: field_1.as_scalar(),
    };
    template.render()
}

fn render_macro_rule(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = MacroRuleTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_match_arm_block_ending(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = MatchArmBlockEndingTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_match_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["pattern"])?;
    let field_0 = resolve_field(node, "pattern", true)?;
    let template = MatchArmTemplate {
        children: children.as_list_view(),
        pattern: field_0.as_scalar(),
    };
    template.render()
}

fn render_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = MatchBlockTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_match_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = MatchExpressionTemplate {
        body: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_match_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition"])?;
    let field_0 = resolve_field(node, "condition", false)?;
    let template = MatchPatternTemplate {
        children: children.as_list_view(),
        condition: field_0.as_scalar(),
    };
    template.render()
}

fn render_mod_item_inline(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ModItemInlineTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_mod_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "visibility_modifier", false)?;
    let template = ModItemTemplate {
        children: children.as_list_view(),
        name: field_0.as_scalar(),
        visibility_modifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_mut_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier"])?;
    let field_0 = resolve_field(node, "mutable_specifier", true)?;
    let template = MutPatternTemplate {
        children: children.as_list_view(),
        mutable_specifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_negative_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = NegativeLiteralTemplate {
        children: children.as_list_view(),
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_or_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = OrPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_ordered_field_declaration_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let template = OrderedFieldDeclarationListTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_field_view(),
    };
    template.render()
}

fn render_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern", "type"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = ParameterTemplate {
        mutable_specifier: field_0.as_scalar(),
        pattern: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
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

fn render_pointer_type_mut(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PointerTypeMutTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_pointer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = PointerTypeTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_qualified_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "type"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = QualifiedTypeTemplate {
        alias: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_range_expression_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operator"])?;
    let field_0 = resolve_field(node, "operator", true)?;
    let template = RangeExpressionBareTemplate {
        operator: field_0.as_scalar(),
    };
    template.render()
}

fn render_range_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = RangeExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_range_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let template = RangePatternTemplate {
        children: children.as_list_view(),
        left: field_0.as_scalar(),
    };
    template.render()
}

fn render_raw_string_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = RawStringLiteralTemplate {
        text: text.as_str(),
    };
    template.render()
}

fn render_ref_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = RefPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_reference_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = ReferenceExpressionTemplate {
        children: children.as_list_view(),
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_reference_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = ReferencePatternTemplate {
        mutable_specifier: field_0.as_scalar(),
        pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_reference_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["lifetime", "mutable_specifier", "type"])?;
    let field_0 = resolve_field(node, "lifetime", false)?;
    let field_1 = resolve_field(node, "mutable_specifier", false)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = ReferenceTypeTemplate {
        lifetime: field_0.as_scalar(),
        mutable_specifier: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_removed_trait_bound(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = RemovedTraitBoundTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_return_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ReturnExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_scoped_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedIdentifierTemplate {
        name: field_0.as_scalar(),
        path: field_1.as_scalar(),
    };
    template.render()
}

fn render_scoped_type_identifier_in_expression_position(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedTypeIdentifierInExpressionPositionTemplate {
        name: field_0.as_scalar(),
        path: field_1.as_scalar(),
    };
    template.render()
}

fn render_scoped_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "path"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedTypeIdentifierTemplate {
        name: field_0.as_scalar(),
        path: field_1.as_scalar(),
    };
    template.render()
}

fn render_scoped_use_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["list", "path"])?;
    let field_0 = resolve_field(node, "list", true)?;
    let field_1 = resolve_field(node, "path", false)?;
    let template = ScopedUseListTemplate {
        list: field_0.as_scalar(),
        path: field_1.as_scalar(),
    };
    template.render()
}

fn render_self_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["lifetime", "mutable_specifier", "reference", "self"])?;
    let field_0 = resolve_field(node, "lifetime", false)?;
    let field_1 = resolve_field(node, "mutable_specifier", false)?;
    let field_2 = resolve_field(node, "reference", false)?;
    let field_3 = resolve_field(node, "self", true)?;
    let template = SelfParameterTemplate {
        lifetime: field_0.as_scalar(),
        mutable_specifier: field_1.as_scalar(),
        reference: field_2.as_scalar(),
        self_: field_3.as_scalar(),
    };
    template.render()
}

fn render_shorthand_field_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "identifier"])?;
    let field_0 = resolve_field(node, "attributes", false)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let template = ShorthandFieldInitializerTemplate {
        attributes: field_0.as_field_view(),
        identifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_slice_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SlicePatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_source_file(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["shebang", "statements"])?;
    let field_0 = resolve_field(node, "shebang", false)?;
    let field_1 = resolve_field(node, "statements", false)?;
    let template = SourceFileTemplate {
        shebang: field_0.as_scalar(),
        statements: field_1.as_field_view(),
    };
    template.render()
}

fn render_static_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "name", "ref_marker", "type", "value", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "ref_marker", false)?;
    let field_3 = resolve_field(node, "type", true)?;
    let field_4 = resolve_field(node, "value", false)?;
    let field_5 = resolve_field(node, "visibility_modifier", false)?;
    let template = StaticItemTemplate {
        mutable_specifier: field_0.as_scalar(),
        name: field_1.as_scalar(),
        ref_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
        visibility_modifier: field_5.as_scalar(),
    };
    template.render()
}

fn render_string_literal(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringLiteralTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_struct_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = StructExpressionTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_struct_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_parameters", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type_parameters", false)?;
    let field_2 = resolve_field(node, "visibility_modifier", false)?;
    let template = StructItemTemplate {
        children: children.as_list_view(),
        name: field_0.as_scalar(),
        type_parameters: field_1.as_scalar(),
        visibility_modifier: field_2.as_scalar(),
    };
    template.render()
}

fn render_struct_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = StructPatternTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_token_binding_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TokenBindingPatternTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_token_repetition_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenRepetitionPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_repetition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenRepetitionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreeBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreeBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreeParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_pattern_brace(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreePatternBraceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_pattern_bracket(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreePatternBracketTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_pattern_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreePatternParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreePatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_token_tree(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TokenTreeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_trait_bounds(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TraitBoundsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_trait_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "bounds", "name", "type_parameters", "unsafe_marker", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "bounds", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let field_4 = resolve_field(node, "unsafe_marker", false)?;
    let field_5 = resolve_field(node, "visibility_modifier", false)?;
    let field_6 = resolve_field(node, "where_clause", false)?;
    let template = TraitItemTemplate {
        body: field_0.as_scalar(),
        bounds: field_1.as_scalar(),
        name: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
        unsafe_marker: field_4.as_scalar(),
        visibility_modifier: field_5.as_scalar(),
        where_clause: field_6.as_scalar(),
    };
    template.render()
}

fn render_try_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = TryBlockTemplate {
        block: field_0.as_scalar(),
    };
    template.render()
}

fn render_try_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = TryExpressionTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_tuple_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attributes", "elements"])?;
    let field_0 = resolve_field(node, "attributes", false)?;
    let field_1 = resolve_field(node, "elements", false)?;
    let template = TupleExpressionTemplate {
        attributes: field_0.as_field_view(),
        elements: field_1.as_field_view(),
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

fn render_tuple_struct_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = TupleStructPatternTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
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

fn render_type_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeArgumentsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_binding(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "type_arguments"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = TypeBindingTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_type_cast_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "value"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = TypeCastExpressionTemplate {
        r#type: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_type_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "trailing_where_clause", "type", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "trailing_where_clause", false)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let field_4 = resolve_field(node, "visibility_modifier", false)?;
    let field_5 = resolve_field(node, "where_clause", false)?;
    let template = TypeItemTemplate {
        name: field_0.as_scalar(),
        trailing_where_clause: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
        visibility_modifier: field_4.as_scalar(),
        where_clause: field_5.as_scalar(),
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "default_type", "name"])?;
    let field_0 = resolve_field(node, "bounds", false)?;
    let field_1 = resolve_field(node, "default_type", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = TypeParameterTemplate {
        bounds: field_0.as_scalar(),
        default_type: field_1.as_scalar(),
        name: field_2.as_scalar(),
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

fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["operand", "operator"])?;
    let field_0 = resolve_field(node, "operand", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryExpressionTemplate {
        operand: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_union_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "type_parameters", "visibility_modifier", "where_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "visibility_modifier", false)?;
    let field_4 = resolve_field(node, "where_clause", false)?;
    let template = UnionItemTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
        visibility_modifier: field_3.as_scalar(),
        where_clause: field_4.as_scalar(),
    };
    template.render()
}

fn render_unsafe_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = UnsafeBlockTemplate {
        block: field_0.as_scalar(),
    };
    template.render()
}

fn render_use_as_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "path"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "path", true)?;
    let template = UseAsClauseTemplate {
        alias: field_0.as_scalar(),
        path: field_1.as_scalar(),
    };
    template.render()
}

fn render_use_bounds(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = UseBoundsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_use_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "visibility_modifier"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "visibility_modifier", false)?;
    let template = UseDeclarationTemplate {
        argument: field_0.as_scalar(),
        visibility_modifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_use_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = UseListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_use_wildcard(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["path"])?;
    let field_0 = resolve_field(node, "path", false)?;
    let template = UseWildcardTemplate {
        path: field_0.as_scalar(),
    };
    template.render()
}

fn render_variadic_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["mutable_specifier", "pattern"])?;
    let field_0 = resolve_field(node, "mutable_specifier", false)?;
    let field_1 = resolve_field(node, "pattern", false)?;
    let template = VariadicParameterTemplate {
        mutable_specifier: field_0.as_scalar(),
        pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_visibility_modifier_crate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = VisibilityModifierCrateTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_visibility_modifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = VisibilityModifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_where_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WhereClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_where_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["bounds", "left"])?;
    let field_0 = resolve_field(node, "bounds", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let template = WherePredicateTemplate {
        bounds: field_0.as_scalar(),
        left: field_1.as_scalar(),
    };
    template.render()
}

fn render_while_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "label", false)?;
    let template = WhileExpressionTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        label: field_2.as_scalar(),
    };
    template.render()
}

fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = YieldExpressionTemplate {
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
