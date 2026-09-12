# Source Coordinates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An untouched parsed node renders by slicing the source the native engine still holds, addressed by its tree handle and byte span, so no source text crosses the boundary in either direction and a rebuilt list takes its whitespace class from the bytes between its still-parsed items.

**Architecture:** The slot carrier becomes `Coord(NodeCoordinate) | Transport(T)`, where a coordinate is a pure value: the tagged handle and the span. The reader stops capturing text on structural kinds and the JS projection folds every unedited subtree down to its coordinate. The render context (options table plus the engine's live trees) is an argument end to end: the prepare walk validates every coordinate against the live trees, classifies list gaps between adjacent coordinates into option values, then fills unset sites from the table; the typed render sink slices a coordinate's bytes at write time through the same source table. Bare strings in a slot that admits a text kind deserialize as a `VerbatimTransport`; anywhere else they are an error.

**Tech Stack:** Rust (`sittir-core`, generated `sittir-{rust,typescript,python}` crates, napi-rs), TypeScript codegen (`packages/codegen`), the `@sittir/common` runtime, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md` (the carrier, the fold, the walk, gap classification, gates). The read-side paragraph of `docs/superpowers/specs/2026-09-04-render-options-design.md` defers to it.

**Lands on:** `docs/superpowers/plans/2026-09-11-typed-render-sink-plan.md`. Every render function already takes `w: &mut dyn RenderSink`, every transport implements `Render`, and the options object crosses as a struct. This plan assumes that state.

**Carried in:** the native reader delivers a field-tagged separator into a mixedEnum array slot (python `for_in_clause.right`, and the singular sibling typescript `for_statement.condition`, which drops its `;` terminator the same way) because wrap's `resolveSlotDrillExprs` drops wire delimiters by separator id for every separated `many` slot but never runs on the native read path. The validator's read-render-parse deep-read only walks a chosen kind set, so it does not see the drop either — that blind spot is carried in along with the defect. Witness: `packages/python/tests/for-in-clause-separator-witness.test.ts` (`it.fails`). This plan's coordinate/gap-classification work is the first place a fix has the right shape to land. Also carried in: blank lines between statements render dropped in all three grammars (python module statements, rust items, typescript statements) even where a `(_)/after: blankline` declaration exists — trivia this plan's gap classification is meant to carry.

## Global Constraints

- Generated outputs are never hand-edited: `packages/{rust,typescript,python}/src/*`, `packages/*/.sittir/*`, `rust/crates/sittir-{rust,typescript,python}/src/render/*` come from `SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`. The hand-written crate roots `rust/crates/sittir-<g>/src/lib.rs` are edited by hand.
- `packages/codegen/src` carries no explanatory comments; every new, renamed or changed declaration gets a `###` entry in `docs/glossary/emitters.md`, headed `` ### `packages/codegen/src/emitters/<file>.ts::<name>` ``. Rust crates and `packages/common` keep doc comments that state live constraints, never provenance.
- No comment or doc references a spec, plan, PR or task number.
- Nothing ambient: the render context is a function argument at every level. No `thread_local!`, no `static` table, no global.
- No attempt-then-fallback deserialization. Dispatch on the wire shape; an unrecognised shape is an error.
- Every commit uses explicit pathspecs: `git add <paths>` then `git commit -- <paths>`. Never stage `packages/types/.vitest-report.json`, the untracked `*-roles.scm` files, or `sittir-role-interfaces-scm-spec.md`.
- Run `pnpm exec vitest run` as its own shell call, never chained; regenerate python before validating after any vitest run (the roundtrip tests rewrite `packages/python/.sittir/grammar.js`).
- Gates are numbers compared, never eyeballed. Baselines are the `validate:history` numbers recorded at the head of the typed-render-sink plan (identical to `e807479a0`: rust `147 / 207 / 134 of 137`, typescript `143 / 193 / 112 of 114`, python `126 / 142 / 115 of 116`); the read-render-parse counts may only rise.
- Tasks 1 and 2 are additive and gate on `cargo test -p sittir-core` plus `cargo build --workspace`. Task 3 removes the old carrier arms and is the first task that regenerates and runs the full gates.
- Branch: `feat/strict-rebuild-from-source`. Each task is one commit. Commit trailer on every commit:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn
```

---

## File structure

| File | Responsibility after this plan |
| --- | --- |
| `rust/crates/sittir-core/src/slot.rs` | `NodeCoordinate`; `SlotValue::{Coord, Transport}`; shape-directed `FromNapiValue`; `Render` |
| `rust/crates/sittir-core/src/render.rs` | `RenderSink::slice`; `RenderError::Coordinate` |
| `rust/crates/sittir-core/src/spacing.rs` | the writer holds the source table and implements `slice` |
| `rust/crates/sittir-core/src/prepare.rs` (new) | `SourceTable`, `RenderContext`, `CoordinateError`, the `Prepare` trait and its blanket impls |
| `rust/crates/sittir-core/src/classify.rs` (new) | `classify_whitespace`, `split_gap`, `majority`, `classify_list_gaps` |
| `rust/crates/sittir-core/src/options.rs` | `ResolvedOptions` and `reject_unknown_keys` only; `FillOptions` is gone |
| `rust/crates/sittir-core/src/engine.rs` | `ParsedTree.source: Arc<str>`; `SourceTable` for the tree map; `EngineGrammar::is_text_kind`; `encode_handle` public |
| `rust/crates/sittir-core/src/read_node.rs` | text captured only for anonymous tokens and text kinds |
| `rust/crates/sittir-core/src/napi_engine.rs` | `render` builds the `RenderContext` from its tree map |
| `rust/crates/sittir-core/tests/{prepare,classify}.rs` (new), `tests/options.rs` (deleted) | core tests |
| `packages/codegen/src/emitters/render-module.ts` | transports without inert metadata fields; `Prepare` impls with gap classification; `VerbatimTransport`; render entry and dispatch taking the context |
| `packages/codegen/src/emitters/render-options-rs.ts` | `pub fn allowed(site) -> &'static [u16]` |
| `packages/codegen/src/emitters/kind-id-rust.ts` | `pub fn is_text_kind(kind: KindId) -> bool` |
| `packages/codegen/src/emitters/is.ts`, `wrap.ts` | node test and supertype-stub gate keyed on the coordinate |
| `packages/common/src/transport-data.ts` | the fold: `foldsToCoordinate`, `asCoordinate`, `markEdited` detaches the coordinate |
| `packages/common/src/readNode.ts`, `engine.ts` | `SITTIR_DEBUG_TEXT` gone; `ParsedRoot` has no `$text` |
| `rust/crates/sittir-<g>/src/lib.rs` (three, hand-written) | `is_text_kind` delegates to the generated table |
| `packages/tools/src/{validate/common,validate/factory-render-parse,validate/from,emit/factory-source}.ts` | structural text read from `tree.source` by span |

---

### Task 1: The carrier gains a coordinate arm; the sink can slice one

**Files:**
- Modify: `rust/crates/sittir-core/src/slot.rs`
- Modify: `rust/crates/sittir-core/src/render.rs` (`RenderSink::slice`, `RenderError::Coordinate`)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (`with_sources`, `slice`)
- Modify: `rust/crates/sittir-core/src/prepare.rs` is created in Task 2; this task puts `SourceTable` and `CoordinateError` in `render.rs` so the sink can name them
- Modify: `rust/crates/sittir-core/src/lib.rs` (re-exports)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`encode_handle` becomes `pub`)

**Interfaces:**
- Produces:
  ```rust
  // render.rs
  pub trait SourceTable { fn source_of(&self, tree_id: u32) -> Option<&Arc<str>>; }
  #[derive(Debug, Clone, PartialEq, Eq)]
  pub enum CoordinateError { UnknownTree { handle: u64, tree_id: u32 }, BadSpan { handle: u64, detail: String } }
  pub enum RenderError { Fmt(fmt::Error), Coordinate(CoordinateError) }      // From<CoordinateError>
  pub trait RenderSink { …; fn slice(&mut self, coord: &NodeCoordinate) -> RenderResult; }
  // slot.rs
  pub struct NodeCoordinate { pub handle: u64, pub span: Span }
  impl NodeCoordinate {
      pub fn new(handle: u64, span: Span) -> Self;
      pub fn tree_id(&self) -> u32;                                                  // decode_handle(handle).0
      pub fn resolve<'s>(&self, sources: &'s dyn SourceTable) -> Result<&'s str, CoordinateError>;  // the slice, or why not
  }
  pub enum SlotValue<T, const ADJACENT: bool = false> { Coord(NodeCoordinate), Node(T), Verbatim(String) }
  impl SlotValue { pub fn coord(&self) -> Option<&NodeCoordinate>; }
  // spacing.rs
  impl SpacingWriter { pub fn with_sources(self, sources: &'a dyn SourceTable) -> Self; }   // a writer built without one refuses every coordinate
  ```
  `Node` and `Verbatim` survive until Task 3 so the generated crates keep compiling; `Coord` is dispatched first on the wire. Task 2 consumes `NodeCoordinate::resolve`; Task 3 renames `Node` to `Transport` and deletes `Verbatim`.

- [ ] **Step 1: Write the failing unit tests**

Append to the `mod tests` block in `rust/crates/sittir-core/src/slot.rs` (the block already has `Word: Render` and renders through `render_to_string`; add a `Sources` table and a `render_with` helper that builds the writer with `.with_sources(&sources)`):

```rust
    use super::NodeCoordinate;
    use crate::engine::encode_handle;
    use crate::render::{CoordinateError, SourceTable};
    use crate::types::Span;
    use std::collections::HashMap;
    use std::sync::Arc;

    struct Sources(HashMap<u32, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
            self.0.get(&tree_id)
        }
    }

    fn render_with(value: &dyn crate::render::Render, sources: &Sources) -> Result<String, crate::render::RenderError> {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, &WordMatcher::DEFAULT, &TABLE).with_sources(sources);
        value.render(&mut w)?;
        w.finish()?;
        Ok(out)
    }

    #[test]
    fn a_coordinate_renders_its_slice_of_its_own_tree() {
        let sources = Sources(HashMap::from([(3, Arc::from("let main() {}"))]));
        let coord = NodeCoordinate::new(encode_handle(3, 0), Span { start: 4, end: 8 });
        assert_eq!(coord.tree_id(), 3);
        assert_eq!(coord.resolve(&sources), Ok("main"));
        let slot: SlotValue<Word> = SlotValue::Coord(coord);
        assert_eq!(render_with(&slot, &sources).unwrap(), "main");
        assert!(slot.coord().is_some());
    }

    #[test]
    fn a_coordinate_into_an_unknown_tree_is_refused_with_its_handle() {
        let sources = Sources(HashMap::new());
        let handle = encode_handle(9, 2);
        let coord = NodeCoordinate::new(handle, Span { start: 0, end: 1 });
        assert_eq!(coord.resolve(&sources), Err(CoordinateError::UnknownTree { handle, tree_id: 9 }));
        let slot: SlotValue<Word> = SlotValue::Coord(coord);
        assert!(render_with(&slot, &sources).is_err());
    }

    #[test]
    fn a_span_outside_its_source_or_off_a_char_boundary_is_refused() {
        let sources = Sources(HashMap::from([(1, Arc::from("é")), (2, Arc::from("short"))]));
        let off = NodeCoordinate::new(encode_handle(1, 0), Span { start: 1, end: 2 });
        assert!(matches!(off.resolve(&sources), Err(CoordinateError::BadSpan { .. })));
        let out = NodeCoordinate::new(encode_handle(2, 0), Span { start: 2, end: 40 });
        let Err(CoordinateError::BadSpan { detail, .. }) = out.resolve(&sources) else { panic!() };
        assert!(detail.contains("2..40") && detail.contains("5"), "{detail}");
    }

    #[test]
    fn a_writer_without_sources_refuses_every_coordinate() {
        let slot: SlotValue<Word> = SlotValue::Coord(NodeCoordinate::new(encode_handle(1, 0), Span { start: 0, end: 1 }));
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, &WordMatcher::DEFAULT, &TABLE);
        assert!(slot.render(&mut w).is_err());
    }
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd rust && cargo test -p sittir-core --lib slot`
Expected: compile errors naming `NodeCoordinate`, `SlotValue::Coord`, `SourceTable`, `with_sources`.

- [ ] **Step 3: Implement**

`engine.rs`: `fn encode_handle` → `pub fn encode_handle`.

`render.rs`: add

```rust
use std::sync::Arc;

/// The live trees a render may slice, keyed by the tag a handle carries.
pub trait SourceTable {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CoordinateError {
    /// The handle's tag names no tree this engine holds: read elsewhere,
    /// already disposed, or never parsed.
    UnknownTree { handle: u64, tree_id: u32 },
    BadSpan { handle: u64, detail: String },
}

impl fmt::Display for CoordinateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownTree { handle, tree_id } => write!(
                f,
                "handle {handle} names tree {tree_id}, which this engine does not hold (never parsed, disposed, or read by another engine)"
            ),
            Self::BadSpan { handle, detail } => write!(f, "handle {handle}: {detail}"),
        }
    }
}

impl std::error::Error for CoordinateError {}
```

`RenderError` gains `Coordinate(CoordinateError)` with `Display`, and `From<CoordinateError>`. `RenderSink` gains `fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> RenderResult;`.

`slot.rs`:

```rust
use crate::engine::decode_handle;
use crate::render::{CoordinateError, SourceTable};
use crate::types::Span;

/// Where an untouched node's bytes live: the tagged handle that names its
/// tree and the byte span inside that tree's source. A pure value; the
/// source is looked up through the render context at the moment of use.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeCoordinate {
    pub handle: u64,
    pub span: Span,
}

impl NodeCoordinate {
    pub fn new(handle: u64, span: Span) -> Self {
        Self { handle, span }
    }

    pub fn tree_id(&self) -> u32 {
        decode_handle(self.handle).0
    }

    /// The bytes this coordinate names, or why the table cannot give them.
    pub fn resolve<'s>(&self, sources: &'s dyn SourceTable) -> Result<&'s str, CoordinateError> {
        let tree_id = self.tree_id();
        let source = sources
            .source_of(tree_id)
            .ok_or(CoordinateError::UnknownTree { handle: self.handle, tree_id })?;
        let (start, end) = (self.span.start as usize, self.span.end as usize);
        let in_range = start <= end && end <= source.len();
        if !in_range || !source.is_char_boundary(start) || !source.is_char_boundary(end) {
            return Err(CoordinateError::BadSpan {
                handle: self.handle,
                detail: format!("span {start}..{end} lies outside its source of {} bytes", source.len()),
            });
        }
        Ok(&source[start..end])
    }
}
```

The enum gains `Coord(NodeCoordinate)` as its first arm and `coord()`; `node()` returns `None` for `Coord`; `node_or_write(w)` writes `Coord` through `write_coord`; `Render` for `SlotValue`: `Coord(coord) => { if ADJACENT { w.adjacent(); } w.slice(coord) }`.

`FromNapiValue`: dispatch the coordinate shape first, before the existing offer-to-`T` logic:

```rust
        let value_type = unsafe { transport_value_type(env, napi_val)? };
        if value_type == ::napi::ValueType::Object {
            let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
            if let Some(handle) = obj.get::<f64>("$nodeHandle")? {
                let span: Span = obj.get("$span")?.ok_or_else(|| {
                    ::napi::Error::from_reason(format!("coordinate with $nodeHandle {handle} carries no $span"))
                })?;
                if !handle.is_finite() || handle < 0.0 {
                    return Err(::napi::Error::from_reason(format!("$nodeHandle {handle} is not a handle")));
                }
                return Ok(Self::Coord(NodeCoordinate::new(handle as u64, span)));
            }
        }
        // …existing offer-to-T-then-Verbatim body unchanged until Task 3…
```

`spacing.rs`: `SpacingWriter` gains `sources: Option<&'a dyn SourceTable>` (`None` from `new`), `pub fn with_sources(mut self, sources: &'a dyn SourceTable) -> Self`, and

```rust
    fn slice(&mut self, coord: &NodeCoordinate) -> RenderResult {
        let sources = self.sources.ok_or(CoordinateError::UnknownTree { handle: coord.handle, tree_id: coord.tree_id() })?;
        let text = coord.resolve(sources)?;
        self.write_chunk(text)?;
        Ok(())
    }
```

`lib.rs`: `pub use slot::NodeCoordinate;` and `pub use render::{CoordinateError, SourceTable};`.

- [ ] **Step 4: Run the tests and the workspace build**

Run: `cd rust && cargo test -p sittir-core --lib slot && cargo build --workspace`
Expected: the slot tests pass; workspace builds (generated crates untouched: their `render_transport_dispatch` builds the writer without sources, which is fine until Task 3).

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs
git commit -- rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs -m "feat(core): the slot carrier holds a coordinate; the sink slices it from the tree it names"
```

---

### Task 2: The prepare walk and gap classification

**Files:**
- Create: `rust/crates/sittir-core/src/prepare.rs`
- Create: `rust/crates/sittir-core/src/classify.rs`
- Create: `rust/crates/sittir-core/tests/prepare.rs`, `rust/crates/sittir-core/tests/classify.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs` (`pub mod prepare; pub mod classify;` and re-exports)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`ParsedTree.source: Arc<str>`; `SourceTable` impl; `EngineGrammar::is_text_kind` with a default of `true` until Task 5)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (`seam_rank` and `is_depth_text` become `pub`)

**Interfaces:**
- Consumes: `NodeCoordinate::{tree_id, resolve, span}`, `SourceTable`, `CoordinateError` from Task 1.
- Produces:
  ```rust
  // prepare.rs
  pub struct RenderContext<'a> { pub options: &'a ResolvedOptions, pub sources: &'a dyn SourceTable }
  pub trait Prepare { fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>; }
  // impls: SlotValue<T,A> (Coord: resolve, discard the slice), Vec<T>, Option<T>, Box<T>, String, bool, u8, u16
  // classify.rs
  pub fn classify_whitespace(ws: &str, allowed: &[u16], text_of: fn(u16) -> &'static str) -> Option<u16>;
  pub fn split_gap<'a>(gap: &'a str, token: &str) -> Option<(&'a str, &'a str)>;
  pub fn majority(classes: impl IntoIterator<Item = u16>) -> Option<u16>;
  pub fn classify_list_gaps(items: &[Option<&NodeCoordinate>], sources: &dyn SourceTable, token: &str, allowed_before: &[u16], allowed_after: &[u16], text_of: fn(u16) -> &'static str) -> (Option<u16>, Option<u16>);
  // engine.rs
  impl<G: EngineGrammar> SourceTable for HashMap<u32, ParsedTree<G>>;
  pub trait EngineGrammar: Copy { …; fn is_text_kind(self, kind: KindId) -> bool { true } }
  ```
  Task 3 generates `Prepare` impls and calls `render_transport_parts(transport, &RenderContext)`; Task 6 emits `classify_list_gaps` calls.

- [ ] **Step 1: Write the failing prepare tests**

`rust/crates/sittir-core/tests/prepare.rs`:

```rust
use std::collections::HashMap;
use std::sync::Arc;

use sittir_core::engine::encode_handle;
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::{Prepare, RenderContext};
use sittir_core::render::{CoordinateError, SourceTable};
use sittir_core::types::Span;
use sittir_core::{NodeCoordinate, SlotValue};

struct Sources(HashMap<u32, Arc<str>>);
impl SourceTable for Sources {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.0.get(&tree_id)
    }
}

struct Leaf;
impl Prepare for Leaf {
    fn prepare(&mut self, _: &RenderContext<'_>) -> Result<(), CoordinateError> {
        Ok(())
    }
}

struct List {
    space_after: Option<u16>,
    items: Vec<SlotValue<Leaf>>,
}
impl Prepare for List {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        self.items.prepare(ctx)?;
        self.space_after.get_or_insert(ctx.options.spacing[0]);
        Ok(())
    }
}

fn ctx<'a>(options: &'a ResolvedOptions, sources: &'a Sources) -> RenderContext<'a> {
    RenderContext { options, sources }
}

#[test]
fn a_coordinate_is_checked_against_its_tree_and_an_unset_site_takes_the_table() {
    let options = ResolvedOptions { spacing: vec![168], ..ResolvedOptions::default() };
    let sources = Sources(HashMap::from([(7, Arc::from("fn a() {}"))]));
    let mut list = List {
        space_after: None,
        items: vec![SlotValue::Coord(NodeCoordinate::new(encode_handle(7, 0), Span { start: 3, end: 4 })), SlotValue::Node(Leaf)],
    };
    list.prepare(&ctx(&options, &sources)).unwrap();
    assert_eq!(list.space_after, Some(168));
}

#[test]
fn a_set_site_keeps_its_wire_value() {
    let options = ResolvedOptions { spacing: vec![168], ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut list = List { space_after: Some(167), items: vec![] };
    list.prepare(&ctx(&options, &sources)).unwrap();
    assert_eq!(list.space_after, Some(167));
}

#[test]
fn a_coordinate_into_an_unknown_tree_fails_the_walk_with_its_handle() {
    let options = ResolvedOptions::default();
    let sources = Sources(HashMap::new());
    let handle = encode_handle(9, 2);
    let mut slot: SlotValue<Leaf> = SlotValue::Coord(NodeCoordinate::new(handle, Span { start: 0, end: 1 }));
    assert_eq!(slot.prepare(&ctx(&options, &sources)), Err(CoordinateError::UnknownTree { handle, tree_id: 9 }));
}

#[test]
fn a_span_outside_its_tree_fails_the_walk() {
    let options = ResolvedOptions::default();
    let sources = Sources(HashMap::from([(1, Arc::from("ab"))]));
    let handle = encode_handle(1, 0);
    let mut slot: SlotValue<Leaf> = SlotValue::Coord(NodeCoordinate::new(handle, Span { start: 0, end: 5 }));
    assert!(matches!(slot.prepare(&ctx(&options, &sources)), Err(CoordinateError::BadSpan { handle: h, .. }) if h == handle));
}
```

- [ ] **Step 2: Write the failing classify tests**

`rust/crates/sittir-core/tests/classify.rs`:

```rust
use std::collections::HashMap;
use std::sync::Arc;

use sittir_core::classify::{classify_list_gaps, classify_whitespace, majority, split_gap};
use sittir_core::engine::encode_handle;
use sittir_core::render::SourceTable;
use sittir_core::types::Span;
use sittir_core::NodeCoordinate;

const TIGHT: u16 = 167;
const SPACE: u16 = 168;
const NEWLINE: u16 = 169;
const BLANKLINE: u16 = 170;
const INDENT: u16 = 171;

fn text_of(kind: u16) -> &'static str {
    match kind {
        TIGHT => "",
        SPACE => " ",
        NEWLINE => "\n",
        BLANKLINE => "\n\n",
        INDENT => "\u{FDD0}\n",
        _ => "",
    }
}
const ALL: &[u16] = &[TIGHT, SPACE, NEWLINE, BLANKLINE, INDENT];

struct Sources(HashMap<u32, Arc<str>>);
impl SourceTable for Sources {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.0.get(&tree_id)
    }
}

#[test]
fn whitespace_classifies_by_seam_rank_and_never_to_a_depth_arm() {
    assert_eq!(classify_whitespace("", ALL, text_of), Some(TIGHT));
    assert_eq!(classify_whitespace("  \t", ALL, text_of), Some(SPACE));
    assert_eq!(classify_whitespace("\n", ALL, text_of), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n    ", ALL, text_of), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n\n", ALL, text_of), Some(BLANKLINE));
    assert_eq!(classify_whitespace("\n\n\n\n", ALL, text_of), Some(BLANKLINE));
    assert_eq!(classify_whitespace("\n\n", &[TIGHT, NEWLINE], text_of), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n", &[INDENT], text_of), None);
}

#[test]
fn a_separated_gap_splits_around_its_token_once() {
    assert_eq!(split_gap(" , ", ","), Some((" ", " ")));
    assert_eq!(split_gap(",\n", ","), Some(("", "\n")));
    assert_eq!(split_gap("\n", ","), None);
    assert_eq!(split_gap("\n\n", ""), Some(("\n\n", "")));
}

#[test]
fn majority_is_the_most_frequent_class_and_the_first_seen_wins_a_tie() {
    assert_eq!(majority([NEWLINE, BLANKLINE, NEWLINE]), Some(NEWLINE));
    assert_eq!(majority([BLANKLINE, NEWLINE]), Some(BLANKLINE));
    assert_eq!(majority([]), None);
}

fn coord(tree: u32, start: u32, end: u32) -> NodeCoordinate {
    NodeCoordinate::new(encode_handle(tree, 0), Span { start, end })
}

#[test]
fn a_comma_list_takes_the_majority_of_its_gaps_per_side() {
    let sources = Sources(HashMap::from([(1, Arc::from("f(a, b,c ,d)"))]));
    let (a, b, c, d) = (coord(1, 2, 3), coord(1, 5, 6), coord(1, 7, 8), coord(1, 10, 11));
    let items = [Some(&a), Some(&b), Some(&c), Some(&d)];
    assert_eq!(classify_list_gaps(&items, &sources, ",", ALL, ALL, text_of), (Some(TIGHT), Some(SPACE)));
}

#[test]
fn an_unseparated_repeat_classifies_the_whole_gap_on_one_side() {
    let sources = Sources(HashMap::from([(1, Arc::from("{\n  a;\n\n  b;\n  c;\n}"))]));
    let (a, b, c) = (coord(1, 4, 6), coord(1, 10, 12), coord(1, 15, 17));
    let items = [Some(&a), Some(&b), Some(&c)];
    assert_eq!(classify_list_gaps(&items, &sources, "", ALL, &[], text_of), (Some(NEWLINE), None));
}

#[test]
fn a_pair_that_is_not_two_ordered_coordinates_of_one_tree_contributes_nothing() {
    let sources = Sources(HashMap::from([(1, Arc::from("a, b")), (2, Arc::from("x,y"))]));
    let (a, b, x) = (coord(1, 0, 1), coord(1, 3, 4), coord(2, 0, 1));
    assert_eq!(classify_list_gaps(&[Some(&b), Some(&a)], &sources, ",", ALL, ALL, text_of), (None, None));
    assert_eq!(classify_list_gaps(&[Some(&a), Some(&x)], &sources, ",", ALL, ALL, text_of), (None, None));
    assert_eq!(classify_list_gaps(&[Some(&a), None, Some(&b)], &sources, ",", ALL, ALL, text_of), (None, None));
}
```

- [ ] **Step 3: Run both test files to see them fail**

Run: `cd rust && cargo test -p sittir-core --test prepare --test classify`
Expected: compile errors naming `sittir_core::prepare` and `sittir_core::classify`.

- [ ] **Step 4: Implement `prepare.rs`**

```rust
//! The walk a render makes over every slot before writing a byte: it
//! checks each coordinate against the tree it names, classifies the gaps
//! between still-parsed list items, and fills every unset spacing and flank
//! field from the resolved options. The context is an argument at every
//! level; nothing ambient carries the trees or the table.

use crate::options::ResolvedOptions;
use crate::render::{CoordinateError, SourceTable};
use crate::slot::SlotValue;

pub struct RenderContext<'a> {
    pub options: &'a ResolvedOptions,
    pub sources: &'a dyn SourceTable,
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
}

impl<T: Prepare, const ADJACENT: bool> Prepare for SlotValue<T, ADJACENT> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            SlotValue::Coord(coord) => coord.resolve(ctx.sources).map(|_| ()),
            SlotValue::Node(node) => node.prepare(ctx),
            SlotValue::Verbatim(_) => Ok(()),
        }
    }
}

impl<T: Prepare> Prepare for Vec<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        self.iter_mut().try_for_each(|item| item.prepare(ctx))
    }
}

impl<T: Prepare> Prepare for Option<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            Some(item) => item.prepare(ctx),
            None => Ok(()),
        }
    }
}

impl<T: Prepare + ?Sized> Prepare for Box<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
    }
}

macro_rules! inert {
    ($($t:ty),*) => {$(
        impl Prepare for $t {
            fn prepare(&mut self, _: &RenderContext<'_>) -> Result<(), CoordinateError> { Ok(()) }
        }
    )*};
}
inert!(String, bool, u8, u16);
```

(The `Node` and `Verbatim` arms are rewritten in Task 3 when those arms change.)

- [ ] **Step 5: Implement `classify.rs`**

```rust
//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::SourceTable;
use crate::slot::NodeCoordinate;
use crate::spacing::{is_depth_text, seam_rank};

/// The admitted arm whose text has `ws`'s seam rank; a wider run takes the
/// widest admitted arm below it. Depth arms never classify: indentation
/// belongs to the writer's depth tracking, not to a gap's spelling.
pub fn classify_whitespace(ws: &str, allowed: &[u16], text_of: fn(u16) -> &'static str) -> Option<u16> {
    let want = seam_rank(ws);
    let ranked: Vec<(u16, usize)> = allowed
        .iter()
        .copied()
        .filter(|&arm| !is_depth_text(text_of(arm)))
        .map(|arm| (arm, seam_rank(text_of(arm))))
        .collect();
    if let Some(&(arm, _)) = ranked.iter().find(|(_, rank)| *rank == want) {
        return Some(arm);
    }
    ranked.iter().filter(|(_, rank)| *rank < want).max_by_key(|(_, rank)| *rank).map(|&(arm, _)| arm)
}

/// The text before and after the first `token` in `gap`; an empty token
/// makes the whole gap the "before" side. `None` when the token is absent.
pub fn split_gap<'a>(gap: &'a str, token: &str) -> Option<(&'a str, &'a str)> {
    if token.is_empty() {
        return Some((gap, ""));
    }
    let at = gap.find(token)?;
    Some((&gap[..at], &gap[at + token.len()..]))
}

/// The most frequent class; the first seen wins a tie.
pub fn majority(classes: impl IntoIterator<Item = u16>) -> Option<u16> {
    let mut counts: Vec<(u16, usize)> = Vec::new();
    for class in classes {
        match counts.iter_mut().find(|(c, _)| *c == class) {
            Some((_, n)) => *n += 1,
            None => counts.push((class, 1)),
        }
    }
    counts.iter().max_by_key(|(_, n)| *n).map(|&(class, _)| class)
}

/// The gap between two consecutive items when both are coordinates of one
/// live tree in source order.
fn gap_between<'s>(a: &NodeCoordinate, b: &NodeCoordinate, sources: &'s dyn SourceTable) -> Option<&'s str> {
    if a.tree_id() != b.tree_id() || a.span.end > b.span.start {
        return None;
    }
    let source = sources.source_of(a.tree_id())?;
    source.get(a.span.end as usize..b.span.start as usize)
}

/// One class per side over every classifiable gap of a list, by majority.
/// A pair that is not two ordered coordinates of one tree, or a gap without
/// the token, contributes nothing.
pub fn classify_list_gaps(
    items: &[Option<&NodeCoordinate>],
    sources: &dyn SourceTable,
    token: &str,
    allowed_before: &[u16],
    allowed_after: &[u16],
    text_of: fn(u16) -> &'static str,
) -> (Option<u16>, Option<u16>) {
    let mut before = Vec::new();
    let mut after = Vec::new();
    for pair in items.windows(2) {
        let (Some(a), Some(b)) = (pair[0], pair[1]) else { continue };
        let Some(gap) = gap_between(a, b, sources) else { continue };
        let Some((lead, trail)) = split_gap(gap, token) else { continue };
        if let Some(class) = classify_whitespace(lead, allowed_before, text_of) {
            before.push(class);
        }
        if let Some(class) = classify_whitespace(trail, allowed_after, text_of) {
            after.push(class);
        }
    }
    (majority(before), majority(after))
}
```

In `spacing.rs` make `seam_rank` `pub` and add `pub fn is_depth_text(text: &str) -> bool { text.starts_with('\u{FDD0}') || text.starts_with('\u{FDD1}') }` — the two characters are the depth arms' stamped identity in the model (`INDENT_TEXT`/`DEDENT_TEXT` in `dsl/primitives/spacing.ts`), which `classify_whitespace` receives through `text_of` from the model's text table, not from the writer.

- [ ] **Step 6: Wire the modules and the engine**

`lib.rs`: `pub mod classify; pub mod prepare;` and `pub use prepare::{Prepare, RenderContext};`.

`engine.rs`:

```rust
use std::collections::HashMap;
use std::sync::Arc;
use crate::render::SourceTable;
use crate::types::KindId;

pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn render_module_hash(self) -> &'static str;
    /// Whether the reader captures a named node of this kind as text: its
    /// template renders from `$text`, so the text is the node's content.
    fn is_text_kind(self, kind: KindId) -> bool {
        let _ = kind;
        true
    }
}

pub struct ParsedTree<G: EngineGrammar> {
    // …
    source: Arc<str>,
    // …
}

impl<G: EngineGrammar> SourceTable for HashMap<u32, ParsedTree<G>> {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.get(&tree_id).map(|tree| &tree.source)
    }
}
```

`Engine::parse` builds `source: Arc::from(source)`. `read_root` / `read_child` pass `&self.source`. `ParsedTree::source(&self) -> &str` returns `&self.source`.

- [ ] **Step 7: Run the core tests and the workspace build**

Run: `cd rust && cargo test -p sittir-core && cargo build --workspace`
Expected: prepare 4/4, classify 6/6, everything else unchanged; workspace builds.

- [ ] **Step 8: Commit**

```bash
git add rust/crates/sittir-core/src/prepare.rs rust/crates/sittir-core/src/classify.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/tests/prepare.rs rust/crates/sittir-core/tests/classify.rs
git commit -- rust/crates/sittir-core/src/prepare.rs rust/crates/sittir-core/src/classify.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/tests/prepare.rs rust/crates/sittir-core/tests/classify.rs -m "feat(core): the prepare walk checks coordinates against their tree and classifies list gaps"
```

---

### Task 3: The emitters render through coordinates; the old arms go

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` — `TRANSPORT_METADATA_FIELDS`, `renderTransportMetadataFields`, `renderLeafTransportNapiImpls`, `renderLeafTransportPlainFields`, `prepareStructImpl` (the fill impl the sink plan left as `fillOptionsStructImpl` — rename here), `fillOptionsEnumImpl`, `noopFillOptionsImpl`, `armSeamSupport`, `seatLoops`, `seatVariantArms`, `renderTransportEntry`, `buildSlotWriteCall`, `emitPerSlotChildEnum`, `emitSupertypeTransportEnum`, `renderTransportSupport`, `renderTypedDispatch` (the root dispatch), the `.node()` use in `buildTypedTemplateBody`
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`allowed`)
- Modify: `rust/crates/sittir-core/src/slot.rs` (delete `Node`/`Verbatim`, add `Transport`), `prepare.rs` (arms), `options.rs` (delete `FillOptions`), `napi_engine.rs` (`render`), `tests/options.rs` (delete), `tests/prepare.rs` (`Node` → `Transport`)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `NodeCoordinate`, `SlotValue::Coord`, `Prepare`, `RenderContext`, `CoordinateError`, `RenderSink::slice`, `SpacingWriter::with_sources` from Tasks 1–2; `Render`, `RenderSink`, `RenderError` from the sink plan.
- Produces, in every generated `transport.rs`:
  ```rust
  pub struct VerbatimTransport { pub text: String }              // text-only, no kind tag; Render writes the text
  pub enum <Slot>Transport { …, Verbatim(VerbatimTransport) }    // only when a member is pattern-modeled
  impl ::sittir_core::prepare::Prepare for <Every transport type> { fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> }
  pub fn render_transport_dispatch(transport: &dyn Render, ctx: &RenderContext<'_>) -> Result<String, RenderError>
  pub fn render_transport_parts(mut transport: RenderRoot, ctx: &RenderContext<'_>) -> Result<(TransportSource, String), RenderError>
  ```
  and in `options.rs`: `pub fn allowed(site: usize) -> &'static [u16] { SPACING_SITES[site].4 }`.
  Transport structs no longer declare `$source`, `$named`, `$span`, `$nodeHandle`, `$childIndex`; compound structs also drop `$text`. `$_trivia` stays.

- [ ] **Step 1: Write the failing emitter tests**

In `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, inside the rust-grammar pipeline `describe` (reuse its `transportRs` string), add:

```ts
	it('carries every slot as Coord or Transport and never a bare string', () => {
		expect(transportRs).not.toContain('SlotValue::Node(');
		expect(transportRs).not.toContain('SlotValue::Verbatim(');
		expect(transportRs).toContain('SlotValue::Transport(');
	});

	it('declares no inert metadata on transports', () => {
		for (const field of ['transport_span', 'transport_node_handle', 'transport_child_index', 'transport_source', 'transport_named']) {
			expect(transportRs).not.toContain(`pub ${field}:`);
		}
		expect(transportRs).toContain('pub transport_trivia_data: Option<TransportTrivia>');
	});

	it('prepares every transport through the render context and renders with its sources', () => {
		expect(transportRs).not.toContain('FillOptions');
		expect(transportRs).toContain('impl ::sittir_core::prepare::Prepare for FunctionItemTransport {');
		expect(transportRs).toContain("fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {");
		expect(transportRs).toContain('.get_or_insert(ctx.options.spacing[options::');
		expect(transportRs).toContain("pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {");
		expect(transportRs).toContain('.with_indent(&ctx.options.indent).with_sources(ctx.sources)');
		expect(transportRs).toContain(
			"pub fn render_transport_parts(\n    mut transport: RenderRoot,\n    ctx: &::sittir_core::prepare::RenderContext<'_>,\n) -> Result<(TransportSource, String), ::sittir_core::render::RenderError> {"
		);
	});

	it('admits verbatim text only where a slot admits a pattern kind', () => {
		expect(transportRs).toContain('pub struct VerbatimTransport {');
		expect(transportRs).toMatch(/pub enum FunctionItemNameTransport \{[^}]*Verbatim\(VerbatimTransport\),/s);
		expect(transportRs).toMatch(/pub enum StatementTransport \{(?:(?!Verbatim)[^}])*\}/s);
	});
```

In `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts` add:

```ts
	it('exposes each site\'s admitted arms to the prepare walk', () => {
		const source = renderOptionsRs(planRenderOptions(sites, kindEntries, whitespaceText), addresses, kindEntries);
		expect(source).toContain('pub fn allowed(site: usize) -> &\'static [u16] {\n    SPACING_SITES[site].4\n}');
	});
```

(`addresses` is the `deriveAddressTables(...)` value the sink plan's test already builds in this file.)

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
Expected: the five new cases fail on the old spellings.

- [ ] **Step 3: Core — finish the carrier**

`slot.rs`: the enum is exactly

```rust
pub enum SlotValue<T, const ADJACENT: bool = false> {
    /// The content is in the tree: checked by the prepare walk, sliced by the sink.
    Coord(NodeCoordinate),
    /// The content is in this message.
    Transport(T),
}
```

Rename `node()` → `transport()`, `node_or_write()` → `transport_or_write()` (Coord arm: `if ADJACENT { w.adjacent(); } w.slice(coord)?; Ok(None)`; Transport returns `Some`). Delete `captured_source_text` and `write_verbatim`. `FromNapiValue` becomes shape-directed with no fallback:

```rust
        let value_type = unsafe { transport_value_type(env, napi_val)? };
        if value_type == ::napi::ValueType::Object {
            let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
            if let Some(handle) = obj.get::<f64>("$nodeHandle")? {
                let span: Span = obj.get("$span")?.ok_or_else(|| {
                    ::napi::Error::from_reason(format!("coordinate with $nodeHandle {handle} carries no $span"))
                })?;
                if !handle.is_finite() || handle < 0.0 {
                    return Err(::napi::Error::from_reason(format!("$nodeHandle {handle} is not a handle")));
                }
                return Ok(Self::Coord(NodeCoordinate::new(handle as u64, span)));
            }
        }
        Ok(Self::Transport(unsafe { T::from_napi_value(env, napi_val)? }))
```

Update the module doc comment: the content is in the tree or in the message; free text belongs to a transport that admits it. Update the slot unit tests (`SlotValue::Node(Word(..))` → `Transport`, delete `verbatim_renders_its_text`, rename the write test to `transport_or_write_writes_only_the_coordinate_case`).

`prepare.rs`: the `SlotValue` impl matches `Coord` and `Transport(t) => t.prepare(ctx)`. `tests/prepare.rs`: `SlotValue::Node(Leaf)` → `SlotValue::Transport(Leaf)`.

`options.rs`: delete `FillOptions` and every impl; keep `ResolvedOptions` and `reject_unknown_keys`; module doc becomes "Resolved render options: one kind id per spacing site, one bitflag per flank site, the indent unit." Delete `tests/options.rs`.

`napi_engine.rs` `render`:

```rust
                let resolved;
                let table = match options {
                    Some(opts) => {
                        resolved = $resolve(&opts, self.engine.options()).map_err(::napi::Error::from_reason)?;
                        &resolved
                    }
                    None => self.engine.options(),
                };
                let ctx = $crate::prepare::RenderContext { options: table, sources: &self.trees };
                let (source, canonical) = $render_parts(transport, &ctx).map_err(|e| {
                    ::napi::Error::from_reason(format!("render failed: {e}"))
                })?;
```

(`tree_id` and the format lookup stay as they are.)

- [ ] **Step 4: Emitter — metadata fields and the carrier spelling**

`TRANSPORT_METADATA_FIELDS` keeps only `$_trivia`. `renderTransportMetadataFields(includeText)` emits the trivia field and, when `includeText`, nothing else (compound structs pass `false` from `renderTransportDataStruct`; leaf structs keep their `text: String`). `renderLeafTransportPlainFields` returns `['    pub transport_trivia_data: Option<TransportTrivia>,', '    pub text: String,']`. In `renderLeafTransportNapiImpls` the constructed struct is `Self { transport_trivia_data: __trivia, text }`. Search the file for every other `transport_source`, `transport_named`, `transport_span`, `transport_node_handle`, `transport_child_index` spelling (the `ToNapiValue` impls, `renderTriviaTransportSupport`, the `bridgeMap` consumers) and remove those fields there too; the `debug-transport` feature impls follow the same shape. The empty-slots `transport_text` fast path in `buildTypedTemplateBody` goes with the field.

Replace every `SlotValue::Node(` with `SlotValue::Transport(` (`seatVariantArms`, `seatLoops`) and `.node()` with `.transport()` (the backing-field bind in `buildTypedTemplateBody`), `node_or_write` with `transport_or_write` (`buildSlotWriteCall`).

- [ ] **Step 5: Emitter — the prepare impls and the context**

Rename `fillOptionsStructImpl` → `prepareStructImpl`, `fillOptionsEnumImpl` → `prepareEnumImpl`, `noopFillOptionsImpl` → `inertPrepareImpl`. Each emits:

```ts
const PREPARE_SIG = "fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {";

function prepareStructImpl(structName, node, fillFields, plan, isCompound, nodeMap): string[] {
	const body: string[] = [];
	if (isCompound) {
		for (const f of fillFields) body.push(`        self.${f}.prepare(ctx)?;`);
		for (const site of synthesizedSpacingSites(plan, node)) {
			body.push(`        self.${rustFieldIdent(site.fieldIdent)}.get_or_insert(ctx.options.spacing[options::${site.constName}]);`);
		}
		body.push(...seatLoops(plan, node, nodeMap));
		const delim = node instanceof AssembledList ? delimiterSiteOf(plan, node) : undefined;
		if (delim !== undefined) body.push(`        self.delimiter.get_or_insert(ctx.options.delimiter[options::${delim.constName}]);`);
		const sep = node instanceof AssembledList ? separatorSiteOf(plan, node) : undefined;
		if (sep !== undefined) body.push(`        self.separator_kind.get_or_insert(ctx.options.spacing[options::${sep.constName}]);`);
	}
	return [
		`impl ::sittir_core::prepare::Prepare for ${structName} {`,
		`    ${body.length > 0 ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		...body,
		`        Ok(())`,
		`    }`,
		`}`,
		''
	];
}
```

Children are prepared **first** so that Task 6's classification runs over checked coordinates. `prepareEnumImpl` matches each payload arm to `t.prepare(ctx)` and each literal arm to `Ok(())`; the match is the function's tail expression. `inertPrepareImpl` returns `Ok(())`. In `seatVariantArms` the seat line becomes `t.<field>.get_or_insert(ctx.options.spacing[options::…]);`. `armSeamSupport`'s `Seamed<T>` impl becomes a `Prepare` impl reading `ctx.options.spacing`, returning `Ok(())`.

`renderTypedDispatch`'s root:

```rust
pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {
    let mut s = String::new();
    let mut w = ::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER, &options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources);
    transport.render(&mut w)?;
    w.finish()?;
    Ok(s)
}
```

`renderTransportEntry`:

```rust
pub fn render_transport_parts(
    mut transport: RenderRoot,
    ctx: &::sittir_core::prepare::RenderContext<'_>,
) -> Result<(TransportSource, String), ::sittir_core::render::RenderError> {
    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;
    let rendered = render_transport_dispatch(&transport, ctx)?;
    Ok((TransportSource::Factory, rendered))
}
```

`render-options-rs.ts` appends after `spacing_text`:

```rust
pub fn allowed(site: usize) -> &'static [u16] {
    SPACING_SITES[site].4
}
```

- [ ] **Step 6: Emitter — `VerbatimTransport`**

In `renderTransportSupport`, before the per-slot enums, emit once:

```rust
/// Text that is a slot's content with no kind of its own: a bare string
/// written into a slot whose members all render from their text.
#[derive(Debug, Clone)]
pub struct VerbatimTransport {
    pub text: String,
}

impl ::sittir_core::render::Render for VerbatimTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        w.text(&self.text)
    }
}

impl ::sittir_core::prepare::Prepare for VerbatimTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}
```

In `emitPerSlotChildEnum` and `emitSupertypeTransportEnum`, compute `const admitsVerbatim = validKinds.some(({ node }) => node.modelType === 'pattern');` (for the supertype enum, over its concrete members). When true: add the arm `Verbatim(VerbatimTransport),`, a `Verbatim(t) => t.prepare(ctx)` arm in the prepare impl, a `Verbatim(t) => t.render(w)` arm in the `Render` impl, and in `emitTransportEnumFromNapiValueBody` a String arm — give it a third parameter `admitsVerbatim: boolean` and emit, before the `_ =>` arm:

```ts
	if (admitsVerbatim) {
		lines.push(`            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),`);
	}
```

The `_ =>` error text becomes `"${enumName}: expected u16 kind_id, string, or object with $type"` when there is a verbatim arm. Every bridge-to-`AnyTransport` function (`*_transport_slot_to_any`) gets a `Verbatim(t) => AnyTransport::Verbatim(t)` arm, and `AnyTransport` gains the `Verbatim(VerbatimTransport)` arm with a `Render` arm (`AnyTransport::from_napi_value` does **not** accept strings).

- [ ] **Step 7: Glossary**

In `docs/glossary/emitters.md`: rename the headings `fillOptionsStructImpl` → `prepareStructImpl`, `fillOptionsEnumImpl` → `prepareEnumImpl`, add `inertPrepareImpl`, `PREPARE_SIG`, and update `renderTransportEntry`, `renderTypedDispatch`, `renderTransportMetadataFields`, `renderLeafTransportNapiImpls`, `emitTransportEnumFromNapiValueBody`, `emitPerSlotChildEnum`, `armSeamSupport`, `seatLoops` entries to describe the prepare walk, the context argument, the verbatim arm and the dropped metadata fields. In `render-options-rs.ts`'s section add `allowed`.

- [ ] **Step 8: Type-check, unit tests, regenerate, build**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

Expected: tsc clean; the two test files green; three regenerations; workspace builds and tests pass.

- [ ] **Step 9: Gates**

```bash
pnpm run validate:native && pnpm run validate:history
pnpm exec vitest run
bash scripts/comment-slop-check.sh --working
pnpm exec tsx packages/cli/src/cli.ts tool propose-14
```

Expected: `validate:history` identical to the baselines (an untouched subtree still renders from its span exactly as it rendered from its text); vitest green (`collect-baseline` may flake under load, 13/13 alone); slop clean; propose-14 unchanged. A byte difference in any dogfood example is a finding to review, not to revert.

- [ ] **Step 10: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts docs/glossary/emitters.md rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/prepare.rs rust/crates/sittir-core/src/options.rs rust/crates/sittir-core/src/napi_engine.rs rust/crates/sittir-core/tests/prepare.rs rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git rm -q rust/crates/sittir-core/tests/options.rs
git commit -- packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts docs/glossary/emitters.md rust/crates/sittir-core packages/rust packages/typescript packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render -m "feat(render): transports render an untouched node from its coordinate; verbatim text is a transport"
```

(Confirm with `git status --short` that only generated outputs, the emitter, core and the glossary are staged; the manifest and bundled `grammar.js` churn is expected.)

---

### Task 4: The projection folds by coordinate; an edit detaches it

**Files:**
- Modify: `packages/common/src/transport-data.ts`
- Create: `packages/common/tests/transport-data.test.ts`
- Modify: `packages/codegen/src/emitters/is.ts` (`isNode`), `packages/codegen/src/emitters/wrap.ts` (the supertype-collapse gate that tests `$text`)
- Modify: `packages/rust/tests/read-depth.test.ts`
- Modify: `docs/glossary/emitters.md` (`is.ts::isNode` body, the wrap supertype gate)

**Interfaces:**
- Consumes: the native `Coord` dispatch on `$nodeHandle` (Task 3).
- Produces (`@sittir/common`):
  ```ts
  export function markEdited<T extends object>(data: T): Omit<T, '$nodeHandle' | '$span' | '$childIndex'>;
  export function toTransportData(node: AnyNodeData, normalize?: NormalizeNodeStorage): AnyNodeData;  // folds
  ```
  A folded node on the wire is `{ $type, $nodeHandle, $span, $childIndex?, $named?, $source? }`. A structural node that does not fold crosses without `$nodeHandle`, `$span`, `$childIndex` or `$text`. Leaves keep `$text` and `$span`.

- [ ] **Step 1: Write the failing projection tests**

`packages/common/tests/transport-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { markEdited, toTransportData } from '../src/transport-data.ts';

const leaf = (text: string, start: number) => ({ $type: 1, $source: 0, $named: true, $text: text, $span: { start, end: start + text.length } });
const stub = (start: number, end: number, childIndex: number) => ({ $type: 2, $source: 0, $named: true, $span: { start, end }, $nodeHandle: 0, $childIndex: childIndex });

describe('toTransportData', () => {
	it('folds an unedited node with only stubs and leaves below it to its coordinate', () => {
		const node = { $type: 3, $source: 0, $named: true, $span: { start: 0, end: 20 }, $nodeHandle: 0, _name: leaf('main', 3), _body: stub(8, 20, 2) };
		expect(toTransportData(node as never)).toEqual({ $type: 3, $source: 0, $named: true, $span: { start: 0, end: 20 }, $nodeHandle: 0 });
	});

	it('keeps a node whose child was replaced, and strips its coordinate', () => {
		const rebuilt = { $type: 9, $source: 2, $named: true, _x: leaf('y', 0) };
		const node = { $type: 3, $source: 0, $named: true, $span: { start: 0, end: 20 }, $nodeHandle: 0, _name: leaf('main', 3), _body: rebuilt };
		const out = toTransportData(node as never) as Record<string, unknown>;
		expect(out.$nodeHandle).toBeUndefined();
		expect(out.$span).toBeUndefined();
		expect(out._body).toEqual(rebuilt);
	});

	it('folds an untouched child inside an edited parent', () => {
		const parent = { $type: 3, $source: 0, $named: true, _a: stub(0, 4, 0), _b: { $type: 9, $source: 2, $named: true } };
		const out = toTransportData(parent as never) as Record<string, unknown>;
		expect(out._a).toEqual(stub(0, 4, 0));
	});

	it('does not fold a node that carries trivia', () => {
		const node = { $type: 3, $source: 0, $named: true, $span: { start: 0, end: 4 }, $nodeHandle: 0, $_trivia: { leading: [leaf('// c', 0)] }, _a: stub(0, 4, 0) };
		const out = toTransportData(node as never) as Record<string, unknown>;
		expect(out.$nodeHandle).toBeUndefined();
		expect(out.$_trivia).toBeDefined();
	});

	it('never lets a structural node cross with $text', () => {
		const node = { $type: 3, $source: 0, $named: true, $text: 'stale', _a: { $type: 9, $source: 2, $named: true } };
		expect((toTransportData(node as never) as Record<string, unknown>).$text).toBeUndefined();
	});
});

describe('markEdited', () => {
	it('detaches the coordinate and nothing else', () => {
		const out = markEdited({ $type: 3, $span: { start: 0, end: 1 }, $nodeHandle: 4, $childIndex: 1, $text: 'x', _a: 1 });
		expect(out).toEqual({ $type: 3, $text: 'x', _a: 1 });
	});
});
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm exec vitest run packages/common/tests/transport-data.test.ts`
Expected: the fold cases fail (today the gate is `$text`), `markEdited` fails (it strips `$text`).

- [ ] **Step 3: Implement the fold**

Replace `hasStructure`, `isUnexpandedStub`, `markEdited`, `isUntouchedSubtree`, `asCapturedText` and `projectValue` in `packages/common/src/transport-data.ts` with:

```ts
const COORDINATE_KEYS = ['$nodeHandle', '$span', '$childIndex'] as const;

function isStorageKey(key: string): boolean {
	return key.startsWith('_') || key === '$other';
}

/** A node still bound to the tree it was read from. */
function carriesCoordinate(record: Record<string, unknown>): boolean {
	return typeof record.$nodeHandle === 'number' && isRecord(record.$span);
}

/**
 * Whether nothing below `record` was rebuilt: it still carries its own
 * coordinate, its comments are not attached separately, and every stored
 * child either folds too or is a leaf that still carries its span. A kind id
 * or boolean in a slot is inert — an edit that put it there detached the
 * parent's coordinate.
 */
function foldsToCoordinate(record: Record<string, unknown>): boolean {
	if (!carriesCoordinate(record) || record.$_trivia != null) return false;
	for (const [key, child] of Object.entries(record)) {
		if (!isStorageKey(key)) continue;
		for (const entry of Array.isArray(child) ? child : [child]) {
			if (entry === undefined || entry === null || typeof entry !== 'object') continue;
			const e = entry as Record<string, unknown>;
			if (typeof e.$text === 'string' && !Object.keys(e).some(isStorageKey)) {
				if (!isRecord(e.$span)) return false;
				continue;
			}
			if (!foldsToCoordinate(e)) return false;
		}
	}
	return true;
}

/** The coordinate projection of a folded node: identity and provenance, no storage. */
function asCoordinate(record: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { $type: record.$type };
	for (const key of ['$source', '$named', '$span', '$nodeHandle', '$childIndex']) {
		if (record[key] !== undefined) out[key] = record[key];
	}
	return out;
}

/**
 * Detach the fact an edit invalidates: the coordinate into the source this
 * node was read from. A `$with` setter spreads the node it edits, so without
 * this the new node would still fold to the pre-edit bytes. Recorded here, at
 * the edit, because an emptied node and a node that parsed childless have the
 * same shape afterwards and only the first is dirty.
 */
export function markEdited<T extends object>(data: T): Omit<T, (typeof COORDINATE_KEYS)[number]> {
	const { $nodeHandle: _h, $span: _s, $childIndex: _c, ...rest } = data as T & Record<(typeof COORDINATE_KEYS)[number], unknown>;
	return rest;
}

function projectValue(value: unknown, normalize: NormalizeNodeStorage | undefined): unknown {
	if (Array.isArray(value)) return value.map((entry) => projectValue(entry, normalize));
	if (!isRecord(value)) return value;
	const hasStorage = Object.keys(value).some(isStorageKey);
	const normalized = normalize !== undefined && hasStorage ? normalize(value as unknown as AnyNodeData) : value;
	if (!isRecord(normalized)) return normalized;
	if (foldsToCoordinate(normalized)) return asCoordinate(normalized);
	const out: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(normalized)) {
		if (key === '$with' || typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? projectValue(raw, normalize) : raw;
	}
	if (Object.keys(out).some(isStorageKey)) {
		delete out.$text;
		for (const key of COORDINATE_KEYS) delete out[key];
	}
	return out;
}
```

`stripStructuralNodeText` becomes `stripStructuralProvenance` doing the same deletions (text and coordinate keys) on structural nodes; update its export in `packages/common/src/index.ts` and its importers (find them with `awk '/stripStructuralNodeText/' packages/**/*.ts` while infigraph is unavailable, otherwise `find_all_references`). Update the module and function doc comments: the fold is the rule, `$text` on a stub is no longer part of the contract.

- [ ] **Step 4: Generated gates keyed on the coordinate**

`packages/codegen/src/emitters/is.ts` (the `isNode` body):

```ts
	lines.push(`    return hasFields || typeof o['$text'] === 'string' || typeof o['$nodeHandle'] === 'number';`);
```

`packages/codegen/src/emitters/wrap.ts` (the supertype-collapse gate):

```ts
		`  if (filtered === undefined && (typeof (data as _NodeData).$text === 'string' || (data as _NodeData).$nodeHandle != null)) {`,
```

Glossary: update `is.ts::isNode` (a node is storage, text content, or a coordinate) and the wrap supertype-collapse gate entry.

- [ ] **Step 5: Package tests that now change**

`packages/rust/tests/read-depth.test.ts`: rename the render case and pin the new behaviour:

```ts
	it('renders a deep-parsed root byte for byte, like a shallow one', () => {
		const engine = createEngine();
		expect(engine.parse(SOURCE).$render()).toBe(SOURCE);
		expect(engine.parse(SOURCE, { deep: true }).$render()).toBe(SOURCE);
	});
```

and rewrite the file's header comment: the two reads render the same text because nothing rebuilt folds to its coordinate. The re-parse case stays.

- [ ] **Step 6: Regenerate, run the suites**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
pnpm exec vitest run
```

Expected: green, including `read-depth`, `tree-identity-and-verbatim` and the new common tests. Then `pnpm run validate:native && pnpm run validate:history` — read-render-parse counts equal or higher than the baselines (deep candidates now fold), AST-match not lower.

- [ ] **Step 7: Commit**

```bash
git add packages/common/src/transport-data.ts packages/common/src/index.ts packages/common/tests/transport-data.test.ts packages/codegen/src/emitters/is.ts packages/codegen/src/emitters/wrap.ts packages/rust/tests/read-depth.test.ts docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git commit -- packages/common packages/codegen/src/emitters/is.ts packages/codegen/src/emitters/wrap.ts packages/rust/tests/read-depth.test.ts docs/glossary/emitters.md packages/rust packages/typescript packages/python -m "feat(common): an unedited subtree crosses as its coordinate; an edit detaches the coordinate"
```

---

### Task 5: The reader captures text only for text kinds

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs` (`read_ts_node`, `read_child_stub`, `widen_to_whole_source`, `read_node` signature)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`is_text_kind` loses its default; `ParsedTree` stores its grammar value and passes the predicate)
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts` (`is_text_kind`); create `packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts`
- Modify: `rust/crates/sittir-{rust,typescript,python}/src/lib.rs` (three `EngineGrammar` impls)
- Modify: `rust/crates/sittir-core/tests/read_node.rs`, `tests/wire_shape.rs`, `tests/boundary_roundtrip.rs`
- Modify: `packages/common/src/readNode.ts` (delete `DEBUG_TEXT`), `packages/common/src/engine.ts` (`ParsedRoot`)
- Modify: `packages/rust/tests/tree-identity-and-verbatim.test.ts`
- Modify: `packages/tools/src/validate/common.ts`, `packages/tools/src/validate/factory-render-parse.ts`, `packages/tools/src/validate/from.ts`, `packages/tools/src/emit/factory-source.ts`, and their tests under `packages/tools/src/__tests__/`

**Interfaces:**
- Consumes: the fold (Task 4), which no longer needs `$text` on structural nodes.
- Produces:
  ```rust
  // generated kind_ids.rs
  pub fn is_text_kind(kind: KindId) -> bool;     // pattern- and token-modeled named kinds
  // core
  pub fn read_node(tree, source, node, handle, depth, is_text_kind: &dyn Fn(KindId) -> bool) -> NodeData;
  ```
  Wire contract: `$text` appears on anonymous tokens and on named text kinds; every other node carries `$span` and, from the reader, `$nodeHandle` (`$childIndex` on stubs). The root's `$span` is the whole file. `ParsedRoot` is `{ readonly $span }`; `tree.source` holds the text.

- [ ] **Step 1: Write the failing core read test**

In `rust/crates/sittir-core/tests/read_node.rs` add (the file already has `parse_tree` and `find_first_ts_node_by_kind` helpers and reads with `read_node(&tree, source, node, handle, depth)`; give every existing call the new trailing argument `&|_| true` so their expectations are unchanged):

```rust
#[test]
fn structural_nodes_carry_a_span_and_no_text_while_text_kinds_keep_theirs() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let tree = parse_tree(lang, source);
    let identifier: u16 = tree.language().id_for_node_kind("identifier", true);
    let is_text = |kind: KindId| kind.0 == identifier;
    let root = read_node(&tree, source, None, Some(0), ReadDepth::Deep, &is_text);
    let json = serde_json::to_value(&root).expect("serialize");

    fn walk(v: &Value, seen: &mut Vec<(u16, bool, bool)>) {
        if let Some(map) = v.as_object() {
            if let Some(t) = map.get("$type").and_then(Value::as_u64) {
                seen.push((t as u16, map.contains_key("$text"), map.contains_key("$span")));
            }
            for (k, child) in map {
                if k.starts_with('_') || k == "$other" { walk(child, seen); }
            }
        } else if let Some(arr) = v.as_array() {
            for c in arr { walk(c, seen); }
        }
    }
    let mut seen = Vec::new();
    walk(&json, &mut seen);
    let named_structural: Vec<_> = seen.iter().filter(|(t, _, _)| *t != identifier && tree.language().node_kind_is_named(*t)).collect();
    assert!(!named_structural.is_empty());
    assert!(named_structural.iter().all(|(_, has_text, has_span)| !has_text && *has_span), "{seen:?}");
    assert!(seen.iter().filter(|(t, _, _)| *t == identifier).all(|(_, has_text, _)| *has_text));
}
```

Update `anonymous_leaf_children_do_not_invent_fields`: `closure_parameters` is a named structural kind, so its text assertion becomes `assert!(params.get("$text").is_none()); assert!(params.get("$span").is_some());` with the same `_|` and `$other` assertions. `is_allowed_node_key` in the three test files keeps `$text` (leaves still carry it).

- [ ] **Step 2: Run it to see it fail**

Run: `cd rust && cargo test -p sittir-core --test read_node`
Expected: compile error on the new `read_node` arity.

- [ ] **Step 3: Implement the gate**

`read_node.rs`: `read_node`, `read_ts_node`, `read_children`, `read_child_stub` take `is_text_kind: &dyn Fn(KindId) -> bool` and thread it. In `read_ts_node` the capture becomes:

```rust
    let text = if !named || is_text_kind(kind) {
        source.get(byte_range.clone()).map(|s| s.to_string())
    } else {
        None
    };
```

and the comment block above it is replaced by one sentence: "Text is content only for anonymous tokens and the kinds whose template renders from it; every other node is addressed by its span." `read_child_stub` sets `text: None` for named children and keeps the slice for anonymous ones. `read_materialized_leaf` is unchanged. `widen_to_whole_source` sets only the span:

```rust
fn widen_to_whole_source(root: &mut NodeData, source: &str) {
    root.span = Some(Span { start: 0, end: source.len() as u32 });
}
```

`engine.rs`: remove the default body of `EngineGrammar::is_text_kind`; `ParsedTree` stores `grammar: G` in place of `_grammar: PhantomData<G>`; `read_root` and `read_child` pass `&|kind| self.grammar.is_text_kind(kind)`.

`kind-id-rust.ts` appends after `kind_name_from_id`:

```ts
	const textKinds = entries.filter((entry) => {
		const node = nodeMap.nodes.get(entry.kind);
		return node !== undefined && (node.modelType === 'pattern' || node.modelType === 'token');
	});
	lines.push('');
	lines.push('/// Whether the reader captures a named node of this kind as text: its template renders from `$text`.');
	lines.push('pub fn is_text_kind(kind: KindId) -> bool {');
	lines.push(`    matches!(kind.0, ${textKinds.map((e) => e.id).join(' | ') || 'u16::MAX'})`);
	lines.push('}');
```

`packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts` (call `generate_test_context` for `packages/codegen/src/emitters/kind-id-rust.ts` first if the Write hook demands it) asserts on the real rust grammar that the emitted text contains `pub fn is_text_kind(kind: KindId) -> bool {` and that the arm list includes `identifier`'s id and excludes `function_item`'s (ids read from the same `collectKindEntries` the test builds).

Each crate's `src/lib.rs` `EngineGrammar` impl adds:

```rust
    fn is_text_kind(self, kind: sittir_core::types::KindId) -> bool {
        render::kind_ids::is_text_kind(kind)
    }
```

- [ ] **Step 4: JS side**

`packages/common/src/readNode.ts`: delete `DEBUG_TEXT` and every branch it guards; the header comment's last paragraph goes. `packages/common/src/engine.ts`: `ParsedRoot` is `{ readonly $span: { start: number; end: number } }`; its comment says the root's span covers the whole file and the text lives on `tree.source`. `packages/rust/tests/tree-identity-and-verbatim.test.ts`: the last test becomes

```ts
		const { root, tree } = engine.diagnostics.parseAndRead(source);
		expect(root.$span).toEqual({ start: 0, end: source.length });
		expect(tree.source).toBe(source);
```

Tools: run `pnpm exec vitest run packages/tools` and fix each consumer that read a structural node's `$text`. The rule for every site: text-modeled leaves keep `$text`; a structural node's text is `tree.source.slice($span.start, $span.end)` (`validate/from.ts` already has this fallback — make it the only path; `validate/common.ts` and `factory-render-parse.ts` receive the `tree` handle where they receive the node; `emit/factory-source.ts` `printRawNode` takes the source string in its `PrintContext`). The tests `node-to-config-promotion.test.ts` and `wrapped-tree-materialization.test.ts` build fixtures with `$text` on structural nodes: give those fixtures `$span` and a source instead, and assert on spans where they asserted on captured text.

- [ ] **Step 5: Regenerate, rebuild, suites, gates**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests && cd ..
pnpm exec vitest run
pnpm run validate:native && pnpm run validate:history
```

Expected: green; `validate:history` at or above the baselines.

- [ ] **Step 6: Commit**

```bash
git add rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/tests rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs packages/codegen/src/emitters/kind-id-rust.ts packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts packages/common/src/readNode.ts packages/common/src/engine.ts packages/rust/tests/tree-identity-and-verbatim.test.ts packages/tools/src docs/glossary/emitters.md rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git commit -- rust/crates packages/codegen/src/emitters packages/common packages/rust packages/typescript packages/python packages/tools/src docs/glossary/emitters.md -m "feat(read): text is captured only for text kinds; a structural node is addressed by its span"
```

---

### Task 6: A rebuilt list takes its class from the gaps between its coordinates

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (`prepareStructImpl`; new `listGapSitesOf`, `listTokenOf`)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
- Create: `packages/typescript/tests/coordinate-gaps.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `::sittir_core::classify::classify_list_gaps`, `options::allowed`, `SlotValue::coord`, `ctx.sources`.
- Produces, in a generated `prepare` for a kind with list sites on slot `elements`:
  ```rust
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.elements.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ",", options::allowed(options::SITE_X_ELEMENTS_SEPARATOR_SPACE_BEFORE), options::allowed(options::SITE_X_ELEMENTS_SEPARATOR_SPACE_AFTER), options::spacing_text);
            if self.elements_separator_space_before.is_none() { self.elements_separator_space_before = before; }
            if self.elements_separator_space_after.is_none() { self.elements_separator_space_after = after; }
        }
  ```
  emitted after the children's `prepare` calls and before the `get_or_insert` table fills.

- [ ] **Step 1: Write the failing emitter test**

In `render-module-emit.test.ts` (same rust-pipeline describe):

```ts
	it('classifies a rebuilt list from the gaps between its coordinates before the table fills it', () => {
		const paramsPrepare = transportRs.slice(transportRs.indexOf('impl ::sittir_core::prepare::Prepare for ParametersTransport {'));
		const body = paramsPrepare.slice(0, paramsPrepare.indexOf('\n}\n'));
		expect(body).toContain('::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ",", options::allowed(options::SITE_PARAMETERS_');
		expect(body.indexOf('classify_list_gaps')).toBeGreaterThan(body.indexOf('.prepare(ctx)?;'));
		expect(body.indexOf('classify_list_gaps')).toBeLessThan(body.indexOf('.get_or_insert(ctx.options.spacing['));
	});
```

- [ ] **Step 2: Write the failing behaviour test**

`packages/typescript/tests/coordinate-gaps.test.ts` (call `generate_test_context` on `packages/codegen/src/emitters/render-module.ts` before writing, if the Write hook demands it):

```ts
// A rebuilt node whose list items are still coordinates renders the class
// its source spelled, by majority, in place of the engine's option.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';

describe('gaps between coordinates', () => {
	it('keeps the blank lines a parsed block spelled when a statement is appended', () => {
		const engine = createEngine();
		const source = 'function f() {\n  a();\n\n  b();\n\n  c();\n}\n';
		const root = engine.parse(source);
		const fn = root.statements()[0] as { body(): { $with: { statements(v: unknown): unknown }; statements(): readonly unknown[] } };
		const body = fn.body();
		const rebuilt = body.$with.statements([...body.statements(), ir.expressionStatement(ir.callExpression('d'))]);
		const text = engine.render(rebuilt as never).toString();
		expect(text).toContain('a();\n\n  b();\n\n  c();\n\n  d();');
	});

	it('keeps a tight comma list tight when an argument is replaced', () => {
		const engine = createEngine();
		const root = engine.parse('f(a,b,c);\n');
		const call = (root.statements()[0] as { expression(): { arguments(): { $with: { elements(v: unknown): unknown }; elements(): readonly unknown[] } } }).expression().arguments();
		const [a, , c] = call.elements();
		const rebuilt = call.$with.elements([a, ir.identifier('x'), c]);
		expect(engine.render(rebuilt as never).toString()).toBe('(a,x,c)');
	});
});
```

(The accessor names follow the generated typescript wrap surface; check `packages/typescript/src/wrap.ts` for `statements`, `expression`, `arguments`, `elements` and adjust the casts, not the expectations.)

- [ ] **Step 3: Run both to see them fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/typescript/tests/coordinate-gaps.test.ts`
Expected: the emitter case fails (no `classify_list_gaps`); the behaviour cases fail (blank lines collapse to the option; the comma list gets a space).

- [ ] **Step 4: Emit the classification**

In `render-module.ts` add:

```ts
function listGapSitesOf(plan: RenderPlan, node: AssembledNode, slot: string): { before?: SpacingSite; after?: SpacingSite; gap?: SpacingSite } {
	const kind = publicKindName(node.kind);
	const of = (side: SpacingSide) => plan.spacingSites.find((s) => s.kind === kind && s.slot === slot && s.side === side && s.seat === undefined);
	return { before: of('before'), after: of('after'), gap: of('gap') };
}

function listTokenOf(node: AssembledNode, slot: string): string | undefined {
	if (node instanceof AssembledList && node.separatorRule !== undefined) {
		const rule = node.separatorRule;
		return rule.type === STRING ? rule.value : undefined;
	}
	return buildSlotModelSurface(node).slots.find((f) => f.name === slot)?.separator;
}
```

(`STRING` is the rule-type constant the site-preferences module imports with the `// @rule-type-consts` directive; import it the same way. If `separatorRule` is a `RuleSeparator` wrapper, read `.value.type` / `.value.value`.)

In `prepareStructImpl`, after the children's `prepare` lines and before the site fills, for each multi slot `field` of the node (`isMultiple(field)`, `field.name !== undefined`):

```ts
			const sites = listGapSitesOf(plan, node, field.name);
			if (sites.before === undefined && sites.after === undefined && sites.gap === undefined) continue;
			const token = sites.gap !== undefined ? '' : listTokenOf(node, field.name);
			if (token === undefined) continue;
			const ident = rustFieldIdent(field.name);
			const items = isRequired(field) ? `self.${ident}.iter()` : `self.${ident}.as_deref().unwrap_or(&[]).iter()`;
			const each = hasOptionalElements(field) ? 'item.as_ref().and_then(|i| i.coord())' : 'item.coord()';
			const allowedOf = (site: SpacingSite | undefined) => (site === undefined ? '&[]' : `options::allowed(options::${site.constName})`);
			const first = sites.gap ?? sites.before;
			body.push(
				`        {`,
				`            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = ${items}.map(|item| ${each}).collect();`,
				`            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ${JSON.stringify(token)}, ${allowedOf(first)}, ${allowedOf(sites.after)}, options::spacing_text);`
			);
			if (first !== undefined) body.push(`            if self.${rustFieldIdent(first.fieldIdent)}.is_none() { self.${rustFieldIdent(first.fieldIdent)} = before; }`);
			if (sites.after !== undefined) body.push(`            if self.${rustFieldIdent(sites.after.fieldIdent)}.is_none() { self.${rustFieldIdent(sites.after.fieldIdent)} = after; }`);
			else body.push(`            let _ = after;`);
			body.push(`        }`);
```

