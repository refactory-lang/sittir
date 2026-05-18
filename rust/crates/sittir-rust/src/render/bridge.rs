// @generated from packages/rust/node-model.json5 and packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// Field and child resolution helpers — ResolvedField, resolve_slot,
// resolve_field, separator_for, variant_for, etc. Used by both
// dispatch and templates modules.

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
use super::templates::*;

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ResolvedFieldKind {
    #[default]
    Missing,
    Scalar,
    List,
}

#[derive(Debug, Default)]
pub(crate) struct ResolvedField {
    pub(crate) kind: ResolvedFieldKind,
    pub(crate) scalar: String,
    pub(crate) items: Vec<String>,
    pub(crate) separator: &'static str,
    pub(crate) leading_sep: bool,
    pub(crate) trailing_sep: bool,
}

impl ResolvedField {
    pub(crate) fn from_scalar(value: String) -> Self {
        Self {
            kind: ResolvedFieldKind::Scalar,
            scalar: value,
            items: Vec::new(),
            separator: "",
            leading_sep: false,
            trailing_sep: false,
        }
    }

    pub(crate) fn from_items(items: Vec<String>, separator: &'static str, leading_sep: bool, trailing_sep: bool) -> Self {
        let mut scalar = String::new();
        if leading_sep && !items.is_empty() {
            scalar.push_str(separator);
        }
        let mut first = true;
        for item in &items {
            if !first {
                scalar.push_str(separator);
            }
            scalar.push_str(item);
            first = false;
        }
        if trailing_sep && !items.is_empty() {
            scalar.push_str(separator);
        }
        Self {
            kind: ResolvedFieldKind::List,
            scalar,
            items,
            separator,
            leading_sep,
            trailing_sep,
        }
    }

    pub(crate) fn as_scalar(&self) -> &str {
        self.scalar.as_str()
    }

    pub(crate) fn renderable_items(&self) -> Vec<::sittir_core::filters::Renderable<'_>> {
        self.items.iter().map(|s| ::sittir_core::filters::Renderable::Text(s.as_str())).collect()
    }
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum SlotAccessor<'a> {
    Field(&'a str),
    Children,
}

pub(crate) fn render_node_value(node: &NodeData) -> Result<String, ::askama::Error> {
    let mut buf = String::new();
    render_nodedata_into(node, &mut buf)?;
    Ok(buf)
}

pub(crate) fn missing_required_field(node: &NodeData, name: &str) -> ::askama::Error {
    ::askama::Error::Custom(
        format!("render_nodedata_into: missing required field '{}' on '{}'", name, node.type_).into(),
    )
}

pub(crate) fn resolve_text(node: &NodeData) -> Result<String, ::askama::Error> {
    if let Some(text) = &node.text {
        return Ok(text.to_owned());
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
                FieldValue::Text(text) => parts.push(text.to_owned()),
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

pub(crate) fn resolve_leaf<'a>(node: &'a NodeData, name: &str) -> Option<&'a str> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        Some(FieldValue::Single(child)) => child.text.as_deref(),
        Some(FieldValue::Text(text)) => Some(text.as_str()),
        _ => None,
    }
}

pub(crate) fn resolve_optional(node: &NodeData, name: &str) -> Result<Option<String>, ::askama::Error> {
    let resolved = resolve_slot(node, SlotAccessor::Field(name), false)?;
    Ok((resolved.kind != ResolvedFieldKind::Missing && !resolved.scalar.is_empty()).then_some(resolved.scalar))
}

pub(crate) fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {
    Ok(resolve_slot(node, SlotAccessor::Field(name), true)?.scalar)
}

pub(crate) fn is_join_flank_token(text: &str) -> bool {
    matches!(text, "," | ";")
}

pub(crate) fn detect_field_trailing_sep(node: &NodeData, field_name: &str) -> bool {
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

pub(crate) fn resolve_slot(
    node: &NodeData,
    accessor: SlotAccessor<'_>,
    required: bool,
) -> Result<ResolvedField, ::askama::Error> {
    match accessor {
        SlotAccessor::Field(name) => match node.fields.as_ref().and_then(|fields| fields.get(name)) {
            None => {
                if required {
                    Err(missing_required_field(node, name))
                } else {
                    Ok(ResolvedField::default())
                }
            }
            Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.to_owned())),
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
                    separator_for(node.type_.0),
                    false,
                    detect_field_trailing_sep(node, name),
                ))
            }
        },
        SlotAccessor::Children => {
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
            child_nodes.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));
            let mut children = Vec::new();
            for (_, _, child) in child_nodes {
                children.push(render_node_value(child)?);
            }
            if children.is_empty() {
                if required {
                    return Err(missing_required_field(node, "children"));
                }
                return Ok(ResolvedField::default());
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
                separator_for(node.type_.0),
                leading_sep,
                trailing_sep,
            ))
        }
    }
}

