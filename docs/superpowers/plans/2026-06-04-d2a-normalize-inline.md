# Plan: §D-2a — Relocate group-inline to a normalize rule-tree hoist

> **For agentic workers:** execute via `sittir-codegen`, gating on RELEASE `validate:native` after every task. Spec: `docs/superpowers/specs/2026-06-04-rule-ir-model-simplification.md` (§D). Steps use `- [ ]`.

**Goal:** move group-inlining from the late `simplify.ts:893` slot-wash to a **rule-tree hoist at normalize** (after wrapper-pushdown, in a fixpoint loop) so render + slot projections both see the inlined form; keep aliased twins' body ref as `storageKind`; close M-φ2 §D. Render-neutral except a net-positive (dead-emit deletion) and one fix-then-fold.

**Gate:** RELEASE deep-AST `read-render-parseAstMatchPass` = **rust 111 / ts 69 / py 74** (`env -u SITTIR_NATIVE_DEBUG pnpm validate:native`). HOLD-or-IMPROVE after every task.

---

## Seam pin (all read from source, high confidence)
- **Normalize fixpoint seam:** `normalize.ts:114` (`applyWrapperDeletion(rules)`, right after `applyNormalizationPasses:113`). Repeat-pushdown is guaranteed done here (`wrapper-deletion.ts:87/110` push array-multiplicity+separator onto leaves), so the `seq`-shape test is reliable.
- **Hoist:** splice via `replaceSymbolRef` (`normalize.ts:489`) + re-stamp via `reapplyInlinedLeafAttrs` (`simplify.ts:958`).
- **Inline-eligibility guard (bounds fold set to 11):** `resolveGroupOrMultiInlineTarget` (`simplify.ts:992`).
- **`storageKind` already = hidden body:** `storageKindOfValue` (`node-map.ts:941`) returns the resolved node-ref kind; keeping `symbol(_x)` (not redirecting to twin) yields `_x` as storageKind, twin stays `parseKind` (`node-map.ts:969`).
- **Alias maps:** populate `contentAliasedTo`/`contentAliasedFrom` in `mintContentAliasKinds` (`link.ts:650`), thread on `LinkedGrammar` beside `visibleAliasTargets` (`link.ts:248/596`).
- **Wash to remove:** `simplify.ts:893` (`inlineKinds.has`) + `:944` (`source==='group-lift'` bail).
- **`metadata.inlinedFrom`:** add `readonly metadata?: { source?: RuleSource; inlinedFrom?: string }` to `RuleBase` (`rule.ts:~74`); replaces the `as unknown as Rule` cast (`enrich.ts:1668`) + the deprecated top-level `source:'group-lift'` (`rule.ts:349`).
- **`_import_list` trailing-sep fix:** `render-module.ts:941` hardcodes `trailing_sep: false` (struct field `:930`, merge `:560`).

Fold set = **11 groups** (rust 2, ts 7, py 2): rust `_use_wildcard_clause`, `_visibility_modifier_pub_parens`; ts `_call_signature`, `_extends_clause_single`, `_for_header`, `_from_clause`, `_initializer`, `_module`, `_parameter_name`; py `_key_value_pattern`, `_import_list`. The bare ts cycle member `_extends_clause_single` inlines → struct edge vanishes → **ts `Box` cycle gone, no `scc.ts` surgery**. Aliased twins (`_call_signature`, `_module`) keep the body ref.

## Task 0 — Empirical baseline (codegen MUST do first; author could not run the native gate)
- [ ] On a CLEAN tree: stash any drift, `pnpm validate:native`, record deep-AST per grammar. Confirm 111/69/74; if different, RE-BASELINE the targets below.
- [ ] Capture `probe-stages --grammar python --kind import_from_statement` and `--kind import_statement` as the `_import_list` fold reference.

## Task 1 — Typed provenance + alias maps (no behavior change)
- [ ] `rule.ts:~74` (RuleBase): add `readonly metadata?: { source?: RuleSource; inlinedFrom?: string };` (replaces the `enrich.ts:1668` cast).
- [ ] `link.ts:~248`/`:650`: populate + thread `contentAliasedFrom: Map<visibleTwin, hiddenBody>` (single) and `contentAliasedTo: Map<hiddenBody, visibleTwin[]>` (fan-out), built where `rules[value]` mints from `alias($._name,$.name)`.
- [ ] Verify (tsx probe): ts `contentAliasedFrom` has `call_signature→_call_signature`, `module→_module`; `contentAliasedTo[_call_signature].length ≥1`. No emit change. Gate unchanged.

## Task 2 — Non-injective `contentAliasedFrom` diagnostic
- [ ] Add to `grammar-diagnostics`: `contentAliasedFrom` fan-in >1 (two bodies → one twin) → diagnostic (mirror the parseKind-collision check). `contentAliasedTo` fan-out >1 is the legitimate reuse case (no diagnostic).
- [ ] Verify: `grammar-diagnostics --grammar {rust,ts,python}` → ZERO new diagnostics today. Non-zero = triage before proceeding. Gate unchanged.

