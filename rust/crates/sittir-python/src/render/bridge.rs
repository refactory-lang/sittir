// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
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
        246 => "\n", // "_match_block_block"
        110 => ";", // "_simple_statements"
        245 => ",", // "_with_clause_paren"
        157 => ",", // "argument_list"
        121 => ",", // "assert_statement"
        160 => "\n", // "block"
        136 => ",", // "case_clause"
        173 => ",", // "class_pattern"
        169 => ",", // "dict_pattern"
        218 => ",", // "dictionary"
        162 => ".", // "dotted_name"
        140 => ",", // "except_clause"
        152 => ",", // "exec_statement"
        161 => ",", // "expression_list"
        243 => ",", // "expression_statement_tuple"
        227 => ",", // "for_in_clause"
        114 => ",", // "future_import_statement"
        150 => ",", // "global_statement"
        115 => ",", // "import_from_statement"
        111 => ",", // "import_statement"
        147 => ",", // "lambda_parameters"
        215 => ",", // "list"
        180 => ",", // "list_pattern"
        134 => ",", // "match_statement"
        151 => ",", // "nonlocal_statement"
        146 => ",", // "parameters"
        200 => ",", // "pattern_list"
        119 => ",", // "print_statement"
        216 => ",", // "set"
        204 => ",", // "subscript"
        217 => ",", // "tuple"
        179 => ",", // "tuple_pattern"
        155 => ",", // "type_parameter"
        166 => "|", // "union_pattern"
        244 => ",", // "with_clause_bare"
        _ => "",
    }
}