pub(crate) fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {
    resolve_slot(node, SlotAccessor::Field(name), required)
}

pub(crate) fn separator_for(kind_id: u16) -> &'static str {
    match kind_id {
        322 => ",", // "_array_expression_list"
        333 => ";", // "_macro_definition_brace"
        332 => ";", // "_macro_definition_bracket"
        331 => ";", // "_macro_definition_paren"
        257 => ",", // "arguments"
        282 => ",", // "closure_parameters"
        179 => ",", // "enum_variant_list"
        181 => ",", // "field_declaration_list"
        263 => ",", // "field_initializer_list"
        221 => ",", // "for_lifetimes"
        183 => ",", // "ordered_field_declaration_list"
        210 => ",", // "parameters"
        297 => ",", // "slice_pattern"
        299 => ",", // "struct_pattern"
        196 => "+", // "trait_bounds"
        260 => ",", // "tuple_expression"
        296 => ",", // "tuple_pattern"
        298 => ",", // "tuple_struct_pattern"
        223 => ",", // "tuple_type"
        230 => ",", // "type_arguments"
        199 => ",", // "type_parameters"
        229 => ",", // "use_bounds"
        207 => ",", // "use_list"
        191 => ",", // "where_clause"
        _ => "",
    }
}

pub(crate) fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {
    match (parent_id, child_id) {
        (258, 322) => Some("list"), // ("array_expression", "array_expression_list")
        (258, 321) => Some("semi"), // ("array_expression", "array_expression_semi")
        (281, 323) => Some("block"), // ("closure_expression", "closure_expression_block")
        (281, 324) => Some("expr"), // ("closure_expression", "closure_expression_expr")
        (240, 371) => Some("brace"), // ("delim_token_tree", "delim_token_tree_brace")
        (240, 370) => Some("bracket"), // ("delim_token_tree", "delim_token_tree_bracket")
        (240, 369) => Some("paren"), // ("delim_token_tree", "delim_token_tree_paren")
        (160, 356) => Some("block_ending"), // ("expression_statement", "expression_statement_block_ending")
        (160, 355) => Some("with_semi"), // ("expression_statement", "expression_statement_with_semi")
        (300, 326) => Some("named"), // ("field_pattern", "field_pattern_named")
        (300, 325) => Some("shorthand"), // ("field_pattern", "field_pattern_shorthand")
        (174, 358) => Some("body"), // ("foreign_mod_item", "foreign_mod_item_body")
        (174, 357) => Some("semi"), // ("foreign_mod_item", "foreign_mod_item_semi")
        (193, 329) => Some("body"), // ("impl_item", "impl_item_body")
        (193, 330) => Some("semi"), // ("impl_item", "impl_item_semi")
        (314, 146) => Some("content"), // ("line_comment", "line_comment_content")
        (314, 362) => Some("doc"), // ("line_comment", "line_comment_doc")
        (314, 361) => Some("regular_dslash"), // ("line_comment", "line_comment_regular_dslash")
        (161, 333) => Some("brace"), // ("macro_definition", "macro_definition_brace")
        (161, 332) => Some("bracket"), // ("macro_definition", "macro_definition_bracket")
        (161, 331) => Some("paren"), // ("macro_definition", "macro_definition_paren")
        (274, 360) => Some("block_ending"), // ("match_arm", "match_arm_block_ending")
        (274, 359) => Some("with_comma"), // ("match_arm", "match_arm_with_comma")
        (173, 334) => Some("external"), // ("mod_item", "mod_item_external")
        (173, 335) => Some("inline"), // ("mod_item", "mod_item_inline")
        (307, 336) => Some("binary"), // ("or_pattern", "or_pattern_binary")
        (307, 337) => Some("prefix"), // ("or_pattern", "or_pattern_prefix")
        (233, 351) => Some("const"), // ("pointer_type", "pointer_type_const")
        (233, 352) => Some("mut"), // ("pointer_type", "pointer_type_mut")
        (246, 341) => Some("bare"), // ("range_expression", "range_expression_bare")
        (246, 338) => Some("binary"), // ("range_expression", "range_expression_binary")
        (246, 339) => Some("postfix"), // ("range_expression", "range_expression_postfix")
        (246, 340) => Some("prefix"), // ("range_expression", "range_expression_prefix")
        (303, 344) => Some("left_bare"), // ("range_pattern", "range_pattern_left_bare")
        (303, 343) => Some("left_with_right"), // ("range_pattern", "range_pattern_left_with_right")
        (303, 342) => Some("prefix"), // ("range_pattern", "range_pattern_prefix")
        (176, 345) => Some("brace"), // ("struct_item", "struct_item_brace")
        (176, 346) => Some("tuple"), // ("struct_item", "struct_item_tuple")
        (176, 347) => Some("unit"), // ("struct_item", "struct_item_unit")
        (168, 368) => Some("brace"), // ("token_tree", "token_tree_brace")
        (168, 367) => Some("bracket"), // ("token_tree", "token_tree_bracket")
        (168, 366) => Some("paren"), // ("token_tree", "token_tree_paren")
        (164, 365) => Some("brace"), // ("token_tree_pattern", "token_tree_pattern_brace")
        (164, 364) => Some("bracket"), // ("token_tree_pattern", "token_tree_pattern_bracket")
        (164, 363) => Some("paren"), // ("token_tree_pattern", "token_tree_pattern_paren")
        (215, 348) => Some("crate"), // ("visibility_modifier", "visibility_modifier_crate")
        (215, 350) => Some("in_path"), // ("visibility_modifier", "visibility_modifier_in_path")
        (215, 349) => Some("pub"), // ("visibility_modifier", "visibility_modifier_pub")
        _ => None,
    }
}

