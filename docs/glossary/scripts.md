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
 * codegen-related reason — same class of problem `isManifestExcluded`
 * solves for `test-fixtures.json`, but this one is skipped at the walk
 * itself since it was never a real generated file to begin with.
 */
```

### `packages/codegen/src/scripts/generated-manifest.ts::gitVisiblePaths`

The repo-relative paths git tracks or would track: `git ls-files --cached --others --exclude-standard`. A generated file that codegen has just written is untracked until someone runs `git add`; counting only tracked files left it out of the manifest on the first `gen` and put it in on the second. Untracked-but-not-ignored files count, ignored ones never do. Whether a generated artifact belongs in the repository is git's fact, not something a filename pattern can be trusted to reproduce, so this raises instead of degrading when git cannot be consulted: a manifest built from a guess verifies clean locally and fails on a clean checkout.

### `packages/codegen/src/scripts/generated-manifest.ts::trackedPaths`

`gitVisiblePaths` for the repository root, read once and cached.

### `packages/codegen/src/scripts/generated-manifest.ts::isManifestExcluded`

```text
/**
 * Files that `generatedRootsFor` lists (so `emit-diff.ts` still reports
 * their regen drift) but that the manifest must NOT hash-track, for two
 * unrelated reasons.
 *
 * NOT IN THE REPOSITORY. A hash for a file a clean checkout does not have
 * can never verify. Codegen writes several such artifacts next to the
 * tracked ones — a seam census, a host-built parser library — and they are
 * ignored by `.gitignore`, so recording them made
 * `assertGeneratedManifestsClean` unsatisfiable anywhere but the machine
 * that produced them. Git is asked directly (`trackedPaths`) rather than
 * inferred from the path.
 *
 * COMMITTED ON ITS OWN CADENCE. `test-fixtures.json` is tracked, but lands
 * in its own `chore(validator): record validation run` commit rather than
 * bundled with the source change that produced it (standing discipline, not
 * hook-enforced). Tracking its hash would couple the two: every source
 * commit would fail verification until the fixtures commit followed.
 * `test-fixtures.left-out.json`, the render fixtures that regen left out by
 * kind, is written by the same pass and lands in the same commit, so it is
 * excluded for the same reason.
 *
 * Both keep the write side (manifest generation) and the read side
 * (verification) in agreement: no entry written, none expected.
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

### `packages/codegen/src/scripts/generated-manifest.ts::GenerationPair`

One generation as two digests: `source`, the source hash (`computeSourceHash`), and `outputs`, a digest over the path and content hash of every generated file the manifest lists. A pair says "these outputs came from this source". It is the unit the local manifest remembers and the unit verification asks about.

### `packages/codegen/src/scripts/generated-manifest.ts::KNOWN_PAIR_LIMIT`

How many known-good pairs a grammar's local manifest keeps: eight. A pair that is recorded again moves to the newest end; past the limit the oldest is dropped. A dropped pair costs nothing but a comparison with the trusted commits the next time the tree is in that state, and a regenerate if it equals neither.

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
/** Repo-relative binary path, e.g. `packages/rust/native/sittir-rust.darwin-arm64.node`. */
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

### `packages/codegen/src/scripts/generated-manifest.ts::codegenHashBySource`