Glossary entries for `listGapSitesOf`, `listTokenOf`, and the `prepareStructImpl` body note (order: children, classification, table).

- [ ] **Step 5: Type-check, regenerate, run**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests && cd ..
pnpm exec vitest run
pnpm run validate:native && pnpm run validate:history
```

Expected: green; `validate:history` at or above the previous task's numbers. The three dogfood examples render the same bytes (they build from factories, where no coordinate exists).

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/typescript/tests/coordinate-gaps.test.ts docs/glossary/emitters.md rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git commit -- packages/codegen/src/emitters packages/typescript/tests/coordinate-gaps.test.ts docs/glossary/emitters.md rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust packages/typescript packages/python -m "feat(render): a rebuilt list classifies the gaps between its still-parsed items into option values"
```

---

### Task 7: Measurement, the engine-identity gate, and the handoff

**Files:**
- Create: `packages/rust/tests/coordinate-engine-identity.test.ts`
- Modify: `docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md` (status line: realized; the wire-size table gains a measured "after" column)
- Create: `docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md`
- Memory: update `project_render_options_design_state.md` (plan 2 realized as native gap classification) and add a `project_source_coordinates.md` note

- [ ] **Step 1: Write the engine-identity test**

```ts
// A coordinate names a tree by the tag its engine minted. Rendering it
// through another engine, or after its tree was disposed, is refused with
// the handle in the error — never answered from whatever tree sits at that
// index in the other engine.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';

describe('coordinates name their engine', () => {
	it('refuses a node read by another engine', () => {
		const reader = createEngine();
		const other = createEngine();
		other.parse('fn decoy() {}');
		const item = reader.parse('fn real() {}').statements()[0];
		expect(() => other.render(item as never).toString()).toThrow(/names tree 0/);
	});
});
```