## Task 3 — FIX-THEN-FOLD prerequisite: per-instance `trailing_sep` (BLOCKS `_import_list` fold)
- [ ] (3-edit spec from `project_object_type_rewrite_and_native_list_gaps`.) `render-module.ts:930` keep `trailing_sep: bool`; `:941` replace hardcoded `false` with the per-instance value from the slot's `hasTrailing` (forwarded `:560/:831`); transport projection carries per-instance `trailing_sep` (not node-wide).
- [ ] TDD: failing render test for a python `import_from_statement` with a trailing-comma list (RED) → 3 edits → GREEN.
- [ ] Gate: `pnpm validate:native` — python HOLD ≥74 (fix is independent of folding; must not regress alone). rust/ts unchanged. ROLLBACK: revert; `_import_list` fold (Task 6) stays disabled.

## Task 4 — The normalize inline hoist (CST-bearing, non-aliased; EXCLUDE `_import_list`)
- [ ] `normalize.ts:114`: replace the single `applyWrapperDeletion(rules)` with the fixpoint:
  ```
  let r = applyNormalizationPasses(...);   // :113 unchanged
  let changed = true, pass = 0;
  do { r = applyWrapperDeletion(r);
       changed = inlineHiddenSeqRefs(r, { contentAliasedTo, contentAliasedFrom });
     } while (changed && ++pass < 8);
  const renderRules = r;                    // feeds BOTH projections
  ```
- [ ] New `inlineHiddenSeqRefs(rules, aliasMaps)`: for each parent `symbol(_x)` where `rules[_x]` is hidden+seq+group/multi-eligible (reuse `resolveGroupOrMultiInlineTarget`, `simplify.ts:992`) AND `_x` NOT in `contentAliasedTo` (not alias-referenced) AND `_x !== '_import_list'` (gated until Task 6): splice `resolveGroupOrMultiInlineTarget(rules[_x])` via `replaceSymbolRef` + `reapplyInlinedLeafAttrs`; tag `metadata.inlinedFrom=_x`; decrement refcount; delete `_x` at refcount 0. Returns true if any splice. **Termination:** monotone-decreasing on `#hidden-seq-entries`; cap at 8 with assert-on-non-convergence (mirror `inlineSingleUseHidden:436`).
- [ ] Folds 10 of 11 (all but `_import_list`).
- [ ] Verify: `probe-stages` ts `extends_clause` — `_extends_clause_single` absent as entry, content spliced. `dump-ast-mismatches --grammar typescript` — no new mismatches.
- [ ] Gate: ts HOLD-or-UP (the `_call_signature`/`_module` twin folds delete dead `_CallSignatureTransport`/`render__call_signature` → ts ≥69). rust/py HOLD. ROLLBACK: revert the loop.

## Task 5 — Supersede the late wash (prove no double-handling)
- [ ] Remove `simplify.ts:893` (`inlineKinds.has` wash) + `:944` (`source==='group-lift'` bail).
- [ ] Verify: `counts --backend native` slot counts for the 10 folded parents IDENTICAL to Task 4; `probe-stages` shows the inlined body once. Gate IDENTICAL to Task 4. ANY change = double-handling → ROLLBACK + reconcile.

## Task 6 — Enable the `_import_list` fold (AFTER Task 3 green)
- [ ] Remove the `_x !== '_import_list'` gate. Folds into `import_from_statement`/`import_statement`/`future_import_statement`.
- [ ] Verify: trailing-comma import list renders separator+trailing correctly per parent. Gate: python HOLD ≥74. Dip → Task 3 incomplete (per-instance flag not reaching all 3 parents) → ROLLBACK Task 6, re-open Task 3.

## Task 7 — Cleanup
- [ ] Delete unreachable `inlineKinds`-wash paths; the `inlineKinds` thread into `computeSimplifiedRules` only if `diagnoseSlotGrouping` no longer needs it (findReferences). Full `validate:native` = 111/69/74-or-better; `pnpm -r typecheck`.

## Risks / unknowns (codegen verifies empirically)
- Author COULD NOT run the native gate (staleness guard on a drifted tree). Task 0 is mandatory.
- The 2 twin-collision folds nudging the gate UP is a STATIC inference — confirm at Task 4.
- A 2nd latent bug in multi-parent splice (`_initializer`×7, `_call_signature`×10) is possible but undetected statically (all simple required-field seqs); Task 4's gate is the detector — if rust/ts dip, per-kind-gate the fold set to bisect.
- `contentAliasedFrom` single-body invariant assumed from corpus (0 collisions); Task 2 guards a future violation.
