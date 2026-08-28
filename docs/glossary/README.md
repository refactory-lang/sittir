# Function glossaries — where the comments live

Hand-written source under `packages/codegen/src/` carries no explanatory
comments. Every comment that used to sit above or inside a declaration lives
in the per-directory glossary here, filed under the declaration it belongs
to. Source keeps only directive comments (`@ts-*`, `eslint*`,
`prettier-ignore`, `biome-ignore`, `/// <reference>`, `@rule-type-consts`).

## Layout

One file per source directory, named by the directory path with `/` → `-`:

| source directory | glossary |
|---|---|
| `packages/codegen/src/` (top level) | `root.md` |
| `packages/codegen/src/compiler/` | `compiler.md` |
| `packages/codegen/src/compiler/model/` | `compiler-model.md` |
| `packages/codegen/src/dsl/` | `dsl.md` |
| `packages/codegen/src/emitters/` | `emitters.md` |
| … | `<dir-with-dashes>.md` |

Inside a file, one `###` section per declaration, qualified by its enclosing
class / interface / enum / object literal:

```
### `packages/codegen/src/dsl/builders.ts::attributeBuilder.alias`

```text
<the comment that stood above the declaration, verbatim>
```

#### body

```text
<a comment that stood inside the declaration's body>
```
```

The heading is the symbol id — `<file>::<qualified name>` — and nothing
else: no line numbers, so a heading never goes stale and joins to the code
graph by identity. File-level comments (a module header) sit under
`### \`<file>::module\``.

## Looking a comment up

- **By symbol, from an agent:** infigraph `search` with the qualified name
  and `scope: docs` returns the glossary section; `get_doc_context` gives
  you the code side. (Symbol-keyed retrieval inside `get_doc_context` is the
  infigraph enhancement tracked upstream; until it lands, this two-call
  pattern is the lookup.)
- **By hand:** open the directory's file and find `### \`<file>::<qualified name>\``.
- **Before editing a function**, read its entry — it is the rationale the
  source no longer shows.

## Adding or changing documentation

- Do not write an explanatory comment in source. Put the text in the
  declaration's glossary section (create the section if it is new; add a
  `#### body` sub-section for a note about a specific part of the body).
- A comment that lands in source anyway is moved mechanically:
  `pnpm exec tsx scripts/relocate-comments-to-glossary.mts <files>` (dry run)
  then `--apply`. The run is idempotent and strips only the comment ranges.
  `scripts/comment-slop-check.sh --working` gates provenance narration and
  planning-artifact references in what remains.
- When a declaration is renamed or moved, rename its `###` heading the same
  way the importers are updated; a heading that resolves to no symbol is a
  dangling entry.
- Entries are mechanical relocations, unedited and unverified, until a
  content pass rewrites them; stale prose in an entry is a reason to fix the
  entry, never to reintroduce the comment in source.
