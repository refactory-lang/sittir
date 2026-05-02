# Renderable Native Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish landing the renderable-native-view layer (ADR-0016 / 2026-04-29 design): replace string-backed `FieldView` / `ListView` with a closed `Renderable` family, make `joinby` return a streaming wrapper instead of `String`, generate per-template `from_transport(...) -> Template` bridges, flip `render_transport` off the `NodeData` round-trip onto direct typed projection, and **then repurpose the typed-transport shape for the inverse direction (parse/Read)** so `parseAndRead` / `readNode` emit typed transport directly without first building `NodeData`. All three grammars (rust, typescript, python). Corpus output stays byte-identical to the JS engine.

**Architecture:** The native pipeline already accepts plain-object typed transport over N-API and emits per-kind `*Transport` structs and `*Template` structs (`FieldView<'a>` / `ListView<'a>`). What didn't land: typed transport collapses through `transport_to_node()` → `render_dispatch(&NodeData)` before rendering, views hold `&str` / `&[String]` rather than renderables, and `joinby` returns `String`. We add a closed `Renderable<'a>` enum in `sittir-core::filters`, retrofit `FieldView` / `ListView` / `joinby` to carry/produce renderables, generate one `from_transport(...)` per template struct, replace the collapse-and-dispatch wrapper with direct typed dispatch, and finally invert: parse/Read emits `AnyTransport` directly from a tree-sitter `Node`, with the existing `transport_to_node` collapse retained as a one-direction bridge for any TS caller that still wants `NodeData`. Slot truth (ADR-0015, walker-owned) is unchanged throughout.

**Tech Stack:** Rust 1.88+, Askama 0.15 (public extension surface only — `FastWritable`, `Display`, `Safe<T>`), serde, napi-rs 3, web-tree-sitter / tree-sitter-c bindings, TypeScript ESM codegen (`@sittir/codegen`), Vitest (TS) + cargo (Rust). Generated artifacts under `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs` and per-grammar TS packages.

---

## File Structure

**Core renderable family + filters (sittir-core)**

- Modify: `rust/crates/sittir-core/src/filters.rs` — introduce `Renderable<'a>`, `Joined<'a>`, retrofit `FieldView<'a>` / `ListView<'a>`, change `joinby` return shape.
- Modify: `rust/crates/sittir-core/src/lib.rs` — re-export new types.
- Create: `rust/crates/sittir-core/tests/renderable.rs`.
- Modify: `rust/crates/sittir-core/tests/filters.rs` — adapt existing string-backed expectations.

**Codegen — render module emitter**

- Modify: `packages/codegen/src/emitters/render-module.ts` — emit per-template `from_transport(...) -> Template`, per-grammar `Renderable` extension enum, direct `render_<kind>(transport)`, and (Task 5) per-kind `read_<kind>(node: tree_sitter::Node) -> AnyTransport`. Keep `transport_to_node` / `render_dispatch` exported as the inverse bridge for callers that want `NodeData` from typed transport.
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts`.

**Per-grammar generated artifacts (regenerated)**

- Generated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`.

**Native crate napi entrypoints + reader path**

- Modify: `rust/crates/sittir-core/src/engine.rs` — add a typed reader path that produces `AnyTransport` directly from a tree-sitter `Node`. Keep the legacy `NodeData`-producing reader.
- Modify: `rust/crates/sittir-rust/src/lib.rs` (and the typescript / python equivalents) — switch `parseAndRead` / `readNode` napi functions to return typed transport (still as a JS object via N-API). Legacy NodeData path stays available behind a separate exported function for the inverse bridge.
- Modify: `packages/{rust,typescript,python}/src/engine.ts` — consume the typed transport shape from the native reader; type the returned shape as `AnyTransport` (from generated transport types).

**Parity verification**

- Modify: `rust/crates/sittir-core/tests/wire_shape.rs`.
- Modify: `rust/crates/sittir-core/tests/boundary_roundtrip.rs` (if a fixture broke).
- Possibly: `specs/016-parity-regressions/baselines/native.json`.

---

## Task 1: Introduce closed `Renderable` family + `Joined` streaming wrapper in `sittir-core`

**Why this first:** every later task depends on `Renderable<'a>` and `Joined<'a>` existing. Grammar-agnostic variants only at this stage (`Text(&'a str)` and `Joined(Joined<'a>)`); per-grammar variants are added in Task 4.

**Files:**

- Modify: `rust/crates/sittir-core/src/filters.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs`
- Create: `rust/crates/sittir-core/tests/renderable.rs`

- [ ] **Step 1: Write the failing test.**

Create `rust/crates/sittir-core/tests/renderable.rs`:

```rust
use askama::FastWritable;
use sittir_core::filters::{Joined, Renderable};

#[test]
fn text_renderable_displays_str() {
    assert_eq!(Renderable::Text("hello").to_string(), "hello");
}

#[test]
fn joined_renderable_streams_separator() {
    let items = [Renderable::Text("a"), Renderable::Text("b"), Renderable::Text("c")];
    let joined = Joined::new(&items, ", ", false, false);
    assert_eq!(joined.to_string(), "a, b, c");
}

#[test]
fn joined_renderable_writes_via_fast_writable() {
    let items = [Renderable::Text("x"), Renderable::Text("y")];
    let joined = Joined::new(&items, "+", false, false);
    let mut out = String::new();
    joined.write_into(&mut out, &askama::NO_VALUES).expect("FastWritable");
    assert_eq!(out, "x+y");
}

