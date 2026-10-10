# Line Endings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A render spells every line break with one line-ending preference, `render: { layout: { newline: '\n' | '\r\n' | '\r' } }`. The `newline` whitespace member owns that preference, and `blankline` and `double_blankline` are repeated references to it, so no break is spelled anywhere else.

**Architecture:** The model declares the line-ending arms once, on `_newline` in the whitespace vocabulary. `_blankline` is `seq(_newline, _newline)` and `_double_blankline` is `seq(_newline, _newline, _newline)`, references that keep `_newline`'s preference. Everything downstream of the model stays in one internal spelling: the node map, the generated `spacing_text` and the spacing writer all see each member's canonical text, where a break is `'\n'`. Where source whitespace enters the writer, its breaks are normalized to that spelling. A `LineEndings<W>` `fmt::Write` adapter at the end of every root render then writes each logical break (`\r\n`, `\r` or `\n`, including one split across two text pieces) as the preferred ending. The layout table (the width setting) will flatten into the same adapter later, so neither the writer nor the table knows about line endings.

**Tech Stack:** TypeScript (`@sittir/codegen` DSL and emitters, `@sittir/types`), Rust (`sittir-core`: `spacing`, `classify`, `options`, `engine`, a new `line_endings` module), vitest and cargo.

**Spec:** `docs/superpowers/specs/2026-09-09-preference-address-design.md`, section "Amendment: references inherit preferences (2026-10-07)" and its 2026-10-08 addendum (written with this plan). Read the amendment, then `docs/superpowers/specs/2026-09-04-render-options-design.md` for how `indent` reaches the writer: `newline` takes the same path.

## Rulings (user, 2026-10-08)

1. The option is `render: { layout: { newline } }`, text-valued like `indent`, one of `'\n' | '\r\n' | '\r'`, typed from `_newline`'s arms. It is accepted per engine and per call. Default `'\n'`.
   - The `layout` group (ruled 2026-10-09) holds every whole-render layout setting: `indent` and `newline` now, and the width setting's `width` and `breaking` when they land. `indent` moves from `render.indent` to `render.layout.indent` in Task 4, with no alias at the old key.
2. Every line break in the output takes the preference: the writer's breaks, and the breaks inside source slices, comments and literals. A render has one line ending. This is safe for rust, typescript and python, because none of them lets a CR or CRLF inside a literal carry meaning:
   - rust normalizes CRLF to LF before lexing and refuses a bare CR in any string literal, raw ones included;
   - a JavaScript string literal cannot hold an unescaped line terminator (only a line continuation, which adds nothing to the value), and template literals normalize CR and CRLF to LF in both their cooked and raw values;
   - python reads source with universal newlines, so CR and CRLF are LF before it tokenizes.
3. The line ending is global. There is no per-site override, and the amendment's "explicit site overrides" test does not apply to it (recorded in the addendum).
4. It is applied by a `fmt::Write` adapter at the end of every root render. The `Output` trait stays the width setting's first stage.
5. `blankline` and `double_blankline` stay named members, with their arm names unchanged, defined as two and three references to `newline`. There is no general whitespace-count primitive.
6. Inferring a tree's own line ending is out of scope here. It belongs to the layout-inference design (the width-setting note), which supplies the value this plan's option takes.

## What exists, and what this plan builds on

