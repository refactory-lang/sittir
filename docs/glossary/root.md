# `packages/codegen/src` — Function Glossary

Per-function reference for `packages/codegen/src/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/engine-loader.ts::loadWebTreeSitter`

```text
/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 *
 * This is codegen-run infrastructure: it is consumed by `compiler/generated-metadata`
 * (and, internally, by the corpus validator in `validate/common.ts`). It lives at the
 * top level of `src/` — NOT under `validate/` — for two reasons: the validator
 * surface is relocatable to `packages/tools`, and `codegenSourceHash()` excludes
 * `/src/validate/` from the manifest source hash, so a loader placed there would let
 * edits slip past staleness verification.
 */
```

### `packages/codegen/src/polymorph-variant.ts::assertNever`

```text
/**
 * Exhaustiveness helper. Place at the end of every switch on a
 * discriminated union so adding a new variant becomes a compile error
 * here instead of a silent wrong-answer at runtime.
 */
```

### `packages/codegen/src/run-codegen.ts::writeFile`

```text
/**
 * Write `content` to `path`, creating parent directories as needed.
 *
 * `.ts` output is run through oxfmt (the project's own formatter, config
 * from `./oxfmt-config.ts` — the repo-root `oxfmt.config.ts` derives from
 * that same module rather than the other way around, since a package's
 * `src/` can't reach outside its own `tsconfig.build.json` rootDir once
 * only `dist` is packaged) before the content-aware comparison below, so
 * generated `.ts` files land on disk already matching `pnpm run format`'s
 * output —
 * no separate formatting pass needed, and no risk of a formatter
 * reformatting generated code out from under the emitters (oxfmt must
 * never run over `packages/*\/src/*` directly; only codegen writes there).
 *
 * `node-model.json5` is deliberately NOT run through oxfmt here even
 * though it matches `pnpm run format`'s scope: `packages/tools/src/
 * validate/common.ts`'s `loadNodeModel` parses it with strict `JSON.parse`,
 * and oxfmt reformats JSON5 idiomatically (unquoted keys, single-quoted
 * strings) — valid JSON5, but not valid JSON, breaking that parser. Fix
 * belongs in `loadNodeModel` (use a real JSON5 parser) before this file
 * can be formatted too.
 *
 * Content-aware: skips the write when the file already holds identical
 * bytes. Generated outputs are rewritten wholesale on every regen even
 * when nothing changed, and the mtime bump alone forced cargo (release
 * profile, `incremental = false`) to recompile entire napi crates and
 * made every mtime-based freshness signal noisy. Skipping no-op writes
 * keeps mtimes meaningful: unchanged crates fingerprint-match in cargo,
 * so rebuilds and the workspace check finish in seconds on a no-change
 * regen. Formatting BEFORE this comparison (not after) is what makes the
 * skip meaningful — comparing against on-disk (already-formatted) content
 * with pre-format content would never match, causing a spurious rewrite
 * on every single regen.
 */
```

```text
// ---------------------------------------------------------------------------
// Internal helpers — co-located with cli.ts originally
// ---------------------------------------------------------------------------
```

#### body

```text
// Unreadable existing file — fall through and overwrite.
```

### `packages/codegen/src/run-codegen.ts::runTreeSitterGenerate`

```text
/**
 * Run 'tree-sitter generate' in a grammar's .sittir/ directory — produces
 * grammar.json + node-types.json from the transpiled grammar.js. Uses
 * execSync (shell-level) rather than spawnSync; tree-sitter is a native
 * binary so either would launch a separate OS process (no Node module
 * sharing concern) — exec is just simpler for a bare command.
 */
```

### `packages/codegen/src/run-codegen.ts::runStandaloneSteps`

```text
/**
 * Run the explicitly-requested standalone parser-generation steps
 * (`--transpile` / `--ts-generate` / `--compile-parser`) — the override/parser
 * maintenance workflow. Mirrors the old CLI's standalone branch: usable with
 * only `--grammar` (no `--output`/`--nodes`/`--all` required). Runs only the
 * steps whose flag is set, in transpile → tree-sitter generate → compile-parser
 * order.
 */
```

### `packages/codegen/src/run-codegen.ts::runGrammarDiagnosticsPreflight`

```text
/**
 * Runs the grammar-diagnostics preflight check for the given grammar.
 *
 * - If `injectedDiagnostics` is provided, those are used directly (test seam).
 * - Otherwise, the grammar is loaded and evaluated to derive diagnostics.
 * - Blocked diagnostics (canProceed === false) that are NOT in the allow-list
 *   cause an error to be thrown in non-interactive mode, or a prompt in
 *   interactive mode.
 * - `confirm` overrides the default stdin-based TTY prompt (test seam).
 */
