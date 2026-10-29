# Paired node backends and master compatibility

> Files marked *local bundle* are not in the repository. They are kept, at the same path under `docs/reviews/`, in `scratch/review-artifacts/2026-10-29/in-repo-copies/` of the reviewing checkout.

The maintainer selected two supported modes: object storage with object construction, and arena storage with record construction. The retired arena/object hybrid is refused by types and runtime. This is an API simplification, not a claim that hybrid measurements proved it slower.

Implementation and verification are complete in the existing `wt-2c-census` checkout on `chore/remove-eager-lane`. The work does not certify the wider Records migration, change its existing arena default, merge to master or release a package.

## Public contract

```ts
await language.createEngine({ nodeStorage: 'object' }); // object/object
await language.createEngine({ nodeStorage: 'arena' }); // arena/record
```

Matching explicit `nodeConstruction` values remain deprecated compatibility assertions. Conflicting values fail rather than silently choosing a different storage. A construction-only object request also fails because it would otherwise select the retired hybrid under the existing arena default. Select `nodeStorage: 'object'` instead.

The shared resolver derives one pair. Validators retain that pair as one stamp; their construction hint only checks consistency. CLI defaults and benchmark workers follow the same resolution. CI compares the two supported modes, and historical hybrid benchmark reports remain readable. Object mode skips loading record builders and creating the built arena.

## Independent master baseline

Pinned master: `7471447a24febcdae6f37b025cdb80a12a929209`. It was exported without Git metadata, installed from its own frozen lockfile offline and compiled separately, including its own five optimized native bindings. The existing feature checkout was neither switched nor given another branch/worktree. The feature comparison explicitly selects object storage; pinned master supplies its existing object implementation.

| Grammar | Corpus roots | Same-value root edits | Master/feature differences | Object roots exactly equal source |
| --- | ---: | ---: | ---: | ---: |
| Python | 116 | 116 | 0 | 116 |
| Rust | 149 | 298 | 0 | 149 |
| TypeScript | 119 | 238 | 0 | 119 |
| regex | 37 | 37 | 0 | 37 |
| SCM | 19 | 19 | 0 | 19 |
| Total | 440 | 708 | 0 | 440 |

The comparison checks node and engine rendering, parse-error counts and every callable root setter/accessor pair. All 708 edits executed successfully. The built Rust fixture also matches rendered text, retained input-child identity, renamed output and stability of the original after editing. This checks the recorded corpus and public operations; it is not a proof for all possible inputs.

The feature branch already intentionally removed node JSON/revival and `$named`, and added `engine.release`. Those API differences remain explicit. Preserving those removals is the stated working assumption; they are not introduced by pairing, and this report does not claim exact master API equivalence.

## Performance and memory

The public comparison completed 66 fresh processes: five alternating master/feature process pairs for each grammar and the Rust construction workload, plus three separate memory pairs. Each timing process warms up for at least two seconds. Corpus workers record 50 measured batches; construction workers rotate seven batches per size/reuse combination. Both native builds use the optimized Cargo gate profile. No compilers or tests from this task ran concurrently. Unrelated machine activity was not controlled.

The values below are medians of paired **feature/master process-median ratios** for public parse-plus-render over the complete corpus. A value above one means the feature path is slower. They are descriptive local measurements, with no adopted acceptance threshold.

| Grammar | Feature/master parse + render |
| --- | ---: |
| Python | 1.062 |
| Rust | 1.040 |
| TypeScript | 1.036 |
| regex | 1.163 |
| SCM | 1.230 |

Object mode therefore matches the recorded behavior, but does **not** have established performance equivalence. The remaining parsed-path overhead is recorded rather than waived; the smaller regex and SCM workloads have the largest relative deltas. Cold startup was not measured.

For the public Rust function workload, build-plus-render ratios are 1.065 and 1.018 at 2,000 roots (distinct/reused names), and 1.038 and 1.044 at 8,000 roots. Build and edit ratios vary with reuse and size; the raw phase samples are retained. This one construction fixture does not establish all-grammar construction performance.

The separate held-population experiment retains 32,000 function roots. Median heap-plus-external deltas are 123.628 MiB on master and 116.798 MiB on the feature tree. This is the specified population's process-memory delta, not complete native-memory attribution or a retained-AST claim for other workloads. Timing workers use ordinary GC, with no forced GC immediately before timed builds; the memory experiment forces GC before and after retaining the population.