- **The whitespace vocabulary.** `packages/codegen/src/dsl/whitespace.ts` lists `WHITESPACE_MEMBERS`, each with a fixed `STRING` body (`_newline` `'\n'`, `_blankline` `'\n\n'`, `_double_blankline` `'\n\n\n'`). `enrichWhitespace` admits a member when the grammar's extras run matches its text, and returns the `bodies` that `withEnrichedWhitespace` (`dsl/wire/wire.ts`) merges into `visibleExternals:`.
- **Nothing parses these members.** In `grammar.json` the members are externals that no scanner emits, so tree-sitter never reads their bodies. The one exception is python: there `_newline` is its scanner's own token, and its extras already accept `\r?\n`. That makes "parser lowering keeps CRLF as one break" a property of the render side. The census found the one parser-side case that matters: python's comment pattern `#.*` swallows the `\r` of a CRLF line, so the break after a comment arrives as `"\r"` inside the comment's text plus `"\n"` outside it.
- **Downstream reads members as fixed text.** The node map treats each member as a fixed-text leaf: `lineBreakingKinds` and `indentChars` (`compiler/model/layout-kinds.ts`) read `node.text`. Each grammar crate emits `spacing_text(kind)` (`render/options.rs`), and the writer ranks a seam by counting `'\n'` (`seam_rank`, `sittir-core/src/spacing.rs`). Nothing in `sittir-core` handles `'\r'`. A CRLF gap already counts as one break, because it holds one `'\n'`. A lone CR counts as none.
- **How `indent` flows, which `newline` copies.**
  - Rust: `OptionTables.indent_chars` → `Options.indent` (`Options::read` reads the `"indent"` key) → validated in `resolve` → `ResolvedOptions.indent` → `SpacingWriter::with_indent`.
  - TypeScript: the generated options module emits `IndentChar`; `IndentOption<I, IndentChar>` in `packages/types/src/options.ts` adds the key; `DerivedOptions` and the engine emitter (`emitters/engine.ts`) carry it.
  - Test model: `packages/rust/tests/indent-option.test.ts`.
- **Where a root render ends.** One site: the napi `render` macro (`sittir-core/src/napi_engine.rs`). It resolves the call's options against the engine's (`opts.resolve(self.engine.options())`), builds a `RenderContext { options, sources }`, and `$render_parts(transport, &ctx)` returns `(source, canonical)`; the canonical text then passes through `apply_render_format(source, canonical, engine_format, tree_format)` (`sittir-core/src/engine.rs`). `render_to_file` renders through `render`. The generated `render_transport_dispatch(transport, ctx)` writes into a `String` before that. No other caller of `apply_render_format` exists outside its own tests.

## Global Constraints

