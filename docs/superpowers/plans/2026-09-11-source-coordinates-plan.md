# Source Coordinates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An untouched parsed node renders by slicing the source the native engine still holds, addressed by its tree handle and byte span, so no source text crosses the boundary in either direction and a rebuilt list takes its whitespace class from the bytes between its still-parsed items.

**Architecture:** The slot carrier becomes `Coord(NodeCoordinate) | Transport(T)`, where a coordinate is a pure value: the tagged handle and the span. The reader captures text only for `pattern`-modeled kinds; every other kind rebuilds from its storage, and the JS projection folds each unedited subtree down to its coordinate. The render context (options table plus the engine's live trees) is an argument end to end: the prepare walk validates every coordinate against the live trees, classifies list gaps between still-parsed items into option values, then fills unset sites from the table; the typed render sink slices a coordinate's bytes at write time through the same source table. Bare strings in a slot that admits a text kind deserialize as a `VerbatimTransport`; anywhere else they are an error.

**Tech Stack:** Rust (`sittir-core`, generated `sittir-{rust,typescript,python}` crates, napi-rs 3.12.4), TypeScript codegen (`packages/codegen`), the `@sittir/common` runtime, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md` (the carrier, the fold, the walk, gap classification, gates 1–10). The read-side paragraph of `docs/superpowers/specs/2026-09-04-render-options-design.md` defers to it.

**Lands on:** `docs/superpowers/plans/2026-09-11-typed-render-sink-plan.md`. Every render function already takes `w: &mut dyn RenderSink`, every transport implements `Render`, and the options table crosses as a generated per-address struct. This plan assumes that state.

## Rulings this plan encodes

These are settled; do not re-open them inside a task.

- **R1 — text is retained only for `pattern` kinds.** `is_text_kind` is `modelType === 'pattern'` on the model, *not* tree-sitter's `PATTERN` rule type: `token(seq(...))`, `alias(pattern)`, `repeat1(literal)` and external-scanner symbols are all `pattern`-modeled and all keep their text. `token` kinds render their declared literal (`literalText`), which the generated `FromNapiValue` already defaults a missing `$text` to. There is no hybrid escape hatch: the census in `.superpowers/sdd/2026-09-11-source-coordinates-plan/text-kind-inventory.md` found zero kinds with children that render `{{ text }}`, so the spec's `raw_string_literal` worry is empty at head. The compound empty-slot `transport_text` fast path is deleted with the compound `$text` field (Task 4), not reimplemented.
- **R2 — the fixed-literal seam is a prerequisite.** rust `unit_expression` and `unit_type` carry the model literal `"( )"`. Task 0 fixes the derivation so it is `"()"` — before tokens stop reading `$text`.
- **R3 — Gate 8 measures across a replaced item.** A rebuilt list measures the gap between the *nearest surviving coordinates* on each side of a replaced run, not only between adjacent pairs. Only the edited node detaches its coordinate; its neighbours keep theirs, and the bytes between those neighbours still spell the source's separator spacing.
- **R4 — the coordinate-key strip moves into Task 4.** Task 4 (emitters) and Task 5 (fold) are coupled: the moment `$nodeHandle` on a wire object selects the `Coord` arm, a storage-bearing node that still carries `$nodeHandle` would render its pre-edit bytes. Rather than merge the two tasks into one commit spanning the emitter, the core carrier, three regenerated grammars *and* the JS runtime, Task 4 takes the one line that fixes the wire — `projectValue` deletes `$nodeHandle`, `$span` and `$childIndex` from every node that carries storage, exactly as it deletes `$text` today. That keeps both commits' `validate:history` numbers identical (Task 4: untouched subtrees already project with no storage and a `$nodeHandle`, so they take `Coord` and slice the same bytes their `$text` spelled; storage-bearing nodes lose the keys and take `Transport` as before), and keeps the two review surfaces — Rust/emitter versus JS runtime — separable.
- **R5 — every carried-in item has an implementing step.** (a) Task 7, (b) and (g) Task 9, (c) Task 8, (d) Task 4, (e) Task 4, (f) Task 3.

## Global Constraints

- Generated outputs are never hand-edited: `packages/{rust,typescript,python}/src/*`, `packages/*/.sittir/*`, `rust/crates/sittir-{rust,typescript,python}/src/render/*` come from `SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`. The hand-written crate roots `rust/crates/sittir-<g>/src/lib.rs` are edited by hand.
- `packages/codegen/src` carries no explanatory comments; every new, renamed or changed declaration gets a `###` entry in the matching `docs/glossary/<dir>.md`, headed `` ### `packages/codegen/src/<dir>/<file>.ts::<name>` ``. Rust crates and `packages/common` keep doc comments that state live constraints, never provenance.
- No comment or doc references a spec, plan, PR or task number.
- Nothing ambient: the render context is a function argument at every level. No `thread_local!`, no `static` table, no global.
- No attempt-then-fallback deserialization. Dispatch on the wire shape; an unrecognised shape is an error.
- Every commit uses explicit pathspecs, with `-m` before `--`: `git add <paths>` then `git commit -m "<msg>" -- <paths>`. Never stage `packages/types/.vitest-report.json`, `.vitest-report.json`, the untracked `*-roles.scm` files, `sittir-role-interfaces-scm-spec.md`, `packages/tools/validation-history.jsonl`, `packages/tools/validation-report.json`, or `.infigraphignore`.
- Run `pnpm exec vitest run` as its own shell call, never chained; regenerate python before validating after any vitest run (the roundtrip tests rewrite `packages/python/.sittir/grammar.js`).
- Gates are numbers compared, never eyeballed. Baselines: rust `147 / 207 / 134 of 137`, typescript `143 / 193 / 112 of 114`, python `126 / 142 / 115 of 116` (`fromPass / covPass / readRenderParsePass of readRenderParseTotal`, the last recorded run in `packages/tools/validation-history.jsonl`). The read-render-parse counts may only rise. Beside them, the byte fixtures in `packages/tools/tests/emit/dogfood-render-bytes.test.ts` must stay green.
- A failed gate stops the task for review. Do not revert, reset, stash or clean up a failing state: an unexpected diff under a supposed no-behaviour-change edit is evidence of a real latent divergence, and discarding it destroys the finding.
- Branch: `feat/source-coordinates`, stacked on `chore/napi-bump-cargo-lock` (PR #275). Each task is one commit. Commit trailer on every commit:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn
```

---

## File structure

| File | Responsibility after this plan |
| --- | --- |
| `packages/codegen/src/util/word-matcher.ts` | `wordCharClass` — the one word-character predicate, shared by the emitted table and the fixed-literal join |
| `packages/codegen/src/dsl/rule-patterns.ts` | `collectFixedLiteral` joins a literal SEQ at word boundaries only |
| `rust/crates/sittir-core/src/slot.rs` | `NodeCoordinate`; `SlotValue::{Coord, Transport}`; shape-directed `FromNapiValue`; `Render` |
| `rust/crates/sittir-core/src/render.rs` | `SourceTable`, `CoordinateError`, `RenderSink::slice`, `RenderSink::dedent(seam)`, `RenderError::Coordinate` |
| `rust/crates/sittir-core/src/spacing.rs` | the writer holds the source table, implements `slice`, and owns the one dedent-seam derivation |
| `rust/crates/sittir-core/src/prepare.rs` (new) | `RenderContext`, the `Prepare` trait and its blanket impls |
| `rust/crates/sittir-core/src/classify.rs` (new) | `classify_whitespace`, `split_gap`, `majority`, `classify_list_gaps` |
| `rust/crates/sittir-core/src/options.rs` | `ResolvedOptions` and `reject_unknown_keys` only; `FillOptions` is gone |
| `rust/crates/sittir-core/src/engine.rs` | `ParsedTree.source: Arc<str>`; `SourceTable` for the tree map; `encode_handle` public; `EngineGrammar: ReadModel` |
| `rust/crates/sittir-core/src/read_node.rs` | `ReadModel`; text captured only for `pattern` kinds; a slot's separator is not seated |
| `rust/crates/sittir-core/src/napi_engine.rs` | `render` builds the `RenderContext` from its tree map |
| `rust/crates/sittir-core/tests/{prepare,classify}.rs` (new), `tests/options.rs` (deleted) | core tests |
| `packages/codegen/src/emitters/render-module.ts` | transports without inert metadata fields; `Prepare` impls with gap classification; `VerbatimTransport`; render entry and dispatch taking the context |
| `packages/codegen/src/emitters/render-options-rs.ts` | `pub fn allowed(site) -> &'static [u16]` |
| `packages/codegen/src/emitters/kind-id-rust.ts` | `is_text_kind`, `is_slot_separator` |
| `packages/codegen/src/emitters/is.ts`, `wrap.ts` | node test and supertype-stub gate keyed on the coordinate |
| `packages/common/src/transport-data.ts` | the fold: `foldsToCoordinate`, `isUntouchedBelow`, `asCoordinate`, `markEdited` detaches the coordinate |
| `packages/common/src/readNode.ts`, `engine.ts` | `SITTIR_DEBUG_TEXT` gone; `ParsedRoot` has no `$text` |
| `rust/crates/sittir-<g>/src/lib.rs` (three, hand-written) | `ReadModel` delegates to the generated tables |
| `packages/tools/src/validate/{common,from,factory-render-parse}.ts`, `packages/tools/src/emit/factory-source.ts` | structural text read from `tree.source` by span |

---

### Task 0: A literal SEQ joins at word boundaries, so `unit_expression` is `()`

rust `unit_expression` and `unit_type` are `seq('(', ')')`. `simplifySeqRule` collapses an all-text SEQ to a `STRING` whose value comes from `collectFixedLiteral`, which joins the parts with a hard `' '`. That produces `"( )"`. Today `w.text(&t.text)` renders whatever the wire carried, so the wrong literal is invisible; once token kinds stop shipping `$text` (Task 6) the model literal is what renders, and `( )` becomes a byte diff. The seam between two literals is the same question `SpacingWriter` answers at write time — is a space lexically required between the last character of the left and the first character of the right — so there is one derivation, not a fixed joiner.

**Files:**
- Modify: `packages/codegen/src/util/word-matcher.ts` (add `wordCharClass`)
- Modify: `packages/codegen/src/emitters/shared.ts` (`wordCharAsciiTable` builds its table from `wordCharClass`)
- Modify: `packages/codegen/src/dsl/rule-patterns.ts` (`FixedLiteralCtx`, `collectFixedLiteral`)
- Create: `packages/codegen/src/dsl/__tests__/fixed-literal-seam.test.ts`
- Modify: `docs/glossary/util.md`, `docs/glossary/dsl.md`, `docs/glossary/emitters.md`

**Interfaces:**
- Produces:
  ```ts
  // packages/codegen/src/util/word-matcher.ts
  export function wordCharClass(wordMatcher: RegExp | undefined): (c: string) => boolean;
  // packages/codegen/src/dsl/rule-patterns.ts
  export interface FixedLiteralCtx { tokenized: boolean; deterministic: boolean; wordMatcher?: RegExp }
  export function collectFixedLiteral(rule: RenderRule, ctxIn?: FixedLiteralCtx): string | undefined;
  ```
  No later task consumes these directly; what later tasks consume is the corrected model literal `"()"` on rust `unit_expression` / `unit_type`.

- [ ] **Step 1: Write the failing test**

Create `packages/codegen/src/dsl/__tests__/fixed-literal-seam.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { collectFixedLiteral } from '../rule-patterns.ts';
import { wordCharClass } from '../../util/word-matcher.ts';
import { SEQ, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../../compiler/types.ts';

const str = (value: string): RenderRule => ({ type: STRING, value }) as unknown as RenderRule;
const seq = (...values: string[]): RenderRule => ({ type: SEQ, members: values.map(str) }) as unknown as RenderRule;

describe('wordCharClass', () => {
	it('is the writer word class: identifier characters join, punctuation does not', () => {
		const isWord = wordCharClass(undefined);
		expect(isWord('a')).toBe(true);
		expect(isWord('Z')).toBe(true);
		expect(isWord('0')).toBe(true);
		expect(isWord('_')).toBe(true);
		expect(isWord('(')).toBe(false);
		expect(isWord(')')).toBe(false);
		expect(isWord('*')).toBe(false);
	});
});

describe('collectFixedLiteral', () => {
	it('joins two word-shaped literals with the space the lexer needs', () => {
		expect(collectFixedLiteral(seq('raw', 'const'))).toBe('raw const');
	});

	it('joins punctuation tight, so a unit is () and not ( )', () => {
		expect(collectFixedLiteral(seq('(', ')'))).toBe('()');
		expect(collectFixedLiteral(seq('[', ']'))).toBe('[]');
	});

	it('joins a punctuation flank to a word tight', () => {
		expect(collectFixedLiteral(seq('*', 'const'))).toBe('*const');
		expect(collectFixedLiteral(seq('const', '*'))).toBe('const*');
	});

	it('keeps a lone literal and an empty seq unchanged', () => {
		expect(collectFixedLiteral(str('mut'))).toBe('mut');
		expect(collectFixedLiteral(seq())).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/fixed-literal-seam.test.ts`
Expected: `wordCharClass` is not exported (import error); the `()` and `*const` cases would fail as `( )` / `* const`.

- [ ] **Step 3: Add `wordCharClass` and route the emitted table through it**

In `packages/codegen/src/util/word-matcher.ts`, after `matchesWordShape`:

```ts
/**
 * The grammar's word-character class as a predicate: does `c` continue a word
 * token under the Link-pinned `wordMatcher`? Derived by asking the matcher
 * whether it consumes two characters when `c` sits beside a plain letter —
 * the same question the render sink's `WordMatcher::is_word` answers per
 * character. One derivation serves the emitted ASCII table and the
 * fixed-literal join.
 */
export function wordCharClass(wordMatcher: RegExp | undefined): (c: string) => boolean {
	const base = wordMatcher ?? /\w/;
	const src = base.source.replace(/\$$/, '');
	const flags = base.flags.replace(/[gm]/g, '');
	let anchored: RegExp;
	try {
		anchored = new RegExp(`^(?:${src})`, flags);
	} catch {
		anchored = /^\w/;
	}
	const joins = (pair: string): boolean => {
		const m = pair.match(anchored);
		return !!(m && m[0] !== undefined && m[0].length > 1);
	};
	return (c: string) => c.length > 0 && (joins(`a${c}`) || joins(`${c}a`));
}
```

In `packages/codegen/src/emitters/shared.ts`, replace the body of `wordCharAsciiTable` (it already imports from `../util/word-matcher.ts`):

```ts
export function wordCharAsciiTable(wordMatcher: RegExp): boolean[] {
	const isWord = wordCharClass(wordMatcher);
	return Array.from({ length: 128 }, (_, i) => isWord(String.fromCharCode(i)));
}
```

and add `wordCharClass` to that file's existing `../util/word-matcher.ts` import.

- [ ] **Step 4: Join a literal SEQ at word boundaries**

In `packages/codegen/src/dsl/rule-patterns.ts`, replace `FixedLiteralCtx` and the SEQ arm of `collectFixedLiteral`:

```ts
export interface FixedLiteralCtx {
	/** Inside a `token(...)`: the parts are one lexeme, so no seam exists. */
	tokenized: boolean;
	deterministic: boolean;
	wordMatcher?: RegExp;
}

export function collectFixedLiteral(
	rule: RenderRule,
	ctxIn: FixedLiteralCtx = { tokenized: false, deterministic: false }
): string | undefined {
	if (rule.nonterminal || rule.multiplicity === 'array' || rule.multiplicity === 'nonEmptyArray') return undefined;
	if (rule.multiplicity === 'optional' && ctxIn.deterministic) return undefined;
	const ctx = rule.tokenized ? { ...ctxIn, tokenized: true } : ctxIn;
	switch (rule.type) {
		case STRING:
			return rule.value || undefined;
		case CHOICE: {
			if (rule.members.length === 0) return undefined;
			let found: string | undefined;
			for (const m of rule.members) {
				const isBlank = (m.type === CHOICE && m.members.length === 0) || (m.type === SEQ && m.members.length === 0);
				if (isBlank) {
					if (ctx.deterministic) return undefined;
					continue;
				}
				const v = collectFixedLiteral(m, ctx);
				if (v === undefined) return undefined;
				if (found === undefined) found = v;
				else if (found !== v) return undefined;
			}
			return found;
		}
		case SEQ: {
			if (rule.members.length === 0) return undefined;
			const nonBlanks = rule.members.filter(
				(m) => !((m.type === CHOICE && m.members.length === 0) || (m.type === SEQ && m.members.length === 0))
			);
			const [only] = nonBlanks;
			if (nonBlanks.length === 1 && only) return collectFixedLiteral(only, ctx);
			const parts: string[] = [];
			for (const m of nonBlanks) {
				const v = collectFixedLiteral(m, { ...ctx, deterministic: true });
				if (v === undefined) return undefined;
				parts.push(v);
			}
			if (parts.length === 0) return undefined;
			const isWord = wordCharClass(ctx.wordMatcher);
			let out = '';
			for (const part of parts) {
				if (part === '') continue;
				if (out !== '' && !ctx.tokenized && isWord(out.slice(-1)) && isWord(part.slice(0, 1))) out += ' ';
				out += part;
			}
			return out || undefined;
		}
		default:
			return undefined;
	}
}
```

Add `import { wordCharClass } from '../util/word-matcher.ts';` to the file's imports.

- [ ] **Step 5: Run the test, type-check, regenerate**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/fixed-literal-seam.test.ts
```

Then, as separate calls:

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

- [ ] **Step 6: Read the diff — it must be exactly the seam fix**

```bash
rtk git diff --stat -- packages/rust/src packages/typescript/src packages/python/src rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git diff -U0 -- rust/crates/sittir-rust/src/render/transport.rs | awk '/^[+-][^+-]/' | sort -u | head -40
```

Expected: every changed literal loses a space at a boundary where at least one flank is punctuation. `"( )"` → `"()"` on `UnitExpressionTransport` and `UnitTypeTransport`. `"raw const"` is unchanged. Any changed literal whose two flanks are both word-shaped is a finding — stop and report it rather than proceeding.

- [ ] **Step 7: Build, suite, gates**

```bash
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

Expected: numbers equal to the baselines or higher; the dogfood byte fixtures green.

- [ ] **Step 8: Glossary**

`docs/glossary/util.md`: add `` ### `packages/codegen/src/util/word-matcher.ts::wordCharClass` `` — the one word-character predicate, the twin of the render sink's per-character class; the emitted ASCII table and the fixed-literal join both read it.
`docs/glossary/emitters.md`: update `` ### `packages/codegen/src/emitters/shared.ts::wordCharAsciiTable` `` — it now materialises `wordCharClass` over the 128 ASCII code points rather than owning its own regex probe.
`docs/glossary/dsl.md`: update `` ### `packages/codegen/src/dsl/rule-patterns.ts::collectFixedLiteral` `` — the SEQ join inserts a space only where the lexer needs one between the adjacent characters, so a punctuation pair joins tight; `tokenized` means the parts are one lexeme and no seam exists.

- [ ] **Step 9: Commit**

```bash
git add packages/codegen/src/util/word-matcher.ts packages/codegen/src/emitters/shared.ts packages/codegen/src/dsl/rule-patterns.ts packages/codegen/src/dsl/__tests__/fixed-literal-seam.test.ts docs/glossary/util.md docs/glossary/dsl.md docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -m "fix(codegen): a literal sequence joins at word boundaries, so a unit is ()

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- packages/codegen/src/util/word-matcher.ts packages/codegen/src/emitters/shared.ts packages/codegen/src/dsl/rule-patterns.ts packages/codegen/src/dsl/__tests__/fixed-literal-seam.test.ts docs/glossary packages/rust packages/typescript packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
```

---

### Task 1: The carrier gains a coordinate arm; the sink can slice one

**Files:**
- Modify: `rust/crates/sittir-core/src/render.rs` (`SourceTable`, `CoordinateError`, `RenderError::Coordinate`, `RenderSink::slice`)
- Modify: `rust/crates/sittir-core/src/slot.rs` (`NodeCoordinate`, `SlotValue::Coord`)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (`with_sources`, `slice`)
- Modify: `rust/crates/sittir-core/src/lib.rs` (re-exports)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`encode_handle` becomes `pub`)

`RenderSink` has exactly one non-test implementation at head — `SpacingWriter` (`spacing.rs`) — plus writers built inside the `#[cfg(test)]` modules of `spacing.rs`, `render.rs` and `macros.rs`, all of which build a `SpacingWriter` rather than implementing the trait themselves. `slice` is therefore given a default body that refuses, so no implementor outside `spacing.rs` has to change and "a writer built without sources refuses every coordinate" is the same statement as the default.

**Interfaces:**
- Produces:
  ```rust
  // render.rs
  pub trait SourceTable { fn source_of(&self, tree_id: u32) -> Option<&Arc<str>>; }
  #[derive(Debug, Clone, PartialEq, Eq)]
  pub enum CoordinateError { UnknownTree { handle: u64, tree_id: u32 }, BadSpan { handle: u64, detail: String } }
  pub enum RenderError { Fmt(fmt::Error), Coordinate(CoordinateError) }   // + From<CoordinateError>
  pub trait RenderSink {
      /* …existing seven methods… */
      fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> RenderResult { /* default: Err(UnknownTree) */ }
  }
  // slot.rs
  pub struct NodeCoordinate { pub handle: u64, pub span: Span }
  impl NodeCoordinate {
      pub fn new(handle: u64, span: Span) -> Self;
      pub fn tree_id(&self) -> u32;
      pub fn resolve<'s>(&self, sources: &'s dyn SourceTable) -> Result<&'s str, CoordinateError>;
  }
  pub enum SlotValue<T, const ADJACENT: bool = false> { Coord(NodeCoordinate), Node(T), Verbatim(String) }
  impl<T, const A: bool> SlotValue<T, A> { pub fn coord(&self) -> Option<&NodeCoordinate>; }
  // spacing.rs
  impl<'a, W> SpacingWriter<'a, W> { pub fn with_sources(self, sources: &'a dyn SourceTable) -> Self; }
  // engine.rs
  pub fn encode_handle(tree_id: u32, index: u32) -> u64;
  ```
  `Node` and `Verbatim` survive until Task 4 so the generated crates keep compiling; `Coord` is dispatched first on the wire. Task 2 consumes `NodeCoordinate::{resolve, tree_id, span}` and `SourceTable`. Task 4 renames `Node` to `Transport` and deletes `Verbatim`.

- [ ] **Step 1: Write the failing unit tests**

Append to the existing `mod tests` block at the bottom of `rust/crates/sittir-core/src/slot.rs`. The block already declares `struct Word(&'static str)`, `fn text_of`, `const TABLE`, and `fn rendered`; add beside them:

```rust
    use crate::engine::encode_handle;
    use crate::render::{CoordinateError, SourceTable};
    use crate::slot::NodeCoordinate;
    use crate::types::Span;
    use std::collections::HashMap;
    use std::sync::Arc;

    struct Sources(HashMap<u32, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
            self.0.get(&tree_id)
        }
    }

    fn rendered_with(value: &dyn Render, sources: &Sources) -> Result<String, crate::render::RenderError> {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_indent("    ")
            .with_sources(sources);
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
        assert_eq!(rendered_with(&slot, &sources).unwrap(), "main");
        assert!(slot.coord().is_some());
    }

    #[test]
    fn a_coordinate_into_an_unknown_tree_is_refused_with_its_handle() {
        let sources = Sources(HashMap::new());
        let handle = encode_handle(9, 2);
        let coord = NodeCoordinate::new(handle, Span { start: 0, end: 1 });
        assert_eq!(
            coord.resolve(&sources),
            Err(CoordinateError::UnknownTree { handle, tree_id: 9 })
        );
        let slot: SlotValue<Word> = SlotValue::Coord(coord);
        assert!(rendered_with(&slot, &sources).is_err());
    }

    #[test]
    fn a_span_outside_its_source_or_off_a_char_boundary_is_refused() {
        let sources = Sources(HashMap::from([(1, Arc::from("é")), (2, Arc::from("short"))]));
        let off = NodeCoordinate::new(encode_handle(1, 0), Span { start: 1, end: 2 });
        assert!(matches!(off.resolve(&sources), Err(CoordinateError::BadSpan { .. })));
        let out = NodeCoordinate::new(encode_handle(2, 0), Span { start: 2, end: 40 });
        let Err(CoordinateError::BadSpan { detail, .. }) = out.resolve(&sources) else {
            panic!("expected BadSpan")
        };
        assert!(detail.contains("2..40") && detail.contains('5'), "{detail}");
    }

    #[test]
    fn a_writer_without_sources_refuses_every_coordinate() {
        let slot: SlotValue<Word> =
            SlotValue::Coord(NodeCoordinate::new(encode_handle(1, 0), Span { start: 0, end: 1 }));
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE);
        assert!(slot.render(&mut w).is_err());
    }

    #[test]
    fn the_unknown_tree_message_names_the_tree() {
        let err = CoordinateError::UnknownTree { handle: 12_884_901_888, tree_id: 3 };
        assert!(err.to_string().contains("names tree 3"), "{err}");
    }
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd rust && cargo test -p sittir-core --lib slot`
Expected: compile errors naming `NodeCoordinate`, `SlotValue::Coord`, `SourceTable`, `CoordinateError`, `with_sources`.

- [ ] **Step 3: `engine.rs` — publish the handle encoder**

Change `fn encode_handle(tree_id: u32, index: u32) -> u64` to `pub fn encode_handle(tree_id: u32, index: u32) -> u64`.

- [ ] **Step 4: `render.rs` — the table, the error, and the sink method**

Add near the top, after `use std::fmt;`:

```rust
use std::sync::Arc;
```

Add after `WhitespaceTable`:

```rust
/// The live trees a render may slice, keyed by the tag a handle carries.
pub trait SourceTable {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>>;
}

/// Why a coordinate cannot be turned into bytes. Both arms carry the handle:
/// a coordinate is only meaningful beside the tree that minted it, and the
/// handle is the only thing that names that tree.
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

Extend `RenderError`:

```rust
#[derive(Debug)]
pub enum RenderError {
    Fmt(fmt::Error),
    Coordinate(CoordinateError),
}
```

with the matching `Display` arm (`Self::Coordinate(e) => fmt::Display::fmt(e, f)`) and

```rust
impl From<CoordinateError> for RenderError {
    fn from(e: CoordinateError) -> Self {
        Self::Coordinate(e)
    }
}
```

Add to `RenderSink`, after `token_seam`:

```rust
    /// Write the bytes a coordinate names, from the tree table this writer
    /// holds. The default refuses: a sink with no source table cannot answer
    /// a coordinate, and answering it as empty would silently delete source.
    fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> RenderResult {
        Err(CoordinateError::UnknownTree {
            handle: coord.handle,
            tree_id: coord.tree_id(),
        }
        .into())
    }
```

- [ ] **Step 5: `slot.rs` — the coordinate and the arm**

Add at the top of the file:

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

    /// The tree this coordinate belongs to — the tag the handle carries.
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
                detail: format!(
                    "span {start}..{end} is not a character range of its source of {} bytes",
                    source.len()
                ),
            });
        }
        Ok(&source[start..end])
    }
}
```

Give `SlotValue` the new first arm and accessor:

```rust
pub enum SlotValue<T, const ADJACENT: bool = false> {
    /// The content is in the tree: the sink slices it from the source the
    /// engine still holds.
    Coord(NodeCoordinate),
    /// A node with its own storage — renders through its transport type.
    Node(T),
    /// Text emitted as-is: a bare string a factory wrote into the slot.
    Verbatim(String),
}
```

In `impl<T, const ADJACENT: bool> SlotValue<T, ADJACENT>`:

```rust
    /// The coordinate this slot holds, or `None` when it holds a value.
    pub fn coord(&self) -> Option<&NodeCoordinate> {
        match self {
            Self::Coord(coord) => Some(coord),
            _ => None,
        }
    }
```

Add `Self::Coord(_) => None` to `node()`, and to `node_or_write`:

```rust
            Self::Coord(coord) => {
                if ADJACENT {
                    w.adjacent();
                }
                w.slice(coord)?;
                Ok(None)
            }
```

and to `Render for SlotValue`:

```rust
            Self::Coord(coord) => {
                if ADJACENT {
                    w.adjacent();
                }
                w.slice(coord)
            }
```

In `FromNapiValue`, dispatch the coordinate shape first, before the existing offer-to-`T` body:

```rust
        let value_type = unsafe { transport_value_type(env, napi_val)? };
        if value_type == ::napi::ValueType::Object {
            let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
            if let Some(handle) = obj.get::<f64>("$nodeHandle")? {
                let handle = crate::napi_engine::checked_index(handle, "$nodeHandle")?;
                let span: Span = obj.get("$span")?.ok_or_else(|| {
                    ::napi::Error::from_reason(format!("coordinate with $nodeHandle {handle} carries no $span"))
                })?;
                return Ok(Self::Coord(NodeCoordinate::new(handle, span)));
            }
        }
        // …existing offer-to-T-then-Verbatim body unchanged until Task 4…
```

`checked_index` (`napi_engine.rs`) already refuses non-finite, negative, fractional and beyond-2^53 values, so there is no second "is this a handle" derivation here. The `FromNapiValue` impl is behind `#[cfg(feature = "napi-bindings")]`, and so is `napi_engine`, so the reference compiles under the same gate.

- [ ] **Step 6: `spacing.rs` — the writer holds the table**

Add `sources: Option<&'a dyn crate::render::SourceTable>` to `SpacingWriter`'s fields, `sources: None` in `new`, and:

```rust
    /// The live trees this render may slice. A writer with none refuses every
    /// coordinate rather than writing nothing in its place.
    pub fn with_sources(mut self, sources: &'a dyn crate::render::SourceTable) -> Self {
        self.sources = Some(sources);
        self
    }
```

In `impl RenderSink for SpacingWriter`, override the default:

```rust
    fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> crate::render::RenderResult {
        let sources = self.sources.ok_or(crate::render::CoordinateError::UnknownTree {
            handle: coord.handle,
            tree_id: coord.tree_id(),
        })?;
        let text = coord.resolve(sources)?;
        self.write_chunk(text)?;
        Ok(())
    }
```

- [ ] **Step 7: `lib.rs` — re-exports**

Extend the existing render re-export to `pub use render::{render_to_string, CoordinateError, Render, RenderError, RenderResult, RenderSink, SourceTable, WhitespaceTable};` and the slot one to `pub use slot::{NodeCoordinate, SlotValue};`.

- [ ] **Step 8: Run the tests and the workspace build**

```bash
cd rust && cargo test -p sittir-core --lib slot --features napi-bindings
```

Expected: five new slot tests pass.

```bash
cd rust && cargo test -p sittir-core && cargo build --workspace
```

Expected: everything else unchanged; the workspace builds, because the generated crates still name `SlotValue::Node`/`Verbatim` and build their writer without sources.

The `--features napi-bindings` run matters: `SlotValue`'s `FromNapiValue` — the coordinate dispatch this task adds — is behind that feature, and a bare `cargo test -p sittir-core` never compiles it.

- [ ] **Step 9: Commit**

```bash
git add rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs
git commit -m "feat(core): the slot carrier holds a coordinate; the sink slices it from the tree it names

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs
```

---

### Task 2: The prepare walk and gap classification

**Files:**
- Create: `rust/crates/sittir-core/src/prepare.rs`
- Create: `rust/crates/sittir-core/src/classify.rs`
- Create: `rust/crates/sittir-core/tests/prepare.rs`, `rust/crates/sittir-core/tests/classify.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs` (`pub mod classify; pub mod prepare;` + re-exports)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`ParsedTree.source: Arc<str>`; `SourceTable` for the tree map)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (`seam_rank` becomes `pub`)

