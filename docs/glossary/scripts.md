# `packages/codegen/src/scripts` — Function Glossary

Per-function reference for `packages/codegen/src/scripts/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/scripts/emit-diff.ts::emitterFor`

```text
/**
 * Map an output path to the emitter that produced it. File-level granularity:
 * one file == one emitter (render-module.ts and the rust render crate are the
 * two halves of the render emitter; lib.rs/index.* are the native bindings).
 */
```

```text
// lib.rs, index.{js,d.ts}, *.node
```

#### body

```text
// backend / boundary / engine / hash / ir / is / index / utils, etc.
```

### `packages/codegen/src/scripts/emit-diff.ts::isCollapsed`

```text
/** parser/binary artifacts: counts only, line ranges suppressed (they churn). */
```

### `packages/codegen/src/scripts/emit-diff.ts::formatRange`

```text
/** Compress a new-file hunk header `@@ -_ +start,count @@` into "L120-131". */
```

```text
// pure deletion: anchor at the deletion point
```

### `packages/codegen/src/scripts/emit-diff.ts::beginFileChange`

```text
/** Build a fresh `FileChange` record for a newly-seen `diff --git` section. */
```

### `packages/codegen/src/scripts/emit-diff.ts::parseDiff`

```text
/** Parse `git diff --unified=0` output into per-file change records. */
```

#### body

```text
// New file section. The authoritative path comes from the +++/---
// lines below; seed from `b/<path>` here so deletions (which have
// `+++ /dev/null`) still attribute to the removed file.
// `cur` is reassigned directly here (not via a closure over `cur`,
// which — confirmed in isolation — breaks the `if (!cur) continue`
// narrowing below back to `never`) so `beginFileChange` stays a pure
// factory function.
```

#### body

```text
// Deletion: +++ is /dev/null, so keep the old path as the identity.
```

#### body

```text
// Content lines (no context, since --unified=0).
```

### `packages/codegen/src/scripts/emit-diff.ts::joinRanges`

```text
/** At most `max` ranges, then a `+N more` tail, to keep one line per file. */
```

### `packages/codegen/src/scripts/emit-diff.ts::formatEmitDiff`

```text
/**
 * Run the regen diff for a grammar and format it. Returns `null` when git is
 * unavailable or this is not a working tree (the report is a convenience, never
 * a hard dependency — a missing git must not fail codegen).
 */
```

```text
// not a git repo / git absent / no HEAD — skip silently
```

#### body

```text
// Align the file column across all rows for scannability.
```

### `packages/codegen/src/scripts/generated-manifest.ts::generatedRootsFor`

```text
/**
 * Repo-relative roots holding the cross-platform generated content for a
 * grammar. Single source of truth: the manifest (`files` section) and the
 * post-regen emit-diff report (`emit-diff.ts`) both consume this, so they can
 * never disagree about what counts as "generated."
 *
 * Intentional exclusions vs cleanup-rules.md §A1:
 *   - `grammar.sittir.ts` (hand-edited adjuster) — never generated.
 */
```

### `packages/codegen/src/scripts/generated-manifest.ts::isJunkFile`

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

### `packages/codegen/src/scripts/generated-manifest.ts::isManifestUntracked`

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

### `packages/codegen/src/scripts/generated-manifest.ts::assertGeneratedManifestsClean`

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

### `packages/codegen/src/scripts/native-binary-freshness.ts::hostBinaryFreshnessFor`

```text
/**
 * Report freshness for every `*.node` present in the grammar's crate dir.
 * Returns `[]` when the crate dir or binaries are absent (not built yet —
 * absence is tolerated; staleness is not).
 */
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::assertNativeBinaryFresh`

```text
/**
 * Throw when any present host binary is stale. No-op when no binary exists
 * (not built yet — callers fall back to their own "engine unavailable"
 * handling).
 */
```

### `packages/codegen/src/scripts/reconcile-naming.ts::isAllowlisted`

```text
/** A divergence is allowlisted only if it matches an expected rename on ALL fields. */
```

### `packages/codegen/src/scripts/reconcile-naming.ts::diffSlotNames`

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

### `packages/codegen/src/scripts/emit-diff.ts::ranges`

```text
/** New-file line ranges, e.g. "L120-207", "L410". Empty for collapsed/binary. */
```

### `packages/codegen/src/scripts/emit-diff.ts::collapsed`

```text
/** parser/binary artifact — counts only, no line ranges (kept terse). */
```

### `packages/codegen/src/scripts/generated-manifest.ts::source_hash`

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

### `packages/codegen/src/scripts/generated-manifest.ts::host_files`

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

### `packages/codegen/src/scripts/generated-manifest.ts::stale`

