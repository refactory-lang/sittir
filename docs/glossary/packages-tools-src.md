# `packages/tools/src` — Function Glossary

### `packages/tools/src/languages.ts::languageByName`

The language descriptor a grammar package exports as its default, loaded by the grammar's name (`rust`, `typescript`, `python`, `scm`, `regex`). Tools that take a grammar name use it to reach the public surface: `createEngine(await languageByName(name))`, or the descriptor's `load()` for the native engine. It throws, naming the package, when the package has no default descriptor.

It has two overloads. A grammar's name (`G extends keyof LanguageApis`) returns that grammar's `Language<LanguageApis[G]>`, so the engine it builds type-checks the grammar's nodes and render options. Because this is a plain indexed access rather than a conditional type, it also resolves for a `G` that is still generic, so a helper generic over the grammar can forward it. Any other `string` returns the base `Language<LanguageAPI>`.

A union of names matches the first overload and yields `Language` of a union of APIs. `createEngine` resolves its overloads against the first member of such a union and refuses the rest. A caller that loops over several grammars therefore widens the name to `string` first, and gets the base API.

### `packages/tools/src/languages.ts::LanguageApis`

Each grammar package's exported API type, keyed by the grammar's name. It is the one type-level list of grammars in tools; `languages.test.ts` pins its keys to the grammars found on disk (`allGrammars()`), and `bootstrap-grammar` adds the row for a new grammar.

### `packages/tools/src/codegen-surface.ts::evaluateGrammar`

Evaluates a grammar package by name through codegen's `evaluatePackage`, so every probe and diagnostic tool builds its model with the package's real file types and entry choice; `base` selects the upstream `grammar.js` where a tool offers to show it before overrides. `buildSimplifiedGrammar`, `buildNodeMap`, the refs, stages and grammar-diagnostics tools all start here, and none resolves an entry path or passes file types itself.

### `packages/tools/src/sync-base.ts::syncBase`

Merges the base ref into the current branch and resolves the one conflict class that is mechanical: generated files. It refuses a dirty tree, fetches when the ref names a remote, then merges without committing. A conflict outside every grammar's generated roots (`generatedRootsFor`) stops the run and is listed, with the merge left in progress for a human. When every conflict is generated, the base's side is taken. Then every grammar is verified (`verifyManifestForGrammar`), clean merges included (a merge can leave a grammar's generated files stale without conflicting), and exactly the grammars whose files conflicted or fail verification are regenerated; the merge is committed if regeneration stays inside the generated roots; if regeneration changes any file outside the generated roots the diff is printed and nothing is committed, because that is a real interaction between the two branches. `validation-history.jsonl` merges by union and never conflicts. The core takes the roots, a verify callback and the regenerate callback as a `SyncBaseTarget`, so it is tested against a scratch repository.

### `packages/tools/src/sync-base.ts::repoSyncTarget`

The repository's `SyncBaseTarget`: every registered grammar's generated roots (stable or not: regex and scm are verified too) and a `verify` that is `verifyManifestForGrammar(...).ok` and a `regenerate` that runs `gen --grammar <name> --all` in a fresh process, the way `pnpm run regen:all` does.

### `packages/tools/src/scripts/check-baseline-regression.ts::supertypeExplainsDrop`

Whether a pass-count drop of one validator is a kind leaving and not a failure. It holds when the grammar's `supertypeKindCount` rose, the validator's own fail count (`total - pass`) did not, and the drop is within the validator's bound in `SUPERTYPE_EXPLAINED_DROP`.

### `packages/tools/src/scripts/check-baseline-regression.ts::SUPERTYPE_EXPLAINED_DROP`

The validators whose pass count may fall when a kind becomes a supertype, each with the largest drop a given rise in `supertypeKindCount` explains. `coverage` and `factoryRoundtrip` are unbounded: a kind that becomes a supertype has no template and no raw builder, and one parent can remove several cases there. `from` is bounded by the rise: a flattened parent removes exactly one `from` case, its own, so a larger drop is not explained by it. A validator not listed (`roundtrip`) is never exempt.

### `packages/tools/src/scripts/required-slot-census.ts::admittingSlots`

The census behind the typing rule, run over the compiled grammar's node map (references hydrated, as the emitters see it): every config slot that is required, that the emitted builder's `options` type does not carry and that `slotFilledWhenOmitted` does not accept must be a required key whose type has no `undefined` member, in the strict config, in the builder's direct-value parameter and (with `includeLoose`) in the loose config. A builder whose whole config is optional is held to the same rule. The one exemption class is the literal affix slots of a token-interior kind (everything in a lexed-interior kind that is not its content slot): the coercer fills them from the spelled form, which the model does not declare. The loose check compiles a probe module in memory per grammar, which costs about 25 s for all five, so it runs as `pnpm run type-check:required-slots` (a CI step beside the type-check), and the unit test `strict-required-slot-types.test.ts` runs the strict half only.

### `packages/tools/tests/argument-optional-honesty.test.ts`

Every kind `argumentOptional` says can be built with no argument is built with none, rendered through the engine, and re-parsed: the render must round-trip. The model's claim that a slot is filled when omitted is thereby tested against the real factory, not only derived.

### `packages/tools/src/native-pack.ts::nativePackGaps`

The files a packed grammar package must hold for its native binding and does not: the loader, its typings, and a binary for each required platform suffix. The caller chooses the suffixes — the host's alone for a development pack, every declared target for a release — so one check serves both. `unexpectedNativeBinaries` is the other direction: binaries in the pack outside those suffixes. The binding directory is packed whole and local builds accumulate in it, so a release also has to be free of a binary for a target that is no longer declared; a development pack is not checked for extras.

### `packages/tools/src/scripts/published-shape.ts::module`

Checks a grammar package as a consumer receives it. It packs `@sittir/types`, `@sittir/common` and each grammar with `pnpm pack` (which rewrites `workspace:*` to versions), runs `nativePackGaps` over each grammar tarball, installs the tarballs into a directory under the system temp directory — outside the workspace, so nothing resolves through workspace links or source aliases — and there creates an engine, parses a sample and renders it back. Failures the workspace hides show up here: a binary missing from `files`, a loader path that only resolves in the repo, a dependency that is not declared. `--release` requires a binary for every target in `NATIVE_TARGETS` and no other binary; without it the host's binary is enough. The temp directory is removed when the run ends, pass or fail.
