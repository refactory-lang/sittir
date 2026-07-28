# `packages/codegen/src/transpile` — Function Glossary

Per-function reference for `packages/codegen/src/transpile/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
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
 * Transpile `packages/<grammar>/overrides.ts` to
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
