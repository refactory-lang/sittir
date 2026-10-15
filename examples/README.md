# Examples

These modules exercise the API on `master`. They are executable TypeScript, not proposed APIs. Start with construction, parsing, and immutable edits; use the reconstruction fixtures to inspect larger generated call graphs.

## Handwritten examples

| File | What it demonstrates |
| --- | --- |
| [01-construct-nodes.ts](01-construct-nodes.ts) | Coercing and strict construction, forms, and immutable updates |
| [02-render-round-trip.ts](02-render-round-trip.ts) | Rendering built syntax and retaining parsed source |
| [03-trivia.ts](03-trivia.ts) | Leading, trailing, and eligible inner comments |
| [04-build-files.ts](04-build-files.ts) | Building a struct and a complete source file |
| [05-render-nodes.ts](05-render-nodes.ts) | Rendering a constructed function |
| [07-read-source.ts](07-read-source.ts) | Parsing and accessing typed source nodes |
| [09-type-guards.ts](09-type-guards.ts) | Kind guards and narrowing |
| [12-cross-language-migration.ts](12-cross-language-migration.ts) | An explicit TypeScript-to-Python transformation |
| [14-format-preserving-transform.ts](14-format-preserving-transform.ts) | Replacing a parsed function name |
| [15-generate-file.ts](15-generate-file.ts) | Building and saving a file |
| [16-dogfooding.ts](16-dogfooding.ts) | Building source for a generated utility |
| [17-dogfood-rust-strict.ts](17-dogfood-rust-strict.ts) | A larger Rust reconstruction through strict builders |
| [18-dogfood-typescript-strict.ts](18-dogfood-typescript-strict.ts) | A larger TypeScript reconstruction through strict builders |
| [19-dogfood-python-strict.ts](19-dogfood-python-strict.ts) | A larger Python reconstruction through strict builders |
| [23-read-query-with.ts](23-read-query-with.ts) | Parsed query views, predicates, and ancestor reconstruction |

The numbers are stable identifiers, not a required reading order. The cross-language example explicitly maps selected constructs; it is not a general semantic translator.

## Generated reconstructions

`*.generated.ts` files are emitted by `pnpm run gen:examples`. The dogfood files reconstruct real source targets; the keyword-opener, list-seat, and trivia files cover emitter fixtures. Each target has strict and loose versions.

Do not edit these outputs. Change their source target or the factory-source emitter and regenerate.

## Verification

```sh
pnpm run type-check:examples
pnpm run type-check:generated-examples
pnpm exec vitest run tests/acceptance/examples-run.test.ts tests/acceptance/readme-snippets.test.ts
```

`tsconfig.json` defines the handwritten compile set. The acceptance test calls every exported function in that set and renders returned nodes; a new function with arguments needs a sample input there. `tsconfig.generated.json` defines the generated set. See [Development](../DEVELOPMENT.md#everyday-checks) for setup and the documentation gates.