#[test]
fn joined_renderable_supports_leading_and_trailing_flanks() {
    let items = [Renderable::Text("a")];
    let joined = Joined::new(&items, ";", true, true);
    assert_eq!(joined.to_string(), ";a;");
}

#[test]
fn joined_renderable_empty_input_renders_empty() {
    let items: Vec<Renderable<'_>> = Vec::new();
    let joined = Joined::new(&items, ",", true, true);
    assert_eq!(joined.to_string(), "");
}
```

- [ ] **Step 2: Run and verify failure.**

```bash
cargo test -p sittir-core --test renderable
```

Expected: FAIL — `Renderable` / `Joined` undefined.

- [ ] **Step 3: Add `Renderable<'a>` and `Joined<'a>` to `sittir-core::filters`.**

In `rust/crates/sittir-core/src/filters.rs`, above the existing `ListView` declaration:

```rust
/// Closed renderable family. Per-grammar generated render crates extend this
/// via newtype wrappers; sittir-core itself only carries the grammar-agnostic
/// variants. Keep the family closed and explicit (no trait objects at the
/// public boundary).
#[derive(Debug, Clone, Copy)]
pub enum Renderable<'a> {
    /// Final, render-ready text.
    Text(&'a str),
    /// Streaming join over a borrowed slice of `Renderable`s.
    Joined(Joined<'a>),
}

impl std::fmt::Display for Renderable<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Text(s) => f.write_str(s),
            Self::Joined(j) => std::fmt::Display::fmt(j, f),
        }
    }
}

impl ::askama::FastWritable for Renderable<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        match self {
            Self::Text(s) => dest.write_str(s).map_err(::askama::Error::from),
            Self::Joined(j) => j.write_into(dest, values),
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Joined<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

impl<'a> Joined<'a> {
    pub fn new(
        items: &'a [Renderable<'a>],
        separator: &'a str,
        leading: bool,
        trailing: bool,
    ) -> Self {
        Self { items, separator, leading, trailing }
    }
}

impl std::fmt::Display for Joined<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.items.is_empty() { return Ok(()); }
        if self.leading { f.write_str(self.separator)?; }
        let mut first = true;
        for item in self.items {
            if !first { f.write_str(self.separator)?; }
            std::fmt::Display::fmt(item, f)?;
            first = false;
        }
        if self.trailing { f.write_str(self.separator)?; }
        Ok(())
    }
}

impl ::askama::FastWritable for Joined<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        if self.items.is_empty() { return Ok(()); }
        if self.leading { dest.write_str(self.separator).map_err(::askama::Error::from)?; }
        let mut first = true;
        for item in self.items {
            if !first { dest.write_str(self.separator).map_err(::askama::Error::from)?; }
            item.write_into(dest, values)?;
            first = false;
        }
        if self.trailing { dest.write_str(self.separator).map_err(::askama::Error::from)?; }
        Ok(())
    }
}
```

- [ ] **Step 4: Re-export from `sittir-core/src/lib.rs`.**

Find the `pub mod filters;` line and confirm whether the file uses `pub use filters::*;` (no edit needed) or an explicit re-export list (add `Joined, Renderable`):

```bash
grep -n "pub use filters" rust/crates/sittir-core/src/lib.rs
```

Edit accordingly.

- [ ] **Step 5: Run the renderable test.**

```bash
cargo test -p sittir-core --test renderable
```

Expected: PASS.

- [ ] **Step 6: Run the full sittir-core suite (must still pass — additive change).**

```bash
cargo test -p sittir-core
```

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add rust/crates/sittir-core/src/filters.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/tests/renderable.rs
git commit -m "core: add closed Renderable family + Joined streaming wrapper"
```

---

## Task 2: Retrofit `FieldView` and `ListView` to carry `Renderable`

**Files:**

- Modify: `rust/crates/sittir-core/src/filters.rs`
- Modify: `rust/crates/sittir-core/tests/filters.rs`

- [ ] **Step 1: Write the failing test.**

Append to `rust/crates/sittir-core/tests/filters.rs`:

```rust
#[test]
fn listview_holds_renderables() {
    use sittir_core::filters::{ListView, Renderable};
    let items = [Renderable::Text("foo"), Renderable::Text("bar")];
    let view = ListView { items: &items, separator: ", ", leading: false, trailing: false };
    assert_eq!(view.to_string(), "foo, bar");
}

#[test]
fn fieldview_one_holds_renderable() {
    use sittir_core::filters::{FieldView, Renderable};
    let view = FieldView::One(Renderable::Text("hello"));
    assert_eq!(view.to_string(), "hello");
}

#[test]
fn fieldview_missing_renders_empty() {
    use sittir_core::filters::FieldView;
    let view: FieldView<'_> = FieldView::Missing;
    assert_eq!(view.to_string(), "");
}
```

- [ ] **Step 2: Run and verify failure.**

```bash
cargo test -p sittir-core --test filters listview_holds_renderables fieldview_one_holds_renderable fieldview_missing_renders_empty
```

Expected: FAIL on type mismatch / variant not found.

- [ ] **Step 3: Reshape `ListView` to carry `Renderable`.**

In `rust/crates/sittir-core/src/filters.rs`, replace the existing `ListView` block (struct + `is_empty` + iterator + `Display`):

