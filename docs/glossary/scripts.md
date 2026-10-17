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

### `packages/codegen/src/scripts/napi-typedefs.ts::removeNapiTypedefs`

Removes the napi typedef directories of one grammar under a cargo target directory (`napi-rs/sittir-<grammar>-<hash>`). napi-derive appends each exported type's typedef to a file in that directory and never clears it, so a type that stops being napi-exported stays in the directory and is merged into every later `index.d.ts`; a build from a clean checkout has no such leftovers. The grammar's directories are matched by name, so another grammar's directories are untouched.

### `packages/codegen/src/scripts/napi-typedefs.ts::clearNapiTypedefs`

`removeNapiTypedefs` for the repository's cargo target directory (from `cargo metadata`, read once per working directory). Codegen calls it before each grammar's native build so the typings that build writes match a clean build's.

### `packages/codegen/src/scripts/native-binary-freshness.ts::hostBinaryFreshnessFor`

Reports whether the grammar's host binary (`hostBinaryName`, the one this machine's loader selects) is the binary the last build wrote from the current native inputs. Binaries for other targets in the same directory are not judged: the host never loads them, and each carries its own stamp. The binary is stale when it has no build stamp, when its SHA-256 differs from the stamp's (a binary some other build wrote is not this build's), or when any native input's content differs from the build's (`nativeInputs`); `reason` says which, naming the first changed input by path. Returns `[]` when no host binary is present: absence is tolerated, staleness is not.

Only what the binary was compiled from is judged here. The profile, the toolchain and the build configuration are not: validation runs a binary built under any of them, including one built on a CI runner and shipped with its stamp to a checkout that has no rust toolchain at all. `nativeBuildFreshness` adds those checks for a regeneration.

### `packages/codegen/src/scripts/native-binary-freshness.ts::assertNativeBinaryFresh`

Throws when any present binary is stale, with each one's reason. No-op when no binary exists (not built yet — callers fall back to their own "engine unavailable" handling).

### `packages/codegen/src/scripts/native-binary-freshness.ts::nativeInputs`

Every file a grammar's native build compiles from, by repo-relative path, with its SHA-256: the workspace `Cargo.toml`, `Cargo.lock` and `rust-toolchain.toml`; the `Cargo.toml`, `build.rs`, `src/` and `templates/` of sittir-core, sittir-transport-macros and the grammar's crate; the grammar's generated parser (`.sittir/src`), which the crate's `build.rs` compiles; and every file its scanners include, however far outside `.sittir/src` (`quotedIncludeClosure`; TypeScript's scanner includes the shared `packages/typescript/common/scanner.h`). A file added or removed changes the map as an edit does.

### `packages/codegen/src/scripts/native-binary-freshness.ts::quotedIncludeClosure`

Adds `file` and, transitively, every existing file it names in a line starting `#include "…"`, resolved against the including file's directory. It is the rule the generated crate's `build.rs` uses to tell cargo what to rebuild on, so the stamp sees every header the build does. System includes (`<…>`) are not followed.

### `packages/codegen/src/scripts/native-binary-freshness.ts::writeNativeBuildStamp`

Records the build that just wrote `binary`: its profile, the binary's SHA-256, the toolchain (`rustc -vV` unless `setting.toolchain` names one), the build configuration (`nativeBuildConfig` of `setting.env`, defaulting to the process environment) and `nativeInputs`, in `node_modules/.cache/sittir/native-build/<grammar>/<binary>.json` under the checkout. One stamp per binary, so building one target never invalidates another target's binary. `scripts/build-native.mts` calls it after every successful build with the environment the build ran under, so every native build that goes through the crate scripts, codegen or CI is recorded. CI ships the stamp directory in the native artifact alongside the binaries. The file is written beside its destination and renamed into place.

### `packages/codegen/src/scripts/native-binary-freshness.ts::nativeBuildFreshness`

Whether the grammar's host binary is the one a build under `profile` would write now, and if not, why: no binary; a stale one (`hostBinaryFreshnessFor`'s reason); a different rust toolchain; a changed build configuration (`nativeBuildConfig`, naming the first changed variable or cargo config file); or a binary built under another profile. `setting` supplies the current toolchain and environment, defaulting to `rustc -vV` and the process environment. `regen:all` skips a grammar's native build only when this holds for the `gate` profile, so a binary built for release is not taken for a gate one, nor the reverse, and a binary built under other flags is rebuilt.

