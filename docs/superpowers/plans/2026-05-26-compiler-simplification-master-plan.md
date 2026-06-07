# Compiler-Simplification — Master Plan (execution index)

> **For agentic workers:** This is the **orchestration index** above the per-PR plans. It does NOT
> restate the design — the spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`
> §5 owns the *why* and the per-PR change-set. This doc owns the **execution view**: dependency graph,
> concurrency waves, branch names, status, and the last gate result per PR. Each PR gets its own
> bite-sized plan (via superpowers:writing-plans) when it's picked up; execute it via
> superpowers:subagent-driven-development.

**Goal:** Execute the 16 pending PRs of the compiler-simplification strangler without regressing native pass-rates, tracking dependencies + safe concurrency across sessions.

**Architecture:** Strangler — build the Model beside the old pipeline, migrate one concern per PR, gate every step on `pnpm validate:native`. Each PR removes the code it supersedes within the same PR.

**Source of truth:** spec §5 (PR change-sets), §7 (end-state inventory). This index is derived from them.

---

## Execution rules (apply to every PR)

- **Branch off `origin/master`, NOT off `029`.** `029` was reset-to-`origin/master` + re-cherry-picked twice already, dropping committed work. Implementation PRs must not ride a churning feature branch. (The spec/plans docs themselves live on `029` per the user; *code* PRs branch off master.)
- **Gate: `pnpm validate:native`** for all 3 grammars — NOT raw `counts --backend native` (a stale `.node` silently falls back to the TS path and masks regressions; `validate:native` rebuilds first). See `project_native_build_and_staleness`.
- **Rust-emitting PRs also run an independent `cargo check --workspace --features napi-bindings` + re-count** — the SubagentStop gate no-ops after a regen, so cargo-verify is a manual step (`feedback_verify_cargo_not_gate`). Rust-emitting set: **PR-D, PR-E, PR-I, PR-M, PR-P, PR-Q**.
- **Symbol renames / non-trivial structural refactors → execute via the copilot CLI** (it has LSP read/WRITE; Claude Code's LSP is effectively read-only). Prep the target skeleton, then let copilot run the LSP rename-symbol / move-file — NOT hand text-edits (which miss re-exports, aliased imports, JSDoc `{@link}`, type-only imports). Rename-heavy PRs: **PR-B** (`AssembledNonterminal` interface→class), **PR-H** (`optimize.ts`→`normalize.ts` + the `#14` method renames), **PR-P** (`node`→`kind`). See `feedback_use_ts_lsp_for_moves`.
- **Baseline (2026-05-25, re-measure at each PR start):** the headline is `origin/master`-accurate — **rust cov 181/186 · read-render-parse 134/136 · ast 125 · python 107/110 · 96/115 · ast 74 · ts 174/182 · 82/111 · ast 75**. If the implementation base carries 029's applied `type_arguments`/`type_parameters` groups (`fc7c77de`), rust is `182/186 · ast 126`. **PR-A's Task 0 settles this empirically** before any code change.

---

## PR index + status