```rust
#[derive(Debug, Clone, Copy)]
pub struct ListView<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

impl<'a> ListView<'a> {
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
    pub fn as_joined(&self) -> Joined<'a> {
        Joined { items: self.items, separator: self.separator, leading: self.leading, trailing: self.trailing }
    }
}

impl std::fmt::Display for ListView<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        std::fmt::Display::fmt(&self.as_joined(), f)
    }
}

impl ::askama::FastWritable for ListView<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        self.as_joined().write_into(dest, values)
    }
}

pub struct ListViewIter<'a> {
    inner: std::slice::Iter<'a, Renderable<'a>>,
}

impl<'a> Iterator for ListViewIter<'a> {
    type Item = &'a Renderable<'a>;
    fn next(&mut self) -> Option<Self::Item> { self.inner.next() }
}

impl<'a> IntoIterator for &'a ListView<'a> {
    type Item = &'a Renderable<'a>;
    type IntoIter = ListViewIter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        ListViewIter { inner: self.items.iter() }
    }
}
```

Delete the old `string_as_str` helper.

- [ ] **Step 4: Reshape `FieldView` to carry `Renderable`.**

Replace the `FieldView` block (enum + `Display`) with:

```rust
#[derive(Debug, Clone, Copy)]
pub enum FieldView<'a> {
    Missing,
    One(Renderable<'a>),
    Many(ListView<'a>),
}

impl std::fmt::Display for FieldView<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Missing => Ok(()),
            Self::One(r) => std::fmt::Display::fmt(r, f),
            Self::Many(view) => std::fmt::Display::fmt(view, f),
        }
    }
}

impl ::askama::FastWritable for FieldView<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        match self {
            Self::Missing => Ok(()),
            Self::One(r) => r.write_into(dest, values),
            Self::Many(v) => v.write_into(dest, values),
        }
    }
}
```

Delete the old `FieldViewIter`, its `Iterator` impl, and the `IntoIterator for &FieldView`. They are unused once `JoinSource` migrates in Task 3.

- [ ] **Step 5: Update `PresenceCheck`.**

Replace the two impls:

```rust
impl PresenceCheck for ListView<'_> {
    fn is_present_check(&self) -> bool { !self.items.is_empty() }
}

impl PresenceCheck for FieldView<'_> {
    fn is_present_check(&self) -> bool {
        match self {
            Self::Missing => false,
            Self::One(_) => true,
            Self::Many(view) => view.is_present_check(),
        }
    }
}
```

- [ ] **Step 6: Update legacy filter tests.**

For each existing `filters.rs` test that constructs `ListView` from `&[String]` or builds `FieldView::Scalar(...)` / `FieldView::List(...)`, rewrite to:

- `ListView { items: &[Renderable::Text("..."), ...], ... }`
- `FieldView::One(Renderable::Text("..."))` (replaces `Scalar`)
- `FieldView::Many(ListView { ... })` (replaces `List`)

Drop any test asserting the deleted iterator. Iteration over `FieldView` is no longer a public API.

- [ ] **Step 7: Run the filters suite.**

```bash
cargo test -p sittir-core --test filters
```

Expected: PASS — both new and converted tests green.

- [ ] **Step 8: Run the full sittir-core suite.**

```bash
cargo test -p sittir-core
```

Expected: PASS for sittir-core. **Grammar crates will fail to compile because their generated `templates.rs` still uses the old `&[String]` shape — that is fixed in Task 4.** Do not run grammar-crate tests at this checkpoint.

- [ ] **Step 9: Commit.**

```bash
git add rust/crates/sittir-core/src/filters.rs rust/crates/sittir-core/tests/filters.rs
git commit -m "core: retrofit FieldView/ListView to carry Renderable"
```

---

## Task 3: Make `joinby` return a streaming `Safe<Joined<'a>>`

**Files:**

- Modify: `rust/crates/sittir-core/src/filters.rs`
- Modify: `rust/crates/sittir-core/tests/filters.rs`
- Modify: `packages/codegen/src/emitters/render-module.ts`

- [ ] **Step 1: Failing test.**

Append to `rust/crates/sittir-core/tests/filters.rs`:

```rust
#[test]
fn joinby_returns_streaming_safe_joined() {
    use sittir_core::filters::{joinby, ListView, Renderable};
    let items = [Renderable::Text("a"), Renderable::Text("b"), Renderable::Text("c")];
    let view = ListView { items: &items, separator: ", ", leading: false, trailing: false };
    let safe: askama::filters::Safe<sittir_core::filters::Joined<'_>> =
        joinby(&view, ", ", false, false).expect("joinby");
    assert_eq!(safe.0.to_string(), "a, b, c");
}

#[test]
fn joinby_with_flanks_streams_through_safe() {
    use sittir_core::filters::{joinby, ListView, Renderable};
    let items = [Renderable::Text("x")];
    let view = ListView { items: &items, separator: ";", leading: false, trailing: false };
    let safe = joinby(&view, ";", true, true).expect("joinby");
    assert_eq!(safe.0.to_string(), ";x;");
}
```

- [ ] **Step 2: Run and verify failure.**

```bash
cargo test -p sittir-core --test filters joinby_returns_streaming_safe_joined joinby_with_flanks_streams_through_safe
```

Expected: FAIL — current `joinby` returns `Result<String, _>`.

- [ ] **Step 3: Reshape the `JoinSource` trait + `joinby`.**

In `rust/crates/sittir-core/src/filters.rs`, replace the existing `JoinSource` trait and all its impls with:

