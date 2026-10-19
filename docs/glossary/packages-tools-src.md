# `packages/tools/src` — Function Glossary

### `packages/tools/src/languages.ts::languageByName`

The language descriptor a grammar package exports as its default, loaded by the grammar's name (`rust`, `typescript`, `python`, `scm`, `regex`). Tools that take a grammar name use it to reach the public surface: `createEngine(await languageByName(name))`, or the descriptor's `load()` for the native engine. It throws, naming the package, when the package has no default descriptor.

It has two overloads. A grammar's name (`G extends keyof LanguageApis`) returns that grammar's `Language<LanguageApis[G]>`, so the engine it builds type-checks the grammar's nodes and render options. Because this is a plain indexed access rather than a conditional type, it also resolves for a `G` that is still generic, so a helper generic over the grammar can forward it. Any other `string` returns the base `Language<LanguageAPI>`.

A union of names matches the first overload and yields `Language` of a union of APIs. `createEngine` resolves its overloads against the first member of such a union and refuses the rest. A caller that loops over several grammars therefore widens the name to `string` first, and gets the base API.

### `packages/tools/src/languages.ts::LanguageApis`

Each grammar package's exported API type, keyed by the grammar's name. It is the one type-level list of grammars in tools; `languages.test.ts` pins its keys to the grammars found on disk (`allGrammars()`), and `bootstrap-grammar` adds the row for a new grammar.

### `packages/tools/src/grammar-internals.ts::GrammarModules`

The generated artifacts tools need beyond the public language descriptor and engine, keyed by their generated filenames. Selecting a filename determines the module's export types. Raw factory maps include functions, constants and objects; named raw exports remain `unknown` until narrowed by their caller. Runtime factories retain their existing calling conventions. Public builders and parse/read operations use `languageByName`, `language.load()` and `createEngine`.

### `packages/tools/src/grammar-internals.ts::grammarModulePath`

The absolute path of a generated source artifact under a discovered grammar package, or `undefined` for an unknown grammar or missing file. Accepted filenames come from the internal module contract plus `node-model.json5` and the builder bundle source. The node model remains pure data and is read separately. Type-checking tools can inspect the source at this same path without importing it.

### `packages/tools/src/grammar-internals.ts::importGrammarModule`

Imports a generated module through its `pathToFileURL` URL, which ESM accepts across platforms. The result has the export type selected by the filename. A missing file returns `undefined`, preserving callers' optional-artifact behavior; import errors propagate to the validator's existing failure reporting.

### `packages/tools/src/grammar-internals.ts::requireGrammarModule`

The required-artifact form of `importGrammarModule`. Missing artifacts throw an error naming the grammar and generated filename, so validators record a load failure instead of treating an empty map as a successful run. It shares path resolution and importing with the optional loader.

### `packages/tools/src/codegen-surface.ts::evaluateGrammar`

Evaluates a grammar package by name through codegen's `evaluatePackage`, so every probe and diagnostic tool builds its model with the package's real file types and entry choice; `base` selects the upstream `grammar.js` where a tool offers to show it before overrides. `buildSimplifiedGrammar`, the refs, stages and grammar-diagnostics tools start here, and none resolves an entry path or passes file types itself. Full node-map loaders use the canonical compiler instead of rebuilding its phases.

### `packages/tools/src/codegen-surface.ts::buildNodeMap`

Compatibility entry point for `compileNodeMap`. Tools that need an assembled node map receive the canonical compiled model, including hydrated references and registered option defaults. The former independent evaluate/link/normalize/assemble path omitted both facts.

### `packages/tools/src/codegen-surface.ts::compileNodeMap`

Loads the package and generated ID tables, then returns `compileGrammar`'s node map. With `unbound`, it compiles the grammar without its grammar bindings and without the generated ID tables, which name the bound kinds: the base grammar's model, which the grammar bindings are derived against. Canonical grammar diagnosis resolves declared preferences through the existing site resolver, and compilation hydrates slot references. Both tool loader names share this path; phase-specific tools retain `evaluateGrammar` and `buildSimplifiedGrammar`.

