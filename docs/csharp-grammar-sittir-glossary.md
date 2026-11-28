# C# Overrides Glossary

Per-rule reference for `packages/csharp/grammar.sittir.ts`: each patch the
layer makes to the upstream grammar, the language production it follows, and
what would break without it.

---

### `character_literal` — the closing quote (`packages/csharp/grammar.sittir.ts`, `edits:`)

The closing `'` is `token.immediate("'")`. The C# character literal is a
single lexical token: `'` Character `'`, where Character is one single
character or one simple, hexadecimal or Unicode escape. Upstream's closing
`'` is an ordinary token, so the extras may stand before it, and it reads
`'a '`, `'\n '`, `'\x41 '` and `'  '` as `'a'`, `'\n'`, `'\x41'` and `' '`,
which csc rejects. A space after the opening `'` is already an error
upstream, because the content and escape tokens are immediate.

The patch is an `edits:` entry, not a `reauthored` rule: the narrowed form has
the same members as the valid one, and only the extras between them differ,
which a witness form cannot state. The immediate `'` is a token of its own,
which the parser folds onto `'` as `squote2`.
