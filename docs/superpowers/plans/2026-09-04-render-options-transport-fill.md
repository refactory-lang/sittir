# Render Options — Transport Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendering takes the engine's options: every list slot's separator spacing and optional flank come from fields on the slot's transport, filled natively from the resolved options, and templates stop naming separators.

**Architecture:** Plan 3 of the render-options series. The site-preference list already in the model (`compiler/model/site-preferences.ts`) drives three generated artifacts in each render crate: spacing fields on every transport struct that owns a list slot (one per site, the injected choices as struct members), a `FillOptions` walk that writes the resolved option into every unset field after the transport is deserialized, and an `options.rs` with the site table and the resolver from the JSON options object. The emitted render function then builds its `ListNonterminalView` from the transport's fields alone, and `Joined` in `sittir-core` composes the three parts (before, token, after) per position. The template emitter writes `{{ slot }}` with no filter, so the view is the only carrier of the separator. Askama's role is unchanged: it decides where a slot renders; `Joined` decides how.

**Tech Stack:** Rust (`sittir-core`, the three napi grammar crates, askama), TypeScript codegen (`packages/codegen/src/emitters/{render-module,templates,options}.ts`), `@sittir/common` engine boundary, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md` — sections "Render side", "Precedence", "Engine and boundary API", "What is emitted".

## Global Constraints

- Generated outputs are never hand-edited: `packages/{rust,typescript,python}/src/*`, `.sittir/*`, `rust/crates/sittir-*/src/render/*`, `rust/crates/sittir-*/templates/*`, `rust/crates/sittir-*/test-fixtures.json` come from `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`. `rust/crates/sittir-<g>/src/lib.rs` is hand-written.
- `packages/codegen/src` carries no explanatory comments; each new declaration gets a `###` entry in `docs/glossary/emitters.md`. Rust crates and `packages/common` keep doc comments that state live constraints, never provenance or plan/spec/task numbers.
- Every option value is a kind id; the list flank is the `Delimiter` bitflag. No strings name a whitespace class anywhere in this plan.
- One spelling of a separator: after this plan no generated template contains `join(`; the view is the only carrier.
- The native binary must be rebuilt after any change under `rust/`: `(cd rust/crates/sittir-<g> && pnpm run build)` per grammar (release).
- Gates after every native rebuild, numbers compared not eyeballed: `cd rust && cargo build --workspace` (0 errors) and `cargo test --workspace --exclude sittir-parity-tests`; `pnpm run type-check` and `pnpm run type-check:examples` (0 errors); `cd packages/codegen && pnpm exec vitest run` at its baseline (14 failed in `baseline-diff`, `strict-terminal`, `render-module-emit`, `roundtrip`; a new failure in `render-module-emit` is investigated, not accepted); `cd packages/<g> && pnpm exec vitest run` green; `validate counts` then `validate history`.
- **This plan changes rendered bytes by design**: the declared defaults take effect for every node rendered through a template. The examples gate becomes "renders the declared defaults": Task 7 inspects and re-pins the six dogfood outputs. Validator pass counts may stay or rise; any drop is a defect to investigate before the commit.
- Regenerate all three grammars after any vitest run and before validating; regenerate once more after `git add` of a new output file.
- Commit with explicit pathspecs; never stage `**/node_modules/**`, `examples/01-construct-nodes.ts`, `docs/superpowers/handoffs/*`, `packages/types/.vitest-report.json`, or the untracked `*-roles.scm` / `sittir-role-interfaces-scm-spec.md`.
- Branch: `spec/render-options` (stacked on `fix/field-wrap-arm-scope`, PR #269). Each task is one commit.

---

## Design decisions this plan fixes

**Fields, not parameters.** The separator's spacing and the flank are values
of the slot, so they live on the slot's transport as `Option<u16>` fields
named after the site (`elements_comma_separator_space_before`, wire key
`_elements_comma_separator_space_before`) and `Option<u8>` `_delimiter` as
today. A value the wire already carries wins; an unset field is filled from
the resolved options in one walk over the transport tree before rendering.
The render functions, `Renderable`, `Joined` and the templates never see an
options object. When stamps arrive as wire values later, this step is
unchanged.

**Three parts, one writer.** `ListNonterminalView` and `Joined` carry
`before`, `token`, `after`. `Joined` writes `before + token + after`
between items, `token + after` for a leading flank, `before + token` for a
trailing flank. The empty separator is the same table with an empty
`token`. The `join*` filters, whose only purpose was letting a template
override the view's separator with a literal, are deleted.

**Resolution is native and generated.** `options.rs` in each render crate
carries the site table (visible kind name, slot, label, default kind id,
allowed kind ids, and for flank sites the allowed `Delimiter` members), the
supertype membership, and `resolve(json) -> Result<ResolvedOptions, String>`
applying the spec's precedence: kind × slot, then supertype × slot, then the
label's top-level value, then the default. Unknown keys and disallowed
values are errors naming the key.

**Whitespace kind to text.** `spacing_text(kind_id)` is generated from the
grammar's `visibleExternals` bodies, the same source the templates of those
kinds render from, so `_tight`, `_space`, `_newline` have one spelling.

**`SlotValue` is orthogonal.** The `$text` provenance design
(`docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md`)
reshapes the carrier to `Coord | Transport(T)`. The fill walk's blanket impl
for `SlotValue` follows the transport arm whatever it is called and does
nothing for a coordinate, whose content is sliced from the tree and takes no
options. Either design can land first; the other updates one impl and one
test constructor.

**Boundary.** `EngineOptions` gains `options: Option<String>` (a JSON
string, like `format`) resolved once at construction; `render` gains
`options: Option<String>` resolved per call over the engine's table. Per
node, only ids cross napi.

---

## File structure

| File | Responsibility |
| --- | --- |
| `rust/crates/sittir-core/src/filters.rs` | three-part `ListNonterminalView` / `Joined`; `join*` filters removed |
| `rust/crates/sittir-core/src/options.rs` (new) | `ResolvedOptions`, `FillOptions` trait with blanket impls |
| `rust/crates/sittir-core/src/engine.rs`, `napi_engine.rs` | engine holds its table; `render` takes per-call options |
| `rust/crates/sittir-core/tests/filters.rs`, `tests/options.rs` (new) | flank table; fill semantics |
| `packages/codegen/src/emitters/render-options-rs.ts` (new) | emits `options.rs`: site table, supertype members, `spacing_text`, `resolve` |
| `packages/codegen/src/emitters/render-module.ts` | spacing fields on transports; `FillOptions` impls; views from fields; entry takes the table; filters module loses `join*` |
| `packages/codegen/src/emitters/templates.ts` | `{{ slot }}` instead of `{{ slot \| join(...) }}` |
| `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts` (new), `render-module-emit.test.ts`, `templates*.test.ts` | emitter unit tests |
| `rust/crates/sittir-{rust,typescript,python}/src/render/options.rs` | generated |
| `packages/common/src/engine.ts`, `engine-boundary.ts` | `EngineOptions.options`; `render(node, { options })` |
| `packages/{rust,typescript,python}/src/index.ts` (generated) | `createEngine` typed with the package `Options` |
| `examples/17-…`, `18-…`, `19-…` expectations; `docs/superpowers/specs/2026-09-04-render-options-design.md`; `docs/glossary/emitters.md` | re-pinned sizes; spec wording; glossary |

---

### Task 1: `Joined` composes the separator from three parts

**Files:**
- Modify: `rust/crates/sittir-core/src/filters.rs` (`ListNonterminalView`, `Joined`, `JoinSource`, `joinby`, `joinWithTrailing`, `joinWithLeading`, `joinWithFlanks`)
- Modify: `rust/crates/sittir-core/tests/filters.rs`
- Modify: `packages/codegen/src/emitters/render-module.ts:1455-1522` (`filtersModule`: the `joinWithTrailing` / `joinWithLeading` / `joinWithFlanks` wrappers)

**Interfaces:**
- Produces:
  ```rust
  pub struct ListNonterminalView<'a> {
      pub items: &'a [Renderable<'a>],
      pub before: &'a str,
      pub token: &'a str,
      pub after: &'a str,
      pub leading: bool,
      pub trailing: bool,
  }
  pub struct Joined<'a> { /* same six fields */ }
  pub trait JoinSource<'a> {
      fn renderables(&self) -> &'a [Renderable<'a>];
      fn before(&self) -> &'a str;
      fn token(&self) -> &'a str;
      fn after(&self) -> &'a str;
      fn leading(&self) -> bool;
      fn trailing(&self) -> bool;
  }
  ```
  `joinby`, `joinWithTrailing`, `joinWithLeading`, `joinWithFlanks` no longer exist. Task 5 stops emitting them into templates; until then the generated crates fail to compile, which is expected between Tasks 1 and 5 — run only `cargo test -p sittir-core` in this task.

- [ ] **Step 1: Write the failing flank-table test**

Append to `rust/crates/sittir-core/tests/filters.rs`:

```rust
use sittir_core::filters::{Joined, Renderable};

fn joined<'a>(items: &'a [Renderable<'a>], before: &'a str, token: &'a str, after: &'a str, leading: bool, trailing: bool) -> String {
    Joined { items, before, token, after, leading, trailing }.to_string()
}

#[test]
fn between_items_writes_before_token_after() {
    let items = [Renderable::Text("a"), Renderable::Text("b"), Renderable::Text("c")];
    assert_eq!(joined(&items, "", ",", " ", false, false), "a, b, c");
    assert_eq!(joined(&items, " ", "|", " ", false, false), "a | b | c");
    assert_eq!(joined(&items, "", "", "\n", false, false), "a\nb\nc");
}

#[test]
fn a_leading_flank_writes_token_then_after_only() {
    let items = [Renderable::Text("A"), Renderable::Text("B")];
    assert_eq!(joined(&items, " ", "|", " ", true, false), "| A | B");
}

#[test]
fn a_trailing_flank_writes_before_then_token_only() {
    let items = [Renderable::Text("a"), Renderable::Text("b")];
    assert_eq!(joined(&items, "", ",", " ", false, true), "a, b,");
    assert_eq!(joined(&items, " ", "|", " ", false, true), "a | b |");
}

#[test]
fn an_empty_list_writes_nothing_even_with_flanks() {
    let items: [Renderable<'_>; 0] = [];
    assert_eq!(joined(&items, "", ",", " ", true, true), "");
}
```

If `Renderable::Text` is not the constructor for a plain string item in this file's existing tests, use whatever they use.

- [ ] **Step 2: Run to see it fail**

Run: `cd rust && cargo test -p sittir-core --test filters 2>&1 | tail -8`
Expected: compile error, no field `before` on `Joined`.

- [ ] **Step 3: Implement the three-part writer**

In `rust/crates/sittir-core/src/filters.rs`:

- Replace `pub separator: &'a str,` in `ListNonterminalView` and `Joined` with `pub before: &'a str, pub token: &'a str, pub after: &'a str,`.
- `as_joined()` copies the three fields.
- Replace `fn separator(&self) -> &'a str;` in `JoinSource` with `fn before`, `fn token`, `fn after`, and update the `impl JoinSource for ListNonterminalView`.
- Replace both writer bodies (`Display::fmt` and `FastWritable::write_into`) with the table. Written once as a helper over a closure so the two impls cannot drift:

```rust
impl Joined<'_> {
    fn write_parts<E>(&self, mut write: impl FnMut(&str) -> Result<(), E>, mut item: impl FnMut(usize) -> Result<(), E>) -> Result<(), E> {
        if self.items.is_empty() {
            return Ok(());
        }
        if self.leading {
            write(self.token)?;
            write(self.after)?;
        }
        for (i, _) in self.items.iter().enumerate() {
            if i > 0 {
                write(self.before)?;
                write(self.token)?;
                write(self.after)?;
            }
            item(i)?;
        }
        if self.trailing {
            write(self.before)?;
            write(self.token)?;
        }
        Ok(())
    }
}

impl std::fmt::Display for Joined<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.write_parts(|s| f.write_str(s), |i| std::fmt::Display::fmt(&self.items[i], f))
    }
}

impl ::askama::FastWritable for Joined<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(&self, dest: &mut W, values: &dyn ::askama::Values) -> Result<(), ::askama::Error> {
        self.write_parts(
            |s| dest.write_str(s).map_err(::askama::Error::from),
            |i| self.items[i].write_into(dest, values),
        )
    }
}
```

- Delete `joinby`, `joinWithTrailing`, `joinWithLeading`, `joinWithFlanks`.

In `packages/codegen/src/emitters/render-module.ts` `filtersModule()` (lines 1455–1522), delete the three `pub fn joinWith…` wrapper emissions and any `use` they needed. Leave the other filters.

- [ ] **Step 4: Run the core tests**

Run: `cd rust && cargo test -p sittir-core 2>&1 | tail -6`
Expected: all pass including the four new tests. (The grammar crates do not compile until Task 5; do not run the workspace build here.)

- [ ] **Step 5: Commit**

```bash
git add -- rust/crates/sittir-core/src/filters.rs rust/crates/sittir-core/tests/filters.rs packages/codegen/src/emitters/render-module.ts
git commit -m "feat(native): Joined composes a separator from before, token and after

Between items it writes all three; a leading flank writes token and after,
a trailing flank before and token. The join filters that let a template
override the view's separator with a literal are removed."
```

---

### Task 2: `ResolvedOptions` and the `FillOptions` walk in core

**Files:**
- Create: `rust/crates/sittir-core/src/options.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs` (`pub mod options;`)
- Create: `rust/crates/sittir-core/tests/options.rs`

**Interfaces:**
- Produces:
  ```rust
  /// One kind id per spacing site and one bitflag per flank site, indexed by the generated site constants.
  #[derive(Debug, Clone, PartialEq, Eq)]
  pub struct ResolvedOptions { pub spacing: Vec<u16>, pub delimiter: Vec<u8> }
  pub trait FillOptions { fn fill_options(&mut self, table: &ResolvedOptions); }
  // blanket impls: SlotValue<T: FillOptions, const A: bool>, Vec<T>, Option<T>, Box<T>, String (no-op)
  ```
  Task 4 emits a `FillOptions` impl for every generated transport struct and enum; Task 3 emits the site constants and `resolve`.

- [ ] **Step 1: Write the failing test**

`rust/crates/sittir-core/tests/options.rs`:

```rust
use sittir_core::options::{FillOptions, ResolvedOptions};
use sittir_core::SlotValue;

struct Leaf;
impl FillOptions for Leaf {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}

struct List {
    space_after: Option<u16>,
    delimiter: Option<u8>,
    items: Vec<SlotValue<Leaf>>,
}
impl FillOptions for List {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        self.space_after.get_or_insert(table.spacing[0]);
        if self.delimiter.is_none() && table.delimiter[0] != 0 {
            self.delimiter = Some(table.delimiter[0]);
        }
        self.items.fill_options(table);
    }
}

#[test]
fn an_unset_field_takes_the_table_value_and_a_set_field_keeps_its_own() {
    let table = ResolvedOptions { spacing: vec![168], delimiter: vec![2] };
    let mut unset = List { space_after: None, delimiter: None, items: vec![SlotValue::Node(Leaf), SlotValue::Verbatim("x".into())] };
    unset.fill_options(&table);
    assert_eq!(unset.space_after, Some(168));
    assert_eq!(unset.delimiter, Some(2));
    let mut set = List { space_after: Some(167), delimiter: Some(0), items: vec![] };
    set.fill_options(&table);
    assert_eq!(set.space_after, Some(167));
    assert_eq!(set.delimiter, Some(0));
}

#[test]
fn a_zero_delimiter_default_leaves_the_field_unset() {
    let table = ResolvedOptions { spacing: vec![168], delimiter: vec![0] };
    let mut list = List { space_after: None, delimiter: None, items: vec![] };
    list.fill_options(&table);
    assert_eq!(list.delimiter, None);
}
```

- [ ] **Step 2: Run to see it fail**

Run: `cd rust && cargo test -p sittir-core --test options 2>&1 | tail -6`
Expected: unresolved import `sittir_core::options`.

- [ ] **Step 3: Implement**

`rust/crates/sittir-core/src/options.rs`:

```rust
//! Resolved render options and the fill walk that applies them.
//!
//! A transport arrives from JavaScript with its spacing and flank fields
//! unset unless the wire carried a value. `FillOptions` walks the tree
//! once before rendering and writes the resolved option into every unset
//! field, so a wire value always wins and the render functions read
//! fields only. The site indices are generated per grammar.

use crate::SlotValue;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ResolvedOptions {
    /// Whitespace kind id per spacing site, in generated site order.
    pub spacing: Vec<u16>,
    /// `Delimiter` bitflag per flank site, in generated site order; 0 leaves the field unset.
    pub delimiter: Vec<u8>,
}

pub trait FillOptions {
    fn fill_options(&mut self, table: &ResolvedOptions);
}

impl<T: FillOptions, const ADJACENT: bool> FillOptions for SlotValue<T, ADJACENT> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        if let SlotValue::Node(node) = self {
            node.fill_options(table);
        }
    }
}

impl<T: FillOptions> FillOptions for Vec<T> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        for item in self {
            item.fill_options(table);
        }
    }
}

impl<T: FillOptions> FillOptions for Option<T> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        if let Some(item) = self {
            item.fill_options(table);
        }
    }
}

impl<T: FillOptions + ?Sized> FillOptions for Box<T> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        (**self).fill_options(table);
    }
}

impl FillOptions for String {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}
```

Add `pub mod options;` to `rust/crates/sittir-core/src/lib.rs` beside the other modules. If `SlotValue` lives at `crate::types::SlotValue` rather than the crate root, import it from there.

- [ ] **Step 4: Run the core tests**

Run: `cd rust && cargo test -p sittir-core --test options 2>&1 | tail -4`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -- rust/crates/sittir-core/src/options.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/tests/options.rs
git commit -m "feat(native): ResolvedOptions and the FillOptions walk

One kind id per spacing site and one bitflag per flank site; a walk over
the transport tree writes them into every unset field before rendering, so
a value the wire carried always wins."
```

---

### Task 3: Emit `options.rs` per render crate

**Files:**
- Create: `packages/codegen/src/emitters/render-options-rs.ts`
- Create: `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
- Modify: `packages/codegen/src/emitters/render-module.ts` (`RenderModuleBundle` gains `optionsRs`; `emitRenderModule` calls the new emitter; `libRsContents` / `mod.rs` emission declares `pub mod options;`)
- Modify: `packages/codegen/src/run-codegen.ts` (write `src/render/options.rs` beside `transport.rs`)
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `collectSitePreferences({ nodeMap, kindEntries, spacingPreferences })` and `SitePreference` from `compiler/model/site-preferences.ts`; `buildSupertypeMembersMap`; `findEntryForKindName`; `publicKindName`; the node map's `visibleExternals` bodies (`nodeMap.visibleExternals` or the raw grammar's, whichever `emitRenderModule` can reach — thread `raw.visibleExternals` into `RenderModuleEmitter`'s config the way `spacingPreferences` reached `emitOptions`).
- Produces, in the generated `options.rs`:
  ```rust
  pub const SPACING_SITE_COUNT: usize;   pub const DELIMITER_SITE_COUNT: usize;
  pub const SITE_<KIND>_<SLOT>_<LABEL>: usize;   // one per spacing site, dense
  pub const DELIM_<KIND>_<SLOT>: usize;          // one per flank site, dense
  pub fn defaults() -> ResolvedOptions;
  pub fn resolve(json: &str, base: &ResolvedOptions) -> Result<ResolvedOptions, String>;
  pub fn spacing_text(kind: u16) -> &'static str;
  ```
  and, in TypeScript, `export interface RenderOptionsRs { readonly source: string; readonly spacingSites: readonly SpacingSite[]; readonly delimiterSites: readonly DelimiterSite[] }` where `SpacingSite = { kind: string; slot: string; label: string; constName: string; fieldIdent: string; wireKey: string; defaultId: number; allowedIds: readonly number[] }` and `DelimiterSite = { kind: string; slot: string; constName: string; allowed: number }` (`allowed` is the bitflag union of permitted members). Task 4 reads these to emit fields and fills.

- [ ] **Step 1: Write the failing unit test**

`packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { planRenderOptions, renderOptionsRs } from '../render-options-rs.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';

const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));
const kindEntries = [
	{ kind: 'tight', member: 'Tight', id: 167 },
	{ kind: 'space', member: 'Space', id: 168 },
	{ kind: 'newline', member: 'Newline', id: 169 },
	{ kind: 'semi', member: 'Semi', id: 20, symbolName: ';', anon: true },
	{ kind: 'automatic_semicolon', member: 'AutomaticSemicolon', id: 160 }
];

const sites: SitePreference[] = [
	{ kind: 'formal_parameters', slot: 'elements', label: 'comma_separator_space_before', arms: SPACING, defaultArm: 'tight', source: 'spacing' },
	{ kind: 'formal_parameters', slot: 'elements', label: 'comma_separator_space_after', arms: SPACING, defaultArm: 'space', source: 'spacing' },
	{ kind: 'formal_parameters', slot: 'elements', label: 'delimiter', arms: [{ value: 'Delimiter.Trailing' }], defaultArm: 'Delimiter.None', source: 'delimiter' },
	{ kind: '_statement_block', slot: 'statements', label: 'empty_separator_space', arms: SPACING, defaultArm: 'newline', source: 'spacing' },
	{
		kind: 'return_statement', slot: 'terminator', label: 'statement_terminator',
		arms: [{ value: 'automatic_semicolon', kind: 'automatic_semicolon' }, { value: ';', kind: 'semi' }],
		defaultArm: ';', source: 'declared'
	}
];
const supertypes = new Map([['statement', ['return_statement', '_statement_block']]]);
const whitespaceText = new Map([['tight', ''], ['space', ' '], ['newline', '\n']]);

describe('planRenderOptions', () => {
	it('numbers spacing and flank sites densely, in kind then slot then label order', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		expect(plan.spacingSites.map((s) => [s.constName, s.defaultId, s.fieldIdent, s.wireKey])).toEqual([
			['SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_AFTER', 168, 'elements_comma_separator_space_after', '_elements_comma_separator_space_after'],
			['SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_BEFORE', 167, 'elements_comma_separator_space_before', '_elements_comma_separator_space_before'],
			['SITE_STATEMENT_BLOCK_STATEMENTS_EMPTY_SEPARATOR_SPACE', 169, 'statements_empty_separator_space', '_statements_empty_separator_space']
		]);
		expect(plan.delimiterSites.map((s) => [s.constName, s.allowed])).toEqual([['DELIM_FORMAL_PARAMETERS_ELEMENTS', 2]]);
	});

	it('a declared preference site is a spacing-table site too, typed by its arms', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		const term = plan.spacingSites.find((s) => s.label === 'statement_terminator')!;
		expect(term.allowedIds).toEqual([160, 20]);
		expect(term.defaultId).toBe(20);
	});
});

describe('renderOptionsRs', () => {
	it('emits the constants, the defaults, the resolver tables and spacing_text', () => {
		const src = renderOptionsRs(planRenderOptions(sites, kindEntries, supertypes, whitespaceText));
		expect(src).toContain('pub const SPACING_SITE_COUNT: usize = 4;');
		expect(src).toContain('pub const DELIMITER_SITE_COUNT: usize = 1;');
		expect(src).toContain('pub const SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_AFTER: usize = 0;');
		expect(src).toContain('("formal_parameters", "elements_comma_separator_space_after", "comma_separator_space_after", 168, &[167, 168, 169])');
		expect(src).toContain('("statement", &["return_statement", "statement_block"])');
		expect(src).toContain('167 => "",');
		expect(src).toContain('169 => "\\n",');
		expect(src).toContain('pub fn resolve(json: &str, base: &::sittir_core::options::ResolvedOptions)');
	});
});
```

- [ ] **Step 2: Run to see it fail**

Run: `cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/render-options-rs.test.ts 2>&1 | tail -4`
Expected: cannot resolve `../render-options-rs.ts`.

- [ ] **Step 3: Implement the emitter**

`packages/codegen/src/emitters/render-options-rs.ts`:

```ts
import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import { findEntryForKindName } from '../compiler/generated-metadata.ts';
import { DelimiterFlags } from '../compiler/model/node-map.ts';
import { publicKindName, type SitePreference } from '../compiler/model/site-preferences.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';

export interface SpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly label: string;
	readonly constName: string;
	readonly fieldIdent: string;
	readonly wireKey: string;
	readonly defaultId: number;
	readonly allowedIds: readonly number[];
}

export interface DelimiterSite {
	readonly kind: string;
	readonly slot: string;
	readonly constName: string;
	readonly allowed: number;
}

export interface RenderOptionsPlan {
	readonly spacingSites: readonly SpacingSite[];
	readonly delimiterSites: readonly DelimiterSite[];
	readonly labels: readonly { readonly label: string; readonly allowedIds: readonly number[] }[];
	readonly supertypes: readonly { readonly name: string; readonly members: readonly string[] }[];
	readonly whitespaceText: readonly { readonly id: number; readonly text: string }[];
}

const DELIMITER_BITS: Readonly<Record<string, number>> = {
	'Delimiter.Leading': DelimiterFlags.leading,
	'Delimiter.Trailing': DelimiterFlags.trailing,
	'Delimiter.Both': DelimiterFlags.both
};

function byTuple(a: readonly string[], b: readonly string[]): number {
	for (let i = 0; i < a.length; i++) {
		if (a[i]! < b[i]!) return -1;
		if (a[i]! > b[i]!) return 1;
	}
	return 0;
}

function idOf(kindEntries: readonly KindEntryLike[], kind: string, at: string): number {
	const entry = findEntryForKindName(kindEntries, kind) as (KindEntryLike & { id?: number }) | undefined;
	if (entry?.id === undefined) throw new Error(`options.rs: ${at} names kind '${kind}', which has no kind id`);
	return entry.id;
}

export function planRenderOptions(
	sites: readonly SitePreference[],
	kindEntries: readonly KindEntryLike[],
	supertypeMembers: ReadonlyMap<string, readonly string[]>,
	whitespaceText: ReadonlyMap<string, string>
): RenderOptionsPlan {
	const spacing: SpacingSite[] = [];
	const delimiters: DelimiterSite[] = [];
	const labels = new Map<string, readonly number[]>();
	for (const site of sites) {
		const kind = publicKindName(site.kind);
		const at = `${kind}.${site.slot}`;
		if (site.source === 'delimiter') {
			const allowed = site.arms.reduce((acc, arm) => acc | (DELIMITER_BITS[arm.value] ?? 0), 0);
			delimiters.push({ kind, slot: site.slot, constName: `DELIM_${toScreamingSnakeCase(kind, kind)}_${toScreamingSnakeCase(site.slot, site.slot)}`, allowed });
			continue;
		}
		const allowedIds = site.arms.map((arm) => idOf(kindEntries, arm.kind ?? arm.value, at));
		const defaultArm = site.arms.find((arm) => arm.value === site.defaultArm);
		if (defaultArm === undefined) throw new Error(`options.rs: ${at} default '${site.defaultArm}' is not one of its arms`);
		const key = `${site.slot}_${site.label}`;
		spacing.push({
			kind,
			slot: site.slot,
			label: site.label,
			constName: `SITE_${toScreamingSnakeCase(kind, kind)}_${toScreamingSnakeCase(key, key)}`,
			fieldIdent: key,
			wireKey: `_${key}`,
			defaultId: idOf(kindEntries, defaultArm.kind ?? defaultArm.value, at),
			allowedIds
		});
		labels.set(site.label, allowedIds);
	}
	spacing.sort((a, b) => byTuple([a.kind, a.slot, a.label], [b.kind, b.slot, b.label]));
	delimiters.sort((a, b) => byTuple([a.kind, a.slot], [b.kind, b.slot]));
	return {
		spacingSites: spacing,
		delimiterSites: delimiters,
		labels: [...labels].map(([label, allowedIds]) => ({ label, allowedIds })).sort((a, b) => (a.label < b.label ? -1 : 1)),
		supertypes: [...supertypeMembers]
			.map(([name, members]) => ({ name: publicKindName(name), members: [...new Set(members.map(publicKindName))].sort() }))
			.sort((a, b) => (a.name < b.name ? -1 : 1)),
		whitespaceText: [...whitespaceText]
			.map(([kind, text]) => ({ id: idOf(kindEntries, kind, 'visibleExternals'), text }))
			.sort((a, b) => a.id - b.id)
	};
}

const q = (s: string): string => JSON.stringify(s);

export function renderOptionsRs(plan: RenderOptionsPlan): string {
	const L: string[] = [];
	L.push('// @generated — render options: site table and resolver. Do not hand-edit.', '');
	L.push('use ::sittir_core::options::ResolvedOptions;', '');
	L.push(`pub const SPACING_SITE_COUNT: usize = ${plan.spacingSites.length};`);
	L.push(`pub const DELIMITER_SITE_COUNT: usize = ${plan.delimiterSites.length};`, '');
	plan.spacingSites.forEach((s, i) => L.push(`pub const ${s.constName}: usize = ${i};`));
	plan.delimiterSites.forEach((s, i) => L.push(`pub const ${s.constName}: usize = ${i};`));
	L.push('');
	L.push('/// (kind, `<slot>_<label>` key, label, default kind id, allowed kind ids), in site order.');
	L.push('pub static SPACING_SITES: &[(&str, &str, &str, u16, &[u16])] = &[');
	for (const s of plan.spacingSites) L.push(`    (${q(s.kind)}, ${q(s.fieldIdent)}, ${q(s.label)}, ${s.defaultId}, &[${s.allowedIds.join(', ')}]),`);
	L.push('];', '');
	L.push('/// (kind, `<slot>_delimiter` key, allowed bitflag union), in site order.');
	L.push('pub static DELIMITER_SITES: &[(&str, &str, u8)] = &[');
	for (const s of plan.delimiterSites) L.push(`    (${q(s.kind)}, ${q(`${s.slot}_delimiter`)}, ${s.allowed}),`);
	L.push('];', '');
	L.push('pub static LABELS: &[(&str, &[u16])] = &[');
	for (const l of plan.labels) L.push(`    (${q(l.label)}, &[${l.allowedIds.join(', ')}]),`);
	L.push('];', '');
	L.push('pub static SUPERTYPE_MEMBERS: &[(&str, &[&str])] = &[');
	for (const s of plan.supertypes) L.push(`    (${q(s.name)}, &[${s.members.map(q).join(', ')}]),`);
	L.push('];', '');
	L.push('pub fn spacing_text(kind: u16) -> &\'static str {');
	L.push('    match kind {');
	for (const w of plan.whitespaceText) L.push(`        ${w.id} => ${q(w.text)},`);
	L.push('        _ => "",');
	L.push('    }');
	L.push('}', '');
	L.push('pub fn defaults() -> ResolvedOptions {');
	L.push('    ResolvedOptions {');
	L.push('        spacing: SPACING_SITES.iter().map(|s| s.3).collect(),');
	L.push('        delimiter: vec![0; DELIMITER_SITE_COUNT],');
	L.push('    }');
	L.push('}', '');
	L.push(...RESOLVER_BODY);
	return L.join('\n') + '\n';
}

const RESOLVER_BODY: readonly string[] = [
	'fn set_spacing(table: &mut ResolvedOptions, index: usize, allowed: &[u16], value: &::serde_json::Value, key: &str) -> Result<(), String> {',
	'    let id = value.as_u64().and_then(|v| u16::try_from(v).ok()).ok_or_else(|| format!("options: {key} must be a kind id"))?;',
	'    if !allowed.contains(&id) {',
	'        return Err(format!("options: {key} does not admit kind id {id} (allowed: {allowed:?})"));',
	'    }',
	'    table.spacing[index] = id;',
	'    Ok(())',
	'}',
	'',
	'fn set_delimiter(table: &mut ResolvedOptions, index: usize, allowed: u8, value: &::serde_json::Value, key: &str) -> Result<(), String> {',
	'    let bits = value.as_u64().and_then(|v| u8::try_from(v).ok()).ok_or_else(|| format!("options: {key} must be a Delimiter member"))?;',
	'    if bits & !allowed != 0 {',
	'        return Err(format!("options: {key} does not admit delimiter {bits} (allowed bits: {allowed})"));',
	'    }',
	'    table.delimiter[index] = bits;',
	'    Ok(())',
	'}',
	'',
	'/// Apply one kind\'s (or one supertype member\'s) nested entries to its sites.',
	'fn apply_kind(table: &mut ResolvedOptions, kind: &str, entries: &::serde_json::Map<String, ::serde_json::Value>, owner: &str) -> Result<(), String> {',
	'    for (key, value) in entries {',
	'        let spacing = SPACING_SITES.iter().position(|s| s.0 == kind && s.1 == key);',
	'        if let Some(i) = spacing {',
	'            set_spacing(table, i, SPACING_SITES[i].4, value, &format!("{owner}.{key}"))?;',
	'            continue;',
	'        }',
	'        let delim = DELIMITER_SITES.iter().position(|s| s.0 == kind && s.1 == key);',
	'        if let Some(i) = delim {',
	'            set_delimiter(table, i, DELIMITER_SITES[i].2, value, &format!("{owner}.{key}"))?;',
	'            continue;',
	'        }',
	'        if owner == kind {',
	'            return Err(format!("options: unknown key {owner}.{key}"));',
	'        }',
	'    }',
	'    Ok(())',
	'}',
	'',
	'/// Resolve a JSON options object over `base`, applying kind × slot, then',
	'/// supertype × slot, then the label\'s top-level value. Unknown keys and',
	'/// values a site does not admit are errors naming the key.',
	'pub fn resolve(json: &str, base: &ResolvedOptions) -> Result<ResolvedOptions, String> {',
	'    let value: ::serde_json::Value = ::serde_json::from_str(json).map_err(|e| format!("options: not a JSON object: {e}"))?;',
	'    let object = value.as_object().ok_or_else(|| "options: not a JSON object".to_string())?;',
	'    let mut table = base.clone();',
	'    let mut kinds: Vec<(&String, &::serde_json::Map<String, ::serde_json::Value>)> = Vec::new();',
	'    let mut supertypes: Vec<(&str, &[&str], &::serde_json::Map<String, ::serde_json::Value>)> = Vec::new();',
	'    for (key, value) in object {',
	'        if key == "indent" {',
	'            continue;',
	'        }',
	'        if let Some((_, allowed)) = LABELS.iter().find(|(label, _)| label == key) {',
	'            for (i, site) in SPACING_SITES.iter().enumerate() {',
	'                if site.2 == key {',
	'                    set_spacing(&mut table, i, allowed, value, key)?;',
	'                }',
	'            }',
	'            continue;',
	'        }',
	'        let entries = value.as_object().ok_or_else(|| format!("options: {key} must be an object of <slot>_<label> entries"))?;',
	'        if let Some((name, members)) = SUPERTYPE_MEMBERS.iter().find(|(name, _)| name == key) {',
	'            supertypes.push((name, members, entries));',
	'            continue;',
	'        }',
	'        if SPACING_SITES.iter().any(|s| s.0 == key) || DELIMITER_SITES.iter().any(|s| s.0 == key) {',
	'            kinds.push((key, entries));',
	'            continue;',
	'        }',
	'        return Err(format!("options: unknown key {key}"));',
	'    }',
	'    for (name, members, entries) in supertypes {',
	'        for member in members.iter() {',
	'            apply_kind(&mut table, member, entries, name)?;',
	'        }',
	'    }',
	'    for (kind, entries) in kinds {',
	'        apply_kind(&mut table, kind, entries, kind)?;',
	'    }',
	'    Ok(table)',
	'}'
];
```

Note the precedence: labels are applied first, supertypes second, kinds last, so the later, more specific tier overwrites. A supertype entry whose `<slot>_<label>` key no member owns is silently skipped only when `owner != kind`; an unknown key directly under a kind is an error. If `toScreamingSnakeCase(memberName, rawKind)` does not accept a snake-case input as written, apply it to `pascal(kind)` from this file's neighbour `render-module.ts` instead, or write a local `screaming(s) = s.replace(/^_+/, '').toUpperCase()`; the constant names in the test above are what it must produce.

Wire into `render-module.ts`:
- `RenderModuleBundle` gains `readonly optionsRs: string;`.
- `emitRenderModule` (line 1276) computes `const sites = collectSitePreferences({ nodeMap, kindEntries, spacingPreferences })`, `const plan = planRenderOptions(sites, kindEntries, buildSupertypeMembersMap(nodeMap), whitespaceTextFromVisibleExternals(nodeMap))`, sets `optionsRs: renderOptionsRs(plan)`, and passes `plan` on to Task 4's struct and fill emission. `RenderModuleEmitter`'s config gains `spacingPreferences` (threaded from `emitAll` the way `emitOptions` receives it) and `visibleExternals`.
- `whitespaceTextFromVisibleExternals` maps each visible-external kind whose body is a `STRING` rule to its text; only the three whitespace kinds (`tight`, `space`, `newline`; python's `newline` is its real `_newline` and is included by name) are kept.
- The generated `render/mod.rs` declares `pub mod options;`.
- `run-codegen.ts` writes `result.renderModule.optionsRs` to `rust/crates/sittir-<g>/src/render/options.rs` beside `transport.rs`.

- [ ] **Step 4: Run the unit test and type-check**

Run: `cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/render-options-rs.test.ts 2>&1 | tail -4 && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -5`
Expected: 3 passed; 0 errors.

- [ ] **Step 5: Glossary and commit**

Add `###` entries in `docs/glossary/emitters.md` for `render-options-rs.ts::planRenderOptions` (site numbering and its order; why labels, supertypes, kinds are applied in that order), `::renderOptionsRs`, `::SpacingSite`, `::DelimiterSite`, `::RenderOptionsPlan`, and `render-module.ts::whitespaceTextFromVisibleExternals`.

```bash
git add -- packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/emit.ts packages/codegen/src/run-codegen.ts docs/glossary/emitters.md
git commit -m "feat(codegen): each render crate gets options.rs — site table, resolver and whitespace text"
```

---

### Task 4: Transport fields, the fill walk, and views built from fields

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` — `renderTransportDataStruct` (~2792), `buildTypedTemplateBody` (~1019, the `f.view === 'list' || f.multiple` branch ~1141), `buildSeparatorKindMatchLines` (~998), `renderTransportEntry` (~2628), `renderTypedDispatch` (~724), `emitSupertypeTransportEnum` / `emitPerSlotChildEnum` / `renderAnyTransportWithNapiFromValue` (enum impls)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts` (new cases; the one baseline-failing case in this file stays as it is)

**Interfaces:**
- Consumes: `RenderOptionsPlan` (Task 3): for a struct of kind K, its spacing sites are `plan.spacingSites.filter(s => s.kind === publicKindName(K))`, its flank sites likewise.
- Produces, per generated transport struct with sites:
  ```rust
  #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_comma_separator_space_before"))]
  pub elements_comma_separator_space_before: Option<u16>,
  // … one per spacing site; `_delimiter: Option<u8>` as today
  impl ::sittir_core::options::FillOptions for FormalParametersTransport {
      fn fill_options(&mut self, table: &::sittir_core::options::ResolvedOptions) {
          self.elements_comma_separator_space_before.get_or_insert(table.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_COMMA_SEPARATOR_SPACE_BEFORE]);
          // …
          if self.delimiter.is_none() && table.delimiter[options::DELIM_FORMAL_PARAMETERS_ELEMENTS] != 0 { self.delimiter = Some(table.delimiter[…]); }
          self.elements.fill_options(table);   // every slot field that holds transports
      }
  }
  pub fn render_transport_parts(mut transport: RenderRoot, table: &ResolvedOptions) -> Result<(TransportSource, String), ::askama::Error>
  ```
  and every enum (`AnyTransport`, supertype enums, per-slot child enums) gets a delegating `FillOptions` impl. Leaf and literal structs get a no-op impl.

- [ ] **Step 1: Write the failing emitter tests**

Append to `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, using the file's existing rust-grammar fixture loader:

```ts
describe('render options on transports', () => {
	it('a list slot gets one Option<u16> field per spacing site and a FillOptions impl', () => {
		const emitted = emitRustGrammarRenderModule();   // the file's existing helper returning the bundle
		expect(emitted.transport).toContain('napi(js_name = "_arguments_elements_comma_separator_space_before")');
		expect(emitted.transport).toContain('pub arguments_elements_comma_separator_space_before: Option<u16>,');
		expect(emitted.transport).toContain('impl ::sittir_core::options::FillOptions for ArgumentsTransport {');
		expect(emitted.transport).toContain(
			'self.arguments_elements_comma_separator_space_before.get_or_insert(table.spacing[options::SITE_ARGUMENTS_ARGUMENTS_ELEMENTS_COMMA_SEPARATOR_SPACE_BEFORE]);'
		);
	});

	it('the list view is built from the transport fields, not a literal', () => {
		const emitted = emitRustGrammarRenderModule();
		expect(emitted.transport).toContain('before: options::spacing_text(node.arguments_elements_comma_separator_space_before.unwrap_or(0)),');
		expect(emitted.transport).toContain('after: options::spacing_text(node.arguments_elements_comma_separator_space_after.unwrap_or(0)),');
		expect(emitted.transport).not.toMatch(/ListNonterminalView \{[^}]*separator: /);
	});

	it('the render entry fills the tree from the table before dispatch', () => {
		const emitted = emitRustGrammarRenderModule();
		expect(emitted.transport).toContain('pub fn render_transport_parts(mut transport: RenderRoot, table: &::sittir_core::options::ResolvedOptions)');
		expect(emitted.transport).toContain('transport.fill_options(table);');
	});
});
```

Use the exact slot and kind names the rust fixture produces (`arguments` owns `arguments_elements` per the regenerated `options.ts`); if the helper is named differently, use the file's own.

- [ ] **Step 2: Run to see them fail**

Run: `cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/render-module-emit.test.ts 2>&1 | sed -E -n '/✓|×|Tests  /p'`
Expected: the three new cases fail; the one pre-existing baseline failure in this file is unchanged.

- [ ] **Step 3: Emit fields, fills and views**

In `render-module.ts`:

1. **Fields.** In `renderTransportDataStruct`, after the existing `_delimiter` / `_separator` block and for every compound node, for each `site` in `plan.spacingSites` with `site.kind === publicKindName(node.kind)`:
   ```ts
   lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(site.wireKey)}))]`);
   lines.push(`    pub ${rustFieldIdent(site.fieldIdent)}: Option<u16>,`);
   ```
   `_delimiter` is emitted as today for `AssembledList` nodes with an optional flank; for a compound whose list slot lives on a separate list node the flank field belongs to that list node's struct, which is also where `plan.delimiterSites` places it (its `kind` is the list kind's visible name). Thread `plan` into `renderTransportDataStruct` and `renderTransportStruct`.

