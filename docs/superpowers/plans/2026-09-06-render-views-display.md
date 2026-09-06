# Render Views on `Display` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generated render bodies become one `write!` over views built as locals inside each transport's `Display` impl; the askama-era view/renderable layer in `sittir-core` is replaced by one generic `View` and one `ListView`.

**Architecture:** Three layers, two traits, both from `std::fmt`. (1) A transport implements `Display`; its `fmt` is the trivia wrapper around `render_<kind>(node, f)`, whose body is the kind template as a `write!` literal. (2) A view carries slot-level facts (arity through the slot shape's `Slot` impl, separator and spacing data for lists, and the co-optional template `"->{}"` that `liftGates` produced); it implements `Display` so it can be a `{placeholder}`. (3) Composition is the `write!` itself. There is no render context parameter: options are stamped per node by `FillOptions` before render, and indent, word class and seams live in the writer chain. If a per-render fact ever appears (source text for span copy, a diagnostics sink), the extension is mechanical: `impl Display for XTransport` becomes `impl Render for XTransport { fn render(&self, ctx, f) }` and `View::new` gains a `ctx` argument while keeping `Display` as the bridge.

**Tech Stack:** Rust (`sittir-core`, generated `sittir-{rust,typescript,python}` crates), TypeScript emitters in `packages/codegen/src/emitters/`, vitest, cargo.

**Spec:** this document's Architecture paragraph, plus the discussion recorded in `.infigraph/sessions/session_2026-09-06.md`. The governing invariant is the compiler-refactor invariant: byte-identical renders and identical validator counts are the ONLY gate; internal unit tests are updated, never preserved.

## Global Constraints

- Generated files (`rust/crates/sittir-*/src/render/*`, `packages/*/src/*`, `packages/*/.sittir/*`) are never hand-edited; regenerate.
- Comments do not live in `packages/codegen/src/`; document in `docs/glossary/emitters.md` by qualified name. Rust doc comments state live constraints only.
- No spec/plan/PR/task numbers in code or docs comments.
- Commit by pathspec only (`git commit -- <paths>`); never stage the untracked handoffs, `*-roles.scm`, `sittir-role-interfaces-scm-spec.md`, `packages/types/.vitest-report.json`, `examples/01-construct-nodes.ts`, or the vitest `results.json` files.
- Gate before the commit: six dogfood renders byte-identical to the baseline in `/private/tmp/claude-501/-Users-pmouli-GitHub-nosync-refactory-lang-sittir/5d630a6e-a41d-4bc0-add5-93039435e86e/scratchpad/renders/` (rust 2222/745, ts 473/569, py 196/203); validator counts rust 149/149 207/207 134/137 1517/1517, ts 145/145 193/193 112/114 1202/1202, py 126/126 142/142 115/116 1390/1390; `rtk cargo test --workspace --exclude sittir-parity-tests`; `pnpm run type-check`; `pnpm exec vitest run --root packages/codegen`, `--root packages/tools`, `--root packages/cli`.
- Shell search needs `date +%s > .infigraph/.search-fallback-allowed` in its own Bash call before each `rg`.

---

## File Structure

- Create `rust/crates/sittir-core/src/view.rs` — `Slot` trait, `View`, `ListView`, template split/unescape, `NO_ITEMS`. Replaces `filters.rs` (deleted).
- Modify `rust/crates/sittir-core/src/slot.rs` — `impl Display for SlotValue<T, ADJACENT>` replaces the `RenderableTransport` impl; `node_or_write` keeps its `&mut dyn Write` signature.
- Modify `rust/crates/sittir-core/src/types.rs` — delete `RenderableTransport` and its `Box<T>` blanket.
- Modify `rust/crates/sittir-core/src/macros.rs` — `render_with_trivia!` writes entries with `write!`.
- Modify `rust/crates/sittir-core/src/lib.rs` — module list and re-exports.
- Create `rust/crates/sittir-core/tests/view.rs`; delete `tests/filters.rs` and `tests/renderable.rs`.
- Modify `packages/codegen/src/emitters/render-body.ts` — `printRustBody` prints statements over sink `f`; `templateOf(flanks)` and `escapeBraces` shared with the printer.
- Modify `packages/codegen/src/emitters/render-module.ts` — no Template structs; `render_<kind>(node, f: &mut Formatter)` builds views as locals; every `impl RenderableTransport` becomes `impl ::std::fmt::Display`; `render_transport_dispatch` takes `&dyn Display`.
- Modify tests: `packages/codegen/src/emitters/__tests__/render-body.test.ts`, `render-module-emit.test.ts`, `render-module-unnamed-signals.test.ts`, `render-module-separated-list.test.ts`, `packages/tools/src/__tests__/render-pipeline-optimization.test.ts`.
- Modify `docs/glossary/emitters.md` — entries for the changed/removed functions.
- Regenerate the three grammars.

---

### Task 1: `sittir-core` view module

**Files:**
- Create: `rust/crates/sittir-core/src/view.rs`
- Create: `rust/crates/sittir-core/tests/view.rs`
- Delete: `rust/crates/sittir-core/src/filters.rs`, `rust/crates/sittir-core/tests/filters.rs`, `rust/crates/sittir-core/tests/renderable.rs`
- Modify: `rust/crates/sittir-core/src/slot.rs`, `src/types.rs`, `src/macros.rs`, `src/lib.rs`

**Interfaces:**
- Produces: `sittir_core::view::{Slot, View, ListView, NO_ITEMS}`; `impl<T: Display, const A: bool> Display for SlotValue<T, A>`; `render_with_trivia!($self, $f, $render)` unchanged in shape.
- Template vocabulary: identical to `write!` — `{}` is the slot, `{{` and `}}` are literal braces. A template with no `{}` is written whole when the slot is present (boolean primitives).

- [ ] **Step 1: Write the failing tests** in `rust/crates/sittir-core/tests/view.rs`:

```rust
//! Views: one `View` over any slot shape with the template's literal text
//! around it, one `ListView` over a slice with the separator parts, head and
//! tail spacing, and the list's own template.

use sittir_core::view::{ListView, View, NO_ITEMS};
use sittir_core::SlotValue;
use std::fmt;

struct Word(&'static str);
impl fmt::Display for Word {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.0)
    }
}

fn node(s: &'static str) -> SlotValue<Word> {
    SlotValue::Node(Word(s))
}

#[test]
fn a_present_optional_writes_prefix_value_suffix() {
    let slot = Some(node("T"));
    assert_eq!(View::new(&slot, "->{}").to_string(), "->T");
    assert_eq!(View::new(&slot, "{}").to_string(), "T");
    assert_eq!(View::new(&slot, "<{}>").to_string(), "<T>");
}

#[test]
fn a_missing_optional_writes_nothing_flanks_included() {
    let slot: Option<SlotValue<Word>> = None;
    assert_eq!(View::new(&slot, "->{}").to_string(), "");
}

#[test]
fn a_required_slot_is_display_on_its_own() {
    assert_eq!(node("x").to_string(), "x");
    assert_eq!(SlotValue::<Word>::Verbatim("raw".into()).to_string(), "raw");
}

#[test]
fn an_optional_reference_is_a_slot() {
    let owned = node("v");
    let slot: Option<&SlotValue<Word>> = Some(&owned);
    assert_eq!(View::new(slot, "={}").to_string(), "=v");
    let none: Option<&SlotValue<Word>> = None;
    assert_eq!(View::new(none, "={}").to_string(), "");
}

#[test]
fn a_boolean_writes_its_placeholder_free_template_when_true() {
    assert_eq!(View::new(&Some(true), "[^+*?]+").to_string(), "[^+*?]+");
    assert_eq!(View::new(&Some(false), "[^+*?]+").to_string(), "");
    assert_eq!(View::new(&None::<bool>, "[^+*?]+").to_string(), "");
}

#[test]
fn text_slots_write_their_text_even_when_empty() {
    assert_eq!(View::new(&Some(String::new()), "'{}'").to_string(), "''");
    assert_eq!(View::new(&Some("s".to_string()), "'{}'").to_string(), "'s'");
    assert_eq!(View::new(&None::<String>, "'{}'").to_string(), "");
    assert_eq!(View::new(&"t".to_string(), "{}").to_string(), "t");
}

#[test]
fn braces_are_escaped_as_in_write() {
    let slot = Some(node("b"));
    assert_eq!(View::new(&slot, "{{{}}}").to_string(), "{b}");
    assert_eq!(View::new(&slot, "{{}}{}").to_string(), "{}b");
    assert_eq!(View::new(&Some(true), "{{}}").to_string(), "{}");
}

fn list<'a>(items: &'a [SlotValue<Word>], before: &'a str, token: &'a str, after: &'a str, leading: bool, trailing: bool) -> ListView<'a, SlotValue<Word>> {
    ListView { items, template: "{}", before, token, after, leading, trailing, head: "", tail: "" }
}

#[test]
fn between_items_writes_before_token_after() {
    let items = [node("a"), node("b"), node("c")];
    assert_eq!(list(&items, "", ",", " ", false, false).to_string(), "a, b, c");
    assert_eq!(list(&items, " ", "|", " ", false, false).to_string(), "a | b | c");
    assert_eq!(list(&items, "", "", "\n", false, false).to_string(), "a\nb\nc");
    assert_eq!(list(&items, "", "", "", false, false).to_string(), "abc");
}

#[test]
fn a_leading_flank_writes_token_then_after_only() {
    let items = [node("A"), node("B")];
    assert_eq!(list(&items, " ", "|", " ", true, false).to_string(), "| A | B");
    assert_eq!(list(&items, "", ",", "", true, false).to_string(), ",A,B");
}

#[test]
fn a_trailing_flank_writes_before_then_token_only() {
    let items = [node("a"), node("b")];
    assert_eq!(list(&items, "", ",", " ", false, true).to_string(), "a, b,");
    assert_eq!(list(&items, " ", "|", " ", false, true).to_string(), "a | b |");
}

#[test]
fn both_flanks_are_independent() {
    let items = [node("a")];
    assert_eq!(list(&items, "", ";", "", true, true).to_string(), ";a;");
    assert_eq!(list(&items, "", ",", " ", true, true).to_string(), ", a,");
}

#[test]
fn a_single_item_writes_no_separator() {
    let items = [node("only")];
    assert_eq!(list(&items, "", ",", " ", false, false).to_string(), "only");
}

#[test]
fn an_empty_list_writes_nothing_even_with_flanks_head_tail_and_template() {
    let items: [SlotValue<Word>; 0] = [];
    let view = ListView { items: &items, template: "in{}", before: "", token: ",", after: " ", leading: true, trailing: true, head: "\n", tail: "\n" };
    assert_eq!(view.to_string(), "");
    let none = ListView { items: NO_ITEMS, template: "in{}", before: "", token: ",", after: "", leading: false, trailing: false, head: "", tail: "" };
    assert_eq!(none.to_string(), "");
}

#[test]
fn template_is_outside_head_and_tail() {
    let items = [node("a"), node("b")];
    let view = ListView { items: &items, template: "{{{}}}", before: "", token: ",", after: "", leading: false, trailing: false, head: "\n", tail: "\n" };
    assert_eq!(view.to_string(), "{\na,b\n}");
}

#[test]
fn optional_elements_still_take_separators() {
    let items = [None, None, Some(node("a"))];
    let view = ListView { items: &items, template: "{}", before: "", token: ",", after: "", leading: false, trailing: false, head: "", tail: "" };
    assert_eq!(view.to_string(), ",,a");
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `rtk cargo test -p sittir-core --test view`
Expected: compile error, `sittir_core::view` does not exist.

- [ ] **Step 3: Write `rust/crates/sittir-core/src/view.rs`**

```rust
//! The render-time views. A view is what a `{placeholder}` in a generated
//! kind template names: the slot value with the literal text the render rule
//! puts around it, written only when the slot is present. `View` covers every
//! scalar slot shape; `ListView` covers a repeated slot and owns the separator
//! parts, the head and tail spacing, and the list's own surrounding text.
//!
//! A view template uses the `write!` vocabulary: `{}` is the slot, `{{` and
//! `}}` are literal braces. A template with no `{}` is written whole when the
//! slot is present, which is how a boolean primitive renders its keyword.

use std::fmt::{self, Display, Formatter};

use crate::slot::SlotValue;

/// A slot position as a view sees it: it writes itself between `prefix` and
/// `suffix`, or writes nothing at all when it holds no value.
pub trait Slot {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result;
}

impl<T: Display, const ADJACENT: bool> Slot for SlotValue<T, ADJACENT> {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        write_literal(prefix, f)?;
        Display::fmt(self, f)?;
        write_literal(suffix, f)
    }
}

