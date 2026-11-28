# Java Overrides Glossary

Per-rule reference for `packages/java/grammar.sittir.ts`: each patch the layer
makes to the upstream grammar, the language production it follows, and what
would break without it.

---

### `_multiline_string_literal` — the opening line (`packages/java/grammar.sittir.ts`, `rules:`)

Reauthored with `accepts-invalid-syntax`. The JLS TextBlock production is
`"""` {TextBlockWhiteSpace} LineTerminator {TextBlockCharacter} `"""`: the
opening delimiter is followed by optional spaces, tabs or form feeds, then a
line terminator, before any content. Upstream puts the content right after
`"""`, so it reads `""""""` and `"""x"""` as text blocks, which javac rejects
("illegal text block open delimiter sequence, missing line terminator").

The rule keeps upstream's members and inserts, after the opening `"""`:

- `white_space`: an optional `text_block_white_space`;
- the line terminator: `_line_terminator`, `token.immediate(/\r?\n|\r/)`,
  aliased to the anonymous `"\n"`.

Both are immediate, so a comment between the delimiter and the line terminator
is an error, as in javac. One token holds every JLS LineTerminator, so `\r\n`
lexes whole. The content no longer holds the opening line break, so a fragment
starts after it.

The line terminator is a fixed `\n` to the render, not a slot: the render
writes every line break in the render's line ending (`layout.newline`), so
`build.stringLiteralTextBlock()` renders `"""\n"""`, or `"""\r\n"""` under
`newline: '\r\n'`. `_line_terminator` is authored because enrich lifts a token
inside an alias into a rule of its own, and a layer must be enrich's fixpoint.

### `text_block_white_space` (`packages/java/grammar.sittir.ts`, `rules:`)

The JLS TextBlockWhiteSpace run between the opening `"""` and its line
terminator: `token.immediate(/[ \t\f]+/)`. It is authored as a kind because
enrich would promote the pattern in the `white_space` field to a kind of its
own, and a layer must be enrich's fixpoint. `bindings.scm` marks it
`@unclaimed` as a layout token: the white space before the line terminator is
no part of the string's value.
