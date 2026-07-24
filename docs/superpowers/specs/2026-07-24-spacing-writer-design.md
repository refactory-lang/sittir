# SpacingWriter — Render-Time Word-Boundary Spacing

**Status**: Proposed. Independently landable against current master (askama pipeline unchanged).
**Goal**: Replace compile-time conditional-spacing logic (the four-case absorb matrix in the templates emitter) with a single render-time invariant: insert a space at any write seam where a word character would collide with a word character.

---

## The invariant

If two word-class characters from different tokens were ever legally adjacent in output, the lexer would have merged them into one token. Therefore, at every seam between consecutive writes:

```
last character written is word-class  AND  first character of incoming write is word-class
→ emit " " before the incoming write
```

This is not a heuristic — it is the definition of tokenization. `pub` + `fn` → space required (`pubfn` is one token). `pub` + `(` → no space. `)` + `foo` → no space.

The word class is the Link-pinned `wordMatcher` already carried on `LinkedGrammar` — no new configuration.

---

## Why render-time, not compile-time

1. **The compile-time version is the most opaque code in the emitter.** The seq-boundary handler in `packages/codegen/src/emitters/templates.ts` is a four-case matrix (prev/curr conditional × conditional) with "outer-absent space ownership," `absorbTrailingSpaceIntoConditional`, `absorbLeadingSpaceIntoConditional`, and a three-position lookback (`emitted[i-2]`). All of it exists because a space's presence depends on whether optional neighbors render — which is runtime information being simulated at compile time.

2. **Adjacent optionals are statically undecidable.** `optional(A) optional(B)` with both words needs "A B" / "A" / "B". No static space placement produces all three. At render time it is trivial: whoever actually writes, collides or doesn't.

3. **Source splices make static spacing impossible in the arena model.** An unexpanded node renders as original source bytes; the compile-time tree cannot know a splice's first or last character. A rendered `pub` followed by a splice beginning `fn` needs a space; the same splice beginning `(` doesn't. The arena world requires a render-time boundary check regardless — making it universal is the simpler system, not the more dynamic one.

---

## v1: the writer (jinja-compatible, land now)

```rust
pub struct SpacingWriter<'a, W: std::fmt::Write + ?Sized> {
    inner: &'a mut W,
    last: Option<char>,
    word: &'a WordMatcher,   // grammar's word class — from the Link-pinned wordMatcher
}

impl<'a, W: std::fmt::Write + ?Sized> SpacingWriter<'a, W> {
    pub fn new(inner: &'a mut W, word: &'a WordMatcher) -> Self {
        Self { inner, last: None, word }
    }
}

impl<W: std::fmt::Write + ?Sized> std::fmt::Write for SpacingWriter<'_, W> {
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        let Some(first) = s.chars().next() else {
            return Ok(());                       // empty write: context untouched
        };
        if let Some(last) = self.last {
            if self.word.is_word(last) && self.word.is_word(first) {
                self.inner.write_str(" ")?;
            }
        }
        self.inner.write_str(s)?;
        self.last = s.chars().last();
        Ok(())
    }

    fn write_char(&mut self, c: char) -> std::fmt::Result {
        let mut buf = [0u8; 4];
        self.write_str(c.encode_utf8(&mut buf))
    }
}
```

`WordMatcher`: per-grammar, derived from the same word pattern Link pins. Implementation detail — a `[bool; 128]` ASCII table with a fallback closure for `char >= 0x80` (Unicode identifiers) is sufficient; a full regex engine is not needed for a single-char class test.

### Wiring

Wrap `dest` once at the root render call:

```rust
pub fn render(...) -> Result<String, ...> {
    let mut out = String::new();
    let mut dest = SpacingWriter::new(&mut out, &grammar_word_matcher());
    root_template.render_into(&mut dest)?;
    Ok(out)
}
```

Everything flows through it — askama static text, view `write_into` output, trivia, and (later) arena renders and source splices. Because static text also updates `last`, there is no stale-context problem and **no view or template struct changes**.

### Key properties

- **Per-seam, not per-character.** The check fires once per `write_str` call, testing only the boundary between consecutive writes. Internal spaces in `"fn "` or `" -> "` are content, not seams.
- **Inert under current templates.** Existing templates carry their spaces; at a seam following `"fn "`, `last` is `' '` (not word-class) → no insert. The writer can land before any template change and be validated by round-trip parity alone.
- **Absent optionals are free.** `OptionalNonterminalView::Missing` writes nothing → context untouched → the next seam tests against whatever actually preceded. The adjacent-optionals case needs zero special handling.
- **Style vs required separation falls out.** Style spaces (around `->`, after `,`) stay in template literals where they are visible and unconditional. The writer supplies only lexically-required spaces at dynamic boundaries — exactly the ones the absorb matrix currently simulates.

