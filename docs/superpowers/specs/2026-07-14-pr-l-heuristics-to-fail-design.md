# PR-L — Flip Heuristics to `propose-*`/Fail Diagnostics — Design

**Goal:** Close out the compiler-simplification master plan's final PR by (1) adding the one genuinely-missing diagnostic (`unslotted-child`) and (2) safely flipping `parsekind-noninjective` and `content-collision` from non-blocking to blocking severity.

**Architecture:** Both items land through the diagnostic infrastructure PR-G already built (`compiler/emit-gate.ts`'s `assertEmittable`, keyed on severity `'fail'`, currently inert because nothing emits it) — this PR is almost entirely about emission, not plumbing.

**Depends on:** `docs/superpowers/specs/2026-07-14-enrich-base-grammar-unaliasing-design.md` (must land first — it resolves `parsekind-noninjective`'s 7 live instances proactively, which is what makes flipping that diagnostic to blocking safe).

## Global Constraints

- DRY: reuse `assertEmittable`/`DiagnosticSink` (already built by PR-G), don't build a parallel gate mechanism.
- Every codegen-source-touching task regenerates all 3 grammars and runs the full `validate:native` sweep, gated against the baseline in effect at that task's start (reconfirm fresh, don't assume the number cited here still holds by the time this is picked up).
- Rust-touching tasks run `cargo check --workspace --features napi-bindings` cleanly.
- No casts to clear type errors — fix the real type.

---

## 1. Original scope, and what's now out of it

The compiler-simplification design doc (§5/§E, 2026-05-22) specced PR-L as converting a whole vocabulary of "guessing heuristics" into `propose-*`/fail diagnostics. A research audit (`pr-l-scope-audit`, 2026-07-14) found that spec text was ~80% stale — most of the listed heuristics are already implemented under different names, or their target was deleted entirely by other work in this same master plan (`propose-field` in particular — see the separately-recorded `pr-n-status-check` verdict). Confirmed via direct code reading, not just the audit's word: three items are real.

A third item — removing `collect-slots.ts`'s `mergeByName`/`mergeChoiceArms` (which silently discard per-arm "surrounding" context, e.g. `param ,` vs `param ;`, when folding same-named slots) — is **explicitly deferred**, to be recorded in `docs/KNOWN_ISSUES.md`, not implemented here. It was ruled out as this PR's scope because (a) `simplify.ts`'s `simplifySeqRule` already strips the literal surrounding info before `collect-slots` ever runs, so a "gate the merge on surrounding-equivalence" approach is architecturally infeasible without much deeper pipeline surgery, and (b) full removal (replacing every same-named-arm fold with a fail-diagnostic) has an unmeasured blast radius across all 3 grammars — a bigger, separate undertaking.

This PR's real scope is the remaining two items.

## 2. Item A — `unslotted-child` fail check (new)

**What it targets:** `emitters/wrap.ts`'s `$other` bucket — the wrap-time catch-all for parsed children that match no declared slot. Per the original design doc (Finding 3, §1): `$other` is deliberately wrap-only (never reaches `types.ts`/`factories.ts`/render), so a non-empty `$other` at parse time is a completeness defect with no typed surface to render off — the exact reason it needs to surface as a diagnostic rather than silently round-trip.

**Where it's wired:** `compiler/emit-gate.ts`'s `assertEmittable` already accepts a `nodeMap` parameter reserved specifically for this check — its own source comment says so verbatim (`"PR-L's 'unslotted-child' check reads it"`). This PR adds the actual check; no new gate plumbing needed.

**Detection approach:** the wrap emitter (`emitters/wrap.ts`) must already, by construction, decide per-kind which parse-producible children go into a named slot vs. `$other` in order to generate correct wrap code today. The new diagnostic should reuse (not reimplement) whatever computation currently makes that determination — statically, from the assembled node's rule shape and declared slot set, not via a corpus/runtime check (this needs to run inside `assertEmittable`, a compile-time gate). **Pin the exact reusable function/computation against current `wrap.ts` source during planning** — this design doesn't prescribe the precise mechanism, since it depends on wrap.ts internals a plan-writer should verify directly rather than have prescribed from outside.

**First step, before wiring it as blocking:** measure how many kinds actually trigger this across all 3 grammars today. `emit-gate.test.ts` already anticipates the check (`"PR-L will exercise the nodeMap-reading 'unslotted-child' path"`) but there's no live count yet. If the count is nonzero, this PR needs either a burn-down (like item B) or an allow-list, mirrored from item B's pattern — do not assume zero.

## 3. Item B — burn down and flip `parsekind-noninjective` + `content-collision`

**`parsekind-noninjective`** (rust=1, typescript=6 live instances as of 2026-07-14): once the enrich un-aliasing pass (dependency spec) lands, all 7 should resolve proactively — verify this is actually true (re-run `field-provenance`-equivalent counts, or read the regenerated `grammar-diagnostics.json` directly) before flipping severity, don't assume the dependency's own testing already proved the *downstream* count is zero in this exact repo state.

**`content-collision`** (typescript=2 live instances: `_object_type_group1`, `public_field_definition` — each has 2 anonymous `content` slots sharing the `_content` storage key). These are NOT resolved by the enrich un-aliasing work (different root cause — genuinely anonymous choice content, not base-grammar aliasing). Fix via `field()`-naming at least one of the two colliding slots in `overrides.ts` for each of the 2 kinds, per the diagnostic's own `proposal` text.

**Flip mechanism:** per the audit's finding, both diagnostics currently ride the **preflight gate** (`runGrammarDiagnosticsPreflight`, `run-codegen.ts:203-258`), not the sink (`assertEmittable`) — they're `canProceed:true` today. Flip via that same preflight gate (set `canProceed:false` for both codes once burn-down is confirmed clean), since it already has the `--allow-diagnostic` escape hatch and TTY confirm — do not migrate them to the sink-based `assertEmittable` gate, which is a different, parallel mechanism (per the audit: "the two channels are parallel... PR-L must pick WHICH gate each blocking code goes through" — this design picks preflight for both, matching where they already live).

## 4. Testing / validation

- Item A: new diagnostic unit tests (a fixture kind with a genuine unslotted child → fails; a fixture with full slot coverage → passes) plus `emit-gate.test.ts`'s existing anticipatory tests get filled in for real.
- Item B: regenerate all 3 grammars after the `overrides.ts` fixes for the 2 `content-collision` kinds; confirm `grammar-diagnostics.json` shows zero live instances of both codes before flipping; confirm the preflight gate actually blocks (a deliberately-reintroduced collision in a throwaway test fixture should fail the gate) before considering the flip complete.
- Full `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` sweep, baseline reconfirmed fresh at task start.
- `cargo check --workspace --features napi-bindings` clean.

## 5. Out of scope (explicit)

- `mergeByName`/`mergeChoiceArms` removal — deferred to `docs/KNOWN_ISSUES.md`.
- Renaming any already-implemented-under-a-different-name diagnostic to match the original spec's exact vocabulary (`propose-discriminator`, converting emitter throws to `sink.fail`, etc.) — cosmetic, no behavior change, not worth the regen/review cost per the audit's own recommendation.
- Any severity/gate changes to diagnostics not named in this doc.
