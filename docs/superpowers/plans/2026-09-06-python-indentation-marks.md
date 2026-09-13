# Python Indentation On The Writer Marks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Python's real `_indent` / `_dedent` tokens render as the same in-band writer marks rust and typescript's virtual flanks use, so the root `SpacingWriter`'s depth counter and the `indent` option own every grammar's indentation; the body IR's `indent` block and `IndentWriter` are deleted.

**Architecture:** The scanner's indent token stands for "line break, then one level deeper", and its dedent token follows the line's own newline token, so the walker emits `INDENT` as the `INDENT_NEWLINE` mark string and `DEDENT` as the bare `DEDENT` mark, both as structural whitespace in the body. The writer strips the marks, moves its depth, and pays depth × the configured unit after every newline when the next text arrives. Nothing else in the render path changes.

**Tech Stack:** TypeScript codegen (`templates.ts`, `render-body.ts`), `sittir-core` writer, generated python crate, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md` ("A `_newline` join writes the line break and then the current indentation unit repeated to the nesting depth the writer tracks") and the memory note `project_indent_writer_unit_inconsistency`.

## Global Constraints

- Rust and typescript dogfood renders stay byte-identical. Python renders change only in the indentation unit (two spaces become the configured four); the new python renders are recorded in the PR.
- Validator counts identical to the previous run (rust 149/149 207/207 134/137 1517/1517; typescript 145/145 193/193 112/114 1202/1202; python 126/126 142/142 115/116 1390/1390).
- Generated files are never hand-edited. Regenerate python first with the native build (its old `transport.rs` is the only one that names `IndentWriter`), then rust and typescript template-only to re-stamp their manifests.
- Commit by pathspec; never stage the untracked scratch files or the two pre-existing unrelated modifications.

---

### Task 1: Body IR without the indent block

**Files:** `packages/codegen/src/emitters/render-body.ts`, `__tests__/render-body.test.ts`, `__tests__/support/show-body.ts`, `packages/tools/src/validate/render-bodies.ts`, `packages/tools/src/__tests__/render-bodies.test.ts`, `packages/codegen/src/emitters/render-module.ts` (printer call).

- [ ] Add `export const INDENT_NEWLINE = '\u{FDD0}\n'` and `export const DEDENT_MARK = '\u{FDD1}'` beside `ADJACENT_MARK`, mirroring `sittir_core::spacing`.
- [ ] Delete `IndentNode`, `indented`, and every `'indent'` case (`opensAsTag`, `edgeChar`, `equalNodes`, `refersTo`, `mentions`, `weight` with its `INDENT_OPEN`/`INDENT_CLOSE` constants, `references`, `liftGates`, the printer), plus `RustBodyPrinter.indentUnit` and `INDENT_WRITER`.
- [ ] Tests: the printer prints marks as escaped text (`":\u{FDD0}\n{block}\u{FDD1}"`); the `weight` and `references` fixtures lose their indent block; the validator's `bodyToLegacyRule` fixture and `showBody` lose the case.
- [ ] `render-module.ts`: `printRustBody(struct.body, { field: rustFieldIdent })`.

### Task 2: The walker emits the marks

**Files:** `packages/codegen/src/emitters/templates.ts`.

- [ ] `case INDENT: return whitespace(INDENT_NEWLINE)`, `case NEWLINE: return whitespace('\n')`, `case DEDENT: return whitespace(DEDENT_MARK)`.
- [ ] In `SEQ`, delete the indent split (`indentMemberIdx`, `indentPartIdx`, the `indented(after)` branch and its `seq-indent-adjacent` tally); the seq is one `joinParts(parts, 0)`.
- [ ] `scanArmBody`: delete the `'indent'` case.

### Task 3: Core writer

**Files:** `rust/crates/sittir-core/src/spacing.rs`.

- [ ] Delete `IndentWriter` and its `fmt::Write` impl. `rtk cargo test -p sittir-core` green.

### Task 4: Regenerate, gate, docs, commit

- [ ] `gen --grammar python --all --output packages/python/src --skip-ts-chain`, then rust and typescript with `--no-build-native --no-workspace-check`.
- [ ] Dogfood: rust, rust-strict, ts, ts-strict, py byte-identical; py-strict differs only in indentation width. Record the new py renders under this session's scratchpad and in the PR comment.
- [ ] `validate counts` identical; `cargo test --workspace --exclude sittir-parity-tests`; codegen, tools, cli suites; type-check; lint.
- [ ] Glossary: `render-body.ts` file entry and `::Body` (no indent node; the marks as structural whitespace), `::edgeChar`, `::equalNodes`, `::weight`, `::printRustBody`, `templates.ts::emitRule` (INDENT/DEDENT cases, no seq split), `::scanArmBody`; memory note `project_indent_writer_unit_inconsistency` marked resolved.
- [ ] Commit by pathspec, push, comment on PR #270.
