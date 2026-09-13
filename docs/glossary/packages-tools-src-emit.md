# `packages/codegen/src/packages/tools/src/emit` — Function Glossary

Per-function reference for `packages/codegen/src/packages/tools/src/emit/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `packages/tools/src/emit/factory-source.ts::catalogEntriesOf`

```text
The generated-id catalog row shape the lookups in
`packages/codegen/src/compiler/generated-metadata.ts` read: `symbolName` is
the parser's own display name, `literalText` the token's literal text, and
`literalRule` the literal-rule flag — the same three fields
`collectGeneratedKindEntries` puts on `GeneratedKindEntry`. A row missing
`literalText` makes `findEntryForLiteralText` miss every anon-token lookup,
so this must mirror `KindEntryLike` exactly, not just `symbolName`/`anon`.
```


### `packages/tools/src/emit/factory-source.ts::mountPrinter`

The printer for a form reached through a parent's mount route (`ir.<parent>.<mount>.strict(...)`): each argument is printed as a seated config when it is an object and as a direct value otherwise. Arguments are printed only up to the last one that is defined, so a form whose optional slot the source left empty prints as `strict()` rather than `strict(undefined)` — the spelling the form's own surface admits.
