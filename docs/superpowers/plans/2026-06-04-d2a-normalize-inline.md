# Plan: §D-2a — Relocate group-inline to a normalize rule-tree hoist

> **For agentic workers:** execute via `sittir-codegen`, gating on RELEASE `validate:native` after every task. Spec: `docs/superpowers/specs/2026-06-04-rule-ir-model-simplification.md` (§D). Steps use `- [ ]`.

**Goal:** move group-inlining from the late `simplify.ts:893` slot-wash to a **rule-tree hoist at normalize** (after wrapper-pushdown, in a fixpoint loop) so render + slot projections both see the inlined form; keep `keepRef` twins' body ref as `storageKind`; close the bulk of M-φ2 §D. Render-NEUTRAL. **Scope (2026-06-04 decision):** folds 10/11 groups now; the 11th (`_import_list`) + its per-instance `trailing_sep` prerequisite are DEFERRED to the follow-up section (risky cross-language transport rework, gates only 1/11). Task 5 narrows — does not remove — the wash so `_import_list` stays correct meanwhile.

**Gate:** RELEASE deep-AST `read-render-parseAstMatchPass` = **rust 111 / ts 69 / py 74** (`env -u SITTIR_NATIVE_DEBUG pnpm validate:native`). HOLD-or-IMPROVE after every task.

---

## Seam pin (all read from source, high confidence)
- **Normalize fixpoint seam:** `normalize.ts:114` (`applyWrapperDeletion(rules)`, right after `applyNormalizationPasses:113`). Repeat-pushdown is guaranteed done here (`wrapper-deletion.ts:87/110` push array-multiplicity+separator onto leaves), so the `seq`-shape test is reliable.
- **Hoist:** splice via `replaceSymbolRef` (`normalize.ts:489`) + re-stamp via `reapplyInlinedLeafAttrs` (`simplify.ts:958`).
- **Inline-eligibility guard (bounds fold set to 11):** `resolveGroupOrMultiInlineTarget` (`simplify.ts:992`).
- **`storageKind` already = hidden body:** `storageKindOfValue` (`node-map.ts:941`) returns the resolved node-ref kind; keeping `symbol(_x)` (not redirecting to twin) yields `_x` as storageKind, twin stays `parseKind` (`node-map.ts:969`).
- **`keepRef` is structural, by rule traversal (NOT from any map):** behavior derives ONLY from the rule tree (`feedback_metadata_not_behavior`). `keepRef(_x) = refcount(_x) > 1 || hasVisibleTwin(_x)` where `refcount(_x)` = number of `symbol($._x)` references across all rule bodies, and `hasVisibleTwin(_x)` = a parse-kind rule exists whose body is/contains `symbol($._x)` (e.g. `call_signature` ⇒ keep `_call_signature`). The two were previously expressed (wrongly) as enrich `alias($._name,$.name)` — those nodes DO NOT exist in any grammar (0 on rust/ts/py), so the alias maps below are EMPTY and must not gate folding.
- **Alias maps are DIAGNOSTIC-ONLY:** populate `contentAliasedTo`/`contentAliasedFrom` in `mintContentAliasKinds` (`link.ts:650`), thread on `LinkedGrammar` beside `visibleAliasTargets` (`link.ts:248/596`) — consumed ONLY by the Task 2 §D-2c non-injective check. NOTHING in the fold path reads them.
- **Wash to remove:** `simplify.ts:893` (`inlineKinds.has`) + `:944` (`source==='group-lift'` bail).
- **`metadata.inlinedFrom`:** add `readonly metadata?: { source?: RuleSource; inlinedFrom?: string }` to `RuleBase` (`rule.ts:~74`); replaces the `as unknown as Rule` cast (`enrich.ts:1668`) + the deprecated top-level `source:'group-lift'` (`rule.ts:349`).
- **`_import_list` trailing-sep fix:** `render-module.ts:941` hardcodes `trailing_sep: false` (struct field `:930`, merge `:560`).

Fold set = **11 groups** (rust 2, ts 7, py 2): rust `_use_wildcard_clause`, `_visibility_modifier_pub_parens`; ts `_call_signature`, `_extends_clause_single`, `_for_header`, `_from_clause`, `_initializer`, `_module`, `_parameter_name`; py `_key_value_pattern`, `_import_list`. The bare ts cycle member `_extends_clause_single` inlines → struct edge vanishes → **ts `Box` cycle gone, no `scc.ts` surgery**. Aliased twins (`_call_signature`, `_module`) keep the body ref.

