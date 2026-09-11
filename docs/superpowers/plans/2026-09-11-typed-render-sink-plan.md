# Typed Render Sink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The generated render functions write into a typed sink instead of a `fmt::Formatter`, so whitespace decisions travel as calls rather than as noncharacters parsed back out of the byte stream; and the render options cross the boundary as a generated per-kind struct instead of a JSON string matched against a path table.

**Architecture:** `sittir-core` gains a `RenderSink` trait with one method per thing the spacing writer needs to know (`text`, `adjacent`, `site`, `seam`, `token_seam`, `indent`, `dedent`) and a `Render` trait every transport, view and enum implements in place of `Display`. The body printer emits one call per body node; the five mark characters, the scanner and the `seamMarked` prefixing are deleted. The options module generates one Rust struct per address branch mirroring the TypeScript `AddressedOptions` type, deserialized over napi with unknown keys refused, and a straight-line resolver that sets each site the address names; the flat `ResolvedOptions` table and the site constants stay as the resolved form the prepare walk reads. Rendered bytes do not change: this is a refactor, gated on byte identity.

**Tech Stack:** Rust (`sittir-core`, generated `sittir-{rust,typescript,python}` crates, napi-rs), TypeScript codegen (`packages/codegen`), `@sittir/common`, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-07-24-spacing-writer-design.md` (the invariant the writer keeps; its "v1: the writer (jinja-compatible)" section is superseded by this plan and is rewritten in Task 4) and the "Engine and boundary API" section of `docs/superpowers/specs/2026-09-04-render-options-design.md` ("Native: `SittirEngine` takes the options object once at construction and resolves it to one kind id per site there ... per node, only ids ever cross napi"). The coordinate plan `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md` lands on top of this one.

## Global Constraints

- **Byte identity is the only gate for Tasks 1–2.** `validate:native` and `validate:history` identical to the baselines below; the three dogfood examples byte-identical; every crate's `test-fixtures.json` parity suite green; the package suites green. A byte that differs is a finding to review in place, never a reason to revert.
- Baselines at the branch head `e807479a0`: `validate:native` rust `147 / 207 / 134 of 137`, typescript `143 / 193 / 112 of 114`, python `126 / 142 / 115 of 116`.
- Generated outputs are never hand-edited: `packages/{rust,typescript,python}/src/*`, `packages/*/.sittir/*`, `rust/crates/sittir-{rust,typescript,python}/src/render/*` come from `SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`. The crate roots `rust/crates/sittir-<g>/src/lib.rs` are hand-written.
- `packages/codegen/src` carries no explanatory comments; every new, renamed or changed declaration gets a `###` entry in `docs/glossary/emitters.md` headed `` ### `packages/codegen/src/emitters/<file>.ts::<name>` ``. Rust crates keep doc comments that state live constraints, never provenance.
- No comment or doc references a spec, plan, PR or task number.
- Nothing ambient: the writer is constructed once at the render root and passed down as an argument. No `thread_local!`, no `static mut`, no global.
- Every commit uses explicit pathspecs: `git add <paths>` then `git commit -- <paths>`. Never stage `packages/types/.vitest-report.json`, the untracked `*-roles.scm` files, or `sittir-role-interfaces-scm-spec.md`.
- Run `pnpm exec vitest run` as its own shell call; regenerate python before validating after any vitest run.
- Task 1 is additive and gates on `cargo test -p sittir-core` plus `cargo build --workspace`. Task 2 switches the emitters and removes the marks, and is the first task that regenerates and runs the byte-identity gates.
- Branch: `feat/strict-rebuild-from-source`. Each task is one commit. Commit trailer on every commit:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn
```

---

## File structure

| File | Responsibility after this plan |
| --- | --- |
| `rust/crates/sittir-core/src/render.rs` (new) | `RenderSink`, `Render`, `RenderError`, `WhitespaceTable`, `render_to_string` |
| `rust/crates/sittir-core/src/spacing.rs` | `SpacingWriter` implements `RenderSink`; the lexical collision rule, depth, held seam; no marks, no `fmt::Write` |
| `rust/crates/sittir-core/src/view.rs` | `Slot` and the views over a `RenderSink`; `Render` impls |
| `rust/crates/sittir-core/src/slot.rs` | `SlotValue: Render`; `node_or_write(w)` |
| `rust/crates/sittir-core/src/macros.rs` | `render_with_trivia!` over a sink |
| `rust/crates/sittir-core/src/options.rs` | `ResolvedOptions`; `reject_unknown_keys` |
| `rust/crates/sittir-core/src/napi_engine.rs` | `EngineOptions.options: Option<$options>`; per-call options typed; no per-call table clone |
| `packages/codegen/src/emitters/render-body.ts` | typed body nodes (`indent`, `dedent`, `tokenSeam`); the printer emits sink calls |
| `packages/codegen/src/emitters/templates.ts` | produces the typed nodes |
| `packages/codegen/src/emitters/render-module.ts` | `Render` impls, `render_<kind>(node, w)`, views bound over site ids, root dispatch over the table |
| `packages/codegen/src/emitters/render-options-rs.ts` | `WHITESPACE` table, `Options` structs, hand-emitted deserializers, straight-line `resolve`; no path table |
| `packages/codegen/src/emitters/options.ts` | `AddressLeafEntry.canonical` so the two option emitters share one address derivation |
| `packages/common/src/engine.ts` | options passed as objects |
| `docs/superpowers/specs/2026-07-24-spacing-writer-design.md` | end state: the typed sink |

---

### Task 1: The sink and the `Render` trait, beside the marks

**Files:**
- Create: `rust/crates/sittir-core/src/render.rs`
- Modify: `rust/crates/sittir-core/src/spacing.rs`, `view.rs`, `slot.rs`, `macros.rs`, `lib.rs`
- Modify: `rust/crates/sittir-core/tests/view.rs`

**Interfaces:**
- Produces:
  ```rust
  // render.rs
  pub enum RenderError { Fmt(std::fmt::Error) }            // Display + Error; From<fmt::Error>
  pub type RenderResult = Result<(), RenderError>;
  pub struct WhitespaceTable { pub text_of: fn(u16) -> &'static str, pub indent: u16, pub dedent: u16 }
  pub trait RenderSink {
      fn text(&mut self, s: &str) -> RenderResult;         // literal text; the lexical collision space is decided here
      fn adjacent(&mut self);                               // no collision space before the next text
      fn site(&mut self, kind: u16);                        // a site's resolved arm: 0 = no arm; a depth arm moves the depth
      fn seam(&mut self, text: &str);                       // fixed whitespace between two things; dropped at either edge
      fn token_seam(&mut self, text: &str);                 // whitespace that is a token's content; coalesces, never dropped
      fn indent(&mut self);
      fn dedent(&mut self);
      fn ends_line(&self) -> bool;                          // last byte written is a line break, or nothing was written
  }
  pub trait Render { fn render(&self, w: &mut dyn RenderSink) -> RenderResult; }
  // impls: &T, Box<T>, str, String
  pub fn render_to_string(value: &dyn Render, word: &WordMatcher, table: &WhitespaceTable, indent: &str) -> Result<String, RenderError>;
  // spacing.rs
  impl<W: fmt::Write + ?Sized> SpacingWriter<'_, W> { pub fn new(inner: &'a mut W, word: &'a WordMatcher, table: &'a WhitespaceTable) -> Self; pub fn with_indent(self, indent: &'a str) -> Self; pub fn finish(&mut self) -> RenderResult; }
  impl RenderSink for SpacingWriter<'_, W>;
  // view.rs
  pub trait Slot { fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult; fn is_present(&self) -> bool; }
  pub struct ListView<'a, E: Slot> { items, template, token: &'a str, before: u16, after: u16, leading, trailing, head: u16, tail: u16 }
  impl Render for View<'_, S>; impl Render for ListView<'_, E>;
  // slot.rs
  impl<T: Render, const A: bool> Render for SlotValue<T, A>;
  pub fn node_or_write(&self, w: &mut dyn RenderSink) -> Result<Option<&T>, RenderError>;
  // macros.rs
  render_with_trivia!($self, $w, $render)                  // $w: &mut dyn RenderSink
  ```
  The mark parser (`fmt::Write for SpacingWriter`, `is_mark`, the five constants, `mark_adjacent`) stays in this task so the generated crates keep compiling; Task 2 deletes it.

- [ ] **Step 1: Write the failing sink tests**

Append a second test module to `rust/crates/sittir-core/src/spacing.rs`, keeping the existing mark tests untouched for now:

```rust
#[cfg(test)]
mod sink_tests {
    use super::*;
    use crate::render::{RenderSink, WhitespaceTable};

    const TIGHT: u16 = 1;
    const SPACE: u16 = 2;
    const NEWLINE: u16 = 3;
    const BLANK: u16 = 4;
    const INDENT: u16 = 5;
    const DEDENT: u16 = 6;
    fn text_of(kind: u16) -> &'static str {
        match kind { TIGHT => "", SPACE => " ", NEWLINE => "\n", BLANK => "\n\n", INDENT | DEDENT => "\n", _ => "" }
    }
    const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: INDENT, dedent: DEDENT };

    fn run(f: impl FnOnce(&mut SpacingWriter<'_, String>)) -> String {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, &WordMatcher::DEFAULT, &TABLE).with_indent("  ");
        f(&mut w);
        w.finish().unwrap();
        s
    }

    #[test]
    fn a_word_hazard_gets_a_space_and_adjacent_suppresses_it() {
        assert_eq!(run(|w| { w.text("let").unwrap(); w.text("x").unwrap(); }), "let x");
        assert_eq!(run(|w| { w.text("let").unwrap(); w.adjacent(); w.text("x").unwrap(); }), "letx");
    }

    #[test]
    fn seams_coalesce_to_the_widest_and_drop_at_the_edges() {
        assert_eq!(run(|w| { w.site(NEWLINE); w.text("a").unwrap(); w.site(SPACE); w.site(BLANK); w.text("b").unwrap(); w.site(NEWLINE); }), "a\n\nb");
        assert_eq!(run(|w| { w.text("a").unwrap(); w.seam("\n"); w.seam(" "); w.text("b").unwrap(); }), "a\nb");
    }

    #[test]
    fn a_token_seam_coalesces_but_survives_the_end() {
        assert_eq!(run(|w| { w.text("pass").unwrap(); w.token_seam("\n"); w.site(NEWLINE); }), "pass\n");
        assert_eq!(run(|w| { w.token_seam("\n"); w.text("a").unwrap(); }), "\na");
    }

    #[test]
    fn a_tight_site_holds_a_seam_that_still_gets_the_lexical_space() {
        assert_eq!(run(|w| { w.text("let").unwrap(); w.site(TIGHT); w.text("x").unwrap(); }), "let x");
        assert_eq!(run(|w| { w.text("a").unwrap(); w.site(0); w.text("b").unwrap(); }), "ab");
    }

    #[test]
    fn a_depth_site_indents_and_a_dedent_before_any_text_leaves_a_body_bare() {
        assert_eq!(run(|w| { w.text("{").unwrap(); w.site(INDENT); w.text("a").unwrap(); w.site(DEDENT); w.text("}").unwrap(); }), "{\n  a\n}");
        assert_eq!(run(|w| { w.text("{").unwrap(); w.site(INDENT); w.site(DEDENT); w.text("}").unwrap(); }), "{}");
        assert_eq!(run(|w| { w.text("{").unwrap(); w.indent(); w.seam("\n"); w.text("a").unwrap(); w.dedent(); w.seam("\n"); w.text("}").unwrap(); }), "{\n  a\n}");
    }

    #[test]
    fn ends_line_reports_the_last_byte() {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, &WordMatcher::DEFAULT, &TABLE);
        assert!(w.ends_line());
        w.text("a").unwrap();
        assert!(!w.ends_line());
        w.text("\n").unwrap();
        assert!(w.ends_line());
    }
}
```

(`WordMatcher::DEFAULT` names whatever the existing tests use for a default matcher; the existing test module constructs one — reuse that expression.)

- [ ] **Step 2: Port the view tests to the sink**

In `rust/crates/sittir-core/tests/view.rs` replace the `Word` `Display` impl and the `format!` calls: `Word` implements `Render` (`w.text(self.0)`), and each assertion renders through `render_to_string(&view, &WordMatcher::DEFAULT, &TABLE, "    ")` with the same `TABLE` and `text_of` as the sink tests (copy the eight-line table into the test file). `ListView` literals give `before`/`after`/`head`/`tail` as the kind ids `TIGHT`/`SPACE`/`NEWLINE` instead of `""`/`" "`/`"\n"`; the expected strings do not change.

- [ ] **Step 3: Run both to see them fail**

Run: `cd rust && cargo test -p sittir-core --lib sink_tests --test view`
Expected: compile errors naming `crate::render`, `RenderSink`, `SpacingWriter::new` arity.

- [ ] **Step 4: Implement `render.rs`**

```rust
//! The typed sink a render writes into, and the trait every rendered value
//! implements against it. Whitespace decisions are calls, not bytes: a
//! site's arm, a fixed seam, a whitespace token, adjacency and depth each
//! have a method, and the writer behind the sink decides what reaches the
//! output.

use std::fmt;

use crate::spacing::{SpacingWriter, WordMatcher};

#[derive(Debug)]
pub enum RenderError {
    Fmt(fmt::Error),
}

impl fmt::Display for RenderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Fmt(e) => fmt::Display::fmt(e, f),
        }
    }
}

impl std::error::Error for RenderError {}

impl From<fmt::Error> for RenderError {
    fn from(e: fmt::Error) -> Self {
        Self::Fmt(e)
    }
}

pub type RenderResult = Result<(), RenderError>;

/// The grammar's whitespace vocabulary as the writer needs it: the text of
/// each arm by kind id, and which two ids are the depth arms.
pub struct WhitespaceTable {
    pub text_of: fn(u16) -> &'static str,
    pub indent: u16,
    pub dedent: u16,
}

pub trait RenderSink {
    fn text(&mut self, s: &str) -> RenderResult;
    fn adjacent(&mut self);
    fn site(&mut self, kind: u16);
    fn seam(&mut self, text: &str);
    fn token_seam(&mut self, text: &str);
    fn indent(&mut self);
    fn dedent(&mut self);
    fn ends_line(&self) -> bool;
}

pub trait Render {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult;
}

impl<T: Render + ?Sized> Render for &T {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        (**self).render(w)
    }
}

impl<T: Render + ?Sized> Render for Box<T> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        (**self).render(w)
    }
}

impl Render for str {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(self)
    }
}

impl Render for String {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(self)
    }
}

/// One writer, one render, one `finish`: the shape every root render has.
pub fn render_to_string(
    value: &dyn Render,
    word: &WordMatcher,
    table: &WhitespaceTable,
    indent: &str,
) -> Result<String, RenderError> {
    let mut out = String::new();
    let mut w = SpacingWriter::new(&mut out, word, table).with_indent(indent);
    value.render(&mut w)?;
    w.finish()?;
    Ok(out)
}
```

- [ ] **Step 5: The writer implements the sink**

In `spacing.rs`: `SpacingWriter` gains `table: &'a WhitespaceTable`; `new` takes it; `finish` returns `RenderResult`. Add:

```rust
impl<W: std::fmt::Write + ?Sized> crate::render::RenderSink for SpacingWriter<'_, W> {
    fn text(&mut self, s: &str) -> crate::render::RenderResult {
        self.write_chunk(s)?;
        Ok(())
    }

    fn adjacent(&mut self) {
        self.adjacent_next = true;
    }

    /// A site's arm: nothing for 0, a depth move plus its line break for
    /// the depth arms, otherwise the arm's text as a seam.
    fn site(&mut self, kind: u16) {
        if kind == 0 {
            return;
        }
        if kind == self.table.indent {
            self.indent();
            self.merge_seam("\n");
        } else if kind == self.table.dedent {
            if self.dedent_keeps_payload() {
                self.merge_seam("\n");
            }
        } else {
            self.merge_seam((self.table.text_of)(kind));
        }
    }

    fn seam(&mut self, text: &str) {
        self.merge_seam(text);
    }

    fn token_seam(&mut self, text: &str) {
        self.merge_seam(text);
        self.seam_is_token = true;
    }

    fn indent(&mut self) {
        self.depth += 1;
        self.indent_armed = true;
    }

    fn dedent(&mut self) {
        self.dedent_keeps_payload();
    }

    fn ends_line(&self) -> bool {
        matches!(self.last, None | Some('\n'))
    }
}

impl<W: std::fmt::Write + ?Sized> SpacingWriter<'_, W> {
    /// Shallows the depth. A dedent that arrives while the indent before
    /// it has had no text written cancels it and its held payload, so an
    /// empty body renders as its bare delimiters; the caller then writes no
    /// payload of its own.
    fn dedent_keeps_payload(&mut self) -> bool {
        self.depth = self.depth.saturating_sub(1);
        if std::mem::replace(&mut self.indent_armed, false) {
            self.seam = None;
            self.seam_text.clear();
            return false;
        }
        true
    }
}
```

`write_chunk`, `merge_seam`, `flush_seam`, `write_text`, `pay_indent` are unchanged. The `INDENT`/`DEDENT` arms of the existing `fmt::Write::write_str` are rewritten to call `self.indent()` / `self.dedent_keeps_payload()` so the two paths share one derivation until the mark path is deleted.

- [ ] **Step 6: Views, the carrier and the trivia macro over the sink**

`view.rs`: `Slot::write_slot` takes `w: &mut dyn RenderSink` and returns `RenderResult`; `write_literal(text, w)` unescapes braces into `w.text` calls; `View` and `ListView` implement `Render` instead of `Display` (`ListView::render` calls `w.site(self.head)`, `w.site(self.before)`, `w.text(self.token)`, `w.site(self.after)`, `w.site(self.tail)` where it wrote the strings). Keep the `Display` impls of `View`/`ListView` **deleted** — nothing in core needs them, and Task 2 regenerates the only consumers. `impl<T: Render, const A: bool> Slot for SlotValue<T, A>` renders through `Render`.

`slot.rs`: `impl<T: Render, const ADJACENT: bool> Render for SlotValue<T, ADJACENT>` (`Node(t) => t.render(w)`, `Verbatim(text) => { if ADJACENT { w.adjacent(); } w.text(text) }`); `node_or_write(&self, w: &mut dyn RenderSink) -> Result<Option<&T>, RenderError>`; `write_verbatim` becomes the two-line body above and the `Display` impl is deleted.

`macros.rs`:

```rust
macro_rules! render_with_trivia {
    ($self:expr, $w:expr, $render:expr) => {
        (|| -> $crate::render::RenderResult {
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __leading) = __trivia.leading {
                    for __entry in __leading {
                        $crate::render::Render::render(__entry, $w)?;
                        if !$w.ends_line() {
                            $w.text("\n")?;
                        }
                    }
                }
            }
            $render?;
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __trailing) = __trivia.trailing {
                    if !__trailing.is_empty() {
                        for __entry in __trailing {
                            $w.text("\n")?;
                            $crate::render::Render::render(__entry, $w)?;
                        }
                        if !$w.ends_line() {
                            $w.text("\n")?;
                        }
                    }
                }
            }
            Ok(())
        })()
    };
}
```

The doc comment keeps its one live constraint: the boundary after the last trailing entry must be a line break because a line comment swallows what follows it; an entry whose own text ends the line already satisfies that.

`lib.rs`: `pub mod render;` and `pub use render::{Render, RenderError, RenderResult, RenderSink, WhitespaceTable};`.

- [ ] **Step 7: Run the core tests and the workspace build**

Run: `cd rust && cargo test -p sittir-core && cargo build --workspace`
Expected: sink tests 6/6, view tests green through the sink, existing mark tests unchanged; the generated crates still compile against the mark path (their `Display` impls and `write_fmt` root are untouched until Task 2). If a generated crate fails on a `Display for View` it no longer finds, restore that impl behind `#[cfg(feature = "display-compat")]`? No: give `View` and `ListView` a `Display` impl that renders through a `SpacingWriter` over the formatter with the default table, for this task only, and delete it in Task 2 step 6.

- [ ] **Step 8: Commit**

```bash
git add rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/view.rs rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/macros.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/tests/view.rs
git commit -- rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/view.rs rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/macros.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/tests/view.rs -m "feat(core): a typed render sink; views and the carrier render through it"
```

---

### Task 2: The emitters write sink calls; the marks go

**Files:**
- Modify: `packages/codegen/src/emitters/render-body.ts` (nodes, printer, the mark constants)
- Modify: `packages/codegen/src/emitters/templates.ts` (`emitRule` INDENT/NEWLINE/DEDENT arms ~577–584; `emitSymbol` ~810)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`renderTypedDispatch` ~535, `renderTypedLeafFn` ~708, `renderTypedBranchFn` ~722, `renderTypedBranchFallbackFn` ~648, `leafTextWrite` ~700, `buildSlotWriteCall` ~522, `buildTypedTemplateBody` ~757–908, `armSeamSupport` ~1115, `emitPerSlotChildEnum` ~2110–2140, `emitSupertypeTransportEnum`, `emitSupertypeRenderHelper`, `renderAnyTransportWithNapiFromValue`, `renderTriviaTransportSupport`, every `impl ::std::fmt::Display for` emission, `renderTransportEntry` ~2262)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`spacing_text` plain; `WHITESPACE`)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (delete the mark path), `rust/crates/sittir-core/src/render.rs` (nothing), `rust/crates/sittir-core/src/view.rs` (delete the compat `Display`, if Task 1 added it)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `render-body.test.ts` (or the templates test that asserts on body nodes), `render-options-rs.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: Task 1.
- Produces, in every generated `transport.rs`:
  ```rust
  impl ::sittir_core::render::Render for <Every transport type and enum> { fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult }
  fn render_<kind>(node: &<Kind>Transport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult
  pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, indent: &str) -> Result<String, ::sittir_core::render::RenderError>
  ```
  and in `options.rs`: `pub fn spacing_text(kind: u16) -> &'static str` returning plain text (`"\n"` for the depth arms), and `pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND };`.
  Body IR: `BodyNode` gains `{ kind: 'indent' }`, `{ kind: 'dedent' }`, `{ kind: 'tokenSeam'; text }`; `WhitespaceNode` is gone; the constants `ADJACENT_MARK`, `INDENT_NEWLINE`, `DEDENT_MARK`, `SEAM_MARK`, `TOKEN_SEAM_MARK` and `seamMarked` are gone.

- [ ] **Step 1: Write the failing emitter tests**

In `render-module-emit.test.ts` (rust pipeline describe, `transportRs` string):

```ts
	it('renders through the typed sink and writes no mark character', () => {
		expect(transportRs).not.toContain('impl ::std::fmt::Display for');
		expect(transportRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u);
		expect(transportRs).not.toContain('mark_adjacent');
		expect(transportRs).toContain('impl ::sittir_core::render::Render for FunctionItemTransport {');
		expect(transportRs).toContain('fn render_function_item(node: &FunctionItemTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {');
		expect(transportRs).toContain('pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, indent: &str) -> Result<String, ::sittir_core::render::RenderError> {');
		expect(transportRs).toContain('::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER, &options::WHITESPACE).with_indent(indent)');
	});

	it('binds a list view over site ids and writes a seam site as a call', () => {
		const block = transportRs.slice(transportRs.indexOf('fn render_block('), transportRs.indexOf('fn render_block(') + 2000);
		expect(block).toMatch(/after: node\.statements_separator_space\.unwrap_or\(0\),/);
		expect(block).toMatch(/w\.site\(node\.lbrace_after\.unwrap_or\(0\)\);/);
		expect(block).toContain('w.text("{")?;');
		expect(block).toContain('statements.render(w)?;');
	});
```

In `render-options-rs.test.ts`:

```ts
	it('emits the whitespace table with plain text and the depth ids', () => {
		const source = renderOptionsRs(planRenderOptions(sites, kindEntries, whitespaceText));
		expect(source).toContain('        169 => "\\n",');
		expect(source).not.toContain('\\u{FDD2}');
		expect(source).toContain('pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND };');
	});
```

In the templates/body test that asserts on emitted body nodes (find it with `ls packages/codegen/src/emitters/__tests__ | awk '/body|templates/'`), replace every expectation of `whitespace('\u{FDD0}\n')` with `{ kind: 'indent' }`, of `whitespace('\u{FDD1}')` with `{ kind: 'dedent' }`, and of `whitespace('\u{FDD3}\n')` with `{ kind: 'tokenSeam', text: '\n' }`.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
Expected: the new cases fail on the `Display` spelling and the marks.

- [ ] **Step 3: Typed body nodes and the printer**

`render-body.ts`: delete the five constants and `seamMarked`; delete `WhitespaceNode`; add

```ts
export interface IndentNode { readonly kind: 'indent' }
export interface DedentNode { readonly kind: 'dedent' }
export interface TokenSeamNode { readonly kind: 'tokenSeam'; readonly text: string }
export type BodyNode = TextNode | SlotNode | SpaceNode | AdjacentNode | SeamNode | IfNode | IndentNode | DedentNode | TokenSeamNode;
export const INDENT: Body = [{ kind: 'indent' }];
export const DEDENT: Body = [{ kind: 'dedent' }];
export function tokenSeam(text: string): Body { return [{ kind: 'tokenSeam', text }]; }
```

and delete `whitespace()`. `edgeChar`, `equalNodes`, `weight`, `references`, `isPlainText` and `opensAsTag` each gain the three cases: `indent`/`dedent` have no edge character and weight as their former mark text length did (pin the constants: `indent` and `dedent` weigh 2 and 1, matching the lengths of the strings they replace); `tokenSeam` weighs `text.length + 1`.

`printRustBody` becomes one statement per node, merging runs of `text`/`space` into one `w.text(...)`:

```ts
export function printRustBody(body: Body, printer: RustBodyPrinter): string[] {
	return [...printStatements(body, printer, 1), '    Ok(())'];
}

function printStatements(body: Body, printer: RustBodyPrinter, depth: number): string[] {
	const pad = '    '.repeat(depth);
	const lines: string[] = [];
	let literal = '';
	const flush = (): void => {
		if (literal === '') return;
		lines.push(`${pad}w.text(${rustStringLiteral(literal)})?;`);
		literal = '';
	};
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				literal += node.text;
				break;
			case 'space':
				literal += ' ';
				break;
			case 'adjacent':
				flush();
				lines.push(`${pad}w.adjacent();`);
				break;
			case 'slot':
				flush();
				lines.push(`${pad}${printer.field(node.name)}.render(w)?;`);
				break;
			case 'seam':
				flush();
				lines.push(`${pad}w.site(node.${printer.field(node.field)}.unwrap_or(0));`);
				break;
			case 'indent':
				flush();
				lines.push(`${pad}w.indent();`);
				lines.push(`${pad}w.seam("\\n");`);
				break;
			case 'dedent':
				flush();
				lines.push(`${pad}w.dedent();`);
				break;
			case 'tokenSeam':
				flush();
				lines.push(`${pad}w.token_seam(${rustStringLiteral(node.text)});`);
				break;
			case 'if':
				flush();
				node.arms.forEach((arm, i) => {
					lines.push(`${pad}${i === 0 ? 'if' : '} else if'} ${printer.field(arm.test)}.is_present() {`);
					lines.push(...printStatements(arm.body, printer, depth + 1));
				});
				if (node.fallback !== undefined) {
					lines.push(`${pad}} else {`);
					lines.push(...printStatements(node.fallback, printer, depth + 1));
				}
				lines.push(`${pad}}`);
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`printRustBody: unhandled node ${(_exhaustive as BodyNode).kind}`);
			}
		}
	}
	flush();
	return lines;
}
```

**The payload rule.** Today a depth mark or token-seam mark claims, as its coalescing payload, the whitespace run that follows it *in the same literal*. To stay byte-identical, the printer moves that run out of the following text: before the switch, when a node is `indent`, `dedent` or `tokenSeam` and the next node is `text` beginning with whitespace, split that text at its first non-whitespace character, emit `w.seam(<run>)` right after the depth call (for `tokenSeam`, append the run to the token's text instead), and continue with the remainder. `escapeBraces` is no longer applied to literals: `w.text` takes the string as it is.

`templates.ts`: `case INDENT: return INDENT;` `case NEWLINE: return text('\n');` `case DEDENT: return DEDENT;` and in `emitSymbol`: `return isWhitespaceOnly(fixed) ? tokenSeam(fixed) : text(fixed);`.

- [ ] **Step 4: The render module emits `Render`**

Every emitted `impl ::std::fmt::Display for X { fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result { … } }` becomes `impl ::sittir_core::render::Render for X { fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult { … } }`, with `::std::fmt::Display::fmt(t, f)` → `t.render(w)`, `f.write_str(x)` → `w.text(x)`, `render_with_trivia!(self, f, …)` → `render_with_trivia!(self, w, …)`. Concretely:

- `renderTypedLeafFn`: `fn render_<k>(t: &T, w: &mut dyn RenderSink) -> RenderResult { [w.adjacent();] <body> }` where `leafTextWrite` returns `w.token_seam(&t.text); Ok(())` for a whitespace-only fixed kind and `w.text(&t.text)` otherwise, and an enum leaf renders `t.render(w)`.
- `renderTypedBranchFn` / `renderTypedBranchFallbackFn`: signature `(node: &X, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult`; the fallback's `f.write_str(node.transport_text…)` becomes `w.text(...)`.
- `buildSlotWriteCall`: `if let Some(v) = ${expr}.node_or_write(w)? { render_x(v, w)?; }`.
- `buildTypedTemplateBody`: the empty-slots fast path returns `w.text(text)`; `bind('variant', '""')` and text binds stay (`str: Render`); seam sites are no longer bound as strings — delete the `synthesizedSpacingSites(...).filter(s => s.side === 'seam')` bind loop, since the printer writes `w.site(node.<field>.unwrap_or(0))` directly; `ListView` literals give `before: node.<f>.unwrap_or(0)`, `after`, `head`, `tail` as ids (`0` when the site is absent) via `spacingFieldExprs`; `View::new(...)` is unchanged.
- `renderTypedDispatch`: `AnyTransport: Render` with literal arms `w.token_seam("…")` for whitespace-only literals and `w.text("…")` otherwise; the root `render_transport_dispatch` builds `SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER, &options::WHITESPACE).with_indent(indent)`, calls `transport.render(&mut w)?`, `w.finish()?`.
- `armSeamSupport`: `Seamed<T: Render>: Render` → `w.site(self.seam_before.unwrap_or(0)); self.value.render(w)?; w.site(self.seam_after.unwrap_or(0)); Ok(())`.
- `emitPerSlotChildEnum`, `emitSupertypeTransportEnum`, `emitSupertypeRenderHelper`, `renderTriviaTransportSupport`: the `Render` impl arms; `{ mark_adjacent(f)?; call }` → `{ w.adjacent(); call }`; literal arms as in the dispatch.
- `renderTransportEntry`: `render_transport_dispatch(&transport, &table.indent).map_err(...)` — `render_transport_parts` returns `Result<(TransportSource, String), ::sittir_core::render::RenderError>` and the napi `render` maps that error to a reason string as it maps the `fmt::Error` today.

`render-options-rs.ts`: `spacing_text` emits `rustStringLiteral(isDepthText(w.text) ? '\n' : w.text)`; after it, the `WHITESPACE` const. The `SEAM_MARK` import goes.

- [ ] **Step 5: Delete the mark path in core**

`spacing.rs`: delete `ADJACENT`, `ADJACENT_STR`, `INDENT`, `DEDENT`, `INDENT_NEWLINE`, `DEDENT_NEWLINE`, `SEAM`, `SEAM_STR`, `TOKEN_SEAM`, `TOKEN_SEAM_STR`, `mark_adjacent`, `is_mark`, the `impl fmt::Write for SpacingWriter`, and the mark test module; the module doc describes the sink. `view.rs`: delete the compatibility `Display` if Task 1 added one. `dsl/primitives/spacing.ts` keeps `INDENT_TEXT`/`DEDENT_TEXT` and `isDepthText`: they are the depth arms' stamped identity in the model, not writer marks any more.

- [ ] **Step 6: Glossary**

`docs/glossary/emitters.md`: update `render-body.ts` entries (`printRustBody`, `printStatements` with the payload rule, the new node types, deleted constants), `templates.ts::emitRule` and `emitSymbol`, and every `render-module.ts` function named in this task's file list; `render-options-rs.ts::renderOptionsRs` for `WHITESPACE`.

- [ ] **Step 7: Type-check, unit tests, regenerate, build**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
pnpm exec vitest run packages/codegen/src/emitters/__tests__
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests && cd ..
```

- [ ] **Step 8: Byte-identity gates**

```bash
pnpm run validate:native && pnpm run validate:history
pnpm exec vitest run
bash scripts/comment-slop-check.sh --working
pnpm exec tsx packages/cli/src/cli.ts tool propose-14
```

Expected: `validate:history` identical to the baselines; the parity fixtures green in every crate; vitest green (the examples tests compare the dogfood renders byte for byte). A differing byte points at one body: diff the generated `render_<kind>` before and after for that kind, find which node's payload rule or literal split differs, fix the printer, regenerate. Do not adjust an expectation.

- [ ] **Step 9: Commit**

```bash
git add packages/codegen/src/emitters packages/codegen/src/emitters/__tests__ docs/glossary/emitters.md rust/crates/sittir-core/src packages/rust packages/typescript packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -- packages/codegen/src/emitters docs/glossary/emitters.md rust/crates/sittir-core/src packages/rust packages/typescript packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render -m "refactor(render): bodies write a typed sink; the mark characters and the scanner are gone"
```

---

### Task 3: Options cross as a generated struct

**Files:**
- Modify: `packages/codegen/src/emitters/options.ts` (`AddressLeafEntry.canonical`, `deriveAddressTables`)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`renderOptionsRs(plan, addresses, kindEntries)`; the structs, deserializers, resolver; delete the path table and its helpers and tests)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`planRenderOptionsFor` also derives the address tables; `emitRenderModule` passes them)
- Modify: `rust/crates/sittir-core/src/options.rs` (`reject_unknown_keys`), `rust/crates/sittir-core/src/napi_engine.rs` (`$options:ty`; typed options; no per-call clone), `rust/crates/sittir-{rust,typescript,python}/src/lib.rs` (macro invocation)
- Modify: `packages/common/src/engine.ts` (objects, not JSON)
- Modify: `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`, `packages/typescript/tests/options.test.ts` (unchanged expectations; runs green)
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Produces, in `options.rs`:
  ```rust
  #[derive(Debug, Clone, Default)] pub struct Options { pub indent: Option<String>, pub <root>: Option<<Root>Options>, … }
  #[derive(Debug, Clone, Default)] pub struct <Path>Options { pub <key>: Option<<Path><Key>Options> | Option<u16> | Option<u8>, … }
  impl FromNapiValue for Options and for every <Path>Options   // feature napi-bindings; unknown keys refused
  pub fn resolve(options: &Options, base: &ResolvedOptions) -> Result<ResolvedOptions, String>
  ```
  in core: `pub fn reject_unknown_keys(obj: &::napi::bindgen_prelude::Object, allowed: &[&str], at: &str) -> ::napi::Result<()>`; and the napi engine: `EngineOptions { format: Option<String>, options: Option<$options> }`, `render(transport, tree_id: Option<f64>, options: Option<$options>)`.
  The TypeScript boundary passes the `Options` object itself: `NativeEngineLike.render(node, treeId?, options?: object)`.
  `ResolvedOptions`, `SPACING_SITES`, `DELIMITER_SITES`, `DEPTH_SITES`, the site constants and `defaults()` are unchanged: the prepare walk keeps reading the flat table by constant.

- [ ] **Step 1: Write the failing emitter test**

In `render-options-rs.test.ts` (the fixture `sites` includes `formal_parameters/elements/separator/","/before`, `…/after`, `…/delimiter`, `_statement_block/statements/separator`, `return_statement/terminator/statement_terminator`, `call_expression/lparen/before`):

```ts
	it('emits one struct per address branch, a strict deserializer and a straight-line resolver', () => {
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const addresses = deriveAddressTables(sites, kindEntries, kindIdArmType(kindEntries as never), () => []);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain('pub struct Options {\n    pub indent: Option<String>,\n    pub call_expression: Option<CallExpressionOptions>,\n    pub formal_parameters: Option<FormalParametersOptions>,');
		expect(source).toContain('pub struct FormalParametersElementsSeparatorCommaOptions {\n    pub after: Option<u16>,\n    pub before: Option<u16>,\n}');
		expect(source).toContain('pub struct FormalParametersElementsOptions {\n    pub delimiter: Option<u8>,\n    pub separator: Option<FormalParametersElementsSeparatorOptions>,\n}');
		expect(source).toContain('::sittir_core::options::reject_unknown_keys(&obj, &["after", "before"], "(formal_parameters)/elements:/separator/\\",\\"")?;');
		expect(source).toContain('separator: obj.get("separator")?,');
		expect(source).toContain('comma: obj.get(",")?,');
		expect(source).toContain('if let Some(v) = options.formal_parameters.as_ref().and_then(|o| o.elements.as_ref()).and_then(|o| o.separator.as_ref()).and_then(|o| o.comma.as_ref()).and_then(|o| o.after) {\n        set_spacing(&mut table, SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER, SPACING_SITES[SITE_FORMAL_PARAMETERS_ELEMENTS_SEPARATOR_SPACE_AFTER].4, v, "(formal_parameters)/elements:/separator/\\",\\"/after")?;\n    }');
		expect(source).not.toContain('SITE_PATHS');
		expect(source).not.toContain('serde_json');
	});
```

(`deriveAddressTables` and `kindIdArmType` are imported from `../options.ts`; the fixture's `kindEntries` gain `{ kind: 'comma', member: 'Comma', id: 14, symbolName: ',', anon: true }` so the `","` segment has a kind name to become the field `comma`.)

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
Expected: fails on `renderOptionsRs` arity and the missing structs.

- [ ] **Step 3: One address derivation for both emitters**

`options.ts`: `AddressLeafEntry` gains `readonly canonical: readonly string[]` — the canonical path string (`formatPreferencePath(site.path)`) of every site the leaf sets: one for an ordinary site, every bound site for a declaration reached through bindings. `deriveAddressTables` fills it where it fills `type`. Export `deriveAddressTables`, `kindIdArmType` and `AddressTables` (already exported) for the Rust emitter.

`render-module.ts::planRenderOptionsFor` returns `{ plan, addresses }` where `addresses = deriveAddressTables(sites, kindEntries, kindIdArmType(kindEntries), supertypeMembersByPublicName(nodeMap), declared)` with `declared` read exactly as `emitOptions` reads it (`readOptionsBlock(inputs.options, publicKindNames)` when `inputs.options` is set). `emitRenderModule` passes `addresses` and `kindEntries` to `renderOptionsRs`.

- [ ] **Step 4: The struct emitter**

In `render-options-rs.ts`, `renderOptionsRs(plan: RenderOptionsPlan, addresses: AddressTables, kindEntries: readonly KindEntryLike[])`. Helpers:

```ts
function segmentIdent(key: string, kindEntries: readonly KindEntryLike[]): string {
	if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return rustFieldIdent(key);
	const entry = findEntryForLiteralText(kindEntries, key);
	if (entry === undefined) throw new Error(`options.rs: address segment ${JSON.stringify(key)} has no kind name to become a field`);
	return rustFieldIdent(entry.kind);
}

function structNameOf(path: string, kindEntries: readonly KindEntryLike[]): string {
	return `${path.split('/').map((key) => rustTypeIdent(segmentIdent(key, kindEntries))).join('')}Options`;
}

/// The nested-key path of a canonical site path, so a leaf's `canonical` entries can be matched to `plan.sitePaths`.
function siteRefsOf(leaf: AddressLeafEntry, plan: RenderOptionsPlan): SitePath[] {
	return leaf.canonical.map((path) => {
		const site = plan.sitePaths.find((p) => p.path === path);
		if (site === undefined) throw new Error(`options.rs: address '${leaf.path}' names '${path}', which is no site`);
		return site;
	});
}
```

Emit, for the root and every branch (`addresses.branches`), a struct whose fields are the branch's keys in sorted order: a key that is itself a branch (`${path}/${key}` in `branches`) is `Option<<StructName>>`, a leaf is `Option<u16>` for a spacing site and `Option<u8>` when its `siteRefsOf` entries are all delimiter sites. The root struct is `Options` with `indent: Option<String>` first. Each struct gets `#[derive(Debug, Clone, Default)]` and a feature-gated deserializer:

```rust
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for FormalParametersElementsOptions {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
        ::sittir_core::options::reject_unknown_keys(&obj, &["delimiter", "separator"], "(formal_parameters)/elements:")?;
        Ok(Self { delimiter: obj.get("delimiter")?, separator: obj.get("separator")? })
    }
}
```

The `at` string is the canonical path prefix of the branch (the canonical path of any of its leaves, cut before the branch's last segment); for the root it is `""` and the message form is `options: unknown key {k}`. The resolver:

```rust
/// Resolve an options object over `base`: `indent` and every address that
/// names a site. A value a site does not admit is an error naming the address.
pub fn resolve(options: &Options, base: &ResolvedOptions) -> Result<ResolvedOptions, String> {
    let mut table = base.clone();
    if let Some(indent) = options.indent.as_ref() {
        table.indent = indent.clone();
    }
    // one block per leaf, per site it names:
    if let Some(v) = options.formal_parameters.as_ref().and_then(|o| o.elements.as_ref()).and_then(|o| o.delimiter) {
        set_delimiter(&mut table, DELIM_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER, DELIMITER_SITES[DELIM_…].2, v, "(formal_parameters)/elements:/delimiter")?;
    }
    …
    // the DEPTH_SITES walk, unchanged
    Ok(table)
}
```

`spacing_id`, `set_spacing`, `set_delimiter` take `u16` / `u8` values directly (no `serde_json::Value`); delete `SiteRef`, `SITE_PATHS`, `set_site`, `site_range`, `range_within`, `path_under`, `segment_under`, `collect_nested`, `apply_nested` and the `site_address_tests` module. Replace those tests with one generated `#[cfg(test)] mod resolve_tests` asserting that `resolve(&Options::default(), &defaults())` equals `defaults()`, and that setting the first spacing leaf in the file to its site's default id leaves the table equal to `defaults()` (the emitter knows both).

Core `options.rs`:

```rust
#[cfg(feature = "napi-bindings")]
pub fn reject_unknown_keys(obj: &::napi::bindgen_prelude::Object, allowed: &[&str], at: &str) -> ::napi::Result<()> {
    for key in ::napi::bindgen_prelude::Object::keys(obj)? {
        if !allowed.contains(&key.as_str()) {
            let message = if at.is_empty() { format!("options: unknown key {key}") } else { format!("options: {at}/{key} names no site") };
            return Err(::napi::Error::from_reason(message));
        }
    }
    Ok(())
}
```

- [ ] **Step 5: The engine takes the struct**

`napi_engine.rs`: the macro gains `$options:ty` (after `$render_root`); `EngineOptions.options: Option<$options>`; `new` resolves `$resolve(&opts, &$defaults())`; `render(&self, transport: $render_root, tree_id: Option<f64>, options: Option<$options>)`:

```rust
                let resolved;
                let table = match options {
                    Some(opts) => {
                        resolved = $resolve(&opts, self.engine.options()).map_err(::napi::Error::from_reason)?;
                        &resolved
                    }
                    None => self.engine.options(),
                };
```

`render_to_file` the same. The three crate roots pass `render::options::Options` in the macro invocation. `packages/common/src/engine.ts`: `NativeEngineLike.render(node, treeId?, options?: object)`; `nativeOptions.options = options.options` and `perCall = opts?.options` with no `JSON.stringify`.

- [ ] **Step 6: Type-check, regenerate, build, suites**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-options-rs.test.ts
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests && cd ..
pnpm exec vitest run
pnpm run validate:native && pnpm run validate:history
```

Expected: green; `packages/*/tests/options.test.ts` passes unchanged (the three error messages are reproduced by `reject_unknown_keys` and `set_spacing`); `validate:history` identical.

- [ ] **Step 7: Glossary and commit**

`docs/glossary/emitters.md`: `options.ts::AddressLeafEntry` (`canonical`), `render-options-rs.ts::renderOptionsRs`, `segmentIdent`, `structNameOf`, `siteRefsOf`, `render-module.ts::planRenderOptionsFor`.

```bash
git add packages/codegen/src/emitters docs/glossary/emitters.md rust/crates/sittir-core/src/options.rs rust/crates/sittir-core/src/napi_engine.rs rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs packages/common/src/engine.ts packages/rust packages/typescript packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -- packages/codegen/src/emitters docs/glossary/emitters.md rust/crates packages/common/src/engine.ts packages/rust packages/typescript packages/python -m "feat(options): the options object crosses as a generated struct; the path table is gone"
```

---

### Task 3b: the nested options object spells a literal segment by its token's kind name

**Files:**
- Modify: `packages/codegen/src/emitters/options.ts` (`nestedKey`, `deriveAddressTables`)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`segmentIdent` deleted; `structNameOf`, `fieldsOf`, the resolver chain)
- Modify: `packages/codegen/src/emitters/__tests__/emitter-options.test.ts`
- Modify: `packages/rust/tests/options.test.ts`, `packages/typescript/tests/options.test.ts`, `packages/python/tests/options.test.ts` (`','` → `comma`)
- Modify: `docs/glossary/emitters.md` (`options.ts::nestedKey` entry added or rewritten; `options.ts::deriveAddressTables` entry's "joined with `/`" paragraph; `render-options-rs.ts::segmentIdent` entry deleted)
- Regenerate: `packages/{rust,typescript,python}/src/options.ts`, `rust/crates/sittir-{rust,typescript,python}/src/render/options.rs`

**Interfaces:**
- Consumes: `AddressBranchEntry.segments` / `AddressLeafEntry.segments` (typed `PreferenceSegment[]`), `findEntryForLiteralText(kindEntries, text)` from `compiler/generated-metadata.ts`, `formatPreferencePath` (canonical spelling, literals quoted).
- Produces: `nestedKey(segment: PreferenceSegment, kindEntries: readonly KindEntryLike[]): string` — the ONE derivation of a nested object key, shared by the TS type emitter and the Rust struct emitter.

**The rule.** The nested `Options` object (the TypeScript `AddressedOptions` type, the Rust `FromNapiValue`/`ToNapiValue` property names, and what a caller writes at runtime) spells a literal segment by the anonymous token's kind name: `separator: { comma: { after } }`, not `separator: { ',': { after } }`. Canonical address paths are untouched: the grammar's `options:` block keys, `formatPreferencePath`, the `canonical` strings on leaf entries, and every error message keep their quoted literals (`(array)/elements:/separator/","`-style spellings stay exactly as they are today).

Why: the object is typed and written by hand; a bare punctuation key needs quoting in every language and collides with the path join. The kind name is already what the Rust field is called (`segmentIdent` derives it from the same lookup), so after this task one spelling serves the type, the struct, the field and the object, and `segmentIdent`'s literal fallback has nothing left to do.

- [ ] **Step 1: Write the failing emitter test**

In `packages/codegen/src/emitters/__tests__/emitter-options.test.ts`, the fixture already has `{ kind: 'comma', member: 'Comma', symbolName: ',', anon: true }`. Change every expectation that spells the nested key of the `,` segment as `,` to `comma`: the `AddressedOptions` property `'formal_parameters/elements/separator/comma'`, the Rust `obj.get("comma")`, the Rust allowed-key list `&["comma"]`, and the `at` prefix, which stays `(formal_parameters)/elements:/separator` (unchanged: it is a canonical path). Add one assertion that a literal segment whose text has no kind entry makes `deriveAddressTables` throw `options: literal "<text>" has no kind name` (build a site whose path holds a literal `¤` that the fixture's `kindEntries` do not contain).

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/emitter-options.test.ts`
Expected: FAIL on the `comma` spellings and on the missing-kind throw.

