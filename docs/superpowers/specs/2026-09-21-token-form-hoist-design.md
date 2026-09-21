# Token forms: a lexeme's alternation becomes parser kinds

Status: Approved design, not implemented.

## Problem

Several grammars author a literal as one token whose body is an alternation
of forms: typescript's `number` is `token(choice(hex, decimal, binary, octal,
bigint))`, its `escape_sequence` is `token.immediate(seq('\\', choice(six
patterns)))`, rust's `integer_literal` is `token(seq(choice(four patterns),
optional(suffix)))`, python's `integer` and `float` have the same shapes.
Tree-sitter sees one symbol for each, so sittir reads one opaque text leaf and
the forms are invisible to the model, the factories and the vocabulary.

Two mechanisms exist and neither reaches these rules:

- `hoistTokenChoiceForVariants` rewrites `token(choice(A, B))` into
  `choice(token(A), token(B))`, which is how typescript's `comment` became
  `comment_line` and `comment_block`. It runs only when `variant()` names the
  arms, only for a choice at the top of the token, and only when every arm is a
  seq led by a string literal. Four of `number`'s five arms fail that guard.
- The token-interior pass structures `token(seq(...))` into literal templates
  and named slots. It reads only the top-level seq, so a token whose top is a
  choice gets nothing.

A third fact was hidden by coincidence: rust's `integer_literal.suffix` is an
enum inside a lexeme, and its values are stored as the kind ids of the `u8`,
`i32`, … tokens that `primitive_type` happens to mint elsewhere. Tree-sitter
issues no symbol for a literal inside a token, so an interior enum whose
spellings appear nowhere else (typescript's `0x`) has no id to borrow.

## Decision

### Choices under a token classify by what their arms are

| choice | example | is | treatment |
| --- | --- | --- | --- |
| an arm is `BLANK` | `optional(exponent)`, `optional(suffix)` | presence | token-interior flag (a literal) or folded into the enclosing content slot's regex (a pattern) |
| every arm a string literal | `choice('0x', '0X')`, rust's fourteen suffixes | spelling | token-interior enum slot, named `prefix` or `suffix` |
| two or more non-blank arms, at least one not a literal | `number`'s five arms, `escape_sequence`'s six patterns | forms | hoisted: one token kind per arm |

Only the third row is new. The first two are what the token-interior pass
already models at a token's top level.

### The outermost form alternation of a whole-rule token hoists, unconditionally

For a rule whose body is a `token(...)` or `token.immediate(...)`, the DSL
transform layer hoists the first form alternation on every path from the token
root, wherever it sits, by distributing the enclosing structure over the arms:

```
token(choice(A, B, C))              → choice(token(A), token(B), token(C))
token(seq(P, choice(A, B), S))      → choice(token(seq(P, A, S)), token(seq(P, B, S)))
```

The token wrapper (plain or immediate) and any precedence wrapper are kept on
every arm. A form alternation nested inside an arm is not hoisted; it stays in
that arm's lexeme and the token-interior pass folds it into the arm's content
regex, exactly as it does today. Choices in the first two rows are never
hoisted; they stay in place for the token-interior pass to seat.

The rewrite runs in the DSL layer that both pipelines execute, so tree-sitter
lexes the minted tokens and the model reads them. Each arm mints as
`<rule>_arm` or `<rule>_armN` through the same naming enrich uses for a minted
choice arm, and the rule becomes the supertype over its arms, the way `comment`
is over `comment_line` and `comment_block`.

The hoist needs no declaration. `variant()` on a hoisted arm is a rename and
nothing else: `number: { 0: variant('hex') }` turns `number_arm1` into
`number_hex`. A `variant()` addressed at a form alternation nested inside an
arm hoists that alternation too, by the same distribution, one level deeper.
This retires the string-led-seq guard and the variant-triggered hoist, since
the unconditional pass subsumes both.

### Why it lexes the same

Inside one token, tree-sitter takes the longest matching alternative. Across
the minted tokens, the lexer takes the longest valid token, and every arm is
valid in exactly the parse states its parent was, so longest match decides
identically. Overlapping prefixes (`0` under `0x`, `123` under `123n`) are
therefore fine. Two hazards remain and the hoist checks them: an arm that can
match the empty string, and two arms whose text sets are identical. Either is a
compile-time diagnostic naming the rule and the arms.

### Nothing inside a lexeme has a kind id

A kind id is a parser-issued identity. A literal inside a token is not a
parser symbol, so a token-interior enum stores its value as text, typed as the
union of its spellings (`'0x' | '0X'`), and renders it verbatim; a
token-interior flag stores a boolean. This applies uniformly: rust's
`integer_literal.suffix` stops borrowing `primitive_type`'s kind ids and
becomes `'u8' | 'i8' | … | 'f64'`. The config surface already accepts the text,
so callers do not move; only the stored type changes. The phantom-kind ratchet
cannot move, because no interior value mints a kind.

## Effect

Every `token(...)` containing a choice in the three grammars is a whole-rule
token; there are ten. None is pure-literal and none is embedded inside a larger
rule, so the pass has no other targets.

| grammar | rule | minted kinds | interior of each arm |
| --- | --- | --- | --- |
| typescript | `number` | 5: hex, decimal, binary, octal, bigint | hex/binary/octal: prefix enum + content; decimal: content; bigint: content + `n` template |
| typescript | `escape_sequence` | 6, one per escape pattern | `\` template + content |
| typescript | `regex_pattern` | 3 | content |
| rust | `integer_literal` | 4: decimal, hex, binary, octal | content + optional suffix enum |
| rust | `char_literal` | 2 plus an absent form | `b` flag, quote templates, content |
| rust | `escape_sequence` | 4 | `\` template + content |
| python | `integer` | 4 | prefix enum + content, optional long suffix |
| python | `float` | 3 | content with the optional suffix folded in |
| python | `escape_sequence` | 7 | `\` template + content |
| python | `line_continuation` | 2 | templates only |

The minted kinds carry placeholder names until a `variant()` renames them.
Renaming is grammar-file work and is not part of this design.

## Gates

- Typescript first: apply the pass, regenerate, and compare the validation
  numbers before rust and python. Coverage totals rise with the new kinds;
  no read-render-parse or roundtrip count may fall.
- The full corpus round-trips for every hoisted rule, which proves the
  longest-match equivalence on real input rather than by argument.
- Kinds the pass does not touch regenerate byte-identical.
- The phantom-kind count does not rise.
- The generated node tests cover every minted kind, including the render test.

## Out of scope

- Form alternations nested below the outermost one. They remain reachable by
  an explicit `variant()` at the nested path.
- Tokens embedded inside a larger rule's body and tokens whose alternation is
  purely literal. The census finds none; if one appears, it gets a diagnostic,
  not a silent hoist.
- Vocabulary names for the minted kinds.

## Amendments

The token-interior design's storage sentence is amended: an interior enum is
text-stored and an interior flag is a boolean; neither carries a kind id. The
sentence there stating that `variant()` cannot mint inside `token()` stands,
and this design is the mechanism that mints instead.