```

```text
// ---------------------------------------------------------------------------
// Grammar-diagnostics preflight gate
// ---------------------------------------------------------------------------
```

#### body

```text
// enrich() ran as part of producing `rawGrammar` above and attached its
// downgraded parsekind-noninjective diagnostics to that grammar object
// (evaluate propagates them from the enriched base). Read them off
// `rawGrammar`'s own return value — NOT a module-global accumulator — so
// they are correct even on a repeated evaluate() of the same grammar in
// one process, and never interleave across concurrent grammar
// evaluations. They land in the same persisted grammar-diagnostics.json
// as every other grammar diagnostic source.
```

#### body

```text
// Non-blocking (and allow-listed) diagnostics are always surfaced as
// visible, non-fatal output so every collected grammar condition prints
// during `sittir gen`/regen, even when none are blocking.
```

#### body

```text
// Persist the COMPLETE diagnostic set (blocking + non-blocking) — writing
// only `nonBlocking` silently dropped blocking diagnostics from the
// persisted artifact even when the run went on to proceed (allow-listed,
// or confirmed interactively).
//
// Only write when running against a REAL loaded grammar. `injectedDiagnostics`
// is a test-only seam (`cli-grammar-diagnostics.test.ts` injects diagnostics
// for an arbitrary/fake grammar to exercise the gate's allow-list/confirm
// logic in isolation, bypassing real grammar loading) — writing through to
// the tracked `packages/<grammar>/.sittir/grammar-diagnostics.json` in that
// case would contaminate the real artifact with test fixtures. Keep the
// injection seam side-effect-free.
```

### `packages/codegen/src/run-codegen.ts::runCodegenCli`

```text
/**
 * Testable preflight gate entry. Parses `--grammar` and `--allow-diagnostic`
 * from argv and runs the grammar-diagnostics preflight, returning 0 when no
 * blocking diagnostic survives the allow-list (throws `GrammarDiagnosticError`
 * otherwise). Test seams: `env.diagnostics` injects diagnostics (bypasses
 * grammar loading), `env.confirm` overrides the TTY prompt, `env.isTTY`
 * overrides the gate's interactivity decision.
 */
```

### `packages/codegen/src/run-codegen.ts::runCodegen`

```text
/**
 * Core codegen path: generate IR from grammar, write all output files, run the
 * renderable check, rebuild the native binding, and write the manifest. Returns
 * the assembled `NodeMap` so the caller (the cli `gen` orchestrator) can thread
 * it into the tools-side post-generate validation passes (parity fixtures,
 * round-trip probes) — this function no longer runs validation itself, which is
 * what severs the `codegen → tools` dependency.
 *
 * Preconditions (checked by caller or CLI):
 *  - `opts.outputDir` must be set (throws otherwise)
 *  - `opts.all` or `opts.nodes` must be set (throws otherwise)
 *
 * Throws an `Error` (rather than calling `process.exit`) for missing required
 * options, so programmatic callers can handle them. The CLI layer converts
 * these throws to `console.error` + `process.exit(1)`.
 */