2. **Fill impls.** After each struct's `impl RenderableTransport`, emit:
   ```ts
   lines.push(`impl ::sittir_core::options::FillOptions for ${structName} {`);
   lines.push(`    fn fill_options(&mut self, table: &::sittir_core::options::ResolvedOptions) {`);
   for (const site of ownSpacingSites) lines.push(`        self.${rustFieldIdent(site.fieldIdent)}.get_or_insert(table.spacing[options::${site.constName}]);`);
   for (const site of ownDelimiterSites) {
     lines.push(`        if self.delimiter.is_none() && table.delimiter[options::${site.constName}] != 0 {`);
     lines.push(`            self.delimiter = Some(table.delimiter[options::${site.constName}]);`);
     lines.push(`        }`);
   }
   for (const field of transportBearingFields) lines.push(`        self.${rustFieldIdent(field.storageName)}.fill_options(table);`);
   lines.push(`    }`, `}`, '');
   ```
   `transportBearingFields` are the struct's slot fields whose type contains a transport (`SlotValue<…>`, `Vec<SlotValue<…>>`, `Option<…>`, boxed) — the same set `renderTransportField` types as non-primitive; primitive (`String`, `bool`, `u16`) fields are skipped. Leaf structs (`pattern`, `token`, `enum`) get `impl FillOptions for X { fn fill_options(&mut self, _: &ResolvedOptions) {} }`. Every enum emitted by `emitSupertypeTransportEnum`, `emitPerSlotChildEnum` and the `AnyTransport` enum gets a match that delegates to each variant's payload; unit variants (literals) do nothing.

