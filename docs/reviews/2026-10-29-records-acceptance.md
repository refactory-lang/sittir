# Records acceptance walkthrough

> Files marked *local bundle* are not in the repository. They are kept, at the same path under `docs/reviews/`, in `scratch/review-artifacts/2026-10-29/in-repo-copies/` of the reviewing checkout.

Audited commit: `8143ccafaad9a76dc39b37d688b07dfd4cf95b7b`, on `chore/remove-eager-lane`, based on `feat/records`. This audit distinguishes acceptance evidence from implementation completeness. It makes no runtime changes and does not certify the full migration. The unrelated emit scratch directory remains excluded.

The governing acceptance requirements are the signed handles, narrow-cell and native-owned-chunk amendments, together with the live [shared-arena design](../superpowers/specs/2026-10-01-shared-arena-design.md). Older view-carried reclamation and private eager-probe requirements are superseded; they are not reasons to undo counted release. The maintainer subsequently selected paired object/object and arena/record backends, replacing the independent hybrid choice. The current contract and master comparison are recorded in the [paired-backend report](./2026-10-29-paired-backends.md).

## What is established

The five review corrections, adversarial ownership/frame/allocation fixes and obsolete eager-test reconciliation are complete in the [fix report](./2026-10-29-adversarial-fixes.md). The recorded full suite has 929 passing files and 11,150 passing tests, zero failures. That suite and its provenance are previous verification evidence, not a new run in this audit.

Additional checks executed during this audit:

- `cargo test -p sittir-parity-tests --no-default-features --features arena --test record_write --test record_fuzz`: three hydration tests and six malformed-record/cycle tests passed.
- `cargo test -p sittir-core --no-default-features --features arena arena::count::tests`: six count/sharing/release/underflow tests passed. Other test binaries were filtered out; their zero-test summaries are not additional passing coverage.

## Existing tracking