```text
/**
	 * Host binaries (`*.node`) present on this machine but OLDER than the
	 * crate's generated `src/**` + `templates/**` inputs — they would
	 * validate stale code (or segfault). Fix: rebuild the binary.
	 */
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::HostBinaryFreshness`

```text
/** Freshness report for one host binary. */
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::rel`

```text
/** Repo-relative binary path, e.g. `rust/crates/sittir-rust/sittir-rust.darwin-arm64.node`. */
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::newestInputMtimeMs`

```text
/** Newest mtime across the crate's `src/**` + `templates/**` inputs. */
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::newestInputRel`

```text
/** Repo-relative path of the newest input (diagnostic). */
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::stale`

```text
/** True when the binary is OLDER than at least one compiled-in input. */
```

### `packages/codegen/src/scripts/emit-diff.ts::EMITTER_ORDER`

```text
/** Emitter buckets, in display order. */
```

### `packages/codegen/src/scripts/generated-manifest.ts::HOST_BINARY_SENTINEL`

```text
/** Sentinel value for `host_files` entries — see {@link Manifest.host_files}. */
```

### `packages/codegen/src/scripts/generated-manifest.ts::cachedCodegenHash`

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

### `packages/codegen/src/scripts/reconcile-naming.ts::ALLOWLISTED_RENAMES`

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

### `packages/codegen/src/scripts/reconcile-naming.ts::ALLOWLISTED_RENAMES`

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

### `packages/codegen/src/scripts/generated-manifest.ts::module`

```text
/**
 * generated-manifest — module that writes/verifies per-grammar SHA256
 * manifests for every generated file.
 *
 * Manifest lives at `packages/<grammar>/.sittir/generated.manifest.json`.
 *
 * ## Lifecycle
 *
 * - `writeManifestForGrammar(grammar)` is called by `packages/codegen/src/cli.ts`
 *   at the end of each successful per-grammar regen. There is intentionally no
 *   separate CLI for writing — the manifest must always be in lockstep with the
 *   codegen output it describes.
 * - `assertGeneratedManifestsClean()` is called by the validator
 *   (`packages/tools/src/validate/common.ts`) at startup, before any
 *   counts/probe-factory work. Verification failure aborts the validator;
 *   the only legitimate way to update a manifest is to re-run codegen.
 *
 * The manifest excludes itself (would otherwise be a chicken-and-egg).
 *
 * ## Tracked in git
 *
 * The manifest file is force-added to git despite `packages/*\/.sittir/`
 * being gitignored — same pattern as `grammar.js`, `package.json`,
 * `tree-sitter.json` inside the same directory. Tracking the manifest is
 * what makes cross-commit drift detectable: if a commit changes a generated
 * file without re-running codegen, the committed file hash diverges from
 * the committed manifest entry and `verifyManifestForGrammar` flags it.
 *
 * ## Limits
 *
 * The manifest catches honest-mistake hand-edits AND cross-commit drift
 * (since the manifest is itself committed). It does NOT catch a coordinated
 * commit that updates both the file and its manifest entry but ships an
 * INTERNALLY inconsistent codegen output (e.g., wrap.ts and templates that
 * disagree on slot optionality). That class of bug requires a CI gate that
 * re-runs codegen and diffs the on-disk content.
 */
```

### `packages/codegen/src/scripts/generated-manifest.ts::hostFilesFor`

#### body

```text
// Platform-specific build artifacts (napi-emitted compiled binaries).
// Tracked in the `host_files` section: hashed and verified, but
// missing-locally is tolerated because different developers / CI runners
// produce different per-platform binaries (`*.darwin-arm64.node`,
// `*.linux-x64.node`, etc.). The manifest will accumulate every binary
// every developer commits; verification only enforces matches for the
// binaries that exist on the current host.
```

### `packages/codegen/src/scripts/generated-manifest.ts::codegenSourceHash`

#### body

```text
// Consumer-side validators don't affect generated output.
```

### `packages/codegen/src/scripts/generated-manifest.ts::computeSourceHash`

#### body

```text
// 2. Codegen source — same per-grammar inputs against a different codegen
// produce different output, so codegen state IS part of the source.
```

### `packages/codegen/src/scripts/generated-manifest.ts::writeManifestForGrammar`

#### body

```text
// Preserve previously-recorded host_files entries from other platforms,
// then overwrite/add this host's binaries. This way commits from a
// darwin-arm64 dev don't wipe a linux-x64 binary previously committed
// by another dev. Entries carry the freshness sentinel, not a content
// hash — see the Manifest.host_files docs.
```

### `packages/codegen/src/scripts/generated-manifest.ts::verifyManifestForGrammar`

#### body

```text
// Source-hash cross-layer synchronicity check: did the source inputs
// (grammar.sittir.ts + package.json) change since this manifest was written?
// If yes, the generated content is stale relative to current inputs and
// the user needs to re-run codegen.
```

#### body

```text
// Platform-specific `host_files`: FRESHNESS check, not content hashes
// (see Manifest.host_files docs). Missing binaries are silently
// tolerated (per-platform); present-but-stale binaries fail — they
// would validate stale code. Checks ALL binaries on this host, not just
// manifest-listed ones, so a never-committed local build is gated too.
```

### `packages/codegen/src/scripts/native-binary-freshness.ts::module`

```text
/**
 * Freshness predicate for grammar-owned napi binaries (`*.node`).
 *
 * Askama bakes the per-kind `.jinja` templates into the binary at compile
 * time, and the transport/dispatch code is compiled from the generated
 * `src/render/*.rs` — so a `.node` older than ANY of those inputs renders
 * with stale templates or stale transport logic. Historically this failed
 * SILENTLY (validators ran against the stale engine; in the worst case the
 * stale binary segfaulted mid-gate). Every native consumer should assert
 * freshness before loading the engine.
 *
 * Shared leaf module: consumed by `generated-manifest.ts` (manifest
 * verification of host binaries) and `validate/common.ts`
 * (`loadNativeEngineForGrammar`). Keep it dependency-free so neither
 * consumer picks up import cycles.
 */