- Branch `feat/line-endings` from the current `origin/master` (the typed reader's 1c-i has merged; Tasks 3 and 4 build on the `RenderContext` shape it left in `napi_engine.rs`). Work in `scratchpad/wt-line-endings`. Commits use pathspecs (`git commit -F msg -- <paths>`).
- Generated outputs are never hand-edited: change the DSL or emitter and regenerate.
- No comments in `packages/codegen/src/`; every new declaration gets a `docs/glossary/` entry. No plan, task, PR or issue numbers in comments or glossary text.
- DRY: the line-ending arms are declared once (`NEWLINE_ARMS` in `whitespace.ts`). The Rust tables, the TypeScript `Newline` type and `_newline`'s model all read that constant. Each member's canonical text has one derivation (`canonicalText`). Breaks are counted by one function in Rust (`logical_breaks`).
- Byte-identical gate: Tasks 1 to 3 leave every generated file and every validation row unchanged. With the default `'\n'`, every render of a source without a `'\r'` is byte-identical before and after the whole plan.
- A failed gate stops the work for review. Never revert or stash the failing state.

## Review Focus

1. **A comment that swallows the CR.** In a python CRLF source, `# note\r` followed by the writer's break renders as exactly one break, `\r\n` under `'\r\n'` and `\n` under `'\n'`, never `\r\r\n` or `\r\n\n`. Pinned in Task 3 (adapter, across pieces) and Task 5 (python corpus).
2. **Indentation never lands before a CR.** No rendered line ends in spaces or tabs followed by `\r`: source whitespace entering the writer is normalized before the writer decides where indentation goes. Pinned in Task 2.
3. **The default path costs nothing.** With `'\n'` and no `'\r'` in the text, the adapter passes the string through without copying, and every validation row is unchanged. Pinned in Task 3 (no-copy test) and the final gates.
4. **Multi-line text keeps its meaning.** A block comment, raw string or template literal spanning CRLF lines renders with the preferred ending and re-parses to the same tree. Pinned in Task 5.
5. **One ending, whole render.** A CRLF source rendered with `'\n'` has no `\r`, and with `'\r\n'` has no `\n` that isn't preceded by `\r`. That holds even after an edit inserts a built statement. Pinned in Task 5.

## Delivery

One PR. Its body names one behaviour change: a source that contains `'\r'` now renders with the configured ending (default `'\n'`) throughout, where it rendered mixed endings before. The layout-inference stage supplies a tree's own ending later. No validation row moves, since the corpora hold no CR (per the gap census).

Commit order: Task 0 (no commit), 1, 2, 3, 4, 5.

---

### Task 0: Worktree, baselines, spike

- [ ] **Step 1:**

```bash
cd ~/GitHub.nosync/refactory-lang/sittir && git fetch origin
git worktree add -b feat/line-endings scratchpad/wt-line-endings origin/master
cd scratchpad/wt-line-endings && pnpm install
```

- [ ] **Step 2: Baselines,** saved to `scratchpad/wt-line-endings/scratchpad/baseline/`:
  - the `pnpm run validate:native` rows (with `SITTIR_HISTORY_NO_COMMIT=1`);
  - `pnpm exec vitest run`, as its own shell call;
  - `pnpm run type-check` and `pnpm run lint`;
  - `cargo test --workspace --no-default-features`;
  - a hash of every generated file: `git ls-files packages/*/src rust/crates/sittir-*/src | xargs shasum > generated.sha`.
- [ ] **Step 3: Spike, no commit.** Write the answers into the task notes.
  1. Every place source whitespace enters the writer as text. Start from `RenderSink::trivia_seam` and `seam` callers, and from `SourceGap::text` and `SourceFlank` reads, using `find_all_references`. These are where Task 2 normalizes.
  2. The corpus file list that `validate:native` reads for rust, typescript and python. Task 5 iterates it.
  3. Confirm python's scanner on CRLF: `engine.parse('x = 1\r\ny = 2\r\n')` has no ERROR node and two statements.

---

### Task 1: The model declares the arms and the references

**Files:**
- Modify: `packages/codegen/src/dsl/whitespace.ts`
- Test: `packages/codegen/src/dsl/__tests__/whitespace.test.ts` (create it if absent)
- Glossary: `docs/glossary/dsl.md`

**Interfaces:**
- Produces: `NEWLINE_ARMS: readonly ['\n', '\r\n', '\r']`, `canonicalText(name: string): string`, and `WhitespaceMember.rule` (the model) beside the emitted `body` (canonical text).

**Behaviour:** Each member declares its rule. `_newline` is a choice over `NEWLINE_ARMS` whose preferred arm is `'\n'`. `_blankline` and `_double_blankline` are sequences of `SYMBOL _newline`. `canonicalText` resolves a member's rule:
- a string is its value;
- a choice is its preferred arm;
- a sequence is its parts joined;
- a symbol is its target's canonical text.

The body handed to `visibleExternals:` is `{ type: STRING, value: canonicalText(name) }`, so the node map, `spacing_text` and the writer see what they see today. Admission (`admitsWhitespaceMember`) tests the canonical text.

```ts
export const NEWLINE_ARMS = ['\n', '\r\n', '\r'] as const;

type MemberRule =
	| { readonly type: typeof STRING; readonly value: string }
	| { readonly type: typeof CHOICE; readonly members: readonly { readonly type: typeof STRING; readonly value: string }[]; readonly preferred: string }
	| { readonly type: typeof SEQ; readonly members: readonly { readonly type: typeof SYMBOL; readonly name: string }[] };

const newlineRef = { type: SYMBOL, name: NEWLINE_MEMBER } as const;

const WHITESPACE_MEMBERS: readonly WhitespaceMember[] = [
	{ name: TIGHT_MEMBER, rule: { type: STRING, value: '' }, alwaysAdmitted: true },
	{ name: SPACE_MEMBER, rule: { type: STRING, value: ' ' } },
	{ name: TAB_MEMBER, rule: { type: STRING, value: '\t' } },
	{ name: NEWLINE_MEMBER, rule: { type: CHOICE, members: NEWLINE_ARMS.map((value) => ({ type: STRING, value })), preferred: '\n' } },
	{ name: '_blankline', rule: { type: SEQ, members: [newlineRef, newlineRef] } },
	{ name: '_double_blankline', rule: { type: SEQ, members: [newlineRef, newlineRef, newlineRef] } },
	{ name: '_indent', rule: { type: STRING, value: INDENT_TEXT } },
	{ name: '_dedent', rule: { type: STRING, value: DEDENT_TEXT } }
];

export function canonicalText(name: string): string {
	const member = WHITESPACE_MEMBERS.find((m) => m.name === name);
	if (member === undefined) throw new Error(`whitespace: '${name}' is not a whitespace member`);
	const rule = member.rule;
	switch (rule.type) {
		case STRING:
			return rule.value;
		case CHOICE:
			return rule.preferred;
		case SEQ:
			return rule.members.map((ref) => canonicalText(ref.name)).join('');
	}
}
```

- [ ] **Step 1: Failing tests.** The tests read only the vocabulary, not a grammar:
  - `canonicalText('_newline') === '\n'`, `canonicalText('_blankline') === '\n\n'` and `canonicalText('_double_blankline') === '\n\n\n'`;
  - every reference in `_blankline` and `_double_blankline` names `_newline`, so a referencing member declares no arms of its own;
  - `NEWLINE_ARMS` is exactly `['\n', '\r\n', '\r']`, and `_newline`'s choice holds them in that order;
  - a reference to a name outside the vocabulary throws, naming it.

  Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/whitespace.test.ts`. Expected: FAIL (`canonicalText` is not exported).
- [ ] **Step 2: Implement** as above. `enrichWhitespace`'s `bodies` and `minted` take `{ type: STRING, value: canonicalText(member.name) }`.
- [ ] **Step 3: Byte-identical gate.** Run `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src` for rust, typescript and python (and scm and regex the way `validate:native` does), then `shasum -c generated.sha`. Expected: every file OK.
- [ ] **Step 4: Glossary.** Write entries for `NEWLINE_ARMS`, `canonicalText` and `WhitespaceMember.rule`. Update `enrichWhitespace`'s entry: a member's body is its canonical text, derived from its rule.
- [ ] **Step 5: Commit** `feat(dsl): the newline member owns the line-ending arms; blank lines reference it`.

---

### Task 2: Breaks are counted and entered once

**Files:**
- Create: `rust/crates/sittir-core/src/line_endings.rs` (`logical_breaks`, `to_internal`)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (`seam_rank`), `rust/crates/sittir-core/src/classify.rs` (`classify_whitespace`), every entry point the Task 0 spike listed
- Modify: `rust/crates/sittir-core/src/lib.rs`
- Test: `rust/crates/sittir-core/tests/classify.rs`; a writer test in `spacing.rs`'s test module

**Interfaces:**
- Produces: `pub fn logical_breaks(text: &str) -> usize`, which counts `\r\n` as one break, a lone `\r` as one and `\n` as one. Also `pub fn to_internal(text: &str) -> Cow<'_, str>`, which spells each break as `'\n'` and borrows when the text holds no `'\r'`.

**Behaviour:** `seam_rank` counts `logical_breaks`. `classify_whitespace` ranks its input through the same function. Each place source whitespace enters the writer passes it through `to_internal`, so the writer's line-start and indentation decisions only ever see `'\n'`.

```rust
pub fn logical_breaks(text: &str) -> usize {
    let bytes = text.as_bytes();
    (0..bytes.len())
        .filter(|&i| bytes[i] == b'\n' || (bytes[i] == b'\r' && bytes.get(i + 1) != Some(&b'\n')))
        .count()
}

pub fn to_internal(text: &str) -> Cow<'_, str> {
    if !text.contains('\r') {
        return Cow::Borrowed(text);
    }
    Cow::Owned(text.replace("\r\n", "\n").replace('\r', "\n"))
}
```

- [ ] **Step 1: Failing tests** in `tests/classify.rs`:
  - `"\r\n"` → `NEWLINE`;
  - `"\r\n\r\n"` → `BLANKLINE`;
  - `"\r"` → `NEWLINE`;
  - `"\r\r"` → `BLANKLINE`;
  - `"\r\n    "` → `NEWLINE`.

  A writer test: a source gap of `"\r\n"` before an indented statement writes `"\n    x"`, never `"    \r\n"`.

  Run: `cargo test -p sittir-core --no-default-features --test classify`. Expected: the lone-CR cases FAIL.
- [ ] **Step 2: Implement.** Route every spiked entry point through `to_internal`.
- [ ] **Step 3: Gates.**
  - `cargo test --workspace --no-default-features`;
  - regenerate, then `shasum -c generated.sha` (generated output unchanged);
  - `validate:native` rows identical to the baseline.
- [ ] **Step 4: Glossary** entries for `logical_breaks` and `to_internal`, and an update to `seam_rank`'s entry.
- [ ] **Step 5: Commit** `feat(core): line breaks are counted logically and enter the writer as one spelling`.

---

### Task 3: The adapter spells every break

**Files:**
- Modify: `rust/crates/sittir-core/src/line_endings.rs` (`LineEndings<W>`)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`apply_render_format` takes `newline: &str` and spells last), `rust/crates/sittir-core/src/napi_engine.rs` (the `render` macro passes the resolved `newline` from its `RenderContext` options between `$render_parts` and `apply_render_format`)
- Test: `line_endings.rs`'s test module

