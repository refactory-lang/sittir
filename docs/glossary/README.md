# Function glossaries — where the explanations live

Hand-written source in the trees this glossary covers (`packages/codegen/src/`,
`packages/common/src/`, `packages/tools/src/`, `packages/types/src/`; see the
layout table below) carries no explanatory comments. The explanation for each
declaration lives in the per-directory glossary here, filed under the
declaration it belongs to. Source keeps only
directive comments (`@ts-*`, `eslint*`, `prettier-ignore`, `biome-ignore`,
`/// <reference>`, `@rule-type-consts`) and public-API JSDoc. Authors put the
why of a non-obvious decision in the commit message; the docs peer turns it
into a glossary entry after the PR merges.

## Layout

One file per source directory, named by the directory path with `/` → `-`:

| source directory | glossary |
|---|---|
| `packages/codegen/src/` (top level) | `root.md` |
| `packages/codegen/src/compiler/` | `compiler.md` |
| `packages/codegen/src/compiler/model/` | `compiler-model.md` |
| `packages/codegen/src/dsl/` | `dsl.md` |
| `packages/codegen/src/bindings/` | `bindings.md` |
| `packages/codegen/src/emitters/` | `emitters.md` |
| … | `<dir-with-dashes>.md` |

Inside a file, one `###` section per declaration, qualified by its enclosing
class / interface / enum / object literal:

````
### `packages/codegen/src/compiler/model/node-map.ts::AssembledKeyword::constructor`

```text
<the comment that stood above the declaration, verbatim>
```

#### body

```text
<a comment that stood inside the declaration's body>
```
````

The heading is the symbol id — `<file>::<qualified name>` — and nothing
else: no line numbers, so a heading never goes stale and joins to the code
graph by identity. Nested names join with `::` (`Owner::member`), as the
graph spells them. The graph does not yet index class / interface fields or
object-literal properties under their owner, so entries for those keep the
dotted `Owner.member` form until it does; `infigraph doctor` lists them as
unresolved meanwhile. File-level comments (a module header) sit under
`### \`<file>::module\``.

## Looking a comment up

- **By symbol, from an agent:** infigraph `search` with the qualified name
  and `scope: docs` returns the glossary section; `get_doc_context` gives
  you the code side. (Symbol-keyed retrieval inside `get_doc_context` is the
  infigraph enhancement tracked upstream; until it lands, this two-call
  pattern is the lookup.)
- **By hand:** open the directory's file and find `### \`<file>::<qualified name>\``.
- **Before editing a function**, read its entry and the commit messages that
  touched it — together they are the rationale the source no longer shows.

## Adding or changing documentation

- Authors do not write explanatory comments or glossary entries. The why of
  a non-obvious decision goes in the commit message.
- The docs peer writes entries after a PR merges to master, from that PR's
  commits: a new declaration gets a section (a `#### body` sub-section for a
  note about a specific part of the body); a moved or renamed declaration is
  rekeyed; a removed declaration's entry is deleted; each "why" is carried
  over from the commit message.
- A comment that lands in source anyway is moved mechanically:
  `pnpm exec tsx scripts/relocate-comments-to-glossary.mts <files>` (dry run)
  then `--apply`. The run is idempotent and strips only the comment ranges.
  `scripts/comment-slop-check.sh --working` gates provenance narration and
  planning-artifact references in what remains.
- When a declaration is renamed or moved, rekey its entry the same way the
  importers are updated: `infigraph doc-entry rekey <old> <new>` (preview
  first, `--apply` writes). A heading that resolves to no symbol is a
  dangling entry.
- Use infigraph's `stale_docs` to list entries whose code changed after the
  entry, and `doc_entry` (`infigraph doc-entry`: edit, replace, create,
  rekey, delete, ack) to change them. `ack` an entry only after reading the
  changed lines against it, never in bulk.
- Entries are mechanical relocations, unedited and unverified, until a
  content pass rewrites them; stale prose in an entry is a reason to fix the
  entry, never to reintroduce the comment in source.
