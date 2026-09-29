# `packages/tools/src` — Function Glossary

### `packages/tools/src/languages.ts::languageByName`

The language descriptor a grammar package exports as its default, loaded by the grammar's name (`rust`, `typescript`, `python`, `scm`, `regex`). Tools that take a grammar name use it to reach the public surface: `createEngine(await languageByName(name))`, or the descriptor's `load()` for the native engine. It throws, naming the package, when the package has no default descriptor.

Its type is `LanguageOf<G>`: a single literal name returns that grammar's `Language<…API>`, so the engine it builds type-checks the grammar's nodes and render options. A wider name (a `string`, or a union of names, as a loop over several grammars produces) returns the base `Language<LanguageAPI>`. A union of per-grammar `Language`s would be the more precise answer, but `createEngine` resolves its overloads against the first member of such a union and refuses the rest, so no caller could build an engine from it.

### `packages/tools/src/languages.ts::LanguageApis`

Each grammar package's exported API type, keyed by the grammar's name. It is the one type-level list of grammars in tools; `languages.test.ts` pins its keys to the grammars found on disk (`allGrammars()`), so adding a grammar package without a row here fails a test.

### `packages/tools/src/languages.ts::ApiOf`

The API `LanguageApis` holds for `G` when `G` is exactly one of its keys, `never` otherwise. The key comparison is wrapped (`[G] extends [K]`) so a union of names matches no key instead of distributing into a union of APIs.

### `packages/tools/src/languages.ts::LanguageOf`

`languageByName`'s return type: `Language<ApiOf<G>>`, or the base `Language<LanguageAPI>` when `ApiOf<G>` is `never`.