(A second case for a disposed tree needs a handle to `disposeTree`; `tree-identity-and-verbatim.test.ts` shows the `getActiveBackend()` route to the native engine — add it there if that route reaches the engine the wrapped node renders through, otherwise keep the one case.)

Run: `pnpm exec vitest run packages/rust/tests/coordinate-engine-identity.test.ts` — expected green already after Task 3; this pins it.

- [ ] **Step 2: Measure the wire**

In the scratchpad, a script that parses `rust/crates/sittir-core/src/engine.rs` (first 8 KB) shallow and deep through `@sittir/rust`'s `createEngine().diagnostics.parseAndRead`, and prints `JSON.stringify(root).length` and the byte total of every `$text` value found by walking `_`-keys and `$other`. Record the four numbers beside the spec's table as an "after" column. Expected shape: the deep read's structural `$text` is 0 and the wire is roughly 23 % smaller than before.

- [ ] **Step 3: Full gates once more, then the handoff**

```bash
pnpm exec vitest run
pnpm run validate:native && pnpm run validate:history
bash scripts/comment-slop-check.sh --working
pnpm exec tsx packages/cli/src/cli.ts tool propose-14
```

Write the handoff: what landed per task, the measured wire numbers, the validate numbers before and after, the spec corrections (the coordinate is handle plus span; the walk validates and the sink slices, both through one context; `markEdited` stays and detaches the coordinate), and what is next (plan 4 of render options: `reformat`, `engine.ir`, `tree.options()` from classified gaps; per-tree format is still out of scope). Set the spec's status line to `**Status:** Realized`.