```text
/**
 * Memoized hash of the GENERATION-side `packages/codegen/src/**` — the third
 * input to every generation. If codegen source changes (e.g., a bugfix in a
 * wrap emitter), the same per-grammar overrides should produce different
 * output, so the source hash needs to reflect this. Memoized per source
 * because it walks many files and never changes within a single run.
 *
 * Scoped to PRODUCER code: `validate/**` is excluded — validators CONSUME
 * generated output and never alter the emitted bytes, so hashing them forced
 * a full regen for every validator-only edit (the only validator-derived
 * artifact, `test-fixtures.json`, is manifest-untracked — see
 * `isManifestExcluded`). Everything else (compiler, emitters, run-codegen,
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

Records and verifies that a grammar's generated files came from its current source inputs.

Nothing about this is committed. Each grammar has a local manifest at `node_modules/.cache/sittir/generated-manifest/<grammar>.json` under the checkout (`manifestPath`): ignored by git, never inside a published package, and separate for every worktree. It holds a content hash per generated file as of the last generation recorded, and a bounded list of known-good pairs (`GenerationPair`, `KNOWN_PAIR_LIMIT`).

`writeManifestForGrammar` is called by `runCodegen` at the end of each successful regeneration and records the pair it produced. There is no separate command for writing it.

`assertGeneratedManifestsClean` is called by the validators' grammar loader before any work, and by the pre-commit hook over the index. `verifyManifestForGrammar` states the rule once.

What this does not do: say whether a commit's generated output is what its source generates. A commit can carry stale output past every local check (with `--no-verify`, or from a machine whose manifest was written by hand). The CI job that regenerates every grammar and compares the tree is the check for that, on pull requests and on the default branch, and it is why a commit that passed it can be trusted here.

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

Records the generation that just ran: hashes every generated file git tracks or would track, and adds the pair (current source hash, digest of those hashes) to the grammar's local manifest as its newest known-good pair. Native bindings (`*.node`) are ignored by git and so are not listed; their staleness is a separate local check against the crate's sources (`native-binary-freshness.ts`).

### `packages/codegen/src/scripts/generated-manifest.ts::recordGeneration`

Writes a grammar's local manifest with the given file hashes and the given pair as the newest known-good pair, keeping the earlier pairs up to `KNOWN_PAIR_LIMIT`. The file is written beside its destination and renamed into place, so two processes verifying at once (validators run in parallel) never leave a half-written manifest.

### `packages/codegen/src/scripts/generated-manifest.ts::manifestPath`

Where a grammar's local manifest lives: under the checkout's `node_modules/.cache`, never under the source's root. For an index snapshot those differ, and the manifest read is the checkout's, because an ignored file is not in the index.

### `packages/codegen/src/scripts/generated-manifest.ts::verifyManifestForGrammar`

Whether the grammar's generated files came from its current source inputs. The rule, stated here and nowhere else: the pair in the tree (its source hash and the digest of its generated files) is a known-good pair in the local manifest, or the tree's source inputs and generated roots equal one trusted commit (`differencesFromTrustedCommit`).

A tree found equal to a trusted commit has its pair recorded, so that a later hand edit is named file by file and a branch switch does not cost a comparison every time. Only a checkout records; a snapshot of the index never writes.

When neither holds, what is reported depends on what is known locally. With a manifest, the files are compared with the hashes it holds (`modified`, `missing`, `extra`) and `sourceChanged` says the source hash is not the one of the last recorded generation. With none, there is nothing to compare file by file, so `differs` lists the paths that differ from HEAD.

Host binaries are checked for staleness only in a checkout, and in that checkout, since binaries are never part of a commit.

### `packages/codegen/src/scripts/generated-manifest.ts::differencesFromTrustedCommit`

The source inputs and generated files that keep the tree from equalling a trusted commit; empty when it equals one. The trusted commits are HEAD and, while a merge is in progress, MERGE_HEAD (`trustedCommits`): each has passed, or will have to pass, the CI check that regenerates and compares. Source inputs and generated roots must equal the same commit. Source from one parent with output from the other is a combination no check has seen, and it does not pass. A commit being rebased or cherry-picked is deliberately not trusted: its source lands on a different base, which is a new combination and needs a regenerate.

The comparison is git's (`git diff --name-only --no-renames <commit>`, with `--cached` for an index snapshot, plus untracked files in a checkout; without `--no-renames` a source input renamed into a test directory would be reported only under its new path and go unseen), filtered to the paths that matter: the source inputs the source hash reads (`isCodegenSourceInput` and the grammar's entry and `package.json`) and the generated roots, less the files that land on their own cadence (`landsOnItsOwnCadence`). Editing a codegen test therefore never fails verification. When the tree equals neither commit, the paths returned are the differences from HEAD.

### `packages/codegen/src/scripts/generated-manifest.ts::isCodegenSourceInput`

Whether a repo-relative path is a codegen source that takes part in generation: a `.ts` file under `packages/codegen/src` that is not a declaration file, a test, or a validator. The source hash and the trusted-commit comparison both use it, so they cannot disagree about what a source input is.

### `packages/codegen/src/scripts/generated-manifest.ts::landsOnItsOwnCadence`

`test-fixtures.json` and `test-fixtures.left-out.json`: generated, tracked, and committed with a validation run instead of with the source change that produced them. They are left out of the file hashes and out of the trusted-commit comparison alike. `.sittir/bindings.json` is left out the same way: the bindings inventory writes it, not generation, and its own key against `bindings.scm` decides whether it is fresh (`readBindingFacts`).

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
 * historical drift across commits, the CI job that regenerates and compares is the mechanism.
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
 * any grammar's staged source inputs and generated artifacts are neither a pair a
 * local `gen` recorded nor equal to a trusted commit, so a source edit without its
 * regenerated output can't be committed. Fast: hash comparison only, no cargo.
 */
```

### `packages/codegen/src/scripts/generated-manifest.ts::ManifestSource`

Where a verification reads from: `root`, the directory holding the grammar packages; `visible`, the repo-relative paths git would track there; and `checkout`, the git checkout that git is asked about and whose local manifest is read. For the working tree the two directories are the same (`checkoutSource`). A snapshot of the index passes its scratch directory as `root` and the real checkout as `checkout`; that difference is also what turns off the host-binary check and the recording of pairs.

### `packages/codegen/src/scripts/generated-manifest.ts::checkoutSource`

A git checkout as a `ManifestSource`.

### `packages/codegen/src/scripts/generated-manifest.ts::worktreeSource`

The live checkout as a `ManifestSource`, computed once per process.

### `packages/codegen/src/scripts/index-snapshot.ts::withIndexSnapshot`

Materializes the files of the index under the given pathspecs into a scratch directory, runs the callback against it, and removes the directory when the callback settles. The index honours `GIT_INDEX_FILE`, so inside a pre-commit hook for `git commit -- <paths>` the snapshot is the temporary index that commit will record. Unstaged edits and untracked files are absent by construction.

### `packages/codegen/src/scripts/verify-manifests-cli.ts::module`

`--staged` verifies the index snapshot of every grammar package and the codegen sources, so the pre-commit hook rejects only what the commit would contain.
