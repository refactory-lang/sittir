# Pattern semantics

**Status:** Design. Implementation on hold until the user lifts it.

## Problem

A grammar `PATTERN` is written in JavaScript literal syntax, but tree-sitter gives it
Rust `regex-syntax` meaning. sittir turns patterns into JavaScript regexes in several
places, each on its own, by patching the pattern text:

| Site | What it does |
|---|---|
| `types/runtime-shapes.ts` `compileAnchoredPattern`, `patternAcceptsEmpty` | anchors, tries the `u` flag, then no flag |
| `compiler/model/leaf-pattern.ts` `stripUselessEscapes`, `anchoredLeafRegex`, `leadingRegex`, `anchoredLeafRegexLiteral` | strips escapes `u` rejects, then the same retry |
| `util/word-matcher.ts` `compileWordMatcher`, `ruleToRegexSource`, `wordCharClass` | joins a token rule tree's text into one source, same retry |
| `emitters/test.ts` | the same retry, for sample candidates |
| `emitters/interior.ts`, `emitters/from.ts` | token-interior regexes compiled with `su` |
| `compiler/model/pattern-automaton.ts` | a hand-written parser, NFA and DFA for the line-end fact |

None of them applies tree-sitter's meaning. The generated guards therefore disagree with
the parser in ways nothing reports. The rust line-comment guard `/^(?:(?:.*))$/u`
rejects `"foo\r"`, which the parser accepts, because JS `.` excludes `\r`. The `s`
flag on interior regexes lets `.` match `\n`, which tree-sitter's `.` never does. A
pattern also written without `u`, such as rust's `[_\p{XID_Start}]`, only means what
the author meant because the retry happens to try `u` first.

## Goal

Every pattern is parsed once into a typed tree. One rewrite gives that tree
tree-sitter's meaning. Every client-side artifact is derived from the rewritten tree:
the runtime guards, the joined token-rule regexes, the automaton, and the facts and
types read from the automaton. No site reads or patches pattern text.

## Facts this design rests on

- tree-sitter uses `regex-syntax` only in `tree-sitter generate`. `expand_tokens.rs`
  turns every token into one lexer automaton, emitted as `ts_lex` in `parser.c`. At
  parse time no regex engine runs. The runtime truth is the character ranges in
  `ts_lex`.
- Before parsing a pattern, `expand_tokens.rs` (tree-sitter 0.26.9) replaces text:
  `\w` → `[0-9A-Za-z_]`, `\s` → `[\t-\r ]`, `\d` → `[0-9]`, and `\W`, `\S`, `\D` → their
  negations. It then parses with `unicode(true)` and `utf8(false)`, so `.` excludes only
  `\n`. The `i` flag turns on case folding. Assertions are rejected.
- The two dialects agree on every operator: concatenation, alternation, repetition,
  optional and groups. They differ only in the character set some atoms denote.
  Replacing each such atom with its set preserves the language exactly, so the
  translation is a static, node-by-node rewrite.