### `packages/tools/src/sync-base.ts::syncBase`

Merges the base ref into the current branch and resolves the one conflict class that is mechanical: generated files. It refuses a dirty tree, fetches when the ref names a remote, then merges without committing. A conflict outside every grammar's generated roots (`generatedRootsFor`) stops the run and is listed, with the merge left in progress for a human. When every conflict is generated, the base's side is taken. Then every grammar is verified (`verifyManifestForGrammar`), clean merges included (a merge can leave a grammar's generated files stale without conflicting), and exactly the grammars whose files conflicted or fail verification are regenerated, forced, in one call, so the workspace is checked once after all of them; the merge is committed if regeneration stays inside the generated roots; if regeneration changes any file outside the generated roots the diff is printed and nothing is committed, because that is a real interaction between the two branches. `validation-history.jsonl` merges by union and never conflicts. The core takes the roots, a verify callback and the regenerate callback as a `SyncBaseTarget`, so it is tested against a scratch repository.

### `packages/tools/src/sync-base.ts::repoSyncTarget`

The repository's `SyncBaseTarget`: every registered grammar's generated roots (stable or not: regex and scm are verified too) and a `verify` that is `verifyManifestForGrammar(...).ok` and a `regenerate` that is `regenerateGrammars` with `force`, the loop `pnpm run regen:all` runs: sync-base has already decided which grammars need it.

### `packages/tools/src/regen.ts::regenerateGrammars`

Installs a missing wasm toolchain first (`ensureWasmToolchain`), so every fingerprint it and the generations take names the toolchain that builds the parsers. Regenerates the stale ones of `grammars` (all of them under `force`), each step in a fresh `gen` process, in two passes. The first generates every stale grammar at once (`gen --all --no-build-native --no-workspace-check`, at most `availableParallelism()` at a time, through `runPrefixed`), with no native build, because cargo resolves every workspace crate and a grammar not yet regenerated would not compile against the new emitters. The second builds each native binding in turn from the sources the first wrote (`gen --native-only`, which generates nothing, through `buildNative`), and only the last runs the workspace check (`runWorkspaceCheck`). When no grammar is regenerated, it runs the workspace check itself, once, after any re-extraction, so a run in which everything is fresh still proves the workspace compiles. The bindings build one at a time: they share a cargo target, and sittir-core must recompile under each grammar's napi typedef folder for its types to reach that grammar's `index.d.ts`. Before any work it clears the completion record (`clearRegenRecord`) of every grammar it regenerates, and it writes each one's record (`writeRegenRecord`) only after every native build and the workspace check have succeeded; a run that fails anywhere leaves those grammars to regenerate on the next run, however fresh their files look. A grammar whose generation and native binary are current but whose fixtures are not (`staleness`) instead has only its parity fixtures re-extracted (`gen --all --post-generate-only`, at most `availableParallelism()` at a time, output prefixed), after the native builds; its record is written once that succeeds. A run that succeeds ends with one line per grammar: its outcome from `pendingWork` (or `regenerated: forced`) and its diagnostic counts by severity (`severitySummary` over `readGrammarDiagnostics`). Each record carries the source hash and fixture sources taken before any work starts (`runInputs`), beside the binary and fixture files hashed after (`recordAfter`). Returns the exit status of the first generation that failed, in grammar order, before any native build starts; otherwise that of a failed native build (1 when it has none), then that of the first failed re-extraction, then that of its own workspace check; 0 when every one succeeds: `regen:all` exits with it, and `repoSyncTarget` throws on it. `pnpm run regen:all` runs it over the stable grammars, and `repoSyncTarget` over the grammars a merge affected.

### `packages/tools/src/regen.ts::pendingWork`

What each grammar needs (`staleness`), with its outcome for the closing status line: `skipped` with why it is fresh, `re-extracted fixtures` or `regenerated` with why not. Under `verbose` it also prints each as the run starts (`skipped`, `re-extracting fixtures`, `regenerating`). A skip never stands in for a gate: anything that gates a pull request regenerates with `force`.

### `packages/tools/src/regen.ts::Work`

The grammars a run regenerates in full and those whose fixtures alone it re-extracts, and every grammar's outcome, in grammar order, for the closing status lines.

### `packages/tools/src/regen.ts::Staleness`

What a grammar needs, a full regeneration or a re-extraction of its fixtures, and why.

### `packages/tools/src/regen.ts::regenerate`

A `Staleness` that asks for a full regeneration, for the given reason.

### `packages/tools/src/regen.ts::generationStaleness`

Why a grammar's generated files or native binary are not current, or undefined when both are: its generated files must verify against its sources (`verifyManifestForGrammar`: sources, upstream, generated files and the binary's freshness), and its native binary must have been built from the current native inputs under the `gate` profile, toolchain and build configuration (`nativeBuildFreshness`), the build regeneration would run.

