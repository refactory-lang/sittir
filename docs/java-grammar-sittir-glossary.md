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
- `line_terminator`: one of `\n`, `\r\n` or `\r`, each an immediate token.

Both are immediate, so a comment between the delimiter and the line terminator
is an error, as in javac. `\r\n` has lexical precedence 1: `\n` is also a
separator in the extras, and tree-sitter would otherwise stop at `\r` and read
the `\n` as the start of the content. The content no longer holds the opening
line break, so a fragment starts after it.

The line terminator is layout, not a member of the portable vocabulary: the
`_labels` entry `string_literal_text_block/line_terminator:` binds it to the
preference group `text_block`, whose `line_terminator` defaults to `\n`, so
`build.stringLiteralTextBlock()` renders `"""\n"""`.

### `text_block_white_space` (`packages/java/grammar.sittir.ts`, `rules:`)

The JLS TextBlockWhiteSpace run between the opening `"""` and its line
terminator: `token.immediate(/[ \t\f]+/)`. It is authored as a kind because
enrich would promote the pattern in the `white_space` field to a kind of its
own, and a layer must be enrich's fixpoint. `bindings.scm` marks it
`@unclaimed` as a layout token: the white space before the line terminator is
no part of the string's value.
