# Adversarial review fixes

Implemented and verified in place in this checkout, on `chore/remove-eager-lane`, based on HEAD `34f51c91f4a28b3c303811b86359fe010c298793`. The evidence below was captured before committing, with the existing eager-lane retirement and three staged deletions present. No new branch, worktree, subagent or session operation was used.

## Changes

- **Refused side writes retain ownership correctly.** [BuiltArena.repark](../../packages/common/src/built-arena.ts#L442) validates every retained and newly written trivia entry before transferring a count. A released opposite-side comment can no longer strand a fresh comment's builder-owned count. Both write orders are covered by 128-cycle regressions in [built-arena-release.test.ts](../../packages/python/tests/built-arena-release.test.ts#L79). The original leaking churn now ends with zero live records.
- **Candidate rendering retains child comments.** [CandidateSources.frames](../../rust/crates/sittir-core/src/arena/parsed.rs#L398) trims only the candidate's own outer sides and retains its edge-item frames. Previously, returning an empty frame collection discarded both. The source-copy optimization stays enabled. All eight identified Python trailing-comment losses now match the object output byte-for-byte. [Native regression coverage](../../rust/crates/sittir-parity-tests/tests/record_render.rs#L748) checks shallow/deep reads, repeated renders, leading-comment exclusion, recordless leaves and TypeScript control-flow line breaks.
- **Pruning avoids the temporary prefix copy.** [liveSites](../../packages/common/src/built-ref.ts#L59) filters the backing array only to the descriptor's logical length. Real leaf writes copy zero temporary prefix numbers, versus 48, 384 and 3,072 for 16, 128 and 1,024 live holders before this change. [Spread-prefix coverage](../../packages/common/tests/leaf-sites.test.ts#L40) protects snapshot independence. No timing speedup is claimed for this allocation change.

## Verification

- Original refusal and comment-loss regressions were observed failing before their fixes. The original compiled adversarial lifetime/cache tests now pass, as do 15,000 placement-model operations and the allocation/churn probes.
- All 24 native record-render integration tests pass. Core native unit/integration/doc tests and strict Clippy pass. Complete TypeScript checks and the package build pass. All five packages were regenerated normally; final addon input fingerprints match, using the optimized gate profile.
- Fresh Python/Rust/TypeScript object and arena/record validation counts match exactly. The three-grammar report matches the saved pre-fix report with no moved rows (184 weighted diagnostic entries); the baseline is saved evidence, not a newly executed old checkout. No ceiling or baseline was changed.
- Final full unit suite after completing the retired-lane test cleanup: **11,150 passed**, six expected failures, 19 skipped and four todo; **zero failures across all 929 files**. Test-source type checking and lint also pass.

An intermediate approach that forced candidate roots through templates restored the comments but introduced three TypeScript automatic-semicolon AST mismatches. That approach was rejected. The final frame-only fix passes the new line-break regression and restores the original validation outcomes. Intermediate failing logs remain available.

## Eager probe test cleanup

The three remaining failures expected the eager probe to run after regeneration or to propagate its failure status. That step, its runner and CI lane were already removed; the probe is frozen. All 28 original regeneration tests pass when the exact pre-removal runner from HEAD is substituted in memory. Before cleanup, the same test set produced the three failures with the post-removal runner. No repository source was stashed or swapped for this control.

Removed the four cases dedicated to the retired step, including one passing negative-only case, and their unused mock/reset from [regen-all.test.ts](../../packages/tools/src/__tests__/regen-all.test.ts). The 24 retained tests are unchanged and pass. Generation, native-build, workspace-check and fixture-extraction failure propagation remain covered. No production behavior or test expectation for a live feature changed. The full suite has four fewer cases because that obsolete group is gone.

[Cleanup evidence](./2026-10-29-adversarial-fixes/regeneration-cleanup.json) · [before](./2026-10-29-adversarial-fixes/regeneration-before.txt) · [pre-removal control](./2026-10-29-adversarial-fixes/regeneration-old-runner.txt) · [after](./2026-10-29-adversarial-fixes/regeneration-after.txt) · [full-suite result](./2026-10-29-adversarial-fixes/full-suite-summary.txt).

## Scope and remaining limits

The final corpus capture changes exactly the eight confirmed Python outputs. All five object-output fingerprints and all four other arena-output fingerprints match the previous full benchmark. Remaining cross-storage differences are preserved: Python 956, Rust 49, TypeScript 325, regex 15 and SCM 3 candidates. Python, Rust, regex and SCM differences disappear when whitespace is removed; TypeScript also has four interface-related semicolon differences. This classification is not a semantic-equivalence proof. The broader byte-parity acceptance gate remains open.

The earlier full performance benchmark belongs to the earlier tree. It was not rerun as a timed matrix for this patch, and its ratios are not asserted as current-fix measurements. The current checks establish correctness and the removed allocation, without default-cutover or release acceptance.

Evidence: [output scope proof](./2026-10-29-adversarial-fixes/resolved-output-scope.json), [restored comments and remaining comparisons](./2026-10-29-adversarial-fixes/rrp-resolved-comparison.json), [validation history comparison](./2026-10-29-adversarial-fixes/validation-resolved-baseline-diff.txt), [native tests](./2026-10-29-adversarial-fixes/resolved-native-record-render.txt), [lifetime/cache tests](./2026-10-29-adversarial-fixes/fixed-compiled-regressions.tap), [churn](./2026-10-29-adversarial-fixes/churn-fixed.json), [allocation measurements](./2026-10-29-adversarial-fixes/prune-allocation-fixed.json).

[Verification commands and results](./2026-10-29-adversarial-fixes/verification.json) · [initial runtime-fix provenance](./2026-10-29-adversarial-fixes/resolved-provenance.json).