pub(crate) fn first_named_child_kind_id(node: &NodeData) -> Option<u16> {
    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.0)
}

pub(crate) fn resolve_variant(node: &NodeData) -> &'static str {
    first_named_child_kind_id(node)
        .and_then(|child_id| variant_for(node.type_.0, child_id))
        .unwrap_or("")
}

pub(crate) fn token_shaped_fallback_into(node: &NodeData, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
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
            return dest.write_str(text).map_err(::askama::Error::from);
        }
        let mut wrote_any = false;
        if let Some(fields) = &node.fields {
            for value in fields.values() {
                match value {
                    FieldValue::Single(item) => {
                        if let Some(text) = &item.text {
                            dest.write_str(text).map_err(::askama::Error::from)?;
                            wrote_any = true;
                        }
                    }
                    FieldValue::Multiple(items) => {
                        for item in items {
                            if let Some(text) = &item.text {
                                dest.write_str(text).map_err(::askama::Error::from)?;
                                wrote_any = true;
                            }
                        }
                    }
                    FieldValue::Text(text) => {
                        dest.write_str(text).map_err(::askama::Error::from)?;
                        wrote_any = true;
                    }
                }
            }
        }
        if let Some(children) = &node.children {
            for child in children {
                if let Some(text) = &child.text {
                    dest.write_str(text).map_err(::askama::Error::from)?;
                    wrote_any = true;
                }
            }
        }
        if wrote_any { return Ok(()); }
    }
    Err(::askama::Error::Custom(
        format!("render_nodedata_into: no template for kind '{}'", node.type_).into(),
    ))
}

pub(crate) fn token_shaped_fallback(node: &NodeData) -> Result<String, ::askama::Error> {
    let mut buf = String::new();
    token_shaped_fallback_into(node, &mut buf)?;
    Ok(buf)
}

