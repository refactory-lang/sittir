# A token's interior is its slot structure

**Status:** Implemented for every kind in the census. Generalizes item 3 of the minor factory-ergonomics
page (`2026-09-17-factory-ergonomics-minor.md`), which becomes its first
application. Builds on the text-content design
(`2026-08-26-text-content-vs-source-provenance.md`): a read node is a
coordinate, a built node is a transport.

---

## Problem

A text leaf's factory takes the token's whole text, and its `$text` is the
whole text on read. Where the token always carries a fixed affix, the
caller writes it and the model does not know it is there:

```ts
ir.charLiteral("'a'")   // → 'a'
ir.charLiteral('a')     // → a — nothing tests it; invalid output
ir.shebang('#!/usr/bin/env rust-script\n')
ir.metavariable('$x')
```

The parser knows more than the model uses. `char_literal` is
`token(seq(optional('b'), "'", …, "'"))`; the delimiters and the optional
byte prefix are members of the rule, flattened to one text only because the
model treats a token as opaque. And where a token is one regex — `shebang`
`/#!.*/`, `metavariable` `/\$[a-zA-Z_]\w*/` — the regex has structure the
author could name and nothing reads.

Meanwhile `renderAs` gives an external symbol a sittir-side rule body because
the parser has none. It is the right idea applied only where it was forced.

## Decision

**A token's interior is its model rule.** The model does not flatten a token
to one text. Inside `token(…)` / `token.immediate(…)`:

- a **string member** is template text — written on render, stripped on
  read, never stored;
- a **pattern member** is a text slot;
- an **`optional(string)`** is a presence flag, as any optional keyword
  (`{ b: true }` — the name is the text of the flag, as any unwrapped optional keyword would derive it);
- a **`field(name, …)`** names the slot it wraps; an unnamed pattern member
  in a token with exactly one pattern is the kind's content.

**A capture group is a field inside a regex.** Where a token is a single
pattern, a named group names a slot: `/#!(?<content>[^\n]*)\n/`,
`/\$(?<name>[a-zA-Z_]\w*)/`. The text outside the groups is template text;
the groups are slots. The lexer does not distinguish a capturing group from
a non-capturing one, so the group is parse-side inert and model-side a
field. A pattern with no group stays whole-text — `identifier`, `integer`
— which is where the line falls: the author draws it with a `(?<…>)`,
and the compiler never guesses.

Every consumer follows the one rule: the factory takes the slots
(`ir.charLiteral('a')`, `ir.charLiteral({ content: 'a', b: true })`, `ir.metavariable('x')`),
the type is the slots, the template writes the literal runs around them,
the guard tests each slot's own pattern, and the reader projects the token's
text through the same structure into the same slots. `$text` of a read
leaf is its content, not the token.

Content is the body as written: an escape stays escaped (`\n` is two
characters). Structure is the affixes and flags, nothing else.

**`renderAs` keeps its one job.** A model rule where the parser has none —
an external symbol. A token that has a parse rule never needs it; its
structure is read from the rule.

## The projection is a closed set

The reader realizes a parse node into the model rule's slots by exactly one
of these, classified at compile time from the pair (parse shape, model
shape). Anything else is a compile-time diagnostic.

| parse → model | on read | examples |
| --- | --- | --- |
| token → literals only | nothing stored; the text is fixed | `_automatic_semicolon`, doc-comment markers (`renderAs`) |
| token → literals around one slot | strip prefix and suffix, store content | `char_literal`, `shebang`, `#name`, `escape_sequence`, python `comment` |
| token → literals and several slots | anchored match of the model rule's patterns | rust `integer_literal` (content and an optional suffix enum) |
| compound → text | store the whole span | `raw_string_literal` (the hybrid kind of the text-content design) |
| compound → compound, same slots | none; a render-only difference | separator and seam spacing, already derived rather than authored |

The second row needs no regex engine on the native side: the affixes are
literals of known length. The third row is one anchored expression with a named group per slot,
serialized once (`interiorOf`) and matched by `projectInterior` in the wrap
layer; the native crates keep the token whole and carry no regex dependency.

## Two transports, one fact

A read leaf is a coordinate until it is edited: untouched, it renders by
folding its span, affixes and all. A factory-built or edited node renders
through the kind's typed transport, which holds the slots and writes the
literal runs from the rule. The two agree only because the reader strips
exactly the literals the template writes — one rule, read by both. Hence:

- `$text` of a read node is content, and every projection that builds a
  transport from a read node — the wrap accessor, `nodeToConfig`,
  `materializeWrappedNodeData`, the strict-rebuild emitter — sees content
  and never hands the typed transport an affixed string, where the affixes
  would double.
- A `$with` setter or `markEdited` detaches the coordinate; from then on the
  typed transport renders the node from its slots.
- The Verbatim arm is never built from a factory node (it has no
  coordinate) and the typed arm is never fed a read node's whole text. Slot
  transport enums already hold a Verbatim arm beside the typed leaf arm for
  text kinds; a structured token is that same pair.
- The reader's text-capture classification has one more case beside
  verbatim-whole and structured: content-with-affixes, stripped on read.

## Where it applies

The census is `.sittir/src/grammar.json`: a `token(seq(…))` whose first or
last member is a string, or a single pattern whose regex opens or closes on
a literal. Nine kinds across the three grammars:

| kind | parse rule today | what the model reads |
| --- | --- | --- |
| rust `char_literal` | `token(seq(optional('b'), "'", …, "'"))` | flag `b`, content, affixes `'` `'` — nothing to author |
| rust `escape_sequence`, typescript `escape_sequence`, python `escape_sequence` | `token(seq('\\', …))` | prefix `\`, content — nothing to author |
| typescript `private_property_identifier` | `token(seq('#', …))` | prefix `#`, content — nothing to author |
| python `comment` | `token(seq('#', /.*/))` | prefix `#`, content — nothing to author |
| rust `shebang` | `/#![\r\f\t\v ]*([^\[\n].*)?\n/` | re-authored: `/#!(?<content>[\r\f\t\v ]*(?:[^\[\n].*)?)\n/` |
| typescript `hash_bang_line` | `/#!.*/` | re-authored: `/#!(?<content>.*)/` |
| rust `metavariable` | `/\$[a-zA-Z_]\w*/` | re-authored: `/\$(?<name>[a-zA-Z_]\w*)/` |

Six kinds need nothing: their parse rules already carry the structure.
Three are single regexes and are re-authored with a named group. A regex
re-authoring is a `patches:` entry at the rule's path, like every other
authored fact — the `rules:` block is retired, and a placeholder that
replaces a pattern's regex is the spelling.

Rust's `lifetime` (`seq("'", identifier)`) and its line-comment markers
(`renderAs` externals beside a content leaf) are the existing precedents;
this design makes their shape the rule for tokens too.

### Comments

Comments are the case where all three token shapes meet, and the three
grammars already hold one each:

| grammar | parse rule | under this design |
| --- | --- | --- |
| python `comment` | `token(seq('#', /.*/))` | one content slot behind the `#` affix: `ir.comment(' note')` → `# note` |
| typescript `comment` | `token(choice(seq('//', /.*/), seq('/*', …, '*/')))` | the choice is hoisted above the token, so the parser has two token kinds, `comment_line` and `comment_block`, and `comment` is the supertype over them: `ir.comment.line(' note')` and `ir.comment.block(' note ')`, each arm literals around one slot |
| rust `line_comment`, `block_comment` | already structured — marker externals through `renderAs`, content leaves `line_comment_content`, `line_doc_content`, `block_comment_content` | unchanged; the shape the other two now take |

**A `choice` inside a token is a choice of tokens.** `variant()` in `patches:` on the arms of a token's top-level
choice hoists the choice above the token — `token(choice(A, B))` becomes `choice(token(A), token(B))` — before the
variants are minted, in the DSL layer both pipelines run. Each arm is then its own token kind with its own kindId and
its own interior (marker and content), and the parent is the supertype over them, so the forms need no dispatch of
their own: the reader sees the kind the parser issued. An arm that is not a seq led by a string is an error. The
parent, being an extra, is replaced in `extras` by its arms. Python's string prefixes (`f"`, `rb'`)
are the same shape on `string_start` and take the same treatment.

**Trivia is not touched.** A comment carried as trivia on another node
(`$trivia({ leading: […] })`) is verbatim text on the read side and the
render side alike, and stays so; this design covers a comment built or
read *as a node*. Typing trivia entries as comment nodes is a separate
design.

## Constraints verified

- tree-sitter 0.26.9 `generate` accepts `(?<name>…)`, preserves the pattern
  verbatim in `src/grammar.json`, and the generated lexer parses identically
  to the same pattern without the group (checked on a scratch grammar with
  `\$(?<name>…)` and `#!(?<content>…)`).