3. **Views.** In `buildTypedTemplateBody`'s list branch, replace the `separator:` emission (both the `buildSeparatorKindMatchLines` form and the literal form) with three lines. The token stays what it is today: the separator kind match when the list has a `separatorRule`, else the field's literal separator, else `""`. Rename the match builder's output key from `separator:` to `token:`. Then:
   ```ts
   const before = spacingSiteFor(plan, node, f, 'before');   // site whose label ends with `_before`, or the empty-gap site for an unseparated repeat
   const after = spacingSiteFor(plan, node, f, 'after');
   lines.push(`            before: ${before ? `options::spacing_text(node.${rustFieldIdent(before.fieldIdent)}.unwrap_or(0))` : '""'},`);
   lines.push(`            after: ${after ? `options::spacing_text(node.${rustFieldIdent(after.fieldIdent)}.unwrap_or(0))` : '""'},`);
   ```
   For an unseparated repeat the single `empty_separator_space` site supplies `after` and `before` is `""`. `spacing_text(0)` is `""` by the match's fallback arm, which is what an unresolvable id must render as: it cannot happen after a fill, and rendering nothing is the failure that shows in output rather than a panic in a render path.
   `leading` / `trailing` stay as they are (they already read `node.delimiter`).

4. **Entry.** `renderTransportEntry` becomes:
   ```rust
   pub fn render_transport_parts(mut transport: RenderRoot, table: &::sittir_core::options::ResolvedOptions) -> Result<(TransportSource, String), ::askama::Error> {
       transport.fill_options(table);
       let rendered = render_transport_dispatch(&transport)?;
       Ok((TransportSource::Factory, rendered))
   }
   ```
   `RenderRoot` is `SlotValue<AnyTransport>`, covered by the core blanket impl once `AnyTransport: FillOptions`.