```

```text
// ---------------------------------------------------------------------------
// Core codegen function
// ---------------------------------------------------------------------------
```

#### body

```text
// Codegen IS the writer of the per-grammar manifest. Internal validator runs
// invoked from inside this function (e.g. extractParityFixtures uses
// validateReadRenderParse to extract parity fixtures BEFORE the manifest is
// rewritten) would otherwise verify the manifest mid-write — checking the
// codegen process against its own incomplete output, which is meaningless.
// Set the env so `loadLanguageForGrammar` skips verification for these
// internal calls. External callers (validator CLI, probe-validate, etc.) do
// not run this function and therefore do not inherit this env.
```

#### body

```text
// Grammar-diagnostics preflight gate. Blocking diagnostics (canProceed ===
// false) not covered by `allowDiagnostics` throw GrammarDiagnosticError in
// non-interactive mode, or prompt on a TTY. Known-debt diagnostics are
// currently non-blocking (canProceed: true), so this surfaces them without
// halting; --allow-diagnostic remains available for any future blocking code.
```

#### body

```text
// Surface slot-grouping diagnostics from the normalize phase. These are
// non-blocking propose-promotion suggestions; printing them here (after
// generate()) ensures they appear during `sittir gen --all` even when
// the preflight and generate() pipelines are separate.
```

#### body

```text
// Write source files
```

#### body

```text
// Write per-rule `.jinja` files to packages/<grammar>/templates/
// (feature 011). writeJinjaTemplates also deletes stale `.jinja` files
// whose rule kind is no longer in the grammar.
```

#### body

```text
// Static-seam-resolution residue report: how many template boundaries
// the SEQ join resolved statically, how many runtime checks have a
// statically-knowable outcome (derivable — the static-resolution
// candidate pool), and how many genuinely vary per instance (the true
// residue the spec ratchets on). The full per-boundary record list is
// persisted beside the other generated grammar artifacts so a ratchet
// (and a reviewer) can see WHICH sites changed, not just the counts.
```

#### body

```text
// --- grammar-owned Rust render-module emission --- When `--all` is set for
// a supported grammar, also emit hash.rs / hash.ts so the native backend
// and the TS backend can detect template-bundle drift at runtime (FR-020).
// The hash is computed over the same `.jinja` bodies that were just written
// above — this keeps the TS-side and Rust-side derivations in lockstep.
```

#### body

```text
// Copy the per-kind `.jinja` files into the grammar crate's templates/
// directory so askama's build-time `#[template(path =...)]` can
// resolve them. Stale files (no longer in the generated copy plan) are
// removed so regenerations don't accumulate dead templates.
```

#### body

```text
// Write per-grammar kind_ids.rs (Phase B: KindID runtime migration).
// This file exports one pub const per kind matching the TS-side TSKindId enum.
```

#### body

```text
// Rebuild the corresponding N-API binding so the native render path
// picks up the new templates. Askama compiles templates at the
// crate's build time via proc macro; without a rebuild, native
// baseline collection silently falls back to TS render with the
// previous templates baked in. Opt out with --no-build-native.
```

#### body

```text
// Dev/gate loop can build the napi crate in DEBUG via --native-debug.
// The validate gate only needs a CORRECT .node (AST-match), not an optimized
// one — and the debug profile enables incremental compilation (the release
// profile has `incremental = false`), so a codegen edit → regen recompiles
// only the changed crate + relinks instead of a full from-scratch optimized
// build. Keep the default `build` (`--release`) for CI / production artifacts.
// Explicit opt-in only (--native-debug, not an env var): build-profile
// choice affects the shared, historically-compared validate:native
// numbers, so it must be visible in the invocation, never inherited
// from ambient shell state.
```

#### body

```text
// Workspace-wide compile check — codegen changes in render-module.ts
// affect all three grammars' emitted transport.rs. Without a check
// across the whole workspace, breakage in non-targeted grammars
// (e.g. python or typescript) would silently persist until the next
// per-grammar regen. cargo check is incremental: a no-op for the
// crate just rebuilt by napi, and only compiles other crates whose
// source changed since their last build.
//
// Skippable via --no-workspace-check: a multi-grammar driver
// (`regen:all`) runs the check once on its LAST grammar instead of
// once per grammar — the final check still covers the whole
// workspace, the earlier ones were redundant.
```

#### body

```text
// Write node model (single on-disk metadata source — PR-K folded the
// former factory-map.json5 sections in here).
```

#### body

```text
// Write suggested overrides log (T042f) next to grammar.sittir.ts at the
// package root. This is a documentation file — not runnable. `undefined`
// means the emitter has nothing to suggest (emission disabled or empty
// result) — skip the write, and remove any stale file left by a prior
// run so re-enabling the emitter later naturally recreates it.
```

#### body

```text
// Write tests
```

#### body

```text
// Write vitest config
```

#### body

```text
// --- Renderability check: every named kind in node-types.json must be
// reachable by @sittir/legacy-core's render() function (supertype, leaf, or rule).
// Uses the NodeMap directly for a structural truth check.
```

#### body

```text
// Collected diagnostic: kinds whose CHOICE slot has no grammar field name.
// A naked choice falls back to an unresolvable `content` slot; the author must
// give it an explicit `field('<name>', ...)` in `packages/<lang>/grammar.sittir.ts`.
```

#### body

```text
// Warning-only: these are typically anonymous / alias-target kinds that
// never get rendered as top-level nodes (e.g. `empty_statement`,
// `doc_comment`). If user code DOES call render() on them, it will
// throw — but that's a real consumer bug, not a codegen failure.
```

#### body

```text
// Write the per-grammar generated.manifest.json after all bulk writes complete
// and before any validation runs. Always happens regardless of --roundtrip,
// because the manifest needs to track the current on-disk state for any
// downstream validator (this function's roundtrip probes OR the external
// validator CLI). Nothing is written after validation runs.
```

#### body

```text
// Post-regen emit diff: show what THIS run changed in the generated output,
// grouped by emitter, working tree vs HEAD. Convenience only — skipped under
// --no-emit-diff and silently when git is unavailable. Printed here (right
// after the manifest write, before validation) so it reflects the same on-disk
// state the manifest just captured.
```

#### body

```text
// Spec 013: dump derive-audit counts if SITTIR_AUDIT_DERIVE=1 was set.
// No-op otherwise. Used to validate simplify's canonicalization before
// shrinking `deriveFields` / `deriveChildren` to trivial walks.
```

#### body

```text
// Return the assembled NodeMap so the cli orchestrator can thread it into the
// tools-side post-generate validation passes (parity fixtures, round-trip
// probes) — validation no longer runs inside codegen.
```

### `packages/codegen/src/run-codegen.ts::runFullRegen`

```text
/**
 * The `--all` auto-chain: transpile overrides → tree-sitter generate →
 * compile-parser → runCodegen (which writes all artifacts) → optional native
 * rebuild.
 *
 * Mirror the exact ordering from the old `mainCli` --all path.
 *
 * The `opts.skipTsChain` flag (or pre-set `opts.transpile`/`opts.tsGenerate`
 * flags) suppresses the chain prefix, deferring to whatever state is already
 * on disk — same semantics as the old `--skip-ts-chain` / standalone flags.
 */
