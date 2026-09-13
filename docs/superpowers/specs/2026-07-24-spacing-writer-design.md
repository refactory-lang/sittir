# SpacingWriter — Render-Time Word-Boundary Spacing

**Status**: Landed. The typed `RenderSink` is the writer's end state — every render function writes through it, and there is no other writer.
**Goal**: Replace compile-time conditional-spacing logic (the four-case absorb matrix the old templates emitter carried) with a single render-time invariant: insert a space at any write seam where a word character would collide with a word character.

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

## The writer

`SpacingWriter` (`rust/crates/sittir-core/src/spacing.rs`) is the one
implementation of the `RenderSink` trait (`rust/crates/sittir-core/src/render.rs`).
A render function never writes a character directly; it calls one of the
sink's seven methods, and the writer decides what reaches the output:

- `text(&mut self, s: &str) -> RenderResult` — one mark-free run of literal
  or transported text. This is the only call that can insert a word-word
  space: it tests the seam between the incoming run's first character and
  the writer's `last`, and inserts `" "` when both are word-class (the
  grammar's `WordMatcher`) or when the pair is a registered
  `literal_merge_pair` (a punctuation transition, e.g. rust's `('.', '=')`
  from `..=`, that risks a maximal-munch collision at the boundary).
- `adjacent(&mut self)` — suppresses the next `text` call's seam check once;
  the two writes are known-glued regardless of class.
- `site(&mut self, kind: u16)` — a whitespace site's resolved arm. `0` is no
  arm (nothing written, nothing changes). The two depth arms move `indent`/
  `dedent` instead of writing text; every other arm's text is merged into
  the held seam via `WhitespaceTable::text_of`.
- `seam(&mut self, text: &str)` / `token_seam(&mut self, text: &str)` — a
  seam payload from anywhere other than a resolved site (a grammar-fixed
  separator, a whitespace token). Multiple calls before the next `text`
  coalesce to the widest payload by `seam_rank` (no whitespace < a run of
  spaces < a run ranked by how many line breaks it carries), so a
  separator asking for more survives meeting a kind edge asking for less.
  `token_seam` additionally marks the payload as owned by a whitespace
  token, which is what lets `finish` decide whether to flush it (below).
- `indent(&mut self)` / `dedent(&mut self) -> bool` — move the depth the
  next line is paid at. Indentation is deferred: a newline arms it, and
  the first non-newline text pays it at the depth current at that moment,
  so a dedent between the newline and a closing delimiter puts the
  delimiter at the outer depth. A `dedent` that arrives while its `indent`
  has had no text written **cancels** both the depth move and the held
  seam payload — an empty body renders as its bare delimiters — and
  returns `false` so the caller's own seam call for that dedent is skipped
  too (a cancelled indent drops any payload the same way a cancelled mark
  would).
- `ends_line(&self) -> bool` — a query, not a write: true when `last` is
  `None` or `'\n'`.

**The held seam and its rank.** A seam payload is never written eagerly —
it is held (`seam: Option<SeamRank>`, `seam_text: String`) until the next
`text` or `token_seam` call, or until `finish`. This is what makes the
"widest wins" merge possible: a separator's fixed comma-space and a
following kind's blank-line edge both arrive as `seam` calls before any
text, and only the wider survives.

**The token seam.** A whitespace token (an explicit blank-line rule, for
instance) contributes its text through `token_seam` rather than `seam`.
The difference matters only at `finish`: an ordinary held seam with
nothing after it is dropped (a seam lies between two things; a render
that ends there has nothing on the far side), but a token-owned seam is
flushed — the token is part of the rendered node, not a boundary artifact.

**Depth and the cancel rule.** `indent`/`dedent` are structural, not
textual — they never write bytes themselves, only move `depth` and arm/
disarm `indent_pending`. The cancel rule above is the reason a dedent
returns a value at all: it is the caller's only signal that the seam call
it was about to make for this dedent has already been dropped for it.

**Adjacency.** `adjacent()` exists because some seams are known-glued at
codegen time (an immediate token's two halves, a splice boundary the
grammar marks non-separated) and must never gain a space no matter what
class their edge characters fall in. It is consumed by exactly the next
`text` call and never persists past it.

