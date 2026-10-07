# Open issue triage — 2026-10-07

Inventory: 92 open issues in `refactory-lang/sittir`. Priority follows the requested order: reproducible correctness bugs first. P1 means the next correctness or migration dependency batch; P2 means follow-up investigation or scoped design; P3 means deferred or latent work. These are local triage priorities, not applied GitHub labels. `Deferred` overrides the previous priority for work excluded from the current batch.

This report classifies issue bodies and current context. #706, #692 and the remaining lone-array case of #626 have been reproduced and remediated in this branch. Other entries identify the next action; they are not claims that the reported behavior still reproduces. No issues were closed during triage.

## Verified remediation

- **#706:** query compilation now caches by immutable query-slot table, condition callback and numeric kind. This is the compilation dependency: distinct grammar tables cannot share plans, while contexts sharing the same table can. Five tests cover both grammar orders, validation isolation and legitimate shared compilation. Three of the tests failed before the fix.
- **#692:** regeneration refreshes all stable grammars with native builds disabled before invoking the canonical generation/build command for each grammar. Three subprocess tests cover ordering, generation failure and native failure; all failed before the fix. Full `pnpm regen:all` then passed for Python, regex, Rust, SCM and TypeScript with no generated changes. The canonical second pass repeats generation to retain native build, typedef cleanup and fixture sequencing in one implementation.
- **#626:** current `modifier` config arrays already coerce correctly. The remaining lone-array input was treated as one element, causing text/enum arrays to route to `extern_modifier` and empty arrays to render `extern`. The shared repeat-slot resolver now unwraps the array before per-element coercion; generated `LooseArgs` derives a readonly array form from the same loose element types and cardinality. Six regression tests cover text, enums, readonly input, non-empty rejection, config equivalence and held-node reconstruction.

## Validation

- Root runtime run: 25 files, 202 tests passed (all common tests plus regeneration sequencing tests).
- Root tooling run: 91 files, 768 tests passed and 10 skipped.
- Full `pnpm regen:all`: passed across all five stable grammars; no generated output changes.
- Common and tools package type checks, plus the new query test type check: passed.
- Changed source/test lint and `git diff --check`: passed. New tests and regeneration script formatting: passed.
- #626: all codegen emitter tests plus focused Rust repeat/keyword/forwarding tests passed (75 files, 594 tests). The new regression file also passed a dedicated TypeScript check, including rejection of an empty array for the non-empty slot.
- #626: canonical five-grammar regeneration, codegen and Rust package type checks passed. Generated changes are confined to argument types and repeat coercers. The cache/repeat regressions (11 tests) and sequencing regressions (3 tests) also passed after regeneration.

The #626 validator rerun matches the committed native baseline, including its three existing round-trip misses:

| Grammar | From | Coverage | Round-trip | AST match | Factory storage |
|---|---:|---:|---:|---:|---:|
| Python | 180/180 | 146/146 | 115/116 | 115 | 1404/1404 |
| Regex | 50/50 | 25/25 | 37/37 | 37 | 175/175 |
| Rust | 244/244 | 207/207 | 148/148 | 148 | 1670/1670 |
| SCM | 26/26 | 21/21 | 19/19 | 19 | 123/123 |
| TypeScript | 186/186 | 202/202 | 113/115 | 113 | 1303/1303 |

## Next correctness batch

The maintainer requested skipping trivia-related work for now. Start with these non-trivia correctness cases:

1. **#572 — required slots and rest arguments:** distinguish invalid empty arguments from valid empty root builders.
2. **#550 — single-element tuples:** preserve the syntax-bearing comma and the selected grammar arm.
3. **#493 — parsed list binding:** reproduce list-view sizing when a builder consumes a parsed list stub.

#627's exact samples from its maintainer audit now pass `default-diff --no-attribute`: the multiline Python docstring, `a ${b} c` and `x` TypeScript templates, and `^[\w.+-]+@[\w-]+\.[\w.]+$` email regex each have zero rebuild failures, differing gaps and token mismatches. The original TypeScript/regex failing files were not committed, so the issue remains open pending an input that still reproduces.

Keep #675, #677, #678 and #685 reserved for typed-reader 1c; do not create competing implementations. Trivia-related portions of mixed issues are deferred even when their other cases remain eligible.

## Deferred trivia scope