impl<S: Slot + ?Sized> Slot for &S {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        (**self).write_slot(prefix, suffix, f)
    }
}

impl<S: Slot + ?Sized> Slot for Box<S> {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        (**self).write_slot(prefix, suffix, f)
    }
}

impl<S: Slot> Slot for Option<S> {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Some(slot) => slot.write_slot(prefix, suffix, f),
            None => Ok(()),
        }
    }
}

impl Slot for str {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        write_literal(prefix, f)?;
        f.write_str(self)?;
        write_literal(suffix, f)
    }
}

impl Slot for String {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        self.as_str().write_slot(prefix, suffix, f)
    }
}

impl Slot for bool {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        if !*self {
            return Ok(());
        }
        write_literal(prefix, f)?;
        write_literal(suffix, f)
    }
}

/// The slot's template halves: the text before the first `{}` and the text
/// after it, both still carrying their `{{` / `}}` escapes. A template
/// without `{}` is all prefix.
fn split_template(template: &str) -> (&str, &str) {
    let bytes = template.as_bytes();
    let mut i = 0;
    while i + 1 < bytes.len() {
        match (bytes[i], bytes[i + 1]) {
            (b'{', b'}') => return (&template[..i], &template[i + 2..]),
            (b'{', b'{') | (b'}', b'}') => i += 2,
            _ => i += 1,
        }
    }
    (template, "")
}