```rust
pub trait JoinSource<'a> {
    fn renderables(&self) -> &'a [Renderable<'a>];
    fn separator(&self) -> &'a str;
    fn leading(&self) -> bool { false }
    fn trailing(&self) -> bool { false }
}

impl<'a> JoinSource<'a> for ListView<'a> {
    fn renderables(&self) -> &'a [Renderable<'a>] { self.items }
    fn separator(&self) -> &'a str { self.separator }
    fn leading(&self) -> bool { self.leading }
    fn trailing(&self) -> bool { self.trailing }
}

impl<'a> JoinSource<'a> for FieldView<'a> {
    fn renderables(&self) -> &'a [Renderable<'a>] {
        match self {
            Self::Missing | Self::One(_) => &[],
            Self::Many(view) => view.items,
        }
    }
    fn separator(&self) -> &'a str {
        match self { Self::Many(view) => view.separator, _ => "" }
    }
    fn leading(&self) -> bool { matches!(self, Self::Many(v) if v.leading) }
    fn trailing(&self) -> bool { matches!(self, Self::Many(v) if v.trailing) }
}
```

Delete the prior string-shaped `impl<S: AsRef<str>> JoinSource for [S]`, `Vec<S>`, `[S; N]` impls — they are no longer needed.

Replace `joinby` with:

```rust
pub fn joinby<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    sep: &'a str,
    leading: bool,
    trailing: bool,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    Ok(askama::filters::Safe(Joined {
        items: xs.renderables(),
        separator: sep,
        leading,
        trailing,
    }))
}
```

Delete `join_with_line_comment_fix` and `ends_line_comment`. **Note:** the line-comment force-`\n` fix was previously baked into the joiner. Task 4's bridge MUST surface line-comment-ending leaves with their trailing `\n` already inside `Renderable::Text(...)`. If the parity corpus regresses on `// comment` followed by a sibling, restore a `Joined`-aware variant of the fix that inspects each `Renderable::Text(...)` for trailing line-comment shape and emits `\n` instead of `separator` after that item — do not declare Task 5 done without it.

Adapt `joinWithTrailing` / `joinWithLeading` / `joinWithFlanks` to return `Safe<Joined<'a>>`:

```rust
#[askama::filter_fn]
#[allow(non_snake_case)]
pub fn joinWithTrailing<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    values: &dyn askama::Values,
    sep: &'a str,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    let trailing = xs.trailing() || flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, false, trailing)
}

#[askama::filter_fn]
#[allow(non_snake_case)]
pub fn joinWithLeading<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    values: &dyn askama::Values,
    sep: &'a str,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    let leading = xs.leading() || flank_match(values, "leading_anon", sep);
    joinby(xs, sep, leading, false)
}

#[askama::filter_fn]
#[allow(non_snake_case)]
pub fn joinWithFlanks<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    values: &dyn askama::Values,
    sep: &'a str,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    let leading = xs.leading() || flank_match(values, "leading_anon", sep);
    let trailing = xs.trailing() || flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, leading, trailing)
}
```

`flank_match` itself is unchanged.

- [ ] **Step 4: Run the joinby tests.**

```bash
cargo test -p sittir-core --test filters
```

Expected: PASS.

- [ ] **Step 5: Update per-grammar filter wrappers in the codegen emitter.**

In `packages/codegen/src/emitters/render-module.ts`, find the emitted `pub mod filters { ... }` block (search for `pub fn joinby<T:`) and rewrite to:

```rust
pub mod filters {
    use ::sittir_core::filters::{Joined, JoinSource};

    #[::askama::filter_fn]
    pub fn joinby<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        _values: &dyn ::askama::Values,
        sep: &'a str,
        leading: bool,
        trailing: bool,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, leading, trailing)
    }

    #[::askama::filter_fn]
    pub fn join<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, false, false)
    }

    pub use ::sittir_core::filters::{
        upper, lower,
        isBlank, isPresent,
        joinWithTrailing, joinWithLeading, joinWithFlanks,
    };
}
```

- [ ] **Step 6: Commit.**

```bash
git add rust/crates/sittir-core/src/filters.rs rust/crates/sittir-core/tests/filters.rs packages/codegen/src/emitters/render-module.ts
git commit -m "core: streaming joinby returns Safe<Joined<'a>>"
```

---

## Task 4: Generate per-template `from_transport(...)` bridge + per-grammar `Renderable` extension + direct render path

**Why this is the largest task:** the emitter must generate (a) a per-grammar `Renderable` extension that wraps each transport reference type, (b) one `from_transport(node: &<K>Transport) -> Result<Self, askama::Error>` per template struct, and (c) a direct `render_<kind>(transport)` helper. The new `render_transport` wrapper dispatches typed without going through `NodeData`.

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts` (extend existing or create alongside)
- Generated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`

- [ ] **Step 1: Failing emitter test.**

Add to `packages/codegen/src/__tests__/render-module-emit.test.ts` (port to whatever harness shape that file currently uses; do not invent a new harness):

```ts
import { describe, expect, it } from 'vitest';
import { generateGrammar } from '../compiler/generate.ts';

describe('render-module emitter — typed transport bridge', () => {
  it('emits per-template from_transport and per-grammar Renderable extension for rust', async () => {
    const out = await generateGrammar({ grammar: 'rust', strict: false });
    const body = out.tests; // adjust to whichever field exposes the rendered render-module body

    expect(body).toContain('pub enum Renderable');
    expect(body).toMatch(/impl<'a> CallExpressionTemplate<'a> \{[\s\S]*pub fn from_transport/);
    expect(body).toMatch(/pub fn render_call_expression\(node: &CallExpressionTransport\)/);
    expect(body).toMatch(/pub fn render_transport\(transport: AnyTransport\)/);
    // The legacy collapse path stays exported as the inverse bridge:
    expect(body).toContain('pub fn node_data_from_transport');
    // …but render_transport must not call it:
    const renderTransportBody = body.split('pub fn render_transport(transport: AnyTransport)')[1] ?? '';
    const next = renderTransportBody.split('\npub fn ')[0] ?? renderTransportBody;
    expect(next).not.toContain('transport_to_node');
    expect(next).not.toContain('render_dispatch');
  });
});
```

