# Askama Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render bodies are emitted Rust built from the spaced render rules; no `.jinja` file, no askama dependency, no template hash, and the template emitter reads the same render rules the render module reads.

**Architecture:** The template emitter's rule walk already decides everything a body contains, and the Jinja it prints uses exactly three constructs: text, a slot reference (optionally left-trimmed), and `if slot is present … else …`. The walk is re-targeted to build that three-node body IR; a Rust printer emits one `fn render_body_<kind>(view, dest)` per kind into `transport.rs`, writing text with `write_str`, slots through the existing view types' `write_into`, and presence tests through the existing `PresenceCheck`. A Jinja printer over the same IR keeps the `.jinja` output byte-identical until the switch, so the IR extraction is gated on identical templates and the Rust printer is gated on identical renders. Askama, `templates.rs`, the template copies, `hash.rs` and the `.jinja` directories then go together.

**Tech Stack:** TypeScript codegen (`packages/codegen/src/emitters/templates.ts`, `render-module.ts`), `sittir-core` (`filters.rs`, `macros.rs`), generated crates, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md` ("Out of scope" names this as the follow-on; the static-spacing plan is the reason).

## Global Constraints

- Every rendered byte is identical before and after each task: the six dogfood renders, the validator metrics, the package suites and the read-depth canonical render.
- The body IR is the only representation of a render body; the Jinja printer exists only until the switch and is deleted with askama.
- The template emitter consumes the spaced render rules (`RenderRules.rules[kind]`), not `node.renderRule`, so injected choices before literal tokens become printable later.
- No source comments; glossary entries for every declaration.

---

### Task 1: Body IR behind the Jinja printer

**Files:** `packages/codegen/src/emitters/render-body.ts` (new: `BodyNode = Text | Slot | If | Seq`, `printJinja`), `templates.ts` (`emitRule` builds `BodyNode`; the Jinja string is `printJinja(body)`), tests.

- [x] Every `.jinja` in `packages/{rust,typescript,python}/templates` byte-identical after regen (`git diff --exit-code -- packages/*/templates`) — two python INDENT templates changed spelling only (raw LF → `\n`), render-identical.
- [x] Unit tests: text, slot, trimmed slot, if/else nest print to the exact Jinja spellings in use today.

### Task 2: Template emitter reads the spaced render rules

**Files:** `templates.ts` (`TemplateEmitter` takes `renderRules`), `emit.ts`, `render-module-runner.ts`, the emit test harness.

- [x] Bodies are built from `renderRules.rules[kind]`; the injected whitespace choices are skipped by the printer for now (they render through the list view), so templates stay byte-identical.

### Task 3: Rust body printer beside the Jinja one

**Files:** `render-body.ts` (`printRustBody`), `render-module.ts` (emit `render_body_<kind>` and call it from `render_typed_<kind>` instead of the askama `render_into`), `rust/crates/sittir-core/src/filters.rs` (`write_into` for every view without the askama `Values` parameter).

- [x] Renders byte-identical: dogfood, validator, package suites.
- [x] `render_with_trivia` and the view types return `std::fmt::Result`; `::askama::Error` disappears from generated code.

### Task 4: Remove askama

**Files:** `render-module.ts` (`templatesRs`, `templateCopies`, `hashRs`/`hashTs` and their manifest roots), `scripts/regen-templates-rs.ts`, `generated-manifest.ts` roots, `Cargo.toml` (workspace and crates), `filters.rs` `FastWritable` impls, `packages/*/templates`, `rust/crates/*/templates`, `.sittir` template hashes, tests that read `.jinja`.

- [x] `cargo tree` shows no askama; manifests regenerate clean; all gates identical.
- [ ] The repo has no `.jinja` — deferred: the validators read `packages/*/templates` as their kind catalog and body source (see the handoff's open decision).

### Task 5: Docs and memory

- [ ] Spec "Out of scope" and "Render side" updated; glossary for `render-body.ts` and the changed emitters; `docs/compiler-phase-glossary.md` render narrative; memory.