/// Writes template text with `{{` and `}}` unescaped. Any other brace is a
/// malformed template, which only the emitter can produce.
fn write_literal(text: &str, f: &mut Formatter<'_>) -> fmt::Result {
    let mut rest = text;
    while let Some(at) = rest.find(['{', '}']) {
        f.write_str(&rest[..at])?;
        let brace = &rest[at..at + 1];
        debug_assert!(rest[at + 1..].starts_with(brace), "unescaped brace in view template {text:?}");
        f.write_str(brace)?;
        rest = &rest[at + 2..];
    }
    f.write_str(rest)
}

/// A scalar slot with its template: `View::new(&node.return_type, "->{}")`.
#[derive(Debug, Clone, Copy)]
pub struct View<'t, S: Slot> {
    slot: S,
    prefix: &'t str,
    suffix: &'t str,
}

impl<'t, S: Slot> View<'t, S> {
    pub fn new(slot: S, template: &'t str) -> Self {
        let (prefix, suffix) = split_template(template);
        Self { slot, prefix, suffix }
    }
}

impl<S: Slot> Display for View<'_, S> {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        self.slot.write_slot(self.prefix, self.suffix, f)
    }
}

/// The items of a list slot named in a template but absent from the transport.
pub const NO_ITEMS: &[&str] = &[];