- [ ] **Step 3: One derivation of the key**

In `packages/codegen/src/emitters/options.ts`:

```ts
export function nestedKey(segment: PreferenceSegment, kindEntries: readonly KindEntryLike[]): string {
	switch (segment.kind) {
		case 'literal': {
			const entry = findEntryForLiteralText(kindEntries, segment.text);
			if (entry === undefined) throw new Error(`options: literal ${JSON.stringify(segment.text)} has no kind name`);
			return entry.kind;
		}
		case 'index':
			return String(segment.value);
		case 'wildcard':
			return '_';
		default:
			return segment.name;
	}
}
```

`deriveAddressTables` passes its `kindEntries` at both `site.path.map(...)` and `declaredSegments.map(...)` call sites. Add the collision guard the new spelling makes possible: when a branch path or a leaf path is set a second time from segments whose `formatPreferencePath` differs from the first, throw `options: address '<path>' names two segments` (a literal whose kind name equals a sibling slot name would otherwise merge silently). `AddressBranchEntry.path` / `AddressLeafEntry.path` stay the `/`-joined nested keys (now identifier-only for literals); `canonical` and `segments` are unchanged.

In `packages/codegen/src/emitters/render-options-rs.ts`: delete `segmentIdent` and its `findEntryForLiteralText` import; `fieldsOf` uses `rustFieldIdent(key)`; `structNameOf` and the two resolver-chain sites use `rustFieldIdent(nestedKey(segment, kindEntries))`. The struct names must not move (they were already built from the kind name): the generated `options.rs` diff for each grammar contains only `obj.get`/`obj.set` keys and `reject_unknown_keys` allowed lists. The `at` argument stays `formatPreferencePath(s.segments)`.

