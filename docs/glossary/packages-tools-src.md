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

The node map of `compileGrammarOf`. Both tool loader names share this path; phase-specific tools retain `evaluateGrammar` and `buildSimplifiedGrammar`.

### `packages/tools/src/sync-base.ts::syncBase`

Merges the base ref into the current branch and resolves the one conflict class that is mechanical: generated files. It refuses a dirty tree, fetches when the ref names a remote, then merges without committing. A conflict outside every grammar's generated roots (`generatedRootsFor`) stops the run and is listed, with the merge left in progress for a human. When every conflict is generated, the base's side is taken. Then every grammar is verified (`verifyManifestForGrammar`), clean merges included (a merge can leave a grammar's generated files stale without conflicting), and exactly the grammars whose files conflicted or fail verification are regenerated, forced, in one call, so the workspace is checked once after all of them; the merge is committed if regeneration stays inside the generated roots; if regeneration changes any file outside the generated roots the diff is printed and nothing is committed, because that is a real interaction between the two branches. `validation-history.jsonl` merges by union and never conflicts. The core takes the roots, a verify callback and the regenerate callback as a `SyncBaseTarget`, so it is tested against a scratch repository.

### `packages/tools/src/sync-base.ts::repoSyncTarget`

The repository's `SyncBaseTarget`: every registered grammar's generated roots (stable or not: regex and scm are verified too) and a `verify` that is `verifyManifestForGrammar(...).ok` and a `regenerate` that is `regenerateGrammars` with `force`, the loop `pnpm run regen:all` runs: sync-base has already decided which grammars need it.

### `packages/tools/src/regen.ts::regenerateGrammars`

Installs a missing wasm toolchain first (`ensureWasmToolchain`), so every fingerprint it and the generations take names the toolchain that builds the parsers. Then writes the vocabulary path list (`writeVocabularyPaths`), once per run and whether or not any grammar is stale, since no grammar owns it. Regenerates the stale ones of `grammars` (all of them under `force`), each step in a fresh `gen` process, in two passes. The first generates every stale grammar at once (`gen --all --no-build-native --no-workspace-check`, at most `availableParallelism()` at a time, through `runPrefixed`), with no native build, because cargo resolves every workspace crate and a grammar not yet regenerated would not compile against the new emitters. The second builds each native binding in turn from the sources the first wrote (`gen --native-only`, which generates nothing, through `buildNative`), and only the last runs the workspace check (`runWorkspaceCheck`). When no grammar is regenerated, it runs the workspace check itself, once, after any re-extraction, so a run in which everything is fresh still proves the workspace compiles. The bindings build one at a time: they share a cargo target, and sittir-core must recompile under each grammar's napi typedef folder for its types to reach that grammar's `index.d.ts`. Before any work it clears the completion record (`clearRegenRecord`) of every grammar it regenerates, and it writes each one's record (`writeRegenRecord`) only after every native build and the workspace check have succeeded; a run that fails anywhere leaves those grammars to regenerate on the next run, however fresh their files look. A grammar whose generation and native binary are current but whose fixtures are not (`staleness`) instead has only its parity fixtures re-extracted (`gen --all --post-generate-only`, at most `availableParallelism()` at a time, output prefixed), after the native builds; its record is written once that succeeds. A run that succeeds ends with one line per grammar: its outcome from `pendingWork` (or `regenerated: forced`) and its diagnostic counts by severity (`severitySummary` over `readGrammarDiagnostics`). Each record carries the source hash and fixture sources taken before any work starts (`runInputs`), beside the binary and fixture files hashed after (`recordAfter`). Returns the exit status of the first generation that failed, in grammar order, before any native build starts; otherwise that of a failed native build (1 when it has none), then that of the first failed re-extraction, then that of its own workspace check; 0 when every one succeeds: `regen:all` exits with it, and `repoSyncTarget` throws on it. `pnpm run regen:all` runs it over the stable grammars, and `repoSyncTarget` over the grammars a merge affected.

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

### `packages/tools/src/codegen-surface.ts::compileGrammarOf`

`compileGrammar` for a grammar by name, with the id tables its evaluation reads. With `unbound`, it compiles the grammar without its grammar bindings, against the tables that grammar predicts: the base grammar's model, which the grammar bindings are derived against.

### `packages/tools/src/codegen-surface.ts::Compilation`

What `compileGrammar` returns, as the tools see it through the codegen surface.

### `packages/tools/src/regen.ts::inPool`

Runs `run` over `items` with at most `limit` running at once, keeping the results in item order.

### `packages/tools/src/regen.ts::buildNative`

Builds one native binding (`gen --native-only`). Under `verbose` the child inherits the console. Otherwise cargo runs with `CARGO_TERM_QUIET`, stderr passes through, and stdout is kept and printed, prefixed with the grammar, only when the build fails. Returns the exit status, 1 when there is none.

### `packages/tools/src/regen.ts::SKIPPED`

The reason a fresh grammar is skipped: its generated files, native binary and fixtures are all current. Shared by the up-front verbose line and the closing status line.

### `packages/tools/src/regen.ts::toStdout`

Writes one already-terminated line to stdout; the sink for streamed and kept child output.

### `packages/tools/src/scripts/check-baseline-regression.ts::baseValidators`

The validators a baseline records. The head is checked for every validator; a base may predate some, as it may predate a grammar new to head. The base's schema check and the format-deferred rule walk only these; the other rules walk every row the head records (`ComparedRow`).

### `packages/tools/src/scripts/check-baseline-regression.ts::checkFailRise`

Rule 3: the first row whose fail count (`total - metric`) rose without a declaration that covers it (`declarationMismatch`). A declaration names the row under its grammar by validator, or as `parityFixtures`. It walks every grammar the head records, so a row the base does not record (a validator or grammar the change adds) rises from `UNRECORDED_ROW`'s zero counts and is declared `from` `{ pass: 0, total: 0 }`. It runs after `checkCounts`, so a pass that fell beside the rise has already failed there. `totals.fail` is the sum of the rows, so no rise in it can pass this rule unless every row's rise is declared.

### `packages/tools/src/scripts/check-baseline-regression.ts::declarationMismatch`

Why a `baselineCounterChange` entry does not cover a row: there is none, its `from` is not the base's counters, or its `to` is not the head's. Undefined when it covers the row. The declared total drop (`declaredCounterChangeHolds`) the declared fail rise (`checkFailRise`) and the declared case loss (`caseLossMismatch`, which also reads its `cases`) all read a declaration this way.

### `packages/tools/src/scripts/check-baseline-regression.ts::validateCasesByKind`

The shape of a row's optional `casesByKind`: a plain object with sorted keys, each count a positive integer (a kind with no cases is left out), summing to the row's `total`. Every case is counted under its kind, so the inventory cannot drift from the count it explains.

### `packages/tools/src/scripts/check-baseline-regression.ts::ComparedRow`

One row the head records, with the metrics it is compared on: a validator's `pass`, a roundtrip validator's `astMatchPass` as well, or the parity fixtures' `pass`, each with its base and head values (`ComparedMetric`). A row the base does not record is compared against `UNRECORDED_ROW`. `comparedRows` yields a grammar's rows in one order, so the count rule, the total-drop rule, the fail-rise rule and the failure-list rule walk the same rows.

### `packages/tools/src/scripts/check-baseline-regression.ts::caseLosses`

The cases a row lost, kind by kind: each kind whose cases in the head's `casesByKind` fall short of the base's, split into kinds that departed (in the base's `kinds` and missing from the head's, `kindsMissingFrom`) and kinds that did not, which are the kinds still in `kinds` and the keys that are not one of the base's kinds. With no `kinds` on either side, no kind departs, so every loss is compared. A gain is never netted against a loss. Undefined only when the base records no cases by kind for the row, as a baseline collected before the field existed does; `checkHeadKeepsInventories` has already rejected a head that drops them.

### `packages/tools/src/scripts/check-baseline-regression.ts::unexplainedDrop`

Why a row's pass drop is a regression, or undefined when it is not: its fail count (`total - metric`) rose, the row has no case losses to read (`caseLosses` undefined), or a kind that did not depart lost cases. A drop whose every lost case belongs to a departed kind is explained.

### `packages/tools/src/scripts/check-baseline-regression.ts::checkCounts`

Rule 1, per row of `comparedRows`. A pass drop that `unexplainedDrop` does not excuse is a `pass-count-drop`. Then, whether or not the pass fell, a loss of cases by a kind that did not depart is a `case-loss` unless the row's declaration covers it (`caseLossMismatch`). A row where departed kinds lost cases is added to `explained` with those kinds and their cases, which the passing verdict carries and the CLI prints, so the departures a change relies on are visible in CI output.

### `packages/tools/src/scripts/check-baseline-regression.ts::caseLossMismatch`

Why a row's declaration does not cover its case losses: its counters do not match (`declarationMismatch`), or its `cases` does not name every kind that did not depart and lost cases, each with the base's and the head's count. Binding a declaration to the counts of the kinds that moved keeps it to the one comparison it was written for: once the change merges, the base holds the declared `to` counts, so a later move of cases in the same row, even one that leaves the row's pass and total where they were, is not covered.

### `packages/tools/src/scripts/check-baseline-regression.ts::checkHeadKeepsInventories`

Rejects a head that records less than its base: `kinds` the base records, or the `casesByKind` of a row the base records them for. A collected head always records both, so an omission is an edited or truncated record, and without the rejection it would switch the per-kind comparison off. A base without them, collected before the fields existed, still loads.

### `packages/tools/src/scripts/check-baseline-regression.ts::checkTotalDrop`

Rule 2: the first row whose base records no cases by kind (`roundtrip`, or any row of a base collected before inventories) and whose total fell while its pass held, without a declaration naming it with `from` equal to the base's counters and `to` equal to the head's (`declarationMismatch`). Failing cases left such a row, and nothing else tells where they went. A row that lost a pass is left to `checkCounts`, which no declaration excuses, so the two rules never name the same row. A row whose base records cases by kind is held case by case by `checkCounts`, so a departed kind takes its cases, failing ones included, with no declaration. It walks the rows `comparedRows` yields, so a declaration that names one row excuses no drop in another.

### `packages/tools/src/scripts/check-baseline-regression.ts::UNRECORDED_ROW`

The counts a row the base does not record is compared against: no cases, no passes and no AST matches. Such a row cannot drop or lose a case, and every failure it brings is a fail rise.

### `packages/tools/src/scripts/check-baseline-regression.ts::listRiseUnexplained`

Whether a row's failing and format-deferred list (a validator's `failingKinds` and `formatDeferredKinds`, or the parity fixtures' `failingByKind` and `formatDeferredByKind` ids) grew by more than the row's total did, or grew while its pass fell. Growth within the total's is new cases that fail, and `checkFailRise` already holds their count to a declaration. A row whose fail rise is declared is not held to it at all (`failRiseDeclared`). An item that moves from the failing list to the format-deferred one keeps the sum.

### `packages/tools/src/scripts/check-baseline-regression.ts::ROUNDTRIP_BY_VALIDATOR`

Every validator `GrammarEntry` declares, mapped to whether its result is a `RoundtripResult` and so carries `astMatchPass`. The type requires every validator and the right flag for each, so a validator added to `GrammarEntry` fails type-check here until the checker compares it. `VALIDATORS` is its keys, and the shape check rejects a record holding any other validator, whose cases no rule would compare.

### `packages/tools/src/scripts/check-baseline-regression.ts::ownEntry`

A record's own entry under a key the data supplies (a kind, a grammar), or `undefined` when the record has none. A record parsed from JSON is a plain object, so a plain lookup of a kind named `constructor` or `toString` that the record lacks reads the inherited `Object` member, not `undefined`: a lost case's count becomes `NaN` and the loss vanishes, and a missing grammar reads as present. Every lookup by such a key goes through this.

### `packages/tools/src/scripts/check-baseline-regression.ts::declaredRow`

The head's declaration for one grammar's row (a validator, or `parityFixtures`), looked up by own entries (`ownEntry`). The total-drop, case-loss and fail-rise rules all read a row's declaration through it.

### `packages/tools/src/scripts/check-baseline-regression.ts::kindsMissingFrom`

The kinds one grammar entry records in `kinds` that the other does not: with the base first, the kinds that departed; with the head first, the kinds that arrived. Empty when either side records no `kinds`, so a baseline collected before the field existed departs and adds nothing.

### `packages/tools/src/scripts/check-baseline-regression.ts::validatorSum`

The size of a validator's failing and format-deferred lists (`failingKinds` and `formatDeferredKinds`), leaving out the entries whose kind (`kindOfLabel`, since the built-render-parse row labels each with its surface) is in `uncounted`. `checkFormatDeferredRise` leaves out the head's arrived kinds (`kindsMissingFrom`): a kind that splits or is renamed lists its failing parts under new names, which is no spread of failures among kinds that exist on both sides, and `checkFailRise` holds their count. A departed kind is still counted in the base's list, so a failing kind merged into one that survives keeps the sum.

### `packages/tools/src/scripts/check-baseline-regression.ts::isKindId`

Whether a key is a kind id: a non-negative integer, written the way `String(id)` writes it. The parity fixtures key `failingByKind` and `formatDeferredByKind` by the node's numeric `$type`, and an object enumerates such keys in ascending numeric order, the collector's order, so the shape check needs no order check for them: ids 98 and 127 enumerate as 98, 127, which a string comparison would refuse.

### `packages/tools/src/scripts/check-baseline-regression.ts::failureListSizes`

A row's failing and format-deferred list sizes on the base and the head, for the failure-list rule: the parity fixtures' failure ids (`parityFixturesSum`), or a validator's failing kinds (`validatorSum`, the head's without the kinds it adds). Undefined for a validator the base does not record, which the rule does not compare.

