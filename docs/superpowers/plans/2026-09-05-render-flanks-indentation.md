# Array Flanks And Indentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every kind that owns an empty-separated array gets two virtual whitespace choices around that array, `start` and `end`, whose arms include `indent` and `dedent`; the writer keeps an indentation depth so rust and typescript blocks render indented.

**Architecture:** The render-rule pass that already writes the gap choice into a separator wraps the array rule as `seq(start, array, end)`. A flank site is addressed at the kind level — `block_start`, `block_end` — in `patches:`, in `Options` and in the native site table; its label defaults to its address and a grammar may name it freely with `preference(label, arm)`. `indent` and `dedent` are never-scanned externals whose render text is an in-band mark followed by a newline; `SpacingWriter` strips the marks, moves its depth counter and writes depth × the `indent` option after every newline it emits, when the next text arrives.

**Tech Stack:** TypeScript codegen, `sittir-core` writer, generated Rust render crates, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md`.

## Global Constraints

- Flank arms: start `tight | space | newline | indent`, end `tight | space | newline | dedent`; default `tight`; written only when the array is non-empty.
- `indent` is depth up then newline; `dedent` is depth down then newline; a plain newline keeps the depth. Indentation is deferred to the next non-newline text, so a closing delimiter after a `dedent` lands at the outer depth.
- Addresses: `<kind>_start` / `<kind>_end` (public kind name; a supertype address applies to each member); a kind with several empty-separated arrays is a build error naming them.
- Validator metrics identical; codegen, package and cargo suites green; dogfood renders change only where a grammar declares a flank (rust `block` and `declaration_list`, typescript `statement_block` and `class_body`), and the new renders are recorded in the PR.

---

### Task 1: Writer depth and the indent marks

**Files:** `rust/crates/sittir-core/src/spacing.rs`, `rust/crates/sittir-core/src/options.rs` (`ResolvedOptions.indent`), `rust/crates/sittir-core/src/napi_engine.rs` (no change expected), tests in `spacing.rs`.

- [ ] `INDENT` / `DEDENT` marks (Unicode noncharacters) and `INDENT_NEWLINE` / `DEDENT_NEWLINE` strings; `SpacingWriter::with_indent(unit)`; depth counter; deferred indentation after `\n`.
- [ ] Tests: `{` + indent-newline + `a` + newline + `b` + dedent-newline + `}` → `{\n    a\n    b\n}`; nested depth; dedent at depth zero saturates; marks never reach the sink.
- [ ] `ResolvedOptions.indent: String` (default four spaces); the generated resolver reads the `indent` key.

### Task 2: Whitespace kinds and grammar declarations

**Files:** `packages/{rust,typescript}/grammar.sittir.ts`, `packages/codegen/src/dsl/primitives/spacing.ts`, `packages/codegen/src/emitters/render-module.ts` (`whitespaceTextFromVisibleExternals`), `render-options-rs.ts` (`spacing_text`).

- [ ] Externals `_indent`, `_dedent` on rust and typescript; `visibleExternals` declare them with `indent()` / `dedent()`; `spacing_text` maps them to the core mark strings.
- [ ] `FLANK_START_ARMS`, `FLANK_END_ARMS`, `flankAddress(kind, side)`.
- [ ] Rust: `block_start: preference('block_body_start', 'indent')`, `block_end: preference('block_body_end', 'dedent')`, the same for `declaration_list`; typescript: `statement_block`, `class_body`.

### Task 3: Wire and defaults

**Files:** `packages/codegen/src/dsl/wire/wire.ts`, `dsl/primitives/spacing.ts` (`RenderDefaults` gains labels per site), tests `dsl/__tests__/render-defaults.test.ts`.

- [ ] A top-level `patches:` key `<kind>_start` / `<kind>_end` that is not itself a rule name and holds one `preference(label, arm)` is a flank default: recorded under the kind with its label and arm; `arm` must be a whitespace or indentation kind.
- [ ] `RenderDefaults` becomes `{ labels, sites }` with `sites[kind][address] = { label?, arm }`; the resolver reads it.

### Task 4: The render-rule pass and sites

**Files:** `packages/codegen/src/compiler/model/render-rules.ts`, `site-preferences.ts`, tests `compiler/model/__tests__/render-rules.test.ts`.

- [ ] For each kind, its empty-separated array rules; exactly one → wrap as `seq(startChoice, array, endChoice)` with arms per side, label from the declaration or the address, default resolved kind address → supertype address → label → tight.
- [ ] `flankSitesOf(renderRules)`; `SitePreference.side` gains `start` / `end`; `SitePreference.address` names the option key (`<kind>_start`); spacing sites keep `<slot>_separator_space…`.

### Task 5: Emitters

**Files:** `emitters/options.ts`, `emitters/render-options-rs.ts`, `emitters/render-module.ts`, `rust/crates/sittir-core/src/filters.rs`, tests.

- [ ] `Options`: flank sites are top-level keys by address; supertype addresses union their members.
- [ ] `options.rs`: `SPACING_SITES` rows carry the address; `resolve` accepts a top-level address key (kind or supertype) and the `indent` string.
- [ ] Transport: `Option<u16>` fields named by the address on the owning kind; fill from the table; `ListNonterminalView { head, tail }` written by `Joined` around a non-empty list.

### Task 6: Gates, docs, memory

- [ ] Regenerate; validator identical; codegen, package and cargo suites; dogfood renders recorded before and after.
- [ ] Spec: flanks, indentation, the `indent` option; glossary for every new or changed declaration; memory.