- [ ] **Step 2: Run and verify failure.**

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: FAIL on missing `pub enum Renderable`, missing `from_transport`, etc.

- [ ] **Step 3: Emit the per-grammar `Renderable` extension enum.**

In `packages/codegen/src/emitters/render-module.ts`, before the `AnyTransport` enum emission, add a section that walks all `nodes` and emits:

```rust
#[derive(Debug, Clone, Copy)]
pub enum Renderable<'a> {
    /// Final, render-ready text.
    Text(&'a str),
    /// Streaming join.
    Joined(::sittir_core::filters::Joined<'a>),
    // One variant per renderable kind — wraps a borrowed transport ref.
    Identifier(&'a IdentifierTransport),
    CallExpression(&'a CallExpressionTransport),
    // … one per kind in `nodes` …
}
```

Plus `Display` + `FastWritable` impls that dispatch on the variant. For each per-kind variant the rendering arm is:

```rust
Self::CallExpression(t) => {
    let template = CallExpressionTemplate::from_transport(t).map_err(|_| std::fmt::Error)?;
    let s = template.render().map_err(|_| std::fmt::Error)?;
    f.write_str(&s)
}
```

…and the `FastWritable` arm:

```rust
Self::CallExpression(t) => {
    CallExpressionTemplate::from_transport(t)?.write_into(dest, values)
}
```

The grammar-agnostic `Text` and `Joined` variants on the **grammar-local** `Renderable` shadow the core `Renderable` for transport-bridge usage. The core `Renderable` is consumed only by `Joined`'s items, so the grammar-local enum supersedes it inside `templates.rs`. **If Rust complains about a name conflict between `sittir_core::filters::Renderable` and the local `Renderable`, alias the import (`use ::sittir_core::filters::Renderable as CoreRenderable;`) — keep the grammar-local name `Renderable` because that's what generated bridges use.**

- [ ] **Step 4: Emit `from_transport` per template struct.**

For each non-leaf, non-literal node, emit (after the `*Template` struct declaration):

```rust
impl<'a> CallExpressionTemplate<'a> {
    pub fn from_transport(node: &'a CallExpressionTransport) -> Result<Self, ::askama::Error> {
        let arguments_buf: Vec<Renderable<'a>> = node
            .arguments
            .iter()
            .map(|t| Renderable::Expression(t))
            .collect();
        // SAFETY: arguments_buf is owned by Self; the slice it produces is
        // bounded by Self's lifetime and never escapes.
        let arguments_slice: &'a [Renderable<'a>] = unsafe {
            std::mem::transmute::<&[Renderable<'_>], &'a [Renderable<'a>]>(arguments_buf.as_slice())
        };
        Ok(Self {
            function: ::sittir_core::filters::FieldView::One(Renderable::Expression(&node.function)),
            arguments: ::sittir_core::filters::FieldView::Many(::sittir_core::filters::ListView {
                items: arguments_slice,
                separator: ", ",
                leading: false,
                trailing: false,
            }),
            _arguments_buf: arguments_buf,
        })
    }
}
```

Per-slot construction table — emitter must cover every row:

| Slot kind | Construction |
| --- | --- |
| Required scalar of type `T` | `FieldView::One(Renderable::T(&node.<field>))` |
| Optional scalar of type `T` | `node.<field>.as_ref().map(\|f\| FieldView::One(Renderable::T(f))).unwrap_or(FieldView::Missing)` |
| Required list of type `T` with separator `S` | owned `Vec<Renderable<'a>>` collected from `node.<field>.iter().map(\|t\| Renderable::T(t))`, slice via `transmute`, wrapped in `FieldView::Many(ListView { items, separator: S, leading, trailing })`, plus a hidden `_<field>_buf` struct field |
| Optional list | `if node.<field>.is_empty() { FieldView::Missing } else { FieldView::Many(...) }` (and skip the buf if empty) |
| Plain text leaf | `FieldView::One(Renderable::Text(node.<field>.as_str()))` |
| Polymorph parent | `match node { CallExpressionTransport::Foo(t) => CallExpressionFooTemplate::from_transport(t).map(...) , … }` — port the existing `transport_to_node_<kind>` polymorph branch logic from `renderTransportToNodeFns` in the emitter |

Update the emitted struct to carry hidden owned-vec siblings for list slots:

```rust
pub struct CallExpressionTemplate<'a> {
    pub function: ::sittir_core::filters::FieldView<'a>,
    pub arguments: ::sittir_core::filters::FieldView<'a>,
    #[doc(hidden)]
    _arguments_buf: Vec<Renderable<'a>>,
}
```

