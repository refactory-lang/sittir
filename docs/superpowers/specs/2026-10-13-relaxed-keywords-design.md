# Relaxed keywords read as the word rule: design note

A grammar lets some keywords stand as names by aliasing the keyword literal to its word rule: python's `keyword_identifier` (`alias('print', $.identifier)` for `print`, `exec`, `async`, `await`, `type`, `match`), rust's primitive types and `default`, `union`, `gen` in paths and patterns, and typescript's contextual keywords (`type`, `get`, `async`, `let` and others) in expressions, parameters and imports. Sittir reads such a name as the keyword's own kind today (`str_keyword`, `type_keyword`), and its slots admit the keyword kinds beside `identifier`. This note makes the name read and build as plain `identifier`. The upstream grammar, the enriched grammar and the generated parser are unchanged; only link, the model and the reader's stamping change.

## What tree-sitter issues

Probed on a toy grammar and on python, at ABI 15, the version sittir generates:

- An in-place `alias('u8', $.identifier)` issues a node whose public symbol (`kind_id`) is `sym_identifier`, because an alias whose name is an existing named symbol takes that symbol's id. Its grammar symbol (`grammar_id`) is the keyword token, `anon_sym_u8`, the same token the keyword is everywhere else. The node is a leaf with the keyword's text.
- The alias is needed only where the keyword is valid in the same parse state (python's statement start, rust's paths that open with a primitive). There the lexer returns the keyword token whatever any reserved set says: a reserved set makes a word more reserved, never less. So no reserved-word rewrite can replace the alias. Rewriting python's `keyword_identifier` to `reserved('relaxed', $.identifier)` turns `print = 1`, `match = 2`, `type = 3`, `exec = 4` and `async = 5` into parse errors.

## Recognition

A **relaxation site** is a named alias whose display is the grammar's `word` rule and whose content is a literal that the grammar's link-pinned `wordMatcher` accepts and that has a keyword-token row in the catalog. A choice of such literals under one alias counts arm by arm, as alias distribution already splits it. Link stamps the fact on the alias rule (`relaxation: true`) when it resolves the literal; nothing reads the literal's shape again later.

On master every alias to the word rule in the three grammars is a relaxation site: python 7, rust 75, typescript 122.

A display that is itself an alias of the word rule (typescript's `property_identifier`, `statement_identifier`, `shorthand_property_identifier` and its pattern) counts as the word for recognition: a word-shaped literal aliased to it is a relaxation site too. The slot holds the display alias, and the node reads as that display over identifier content with the keyword's text. The generated `relaxes` and the node model's `relaxes` table carry the tokens per display; the validators compare nodes by that read identity.

Enrich does not mint a storage for a relaxation site (`mintInlineLiteralAliasStorage` skips it), so the grammar keeps the in-place alias upstream wrote. With no mint, no display mixes terminal and nonterminal storages. The invariant that a display has one parser identity stands unchanged: `identifier` sits over terminal storages only, as the alias-identity spec already allows. A diagnostic that reads alias sites treats a stamped relaxation site as known, never as a fault.

## Link and the model

A relaxation site contributes only its display, the word rule, to the slot that holds it. The keyword kinds it would have contributed are not admitted there. They leave the slot's type, its factory parameter, its routes and its build arguments, and the slot's keyword list, which `rejectKeywordText` reads, drops them too, so `identifier('print')` is accepted where the grammar relaxes `print`. A keyword kind stays a kind wherever the grammar uses the keyword as one (rust's `primitive_type`, a macro token tree, python's `print_statement`).

## Read

The reader stamps `$type` in one place, `ReadCtx::stamped_kind(grammar, display)`, on every route (a coordinate, a surveyed child, a descendants walk, a query). It gains one case: a node whose display is the word rule and whose grammar id is one of the grammar's relaxed keyword tokens stamps the word rule. The generated grammar crate supplies the relaxed token ids, from the stamped sites, beside `shows`:

```
display != grammar && (shows(display) || (display == word && relaxed(grammar))) → display, else grammar
```

The mapping is scoped by construction. A keyword token carries the word rule as its display only where an alias renames it, which is a relaxation site; everywhere else the same token's display is the token itself, so it reads as the keyword. A slot-level mapping would not do, since a descendants walk or a query stamps a node without a slot in hand.

So a relaxed name has `$type` equal to identifier's kind id, and `is.identifier`, `ofType(identifier)` and `kindName` say `identifier`. No `identifier_*` kind exists, and no keyword kind is read where the grammar relaxes the word.

## Build and round trip

`identifier('print')` builds a plain identifier and renders `print`. Reparsed in a relaxed position, tree-sitter issues the keyword token under the `identifier` display, which reads as `identifier` again. The AST matches by stamped kind.

## Gates

- The red tests in `packages/{rust,python}/tests/leaf-alias-read-identity.test.ts` read `identifier` (rust `str`, `u8` and `default` in pattern position; python `print`, `match` and `type`), with a typescript case beside them (`let type = 1`).
- No catalog has an `identifier_*` kind or a `_identifier_*` rule.
- Each grammar's `parser.c` is byte-identical to master's: no new states or conflicts. The `_identifier_match` and `_identifier_type` conflicts came from the mint and do not arise.
- `validate:native` rows equal the base or better.
- A slot that admitted a relaxed keyword no longer lists it, and a build of `identifier('<word>')` passes there.
