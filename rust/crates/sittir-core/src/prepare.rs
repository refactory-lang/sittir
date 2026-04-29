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
    /// Trailing separator flag (spec-011). Legacy positional held over
    /// from the early MVP — modern flank detection lives in
    /// `trailing_anon` (per-call text-vs-sep comparison via askama
    /// `Values`). This bool stays in the struct because every emitted
    /// per-kind template carries it as a positional field; cleaning up
    /// the codegen + struct shape is a follow-up to T047.
    pub trailing_sep: bool,
    /// Leading separator flag (spec-011). See `trailing_sep`.
    pub leading_sep: bool,
    /// Text of the anonymous token immediately AFTER the last named
    /// child in `node.children`. `None` when the children list has no
    /// trailing anon (the common case — anon tokens typically land in
    /// `$fields` via TS-side `promoteAnonymousKeyword`, not in
    /// `$children`). Consulted by `joinWithTrailing` / `joinWithFlanks`
    /// custom filters: when `Some(text)` and `text == sep` arg, the
    /// filter emits a trailing separator. Mirrors the TS engine's
    /// `_trailing_anon` side-channel on the children array (see
    /// `packages/core/src/render.ts:937-942`).
    pub trailing_anon: Option<String>,
    /// Text of the anonymous token immediately BEFORE the first named
    /// child in `node.children`. See `trailing_anon` — symmetric for
    /// leading separators.
    pub leading_anon: Option<String>,
}

impl TemplateContext {
    /// All-defaults constructor — empty maps / vecs, empty strings,
    /// both flanks `false`. Keeps templates simple: they can compare
    /// against `""` rather than handle null/missing.
    pub fn empty() -> Self {
        Self::default()
    }

    /// Borrow the flank metadata (`leading_anon`, `trailing_anon`) as an
    /// askama [`Values`] bag for `render_with_values()`. Codegen-emitted
    /// `render_dispatch` calls this and threads the result into every
    /// per-kind template render so the `joinWith*` filter family can
    /// inspect the captured anon-text per call site.
    ///
    /// Implementation: a thin newtype wrapping `&TemplateContext`. The
    /// `Values::get_value` impl recognises the two flank keys
    /// (`"trailing_anon"` / `"leading_anon"`) and returns a `&dyn Any`
    /// over the corresponding `Option<String>` field — the filter
    /// downcasts and compares.
    pub fn as_values(&self) -> FlankValues<'_> {
        FlankValues { ctx: self }
    }
}

/// Bridge between [`TemplateContext`] and askama's runtime [`Values`]
/// store — exposes the flank-anon text fields by key so the per-filter
/// wrappers in `sittir_core::filters` can read them via
/// `values.get_value("trailing_anon")` etc. See [`TemplateContext::as_values`]
/// for the construction site.
pub struct FlankValues<'a> {
    ctx: &'a TemplateContext,
}