pub(crate) fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {
    match (parent_id, child_id) {
        (198, 240) => Some("eq"), // ("assignment", "assignment_eq")
        (198, 241) => Some("type"), // ("assignment", "assignment_type")
        (198, 242) => Some("typed"), // ("assignment", "assignment_typed")
        (122, 187) => Some("tuple"), // ("expression_statement", "expression")
        (143, 244) => Some("bare"), // ("with_clause", "with_clause_bare")
        (143, 245) => Some("paren"), // ("with_clause", "with_clause_paren")
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
        165 | 185 => { // "_as_pattern" | "as_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = _AsPatternTemplate {
                case_pattern: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                identifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        240 => { // "_assignment_eq" | "assignment_eq"
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = AssignmentEqTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        241 => { // "_assignment_type" | "assignment_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = AssignmentTypeTemplate {
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        242 => { // "_assignment_typed" | "assignment_typed"
            let field_0 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = AssignmentTypedTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        224 => { // "_comprehension_clauses"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ComprehensionClausesTemplate {
                for_in_clause: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                if_clause: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        246 => { // "_match_block_block" | "match_block_block"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = MatchBlockBlockTemplate {
                alternative: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        135 => { // "_match_block"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = MatchBlockTemplate {
                match_block_block: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        248 => { // "_simple_pattern_negative" | "simple_pattern_negative"
            let text = resolve_text(node)?;
            let template = SimplePatternNegativeTemplate {
                text: text.as_str(),
            };
            template.render_into(dest)
        }
        110 => { // "_simple_statements"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = SimpleStatementsTemplate {
                simple_statement: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        245 => { // "_with_clause_paren" | "with_clause_paren"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = _WithClauseParenTemplate {
                with_item: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        117 => { // "aliased_import"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let template = AliasedImportTemplate {
                alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        157 => { // "argument_list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ArgumentListTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                list_splat: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        121 => { // "assert_statement"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = AssertStatementTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        198 => { // "assignment"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let variant = resolve_variant(node);
            let template = AssignmentTemplate {
                assignment_eq: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                assignment_type: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                assignment_typed: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        203 => { // "attribute"
            let field_0 = resolve_slot(node, SlotAccessor::Field("attribute"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("object"), true)?;
            let template = AttributeTemplate {
                attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        199 => { // "augmented_assignment"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = AugmentedAssignmentTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        237 => { // "await"
            let field_0 = resolve_slot(node, SlotAccessor::Field("primary_expression"), true)?;
            let template = AwaitTemplate {
                primary_expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        191 => { // "binary_operator"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = BinaryOperatorTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        160 => { // "block"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = BlockTemplate {
                statement: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        190 => { // "boolean_operator"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = BooleanOperatorTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        206 => { // "call"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("function"), true)?;
            let template = CallTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        136 => { // "case_clause"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("guard"), false)?;
            let children_renderables = children.renderable_items();
            let template = CaseClauseTemplate {
                case_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                guard: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        163 => { // "case_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = CasePatternTemplate {
                as_pattern: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        120 => { // "chevron"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = ChevronTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        154 => { // "class_definition"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("superclasses"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let template = ClassDefinitionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                superclasses: match field_2.kind {
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
        173 => { // "class_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("arguments"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("dotted_name"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ClassPatternTemplate {
                arguments: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                dotted_name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        195 => { // "comparison_operator"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operators"), true)?;
            let children_renderables = children.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ComparisonOperatorTemplate {
                primary_expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operators: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        174 => { // "complex_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("float"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("imaginary"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("real"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ComplexPatternTemplate {
                integer: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                float: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                imaginary: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                real: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        230 => { // "concatenated_string"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = ConcatenatedStringTemplate {
                string: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        229 => { // "conditional_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let template = ConditionalExpressionTemplate {
                alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        212 => { // "constrained_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("base_type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("constraint"), true)?;
            let template = ConstrainedTypeTemplate {
                base_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                constraint: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        158 => { // "decorated_definition"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("definition"), true)?;
            let children_renderables = children.renderable_items();
            let template = DecoratedDefinitionTemplate {
                decorator: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                definition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        159 => { // "decorator"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("newline"), false)?;
            let template = DecoratorTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                newline: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        181 => { // "default_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = DefaultParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        126 => { // "delete_statement"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = DeleteStatementTemplate {
                expressions: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        169 => { // "dict_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = DictPatternTemplate {
                dict_pattern_kv: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        221 => { // "dictionary_comprehension"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("for_in_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("if_clause"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = DictionaryComprehensionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                for_in_clause: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                if_clause: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        184 => { // "dictionary_splat_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = DictionarySplatPatternTemplate {
                identifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        149 => { // "dictionary_splat"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = DictionarySplatTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        218 => { // "dictionary"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = DictionaryTemplate {
                pair: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        162 => { // "dotted_name"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = DottedNameTemplate {
                identifier: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        132 => { // "elif_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
            let template = ElifClauseTemplate {
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        133 => { // "else_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let template = ElseClauseTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        140 => { // "except_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alias"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("block"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = ExceptClauseTemplate {
                alias: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                block: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                value: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        152 => { // "exec_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("code"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("in_clause"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let template = ExecStatementTemplate {
                code: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                in_clause: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        161 => { // "expression_list"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = ExpressionListTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        243 => { // "expression_statement_tuple"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = ExpressionStatementTupleTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        122 => { // "expression_statement"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = ExpressionStatementTemplate {
                assignment: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                augmented_assignment: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                expression: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                expression_statement_tuple: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                yield_: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        141 => { // "finally_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("block"), true)?;
            let template = FinallyClauseTemplate {
                block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        227 => { // "for_in_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_2_renderables = field_2.renderable_items();
            let template = ForInClauseTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        137 => { // "for_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = ForStatementTemplate {
                alternative: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                async_marker: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
            };
            template.render_into(dest)
        }
        236 => { // "format_specifier"
            let field_0 = resolve_slot(node, SlotAccessor::Field("format_expression"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = FormatSpecifierTemplate {
                format_expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        145 => { // "function_definition"
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("parameters"), true)?;
            let field_4 = resolve_slot(node, SlotAccessor::Field("return_type"), false)?;
            let field_5 = resolve_slot(node, SlotAccessor::Field("type_parameters"), false)?;
            let template = FunctionDefinitionTemplate {
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
        114 => { // "future_import_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = FutureImportStatementTemplate {
                name: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        223 => { // "generator_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("for_in_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("if_clause"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = GeneratorExpressionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                for_in_clause: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                if_clause: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        210 => { // "generic_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type_parameter"), true)?;
            let template = GenericTypeTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        150 => { // "global_statement"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = GlobalStatementTemplate {
                identifier: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        228 => { // "if_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = IfClauseTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        131 => { // "if_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("consequence"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = IfStatementTemplate {
                alternative: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        115 => { // "import_from_statement"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("module_name"), true)?;
            let template = ImportFromStatementTemplate {
                wildcard_import: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                module_name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        111 => { // "import_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ImportStatementTemplate {
                name: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        233 => { // "interpolation"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("format_specifier"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type_conversion"), false)?;
            let template = InterpolationTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                format_specifier: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                type_conversion: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        214 => { // "keyword_argument"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = KeywordArgumentTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        171 => { // "keyword_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("simple_pattern"), true)?;
            let template = KeywordPatternTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                simple_pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        147 => { // "lambda_parameters"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = LambdaParametersTemplate {
                parameter: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        197 => { // "lambda_within_for_in_clause"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parameters"), false)?;
            let template = LambdaWithinForInClauseTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                parameters: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        196 => { // "lambda"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("parameters"), false)?;
            let template = LambdaTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                parameters: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        220 => { // "list_comprehension"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("for_in_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("if_clause"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = ListComprehensionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                for_in_clause: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                if_clause: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        180 => { // "list_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ListPatternTemplate {
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        183 => { // "list_splat_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = ListSplatPatternTemplate {
                identifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        148 => { // "list_splat"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression"), true)?;
            let template = ListSplatTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        215 => { // "list"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ListTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        134 => { // "match_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("subject"), true)?;
            let field_1_renderables = field_1.renderable_items();
            let template = MatchStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                subject: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        213 => { // "member_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("base_type"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let template = MemberTypeTemplate {
                base_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        108 => { // "module"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ModuleTemplate {
                statement: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        123 => { // "named_expression"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = NamedExpressionTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        151 => { // "nonlocal_statement"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = NonlocalStatementTemplate {
                identifier: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        189 => { // "not_operator"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let template = NotOperatorTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        219 => { // "pair"
            let field_0 = resolve_slot(node, SlotAccessor::Field("key"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = PairTemplate {
                key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        146 => { // "parameters"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = ParametersTemplate {
                parameter: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        225 => { // "parenthesized_expression"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = ParenthesizedExpressionTemplate {
                expression: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        156 => { // "parenthesized_list_splat"
            let field_0 = resolve_slot(node, SlotAccessor::Field("parenthesized_expression"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = ParenthesizedListSplatTemplate {
                parenthesized_expression: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        200 => { // "pattern_list"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = PatternListTemplate {
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        119 => { // "print_statement"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = PrintStatementTemplate {
                chevron: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                argument: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        127 => { // "raise_statement"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("cause"), false)?;
            let template = RaiseStatementTemplate {
                expressions: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                cause: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        113 => { // "relative_import"
            let field_0 = resolve_slot(node, SlotAccessor::Field("dotted_name"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("import_prefix"), true)?;
            let template = RelativeImportTemplate {
                dotted_name: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                import_prefix: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        125 => { // "return_statement"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let template = ReturnStatementTemplate {
                expressions: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        222 => { // "set_comprehension"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("for_in_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("if_clause"), false)?;
            let field_1_renderables = field_1.renderable_items();
            let field_2_renderables = field_2.renderable_items();
            let template = SetComprehensionTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                for_in_clause: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
                if_clause: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        216 => { // "set"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = SetTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        205 => { // "slice"
            let field_0 = resolve_slot(node, SlotAccessor::Field("expression1"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("expression2"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("step"), false)?;
            let template = SliceTemplate {
                expression1: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                expression2: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                step: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        172 => { // "splat_pattern"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let template = SplatPatternTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        209 => { // "splat_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("identifier"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = SplatTypeTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        232 => { // "string_content"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = StringContentTemplate {
                escape_interpolation: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        231 => { // "string"
            let text = resolve_text(node)?;
            let template = StringTemplate {
                text: text.as_str(),
            };
            template.render_into(dest)
        }
        204 => { // "subscript"
            let field_0 = resolve_slot(node, SlotAccessor::Field("subscript"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = SubscriptTemplate {
                subscript: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        139 => { // "try_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("else_clause"), false)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("except_clauses"), false)?;
            let field_3 = resolve_slot(node, SlotAccessor::Field("finally_clause"), false)?;
            let field_2_renderables = field_2.renderable_items();
            let template = TryStatementTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                else_clause: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                except_clauses: ListNonterminalView {
                    items: field_2_renderables.as_slice(),
                    separator: field_2.separator,
                    leading: field_2.leading_sep,
                    trailing: field_2.trailing_sep,
                },
                finally_clause: match field_3.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        179 => { // "tuple_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = TuplePatternTemplate {
                pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        217 => { // "tuple"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let children_renderables = children.renderable_items();
            let template = TupleTemplate {
                expression: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        153 => { // "type_alias_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = TypeAliasStatementTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        155 => { // "type_parameter"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = TypeParameterTemplate {
                type_: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        208 => { // "type"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let template = TypeTemplate {
                expression: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
            };
            template.render_into(dest)
        }
        182 => { // "typed_default_parameter"
            let field_0 = resolve_slot(node, SlotAccessor::Field("name"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = TypedDefaultParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        207 => { // "typed_parameter"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("type"), true)?;
            let template = TypedParameterTemplate {
                identifier: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                type_: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        192 => { // "unary_operator"
            let field_0 = resolve_slot(node, SlotAccessor::Field("argument"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("operator"), true)?;
            let template = UnaryOperatorTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        166 => { // "union_pattern"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = UnionPatternTemplate {
                simple_pattern: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        211 => { // "union_type"
            let field_0 = resolve_slot(node, SlotAccessor::Field("left"), true)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("right"), true)?;
            let template = UnionTypeTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        138 => { // "while_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("alternative"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("condition"), true)?;
            let template = WhileStatementTemplate {
                alternative: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        244 => { // "with_clause_bare"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let children_renderables = children.renderable_items();
            let template = WithClauseBareTemplate {
                with_item: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        143 => { // "with_clause"
            let children = resolve_slot(node, SlotAccessor::Children, true)?;
            let variant = resolve_variant(node);
            let template = WithClauseTemplate {
                with_clause_bare: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                with_clause_paren: match children.kind {
                ResolvedFieldKind::Missing => return Err(missing_required_field(node, "children")),
                ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),
            },
                variant,
            };
            template.render_into(dest)
        }
        144 => { // "with_item"
            let field_0 = resolve_slot(node, SlotAccessor::Field("value"), true)?;
            let template = WithItemTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        142 => { // "with_statement"
            let field_0 = resolve_slot(node, SlotAccessor::Field("async_marker"), false)?;
            let field_1 = resolve_slot(node, SlotAccessor::Field("body"), true)?;
            let field_2 = resolve_slot(node, SlotAccessor::Field("with_clause"), true)?;
            let template = WithStatementTemplate {
                async_marker: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                with_clause: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        202 => { // "yield"
            let children = resolve_slot(node, SlotAccessor::Children, false)?;
            let field_0 = resolve_slot(node, SlotAccessor::Field("expressions"), false)?;
            let field_0_renderables = field_0.renderable_items();
            let template = YieldTemplate {
                expression: match children.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),
                },
                expressions: ListNonterminalView {
                    items: field_0_renderables.as_slice(),
                    separator: field_0.separator,
                    leading: field_0.leading_sep,
                    trailing: field_0.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        _ => token_shaped_fallback_into(node, dest),
    }
}