5. `use super::options;` (or `use crate::render::options;`, matching how `kind_ids` is referenced in `transport.rs`) at the top of the transport module.

- [ ] **Step 4: Run the emitter tests and type-check**

Run: `cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/render-module-emit.test.ts 2>&1 | sed -E -n '/Tests  /p' && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -5`
Expected: the three new cases pass, the baseline count for this file unchanged; 0 type errors.

- [ ] **Step 5: Glossary and commit**

Glossary entries for every new or changed declaration in `render-module.ts` (`spacingSiteFor`, the fill emission, the changed `renderTransportEntry`, `buildSeparatorKindMatchLines` now emitting `token:`).

```bash
git add -- packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts docs/glossary/emitters.md
git commit -m "feat(codegen): transports carry their spacing sites, filled from the options before render

Every list slot's spacing is an Option<u16> field on its transport, one
per site; a FillOptions walk writes the resolved option into each unset
field, and the list view is built from the fields alone."
```

---

### Task 5: Templates name the slot, not the separator

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts` (`selectJoinFilter` ~633 and its call sites; `DEFAULT_JOIN_SEPARATOR` ~655; wherever `| join(` / `| joinWith…(` text is assembled)
- Modify: the templates emitter tests under `packages/codegen/src/emitters/__tests__/` that assert `join(`

**Interfaces:**
- Consumes: Task 1 (no `join*` filters exist), Task 4 (every list-shaped slot has a view with its own separator).
- Produces: generated templates write `{{ statements }}` and `{{ elements }}` where they wrote `{{ statements | join("") }}` and `{{ elements | join(",") }}`.

- [ ] **Step 1: Find and update the assertions**

Run: `for f in packages/codegen/src/emitters/__tests__/*.ts; do c=$(sed -E -n '/\| join/p' "$f" | wc -l | tr -d ' '); [ "$c" != "0" ] && echo "$f: $c"; done`
For each listed test, change the expected template text from `{{ x | join("…") }}` (or `joinWithTrailing` etc.) to `{{ x }}`. Add one new case in the templates test file:

```ts
it('a repeated slot renders through its view with no join filter', () => {
	const src = emitTemplateForRustKind('arguments');   // the file's existing helper
	expect(src).toContain('{{ arguments_elements }}');
	expect(src).not.toContain('| join');
});
```

- [ ] **Step 2: Run to see it fail**

Run: `cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/templates 2>&1 | sed -E -n '/Tests  /p'`
Expected: the changed assertions fail.

- [ ] **Step 3: Stop emitting the filter**

In `templates.ts`, delete `selectJoinFilter` and `DEFAULT_JOIN_SEPARATOR`, and at each site that builds `{{ ${ident} | ${filter}(${sepLiteral}) }}` emit `{{ ${ident} }}`. `staticListInterior` keeps using `separatorToString(rule)` for its adjacency verdict; only the emitted text changes. If a site chose the filter by whether the separator is a nonterminal (`isNonterminalSeparatorRule`), that branch also emits `{{ ident }}`: the view's `token` match already covers a per-instance separator kind.

- [ ] **Step 4: Run the tests and type-check**

Run: `cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/templates 2>&1 | sed -E -n '/Tests  /p' && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -3`
Expected: green; 0 errors.

- [ ] **Step 5: Regenerate, build the crates, and prove no template joins**

```bash
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /dev/null 2>&1; echo "$g $?"; done
for g in rust typescript python; do echo "$g joins: $(cat rust/crates/sittir-$g/templates/*.jinja | sed -E -n '/\| join/p' | wc -l | tr -d ' ')"; done
cd rust && cargo build --workspace 2>&1 | tail -3; cd ..
```
Expected: three exits 0; `joins: 0` for each grammar; `cargo build` 0 errors. A compile error here names a struct whose fill impl or view refers to a field Task 4 did not emit; fix the emitter, not the output.

- [ ] **Step 6: Commit**

```bash
git add -- packages/codegen/src/emitters/templates.ts packages/codegen/src/emitters/__tests__ docs/glossary/emitters.md
git commit -m "feat(codegen): templates render a repeated slot through its view; the join filters are gone"
```
(Generated outputs are committed in Task 7 with the re-pinned examples.)

---

### Task 6: Engine and boundary take options

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs` (`Engine` holds `options: ResolvedOptions`)
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`EngineOptions.options`, constructor, `render`, `render_to_file`)
- Modify: `rust/crates/sittir-{rust,typescript,python}/src/lib.rs` (pass `render::options::defaults` / `render::options::resolve` into the macro)
- Modify: `packages/common/src/engine.ts` (`EngineOptions.options`, `RenderEngine.render` options, `SittirEngine` constructor type), `packages/common/src/engine-boundary.ts` (per-call options → JSON)
- Modify: `packages/codegen/src/emitters/index-file.ts` (or wherever `createEngine` is re-exported per grammar) so `createEngine(options?: EngineOptions<Options>)` is typed with the package's `Options`
- Test: `packages/typescript/tests/options.test.ts` (extend), `rust/crates/sittir-core/tests/options.rs` (unchanged)

**Interfaces:**
- Produces:
  ```rust
  // napi
  pub struct EngineOptions { pub format: Option<String>, pub options: Option<String> }
  pub fn render(&self, transport: RenderRoot, tree_id: Option<f64>, options: Option<String>) -> napi::Result<String>
  ```
  ```ts
  export interface EngineOptions<O = object> { readonly format?: FormatRecord; readonly options?: O }
  render(node, options?: { ignoreFormat?: boolean; options?: O }): RenderHandle
  ```

- [ ] **Step 1: Write the failing boundary test**

Append to `packages/typescript/tests/options.test.ts`:

```ts
import { createEngine, ir } from '../src/index.ts';

it('engine options change the spacing of a built list, per-call options override them', () => {
	const tight = createEngine({ options: { comma_separator_space_after: TSKindId.Tight } });
	const spaced = createEngine({ options: { comma_separator_space_after: TSKindId.Space } });
	const params = ir.formalParameters({ formal_parameters_elements: ['a', 'b'] });
	expect(tight.render(params).text).toBe('(a,b)');
	expect(spaced.render(params).text).toBe('(a, b)');
	expect(tight.render(params, { options: { formal_parameters: { formal_parameters_elements_comma_separator_space_after: TSKindId.Newline } } }).text).toBe('(a,\nb)');
});

it('an unknown option key is refused at construction', () => {
	expect(() => createEngine({ options: { nope: 1 } as never })).toThrow(/unknown key nope/);
});
```

Use the factory name and slot key the generated `ir` namespace actually exposes for `formal_parameters` (check `packages/typescript/src/factories/` if `ir.formalParameters` is spelled differently) and `.text` or whatever `RenderHandle` exposes for the string.

- [ ] **Step 2: Run to see it fail**

Run: `cd packages/typescript && pnpm exec vitest run tests/options.test.ts 2>&1 | tail -6`
Expected: type error or runtime failure: `options` is not an accepted engine option.

- [ ] **Step 3: Native side**

`rust/crates/sittir-core/src/engine.rs`: `Engine` gains `options: ResolvedOptions`; `new(grammar, engine_format, options)`; `pub fn options(&self) -> &ResolvedOptions`.

`rust/crates/sittir-core/src/napi_engine.rs`: the macro takes two more paths, `$defaults:path` and `$resolve:path`:
- `EngineOptions { pub format: Option<String>, pub options: Option<String> }`.
- Constructor: `let options = match opts.options { Some(json) => $resolve(&json, &$defaults()).map_err(::napi::Error::from_reason)?, None => $defaults() };` and pass it to `Engine::new`.
- `render(&self, transport, tree_id, options: Option<String>)`: `let table = match options { Some(json) => $resolve(&json, self.engine.options()).map_err(::napi::Error::from_reason)?, None => self.engine.options().clone() }; let (source, canonical) = $render_parts(transport, &table)…`. `render_to_file` threads the same parameter.

Each grammar `lib.rs`: `sittir_core::napi_engine!(TypeScriptGrammar, RenderRoot, render_transport_parts, NATIVE_RENDER_TRANSPORT_ABI, render::options::defaults, render::options::resolve);`. Bump `NATIVE_RENDER_TRANSPORT_ABI` to `2` in all three (the transport shape changed).

- [ ] **Step 4: TypeScript side**

`packages/common/src/engine.ts`: `EngineOptions<O = object>` with `readonly options?: O`; the native constructor type accepts `{ format?: string; options?: string }`; `render(node, { ignoreFormat?, options? })`. In `createNativeEngine` (~line 203): `const nativeOptions = { ...(options?.format ? { format: JSON.stringify(options.format) } : {}), ...(options?.options ? { options: JSON.stringify(options.options) } : {}) }`, passed when non-empty; the render call (~line 225) passes `renderOptions?.options === undefined ? undefined : JSON.stringify(renderOptions.options)` as the third argument. The per-grammar `createEngine` export (emitted by `index-file.ts`) is typed `createEngine(options?: EngineOptions<Options>)` importing `Options` from `./options.js`.

Rebuild: `for g in rust typescript python; do (cd rust/crates/sittir-$g && pnpm run build 2>&1 | tail -1); done`.

- [ ] **Step 5: Run the tests**

Run: `pnpm run type-check 2>&1 | tail -2; cd packages/typescript && pnpm exec vitest run tests/options.test.ts 2>&1 | tail -4`
Expected: 0 type errors; both new tests pass. If `(a,\nb)` renders with a different line ending, the newline text is the visible-external body — check `packages/typescript/grammar.sittir.ts` `_newline: string('\n')` and fix the test, never the emitter.

- [ ] **Step 6: Commit**

```bash
git add -- rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/napi_engine.rs rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs packages/common/src/engine.ts packages/common/src/engine-boundary.ts packages/codegen/src/emitters/index-file.ts packages/typescript/tests/options.test.ts
git commit -m "feat(engine): createEngine takes options and render takes per-call options

The engine resolves the options object once at construction; a render call
may pass another, resolved over the engine's table. Only ids reach the
transport."
```

---

### Task 7: Regenerate, re-pin the examples, spec and gates

**Files:**
- Regenerate: `packages/{rust,typescript,python}/src/*`, `rust/crates/sittir-*/src/render/*`, `templates/*`, `test-fixtures.json`
- Modify: `docs/superpowers/specs/2026-09-04-render-options-design.md` ("Render side": the fill walk and the three-part view; "Engine and boundary API": `options` as JSON once at construction and per call)
- Modify: the dogfood expectation wherever the six sizes are pinned (`examples/README.md` or the test that asserts them — find with `sed -E -n '/706|2175/p' examples/*.md examples/*.ts packages/*/tests/*.ts`)

- [ ] **Step 1: Regenerate everything and rebuild**

```bash
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /dev/null 2>&1; echo "$g $?"; done
cd rust && cargo build --workspace 2>&1 | tail -2 && cargo test --workspace --exclude sittir-parity-tests 2>&1 | tail -3; cd ..
for g in rust typescript python; do (cd rust/crates/sittir-$g && pnpm run build 2>&1 | tail -1); done
```

- [ ] **Step 2: Render the six dogfood examples and inspect them**

Write `render-examples.ts` in the scratchpad importing `rebuildSplice`, `rebuildSpliceStrict`, `rebuildFormat`, `rebuildFormatStrict`, `rebuildProbeSweep`, `rebuildProbeSweepStrict` from `examples/17-…`, `18-…`, `19-…` and printing each `$render()` in full with its length. Read every output. Expected shape: commas followed by one space and none before; statements one per line; python dotted names tight; rust `+` bounds and `&&` chains spaced both sides. Anything else is a defect in Tasks 1, 4 or 5 to fix before pinning. Record the six lengths.

- [ ] **Step 3: Re-pin and update the spec**

The recorded sizes are 724 / 549 / 203 strict and 2194 / 473 / 196 loose (previously 706 / 542 / 203 and 2175 / 470 / 196); the only other pin was the rust deep-read test's canonical render, which gains the newline between top-level items. In the spec's "Render side", replace the paragraph beginning "The injected choices are ordinary slots of the transport struct" with:

```
The injected choices are fields of the slot's transport, one per site,
carried on the wire as `_<slot>_<label>` beside `_delimiter`. Before
dispatch the native side walks the transport once and writes the resolved
option into every unset field; a value the wire carried wins. The emitted
render function builds the slot's list view from those fields alone —
`before`, `token`, `after` and the flanks — and `Joined` writes
before + token + after between items, token + after for a leading flank,
before + token for a trailing flank. Templates name the slot and nothing
else; no template contains a join filter.
```

- [ ] **Step 4: Full gates**

```bash
pnpm run type-check 2>&1 | tail -2; pnpm run type-check:examples 2>&1 | tail -1
cd packages/codegen && pnpm exec vitest run 2>&1 | sed -E -n '/Tests  /p'; cd ../..
for g in rust typescript python; do (cd packages/$g && pnpm exec vitest run -u 2>&1 | sed -E -n '/Tests  |FAIL /p'); done
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /dev/null 2>&1; done
pnpm exec tsx packages/cli/src/cli.ts validate counts > /dev/null 2>&1; pnpm exec tsx packages/cli/src/cli.ts validate history | tail -4
```
Expected: 0 type errors; codegen suite at 14 failed in the four known files; package suites green with refreshed snapshots (read each `options.test.ts.snap` diff: only the type's own changes, if any); validator rows compared to the previous three: every pass count equal or higher. A drop is investigated with `sittir tool diff-failures` before anything is committed.

- [ ] **Step 5: Commit and push**

```bash
git add -- packages/rust packages/typescript packages/python rust/crates docs/superpowers/specs/2026-09-04-render-options-design.md examples ':!**/node_modules/**' ':!examples/01-construct-nodes.ts'
git diff --cached --name-only | sed -E -n '/node_modules/p' | wc -l
git commit -m "feat(render): lists render with the declared spacing defaults; examples re-pinned

Generated transports carry their spacing sites, templates name the slot,
and the dogfood outputs now show the grammar's declared defaults."
git push origin spec/render-options
```
Expected: the `node_modules` count is 0 before committing.

---

## Self-review

**Spec coverage.** "Render side": fields on the transport, native fill, views from fields, templates without joins, three-part `Joined` — the writer, transport, template and re-pin work above. "Precedence" within an options object: `resolve` applies labels, then supertypes, then kinds; the stamp tier waits for the linked-rule injection and is out of scope, stated in the constraints. "Engine and boundary API": `options` once at construction and per call, only ids per node — the engine work above. "What is emitted": `options.ts` unchanged; `options.rs` added. `tree.options()`, `engine.ir`, `reformat` and indentation for newline joins belong to the later slices.

**Placeholder scan.** Every code step carries code; the "if the helper is named differently" notes point at the file whose helper to use.

**Type consistency.** `ResolvedOptions { spacing: Vec<u16>, delimiter: Vec<u8> }` is spelled the same in core, the emitted `options.rs`, the transport emission and the engine; site constants `SITE_<KIND>_<SLOT>_<LABEL>` / `DELIM_<KIND>_<SLOT>` in the options and transport emitters; field ident `<slot>_<label>` and wire key `_<slot>_<label>` in the emitters and the spec wording; `before` / `token` / `after` in the writer, the view and the spec; `render_transport_parts(mut transport, table)` in the transport emitter and the engine; `EngineOptions.options` as a JSON string natively and a typed object in TypeScript.