- `grammar.json` is therefore a sufficient source for the group names; the
  compiler reads them from the ground-truth artifact, not the DSL source.

## Gates

- `ir.charLiteral('a')` renders `'a'`; `ir.charLiteral({ content: 'a', b: true })`
  renders `b'a'`; a read `'a'` projects to content `a` with `b` absent; the
  rebuilt node is byte-identical to the read one. The same for each kind in
  the census.
- The guard rejects `ir.charLiteral("'a'")` by name.
- `read-render-parse`, `factory-render-parse` and `ir-render-parse` counts
  unchanged in all three grammars; the byte axis stays green.
- The generated strict rebuilds spell char literals, shebangs and
  metavariables by their content.
- The seam census does not change: template text inside a token is written
  by the leaf's own render function, and no seam is minted inside a token.

## Out of scope

- Decoding or encoding escapes. Content is the source spelling.
- A regex engine in the native crates; the multi-slot row waits for a grammar
  that needs it.
- Typing trivia entries as comment nodes.

## Amendments

### Three shapes, kept distinct

The design covers leaves the parser emits as one childless node, and it
takes their interior structure from exactly one place per shape:

| shape | parse node | where the interior comes from | examples |
| --- | --- | --- | --- |
| `token(…)` / `token.immediate(…)` over a rule | one node, no children | the rule's own members: strings are template text, patterns are slots, `optional(string)` is a flag, a choice is forms | typescript `comment`, `private_property_identifier`; rust `char_literal`; every `escape_sequence`; python `comment` |
| bare pattern | one node, no children | named groups the author draws in the regex; a pattern with no group has no interior and stays whole-text | rust `metavariable`, `shebang`; typescript `hash_bang_line` |
| structured rule with external pieces | a node with children | the parse tree itself; `renderAs` gives an external a body because the parser has none | rust `line_comment`, `block_comment` |

The first two are the subject of this design and share one read rule: the
node is stored whole and projected lazily. The third is the existing
compound path and is not changed; it is listed only because it is what the
first two come to resemble. Whole-text leaves — `identifier`, numbers,
string fragments — are the first two shapes with no interior, and nothing
about them changes.

### The model type follows the interior

A token wrapper is not a class. Today `classifyNode` reaches a
content-bearing token through `classifyTerminalFallback`, where any all-text
shape becomes `pattern`; that is how typescript `comment` and `identifier`
and rust `char_literal` are `pattern` leaves with no pattern on the node,
and why their factories carry no regex. Under this design the classifier
reads the interior as if the wrapper were absent, and the wrapper stamps
one attribute on whatever class results: the kind is lexed and read as one
text, and every seam inside it is immediate.

| interior | model type | as it would be unwrapped |
| --- | --- | --- |
| one pattern | `pattern` | `identifier`, `number` |
| one string | `keyword` or `punctuation` by word shape | `_automatic_semicolon` |
| a choice of strings | `enum` | rust `mutable_specifier` |
| strings and patterns in a sequence | the compound class the sequence yields, its string members immediate faces, its pattern members slots | `char_literal`, `private_property_identifier`, python `comment` |
| a choice of such sequences | the compound with forms, one per arm | typescript `comment` |

Consumers follow the class, not the wrapper: the factory, types, guard,
render body and lazy projection of a token-wrapped compound are those of a
compound whose leaves are immediate. A bare pattern with named groups is the
fourth row with the groups as its pattern members.

### The read side does not drill

A token is one parse node with no children; the typescript parser gives
`// hello` and `/* block */` as childless `comment` nodes spanning the
markers. The reader therefore stores a token whole: `$text` is the token's
text, the node is a coordinate, and no projection runs on read. This
supersedes "`$text` of a read leaf is its content" above.

The interior rule shapes the construction side only. A factory-built node
holds the slots and no `$text`; the renderer takes the coordinate's span
when `$text` is present and the interior template, with immediate faces on
the string members, when it is not. Both spellings render the same bytes,
so the parse gates do not move.