```

### `packages/codegen/src/scripts/reconcile-naming.ts::module`

```text
/**
 * reconcile-naming — PR-A WIDE divergence probe.
 *
 * For every AssembledNonterminal in each grammar's NodeMap, assert each legacy
 * projected slot name equals the value the §2 PROJECTION computes from the slot's
 * `values` + `fieldName` (`projectSlotNaming`): storageName, name, configKey,
 * propertyName, paramName. The probe drives `collect-slots` until 0 — proving
 * PR-B's getter swap is byte-identical.
 *
 * Projections, not stored `_new` fields: `parseNames` is the live set of CST
 * kinds tree-sitter emits (per-value `parseKind.name`), so it can't go stale
 * across `mergeSlotsByName`'s value-union (the old stored `parseNamesNew` did).
 * No emitter reads the projection yet — this is the acceptance probe.
 *
 * ## Usage
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts            # all grammars
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts --grammar rust
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts --first 20 # first-N per grammar
 */
```

### `packages/codegen/src/scripts/reconcile-naming.ts::Divergence.slot`

```text
// the legacy slot.name (its current identity)
```

### `packages/codegen/src/scripts/reconcile-naming.ts::run`

#### body

```text
// Phase passes log via console.log/warn — route to stderr so stdout stays clean.
```

#### body

```text
// Non-zero exit only when an UNEXPECTED divergence remains (allowlisted §2
// renames are accepted) — lets CI/the gate fail on genuine regressions.
```

### `packages/codegen/src/scripts/reconcile-naming.ts::_isMain`

```text
// `process.argv[1]` is a filesystem path; convert it to a normalized file:// URL
// (handles absolute paths / escaping) rather than string-interpolating, so the
// `npx tsx reconcile-naming.ts` invocation is detected reliably.
```

### `packages/codegen/src/scripts/regen-templates-rs.ts::module`

```text
/**
 * regen-templates-rs — regenerate only templates.rs for one or more grammars.
 *
 * Usage:
 *   npx tsx packages/codegen/src/scripts/regen-templates-rs.ts --grammar rust
 *   npx tsx packages/codegen/src/scripts/regen-templates-rs.ts --grammar rust,typescript,python
 *
 * This bypasses the full generate() pipeline (which calls all emitters
 * including factories.ts / wrap.ts). Use when you only need templates.rs
 * regenerated without touching TS output files.
 */
```

### `packages/codegen/src/scripts/emit-diff.ts::module`

```text
/**
 * emit-diff — post-regen report of what the current codegen run changed in the
 * generated output, grouped by emitter.
 *
 * Called by `packages/codegen/src/cli.ts` at the end of a `--all` run (unless
 * `--no-emit-diff`). It diffs the **working tree vs HEAD** over the same roots
 * the manifest tracks (`generatedRootsFor`), so the report and the manifest
 * never disagree about what counts as generated.
 *
 * Baseline rationale: working-tree-vs-HEAD answers "what did THIS regen
 * produce relative to the last commit" — the question you actually have while
 * iterating on codegen. It is intentionally not a commit-range diff; for
 * historical drift across commits, the committed manifest is the mechanism.
 *
 * Grouping is by emitter, derived purely from the output file path (each
 * emitter owns one file, per the emitter-pattern-consistency convention), so
 * no provenance instrumentation is needed inside the emitters themselves.
 */
```

### `packages/codegen/src/scripts/emit-diff.ts::FileChange.path`

```text
// repo-relative
```

### `packages/codegen/src/scripts/verify-manifests-cli.ts::module`

```text
/**
 * Standalone manifest-verification CLI — used by the git pre-commit hook.
 * Exits non-zero (with the formatted MODIFIED/MISSING/SOURCE-CHANGED report) when
 * any grammar's generated artifacts no longer match its committed manifest, so an
 * inconsistent generated state (e.g. a staged manifest without its regenerated
 * test-fixtures.json) can't be committed. Fast: hash comparison only, no cargo.
 */
```