### `packages/codegen/src/scripts/native-binary-freshness.ts::NativeProfile`

The cargo profile a binary was built under: `release` (fat LTO; CI and publishing), `gate` (optimized without LTO; local generation and validation) or `dev` (debug).

### `packages/codegen/src/scripts/native-binary-freshness.ts::NativeBuildStamp`

The record of one native build (`writeNativeBuildStamp`): profile, binary SHA-256, toolchain, build configuration and native inputs.

### `packages/codegen/src/scripts/native-binary-freshness.ts::BuildSetting`

The toolchain and environment a build runs under. Omitted fields are read from the machine (`rustc -vV`, the process environment); tests pass them to stay independent of the host.

### `packages/codegen/src/scripts/native-binary-freshness.ts::hostBinaryName`

The file name of the grammar's binary for the platform this process runs on (`<binary>.<platform suffix>.node`, via `@sittir/common/engine`'s `platformSuffix(hostPlatform())`): the binary the grammar package's loader selects.

### `packages/codegen/src/scripts/native-binary-freshness.ts::nativeBuildConfig`

The build configuration that changes what cargo and the C compiler produce without changing any input file. From `env` (`BUILD_ENV`): the rust compiler and its wrappers (`RUSTC`, `RUSTC_WRAPPER`, `RUSTC_WORKSPACE_WRAPPER`), rust flags (`RUSTFLAGS`, `CARGO_ENCODED_RUSTFLAGS`), cargo's build, profile and per-target settings (`CARGO_BUILD_*`, `CARGO_PROFILE_*`, `CARGO_TARGET_*`), and the C toolchain the `cc` crate reads for the parser and scanner (`CC`, `CXX`, `AR` and their flags, plain, per target or with a `HOST_`/`TARGET_` prefix; `CRATE_CC_NO_DEFAULTS`; `SDKROOT`, `MACOSX_DEPLOYMENT_TARGET`). Where cargo puts its output (`CARGO_TARGET_DIR`, `CARGO_BUILD_TARGET_DIR`) is not configuration of the binary and is left out. Then the SHA-256 of every cargo configuration file cargo would read for the grammar's crate (`cargoConfigFiles`), keyed by its path relative to the checkout. A variable or file added or removed changes the map as an edit does.

### `packages/codegen/src/scripts/native-binary-freshness.ts::cargoConfigFiles`

The cargo configuration files a build of the grammar's crate reads, in cargo's discovery order: `.cargo/config.toml` or `.cargo/config` in the crate's directory and each directory above it up to the filesystem root, then in the cargo home (`CARGO_HOME`, by default `~/.cargo`). Only the files that exist.

### `packages/codegen/src/scripts/native-binary-freshness.ts::nativeBuildStamp`

Reads the stamp recorded for `binary` (the host binary by default), or undefined when the binary was never stamped.

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

One generation as digests: `source`, the source hash (`computeSourceHash`); `outputs`, a digest over the path and content hash of every generated file the manifest lists; and `upstream`, the installed upstream grammar (`upstreamDigest`). The source hash includes the upstream digest; it is also kept apart because git cannot see an installed package, so the trusted-commit path compares it with the newest recorded generation's (`verifyManifestForGrammar`). Generations recorded before it existed have none. A pair says "these outputs came from this source". It is the unit the local manifest remembers and the unit verification asks about.

### `packages/codegen/src/scripts/generated-manifest.ts::KNOWN_PAIR_LIMIT`

How many known-good pairs a grammar's local manifest keeps: eight. A pair that is recorded again moves to the newest end; past the limit the oldest is dropped. A dropped pair costs nothing but a comparison with the trusted commits the next time the tree is in that state, and a regenerate if it equals neither.

