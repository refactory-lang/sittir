# Token seam defaults — space unless declared tight

**Status:** Design spec. Extends the render-options design (`2026-09-04-render-options-design.md`) and the punctuation seam spacing that landed with it; nothing here changes the preference mechanism, only what a seam does when no preference names it.

---

## Problem

A seam is the gap between two things a render body writes next to each other. Today the writer resolves an undeclared seam by what stands on either side: two words get a space, anything involving a token is glued. Spacing is declared only where the grammar author asked for it, and more than half of the declared preferences exist only to ask for a space:

| grammar | seams in the census | declared preferences | of which ask for a space |
| --- | --- | --- | --- |
| typescript | 498 | 64 | 45 |
| python | 259 | 28 | 11 |
| rust | 470 | 49 | 22 |

Gluing by default has a failure class that spacing does not: two tokens written together can lex as a different token. `import type * as V` renders as `import type*as V` today because the namespace-import arm declares no seam around its `*`; that one still parses, but the same default turns `a - -b` into `a --b`, two slashes into a comment, and two `<` into a shift. Every undeclared token seam carries that risk, and the read-render-parse gates do not see it, because an untouched tree folds to its source bytes and only a rebuilt node goes through the writer.

## Decision

**An undeclared seam is a space.** Between two words, a word and a token, or two tokens, the writer puts one space unless a declaration makes the seam tight. A space can never change what the neighbours lex as, so the default is safe and the declared state is the aesthetic one. A rebuilt node that no preference reaches renders as `f ( x )`: valid, ugly, and the formatter's business.

**Tightness is declared on the token, then on the seam.** Two layers, the second overriding the first:

1. **Token defaults**, one table per grammar in `grammar.sittir.ts`, keyed by the token's kind name (`lparen`, `comma`, `dot`, `colon_colon`), each side independently: `{ lparen: { after: 'tight' }, rparen: { before: 'tight' }, dot: { before: 'tight', after: 'tight' }, comma: { before: 'tight' }, semi: { before: 'tight' }, colon: { before: 'tight' } }`. About fifteen rows per grammar cover the bracket pairs, the member and path separators, the list punctuation, type-argument angle brackets, and the unary operators' after side. A row is a default for every seam that token takes part in, in every kind.
2. **Seam preferences**, exactly the mechanism that exists: a per-seam key (`'";"/after': preference('space')`) overrides the token default for that seam in that kind. The C-style `for`'s semicolons, which are spaced where a statement terminator is tight, stay declared this way. A preference's arms and defaults are unchanged; only the fallback beneath them moves from glue to space.

**Verbatim kinds are untouched.** A pattern, string, template, f-string, regex, JSX text or comment body writes its text as read and has no seams inside it; python's indentation is the writer's marks, not seams. The kinds where a space would change meaning are all in that set, plus a short list of two-token lexemes the grammars split (rust's lifetime `'a` and char literal, the shebang), which are token defaults of `tight` on both sides.

**`tree.inferOptions()` learns tightness.** The inferred table (render-options design, read side) already classifies the gaps of a read tree into option values; a tight gap between two tokens becomes a `tight` for that seam, so a tree rebuilt from a source that spelled `f(x)` keeps spelling it that way. The token defaults are what a tree built from nothing gets.

## What changes

- `packages/codegen/src/compiler/model/render-rules.ts`: the seam pass reads the token-default table before it falls back; the fallback arm for an undeclared seam is `space`, not `tight`.
- `packages/<grammar>/grammar.sittir.ts`: a `tokens:` table beside `options:`; the declared `preference('space')` entries that the new default makes redundant are removed, the `preference('tight')` entries that a token default covers are removed, and the exceptions stay.
- The generated `Options` types do not change shape: token defaults are not options, they are defaults; a seam stays addressable by the same key it has today.
- The seam census (`.sittir/seam-census.json`) records, per seam, which layer resolved it (`token-default`, `preference`, `fallback`), so the count of fallback seams is the measure of what the token table does not yet cover.

## Verification

1. **Parity fixtures**: every fixture that renders a tight undeclared seam changes bytes once; the set is regenerated in the same change and the diff is reviewed for seams the token table should have covered.
2. **Read-render-parse and factory-render-parse** stay at their counts; a space cannot break a parse outside the verbatim kinds, which do not change.
3. **Byte axis** (`dogfood-render-bytes.test.ts`) stays green: untouched trees fold to their source.
4. **The gluing hazard is a test**: a rebuilt `a - -b`, `x / /re/`, and `import type * as V` render with their spaces in each grammar that has the construct.
5. **The census count of fallback seams only falls** once the token tables are in.

## Out of scope

- Newlines and indentation: unchanged; the depth-carrying brace seams and the list flanks keep their designs.
- Per-tree formats and the reformat pass (render-options plan 4).
- A formatter. The default is valid output, not pretty output.
