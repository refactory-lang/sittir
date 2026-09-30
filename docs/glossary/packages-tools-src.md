# `packages/tools/src` — Function Glossary

### `packages/tools/src/languages.ts::languageByName`

The language descriptor a grammar package exports as its default, loaded by the grammar's name (`rust`, `typescript`, `python`, `scm`, `regex`). Tools that take a grammar name use it to reach the public surface: `createEngine(await languageByName(name))`, or the descriptor's `load()` for the native engine. It throws, naming the package, when the package has no default descriptor.

It has two overloads. A grammar's name (`G extends keyof LanguageApis`) returns that grammar's `Language<LanguageApis[G]>`, so the engine it builds type-checks the grammar's nodes and render options. Because this is a plain indexed access rather than a conditional type, it also resolves for a `G` that is still generic, so a helper generic over the grammar can forward it. Any other `string` returns the base `Language<LanguageAPI>`.

A union of names matches the first overload and yields `Language` of a union of APIs. `createEngine` resolves its overloads against the first member of such a union and refuses the rest. A caller that loops over several grammars therefore widens the name to `string` first, and gets the base API.

### `packages/tools/src/languages.ts::LanguageApis`

Each grammar package's exported API type, keyed by the grammar's name. It is the one type-level list of grammars in tools; `languages.test.ts` pins its keys to the grammars found on disk (`allGrammars()`), and `bootstrap-grammar` adds the row for a new grammar.

### `packages/tools/src/codegen-surface.ts::evaluateGrammar`

Evaluates a grammar package by name through codegen's `evaluatePackage`, so every probe and diagnostic tool builds its model with the package's real file types and entry choice; `base` selects the upstream `grammar.js` where a tool offers to show it before overrides. `buildSimplifiedGrammar`, `buildNodeMap`, the refs, stages and grammar-diagnostics tools all start here, and none resolves an entry path or passes file types itself.
