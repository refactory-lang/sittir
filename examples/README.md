# Use case TypeScript examples

This directory contains source-form companions to `docs/use-cases-and-examples.md`.
They are intentionally written as TypeScript modules: imports are explicit,
each file exports callable functions, and examples take inputs or return
rendered source instead of appearing only as Markdown snippets.

The directory currently serves **two roles**:

1. **Compile-checked current examples** — these reflect the public API that is
   available today and are included by `pnpm run type-check:examples`.
2. **Pending target-surface examples** — these describe APIs the guide still
   wants to land, but which are not yet wired or shipped. Today that includes
   `template(...)`, `snippets.*`, and `engine.findAndRead(...)`.

Current compile-checked examples:

- `01-construct-nodes.ts`
- `02-render-round-trip.ts`
- `07-read-source.ts`
- `09-type-guards.ts`

| File | Guide section |
| ---- | ------------- |
| `01-construct-nodes.ts` | Construct nodes with factories |
| `02-render-round-trip.ts` | Render NodeData to source |
| `03-trivia.ts` | Attach comments with `.$trivia()` *(pending wrapper ergonomics refresh)* |
| `04-precompiled-templates.ts` | Construction templates — pre-compiled *(pending `snippets.*`)* |
| `05-inline-templates.ts` | Construction templates — inline *(pending `template(...)`)* |
| `06-composition.ts` | Composition *(pending template/snippet-free rewrite)* |
| `07-read-source.ts` | Read source into NodeData |
| `08-find-patterns.ts` | Find nodes by pattern *(pending `engine.findAndRead(...)`)* |
| `09-type-guards.ts` | Type guards |
| `10-codemod-unwrap-to-try.ts` | Complete codemod: find → transform → apply *(pending `engine.findAndRead(...)`)* |
| `11-codemod-template-wrapper.ts` | Codemod with construction templates *(pending `snippets.*` and `engine.findAndRead(...)`)* |
| `12-cross-language-migration.ts` | Cross-language migration *(pending Python construction surface refresh)* |
| `13-bulk-file-processing.ts` | Bulk file processing *(pending `engine.findAndRead(...)`)* |
| `14-format-preserving-transform.ts` | Format-preserving transforms *(pending `engine.findAndRead(...)`)* |
| `15-generate-file.ts` | Generate a file from scratch *(pending richer Rust generation examples)* |
| `16-dogfooding.ts` | Dogfooding *(pending template/snippet-free rewrite)* |
| `index.ts` | Convenience barrel for all use-case modules |
