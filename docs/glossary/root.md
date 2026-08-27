# `packages/codegen/src` — Function Glossary

Per-function reference for `packages/codegen/src/`, mechanically relocated from source
JSDoc by `scripts/relocate-jsdoc-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `loadWebTreeSitter` (`packages/codegen/src/engine-loader.ts:3`)

```text
/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 *
 * This is codegen-run infrastructure: it is consumed by `compiler/generated-metadata`
 * (and, internally, by the corpus validator in `validate/common.ts`). It lives at
 * the top level of `src/` — NOT under `validate/` — for two reasons (R9): the
 * validator surface is relocatable to `packages/tools`, and `codegenSourceHash()`
 * excludes `/src/validate/` from the manifest source hash, so a loader placed there
 * would let edits slip past staleness verification.
 */
```

### `assertNever` (`packages/codegen/src/polymorph-variant.ts:41`)

```text
/**
 * Exhaustiveness helper. Place at the end of every switch on a
 * discriminated union so adding a new variant becomes a compile error
 * here instead of a silent wrong-answer at runtime.
 */
```

### `writeFile` (`packages/codegen/src/run-codegen.ts:89`)

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

### `runTreeSitterGenerate` (`packages/codegen/src/run-codegen.ts:146`)

```text
/**
 * Run 'tree-sitter generate' in a grammar's .sittir/ directory — produces
 * grammar.json + node-types.json from the transpiled grammar.js. Uses
 * execSync (shell-level) rather than spawnSync; tree-sitter is a native
 * binary so either would launch a separate OS process (no Node module
 * sharing concern) — exec is just simpler for a bare command.
 */
```

### `runStandaloneSteps` (`packages/codegen/src/run-codegen.ts:162`)

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

### `runGrammarDiagnosticsPreflight` (`packages/codegen/src/run-codegen.ts:195`)

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

### `runCodegenCli` (`packages/codegen/src/run-codegen.ts:284`)

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

### `runCodegen` (`packages/codegen/src/run-codegen.ts:320`)

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

### `runFullRegen` (`packages/codegen/src/run-codegen.ts:609`)

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

### `PolymorphVariantDescriptor` (`packages/codegen/src/polymorph-variant.ts:13`)

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

### `CodegenOptions` (`packages/codegen/src/run-codegen.ts:44`)

```text
/**
 * The library-facing option shape for both `runCodegen` and `runFullRegen`.
 * Generalizes the old `CodegenConfig` + `CliArgs` from cli.ts.
 */
```

### `grammar` (`packages/codegen/src/run-codegen.ts:49`)

```text
/** Grammar name (rust, typescript, python). */
```

### `outputDir` (`packages/codegen/src/run-codegen.ts:51`)

```text
/** Output directory for generated TS files (e.g. packages/rust/src). */
```

### `nodes` (`packages/codegen/src/run-codegen.ts:53`)

```text
/** Specific node kinds to generate (mutually exclusive with `all`). */
```

### `all` (`packages/codegen/src/run-codegen.ts:55`)

```text
/** Generate full native render-module artifacts (equivalent to --all). */
```

### `testsDir` (`packages/codegen/src/run-codegen.ts:57`)

```text
/** Output directory for test files (default: ../tests relative to outputDir). */
```

### `compileParser` (`packages/codegen/src/run-codegen.ts:59`)

```text
/** Compile override grammar to .sittir/parser.wasm (standalone step). */
```

### `transpile` (`packages/codegen/src/run-codegen.ts:61`)

```text
/** Transpile grammar.sittir.ts to .sittir/grammar.js (standalone step). */
```

### `tsGenerate` (`packages/codegen/src/run-codegen.ts:63`)

```text
/** Run 'tree-sitter generate' in .sittir/ (standalone step). */
```

### `skipTsChain` (`packages/codegen/src/run-codegen.ts:65`)

```text
/** Skip the auto transpile + tree-sitter generate chain that --all normally runs. */
```

### `buildNative` (`packages/codegen/src/run-codegen.ts:67`)

```text
/**
	 * Whether to rebuild the N-API binding after native emit (default: true).
	 * Set to `false` to skip cargo rebuild (--no-build-native).
	 */
```

### `workspaceCheck` (`packages/codegen/src/run-codegen.ts:72`)

```text
/**
	 * Whether to run `cargo check --workspace` after the native rebuild
	 * (default: true). Set to `false` (--no-workspace-check) in multi-grammar
	 * drivers for all but the LAST grammar — the final check covers the whole
	 * workspace, making the earlier per-grammar checks redundant.
	 */
```

### `noEmitDiff` (`packages/codegen/src/run-codegen.ts:79`)

```text
/** Suppress the post-regen emit-diff report (--no-emit-diff). */
```

### `allowDiagnostics` (`packages/codegen/src/run-codegen.ts:81`)

```text
/** List of diagnostic messages to allow (passed from CLI allowlist). */
```

### `OXFMT_EFFECTIVE_CONFIG` (`packages/codegen/src/oxfmt-config.ts:36`)

```text
/**
 * The effective config for formatting a single `.ts` file's content via
 * oxfmt's programmatic `format()` API. That API does not auto-discover
 * `.editorconfig` the way oxfmt's CLI does, so `.editorconfig`'s
 * `indent_style = tab` rule for `.ts` files (repo-wide, `root = true`,
 * unambiguous) is merged in by hand here.
 */
```