- [ ] **Step 4: Emitter test green, then regenerate all three grammars**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/emitter-options.test.ts` → PASS.
Regenerate (each as its own command): `pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src`, same for `typescript`, `python`. Then `git diff --stat -- packages/*/src rust/crates/*/src` must list ONLY `packages/<g>/src/options.ts` and `rust/crates/sittir-<g>/src/render/options.rs` (six files). Inspect each `options.rs` diff: every hunk is a property-key spelling (`","` → `"comma"`, `"|"` → `"pipe"`, …) inside `obj.get`, `obj.set` or an allowed-key array; no struct name, field ident, `at` string or `resolve` line changes. Inspect each `options.ts` diff: only property keys change.

- [ ] **Step 5: Runtime tests spell the new key**

In the three `packages/<g>/tests/options.test.ts`, replace `','` with `comma` in every nested options object (rust: lines 13, 27; typescript: 13, 15, 20, 28, 43, 44, 49, 52; python: 13, 24 — confirm with a read, the numbers are from the current tree). The unknown-key assertion (`options: (array)/elements:/sideways names no site`) and the kind-id rejection assertion are untouched. Rebuild the native addons and run the full suite: `pnpm run validate:native` (builds), then, as its own call, `pnpm exec vitest run`; then regenerate python once more (the python fixture step runs after vitest per the repo rule) and confirm `git status` shows nothing but the six generated files and the tests.

- [ ] **Step 6: Gates**

`pnpm exec tsc --noEmit -p packages/codegen` → 0 errors; same for `packages/common` and `packages/tools`. `rtk cargo build --workspace` green. `pnpm run validate:history` — the recorded numbers are IDENTICAL to the previous run (rust 147/207/134 of 137, ts 143/193/112 of 114, py 126/142/115 of 116); a moved number stops the task for review (never revert).

- [ ] **Step 7: Glossary**

`docs/glossary/emitters.md`: add or rewrite `### \`packages/codegen/src/emitters/options.ts::nestedKey\`` (one derivation of the object key; literal → kind name; the canonical path keeps the quoted literal; a literal with no kind entry is a codegen error); in the `deriveAddressTables` entry replace the paragraph about `token_tree_punctuation//` (that lossy-join argument no longer describes the code: keys are identifiers, the collision guard is what protects distinctness) and describe the two-segments guard; delete the `render-options-rs.ts::segmentIdent` entry. No explanatory comments in `packages/codegen/src`.