/// Legacy direct NodeData render bridge.
///
/// Retained for sittir-core's internal EngineGrammar contract and
/// trivia rendering. Normal native package flow should project to
/// typed transport and call `render_transport_dispatch`.
pub fn render_nodedata_into(node: &NodeData, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return dest.write_str(text).map_err(::askama::Error::from);
        }
    }
    match node.type_.0 {
        322 => { // "_array_expression_list" | "array_expression_list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("elements"), false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ArrayExpressionListTemplate {
                attribute_item: ListNonterminalView {
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
            template.render_into(dest)
        }
        321 => { // "_array_expression_semi" | "array_expression_semi"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("elements"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("length"), true)?;
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
            template.render_into(dest)
        }
        323 => { // "_closure_expression_block" | "closure_expression_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let template = ClosureExpressionBlockTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                return_type: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        324 => { // "_closure_expression_expr" | "closure_expression_expr"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = _ClosureExpressionExprTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        371 => { // "_delim_token_tree_brace" | "delim_token_tree_brace"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _DelimTokenTreeBraceTemplate {
                delim_tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        370 => { // "_delim_token_tree_bracket" | "delim_token_tree_bracket"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _DelimTokenTreeBracketTemplate {
                delim_tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        369 => { // "_delim_token_tree_paren" | "delim_token_tree_paren"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _DelimTokenTreeParenTemplate {
                delim_tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        356 => { // "_expression_statement_block_ending" | "expression_statement_block_ending"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = _ExpressionStatementBlockEndingTemplate {
                expression_ending_with_block: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        355 => { // "_expression_statement_with_semi" | "expression_statement_with_semi"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = _ExpressionStatementWithSemiTemplate {
                expression: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        326 => { // "_field_pattern_named" | "field_pattern_named"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let template = FieldPatternNamedTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        325 => { // "_field_pattern_shorthand" | "field_pattern_shorthand"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = _FieldPatternShorthandTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        358 => { // "_foreign_mod_item_body" | "foreign_mod_item_body"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = _ForeignModItemBodyTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        328 => { // "_function_type_fn_form" | "function_type_fn_form"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let template = FunctionTypeFnFormTemplate {
                function_modifiers: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        327 => { // "_function_type_trait_form" | "function_type_trait_form"
            let field_0 = resolve_slot(node, SlotAccessor::Field("trait"), true)?;
            let template = FunctionTypeTraitFormTemplate {
                trait_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        329 => { // "_impl_item_body" | "impl_item_body"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = _ImplItemBodyTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        269 => { // "_let_chain"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("let_condition"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = LetChainTemplate {
                let_chain: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                let_condition: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        362 => { // "_line_comment_doc" | "line_comment_doc"
            let field_0 = resolve_slot(node, SlotAccessor::Field("doc"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("outer"), false)?;
            let template = LineCommentDocTemplate {
                doc: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                outer: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        333 => { // "_macro_definition_brace" | "macro_definition_brace"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _MacroDefinitionBraceTemplate {
                macro_rule: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        332 => { // "_macro_definition_bracket" | "macro_definition_bracket"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _MacroDefinitionBracketTemplate {
                macro_rule: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        331 => { // "_macro_definition_paren" | "macro_definition_paren"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _MacroDefinitionParenTemplate {
                macro_rule: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        360 => { // "_match_arm_block_ending" | "match_arm_block_ending"
            let field_0 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = _MatchArmBlockEndingTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        359 => { // "_match_arm_with_comma" | "match_arm_with_comma"
            let field_0 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = MatchArmWithCommaTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        335 => { // "_mod_item_inline" | "mod_item_inline"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = _ModItemInlineTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        336 => { // "_or_pattern_binary" | "or_pattern_binary"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = OrPatternBinaryTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        337 => { // "_or_pattern_prefix" | "or_pattern_prefix"
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = OrPatternPrefixTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        352 => { // "_pointer_type_mut" | "pointer_type_mut"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = _PointerTypeMutTemplate {
                mutable_specifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        341 => { // "_range_expression_bare" | "range_expression_bare"
            let field_0 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = _RangeExpressionBareTemplate {
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        338 => { // "_range_expression_binary" | "range_expression_binary"
            let field_0 = resolve_slot(node, SlotAccessor::Field("end"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("start"), true)?;
            let template = RangeExpressionBinaryTemplate {
                end: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                start: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        339 => { // "_range_expression_postfix" | "range_expression_postfix"
            let field_0 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("start"), true)?;
            let template = RangeExpressionPostfixTemplate {
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                start: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        340 => { // "_range_expression_prefix" | "range_expression_prefix"
            let field_0 = resolve_slot(node, SlotAccessor::Field("end"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = RangeExpressionPrefixTemplate {
                end: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        343 => { // "_range_pattern_left_with_right" | "range_pattern_left_with_right"
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = RangePatternLeftWithRightTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        342 => { // "_range_pattern_prefix" | "range_pattern_prefix"
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = RangePatternPrefixTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        354 => { // "_reference_expression_raw_mut" | "reference_expression_raw_mut"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = ReferenceExpressionRawMutTemplate {
                mutable_specifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        345 => { // "_struct_item_brace" | "struct_item_brace"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = StructItemBraceTemplate {
                where_clause: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        346 => { // "_struct_item_tuple" | "struct_item_tuple"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = StructItemTupleTemplate {
                where_clause: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        368 => { // "_token_tree_brace" | "token_tree_brace"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _TokenTreeBraceTemplate {
                tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        367 => { // "_token_tree_bracket" | "token_tree_bracket"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _TokenTreeBracketTemplate {
                tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        366 => { // "_token_tree_paren" | "token_tree_paren"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _TokenTreeParenTemplate {
                tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        365 => { // "_token_tree_pattern_brace" | "token_tree_pattern_brace"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _TokenTreePatternBraceTemplate {
                token_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        364 => { // "_token_tree_pattern_bracket" | "token_tree_pattern_bracket"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _TokenTreePatternBracketTemplate {
                token_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        363 => { // "_token_tree_pattern_paren" | "token_tree_pattern_paren"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = _TokenTreePatternParenTemplate {
                token_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        348 => { // "_visibility_modifier_crate" | "visibility_modifier_crate"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = _VisibilityModifierCrateTemplate {
                crate_: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        350 => { // "_visibility_modifier_in_path" | "visibility_modifier_in_path"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("in"), true)?;
            let template = VisibilityModifierInPathTemplate {
                path: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                in_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        349 => { // "_visibility_modifier_pub" | "visibility_modifier_pub"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("pub"), true)?;
            let template = VisibilityModifierPubTemplate {
                visibility_modifier_pub_parens: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                pub_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        235 => { // "abstract_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("trait"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let template = AbstractTypeTemplate {
                trait_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_parameters: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        257 => { // "arguments"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ArgumentsTemplate {
                attributes: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        258 => { // "array_expression"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = ArrayExpressionTemplate {
                array_expression_list: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                array_expression_semi: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        220 => { // "array_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("element"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("length"), false)?;
            let template = ArrayTypeTemplate {
                element: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                length: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        251 => { // "assignment_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = AssignmentExpressionTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        195 => { // "associated_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("bounds"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
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
            template.render_into(dest)
        }
        290 => { // "async_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("block"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("move_marker"), false)?;
            let template = AsyncBlockTemplate {
                block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                move_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        170 => { // "attribute_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attribute"), true)?;
            let template = AttributeItemTemplate {
                attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        172 => { // "attribute"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("path"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
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
            template.render_into(dest)
        }
        287 => { // "await_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = AwaitExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        266 => { // "base_field_initializer"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = BaseFieldInitializerTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        250 => { // "binary_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = BinaryExpressionTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        318 => { // "block_comment"
            let field_0 = resolve_slot(node, SlotAccessor::Field("doc"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("outer"), false)?;
            let template = BlockCommentTemplate {
                doc: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                outer: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        293 => { // "block"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("trailing_expression"), false)?;
            let children_renderables = children.renderable_items();
            let template = BlockTemplate {
                statement: ListNonterminalView {
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
            template.render_into(dest)
        }
        228 => { // "bounded_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("lifetime"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("use_bounds"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = BoundedTypeTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                lifetime: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                type_: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                use_bounds: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        217 => { // "bracketed_type"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("qualified_type"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = BracketedTypeTemplate {
                type_: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                qualified_type: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        284 => { // "break_expression"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let template = BreakExpressionTemplate {
                expression: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                label: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        256 => { // "call_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let template = CallExpressionTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        305 => { // "captured_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let template = CapturedPatternTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        281 => { // "closure_expression"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("move_marker"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("static_marker"), false)?;
            let variant = resolve_variant(node);
            let template = ClosureExpressionTemplate {
                closure_expression_block: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                closure_expression_expr: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
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
            template.render_into(dest)
        }
        282 => { // "closure_parameters"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ClosureParametersTemplate {
                parameter: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        252 => { // "compound_assignment_expr"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = CompoundAssignmentExprTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        280 => { // "const_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = ConstBlockTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        185 => { // "const_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let template = ConstItemTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                value: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                visibility_modifier: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        200 => { // "const_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let template = ConstParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                value: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        285 => { // "continue_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let template = ContinueExpressionTemplate {
                label: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        175 => { // "declaration_list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = DeclarationListTemplate {
                declaration_statement: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        240 => { // "delim_token_tree"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = DelimTokenTreeTemplate {
                delim_token_tree_brace: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                delim_token_tree_bracket: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                delim_token_tree_paren: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        236 => { // "dynamic_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("trait"), true)?;
            let template = DynamicTypeTemplate {
                trait_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        271 => { // "else_clause"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("if_expression"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ElseClauseTemplate {
                block: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                if_expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        178 => { // "enum_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
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
            template.render_into(dest)
        }
        179 => { // "enum_variant_list"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attribute_item"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("enum_variant"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = EnumVariantListTemplate {
                attribute_item: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                enum_variant: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        180 => { // "enum_variant"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
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
            template.render_into(dest)
        }
        160 => { // "expression_statement"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = ExpressionStatementTemplate {
                expression_statement_block_ending: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                expression_statement_with_semi: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        184 => { // "extern_crate_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("crate"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
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
            template.render_into(dest)
        }
        214 => { // "extern_modifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("string_literal"), false)?;
            let template = ExternModifierTemplate {
                string_literal: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        181 => { // "field_declaration_list"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attribute_item"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("field_declaration"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = FieldDeclarationListTemplate {
                attribute_item: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                field_declaration: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        182 => { // "field_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let template = FieldDeclarationTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                visibility_modifier: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        288 => { // "field_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("field"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = FieldExpressionTemplate {
                field: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        263 => { // "field_initializer_list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = FieldInitializerListTemplate {
                base_field_initializer: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                field_initializer: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                shorthand_field_initializer: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        265 => { // "field_initializer"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("field"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let children_renderables = children.renderable_items();
            let template = FieldInitializerTemplate {
                attribute_item: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                field: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        300 => { // "field_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("ref_marker"), false)?;
            let variant = resolve_variant(node);
            let template = FieldPatternTemplate {
                field_pattern_named: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                field_pattern_shorthand: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                mutable_specifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                ref_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        279 => { // "for_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = ForExpressionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                label: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        221 => { // "for_lifetimes"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = ForLifetimesTemplate {
                lifetime: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        174 => { // "foreign_mod_item"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("extern_modifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let variant = resolve_variant(node);
            let template = ForeignModItemTemplate {
                foreign_mod_item_body: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                extern_modifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                visibility_modifier: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        188 => { // "function_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function_modifiers"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let field_7 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
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
            template.render_into(dest)
        }
        190 => { // "function_modifiers"
            let field_0 = resolve_slot(node, SlotAccessor::Field("extern_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("modifier"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = FunctionModifiersTemplate {
                extern_modifier: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                modifier: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        189 => { // "function_signature_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("function_modifiers"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
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
            template.render_into(dest)
        }
        222 => { // "function_type"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("for_lifetimes"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function_type_fn_form"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = FunctionTypeTemplate {
                function_type_trait_form: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                for_lifetimes: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                function_type_fn_form: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                return_type: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        291 => { // "gen_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("block"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("move_marker"), false)?;
            let template = GenBlockTemplate {
                block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                move_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        225 => { // "generic_function"
            let field_0 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = GenericFunctionTemplate {
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        295 => { // "generic_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("scoped_identifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = GenericPatternTemplate {
                identifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                scoped_identifier: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        227 => { // "generic_type_with_turbofish"
            let field_0 = resolve_slot(node, SlotAccessor::Field("turbofish"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = GenericTypeWithTurbofishTemplate {
                turbofish: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        226 => { // "generic_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = GenericTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        197 => { // "higher_ranked_trait_bound"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_parameters"), true)?;
            let template = HigherRankedTraitBoundTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        267 => { // "if_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
            let template = IfExpressionTemplate {
                alternative: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        193 => { // "impl_item"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("negative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("trait"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("unsafe_marker"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
            let variant = resolve_variant(node);
            let template = ImplItemTemplate {
                impl_item_body: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                negative: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                trait_: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
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
            template.render_into(dest)
        }
        286 => { // "index_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("index"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let template = IndexExpressionTemplate {
                index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        171 => { // "inner_attribute_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attribute"), true)?;
            let template = InnerAttributeItemTemplate {
                attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        283 => { // "label"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let template = LabelTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        275 => { // "last_match_arm"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let children_renderables = children.renderable_items();
            let template = LastMatchArmTemplate {
                attribute_item: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                inner_attribute_item: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        268 => { // "let_condition"
            let field_0 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = LetConditionTemplate {
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        203 => { // "let_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
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
                type_: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
                value: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        202 => { // "lifetime_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("bounds"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = LifetimeParameterTemplate {
                bounds: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        219 => { // "lifetime"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let template = LifetimeTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        314 => { // "line_comment"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = LineCommentTemplate {
                line_comment_content: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                line_comment_doc: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                line_comment_regular_dslash: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        278 => { // "loop_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let template = LoopExpressionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                label: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        161 => { // "macro_definition"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let variant = resolve_variant(node);
            let template = MacroDefinitionTemplate {
                macro_definition_brace: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                macro_definition_bracket: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                macro_definition_paren: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        239 => { // "macro_invocation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("macro"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("token_tree"), true)?;
            let template = MacroInvocationTemplate {
                macro_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                token_tree: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        162 => { // "macro_rule"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = MacroRuleTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        274 => { // "match_arm"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let template = MatchArmTemplate {
                match_arm_block_ending: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                match_arm_with_comma: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                attributes: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        273 => { // "match_block"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = MatchBlockTemplate {
                match_arm: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        272 => { // "match_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = MatchExpressionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        276 => { // "match_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("condition"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let template = MatchPatternTemplate {
                condition: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        173 => { // "mod_item"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let variant = resolve_variant(node);
            let template = ModItemTemplate {
                mod_item_inline: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                visibility_modifier: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        302 => { // "mut_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let template = MutPatternTemplate {
                mutable_specifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        310 => { // "negative_literal"
            let field_0 = resolve_slot(node, SlotAccessor::Field("float_literal"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("integer_literal"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = NegativeLiteralTemplate {
                float_literal: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                integer_literal: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        307 => { // "or_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = OrPatternTemplate {
                or_pattern_binary: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                or_pattern_prefix: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        183 => { // "ordered_field_declaration_list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = OrderedFieldDeclarationListTemplate {
                attribute_item: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                visibility_modifier: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                type_: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        213 => { // "parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = ParameterTemplate {
                mutable_specifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        210 => { // "parameters"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attribute_item"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parameter"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("self_parameter"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("variadic_parameter"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = ParametersTemplate {
                attribute_item: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                parameter: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                self_parameter: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                type_: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                variadic_parameter: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        259 => { // "parenthesized_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = ParenthesizedExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        233 => { // "pointer_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let template = PointerTypeTemplate {
                variant,
                mutable_specifier: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        218 => { // "qualified_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = QualifiedTypeTemplate {
                alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        246 => { // "range_expression"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let variant = resolve_variant(node);
            let template = RangeExpressionTemplate {
                range_expression_binary: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                range_expression_postfix: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                range_expression_prefix: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        303 => { // "range_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let variant = resolve_variant(node);
            let template = RangePatternTemplate {
                range_pattern_left_with_right: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                range_pattern_prefix: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        312 => { // "raw_string_literal"
            let field_0 = resolve_slot(node, SlotAccessor::Field("string_content"), true)?;
            let template = RawStringLiteralTemplate {
                string_content: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        304 => { // "ref_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let template = RefPatternTemplate {
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        249 => { // "reference_expression"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("reference_expression_raw_mut"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ReferenceExpressionTemplate {
                reference_expression_raw_const: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                mutable_specifier: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                reference_expression_raw_mut: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        306 => { // "reference_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let template = ReferencePatternTemplate {
                mutable_specifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        232 => { // "reference_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("lifetime"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = ReferenceTypeTemplate {
                lifetime: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                mutable_specifier: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        198 => { // "removed_trait_bound"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = RemovedTraitBoundTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        254 => { // "return_expression"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let template = ReturnExpressionTemplate {
                expression: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        243 => { // "scoped_identifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("path"), false)?;
            let template = ScopedIdentifierTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                path: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        244 => { // "scoped_type_identifier_in_expression_position"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("path"), false)?;
            let template = ScopedTypeIdentifierInExpressionPositionTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                path: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        245 => { // "scoped_type_identifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("path"), false)?;
            let template = ScopedTypeIdentifierTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                path: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        206 => { // "scoped_use_list"
            let field_0 = resolve_slot(node, SlotAccessor::Field("list"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("path"), false)?;
            let template = ScopedUseListTemplate {
                list: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                path: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        211 => { // "self_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("lifetime"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("reference"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("self"), true)?;
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
            template.render_into(dest)
        }
        264 => { // "shorthand_field_initializer"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
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
            template.render_into(dest)
        }
        297 => { // "slice_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = SlicePatternTemplate {
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        157 => { // "source_file"
            let field_0 = resolve_slot(node, SlotAccessor::Field("shebang"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("statements"), false)?;
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
            template.render_into(dest)
        }
        186 => { // "static_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("ref_marker"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
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
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                value: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                visibility_modifier: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        311 => { // "string_literal"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = StringLiteralTemplate {
                escape_sequence: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                string_content: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        262 => { // "struct_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = StructExpressionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        176 => { // "struct_item"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let variant = resolve_variant(node);
            let template = StructItemTemplate {
                struct_item_brace: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                struct_item_tuple: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
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
            template.render_into(dest)
        }
        299 => { // "struct_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let children_renderables = children.renderable_items();
            let template = StructPatternTemplate {
                field_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                remaining_field_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        165 => { // "token_binding_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = TokenBindingPatternTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        166 => { // "token_repetition_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = TokenRepetitionPatternTemplate {
                token_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        169 => { // "token_repetition"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = TokenRepetitionTemplate {
                tokens: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        164 => { // "token_tree_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = TokenTreePatternTemplate {
                token_tree_pattern_brace: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                token_tree_pattern_bracket: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                token_tree_pattern_paren: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        168 => { // "token_tree"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = TokenTreeTemplate {
                token_tree_brace: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                token_tree_bracket: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                token_tree_paren: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        196 => { // "trait_bounds"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = TraitBoundsTemplate {
                higher_ranked_trait_bound: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                lifetime: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                type_: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        194 => { // "trait_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("bounds"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("unsafe_marker"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
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
            template.render_into(dest)
        }
        292 => { // "try_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("block"), true)?;
            let template = TryBlockTemplate {
                block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        248 => { // "try_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = TryExpressionTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        260 => { // "tuple_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("elements"), false)?;
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
            template.render_into(dest)
        }
        296 => { // "tuple_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = TuplePatternTemplate {
                closure_expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        298 => { // "tuple_struct_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let children_renderables = children.renderable_items();
            let template = TupleStructPatternTemplate {
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        223 => { // "tuple_type"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = TupleTypeTemplate {
                type_: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        230 => { // "type_arguments"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = TypeArgumentsTemplate {
                block: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                lifetime: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                literal: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                trait_bounds: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                type_: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                type_binding: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        231 => { // "type_binding"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_arguments"), false)?;
            let template = TypeBindingTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_arguments: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        253 => { // "type_cast_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = TypeCastExpressionTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        187 => { // "type_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("where_clause1"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("where_clause2"), false)?;
            let template = TypeItemTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_parameters: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                visibility_modifier: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
                where_clause1: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                where_clause2: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        201 => { // "type_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("bounds"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("default_type"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
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
            template.render_into(dest)
        }
        199 => { // "type_parameters"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attributes"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TypeParametersTemplate {
                attributes: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        247 => { // "unary_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("operand"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = UnaryExpressionTemplate {
                operand: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        177 => { // "union_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("where_clause"), false)?;
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
            template.render_into(dest)
        }
        289 => { // "unsafe_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("block"), true)?;
            let template = UnsafeBlockTemplate {
                block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        208 => { // "use_as_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("path"), true)?;
            let template = UseAsClauseTemplate {
                alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                path: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        229 => { // "use_bounds"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = UseBoundsTemplate {
                lifetime: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                type_identifier: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        204 => { // "use_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("visibility_modifier"), false)?;
            let template = UseDeclarationTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                visibility_modifier: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        207 => { // "use_list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = UseListTemplate {
                use_clause: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        209 => { // "use_wildcard"
            let field_0 = resolve_slot(node, SlotAccessor::Field("path"), false)?;
            let template = UseWildcardTemplate {
                path: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        212 => { // "variadic_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mutable_specifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), false)?;
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
            template.render_into(dest)
        }
        215 => { // "visibility_modifier"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("crate"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pub"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("visibility_modifier_pub_parens"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = VisibilityModifierTemplate {
                visibility_modifier_in_path: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                crate_: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pub_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                visibility_modifier_pub_parens: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        191 => { // "where_clause"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = WhereClauseTemplate {
                where_predicate: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        192 => { // "where_predicate"
            let field_0 = resolve_slot(node, SlotAccessor::Field("bounds"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let template = WherePredicateTemplate {
                bounds: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        277 => { // "while_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let template = WhileExpressionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                label: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        255 => { // "yield_expression"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let template = YieldExpressionTemplate {
                expression: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        _ => token_shaped_fallback_into(node, dest),
    }
}
