//! `NodeData` → `TemplateContext` builder + `GrammarMeta` trait.
//! Spec 012 task T023.
//!
//! The `build_template_context` function is the shared pre-render step:
//! walks a `NodeData` once, pre-renders every field and child via the
//! caller-supplied `render_dispatch`, and hands the template a typed,
//! grammar-agnostic bag of strings + booleans. The per-kind askama
//! struct in `sittir-{lang}-render` is constructed from this bag.
//!
//! # GrammarMeta
//!
//! Grammar-specific knowledge (separators, variant labels, list-
//! containerness) is provided via the [`GrammarMeta`] trait,
//! implemented by each generated render crate. This keeps
//! `sittir-core` free of grammar-specific constants — satisfies
//! Constitution Principle VII (no grammar knowledge in shared code).
//!
//! # render_dispatch
//!
//! The per-kind template dispatcher lives in `sittir-{lang}-render`
//! (emitted by T027). `build_template_context` only needs its type
//! signature, so we declare it as a function pointer [`RenderDispatch`]
//! and receive it as a parameter. The render crate's integration tests
//! wire a real dispatcher; the unit tests in this crate can pass a
//! stub.

use crate::types::{FieldValue, NodeData};
use std::collections::HashMap;

/// Grammar-specific lookup surface. Implemented by each
/// `sittir-{lang}-render` crate via a unit struct emitted by codegen
/// from the same `node-model.json5` metadata the TS engine consumes.
///
/// Methods return `None` / `false` for kinds that don't participate in
/// the relevant mechanism — a scalar kind has no separator, a non-
/// variant-branching kind has no variant label, etc.
pub trait GrammarMeta {
    /// Children-list separator for this kind, if the kind is a list
    /// container with a codegen-registered separator. Returns `None`
    /// for scalar kinds. Source: spec-011 joinby metadata per kind.
    fn separator_for(&self, kind: &str) -> Option<&str>;

    /// For the three variant-branching exception rules (FR-011):
    /// `rust/visibility_modifier`, `typescript/export_statement`,
    /// `typescript/call_expression`. Given a parent kind and the kind
    /// of its primary child, returns the variant label the parent's
    /// template expects (e.g. `"pub_crate"`, `"named_export"`).
    /// Returns `None` when the parent is not a variant-branching kind.
    fn variant_for(&self, parent_kind: &str, child_kind: &str) -> Option<&str>;

    /// Returns `true` if the kind is a list-container (repeat-position),
    /// so the children rendering uses `children_list` semantics +
    /// `joinby`.
    fn is_list_container(&self, kind: &str) -> bool;
}

/// Per-kind dispatcher signature. Emitted by codegen into
/// `sittir-{lang}-render::render_dispatch` (T027/T028). Given a kind
/// string and a populated `TemplateContext`, returns the rendered
/// source for that kind.
///
/// Passed as a parameter to [`build_template_context`] so `sittir-core`
/// can drive the recursion without depending on any render crate.
pub type RenderDispatch = fn(&str, &TemplateContext) -> Result<String, askama::Error>;

/// The pre-rendered bag a template consumes. Shape identical between
/// engines — see contracts/template-context.md for the shared contract.
///
/// Templates see this through a typed per-kind struct (askama
/// `#[derive(Template)]`) whose fields are a projection of these
/// entries + the grammar's named field list. Construction of that
/// per-kind struct happens in the `render_dispatch` dispatcher; this
/// struct is the transport between `sittir-core` and the dispatcher.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct TemplateContext {
    /// Pre-rendered string value for each raw (snake_case) field name
    /// (scalar surface — `FieldValue::Multiple` already joined with
    /// the parent's separator).
    pub fields: HashMap<String, String>,
    /// Per-field raw list view — for templates that iterate a field
    /// (`{% for x in foo %}`) or pipe it into a `join*` filter. The
    /// generated per-kind struct selects between this and `fields`
    /// based on the template's usage of each identifier. For
    /// `FieldValue::Multiple` entries this is the per-element
    /// pre-rendered list; for `FieldValue::Single` / `FieldValue::Text`
    /// it's a single-element vec (so a list-shaped template slot
    /// degrades to emitting one value).
    pub fields_list: HashMap<String, Vec<String>>,
    /// Pre-rendered children joined with the per-node separator.
    pub children: String,
    /// Per-child rendered strings, for `{% for c in children_list %}`.
    pub children_list: Vec<String>,
    /// Variant label — `""` if not a variant-branching kind.
    pub variant: String,
    /// Leaf text — `""` for branch nodes.
    pub text: String,
    /// Trailing separator flag (spec-011).
    pub trailing_sep: bool,
    /// Leading separator flag (spec-011).
    pub leading_sep: bool,
}

impl TemplateContext {
    /// All-defaults constructor — empty maps / vecs, empty strings,
    /// both flanks `false`. Keeps templates simple: they can compare
    /// against `""` rather than handle null/missing.
    pub fn empty() -> Self {
        Self::default()
    }
}

