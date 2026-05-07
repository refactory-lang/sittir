// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
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
        (198, 241) => Some("eq"), // ("assignment", "assignment_type")
        (198, 242) => Some("eq"), // ("assignment", "assignment_typed")
        (122, 243) => Some("tuple"), // ("expression_statement", "expression_statement_tuple")
        (143, 244) => Some("bare"), // ("with_clause", "with_clause_bare")
        (143, 245) => Some("bare"), // ("with_clause", "with_clause_paren")
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
        165 | 185 => { // "_as_pattern" | "as_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _AsPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        240 => { // "_assignment_eq" | "assignment_eq"
            let children = resolve_children(node, &["right"])?;
            let field_0 = resolve_field(node, "right", true)?;
            let template = AssignmentEqTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        241 => { // "_assignment_type" | "assignment_type"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let template = AssignmentTypeTemplate {
                r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        242 => { // "_assignment_typed" | "assignment_typed"
            let children = resolve_children(node, &["right", "type"])?;
            let field_0 = resolve_field(node, "right", true)?;
            let field_1 = resolve_field(node, "type", true)?;
            let template = AssignmentTypedTemplate {
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        224 => { // "_comprehension_clauses"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ComprehensionClausesTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        246 => { // "_match_block_block" | "match_block_block"
            let children = resolve_children(node, &["alternative"])?;
            let field_0 = resolve_field(node, "alternative", true)?;
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
            template.render_into(dest)
        }
        248 => { // "_simple_pattern_negative" | "simple_pattern_negative"
            let children = resolve_children(node, &[])?;
            let text = resolve_text(node)?;
            let template = SimplePatternNegativeTemplate {
                text: text.as_str(),
            };
            template.render_into(dest)
        }
        110 => { // "_simple_statements"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = SimpleStatementsTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        245 => { // "_with_clause_paren" | "with_clause_paren"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = _WithClauseParenTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        117 => { // "aliased_import"
            let children = resolve_children(node, &["alias", "name"])?;
            let field_0 = resolve_field(node, "alias", true)?;
            let field_1 = resolve_field(node, "name", true)?;
            let template = AliasedImportTemplate {
                alias: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        157 => { // "argument_list"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ArgumentListTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        121 => { // "assert_statement"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = AssertStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        198 => { // "assignment"
            let children = resolve_children(node, &["left"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let children_renderables = children.renderable_items();
            let template = AssignmentTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        203 => { // "attribute"
            let children = resolve_children(node, &["attribute", "object"])?;
            let field_0 = resolve_field(node, "attribute", true)?;
            let field_1 = resolve_field(node, "object", true)?;
            let template = AttributeTemplate {
                attribute: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                object: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        199 => { // "augmented_assignment"
            let children = resolve_children(node, &["left", "operator", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let field_2 = resolve_field(node, "right", true)?;
            let template = AugmentedAssignmentTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        237 => { // "await"
            let children = resolve_children(node, &["primary_expression"])?;
            let field_0 = resolve_field(node, "primary_expression", true)?;
            let template = AwaitTemplate {
                primary_expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        191 => { // "binary_operator"
            let children = resolve_children(node, &["left", "operator", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let field_2 = resolve_field(node, "right", true)?;
            let template = BinaryOperatorTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        160 => { // "block"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = BlockTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        190 => { // "boolean_operator"
            let children = resolve_children(node, &["left", "operator", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let field_2 = resolve_field(node, "right", true)?;
            let template = BooleanOperatorTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        206 => { // "call"
            let children = resolve_children(node, &["arguments", "function"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "function", true)?;
            let template = CallTemplate {
                arguments: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                function: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        136 => { // "case_clause"
            let children = resolve_children(node, &["consequence", "guard"])?;
            let field_0 = resolve_field(node, "consequence", true)?;
            let field_1 = resolve_field(node, "guard", false)?;
            let children_renderables = children.renderable_items();
            let template = CaseClauseTemplate {
                children: ListNonterminalView {
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
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = CasePatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        120 => { // "chevron"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = ChevronTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        154 => { // "class_definition"
            let children = resolve_children(node, &["body", "name", "superclasses", "type_parameters"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "name", true)?;
            let field_2 = resolve_field(node, "superclasses", false)?;
            let field_3 = resolve_field(node, "type_parameters", false)?;
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
            let children = resolve_children(node, &["arguments", "dotted_name"])?;
            let field_0 = resolve_field(node, "arguments", true)?;
            let field_1 = resolve_field(node, "dotted_name", true)?;
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
            let children = resolve_children(node, &["left", "operators"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "operators", true)?;
            let children_renderables = children.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ComparisonOperatorTemplate {
                children: ListNonterminalView {
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
            let children = resolve_children(node, &["imaginary", "real"])?;
            let field_0 = resolve_field(node, "imaginary", true)?;
            let field_1 = resolve_field(node, "real", false)?;
            let children_renderables = children.renderable_items();
            let template = ComplexPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                imaginary: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                real: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        230 => { // "concatenated_string"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ConcatenatedStringTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        229 => { // "conditional_expression"
            let children = resolve_children(node, &["alternative", "body", "condition"])?;
            let field_0 = resolve_field(node, "alternative", true)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "condition", true)?;
            let template = ConditionalExpressionTemplate {
                alternative: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        212 => { // "constrained_type"
            let children = resolve_children(node, &["base_type", "constraint"])?;
            let field_0 = resolve_field(node, "base_type", true)?;
            let field_1 = resolve_field(node, "constraint", true)?;
            let template = ConstrainedTypeTemplate {
                base_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                constraint: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        158 => { // "decorated_definition"
            let children = resolve_children(node, &["definition"])?;
            let field_0 = resolve_field(node, "definition", true)?;
            let children_renderables = children.renderable_items();
            let template = DecoratedDefinitionTemplate {
                children: ListNonterminalView {
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
            let children = resolve_children(node, &["expression", "newline"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let field_1 = resolve_field(node, "newline", false)?;
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
            let children = resolve_children(node, &["name", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = DefaultParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        126 => { // "delete_statement"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DeleteStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        169 => { // "dict_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DictPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        221 => { // "dictionary_comprehension"
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let children_renderables = children.renderable_items();
            let template = DictionaryComprehensionTemplate {
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
        184 => { // "dictionary_splat_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DictionarySplatPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        149 => { // "dictionary_splat"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = DictionarySplatTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        218 => { // "dictionary"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DictionaryTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        162 => { // "dotted_name"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = DottedNameTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        132 => { // "elif_clause"
            let children = resolve_children(node, &["condition", "consequence"])?;
            let field_0 = resolve_field(node, "condition", true)?;
            let field_1 = resolve_field(node, "consequence", true)?;
            let template = ElifClauseTemplate {
                condition: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                consequence: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        133 => { // "else_clause"
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let template = ElseClauseTemplate {
                body: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        140 => { // "except_clause"
            let children = resolve_children(node, &["alias", "value"])?;
            let field_0 = resolve_field(node, "alias", false)?;
            let field_1 = resolve_field(node, "value", false)?;
            let children_renderables = children.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ExceptClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                alias: match field_0.kind {
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
        152 => { // "exec_statement"
            let children = resolve_children(node, &["code", "in_clause"])?;
            let field_0 = resolve_field(node, "code", true)?;
            let field_1 = resolve_field(node, "in_clause", false)?;
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
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ExpressionListTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        243 => { // "expression_statement_tuple"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ExpressionStatementTupleTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        122 => { // "expression_statement"
            let children = resolve_children(node, &[])?;
            let variant = resolve_variant(node);
            let children_renderables = children.renderable_items();
            let template = ExpressionStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                variant,
            };
            template.render_into(dest)
        }
        141 => { // "finally_clause"
            let children = resolve_children(node, &["block"])?;
            let field_0 = resolve_field(node, "block", true)?;
            let template = FinallyClauseTemplate {
                block: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        227 => { // "for_in_clause"
            let children = resolve_children(node, &["async_marker", "left", "right"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "left", true)?;
            let field_2 = resolve_field(node, "right", true)?;
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
            let children = resolve_children(node, &["alternative", "async_marker", "body", "left", "right"])?;
            let field_0 = resolve_field(node, "alternative", false)?;
            let field_1 = resolve_field(node, "async_marker", false)?;
            let field_2 = resolve_field(node, "body", true)?;
            let field_3 = resolve_field(node, "left", true)?;
            let field_4 = resolve_field(node, "right", true)?;
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
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = FormatSpecifierTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        145 => { // "function_definition"
            let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "name", true)?;
            let field_3 = resolve_field(node, "parameters", true)?;
            let field_4 = resolve_field(node, "return_type", false)?;
            let field_5 = resolve_field(node, "type_parameters", false)?;
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
            let children = resolve_children(node, &["name"])?;
            let field_0 = resolve_field(node, "name", true)?;
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
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let children_renderables = children.renderable_items();
            let template = GeneratorExpressionTemplate {
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
        210 => { // "generic_type"
            let children = resolve_children(node, &["identifier", "type_parameter"])?;
            let field_0 = resolve_field(node, "identifier", true)?;
            let field_1 = resolve_field(node, "type_parameter", true)?;
            let template = GenericTypeTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                type_parameter: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        150 => { // "global_statement"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = GlobalStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        228 => { // "if_clause"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = IfClauseTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        131 => { // "if_statement"
            let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
            let field_0 = resolve_field(node, "alternative", false)?;
            let field_1 = resolve_field(node, "condition", true)?;
            let field_2 = resolve_field(node, "consequence", true)?;
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
            let children = resolve_children(node, &["module_name", "name"])?;
            let field_0 = resolve_field(node, "module_name", true)?;
            let field_1 = resolve_field(node, "name", false)?;
            let children_renderables = children.renderable_items();
            let field_1_renderables = field_1.renderable_items();
            let template = ImportFromStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                module_name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                name: ListNonterminalView {
                    items: field_1_renderables.as_slice(),
                    separator: field_1.separator,
                    leading: field_1.leading_sep,
                    trailing: field_1.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        111 => { // "import_statement"
            let children = resolve_children(node, &["name"])?;
            let field_0 = resolve_field(node, "name", true)?;
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
            let children = resolve_children(node, &["expression", "format_specifier", "type_conversion"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let field_1 = resolve_field(node, "format_specifier", false)?;
            let field_2 = resolve_field(node, "type_conversion", false)?;
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
            let children = resolve_children(node, &["name", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = KeywordArgumentTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        171 => { // "keyword_pattern"
            let children = resolve_children(node, &["identifier", "simple_pattern"])?;
            let field_0 = resolve_field(node, "identifier", true)?;
            let field_1 = resolve_field(node, "simple_pattern", true)?;
            let template = KeywordPatternTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                simple_pattern: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        147 => { // "lambda_parameters"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = LambdaParametersTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        197 => { // "lambda_within_for_in_clause"
            let children = resolve_children(node, &["body", "parameters"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "parameters", false)?;
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
            let children = resolve_children(node, &["body", "parameters"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "parameters", false)?;
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
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let children_renderables = children.renderable_items();
            let template = ListComprehensionTemplate {
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
        180 => { // "list_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ListPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        183 => { // "list_splat_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ListSplatPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        148 => { // "list_splat"
            let children = resolve_children(node, &["expression"])?;
            let field_0 = resolve_field(node, "expression", true)?;
            let template = ListSplatTemplate {
                expression: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        215 => { // "list"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ListTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        134 => { // "match_statement"
            let children = resolve_children(node, &["body", "subject"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "subject", true)?;
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
            let children = resolve_children(node, &["base_type", "identifier"])?;
            let field_0 = resolve_field(node, "base_type", true)?;
            let field_1 = resolve_field(node, "identifier", true)?;
            let template = MemberTypeTemplate {
                base_type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        108 => { // "module"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ModuleTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        123 => { // "named_expression"
            let children = resolve_children(node, &["name", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = NamedExpressionTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        151 => { // "nonlocal_statement"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = NonlocalStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        189 => { // "not_operator"
            let children = resolve_children(node, &["argument"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let template = NotOperatorTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        219 => { // "pair"
            let children = resolve_children(node, &["key", "value"])?;
            let field_0 = resolve_field(node, "key", true)?;
            let field_1 = resolve_field(node, "value", true)?;
            let template = PairTemplate {
                key: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        146 => { // "parameters"
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
            template.render_into(dest)
        }
        225 => { // "parenthesized_expression"
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
        156 => { // "parenthesized_list_splat"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ParenthesizedListSplatTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        200 => { // "pattern_list"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = PatternListTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        119 => { // "print_statement"
            let children = resolve_children(node, &["argument"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let children_renderables = children.renderable_items();
            let field_0_renderables = field_0.renderable_items();
            let template = PrintStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
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
            let children = resolve_children(node, &["cause"])?;
            let field_0 = resolve_field(node, "cause", false)?;
            let children_renderables = children.renderable_items();
            let template = RaiseStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                cause: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        113 => { // "relative_import"
            let children = resolve_children(node, &["dotted_name", "import_prefix"])?;
            let field_0 = resolve_field(node, "dotted_name", false)?;
            let field_1 = resolve_field(node, "import_prefix", true)?;
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
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = ReturnStatementTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        222 => { // "set_comprehension"
            let children = resolve_children(node, &["body"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let children_renderables = children.renderable_items();
            let template = SetComprehensionTemplate {
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
        216 => { // "set"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = SetTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        205 => { // "slice"
            let children = resolve_children(node, &["start", "step", "stop"])?;
            let field_0 = resolve_field(node, "start", false)?;
            let field_1 = resolve_field(node, "step", false)?;
            let field_2 = resolve_field(node, "stop", false)?;
            let template = SliceTemplate {
                start: match field_0.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                },
                step: match field_1.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                },
                stop: match field_2.kind {
                    ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,
                    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
                },
            };
            template.render_into(dest)
        }
        172 => { // "splat_pattern"
            let children = resolve_children(node, &["identifier"])?;
            let field_0 = resolve_field(node, "identifier", true)?;
            let children_renderables = children.renderable_items();
            let template = SplatPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        209 => { // "splat_type"
            let children = resolve_children(node, &["identifier"])?;
            let field_0 = resolve_field(node, "identifier", true)?;
            let field_0_renderables = field_0.renderable_items();
            let template = SplatTypeTemplate {
                identifier: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        232 => { // "string_content"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = StringContentTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        231 => { // "string"
            let children = resolve_children(node, &[])?;
            let text = resolve_text(node)?;
            let template = StringTemplate {
                text: text.as_str(),
            };
            template.render_into(dest)
        }
        204 => { // "subscript"
            let children = resolve_children(node, &["subscript", "value"])?;
            let field_0 = resolve_field(node, "subscript", true)?;
            let field_1 = resolve_field(node, "value", true)?;
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
            let children = resolve_children(node, &["body", "else_clause", "except_clauses", "finally_clause"])?;
            let field_0 = resolve_field(node, "body", true)?;
            let field_1 = resolve_field(node, "else_clause", false)?;
            let field_2 = resolve_field(node, "except_clauses", true)?;
            let field_3 = resolve_field(node, "finally_clause", false)?;
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
            template.render_into(dest)
        }
        217 => { // "tuple"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TupleTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        153 => { // "type_alias_statement"
            let children = resolve_children(node, &["left", "right", "type"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "right", true)?;
            let field_2 = resolve_field(node, "type", true)?;
            let template = TypeAliasStatementTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        155 => { // "type_parameter"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TypeParameterTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        208 => { // "type"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = TypeTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        182 => { // "typed_default_parameter"
            let children = resolve_children(node, &["name", "type", "value"])?;
            let field_0 = resolve_field(node, "name", true)?;
            let field_1 = resolve_field(node, "type", true)?;
            let field_2 = resolve_field(node, "value", true)?;
            let template = TypedDefaultParameterTemplate {
                name: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
            };
            template.render_into(dest)
        }
        207 => { // "typed_parameter"
            let children = resolve_children(node, &["type"])?;
            let field_0 = resolve_field(node, "type", true)?;
            let children_renderables = children.renderable_items();
            let template = TypedParameterTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
                r#type: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        192 => { // "unary_operator"
            let children = resolve_children(node, &["argument", "operator"])?;
            let field_0 = resolve_field(node, "argument", true)?;
            let field_1 = resolve_field(node, "operator", true)?;
            let template = UnaryOperatorTemplate {
                argument: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                operator: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        166 => { // "union_pattern"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = UnionPatternTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        211 => { // "union_type"
            let children = resolve_children(node, &["left", "right"])?;
            let field_0 = resolve_field(node, "left", true)?;
            let field_1 = resolve_field(node, "right", true)?;
            let template = UnionTypeTemplate {
                left: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
                right: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
            };
            template.render_into(dest)
        }
        138 => { // "while_statement"
            let children = resolve_children(node, &["alternative", "body", "condition"])?;
            let field_0 = resolve_field(node, "alternative", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "condition", true)?;
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
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = WithClauseBareTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        143 => { // "with_clause"
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = WithClauseTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        144 => { // "with_item"
            let children = resolve_children(node, &["value"])?;
            let field_0 = resolve_field(node, "value", true)?;
            let template = WithItemTemplate {
                value: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
            };
            template.render_into(dest)
        }
        142 => { // "with_statement"
            let children = resolve_children(node, &["async_marker", "body", "with_clause"])?;
            let field_0 = resolve_field(node, "async_marker", false)?;
            let field_1 = resolve_field(node, "body", true)?;
            let field_2 = resolve_field(node, "with_clause", true)?;
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
            let children = resolve_children(node, &[])?;
            let children_renderables = children.renderable_items();
            let template = YieldTemplate {
                children: ListNonterminalView {
                    items: children_renderables.as_slice(),
                    separator: children.separator,
                    leading: children.leading_sep,
                    trailing: children.trailing_sep,
                },
            };
            template.render_into(dest)
        }
        _ => token_shaped_fallback_into(node, dest),
    }
}