### `packages/codegen/src/scripts/generated-manifest.ts::stale`

Host binaries (`*.node`) present on this machine that are not what a build from the current native inputs wrote (`hostBinaryFreshnessFor`), each with its reason. They would validate stale code (or segfault). Fix: rebuild the binary.

### `packages/codegen/src/scripts/native-binary-freshness.ts::HostBinaryFreshness`

Freshness report for one binary.

### `packages/codegen/src/scripts/native-binary-freshness.ts::rel`

Repo-relative binary path, e.g. `packages/rust/native/sittir-rust.darwin-arm64.node`.

### `packages/codegen/src/scripts/native-binary-freshness.ts::binaryMtimeMs`

The binary's mtime. Validation's engine cache compares it to notice a binary rebuilt after the process loaded it, which a napi module cannot reload.

### `packages/codegen/src/scripts/native-binary-freshness.ts::stale`

True when the binary is not what a build from the current native inputs wrote.

### `packages/codegen/src/scripts/native-binary-freshness.ts::reason`

Why the binary is stale, or that it was built from the current native inputs.

### `packages/codegen/src/scripts/native-binary-freshness.ts::profile`

The profile of the build that wrote this binary, when the build stamp names it.

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
 * kind name is the desired surface, which renaming the field gives.
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

The codegen side of a grammar's source hash: every codegen source input (`codegenSourceFiles`), then every other file that generation executes (`runtimeClosure`), each by path and content. Generation runs `@sittir/common` helpers whose results land in generated files (factories embed host templates computed by the reparse helpers, for example), so an edit there changes what generation writes as surely as an edit to codegen does.

#### body

```text
// Consumer-side validators don't affect generated output.
```

### `packages/codegen/src/scripts/generated-manifest.ts::computeSourceHash`

A grammar's source hash: its own inputs (`grammarSourceInputs`), the codegen source and the shared runtime it executes (`codegenSourceHash`), and the installed upstream grammar (`upstreamDigest`).

#### body

```text
// 2. Codegen source — same per-grammar inputs against a different codegen
// produce different output, so codegen state IS part of the source.
```

### `packages/codegen/src/scripts/generated-manifest.ts::writeManifestForGrammar`

Records the generation that just ran: hashes every generated file git tracks or would track, and adds the pair (current source hash, digest of those hashes, upstream digest) to the grammar's local manifest as its newest known-good pair. Native bindings (`*.node`) are ignored by git and so are not listed; their freshness is a separate local check against their build's stamp (`native-binary-freshness.ts`).

### `packages/codegen/src/scripts/generated-manifest.ts::recordGeneration`

Writes a grammar's local manifest with the given file hashes and the given pair as the newest known-good pair, keeping the earlier pairs up to `KNOWN_PAIR_LIMIT`. The file is written beside its destination and renamed into place, so two processes verifying at once (validators run in parallel) never leave a half-written manifest.

### `packages/codegen/src/scripts/generated-manifest.ts::manifestPath`

Where a grammar's local manifest lives: under the checkout's `node_modules/.cache`, never under the source's root. For an index snapshot those differ, and the manifest read is the checkout's, because an ignored file is not in the index.

### `packages/codegen/src/scripts/generated-manifest.ts::verifyManifestForGrammar`

Whether the grammar's generated files came from its current source inputs. The rule, stated here and nowhere else: the pair in the tree (its source hash and the digest of its generated files) is a known-good pair in the local manifest, or the tree's source inputs and generated roots equal one trusted commit (`differencesFromTrustedCommit`).

A tree equal to a trusted commit is trusted only while its installed upstream (`upstreamDigest`) equals the newest recorded generation's: `node_modules` is invisible to git, so an upstream that moved under an unchanged tree would otherwise pass. With no generation on record there is nothing to compare, and the committed tree is trusted as before.

A tree found equal to a trusted commit has its pair recorded, so that a later hand edit is named file by file and a branch switch does not cost a comparison every time. Only a checkout records; a snapshot of the index never writes.

