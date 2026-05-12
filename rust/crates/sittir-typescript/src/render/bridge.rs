// @generated from packages/typescript/node-model.json5 and packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
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
        252 => ",", // "arguments"
        217 => ",", // "array"
        218 => ",", // "array_pattern"
        291 => ",", // "enum_body"
        169 => ",", // "export_clause"
        278 => ",", // "extends_clause"
        289 => ",", // "extends_type_clause"
        257 => ",", // "formal_parameters"
        280 => ",", // "implements_clause"
        184 => ",", // "lexical_declaration"
        178 => ",", // "named_imports"
        213 => ",", // "object"
        214 => ",", // "object_pattern"
        337 => ",", // "object_type"
        246 => ",", // "sequence_expression"
        347 => ",", // "tuple_type"
        336 => ",", // "type_arguments"
        340 => ",", // "type_parameters"
        183 => ",", // "variable_declaration"
        _ => "",
    }
}

pub(crate) fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {
    match (parent_id, child_id) {
        (227, 357) => Some("_call_signature"), // ("arrow_function", "arrow_function__call_signature")
        (227, 356) => Some("parameter"), // ("arrow_function", "arrow_function_parameter")
        (231, 387) => Some("call"), // ("call_expression", "call_expression_call")
        (231, 389) => Some("member"), // ("call_expression", "call_expression_member")
        (231, 388) => Some("template_call"), // ("call_expression", "call_expression_template_call")
        (222, 358) => Some("extends_clause"), // ("class_heritage", "class_heritage_extends_clause")
        (222, 359) => Some("implements_clause"), // ("class_heritage", "class_heritage_implements_clause")
        (167, 352) => Some("default"), // ("export_statement", "export_statement_default")
        (167, 385) => Some("equals_export"), // ("export_statement", "export_statement_equals_export")
        (167, 386) => Some("namespace_export"), // ("export_statement", "export_statement_namespace_export")
        (167, 384) => Some("type_export"), // ("export_statement", "export_statement_type_export")
        (175, 362) => Some("default_import"), // ("import_clause", "import_clause_default_import")
        (175, 361) => Some("named_imports"), // ("import_clause", "import_clause_named_imports")
        (175, 360) => Some("namespace_import"), // ("import_clause", "import_clause_namespace_import")
        (179, 364) => Some("as"), // ("import_specifier", "import_specifier_as")
        (179, 363) => Some("name"), // ("import_specifier", "import_specifier_name")
        (345, 365) => Some("colon"), // ("index_signature", "index_signature_colon")
        (345, 366) => Some("mapped_type_clause"), // ("index_signature", "index_signature_mapped_type_clause")
        (209, 383) => Some("sequence"), // ("parenthesized_expression", "parenthesized_expression_sequence")
        (209, 382) => Some("typed"), // ("parenthesized_expression", "parenthesized_expression_typed")
        (245, 390) => Some("postfix"), // ("update_expression", "update_expression_postfix")
        (245, 391) => Some("prefix"), // ("update_expression", "update_expression_prefix")
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

pub fn render_nodedata_into(node: &NodeData, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return dest.write_str(text).map_err(::askama::Error::from);
        }
    }
    match node.type_.0 {
        357 => { // "_arrow_function__call_signature" | "arrow_function__call_signature"
            let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "parameters", true)?;
            let field_1 = resolve_field(node, "return_type", false)?;
            let field_2 = resolve_field(node, "type_parameters", false)?;
            let template = _ArrowFunctionUCallSignatureTemplate {
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                return_type: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_parameters: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        356 => { // "_arrow_function_parameter" | "arrow_function_parameter"
            let children = resolve_children(node, &["parameter"])?;
            let field_0 = resolve_field(node, "parameter", true)?;
            let template = _ArrowFunctionParameterTemplate {
                parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        387 => { // "_call_expression_call" | "call_expression_call"
            let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let field_2 = resolve_field(node, "type_arguments", false)?;
            let template = CallExpressionCallTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_arguments: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        389 => { // "_call_expression_member" | "call_expression_member"
            let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let field_2 = resolve_field(node, "type_arguments", false)?;
            let template = CallExpressionMemberTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_arguments: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        388 => { // "_call_expression_template_call" | "call_expression_template_call"
            let children = resolve_children(node, &["arguments", "function"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let template = CallExpressionTemplateCallTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        373 => { // "_class_body_member" | "class_body_member"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ClassBodyMemberTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        372 => { // "_class_body_method_sig" | "class_body_method_sig"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ClassBodyMethodSigTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        371 => { // "_class_body_method" | "class_body_method"
            let children = resolve_children(node, &["decorator"])?;
            let field_0 = resolve_field(node, "decorator", false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = ClassBodyMethodTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                decorator: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        358 => { // "_class_heritage_extends_clause" | "class_heritage_extends_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ClassHeritageExtendsClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        359 => { // "_class_heritage_implements_clause" | "class_heritage_implements_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ClassHeritageImplementsClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        370 => { // "_export_statement_default_decl_arm_default_kw_value" | "export_statement_default_decl_arm_default_kw_value"
            let children = resolve_children(node, &["value"])?;
            let field_0 = resolve_field(node, "value", true)?;
            let children_renderables = children.renderable_items();
            let template = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        355 => { // "_export_statement_default_decl_arm_default_kw" | "export_statement_default_decl_arm_default_kw"
            let children = resolve_children(node, &["declaration"])?;
            let field_0 = resolve_field(node, "declaration", false)?;
            let children_renderables = children.renderable_items();
            let template = ExportStatementDefaultDeclArmDefaultKwTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                declaration: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        354 => { // "_export_statement_default_decl_arm" | "export_statement_default_decl_arm"
            let children = resolve_children(node, &["declaration", "decorator"])?;
            let field_0 = resolve_field(node, "declaration", false)?;
            let field_1 = resolve_field(node, "decorator", false)?;
            let children_renderables = children.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ExportStatementDefaultDeclArmTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                declaration: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                decorator: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        369 => { // "_export_statement_default_from_arm_clause_from" | "export_statement_default_from_arm_clause_from"
            let children = resolve_children(node, &["source"])?;
            let field_0 = resolve_field(node, "source", true)?;
            let children_renderables = children.renderable_items();
            let template = ExportStatementDefaultFromArmClauseFromTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        368 => { // "_export_statement_default_from_arm_ns_from" | "export_statement_default_from_arm_ns_from"
            let children = resolve_children(node, &["source"])?;
            let field_0 = resolve_field(node, "source", true)?;
            let children_renderables = children.renderable_items();
            let template = ExportStatementDefaultFromArmNsFromTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        367 => { // "_export_statement_default_from_arm_star_from" | "export_statement_default_from_arm_star_from"
            let children = resolve_children(node, &["source"])?;
            let field_0 = resolve_field(node, "source", true)?;
            let template = ExportStatementDefaultFromArmStarFromTemplate {
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        353 => { // "_export_statement_default_from_arm" | "export_statement_default_from_arm"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ExportStatementDefaultFromArmTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        385 => { // "_export_statement_equals_export" | "export_statement_equals_export"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ExportStatementEqualsExportTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        386 => { // "_export_statement_namespace_export" | "export_statement_namespace_export"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ExportStatementNamespaceExportTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        384 => { // "_export_statement_type_export" | "export_statement_type_export"
            let children = resolve_children(node, &["source"])?;
            let field_0 = resolve_field(node, "source", false)?;
            let children_renderables = children.renderable_items();
            let template = _ExportStatementTypeExportTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                source: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        376 => { // "_for_header_let_const_kind" | "for_header_let_const_kind"
            let children = resolve_children(node, &["kind", "left"])?;
            let field_0 = resolve_field(node, "kind", true)?;
            let field_1 = resolve_field(node, "left", true)?;
            let children_renderables = children.renderable_items();
            let template = ForHeaderLetConstKindTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        374 => { // "_for_header_lhs" | "for_header_lhs"
            let children = resolve_children(node, &["left"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let template = ForHeaderLhsTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        375 => { // "_for_header_var_kind" | "for_header_var_kind"
            let children = resolve_children(node, &["kind", "left", "value"])?;
            let field_0 = resolve_field(node, "kind", true)?;
            let field_1 = resolve_field(node, "left", true)?;
            let field_2 = resolve_field(node, "value", false)?;
            let template = ForHeaderVarKindTemplate {
                kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                value: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        362 => { // "_import_clause_default_import" | "import_clause_default_import"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ImportClauseDefaultImportTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        361 => { // "_import_clause_named_imports" | "import_clause_named_imports"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ImportClauseNamedImportsTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        360 => { // "_import_clause_namespace_import" | "import_clause_namespace_import"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ImportClauseNamespaceImportTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        364 => { // "_import_specifier_as" | "import_specifier_as"
            let children = resolve_children(node, &["alias", "name"])?;
            let field_0 = resolve_field(node, "alias", true)?;
            let field_1 = resolve_field(node, "name", true)?;
            let template = ImportSpecifierAsTemplate {
                alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        363 => { // "_import_specifier_name" | "import_specifier_name"
            let children = resolve_children(node, &["name"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let template = _ImportSpecifierNameTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        365 => { // "_index_signature_colon" | "index_signature_colon"
            let children = resolve_children(node, &["index_type", "name"])?;
            let field_0 = resolve_field(node, "index_type", true)?;
            let field_1 = resolve_field(node, "name", true)?;
            let template = IndexSignatureColonTemplate {
                index_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        366 => { // "_index_signature_mapped_type_clause" | "index_signature_mapped_type_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _IndexSignatureMappedTypeClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        239 => { // "_initializer"
            let children = resolve_children(node, &["value"])?;
            let field_0 = resolve_field(node, "value", true)?;
            let template = InitializerTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        331 | 105 => { // "_number" | "number"
            let children = resolve_children(node, &["argument", "operator"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let template = _NumberTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        383 => { // "_parenthesized_expression_sequence" | "parenthesized_expression_sequence"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _ParenthesizedExpressionSequenceTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        382 => { // "_parenthesized_expression_typed" | "parenthesized_expression_typed"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", false)?;
            let children_renderables = children.renderable_items();
            let template = ParenthesizedExpressionTypedTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                type_: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        418 => { // "_public_field_definition_abstract_first" | "public_field_definition_abstract_first"
            let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
            let field_0 = resolve_field(node, "abstract_marker", true)?;
            let field_1 = resolve_field(node, "readonly_marker", false)?;
            let template = PublicFieldDefinitionAbstractFirstTemplate {
                abstract_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                readonly_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        419 => { // "_public_field_definition_access_first" | "public_field_definition_access_first"
            let children = resolve_children(node, &["declare_marker"])?;
            let field_0 = resolve_field(node, "declare_marker", false)?;
            let children_renderables = children.renderable_items();
            let template = PublicFieldDefinitionAccessFirstTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                declare_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        420 => { // "_public_field_definition_accessor_opt" | "public_field_definition_accessor_opt"
            let children = resolve_children(node, &["accessor_marker"])?;
            let field_0 = resolve_field(node, "accessor_marker", true)?;
            let template = PublicFieldDefinitionAccessorOptTemplate {
                accessor_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        421 => { // "_public_field_definition_declare_first" | "public_field_definition_declare_first"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = PublicFieldDefinitionDeclareFirstTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        422 => { // "_public_field_definition_readonly_first" | "public_field_definition_readonly_first"
            let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
            let field_0 = resolve_field(node, "abstract_marker", false)?;
            let field_1 = resolve_field(node, "readonly_marker", true)?;
            let template = PublicFieldDefinitionReadonlyFirstTemplate {
                abstract_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                readonly_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        423 => { // "_public_field_definition_static_mods" | "public_field_definition_static_mods"
            let children = resolve_children(node, &["readonly_marker", "static_marker"])?;
            let field_0 = resolve_field(node, "readonly_marker", false)?;
            let field_1 = resolve_field(node, "static_marker", true)?;
            let children_renderables = children.renderable_items();
            let template = PublicFieldDefinitionStaticModsTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                readonly_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                static_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        304 => { // "_type_query_call_expression_in_type_annotation"
            let children = resolve_children(node, &["arguments", "function"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let template = TypeQueryCallExpressionInTypeAnnotationTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        324 => { // "_type_query_call_expression"
            let children = resolve_children(node, &["arguments", "function"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let template = TypeQueryCallExpressionTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        325 => { // "_type_query_instantiation_expression"
            let children = resolve_children(node, &["function", "type_arguments"])?;
            let field_0 = resolve_field(node, "function", true)?;
            let field_1 = resolve_field(node, "type_arguments", true)?;
            let template = TypeQueryInstantiationExpressionTemplate {
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        303 => { // "_type_query_member_expression_in_type_annotation"
            let children = resolve_children(node, &["object", "property"])?;
            let field_0 = resolve_field(node, "object", true)?;
            let field_1 = resolve_field(node, "property", true)?;
            let template = TypeQueryMemberExpressionInTypeAnnotationTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        322 => { // "_type_query_member_expression"
            let children = resolve_children(node, &["object", "property"])?;
            let field_0 = resolve_field(node, "object", true)?;
            let field_1 = resolve_field(node, "property", true)?;
            let template = TypeQueryMemberExpressionTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        323 => { // "_type_query_subscript_expression"
            let children = resolve_children(node, &["index", "object"])?;
            let field_0 = resolve_field(node, "index", true)?;
            let field_1 = resolve_field(node, "object", true)?;
            let template = TypeQuerySubscriptExpressionTemplate {
                index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        390 => { // "_update_expression_postfix" | "update_expression_postfix"
            let children = resolve_children(node, &["argument", "operator"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let template = UpdateExpressionPostfixTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        391 => { // "_update_expression_prefix" | "update_expression_prefix"
            let children = resolve_children(node, &["argument", "operator"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let template = UpdateExpressionPrefixTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        282 => { // "abstract_class_declaration"
            let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "class_heritage", false)?;
            let field_2 = resolve_field(node, "decorator", false)?;
            let field_3 = resolve_field(node, "name", true)?;
            let field_4 = resolve_field(node, "type_parameters", false)?;
            let field_2_renderables = field_2.renderable_items();
            let template = AbstractClassDeclarationTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                class_heritage: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                decorator: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                type_parameters: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        270 => { // "abstract_method_signature"
            let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "name", "optional_marker", "override_modifier", "parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "accessibility_modifier", false)?;
            let field_1 = resolve_field(node, "accessor_kind", false)?;
            let field_2 = resolve_field(node, "name", true)?;
            let field_3 = resolve_field(node, "optional_marker", false)?;
            let field_4 = resolve_field(node, "override_modifier", false)?;
            let field_5 = resolve_field(node, "parameters", true)?;
            let field_6 = resolve_field(node, "return_type", false)?;
            let field_7 = resolve_field(node, "type_parameters", false)?;
            let template = AbstractMethodSignatureTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                accessor_kind: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                optional_marker: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
                override_modifier: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                return_type: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
                type_parameters: match field_7.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        300 => { // "adding_type_annotation"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = AddingTypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        281 => { // "ambient_declaration"
            let children = resolve_children(node, &["declaration"])?;
            let field_0 = resolve_field(node, "declaration", true)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = AmbientDeclarationTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                declaration: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        252 => { // "arguments"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ArgumentsTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        218 => { // "array_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ArrayPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        346 => { // "array_type"
            let children = resolve_children(node, &["primary_type"])?;
            let field_0 = resolve_field(node, "primary_type", true)?;
            let template = ArrayTypeTemplate {
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        217 => { // "array"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ArrayTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        227 => { // "arrow_function"
            let children = resolve_children(node, &["async_marker", "body"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let children_renderables = children.renderable_items();
            let template = ArrowFunctionTemplate {
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
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        274 => { // "as_expression"
            let children = resolve_children(node, &["expression", "type_annotation"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let field_1 = resolve_field(node, "type_annotation", true)?;
            let children_renderables = children.renderable_items();
            let template = AsExpressionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_annotation: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        306 => { // "asserts_annotation"
            let children = resolve_children(node, &["asserts"])?;
            let field_0 = resolve_field(node, "asserts", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = AssertsAnnotationTemplate {
                asserts: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        305 => { // "asserts"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = AssertsTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        236 => { // "assignment_expression"
            let children = resolve_children(node, &["left", "right", "using_marker"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "right", true)?;
            let field_2 = resolve_field(node, "using_marker", false)?;
            let template = AssignmentExpressionTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                using_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        215 => { // "assignment_pattern"
            let children = resolve_children(node, &["left", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "right", true)?;
            let template = AssignmentPatternTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        238 => { // "augmented_assignment_expression"
            let children = resolve_children(node, &["left", "operator", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let field_2 = resolve_field(node, "right", true)?;
            let template = AugmentedAssignmentExpressionTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        233 => { // "await_expression"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = AwaitExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        243 => { // "binary_expression"
            let children = resolve_children(node, &["left", "operator", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let field_2 = resolve_field(node, "right", true)?;
            let template = BinaryExpressionTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        197 => { // "break_statement"
            let children = resolve_children(node, &["label", "semicolon"])?;
            let field_0 = resolve_field(node, "label", false)?;
            let field_1 = resolve_field(node, "semicolon", true)?;
            let template = BreakStatementTemplate {
                label: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        231 => { // "call_expression"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = CallExpressionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        338 => { // "call_signature"
            let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "parameters", true)?;
            let field_1 = resolve_field(node, "return_type", false)?;
            let field_2 = resolve_field(node, "type_parameters", false)?;
            let template = CallSignatureTemplate {
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                return_type: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_parameters: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        207 => { // "catch_clause"
            let children = resolve_children(node, &["body", "parameter", "type"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "parameter", false)?;
            let field_2 = resolve_field(node, "type", false)?;
            let template = CatchClauseTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                parameter: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        256 => { // "class_body"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ClassBodyTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        221 => { // "class_declaration"
            let children = resolve_children(node, &["automatic_semicolon", "body", "class_heritage", "decorator", "name", "type_parameters"])?;
            let field_0 = resolve_field(node, "automatic_semicolon", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "class_heritage", false)?;
            let field_3 = resolve_field(node, "decorator", false)?;
            let field_4 = resolve_field(node, "name", true)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
            let field_3_renderables = field_3.renderable_items();
            let template = ClassDeclarationTemplate {
                automatic_semicolon: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                class_heritage: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                decorator: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                type_parameters: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        222 => { // "class_heritage"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ClassHeritageTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        258 => { // "class_static_block"
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let children_renderables = children.renderable_items();
            let template = ClassStaticBlockTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        220 => { // "class"
            let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "class_heritage", false)?;
            let field_2 = resolve_field(node, "decorator", false)?;
            let field_3 = resolve_field(node, "name", false)?;
            let field_4 = resolve_field(node, "type_parameters", false)?;
            let field_2_renderables = field_2.renderable_items();
            let template = ClassTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                class_heritage: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                decorator: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                name: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
                type_parameters: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        265 => { // "computed_property_name"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = ComputedPropertyNameTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        318 => { // "conditional_type"
            let children = resolve_children(node, &["alternative", "consequence", "left", "right"])?;
            let field_0 = resolve_field(node, "alternative", true)?;
            let field_1 = resolve_field(node, "consequence", true)?;
            let field_2 = resolve_field(node, "left", true)?;
            let field_3 = resolve_field(node, "right", true)?;
            let template = ConditionalTypeTemplate {
                alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        343 => { // "constraint"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = ConstraintTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        344 => { // "construct_signature"
            let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
            let field_0 = resolve_field(node, "abstract_marker", false)?;
            let field_1 = resolve_field(node, "parameters", true)?;
            let field_2 = resolve_field(node, "type", false)?;
            let field_3 = resolve_field(node, "type_parameters", false)?;
            let template = ConstructSignatureTemplate {
                abstract_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                type_parameters: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        313 => { // "constructor_type"
            let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
            let field_0 = resolve_field(node, "abstract_marker", false)?;
            let field_1 = resolve_field(node, "parameters", true)?;
            let field_2 = resolve_field(node, "type", true)?;
            let field_3 = resolve_field(node, "type_parameters", false)?;
            let template = ConstructorTypeTemplate {
                abstract_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                type_parameters: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        198 => { // "continue_statement"
            let children = resolve_children(node, &["label", "semicolon"])?;
            let field_0 = resolve_field(node, "label", false)?;
            let field_1 = resolve_field(node, "semicolon", true)?;
            let template = ContinueStatementTemplate {
                label: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        199 => { // "debugger_statement"
            let children = resolve_children(node, &["semicolon"])?;
            let field_0 = resolve_field(node, "semicolon", true)?;
            let template = DebuggerStatementTemplate {
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        255 => { // "decorator_call_expression"
            let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let field_2 = resolve_field(node, "type_arguments", false)?;
            let template = DecoratorCallExpressionTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_arguments: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        254 => { // "decorator_member_expression"
            let children = resolve_children(node, &["object", "property"])?;
            let field_0 = resolve_field(node, "object", true)?;
            let field_1 = resolve_field(node, "property", true)?;
            let template = DecoratorMemberExpressionTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        272 => { // "decorator_parenthesized_expression"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DecoratorParenthesizedExpressionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        253 => { // "decorator"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DecoratorTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        342 => { // "default_type"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = DefaultTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        194 => { // "do_statement"
            let children = resolve_children(node, &["body", "condition", "semicolon"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "condition", true)?;
            let field_2 = resolve_field(node, "semicolon", false)?;
            let template = DoStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                semicolon: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        187 => { // "else_clause"
            let children = resolve_children(node, &["statement"])?;
            let field_0 = resolve_field(node, "statement", true)?;
            let template = ElseClauseTemplate {
                statement: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        292 => { // "enum_assignment"
            let children = resolve_children(node, &["name", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = EnumAssignmentTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        291 => { // "enum_body"
            let children = resolve_children(node, &["name"])?;
            let field_0 = resolve_field(node, "name", false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = EnumBodyTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                name: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        290 => { // "enum_declaration"
            let children = resolve_children(node, &["body", "const_marker", "name"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "const_marker", false)?;
            let field_2 = resolve_field(node, "name", true)?;
            let template = EnumDeclarationTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                const_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        169 => { // "export_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ExportClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        170 => { // "export_specifier"
            let children = resolve_children(node, &["alias", "export_kind", "name"])?;
            let field_0 = resolve_field(node, "alias", false)?;
            let field_1 = resolve_field(node, "export_kind", false)?;
            let field_2 = resolve_field(node, "name", true)?;
            let template = ExportSpecifierTemplate {
                alias: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                export_kind: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        167 => { // "export_statement"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ExportStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        182 => { // "expression_statement"
            let children = resolve_children(node, &["semicolon"])?;
            let field_0 = resolve_field(node, "semicolon", true)?;
            let children_renderables = children.renderable_items();
            let template = ExpressionStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        278 => { // "extends_clause"
            let children = resolve_children(node, &["type_arguments", "value"])?;
            let field_0 = resolve_field(node, "type_arguments", false)?;
            let field_1 = resolve_field(node, "value", true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ExtendsClauseTemplate {
                type_arguments: match field_0.kind {
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
            template.render_into(dest)
        }
        289 => { // "extends_type_clause"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ExtendsTypeClauseTemplate {
                type_: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        208 => { // "finally_clause"
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let template = FinallyClauseTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        333 => { // "flow_maybe_type"
            let children = resolve_children(node, &["primary_type"])?;
            let field_0 = resolve_field(node, "primary_type", true)?;
            let template = FlowMaybeTypeTemplate {
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        191 => { // "for_in_statement"
            let children = resolve_children(node, &["await_marker", "body", "operator", "right"])?;
            let field_0 = resolve_field(node, "await_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "operator", true)?;
            let field_3 = resolve_field(node, "right", true)?;
            let children_renderables = children.renderable_items();
            let template = ForInStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                await_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        190 => { // "for_statement"
            let children = resolve_children(node, &["body", "condition", "increment", "initializer"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "condition", true)?;
            let field_2 = resolve_field(node, "increment", false)?;
            let field_3 = resolve_field(node, "initializer", true)?;
            let template = ForStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                increment: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                initializer: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        257 => { // "formal_parameters"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = FormalParametersTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        224 => { // "function_declaration"
            let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "name", true)?;
            let field_3 = resolve_field(node, "parameters", true)?;
            let field_4 = resolve_field(node, "return_type", false)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
            let children_renderables = children.renderable_items();
            let template = FunctionDeclarationTemplate {
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
            template.render_into(dest)
        }
        223 => { // "function_expression"
            let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "name", false)?;
            let field_3 = resolve_field(node, "parameters", true)?;
            let field_4 = resolve_field(node, "return_type", false)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
            let template = FunctionExpressionTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                name: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
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
            template.render_into(dest)
        }
        271 => { // "function_signature"
            let children = resolve_children(node, &["async_marker", "name", "parameters", "return_type", "semicolon", "type_parameters"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "name", true)?;
            let field_2 = resolve_field(node, "parameters", true)?;
            let field_3 = resolve_field(node, "return_type", false)?;
            let field_4 = resolve_field(node, "semicolon", true)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
            let children_renderables = children.renderable_items();
            let template = FunctionSignatureTemplate {
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
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                return_type: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                type_parameters: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        351 => { // "function_type"
            let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "parameters", true)?;
            let field_1 = resolve_field(node, "return_type", true)?;
            let field_2 = resolve_field(node, "type_parameters", false)?;
            let template = FunctionTypeTemplate {
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                return_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_parameters: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        226 => { // "generator_function_declaration"
            let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "name", true)?;
            let field_3 = resolve_field(node, "parameters", true)?;
            let field_4 = resolve_field(node, "return_type", false)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
            let children_renderables = children.renderable_items();
            let template = GeneratorFunctionDeclarationTemplate {
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
            template.render_into(dest)
        }
        225 => { // "generator_function"
            let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "name", false)?;
            let field_3 = resolve_field(node, "parameters", true)?;
            let field_4 = resolve_field(node, "return_type", false)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
            let template = GeneratorFunctionTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                name: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
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
            template.render_into(dest)
        }
        319 => { // "generic_type"
            let children = resolve_children(node, &["name", "type_arguments"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "type_arguments", true)?;
            let template = GenericTypeTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        188 => { // "if_statement"
            let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
            let field_0 = resolve_field(node, "alternative", false)?;
            let field_1 = resolve_field(node, "condition", true)?;
            let field_2 = resolve_field(node, "consequence", true)?;
            let template = IfStatementTemplate {
                alternative: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        280 => { // "implements_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ImplementsClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        286 => { // "import_alias"
            let children = resolve_children(node, &["name", "semicolon", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "semicolon", true)?;
            let field_2 = resolve_field(node, "value", true)?;
            let children_renderables = children.renderable_items();
            let template = ImportAliasTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        180 => { // "import_attribute"
            let children = resolve_children(node, &["object"])?;
            let field_0 = resolve_field(node, "object", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ImportAttributeTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        175 => { // "import_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ImportClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        277 => { // "import_require_clause"
            let children = resolve_children(node, &["identifier", "source"])?;
            let field_0 = resolve_field(node, "identifier", true)?;
            let field_1 = resolve_field(node, "source", true)?;
            let template = ImportRequireClauseTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        179 => { // "import_specifier"
            let children = resolve_children(node, &["import_kind"])?;
            let field_0 = resolve_field(node, "import_kind", false)?;
            let children_renderables = children.renderable_items();
            let template = ImportSpecifierTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                import_kind: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        174 => { // "import_statement"
            let children = resolve_children(node, &["import_attribute", "import_clause", "semicolon", "source"])?;
            let field_0 = resolve_field(node, "import_attribute", false)?;
            let field_1 = resolve_field(node, "import_clause", false)?;
            let field_2 = resolve_field(node, "semicolon", true)?;
            let field_3 = resolve_field(node, "source", false)?;
            let children_renderables = children.renderable_items();
            let template = ImportStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                import_attribute: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                import_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                source: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        345 => { // "index_signature"
            let children = resolve_children(node, &["sign", "type"])?;
            let field_0 = resolve_field(node, "sign", false)?;
            let field_1 = resolve_field(node, "type", true)?;
            let children_renderables = children.renderable_items();
            let template = IndexSignatureTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                sign: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        327 => { // "index_type_query"
            let children = resolve_children(node, &["primary_type"])?;
            let field_0 = resolve_field(node, "primary_type", true)?;
            let template = IndexTypeQueryTemplate {
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        317 => { // "infer_type"
            let children = resolve_children(node, &["type", "type_identifier"])?;
            let field_0 = resolve_field(node, "type", false)?;
            let field_1 = resolve_field(node, "type_identifier", true)?;
            let template = InferTypeTemplate {
                type_: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                type_identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        276 => { // "instantiation_expression"
            let children = resolve_children(node, &["expression", "type_arguments"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let field_1 = resolve_field(node, "type_arguments", true)?;
            let template = InstantiationExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        288 => { // "interface_declaration"
            let children = resolve_children(node, &["body", "extends_type_clause", "name", "type_parameters"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "extends_type_clause", false)?;
            let field_2 = resolve_field(node, "name", true)?;
            let field_3 = resolve_field(node, "type_parameters", false)?;
            let template = InterfaceDeclarationTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                extends_type_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                type_parameters: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        284 => { // "internal_module"
            let children = resolve_children(node, &["body", "name"])?;
            let field_0 = resolve_field(node, "body", false)?;
            let field_1 = resolve_field(node, "name", true)?;
            let template = InternalModuleTemplate {
                body: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        350 => { // "intersection_type"
            let children = resolve_children(node, &["left", "right"])?;
            let field_0 = resolve_field(node, "left", false)?;
            let field_1 = resolve_field(node, "right", true)?;
            let template = IntersectionTypeTemplate {
                left: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        203 => { // "labeled_statement"
            let children = resolve_children(node, &["body", "label"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "label", true)?;
            let template = LabeledStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                label: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        184 => { // "lexical_declaration"
            let children = resolve_children(node, &["declarators", "kind", "semicolon"])?;
            let field_0 = resolve_field(node, "declarators", true)?;
            let field_1 = resolve_field(node, "kind", true)?;
            let field_2 = resolve_field(node, "semicolon", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = LexicalDeclarationTemplate {
                declarators: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        330 => { // "literal_type"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = LiteralTypeTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        328 => { // "lookup_type"
            let children = resolve_children(node, &["index_type", "primary_type"])?;
            let field_0 = resolve_field(node, "index_type", true)?;
            let field_1 = resolve_field(node, "primary_type", true)?;
            let template = LookupTypeTemplate {
                index_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        329 => { // "mapped_type_clause"
            let children = resolve_children(node, &["alias", "name", "type"])?;
            let field_0 = resolve_field(node, "alias", false)?;
            let field_1 = resolve_field(node, "name", true)?;
            let field_2 = resolve_field(node, "type", true)?;
            let template = MappedTypeClauseTemplate {
                alias: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        234 => { // "member_expression"
            let children = resolve_children(node, &["object", "optional_chain", "property"])?;
            let field_0 = resolve_field(node, "object", true)?;
            let field_1 = resolve_field(node, "optional_chain", false)?;
            let field_2 = resolve_field(node, "property", true)?;
            let template = MemberExpressionTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                optional_chain: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        261 => { // "method_definition"
            let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "body", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
            let field_0 = resolve_field(node, "accessibility_modifier", false)?;
            let field_1 = resolve_field(node, "accessor_kind", false)?;
            let field_2 = resolve_field(node, "async_marker", false)?;
            let field_3 = resolve_field(node, "body", true)?;
            let field_4 = resolve_field(node, "name", true)?;
            let field_5 = resolve_field(node, "optional_marker", false)?;
            let field_6 = resolve_field(node, "override_modifier", false)?;
            let field_7 = resolve_field(node, "parameters", true)?;
            let field_8 = resolve_field(node, "readonly_marker", false)?;
            let field_9 = resolve_field(node, "return_type", false)?;
            let field_10 = resolve_field(node, "static_marker", false)?;
            let field_11 = resolve_field(node, "type_parameters", false)?;
            let template = MethodDefinitionTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                accessor_kind: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                async_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                optional_marker: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                override_modifier: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
                readonly_marker: match field_8.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_8.as_scalar())),
                },
                return_type: match field_9.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_9.as_scalar())),
                },
                static_marker: match field_10.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_10.as_scalar())),
                },
                type_parameters: match field_11.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_11.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        269 => { // "method_signature"
            let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
            let field_0 = resolve_field(node, "accessibility_modifier", false)?;
            let field_1 = resolve_field(node, "accessor_kind", false)?;
            let field_2 = resolve_field(node, "async_marker", false)?;
            let field_3 = resolve_field(node, "name", true)?;
            let field_4 = resolve_field(node, "optional_marker", false)?;
            let field_5 = resolve_field(node, "override_modifier", false)?;
            let field_6 = resolve_field(node, "parameters", true)?;
            let field_7 = resolve_field(node, "readonly_marker", false)?;
            let field_8 = resolve_field(node, "return_type", false)?;
            let field_9 = resolve_field(node, "static_marker", false)?;
            let field_10 = resolve_field(node, "type_parameters", false)?;
            let template = MethodSignatureTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                accessor_kind: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                async_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                optional_marker: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                override_modifier: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                readonly_marker: match field_7.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_7.as_scalar())),
                },
                return_type: match field_8.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_8.as_scalar())),
                },
                static_marker: match field_9.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_9.as_scalar())),
                },
                type_parameters: match field_10.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_10.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        283 => { // "module"
            let children = resolve_children(node, &["body", "name"])?;
            let field_0 = resolve_field(node, "body", false)?;
            let field_1 = resolve_field(node, "name", true)?;
            let template = ModuleTemplate {
                body: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        178 => { // "named_imports"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = NamedImportsTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        168 => { // "namespace_export"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = NamespaceExportTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        177 => { // "namespace_import"
            let children = resolve_children(node, &["identifier"])?;
            let field_0 = resolve_field(node, "identifier", true)?;
            let template = NamespaceImportTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        219 => { // "nested_identifier"
            let children = resolve_children(node, &["object", "property"])?;
            let field_0 = resolve_field(node, "object", true)?;
            let field_1 = resolve_field(node, "property", true)?;
            let template = NestedIdentifierTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        287 => { // "nested_type_identifier"
            let children = resolve_children(node, &["module", "name"])?;
            let field_0 = resolve_field(node, "module", true)?;
            let field_1 = resolve_field(node, "name", true)?;
            let template = NestedTypeIdentifierTemplate {
                module: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        232 => { // "new_expression"
            let children = resolve_children(node, &["arguments", "constructor", "type_arguments"])?;
            let field_0 = resolve_field(node, "arguments", false)?;
            let field_1 = resolve_field(node, "constructor", true)?;
            let field_2 = resolve_field(node, "type_arguments", false)?;
            let template = NewExpressionTemplate {
                arguments: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                constructor: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_arguments: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        268 => { // "non_null_expression"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = NonNullExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        216 => { // "object_assignment_pattern"
            let children = resolve_children(node, &["left", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "right", true)?;
            let template = ObjectAssignmentPatternTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        214 => { // "object_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ObjectPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        337 => { // "object_type"
            let children = resolve_children(node, &["closing", "members", "opening"])?;
            let field_0 = resolve_field(node, "closing", true)?;
            let field_1 = resolve_field(node, "members", false)?;
            let field_2 = resolve_field(node, "opening", true)?;
            let field_1_renderables = field_1.renderable_items();
            let template = ObjectTypeTemplate {
                closing: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                members: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                opening: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        213 => { // "object"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ObjectTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        299 => { // "omitting_type_annotation"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = OmittingTypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        301 => { // "opting_type_annotation"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = OptingTypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        297 => { // "optional_parameter"
            let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
            let field_0 = resolve_field(node, "decorator", false)?;
            let field_1 = resolve_field(node, "pattern", true)?;
            let field_2 = resolve_field(node, "readonly_marker", false)?;
            let field_3 = resolve_field(node, "type", false)?;
            let field_4 = resolve_field(node, "value", false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = OptionalParameterTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                decorator: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                readonly_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
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
        309 => { // "optional_tuple_parameter"
            let children = resolve_children(node, &["name", "type"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "type", true)?;
            let template = OptionalTupleParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        310 => { // "optional_type"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = OptionalTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        263 => { // "pair_pattern"
            let children = resolve_children(node, &["key", "value"])?;
            let field_0 = resolve_field(node, "key", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = PairPatternTemplate {
                key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        262 => { // "pair"
            let children = resolve_children(node, &["key", "value"])?;
            let field_0 = resolve_field(node, "key", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = PairTemplate {
                key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        209 => { // "parenthesized_expression"
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
            template.render_into(dest)
        }
        334 => { // "parenthesized_type"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = ParenthesizedTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        166 => { // "program"
            let children = resolve_children(node, &["hash_bang_line", "statements"])?;
            let field_0 = resolve_field(node, "hash_bang_line", false)?;
            let field_1 = resolve_field(node, "statements", false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = ProgramTemplate {
                hash_bang_line: match field_0.kind {
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
        339 => { // "property_signature"
            let children = resolve_children(node, &["accessibility_modifier", "name", "optional_marker", "override_modifier", "readonly_marker", "static_marker", "type"])?;
            let field_0 = resolve_field(node, "accessibility_modifier", false)?;
            let field_1 = resolve_field(node, "name", true)?;
            let field_2 = resolve_field(node, "optional_marker", false)?;
            let field_3 = resolve_field(node, "override_modifier", false)?;
            let field_4 = resolve_field(node, "readonly_marker", false)?;
            let field_5 = resolve_field(node, "static_marker", false)?;
            let field_6 = resolve_field(node, "type", false)?;
            let template = PropertySignatureTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                optional_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                override_modifier: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
                readonly_marker: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                static_marker: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                type_: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        266 => { // "public_field_definition"
            let children = resolve_children(node, &["decorator", "name", "optionality_marker", "type", "value"])?;
            let field_0 = resolve_field(node, "decorator", false)?;
            let field_1 = resolve_field(node, "name", true)?;
            let field_2 = resolve_field(node, "optionality_marker", false)?;
            let field_3 = resolve_field(node, "type", false)?;
            let field_4 = resolve_field(node, "value", false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = PublicFieldDefinitionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                decorator: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                optionality_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
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
        348 => { // "readonly_type"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = ReadonlyTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        250 => { // "regex"
            let children = resolve_children(node, &["flags", "pattern"])?;
            let field_0 = resolve_field(node, "flags", false)?;
            let field_1 = resolve_field(node, "pattern", true)?;
            let template = RegexTemplate {
                flags: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        296 => { // "required_parameter"
            let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
            let field_0 = resolve_field(node, "decorator", false)?;
            let field_1 = resolve_field(node, "pattern", true)?;
            let field_2 = resolve_field(node, "readonly_marker", false)?;
            let field_3 = resolve_field(node, "type", false)?;
            let field_4 = resolve_field(node, "value", false)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = RequiredParameterTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                decorator: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                readonly_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
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
        260 => { // "rest_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = RestPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        311 => { // "rest_type"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = RestTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        200 => { // "return_statement"
            let children = resolve_children(node, &["semicolon"])?;
            let field_0 = resolve_field(node, "semicolon", true)?;
            let children_renderables = children.renderable_items();
            let template = ReturnStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        275 => { // "satisfies_expression"
            let children = resolve_children(node, &["expression", "type_annotation"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let field_1 = resolve_field(node, "type_annotation", true)?;
            let template = SatisfiesExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_annotation: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        246 => { // "sequence_expression"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = SequenceExpressionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        241 => { // "spread_element"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = SpreadElementTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        186 => { // "statement_block"
            let children = resolve_children(node, &["automatic_semicolon", "statements"])?;
            let field_0 = resolve_field(node, "automatic_semicolon", false)?;
            let field_1 = resolve_field(node, "statements", false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = StatementBlockTemplate {
                automatic_semicolon: match field_0.kind {
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
        247 => { // "string"
            let children = resolve_children(node, &["closing", "contents", "opening"])?;
            let field_0 = resolve_field(node, "closing", true)?;
            let field_1 = resolve_field(node, "contents", false)?;
            let field_2 = resolve_field(node, "opening", true)?;
            let children_renderables = children.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = StringTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                closing: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                contents: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                opening: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        235 => { // "subscript_expression"
            let children = resolve_children(node, &["index", "object", "optional_chain"])?;
            let field_0 = resolve_field(node, "index", true)?;
            let field_1 = resolve_field(node, "object", true)?;
            let field_2 = resolve_field(node, "optional_chain", false)?;
            let template = SubscriptExpressionTemplate {
                index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                optional_chain: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        204 => { // "switch_body"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = SwitchBodyTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        205 => { // "switch_case"
            let children = resolve_children(node, &["body", "value"])?;
            let field_0 = resolve_field(node, "body", false)?;
            let field_1 = resolve_field(node, "value", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = SwitchCaseTemplate {
                body: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        206 => { // "switch_default"
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = SwitchDefaultTemplate {
                body: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        189 => { // "switch_statement"
            let children = resolve_children(node, &["body", "value"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = SwitchStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        316 => { // "template_literal_type"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TemplateLiteralTypeTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        248 => { // "template_string"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TemplateStringTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        249 => { // "template_substitution"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TemplateSubstitutionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        315 => { // "template_type"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TemplateTypeTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        242 => { // "ternary_expression"
            let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
            let field_0 = resolve_field(node, "alternative", true)?;
            let field_1 = resolve_field(node, "condition", true)?;
            let field_2 = resolve_field(node, "consequence", true)?;
            let template = TernaryExpressionTemplate {
                alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        201 => { // "throw_statement"
            let children = resolve_children(node, &["semicolon"])?;
            let field_0 = resolve_field(node, "semicolon", true)?;
            let children_renderables = children.renderable_items();
            let template = ThrowStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        195 => { // "try_statement"
            let children = resolve_children(node, &["body", "finalizer", "handler"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "finalizer", false)?;
            let field_2 = resolve_field(node, "handler", false)?;
            let template = TryStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                finalizer: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                handler: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        308 => { // "tuple_parameter"
            let children = resolve_children(node, &["name", "type"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "type", true)?;
            let template = TupleParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        347 => { // "tuple_type"
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
            template.render_into(dest)
        }
        293 => { // "type_alias_declaration"
            let children = resolve_children(node, &["name", "semicolon", "type_parameters", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "semicolon", true)?;
            let field_2 = resolve_field(node, "type_parameters", false)?;
            let field_3 = resolve_field(node, "value", true)?;
            let template = TypeAliasDeclarationTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_parameters: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        302 => { // "type_annotation"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = TypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        336 => { // "type_arguments"
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
            template.render_into(dest)
        }
        273 => { // "type_assertion"
            let children = resolve_children(node, &["expression", "type_arguments"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let field_1 = resolve_field(node, "type_arguments", true)?;
            let template = TypeAssertionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        341 => { // "type_parameter"
            let children = resolve_children(node, &["const_marker", "constraint", "name", "value"])?;
            let field_0 = resolve_field(node, "const_marker", false)?;
            let field_1 = resolve_field(node, "constraint", false)?;
            let field_2 = resolve_field(node, "name", true)?;
            let field_3 = resolve_field(node, "value", false)?;
            let template = TypeParameterTemplate {
                const_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                constraint: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                value: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        340 => { // "type_parameters"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TypeParametersTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        321 => { // "type_predicate_annotation"
            let children = resolve_children(node, &["type_predicate"])?;
            let field_0 = resolve_field(node, "type_predicate", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TypePredicateAnnotationTemplate {
                type_predicate: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        320 => { // "type_predicate"
            let children = resolve_children(node, &["name", "type"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "type", true)?;
            let template = TypePredicateTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        326 => { // "type_query"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TypeQueryTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        244 => { // "unary_expression"
            let children = resolve_children(node, &["argument", "operator"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let template = UnaryExpressionTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        349 => { // "union_type"
            let children = resolve_children(node, &["left", "right"])?;
            let field_0 = resolve_field(node, "left", false)?;
            let field_1 = resolve_field(node, "right", true)?;
            let template = UnionTypeTemplate {
                left: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        245 => { // "update_expression"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = UpdateExpressionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        183 => { // "variable_declaration"
            let children = resolve_children(node, &["declarators", "semicolon"])?;
            let field_0 = resolve_field(node, "declarators", true)?;
            let field_1 = resolve_field(node, "semicolon", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = VariableDeclarationTemplate {
                declarators: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        185 => { // "variable_declarator"
            let children = resolve_children(node, &["name", "type", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "type", false)?;
            let field_2 = resolve_field(node, "value", false)?;
            let template = VariableDeclaratorTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                value: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        193 => { // "while_statement"
            let children = resolve_children(node, &["body", "condition"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "condition", true)?;
            let template = WhileStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        196 => { // "with_statement"
            let children = resolve_children(node, &["body", "object"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "object", true)?;
            let template = WithStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        212 => { // "yield_expression"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", false)?;
            let children_renderables = children.renderable_items();
            let template = YieldExpressionTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                expression: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        _ => token_shaped_fallback_into(node, dest),
    }
}