```

```text
// ---------------------------------------------------------------------------
// Full regen (--all chain: transpile → ts-generate → compile-parser → runCodegen
// → native rebuild)
// ---------------------------------------------------------------------------
```

#### body

```text
// Set BEFORE any generate/validate work (mirrors the top-level set in cli.ts).
```

#### body

```text
// Auto-chain: with --all, by default run transpile + tree-sitter generate
// + compile-parser BEFORE sittir codegen. This produces fresh
// .sittir/grammar.js, .sittir/src/{grammar,node-types}.json, AND a
// fresh .sittir/parser.wasm — sittir codegen then reads those to emit
// packages/<grammar>/src/*. Opt out with --skip-ts-chain if you only
// want the sittir codegen phase (e.g., rapid iteration when the upstream
// grammar hasn't changed).
//
// parser.wasm MUST be rebuilt alongside grammar.js / node-types.json —
// otherwise validators that consult the override parser (via
// loadLanguageForGrammar) see a stale parser that doesn't know about
// recent `field(...)` / `variant(...)` additions, producing silent
// AST mismatches in round-trip tests.
```

#### body

```text
// Run the core codegen (generate → write all files → renderable → manifest
// → emit-diff → native rebuild (if applicable)). The native rebuild lives
// inside runCodegen (within the shouldEmitRustRender block) so it runs BEFORE
// manifest write — matching the original ordering from mainCli where cargo
// build preceded writeManifestForGrammar. Returns the NodeMap for the
// orchestrator's post-generate validation.
```

### `packages/codegen/src/polymorph-variant.ts::PolymorphVariantDescriptor`

```text
/**
 * (source-homonym resolution, decision 6 outcome revision — renamed, not
 * removed.) This field is the descriptor's OWN discriminated-union tag
 * (structurally identical in role to `rule.type`), not the authorship/
 * provenance homonym decision 6 targets: its two values name which of the
 * two shapes below is present. It drives live variant dispatch —
 * `packages/tools/src/validate/common.ts`'s `inferOverrideHelperVariant` /
 * `inferPolymorphVariant` (`switch (desc.definedBy)`) and
 * `read-render-parse.ts`'s `if (desc.definedBy !== 'override') continue` —
 * and the JSON serialized into node-model.json5 is this union's wire
 * format, so there is no compile-time narrowing once round-tripped.
 * Renamed from `source` → `definedBy` (decision 7 small cleanup b) so the
 * stem no longer collides with the provenance vocabulary.
 */
```

```text
/**
 * Descriptor telling validators how to stamp `$variant` on a derived
 * polymorph config when the caller didn't supply it (readNode-derived
 * shapes, `.from()` Loose wrappers). Serialized into node-model.json5's
 * `polymorphVariants` section; consumed by `nodeToConfig` via
 * `validate/common.ts`.
 *
 * Lives in codegen — not `@sittir/types` — because the descriptor is
 * codegen/validator-internal. Consumers of `@sittir/types` should never
 * see it.
 */
```

### `packages/codegen/src/run-codegen.ts::CodegenOptions`

```text
/**
 * The library-facing option shape for both `runCodegen` and `runFullRegen`.
 * Generalizes the old `CodegenConfig` + `CliArgs` from cli.ts.
 */