### What it does NOT cover (by design)

- **Punct-punct merges** (`- -` → `--`, `< <` → `<<`). Not word-class collisions; not covered today either — operator style spaces in template literals prevent them, and that protection is unchanged. Document, don't mechanize.
- **Newline-required boundaries** (line comment followed by code). Safe as long as trivia writes include their terminating newline — `last` becomes `'\n'`, not word-class. Current trivia render already does this; add a test to pin it.

---

## Validation gate

Round-trip parity across all three grammars is the acceptance test, not frozen-template byte equality. Cases to eyeball in diffs first:

1. Rust lifetimes: `'a` followed by `mut` / `>` (`'` is not word-class — verify the matcher agrees).
2. Python f-string/raw prefixes: `f"..."`, `rb'...'` (prefix is word-class, quote is not — no seam issue, but confirm the prefix and quote arrive in the expected writes).
3. Keyword-adjacent-to-keyword optionals: `pub async fn`, `default const`, python `async def`.
4. Contextual keywords adjacent to identifiers in TS (`type`, `as`, `satisfies`).

Audit before trust (2026-07-24 review): one-time grammar audit for `token.immediate` pairs where BOTH sides are word-class — the invariant's "lexer would have merged them" premise is exactly what `immediate` circumvents. Believed absent in all three grammars (string prefixes live inside string tokens, numeric suffixes inside numeric tokens), but verify, don't assume.

---

## Follow-on: template simplification

Once the writer is in and parity holds, the compile-time machinery it obsoletes gets deleted from `packages/codegen/src/emitters/templates.ts`:

- The four-case conditional-boundary matrix (prevIsCond × currIsCond)
- `absorbTrailingSpaceIntoConditional` / `absorbLeadingSpaceIntoConditional` / `absorbHeadLeadingSeparatorIntoConditionals`
- `needsSeqSpace` calls at conditional boundaries and the `emitted[i-2]` outer-space lookback
- Conditional spaces inside regenerated `{% if %}` blocks — `{% if vis | isPresent %}{{ visibility_modifier }} {% endif %}` regenerates as `{% if vis | isPresent %}{{ visibility_modifier }}{% endif %}`; the writer supplies the space when the next write collides

Templates get simpler and more literal (only style spaces remain, all unconditional). Frozen-template tests are regenerated, not preserved — the `.jinja` output intentionally changes while render output stays byte-identical (that is the parity gate).

Estimated deletion: the boundary matrix and absorb helpers are ~250–350 lines of the emitter's hardest logic.

First consumer (2026-07-24 review): statement-list separators become `""` — statements self-terminate (`;`, visible `newline`/`automatic_semicolon` nodes render their own terminators), and the writer supplies word-word seams. This clears python's line-leading-space class (a `join(" ")` separator after a rendered `'\n'` is an indentation error) without any suppression logic in `Joined`.

---

## v2 (optional, later): edge-class optimization

The v1 writer inspects one char per seam at render time. If profiling ever cares, codegen can precompute:

- Per-kind edge classes: `STARTS: [EdgeClass; KIND_COUNT]`, `ENDS: [...]` where `EdgeClass ∈ {Word, NotWord, ReadByte}` — identifiers always start word-class, `parenthesized_expression` always starts `(`; only instance-varying kinds fall back to reading a byte. Covers arena splices via `kind_id` without touching source.
- Static-static boundaries resolved at template generation (space baked into the literal, no runtime check).
- Views carry `starts_word`/`ends_word` constants; a shared `RenderCtx { last_is_word }` replaces char inspection.

This changes nothing semantically — same invariant, precomputed. Not part of v1.

---

## Relationship to other specs

- **Arena spec**: arena render functions and source splices write through the same `SpacingWriter`. The splice case (statically unknowable edges) is the strongest argument for this design; the arena inherits correct spacing for free.
- **Arena formatting spec**: `FormatCtx` owns style whitespace (indent, brace placement, separators); `SpacingWriter` owns lexically-required spaces. Disjoint responsibilities — required spaces are exactly the ones a formatter may never delete.
- **Template-less research**: conditional spacing was the main open readability question for `render_template!` / format-IR approaches; with spacing at render time, generated write sequences need no spacing awareness at all.
- **Rejected alternative — `space()` as a rule**: reifying spaces as rule nodes (parallel to the existing `IndentRule`/`NewlineRule`) was considered. It makes spacing inspectable in the tree but cannot handle adjacent optionals statically, cannot handle splices at all, and adds a Link insertion pass plus tree noise. The render-time invariant subsumes it. (`blank()` specifically must not be repurposed — in tree-sitter DSL it means "match empty string"; `optional(x)` is sugar for `choice(x, blank())`.)
