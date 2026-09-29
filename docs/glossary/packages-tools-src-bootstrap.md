# `packages/tools/src/bootstrap/` glossary

Scaffolding for a new grammar package: `sittir tool bootstrap-grammar`.

---

### `packages/tools/src/bootstrap/grammar.ts::REGISTRATIONS`

The files outside a grammar's own package that name every grammar, each with
the edit that adds one:

- the root `tsconfig.json` references each grammar's build config;
- `@sittir/tools` depends on each grammar package, because `LanguageApis`
  type-imports every grammar's API. Without the dependency, the package
  build (`tsc -p tsconfig.build.json`, no path mapping) cannot resolve the
  import, and `pnpm -r run build` does not order the grammar before tools;
- `LanguageApis` in `tools/src/languages.ts` maps each grammar name to its
  `languageApiName`.

A file that has to name every grammar belongs in this list. The
`bootstrap-registrations` test holds every grammar on disk at a fixpoint: a
grammar missing from any of these files fails there, not first in CI's build.

### `packages/tools/src/bootstrap/grammar.ts::plannedRegistrations`

The `REGISTRATIONS` edits one grammar still needs, as files relative to the
repo root. A file that already names the grammar is left out, so an existing
grammar plans nothing. Bootstrap writes them with the package templates;
`--dry-run` lists them without writing.

### `packages/tools/src/bootstrap/grammar.ts::addTsconfigReference`

Inserts `./packages/<name>/tsconfig.build.json` into the root `references`,
immediately before the `packages/tools` reference, so every grammar builds
before the packages that import them. It throws if that anchor is missing.

### `packages/tools/src/bootstrap/grammar.ts::addWorkspaceDependency`

Adds `"@sittir/<name>": "workspace:*"` to a manifest's `dependencies`. The
entries are kept sorted, as pnpm writes them, so the edit changes one line.

### `packages/tools/src/bootstrap/grammar.ts::addLanguageApi`

Adds the grammar's `import type { <Prefix>API } from '@sittir/<name>'` and
its `readonly <name>: <Prefix>API;` member to `LanguageApis`. Both blocks are
kept sorted and deduplicated, so the edit is a no-op for a grammar already
there. It throws if the file has no single-name grammar API imports or no
`LanguageApis` interface to extend.
