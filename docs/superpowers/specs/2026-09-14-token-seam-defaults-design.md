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

**Tightness is declared on the token, then on the seam.** Two layers, the second overriding the first, and both are the one preference mechanism at two scopes:

1. **Token defaults** are seam preferences at the grammar-wide scope — the `_` block the grammars already use for separators (`'_/separator/","/before': preference('tight')`): `_: { '"("/after': preference('tight'), '")"/before': preference('tight'), '"."/before': preference('tight'), '"."/after': preference('tight'), '","/before': preference('tight'), '";"/before': preference('tight'), '":"/before': preference('tight'), … }`. About fifteen rows per grammar cover the bracket pairs, the member and path separators, the list punctuation, type-argument angle brackets, and the unary operators' after side. A row is a default for every seam that token takes part in, in every kind. There is no separate `tokens:` table: precedence between scopes (kind > supertype > `_`) already exists, and a token default is nothing but the widest scope of it.
2. **Seam preferences** at kind scope override a token default for that seam in that kind: `for_statement: { '";"/after': preference('space') }`, where a statement terminator is tight. A preference's arms and defaults are unchanged; only the fallback beneath them moves from glue to space.

A `_`-scope `tight` belongs only on a face that is tight in every context — the opener's after, the closer's before, `.`, the list punctuation's before, the unary operators' after. A face that varies (`(`'s before: `f(x)` beside `if (x)`) is declared tight at kind scope on the kinds that want it, never grammar-wide.

**Two faces on one boundary combine by rank.** Between two tokens the seam pass emits two sites, the left token's `after` and the right token's `before`, and each resolves on its own. Where they disagree, the writer takes the higher rank:

```
depth marks (indent, dedent)  >  newline  >  tight  >  space
```

Tight beats space in every case: `return;` is a declared `space` after `return` meeting a `tight` before `;`, and the tight is the specific intent while the space only says "no word glued here". Whitespace that carries line structure beats tight — a `}` whose before-face is `dedent` never has the dedent swallowed by a tight on the face across from it. Among whitespace arms the widest still wins, as today. No scope enters the rank: a token default and a kind-scoped declaration combine the same way.

**The word guard stays, and costs nothing where it cannot fire.** The writer's check that a `tight` between two word characters still gets a space is the last-resort safety for a wrong declaration — a `tight` on a keyword's face, or a token-tree gap declared tight around word tokens. It runs only after a boundary's payload has coalesced to `tight`, reads the left edge character first and returns the moment that is not a word character, then the right. Codegen decides statically where it can be skipped: a seam with a non-word literal token on either side can never be a word hazard, so it is emitted as plain `tight` and the writer never checks it; only a seam whose both neighbours can be words — slot beside slot, a keyword beside a slot, a token-tree gap — carries the checked flavour. The flavour is a property of the site, stamped once, so a per-call `tight` on a hazard-free site skips the check too.

**Static boundaries take the same default.** A boundary between two literals is baked into the render body with no site (the census's `static-glued` rows: `> {`, `} :`). The bake reads the token defaults and falls back to space exactly as the seam pass does; the template emitter's own word/word rule, which today decides `spaced` for a static boundary, is the same fact and is deleted with it.

**List gaps declared tight are re-examined.** Rust's token trees declare `'tokens:/separator': preference('tight')`, and macro input holds adjacent word tokens: `impl_trait!(Foo for Bar)` renders `FooforBar` with only the runtime guard between it and invalid output. Under this design a token-tree gap built from nothing is `space`, and a rebuilt one takes its source gaps, which the list gap classification already does for a rebuilt list. Those declarations go; the census's measure step names any other declared tight that only held because the guard rescued it.

**Verbatim kinds are untouched.** A pattern, string, template, f-string, regex, JSX text or comment body writes its text as read and has no seams inside it; python's indentation is the writer's marks, not seams. The kinds where a space would change meaning are all in that set, plus a short list of two-token lexemes the grammars split (rust's lifetime `'a` and char literal, the shebang), which are token defaults of `tight` on both sides.

**`tree.inferOptions()` learns tightness.** The inferred table (render-options design, read side) classifies the gaps of a read tree into option values; a tight gap between two tokens becomes a `tight` for that seam, so a tree rebuilt from a source that spelled `f(x)` keeps spelling it that way. The token defaults are what a tree built from nothing gets. Today only list gaps are classified natively (`classify_list_gaps`, filled in the `prepare` walk); the token-seam classification and `inferOptions()` itself belong to the render-options work that follows this design, and nothing here waits for them — the flip is what a tree built from nothing gets either way.

## What changes

- `packages/codegen/src/compiler/model/render-rules.ts`: the fallback arm for an undeclared seam is `space`, not `tight` (the seam pass's one literal). Token defaults reach it through the resolver's existing `_` scope; nothing new is read. Each emitted tight seam is stamped hazard-free or checked from its neighbours.
- `packages/codegen/src/emitters/templates.ts`: a static literal/literal boundary is baked from the same token defaults with the same space fallback; the emitter's own word/word rule is deleted.
- `rust/crates/sittir-core/src/spacing.rs`: the coalescing rank gains `tight` between `newline` and `space`; the word guard runs only on a payload that coalesced to `tight`, on checked sites, left edge first with an early return.
- `packages/<grammar>/grammar.sittir.ts`: the token defaults as `_`-scope seam preferences; the declared `preference('space')` entries the new default makes redundant are removed, the `preference('tight')` entries a token default covers are removed, the token-tree gap tights go, and the exceptions stay.
- The generated `Options` types do not change shape: token defaults are not options, they are defaults; a seam stays addressable by the same key it has today.
- The seam census (`.sittir/seam-census.json`) keeps its `resolution` (static or runtime) and gains `origin` per boundary — `preference`, `token-default` or `fallback` — so the count of fallback seams is the measure of what the token defaults do not yet cover.

## Verification

0. **Measure first.** The census `origin` field lands before the flip, on the current fallback; the fallback count per grammar is the number of boundaries whose bytes the flip changes, and it is recorded in the change that flips them.
1. **Parity fixtures**: every fixture that renders a tight undeclared seam changes bytes once; the set is regenerated in the same change and the diff is reviewed for seams the token table should have covered. Token-tree fixtures change with their gap declarations and are reviewed as their own group.
2. **Read-render-parse and factory-render-parse** stay at their counts; a space cannot break a parse outside the verbatim kinds, which do not change.
3. **Byte axis** (`dogfood-render-bytes.test.ts`) stays green: untouched trees fold to their source.
4. **The gluing hazard is a test**: a rebuilt `a - -b`, `x / /re/`, and `import type * as V` render with their spaces in each grammar that has the construct.
5. **The census count of fallback seams only falls** once the token tables are in.

## Out of scope

- Newlines and indentation: unchanged; the depth-carrying brace seams and the list flanks keep their designs.
- Per-tree formats and the reformat pass (render-options plan 4).
- A formatter. The default is valid output, not pretty output.