### `packages/tools/src/scripts/check-baseline-regression.ts::failRiseDeclared`

Whether a row's fail count (`total - pass`, or `total - astMatchPass` for a roundtrip validator) rose and a declaration covers the row (`declarationMismatch`), the rise `checkFailRise` accepts. The failure-list rule does not hold such a row to its allowance: one new failing case can list several kinds, a corpus entry every kind it fails in. A declaration whose row did not fail more excuses no list growth, and an inherited one cannot match, as its `from` no longer equals the base.

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

### `packages/tools/src/scripts/collect-baseline.ts::GrammarEntry`

One grammar's validator results and parity fixtures, with `kinds`: the validators' kind enumeration, sorted, as the render-body catalog `deriveRuleKinds` reads it (the kinds read-render-parse, factory storage and the corpus-coverage census test). A kind departs when it leaves `kinds`, so a kind that becomes a supertype, and so loses its render body, departs. `from` also tests leaf kinds that have no render body. They are not in `kinds`, so a case lost under one of them is never a departure, and fails unless the row is declared. `kinds` is optional so that a baseline collected before it existed still loads, explaining no drop.

### `packages/tools/src/scripts/collect-baseline.ts::ValidatorResult`

One validator's counts and failing kinds. `casesByKind` counts its cases under the kind each tests, every case once, summing to `total`: one per kind for `coverage` (under the render-body name it checks) and for `from`, one per corpus candidate for `factoryStorage`, and one per rendered built node, over both surfaces, for `builtRenderParse`. `roundtrip` counts corpus rows and records none. It is optional for the same reason as `GrammarEntry`'s `kinds`.

### `packages/tools/src/scripts/collect-baseline.ts::ParityFixtures`

The render fixtures replayed for a grammar: counts, failures by kind id, and the fixtures the regen left out. `casesByKind` counts the fixtures under their `pattern`, the kind each was generated for.

### `packages/tools/src/scripts/collect-baseline.ts::DeclaredRowChange`

One row's declared change in `baselineCounterChange`: its counters before (`from`) and after (`to`), and, for cases moved or lost by kinds that did not depart, `cases`, naming each such kind with its count in the base and in the head.