Comments, source-gap spelling, CRLF and line-ending preservation, spacing around punctuation, trivia authoring, and related performance/diagnostic work are excluded from the current remediation batch. Syntax-bearing punctuation such as a tuple's required comma remains eligible.

The 16 directly related issues are **#619, #608, #587, #582, #568, #477, #372, #434, #675, #584, #585, #547, #474, #631, #357 and #427**. Their inventory rows are marked `Deferred`. The inventory still contains all 92 issues; category counts are unchanged. These deferrals also apply to investigation here when an issue remains reserved for another migration. The trivia option in #644 is deferred while its structural-comparison design remains classified separately.

## Layout design ruling

The line-ending discussion established the general [reference preference inheritance contract](../superpowers/specs/2026-09-09-preference-address-design.md#amendment-references-inherit-preferences-2026-10-07). The proposed newline choice and blank-line composition remain design work; they are not included among the verified fixes. The CRLF/layout portion is linked to [#608](https://github.com/refactory-lang/sittir/issues/608), whose broader exact source-gap preservation remains open. This ruling does not resume the deferred trivia backlog.

## Coverage and limits

The fixes have focused red/green regressions and regeneration coverage. Backlog classification is not a full reproduction run for every issue. Linux-specific #695 requires Linux verification. Historical issue bodies sometimes disagree with current titles or implementation, so their counts need refresh before remediation. Held PR #683 remains separate.

## Inventory

| Group | Count |
|---|---:|
| Remediated | 3 |
| Correctness queue | 23 |
| Typed-reader migration and performance | 14 |
| Platform verification | 1 |
| Design and feature work | 31 |
| Engineering and regression infrastructure | 13 |
| Contract questions and latent cases | 7 |
| **Total** | **92** |

## Remediated

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#706 — fix(query): scope compiled predicate cache by grammar/querySlots](https://github.com/refactory-lang/sittir/issues/706) | P1 | Fixed query plan reuse across distinct grammar slot tables; five regression tests pass. |
| [#692 — regen:all fails when a generated Cargo feature changes](https://github.com/refactory-lang/sittir/issues/692) | P1 | Fixed regeneration ordering so every Cargo manifest is refreshed before any native build; three regression tests and real five-grammar regeneration pass. |
| [#626 — Loose builders: a forwarded envelope's repeat slot is not coerced per element (functionModifiers({ modifiers: ['async'] }) throws)](https://github.com/refactory-lang/sittir/issues/626) | P1 | Current config spelling already works; fixed remaining lone-array coercion and generated readonly array argument types. Six regressions and related emitter/runtime/type checks pass. |

## Correctness queue

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#627 — Corpus rebuild failures: builders reject real source (python docstring string_fragment, ts template string, regex email)](https://github.com/refactory-lang/sittir/issues/627) | P2 | All documented audit samples now rebuild with zero failures/differences. Need the original uncommitted TypeScript/regex files or another reproducing input before further remediation. |
| [#619 — Render glues an item to a preceding bare ';' token that has no source identity](https://github.com/refactory-lang/sittir/issues/619) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Reproduce bare-semicolon loss together with #477 before changing punctuation placement. |
| [#608 — Rule 1 exact spelling: emit the source gap's own text where no whitespace member spells it (CRLF included)](https://github.com/refactory-lang/sittir/issues/608) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Pin byte-exact CRLF and multi-space gaps before changing source-gap handling. |
| [#587 — Source emitter drops the blank line after a line comment (Newline run)](https://github.com/refactory-lang/sittir/issues/587) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Reproduce the line-comment/newline run and identify the responsible emitter. |
| [#582 — A parsed node with a leading comment renders from its template, not its source bytes](https://github.com/refactory-lang/sittir/issues/582) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Reproduce untouched commented subnodes together with #427 and #568. |
| [#568 — A parent rebuilt with $with rewrites the gaps between its untouched children](https://github.com/refactory-lang/sittir/issues/568) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Pin untouched sibling gap ownership and occurrence identity. |
| [#550 — One-element tuple pattern and tuple type: the grammar accepts `(x)` as the kind, so a built one renders without its comma](https://github.com/refactory-lang/sittir/issues/550) | P1 | Reproduce single-element variant selection and retain the actual grammar arm semantics. |
| [#529 — Loose statementBlock({ statements }) input type exceeds the checker's stack depth on export statements](https://github.com/refactory-lang/sittir/issues/529) | P2 | Pin the failing loose-input recursion under the workspace TypeScript version. |
| [#493 — A node built from a parsed list stub cannot size its list view: bind the reading tree at build](https://github.com/refactory-lang/sittir/issues/493) | P2 | Reproduce parsed list-stub tree binding and length handling. |
| [#477 — Tree-bound render: list gaps around a collapsed kind-id token fall to the list default](https://github.com/refactory-lang/sittir/issues/477) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Pin punctuation coordinates together with #619. |
| [#372 — python: a comment after an opening bracket beside a scalar-stored leaf renders before the bracket (CPython rejects it)](https://github.com/refactory-lang/sittir/issues/372) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Validate bracket-comment output with CPython as well as tree-sitter. |
| [#145 — Published @sittir/{rust,typescript,python} packages have no path to native rendering outside this monorepo](https://github.com/refactory-lang/sittir/issues/145) | P1 | Recheck current published native packaging before acting on the older remediation plan. |
| [#572 — Builders accept less than the model requires: empty match block, no-arg empty renders, plain-array rest params](https://github.com/refactory-lang/sittir/issues/572) | P1 | Distinguish invalid empty arguments from valid empty root builders in rest typing. |
| [#705 — DSL: field(name, literal) inside a rules: body mints _kw_<name> with no rule slot](https://github.com/refactory-lang/sittir/issues/705) | P2 | Reproduce rules-body literals; support them in the owning model or issue a precise diagnostic. |
| [#691 — clippy -D warnings fails on master's lints](https://github.com/refactory-lang/sittir/issues/691) | P2 | Run current Clippy and fix the owning source or generator without blanket allowances. |
| [#576 — Authored-rule pattern fold captures an inline body into a rule referenced only under an alias](https://github.com/refactory-lang/sittir/issues/576) | P2 | Reproduce alias-only references without evaluating rule callbacks multiple times. |
| [#523 — tools buildNodeMap does not run site-preference registration, so option-carried slots look caller-supplied](https://github.com/refactory-lang/sittir/issues/523) | P2 | Ensure diagnostics consume the same final resolved model as emission. |
| [#518 — regex: two hoisted kinds have no parent seat (count_quantifier_group, unicode_property_value_expression_group)](https://github.com/refactory-lang/sittir/issues/518) | P2 | Reproduce the two unseated regex groups in the current grammar. |
| [#512 — Typed patch paths do not see the fields enrich adds to repeats](https://github.com/refactory-lang/sittir/issues/512) | P2 | Reproduce typed/runtime enrich behavior on SCM repeat paths. |
| [#434 — Line-break-terminated kinds' after edges offer arms the held line end always overrides](https://github.com/refactory-lang/sittir/issues/434) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Measure the public held line-ending options and their effect. |
| [#369 — Floored shape debt raised by the upstream grammars](https://github.com/refactory-lang/sittir/issues/369) | P2 | Refresh diagnostic families and fix failures at the earliest phase retaining the facts. |
| [#170 — typescript nodes.test.ts: three kinds still skipped via expectTestFailures](https://github.com/refactory-lang/sittir/issues/170) | P2 | Recheck the current three TypeScript skips; the older issue body counts differ. |
| [#577 — Circular types when a list kind is a member of its own element union](https://github.com/refactory-lang/sittir/issues/577) | P2 | Pin recursive list-kind LooseArgs; fix namespace or widening recursion without dropping admitted values. |

## Typed-reader migration and performance

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#675 — Typed reader: an enum-kind node can own trivia its read then discards](https://github.com/refactory-lang/sittir/issues/675) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Reserved for typed-reader 1c: preserve enum trivia during the migration. |
| [#677 — Typed reader: two slots on one field route to the first, and a struct slot accepts a child of any named kind](https://github.com/refactory-lang/sittir/issues/677) | P1 | Reserved for typed-reader 1c: shared field and kind admission. |
| [#678 — Typed reader: read_at trusts its caller's parent type, and the envelope-pin report only prints counts](https://github.com/refactory-lang/sittir/issues/678) | P1 | Reserved for typed-reader 1c: parent-type and envelope gates. |
| [#685 — Choices print from_kind_id beside the claims the derive already reads](https://github.com/refactory-lang/sittir/issues/685) | P2 | Reserved for typed-reader 1c: one source for ID construction and claims. |
| [#669 — Today's read drops a node's slots, blank arm included, when its children tile its span](https://github.com/refactory-lang/sittir/issues/669) | P1 | Coordinate old-reader removal and empty-byte parity with 1c. |
| [#655 — native/index.d.ts names undeclared transport types (2,732 errors checked alone)](https://github.com/refactory-lang/sittir/issues/655) | P1 | Wait for derived codec facts; avoid a second filtered native declaration source. |
| [#672 — Typed read: dev-profile root stack cost is 375 KiB against today's 39 KiB](https://github.com/refactory-lang/sittir/issues/672) | P2 | Reconcile the older root-stack proposal with accepted 1a work and #690. |
| [#690 — struct readers' debug frames](https://github.com/refactory-lang/sittir/issues/690) | P2 | Outline and measure structured reader frames against the current implementation. |
| [#639 — python deep read: wrap phase rose ~0.5 µs/node after routing moved from the reader to the wrap](https://github.com/refactory-lang/sittir/issues/639) | P3 | Profile Python wrapping after the active reader migration. |
| [#491 — Per-kind read depth: a stamped fact wrap passes to the depth-parameterized native read](https://github.com/refactory-lang/sittir/issues/491) | P2 | Reconcile depth stamping with typed-reader 1c before parallel implementation. |
| [#476 — Grammar-agnostic native reader; all storage projection in the wrap layer](https://github.com/refactory-lang/sittir/issues/476) | P2 | Reconcile earlier grammar-agnostic reader direction with the active migration. |
| [#610 — Nodes share a const prototype per kind](https://github.com/refactory-lang/sittir/issues/610) | P2 | Refresh partially shipped shared-prototype work and coordinate remaining migration pieces. |
| [#611 — List indices are accessors](https://github.com/refactory-lang/sittir/issues/611) | P3 | Specify shared versus data index semantics before lazy implementation. |
| [#584 — Batch the line-gap query per parent (lineGapsOfChildren)](https://github.com/refactory-lang/sittir/issues/584) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Measure batch trivia queries at actual consumers. |

## Platform verification

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#695 — Linux x86_64 release has no typed_read_nesting row](https://github.com/refactory-lang/sittir/issues/695) | P2 | Reproduce release behavior on Linux x64; this macOS arm64 run cannot verify that platform. |

## Design and feature work

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#696 — Conflict re-derivation records bound names that sittirGrammar applies before renaming](https://github.com/refactory-lang/sittir/issues/696) | P2 | Specify bound/base conflict behavior including split clones. |
| [#646 — Generic build entry selected by $type](https://github.com/refactory-lang/sittir/issues/646) | P2 | Agree on the kind-selected generic build API and type-check cost. |
| [#644 — Compare two trees by structure: no public way to ask whether a render re-parses to the same tree](https://github.com/refactory-lang/sittir/issues/644) | P2 | Specify structural comparison across built, parsed and draft nodes, including trivia. |
| [#600 — Portable API: the portable engine, the attach verb and the round-trip lane](https://github.com/refactory-lang/sittir/issues/600) | P2 | Define the portable engine attachment map. |
| [#599 — Vocabulary: features, terms and per-language projections](https://github.com/refactory-lang/sittir/issues/599) | P2 | Define vocabulary feature projections from a single map. |
| [#598 — Bindings: claim, contain or unclaim the remaining unmapped kinds](https://github.com/refactory-lang/sittir/issues/598) | P2 | Refresh explicit binding claims and remaining work. |
| [#597 — TypeScript: member_expression keeps ?. in a separator slot, so the vocabulary has no optional chaining](https://github.com/refactory-lang/sittir/issues/597) | P2 | Specify optional-chain semantics before layout behavior. |
| [#595 — Inventory: text leaves are string members, not unmapped kinds](https://github.com/refactory-lang/sittir/issues/595) | P2 | Choose one source for text-leaf facts. |
| [#594 — Codegen: emit the portable/low-level map from bindings.scm](https://github.com/refactory-lang/sittir/issues/594) | P2 | Coordinate codegen work with held PR #683. |
| [#593 — Bindings: every claim names its members, written over a generated seed](https://github.com/refactory-lang/sittir/issues/593) | P2 | Seed exhaustive captures from the owning representation. |
| [#585 — Built import and export-from statements are followed by a blank line, so an import block renders apart](https://github.com/refactory-lang/sittir/issues/585) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Coordinate import-neighbor layout with #386. |
| [#580 — examples/: assessment and cleanup plan (gates, dormant template examples, superseded dogfoods, stale guide)](https://github.com/refactory-lang/sittir/issues/580) | P2 | Refresh the examples inventory; the root currently has an examples type-check command. |
| [#571 — Route a negative number in a slot to the grammar's unary expression](https://github.com/refactory-lang/sittir/issues/571) | P2 | Specify unary-sign facts for negative zero and bigint. |
| [#547 — Multi-kind slots accept fully spelled text; the fixed affix picks the kind (trivia first)](https://github.com/refactory-lang/sittir/issues/547) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Design disjoint affix census diagnostics. |
| [#514 — Element supertype for repeat choices whose arms are already kinds](https://github.com/refactory-lang/sittir/issues/514) | P2 | Specify choice-element supertype changes and parser cost. |
| [#511 — Seat the variant kinds of a repeated union list (element seats)](https://github.com/refactory-lang/sittir/issues/511) | P2 | Represent element seats as structural facts in one place. |
| [#497 — Optional slot accessors: attach the accessor only when the value is set (property narrows)](https://github.com/refactory-lang/sittir/issues/497) | P2 | Agree on the optional-accessor public contract. |
| [#474 — Trivia API: author a closing comment on a non-empty list](https://github.com/refactory-lang/sittir/issues/474) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Agree on explicit authoring of closing comments. |
| [#437 — Edit lifecycle: $with drafts, $commit() commits through tree-sitter; spans translate lazily](https://github.com/refactory-lang/sittir/issues/437) | P2 | Coordinate draft/commit behavior and tree versions. |
| [#436 — Tree inferred options table: tree.inferOptions(), tree_id threading, and engine.fromTree](https://github.com/refactory-lang/sittir/issues/436) | P2 | Define inference options, tree identity and styleFrom contracts. |
| [#406 — Spacing and depth sentinels (Tight/Indent/Dedent) are emitted as KeywordNs with no text](https://github.com/refactory-lang/sittir/issues/406) | P2 | Choose the public sentinel namespace. |
| [#388 — One entry point: createEngine(language) and the language engine surface](https://github.com/refactory-lang/sittir/issues/388) | P2 | Reconcile the largely shipped engine API with remaining file verbs. |
| [#386 — Width setting for rendering: break lists that are too wide (lists only)](https://github.com/refactory-lang/sittir/issues/386) | P2 | Specify safe width-pass seams while preserving byte-identical output when unset. |
| [#384 — Factory preference argument as a projection of __optionsHint__ (retire spellingTypeOf)](https://github.com/refactory-lang/sittir/issues/384) | P2 | Design preference bags after #383. |
| [#383 — Text-valued option sites for spellings (0x/0X, e/E)](https://github.com/refactory-lang/sittir/issues/383) | P2 | Specify text-site spelling preferences. |
| [#381 — Pattern semantics: one parse, tree-sitter's meaning, every guard and type derived from it](https://github.com/refactory-lang/sittir/issues/381) | P2 | Explicitly held pattern semantics; depends on #380. |
| [#380 — Bootstrap: the generator runs sittir's own regex and scm packages from one pinned commit](https://github.com/refactory-lang/sittir/issues/380) | P2 | Explicitly held pinned bootstrap design. |
| [#375 — Decide ir visibility structurally and retire annotations.hoisted](https://github.com/refactory-lang/sittir/issues/375) | P2 | Review the structural census before changing visibility. |
| [#364 — A kind for a repeated slot of hidden terminals (python string_content)](https://github.com/refactory-lang/sittir/issues/364) | P2 | Model hidden-term repetition before retiring Python aliases. |
| [#347 — Design: visible enum kinds as child nodes vs flattened member ids](https://github.com/refactory-lang/sittir/issues/347) | P3 | Explicitly deferred visible enum-child design. |
| [#342 — Model hidden left-recursive rules as the flat list tree-sitter produces](https://github.com/refactory-lang/sittir/issues/342) | P2 | Specify hidden left-recursion parser repetition. |

## Engineering and regression infrastructure

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#631 — Ratchet test: per-grammar ceiling on default-diff differing gaps](https://github.com/refactory-lang/sittir/issues/631) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Define default generated-diff ceilings per grammar. |
| [#603 — Inventory: member kinds are tagged tokens, not prefixed strings](https://github.com/refactory-lang/sittir/issues/603) | P2 | Use tagged token inventory instead of prefix inference, with a byte gate. |
| [#601 — Bindings: each bindings.scm renders back byte-identical through @sittir/scm](https://github.com/refactory-lang/sittir/issues/601) | P2 | Derive bindings for parse/render under a byte gate. |
| [#400 — One internal loader for white-box grammar access in tools](https://github.com/refactory-lang/sittir/issues/400) | P2 | Consolidate tool loading in one typed internal loader. |
| [#392 — rust grammar entry: one remaining type error (variant path '1/0/2' on reference_expression)](https://github.com/refactory-lang/sittir/issues/392) | P2 | Refresh grammar error ceilings; title and historical body counts disagree. |
| [#366 — The predicted kind catalog has no lexicalRank](https://github.com/refactory-lang/sittir/issues/366) | P3 | Measure lexical-rank prediction against parser behavior before expanding it. |
| [#365 — Patch-site credit is owner-level; credit per rule() site](https://github.com/refactory-lang/sittir/issues/365) | P3 | Specify latent patch credit using rule identity. |
| [#354 — Missing detectors behind the rule-reauthored-without-cause floors](https://github.com/refactory-lang/sittir/issues/354) | P2 | Add missing detectors together with diagnostic flooring. |
| [#351 — Baseline left-out gate: compare fixtures by identity, not by sum](https://github.com/refactory-lang/sittir/issues/351) | P2 | Track fixture identity alongside aggregate counts. |
| [#348 — Stamp variantOf on minted variant body roots at mint time](https://github.com/refactory-lang/sittir/issues/348) | P2 | Use approved variantOf mint stamps with byte-identical IR validation. |
| [#343 — Hidden/visible twin kinds are still paired by adding/stripping a leading underscore](https://github.com/refactory-lang/sittir/issues/343) | P2 | Derive underscore relations from one stamped catalog. |
| [#318 — numberShape stays the numeric-shape source: document it and add a bindings-role agreement diagnostic](https://github.com/refactory-lang/sittir/issues/318) | P2 | Preserve accepted number shapes while aligning probes and diagnostics. |
| [#298 — Inventory: full-coverage supertype admission once the bindings claim the remaining subtypes](https://github.com/refactory-lang/sittir/issues/298) | P2 | Claim all subtypes before counting full coverage; do not raise ceilings to hide gaps. |

## Contract questions and latent cases

| Issue | Priority | Disposition / next action |
|---|---|---|
| [#519 — typescript: class_body_member_method_sig.terminator has no default arm](https://github.com/refactory-lang/sittir/issues/519) | P2 | Specify class-method ASI, comma and default behavior. |
| [#408 — A read tree with a MISSING node renders wrong or fails on rebuild](https://github.com/refactory-lang/sittir/issues/408) | P1 | Pin MISSING-node read/rebuild behavior as an explicit contract. |
| [#394 — options: a kind-edge preference on a polymorph leaks onto its arm kinds' own sites](https://github.com/refactory-lang/sittir/issues/394) | P3 | No live polymorphic preference instances are reported; add a synthetic contract case first. |
| [#357 — Trivia: interior gaps for slotless leaves (the merged-literal token split)](https://github.com/refactory-lang/sittir/issues/357) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: No current slotless-gap corpus case is reported; specify token-boundary retention. |
| [#302 — Loose surface: a slot admitting only one of the two boolean kinds types `boolean` but refuses the other value at runtime](https://github.com/refactory-lang/sittir/issues/302) | P3 | No current single-boolean slot case is reported; start with a synthetic pair guard. |
| [#427 — Items carrying trivia don't fold, so a same-order $with canonicalizes their gaps](https://github.com/refactory-lang/sittir/issues/427) | Deferred | Deferred for now at the maintainer's request (trivia scope). Resume with: Specify parsed trivia folding and source gaps together with #582 and #568. |
| [#486 — regex: `lazy` has a factory but no model slot reaches it](https://github.com/refactory-lang/sittir/issues/486) | P3 | Specify the public surface for lazy dead-kind choices. |