## Task 0 — Empirical baseline (codegen MUST do first; author could not run the native gate)
- [ ] On a CLEAN tree: stash any drift, `pnpm validate:native`, record deep-AST per grammar. Confirm 111/69/74; if different, RE-BASELINE the targets below.
- [ ] Capture `probe-stages --grammar python --kind import_from_statement` and `--kind import_statement` as the `_import_list` fold reference.

## Task 1 — Typed provenance + structural `keepRef` predicate + (diagnostic-only) alias maps
**Corrected from BLOCKED v1:** the fold-exclusion is a STRUCTURAL fact computed by rule traversal — `refcount` + `hasVisibleTwin` — NOT a lookup in `contentAliasedTo` (those maps are empty: 0 enrich `alias($._name,$.name)` nodes exist on any grammar). The maps survive ONLY for the Task 2 diagnostic.
- [ ] `rule.ts:~74` (RuleBase): add `readonly metadata?: { source?: RuleSource; inlinedFrom?: string };` (replaces the `enrich.ts:1668` cast).
- [ ] New helper `computeKeepRef(rules): Set<hiddenKindId>` (place beside the normalize hoist it feeds, or in `link.ts`): traverse every rule body counting `symbol($._x)` refs → `refcount`; mark `hasVisibleTwin(_x)` when a parse-kind rule's body is/contains `symbol($._x)`. `keepRef(_x) = refcount(_x) > 1 || hasVisibleTwin(_x)`. PURE traversal, no map reads.
- [ ] `link.ts:~248`/`:650`: still populate + thread `contentAliasedFrom: Map<visibleTwin,hiddenBody>` / `contentAliasedTo: Map<hiddenBody,visibleTwin[]>` for DIAGNOSTICS ONLY — built from whatever alias relationships `mintContentAliasKinds` actually sees (may be empty today; that's fine — they guard a FUTURE violation, not today's fold).
- [ ] Verify (tsx probe): `computeKeepRef(ts)` CONTAINS `_call_signature` (refcount>1) and `_module` (twin), and does NOT contain `_extends_clause_single` (refcount 1, no twin). No emit change. Gate unchanged.

## Task 2 — Non-injective `contentAliasedFrom` diagnostic (the maps' ONLY consumer)
- [ ] Add to `grammar-diagnostics`: `contentAliasedFrom` fan-in >1 (two bodies → one twin) → diagnostic (mirror the parseKind-collision check). `contentAliasedTo` fan-out >1 is the legitimate reuse case (no diagnostic). The maps may be empty today — the check still compiles and guards a future violation.
- [ ] Verify: `grammar-diagnostics --grammar {rust,ts,python}` → ZERO new diagnostics today. Non-zero = triage before proceeding. Gate unchanged.

## Task 3 — DEFERRED (per-instance `trailing_sep`) → see "Deferred follow-up" below
**Decision 2026-06-04 (Pradeep):** defer trailing_sep; fold 10/11 now. Task 3 is mis-pinned + is a risky cross-language rework; it only gates `_import_list` (1/11). Moved to the **Deferred follow-up** section at the end. Execution resumes at Task 4, with Task 5 NARROWING (not removing) the wash so `_import_list` stays correctly inlined until the follow-up lands.

## Task 4 — The normalize inline hoist (CST-bearing, non-aliased; EXCLUDE `_import_list`)
- [ ] `normalize.ts:114`: replace the single `applyWrapperDeletion(rules)` with the fixpoint:
  ```
  let r = applyNormalizationPasses(...);   // :113 unchanged
  let changed = true, pass = 0;
  do { r = applyWrapperDeletion(r);
       const keepRef = computeKeepRef(r);   // re-derived each pass (cheap; cf. note below)
       changed = inlineHiddenSeqRefs(r, keepRef);
     } while (changed && ++pass < 8);
  const renderRules = r;                    // feeds BOTH projections
  ```
  (The loop exists because each `applyWrapperDeletion` pass can EXPOSE a fresh hidden-seq `symbol(_z)` ref that wasn't eligible before — the user's "run pushdown through a fixed point so we get inlines in there too." `keepRef` itself is invariant under folding — splices RELOCATE `symbol` refs rather than remove them, so refcounts are conserved — so recomputing it per pass yields the same set; it's recomputed only because the rule set object is rebuilt each pass. If `computeKeepRef` shows up in a profile, hoist it above the loop.)
### CORRECTED MECHANISM (v3, design-settled 2026-06-04) — seq-unit multiplicity, NO leaf-distribution
**Why v2 (leaf-stamp) was BLOCKED:** the prior `reapplyInlinedLeafAttrs`/`pushAttrsToLeaves` splice distributed the group's `optional`/`repeat` multiplicity onto EVERY leaf incl. bare literals — and the render walker DROPS optional-stamped literals → 64 templates lost syntax tokens (`const x: T value` dropped `=`, etc.), a regression the count gate masked (broken kinds aren't in the passing set; rust even ticked to 112). Root cause: `pushAttrsToLeaves` (`simplify.ts:1099`, `case 'seq'`) leaf-distributes BY DESIGN because the *derivation* view flattens seqs (`canonicalizeSeqOfLeaves`) — that lowering is correct for derivation (literals stripped) but WRONG for render. **Multiplicity belongs to the SEQ as a unit, not its members** (design authority).