- [ ] **Step 4: Commit**

```bash
git add packages/rust/tests/coordinate-engine-identity.test.ts docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md
git commit -- packages/rust/tests/coordinate-engine-identity.test.ts docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md -m "docs(provenance): source coordinates realized; engine identity gate; measured wire"
```

---

## Self-review

**Spec coverage.** Carrier with two arms and the coordinate as handle plus span: Task 1 and Task 3. Shape-directed deserialization, no fallback: Task 3 step 3. `VerbatimTransport` where a slot admits a text kind, error elsewhere: Task 3 step 6. The prepare walk with an explicit context, unknown tree and bad span refused before rendering: Task 2, wired in Task 3; the sink slices through the same context: Task 1 and Task 3 step 5. Gap classification and its precedence: Task 2 (helpers) and Task 6 (emission). The fold, coordinate detached by `$with`, structural nodes never cross with text or coordinates: Task 4. Reader gated on text kinds, root as span, `SITTIR_DEBUG_TEXT` gone, transports without inert metadata: Tasks 3 and 5. Gates 1–4 and 10: every task's gate block; gate 5: Task 7 step 2; gate 6: Task 7 step 1; gate 7: Task 3 step 3; gate 8: Task 6 step 2; gate 9: the walk's signature in Task 2 and the constraint line. Per-tree format stays out of scope, as the spec says.