- [ ] **Step 8: Commit (pathspec; never stage `packages/types/.vitest-report.json`, `*-roles.scm`, `sittir-role-interfaces-scm-spec.md`, `packages/tools/validation-history.jsonl`)**

```bash
git commit -m "feat(options): nested option keys spell a literal by its token's kind name" -- packages/codegen/src/emitters/options.ts packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/__tests__/emitter-options.test.ts packages/rust/tests/options.test.ts packages/typescript/tests/options.test.ts packages/python/tests/options.test.ts docs/glossary/emitters.md packages/rust/src/options.ts packages/typescript/src/options.ts packages/python/src/options.ts rust/crates/sittir-rust/src/render/options.rs rust/crates/sittir-typescript/src/render/options.rs rust/crates/sittir-python/src/render/options.rs
```

The commit message ends with the attribution lines the dispatch names. Validator records (`validation-report.json`-style files the history run writes) are committed separately as `chore(validator): record validation run (...)` exactly as Task 3 did.

---

### Task 4: Measure, and record the end state

**Files:**
- Modify: `docs/superpowers/specs/2026-07-24-spacing-writer-design.md`
- Create: `docs/superpowers/handoffs/2026-09-11-typed-render-sink-handoff.md`

- [ ] **Step 1: Benchmark before and after**

