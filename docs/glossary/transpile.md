# `packages/codegen/src/transpile` — Function Glossary

Per-function reference for `packages/codegen/src/transpile/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `syncExternalScanner` (`packages/codegen/src/transpile/compile-parser.ts:50`)

```text
/**
 * Copy the base grammar's scanner.c into .sittir/src/ when missing,
 * preserving any relative #include paths it uses (e.g., typescript's
 * scanner.c includes ../../common/scanner.h). Looks under the grammar
 * package's node_modules/tree-sitter-<name>/{src,<lang>/src}/scanner.c.
 * No-op when no scanner.c exists in the base grammar (most grammars).
 */
```

### `transpileOverrides` (`packages/codegen/src/transpile/transpile-overrides.ts:51`)

```text
/**
 * Transpile `packages/<grammar>/grammar.sittir.ts` to
 * `packages/<grammar>/.sittir/grammar.js`. Returns the output path
 * and basic stats. Throws on transpile errors with esbuild's diagnostic
 * messages attached.
 */
```

### `copyExternalScannerSources` (`packages/codegen/src/transpile/transpile-overrides.ts:183`)

```text
/**
 * Copy any external scanner source files (scanner.c, scanner.cc) from
 * the base grammar's src/ directory into the transpiled .sittir/src/
 * so tree-sitter generate + native compilation can find them.
 *
 * The base grammar package may not exist (some grammars have no
 * scanner) — in that case the function silently does nothing.
 */
```

### `externalizeTreeSitterBases` (`packages/codegen/src/transpile/transpile-overrides.ts:220`)

```text
/**
 * esbuild plugin that marks any import resolving to a tree-sitter
 * base grammar (`tree-sitter-<lang>/grammar.js`) as external. Matches
 * both package-name imports and relative pnpm-store paths.
 *
 * Critically: when the import is externalized, the `require()` call
 * in the bundled output must use a path that tree-sitter's CLI can
 * resolve at runtime. We rewrite to the package-name form so it
 * resolves through normal Node module resolution.
 */
```

### `grammar` (`packages/codegen/src/transpile/transpile-overrides.ts:36`)

```text
/** Grammar name — e.g. 'rust', 'python', 'typescript'. */
```

### `packagesRoot` (`packages/codegen/src/transpile/transpile-overrides.ts:38`)

```text
/** Override the default packages root (used in tests). */
```

### `outputPath` (`packages/codegen/src/transpile/transpile-overrides.ts:43`)

```text
/** Absolute path to the generated `.sittir/grammar.js`. */
```

### `sourceBytes` (`packages/codegen/src/transpile/transpile-overrides.ts:45`)

```text
/** Source size in bytes. */
```

### `outputBytes` (`packages/codegen/src/transpile/transpile-overrides.ts:47`)

```text
/** Output size in bytes. */
```

### `syncExternalScanner` (`packages/codegen/src/transpile/compile-parser.ts`)

Some grammars — tree-sitter-typescript among them — bundle a custom external
scanner that `tree-sitter generate` does not materialize. Without it the WASM
build fails with "Missing symbols" for the
`tree_sitter_<lang>_external_scanner_*` functions, so the base grammar's
`scanner.c` (and any header it relatively-includes) is copied into
`.sittir/src/` before building.