/// A repeated slot with everything its rendering needs. Between items every
/// separator part is written; a leading flank writes the token and what
/// follows it, a trailing flank what precedes it and the token, so the
/// list's edges never carry whitespace the surrounding template did not ask
/// for. `head` and `tail` (spacing) sit inside the template's text and, like
/// it, are written only when there are items.
#[derive(Debug, Clone, Copy)]
pub struct ListView<'a, E: Slot> {
    pub items: &'a [E],
    /// The list's surrounding text, `{}` standing for the joined items.
    pub template: &'a str,
    /// Whitespace written before the separator token.
    pub before: &'a str,
    /// The separator token itself; empty for an unseparated repeat.
    pub token: &'a str,
    /// Whitespace written after the separator token.
    pub after: &'a str,
    pub leading: bool,
    pub trailing: bool,
    pub head: &'a str,
    pub tail: &'a str,
}

impl<E: Slot> ListView<'_, E> {
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

impl<E: Slot> Display for ListView<'_, E> {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        if self.items.is_empty() {
            return Ok(());
        }
        let (prefix, suffix) = split_template(self.template);
        write_literal(prefix, f)?;
        f.write_str(self.head)?;
        if self.leading {
            f.write_str(self.token)?;
            f.write_str(self.after)?;
        }
        for (i, item) in self.items.iter().enumerate() {
            if i > 0 {
                f.write_str(self.before)?;
                f.write_str(self.token)?;
                f.write_str(self.after)?;
            }
            item.write_slot("", "", f)?;
        }
        if self.trailing {
            f.write_str(self.before)?;
            f.write_str(self.token)?;
        }
        f.write_str(self.tail)?;
        write_literal(suffix, f)
    }
}
```

- [ ] **Step 4: `slot.rs` — `Display` replaces `RenderableTransport`**

Replace the `use crate::types::RenderableTransport;` line and the `impl<T: RenderableTransport, ...> RenderableTransport for SlotValue` block with:

```rust
impl<T: std::fmt::Display, const ADJACENT: bool> std::fmt::Display for SlotValue<T, ADJACENT> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Node(node) => std::fmt::Display::fmt(node, f),
            Self::Verbatim(text) => write_verbatim::<ADJACENT>(text, f),
        }
    }
}
```

Update the doc line on `node_or_write` ("instead of going through `RenderableTransport`") to say "instead of through `Display`". In the `#[cfg(test)]` module at the bottom, replace the `RenderableTransport` impl on `Word` with a `Display` impl and `render_to_string().unwrap()` with `to_string()`.

- [ ] **Step 5: `types.rs`** — delete `pub trait RenderableTransport { … }` and the `impl<T: RenderableTransport + ?Sized> RenderableTransport for Box<T>` block with their doc comments.

- [ ] **Step 6: `macros.rs`** — in `render_with_trivia!` replace both `__entry.render_into($dest)?;` with `write!($dest, "{__entry}")?;`. In the module doc and macro doc, replace mentions of `RenderableTransport::render_into` with `Display`. In the test module, make `MockTrivia` implement `std::fmt::Display` instead of `RenderableTransport` (same body: `f.write_str(&self.text)`); the test bodies already pass a `String` as `$dest`, which `write!` accepts.