On the commit before Task 1 (`git stash` is not needed: check out `e807479a0` in a worktree, or read the numbers from the handoff of that session if recorded) and on the Task 3 head, run:

```bash
BENCH_ITERATIONS=200 pnpm exec tsx packages/cli/src/cli.ts tool bench
```

Record both outputs in the handoff as a table per grammar. The expectation is a throughput gain on the render path from removing the per-chunk scan; if the numbers are flat, say so.

- [ ] **Step 2: Spec end state**

In `2026-07-24-spacing-writer-design.md`, rewrite "v1: the writer (jinja-compatible, land now)" and "Wiring" as "The writer": the sink trait and its seven calls, the held seam and its rank, the token seam, depth and the cancel rule, adjacency; delete every mention of marks, `write_fmt`, `Formatter` and jinja; keep "The invariant", "Why render-time, not compile-time", "Validation gate" (updated to the commands above) and "Relationship to other specs".

- [ ] **Step 3: Handoff and commit**

The handoff records: what changed per task, the byte-identity result, the benchmark table, and what is next (the source-coordinates plan, which now lands on this sink: its `NodeCoordinate` needs no attached source and `RenderSink::slice` reads the tree through the context).

```bash
git add docs/superpowers/specs/2026-07-24-spacing-writer-design.md docs/superpowers/handoffs/2026-09-11-typed-render-sink-handoff.md
git commit -- docs/superpowers/specs/2026-07-24-spacing-writer-design.md docs/superpowers/handoffs/2026-09-11-typed-render-sink-handoff.md -m "docs(render): the typed sink is the writer's end state; benchmark recorded"
```