impl<'a> askama::Values for FlankValues<'a> {
    fn get_value<'b>(&'b self, key: &str) -> Option<&'b dyn std::any::Any> {
        match key {
            "trailing_anon" => Some(&self.ctx.trailing_anon),
            "leading_anon" => Some(&self.ctx.leading_anon),
            _ => None,
        }
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
    //
    // Only NAMED children enter `children_list` — anonymous token
    // children (tree-sitter's `"` pair around string_literal, `,`
    // separators inside a list, etc.) are structural. Their text
    // is reintroduced two ways:
    //   1. Parent template's literal bytes (`(...)`, `[...]`, etc.).
    //   2. Flank-aware filters (`joinWithTrailing` / `joinWithLeading`
    //      / `joinWithFlanks`) compare their `sep` arg against the
    //      `trailing_anon` / `leading_anon` text captured below and
    //      emit the flank when it matches. Mirrors the TS engine's
    //      `_trailing_anon` / `_leading_anon` side-channel on the
    //      children array (`packages/core/src/render.ts:918-942`).
    if let Some(children) = &node.children {
        // Find first / last named child indices in source order so we
        // can probe the immediately-adjacent unnamed entry on each
        // side. Mirrors the TS scan in
        // `buildNunjucksTemplateContext` — only the anon DIRECTLY
        // flanking the named-child run is a flank candidate;
        // intervening anons are inter-element separators and surface
        // through the join-filter's sep arg, not the flank channel.
        let mut first_named_idx: Option<usize> = None;
        let mut last_named_idx: Option<usize> = None;
        for (i, child) in children.iter().enumerate() {
            if child.named {
                if first_named_idx.is_none() {
                    first_named_idx = Some(i);
                }
                last_named_idx = Some(i);
                ctx.children_list.push(render_any(child, meta, render_dispatch)?);
            }
        }
        if let Some(first) = first_named_idx {
            if first > 0 {
                let before = &children[first - 1];
                if !before.named {
                    if let Some(t) = &before.text {
                        ctx.leading_anon = Some(t.clone());
                    }
                }
            }
        }
        if let Some(last) = last_named_idx {
            if last + 1 < children.len() {
                let after = &children[last + 1];
                if !after.named {
                    if let Some(t) = &after.text {
                        ctx.trailing_anon = Some(t.clone());
                    }
                }
            }
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

/// Render a single NodeData through the Rust engine, with the same
/// short-circuit the TS engine applies (`packages/core/src/render.ts`
/// line 836): a text-only leaf (has `$text`, no `$fields`, no
/// `$children`) renders verbatim as its `$text`. Anonymous token
/// children (tree-sitter surfaces `fn`, `+`, `declare`, …, etc. as
/// named children of their parents with `$text` set and no structure
/// below) land here — without the short-circuit, `render_dispatch`
/// would panic on them because there's no template for the token
/// kind itself.
///
/// Parent kinds with structure fall through to the full
/// `build_template_context` + `render_dispatch` path.
pub fn render_any<M: GrammarMeta>(
    node: &NodeData,
    meta: &M,
    render_dispatch: RenderDispatch,
) -> Result<String, askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return Ok(text.clone());
        }
    }
    let ctx = build_template_context(node, meta, render_dispatch)?;
    render_dispatch(&node.type_, &ctx)
    // Honest raw output — no whitespace post-processing. Empty optional
    // slots leave their adjacent literal spaces in place; that's a signal
    // to surface walker bugs (per `feedback_no_silent_formatting.md` on
    // the TS side) rather than hide them. The napi inline render path
    // already used raw dispatch output; this aligns the top-level entry.
}

/// Top-level render entry point. Equivalent to the TS engine's
/// `boundRender`: emits the template's raw output without trim or
/// collapse. Outer-position whitespace artifacts indicate walker bugs
/// (template emits a trailing/leading space when an optional field is
/// absent) and must surface, not be hidden.
pub fn render<M: GrammarMeta>(
    node: &NodeData,
    meta: &M,
    render_dispatch: RenderDispatch,
) -> Result<String, askama::Error> {
    render_any(node, meta, render_dispatch)
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
            let rendered = render_any(node, meta, render_dispatch)?;
            Ok((rendered.clone(), vec![rendered]))
        }
        FieldValue::Multiple(nodes) => {
            // Only NAMED nodes contribute to the list view. Anonymous
            // tokens in a multi-valued field are structural separators
            // (e.g. tree-sitter bundles `,` into `variable_declarator`
            // as {decl, `,`, decl, `,`, decl}) — they're supplied by
            // the template's `join(",")` filter or ambient literal
            // text, not the values themselves. See
            // `packages/core/src/render.ts:964-968` for the TS
            // equivalent.
            let mut parts: Vec<String> = Vec::with_capacity(nodes.len());
            for n in nodes {
                if !n.named {
                    continue;
                }
                parts.push(render_any(n, meta, render_dispatch)?);
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