The comparison exposed a fresh root-getter closure on every diagnostic parse. The implementation now shares its own-property getter, stamps non-default depth weakly by tree, and selects the object reader directly when records are absent. Regression evidence preserves lazy reads, requested depths, error stamps and cached identity. It creates no node prototypes. Remaining timing deltas are still visible after that change.

[Raw measurements and per-process ranges](./2026-10-29-paired-backends/benchmarks/object-benchmark-summary.json). The retired private eager lane supplies no public baseline.

## Verification

- Full unit suite: **931 files passed, 11,147 tests passed, zero failures**; six expected failures, 19 skipped, four todo.
- Complete package, cross-language, test, example and native TypeScript checks passed. Final common/tools/CLI builds passed; grammar runtime outputs were built earlier and remain fingerprinted.
- Independently built master object mode and current object mode have **zero moved rows across all 195 normalized validation-report rows**. Current object/object and arena/record reports also have zero moved rows, across all five grammars.
- The actual CLI rejects conflicting legacy flags, and its isolated arena worker passes. A complete five-grammar profiler integration run produced only object/object and arena/record samples. It used one round, zero warmups and one iteration, so its timings are not a statistical performance result.
- A native allocation guard verifies that object builders request no record cells; arena allocation is the positive control, with equal rendered output.
- Five normal regenerations after the final production edit passed. Generated grammar and Rust source have no diff. Lint, formatting of changed TypeScript, benchmark-report tests and whitespace checks passed. No baseline or ceiling was increased.

Failed intermediate runs remain saved: they identified retired-hybrid fixture expectations, then a freshness-guard failure after formatting changed stamped source inputs. Final regeneration followed the last source edit; freshness checks were not bypassed. A source-text routing assertion now tolerates whitespace without changing its required call and argument sequence.

The baseline validator requires real Git-visible files and a pinned HEAD. Its archive was verified through an external read-only Git object view and temporary index over the existing object database. No branch, checkout or registered worktree was created, and history output was redirected to prevent automatic history commits. The source snapshot's only tracked output change was its validation report. Baseline verification provenance (`2026-10-29-paired-backends/validation/master-object-view-provenance.json`, local bundle).

Repository-wide formatting already fails on unrelated files. Eighteen of the 21 affected tracked TypeScript files were unformatted at the previous head; changed TypeScript is formatted using the repository configuration, without a repository-wide sweep.

## Fidelity and acceptance boundaries

[Source fidelity](https://github.com/refactory-lang/sittir/issues/938) now evaluates each supported mode against its source or specified expected render. Cross-mode byte differences are diagnostic. AST matches, source equality, edit expectations and timing comparisons are separate evidence. The [prior acceptance audit](./2026-10-29-records-acceptance.md) retains candidate-level divergences and the wider hydration, lifecycle, external-buffer and measurement evidence gaps. Matching master can inherit a master limitation; it does not waive a fidelity failure. The first JavaScript construction probe used a Python built-module list replacement that both versions refused. It was excluded from successful edit coverage and does not establish a new regression.

The [paired-mode tracker](https://github.com/refactory-lang/sittir/issues/999) records this policy and the master baseline. Changed resolver/type/CLI glossary entries remain a post-merge documentation-owner handoff. No wider migration gate is closed by this report.

## Saved artifacts and review

- Portable artifact manifest (`2026-10-29-paired-backends/manifest.json`, local bundle), including all final corpus samples, inputs, command receipts, compressed full test results and runtime fingerprints.
- Compatibility receipt (`2026-10-29-paired-backends/compatibility/object-compatibility-final.json`, local bundle).
- Unit summary (`2026-10-29-paired-backends/verification/full-unit-summary.json`, local bundle), type-check receipt (`2026-10-29-paired-backends/verification/full-types-verified-receipt.json`, local bundle), and runtime fingerprints (`2026-10-29-paired-backends/verification/runtime-fingerprints.json`, local bundle).
- Complete local review and benchmark bundle: `scratch/review-artifacts/2026-10-29/` in this same checkout. It preserves the original review/fix/benchmark artifacts, failed attempts, pinned source archive, measured native addons and compiled outputs. Rebuildable dependency and Cargo intermediate caches are excluded; lockfiles and build commands are saved. Its inventory identifies every preserved file.

The final diff was reviewed inline. The review covered conflicting/construction-only options, default preservation, object allocation, worker metadata, historical report readability, getter depth/identity, generated consistency and the source-fidelity distinction. No subagent performed this review. The paired-mode change remains scoped independently of the wider Records acceptance gaps.
