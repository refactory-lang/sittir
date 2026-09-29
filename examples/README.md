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
   `template(...)`, `snippets.*`, and `engine.findAndRead(...)`. Examples that
   depend on pattern search or templates alone are not kept here.

The compile-checked examples are the files `tsconfig.json` includes; the
generated rebuilds are the files `tsconfig.generated.json` includes.

| File | Guide section |
| ---- | ------------- |
| `01-construct-nodes.ts` | Construct nodes with factories |
| `02-render-round-trip.ts` | Render NodeData to source |
| `03-trivia.ts` | Attach comments with `.$trivia()` *(pending wrapper ergonomics refresh)* |
| `04-precompiled-templates.ts` | Construction templates — pre-compiled *(pending `snippets.*`)* |
| `05-inline-templates.ts` | Construction templates — inline *(pending `template(...)`)* |
| `07-read-source.ts` | Read source into NodeData |
| `09-type-guards.ts` | Type guards |
| `12-cross-language-migration.ts` | Cross-language migration |
| `14-format-preserving-transform.ts` | Format-preserving transforms *(parked, not type-checked: the parse → `$with` → `$render` rewrite is blocked by #419, #420, #421, #422)* |
| `15-generate-file.ts` | Generate a file from scratch *(pending richer Rust generation examples)* |
| `16-dogfooding.ts` | Dogfooding *(pending template/snippet-free rewrite)* |
| `17-dogfood-rust-strict.ts` | Dogfooding — rebuild `sittir-core/src/splice.rs` through `.strict` alone |
| `18-dogfood-typescript-strict.ts` | Dogfooding — rebuild `common/src/format.ts` through `.strict` alone |
| `19-dogfood-python-strict.ts` | Dogfooding — rebuild `tools/scripts/probe-sweep.py` through `.strict` alone |
| `<n>-dogfood-<g>.generated.ts`, `<n>-dogfood-<g>-loose.generated.ts` | Dogfooding — the strict and loose rebuilds `pnpm run gen:examples` prints from each target; never hand-edited |
| `20-keyword-openers-<g>.generated.ts`, `21-list-seat-configs-rust*.generated.ts`, `22-trivia-<g>.generated.ts` | Emitter fixtures (`packages/tools/tests/emit/__fixtures__`) rebuilt by `pnpm run gen:examples`; never hand-edited |
| `index.ts` | Convenience barrel for all use-case modules |