**Interfaces:**
- Consumes: `ResolvedOptions.newline` from Task 4. Until Task 4 lands, callers pass `"\n"`.
- Produces: `pub struct LineEndings<'a, W: fmt::Write + ?Sized>`, with `new(out: &'a mut W, newline: &'a str)` and `finish(self) -> fmt::Result`, which flushes a held `'\r'`. Also `pub fn spell(text: String, newline: &str) -> String`, which returns `text` unchanged when `newline == "\n"` and `text` holds no `'\r'`.

**Behaviour:** The adapter writes each logical break as `newline`. A `'\r'` at the end of one `write_str` is held: if the next piece starts with `'\n'`, the two are one break. `finish` writes a held `'\r'` as one break. Everything other than a break passes through unchanged. `apply_render_format` runs the format record first, on the internal spelling, then `spell`s the result. That keeps the format record's byte offsets valid; the record's own removal (indentation as one fact) is the layout-inference design's.

```rust
pub struct LineEndings<'a, W: fmt::Write + ?Sized> {
    out: &'a mut W,
    newline: &'a str,
    held_cr: bool,
}

impl<W: fmt::Write + ?Sized> fmt::Write for LineEndings<'_, W> {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        let mut rest = s;
        if std::mem::take(&mut self.held_cr) {
            self.out.write_str(self.newline)?;
            rest = rest.strip_prefix('\n').unwrap_or(rest);
        }
        while let Some(at) = rest.find(['\r', '\n']) {
            self.out.write_str(&rest[..at])?;
            let tail = &rest[at..];
            if tail.starts_with("\r\n") {
                self.out.write_str(self.newline)?;
                rest = &tail[2..];
            } else if tail == "\r" {
                self.held_cr = true;
                return Ok(());
            } else {
                self.out.write_str(self.newline)?;
                rest = &tail[1..];
            }
        }
        self.out.write_str(rest)
    }
}
```