- [ ] New `inlineHiddenSeqRefs(rules, keepRef)`: for each parent `symbol(_x)` where `rules[_x]` is hidden+seq+group/multi-eligible (reuse `resolveGroupOrMultiInlineTarget`, `simplify.ts:992`) AND **`!keepRef.has(_x)`** AND `_x !== '_import_list'` (gated until Task 6): splice the group **PRESERVING seq-unit multiplicity** — re-materialize as `optional(seq(body…))` / `repeat(seq(body…))` (or a multiplicity-tagged seq node) matching how the kept group-ref encoded it. Tag `metadata.inlinedFrom=_x`; delete `_x`. **Do NOT call `reapplyInlinedLeafAttrs`/`pushAttrsToLeaves`** — that is a derivation-only lowering; the render path needs the wrapper intact so the EXISTING optional-group emit fires. **No slot-count pre-check** (that would duplicate the emit-time gating-slot finder — see emit step). Returns true if any splice. **Termination:** monotone-decreasing on `#hidden-seq-entries`; cap at 8 with assert-on-non-convergence (mirror `inlineSingleUseHidden:436`).
- [ ] **`keepRef` extension (the agent's sound structural fix — KEEP IT):** `computeKeepRef` must also force-keep any hidden kind named in a `supertype.subtypes` array (referenced by NAME, not a `symbol()` body ref — e.g. py `_key_value_pattern` ∈ `_dict_pattern_kv.subtypes`). Folding it dangles the supertype. Structural fact, not metadata.
- [ ] **Render gating reuses existing machinery (DO NOT write new gating):** the seq-unit-multiplicity form is already what the kept group-ref renders through — `template-walker.ts` descends `optional`/`group` nodes and `emitters/templates.ts` emits the `{% if slot | isPresent %}…{% endif %}` conditional gating the seq's literals on its single internal slot. The ONLY addition: in that **emit-time gating-slot resolver** (`templates.ts`), when it looks for the slot to gate an `optional`/`repeat` group on and finds **>1 slot**, emit a **diagnostic warning** ("multi-slot multiplicity group — should have been a visible group"). This is the single source of slot-count truth — do NOT replicate it in the hoist.
- [ ] `keepRef` body (refcount>1 / twinned / supertype-subtype, e.g. `_call_signature`/`_module`/`_key_value_pattern`) is NEVER inlined — stays `symbol(_x)` → storageKind; its kind + transport REMAIN (dead-duplicate-transport cleanup is §D-2b, not here).
- [ ] Folds the single-use seq groups incl. `_extends_clause_single` (inlining removes the struct edge → ts `Box`/SCC cycle gone, no `scc.ts` surgery). Single-slot optional groups (`const_item` `=value`, `function_definition` `->return_type`) now fold CLEANLY (literals gated on the slot, survive). Multi-slot ones (`let_declaration`) surface the emit-time diagnostic.
- [ ] Verify: `probe-stages` ts `extends_clause` — `_extends_clause_single` spliced. **Render-correctness check (the v2 gate-blind-spot):** inspect emitted templates for the single-slot fold targets — `const_item.jinja` keeps `=`, py `function_definition` keeps `->` (NOT dropped). `dump-ast-mismatches --grammar typescript` no new mismatches (fall back to `probe-stages` if napi SIGSEGVs).
- [ ] Gate: **rust/ts/py HOLD-or-IMPROVE at 111/69/74.** A DIP, OR any single-slot fold target dropping a literal in its template, = mechanism bug → bisect by per-kind-gating the fold set, report. ROLLBACK: revert the loop. **Do not trust the count gate alone — the v2 regression passed it; template-token inspection is mandatory.**

## Task 5 — NARROW the late wash to `_import_list`-only (prove no double-handling for the 10)
**Revised (defer-trailing_sep decision):** do NOT remove the wash — `_import_list` is still inlined ONLY by it until the deferred Task 6 lands. Instead, narrow the wash so it handles EXACTLY `_import_list`, eliminating the double-derivation (DRY) for the 10 now-normalize-folded groups while keeping the one un-migrated kind correct.
- [ ] `simplify.ts:893` (`inlineKinds.has` wash): gate it to `kindId === '_import_list'` only (the 10 are already inlined at normalize → for them the wash must be a no-op, not a second inliner). Keep `:944` (`source==='group-lift'` bail) only if `_import_list` still needs it; else remove.
- [ ] Verify (DRY proof): for the 10 folded parents, the wash performs ZERO splices (assert/log count 0 — they're absent by normalize time); `counts --backend native` slot counts IDENTICAL to Task 4; `probe-stages` shows each inlined body once (not twice). `_import_list` still inlined into its parents as before.
- [ ] Gate: IDENTICAL to Task 4 (111/69/74). ANY change for the 10 = leftover double-handling → reconcile; ANY change for `_import_list` = the narrowing dropped it → fix the predicate.

## Task 6 — DEFERRED (enable `_import_list` normalize fold) → Deferred follow-up
Tied to Task 3. Do NOT remove the `_x !== '_import_list'` gate or the narrowed wash until the deferred trailing_sep fix is green. See below.

## Task 7 — Cleanup (scoped to what landed)
- [ ] Delete `inlineKinds`-wash paths that are now unreachable FOR THE 10 (the wash body survives, narrowed to `_import_list`). Keep the `inlineKinds` thread into `computeSimplifiedRules` if `diagnoseSlotGrouping` still needs it (findReferences). Full `validate:native` = 111/69/74-or-better; `pnpm -r typecheck`.

---

## Deferred follow-up — per-instance `trailing_sep` + `_import_list` migration (NOT in this execution)
**Why deferred:** mis-pinned in v1 + a genuinely risky cross-language change; gates only 1/11. Re-spec required before any attempt.
- **Seam simplified by the NodeData-shim deletion (commit `2368645a`):** the entire NodeData resolve path — `ResolvedField`/`resolve_slot`/`detect_field_trailing_sep` — is now DELETED. There is exactly ONE live trailing_sep site left: the `leading: false, trailing: false` hardcode in the transport-struct list-view emission (`renderTransportStruct` in `render-module.ts`; was `:2274-2275`, now shifted ~700 up — find by symbol, NOT absolute line). Reference by symbol; the old `:941`/`:1136`/`:831` NodeData pins no longer exist.
- **DO NOT use the literal `slot.hasTrailing` fix** — that is the *static per-slot capability flag*; emitting it per-instance is the **−17 regression** recorded in `project_object_type_rewrite_and_native_list_gaps`. The genuine fix is a **new per-instance `trailing_sep` transport field** populated by the native CST reader: transport struct def + Rust reader that builds the transport + the render emission in `renderTransportStruct`.
- **Pre-existing blockers to triage first:** (1) `import_from_statement`'s `(`/`,`/`)` are mis-assigned to field `wildcard_import` (`wrapError: repeated slot "wildcard_import" requires at least one value`; bare form: `unknown kind id 9 in ImportFromStatementWildcardImportTransportSlot`) — blocks any import-list witness; (2) the DEBUG-napi SIGSEGV disables `dump-ast-mismatches`/`probe-kind` as fast RED/GREEN signals for this work.
- **Then:** TDD a python `import_from_statement` trailing-comma render (RED → field + reader + emit → GREEN); python HOLD ≥74 standalone. Once green, do **Task 6**: remove the `_x !== '_import_list'` gate in `inlineHiddenSeqRefs` AND the `_import_list` branch of the narrowed wash (Task 5), so `_import_list` migrates to the normalize hoist and the wash can be fully deleted (completing Task 7).

## Risks / unknowns (codegen verifies empirically)
- Author COULD NOT run the native gate (staleness guard on a drifted tree). Task 0 is mandatory.
- The 2 twin-collision folds nudging the gate UP is a STATIC inference — confirm at Task 4.
- A 2nd latent bug in multi-parent splice (`_initializer`×7, `_call_signature`×10) is possible but undetected statically (all simple required-field seqs); Task 4's gate is the detector — if rust/ts dip, per-kind-gate the fold set to bisect.
- `contentAliasedFrom` single-body invariant assumed from corpus (0 collisions); Task 2 guards a future violation.