The projection runs when a read node is wrapped, which is itself lazy: a
node nobody drills into is never wrapped. `wrap` matches `$text` against the
kind's `TOKEN_INTERIORS` entry and seats the slots as stored values, and
`nodeToConfig`, `materializeWrappedNodeData` and the strict-rebuild emitter
read them through the accessors. A read node and a built node satisfy one
shape, because the accessors answer the same questions on both; the
difference is where the answer is stored.

### Slot names come from the ordinary derivation

An interior member is named exactly as it would be outside the token: a
`field()` names its slot, and an unnamed member takes the name the
derivation gives any bare member of a sequence. No token-specific naming
rule exists; "content" above is what that derivation happens to yield for a
single bare pattern, not a rule of its own.

### Census, verified against `grammar.json`

No token in any of the three grammars has a non-terminal underneath: every
`token(…)` / `token.immediate(…)` interior is strings and patterns only
(22 rules: rust 6, typescript 11, python 5). Of these, the interiors that
mix a string marker with a pattern, and so gain structure, are:

| grammar | kind | interior |
| --- | --- | --- |
| typescript | `comment` | `//` + pattern, or `/*` + pattern + `/` |
| typescript | `private_property_identifier` | `#` + pattern |
| typescript, rust, python | `escape_sequence` | `\` + one of several patterns |
| python | `comment` | `#` + pattern |
| rust | `char_literal` | optional `b`, `'`, escape or pattern, `'` |
| rust | `integer_literal` | pattern + optional suffix string |

A bare pattern rule is a lexer token too — one childless node — so the same
read rule holds, and its structure comes from a named group in the regex
rather than from token members:

| grammar | kind | parse rule | authored structure |
| --- | --- | --- | --- |
| rust | `metavariable` | `/\$[a-zA-Z_]\w*/` | `/\$(?<name>[a-zA-Z_]\w*)/` |
| rust | `shebang` | `/#![\r\f\t\v ]*([^\[\n].*)?\n/` | `/#!(?<content>[\r\f\t\v ]*(?:[^\[\n].*)?)\n/` |
| typescript | `hash_bang_line` | `/#!.*/` | `/#!(?<content>.*)/` |

The rest (identifiers, numbers, string fragments, regex flags) are lexical
shape with no marker and stay whole-text. Rust's own comments are not
tokens: `line_comment` and `block_comment` are sequences of a marker string
and scanner externals in the upstream grammar, so the parser already emits
their pieces as children and the reader fills their slots from the tree;
`renderAs` there gives the externals a body, and nothing re-parses a token.
They are the shape the token-wrapped comments now take, not a precedent
for the reader.

### Realization

- **Link.** `compiler/token-interior.ts` rewrites a structured token into a seq of literals and FIELD-named slots.
  A presence flag is a slot-promoted literal (`nonterminal: true`), which flatten preserves. A bare pattern with
  named groups becomes a seq stamped `lexed`; the `regex()` patch placeholder authors the group, and a group beside
  non-literal top-level regex is an error.
- **Gate.** A token gains structure only when a string, flag or enum member sits beside a slot that contains a
  pattern. Admitted: rust `char_literal`, `integer_literal`, `escape_sequence`, `metavariable`, `shebang`;
  typescript `escape_sequence`, `private_property_identifier`, `hash_bang_line`, `comment_line`, `comment_block`; python `comment`,
  `escape_sequence`. Rejected by the gate (no pattern slot, or no literal member): python `line_continuation`, the
  whole-text leaves (`identifier`, numbers, string fragments, regex flags) and typescript `regex_pattern`, which
  has no top-level affix. Not reached: rust line and block comments (`renderAs` externals over content leaves).
- **One derivation.** `interiorOf` serializes the entries, the anchored expression and the slot config keys. Its
  consumers are `node-model.json5`, the `TOKEN_INTERIORS` table in `consts.ts`, the wrap projection, the leaf
  registry that resolves whole-token text in a loose position, and the per-slot guards. An optional member the
  neighbouring pattern could absorb is a compile-time error naming the kind and both members.
- **Consumers.** The raw builder guards each text slot with its own anchored pattern and names kind and slot on
  failure. The loose coercer accepts a bare string as the sole required text slot. The render template glues the
  members with adjacency marks and a lexed kind owns no seams and no kind edges, so the interior addresses that the
  old text leaf never used are gone from the options surface. The strict rebuild prints a text slot as its content.
- **Transport.** A text slot is a `String` field of the typed transport; the reader keeps `$text` for a lexed kind.
