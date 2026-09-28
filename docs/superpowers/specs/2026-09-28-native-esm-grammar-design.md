# Native ESM grammar, no bundler

**Status:** Design, awaiting user review. Issue #387.

## Problem

`tree-sitter generate` runs `.sittir/grammar.js`, which is an esbuild bundle of
`grammar.sittir.ts`. sittir's `evaluate()` runs `grammar.sittir.ts` itself. The bundle
is a second copy of the grammar, and of every DSL module it imports:

- **Module state diverges.** The bundle carries its own module instances. The
  `role()` primitive keeps a module-level scope that `evaluate` opens on the workspace
  copy, so a bundled copy never sees it.
- **The bundle goes stale.** It only changes when something re-bundles. Paths that
  generate without bundling first run an old grammar and report nothing.
- **A build tool sits between the source and the parser** only to turn TypeScript into
  something tree-sitter's loader can run.

## Goal

The grammar has one form, the TypeScript source, and both tools execute it.
`.sittir/grammar.js` is a one-line module that re-exports the source. Node's
built-in type stripping runs it. esbuild is removed.

```
grammar.sittir.ts ◀── import ── .sittir/grammar.js ◀── tree-sitter generate (node)
        ▲
        └──────────── import ── evaluate() (sittir)
```

## Facts this design rests on

- tree-sitter's loader, `dsl.js` (0.26.9 and 0.27.0 alike), sets the DSL globals and then
  runs `await import(TREE_SITTER_GRAMMAR_PATH)`, reading `default?.grammar ?? grammar`.
  An ES module whose default export is the grammar object loads.
- The loader accepts only a `.js` or `.json` path (`load_grammar_file`). A `.ts` path
  is refused, which is why the re-export file stays.
- The default runtime is `node`, spawned from `PATH`. The `native` QuickJS runtime has
  no type stripping and resolves modules only as `./node_modules/<name>.js`, so it is
  not used.
- Node strips types by default from 22.18 (and 23.6). It refuses syntax that cannot be
  erased, such as enums, namespaces with values and parameter properties, and it
  refuses `.ts` files under `node_modules`. The grammar entries import the DSL by
  relative `.ts` path (`../codegen/src/dsl/index.ts`) and the upstream base by path, so
  no stripped file lives under `node_modules`.
- **Probe** (master at 582fcce56, Node 26, tree-sitter 0.26.9): `.sittir/package.json`
  set to `"type": "module"` and `grammar.js` replaced with the re-export. `generate` gave
  a byte-identical `parser.c` and `node-types.json` for python, rust and typescript.
  Before sittir's post-generate prune, its raw `grammar.json` was byte-identical to the
  bundle's raw output.
- `pruneOrphanedPlaceholderRules` (`transpile/prune-grammar-json.ts`) runs after
  `generate` at `run-codegen.ts` and `transpile/compile-parser.ts`. It removes the
  unreachable placeholder rules from `grammar.json`. It is independent of how the grammar
  loads, and it stays.

## Design

### The re-export module

`transpileOverrides` keeps writing the package scaffolding: `tree-sitter.json`, the
scanner sources, the conflict resolutions file. Two things change:

- `.sittir/package.json` is written with `"type": "module"`.
- `.sittir/grammar.js` is written as the single statement
  `export { default } from '../grammar.sittir.ts';`. The path is relative to the
  grammar entry.

The esbuild call, the `externalizeTreeSitterBases` plugin and the CommonJS footer are
deleted, and so are the `esbuild` dependency and `TranspileResult`'s byte counts.
`transpileOverrides` becomes synchronous scaffolding. Renaming it is left to the plan.

Because the re-export names the source, `.sittir/grammar.js` can no longer go stale, and
nothing needs to re-bundle before `generate`. The conflict derivation store keeps
writing `resolutions.json`, which the grammar imports with `{ type: 'json' }`, and its
bundle step disappears.

### One evaluation path

`compileGrammar`'s fallback to the package `.sittir/grammar.js` is removed. That file
is now only the source under another name, so evaluating the entry directly is the
single path.

### Runtime floor

- `engines.node` becomes `>=22.18.0`. Every CI job moves to a matching Node: the one
  job pinned to `20` changes, and the `22.x` jobs resolve to 22.18 or later.
- A check at the start of regeneration fails with a clear message when the `node` on
  `PATH` is older than the floor. tree-sitter would otherwise fail with a syntax
  error from inside the grammar.

### Erasable syntax only

tsconfig gets `erasableSyntaxOnly: true`, so the type-checker refuses any syntax
Node cannot strip, in every file the grammar imports and everywhere else. This makes
"tree-sitter can load the grammar" a type error rather than a regen failure.

### tree-sitter 0.27.0

The upgrade is a separate, later change. This design does not depend on it: 0.26.9
loads ES modules the same way. Keeping the two apart lets this change's gate be byte
identity, while the upgrade's gate is its own. The upgrade may change `parser.c`
through the CLI itself, and adds the `eof` global.

## Gates

- Byte-identical regeneration for every grammar: `parser.c`, `grammar.json` (after
  the prune), `node-types.json`, `resolutions.json`, every generated package source and
  `validation-report.json`. The one expected diff is `.sittir/grammar.js` and
  `.sittir/package.json`.
- The full unit suite, the type-check (with `erasableSyntaxOnly`), lint and cargo.

## Tests

- The scaffolding writes the re-export and `"type": "module"`. The existing
  transpile tests move from asserting on bundle contents to asserting on these two files.
- Editing a fixture grammar entry and running `tree-sitter generate` without any other
  step reflects the edit.
- The Node-floor check refuses a version below 22.18 with its message. It is tested by
  injecting the version string, not by spawning an old Node.
- A fixture entry with an enum fails the type-check under `erasableSyntaxOnly`.

## Out of scope

- tree-sitter 0.27.0 (above).
- Evaluating in-process versus in a child process for conflict derivation. The child
  exists for tsx module isolation, which this change does not touch.
- Consumers that would run a published grammar package from inside `node_modules`,
  where Node will not strip types. No such consumer exists today.