The `transmute` is sound because the buf is owned by `Self` and the slice reference's lifetime is bounded by `Self`. Emit a `// SAFETY:` comment in the generated body explaining this. **If reviewers reject `transmute`, the alternative is an `Owned(Vec<Renderable<'a>>)` variant on `ListView` — defer that refactor unless it blocks review.**

- [ ] **Step 5: Emit a typed `render_<kind>` direct path and rewire `render_transport`.**

Per kind:

```rust
pub fn render_call_expression(node: &CallExpressionTransport) -> Result<String, ::askama::Error> {
    let tpl = CallExpressionTemplate::from_transport(node)?;
    tpl.render()
}
```

Rewrite the `render_transport` wrapper at the bottom of the generated module:

```rust
pub fn render_transport(transport: AnyTransport) -> Result<String, ::askama::Error> {
    match &transport {
        AnyTransport::CallExpression(t) => render_call_expression(t),
        AnyTransport::Identifier(t) => render_identifier(t),
        // … one per kind …
    }
}
```

**Keep these exports for the inverse bridge (Task 5 will rely on them):**

- `transport_to_node`
- `node_data_from_transport`
- `transport_field_value`
- `transport_field_values`
- `transport_children`
- `render_dispatch`

`render_transport_parts` and `from_transport(transport: AnyTransport) -> Result<String, _>` (the file-level helper, not the per-template method) become tombstones — keep their declarations but have them call the new `render_transport`. Reasoning: external callers of those exports exist; we drop them in a follow-up after a deprecation cycle.

- [ ] **Step 6: Regenerate the three grammars.**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: all succeed.

- [ ] **Step 7: Build all three grammar crates.**

```bash
cargo build -p sittir-rust -p sittir-typescript -p sittir-python
```

Expected: all compile. **If a per-kind `from_transport` fails to compile because of a slot-type mismatch (e.g. a missing row in the table above), fix the slot-type emission table at the source — do not add a special case. Document the missed pattern in the commit message.**

- [ ] **Step 8: Re-run the emitter tests.**

```bash
pnpm test --filter @sittir/codegen
```

Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/__tests__/render-module-emit.test.ts rust/crates/sittir-rust/src/render/templates.rs rust/crates/sittir-typescript/src/render/templates.rs rust/crates/sittir-python/src/render/templates.rs
git commit -m "codegen: emit from_transport bridges + per-grammar Renderable family + direct render dispatch"
```

---

## Task 5: Repurpose typed transport for the inverse direction (parse/Read)

**Goal:** parse/Read in Rust emits typed `AnyTransport` directly from a tree-sitter `Node`. The legacy `NodeData`-producing reader stays available as a one-way bridge for any TS caller that still wants `NodeData` from typed transport (the existing `transport_to_node` path serves this).