---

## Self-review

**Spec coverage.** The writer's invariant (collision space only across a real seam, adjacency suppressing it, seams coalescing by width and dropping at the edges, the token seam surviving, depth paid on the next text, the cancel rule): Task 1 step 5 reproduces each rule from the existing writer with one method per input, and the sink tests pin each one. The options-design spec's boundary sentence ("takes the options object once at construction and resolves it to one kind id per site there"): Task 3, with the object now typed at the boundary. Byte identity as the only gate: Global Constraints and Task 2 step 8.

**Placeholder scan.** Every code step carries its code; the payload rule in Task 2 step 3 names the exact split. Task 4 step 1 names the command and what to record.

**Type consistency.** `RenderSink::{text, adjacent, site, seam, token_seam, indent, dedent, ends_line}`; `Render::render(&self, w: &mut dyn RenderSink) -> RenderResult`; `RenderError::Fmt`; `WhitespaceTable { text_of, indent, dedent }`; `SpacingWriter::new(inner, word, table)`; `ListView { before, after, head, tail: u16 }`; `options::WHITESPACE`; `resolve(&Options, &ResolvedOptions)`; `reject_unknown_keys(&obj, allowed, at)`; `renderOptionsRs(plan, addresses, kindEntries)`; `AddressLeafEntry.canonical`. Used identically across Tasks 1–4.
