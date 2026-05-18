// @generated from packages/typescript/node-model.json5 and packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
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
        (281, 369) => Some("declaration"), // ("ambient_declaration", "ambient_declaration_declaration")
        (281, 352) => Some("global"), // ("ambient_declaration", "ambient_declaration_global")
        (281, 353) => Some("module"), // ("ambient_declaration", "ambient_declaration_module")
        (227, 359) => Some("_call_signature"), // ("arrow_function", "arrow_function__call_signature")
        (227, 358) => Some("parameter"), // ("arrow_function", "arrow_function_parameter")
        (231, 385) => Some("call"), // ("call_expression", "call_expression_call")
        (231, 387) => Some("member"), // ("call_expression", "call_expression_member")
        (231, 386) => Some("template_call"), // ("call_expression", "call_expression_template_call")
        (222, 360) => Some("extends_clause"), // ("class_heritage", "class_heritage_extends_clause")
        (222, 361) => Some("implements_clause"), // ("class_heritage", "class_heritage_implements_clause")
        (167, 354) => Some("default"), // ("export_statement", "export_statement_default")
        (167, 383) => Some("equals_export"), // ("export_statement", "export_statement_equals_export")
        (167, 384) => Some("namespace_export"), // ("export_statement", "export_statement_namespace_export")
        (167, 382) => Some("type_export"), // ("export_statement", "export_statement_type_export")
        (175, 364) => Some("default_import"), // ("import_clause", "import_clause_default_import")
        (175, 363) => Some("named_imports"), // ("import_clause", "import_clause_named_imports")
        (175, 362) => Some("namespace_import"), // ("import_clause", "import_clause_namespace_import")
        (179, 366) => Some("as"), // ("import_specifier", "import_specifier_as")
        (179, 365) => Some("name"), // ("import_specifier", "import_specifier_name")
        (345, 367) => Some("colon"), // ("index_signature", "index_signature_colon")
        (345, 368) => Some("mapped_type_clause"), // ("index_signature", "index_signature_mapped_type_clause")
        (209, 381) => Some("sequence"), // ("parenthesized_expression", "parenthesized_expression_sequence")
        (209, 380) => Some("typed"), // ("parenthesized_expression", "parenthesized_expression_typed")
        (245, 388) => Some("postfix"), // ("update_expression", "update_expression_postfix")
        (245, 389) => Some("prefix"), // ("update_expression", "update_expression_prefix")
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
        369 => { // "_ambient_declaration_declaration" | "ambient_declaration_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("declaration"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = _AmbientDeclarationDeclarationTemplate {
                declaration: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        352 => { // "_ambient_declaration_global" | "ambient_declaration_global"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = AmbientDeclarationGlobalTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        353 => { // "_ambient_declaration_module" | "ambient_declaration_module"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = AmbientDeclarationModuleTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        359 => { // "_arrow_function__call_signature" | "arrow_function__call_signature"
            let field_0 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
        358 => { // "_arrow_function_parameter" | "arrow_function_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("parameter"), true)?;
            let template = _ArrowFunctionParameterTemplate {
                parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        385 => { // "_call_expression_call" | "call_expression_call"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_arguments"), false)?;
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
        387 => { // "_call_expression_member" | "call_expression_member"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_arguments"), false)?;
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
        386 => { // "_call_expression_template_call" | "call_expression_template_call"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let template = CallExpressionTemplateCallTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        376 => { // "_class_body_member" | "class_body_member"
            let field_0 = resolve_slot(node, SlotAccessor::Field("abstract_method_signature"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("index_signature"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("method_signature"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("public_field_definition"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = ClassBodyMemberTemplate {
                abstract_method_signature: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                index_signature: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                method_signature: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                public_field_definition: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
            };
            template.render_into(dest)
        }
        375 => { // "_class_body_method_sig" | "class_body_method_sig"
            let field_0 = resolve_slot(node, SlotAccessor::Field("function_signature_automatic_semicolon"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("method_signature"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ClassBodyMethodSigTemplate {
                function_signature_automatic_semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                method_signature: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        374 => { // "_class_body_method" | "class_body_method"
            let field_0 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("method_definition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("semicolon"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = ClassBodyMethodTemplate {
                decorator: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                method_definition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                semicolon: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        360 => { // "_class_heritage_extends_clause" | "class_heritage_extends_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("extends_clause"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("implements_clause"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = _ClassHeritageExtendsClauseTemplate {
                extends_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                implements_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        361 => { // "_class_heritage_implements_clause" | "class_heritage_implements_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("implements_clause"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = _ClassHeritageImplementsClauseTemplate {
                implements_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        373 => { // "_export_statement_default_decl_arm_default_kw_value" | "export_statement_default_decl_arm_default_kw_value"
            let field_0 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        357 => { // "_export_statement_default_decl_arm_default_kw" | "export_statement_default_decl_arm_default_kw"
            let field_0 = resolve_slot(node, SlotAccessor::Field("declaration"), false)?;
            let template = ExportStatementDefaultDeclArmDefaultKwTemplate {
                declaration: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        356 => { // "_export_statement_default_decl_arm" | "export_statement_default_decl_arm"
            let field_0 = resolve_slot(node, SlotAccessor::Field("declaration"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = ExportStatementDefaultDeclArmTemplate {
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
        372 => { // "_export_statement_default_from_arm_clause_from" | "export_statement_default_from_arm_clause_from"
            let field_0 = resolve_slot(node, SlotAccessor::Field("export_clause"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("source"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ExportStatementDefaultFromArmClauseFromTemplate {
                export_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        371 => { // "_export_statement_default_from_arm_ns_from" | "export_statement_default_from_arm_ns_from"
            let field_0 = resolve_slot(node, SlotAccessor::Field("namespace_export"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("source"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ExportStatementDefaultFromArmNsFromTemplate {
                namespace_export: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        370 => { // "_export_statement_default_from_arm_star_from" | "export_statement_default_from_arm_star_from"
            let field_0 = resolve_slot(node, SlotAccessor::Field("source"), true)?;
            let template = ExportStatementDefaultFromArmStarFromTemplate {
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        355 => { // "_export_statement_default_from_arm" | "export_statement_default_from_arm"
            let field_0 = resolve_slot(node, SlotAccessor::Field("export_clause"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("export_statement_default_from_arm_clause_from"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("export_statement_default_from_arm_ns_from"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("export_statement_default_from_arm_star_from"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = ExportStatementDefaultFromArmTemplate {
                export_clause: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                export_statement_default_from_arm_clause_from: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                export_statement_default_from_arm_ns_from: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                export_statement_default_from_arm_star_from: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
            };
            template.render_into(dest)
        }
        383 => { // "_export_statement_equals_export" | "export_statement_equals_export"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = _ExportStatementEqualsExportTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        384 => { // "_export_statement_namespace_export" | "export_statement_namespace_export"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = _ExportStatementNamespaceExportTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        382 => { // "_export_statement_type_export" | "export_statement_type_export"
            let field_0 = resolve_slot(node, SlotAccessor::Field("export_clause"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("source"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = _ExportStatementTypeExportTemplate {
                export_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                source: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        379 => { // "_for_header_let_const_kind" | "for_header_let_const_kind"
            let field_0 = resolve_slot(node, SlotAccessor::Field("automatic_semicolon"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("kind"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ForHeaderLetConstKindTemplate {
                automatic_semicolon: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                kind: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        377 => { // "_for_header_lhs" | "for_header_lhs"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let template = ForHeaderLhsTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        378 => { // "_for_header_var_kind" | "for_header_var_kind"
            let field_0 = resolve_slot(node, SlotAccessor::Field("kind"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
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
        364 => { // "_import_clause_default_import" | "import_clause_default_import"
            let field_0 = resolve_slot(node, SlotAccessor::Field("import_identifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("named_imports"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("namespace_import"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = _ImportClauseDefaultImportTemplate {
                import_identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                named_imports: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                namespace_import: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        363 => { // "_import_clause_named_imports" | "import_clause_named_imports"
            let field_0 = resolve_slot(node, SlotAccessor::Field("named_imports"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = _ImportClauseNamedImportsTemplate {
                named_imports: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        362 => { // "_import_clause_namespace_import" | "import_clause_namespace_import"
            let field_0 = resolve_slot(node, SlotAccessor::Field("namespace_import"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = _ImportClauseNamespaceImportTemplate {
                namespace_import: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        366 => { // "_import_specifier_as" | "import_specifier_as"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = ImportSpecifierAsTemplate {
                alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        365 => { // "_import_specifier_name" | "import_specifier_name"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = _ImportSpecifierNameTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        367 => { // "_index_signature_colon" | "index_signature_colon"
            let field_0 = resolve_slot(node, SlotAccessor::Field("index_type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = IndexSignatureColonTemplate {
                index_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        368 => { // "_index_signature_mapped_type_clause" | "index_signature_mapped_type_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("mapped_type_clause"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = _IndexSignatureMappedTypeClauseTemplate {
                mapped_type_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        239 => { // "_initializer"
            let field_0 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = InitializerTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        331 | 105 => { // "_number" | "number"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = _NumberTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        381 => { // "_parenthesized_expression_sequence" | "parenthesized_expression_sequence"
            let field_0 = resolve_slot(node, SlotAccessor::Field("sequence_expression"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = _ParenthesizedExpressionSequenceTemplate {
                sequence_expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        380 => { // "_parenthesized_expression_typed" | "parenthesized_expression_typed"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ParenthesizedExpressionTypedTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        416 => { // "_public_field_definition_abstract_first" | "public_field_definition_abstract_first"
            let field_0 = resolve_slot(node, SlotAccessor::Field("abstract_marker"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let template = PublicFieldDefinitionAbstractFirstTemplate {
                abstract_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                readonly_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        417 => { // "_public_field_definition_access_first" | "public_field_definition_access_first"
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("declare_marker"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = PublicFieldDefinitionAccessFirstTemplate {
                accessibility_modifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                declare_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        418 => { // "_public_field_definition_accessor_opt" | "public_field_definition_accessor_opt"
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessor_marker"), true)?;
            let template = PublicFieldDefinitionAccessorOptTemplate {
                accessor_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        419 => { // "_public_field_definition_declare_first" | "public_field_definition_declare_first"
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = PublicFieldDefinitionDeclareFirstTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        420 => { // "_public_field_definition_readonly_first" | "public_field_definition_readonly_first"
            let field_0 = resolve_slot(node, SlotAccessor::Field("abstract_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), true)?;
            let template = PublicFieldDefinitionReadonlyFirstTemplate {
                abstract_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                readonly_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        421 => { // "_public_field_definition_static_mods" | "public_field_definition_static_mods"
            let field_0 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("static_marker"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = PublicFieldDefinitionStaticModsTemplate {
                override_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                readonly_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                static_marker: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        304 => { // "_type_query_call_expression_in_type_annotation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let template = TypeQueryCallExpressionInTypeAnnotationTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        324 => { // "_type_query_call_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let template = TypeQueryCallExpressionTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        325 => { // "_type_query_instantiation_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = TypeQueryInstantiationExpressionTemplate {
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        303 => { // "_type_query_member_expression_in_type_annotation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("property"), true)?;
            let template = TypeQueryMemberExpressionInTypeAnnotationTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        322 => { // "_type_query_member_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("property"), true)?;
            let template = TypeQueryMemberExpressionTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        323 => { // "_type_query_subscript_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("index"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let template = TypeQuerySubscriptExpressionTemplate {
                index: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        388 => { // "_update_expression_postfix" | "update_expression_postfix"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = UpdateExpressionPostfixTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        389 => { // "_update_expression_prefix" | "update_expression_prefix"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = UpdateExpressionPrefixTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        282 => { // "abstract_class_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("class_heritage"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("accessor_kind"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("optional_marker"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_7 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = AddingTypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        281 => { // "ambient_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("ambient_declaration_declaration"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("ambient_declaration_global"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("ambient_declaration_module"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = AmbientDeclarationTemplate {
                variant,
                ambient_declaration_declaration: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                ambient_declaration_global: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                ambient_declaration_module: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        252 => { // "arguments"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("spread_element"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ArgumentsTemplate {
                expression: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                spread_element: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        218 => { // "array_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("assignment_pattern"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ArrayPatternTemplate {
                assignment_pattern: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pattern: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        346 => { // "array_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("primary_type"), true)?;
            let template = ArrayTypeTemplate {
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        217 => { // "array"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("spread_element"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ArrayTemplate {
                expression: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                spread_element: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        227 => { // "arrow_function"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arrow_function__call_signature"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("arrow_function_parameter"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ArrowFunctionTemplate {
                variant,
                arrow_function__call_signature: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                arrow_function_parameter: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                async_marker: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        274 => { // "as_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_annotation"), true)?;
            let field_1_renderables = field_1.renderable_items();
            let template = AsExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                type_annotation: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        306 => { // "asserts_annotation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("asserts"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = AssertsAnnotationTemplate {
                asserts: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        305 => { // "asserts"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("this"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_predicate"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = AssertsTemplate {
                identifier: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                this: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                type_predicate: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        236 => { // "assignment_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("using_marker"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = AssignmentPatternTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        238 => { // "augmented_assignment_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = AugmentedAssignmentExpressionTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        233 => { // "await_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = AwaitExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        243 => { // "binary_expression"
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
        197 => { // "break_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("call_expression_call"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("call_expression_member"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("call_expression_template_call"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = CallExpressionTemplate {
                variant,
                call_expression_call: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                call_expression_member: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                call_expression_template_call: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        338 => { // "call_signature"
            let field_0 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parameter"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("class_body_member"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("class_body_method"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("class_body_method_sig"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("class_static_block"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let template = ClassBodyTemplate {
                class_body_member: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                class_body_method: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                class_body_method_sig: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                class_static_block: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        221 => { // "class_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("automatic_semicolon"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("class_heritage"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("class_heritage_extends_clause"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("class_heritage_implements_clause"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ClassHeritageTemplate {
                variant,
                class_heritage_extends_clause: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                class_heritage_implements_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        258 => { // "class_static_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("automatic_semicolon"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ClassStaticBlockTemplate {
                automatic_semicolon: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        220 => { // "class"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("class_heritage"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("name"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = ComputedPropertyNameTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        318 => { // "conditional_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = ConditionalTypeTemplate {
                alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        343 => { // "constraint"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = ConstraintTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        344 => { // "construct_signature"
            let field_0 = resolve_slot(node, SlotAccessor::Field("abstract_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("abstract_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("label"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let template = DebuggerStatementTemplate {
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        255 => { // "decorator_call_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_arguments"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("property"), true)?;
            let template = DecoratorMemberExpressionTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        272 => { // "decorator_parenthesized_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("call_expression"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("member_expression"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = DecoratorParenthesizedExpressionTemplate {
                call_expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                member_expression: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        253 => { // "decorator"
            let field_0 = resolve_slot(node, SlotAccessor::Field("call_expression"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("member_expression"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("parenthesized_expression"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let template = DecoratorTemplate {
                call_expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                member_expression: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                parenthesized_expression: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        342 => { // "default_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = DefaultTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        194 => { // "do_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("semicolon"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("statement"), true)?;
            let template = ElseClauseTemplate {
                statement: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        292 => { // "enum_assignment"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = EnumAssignmentTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        291 => { // "enum_body"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = EnumBodyTemplate {
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("const_marker"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("export_specifier"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ExportClauseTemplate {
                export_specifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        170 => { // "export_specifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("export_kind"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("export_statement_default"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("export_statement_equals_export"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("export_statement_namespace_export"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("export_statement_type_export"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let template = ExportStatementTemplate {
                variant,
                export_statement_default: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                export_statement_equals_export: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                export_statement_namespace_export: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                export_statement_type_export: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        182 => { // "expression_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expressions"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ExpressionStatementTemplate {
                expressions: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        278 => { // "extends_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type_arguments"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = FinallyClauseTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        333 => { // "flow_maybe_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("primary_type"), true)?;
            let template = FlowMaybeTypeTemplate {
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        191 => { // "for_in_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("await_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("for_header_let_const_kind"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("for_header_lhs"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("for_header_var_kind"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = ForInStatementTemplate {
                await_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                for_header_let_const_kind: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                for_header_lhs: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                for_header_var_kind: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
            };
            template.render_into(dest)
        }
        190 => { // "for_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("increment"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("initializer"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("formal_parameter"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = FormalParametersTemplate {
                formal_parameter: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        224 => { // "function_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("automatic_semicolon"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = FunctionDeclarationTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                automatic_semicolon: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                return_type: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                type_parameters: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        223 => { // "function_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function_signature_automatic_semicolon"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_5_renderables = field_5.renderable_items();
            let template = FunctionSignatureTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                function_signature_automatic_semicolon: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                return_type: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                type_parameters: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        351 => { // "function_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("return_type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("automatic_semicolon"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = GeneratorFunctionDeclarationTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                automatic_semicolon: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                parameters: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                return_type: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                type_parameters: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        225 => { // "generator_function"
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = GenericTypeTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        188 => { // "if_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ImplementsClauseTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        286 => { // "import_alias"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("nested_identifier"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = ImportAliasTemplate {
                identifier: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                nested_identifier: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
            };
            template.render_into(dest)
        }
        180 => { // "import_attribute"
            let field_0 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ImportAttributeTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        175 => { // "import_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("import_clause_default_import"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("import_clause_named_imports"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("import_clause_namespace_import"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = ImportClauseTemplate {
                variant,
                import_clause_default_import: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                import_clause_named_imports: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                import_clause_namespace_import: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        277 => { // "import_require_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("source"), true)?;
            let template = ImportRequireClauseTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                source: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        179 => { // "import_specifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("import_kind"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("import_specifier_as"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("import_specifier_name"), false)?;
            let variant = resolve_variant(node);
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = ImportSpecifierTemplate {
                variant,
                import_kind: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                import_specifier_as: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                import_specifier_name: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        174 => { // "import_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("import_attribute"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("import_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("import_require_clause"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("source"), false)?;
            let field_2_renderables = field_2.renderable_items();
            let template = ImportStatementTemplate {
                import_attribute: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                import_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                import_require_clause: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                source: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        345 => { // "index_signature"
            let field_0 = resolve_slot(node, SlotAccessor::Field("index_signature_colon"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("index_signature_mapped_type_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("sign"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = IndexSignatureTemplate {
                variant,
                index_signature_colon: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                index_signature_mapped_type_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                sign: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
            };
            template.render_into(dest)
        }
        327 => { // "index_type_query"
            let field_0 = resolve_slot(node, SlotAccessor::Field("primary_type"), true)?;
            let template = IndexTypeQueryTemplate {
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        317 => { // "infer_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_identifier"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = InstantiationExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        288 => { // "interface_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("extends_type_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type1"), false)?;
            let template = IntersectionTypeTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type1: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        203 => { // "labeled_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("label"), true)?;
            let template = LabeledStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                label: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        184 => { // "lexical_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("declarators"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("kind"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("false"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("null"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("number"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("string"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("true"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("unary_expression"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("undefined"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let field_5_renderables = field_5.renderable_items();
            let field_6_renderables = field_6.renderable_items();
            let template = LiteralTypeTemplate {
                false_: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                null: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                number: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                string: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                true_: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
                unary_expression: ListNonterminalView {
                    items: field_5_renderables.as_slice(),
                    separator: field_5.separator,
                    leading: field_5.leading_sep,
                    trailing: field_5.trailing_sep,
                },
                undefined: ListNonterminalView {
                    items: field_6_renderables.as_slice(),
                    separator: field_6.separator,
                    leading: field_6.leading_sep,
                    trailing: field_6.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        328 => { // "lookup_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("index_type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("primary_type"), true)?;
            let template = LookupTypeTemplate {
                index_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        329 => { // "mapped_type_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("property"), true)?;
            let template = MemberExpressionTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        261 => { // "method_definition"
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("accessor_kind"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("optional_marker"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_7 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_8 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let field_9 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_10 = resolve_slot(node, SlotAccessor::Field("static_marker"), false)?;
            let field_11 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("accessor_kind"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("optional_marker"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_7 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let field_8 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_9 = resolve_slot(node, SlotAccessor::Field("static_marker"), false)?;
            let field_10 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("import_specifier"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = NamedImportsTemplate {
                import_specifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        168 => { // "namespace_export"
            let field_0 = resolve_slot(node, SlotAccessor::Field("module_export_name"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = NamespaceExportTemplate {
                module_export_name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        177 => { // "namespace_import"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let template = NamespaceImportTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        219 => { // "nested_identifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("property"), true)?;
            let template = NestedIdentifierTemplate {
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                property: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        287 => { // "nested_type_identifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("module"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = NestedTypeIdentifierTemplate {
                module: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        232 => { // "new_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("constructor"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_arguments"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = NonNullExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        216 => { // "object_assignment_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = ObjectAssignmentPatternTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        214 => { // "object_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("object_assignment_pattern"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pair_pattern"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("rest_pattern"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("shorthand_property_identifier_pattern"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let template = ObjectPatternTemplate {
                object_assignment_pattern: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pair_pattern: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                rest_pattern: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                shorthand_property_identifier_pattern: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        337 => { // "object_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("closing"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("members"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("opening"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("method_definition"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pair"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("shorthand_property_identifier"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("spread_element"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let template = ObjectTemplate {
                method_definition: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                pair: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                shorthand_property_identifier: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                spread_element: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        299 => { // "omitting_type_annotation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = OmittingTypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        301 => { // "opting_type_annotation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = OptingTypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        297 => { // "optional_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = OptionalParameterTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                decorator: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                override_modifier: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                readonly_marker: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                type_: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                value: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        309 => { // "optional_tuple_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = OptionalTupleParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        310 => { // "optional_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = OptionalTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        263 => { // "pair_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("key"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = PairPatternTemplate {
                key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        262 => { // "pair"
            let field_0 = resolve_slot(node, SlotAccessor::Field("key"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = PairTemplate {
                key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        209 => { // "parenthesized_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("parenthesized_expression_sequence"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parenthesized_expression_typed"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ParenthesizedExpressionTemplate {
                variant,
                parenthesized_expression_sequence: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                parenthesized_expression_typed: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        334 => { // "parenthesized_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = ParenthesizedTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        166 => { // "program"
            let field_0 = resolve_slot(node, SlotAccessor::Field("hash_bang_line"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("statements"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("optional_marker"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("static_marker"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("optionality_marker"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("public_field_definition_abstract_first"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("public_field_definition_access_first"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("public_field_definition_accessor_opt"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("public_field_definition_declare_first"), false)?;
            let field_7 = resolve_slot(node, SlotAccessor::Field("public_field_definition_readonly_first"), false)?;
            let field_8 = resolve_slot(node, SlotAccessor::Field("public_field_definition_static_mods"), false)?;
            let field_9 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_10 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let field_5_renderables = field_5.renderable_items();
            let field_6_renderables = field_6.renderable_items();
            let field_7_renderables = field_7.renderable_items();
            let field_8_renderables = field_8.renderable_items();
            let template = PublicFieldDefinitionTemplate {
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
                public_field_definition_abstract_first: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                public_field_definition_access_first: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
                public_field_definition_accessor_opt: ListNonterminalView {
                    items: field_5_renderables.as_slice(),
                    separator: field_5.separator,
                    leading: field_5.leading_sep,
                    trailing: field_5.trailing_sep,
                },
                public_field_definition_declare_first: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
                public_field_definition_readonly_first: ListNonterminalView {
                    items: field_7_renderables.as_slice(),
                    separator: field_7.separator,
                    leading: field_7.leading_sep,
                    trailing: field_7.trailing_sep,
                },
                public_field_definition_static_mods: match field_8.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_8.as_scalar())),
                },
                type_: match field_9.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_9.as_scalar())),
                },
                value: match field_10.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_10.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        348 => { // "readonly_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = ReadonlyTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        250 => { // "regex"
            let field_0 = resolve_slot(node, SlotAccessor::Field("flags"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("accessibility_modifier"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("decorator"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("override_modifier"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("pattern"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("readonly_marker"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_6 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = RequiredParameterTemplate {
                accessibility_modifier: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                decorator: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                override_modifier: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
                pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                readonly_marker: match field_4.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
                },
                type_: match field_5.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
                },
                value: match field_6.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_6.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        260 => { // "rest_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("destructuring_pattern"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("identifier"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("member_expression"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("non_null_expression"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("subscript_expression"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = RestPatternTemplate {
                destructuring_pattern: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                identifier: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                member_expression: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                non_null_expression: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                subscript_expression: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        311 => { // "rest_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = RestTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        200 => { // "return_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expressions"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ReturnStatementTemplate {
                expressions: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        275 => { // "satisfies_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_annotation"), true)?;
            let template = SatisfiesExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_annotation: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        246 => { // "sequence_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = SequenceExpressionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        241 => { // "spread_element"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = SpreadElementTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        186 => { // "statement_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("automatic_semicolon"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("statements"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("closing"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("contents"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("escape_sequence"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("opening"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("string_fragment"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let template = StringTemplate {
                closing: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                contents: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                escape_sequence: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                opening: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                string_fragment: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        235 => { // "subscript_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("index"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("optional_chain"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("switch_case"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("switch_default"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = SwitchBodyTemplate {
                switch_case: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                switch_default: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        205 => { // "switch_case"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = SwitchStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        316 => { // "template_literal_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("string_fragment"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("template_type"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = TemplateLiteralTypeTemplate {
                string_fragment: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                template_type: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        248 => { // "template_string"
            let field_0 = resolve_slot(node, SlotAccessor::Field("escape_sequence"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("string_fragment"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("template_substitution"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = TemplateStringTemplate {
                escape_sequence: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                string_fragment: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                template_substitution: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        249 => { // "template_substitution"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expressions"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TemplateSubstitutionTemplate {
                expressions: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        315 => { // "template_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("infer_type"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("primary_type"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = TemplateTypeTemplate {
                infer_type: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                primary_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        242 => { // "ternary_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
            let template = TernaryExpressionTemplate {
                alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        201 => { // "throw_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expressions"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ThrowStatementTemplate {
                expressions: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                semicolon: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        195 => { // "try_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("finalizer"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("handler"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = TupleParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        347 => { // "tuple_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("tuple_type_member"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TupleTypeTemplate {
                tuple_type_member: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        293 => { // "type_alias_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = TypeAnnotationTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        336 => { // "type_arguments"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TypeArgumentsTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        273 => { // "type_assertion"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_arguments"), true)?;
            let template = TypeAssertionTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        341 => { // "type_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("const_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("constraint"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("type_parameter"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TypeParametersTemplate {
                type_parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        321 => { // "type_predicate_annotation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type_predicate"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = TypePredicateAnnotationTemplate {
                type_predicate: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        320 => { // "type_predicate"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = TypePredicateTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        326 => { // "type_query"
            let field_0 = resolve_slot(node, SlotAccessor::Field("call_expression"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("identifier"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("instantiation_expression"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("member_expression"), false)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("subscript_expression"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("this"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let field_3_renderables = field_3.renderable_items();
            let field_4_renderables = field_4.renderable_items();
            let field_5_renderables = field_5.renderable_items();
            let template = TypeQueryTemplate {
                call_expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                identifier: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                instantiation_expression: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                member_expression: ListNonterminalView {
                    items: field_3_renderables.as_slice(),
                    separator: field_3.separator,
                    leading: field_3.leading_sep,
                    trailing: field_3.trailing_sep,
                },
                subscript_expression: ListNonterminalView {
                    items: field_4_renderables.as_slice(),
                    separator: field_4.separator,
                    leading: field_4.leading_sep,
                    trailing: field_4.trailing_sep,
                },
                this: ListNonterminalView {
                    items: field_5_renderables.as_slice(),
                    separator: field_5.separator,
                    leading: field_5.leading_sep,
                    trailing: field_5.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        244 => { // "unary_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = UnaryExpressionTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        349 => { // "union_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type1"), false)?;
            let template = UnionTypeTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type1: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        245 => { // "update_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("update_expression_postfix"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("update_expression_prefix"), false)?;
            let variant = resolve_variant(node);
            let field_0_renderables = field_0.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = UpdateExpressionTemplate {
                variant,
                update_expression_postfix: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                update_expression_prefix: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        183 => { // "variable_declaration"
            let field_0 = resolve_slot(node, SlotAccessor::Field("declarators"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("semicolon"), true)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
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
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let template = WhileStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        196 => { // "with_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let template = WithStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        212 => { // "yield_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), false)?;
            let template = YieldExpressionTemplate {
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