The authoritative [source-fidelity tracker](https://github.com/refactory-lang/sittir/issues/938) is open and retains `sittir-engine-api` as owner. At the maintainer's request, it now evaluates each supported mode against its specified source or expected render. Cross-mode byte differences are diagnostic; object normalization is not the correctness oracle for arena rendering. The original issue body and older workload table remain as history. AST results and validation rows remain separate evidence.

The current fixes partially address that tracker by restoring the eight Python trailing comments. The remaining source/layout questions and missing per-mode fidelity assertions stay open. Current counts must not be compared directly with the old table as regressions without matching workload populations. The fixes pull request now links the existing tracker explicitly and does not close it. No duplicate issue or issue comment was created.

## Requirement and evidence map

| Acceptance area | What the evidence establishes | What remains |
| --- | --- | --- |
| Source fidelity and diagnostic byte deltas | The eight identified Python trailing-comment losses are fixed exactly. A saved capture comparison on the tested runtime still contains 956 Python, 49 Rust, 325 TypeScript, 15 regex and three SCM differing candidates. | These cross-mode deltas do not by themselves fail the current acceptance contract. Determine the correct source/layout expectation per mode and boundary, then assert it exactly. Whitespace stripping is classification only; it cannot waive a fidelity failure. Four TypeScript candidates also differ after whitespace removal. |
| Corpus identity rebuilds | Targeted identity, leaf-side, cached alias/list and rebuilt-list regressions passed in the fix verification. | No complete current-head receipt for every setter plus reversed/first-dropped/last-dropped list rebuilds on the three required corpora, under both constructions, including place-wise slot equality. |
| Direct hydration and decoding | The newly run hydration tests cover Rust, Python and TypeScript source fixtures at shallow and full depth, repeated reads, row placement and idempotent hydration. | These assertions do not compare decoded slot values with the typed reader. Complete five-grammar parsed/built slot-value parity through both readers remains uncertified. Hydration success is not a substitute for that comparison. |
| Counted reclamation | Native sharing/count-underflow tests pass. The fix's opposite-side refusal churn and validator zero-live evidence pass. | The full all-grammar post-warmup live-chunk, heap, external-memory and native-side plateau; kept-root/shared-root render stability across surrounding releases; the million-record release chain; and V8 external-accounting acceptance lack a complete current audit receipt. This is an evidence gap, not a claim those mechanisms are absent. |
| Malformed wire and refusal | Six existing malformed-record/cycle tests pass across five grammars. The fuzz harness selects at most 24 fixture sources per grammar and performs 400 mutations per eligible source. | It mutates copied word/string buffers, not the actual external typed arrays exposed by a native-owned arena. This does not by itself complete external-buffer mutation/lifetime/refusal acceptance. Runtime external-buffer refusal also needs its named-refusal/object-storage control receipt. |
| Static checks and regression gates | The fix report records package build, complete type checks, targeted lint/Clippy and unchanged three-grammar validation counts/history. | The signed acceptance list includes wider workspace/configuration coverage. The hosted snapshot below predates completion. The audited fix head later passed its hosted checks; that does not certify unmeasured migration requirements or subsequent uncommitted changes. |
| Measurements | The earlier full corpus matrix measured whole validator round trips. Local leaf reuse and accessor instrumentation establish specific removed work. | That timed matrix predates the final native frame fix. It is not a final-head measurement of retained parsed/built populations or read-after-many. A compiled public-engine construction benchmark must separate build/render/parse, steady/post-GC/whole-pass work and retained-root/all-handles-held populations. There is no enforced acceptance threshold or current cutover conclusion. |
| Adversarial review | The concrete refusal leak, candidate child-comment loss and extra pruning copy have fixes and regression evidence. | Preserve the independent wider acceptance findings; a green regression suite does not close them. |

## AST results alongside byte differences

The saved read-render-parse results are identical between object and arena, including the full diagnostic result objects, not just their totals. Both report zero structural AST mismatches:

| Grammar | AST-matching corpus entries in each storage | Skipped corpus entries |
| --- | ---: | ---: |
| Python | 115 | 1 |
| Rust | 149 | 0 |
| TypeScript | 118 | 1 |
| regex | 37 | 0 |
| SCM | 19 | 0 |

These are corpus-entry counts, not the candidate-render counts used in the byte comparison. Python and TypeScript each skip an entry whose input fails parsing. The saved results also contain candidate exclusion records (178 for Python and three for regex in each storage); these are not extra AST-pass cases. This audit analyzed the saved captures; it did not rerun the validator.

Each storage's output is reparsed and compared with the original source node by the [structural comparator](../../packages/tools/src/validate/read-render-parse.ts#L238), rather than by directly comparing the two storages' entire syntax trees. The comparator checks grammar identity, visible child structure, named-leaf text, anonymous-token text and extra-node text, with declared identity/group-lift, zero-width-marker and optional separator tolerances. Layout bytes absent from the compared node structure are not established by an AST match.

This is meaningful structural evidence, but it establishes neither exact rendered-byte equality nor unrestricted runtime semantic equivalence. The recorded regex counterexample passes this grammar-based structural criterion while the two emitted strings behave differently as JavaScript regular expressions. No AST regression is reported by these saved results; source-fidelity questions at candidate boundaries still need explicit expected bytes.

Saved AST results and exclusion details (`2026-10-29-records-acceptance/ast-comparison.json`, local bundle).

## First priority: byte differences are not all arena regressions

Analysis used the saved exact-byte captures from the tested runtime; this audit did not rerun corpus rendering. In differing cases, arena text equals the captured input for 786 of 956 Python cases, 38 of 49 Rust cases, 279 of 325 TypeScript cases, all 15 regex cases and all three SCM cases. This is evidence that source-copy preservation and object-path formatting differ, not proof that every arena output is correct.

Examples:

- Python `_simple_statements` over `a[1]`: the object candidate is `a[1]\n`; arena is `a[1]`.
- TypeScript's interface fixture: the object path removes the final method semicolon and collapses an empty block; arena retains the source form. Four reported candidate differences come from this fixture, including ancestor candidates; they are not necessarily four independent defects.
- The multiline regex fixture has a literal newline immediately after `(`. The object output drops it; arena retains it. Evaluating the two saved outputs now as anchored JavaScript regular expressions produces different behavior on `ab\n.cd\nx\n`: the source and arena patterns match, the object pattern does not.

The regex experiment is scoped to ECMAScript `RegExp` with no flags. It proves that calling these byte differences harmless without establishing the target dialect is unsafe; it does not, by itself, establish a Sittir AST regression or a semantic defect under its regex grammar. Treating that JavaScript experiment as an unqualified Sittir semantic defect was too strong.

A fresh parser reproduction reconciles the apparent contradiction. The generated regex grammar declares `\r?\n` as lexer extras. The newline after the opening parenthesis is a gap between child spans, not a token or named extra in the AST. Both the generated and upstream WASM parsers produce matching source/object/arena structures, and the actual structural comparator returns no difference for all three pairings. JavaScript's `RegExp` constructor, by contrast, interprets those newline characters as literal pattern content. The grammar-based AST-match result and the JavaScript behavior difference therefore coexist without contradiction.

The two outputs remain byte-different regardless of dialect; cross-mode equality is diagnostic rather than the current gate. The source/layout and target-dialect contracts must be established before choosing which rendering to repair. No policy exception or acceptance waiver has been adopted. Fresh parser reproduction and grammar fingerprint (`2026-10-29-records-acceptance/regex-ast-reconciliation.json`, local bundle).

## Order of work

1. Establish per-mode source/expected-render fidelity, starting with the regex newline contract and TypeScript interface cases; retain exact byte comparisons and explicit candidate-boundary expectations.
2. Complete the corpus identity and two-reader slot-value comparison harnesses at shallow/full depth for the required grammars and constructions.
3. Complete counted-lifetime stress, actual external-buffer mutation and refusal checks, with memory populations and controls recorded.
4. Once correctness is stable, run the public compiled-runtime construction/retained-memory/read-after-many measurements and the final corpus comparison. Publish the measured head and comparison limits.

This order avoids repeatedly timing a tree whose correctness is still changing. It does not pre-authorize a storage-default change or release.

## Evidence

- [Byte-difference triage](./2026-10-29-records-acceptance/byte-parity-triage.json) and regex semantic counterexample (`2026-10-29-records-acceptance/regex-byte-semantics.json`, local bundle).
- Native hydration/fuzz output (`2026-10-29-records-acceptance/native-parity-fuzz.txt`, local bundle) and command receipt (`2026-10-29-records-acceptance/native-parity-fuzz.json`, local bundle).
- Native count tests (`2026-10-29-records-acceptance/native-counts.txt`, local bundle) and command receipt (`2026-10-29-records-acceptance/native-counts.json`, local bundle).
- Hosted-check snapshot (`2026-10-29-records-acceptance/hosted-checks.json`, local bundle), checked 2026-10-29 at 14:05 UTC on the audited head. Full CI, Rust and drift were in progress; tracked-module check passed; glossary was skipped on the pull request.