- [ ] **Step 7: `lib.rs`** — replace `pub mod filters;` with `pub mod view;`, delete the `pub use types::RenderableTransport;` re-export and its comment, and update the crate doc bullet to: `- [\`view\`] — the render-time views (\`View\`, \`ListView\`) the generated kind templates interpolate.`

- [ ] **Step 8: Delete** `src/filters.rs`, `tests/filters.rs`, `tests/renderable.rs`.

- [ ] **Step 9: Run the core suite**

Run: `rtk cargo test -p sittir-core`
Expected: all green, including `tests/view.rs`. Fix compile fallout in core only (the grammar crates are regenerated in Task 3).

---

### Task 2: Emitter — views as locals, `Display` on transports

**Files:**
- Modify: `packages/codegen/src/emitters/render-body.ts`
- Modify: `packages/codegen/src/emitters/render-module.ts`
- Test: `packages/codegen/src/emitters/__tests__/render-body.test.ts`, `render-module-emit.test.ts`, `render-module-unnamed-signals.test.ts`, `render-module-separated-list.test.ts`, `packages/tools/src/__tests__/render-pipeline-optimization.test.ts`

**Interfaces:**
- Consumes: `sittir_core::view::{View, ListView, NO_ITEMS}`; `SlotValue: Display`.
- Produces (render-body.ts): `escapeBraces(text): string`; `templateOf(flanks: Flanks | undefined): string` (returns `"{}"` when undefined); `printRustBody(body, printer: { field(name): string; indentUnit: string })` returning statement lines over sink `f`, ending with `Ok(())`.
- Produces (generated Rust): `fn render_<kind>(node: &<Kind>Transport, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result`; `impl ::std::fmt::Display for <Kind>Transport`; `pub fn render_transport_dispatch(transport: &dyn ::std::fmt::Display, indent: &str)`.

- [ ] **Step 1: Update `render-body.test.ts`**

Replace the `printRustBody` describe block with expectations over sink `f` and no destructuring:

```ts
describe('printRustBody', () => {
	const printer = { field: (name: string) => (name === 'type' ? 'type_' : name), indentUnit: '  ' };

	it('prints one write! per run of text and slots, and a write_str for a literal-only run', () => {
		expect(printRustBody(concat(text('fn '), slot('name'), text('('), slot('parameters'), text(')')), printer)).toEqual([
			'    write!(f, "fn {name}({parameters})")?;',
			'    Ok(())'
		]);
		expect(printRustBody(text('{}'), printer)).toEqual(['    f.write_str("{}")?;', '    Ok(())']);
	});

	it('escapes braces in literals and maps slot names through the printer', () => {
		expect(printRustBody(concat(text('{'), slot('type'), text('}')), printer)).toEqual([
			'    write!(f, "{{{type_}}}")?;',
			'    Ok(())'
		]);
	});

	it('keeps a residual chain as if / else if / else on is_present', () => {
		const body = branches([{ test: 'a', body: slot('a') }, { test: 'b', body: concat(text('!'), slot('b')) }], text('-'));
		expect(printRustBody(body, printer)).toEqual([
			'    if a.is_present() {',
			'        write!(f, "{a}")?;',
			'    } else if b.is_present() {',
			'        write!(f, "!{b}")?;',
			'    } else {',
			'        f.write_str("-")?;',
			'    }',
			'    Ok(())'
		]);
	});

	it('shadows the sink with an IndentWriter for an indent block', () => {
		expect(printRustBody(concat(whitespace('\n'), indented(slot('block'))), printer)).toEqual([
			'    f.write_str("\\n")?;',
			'    {',
			'        let mut indented = ::sittir_core::spacing::IndentWriter::new(f, "  ");',
			'        let f: &mut dyn ::std::fmt::Write = &mut indented;',
			'        write!(f, "{block}")?;',
			'    }',
			'    Ok(())'
		]);
	});
});

describe('templateOf', () => {
	it('spells flanks in the write! vocabulary with {} for the slot', () => {
		expect(templateOf(undefined)).toBe('{}');
		expect(templateOf({ prefix: '->', suffix: '' })).toBe('->{}');
		expect(templateOf({ prefix: '{', suffix: '}' })).toBe('{{{}}}');
	});
});
```

Add `templateOf` to the import list. Keep the existing `liftGates` tests.

Note on residual chains: the census shows none remain in the three grammars, but the printer must still print them. A residual `if` tests a view, so the view API needs `is_present()`. Add to `view.rs` in Task 1: `impl<S: Slot> View<'_, S> { pub fn is_present(&self) -> bool }` backed by a `Slot::is_present(&self) -> bool` method (`SlotValue` → true, `Option` → `is_some() && inner.is_present()`, `str`/`String` → true, `bool` → `*self`, refs/Box → deref), and `ListView::is_present` → `!items.is_empty()`. Add one test: `assert!(View::new(&Some(node("x")), "{}").is_present()); assert!(!View::new(&None::<bool>, "{}").is_present());`.