Two contracts settled before a line is written:

1. **Depth arms are filtered by kind id, never by text.** `spacing_text` already maps the two depth kinds to a plain `"\n"` (`render-options-rs.ts` applies `depthBreakOf`), so the U+FDD0/U+FDD1 sentinels never reach a `text_of` lookup and a text sniff would match nothing. The stamped fact is `WhitespaceTable { text_of, indent, dedent }`, so `classify_whitespace` takes the table and compares ids.
2. **A gap is measured between the nearest surviving coordinates.** A rebuilt list detaches only the coordinate of the item that was replaced; its neighbours keep theirs, and the source between those neighbours still spells the separator spacing the list had. So the walk pairs consecutive *coordinates*, skipping rebuilt items between them, and takes the text before the first separator and after the last one in that gap. For `f(a,b,c)` with `b` replaced, the surviving pair is `(a, c)`, the gap is `",b,"`, and the two sides are `""` and `""` — tight, which is what the source spelled.

**Interfaces:**
- Consumes: `NodeCoordinate::{tree_id, resolve, span, handle}`, `SourceTable`, `CoordinateError` (Task 1); `WhitespaceTable`, `seam_rank` (head).
- Produces:
  ```rust
  // prepare.rs
  pub struct RenderContext<'a> { pub options: &'a ResolvedOptions, pub sources: &'a dyn SourceTable }
  pub trait Prepare { fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>; }
  // blanket impls: SlotValue<T, A>, Vec<T>, Option<T>, Box<T>, String, bool, u8, u16
  // classify.rs
  pub fn classify_whitespace(ws: &str, allowed: &[u16], table: &WhitespaceTable) -> Option<u16>;
  pub fn split_gap<'a>(gap: &'a str, token: &str) -> Option<(&'a str, &'a str)>;
  pub fn majority(classes: impl IntoIterator<Item = u16>) -> Option<u16>;
  pub fn classify_list_gaps(
      items: &[Option<&NodeCoordinate>],
      sources: &dyn SourceTable,
      token: &str,
      allowed_before: &[u16],
      allowed_after: &[u16],
      table: &WhitespaceTable,
  ) -> (Option<u16>, Option<u16>);
  // engine.rs
  impl<G: EngineGrammar> SourceTable for HashMap<u32, ParsedTree<G>>;
  ```
  Task 4 generates `Prepare` impls and calls `render_transport_parts(transport, &RenderContext)`. Task 8 emits `classify_list_gaps` calls with `&options::WHITESPACE` as the table.

- [ ] **Step 1: Write the failing prepare tests**

Create `rust/crates/sittir-core/tests/prepare.rs`:

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
        items: vec![
            SlotValue::Coord(NodeCoordinate::new(encode_handle(7, 0), Span { start: 3, end: 4 })),
            SlotValue::Node(Leaf),
        ],
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
    let mut slot: SlotValue<Leaf> =
        SlotValue::Coord(NodeCoordinate::new(handle, Span { start: 0, end: 1 }));
    assert_eq!(
        slot.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::UnknownTree { handle, tree_id: 9 })
    );
}

#[test]
fn a_span_outside_its_tree_fails_the_walk() {
    let options = ResolvedOptions::default();
    let sources = Sources(HashMap::from([(1, Arc::from("ab"))]));
    let handle = encode_handle(1, 0);
    let mut slot: SlotValue<Leaf> =
        SlotValue::Coord(NodeCoordinate::new(handle, Span { start: 0, end: 5 }));
    assert!(matches!(
        slot.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::BadSpan { handle: h, .. }) if h == handle
    ));
}

#[test]
fn a_nested_container_is_walked_to_the_bottom() {
    let options = ResolvedOptions { spacing: vec![168], ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let handle = encode_handle(4, 1);
    let mut nested: Option<Box<Vec<SlotValue<Leaf>>>> = Some(Box::new(vec![SlotValue::Coord(
        NodeCoordinate::new(handle, Span { start: 0, end: 1 }),
    )]));
    assert_eq!(
        nested.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::UnknownTree { handle, tree_id: 4 })
    );
}
```

- [ ] **Step 2: Write the failing classify tests**

Create `rust/crates/sittir-core/tests/classify.rs`:

```rust
use std::collections::HashMap;
use std::sync::Arc;

use sittir_core::classify::{classify_list_gaps, classify_whitespace, majority, split_gap};
use sittir_core::engine::encode_handle;
use sittir_core::render::{SourceTable, WhitespaceTable};
use sittir_core::types::Span;
use sittir_core::NodeCoordinate;

const TIGHT: u16 = 167;
const SPACE: u16 = 168;
const NEWLINE: u16 = 169;
const BLANKLINE: u16 = 170;
const INDENT: u16 = 171;
const DEDENT: u16 = 172;

fn text_of(kind: u16) -> &'static str {
    match kind {
        TIGHT => "",
        SPACE => " ",
        NEWLINE | INDENT | DEDENT => "\n",
        BLANKLINE => "\n\n",
        _ => "",
    }
}
const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: INDENT, dedent: DEDENT };
const ALL: &[u16] = &[TIGHT, SPACE, NEWLINE, BLANKLINE, INDENT, DEDENT];

struct Sources(HashMap<u32, Arc<str>>);
impl SourceTable for Sources {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.0.get(&tree_id)
    }
}

fn coord(tree: u32, start: u32, end: u32) -> NodeCoordinate {
    NodeCoordinate::new(encode_handle(tree, 0), Span { start, end })
}

#[test]
fn whitespace_classifies_by_seam_rank_and_never_to_a_depth_arm() {
    assert_eq!(classify_whitespace("", ALL, &TABLE), Some(TIGHT));
    assert_eq!(classify_whitespace("  \t", ALL, &TABLE), Some(SPACE));
    assert_eq!(classify_whitespace("\n", ALL, &TABLE), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n    ", ALL, &TABLE), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n\n", ALL, &TABLE), Some(BLANKLINE));
    // Wider than anything admitted: the widest admitted arm below it.
    assert_eq!(classify_whitespace("\n\n\n\n", ALL, &TABLE), Some(BLANKLINE));
    assert_eq!(classify_whitespace("\n\n", &[TIGHT, NEWLINE], &TABLE), Some(NEWLINE));
    // The depth arms spell "\n" too, and are still never a gap's class.
    assert_eq!(classify_whitespace("\n", &[INDENT, DEDENT], &TABLE), None);
}

