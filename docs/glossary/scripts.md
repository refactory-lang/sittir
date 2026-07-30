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
 *   - `grammar.sittir.ts` (hand-edited adjuster) — never generated.
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

### `ranges` (`packages/codegen/src/scripts/emit-diff.ts:44`)

```text
/** New-file line ranges, e.g. "L120-207", "L410". Empty for collapsed/binary. */
```

### `collapsed` (`packages/codegen/src/scripts/emit-diff.ts:46`)

```text
/** parser/binary artifact — counts only, no line ranges (kept terse). */
```

### `source_hash` (`packages/codegen/src/scripts/generated-manifest.ts:130`)

```text
/**
	 * SHA256 of the source inputs that drove this generation —
	 * `packages/<grammar>/grammar.sittir.ts` (hand-edited adjuster) +
	 * `packages/<grammar>/package.json` (pins the upstream tree-sitter version).
	 * If either changes, source_hash changes; verifiers detect the mismatch
	 * and require a regen. This is the cross-layer synchronicity guarantee:
	 * the manifest doesn't just say "files match what was last written";
	 * it says "files match what was last written AND those writes were
	 * driven by the current source inputs."
	 */
```

### `host_files` (`packages/codegen/src/scripts/generated-manifest.ts:142`)

```text
/**
	 * Per-platform napi binaries (`*.node`), recorded as the
	 * {@link HOST_BINARY_SENTINEL} sentinel — NOT content-hashed. Binary
	 * bytes vary per rebuild (and per machine), so content hashes produced
	 * false MODIFIED positives on every locally rebuilt binary. Verification
	 * instead checks FRESHNESS on the current host: the binary must be newer
	 * than the crate's generated `src/**` + `templates/**` inputs (see
	 * `native-binary-freshness.ts`). Missing-locally is still tolerated
	 * (binaries are per-platform).
	 */
```

### `stale` (`packages/codegen/src/scripts/generated-manifest.ts:265`)

```text
/**
	 * Host binaries (`*.node`) present on this machine but OLDER than the
	 * crate's generated `src/**` + `templates/**` inputs — they would
	 * validate stale code (or segfault). Fix: rebuild the binary.
	 */
```

### `HostBinaryFreshness` (`packages/codegen/src/scripts/native-binary-freshness.ts:20`)

```text
/** Freshness report for one host binary. */
```

### `rel` (`packages/codegen/src/scripts/native-binary-freshness.ts:22`)

```text
/** Repo-relative binary path, e.g. `rust/crates/sittir-rust/sittir-rust.darwin-arm64.node`. */
```

### `newestInputMtimeMs` (`packages/codegen/src/scripts/native-binary-freshness.ts:25`)

```text
/** Newest mtime across the crate's `src/**` + `templates/**` inputs. */
```

### `newestInputRel` (`packages/codegen/src/scripts/native-binary-freshness.ts:27`)

```text
/** Repo-relative path of the newest input (diagnostic). */
```

### `stale` (`packages/codegen/src/scripts/native-binary-freshness.ts:29`)

```text
/** True when the binary is OLDER than at least one compiled-in input. */
```

### `EMITTER_ORDER` (`packages/codegen/src/scripts/emit-diff.ts:23`)

```text
/** Emitter buckets, in display order. */
```

### `HOST_BINARY_SENTINEL` (`packages/codegen/src/scripts/generated-manifest.ts:135`)

```text
/** Sentinel value for `host_files` entries — see {@link Manifest.host_files}. */
```

### `cachedCodegenHash` (`packages/codegen/src/scripts/generated-manifest.ts:142`)

```text
/**
 * Memoized hash of the GENERATION-side `packages/codegen/src/**` — the third
 * input to every generation. If codegen source changes (e.g., a bugfix in a
 * wrap emitter), the same per-grammar overrides should produce different
 * output, so the source_hash needs to reflect this. Memoized per process
 * because it walks many files and never changes within a single run.
 *
 * Scoped to PRODUCER code: `validate/**` is excluded — validators CONSUME
 * generated output and never alter the emitted bytes, so hashing them forced
 * a full regen for every validator-only edit (the only validator-derived
 * artifact, `test-fixtures.json`, is manifest-untracked — see
 * `isManifestUntracked`). Everything else (compiler, emitters, run-codegen,
 * scripts) stays in the hash: `scripts/` includes this manifest module
 * itself, whose format changes legitimately require a re-stamp.
 */
```

### `ALLOWLISTED_RENAMES` (`packages/codegen/src/scripts/reconcile-naming.ts:44`)

```text
/**
 * Intended §2 renames, accepted as count-gated improvements (not byte-identical
 * to legacy). Each entry pins the EXACT expected delta — kind, slot, projection,
 * AND both the legacy and recomputed values. A divergence is allowlisted only if
 * it matches an entry on all five fields, so a NEW mismatch on the same slot (a
 * different projection, or the same projection with different values) is still
 * UNEXPECTED and fails the gate. This keeps the "count-gated" promise: the
 * allowlist suppresses precisely the known rename, nothing adjacent.
 *
 * These are inferred UNNAMED slots with a GENUINELY single parse-kind that §2
 * projects to the kind name, where legacy hard-coded the generic `content`; the
 * kind name is the desired surface, and the PR-B cutover renames the field.
 *
 * NB: only TRULY single-kind slots belong here. `splat_pattern.content` looked
 * single-kind but holds `[identifier, "_"]` (a literal with no parseKind); its
 * `content` name is correct and is now produced by the projection's
 * `hasUnnamedValue` guard — NOT allowlisted.
 */
```

### `ALLOWLISTED_RENAMES` (`packages/codegen/src/scripts/reconcile-naming.ts`)

Each entry records a slot-name divergence between the legacy identity and the
recomputed projection that is EXPECTED and therefore must not fail the
reconciliation gate. Three clusters, one per root cause:

- `format_specifier.content` — the slot genuinely holds exactly one value, so
  the recomputed name resolves to the kind, `format_expression`.
- `_suite.block` — the opposite-direction correction (kind name → `content`).
  `_suite`'s values have storage kinds `{_simple_statements, block, _newline}`,
  all with `parseKind=block`. The storage-kind → storage-name derivation
  therefore sees MULTI-storage and yields `content`, while the legacy name was
  cross-wired to the parse name `block`. All five derived projections flip
  `block` → `content`.
- `match_block.match_arm` (rust) — the same multi-storage-kind pattern as
  `_suite`. The arm slot holds `{match_arm, last_match_arm}`, two distinct
  non-aliased storage kinds, so the derivation yields `content` while the
  legacy name was cross-wired to the kind name `match_arm`. Whether
  `last_match_arm` SHOULD be unified with `match_arm` so the slot reads
  `matchArms` is a separate open design question, not part of this allowlist.
