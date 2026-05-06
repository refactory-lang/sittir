// @generated from packages/rust/node-model.json5 and packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// Field and child resolution helpers — ResolvedField, resolve_field,
// resolve_children, separator_for, variant_for, etc. Used by both
// dispatch and templates modules.

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

pub(crate) fn render_node_value(node: &NodeData) -> Result<String, ::askama::Error> {
    super::dispatch::render_dispatch(node)
}

pub(crate) fn missing_required_field(node: &NodeData, name: &str) -> ::askama::Error {
    ::askama::Error::Custom(
        format!("render_dispatch: missing required field '{}' on '{}'", name, node.type_).into(),
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
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Ok(None),
        Some(FieldValue::Text(text)) => Ok((!text.is_empty()).then(|| text.to_owned())),
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

pub(crate) fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Err(missing_required_field(node, name)),
        Some(_) => Ok(resolve_optional(node, name)?.unwrap_or_default()),
    }
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

pub(crate) fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
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
    }
}

pub(crate) fn resolve_children(node: &NodeData, consumed_fields: &[&str]) -> Result<ResolvedField, ::askama::Error> {
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
        separator_for(node.type_.0),
        leading_sep,
        trailing_sep,
    ))
}

pub(crate) fn separator_for(kind_id: u16) -> &'static str {
    match kind_id {
        282 => ",", // "closure_parameters"
        179 => ",", // "enum_variant_list"
        181 => ",", // "field_declaration_list"
        263 => ",", // "field_initializer_list"
        210 => ",", // "parameters"
        297 => ",", // "slice_pattern"
        196 => "+", // "trait_bounds"
        296 => ",", // "tuple_pattern"
        223 => ",", // "tuple_type"
        230 => ",", // "type_arguments"
        207 => ",", // "use_list"
        _ => "",
    }
}

pub(crate) fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {
    match (parent_id, child_id) {
        (258, 322) => Some("semi"), // ("array_expression", "array_expression_list")
        (258, 321) => Some("semi"), // ("array_expression", "array_expression_semi")
        (281, 323) => Some("block"), // ("closure_expression", "closure_expression_block")
        (281, 324) => Some("block"), // ("closure_expression", "closure_expression_expr")
        (240, 381) => Some("paren"), // ("delim_token_tree", "delim_token_tree_brace")
        (240, 380) => Some("paren"), // ("delim_token_tree", "delim_token_tree_bracket")
        (240, 379) => Some("paren"), // ("delim_token_tree", "delim_token_tree_paren")
        (160, 366) => Some("with_semi"), // ("expression_statement", "expression_statement_block_ending")
        (160, 365) => Some("with_semi"), // ("expression_statement", "expression_statement_with_semi")
        (300, 326) => Some("shorthand"), // ("field_pattern", "field_pattern_named")
        (300, 325) => Some("shorthand"), // ("field_pattern", "field_pattern_shorthand")
        (174, 368) => Some("semi"), // ("foreign_mod_item", "foreign_mod_item_body")
        (174, 367) => Some("semi"), // ("foreign_mod_item", "foreign_mod_item_semi")
        (193, 329) => Some("body"), // ("impl_item", "impl_item_body")
        (193, 330) => Some("body"), // ("impl_item", "impl_item_semi")
        (314, 146) => Some("regular_dslash"), // ("line_comment", "line_comment_content")
        (314, 372) => Some("regular_dslash"), // ("line_comment", "line_comment_doc")
        (314, 371) => Some("regular_dslash"), // ("line_comment", "line_comment_regular_dslash")
        (161, 333) => Some("paren"), // ("macro_definition", "macro_definition_brace")
        (161, 332) => Some("paren"), // ("macro_definition", "macro_definition_bracket")
        (161, 331) => Some("paren"), // ("macro_definition", "macro_definition_paren")
        (274, 370) => Some("with_comma"), // ("match_arm", "match_arm_block_ending")
        (274, 369) => Some("with_comma"), // ("match_arm", "match_arm_with_comma")
        (173, 334) => Some("external"), // ("mod_item", "mod_item_external")
        (173, 335) => Some("external"), // ("mod_item", "mod_item_inline")
        (307, 336) => Some("binary"), // ("or_pattern", "or_pattern_binary")
        (307, 337) => Some("binary"), // ("or_pattern", "or_pattern_prefix")
        (233, 358) => Some("const"), // ("pointer_type", "pointer_type_const")
        (233, 359) => Some("const"), // ("pointer_type", "pointer_type_mut")
        (246, 341) => Some("binary"), // ("range_expression", "range_expression_bare")
        (246, 338) => Some("binary"), // ("range_expression", "range_expression_binary")
        (246, 339) => Some("binary"), // ("range_expression", "range_expression_postfix")
        (246, 340) => Some("binary"), // ("range_expression", "range_expression_prefix")
        (303, 344) => Some("left_with_right"), // ("range_pattern", "range_pattern_left_bare")
        (303, 343) => Some("left_with_right"), // ("range_pattern", "range_pattern_left_with_right")
        (303, 342) => Some("left_with_right"), // ("range_pattern", "range_pattern_prefix")
        (176, 345) => Some("brace"), // ("struct_item", "struct_item_brace")
        (176, 346) => Some("brace"), // ("struct_item", "struct_item_tuple")
        (176, 347) => Some("brace"), // ("struct_item", "struct_item_unit")
        (168, 378) => Some("paren"), // ("token_tree", "token_tree_brace")
        (168, 377) => Some("paren"), // ("token_tree", "token_tree_bracket")
        (168, 376) => Some("paren"), // ("token_tree", "token_tree_paren")
        (164, 375) => Some("paren"), // ("token_tree_pattern", "token_tree_pattern_brace")
        (164, 374) => Some("paren"), // ("token_tree_pattern", "token_tree_pattern_bracket")
        (164, 373) => Some("paren"), // ("token_tree_pattern", "token_tree_pattern_paren")
        (215, 348) => Some("in_path"), // ("visibility_modifier", "visibility_modifier_crate")
        (215, 350) => Some("in_path"), // ("visibility_modifier", "visibility_modifier_in_path")
        (215, 349) => Some("in_path"), // ("visibility_modifier", "visibility_modifier_pub")
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

pub(crate) fn token_shaped_fallback(node: &NodeData) -> Result<String, ::askama::Error> {
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
            return Ok(text.to_owned());
        }
        let mut parts = Vec::new();
        if let Some(fields) = &node.fields {
            for value in fields.values() {
                match value {
                    FieldValue::Single(item) => {
                        if let Some(text) = &item.text {
                            parts.push(text.to_owned());
                        }
                    }
                    FieldValue::Multiple(items) => {
                        for item in items {
                            if let Some(text) = &item.text {
                                parts.push(text.to_owned());
                            }
                        }
                    }
                    FieldValue::Text(text) => parts.push(text.to_owned()),
                }
            }
        }
        if let Some(children) = &node.children {
            for child in children {
                if let Some(text) = &child.text {
                    parts.push(text.to_owned());
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