- A guard is an anchored whole-string test. Membership in the language does not depend
  on how the engine searches (tree-sitter's longest match, JS backtracking), so an
  anchored JS regex with the right character sets accepts exactly the pattern's
  language.
- `@sittir/regex` parses JS regex syntax. All 77 distinct patterns in the five grammars
  parse through its native engine with no error node, and each renders back
  byte-identical to its source. None of them carries a flag.

## Design

### One parse

The pattern module parses a `PATTERN` rule's `value` with `@sittir/regex`, reading it
into the typed tree (`parseAndRead`, deep). It is the only place pattern text is read.
The result is cached per pattern text. A parse with an error node is the blocking
diagnostic `pattern-unparsed`.

### One rewrite to tree-sitter's meaning

The rewrite is a typed transform over the tree, built with `@sittir/regex`'s `is.*`
guards and `ir.*` builders. Each rule replaces one atom:

| Atom | Rewritten to |
|---|---|
| `.` (`any_character`) | the class `[^\n]` |
| `\w` `\s` `\d` (`character_class_escape`) outside a class | the class tree-sitter substitutes |
| `\W` `\S` `\D` outside a class | the negated class |
| `\w` `\s` `\d` inside a class | their ranges, spliced into the enclosing class |
| `\W` `\S` `\D` inside a class | the complemented ranges, spliced in |
| a `\p{…}` JS does not name, whose `Script=` form it does | `\p{Script=…}` |

Everything else is kept as it is. The rewrite reads only the tree, never the text, so
tree-sitter's textual replacement is reproduced by meaning, not by string edits.

Constructs whose meaning differs and that the rewrite does not translate are blocking
diagnostics, `pattern-dialect-divergence`, naming the construct and the owner kind:

- an unescaped `[` inside a class (a nested class in tree-sitter, a literal in JS);
- `&&`, `--` or `~~` inside a class (set operations in tree-sitter);
- a `\\` followed by `w`, `s`, `d`, `W`, `S` or `D` (tree-sitter's textual replacement
  rewrites these as well, which changes the pattern's meaning);
- a `\p{…}` with neither a JS name nor a `Script=` form (`pattern-property-unsupported`);
- any flag on the `PATTERN` (`pattern-flag-unsupported`).

No grammar has any of these today. The diagnostics make the translation exact by
construction: every pattern either translates atom for atom or is reported.

These are grammar diagnostics, checked on the evaluated rule tree before link. They
follow the existing rules: they are recorded at the raw, enriched and final stages, and
the final stage is the gate.

### Every artifact derived from the rewritten tree

**Guards.** The guard source is the rewritten tree rendered by `@sittir/regex`'s
renderer, anchored `^(?:…)$` or `^(?:…)` for a leading match, and always compiled with
`u`. This replaces `stripUselessEscapes`, the `u`/no-flag retry, and every per-site
compile. Emitted guards are written as literals from the same rendering.

**Joined token rules.** A token rule tree (`TOKEN`, `SEQ`, `CHOICE`, `REPEAT`,
`REPEAT1`, `OPTIONAL`, `STRING`, `PATTERN`) is joined into one regex tree with `ir.*`
builders: a `STRING` becomes literal characters, a `PATTERN` its rewritten tree, and
the combinators alternation, concatenation and quantifiers. The word matcher,
`patternAcceptsEmpty` and the token-interior regexes all read this joined tree. The
token-interior regexes drop the `s` flag: `.` is already `[^\n]`.

**Automaton.** The rewritten tree maps directly to `refa`'s expression form: about ten
node kinds, with character sets built from the tree's ranges and properties. `refa`
builds the NFA and the minimized DFA. The line-end fact (`crossesLine`,
`absorbsRestOfLine`, `opensLineEnd`) and the pattern-derived literal types read this
DFA. `pattern-automaton.ts`'s own parser, NFA and determinizer are deleted.

**Types.** The template-literal recognizer types of the literal-types design read the
same DFA, so a type can never accept less than its guard.

### Module

One module, `packages/codegen/src/pattern/`, owns parse, rewrite, join, render and
automaton. Every site in the problem table calls it, and none keeps its own compile
path. Its declarations are documented in a new glossary, `docs/glossary/pattern.md`.

### The `@sittir/regex` dependency

`@sittir/codegen` depends on `@sittir/regex`, which `@sittir/codegen` generates. This
is a bootstrap, the same shape as a compiler built by an earlier build of itself:

- The committed `packages/regex` sources and its built native binding are the
  generator's regex parser. The binding is built before any grammar is generated.
- **Fixed point:** after regenerating `packages/regex`, regenerating all five grammars
  must be byte-identical. A change that breaks the regex package therefore fails at
  once instead of when a later change hits a pattern.
- **Round trip:** a permanent test parses and renders every distinct grammar pattern
  and compares it with its source.
- **Version:** the dependency is `workspace:*` while no `@sittir/*` package is
  published. Once publishing works, it becomes an exact version, raised only in its own
  commit, which passes the fixed-point check.

## What moves

- **Generated guards change text.** `.` becomes `[^\n]`, `\w`, `\s` and `\d` become
  their classes, and the escape stripping disappears. Every such change is a meaning
  fix toward the parser, not a refactor, so byte-identity is not the gate.
- **The gate:** validation rows equal or better on all grammars; the line-terminated
  kind sets unchanged; each changed guard literal listed in the commit with the
  tree-sitter rule behind it.
- The rust line-comment guard accepts `\r`, and the interior regexes stop matching
  `\n` with `.`.

## Testing

- Round trip of every grammar pattern (above).
- The rewrite, one case per atom in the table, inside and outside a class, checked
  against the tree-sitter text replacement it reproduces.
- Each divergence diagnostic fires on a fixture pattern and is absent on the five
  grammars.
- Guard agreement: for every grammar pattern, the guard and the DFA agree on a sample
  set drawn from the DFA (accepted strings) and its complement (rejected strings).
- The line-end fact over the new DFA gives the same line-terminated kind sets on all
  five grammars.
- The fixed-point check (above).

## Out of scope

- Checking translated character sets against the ranges in `parser.c`'s `ts_lex`. It
  would compare against what runs, and can be added later; the translation table is
  small and pinned by tests.
- Unicode data versions. `\p{…}` resolves through V8's tables in the guards and the Rust
  crate's tables in tree-sitter; a code point added between the two versions could
  differ. The difference is not tracked.
- Resolving tokens against each other (keyword over identifier, longest match). A guard
  checks one token's language; the parser can still pick another token. The types
  accept a superset of what parses, and the reserved-word type covers keywords.
- Publishing `@sittir/*` packages.