- [ ] **Step 2: Run the body tests to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/render-body.test.ts`
Expected: FAIL (printer signature, destructuring line, `templateOf` missing).

- [ ] **Step 3: Rewrite the printer in `render-body.ts`**

Replace from `export interface RustBodyPrinter` through the end of `printStatements` with:

```ts
export interface RustBodyPrinter {
	readonly field: (name: string) => string;
	readonly indentUnit: string;
}

const INDENT_WRITER = '::sittir_core::spacing::IndentWriter';

export function escapeBraces(value: string): string {
	return value.replaceAll('{', '{{').replaceAll('}', '}}');
}

export function templateOf(flanks: Flanks | undefined): string {
	if (flanks === undefined) return '{}';
	return `${escapeBraces(flanks.prefix)}{}${escapeBraces(flanks.suffix)}`;
}

export function printRustBody(body: Body, printer: RustBodyPrinter): string[] {
	return [...printStatements(body, printer, 1), '    Ok(())'];
}

function printStatements(body: Body, printer: RustBodyPrinter, depth: number): string[] {
	const pad = '    '.repeat(depth);
	const lines: string[] = [];
	let format = '';
	let interpolated = false;
	const flush = (): void => {
		if (format === '') return;
		lines.push(interpolated ? `${pad}write!(f, ${rustStringLiteral(format)})?;` : `${pad}f.write_str(${rustStringLiteral(format)})?;`);
		format = '';
		interpolated = false;
	};
	for (const node of body) {
		switch (node.kind) {
			case 'text':
			case 'whitespace':
				format += escapeBraces(node.text);
				break;
			case 'space':
				format += ' ';
				break;
			case 'adjacent':
				format += ADJACENT_MARK;
				break;
			case 'slot':
				format += `{${printer.field(node.name)}}`;
				interpolated = true;
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
			case 'indent':
				flush();
				lines.push(`${pad}{`);
				lines.push(`${pad}    let mut indented = ${INDENT_WRITER}::new(f, ${rustStringLiteral(printer.indentUnit)});`);
				lines.push(`${pad}    let f: &mut dyn ::std::fmt::Write = &mut indented;`);
				lines.push(...printStatements(node.body, printer, depth + 1));
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

Delete `formatLiteral` and `slotNames` (no longer used).

- [ ] **Step 4: Run the body tests**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/render-body.test.ts`
Expected: PASS.

- [ ] **Step 5: `render-module.ts` — delete the Template struct layer**

- Delete `renderStructDefs`, `slotFieldType`, `childrenFieldType`, `structNameFor`, `renderBodyFn`, `emitIterCollectBuffer`, `emitListSlotBuffer`, `RENDERABLE_PREFIX`, `EmittedNonterminalView`'s uses in field types if only used by the deleted functions (keep the `view` field on `EmittedField`, it drives list detection).
- In `EmittedStruct` delete `name`, `bodyFnName`, `hasChildren`, `childrenRequired`, `childrenMultiple`, `hasVariant`, `hasText` if the type-check shows no remaining reader; keep `kind`, `body`, `flanks`, `fields`, `transportHasChildren`.
- In `emitStruct` stop computing `name` and `bodyFnName`.
- In `emitRenderModule` remove `renderStructDefs(structs)` from the `transportRs` assembly.
- In `commonRustUseImports` replace the `filters` import block with `use ::sittir_core::view::{View, ListView, NO_ITEMS};` and drop `RenderableTransport` from the `types` import.

- [ ] **Step 6: `render-module.ts` — `render_<kind>` builds views as locals**

Rewrite `renderTypedBranchFn` so it emits one function and no body fn:

```ts
lines.push(`fn ${fnName}(node: &${structName}, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {`);
lines.push(...buildTypedTemplateBody(struct, nodeSeparator, nodeMap, slotModel, node, kindIdByKind, plan));
lines.push(`}`);
lines.push('');
```

(`fieldKindsByName`/`fieldMixedByName` parameters go away with `classifyField`; delete `buildFieldKindsByName`/`buildFieldMixedByName` if unreferenced.)

Rewrite `buildTypedTemplateBody` after the text fast path (which stays as is, with `dest` renamed `f`):

```ts
const bound = new Set<string>();
const bind = (name: string, expr: string): void => {
	if (bound.has(name)) return;
	bound.add(name);
	lines.push(`    let ${name} = ${expr};`);
};
const plain: string[] = [];
for (const f of struct.fields) {
	const rIdent = rustFieldIdent(f.storageName);
	const ident = rustFieldIdent(f.name);
	const template = rustStringLiteral(templateOf(struct.flanks.get(f.name)));
	const primitive = primitiveByName.get(f.name);
	if (primitive?.kind === 'boolean') {
		bind(ident, `View::new(&node.${rIdent}, ${rustStringLiteral(escapeBraces(primitive.text))})`);
		continue;
	}
	if (primitive?.kind === 'verbatim') {
		if (f.required) plain.push(ident);
		else bind(ident, `View::new(&node.${rIdent}, ${template})`);
		continue;
	}
	if (f.view === 'list' || f.multiple) {
		const items = !f.hasTransportField ? 'NO_ITEMS' : f.required ? `&node.${rIdent}` : `node.${rIdent}.as_deref().unwrap_or(&[])`;
		… (separator, before/after, leading/trailing, head/tail exactly as today) …
		lines.push(`    let ${ident} = ListView {`);
		lines.push(`        items: ${items},`);
		lines.push(`        template: ${template},`);
		// token / before / after / leading / trailing / head / tail lines, indented 8
		lines.push(`    };`);
		continue;
	}
	if (f.required) {
		if (f.hasTransportField) plain.push(ident);
		else bind(ident, '""');
		continue;
	}
	if (f.backingTransportField) {
		const backing = `node.${rustFieldIdent(f.backingTransportField)}.as_ref().and_then(|h| h.node())`;
		const inner = f.backingInnerRequired ? `.map(|h| &h.${ident})` : `.and_then(|h| h.${ident}.as_ref())`;
		const expr = f.backingDirectField ? `node.${rustFieldIdent(f.backingDirectField)}.as_ref().or_else(|| ${backing}${inner})` : `${backing}${inner}`;
		bind(ident, `View::new(${expr}, ${template})`);
		continue;
	}
	if (!f.hasTransportField) {
		bind(ident, `View::new(None::<&::sittir_core::SlotValue<AnyTransport>>, ${template})`);
		continue;
	}
	bind(ident, `View::new(&node.${rIdent}, ${template})`);
}
if (plain.length > 0) lines.unshift(`    let ${structName} { ${plain.join(', ')}, .. } = node;`);
```

Insert the destructuring line after the text fast path rather than at index 0: keep an index of where the fast-path block ended and splice there. Required plain slots whose template ident differs from the storage ident (`f.name !== f.storageName`) must be bound as `let ${ident} = &node.${rIdent};` instead of destructured.

Then: `lines.push(...printRustBody(struct.body, { field: rustFieldIdent, indentUnit: '  ' }));`.

The `struct.hasVariant` / `struct.hasText` branches become `bind('variant', '""')` and `bind('text', 'node.transport_text.as_deref().unwrap_or("")')` when the body references them (census: neither occurs in the three grammars; keep them because the body IR still admits the names).

- [ ] **Step 7: `render-module.ts` — every `impl RenderableTransport` becomes `impl Display`**

Apply the same replacement at each of these emit sites: `renderTransportDataStruct` (struct impl), `emitSupertypeTransportEnum` (enum impl), `emitPerSlotChildEnum` (enum impl), `renderTriviaTransportSupport` (`TriviaTransport`), `renderTypedDispatch` (`AnyTransport`), and the impl at the file's tail (`3601`):

```ts
lines.push(`impl ::std::fmt::Display for ${name} {`);
lines.push(`    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {`);
…
lines.push(`    }`);
lines.push(`}`);
```

Arm bodies: `t.render_into(dest)` → `::std::fmt::Display::fmt(t, f)`; `inner.as_ref().render_into(dest)` → `::std::fmt::Display::fmt(inner.as_ref(), f)`; `dest.write_str(…)` → `f.write_str(…)`; `mark_adjacent(dest)` → `mark_adjacent(f)`. The struct impl body: `render_with_trivia!(self, f, render_x(self, f))` and, for leaves, `render_with_trivia!(self, f, f.write_str(&self.text))`.

`render_transport_dispatch`: signature `(transport: &dyn ::std::fmt::Display, indent: &str)`, body `write!(w, "{transport}")?;` in place of `transport.render_into(&mut w)?;`.

`emitSupertypeRenderHelper`, `renderTypedLeafFn`, `renderTypedBranchFallbackFn`: parameter `f: &mut ::std::fmt::Formatter<'_>`; `.render_into(dest)` → `::std::fmt::Display::fmt(x, f)`; `buildSlotWriteCall` heterogeneous case → `write!(f, "{}", ${expr})?;`, concrete/supertype cases keep `node_or_write(f)?` (a `&mut Formatter` coerces to `&mut dyn Write`) and call `render_<kind>(v, f)?`.

- [ ] **Step 8: Update the emitter tests**

- `render-module-emit.test.ts`: the two "uses Renderable::Transport" tests become "interpolates the slot directly": expect `fnBody` to contain `{name}` inside a `write!(f, ` line and not to contain `View::new(&node.name`; the dispatch-arm test expects `ArrayExpressionContentTransportSlot::ArrayExpressionList(inner) => ::std::fmt::Display::fmt(inner, f),`; the separator regex becomes `/ListView \{[^}]*\bseparator: /`.
- `render-module-unnamed-signals.test.ts`: expect `let identifier = ListView {` and `items: node.content.as_deref().unwrap_or(&[]),` (or `&node.content` if that slot is required in the fixture; read the fixture).
- `render-module-separated-list.test.ts`: rename the describe to `ListView wiring`; expectations on `token:`/`leading:`/`trailing:` lines are unchanged in text.
- `packages/tools/src/__tests__/render-pipeline-optimization.test.ts`: delete the `Template<'a>` struct expectations; replace the `SingleNonterminalView(...Transport(&node.kw_j))` expectation with `let FunctionItemTransport { kw_j, .. } = node;` (check the generated ident), the `content: SingleNonterminalView` expectation with the same destructuring form, the `identifier_buf` expectation with `items: node.identifier.as_deref().unwrap_or(&[]),`, and the `not.toContain('let kw_j_buf …')` lines with `not.toContain('View::new(&node.kw_j')`.

- [ ] **Step 9: Run the codegen and tools suites and the type check**

Run: `pnpm exec vitest run --root packages/codegen`; `pnpm exec vitest run --root packages/tools`; `pnpm run type-check`
Expected: all green.

- [ ] **Step 10: Glossary**

In `docs/glossary/emitters.md`: delete the sections for `renderBodyFn`, `emitIterCollectBuffer`, `emitListSlotBuffer`, `slotFieldType`, `structNameFor`; rewrite `buildTypedTemplateBody` (views as locals, required slots destructured, the `View::new(slot, template)` shapes per field class), `renderTypedBranchFn` (one function), `renderTypedDispatch` (`Display`, `write!` at the root), `printRustBody` (sink `f`, `is_present` chains, indent shadowing), `commonRustUseImports`; add `escapeBraces` and `templateOf`. Add a short section under `render-body.ts` stating the template vocabulary is shared between kind templates and view templates.

---

### Task 3: Regenerate, gate, commit

- [ ] **Step 1: Regenerate all three grammars with the native build**

Run, one per grammar: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src --skip-ts-chain` (then typescript, python). A grammar's napi build compiles the whole workspace, so regenerate all three before trusting any binary.
Expected: each build green. If `transport.rs` fails to compile, fix the emitter (never the generated file) and regenerate.

- [ ] **Step 2: Dogfood renders byte-identical**

```bash
S=/private/tmp/claude-501/-Users-pmouli-GitHub-nosync-refactory-lang-sittir/5d630a6e-a41d-4bc0-add5-93039435e86e/scratchpad
OUT=/private/tmp/claude-501/-Users-pmouli-GitHub-nosync-refactory-lang-sittir/403736e3-3058-42e3-8936-0cefde9512fb/scratchpad/renders
pnpm exec tsx $S/dogfood.ts $OUT && for n in rust rust-strict ts ts-strict py py-strict; do cmp $S/renders/$n.txt $OUT/$n.txt && echo "$n identical"; done
```
Expected: six "identical" lines. Any difference stops the work for review (never revert).

- [ ] **Step 3: Validator counts**

Run: `pnpm exec tsx packages/cli/src/cli.ts validate counts`
Expected: rust 149/149 207/207 134/137 1517/1517; ts 145/145 193/193 112/114 1202/1202; py 126/126 142/142 115/116 1390/1390.

- [ ] **Step 4: Workspace and package suites**

Run: `rtk cargo test --workspace --exclude sittir-parity-tests`; `pnpm exec vitest run --root packages/cli`; `bash scripts/assert-scope-boundaries.sh`
Expected: green.

- [ ] **Step 5: Commit by pathspec and push**

```bash
git add rust/crates/sittir-core/src/view.rs rust/crates/sittir-core/tests/view.rs
git rm -q rust/crates/sittir-core/src/filters.rs rust/crates/sittir-core/tests/filters.rs rust/crates/sittir-core/tests/renderable.rs
git commit -m "feat(render): views on Display; kind bodies are one write! over views built as locals" -- rust/crates/sittir-core packages/codegen/src/emitters packages/tools/src/__tests__/render-pipeline-optimization.test.ts docs/glossary/emitters.md docs/superpowers/plans/2026-09-06-render-views-display.md rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git push
```

Then comment on PR #270 with the gate results.