| PR | Concern (1-liner — see §5) | Depends-on | Wave | Rust? | Branch | Status |
|----|----------------------------|-----------|:----:|:-----:|--------|--------|
| ~~PR3~~ | Delete legacy render walker | — | — | — | — | ✅ DONE (#36 `ee3d7a0b`) |
| ~~PR-A0~~ | Normalize losslessness fix | — | — | — | — | ✅ DONE (#36 `c38ffbf1`/`a91927c6`) |
| **PR-A** | Reconcile `_new` naming → 0-diff WIDE probe | PR-A0 | 0 | no | `pr-a-reconcile-new-naming` | ✅ DONE (#40) |
| **PR-B** | `AssembledNonterminal`→class; `kind`/`parseKind` refs; `sourceRuleIds` | A | 1 | no | `pr-b-assembled-nonterminal-class` | ✅ DONE (#41) |
| **PR-C** | Eliminate `origin` + slot `aliasSources` → `value.parseKind`/`isUnnamed`; + §4d.1 non-injective-`parseKind` pass | B | 2 | no | `pr-c-eliminate-origin-aliassources` | ✅ DONE (#43; +#44 unified-CLI merged in) |
| **PR-D** | wrap reads class; delete `SlotModel`; `$children`→`$other` (codegen+rust) | C | 3 | **yes** | `pr-d-wrap-reads-class` | ✅ DONE (#45; `$with` variadic deferred to final type-pass) |
| **PR-D2** | Helper-name leak fix (H2 probe → 0) | D | 4 | no | `pr-d2-helper-name-leak` | ✅ DONE (#46; leak 6→0) |
| **PR-E** | ~~transport+render read class; delete 2 band-aids; delete `bridge.rs`~~ **RE-SCOPED** (premises false; `project_pr_e_spec_premises_false`): read-class already wired (FOLD-1 present); `bridge.rs` → PR-E2; band-aids → cleanup | D2, B (A) | 5 | — | `pr-e-bandaid-cleanup` | ✅ DONE (cleanup: delete dead band-aid 1 + RELABEL load-bearing band-aid 2; byte-neutral) |
| **PR-E2** | sunset deprecated `bridge.rs` NodeData render path (split from PR-E) | E (impl) | 5 | **yes** | `pr-e2-bridge-render-sunset` | ✅ DONE (#48; −8.8K dead lines; cargo test parity gate) |
| **PR-F** | factory + from + types read class | B (D for `$with` gate) | 5 | no | `pr-f-factory-from-types-class` | ✅ DONE (#47; render-neutral storageKey getter) |
| **PR-G** | Diagnostics severity model + Assemble→Project gate (additive) | — (≺ H, L) | 1‖ | no | `pr-g-diagnostics-gate` | ✅ DONE (#50; inert gate, `severity:'fail'` + `assertEmittable`) |
| ~~PRK~~ | Eliminate cached `patternReplacementKinds` → structural `deriveComplexAliasTargetHidden` | E | — | no | `pr-prk-eliminate` | ✅ DONE (#51; byte-neutral) |
| **PR-H** | Phase rename `optimize.ts`→`normalize.ts`; `transforms.ts`; ctx; node-behavior→class | G | 6 | no | `pr-h-phase-rename` | ✅ DONE (#54; rename via @lspeasy/cli; op-body relocation → PR-O M1) |
| **PR-M** | Sittir-invention rule-IR cut + `AssembledPolymorph`→`AssembledBranch` | core (B); **≺ I** | 7 | **yes** | `pr-m-rule-ir-cut` | 🚧 φ1 spiked (#57); **A1 byte-neutral model excision shipped (#59)** — §φ1/§φ2 |
| **PR-M-φ2** | **§C/§D group-hoisting**: hoist `optional(seq(STRING,FIELD))` clauses + the wire-twin-less `classifyHiddenSeqRule` hidden-seqs into REAL wire groups (kindId-bearing), THEN cut `ClauseRule`+`detectClause` (§C) + the `GroupRule` classifier (§D). | M-A1 (#59) | 7 | **yes** | `pr-m2b-group-hoisting` | ✅ FUNCTIONALLY DONE — §C cut shipped #61; §D-2a core landed (`8577cdf6`/`9da520aa`), Task 5/7 obviated (`cbda5581`); 2b/2c→PR-L. See §φ2 + §D-2a DONE note |
| **PR-I** | General choice-slot→factory submethods + `$variant` removal | **M** | 8 | **yes** | `pr-i-choice-slot-submethods` | 🚧 **φ1 spiked** (#57) — see §φ1 note |
| **PR-I-φ2** | remaining polymorph kinds→branches + submethods; **match_arm residual** (§φ1 note) | **M-φ2** | 8 | **yes** | `pr-i2-choice-slot-submethods-phase2` | ⬜ |
| **PR-K** | `factory-map.json5`→`node-model.json5` + elevate/relabel surfacing | I/M | 9 | no | `pr-k-node-model-registration` | ⬜ |
| **PR-N** | enrich-widening — name easy positional symbols | — (enrich-side; ≺ L) | ‖ | no | `pr-n-enrich-widening` | ⬜ |
| **PR-O** | **(a)** Structural de-dup M1/MO2/P1 — *non-behavioral* · **(b) `separator-canonical` — _BEHAVIORAL sub-item, own gate_:** **defer separator-lift to `applyWrapperDeletion`** (the push-down phase) — stop the eager evaluate-side `extractRepeatSeparator` flatten, lift the separator **once** at push-down as a **single `Rule`** (choice preserved, non-lossy); emit a **`warning`** (NOT `propose-*` — no handling path yet) at that one site for multi / non-terminal (choice) separators; render gated on the EXISTING **`separator`-role child-slot** design (`2026-05-26-non-slot-separator-rules-design.md`), NOT a new non-slot-variables model. spec `2026-05-30-separator-canonical-design.md` | B, **H** (sub-b) | ‖ | no | `pr-o-structural-dedup` | 🚧 **M1 partial** (`pr-o-m1-descatter-transforms`): 4/8 shared ops de-scattered into `transforms.ts` byte-neutral — `combineMultiplicity`, `findRepeatFlag`, `extractRepeatShape`, `pushAttrsToLeaves` (regen byte-identical, tsgo 0-new). **4 DEFERRED (cycle hazard):** `collapseSeq`/`inlineRefs`/`canonicalizeSeqOfLeaves` (simplify.ts) + `deleteWrapper` (wrapper-deletion.ts) are thin public wrappers over PRIVATE recursive helpers that stay in-file (`simplifyRule`/`recurseChildren`/`reapplyInlinedLeafAttrs`/`deleteWrapperWith`); moving the wrapper forces `transforms.ts→origin` while `origin→transforms.ts` holds. Completing needs the helper clusters moved too (deeper cycle risk) — own follow-up. **MO2** mooted by PR-P (TerminalValue gone). **P1** done #59. **(b) separator-canonical** ⬜. |
| **PR-P** | Terminal + flat Enum → predicates; + `TerminalValue`→`NodeRef` value unification (fixes terminal→`content`) | H (rename) | 10 | **yes** | `pr-p-terminal-enum-predicates` | ✅ VALUE-MODEL CUT DONE — `EnumRule`/`TerminalRule` cut (#65: `9b5f0621`/`3996b317`); `TerminalValue`→`NodeRef` fold (`pr-p-task3-…`: step1 `e35cb537`, step2a `d070044b` byte-identical, step3 `8a9a0982`). All HOLD 111/69/74. `node`→`kind` rename DEFERRED (kept `value` on `NodeRef` → rationale moot). `content` source-fix had **no target** (no pure-single-literal `content` slot exists). **FOLLOW-ON (PR-P2):** remove optional/repeat-literal field-hoisting — the fold lets ~200 `_marker` slots become direct literal `NodeRef` slots; preserve the ~10 ts `_kw_` LR-precedence cases. Grammar-affecting → own probe-first gated PR. |
| **PR-Q** | Enum recursive-widening (count-gated) | **P** | 11 | **yes** | `pr-q-enum-recursive-widening` | ⬜ NOT subsumed (corrected). The ts `predefined_type` flat case was banked by PR-P, BUT a SYMBOL-RESOLVING recursive `isEnumChoiceRule` (a member is enum-compatible if it's a STRING, a link-literal symbol, or a SYMBOL whose target rule is recursively enum) finds **~9 real targets** the flat predicate misses: rust **5** (`binary_expression`, `pointer_type`), ts **3** (`_reserved_identifier`, `import_statement`, `_index_signature_optional1`), py **1** (`_comparison_operator_comparator`). Inline-only recursion finds just 2 — the rest need CROSS-RULE symbol resolution (thread the rules map into classification, or pre-inline enum-symbols before assemble). Count-gated: reclassifying these (currently operator-fields/branches) to enums may improve or regress AST — implement + gate. |
| **PR-L** | Flip heuristics → `propose-*` fail-diagnostics (LAST) | M, I, N, G | 12 | no | `pr-l-heuristics-to-fail` | ⬜ |

**Authoritative linear order (spec §5):** A → B → C → D → D2 → E → F → G → H → M → I → K → N → O → P → Q → L.

### §φ1 note — de-polymorph spike (#57, 2026-06-02, branch `pr-i-polymorph-emit-rewrite`)

A combined PR-M+PR-I **φ1 spike** landed ahead of the formal M→I sequencing. **HONEST FRAMING (corrected 2026-06-02): vs the carry-forward baseline `rust 125 / ts 72 / py 76` (which held through PR-A→PR-H), the spike NET-REGRESSED master to `rust 111 / ts 69 / py 74` = −14 / −3 / −2.** The "+11" cited during the work was against the cut's *internal* low-point (rust 100 after the reclassification cut), NOT the baseline — the spike traded count for the architectural de-polymorph, with the count **recovery deferred to PR-I-φ2** (the match_arm + pattern + structural residuals). The byte-neutral **A1 model excision shipped #59**; the recovery to ≥125 is still owed.

- **Landed:** the de-polymorph cut (`applyOverridePolymorphs` reclassification removed) + classifier fix (named-aliases→branch, not supertype-erasable / `multi`; `parentAliasedKinds`); `AssembledPolymorph`→`AssembledBranch` mechanism; `reference_expression` / `impl_item` → clean alias-owned branches; **token_tree visible-alias parseKind union** — one deep-walk `collectAliasedByParents` yields both the classifier guard and the visible→visible alias-target map (`token_tree.content` accepts `delim_token_tree_*`), **parseKinds as the single source, NO `aliasSources` sidecar**; `match_block` `last_arm` field (the "multiple unnamed children in sequence" case).
- **Deferred → PR-M-φ2 / PR-I-φ2:** the formal rule-IR cut + `$variant`-machinery removal; remaining polymorph kinds→branches; and the **`match_arm` residual (6 fixtures)**: a render `childCount 4 ≠ 3` over-emission **and** content-undefined on complex arm bodies. Likely structural fix = move slot **normalization/throw into the lazy wrap getter, not the eager `storeExpr`** (`packages/codegen/src/emitters/wrap.ts:384`) — confirmed `drillAs` already kind-maps `match_arm`→`last_match_arm` at the getter, but eager construction throws first. Also specced: a **slot-collision diagnostic** (any seq/nested-seq where a `storageName` appears >1 — kinds aliased to each other, named or unnamed) run **during assemble after folding is turned off** (`foldParseKindDuplicateSingularSlots` is the band-aid it would supersede).
- **Up-next is a genuine choice, not forced:** PR-M is **not blocked** (its only dep, PR-B, is ✅ DONE; φ1 already landed its mechanism). So either **PR-M-φ2** (finish the polymorph chain) **or PR-P** (off-chain — depends only on PR-H ✅, unblocks the keyword-valued slots) can go next. Decision pending.

### §φ2 note — A1 shipped (#59) + §C/§D recast as group-hoisting (2026-06-02)

**A1 (byte-neutral polymorph MODEL/IR excision) shipped #59** — Task 0 proved 0 `PolymorphRule`/`AssembledPolymorph` constructions, so A1 was pure dead-code deletion: dead polymorph fns gone, Codex **P1 resolved** (`@ts-expect-error` removed; `AssembledPolymorph` a documented dead shell), `VariantRule` **kept** (live — variant registration), registration/wire untouched (variant kinds intact). **rust 111 / ts 69 / py 74 unchanged.** Also in #59: the `SITTIR_NATIVE_DEBUG=1` debug-build switch (gate time minutes→seconds) + native-LSP-for-reads / lspeasy-for-writes agent-def clarification.

**§C and §D recast: NOT simple deletions — they are GROUP-HOISTING.** A2 empirically proved (`pr-m2-rule-ir-cut-phase2`, reverted) that deleting `detectClause` **unconditionalizes co-optional keywords** (`:` / `->` / `for` / `=` / `::`) → 6+ rust templates broke → native validator **segfault (139)**. Root cause: `detectClause` wraps the whole `optional(seq(STRING, FIELD))` in ONE `{% if slot | isPresent %}…{% endif %}`, gating BOTH the field AND its co-optional literal; `wrapper-deletion.ts` deliberately does NOT push `optional` onto string literals (would drop the keyword), so without `detectClause` the literal emits unconditionally. The plan's old §C pre-check ("single-field clauses → no change") was **wrong** — every clause carries a co-optional literal.

**The fix (unifies §C + §D):** both are `optional(seq(…))` / hidden-seqs that should be **real wire-synthesized groups** with kindIds (not the sittir-invented `ClauseRule` / classifier `GroupRule`). Extend `applyAutoGroups` (`dsl/wire/auto-groups.ts`) to hoist them into groups — the optional GROUP is then the gating unit (keyword + field emit together or not at all) — **then** `ClauseRule`+`detectClause` and the `GroupRule` classifier delete cleanly. That is the actual "rule-IR cut." This is **PR-M-φ2** (`pr-m2b-group-hoisting`).

**Latent type-debt surfaced by the now-working native LSP** (fixed `typescript-lsp` `.lsp.json`): a dead `PolymorphRule` in the `AssembledBranch` constraint (fixed #59) + 6 `[6133]` unused-fn warnings (deferred dead-code pass). Argues for adding `tsgo --noEmit` to the gate so tsx-invisible type danglers are caught.

**§D RESOLVED (2026-06-04) — NOT "delete the `GroupRule` classifier cleanly" (that claim was empirically false: `classifyHiddenSeqRule` is the sole producer of 96 AssembledGroups).** The cut is a **classifier *sharpening* + alias-reference model**, spec: `docs/superpowers/specs/2026-06-04-rule-ir-model-simplification.md`. Three parts: **(2a)** `AssembledGroup ≡ Branch + inline` (inline = not-a-parse-kind); delete the opaque `seq+has-fields` heuristic; the 63 `_`-NOT-inline groups → `AssembledBranch` (render-neutral), the 34 inline → stay `Group`. **(2b)** alias-coerced kinds become two nodes (hidden body + visible Branch) with back-pointers — hidden `contentAliasedTo[]: kindId[]` (fan-out OK), Branch `contentAliasedFrom: kindId` (single by invariant); emit de-dups via the reference (non-lossy, not coalesce). **(2c)** `contentAliasedFrom` fan-in >1 → error diagnostic. §D-2a lands now (closes M-φ2 §D core); 2b/2c + the §slot-naming + source-retirement threads → PR-L.

**§D-2a DONE (2026-06-06) — M-φ2 §D core CLOSED.** Tasks 1/2/4 landed on master (`8577cdf6` Task 1 `computeKeepRef`+provenance+diagnostic-maps; `9da520aa` Task 4 normalize fixpoint hoist; Task 2 `diagnose-content-alias-injectivity`). RELEASE gate holds at floor **rust 111 / ts 69 / py 74**. **Tasks 5+7 (narrow/delete the simplify wash) are OBVIATED — empirically refuted** (`d2a-normalize-inline` @ `cbda5581`): the wash is LOAD-BEARING — it uniquely folds ~15 kinds the normalize hoist deliberately skips (array-multiplicity / keepRef-twin / fielded / multi-helper / `_import_list`); `spliceFoldableRefs` gates (normalize.ts:221/229 + keepRef) hand those off BY DESIGN, so normalize + wash fold **disjoint sets**, not double-derivation. Narrowing the wash would regress ~15 folds. Residual = a benign 3-kind idempotent overlap (`_use_wildcard_clause`/`_for_header`/`_except_clause_as_optional1`), deferrable. **§C (ClauseRule cut) shipped #61.** → **PR-M-φ2 is functionally complete**; 2b/2c remain in PR-L as planned.

---

### §slot-naming note — kill "structural" choice naming + diagnostic-gate the merge (2026-06-04 followup; lands in/with PR-L)

Surfaced while stopgapping two render bugs via manual overrides: `visibility_modifier` `pub(crate)` → `pub ( )` (rust `in_path` group lift) + `except_clause` `except E:` → `except E as:` (python `_except_clause_as` hoist, `c63f817b`). The opaque **"structural vs non-structural choice"** distinction in `collect-slots.ts` (`isStructuralChoice`) is the wrong abstraction — its **first-arm-name fallback** named an unnamed choice after its FIRST arm (`self`), so every other arm dropped. Replace it with one rule set:

1. **Naming.** A choice has no single kind to name it after → slot = **`content`**, always (never the first arm). A *derivable* name — a kind-name, or a field-name shared by every arm (catch_clause's `parameter`) — → use it.
2. **Collision → diagnostic, symmetric.** `content`-collision is ALREADY diagnosed (`diagnose-slot-grouping.ts §4c`, counted *before* `mergeByName` masks it). Add the mirror: a derived (kind/shared) name that collides un-mergeably → the same `propose-promotion` diagnostic. No silent rename either way.
3. **The merge is lossy → diagnostic-gate it.** `mergeByName`/`mergeChoiceArms` (`collect-slots.ts:~192/~218`) keep only `values` + boolean `hasLeading/hasTrailing` + `sourceRuleIds` — they DISCARD the per-arm **surrounding artifacts** (the actual literals/separators each slot sat behind; e.g. `param ,` vs `param ;` collapse to one `param` with just `hasTrailing:true`). When folded arms differ in surrounding, that lost difference IS the variant signal — the merge silently turns "should be a polymorph/promotion" into one flat slot. Gate the fold on surrounding-equivalence: **equal surrounding → merge; differing → emit the diagnostic** (a masked variant). Refinements (design authority): the merge (a) is **limited to choice arms** (not within-seq duplicate-field collapse), (b) fires **only when the arms are truly single-slot after simplification**, and (c) **belongs in `simplify`, not `collect-slots`**.

Net: delete the `structural` flag + first-arm fallback; one naming rule (`content` else derivable); one collision rule (un-mergeable → diagnose); the merge moves to `simplify`, narrows to single-slot choice arms, and diagnoses on surrounding-difference. Subsumes the §φ1 "slot-collision diagnostic run after folding is turned off" idea + the `foldParseKindDuplicateSingularSlots` band-aid. Sites: `collect-slots.ts` (`isStructuralChoice`, `mergeByName`, `mergeChoiceArms`), `simplify.ts` (new merge home), `diagnose-slot-grouping.ts` (named-collision mirror). The manual `in_path` lift + `_except_clause_as` hoist are the **stopgap** until enrich/this followup automate it.

---

### §separator-trailing note — `optional(sep)` → static `trailing` loses per-instance presence on render (2026-06-05 followup; size with PR-O `separator-canonical`)

Surfaced relocating the separator-lift to a `link` pass (branch `pr-n-separator-lift-to-link`). The lift is a clean no-op over every constructor-lifted form, but in `link` it also reaches the **enrich-injected** `_argument_list_optional1` group — which the evaluate `seq()`/`repeat()` constructors structurally never touch (enrich injects it as a raw rule object *after* construction). Lifting it to the canonical `repeat1{ separator:",", trailing:true }` regressed python deep-AST **−2**. Confirmed via `tool probe-kind --grammar python --kind argument_list --reparse`:

| source | rendered | result |
|---|---|---|
| `f(x, y)`  | `(x,y)`  | ✓ reparses clean |
| `f(x, y,)` | `(x,y)`  | ✗ **trailing comma dropped** → reparse loses the `,` node → AST mismatch |

**Root.** The lift folds a trailing `optional(sep)` **member** into the static **`trailing: true`** attribute. As a member, the trailing separator is renderable per-instance (the walker emits it iff the child is present). As an attribute, `trailing: true` is type-level only — "a trailing sep is *permitted*" — and carries no per-instance "did *this* node have one"; render therefore falls back to never-emit and drops every trailing separator. Lossless for the parser, lossy for render.

**The model split** separator-normalization must make (lands with PR-O `separator-canonical` / `2026-05-30-separator-canonical-design.md`):

1. **Mandatory trailing** (the list always ends with a separator) → static `trailing: true` is honest; render **always emits** it. (This is the "if `trailing` is static, render should always print it" contract — correct *here*.)
2. **Optional trailing** (`optional(sep)`, may be absent per-instance — `argument_list`, ts `object_type`) → a static flag is the WRONG shape. `trailing: true` ≠ "optional trailing"; conflating them is the bug. Needs a **per-instance `trailing_sep` signal** transported read → wrap → render (the pending `render-module` hardcoded-trailing gap; see [[project_object_type_rewrite_and_native_list_gaps]]). Always-emit does NOT fix it — it would just flip the breakage onto the no-trailing instances.

**Until this lands**, the `link` separator-lift must stay **gate-neutral**: leave enrich-injected groups (whose trailing is optional) **un-lifted**, so the trailing separator stays a renderable `optional(sep)` member. The relocation mechanism (`compiler/lift-separators.ts`, idempotent over constructor-lifted forms; consumes the shared `dsl/list-patterns.ts` detectors) is already in place — only the *expanded coverage* of enrich groups waits on this. Also reconcile lift LOCATION: this note + the casing/lift memory put the lift in `link` (pre-push-down); PR-O's `separator-canonical` row says `applyWrapperDeletion` (the push-down itself) — pick one before PR-O executes.

---

## Dependency graph + waves

```
PR-A ──▶ PR-B ──▶ PR-C ──▶ PR-D ──▶ PR-D2 ──┬──▶ PR-E ─┐
                            (core, load-bearing)        ├──▶ PR-H ──▶ PR-M ──▶ PR-I ──▶ PR-K ─┐
                            └─────────────────┴──▶ PR-F ─┘                                     ├──▶ PR-L
PR-G ──────────────────────────────────────────────▶ (feeds PR-H ctx) ─────────────────────────┤   (LAST)
PR-N ──────────────────────────────────────────────────────────────────────────────────────────┘
PR-P ──▶ PR-Q   (after PR-H rename; off the polymorph chain)
PR-O            (non-behavioral; after PR-B value model + PR-H transforms.ts)
```

- **Critical path:** `A → B → C → D → D2 → {E,F} → H → M → I → (K) → L`. This is the spine; everything else hangs off it.
- **PR-M ≺ PR-I is a hard gate** (M restructures the Model into `AssembledBranch`; I is the emitter rewrite that consumes it).
- **PR-Q ≺ requires PR-P** (P establishes the flat enum predicate; Q switches it to recursive).
- **PR-L is strictly last** — it depends on M/I (the retype removal + discriminating-slot model), N (residue shrink), and G (the gate).

---

## Concurrency annotation — graph for planning, conservative on execution

The linear order over-serializes. The graph reveals genuine independence — but **physical parallelism is only safe where PRs touch disjoint files AND can be gated independently**, because `validate:native` is a *global* gate (regen rebuilds the whole `.node`), so two concurrent PRs touching the model/emitters make a regression impossible to attribute. Each PR below is flagged for whether it's truly disjoint.

**Safe to run in parallel:**
1. **PR-G alongside the `A→B→C→D` core.** Additive infrastructure — new files `compiler/diagnostics.ts` + `compiler/emit-gate.ts` + one wire-in to `generate.ts`; no severity is `fail` until PR-L. File-disjoint from the naming/emitter core. (Constraint: must land before PR-H, which threads G's sink into the contexts.)
2. **PR-E ‖ PR-F** (wave 5). Disjoint emitter file-sets — E = transport-projection + render-module (+ `bridge.rs` delete); F = factory + from + types. Both read the same slot-class getters (built by B/C/D) but write different outputs; each gates on counts independently. The clearest concurrent pair.

**Parallel-with-caution (off critical path, but re-gate carefully):**
3. **PR-N (enrich-widening)** is enrich/wire-side and independent of the emitter chain, but it *changes which slots are named* (shrinks the `inferred` set), which ripples into the model + counts. Can overlap the `M→I→K` chain on its own branch, but re-measure on rebase.

**Keep serial (high file-overlap despite logical independence):**
4. **PR-O** has two halves with different risk: **(a)** structural de-dup (`M1`/`MO2`/`P1`) is *non-behavioral*, but `MO2` edits `NodeRef`/`TerminalValue` in `node-map.ts` and `M1` relocates shared transforms into `transforms.ts` — both heavily touched by the core + PR-H. **(b)** `separator-canonical` is **behavioral** — it relocates separator-lift out of evaluate's `extractRepeatSeparator` into `applyWrapperDeletion` (push-down) and assigns the separator as a single `Rule`; this can shift rendered bytes, so it carries its **own** gate (`validate:native` hold + generated byte-diff classified, not assumed empty) separate from the non-behavioral half. Both halves run *after* the value model (B) and, for (b), **after PR-H** settles `normalize.ts`/`transforms.ts` (the phase that owns `applyWrapperDeletion`). Serial, to avoid churn conflicts.
5. **PR-P → PR-Q** are sequential and rust-emitting; keep them serial and off the polymorph chain (they only need PR-H's `optimize.ts`→`normalize.ts` rename to have landed).
   - **PR-P `TerminalValue`→`NodeRef` mechanism (2026-06-01, found during PR-I de-polymorph):** implement the promotion **in enrich** — replace a bare-string literal `'X'` with `$.X` when `X` is a real named keyword kind (kind name == the literal, e.g. `'self'`/`'crate'`/`'super'`). That turns the slot value from a `TerminalValue` (`{kind:'terminal', value:'self'}`) into a `NodeRef` to the `AssembledKeyword`, so the render resolves the kind and **hoists kindId→text** (a terminal slot has no hoist path). Pairs with a **sittir-core read change** (`rust/crates/sittir-core/src/read_node.rs::read_materialized_leaf` + `types.rs::scalar_leaf_value`): a leaf whose **`node.text == node.kind()`** (fixed-text keyword) sends its **kindId**, not its text — uniform with the existing unnamed-token path.
   - **This UNBLOCKS PR-I's keyword-valued slots.** Under the de-polymorph, keyword content slots (`visibility_modifier`, `class_heritage`, py `with_clause`) render-error ("$type property missing") because the keyword arrives as untagged text into a kindId-dispatch slot. PR-P's promotion + the sittir-core read rule fix them. **Order:** the sittir-core read rule **alone** regresses ~7 rust kinds (e.g. `self_parameter`'s `&self`→`self`) because their keyword slot is still a terminal — so the enrich promotion and the read rule must land **together** (the read rule is **blocked on PR-P**, not standalone). `KindId::Display` is the numeric id and `scalar_kind_leaf` text-stamps it, so the hoist must come from the node-ref's `AssembledKeyword.text`, not the generic scalar path.
   - **Implementation layer + REMAINING GAP (2026-06-01, attempted then reverted).** The demotion is actually in **`collectSlots`/`deriveValuesForRule` (`node-map.ts` ~L1218, the `string` case)** — simplify inlines a single-literal keyword (`_self` → its `STRING 'self'` body) down to a bare `string` Rule, which `deriveValuesForRule` emits as a `TerminalValue`. The intended fix splits that case (a string whose literal resolves to a **named** kind, `anon !== true` → `NodeRef`; anonymous-token literals + patterns stay terminal). **But the split alone does NOT fire** — `findGeneratedKindEntry(kindEntries, 'self')` returns **undefined** there (the assemble `self` slot carries **no `resolvedKind`**), so the keyword literal never resolves to its kind. **So PR-P must FIRST close that `kindEntries`-resolution gap** (the `'self'`/`_self` literal → kindId lookup at collectSlots time) before the `string→NodeRef` split can promote anything. Attempted (sittir-core read rule + the case-split) and reverted: case-split = inert (the gap), read-rule-alone = −7. This is a real two-part PR-P task, not a quick patch — do it as its own focused effort off the de-polymorph branch.

**Net:** at most ~2 active branches at once is realistic and safe (e.g. core-spine + PR-G early; then E ‖ F). Don't fan out wider — the global gate and shared `node-map.ts`/emitter surface make broader parallelism net-negative.

---

## How to advance this plan

1. Pick the next ⬜ PR whose `depends-on` are all ✅.
2. Branch `<branch-name>` off `origin/master`; write its per-PR plan (`docs/superpowers/plans/YYYY-MM-DD-<pr>.md`) via writing-plans.
3. Execute via subagent-driven-development; gate on `pnpm validate:native` (+ cargo-verify if rust-emitting).
4. On merge: update this row's Status to ✅ + record the last gate numbers, and link the per-PR plan.

**Done so far:** PR-A (#40) → PR-B (#41) → PR-C (#43, +#44 unified-CLI) → **PR-D (#45)** → **PR-D2 (#46)** → **PR-F (#47)** → **PR-E2 (#48)** → **PR-G (#50)** → **PRK (#51, `patternReplacementKinds` elimination)** → **PR-H (#54, phase rename + ctx + node-behavior→class)** all merged, + the **PR-E band-aid cleanup** (delete dead band-aid 1, relabel load-bearing band-aid 2; byte-neutral). The `$with` variadic criterion is **deferred** to the single end-of-plan type-error cleanup pass (generated-code type errors are not gated mid-plan — `validate:native` render/parse is the gate). Gate held at **rust ast 125 · ts ast 72 · python ast 76** through all of it.

**PR-E learning (`project_pr_e_spec_premises_false`):** PR-E's original row ("read class + delete 2 band-aids + delete bridge.rs") was **false on every premise** — read-class was already wired (FOLD-1 present), band-aid 2 is **load-bearing** (removing it regresses `type_arguments` jinja), and `bridge.rs` had a **live caller** (a coordinated sunset, not dead-code delete). It dissolved into: PR-E2 (bridge sunset, done) + the band-aid cleanup (done) + nothing for "read class" (already done). **Lesson: isolation-test "this is removable" claims (delete→regen→diff), never trust a static probe or a "temporary"/"band-aid" comment.**

**Up next: PR-M** (`pr-m-rule-ir-cut` — Sittir-invention rule-IR cut + `AssembledPolymorph`→`AssembledBranch`; rust-emitting; hard gate ≺ PR-I). PR-H merged (#54): transforms.ts ctx + `(target,ctx)` threading, parameterless getter (cascade-preserving), markUserFacing merge (M3), and the `optimize`→`normalizeGrammar` / `optimize.ts`→`normalize.ts` rename (executed via the new @lspeasy/cli LSP-refactor CLI; cross-package importers in `packages/tools` fixed by hand). Deferred from PR-H: shared-op relocation into `transforms.ts` → **PR-O M1**; the cosmetic `optimize()`-in-comments sweep. Then the spine resumes **PR-M → PR-I → PR-K → … → PR-L**. Baseline to carry forward: **rust ast 125 · ts ast 72 · python ast 76** (native, deep read-render-parse).