```

### `packages/codegen/src/run-codegen.ts::grammar`

```text
/** Grammar name (rust, typescript, python). */
```

### `packages/codegen/src/run-codegen.ts::outputDir`

```text
/** Output directory for generated TS files (e.g. packages/rust/src). */
```

### `packages/codegen/src/run-codegen.ts::nodes`

```text
/** Specific node kinds to generate (mutually exclusive with `all`). */
```

### `packages/codegen/src/run-codegen.ts::all`

```text
/** Generate full native render-module artifacts (equivalent to --all). */
```

### `packages/codegen/src/run-codegen.ts::testsDir`

```text
/** Output directory for test files (default: ../tests relative to outputDir). */
```

### `packages/codegen/src/run-codegen.ts::compileParser`

```text
/** Compile override grammar to .sittir/parser.wasm (standalone step). */
```

### `packages/codegen/src/run-codegen.ts::transpile`

```text
/** Transpile grammar.sittir.ts to .sittir/grammar.js (standalone step). */
```

### `packages/codegen/src/run-codegen.ts::tsGenerate`

```text
/** Run 'tree-sitter generate' in .sittir/ (standalone step). */
```

### `packages/codegen/src/run-codegen.ts::skipTsChain`

```text
/** Skip the auto transpile + tree-sitter generate chain that --all normally runs. */
```

### `packages/codegen/src/run-codegen.ts::buildNative`

```text
/**
	 * Whether to rebuild the N-API binding after native emit (default: true).
	 * Set to `false` to skip cargo rebuild (--no-build-native).
	 */
```

### `packages/codegen/src/run-codegen.ts::workspaceCheck`

```text
/**
	 * Whether to run `cargo check --workspace` after the native rebuild
	 * (default: true). Set to `false` (--no-workspace-check) in multi-grammar
	 * drivers for all but the LAST grammar — the final check covers the whole
	 * workspace, making the earlier per-grammar checks redundant.
	 */
```

### `packages/codegen/src/run-codegen.ts::noEmitDiff`

```text
/** Suppress the post-regen emit-diff report (--no-emit-diff). */
```

### `packages/codegen/src/run-codegen.ts::allowDiagnostics`

```text
/** List of diagnostic messages to allow (passed from CLI allowlist). */
```

### `packages/codegen/src/oxfmt-config.ts::OXFMT_EFFECTIVE_CONFIG`

```text
/**
 * The effective config for formatting a single `.ts` file's content via
 * oxfmt's programmatic `format()` API. That API does not auto-discover
 * `.editorconfig` the way oxfmt's CLI does, so `.editorconfig`'s
 * `indent_style = tab` rule for `.ts` files (repo-wide, `root = true`,
 * unambiguous) is merged in by hand here.
 */
```

### `packages/codegen/src/oxfmt-config.ts::module`

```text
/**
 * Canonical oxfmt formatting settings — single source of truth for both the
 * repo-root `oxfmt.config.ts` (consumed by `pnpm run format` / oxfmt's CLI)
 * and `writeFile()`'s in-pipeline formatting of generated `.ts` output
 * (`run-codegen.ts`).
 *
 * Lives inside `packages/codegen/src` — not the repo root — so it ships
 * with the package's own `dist` output and resolves correctly for real
 * installed/published consumers. A repo-root-relative import from a
 * package's `src/` reaches outside that package's `tsconfig.build.json`
 * `rootDir`, and Node can't resolve it once only `dist` is packaged.
 */
```

### `packages/codegen/src/oxfmt-config.ts::OXFMT_CONFIG.ignorePatterns`

#### body

```text
// Ad-hoc probes and debug scripts — see scratch/README.md. Nothing
// there gates a commit, so the formatter has no business rewriting it.
```

#### body

```text
// Producer-owned serialization: collect-baseline.ts emits a strict
// 4-space-indent contract — a formatter pass here breaks refresh diffs.
```

### `packages/codegen/src/run-codegen.ts::module`

```text
/**
 * Codegen library surface — programmatic entry points for running the codegen
 * pipeline without going through the CLI argument parser.
 *
 * `runCodegen`    — core path: generate IR → write all output files → renderable
 *                   check → manifest write → optional emit-diff → optional roundtrip.
 * `runFullRegen`  — `--all` chain: transpile → tree-sitter generate →
 *                   compile-parser → runCodegen → optional native rebuild.
 *
 * Error handling: instead of calling `process.exit()` (as the CLI does for
 * missing arguments), these functions throw `Error` with the same messages.
 * The CLI caller catches and converts to `process.exit(1)`.
 */
```

### `packages/codegen/src/index.ts::module`

```text
/**
 * @sittir/codegen — public surface.
 *
 * The five-phase pipeline (evaluate → link → normalize → assemble → emit)
 * is exposed as `generate`.
 */
```