/// Build a `TemplateContext` from a `NodeData` + grammar metadata +
/// the per-kind render dispatcher.
///
/// # Walks
///
/// - For each entry in `node.fields`, recursively prepare + dispatch
///   the child, store the rendered string under the raw field name.
///   `FieldValue::Multiple` values are joined with the parent's
///   separator (from `meta.separator_for(parent_kind)`) before being
///   stored — templates receive a single string per field name.
///   `FieldValue::Text` values land verbatim.
/// - For each entry in `node.children`, recursively prepare + dispatch,
///   accumulate into `children_list`. `children` is the same list
///   joined with the parent's separator (or `""` if none).
/// - Leaf text surfaces as `text`; `""` for branch nodes.
/// - `variant` is pulled from `meta.variant_for(parent_kind, first_child_kind)`
///   if applicable; `""` otherwise. (The TS side enriches the node
///   with `$variant` during `readTreeNode`; when reading from that
///   enriched NodeData the variant label is already resolved. Here we
///   consult `GrammarMeta` so the Rust path is not dependent on TS
///   enrichment.)
/// - `leading_sep` / `trailing_sep` are left `false` by default; codegen
///   emits per-kind overrides that set them when the grammar surfaces
///   a leading/trailing anonymous token at that position. MVP default
///   is `false` both ways — matches the TS engine's behavior when a
///   kind has no spec-011 flank metadata.
///
/// # Errors
///
/// Returns the first `askama::Error` raised by `render_dispatch` on any
/// child, short-circuiting the walk.
pub fn build_template_context<M: GrammarMeta>(
    node: &NodeData,
    meta: &M,
    render_dispatch: RenderDispatch,
) -> Result<TemplateContext, askama::Error> {
    let parent_kind = &node.type_;
    let mut ctx = TemplateContext::empty();

    // Fields — per-name render. `fields` receives the pre-joined
    // scalar view (Multiple values joined with the parent's separator);
    // `fields_list` receives the per-element list view so templates that
    // iterate (`{% for x in foo %}`) or pipe through a `join*` filter
    // can reach every element.
    if let Some(fields) = &node.fields {
        for (name, value) in fields {
            let (rendered, list) =
                render_field_value(value, meta, render_dispatch, parent_kind)?;
            ctx.fields.insert(name.clone(), rendered);
            ctx.fields_list.insert(name.clone(), list);
        }
    }

    // Children — accumulate into children_list; `children` is the
    // joined string using the parent's separator (or "" if none).
    if let Some(children) = &node.children {
        for child in children {
            let child_ctx = build_template_context(child, meta, render_dispatch)?;
            let rendered = render_dispatch(&child.type_, &child_ctx)?;
            ctx.children_list.push(rendered);
        }
        let sep = meta.separator_for(parent_kind).unwrap_or("");
        ctx.children = ctx.children_list.join(sep);
    }

    // Leaf text pass-through.
    if let Some(t) = &node.text {
        ctx.text = t.clone();
    }

    // Variant — consult GrammarMeta with first-child kind as the probe.
    if let Some(primary) = first_child_kind(node) {
        if let Some(label) = meta.variant_for(parent_kind, primary) {
            ctx.variant = label.to_string();
        }
    }

    Ok(ctx)
}

/// Render a single `FieldValue` into both a joined scalar AND a
/// per-element list view. The per-kind struct's field type selects
/// between the two at emit time.
///
/// - `Single` → render once. Scalar = the rendered string. List = a
///   single-element vec containing that same string (so a list-shaped
///   template slot still emits one value).
/// - `Multiple` → render each. Scalar = joined with the parent's
///   separator. List = per-element pre-rendered vec.
/// - `Text` → verbatim scalar + single-element list.
fn render_field_value<M: GrammarMeta>(
    value: &FieldValue,
    meta: &M,
    render_dispatch: RenderDispatch,
    parent_kind: &str,
) -> Result<(String, Vec<String>), askama::Error> {
    match value {
        FieldValue::Single(node) => {
            let child_ctx = build_template_context(node, meta, render_dispatch)?;
            let rendered = render_dispatch(&node.type_, &child_ctx)?;
            Ok((rendered.clone(), vec![rendered]))
        }
        FieldValue::Multiple(nodes) => {
            let mut parts: Vec<String> = Vec::with_capacity(nodes.len());
            for n in nodes {
                let child_ctx = build_template_context(n, meta, render_dispatch)?;
                parts.push(render_dispatch(&n.type_, &child_ctx)?);
            }
            let sep = meta.separator_for(parent_kind).unwrap_or("");
            let joined = parts.join(sep);
            Ok((joined, parts))
        }
        FieldValue::Text(s) => Ok((s.clone(), vec![s.clone()])),
    }
}

/// The primary-child probe for variant-branching: returns the kind of
/// the first named child (either from `$fields` — first-field-first-
/// value — or from `$children[0]`). Returns `None` for leaf nodes.
fn first_child_kind(node: &NodeData) -> Option<&str> {
    if let Some(fields) = &node.fields {
        // Pick any field's first value — `variant_for` impls only care
        // about the primary child's kind, and variant-branching kinds
        // by definition have exactly one field slot. If more than one
        // exists, iteration order is unstable (HashMap), which is fine
        // because `variant_for` returns the same answer regardless.
        for (_, v) in fields.iter() {
            match v {
                FieldValue::Single(n) => return Some(&n.type_),
                FieldValue::Multiple(ns) => {
                    if let Some(n) = ns.first() {
                        return Some(&n.type_);
                    }
                }
                FieldValue::Text(_) => {}
            }
        }
    }
    if let Some(children) = &node.children {
        return children.first().map(|n| n.type_.as_str());
    }
    None
}