#[test]
fn text_that_is_not_whitespace_has_no_class() {
    assert_eq!(classify_whitespace("b", ALL, &TABLE), None);
    assert_eq!(classify_whitespace(" x ", ALL, &TABLE), None);
}

#[test]
fn a_separated_gap_splits_around_its_outermost_tokens() {
    assert_eq!(split_gap(" , ", ","), Some((" ", " ")));
    assert_eq!(split_gap(",\n", ","), Some(("", "\n")));
    // A replaced item between two survivors leaves two separators in one gap;
    // the sides are the text outside them.
    assert_eq!(split_gap(",b,", ","), Some(("", "")));
    assert_eq!(split_gap(", b , ", ","), Some(("", " ")));
    assert_eq!(split_gap("\n", ","), None);
    assert_eq!(split_gap("\n\n", ""), Some(("\n\n", "")));
}

#[test]
fn majority_is_the_most_frequent_class_and_the_first_seen_wins_a_tie() {
    assert_eq!(majority([NEWLINE, BLANKLINE, NEWLINE]), Some(NEWLINE));
    assert_eq!(majority([BLANKLINE, NEWLINE]), Some(BLANKLINE));
    assert_eq!(majority([NEWLINE, BLANKLINE]), Some(NEWLINE));
    assert_eq!(majority([]), None);
}

#[test]
fn a_comma_list_takes_the_majority_of_its_gaps_per_side() {
    //            0123456789012
    let source = "f(a, b, c ,d)";
    let sources = Sources(HashMap::from([(1, Arc::from(source))]));
    let (a, b, c, d) = (coord(1, 2, 3), coord(1, 5, 6), coord(1, 8, 9), coord(1, 11, 12));
    let items = [Some(&a), Some(&b), Some(&c), Some(&d)];
    // gaps: ", " -> ("", " ") | ", " -> ("", " ") | " ," -> (" ", "")
    // before: [TIGHT, TIGHT, SPACE] -> TIGHT ; after: [SPACE, SPACE, TIGHT] -> SPACE
    assert_eq!(
        classify_list_gaps(&items, &sources, ",", ALL, ALL, &TABLE),
        (Some(TIGHT), Some(SPACE))
    );
}

#[test]
fn a_replaced_item_is_measured_across_by_its_surviving_neighbours() {
    //            012345678
    let source = "f(a,b,c);";
    let sources = Sources(HashMap::from([(1, Arc::from(source))]));
    let (a, c) = (coord(1, 2, 3), coord(1, 6, 7));
    // `b` was replaced, so it carries no coordinate.
    let items = [Some(&a), None, Some(&c)];
    assert_eq!(
        classify_list_gaps(&items, &sources, ",", ALL, ALL, &TABLE),
        (Some(TIGHT), Some(TIGHT))
    );
}

#[test]
fn an_unseparated_repeat_classifies_the_whole_gap_on_one_side() {
    //            0 1 2 3 4 5 6 7 8 9 ...
    let source = "{\n  a;\n\n  b;\n  c;\n}";
    let sources = Sources(HashMap::from([(1, Arc::from(source))]));
    let (a, b, c) = (coord(1, 4, 6), coord(1, 10, 12), coord(1, 15, 17));
    let items = [Some(&a), Some(&b), Some(&c)];
    // gaps: "\n\n  " -> BLANKLINE | "\n  " -> NEWLINE ; tie broken by first seen
    assert_eq!(
        classify_list_gaps(&items, &sources, "", ALL, &[], &TABLE),
        (Some(BLANKLINE), None)
    );
}

#[test]
fn a_pair_that_is_not_two_ordered_coordinates_of_one_tree_contributes_nothing() {
    let sources = Sources(HashMap::from([(1, Arc::from("a, b")), (2, Arc::from("x,y"))]));
    let (a, b, x) = (coord(1, 0, 1), coord(1, 3, 4), coord(2, 0, 1));
    assert_eq!(classify_list_gaps(&[Some(&b), Some(&a)], &sources, ",", ALL, ALL, &TABLE), (None, None));
    assert_eq!(classify_list_gaps(&[Some(&a), Some(&x)], &sources, ",", ALL, ALL, &TABLE), (None, None));
    assert_eq!(classify_list_gaps(&[Some(&a)], &sources, ",", ALL, ALL, &TABLE), (None, None));
    assert_eq!(classify_list_gaps(&[], &sources, ",", ALL, ALL, &TABLE), (None, None));
}
```

- [ ] **Step 3: Run both test files to see them fail**

Run: `cd rust && cargo test -p sittir-core --test prepare --test classify`
Expected: compile errors naming `sittir_core::prepare` and `sittir_core::classify`.

- [ ] **Step 4: Implement `prepare.rs`**

```rust
//! The walk a render makes over every slot before writing a byte: it checks
//! each coordinate against the tree it names, classifies the gaps between
//! still-parsed list items, and fills every unset spacing and flank field
//! from the resolved options. The context is an argument at every level;
//! nothing ambient carries the trees or the table.

use crate::options::ResolvedOptions;
use crate::render::{CoordinateError, SourceTable};
use crate::slot::SlotValue;

/// Everything a render reads that is not the transport itself.
pub struct RenderContext<'a> {
    pub options: &'a ResolvedOptions,
    pub sources: &'a dyn SourceTable,
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
}

impl<T: Prepare, const ADJACENT: bool> Prepare for SlotValue<T, ADJACENT> {
    /// A coordinate is checked here and its slice discarded: the render is
    /// refused before a byte is written rather than part way through, and
    /// the sink re-resolves at write time against the same table.
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

The `Node` and `Verbatim` arms are rewritten in Task 4 when those arms change.

- [ ] **Step 5: Implement `classify.rs`**

```rust
//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::{SourceTable, WhitespaceTable};
use crate::slot::NodeCoordinate;
use crate::spacing::seam_rank;

/// The admitted arm whose text has `ws`'s seam rank; a wider run takes the
/// widest admitted arm below it. Text that is not whitespace is not a gap
/// spelling and has no class. Depth arms never classify: indentation is the
/// writer's depth tracking, not a gap's spelling, and both depth arms spell
/// a plain break, so they are excluded by kind id and never by text.
pub fn classify_whitespace(ws: &str, allowed: &[u16], table: &WhitespaceTable) -> Option<u16> {
    if !ws.chars().all(char::is_whitespace) {
        return None;
    }
    let want = seam_rank(ws);
    let ranked: Vec<(u16, usize)> = allowed
        .iter()
        .copied()
        .filter(|&arm| arm != table.indent && arm != table.dedent)
        .map(|arm| (arm, seam_rank((table.text_of)(arm))))
        .collect();
    if let Some(&(arm, _)) = ranked.iter().find(|(_, rank)| *rank == want) {
        return Some(arm);
    }
    ranked
        .iter()
        .filter(|(_, rank)| *rank < want)
        .max_by_key(|(_, rank)| *rank)
        .map(|&(arm, _)| arm)
}

/// The text outside a gap's separators: everything before the first `token`
/// and everything after the last one. One separator is the adjacent-pair
/// case; more than one means the items between were rebuilt and their old
/// source lies between the two, which is neither side's spelling. An empty
/// token makes the whole gap the "before" side. `None` when the token is
/// absent.
pub fn split_gap<'a>(gap: &'a str, token: &str) -> Option<(&'a str, &'a str)> {
    if token.is_empty() {
        return Some((gap, ""));
    }
    let first = gap.find(token)?;
    let last = gap.rfind(token)?;
    Some((&gap[..first], &gap[last + token.len()..]))
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
    let mut best: Option<(u16, usize)> = None;
    for &(class, n) in &counts {
        if best.is_none_or(|(_, seen)| n > seen) {
            best = Some((class, n));
        }
    }
    best.map(|(class, _)| class)
}

/// The source between two coordinates of one live tree, in source order.
fn gap_between<'s>(
    a: &NodeCoordinate,
    b: &NodeCoordinate,
    sources: &'s dyn SourceTable,
) -> Option<&'s str> {
    if a.tree_id() != b.tree_id() || a.span.end > b.span.start {
        return None;
    }
    let source = sources.source_of(a.tree_id())?;
    source.get(a.span.end as usize..b.span.start as usize)
}

/// One class per side over every classifiable gap of a list, by majority.
/// Items with no coordinate — the ones an edit rebuilt — are skipped, so a
/// gap spans from the nearest surviving coordinate on the left to the
/// nearest on the right. A gap without the token, or a pair that is not two
/// ordered coordinates of one tree, contributes nothing.
pub fn classify_list_gaps(
    items: &[Option<&NodeCoordinate>],
    sources: &dyn SourceTable,
    token: &str,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &WhitespaceTable,
) -> (Option<u16>, Option<u16>) {
    let mut before = Vec::new();
    let mut after = Vec::new();
    let mut previous: Option<&NodeCoordinate> = None;
    for item in items.iter().flatten() {
        if let Some(a) = previous {
            if let Some(gap) = gap_between(a, item, sources) {
                if let Some((lead, trail)) = split_gap(gap, token) {
                    if let Some(class) = classify_whitespace(lead, allowed_before, table) {
                        before.push(class);
                    }
                    if let Some(class) = classify_whitespace(trail, allowed_after, table) {
                        after.push(class);
                    }
                }
            }
        }
        previous = Some(item);
    }
    (majority(before), majority(after))
}
```

In `spacing.rs`, make `seam_rank` public: `pub fn seam_rank(text: &str) -> SeamRank` (and `pub type SeamRank = usize;`).

- [ ] **Step 6: Wire the modules and the tree table**

`lib.rs`: add `pub mod classify;` and `pub mod prepare;` beside the other modules, and `pub use prepare::{Prepare, RenderContext};`.

`engine.rs`: add `use std::collections::HashMap;` and `use std::sync::Arc;`, change `ParsedTree`'s field to `source: Arc<str>`, build it in `Engine::parse` as `source: Arc::from(source.as_str())` (the `extract_format(&source, &tree)` call above it still takes the owned `String`), and add:

```rust
/// The engine's live trees as the render context's source table: a handle's
/// tag names the tree, and the tree owns the source its spans index into.
impl<G: EngineGrammar> SourceTable for HashMap<u32, ParsedTree<G>> {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.get(&tree_id).map(|tree| &tree.source)
    }
}
```

`Arc<str>` derefs to `&str`, so the three existing readers need no change: `read_root` and `read_child` pass `&self.source`, and `ParsedTree::source(&self) -> &str` returns `&self.source`.

- [ ] **Step 7: Run the core tests and the workspace build**

```bash
cd rust && cargo test -p sittir-core --features napi-bindings && cargo build --workspace
```

Expected: prepare 5/5, classify 8/8, everything else unchanged; the workspace builds.

- [ ] **Step 8: Commit**

```bash
git add rust/crates/sittir-core/src/prepare.rs rust/crates/sittir-core/src/classify.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/tests/prepare.rs rust/crates/sittir-core/tests/classify.rs
git commit -m "feat(core): the prepare walk checks coordinates against their tree and classifies list gaps

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- rust/crates/sittir-core/src/prepare.rs rust/crates/sittir-core/src/classify.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/tests/prepare.rs rust/crates/sittir-core/tests/classify.rs
```

---

### Task 3: One dedent derivation

Two routes close an indent and disagree about the break that follows it.
`SpacingWriter::site` merges the arm's text as a seam whenever `dedent()`
reports the indent had payload; the generated literal route
(`render-module.ts::literalWrite`) emits a bare `w.dedent()` and leaves the
seam to whatever body node happens to come next. The writer knows the
cancel rule; the emitter knows the payload. Fold both into one call: the
sink takes the seam it should merge, and applies its own cancel rule to it.
That deletes the divergence the writer's own doc comment records, and it is
a prerequisite for a coordinate-carrying render, where a sliced body can sit
at exactly the edge the two routes disagree about.

**Files:**
- Modify: `rust/crates/sittir-core/src/render.rs` (`RenderSink::dedent`)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (the impl, `site`, and the tests that call `dedent`)
- Modify: `rust/crates/sittir-core/src/macros.rs` (only if its test sink calls `dedent`)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`literalWrite`)
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  ```rust
  // render.rs — replaces `fn dedent(&mut self) -> bool`
  /// Shallows the depth and merges `seam` after it, unless the indent it
  /// closes had no text written — that indent is cancelled and so is the
  /// break that would have followed it. An empty seam merges nothing.
  fn dedent(&mut self, seam: &str);
  ```
  Task 4 emits `w.dedent("\n")` from `literalWrite`; nothing else consumes it.

- [ ] **Step 1: Rewrite the writer tests to the one call**

In `rust/crates/sittir-core/src/spacing.rs`'s `mod sink_tests`, replace the three `dedent` shapes. The expected strings are unchanged — this is a no-behaviour-change refactor of the writer, and any string that has to move is a finding.

```rust
    #[test]
    fn a_depth_site_indents_and_a_dedent_before_any_text_leaves_a_body_bare() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.site(INDENT);
                w.text("a").unwrap();
                w.site(DEDENT);
                w.text("}").unwrap();
            }),
            "{\n\n  a\n}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.site(INDENT);
                w.site(DEDENT);
                w.text("}").unwrap();
            }),
            "{}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam("\n");
                w.text("a").unwrap();
                w.dedent("\n");
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn nested_indentation_stacks_and_a_dedented_indent_leaves_the_body_bare() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.indent();
                w.seam("\n");
                w.text("b").unwrap();
                w.indent();
                w.seam("\n\n");
                w.text("c").unwrap();
                w.dedent("\n");
                w.dedent("\n");
                w.text("d").unwrap();
            }),
            "a\n  b\n\n    c\nd"
        );
    }

    #[test]
    fn a_cancelled_indent_drops_the_dedent_seam_that_follows_it() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam("\n");
                w.dedent("\n");
                w.text("}").unwrap();
            }),
            "{}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam("\n");
                w.text("a").unwrap();
                w.dedent("\n");
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }
```

The two other tests that call `dedent` — `a_bare_dedent_never_drops_a_following_seam` and `a_dedent_below_zero_saturates` — become:

```rust
    #[test]
    fn a_bare_dedent_never_drops_a_following_seam() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.dedent("\n");
                w.text("b").unwrap();
            }),
            "a\nb"
        );
    }

    #[test]
    fn a_dedent_below_zero_saturates() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.dedent("\n");
                w.dedent("\n");
                w.indent();
                w.seam("\n");
                w.text("b").unwrap();
            }),
            "a\n  b"
        );
    }
```

Confirm no other call site remains, and take the current expected strings from head rather than from memory if either of those two tests differs:

```bash
awk '/dedent\(/ {print FILENAME": "NR": "$0}' rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/macros.rs
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd rust && cargo test -p sittir-core --lib spacing`
Expected: compile errors — `dedent` takes no argument.

- [ ] **Step 3: One derivation in the sink**

`render.rs` — replace the `dedent` declaration:

```rust
    /// Shallows the depth and merges `seam` after it. A dedent that arrives
    /// while the indent before it has had no text written cancels that
    /// indent, its held payload, and this seam, so an empty body renders as
    /// its bare delimiters. An empty seam merges nothing. This is the only
    /// place the "may a break follow a dedent" question is answered — a
    /// caller never asks it.
    fn dedent(&mut self, seam: &str);
```

`spacing.rs` — the impl:

```rust
    fn dedent(&mut self, seam: &str) {
        self.depth = self.depth.saturating_sub(1);
        if std::mem::replace(&mut self.indent_armed, false) {
            self.seam = None;
            self.seam_text.clear();
            return;
        }
        if !seam.is_empty() {
            self.merge_seam(seam);
        }
    }
```

`spacing.rs` — `site` routes the depth arms through it, and the doc comment loses the paragraph recording the divergence:

```rust
    /// A site's arm: 0 is no arm — nothing is written and nothing changes —
    /// a depth move plus its line break for the depth arms, otherwise the
    /// arm's text as a seam. A writer with no table attached treats every
    /// other kind as unknown and writes nothing.
    fn site(&mut self, kind: u16) {
        if kind == 0 {
            return;
        }
        debug_assert!(
            self.table.is_some(),
            "a render that resolves sites must attach a whitespace table"
        );
        let Some(table) = self.table else {
            return;
        };
        let text = (table.text_of)(kind);
        if kind == table.dedent {
            self.dedent(text);
            return;
        }
        if kind == table.indent {
            self.indent();
        }
        self.merge_seam(text);
    }
```

- [ ] **Step 4: The generated literal route calls the same thing**

`packages/codegen/src/emitters/render-module.ts`, in `literalWrite`:

```ts
function literalWrite(valueExpr: string, fixed: string | undefined): string {
	if (fixed !== undefined && isDepthText(fixed)) {
		return fixed === INDENT_TEXT
			? `{ w.indent(); w.seam(${rustStringLiteral(DEPTH_BREAK)}); Ok::<(), ::sittir_core::render::RenderError>(()) }`
			: `{ w.dedent(${rustStringLiteral(DEPTH_BREAK)}); Ok::<(), ::sittir_core::render::RenderError>(()) }`;
	}
	if (fixed !== undefined && isWhitespaceOnly(fixed)) {
		return `{ w.token_seam(${valueExpr}); Ok::<(), ::sittir_core::render::RenderError>(()) }`;
	}
	return `w.text(${valueExpr})`;
}
```

- [ ] **Step 5: Type-check, regenerate, build**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
cd rust && cargo test -p sittir-core && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

- [ ] **Step 6: The byte gate — this is the whole point of the task**

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

Expected: identical numbers, and `packages/tools/tests/emit/dogfood-render-bytes.test.ts` green — no grammar exercises both routes on one edge today, so unifying them should move nothing. If a number or a fixture byte moves, that is a real divergence the two routes were hiding: leave the tree exactly as it is, record which grammar and which kind moved, and report. Do not revert, and do not adjust the fixture.

- [ ] **Step 7: Glossary**

`docs/glossary/emitters.md`, entry `` ### `packages/codegen/src/emitters/render-module.ts::literalWrite` ``: the dedent arm hands the sink the break it should merge, so the cancel rule lives in the writer and the emitter states only what the break is.

- [ ] **Step 8: Commit**

```bash
git add rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/src/spacing.rs rust/crates/sittir-core/src/macros.rs packages/codegen/src/emitters/render-module.ts docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -m "refactor(render): a dedent carries the break it may merge, so both routes share one rule

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- rust/crates/sittir-core/src packages/codegen/src/emitters/render-module.ts docs/glossary/emitters.md packages/rust packages/typescript packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
```

---

### Task 4: The emitters render through coordinates; the old arms go

The largest task in the plan and the one that regenerates. It does six things
that must land together, because each of them alone would move the numbers:

1. the carrier keeps two arms, `Coord` and `Transport`, and deserializes by shape;
2. transports stop declaring the five inert metadata fields, and compounds stop declaring `$text` — with which the empty-slot `transport_text` fast path goes, closing the depth leak it caused;
3. depth tokens stop carrying the sentinel as a `$text` default — the depth fact is the kind id the sink already dispatches on;
4. `FillOptions` becomes `Prepare` and the render context is an argument from `napi_engine` down;
5. `VerbatimTransport` returns for slots that admit a text kind, and free text anywhere else is an error;
6. `projectValue` strips `$nodeHandle`, `$span` and `$childIndex` from every node that carries storage, so the new `Coord` dispatch never sees a rebuilt node wearing a stale coordinate.

Point 6 is the half of Task 5 that has to be here: without it, a node whose
slot was replaced still crosses with `$nodeHandle`, takes the `Coord` arm and
renders its pre-edit bytes, and this task's own "numbers identical" gate is
designed to fail. Everything else about the fold — deciding when an
*unedited* node collapses to a coordinate, and detaching the coordinate at
the edit — stays in Task 5, where it is reviewed as JS runtime behaviour.

After this task an untouched subtree still projects the way it does today
(`asCapturedText`: identity, `$text`, `$span`, `$nodeHandle`, no storage) and
now takes the `Coord` arm, slicing exactly the bytes its `$text` spelled. A
deep read still rebuilds every level, as it does today.

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` — `TRANSPORT_METADATA_FIELDS`, `TransportMetadataField`, `renderTransportMetadataFields`, `renderLeafTransportPlainFields`, `renderLeafTransportNapiImpls`, `leafDefaultTextLiteral`, `renderTransportDataStruct`, `buildTypedTemplateBody`, `buildSlotWriteCall`, `seatLoops`, `seatVariantArms`, `armSeamSupport`, `fillOptionsStructImpl` → `prepareStructImpl`, `fillOptionsEnumImpl` → `prepareEnumImpl`, `noopFillOptionsImpl` → `inertPrepareImpl`, `emitPerSlotChildEnum`, `emitSupertypeTransportEnum`, `emitTransportEnumFromNapiValueBody`, `renderTransportSupport`, `renderTypedDispatch`, `renderTransportEntry`, `renderTriviaTransportSupport`
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`allowed`)
- Modify: `rust/crates/sittir-core/src/slot.rs`, `src/prepare.rs`, `src/options.rs`, `src/napi_engine.rs`
- Delete: `rust/crates/sittir-core/tests/options.rs`
- Modify: `rust/crates/sittir-core/tests/prepare.rs` (`Node` → `Transport`)
- Create: `rust/crates/sittir-python/tests/depth_balance.rs`
- Modify: `packages/common/src/transport-data.ts` (`projectValue` only)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `__tests__/render-options-rs.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `NodeCoordinate`, `SlotValue::Coord`, `SourceTable`, `CoordinateError`, `RenderSink::slice`, `SpacingWriter::with_sources` (Task 1); `Prepare`, `RenderContext` (Task 2); `RenderSink::dedent(seam)` (Task 3).
- Produces, in every generated `transport.rs`:
  ```rust
  pub struct VerbatimTransport { pub text: String }
  pub enum <Owner><Slot>TransportSlot { …, Verbatim(VerbatimTransport) }   // only when a member is pattern-modeled
  impl ::sittir_core::prepare::Prepare for <every transport type> {
      fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError>
  }
  pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError>
  pub fn render_transport_parts(mut transport: RenderRoot, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(TransportSource, String), ::sittir_core::render::RenderError>
  ```
  and in every generated `options.rs`: `pub fn allowed(site: usize) -> &'static [u16] { SPACING_SITES[site].4 }`.
  In core: `pub enum SlotValue<T, const ADJACENT: bool = false> { Coord(NodeCoordinate), Transport(T) }` with `coord()`, `transport()`, `transport_or_write(w)`.
  In `@sittir/common`: `toTransportData` no longer lets `$nodeHandle`, `$span` or `$childIndex` cross on a node that carries storage.
  Task 5 consumes the `Coord`-on-`$nodeHandle` dispatch. Task 8 adds gap classification inside `prepareStructImpl`.

- [ ] **Step 1: Write the failing emitter tests**

In `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, inside `describe('the typed sink replaces the mark-based Display path', …)`, add five `it`s. Each fetches its own source — there is no shared `transportRs` binding in this file; every case calls `await getRustTemplatesRs()` (or `getTypescriptTransportRs()`) itself.

```ts
	it('carries every slot as Coord or Transport and never a bare string', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toContain('SlotValue::Node(');
		expect(transportRs).not.toContain('SlotValue::Verbatim(');
		expect(transportRs).toContain('SlotValue::Transport(');
	});

	it('declares no inert metadata on transports', async () => {
		const transportRs = await getRustTemplatesRs();
		for (const field of [
			'transport_span',
			'transport_node_handle',
			'transport_child_index',
			'transport_source',
			'transport_named'
		]) {
			expect(transportRs).not.toContain(`pub ${field}:`);
		}
		expect(transportRs).toContain('pub transport_trivia_data: Option<TransportTrivia>');
		expect(transportRs).not.toContain('pub transport_text: Option<String>');
	});

	it('reads a depth token off its kind and not off a sentinel default', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u);
		expect(transportRs).toContain('{ w.dedent("\\n"); Ok::<(), ::sittir_core::render::RenderError>(()) }');
	});

	it('prepares every transport through the render context and renders with its sources', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toContain('FillOptions');
		expect(transportRs).toContain('impl ::sittir_core::prepare::Prepare for FunctionItemTransport {');
		expect(transportRs).toContain(
			"fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {"
		);
		expect(transportRs).toContain('.get_or_insert(ctx.options.spacing[options::');
		expect(transportRs).toContain(
			"pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {"
		);
		expect(transportRs).toContain(
			'::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources)'
		);
	});

	it('admits verbatim text only where a slot admits a pattern kind', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).toContain('pub struct VerbatimTransport {');
		// FunctionItem.name admits identifier and metavariable, both pattern-modeled.
		expect(transportRs).toMatch(/pub enum FunctionItemNameTransportSlot \{[^}]*Verbatim\(VerbatimTransport\),/s);
		// MacroDefinition.content admits three envelopes and no pattern kind.
		expect(transportRs).toMatch(/pub enum MacroDefinitionContentTransportSlot \{(?:(?!Verbatim)[^}])*\}/s);
	});
```

Update the two existing cases in this file that pin the old signatures:

- `it('the render entry fills the tree from the table before dispatch', …)` becomes

```ts
	it('the render entry prepares the tree through the context before dispatch', async () => {
		const src = await getTypescriptTransportRs();
		expect(src).toContain('pub fn render_transport_parts(');
		expect(src).toContain("    ctx: &::sittir_core::prepare::RenderContext<'_>,");
		expect(src).toContain('    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;');
	});
```

- in `it('renders through the typed sink and writes no mark character', …)`, delete the `depthDefaultLine` strip and the `withoutStampedIdentityDefaults` construction (the sentinel no longer appears anywhere), assert `expect(transportRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u)` on the raw source, and update the two signature assertions to the `ctx` spellings above.

In `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts` add a case. `plan` and `addresses` are built inside each `it` in this file, never at describe scope, so build them here too, copying the two lines from the neighbouring case:

```ts
	it("exposes each site's admitted arms to the prepare walk", () => {
		const plan = planRenderOptions(sites, kindEntries, whitespaceText);
		const addresses = deriveAddressTables(plan);
		const source = renderOptionsRs(plan, addresses, kindEntries);
		expect(source).toContain("pub fn allowed(site: usize) -> &'static [u16] {\n    SPACING_SITES[site].4\n}");
	});
```

(Take the exact `sites` / `kindEntries` / `whitespaceText` / `deriveAddressTables` spellings from the case directly above it in the file.)

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
Expected: the five new cases and the two updated ones fail on the old spellings.

- [ ] **Step 3: Core — finish the carrier**

`slot.rs`: the enum is exactly

```rust
/// One slot position's value: the tree it came from, or the value to build.
///
/// `ADJACENT` mirrors the grammar's `immediate` stamp for this position:
/// when every scalar-capable source of the slot forbids preceding
/// whitespace, the write suppresses the seam space the spacing writer would
/// otherwise insert. It is a slot fact, not a wire fact, so it rides on the
/// type rather than the value.
#[derive(Debug, Clone)]
pub enum SlotValue<T, const ADJACENT: bool = false> {
    /// The content is in the tree: the sink slices it from the source the
    /// engine still holds.
    Coord(NodeCoordinate),
    /// The content is in this message.
    Transport(T),
}
```

Rename `node()` → `transport()` and `node_or_write()` → `transport_or_write()`; delete `captured_source_text` and `write_verbatim`; rewrite the module doc to say the content is either in the tree or in the message, and that free text is a transport that admits it. `FromNapiValue` becomes shape-directed with no fallback:

```rust
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let value_type = unsafe { transport_value_type(env, napi_val)? };
        if value_type == ::napi::ValueType::Object {
            let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
            if let Some(handle) = obj.get::<f64>("$nodeHandle")? {
                let handle = crate::napi_engine::checked_index(handle, "$nodeHandle")?;
                let span: Span = obj.get("$span")?.ok_or_else(|| {
                    ::napi::Error::from_reason(format!("coordinate with $nodeHandle {handle} carries no $span"))
                })?;
                return Ok(Self::Coord(NodeCoordinate::new(handle, span)));
            }
        }
        Ok(Self::Transport(unsafe { T::from_napi_value(env, napi_val)? }))
    }
```

Update the slot unit tests: `SlotValue::Node(Word(..))` → `SlotValue::Transport(Word(..))`, delete `verbatim_renders_its_text`, rename `node_or_write_writes_only_the_verbatim_case` to `transport_or_write_writes_only_the_coordinate_case` and rewrite it against a coordinate:

```rust
    #[test]
    fn transport_or_write_writes_only_the_coordinate_case() {
        let sources = Sources(HashMap::from([(1, Arc::from("raw"))]));
        let mut buf = String::new();
        let mut w = SpacingWriter::new(&mut buf, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_sources(&sources);
        let node: SlotValue<Word> = SlotValue::Transport(Word("fn"));
        assert!(node.transport_or_write(&mut w).unwrap().is_some());
        w.finish().unwrap();
        assert_eq!(buf, "");

        let mut buf2 = String::new();
        let mut w2 = SpacingWriter::new(&mut buf2, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_sources(&sources);
        let coord: SlotValue<Word> =
            SlotValue::Coord(NodeCoordinate::new(encode_handle(1, 0), Span { start: 0, end: 3 }));
        assert!(coord.transport_or_write(&mut w2).unwrap().is_none());
        w2.finish().unwrap();
        assert_eq!(buf2, "raw");
    }
```

`prepare.rs`: the `SlotValue` impl becomes two arms — `Coord(coord) => coord.resolve(ctx.sources).map(|_| ())` and `Transport(t) => t.prepare(ctx)`.

`tests/prepare.rs`: `SlotValue::Node(Leaf)` → `SlotValue::Transport(Leaf)`.

`options.rs`: delete `FillOptions` and every impl of it; keep `ResolvedOptions` and `reject_unknown_keys`; the module doc becomes "Resolved render options: one whitespace kind id per spacing site, one bitflag per flank site, and the indentation unit." Delete `rust/crates/sittir-core/tests/options.rs` — every behaviour it pinned (an unset site takes the table, a set site keeps its wire value) is now pinned by `tests/prepare.rs`, and `reject_unknown_keys` is covered by the per-grammar options tests, not by that file.

`napi_engine.rs`, in the `render` method — build the context and keep the message wording head already has:

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
                    ::napi::Error::from_reason(format!("render_transport failed: {e}"))
                })?;
```

`tree_id` and the format lookup below it stay exactly as they are.

- [ ] **Step 4: Emitter — the metadata fields and the compound text**

`TRANSPORT_METADATA_FIELDS` keeps one entry:

```ts
const TRANSPORT_METADATA_FIELDS: readonly TransportMetadataField[] = [
	{ jsName: '$_trivia', rustName: 'transport_trivia_data', rustType: 'Option<TransportTrivia>' }
];
```

`TransportMetadataField` loses `bridgeMap` and `needsExplicitTypeAnnotation` — both existed only for the dropped coordinate fields.

`renderTransportMetadataFields` currently reads the array by index (`[0]` = `$source`, `[1]` = `$named`, then text, then `.slice(2)`). That body must be rewritten, not just fed a shorter array, or the reads silently pick the wrong field:

```ts
function renderTransportMetadataFields(includeText: boolean): string[] {
	const lines: string[] = [];
	for (const f of TRANSPORT_METADATA_FIELDS) {
		lines.push(
			`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(f.jsName)}))]`,
			`    pub ${f.rustName}: ${f.rustType},`
		);
	}
	if (includeText) {
		lines.push(
			`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(TRANSPORT_TEXT_FIELD.jsName)}))]`,
			`    pub ${TRANSPORT_TEXT_FIELD.rustName}: ${TRANSPORT_TEXT_FIELD.rustType},`
		);
	}
	return lines;
}
```

and its one compound caller in `renderTransportDataStruct` passes `false`:
`lines.push(...renderTransportMetadataFields(false));`. A leaf struct keeps its own `text: String` — that field is the leaf's content, not metadata.

`renderLeafTransportNapiImpls` iterates `TRANSPORT_METADATA_FIELDS` at five sites (the release `Ok(Self { … })`, the two boolean-literal `Self { … }` early returns, the debug-transport `let <field> = obj.get(…)` block, and the debug-transport `Ok(Self { … })`). With one entry the loops still work, but two of them special-case `transport_named`, which no longer exists: delete those branches, so the release constructor is `Ok(Self { transport_trivia_data: __trivia, text })` and each boolean early return is `Self { transport_trivia_data: None, text: … }`. Delete the now-unused `named` binding the emitter computed for those branches.

`renderLeafTransportPlainFields` becomes:

```ts
function renderLeafTransportPlainFields(): string[] {
	return [...TRANSPORT_METADATA_FIELDS.map((f) => `    pub ${f.rustName}: ${f.rustType},`), '    pub text: String,'];
}
```

The compound `$text` field is gone, so the empty-slots fast path that read it goes with it. In `buildTypedTemplateBody` delete the prefix block

```rust
    if <every slot empty> {
        if let Some(text) = node.transport_text.as_deref() {
            return w.text(text);
        }
    }
```

along with the `struct.hasText` / `node.transport_text` bindings that fed it. That early `return` is also the depth leak: python's `render_suite_block` opens an indent and calls `render_block`, whose fast path returned before `w.dedent()`, leaving depth +1 for the rest of the render. Step 7 pins that it is gone.

Search the file for every remaining `transport_source`, `transport_named`, `transport_span`, `transport_node_handle`, `transport_child_index` and `transport_text` spelling (`ToNapiValue` impls, `renderTriviaTransportSupport`, the `bridgeMap` consumers, the `debug-transport` impls) and remove those fields there too.

Carrier spelling: replace every `SlotValue::Node(` with `SlotValue::Transport(` (`seatVariantArms`, `seatLoops`), `.node()` with `.transport()` (the backing-field bind in `buildTypedTemplateBody`) and `node_or_write` with `transport_or_write` (`buildSlotWriteCall`).

Depth tokens stop shipping a sentinel default:

```ts
function leafDefaultTextLiteral(node: AssembledNode): string | undefined {
	if (node.modelType === 'token') {
		const text = node.text || undefined;
		return text !== undefined && isDepthText(text) ? undefined : text;
	}
	if (node.modelType === 'pattern') return node.fixedLiteralText || undefined;
	return undefined;
}
```

The depth leaf's own `Render` already routes through `literalWrite(…, fixedTextOfKind(node))`, which reads the model's stamped text and emits `w.indent()` / `w.dedent("\n")` without touching `t.text`, so nothing reads the field the default filled. `isDepthText` is already imported from `../dsl/primitives/spacing.ts` by this file.

- [ ] **Step 5: Emitter — the prepare impls and the context**

Rename `fillOptionsStructImpl` → `prepareStructImpl`, `fillOptionsEnumImpl` → `prepareEnumImpl`, `noopFillOptionsImpl` → `inertPrepareImpl`, and drop the `OPTIONS_MOD` constant in favour of:

```ts
const PREPARE_MOD = '::sittir_core::prepare';
const PREPARE_SIG = `fn prepare(&mut self, ctx: &${PREPARE_MOD}::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {`;
```

`prepareStructImpl` keeps its head signature `(structName, node, fillFields: readonly string[], plan, isCompound, nodeMap)` — `fillFields` is a list of Rust field identifiers, not slot objects — and prepares the children **first**, so Task 8's classification runs over coordinates the walk has already checked:

```ts
function prepareStructImpl(
	structName: string,
	node: AssembledNode,
	fillFields: readonly string[],
	plan: RenderPlan,
	isCompound: boolean,
	nodeMap: NodeMap
): string[] {
	const body: string[] = [];
	if (isCompound) {
		for (const f of fillFields) body.push(`        self.${f}.prepare(ctx)?;`);
		for (const site of synthesizedSpacingSites(plan, node)) {
			body.push(`        self.${rustFieldIdent(site.fieldIdent)}.get_or_insert(ctx.options.spacing[options::${site.constName}]);`);
		}
		body.push(...seatLoops(plan, node, nodeMap));
		const delim = node instanceof AssembledList ? delimiterSiteOf(plan, node) : undefined;
		if (delim !== undefined) {
			body.push(`        self.delimiter.get_or_insert(ctx.options.delimiter[options::${delim.constName}]);`);
		}
		const sep = node instanceof AssembledList ? separatorSiteOf(plan, node) : undefined;
		if (sep !== undefined) body.push(`        self.separator_kind.get_or_insert(ctx.options.spacing[options::${sep.constName}]);`);
	}
	return [
		`impl ${PREPARE_MOD}::Prepare for ${structName} {`,
		`    ${body.length > 0 ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		...body,
		`        Ok(())`,
		`    }`,
		`}`,
		''
	];
}
```

`prepareEnumImpl` matches each payload arm to `t.prepare(ctx)` and each literal arm to `Ok(())`, with the match as the tail expression:

```ts
function prepareEnumImpl(
	enumName: string,
	arms: readonly { readonly variant: string; readonly payload: boolean }[]
): string[] {
	const anyPayload = arms.some((a) => a.payload);
	return [
		`impl ${PREPARE_MOD}::Prepare for ${enumName} {`,
		`    ${anyPayload ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		`        match self {`,
		...arms.map((a) =>
			a.payload ? `            ${enumName}::${a.variant}(t) => t.prepare(ctx),` : `            ${enumName}::${a.variant} => Ok(()),`
		),
		`        }`,
		`    }`,
		`}`,
		''
	];
}

function inertPrepareImpl(typeName: string): string[] {
	return [
		`impl ${PREPARE_MOD}::Prepare for ${typeName} {`,
		`    ${PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		`        Ok(())`,
		`    }`,
		`}`,
		''
	];
}
```

In `seatVariantArms` the seat line becomes `t.<field>.get_or_insert(ctx.options.spacing[options::…]);` and the `if let ::sittir_core::SlotValue::Node(seated) = item` guard in `seatLoops` becomes `SlotValue::Transport(seated)`. `armSeamSupport`'s `Seamed<T>` `FillOptions` impl becomes a `Prepare` impl reading `ctx.options.spacing` and returning `Ok(())`.

`renderTypedDispatch`'s root:

```rust
pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {
    let mut s = String::new();
    let mut w = ::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources);
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

`render-options-rs.ts` appends after the `spacing_text` block, before `WHITESPACE`:

```rust
pub fn allowed(site: usize) -> &'static [u16] {
    SPACING_SITES[site].4
}
```

- [ ] **Step 6: Emitter — `VerbatimTransport`**

In `renderTransportSupport`, before the per-slot enums, emit once:

```rust
/// Text that is a slot's content with no kind of its own: a bare string in
/// a slot whose members all render from their own text, where the variant
/// tag is render-invisible and picking one would be a guess.
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

In `emitPerSlotChildEnum` and `emitSupertypeTransportEnum`, compute
`const admitsVerbatim = validKinds.some(({ node }) => node.modelType === 'pattern');`
(for the supertype enum, over its concrete members). When true, add the arm
`Verbatim(VerbatimTransport),`, a `Verbatim(t) => t.prepare(ctx),` arm in the
prepare impl, and a `Verbatim(t) => t.render(w),` arm in the `Render` impl.
Give `emitTransportEnumFromNapiValueBody` a third parameter
`admitsVerbatim: boolean` and, before the `_ =>` arm, emit:

```ts
	if (admitsVerbatim) {
		lines.push(
			`            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),`
		);
	}
```

That is a `ValueType` dispatch beside the existing `Number` and `Object` arms, not a trial: the `_ =>` arm still errors, and its message becomes
`` `${enumName}: expected u16 kind_id, string, or object with $type` `` when there is a verbatim arm.

Every bridge-to-`AnyTransport` function (`*_transport_slot_to_any`) gets a
`Verbatim(t) => AnyTransport::Verbatim(t),` arm, and `AnyTransport` gains
`Verbatim(VerbatimTransport)` with `Render` and `Prepare` arms.
`AnyTransport::from_napi_value` does **not** accept a bare string: the root of
a render is never free text.

- [ ] **Step 7: A debug build proves the depth leak is gone**

`SpacingWriter::finish` asserts `debug_assert_eq!(self.depth, 0)`, which never
runs in the release addon — so nothing today would have caught the fast path
returning before `w.dedent()`. Create
`rust/crates/sittir-python/tests/depth_balance.rs`, which runs under
`cargo test` (a debug profile) and therefore does execute the assertion:

```rust
//! A block whose body is empty must still close the indent its parent
//! opened: `finish` asserts the depth returned to zero, and that assertion
//! only runs in a debug build.

use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::render::SourceTable;
use std::sync::Arc;

use sittir_python::render::options;
use sittir_python::render::transport::{
    render_transport_parts, AnyTransport, BlockTransport, RenderRoot, SuiteBlockTransport,
};

struct NoSources;
impl SourceTable for NoSources {
    fn source_of(&self, _tree_id: u32) -> Option<&Arc<str>> {
        None
    }
}

#[test]
fn an_empty_suite_block_closes_the_indent_it_opened() {
    let options = options::defaults();
    let ctx = RenderContext { options: &options, sources: &NoSources };
    let block = BlockTransport {
        transport_trivia_data: None,
        statements: None,
        ..Default::default()
    };
    let suite = SuiteBlockTransport {
        transport_trivia_data: None,
        block: ::sittir_core::SlotValue::Transport(block),
        ..Default::default()
    };
    let root: RenderRoot = ::sittir_core::SlotValue::Transport(AnyTransport::SuiteBlock(suite));
    let (_, rendered) = render_transport_parts(root, &ctx).expect("render");
    assert!(!rendered.contains('\u{FDD0}'));
}
```

The generated transport structs do not derive `Default`; before writing this
file, print the two structs and fill every field explicitly instead of the
`..Default::default()` shorthand:

```bash
awk '/^pub struct BlockTransport \{/,/^\}/' rust/crates/sittir-python/src/render/transport.rs
awk '/^pub struct SuiteBlockTransport \{/,/^\}/' rust/crates/sittir-python/src/render/transport.rs
awk '/^pub enum AnyTransport \{/,/^\}/' rust/crates/sittir-python/src/render/transport.rs | awk 'index($0,"SuiteBlock")>0'
```

Every `Option<u16>` site field is `None`, every `Option<Vec<…>>` slot is
`None`. If the assertion trips, the render leaked depth — report it, do not
relax the test.

- [ ] **Step 8: The wire stops carrying a stale coordinate**

In `packages/common/src/transport-data.ts`, `projectValue` deletes the
coordinate keys wherever it deletes `$text` today:

```ts
const COORDINATE_KEYS = ['$nodeHandle', '$span', '$childIndex'] as const;

function projectValue(value: unknown, normalize: NormalizeNodeStorage | undefined): unknown {
	if (Array.isArray(value)) return value.map((entry) => projectValue(entry, normalize));
	if (!isRecord(value)) return value;
	const normalized =
		normalize !== undefined && hasStructure(value) ? normalize(value as unknown as AnyNodeData) : value;
	if (!isRecord(normalized)) return normalized;
	if (isUntouchedSubtree(normalized)) return asCapturedText(normalized);
	const out: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(normalized)) {
		if (key === '$with' || typeof raw === 'function') continue;
		out[key] = key.startsWith('_') || key === '$other' ? projectValue(raw, normalize) : raw;
	}
	if (hasStructure(out)) {
		delete out.$text;
		for (const key of COORDINATE_KEYS) delete out[key];
	}
	return out;
}
```

Update the function's doc comment: a node that carries storage rebuilds from
it, so neither its pre-edit text nor the coordinate that would slice that
text may cross. `isUntouchedSubtree` and `asCapturedText` are untouched here
— an untouched subtree keeps its coordinate, which is now what renders it —
and both are replaced in Task 5.

- [ ] **Step 9: Glossary**

In `docs/glossary/emitters.md`: rename the headings `fillOptionsStructImpl` → `prepareStructImpl`, `fillOptionsEnumImpl` → `prepareEnumImpl`, `noopFillOptionsImpl` → `inertPrepareImpl`; add `PREPARE_SIG`, `PREPARE_MOD` and `render-options-rs.ts::allowed`; update `renderTransportEntry`, `renderTypedDispatch`, `renderTransportMetadataFields`, `renderLeafTransportPlainFields`, `renderLeafTransportNapiImpls`, `leafDefaultTextLiteral`, `emitTransportEnumFromNapiValueBody`, `emitPerSlotChildEnum`, `emitSupertypeTransportEnum`, `armSeamSupport`, `seatLoops`, `buildTypedTemplateBody` and `buildSlotWriteCall` to describe the prepare walk, the context argument, the verbatim arm, the dropped metadata fields and the deleted fast path. In `packages/common`, update `toTransportData`'s and `projectValue`'s doc comments.

- [ ] **Step 10: Type-check, unit tests, regenerate, build**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

Dropping five fields from every struct will leave unused imports (`Span` in a
generated `transport.rs`) and unused bindings; fix them in the emitter, never
in the generated file.

- [ ] **Step 11: Gates**

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

```bash
bash scripts/comment-slop-check.sh --working
```

```bash
pnpm exec tsx packages/cli/src/cli.ts tool propose-14
```

Expected: `validate:history` identical to the baselines — an untouched subtree
now renders from its span exactly the bytes it rendered from its text — the
dogfood byte fixtures green, vitest green, slop clean, propose-14 unchanged.
A byte difference in any dogfood example is a finding to review, not to
revert.

- [ ] **Step 12: Commit**

```bash
git rm -q rust/crates/sittir-core/tests/options.rs
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts packages/common/src/transport-data.ts docs/glossary/emitters.md rust/crates/sittir-core/src rust/crates/sittir-core/tests rust/crates/sittir-python/tests/depth_balance.rs rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git commit -m "feat(render): a transport renders an untouched node from its coordinate; verbatim text is a transport

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- packages/codegen/src/emitters packages/common/src/transport-data.ts docs/glossary/emitters.md rust/crates/sittir-core rust/crates/sittir-python/tests rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render packages/rust packages/typescript packages/python
```

Confirm with `git status --short` that only generated outputs, the emitters, core, `packages/common` and the glossary are staged; manifest and bundled `grammar.js` churn is expected.

---

### Task 5: The projection folds by coordinate; an edit detaches it

The spec says a node folds when "it still carries its coordinate, has no
attached trivia, and every stored child folds; a text-modeled leaf folds when
it still carries its `$span`". Those are two different predicates, and which
node needs which matters, because a **deep** read gives its descendants a
`$span` and deliberately no `$nodeHandle` — a handle would make the wrap
layer's `drillInSelf` go back to the tree and re-read an expansion it already
holds. So:

- the node that **emits** the coordinate needs the whole thing: `$nodeHandle` and `$span`;
- a **descendant** needs only its own `$span` intact, plus no attached trivia, all the way down.

That is what makes Gate 3 reachable: under a deep read the root carries the
handle (`$nodeHandle` is stamped on the read's own root, and
`widen_to_whole_source` gives it the whole file's span), every descendant
still carries the span it parsed at, and the root folds to one coordinate
covering the file. A deep read then renders byte-identically to a shallow
one.

An edit is what breaks the chain, and `markEdited` is where it is recorded:
the `$with` setter drops `$nodeHandle`, `$span` and `$childIndex` from the
node it rebuilds. A node with no `$span` is never "untouched below", so no
ancestor folds over it — and because a grafted foreign node always arrives
*through* a setter, the node that received it has already lost its span, and
no ancestor can fold a foreign subtree into this tree's bytes.

**Files:**
- Modify: `packages/common/src/transport-data.ts`
- Modify: `packages/common/src/index.ts` (`stripStructuralNodeText` → `stripStructuralProvenance`)
- Create: `packages/common/tests/transport-data.test.ts`
- Modify: `packages/codegen/src/emitters/is.ts` (`isNode`), `packages/codegen/src/emitters/wrap.ts` (the supertype-collapse gate)
- Modify: `packages/rust/tests/read-depth.test.ts`
- Modify: `packages/tools/src/probe/kind.ts`, `packages/tools/src/validate/read-render-parse.ts`, `packages/tools/tests/probe/probe-kind-trace.test.ts` (the three `stripStructuralNodeText` call sites)
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: the native `Coord`-on-`$nodeHandle` dispatch and the coordinate-key strip (Task 4).
- Produces (`@sittir/common`):
  ```ts
  export function markEdited<T extends object>(data: T): Omit<T, '$nodeHandle' | '$span' | '$childIndex'>;
  export function toTransportData(node: AnyNodeData, normalize?: NormalizeNodeStorage): AnyNodeData;
  export function stripStructuralProvenance<T>(root: T): T;
  ```
  A folded node on the wire is `{ $type, $source?, $named?, $span, $nodeHandle, $childIndex? }`. A structural node that does not fold crosses with no `$nodeHandle`, `$span`, `$childIndex` or `$text`. Leaves keep `$text` and `$span`.
  Task 8's behaviour test relies on a rebuilt list's surviving items still folding to coordinates.

- [ ] **Step 1: Write the failing projection tests**

Create `packages/common/tests/transport-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { markEdited, toTransportData } from '../src/transport-data.ts';

const leaf = (text: string, start: number) => ({
	$type: 1,
	$source: 0,
	$named: true,
	$text: text,
	$span: { start, end: start + text.length }
});
const stub = (start: number, end: number, childIndex: number) => ({
	$type: 2,
	$source: 0,
	$named: true,
	$span: { start, end },
	$nodeHandle: 0,
	$childIndex: childIndex
});
/** A deep-read node: its own span and storage, and no handle of its own. */
const deep = (start: number, end: number, storage: Record<string, unknown>) => ({
	$type: 4,
	$source: 0,
	$named: true,
	$span: { start, end },
	...storage
});

describe('toTransportData', () => {
	it('folds an unedited node with only stubs and leaves below it to its coordinate', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0,
			_name: leaf('main', 3),
			_body: stub(8, 20, 2)
		};
		expect(toTransportData(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0
		});
	});

	it('folds a deep read, whose descendants carry a span and no handle of their own', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0,
			_body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] })
		};
		expect(toTransportData(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0
		});
	});

	it('keeps a node whose child was replaced, and strips its coordinate', () => {
		const rebuilt = { $type: 9, $source: 2, $named: true, _x: leaf('y', 0) };
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0,
			_name: leaf('main', 3),
			_body: rebuilt
		};
		const out = toTransportData(node as never) as Record<string, unknown>;
		expect(out.$nodeHandle).toBeUndefined();
		expect(out.$span).toBeUndefined();
		expect(out._body).toEqual(rebuilt);
	});

	it('folds an untouched child inside an edited parent', () => {
		const parent = {
			$type: 3,
			$source: 0,
			$named: true,
			_a: stub(0, 4, 0),
			_b: { $type: 9, $source: 2, $named: true }
		};
		const out = toTransportData(parent as never) as Record<string, unknown>;
		expect(out._a).toEqual(stub(0, 4, 0));
	});

	it('does not fold a node that carries trivia, at any depth', () => {
		const withOwnTrivia = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 4 },
			$nodeHandle: 0,
			$_trivia: { leading: [leaf('// c', 0)] },
			_a: stub(0, 4, 0)
		};
		const own = toTransportData(withOwnTrivia as never) as Record<string, unknown>;
		expect(own.$nodeHandle).toBeUndefined();
		expect(own.$_trivia).toBeDefined();

		const withChildTrivia = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 8 },
			$nodeHandle: 0,
			_a: { ...deep(0, 8, {}), $_trivia: { leading: [leaf('// c', 0)] } }
		};
		expect((toTransportData(withChildTrivia as never) as Record<string, unknown>).$nodeHandle).toBeUndefined();
	});

	it('never lets a structural node cross with $text or a stale coordinate', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$text: 'stale',
			$span: { start: 0, end: 5 },
			$nodeHandle: 0,
			_a: { $type: 9, $source: 2, $named: true }
		};
		const out = toTransportData(node as never) as Record<string, unknown>;
		expect(out.$text).toBeUndefined();
		expect(out.$nodeHandle).toBeUndefined();
		expect(out.$span).toBeUndefined();
	});

	it('leaves a kind id or a boolean in a slot inert', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 6 },
			$nodeHandle: 0,
			_marker: true,
			_keyword: 42
		};
		expect(toTransportData(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 6 },
			$nodeHandle: 0
		});
	});
});

describe('markEdited', () => {
	it('detaches the coordinate and nothing else', () => {
		const out = markEdited({
			$type: 3,
			$span: { start: 0, end: 1 },
			$nodeHandle: 4,
			$childIndex: 1,
			$text: 'x',
			_a: 1
		});
		expect(out).toEqual({ $type: 3, $text: 'x', _a: 1 });
	});
});
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm exec vitest run packages/common/tests/transport-data.test.ts`
Expected: the deep-read fold and the child-trivia case fail (today the gate is `$text` and stub-shaped children); `markEdited` fails (it strips `$text`).

- [ ] **Step 3: Implement the fold**

Replace `hasStructure`, `isUnexpandedStub`, `markEdited`, `isUntouchedSubtree`, `asCapturedText` and the `projectValue` fold branch in `packages/common/src/transport-data.ts` with:

```ts
const COORDINATE_KEYS = ['$nodeHandle', '$span', '$childIndex'] as const;

function isStorageKey(key: string): boolean {
	return key.startsWith('_') || key === '$other';
}

function hasStructure(record: Record<string, unknown>): boolean {
	return record.$other != null || Object.keys(record).some((key) => key.startsWith('_'));
}

/**
 * Whether nothing under `value` was rebuilt: it still spans the bytes it was
 * read from, its comments are not attached separately, and the same holds
 * all the way down. A kind id, a boolean or a bare string in a slot is inert
 * — the parent's own coordinate is what places it, and an edit that put it
 * there detached that coordinate at the setter.
 *
 * A span is the whole requirement because a deep read hands its descendants
 * a span and no handle: only the node that emits the coordinate needs to
 * name the tree.
 */
function isUntouchedBelow(value: unknown): boolean {
	if (Array.isArray(value)) return value.every(isUntouchedBelow);
	if (value === undefined || value === null || typeof value !== 'object') return true;
	const record = value as Record<string, unknown>;
	if (!isRecord(record.$span)) return false;
	if (record.$_trivia != null) return false;
	for (const [key, child] of Object.entries(record)) {
		if (!isStorageKey(key)) continue;
		if (!isUntouchedBelow(child)) return false;
	}
	return true;
}

/**
 * Whether this node can cross as a coordinate: it still names its tree and
 * its span, carries no separately attached trivia, and nothing below it was
 * rebuilt. The handle is required here and nowhere below, because it is the
 * only thing that says which tree the span indexes into.
 */