**Why now:** Tasks 1–4 established the typed transport shape on the render side. The same shape is the right output for parse/Read because: (a) the consumer on the JS side already has typed bindings for `*Transport`, (b) we eliminate the `NodeData → JSON → NodeData` round trip across the boundary, (c) the bridge between transport and `NodeData` runs only when needed and only in one direction.

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts` — emit per-kind `read_<kind>(node: tree_sitter::Node, source: &str) -> Result<<K>Transport, ReadError>` plus a top-level `read_any(node, source) -> Result<AnyTransport, ReadError>`.
- Modify: `rust/crates/sittir-core/src/engine.rs` — typed reader entrypoint that returns `AnyTransport`. The existing `parseAndRead` / `readNode` wrappers gain a typed sibling.
- Modify: `rust/crates/sittir-{rust,typescript,python}/src/lib.rs` — N-API entrypoints `parseAndReadTransport` / `readTransportNode` returning N-API objects shaped like the JS-side `AnyTransport`. Keep the existing `parseAndRead` / `readNode` (NodeData-producing) functions as-is so callers can migrate.
- Modify: `packages/{rust,typescript,python}/src/engine.ts` — `parseAndRead` wires through the typed reader and types the returned object as `AnyTransport` via the generated transport types.

- [ ] **Step 1: Write a failing Rust test that reads a tree-sitter node directly into typed transport.**

In `rust/crates/sittir-core/tests/wire_shape.rs` (or a new `tests/typed_reader.rs` if you prefer — pick whichever has the simpler test fixture pattern), add:

```rust
#[test]
fn typed_reader_emits_any_transport_without_node_data() {
    use sittir_rust::render::{read_any, AnyTransport};
    let source = "fn main() {}";
    // Parse via the existing engine entrypoint that returns a tree-sitter Node.
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&tree_sitter_rust::LANGUAGE.into()).expect("set language");
    let tree = parser.parse(source, None).expect("parse");
    let root = tree.root_node();
    let transport = read_any(root, source).expect("read_any");
    match transport {
        AnyTransport::SourceFile(_) => {}
        other => panic!("expected SourceFile, got {:?}", other),
    }
}
```

(If `tree_sitter_rust` is not already a dev-dep on `sittir-core`, add the test inside `rust/crates/sittir-rust/tests/` and depend on `sittir-rust` instead.)

- [ ] **Step 2: Run and verify failure.**

```bash
cargo test -p sittir-core --test wire_shape typed_reader_emits_any_transport_without_node_data
```

Expected: FAIL — `read_any` not defined.

- [ ] **Step 3: Emit per-kind `read_<kind>(node, source) -> Result<<K>Transport, ReadError>`.**

In `packages/codegen/src/emitters/render-module.ts`, add a new emission section. For each non-leaf, non-literal node, emit:

```rust
pub fn read_call_expression(node: ::tree_sitter::Node<'_>, source: &str) -> Result<CallExpressionTransport, ReadError> {
    let function_node = node.child_by_field_name("function").ok_or(ReadError::MissingField("function"))?;
    let function = read_expression(function_node, source)?;
    let mut arguments: Vec<Box<AnyTransport>> = Vec::new();
    if let Some(args_node) = node.child_by_field_name("arguments") {
        let mut cursor = args_node.walk();
        for child in args_node.named_children(&mut cursor) {
            arguments.push(Box::new(read_any(child, source)?));
        }
    }
    Ok(CallExpressionTransport {
        // metadata fields populated from `node` and `source`:
        $type: …,
        $named: node.is_named(),
        $source: TransportSource::Ts,
        $span: span_from(node),
        $nodeId: node.id() as u32,
        function,
        arguments,
    })
}
```

The emitter already has slot metadata (field-by-field rules under `nativeTransportRawChildFieldRules` in `packages/rust/src/utils.ts`-style outputs). Port that table into `render-module.ts` (read it from the same source `assemble.ts` produces) so the per-kind body knows: which `child_by_field_name` to pull, which `Renderable` variant to emit per child, whether the field is required / optional / list, what separator the slot owns.

The `ReadError` enum should mirror the failure modes the existing `transport_to_node` raises:

```rust
#[derive(Debug)]
pub enum ReadError {
    MissingField(&'static str),
    UnexpectedKind { expected: &'static str, found: String },
    UnknownKind(String),
}
```

Define it once at the top of the generated module.

For the polymorph parent, dispatch on `node.kind()` and the same form-disambiguation logic the existing `transport_to_node` polymorph branch uses (`renderTransportToNodeFns`) — port the discriminator predicates exactly so the typed reader and the existing collapse reader agree on form.

- [ ] **Step 4: Emit a top-level `read_any`.**

```rust
pub fn read_any(node: ::tree_sitter::Node<'_>, source: &str) -> Result<AnyTransport, ReadError> {
    match node.kind() {
        "call_expression" => Ok(AnyTransport::CallExpression(read_call_expression(node, source)?)),
        "identifier" => Ok(AnyTransport::Identifier(read_identifier(node, source)?)),
        // … one per kind …
        other => Err(ReadError::UnknownKind(other.to_string())),
    }
}
```

For literal kinds, emit a `read_literal_<kind>(node, source) -> Result<<K>Transport, ReadError>` that reads `node.utf8_text(source.as_bytes())` into the literal's `text` field plus the metadata fields.

- [ ] **Step 5: Regenerate and build.**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
cargo build -p sittir-rust -p sittir-typescript -p sittir-python
```

Expected: all succeed.

- [ ] **Step 6: Run the typed-reader Rust test.**

```bash
cargo test -p sittir-core --test wire_shape typed_reader_emits_any_transport_without_node_data
```

Expected: PASS.

- [ ] **Step 7: Add `parseAndReadTransport` / `readTransportNode` napi entrypoints.**

For each grammar, in `rust/crates/sittir-{rust,typescript,python}/src/lib.rs`, add:

```rust
#[napi]
pub fn parse_and_read_transport(&self, source: String) -> Result<serde_json::Value> {
    let mut parser = ::tree_sitter::Parser::new();
    parser.set_language(&LANGUAGE.into()).map_err(|e| Error::from_reason(e.to_string()))?;
    let tree = parser.parse(&source, None).ok_or_else(|| Error::from_reason("parse failed"))?;
    let transport = ::sittir_<grammar>::render::read_any(tree.root_node(), &source)
        .map_err(|e| Error::from_reason(format!("{e:?}")))?;
    serde_json::to_value(&transport).map_err(|e| Error::from_reason(e.to_string()))
}

#[napi]
pub fn read_transport_node(&self, source: String, node_id: u32) -> Result<serde_json::Value> {
    // … parse, locate node by id, call read_any …
}
```

(If your N-API exposes a richer `Object` type than `serde_json::Value`, prefer that.)

- [ ] **Step 8: Wire the TS engine to consume typed transport on the read side.**

In `packages/{rust,typescript,python}/src/engine.ts`, change `parseAndRead` to call the new `parseAndReadTransport`:

```ts
parseAndRead(source: string) {
    const transport = engine.parseAndReadTransport(source) as AnyTransport;
    return {
        root: transport,
        tree: {
            // …existing wiring; but `read(nodeId)` now returns AnyTransport, not AnyNodeData.
            read: (nodeId) => {
                if (nodeId === undefined) return transport;
                return engine.readTransportNode(source, nodeId) as AnyTransport;
            },
            // render path is unchanged — it already takes the same shape.
            render: (nodeId, opts) => {
                const node = nodeId === undefined ? transport : engine.readTransportNode(source, nodeId) as AnyTransport;
                return renderNativeNode(node, opts);
            },
        },
    };
}
```

**Type signature change:** the `tree.read()` / `parseAndRead()` return type changes from `AnyNodeData` to `AnyTransport`. Update `@sittir/types` and `@sittir/core/engine`'s `TreeHandle` / `SittirEngineLike.reader` accordingly. Any TS-side consumer that introspects `$fields` / `$children` (the `NodeData` shape) must either (a) migrate to typed-transport access, or (b) call the inverse bridge `nodeDataFromTransport(transport)` exposed by the grammar package — emit a thin TS wrapper that calls the native crate's `node_data_from_transport`.

Identify all such consumers:

```bash
grep -rn "\$fields\|\$children" packages --include="*.ts" | grep -v "/src/types\|/src/wrap\|/src/factories" | head -30
```

For each, pick (a) or (b). Document the choice in the commit message.

- [ ] **Step 9: Run the full suite.**

```bash
cargo test --workspace
pnpm -r run type-check
pnpm test
```

Expected: PASS. **The corpus parity tests (`specs/016-parity-regressions/`) must remain byte-identical to the JS engine. If they regress on line-comment cases, port the line-comment fix into a `Joined`-aware variant per Task 3 step 3.**

- [ ] **Step 10: Commit.**

```bash
git add packages/codegen/src/emitters/render-module.ts rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs rust/crates/sittir-rust/src/render/templates.rs rust/crates/sittir-typescript/src/render/templates.rs rust/crates/sittir-python/src/render/templates.rs packages/rust/src/engine.ts packages/typescript/src/engine.ts packages/python/src/engine.ts packages/core/src/engine.ts
# plus any TS consumer migrations done in step 8
git commit -m "rust: parse/Read emits typed transport directly; collapse retained as inverse bridge"
```

---

## Task 6: Lock-in regressions + parity verification

**Files:**

- Modify: `rust/crates/sittir-core/tests/wire_shape.rs`
- Modify: `rust/crates/sittir-core/tests/boundary_roundtrip.rs` (only if a fixture broke)
- Modify: `specs/016-parity-regressions/baselines/native.json` (only if step 4 below produces an empty diff)

- [ ] **Step 1: Codegen-contract regression — `render_transport` does not collapse.**

Add to `rust/crates/sittir-core/tests/wire_shape.rs`:

```rust
#[test]
fn render_transport_does_not_round_trip_through_node_data() {
    let body = include_str!("../../sittir-rust/src/render/templates.rs");
    let after = body
        .split("pub fn render_transport(transport: AnyTransport)")
        .nth(1)
        .expect("render_transport defined");
    let next_fn = after.find("\npub fn ").map(|i| &after[..i]).unwrap_or(after);
    assert!(!next_fn.contains("transport_to_node"),
        "render_transport must dispatch directly, not via transport_to_node");
    assert!(!next_fn.contains("render_dispatch"),
        "render_transport must dispatch directly, not via render_dispatch");
}

#[test]
fn parse_and_read_does_not_build_node_data() {
    let body = include_str!("../../sittir-rust/src/lib.rs");
    let after = body
        .split("pub fn parse_and_read_transport")
        .nth(1)
        .expect("parse_and_read_transport defined");
    let next_fn = after.find("\n    #[napi]").map(|i| &after[..i]).unwrap_or(after);
    assert!(!next_fn.contains("transport_to_node"),
        "parse_and_read_transport must read directly into transport, not via NodeData collapse");
}
```

- [ ] **Step 2: Run the regressions.**

```bash
cargo test -p sittir-core --test wire_shape
```

Expected: PASS.

- [ ] **Step 3: Run the full Rust workspace + TS suite.**

```bash
cargo test --workspace
pnpm -r run type-check
pnpm test
```

Expected: PASS. If a `boundary_roundtrip.rs` fixture relied on internal collapse behaviour, port it to construct an `AnyTransport` directly and call `render_transport` and/or `read_any`.

- [ ] **Step 4: Run the parity corpus.**

```bash
pnpm test specs/016-parity-regressions
```

Expected: empty diff against the JS engine. **Do not refresh the baseline if the diff is non-empty — investigate and fix instead. Byte-identical output is the design's verification gate (design §6, item 6).**

- [ ] **Step 5: Final commit + open PR.**

```bash
git add rust/crates/sittir-core/tests/wire_shape.rs
# include any boundary_roundtrip.rs porting done above
git commit -m "rust: lock-in regressions for typed-projection render + read paths"
```

Open a PR titled `Renderable native views — typed-projection render + read paths` referencing:

- `docs/superpowers/specs/2026-04-29-renderable-native-views-design.md`
- handoff.md §2A (the gap analysis this plan closes)

Body should highlight the architectural invariants from §6 of the design:

1. typed projection happens before JS↔Rust on **both** directions
2. slot truth (ADR-0015) unchanged
3. value rendering separate from slot discovery
4. public Askama surface only

---

## Self-review checklist

- **Spec coverage** (mapping to design §1–§7):
  1. Typed JS→Rust transport — already landed; preserved.
  2. Matching generated Rust transport types — already landed; preserved.
  3. Generated `from_transport(...)` bridge — Task 4 step 4.
  4. Closed renderable family — Task 1 (core) + Task 4 (per-grammar extension).
  5. `FieldView` / `ListView` carry renderables — Task 2.
  6. Render-ready text short-circuit — Task 4 slot table row "Plain text leaf".
  7. Streaming filters returning `Safe<Joined<'a>>` — Task 3.
  8. Inverse direction — typed transport on parse/Read — Task 5 (added per user direction 2026-04-30).
- **Placeholder scan:** no TBD/TODO. Two explicit fallbacks: line-comment join fix (Task 3 / Task 5 step 9) and `transmute` review (Task 4 step 4).
- **Type consistency:**
  - `Renderable<'a>` (core) — `Text(&'a str) | Joined(Joined<'a>)`.
  - `Renderable<'a>` (per-grammar extension) — superset: `Text` + `Joined` + one variant per kind. The per-grammar one shadows the core one inside `templates.rs` and inside transport bridges.
  - `Joined<'a>` returned from `joinby`, wrapped in `askama::filters::Safe<...>`.
  - `FieldView::Missing | One(Renderable<'a>) | Many(ListView<'a>)`.
  - `ListView<'a>` — `items: &'a [Renderable<'a>]`.
  - `JoinSource<'a>` (renamed) yields `&'a [Renderable<'a>]`.
  - Reader output type — `AnyTransport` (replaces `AnyNodeData` in `TreeHandle.read` / `parseAndRead.root`).
  - Inverse bridge — `node_data_from_transport(transport: AnyTransport) -> NodeData` retained as the only direction of conversion now needed.
