# `packages/codegen/src/scripts` — Function Glossary

Per-function reference for `packages/codegen/src/scripts/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `emitterFor` (`packages/codegen/src/scripts/emit-diff.ts:51`)

```text
/**
 * Map an output path to the emitter that produced it. File-level granularity:
 * one file == one emitter (render-module.ts and the rust render crate are the
 * two halves of the render emitter; lib.rs/index.* are the native bindings).
 */
```

### `isCollapsed` (`packages/codegen/src/scripts/emit-diff.ts:89`)

```text
/** parser/binary artifacts: counts only, line ranges suppressed (they churn). */
```

### `formatRange` (`packages/codegen/src/scripts/emit-diff.ts:95`)

```text
/** Compress a new-file hunk header `@@ -_ +start,count @@` into "L120-131". */
```

### `beginFileChange` (`packages/codegen/src/scripts/emit-diff.ts:106`)

```text
/** Build a fresh `FileChange` record for a newly-seen `diff --git` section. */
```

### `parseDiff` (`packages/codegen/src/scripts/emit-diff.ts:119`)

```text
/** Parse `git diff --unified=0` output into per-file change records. */
```

### `joinRanges` (`packages/codegen/src/scripts/emit-diff.ts:175`)

```text
/** At most `max` ranges, then a `+N more` tail, to keep one line per file. */
```

### `formatEmitDiff` (`packages/codegen/src/scripts/emit-diff.ts:182`)

```text
/**
 * Run the regen diff for a grammar and format it. Returns `null` when git is
 * unavailable or this is not a working tree (the report is a convenience, never
 * a hard dependency — a missing git must not fail codegen).
 */
```

### `generatedRootsFor` (`packages/codegen/src/scripts/generated-manifest.ts:57`)

```text
/**
 * Repo-relative roots holding the cross-platform generated content for a
 * grammar. Single source of truth: the manifest (`files` section) and the
 * post-regen emit-diff report (`emit-diff.ts`) both consume this, so they can
 * never disagree about what counts as "generated."
 *
 * Intentional exclusions vs cleanup-rules.md §A1:
 *   - `overrides.ts` (hand-edited adjuster) — never generated.
 *   - `overrides.suggested.ts` — written by the codegen CLI AFTER its
 *     internal validation runs (it embeds validator diagnostics). Including
 *     it would force the manifest to be written twice per codegen invocation,
 *     for no real safety gain (it is human-review output, not consumed at
 *     runtime). Hand-edits to it are overwritten on the next codegen run.
 */
```

### `isJunkFile` (`packages/codegen/src/scripts/generated-manifest.ts:107`)

```text
/**
 * OS/editor junk that can appear anywhere under a generated root (e.g.
 * Finder drops `.DS_Store` into any directory it has opened) but is never
 * part of codegen's own output. Tracking it would record a machine-local
 * path that's absent on a clean checkout, failing verification for no
 * codegen-related reason — same class of problem `isManifestUntracked`
 * solves for `test-fixtures.json`, but this one is skipped at the walk
 * itself since it was never a real generated file to begin with.
 */
```

### `isManifestUntracked` (`packages/codegen/src/scripts/generated-manifest.ts:137`)

```text
/**
 * Files that `generatedRootsFor` lists (so `emit-diff.ts` still reports their
 * regen drift) but that the manifest must NOT hash-track. Currently just
 * `test-fixtures.json`: it is derived output, regenerated on every run, and
 * lands in its own dedicated `chore(validator): record validation run`
 * commit rather than bundled with feature/source changes (standing
 * discipline, not hook-enforced). Tracking it would record a hash that can
 * never match the committed file, so `assertGeneratedManifestsClean` would
 * fail on a clean checkout. Excluding it here keeps the write side (manifest
 * generation) and the read side (verification) in agreement: no entry
 * written, none expected.
 */
```

### `assertGeneratedManifestsClean` (`packages/codegen/src/scripts/generated-manifest.ts:365`)

```text
/**
 * Throw a formatted error if any grammar's manifest verification fails.
 * Convenience for callers that just want a boolean gate.
 *
 * Missing manifest is treated as a HARD ERROR (was previously a warn-and-continue
 * "bootstrap mode" — that turned out to be a verification-bypass surface: any
 * caller that wanted to skip verification could just delete the manifest file
 * and proceed). The legitimate bootstrap path is "run codegen first":
 * `packages/codegen/src/cli.ts` runs with `SITTIR_INTERNAL_CODEGEN_RUN=1` set
 * (see below) so its OWN internal validators bypass verification, and codegen
 * writes the manifest at the end of its run. Once that happens, subsequent
 * external runs see a present manifest and verify normally.
 *
 * Codegen-internal bypass: when `SITTIR_INTERNAL_CODEGEN_RUN=1` is set, the
 * call returns silently. This env is set ONLY by `packages/codegen/src/cli.ts`
 * during its own internal validator runs (e.g. extractParityFixtures uses
 * validateReadRenderParse to extract parity fixtures BEFORE the manifest is
 * rewritten at codegen end). The codegen CLI is the writer of the manifest;
 * verifying mid-write would check the codegen process against its own
 * incomplete output. External callers (validator CLI, probe-validate, etc.)
 * do not set this env and therefore get full verification.
 */
```

### `hostBinaryFreshnessFor` (`packages/codegen/src/scripts/native-binary-freshness.ts:48`)

```text
/**
 * Report freshness for every `*.node` present in the grammar's crate dir.
 * Returns `[]` when the crate dir or binaries are absent (not built yet —
 * absence is tolerated; staleness is not).
 */
```

### `assertNativeBinaryFresh` (`packages/codegen/src/scripts/native-binary-freshness.ts:75`)

```text
/**
 * Throw when any present host binary is stale. No-op when no binary exists
 * (not built yet — callers fall back to their own "engine unavailable"
 * handling).
 */
```

### `isAllowlisted` (`packages/codegen/src/scripts/reconcile-naming.ts:117`)

```text
/** A divergence is allowlisted only if it matches an expected rename on ALL fields. */
```

### `diffSlotNames` (`packages/codegen/src/scripts/reconcile-naming.ts:129`)

```text
/**
 * Compare one slot's legacy projected names against the values the §2 PROJECTION
 * computes from `values` + `fieldName`. Returns one Divergence per mismatched
 * projection (empty array = fully consistent).
 *
 * `parseNames` is deliberately NOT an axis here. Unlike storageName/name/etc.
 * (which compare against the slot's REAL legacy stored fields), there is no
 * stored legacy `parseNames` to compare against — only `parseNamesNew` (which IS
 * this projection). The only "legacy" stand-in would be `kindsOf`, a
 * reconstruction that returns un-normalized SOURCE names (`_X`) the real reader
 * never used (it resolves `alias($._X, $.X)` → `X` at runtime). The projection's
 * `parseNames` is the alias target `X` — what tree-sitter actually emits — and
 * it's validated where it counts: the read-render-parse / AST-match metrics in
 * `validate:native` (tree-sitter ground truth), not by diffing against invented
 * legacy code.
 */
```
