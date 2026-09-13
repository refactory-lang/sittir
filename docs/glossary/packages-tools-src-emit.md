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