When neither holds, what is reported depends on what is known locally. With a manifest, the files are compared with the hashes it holds (`modified`, `missing`, `extra`) and `sourceChanged` says the source hash is not the one of the last recorded generation. With none, there is nothing to compare file by file, so `differs` lists the paths that differ from HEAD.

Host binaries are checked for staleness only in a checkout, and in that checkout, since binaries are never part of a commit. The upstream is likewise read from the checkout's installed packages, since an index snapshot has none.

### `packages/codegen/src/scripts/generated-manifest.ts::differencesFromTrustedCommit`

The source inputs and generated files that keep the tree from equalling a trusted commit; empty when it equals one. The trusted commits are HEAD and, while a merge is in progress, MERGE_HEAD (`trustedCommits`): each has passed, or will have to pass, the CI check that regenerates and compares. Source inputs and generated roots must equal the same commit. Source from one parent with output from the other is a combination no check has seen, and it does not pass. A commit being rebased or cherry-picked is deliberately not trusted: its source lands on a different base, which is a new combination and needs a regenerate.

The comparison is git's (`git diff --name-only --no-renames <commit>`, with `--cached` for an index snapshot, plus untracked files in a checkout; without `--no-renames` a source input renamed into a test directory would be reported only under its new path and go unseen), filtered to the paths that matter: the source inputs the source hash reads (`isCodegenSourceInput`, `grammarSourceInputs` and the rest of what generation executes, `runtimeClosure`, whose files are also the pathspecs it compares in place of a whole directory), `pnpm-lock.yaml` (git's record of the installed upstream, which the hash reads from `node_modules`), any vocabulary source for a grammar with bindings (`isVocabularyInput`, compared by its directory, so a deleted vocabulary file is a difference although the hash no longer lists it), and the generated roots, less the files that land on their own cadence (`landsOnItsOwnCadence`). Editing a codegen test therefore never fails verification. When the tree equals neither commit, the paths returned are the differences from HEAD.

### `packages/codegen/src/scripts/generated-manifest.ts::isCodegenSourceInput`

Whether a repo-relative path is a codegen source that takes part in generation: a `.ts` file under `packages/codegen/src` that is not a declaration file, a test, or a validator. The source hash and the trusted-commit comparison both use it, so they cannot disagree about what a source input is.

### `packages/codegen/src/scripts/generated-manifest.ts::landsOnItsOwnCadence`

`test-fixtures.json` and `test-fixtures.left-out.json`: generated, tracked, and committed with a validation run instead of with the source change that produced them. They are left out of the file hashes and out of the trusted-commit comparison alike.

### `packages/codegen/src/scripts/native-binary-freshness.ts::module`

Freshness of grammar-owned napi binaries (`*.node`). A binary compiles in the grammar crate's generated sources, the grammar's generated parser, sittir-core and the transport macros, under the workspace's `Cargo.toml`, `Cargo.lock` and toolchain; a binary built from any other version of them renders stale code, or segfaults mid-gate. Freshness is content, not time: the binary and its inputs must equal the stamp the build that wrote it recorded (`writeNativeBuildStamp`). The stamp also records the profile, the toolchain and the build configuration. Validation accepts any of them (`hostBinaryFreshnessFor`), so a binary built elsewhere validates wherever its stamp travels with it; a regeneration accepts only what it would build now (`nativeBuildFreshness`).

Shared leaf module, consumed by `generated-manifest.ts` (manifest verification), `validate/common.ts` (`loadNativeEngine`), `tools/src/regen.ts` (the regeneration skip) and `scripts/build-native.mts` (the stamp). It imports only `grammars.ts` and `@sittir/common/engine` (for the host platform suffix), so no consumer picks up an import cycle.

### `packages/codegen/src/scripts/reconcile-naming.ts::module`