**Placeholder scan.** Every code step carries its code. The one conditional instruction (Task 6 step 2's accessor casts) names the file to check and fixes the expectations. Task 5 step 4's tools instruction names each file and the one rule applied to all of them.

**Type consistency.** `NodeCoordinate::{new, tree_id, resolve}` (no attached source); `SlotValue::{Coord, Transport}` with `coord()`, `transport()`, `transport_or_write(w)`; `SourceTable::source_of(tree_id) -> Option<&Arc<str>>` and `CoordinateError::{UnknownTree, BadSpan}` in `render.rs`; `RenderSink::slice(&NodeCoordinate)`; `SpacingWriter::with_sources`; `Prepare::prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>`; `RenderContext { options, sources }`; `classify_list_gaps(items, sources, token, allowed_before, allowed_after, text_of) -> (Option<u16>, Option<u16>)`; `options::allowed(site) -> &'static [u16]`; `render_transport_dispatch(&dyn Render, &RenderContext)`; `render_transport_parts(transport, ctx) -> Result<(TransportSource, String), RenderError>`; `EngineGrammar::is_text_kind(self, kind: KindId) -> bool`; `kind_ids::is_text_kind(kind: KindId) -> bool`; `markEdited` detaching `$nodeHandle`, `$span`, `$childIndex`. These spellings are used identically across Tasks 1–7.
