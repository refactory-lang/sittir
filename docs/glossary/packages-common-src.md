# `packages/common/src` — Function Glossary

### `packages/common/src/create-engine.ts::loadLanguage`

Loads a language's hooks once per descriptor object: later engines for the same descriptor reuse the same promise. A failed load is not cached, so a later call retries; it rejects with `failed to load language "<name>"`, carrying the original error as its `cause`.

### `packages/common/src/create-engine.ts::refuseUnimplemented`

Refuses, before anything loads, an engine option whose behaviour does not exist: any `api` other than `'default'` (the portable surface is reserved; the strict surface is not implemented) and a non-empty `intercept` list. Each message names the option that is not implemented.

### `packages/common/src/create-engine.ts::nativeEngineOptions`

The one mapping from an engine's options to its native engine's: `format` passes through, and `render` becomes the native `options`. Absent keys stay absent.

### `packages/common/src/create-engine.ts::unimplementedVerb`

The error a file verb (`read`, `create`, `edit`, `write`) raises while file changes are not implemented.

### `packages/common/src/create-engine.ts::assembleEngine`

Builds one engine from a language's loaded hooks: it creates the native engine from the mapped options and exposes the hooks' builders, guards and kind ids. `parse` reads through the native engine and wraps the root with its tree. `render` takes a node, or a callback that receives the builders, and hands the call's flat render options to the native engine, which resolves them over its own. `types` is type-only and has no run-time value.

### `packages/common/src/create-engine.ts::createEngine`

The entry point: refuses unimplemented options, loads the language (once per descriptor), and assembles an engine. Engines share no state: each owns its native engine and its options. Its `render` option is inferred `const` and checked by `RenderOptionsCheck`, so an indent unit outside the language's indent characters, or a key the language's options do not declare, fails to compile.

### `packages/common/src/engine.ts::createRenderHandle`

A lazily rendered text: the render runs on first use and its text is cached. `save` writes through the native file path when the engine offers one, else writes the text. Disposing drops the cached text; any use after that throws `rendered text disposed`.

### `packages/common/src/engine.ts::nativeLanguageEngine`

Adapts one grammar's native engine to the language hooks' native engine shape, the same for every grammar. `render` splits the call's flat options into the native `ignoreFormat` and the render options it resolves over its own, passing none when the call has none. `parseAndRead` records each tree it returns, so `holdsTree` answers whether a tree handle came from this engine and no other.

