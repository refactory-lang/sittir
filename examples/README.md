# Use case TypeScript examples

This directory contains source-form companions to `docs/use-cases-and-examples.md`.
They are intentionally written as theoretically executable TypeScript modules:
imports are explicit, each file exports callable functions, and examples take
inputs or return rendered source instead of appearing only as Markdown snippets.

These files target sittir's fully realized public API. Some examples may not
compile against the current alpha implementation until the corresponding
litmus-test items in the guide are implemented.

| File | Guide section |
| ---- | ------------- |
| `01-construct-nodes.ts` | Construct nodes with factories |
| `02-render-round-trip.ts` | Render NodeData to source |
| `03-trivia.ts` | Attach comments with `.$trivia()` |
| `04-precompiled-templates.ts` | Construction templates — pre-compiled |
| `05-inline-templates.ts` | Construction templates — inline |
| `06-composition.ts` | Composition |
| `07-read-source.ts` | Read source into NodeData |
| `08-find-patterns.ts` | Find nodes by pattern |
| `09-type-guards.ts` | Type guards |
| `10-codemod-unwrap-to-try.ts` | Complete codemod: find → transform → apply |
| `11-codemod-template-wrapper.ts` | Codemod with construction templates |
| `12-cross-language-migration.ts` | Cross-language migration |
| `13-bulk-file-processing.ts` | Bulk file processing |
| `14-format-preserving-transform.ts` | Format-preserving transforms |
| `15-generate-file.ts` | Generate a file from scratch |
| `16-dogfooding.ts` | Dogfooding |
| `index.ts` | Convenience barrel for all use-case modules |