### `packages/tools/src/regen.ts::staleness`

What a grammar needs, or undefined when it is current. A full regeneration when its generated files or native binary are not current (`generationStaleness`), or when its last regeneration did not finish: the completion record (`readRegenRecord`) must name the current source hash and the binary now present (`currentRecord`). Generation records the manifest, and the native build its stamp, before the workspace check and the post-generate steps run, so files and binary can both look fresh after a run that failed; only the record says the run finished. When all of that holds but a file parity fixture extraction reads or writes has changed since the record was written (`fixtureInputs`: the corpus, the extractor's code, the lockfile or the fixture files themselves), only the fixtures are re-extracted, with the first changed file as the reason. A record written before it carried fixtures counts as changed.

### `packages/tools/src/regen.ts::RegenerateOptions`

`force` regenerates every grammar, fresh or not: `regen:all --force` or `SITTIR_REGEN_FORCE=1`. `verbose` streams every child's output as it prints it, as `regen:all --verbose` or `SITTIR_REGEN_VERBOSE=1`; without it the run is quiet (`runPrefixed`, `buildNative`).

### `packages/tools/src/regen.ts::runPrefixed`

Runs `gen` for one grammar with the given flags (the first pass, or a fixture re-extraction), each line prefixed with the grammar. Stderr always passes through. Stdout streams under `verbose`; otherwise it is kept and printed in full only when the child fails, so a quiet run never hides the cause. Resolves with the exit status once the process and both its streams have closed.

### `packages/tools/src/regen.ts::prefixed`

Hands a stream to `output` line by line, each line prefixed with the grammar, so concurrent generations stay readable.

### `packages/tools/src/regen.ts::currentRecord`

The completion record a regeneration finishing now would leave (`recordAfter` of `runInputs` taken now), which `staleness` compares with the one on record.

### `packages/tools/src/regen.ts::RunInputs`

What a regeneration of one grammar reads, taken before the work starts: its source hash and its fixture sources.

### `packages/tools/src/regen.ts::runInputs`

The grammar's `RunInputs` as they are now: `computeSourceHash` and `fixtureSources`.

### `packages/tools/src/regen.ts::recordAfter`

The completion record of a run that started from `before`: its source hash and fixture sources, the SHA-256 of the host binary from that binary's build stamp, and the fixture files as they are now (`fixtureOutputs`). Undefined when the binary was never stamped.

### `packages/tools/src/regen-record.ts::RegenRecord`

What a finished regeneration of one grammar produced: the source hash it generated from, the SHA-256 of the native binary it built, and the content hash of each file its parity fixture extraction read or wrote (`fixtureInputs`).

### `packages/tools/src/regen-record.ts::readRegenRecord`

The grammar's completion record, from `node_modules/.cache/sittir/regen/<grammar>.json` under `cwd`, or undefined when there is none.

### `packages/tools/src/regen-record.ts::writeRegenRecord`

Writes the grammar's completion record, beside its destination and renamed into place.

### `packages/tools/src/regen-record.ts::clearRegenRecord`

Removes the grammar's completion record, if any.

### `packages/tools/src/fixture-inputs.ts::fixtureInputs`

Every file parity fixture extraction reads or writes for one grammar under `root`, with the SHA-256 of its content, by repo-relative path: `fixtureSources` and `fixtureOutputs`.

### `packages/tools/src/fixture-inputs.ts::fixtureSources`

What parity fixture extraction reads for one grammar under `root`, hashed (`contentHashes`): the grammar's corpus (`corpusFiles`); every module extraction runs, the import closure (`moduleClosure`) of `post-generate.ts` and of each codegen module the tools load through the codegen surface (`codegenModuleFiles`), since those are loaded by a computed specifier the closure cannot follow; and the lockfile, for the extractor's installed dependencies.

### `packages/tools/src/fixture-inputs.ts::fixtureOutputs`

The fixture files extraction writes for one grammar under `root`, hashed (`contentHashes`), so a hand edit or deletion of one counts too.

### `packages/tools/src/fixture-inputs.ts::contentHashes`

The SHA-256 of each of `files` under `root` that exists, by repo-relative path. A missing file is left out, so adding or removing one changes the result.

### `packages/tools/src/fixture-inputs.ts::corpusFiles`

The repo-relative paths of every file in the grammar's corpus directory under `root`, its upstream entries and its local file alike.

### `packages/tools/src/fixture-inputs.ts::EXTRACTOR`

The repo-relative path of `post-generate.ts`, where parity fixture extraction starts.

### `packages/tools/src/fixture-inputs.ts::LOCKFILE`

`pnpm-lock.yaml`.

### `packages/tools/src/codegen-surface.ts::codegenModuleFiles`

The absolute path of every codegen module the surface can load (`MODULES`), so what the tools run through `load` and `invoke` can be hashed like their static imports.

### `packages/tools/src/regen.ts::inPool`

Runs `run` over `items` with at most `limit` running at once, keeping the results in item order.

### `packages/tools/src/regen.ts::buildNative`

Builds one native binding (`gen --native-only`). Under `verbose` the child inherits the console. Otherwise cargo runs with `CARGO_TERM_QUIET`, stderr passes through, and stdout is kept and printed, prefixed with the grammar, only when the build fails. Returns the exit status, 1 when there is none.

### `packages/tools/src/regen.ts::SKIPPED`

The reason a fresh grammar is skipped: its generated files, native binary and fixtures are all current. Shared by the up-front verbose line and the closing status line.

### `packages/tools/src/regen.ts::toStdout`

Writes one already-terminated line to stdout; the sink for streamed and kept child output.

### `packages/tools/src/scripts/check-baseline-regression.ts::departedKindCount`

How many kinds left a grammar between the base and head baselines: the fall in its stamped `kindCount` (never negative). A baseline that never recorded the count, on either side, explains nothing, so the departed count is 0. `kindCount` is checked by `validateBaselineShape` before any arithmetic: a non-negative integer or absent, on the base and on the head; a count of another type would make every comparison false and let a drop through.

### `packages/tools/src/scripts/check-baseline-regression.ts::dropIsExplained`

Whether a drop in one validator's `pass` (or `astMatchPass`) is no regression: its fail count (`total - metric`) did not rise, and its total fell by no more than the departed kinds explain (`KIND_DENOMINATED_TOTAL`). A deleted corpus case, or a lost coverage row for a kind that still exists, leaves the fail count alone and the total smaller, so the departure bound is what stops it passing.

### `packages/tools/src/scripts/check-baseline-regression.ts::KIND_DENOMINATED_TOTAL`

The validators whose total is tied to the grammar's kinds, each with the largest total drop a given departed count explains: `coverage` and `from` one per kind; `factoryStorage` and `builtRenderParse` have several cases per kind, so a departed kind explains the base's average cases per kind (`total / kindCount`, rounded up) and no more: the cases of kinds that still exist are not explained by an unrelated kind leaving. `roundtrip` counts corpus rows and is absent: no kind leaving explains its drop, which a declared counter change covers.

### `packages/tools/src/scripts/collect-baseline.ts::GrammarEntry.kindCount`

Every kind of the grammar's node model, one stamped count (`kindCount` in `census/hoisted.ts`). It replaces the hoisted and supertype counts, which only explained part of the kinds that can leave.
### `packages/tools/src/scripts/check-baseline-regression.ts::baseValidators`

The validators a base baseline is checked and compared on: those it records. A validator a change adds has no base to regress from, so the base may lack it, as it may lack a grammar new to head. Head is always checked for every validator.

### `packages/tools/src/scripts/required-slot-census.ts::admittingSlots`

The census behind the typing rule, run over the compiled grammar's node map (references hydrated and preferences registered, as the emitters see it): every config slot that is required and that `slotFilledWhenOmitted` does not accept must be a required key whose type has no `undefined` member, in the strict config, in the builder's direct-value parameter and (with `includeLoose`) in the loose config. A builder whose whole config is optional is held to the same rule. The one exemption class is the literal affix slots of a token-interior kind (everything in a lexed-interior kind that is not its content slot): the coercer fills them from the spelled form, which the model does not declare. The loose check compiles a probe module in memory per grammar, which costs about 25 s for all five, so it runs as `pnpm run type-check:required-slots` (a CI step beside the type-check), and the unit test `strict-required-slot-types.test.ts` runs the strict half only.

### `packages/tools/tests/argument-optional-honesty.test.ts`

Every kind `argumentOptional` says can be built with no argument is built with none, rendered through the engine, and re-parsed: the render must round-trip. The model's claim that a slot is filled when omitted is thereby tested against the real factory, not only derived.

### `packages/tools/src/native-pack.ts::nativePackGaps`

The files a packed grammar package must hold for its native binding and does not: the loader, its typings, and a binary for each required platform suffix. The caller chooses the suffixes — the host's alone for a development pack, every declared target for a release — so one check serves both. `unexpectedNativeBinaries` is the other direction: binaries in the pack outside those suffixes. The binding directory is packed whole and local builds accumulate in it, so a release also has to be free of a binary for a target that is no longer declared; a development pack is not checked for extras.

### `packages/tools/src/scripts/published-shape.ts::module`

Checks a grammar package as a consumer receives it. It packs `@sittir/types`, `@sittir/common` and each grammar with `pnpm pack` (which rewrites `workspace:*` to versions), runs `nativePackGaps` over each grammar tarball, installs the tarballs into a directory under the system temp directory — outside the workspace, so nothing resolves through workspace links or source aliases — and there creates an engine, parses a sample and renders it back. Failures the workspace hides show up here: a binary missing from `files`, a loader path that only resolves in the repo, a dependency that is not declared. `--release` requires a binary for every target in `NATIVE_TARGETS` and no other binary; without it the host's binary is enough. The temp directory is removed when the run ends, pass or fail.

### `packages/tools/src/probe/ast-diff.ts::run`

Compares the tree-sitter parse trees of two files with the validator's comparison (`astStructuralDiff`), so two renderings of one source can be shown to have the same tree without a second comparer. Both files are parsed with the grammar's own parser (the sittir-built wasm, so the kinds are the grammar's, variant kinds included), and the diff walks visible children: kind, field names, named and anonymous children, leaf text. Whitespace and trivia between tokens are not nodes and do not count; comments are compared as extras. It exits non-zero and names the first differing path when the trees differ.
