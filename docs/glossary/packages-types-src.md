# `packages/types/src` — Type Glossary

### `packages/types/src/full-form.ts::MatchedAlternative`

The alternatives among `Alts` that the text `I` starts with. It distributes over `Alts`, because an `infer` inside a template literal captures a single character, not a whole alternative.

### `packages/types/src/full-form.ts::SpelledAffix`

The spelling a full-form coercer takes from its text: the alternative the text starts with, `Default` when it starts with none (bare content), and every alternative when the text is a plain `string`, since only the runtime knows it then.

### `packages/types/src/full-form.ts::WithSpelling`

A built node whose spelling slot `K` is narrowed to `P`, on both its stored field (`_<K>`) and its accessor. The narrowing comes first in the intersection, so the accessor call resolves to `P`.

### `packages/types/src/full-form.ts::Interior`

The text between a full form's delimiters, or the text itself when it does not carry both: the type mirror of `spelledInterior`'s delimiter strip. A type cannot test the interior pattern, so the runtime's fallback to the whole input (a lone `\` escape) has no mirror here; its only reader is the sibling-lead check, so the gap shows only for a polymorph arm whose interior accepts its own delimiter.

### `packages/types/src/full-form.ts::LeadCheck`

Walks a polymorph's sibling leads in the runtime's order and, for the first lead the interior starts with, gives an object type whose one key reads `starts the way <builder> does; build it with <builder>`. An argument intersected with it fails to compile with that key in the message. `unknown` when no lead matches.

### `packages/types/src/full-form.ts::SiblingLeadRefusal`

The compile-time form of `refuseSiblingLead`: a full-form coercer's input is `I & SiblingLeadRefusal<I, …>`, so a literal whose interior starts the way a sibling arm does is refused while it is being typed. A plain `string` and a config object pass unchanged and are checked at runtime.

### `packages/types/src/full-form.ts::AllOf`

Whether every character of `S` is one of `C`, walking `S` one leading character at a time: `true` for the empty rest, `false` at the first character outside `C`.

### `packages/types/src/full-form.ts::OnlyOf`

`I` when it is a non-empty string made only of characters in `C`, else `never`. A plain `string` passes unchanged, left to the runtime. Intersected with its own input (`I & OnlyOf<I, C>`), a literal outside the set fails to compile where it is written.

### `packages/types/src/options.ts::IndentOption`

The `indent` key a render's options carry: `I & OnlyOf<I, IndentChar>`, the unit as the caller spelled it and checked whole, for a grammar that admits an indent character. `unknown` (no key) when `IndentChar` is `never`. `DerivedOptions` includes it at `I = string`, so a standalone `Options` value types `indent` as `string`; `createEngine`, `createRenderEngine` and `render` include it at their inferred `I`.

### `packages/types/src/engine-api.ts::TriviaFacts`

The grammar facts `$trivia` checks against: each kind's name, the gaps an empty node of each kind holds inner trivia in, and `ir.comment`, which builds a loose string into its default arm (taking either the full spelling or the interior). It lives here so a language's hooks can carry it without importing `@sittir/common`, which re-exports it.

### `packages/types/src/engine-api.ts::ParseOptions`

How far one read expands. The default is lazy: a read returns one level, and a child with substructure comes back as a stub the accessors expand on demand. `deep` expands the whole subtree in one pass instead: one crossing instead of one per level, at the cost of reading what you may not touch.

### `packages/types/src/engine-api.ts::LanguageAPI`

The type-level shape of one language: its name, builder table, guards, kind ids, the kind-to-node-type map (`types`, type-only), its root and any-node types, and its render options (including the indent unit). Every engine type is derived from it.

### `packages/types/src/engine-api.ts::Language`

A language descriptor: the light default export of a grammar package. `load()` imports the implementation and resolves its hooks. `__api` is a type-only brand carrying the `LanguageAPI` and is never set at run time.

### `packages/types/src/engine-api.ts::NativeEngineOptions`

The options a language's native engine is created with: the format record and the render options under `options`. It is the native boundary's shape only; `createEngine` maps its own `render` option onto `options`.

### `packages/types/src/engine-api.ts::LanguageHooks`

What a language's `load()` resolves to: the builder table, guards, kind ids and trivia facts as data, plus `createNative` to create a native engine and `wrap` to turn a read root and its tree into the language's root node.

### `packages/types/src/engine-api.ts::NativeLanguageEngine`

One native engine instance: renders a node with render options already merged over the engine's, applies edits to source text, parses and reads a source, reports whether a tree handle belongs to it, and releases its native state on `dispose`.

### `packages/types/src/engine-api.ts::Rendered`

A rendered node's text: rendered on first use and cached. Disposing it drops the cached text, and any use after that throws.

### `packages/types/src/engine-api.ts::Pending`

One staged change to one file. Awaiting it commits the change once; `await using` commits it at scope exit; one neither awaited nor disposed writes nothing.

### `packages/types/src/engine-api.ts::FileChange`

A file's text before and after a change, by path. `before` is `undefined` for a file the change creates.

### `packages/types/src/engine-api.ts::ApiSurface`

Which builder surface an engine's `build` exposes: the coercing default, the strict flavour, or the portable surface, which is reserved and not implemented.

### `packages/types/src/engine-api.ts::StrictMembers`

An object's members under the strict surface, with the `strict` and `coerce` flavours hidden.

### `packages/types/src/engine-api.ts::StrictSurface`

The strict builder surface, derived from the default one. A builder carrying a `strict` flavour becomes that flavour plus its members' strict surfaces (its variants). A callable without a `strict` flavour has no loose form and stays whole, which keeps its generic and overloaded signatures. A namespace object is only its members' strict surfaces, so none of its raw members survive beside the strict ones.

### `packages/types/src/engine-api.ts::BuildSurface`

The type of an engine's `build` for a surface: the builder table, its strict surface, or `never` for the unimplemented portable surface.

### `packages/types/src/engine-api.ts::Engine`

A language engine: the only value surface of a language. It builds, guards, parses, reads, renders, and creates, edits and writes files. The engine's `types` member is type-only, mapping each kind to its node type for generic code.

### `packages/types/src/engine-api.ts::EngineOptions`

An engine's options, grouped by concern: the builder surface, the render options, the format record, and the interceptors.

### `packages/types/src/engine-api.ts::Interceptor`

Middleware around an engine's operations. Each hook receives the call and a `next` that runs the rest of the chain; it may observe, change the result, or refuse by throwing. A `file` hook that doesn't call `next` blocks that write.

### `packages/types/src/engine-api.ts::Project`

A group of engines over one file set. Their file changes are staged, inspected with `staged`, `diff` and `files`, and written all or none by `commit`. Disposal discards what was not committed and disposes the engines.

### `packages/types/src/engine-api.ts::Types`

The kind-to-node-type map of an engine, for generic code over any engine.

### `packages/types/src/engine-api.ts::ApiOf`

The `LanguageAPI` a descriptor carries.