`WordMatcher`: per-grammar, derived from the same word pattern Link pins.
A `[bool; 128]` ASCII table with a fallback closure for `char >= 0x80`
(Unicode identifiers), plus the grammar's own `literal_merge_pairs`
derived at emit time from its anonymous-literal inventory (never
hand-picked) — a full regex engine is not needed for a single-char class
test.

Every render wraps its destination exactly once, at the root call
(`render_to_string` in `render.rs`), and finishes it exactly once after
the last write:

```rust
pub fn render_to_string(
    value: &dyn Render,
    word: &WordMatcher,
    table: &WhitespaceTable,
    indent: &str,
) -> Result<String, RenderError> {
    let mut out = String::new();
    let mut w = SpacingWriter::new(&mut out, word)
        .with_table(table)
        .with_indent(indent);
    value.render(&mut w)?;
    w.finish()?;
    Ok(out)
}
```

Wrapping per nesting level instead of once at the root monomorphizes
recursive render paths into an infinitely growing wrapper type (E0275) —
every generated `render_<kind>` takes the same `&mut dyn RenderSink`.
Because static text also updates `last`, there is no stale-context
problem and no view or template struct changes.

### Key properties

- **Per-seam, not per-character.** The check fires once per `text` call, testing only the boundary between consecutive writes. Internal spaces in generated literals like `"fn "` or `" -> "` are content, not seams.
- **Inert when a literal already carries its space.** At a seam following `"fn "`, `last` is `' '` (not word-class) → no insert.
- **Absent optionals are free.** A missing optional's render is a no-op call → context untouched → the next seam tests against whatever actually preceded. The adjacent-optionals case needs zero special handling.
- **Style vs required separation falls out.** Style spaces (around `->`, after `,`) are baked into generated literal text, visible and unconditional. The writer supplies only lexically-required spaces at dynamic boundaries.

### What it does NOT cover (by design)

- **Punct-punct merges outside the registered pairs** (e.g. a grammar with no multi-char operator sharing a prefix with another). Not word-class collisions; the `literal_merge_pairs` table covers exactly the transitions a grammar's own anonymous-literal inventory proves risky, and a doubled unambiguous symbol like nested `>>` in generics is deliberately excluded (see `spacing.rs::write_text`'s `symbol_seam` comment).
- **Newline-required boundaries** (line comment followed by code). Safe as long as trivia writes include their terminating newline — `last` becomes `'\n'`, not word-class. Trivia render pins this with a test.

---

## Validation gate

Round-trip parity across all three grammars is the acceptance test — byte-identical `packages/{rust,typescript,python}/src` output under regeneration, and `pnpm run validate:native` / `pnpm run validate:history` numbers unchanged. Cases to eyeball in diffs first:

1. Rust lifetimes: `'a` followed by `mut` / `>` (`'` is not word-class — verify the matcher agrees).
2. Python f-string/raw prefixes: `f"..."`, `rb'...'` (prefix is word-class, quote is not — no seam issue, but confirm the prefix and quote arrive in the expected writes).
3. Keyword-adjacent-to-keyword optionals: `pub async fn`, `default const`, python `async def`.
4. Contextual keywords adjacent to identifiers in TS (`type`, `as`, `satisfies`).

Audit before trust (2026-07-24 review): one-time grammar audit for `token.immediate` pairs where BOTH sides are word-class — the invariant's "lexer would have merged them" premise is exactly what `immediate` circumvents. Believed absent in all three grammars (string prefixes live inside string tokens, numeric suffixes inside numeric tokens), but verify, don't assume.

---

## Relationship to other specs

- **Arena spec**: arena render functions and source splices write through the same `SpacingWriter`. The splice case (statically unknowable edges) is the strongest argument for this design; the arena inherits correct spacing for free.
- **Arena formatting spec**: `FormatCtx` owns style whitespace (indent, brace placement, separators); `SpacingWriter` owns lexically-required spaces. Disjoint responsibilities — required spaces are exactly the ones a formatter may never delete.
- **Rejected alternative — `space()` as a rule**: reifying spaces as rule nodes (parallel to the existing `IndentRule`/`NewlineRule`) was considered. It makes spacing inspectable in the tree but cannot handle adjacent optionals statically, cannot handle splices at all, and adds a Link insertion pass plus tree noise. The render-time invariant subsumes it. (`blank()` specifically must not be repurposed — in tree-sitter DSL it means "match empty string"; `optional(x)` is sugar for `choice(x, blank())`.)
