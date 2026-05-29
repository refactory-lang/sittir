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
| **PR-D** | wrap reads class; delete `SlotModel`; `$children`→`$other` (codegen+rust) | C | 3 | **yes** | `pr-d-wrap-reads-class` | 🔄 PUSHED (A `9d1f1d1a` + B `bc3cb2d4`; ast 125/72/76 hold, cargo green; `$with` variadic deferred to final type-pass; PR not yet opened) |
| **PR-D2** | Helper-name leak fix (H2 probe → 0) | D | 4 | no | `pr-d2-helper-name-leak` | ⬜ |
| **PR-E** | transport + render read class; delete 2 visible-kind band-aids; delete deprecated `bridge.rs` | D2, B (A) | 5 | **yes** | `pr-e-transport-render-class` | ⬜ |
| **PR-F** | factory + from + types read class | B (D for `$with` gate) | 5 | no | `pr-f-factory-from-types-class` | ⬜ |
| **PR-G** | Diagnostics severity model + Assemble→Project gate (additive) | — (≺ H, L) | 1‖ | no | `pr-g-diagnostics-gate` | ⬜ |
| **PR-H** | Phase rename `optimize.ts`→`normalize.ts`; `transforms.ts`; ctx; node-behavior→class | G | 6 | no | `pr-h-phase-rename-ctx` | ⬜ |
| **PR-M** | Sittir-invention rule-IR cut + `AssembledPolymorph`→`AssembledBranch` | core (B); **≺ I** | 7 | **yes** | `pr-m-rule-ir-cut` | ⬜ |
| **PR-I** | General choice-slot→factory submethods + `$variant` removal | **M** | 8 | **yes** | `pr-i-choice-slot-submethods` | ⬜ |
| **PR-K** | `factory-map.json5`→`node-model.json5` + elevate/relabel surfacing | I/M | 9 | no | `pr-k-node-model-registration` | ⬜ |
| **PR-N** | enrich-widening — name easy positional symbols | — (enrich-side; ≺ L) | ‖ | no | `pr-n-enrich-widening` | ⬜ |
| **PR-O** | Structural de-dup (M1/MO2/P1 — non-behavioral) | B, H (files) | ‖ | no | `pr-o-structural-dedup` | ⬜ |
| **PR-P** | Terminal + flat Enum → predicates; + `TerminalValue`→`NodeRef` value unification (fixes terminal→`content`) | H (rename) | 10 | **yes** | `pr-p-terminal-enum-predicates` | ⬜ |
| **PR-Q** | Enum recursive-widening (count-gated) | **P** | 11 | **yes** | `pr-q-enum-recursive-widening` | ⬜ |
| **PR-L** | Flip heuristics → `propose-*` fail-diagnostics (LAST) | M, I, N, G | 12 | no | `pr-l-heuristics-to-fail` | ⬜ |

**Authoritative linear order (spec §5):** A → B → C → D → D2 → E → F → G → H → M → I → K → N → O → P → Q → L.

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
4. **PR-O (structural de-dup)** is non-behavioral, but `MO2` edits `NodeRef`/`TerminalValue` in `node-map.ts` and `M1` relocates shared transforms into `transforms.ts` — both heavily touched by the core + PR-H. Run it *after* the value model (B) and `transforms.ts` (H) settle, serially, to avoid churn conflicts.
5. **PR-P → PR-Q** are sequential and rust-emitting; keep them serial and off the polymorph chain (they only need PR-H's `optimize.ts`→`normalize.ts` rename to have landed).

**Net:** at most ~2 active branches at once is realistic and safe (e.g. core-spine + PR-G early; then E ‖ F). Don't fan out wider — the global gate and shared `node-map.ts`/emitter surface make broader parallelism net-negative.

---

## How to advance this plan

1. Pick the next ⬜ PR whose `depends-on` are all ✅.
2. Branch `<branch-name>` off `origin/master`; write its per-PR plan (`docs/superpowers/plans/YYYY-MM-DD-<pr>.md`) via writing-plans.
3. Execute via subagent-driven-development; gate on `pnpm validate:native` (+ cargo-verify if rust-emitting).
4. On merge: update this row's Status to ✅ + record the last gate numbers, and link the per-PR plan.

**Done so far:** PR-A (#40) → PR-B (#41) → PR-C (#43, +#44 unified-CLI) all merged. **PR-D** (`pr-d-wrap-reads-class`) pushed — Task A (wrap-reads-class + delete `slot-model.ts`) + Task B (`$children`→`$other`) done & independently re-verified (ast **125/72/76** hold, `cargo check` green); the `$with` variadic acceptance criterion is **deferred** to the single end-of-plan type-error cleanup pass (generated-code type errors are not gated mid-plan — render/parse via `validate:native` is the gate). PR-D's GitHub PR not yet opened.

**Up next: PR-D2** (`pr-d2-helper-name-leak` — Helper-name leak fix, H2 probe → 0) — the formal dependency before **PR-E** (`pr-e-transport-render-class`: transport + render read class, delete the 2 visible-kind band-aids + deprecated `bridge.rs`). PR-E ‖ PR-F are the wave-5 concurrent pair. Current gate baseline to carry into D2/E: **rust ast 125 · ts ast 72 · python ast 76** (native, deep read-render-parse).