- [ ] **Step 1: Failing tests:**
  - `"a\r\nb"`, `"a\rb"` and `"a\nb"` under `"\r\n"` all become `"a\r\nb"`;
  - under `"\n"` they all become `"a\nb"`;
  - the pieces `"# note\r"` then `"\ny"` become `"# note\r\ny"` under `"\r\n"` and `"# note\ny"` under `"\n"` (Review Focus 1);
  - a final `"x\r"` flushed by `finish` gives `"x\r\n"`;
  - `spell` returns the same allocation for an LF text under `"\n"` (compare `as_ptr` before and after: Review Focus 3).

  Run: `cargo test -p sittir-core --no-default-features line_endings`. Expected: FAIL (module missing).
- [ ] **Step 2: Implement** the adapter, `spell` and the `apply_render_format` parameter. Its one non-test caller, the napi `render` macro, passes `"\n"` until Task 4.
- [ ] **Step 3: Gates,** as in Task 2.
- [ ] **Step 4: Glossary** entries for `LineEndings` and `spell`, and an update to `apply_render_format`'s entry.
- [ ] **Step 5: Commit** `feat(core): one adapter spells every line break of a render`.

---

### Task 4: The `layout` group and its `newline` option

**Files:**
- Modify: `rust/crates/sittir-core/src/options.rs`:
  - `OptionTables.newline_arms: &'static [&'static str]`;
  - `Options.newline: Option<String>`;
  - `ResolvedOptions.newline: String`;
  - `read` and `resolve`.
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (emits `newline_arms` from `NEWLINE_ARMS` when the grammar admits `_newline`, else `&[]`), `packages/codegen/src/emitters/options.ts` (emits `export type Newline = '\n' | '\r\n' | '\r'`, or `never`)
- Modify: `packages/types/src/options.ts` (`NewlineOption<Newline>`, added to `DerivedOptions`), `packages/codegen/src/emitters/engine.ts` (the engine's options type carries it, as it does `IndentOption`)
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (passes `table.newline` to `apply_render_format`)
- Test: `packages/rust/tests/newline-option.test.ts`, `packages/rust/tests/engine-api.test-d.ts`

**Interfaces:**
- Consumes: `NEWLINE_ARMS` (Task 1), `apply_render_format(…, newline)` (Task 3).
- Produces: `render: { layout?: { indent?: IndentChar; newline?: Newline } }`, per engine and per call. Generated `Newline` per grammar. `render.indent` no longer exists.

**Behaviour:** `Options::read` reads a `"layout"` object, and `"indent"` and `"newline"` inside it; neither is read at the top level any more. Moving `indent` changes no rendered byte: its tests and every `render: { indent }` in the repository (tests, examples, docs) move to `render: { layout: { indent } }` in this task. `"newline"` is read only when `newline_arms` is non-empty. `resolve` refuses a value outside the arms, naming them: `newline "\t" is not one of ['\n', '\r\n', '\r']`. The base table's `newline` is `"\n"`, the preferred arm of `_newline`'s choice, taken from the model's preference rather than written down a second time. There are no per-site keys (ruling 3).

```ts
export type NewlineOption<Newline extends string> = [Newline] extends [never]
	? unknown
	: { readonly newline?: Newline };
// The layout group: IndentOption and NewlineOption, nested under one key.
export type LayoutOption<I extends string, IndentChar extends string, Newline extends string> = {
	readonly layout?: IndentOption<I, IndentChar> & NewlineOption<Newline>;
};
```

- [ ] **Step 1: Failing tests,** modelled on `indent-option.test.ts`:
  - `createEngine(rust, { render: { layout: { newline: '\r\n' } } })` renders a built `fn f() { a; }` as `'fn f() {\r\n    a;\r\n}'`;
  - per call, `rs.render(fn(), { layout: { newline: '\r' } })` gives `'fn f() {\r    a;\r}'`;
  - `indent-option.test.ts` passes with its options under `layout`, and `render: { indent }` at the top level is a type error;
  - the default stays `'\n'`;
  - a value outside the arms is a type error and a runtime refusal naming the arms.

  Type tests: `layout: { newline: '\n\n' }` and a top-level `indent` are each a `@ts-expect-error`.

  Run: `pnpm exec vitest run packages/rust/tests/newline-option.test.ts`. Expected: FAIL.
- [ ] **Step 2: Implement,** then regenerate all grammars.
- [ ] **Step 3: Gates.**
  - The generated diff is only the new `newline_arms` row, the `Newline` type and the engine options type (now nesting `indent` under `layout`). Name every other moved file, and stop if there is one.
  - `validate:native` rows identical.
  - Full vitest, type-check, lint, `cargo test --workspace --no-default-features`.
- [ ] **Step 4: Glossary** entries, plus the render-options spec's option list (an implemented-surface note, not a design change).
- [ ] **Step 5: Commit** `feat(options): a layout group holds indent and the line ending`.

---

### Task 5: Acceptance on real sources

**Files:**
- Test: `packages/rust/tests/line-endings.test.ts`, `packages/typescript/tests/line-endings.test.ts`, `packages/python/tests/line-endings.test.ts`

**Behaviour:** Each grammar's test takes the corpus files from the Task 0 spike and makes a CRLF copy of each in memory (`text.replace(/\r?\n/g, '\r\n')`).

```ts
const engine = await createEngine(rust);
const crlfEngine = await createEngine(rust, { render: { layout: { newline: '\r\n' } } });
// corpus(): [name, text] for each file the Task 0 spike listed, read with node:fs.
for (const [name, lf] of corpus()) {
	const crlf = lf.replace(/\r?\n/g, '\r\n');
	const plain = engine.render(engine.parse(lf) as never).toString();
	it(`${name}: a CRLF source renders as its LF twin under the default`, () => {
		expect(engine.render(engine.parse(crlf) as never).toString()).toBe(plain);
	});
	it(`${name}: under '\\r\\n' every break is CRLF and nothing else differs`, () => {
		const out = crlfEngine.render(engine.parse(crlf) as never).toString();
		expect(out).not.toMatch(/(?<!\r)\n|\r(?!\n)/);
		expect(out.replace(/\r\n/g, '\n')).toBe(plain);
	});
}
```

For each grammar, also:
- an edit test: parse a CRLF source, append a built statement to the root's statement list through the accessors (as `fold-in-place-trivia.test.ts` writes through them), and render under `'\r\n'`. Expect no lone `\n` or `\r` (Review Focus 5).
- a re-parse check: every CRLF render re-parses with no ERROR node to a tree that matches the LF source's tree, compared as the validators compare (Review Focus 4).

Python adds the comment case on its own: `'x = 1  # note\r\ny = 2\r\n'` renders unchanged under `'\r\n'`, and as `'x = 1  # note\ny = 2\n'` under the default (Review Focus 1).

- [ ] **Step 1:** Write the tests and run them per package. Any failure that names a corpus file is a finding: report the file and the first differing byte. Don't exclude the file.
- [ ] **Step 2: Final gates, three ways.**
  1. The targeted probes above (wrap and render layers).
  2. `sittir validate history` across the three grammars, with the numbers compared row by row against the baseline.
  3. The full suite as its own call, type-check, both example checks, lint, `cargo test --workspace --no-default-features`.
- [ ] **Step 3: Commit** `test: CRLF sources round-trip under both line endings`, then open the PR (`Owner: <executing session>` first line) stating the one behaviour change in Delivery.

## Out of scope

- Inferring a tree's line ending, indent unit or statement-run gaps: the layout-inference design (the width-setting note).
- Comment text read with a trailing `\r` (python's `#.*`). The adapter renders it correctly; whether `$text` should show it is a reader question for later.
- Lone-CR sources beyond classification and spelling: no grammar's corpus has one.
