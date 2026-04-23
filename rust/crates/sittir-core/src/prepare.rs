//! `NodeData` → `TemplateContext` builder + `GrammarMeta` trait.
//! Filled in by spec 012 task T023.
//!
//! Phase 1 exports a unit-struct placeholder for `TemplateContext` so
//! the per-grammar render-crate scaffolds (T005) can reference the
//! type path `sittir_core::prepare::TemplateContext` and compile. T023
//! replaces this with the real field set per contracts/template-context.md.

/// Placeholder — real shape arrives in T023. See contracts/template-context.md.
#[derive(Debug, Default)]
pub struct TemplateContext;