function foldsToCoordinate(record: Record<string, unknown>): boolean {
	if (typeof record.$nodeHandle !== 'number' || !isRecord(record.$span)) return false;
	return isUntouchedBelow(record);
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
 * this the new node would still fold to the pre-edit bytes. Recorded here,
 * at the edit, because an emptied node and a node that parsed childless have
 * the same shape afterwards and only the first is dirty.
 */
export function markEdited<T extends object>(data: T): Omit<T, (typeof COORDINATE_KEYS)[number]> {
	const {
		$nodeHandle: _handle,
		$span: _span,
		$childIndex: _index,
		...rest
	} = data as T & Record<(typeof COORDINATE_KEYS)[number], unknown>;
	return rest;
}
```

and `projectValue`'s fold branch becomes `if (foldsToCoordinate(normalized)) return asCoordinate(normalized);` (the coordinate-key strip added in Task 4 stays exactly as it is).

`stripStructuralNodeText` becomes `stripStructuralProvenance`, deleting the
coordinate keys as well as `$text` on any node that carries storage:

```ts
/**
 * Drop the pre-edit spelling and the coordinate that would slice it from
 * every node that carries storage, in place, and return `root`. For
 * already-projected data that came through a path other than
 * {@link toTransportData}.
 */
export function stripStructuralProvenance<T>(root: T): T {
	const seen = new WeakSet<object>();
	const recurse = (value: unknown): void => {
		if (!isRecord(value) || typeof value.$type !== 'number') return;
		if (seen.has(value)) return;
		seen.add(value);
		if (hasStructure(value)) {
			delete value.$text;
			for (const key of COORDINATE_KEYS) delete value[key];
		}
		for (const [key, child] of Object.entries(value)) {
			if (!isStorageKey(key)) continue;
			if (Array.isArray(child)) for (const entry of child) recurse(entry);
			else recurse(child);
		}
	};
	recurse(root);
	return root;
}
```

Rename the export in `packages/common/src/index.ts` and at its three call
sites — `packages/tools/src/probe/kind.ts` (four uses), `packages/tools/src/validate/read-render-parse.ts` (one), `packages/tools/tests/probe/probe-kind-trace.test.ts` (one). Confirm the list is complete:

```bash
awk 'index($0,"stripStructuralNodeText")>0 {print FILENAME": "FNR}' $(git ls-files '*.ts')
```

- [ ] **Step 4: Generated gates keyed on the coordinate**

`packages/codegen/src/emitters/is.ts`, the `isNode` body's last line:

```ts
	lines.push(`    return hasFields || typeof o['$text'] === 'string' || typeof o['$nodeHandle'] === 'number';`);
```

`packages/codegen/src/emitters/wrap.ts`, the supertype-collapse gate in
`emitSupertypeWrap` (the line that reads `if (filtered === undefined && typeof (data as _NodeData).$text === 'string') {`):

```ts
		`  if (filtered === undefined && (typeof (data as _NodeData).$text === 'string' || (data as _NodeData).$nodeHandle != null)) {`,
```

- [ ] **Step 5: The read-depth suite records the new contract**

In `packages/rust/tests/read-depth.test.ts`, the header comment's claim that
the two depths render different text is now false. Replace the header's first
paragraph with: a shallow parse expands one level and leaves each child with
substructure as a stub the accessors expand on demand; a deep parse expands
the whole tree up front; nothing was rebuilt under either, so both fold back
to the root's coordinate and render the source byte for byte.

Replace `it('renders a deep-parsed root canonically and a shallow one verbatim', …)` with:

```ts
	it('renders a deep-parsed root byte for byte, like a shallow one', () => {
		const engine = createEngine();
		expect(engine.parse(SOURCE).$render()).toBe(SOURCE);
		expect(engine.parse(SOURCE, { deep: true }).$render()).toBe(SOURCE);
	});
```

The `countStubs` cases and the re-parse case are unchanged: a deep read still
stamps no `$nodeHandle` on its descendants, so `countStubs` still reports 0.

- [ ] **Step 6: Glossary**

`docs/glossary/emitters.md`: update `` ### `packages/codegen/src/emitters/is.ts::isNode` `` — a node is storage, text content, or a coordinate — and the wrap supertype-collapse gate entry, which now also admits a node that arrived as a coordinate.

- [ ] **Step 7: Type-check, regenerate, suites, gates**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

Expected: green, including `read-depth`, `tree-identity-and-verbatim`, the
new common tests and the dogfood byte fixtures. `validate:history`
read-render-parse counts equal or higher than the baselines — deep candidates
now fold — and the from/coverage counts unchanged.

- [ ] **Step 8: Commit**

```bash
git add packages/common/src/transport-data.ts packages/common/src/index.ts packages/common/tests/transport-data.test.ts packages/codegen/src/emitters/is.ts packages/codegen/src/emitters/wrap.ts packages/rust/tests/read-depth.test.ts packages/tools/src/probe/kind.ts packages/tools/src/validate/read-render-parse.ts packages/tools/tests/probe/probe-kind-trace.test.ts docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git commit -m "feat(common): an unedited subtree crosses as its coordinate; an edit detaches the coordinate

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- packages/common packages/codegen/src/emitters/is.ts packages/codegen/src/emitters/wrap.ts packages/rust/tests/read-depth.test.ts packages/tools/src packages/tools/tests docs/glossary/emitters.md packages/rust packages/typescript packages/python
```

---

### Task 6: The reader captures text only for `pattern` kinds

The predicate is the model's own class: `modelType === 'pattern'`. That is
`AssembledPattern` — the free-text leaf — and it is a stamped fact, not a
shape heuristic. It is deliberately **not** tree-sitter's `PATTERN` rule
type: 14 rust / 12 typescript / 12 python rendering pattern kinds are
`token(seq(…))`, `alias(pattern)`, `repeat1(literal)` or external-scanner
symbols whose rule is not `PATTERN` even though their content is free text,
and a rule-type test would strip the text they have nothing else to render
from.

`token` kinds are **not** in the predicate: every `token` kind is an
`AssembledLeaf<StringRule>`, its literal is on the model, and the generated
`FromNapiValue` already defaults a missing `$text` to that literal. Keeping
`token` would keep a `$text` the transport can reconstruct. Only 9 rust /
10 typescript / 10 python token kinds are named parser nodes at all; for
every other one the `!named ||` short-circuit keeps the text regardless.
Task 0 fixed the one literal this exposes.

There is no hybrid carve-out: no kind in any of the three grammars renders
`{{ text }}` while having children.

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs` (`ReadModel`, `read_node`, `read_ts_node`, `read_children`, `read_child_stub`, `widen_to_whole_source`)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`EngineGrammar: ReadModel`; `ParsedTree` holds its grammar)
- Modify: `rust/crates/sittir-core/src/lib.rs` (re-export `ReadModel`)
- Modify: `rust/crates/sittir-core/tests/read_node.rs`, `tests/wire_shape.rs`, `tests/boundary_roundtrip.rs`
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts`
- Create: `packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts`
- Modify: `rust/crates/sittir-{rust,typescript,python}/src/lib.rs`
- Modify: `packages/common/src/readNode.ts`, `packages/common/src/engine.ts`, `packages/types/src/core-types.ts`
- Modify: `packages/rust/tests/tree-identity-and-verbatim.test.ts`
- Modify: `packages/tools/src/validate/from.ts`, `packages/tools/src/validate/common.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: the fold (Task 5), which no longer needs `$text` on structural nodes.
- Produces:
  ```rust
  // read_node.rs
  pub trait ReadModel {
      /// Whether a named node of this kind is captured as text: its template renders from it.
      fn is_text_kind(&self, kind: KindId) -> bool;
      /// Whether `child` is the separator of the `field` slot on a `parent` node.
      fn is_slot_separator(&self, parent: KindId, field: &str, child: KindId) -> bool { let _ = (parent, field, child); false }
  }
  pub fn read_node(
      tree: &tree_sitter::Tree,
      source: &str,
      target: Option<tree_sitter::Node>,
      node_handle: Option<u64>,
      depth: ReadDepth,
      model: &dyn ReadModel,
  ) -> NodeData;
  // engine.rs
  pub trait EngineGrammar: Copy + ReadModel { /* configure_parser, render_module_hash */ }
  // generated kind_ids.rs
  pub fn is_text_kind(kind: KindId) -> bool;
  ```
  Task 7 implements `ReadModel::is_slot_separator` for the three grammars and consumes it in `read_children`.

- [ ] **Step 1: Write the failing core read test**

`rust/crates/sittir-core/tests/read_node.rs` already has `parse_tree` and
`find_first_ts_node_by_kind` helpers and calls
`read_node(&tree, source, node, handle, depth)`. Add a model at the top of
the file and give every existing call the new trailing argument `&AllText`,
so their expectations are unchanged:

```rust
use sittir_core::read_node::ReadModel;
use sittir_core::types::KindId;

/// Every kind is a text kind: the pre-gate behaviour, for the cases that
/// assert on it.
struct AllText;
impl ReadModel for AllText {
    fn is_text_kind(&self, _kind: KindId) -> bool {
        true
    }
}

/// Only the kinds named here are text kinds.
struct TextKinds(Vec<u16>);
impl ReadModel for TextKinds {
    fn is_text_kind(&self, kind: KindId) -> bool {
        self.0.contains(&kind.0)
    }
}
```

and add:

```rust
#[test]
fn structural_nodes_carry_a_span_and_no_text_while_text_kinds_keep_theirs() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let tree = parse_tree(lang, source);
    let identifier = tree.language().id_for_node_kind("identifier", true);
    let model = TextKinds(vec![identifier]);
    let root = read_node(&tree, source, None, Some(0), ReadDepth::Deep, &model);
    let json = serde_json::to_value(&root).expect("serialize");

    fn walk(v: &Value, seen: &mut Vec<(u16, bool, bool)>) {
        if let Some(map) = v.as_object() {
            if let Some(t) = map.get("$type").and_then(Value::as_u64) {
                seen.push((t as u16, map.contains_key("$text"), map.contains_key("$span")));
            }
            for (k, child) in map {
                if k.starts_with('_') || k == "$other" {
                    walk(child, seen);
                }
            }
        } else if let Some(arr) = v.as_array() {
            for c in arr {
                walk(c, seen);
            }
        }
    }
    let mut seen = Vec::new();
    walk(&json, &mut seen);

    let named_structural: Vec<_> = seen
        .iter()
        .filter(|(t, _, _)| *t != identifier && tree.language().node_kind_is_named(*t))
        .collect();
    assert!(!named_structural.is_empty());
    assert!(
        named_structural.iter().all(|(_, has_text, has_span)| !has_text && *has_span),
        "{seen:?}"
    );
    assert!(seen.iter().filter(|(t, _, _)| *t == identifier).all(|(_, has_text, _)| *has_text));
    // Anonymous tokens are never gated: their text is their content.
    let anonymous: Vec<_> = seen.iter().filter(|(t, _, _)| !tree.language().node_kind_is_named(*t)).collect();
    assert!(anonymous.iter().all(|(_, has_text, _)| *has_text), "{seen:?}");
}

#[test]
fn the_root_covers_the_whole_file_by_span_and_carries_no_text() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "\n\n// only a comment\n";
    let tree = parse_tree(lang, source);
    let root = read_node(&tree, source, None, Some(0), ReadDepth::Shallow, &TextKinds(vec![]));
    assert_eq!(root.span.map(|s| (s.start, s.end)), Some((0, source.len() as u32)));
    assert!(root.text.is_none());
}
```

`anonymous_leaf_children_do_not_invent_fields` reads a `closure_parameters`
node, which is a named structural kind, so under the gate it no longer
carries text. Change its last assertion and pass a model that has no text
kinds:

```rust
    let node = read_node(&tree, source, Some(params), Some(0), ReadDepth::Shallow, &TextKinds(vec![]));
    // …the `_|` and `$other` assertions are unchanged…
    assert!(params.get("$text").is_none());
    assert_eq!(
        params.get("$span").and_then(|s| s.get("end")).and_then(Value::as_u64),
        params.get("$span").and_then(|s| s.get("start")).and_then(Value::as_u64).map(|start| start + 2)
    );
```

`is_allowed_node_key` in all three test files keeps `$text` in its allowed
set — leaves still carry it.

- [ ] **Step 2: Run it to see it fail**

Run: `cd rust && cargo test -p sittir-core --test read_node`
Expected: compile error on `read_node`'s arity and on the missing `ReadModel`.

- [ ] **Step 3: Implement the gate**

`read_node.rs` — add near the top:

```rust
/// What the reader needs to know about the grammar it is reading. The
/// reader is otherwise grammar-agnostic; every fact here is generated from
/// the model and stamped, never re-derived from a node's shape.
pub trait ReadModel {
    /// Whether a named node of this kind is captured as text: its template
    /// renders from that text, so the text is the node's content and not a
    /// spelling the template could rebuild.
    fn is_text_kind(&self, kind: KindId) -> bool;
}
```

`read_node`, `read_ts_node`, `read_children` and `read_child_stub` each take
a trailing `model: &dyn ReadModel` and thread it. In `read_ts_node` the
capture becomes:

```rust
    let text = if !named || model.is_text_kind(kind) {
        source.get(byte_range.clone()).map(|s| s.to_string())
    } else {
        None
    };
```

and the comment block above it becomes one sentence: "Text is content only
for anonymous tokens and the kinds whose template renders from it; every
other node is addressed by its span." The `is_leaf` computation stays as it
is — it still decides whether `$other` is emitted.

`read_child_stub` applies the same gate: `text` is the slice only when the
child is anonymous or a text kind.

`read_materialized_leaf` also takes the model and applies the same gate — a
materialized leaf can be a named structural kind with only anonymous
children (rust `closure_parameters` for `||`), and it is addressed by its
span like any other.

`widen_to_whole_source` sets only the span:

```rust
/// Stretch the root's span to cover the entire source.
///
/// tree-sitter's root node starts at the first token, so a leading blank
/// line or indentation falls outside its byte range — and for a source with
/// no tokens at all the range collapses to the end of the file. The root
/// stands for the whole file, and its span is what the coordinate render
/// slices, so anything outside that range would be dropped on the way back
/// out.
fn widen_to_whole_source(root: &mut NodeData, source: &str) {
    root.span = Some(Span {
        start: 0,
        end: source.len() as u32,
    });
}
```

`engine.rs`: make `ReadModel` a supertrait —
`pub trait EngineGrammar: Copy + ReadModel { … }` — replace `ParsedTree`'s
`_grammar: PhantomData<G>` with `grammar: G` (drop the now-unused
`use std::marker::PhantomData;`), set `grammar: self.grammar` in
`Engine::parse`, and pass `&self.grammar` as the model from `read_root` and
`read_child`. The `TestGrammar` in that file's `mod tests` gains
`impl ReadModel for TestGrammar { fn is_text_kind(&self, _: KindId) -> bool { true } }`.

`lib.rs`: `pub use read_node::{ReadDepth, ReadModel};`.

`kind-id-rust.ts` appends after `kind_name_from_id`:

```ts
	const textKindIds = [
		...new Set(entries.filter((entry) => nodeMap.nodes.get(entry.kind)?.modelType === 'pattern').map((entry) => entry.id))
	].sort((a, b) => a - b);
	lines.push('');
	lines.push('/// Whether the reader captures a named node of this kind as text: its');
	lines.push("/// template renders from that text, so the text is the node's content.");
	lines.push('pub fn is_text_kind(kind: KindId) -> bool {');
	lines.push(`    matches!(kind.0, ${textKindIds.length > 0 ? textKindIds.join(' | ') : 'u16::MAX if false'})`);
	lines.push('}');
```

The ids are deduped because aliases put two model kinds on one parser
symbol, and a repeated arm in `matches!` is an `unreachable_patterns` error.
The table is keyed by the id `collectKindEntries` resolved, never by the
model kind name: rust `_outer_block_doc_comment_marker` reaches the tree as
`outer_doc_comment_marker`, and a name-keyed table would miss it.

Each crate's `src/lib.rs` gains, beside its `EngineGrammar` impl:

```rust
impl sittir_core::read_node::ReadModel for RustGrammar {
    fn is_text_kind(&self, kind: sittir_core::types::KindId) -> bool {
        render::kind_ids::is_text_kind(kind)
    }
}
```

(with `TypescriptGrammar` / `PythonGrammar` and their own module paths in
the other two).

- [ ] **Step 4: The emitter test**

Create `packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emitKindIdRust } from '../kind-id-rust.ts';
import { buildNodeMap } from '../../../../tools/src/codegen-surface.ts';

describe('is_text_kind', () => {
	it('names every pattern kind and no token kind', async () => {
		const { nodeMap, generatedIdTables } = await buildNodeMap('rust');
		const source = emitKindIdRust({ grammar: 'rust', nodeMap, generatedIdTables });
		expect(source).toContain('pub fn is_text_kind(kind: KindId) -> bool {');
		const arms = source.slice(source.indexOf('pub fn is_text_kind'));
		const ids = new Set(
			(arms.slice(arms.indexOf('matches!(kind.0,'), arms.indexOf(')\n}')).match(/\d+/g) ?? []).map(Number)
		);
		const idOf = (kind: string) => generatedIdTables.byKind?.[kind];
		// identifier is `pattern`-modeled: free text with nothing else to render from.
		expect(ids.has(idOf('identifier')!)).toBe(true);
		// mutable_specifier is `token`-modeled: it renders its declared literal.
		expect(ids.has(idOf('mutable_specifier')!)).toBe(false);
		// function_item is a branch: it rebuilds from its slots.
		expect(ids.has(idOf('function_item')!)).toBe(false);
	});
});
```

Take the exact import path, the `buildNodeMap` return shape and the
kind→id lookup from a neighbouring emitter test that already builds a real
grammar (`packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
or `render-module-emit.test.ts`), and match it — do not invent a helper.

- [ ] **Step 5: JS side**

`packages/common/src/readNode.ts`: delete `DEBUG_TEXT` and the branch it
guards, so the result's `$text` is `!hasStructure ? node.text() : undefined`;
delete the header comment's last paragraph.

`packages/common/src/engine.ts`: `ParsedRoot` becomes

```ts
/**
 * What a whole-source parse always stamps on its root: the span covering the
 * whole file. The text is the tree's, reachable as `tree.source`; every other
 * read node carries its span only.
 */
export interface ParsedRoot {
	readonly $span: { start: number; end: number };
}
```

`packages/types/src/core-types.ts`: delete the `SITTIR_DEBUG_TEXT` sentence
from `AnyNodeData.$text`'s doc and say instead that `$text` is present on
anonymous tokens and on kinds the grammar models as text.

`packages/rust/tests/tree-identity-and-verbatim.test.ts`: the case that
asserts the root's captured text becomes

```ts
		const { root, tree } = engine.diagnostics.parseAndRead(source);
		expect(root.$span).toEqual({ start: 0, end: source.length });
		expect(tree.source).toBe(source);
```

- [ ] **Step 6: The tools sweep**

One rule at every site: a text-modeled leaf and an anonymous token keep
`$text`; a structural node's text is `tree.source.slice($span.start, $span.end)`.
The sites are enumerated, not searched for:

- `packages/tools/src/validate/from.ts:440` already spells the fallback
  (`readData.$text ?? (readData.$span ? entry.source.slice(...) : '')`).
  Make it the only path: read the span slice, and drop the `$text` branch and
  the comment naming the deleted debug flag.
- `packages/tools/src/validate/common.ts:1819` — the `c.$text !== undefined || c.$other !== undefined` structure probe. `$text` is now absent on every structural node, so this reads as "a leaf or a node with unnamed children"; state that in its doc and leave the expression alone if the reviewer agrees, or key it on `$span` if it was standing in for "is a node".
- `packages/tools/src/validate/common.ts:1984` and `:2125` — both take a node's `$text` as a factory argument. Both are reached only for text-shaped kinds; add the span fallback beside the `?? ''` so a structural node cannot silently contribute an empty string.
- `packages/tools/src/validate/common.ts:2499-2510` and `packages/tools/src/emit/factory-source.ts:87-97, 158` read the `$text` of **anonymous** tokens and of zero-slot leaves. Those keep their text; no change, verified by the tools suite.

Run the tools suite on its own and fix what it names:

```bash
pnpm exec vitest run packages/tools
```

If `node-to-config-promotion.test.ts` or `wrapped-tree-materialization.test.ts`
builds a fixture with `$text` on a structural node, give the fixture a
`$span` and a source string and assert on the span where it asserted on the
captured text.

- [ ] **Step 7: Regenerate, rebuild, suites, gates**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

Expected: green; `validate:history` at or above the baselines; the dogfood
byte fixtures green.

- [ ] **Step 8: Glossary**

`docs/glossary/emitters.md`: add `` ### `packages/codegen/src/emitters/kind-id-rust.ts::is_text_kind` `` — the generated predicate is the model's `pattern` class, keyed by resolved kind id because an alias puts a model kind on a different parser symbol; a `token` kind is absent because its literal is on the model and the transport already defaults to it.

- [ ] **Step 9: Commit**

```bash
git add rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/tests rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs packages/codegen/src/emitters/kind-id-rust.ts packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts packages/common/src/readNode.ts packages/common/src/engine.ts packages/types/src/core-types.ts packages/rust/tests/tree-identity-and-verbatim.test.ts packages/tools/src docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -m "feat(read): text is captured only for pattern kinds; a structural node is addressed by its span

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- rust/crates packages/codegen/src/emitters packages/common packages/types/src/core-types.ts packages/rust packages/typescript packages/python packages/tools/src docs/glossary/emitters.md
```

---

### Task 7: The reader does not seat a slot's separator

Carried in from the typed-render-sink round. `wrap.ts::resolveSlotDrillExprs`
wraps every separated `many` slot in `dropWireDelimiters(…, [<sep ids>])`,
but the wrap pass never runs on the native read path, so the native reader
delivers the field-tagged separator into the slot array: python
`for_in_clause.right` gets its `,`, and typescript `for_statement.condition`
its `;`. Witness at head:
`packages/python/tests/for-in-clause-separator-witness.test.ts` (`it.fails`).

The fix belongs in the reader, not in a second JS pass: the two read paths
must hand back the same wire shape, and the reader now has a model to ask.
The separator fact has one source — the per-value `separator` string on an
`AssembledNonterminal` — and both the wrap expression and the new reader
table are derived from it by one shared function, so there is still one
derivation of "what separates this slot".

**Files:**
- Modify: `packages/codegen/src/emitters/shared.ts` (new `slotSeparatorTexts`)
- Modify: `packages/codegen/src/emitters/wrap.ts` (`separatorIdsExprOf` calls it)
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts` (`SLOT_SEPARATORS`, `is_slot_separator`)
- Modify: `packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts`
- Modify: `rust/crates/sittir-core/src/read_node.rs` (`read_children`)
- Modify: `rust/crates/sittir-{rust,typescript,python}/src/lib.rs`
- Modify: `packages/python/tests/for-in-clause-separator-witness.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `ReadModel` and the generated-table channel (Task 6).
- Produces:
  ```ts
  // packages/codegen/src/emitters/shared.ts
  export function slotSeparatorTexts(f: AssembledNonterminal, elidedOnly: boolean): string[];
  ```
  ```rust
  // generated kind_ids.rs
  pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool;
  ```
  Nothing later consumes these; Task 8 reads the same `slotSeparatorTexts` for the gap token.

- [ ] **Step 1: Flip the witness and add its typescript sibling**

In `packages/python/tests/for-in-clause-separator-witness.test.ts`, change
`it.fails(` to `it(` and rewrite the title:

```ts
	it('renders a deep $text-stripped rebuild of a bare-tuple iterable back to its source', () => {
```

The body is unchanged.

Add the singular sibling as `packages/typescript/tests/for-statement-terminator.test.ts`:

```ts
// The reader must not seat a slot's separator: typescript's
// `for_statement.condition` is field-tagged together with the `;` that
// terminates it, the same shape as python's `for_in_clause.right`.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';

const SOURCE = 'for (let i = 0; i < 3; i++) {}\n';

describe('for_statement.condition', () => {
	it('does not seat its terminator in the slot', () => {
		const engine = createEngine();
		const { root } = engine.diagnostics.parseAndRead(SOURCE, { deep: true });
		const json = JSON.stringify(root);
		expect(json).toContain('_condition');
		const statement = (root as unknown as { _statements: unknown })._statements;
		expect(statement).toBeDefined();
		expect(engine.parse(SOURCE).$render()).toBe(SOURCE);
	});
});
```

- [ ] **Step 2: Run both to see the python one fail**

```bash
pnpm exec vitest run packages/python/tests/for-in-clause-separator-witness.test.ts packages/typescript/tests/for-statement-terminator.test.ts
```

Expected: the python case fails with the comma rendered as an unknown kind id
(it is the defect the `it.fails` recorded). If the typescript case already
passes at head, keep it — it is the regression guard for the sibling shape.

- [ ] **Step 3: One derivation of a slot's separator texts**

In `packages/codegen/src/emitters/shared.ts`:

```ts
/**
 * The literal separator texts a repeated slot's values carry. The one
 * source of "what separates this slot": the wrap layer's drop expression
 * and the reader's separator table are both derived from it, so the two
 * read paths hand back the same shape. `elidedOnly` narrows to the values
 * that may be absent, which is the elidable-list form.
 */
export function slotSeparatorTexts(f: AssembledNonterminal, elidedOnly: boolean): string[] {
	return [
		...new Set(
			f.values
				.filter((v) => (elidedOnly ? v.optionalElement === true : true) && v.separator !== undefined)
				.map((v) => v.separator as string)
		)
	];
}
```

In `packages/codegen/src/emitters/wrap.ts`, `separatorIdsExprOf` calls it:

```ts
function separatorIdsExprOf(
	f: AssembledNonterminal,
	kindEntries: readonly KindEnumEntry[] | undefined,
	elided: boolean
): string | undefined {
	if (!kindEntries) return undefined;
	const sepTexts = slotSeparatorTexts(f, elided);
	if (sepTexts.length === 0) return undefined;
	return `[${sepTexts.map((text) => kindDiscriminantExprForLiteral(text, kindEntries)).join(', ')}]`;
}
```

- [ ] **Step 4: Generate the reader's table**

In `packages/codegen/src/emitters/kind-id-rust.ts`, after `is_text_kind`:

```ts
	const separatorRows: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		const parentId = entries.find((entry) => entry.kind === node.kind)?.id;
		if (parentId === undefined) continue;
		for (const slot of node.slots) {
			if (slot.name === undefined || !isMultiple(slot)) continue;
			const ids = [
				...new Set(
					slotSeparatorTexts(slot, false)
						.map((text) => findEntryForLiteralText(entries, text)?.id)
						.filter((id): id is number => id !== undefined)
				)
			].sort((a, b) => a - b);
			if (ids.length === 0) continue;
			separatorRows.push(`    (${parentId}, ${JSON.stringify(slot.storageName)}, &[${ids.join(', ')}]),`);
		}
	}
	lines.push('');
	lines.push('/// (parent kind id, slot field name, separator kind ids) for every');
	lines.push("/// repeated slot whose separator the parser field-tags into the slot.");
	lines.push('/// The reader drops such a child instead of seating it, so a native read');
	lines.push('/// and a wrapped read hand back the same slot contents.');
	lines.push("static SLOT_SEPARATORS: &[(u16, &str, &[u16])] = &[");
	lines.push(...separatorRows);
	lines.push('];');
	lines.push('');
	lines.push('pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {');
	lines.push('    SLOT_SEPARATORS');
	lines.push('        .iter()');
	lines.push('        .any(|(p, f, seps)| *p == parent.0 && *f == field && seps.contains(&child.0))');
	lines.push('}');
```

with `slotSeparatorTexts` imported from `./shared.ts`, `isMultiple` from the
module the other emitters import it from, and `findEntryForLiteralText` from
`../compiler/generated-metadata.ts`. `slot.storageName` is the name the
reader emits (`_right` comes from tree-sitter's field name `right`), which
is the same string `read_children` has in hand.

Extend `packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts`:

```ts
describe('is_slot_separator', () => {
	it("names a slot's field-tagged separator", async () => {
		const { nodeMap, generatedIdTables } = await buildNodeMap('python');
		const source = emitKindIdRust({ grammar: 'python', nodeMap, generatedIdTables });
		expect(source).toContain('pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {');
		const table = source.slice(source.indexOf('static SLOT_SEPARATORS'), source.indexOf('pub fn is_slot_separator'));
		expect(table).toContain(`(${generatedIdTables.byKind!['for_in_clause']}, "right", &[`);
	});
});
```

(match the `buildNodeMap` / id-lookup spelling to the sibling case added in Task 6).

- [ ] **Step 5: The reader drops it**

`read_node.rs` — add to `ReadModel` (it already carries the defaulted
declaration from Task 6; give it a body in the grammar crates now):

```rust
    /// Whether `child` is the token that separates the `field` slot's items
    /// on a `parent` node. Such a token is punctuation the template
    /// re-emits, not a slot member, so the reader drops it rather than
    /// seating it beside the items.
    fn is_slot_separator(&self, parent: KindId, field: &str, child: KindId) -> bool {
        let _ = (parent, field, child);
        false
    }
```

In `read_children`, take the parent's kind once and skip the separator:

```rust
    let parent_kind = stamped_kind(&node);
    // …inside the child loop, after `let field_name = …`:
        if let Some(name) = field_name.as_deref() {
            if !child.is_named() && model.is_slot_separator(parent_kind, name, stamped_kind(&child)) {
                continue;
            }
        }
```

The `!child.is_named()` guard keeps this to anonymous punctuation: a
separator is always an anonymous literal token, and a named child that
happens to share a kind id with one must still be seated.

Each crate's `src/lib.rs` `ReadModel` impl gains:

```rust
    fn is_slot_separator(
        &self,
        parent: sittir_core::types::KindId,
        field: &str,
        child: sittir_core::types::KindId,
    ) -> bool {
        render::kind_ids::is_slot_separator(parent, field, child)
    }
```

- [ ] **Step 6: Regenerate, build, suites, gates**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

Expected: the python witness passes as `it`; `validate:history` at or above
the previous task's numbers — the reader now hands back the shape wrap
always produced, so a deep read of a separated slot can only get closer to
its source.

- [ ] **Step 7: Glossary**

`docs/glossary/emitters.md`: add `` ### `packages/codegen/src/emitters/shared.ts::slotSeparatorTexts` `` (the one source of a slot's separator literals; the wrap drop expression and the reader table are both derived from it) and `` ### `packages/codegen/src/emitters/kind-id-rust.ts::is_slot_separator` ``; update `` ### `packages/codegen/src/emitters/wrap.ts::separatorIdsExprOf` `` to say it now formats what `slotSeparatorTexts` derives.

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/emitters/shared.ts packages/codegen/src/emitters/wrap.ts packages/codegen/src/emitters/kind-id-rust.ts packages/codegen/src/emitters/__tests__/kind-id-rust.test.ts rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-rust/src/lib.rs rust/crates/sittir-typescript/src/lib.rs rust/crates/sittir-python/src/lib.rs packages/python/tests/for-in-clause-separator-witness.test.ts packages/typescript/tests/for-statement-terminator.test.ts docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -m "fix(read): a slot's field-tagged separator is punctuation, not a member

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- packages/codegen/src/emitters rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-rust rust/crates/sittir-typescript rust/crates/sittir-python packages/python packages/typescript docs/glossary/emitters.md packages/rust
```

---

### Task 8: A rebuilt list takes its class from the gaps between its coordinates

Spec Gate 8: a parsed block with blank lines between its statements keeps
them after one statement is appended, and a comma list spelled `a,b,c` stays
tight after an item is replaced. The classifier from Task 2 already measures
across a replaced item using the surviving neighbours; this task calls it
from the generated `prepare`, before the option table fills the site.

Precedence for any list site: the value the wire carried, then the class of
the source gaps, then the engine's option table, then the grammar's default.

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (`prepareStructImpl`; new `listGapSitesOf`, `listGapTokenOf`)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
- Create: `packages/typescript/tests/coordinate-gaps.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `::sittir_core::classify::classify_list_gaps`, `options::allowed`, `options::WHITESPACE`, `SlotValue::coord`, `ctx.sources`, `slotSeparatorTexts`.
- Produces, inside a generated `prepare` for a kind with list sites on slot `elements`:
  ```rust
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.elements.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ",", options::allowed(options::SITE_X_ELEMENTS_SEPARATOR_SPACE_BEFORE), options::allowed(options::SITE_X_ELEMENTS_SEPARATOR_SPACE_AFTER), &options::WHITESPACE);
            if self.elements_separator_space_before.is_none() { self.elements_separator_space_before = before; }
            if self.elements_separator_space_after.is_none() { self.elements_separator_space_after = after; }
        }
  ```
  emitted after the children's `prepare` calls and before the `get_or_insert` table fills. No later task consumes it.

- [ ] **Step 1: Write the failing emitter test**

In `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, in
the same `describe` the Task 4 cases went into:

```ts
	it('classifies a rebuilt list from the gaps between its coordinates before the table fills it', async () => {
		const transportRs = await getRustTemplatesRs();
		const from = transportRs.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsElementsTransport {');
		expect(from).toBeGreaterThan(-1);
		const body = transportRs.slice(from, transportRs.indexOf('\n}\n', from));
		expect(body).toContain('::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ","');
		expect(body).toContain('&options::WHITESPACE)');
		expect(body.indexOf('classify_list_gaps')).toBeGreaterThan(body.indexOf('.prepare(ctx)?;'));
		expect(body.indexOf('classify_list_gaps')).toBeLessThan(body.indexOf('.get_or_insert(ctx.options.spacing['));
	});
```

`ArgumentsElementsTransport` is the rust `_arguments_elements` list carrier —
a comma-separated `many` slot with `SITE_ARGUMENTS_ELEMENTS_ELEMENT_SEPARATOR_SPACE_BEFORE`
and `…_AFTER` in `options.rs`. Confirm the struct name before writing the
test:

```bash
awk 'index($0,"ArgumentsElementsTransport {")>0 {print FNR": "$0}' rust/crates/sittir-rust/src/render/transport.rs | head
```

If the name differs, use the one head has — the assertions are about the
emitted block, not about that kind.

- [ ] **Step 2: Write the failing behaviour test**

Create `packages/typescript/tests/coordinate-gaps.test.ts`:

```ts
// A rebuilt node whose list items are still coordinates renders the class
// its source spelled, by majority, in place of the engine's option. Gate 8:
// blank lines survive an append, and a tight comma list survives a replace.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';

describe('gaps between coordinates', () => {
	it('keeps the blank lines a parsed block spelled when a statement is appended', () => {
		const engine = createEngine();
		const source = 'function f() {\n  a();\n\n  b();\n\n  c();\n}\n';
		const fn = engine.parse(source).statements()[0] as {
			body(): {
				$with: { statements(v: readonly unknown[]): unknown };
				statements(): readonly unknown[];
			};
		};
		const body = fn.body();
		const rebuilt = body.$with.statements([
			...body.statements(),
			ir.expressionStatement(ir.callExpression({ function: ir.identifier('d'), arguments: ir.arguments([]) }))
		]);
		const text = engine.render(rebuilt as never).toString();
		expect(text).toContain('a();\n\n  b();\n\n  c();\n\n  d();');
	});

	it('keeps a tight comma list tight when an argument is replaced', () => {
		const engine = createEngine();
		const call = (
			engine.parse('f(a,b,c);\n').statements()[0] as {
				expression(): {
					arguments(): {
						$with: { elements(v: readonly unknown[]): unknown };
						elements(): readonly unknown[];
					};
				};
			}
		)
			.expression()
			.arguments();
		const [a, , c] = call.elements();
		const rebuilt = call.$with.elements([a, ir.identifier('x'), c]);
		expect(engine.render(rebuilt as never).toString()).toBe('(a,x,c)');
	});
});
```

The accessor and factory names follow the generated typescript surface.
Print them before writing the file and adjust the navigation — never the
expected strings:

```bash
awk 'index($0,"function wrapArguments(")>0, /^}/' packages/typescript/src/wrap.ts
awk 'index($0,"function wrapCallExpression(")>0, /^}/' packages/typescript/src/wrap.ts
awk 'index($0,"function wrapStatementBlock(")>0, /^}/' packages/typescript/src/wrap.ts
awk 'index($0,"callExpression")>0 {print FNR": "$0}' packages/typescript/src/ir.ts | head
```

- [ ] **Step 3: Run both to see them fail**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/typescript/tests/coordinate-gaps.test.ts
```

Expected: the emitter case fails (no `classify_list_gaps` in the body); the
behaviour cases fail — the blank lines collapse to the option's newline and
the comma list picks up the option's space.

- [ ] **Step 4: Emit the classification**

In `packages/codegen/src/emitters/render-module.ts` add, beside
`separatorSiteOf`:

```ts
function listGapSitesOf(
	plan: RenderPlan,
	node: AssembledNode,
	slot: string
): { readonly before?: SpacingSite; readonly after?: SpacingSite; readonly gap?: SpacingSite } {
	const kind = publicKindName(node.kind);
	const of = (side: SpacingSide) =>
		plan.spacingSites.find((s) => s.kind === kind && s.slot === slot && s.side === side && s.seat === undefined);
	return { before: of('before'), after: of('after'), gap: of('gap') };
}

/**
 * The one literal that separates this slot's items, or `undefined` when the
 * slot has none or has several — a choice separator is per instance, so the
 * bytes around it are not one site's spelling.
 */
function listGapTokenOf(field: AssembledNonterminal): string | undefined {
	const texts = slotSeparatorTexts(field, false);
	return texts.length === 1 ? texts[0] : undefined;
}
```

with `slotSeparatorTexts` imported from `./shared.ts` and `SpacingSide` from
`../compiler/model/site-preferences.ts` (this file already imports
`publicKindName` from there).

In `prepareStructImpl`, between the children's `prepare` lines and the site
fills:

```ts
		const slotModel = renderSlotModelOf(node);
		for (const field of [...slotModel.named, ...slotModel.unnamed]) {
			if (field.name === undefined || !isMultiple(field)) continue;
			const sites = listGapSitesOf(plan, node, field.name);
			const first = sites.gap ?? sites.before;
			if (first === undefined && sites.after === undefined) continue;
			const token = sites.gap !== undefined ? '' : listGapTokenOf(field);
			if (token === undefined) continue;
			const ident = rustFieldIdent(field.storageName);
			const items = isRequired(field) ? `self.${ident}.iter()` : `self.${ident}.as_deref().unwrap_or(&[]).iter()`;
			const each = hasOptionalElements(field) ? 'item.as_ref().and_then(|i| i.coord())' : 'item.coord()';
			const allowedOf = (site: SpacingSite | undefined) =>
				site === undefined ? '&[]' : `options::allowed(options::${site.constName})`;
			body.push(
				`        {`,
				`            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = ${items}.map(|item| ${each}).collect();`,
				`            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ${JSON.stringify(token)}, ${allowedOf(first)}, ${allowedOf(sites.after)}, &options::WHITESPACE);`
			);
			if (first !== undefined) {
				const f = rustFieldIdent(first.fieldIdent);
				body.push(`            if self.${f}.is_none() { self.${f} = before; }`);
			} else {
				body.push(`            let _ = before;`);
			}
			if (sites.after !== undefined) {
				const a = rustFieldIdent(sites.after.fieldIdent);
				body.push(`            if self.${a}.is_none() { self.${a} = after; }`);
			} else {
				body.push(`            let _ = after;`);
			}
			body.push(`        }`);
		}
```

`renderSlotModelOf`, `isMultiple`, `isRequired`, `hasOptionalElements` and
`rustFieldIdent` are already in scope in this file — `seatLoops` uses the
same four to walk a kind's repeated slots.

- [ ] **Step 5: Type-check, regenerate, build, run**

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
cd rust && cargo build --workspace && cargo test --workspace --exclude sittir-parity-tests
```

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

Expected: green; `validate:history` at or above the previous task's numbers.
The three dogfood byte fixtures are unchanged: they build from factories,
where no item has a coordinate and every site falls through to the table
exactly as before. A dogfood byte diff here means a factory-built list took
a class from somewhere — a finding, not a fixture to update.

- [ ] **Step 6: Glossary**

`docs/glossary/emitters.md`: add `` ### `packages/codegen/src/emitters/render-module.ts::listGapSitesOf` `` and `` ### `packages/codegen/src/emitters/render-module.ts::listGapTokenOf` ``; extend `prepareStructImpl`'s entry with the body order — children, then gap classification, then the table — and why: a class taken from the source must beat the table and lose to the wire.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/typescript/tests/coordinate-gaps.test.ts docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
git commit -m "feat(render): a rebuilt list classifies the gaps between its still-parsed items into option values

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- packages/codegen/src/emitters packages/typescript docs/glossary/emitters.md packages/rust packages/python rust/crates/sittir-rust/src/render rust/crates/sittir-typescript/src/render rust/crates/sittir-python/src/render
```

---

### Task 9: The gates the counts cannot see, the measurements, and the handoff

Three spec gates are only reachable here — 5 (wire size), 6 (a coordinate
minted by one engine is refused by another), and the byte axis the
validator's counts are blind to. Plus the two carried-in measurements: the
validator's deep-read kind set, and where render time goes now that fewer
objects cross.

**Files:**
- Create: `packages/rust/tests/coordinate-engine-identity.test.ts`
- Modify: `packages/tools/tests/emit/dogfood-render-bytes.test.ts`
- Modify: `docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md` (status line; the wire table gains a measured "after" column)
- Create: `docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md`
- Memory: update `project_render_options_design_state.md`, add `project_source_coordinates.md`

- [ ] **Step 1: A coordinate names its engine**

Create `packages/rust/tests/coordinate-engine-identity.test.ts`:

```ts
// A coordinate names a tree by the tag its engine minted. Rendering it
// through another engine is refused with the handle in the error — never
// answered from whatever tree happens to sit at that index over there.
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

	it('renders the same node through its own engine', () => {
		const reader = createEngine();
		const item = reader.parse('fn real() {}').statements()[0];
		expect(reader.render(item as never).toString()).toBe('fn real() {}');
	});
});
```

Run: `pnpm exec vitest run packages/rust/tests/coordinate-engine-identity.test.ts`
Expected: green — Task 4 made `CoordinateError::UnknownTree` the outcome and
its `Display` writes "names tree {tree_id}". This test pins it.

A disposed-tree case is optional: it needs a handle to `disposeTree` on the
same engine the wrapped node renders through, and
`tree-identity-and-verbatim.test.ts` shows the `getActiveBackend()` route to
one. Gate 6 is satisfied by the cross-engine case alone.

- [ ] **Step 2: A byte axis beside the counts**

`validate:history` compares AST shape, never bytes, on the read path — which
is why python's indentation escalation and the dropped separator both
survived it. Extend
`packages/tools/tests/emit/dogfood-render-bytes.test.ts` from
factory-rebuild-vs-fixture to a second axis, read → render vs source, over
the same three files:

```ts
const READ_CASES = [
	['rust', '@sittir/rust', 'rust/crates/sittir-core/src/render.rs'],
	['typescript', '@sittir/typescript', 'packages/common/src/transport-data.ts'],
	['python', '@sittir/python', 'examples/dogfood.py']
] as const;

describe('read then render is byte-exact', () => {
	for (const [grammar, pkg, file] of READ_CASES) {
		it(`${grammar}: a shallow and a deep read of ${file} both render its bytes`, async () => {
			const { createEngine } = (await import(pkg)) as { createEngine: () => any };
			const source = readFileSync(ROOT + file, 'utf8');
			const engine = createEngine();
			expect(engine.parse(source).$render()).toBe(source);
			expect(engine.parse(source, { deep: true }).$render()).toBe(source);
		});
	}
});
```

Confirm each path exists and pick a real python source file before writing
the block:

```bash
ls examples/*.py packages/python/tests 2>/dev/null | head
```

If a case does not hold byte-for-byte, do **not** weaken it to a substring
check. Record the exact first differing byte offset and the two spellings in
the handoff, mark that one case `it.fails` with a title naming what differs,
and report — an `it.fails` witness beside a green axis is the record the
counts cannot keep.

- [ ] **Step 3: Review the validator's deep-read kind set**

`read-render-parse.ts` deep-reads only the kinds that participate in
`variant()` adoption, "to preserve baseline rtPass numbers"; every other kind
took the shallow `$text` short-circuit, which no longer exists. Measure
whether the narrowing still buys anything:

```bash
pnpm exec tsx packages/cli/src/cli.ts tool --help
```

then run `validate:native` once with the deep set as it is and once with the
narrowing removed (deep-read every candidate kind), and record both triples
of numbers. Do not change the default in this task: report the two numbers
and the recommendation in the handoff. If removing the narrowing does not
lower any count, say so plainly — that makes it a one-line follow-up rather
than an open question.

- [ ] **Step 4: Measure the wire**

In the scratchpad, a script that parses the first 8 KB of
`rust/crates/sittir-core/src/engine.rs` shallow and deep through
`@sittir/rust`'s `createEngine().diagnostics.parseAndRead`, and prints
`JSON.stringify(root).length` plus the byte total of every `$text` value
found by walking `_`-keys and `$other`, splitting that total into text on
named structural kinds and text elsewhere. Record the four numbers as an
"after" column beside the spec's table. Expected shape: structural `$text`
is 0 on both reads, and the deep read's wire is roughly 23 % smaller.
Record the measured number, not the estimate.

- [ ] **Step 5: Measure the throughput share**

`Cargo.lock` is tracked and napi-rs is pinned at 3.12.4, so a sampled
profile is comparable across builds for the first time. Re-run the same
instrument the sink round used — `sample`, 8 s at 1 ms — on a
read → render workload (parse a file, then render the root repeatedly) and
record `SlotValue<…>::from_napi_value`'s share against the 98.7 % baseline
the sink handoff recorded for a factory-render workload. Also run:

```bash
BENCH_ITERATIONS=200 pnpm exec tsx packages/cli/src/cli.ts tool bench
```

three times, and report renders/sec per grammar against the pinned-napi
baseline (rust 164k / typescript 164k / python 175k, single run).

State in the handoff whether "render by tree handle against a resident
native tree" is still the throughput lever, or whether folding an unedited
subtree to one coordinate has already removed most of the objects that
crossing was paying for. This is a measurement, not an implementation: the
spec's gates do not name throughput, and inventing a task here would exceed
it.

- [ ] **Step 6: Full gates once more**

```bash
pnpm exec vitest run
```

```bash
for g in typescript rust python; do SITTIR_NATIVE_DEBUG=0 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```

```bash
pnpm run validate:native && pnpm run validate:history
```

```bash
bash scripts/comment-slop-check.sh --working
```

```bash
pnpm exec tsx packages/cli/src/cli.ts tool propose-14
```

- [ ] **Step 7: The spec and the handoff**

Set the spec's status line to `**Status:** Realized`, and add the measured
"after" column to its wire-size table. Correct the two places the spec's
own text is now behind the implementation:

- the fold's wording — the node that emits a coordinate needs its handle and its span; a descendant needs only its span, because a deep read stamps no handle below the root;
- `markEdited` stays and detaches the coordinate rather than the text.

Write `docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md`:
what landed per task, the measured wire numbers, the throughput share, the
validate numbers before and after, the deep-kind-set recommendation, the
byte-axis result (including any `it.fails` witness it left), and what is
next — plan 4 of render options (`reformat`, `engine.ir`, `tree.inferOptions()`
from classified gaps); per-tree render format is still out of scope, and
`render_transport_parts` still hardcodes `TransportSource::Factory`.

- [ ] **Step 8: Commit**

```bash
git add packages/rust/tests/coordinate-engine-identity.test.ts packages/tools/tests/emit/dogfood-render-bytes.test.ts docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md
git commit -m "docs(provenance): source coordinates realized; engine identity gate, byte axis, measured wire

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GXSJTsC4QVWJNu8wXmMQrn" -- packages/rust/tests/coordinate-engine-identity.test.ts packages/tools/tests/emit/dogfood-render-bytes.test.ts docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md docs/superpowers/handoffs/2026-09-11-source-coordinates-handoff.md
```

---

## Self-review

**1. Spec coverage.**

| Spec section / gate | Task |
| --- | --- |
| `$text` means slot content only | 6 (reader gate), 4 (compound field dropped) |
| Provenance becomes a coordinate (`$nodeHandle` + `$span`) | 1 |
| An edit detaches the coordinate | 5 (`markEdited`) |
| The readers converge; `SITTIR_DEBUG_TEXT` deleted | 6 |
| One rule at the transport: unread and unedited fold alike | 5 (fold), 4 (coordinate-key strip) |
| Carrier: `SlotValue::{Coord, Transport}`, `Node`/`Verbatim` gone | 1 (arm added), 4 (arms removed) |
| `VerbatimTransport` returns; free text elsewhere is an error | 4 |
| Transports drop `$span`, `$nodeHandle`, `$childIndex`, `$source`, `$named` | 4 |
| Coordinates resolve in one walk; context is an argument | 2 (walk), 4 (wired from `napi_engine`) |
| Gaps classify into option values, precedence wire → gaps → table → default | 2 (classifier), 8 (emission) |
| Coordinates must name their engine | 4 (`UnknownTree`), 9 (gate) |
| Coordinates are not portable; unresolvable is a loud error | 1 (`resolve`), 2 (walk refuses before the render) |
| End state: root keeps whole-file coverage as span | 6 (`widen_to_whole_source`) |
| End state: `hasStructure` / `_isReadTextLeaf` / `slot.rs` judgement collapse | 5 (`isNode`, the wrap gate, the fold), 4 (`slot.rs` shape dispatch) |
| Hybrid kinds | R1 — the class is empty at head, verified by census; no carve-out |
| Gate 1 read-render-parse byte-exact | 9 step 2 |
| Gate 2 verbatim round trip | every task's `pnpm exec vitest run` |
| Gate 3 deep == shallow | 5 (fold), pinned in `read-depth.test.ts` and 9 step 2 |
| Gate 4 factory-render-parse unchanged | every task's `validate:history` |
| Gate 5 wire size measured | 9 step 4 |
| Gate 6 cross-engine refusal | 9 step 1 |
| Gate 7 shape-directed dispatch, no fallback | 4 step 3 |
| Gate 8 rebuilt list takes its gaps' class | 2 (contract + tests), 8 (behaviour) |
| Gate 9 nothing ambient | 2 (`RenderContext` signature), Global Constraints |
| Gate 10 full suite + `validate history` | every task |
| Carried in (a) native separator drop | 7 |
| Carried in (b) byte axis + deep kind set | 9 steps 2–3 |
| Carried in (c) blank lines between statements | 8 (coordinate case); the factory-rebuild case is a grammar option-default gap, named in the handoff, not this plan's scope |
| Carried in (d) fast path returns before `w.dedent()` | 4 (removal + debug-build test) |
| Carried in (e) depth tokens read the kind, not a sentinel default | 4 |
| Carried in (f) the two dedent routes | 3 |
| Carried in (g) throughput after the fold | 9 step 5 |
| Prerequisite: `unit_expression` / `unit_type` literal | 0 |

Out of scope, as the spec says: per-tree render format, whether `$span`
stays on text-modeled kinds, the seam classifier and the adjacency mark.

**2. Placeholder scan.** No "TBD", no "add error handling", no "similar to
Task N", no test described without its code. Three steps ask the implementer
to print a name from head before writing a test (Task 8's typescript
accessors, Task 8's rust list-carrier struct name, Task 6's `buildNodeMap`
spelling); each gives the exact command and says to adjust the navigation,
never the expectation. Task 4 step 7 asks for the two python transport
structs' fields for the same reason. Those are verification steps, not
placeholders: the assertion each test makes is fully written.

**3. Type consistency.** One spelling of each name across all ten tasks:
`NodeCoordinate::{new, tree_id, resolve}` with `handle` and `span` fields;
`SourceTable::source_of(tree_id) -> Option<&Arc<str>>`;
`CoordinateError::{UnknownTree { handle, tree_id }, BadSpan { handle, detail }}`;
`RenderError::Coordinate`; `RenderSink::slice(&NodeCoordinate) -> RenderResult`
and `RenderSink::dedent(&mut self, seam: &str)`;
`SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE).with_indent(indent).with_sources(sources)`
— two arguments to `new`, the table and the indent as builder calls, exactly
as head spells it;
`Prepare::prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>`;
`RenderContext { options, sources }`;
`classify_whitespace(ws, allowed, table)`, `split_gap(gap, token)`,
`majority(classes)`,
`classify_list_gaps(items, sources, token, allowed_before, allowed_after, table)`
— the table is `&WhitespaceTable`, never a `text_of` fn plus a sentinel
sniff, because `spacing_text` already maps both depth arms to a plain break;
`options::allowed(site) -> &'static [u16]` reading `SPACING_SITES[site].4`;
`render_transport_dispatch(&dyn Render, &RenderContext)`;
`render_transport_parts(RenderRoot, &RenderContext) -> Result<(TransportSource, String), RenderError>`;
`ReadModel::{is_text_kind, is_slot_separator}` with `EngineGrammar: Copy + ReadModel`;
`kind_ids::{is_text_kind, is_slot_separator}`;
`slotSeparatorTexts(field, elidedOnly)` shared by `separatorIdsExprOf`,
`is_slot_separator`'s table and `listGapTokenOf`;
`wordCharClass(wordMatcher)` shared by `wordCharAsciiTable` and
`collectFixedLiteral`;
`markEdited` detaching `$nodeHandle`, `$span`, `$childIndex`;
`stripStructuralProvenance` replacing `stripStructuralNodeText`.
Per-slot enums are `<Owner><Slot>TransportSlot` (`perSlotEnumName` suffixes
`TransportSlot`), which is why Task 4's assertions name
`FunctionItemNameTransportSlot` and `MacroDefinitionContentTransportSlot`.

---

## Pre-flight

One row per task pair that shares a file or an interface.

| Pair | Produces | Consumes | Verdict |
| --- | --- | --- | --- |
| 0 → 6 | model literal `"()"` on rust `unit_expression` / `unit_type` | token kinds stop shipping `$text` and render `literalText` | consistent — 0 must land first, or the reader change shows the seam leak as an unexplained byte diff |
| 0 → 0 | `wordCharClass` in `util/word-matcher.ts` | `emitters/shared.ts::wordCharAsciiTable`, `dsl/rule-patterns.ts::collectFixedLiteral` | consistent — one predicate, two call sites; `shared.ts` already imports from that module |
| 1 → 2 | `NodeCoordinate::{tree_id, resolve, span, handle}`, `SourceTable`, `CoordinateError`, `pub encode_handle` | `tests/prepare.rs`, `tests/classify.rs`, `prepare.rs`, `classify.rs` | consistent — `decode_handle` is already `pub`; `encode_handle` becomes `pub` in Task 1 |
| 1 → 3 | `RenderSink` with a defaulted `slice` | Task 3 changes `dedent`'s signature on the same trait | consistent — disjoint methods; Task 3 lands after Task 1 so `slice` already exists |
| 1 → 4 | `SlotValue::Coord` beside `Node`/`Verbatim`; `SpacingWriter::with_sources` | Task 4 deletes the two old arms and emits `.with_sources(ctx.sources)` | consistent — the generated crates keep compiling through Tasks 1–3 because both old arms survive |
| 2 → 4 | `Prepare`, `RenderContext`, `ParsedTree.source: Arc<str>`, `SourceTable for HashMap<u32, ParsedTree<G>>` | emitted `Prepare` impls; `napi_engine::render` builds `RenderContext { options, sources: &self.trees }` | consistent — `self.trees` is exactly that `HashMap` in the napi macro |
| 2 → 8 | `classify_list_gaps(items, sources, token, allowed_before, allowed_after, &WhitespaceTable)` | emitted call with `&options::WHITESPACE` | consistent — `WHITESPACE` is a `const WhitespaceTable` in every generated `options.rs` |
| 2 → 8 | `classify_list_gaps` skips non-coordinate items and measures across them | Gate 8's replaced-middle-element case | consistent — this is the R3 contract, pinned by `a_replaced_item_is_measured_across_by_its_surviving_neighbours` |
| 2, 6 → `engine.rs` | Task 2: `source: Arc<str>` + `SourceTable`; Task 6: `grammar: G` replaces `PhantomData`, `EngineGrammar: ReadModel` | both edit `ParsedTree` and both edit `read_root` / `read_child` | consistent, ordered — Task 6 rebases its snippet onto Task 2's struct rather than pasting over it |
| 3 → 4 | `RenderSink::dedent(&mut self, seam: &str)`; `literalWrite` emits `w.dedent("\n")` | Task 4's assertion `{ w.dedent("\\n"); Ok::<…>(()) }` | consistent |
| 4 → 5 | `Coord` on `$nodeHandle`; `projectValue` strips the coordinate keys from storage-bearing nodes | Task 5 adds the fold and `markEdited` on top of that `projectValue` | consistent — this is the R4 split; Task 4 keeps the numbers identical, Task 5 is allowed to raise them |
| 4 → 8 | `prepareStructImpl(structName, node, fillFields, plan, isCompound, nodeMap)` with children prepared first | Task 8 inserts the classification block into the same function, between children and site fills | consistent — Task 8 derives its slots from `renderSlotModelOf(node)`, not from `fillFields` (which is a list of Rust field identifiers) |
| 4 → 9 | `CoordinateError::UnknownTree`'s message "names tree {tree_id}" | `toThrow(/names tree 0/)` | consistent |
| 5 → 6 | the fold no longer needs `$text` on structural nodes | the reader stops emitting it | consistent, ordered — fold first, reader second, so no window exists where a fold needs text that is gone |
| 5 → 6 | `stripStructuralProvenance` | the tools sweep touches two of the same files (`validate/read-render-parse.ts`, `probe/kind.ts`) | consistent — Task 5 renames the call, Task 6 changes what a structural node's text is read from; different lines |
| 6 → 7 | `ReadModel` with `is_slot_separator` defaulted to `false`; the generated-table channel in `kind-id-rust.ts` | Task 7 fills the default in and adds `SLOT_SEPARATORS` | consistent |
| 7 → 8 | `slotSeparatorTexts(field, elidedOnly)` in `emitters/shared.ts` | `listGapTokenOf` reads it for the gap's token | consistent — one derivation of a slot's separator serves wrap, the reader table and the classifier |
| 6, 7 → `read_node.rs` | Task 6: the model argument and the text gate; Task 7: the separator skip in `read_children` | both edit `read_children` | consistent, ordered — Task 6 threads the model, Task 7 asks it a second question |
| 4, 5 → `transport-data.ts` | Task 4: the coordinate-key strip in `projectValue`; Task 5: `foldsToCoordinate`, `isUntouchedBelow`, `asCoordinate`, `markEdited` | Task 5 replaces the fold branch and leaves Task 4's strip alone | consistent — named explicitly in Task 5 step 3 |