```text
/**
 * reconcile-naming — WIDE slot-naming divergence probe.
 *
 * For every AssembledNonterminal in each grammar's NodeMap, assert each legacy
 * projected slot name equals the value the §2 PROJECTION computes from the slot's
 * `values` + `fieldName` (`projectSlotNaming`): storageName, name, configKey,
 * propertyName, paramName. The probe drives `collect-slots` until 0 — proving
 * a swap to the projection's getters is byte-identical.
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

`--staged` verifies the index snapshot of `stagedInputPathspecs`, so the pre-commit hook rejects only what the commit would contain.

### `packages/codegen/src/scripts/generated-manifest.ts::grammarSourceInputs`

The per-grammar files a generation depends on besides the codegen source and the upstream: `grammar.sittir.ts`, `base.ts` (which loads the upstream grammar), `package.json` and the `bindings.scm` path, whether or not the file exists, so deleting it is a difference to the trusted commit; and for a grammar that ships a `bindings.scm`, `bootstrap.json` and every source of the vocabulary (`bindings/vocabulary.ts::vocabularySources`), since `node-model-portable.json5` is read from `bindings.scm` through the pinned reader and its routes against the vocabulary. A grammar with no `bindings.scm` depends on neither the pin nor the vocabulary, so changing them leaves that grammar fresh. A tree with no vocabulary directory hashes none, as an absent input is not hashed.

### `packages/codegen/src/scripts/generated-manifest.ts::VOCABULARY_SOURCE_DIR`

The vocabulary directory, relative to the repository root, as the manifest's paths are.

### `packages/codegen/src/scripts/generated-manifest.ts::isVocabularyInput`

Whether a repo-relative path is a vocabulary source (`bindings/vocabulary.ts::isVocabularySource`, its path relative to the vocabulary directory) in the vocabulary directory or one of its sub-folders, whether or not it still exists.

### `packages/codegen/src/scripts/generated-manifest.ts::bindingsInput`

A grammar's `bindings.scm`, relative to the repository root.

### `packages/codegen/src/scripts/generated-manifest.ts::isBound`

Whether a grammar ships a `bindings.scm` in the source being verified, which makes the pin and the vocabulary its inputs.

### `packages/codegen/src/scripts/generated-manifest.ts::upstreamDigest`

What the grammar's upstream contributes to generation, as one digest: the tree-sitter CLI version, then the upstream grammar package (`upstreamPackage`) and, transitively, every `tree-sitter-*` grammar it depends on (tree-sitter-typescript builds on tree-sitter-javascript), each by its upstream sources (`isUpstreamSource`). It is read from the checkout's installed packages, so a dependency bump that has not been regenerated fails verification, as a source edit does.

### `packages/codegen/src/scripts/generated-manifest.ts::LOCKFILE`

`pnpm-lock.yaml`: git's record of the installed upstream, compared with the trusted commits beside the source inputs.

### `packages/codegen/src/scripts/generated-manifest.ts::UPSTREAM_SKIPPED_DIRS`

The directories of an upstream package that generation never reads: its dependencies, native bindings and prebuilds, queries, tests, examples, and the generated parser's `tree_sitter` headers.

### `packages/codegen/src/scripts/generated-manifest.ts::isUpstreamSource`

Whether a file in an upstream package is an input to generation: `package.json`, `tree-sitter.json`, a JavaScript source (the grammar and what it requires), a scanner (`scanner.c`, `scanner.cc`) or a header. The upstream's own generated `parser.c`, `grammar.json` and `node-types.json` are not.

### `packages/codegen/src/scripts/generated-manifest.ts::upstreamFiles`

The upstream sources (`isUpstreamSource`) under an installed package, outside `UPSTREAM_SKIPPED_DIRS`.

### `packages/codegen/src/scripts/generated-manifest.ts::resolvePackageDir`

Where `name` resolves from `from`, by node's resolution paths, as a real path (pnpm links packages into its store), or undefined when it is not installed.

### `packages/codegen/src/scripts/generated-manifest.ts::grammarDependencies`

The `tree-sitter-*` grammars a package depends on (dependencies and peer dependencies), less the CLI.

### `packages/codegen/src/scripts/generated-manifest.ts::COMMON_PACKAGE_DIR`

`packages/common`: the shared runtime package, whose sources generation executes through `@sittir/common`.

### `packages/codegen/src/scripts/generated-manifest.ts::codegenSourceFiles`

The codegen source inputs (`isCodegenSourceInput`) under `packages/codegen/src`, as absolute paths in sorted order.

### `packages/codegen/src/scripts/generated-manifest.ts::runtimeClosure`

Every file generation executes beyond the codegen source inputs: the import closure (`moduleClosure`) of the codegen source, less the inputs themselves, as sorted repo-relative paths. That is the shared runtime (`@sittir/common`) and any codegen module outside the inputs that generation still loads, such as the validate modules the emitters import. Computed from the imports themselves, so it follows the code: a module generation starts using joins it, and a module reached only by type imports stays out, so editing it never asks for a regeneration. Cached per manifest source (`runtimeClosureBySource`).

### `packages/codegen/src/scripts/generated-manifest.ts::runtimeClosureBySource`

The memoized `runtimeClosure` of each manifest source.

### `packages/codegen/src/scripts/module-closure.ts::module`

The source files a set of entry modules runs, found by following their imports. One walker serves the source hash of generation (`runtimeClosure`) and the fixture fingerprint of a regeneration (`fixtureInputs` in the tools).

### `packages/codegen/src/scripts/module-closure.ts::STATIC_MODULE_REFERENCE`

Matches the module specifier of each static `import` or `export … from` statement that loads code at run time. Type-only statements (`import type`, `export type`) are skipped, since they are erased and never execute; an import listing both types and values is kept. Only a statement that starts a line or follows a `;` counts, so import text inside a string does not.

### `packages/codegen/src/scripts/module-closure.ts::DYNAMIC_MODULE_REFERENCE`

Matches the specifier of each `import()` call whose argument is a string literal. A type query (`typeof import('…')`) and an import type (`import('…').Name`) are skipped, since neither runs; `import('…').then(…)` runs, so it is kept. A computed specifier cannot be followed; a caller that loads modules that way names them as entries itself.

### `packages/codegen/src/scripts/module-closure.ts::WORKSPACE_DIR`

`packages`: the directory whose subdirectories are the workspace packages.

### `packages/codegen/src/scripts/module-closure.ts::PackageExport`

One target of a package's `exports` map: a path, or conditions naming one.

### `packages/codegen/src/scripts/module-closure.ts::WorkspacePackage`

A workspace package's directory and `exports` map.

### `packages/codegen/src/scripts/module-closure.ts::runtimeSpecifiers`

The module specifiers a source file loads at run time: its static imports (`STATIC_MODULE_REFERENCE`), then its literal dynamic imports (`DYNAMIC_MODULE_REFERENCE`).

### `packages/codegen/src/scripts/module-closure.ts::workspacePackages`

The workspace packages under `root`, by package name. The generated grammar packages are left out: their sources are generation's output, so following them would make the source hash depend on what it generates, and the manifest already verifies them.

### `packages/codegen/src/scripts/module-closure.ts::packageEntry`

The repo-relative source file a workspace package specifier resolves to, from the package's own `exports` map, or undefined for any other specifier. A `source` condition names the source directly; otherwise the map names built files under `dist/`, and since the workspace runs the TypeScript sources, a `dist/` path ending `.js` maps to the same path under `src/` ending `.ts`.

### `packages/codegen/src/scripts/module-closure.ts::moduleClosure`

The entries under `root` and every file they load at run time, transitively, through relative or workspace package specifiers (`runtimeSpecifiers`, `packageEntry`), as sorted repo-relative paths. A specifier that names no existing file (a node built-in, an installed dependency) is not followed; the lockfile stands for those.

### `packages/codegen/src/scripts/generated-manifest.ts::stagedInputPathspecs`

The paths the pre-commit check snapshots from the index before it verifies: the codegen source, the shared runtime package (`packages/common`, from which the source hash reads the files generation runs), `bootstrap.json`, `pnpm-lock.yaml`, the vocabulary, and every grammar's package and native crate. It covers every path `grammarSourceInputs` and `generatedRootsFor` can name, so a staged snapshot hashes the same inputs a working-tree check does; a source input left out of it reads as absent and fails a just-regenerated grammar as changed.
