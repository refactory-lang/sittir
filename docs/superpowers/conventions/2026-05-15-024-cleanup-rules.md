# 024-rust-slot-surface-contract — Cleanup rules of engagement

**Date:** 2026-05-15
**Branch:** `024-rust-slot-surface-contract`
**Scope:** Rules for the cleanup pass after the `--noCheck` shortcut was reverted and `tsconfig` paths were established.

These rules govern how to investigate, fix, and verify changes during the closeout of branch `024`. They draw from the May 13 rust slot surface contract design (`docs/superpowers/specs/2026-05-13-rust-slot-surface-contract-design.md`), this session's masking-and-recovery findings, and the architectural rules captured in `plan.md` line 13.

Sections marked **Invariant** must hold at every commit. Sections marked **Workflow** are step-by-step procedures. Sections marked **Requirement** are open items that are not yet enforced — they need implementation before the cleanup is complete.

---

## A. Source-of-truth discipline (Invariant)

**A1. Off-limits — generated outputs.** Never hand-edit:

- `packages/{rust,python,typescript}/src/*` (`factories.ts`, `from.ts`, `types.ts`, `wrap.ts`, `consts.ts`, `index.ts`, etc.)
- `packages/{rust,python,typescript}/templates/*.jinja`
- `packages/{rust,python,typescript}/.sittir/*`
- `packages/{rust,python,typescript}/factory-map.json5`
- `packages/{rust,python,typescript}/overrides.suggested.ts` (the `.suggested.ts` is auto-generated; only `overrides.ts` is hand-edited)
- `rust/crates/sittir-{rust,python,typescript}/src/**` (native napi crate sources)

**A2. Editable surfaces.**

- `packages/codegen/src/**` (the generator itself)
- `packages/<grammar>/overrides.ts` (per-grammar adjustments to the generator)
- `packages/{common,core,types,validator,tools}/src/**` (runtime libraries)
- `rust/crates/sittir-*/src/**` (native napi crates)

**A3. Fix the generator, not the output.** If a grammar's `wrap.ts` is wrong, the bug is in `packages/codegen/src/emitters/wrap.ts` (or upstream in `compiler/node-map.ts`). Patching the output regenerates away.

**A4. Fix the grammar, not the output.** If a parse-side issue is found, fix the grammar overrides in `packages/<grammar>/overrides.ts` rather than patching the output.

**A5. Generated content is hash-verified at every grammar load.** Each grammar carries a per-grammar manifest at `packages/<grammar>/.sittir/generated.manifest.json` containing:

- `source_hash` — SHA256 of the inputs that drove this generation: `packages/<grammar>/overrides.ts`, `packages/<grammar>/package.json` (pins upstream tree-sitter version), and a content hash of `packages/codegen/src/**`. This catches "you edited the inputs but didn't regen" — the cross-layer synchronicity guarantee.
- `files` — SHA256 of every cross-platform generated file (sittir js, parser.wasm, factory-map, Rust crate src/templates/test-fixtures, napi `index.d.ts` / `index.js`).
- `host_files` — SHA256 of platform-specific binaries (`*.node`). Verified only when the file exists on the current host; missing-locally is tolerated for cross-platform commits.

The codegen CLI rewrites the manifest at the end of every successful regen (always, not gated by any flag). There is intentionally no separate "write manifest" command — the manifest cannot drift from generated content unless someone hand-edits it.

Verification fires automatically inside `loadLanguageForGrammar(grammar)` in `packages/codegen/src/validate/common.ts` — the universal choke point that every validator, every probe (`probe-kind`, `probe-validate`, etc.), every dev tool, and every script that loads a grammar funnels through.

- **`source_hash` mismatch** (overrides.ts, package.json, or codegen source edited since last regen) → throws "SOURCE INPUTS CHANGED" with the regen command.
- **`files` mismatch** (any cross-platform generated file modified, missing, or extra) → throws with the offending path.
- **`host_files` mismatch** (this host's `.node` binary diverges from the recorded hash, e.g. someone ran `cargo build` directly) → throws with the path. Files in `host_files` that don't exist locally are skipped (probably committed by another platform).
- **Manifest missing** (fresh checkout that never ran codegen) → one-line bootstrap warning, run continues. First codegen run populates the manifest and switches the grammar to enforced mode.

**Codegen-internal bypass.** When `SITTIR_INTERNAL_CODEGEN_RUN=1` is set, verification is skipped. This env is set ONLY by `packages/codegen/src/cli.ts` for its own internal validator runs (e.g. `extractParityFixtures` calls `validateReadRenderParse` to harvest fixtures BEFORE the manifest is rewritten at codegen's end — verifying mid-write would check the codegen process against its own incomplete output). External callers (validator CLI, probe-validate, etc.) never set this env and always get full verification.

**Cross-layer synchronicity coverage:**

| Layer | Tracked via | Catches |
|---|---|---|
| Compiled tree-sitter grammar (`parser.wasm`) | `files` | hand-edit, build-time drift |
| sittir js (`packages/<grammar>/src/*`) | `files` | hand-edit |
| Rust crate source (`rust/crates/sittir-<grammar>/src/*`) | `files` | hand-edit |
| napi JS surface (`index.d.ts`, `index.js`) | `files` | hand-edit, napi rebuild without codegen |
| napi binary (`*.node`) | `host_files` | direct `cargo build`, partial rebuild |
| **Inputs that drove the generation** | **`source_hash`** | **edits without regen** |

**Limit worth knowing:** a coordinated commit that updates the file AND its manifest entry AND the source_hash to match passes verification. The manifest catches honest hand-edits and forgotten-regen situations (the realistic threats in this codebase); a CI gate that reruns codegen and diffs the on-disk content is the additional layer if adversarial-level integrity is needed.

## B. Source-resolution approach

The source-resolution design is established in `docs/superpowers/specs/2026-05-14-codegen-source-resolution-design.md`. The key principle is to keep the package contract stable while enabling workspace commands to resolve `@sittir/codegen` exports to source.





---

## B. Workflow

**B1. After any codegen change → regenerate affected grammars → measure.**

```bash
# Regen one grammar:
pnpm exec tsx packages/codegen/src/cli.ts --grammar <rust|typescript|python> --all --output packages/<grammar>/src

# Measure (no rebuild needed — tsconfig paths route tsx to source):
pnpm exec tsx packages/validator/src/cli.ts counts --backend native [<grammar>]
```

Or use the umbrella that does all three regens + counts: `pnpm validate:native`.

**B2. After any validator-only change → no regen needed; just measure.**

**B3. After any change to wrap emitter, factory-map emitter, or `compiler/node-map.ts` → regen ALL three grammars** (the bug class is usually shared, and silent divergence between grammars is the most expensive failure mode).

**B4. No build is needed for the dev/measurement loop.** `pnpm -r run build` is for production consumers and is currently broken until the wrap emitter is fixed (see `[[project-wrap-emitter-children-typing-followup]]`). That's expected; don't try to "fix" it for the dev loop.

---

## C. RT failure investigation — one-by-one (Workflow)

**C1. Always start from the FIRST failing entry**, not bucket aggregates. Bucket counts (`probe-factory`) tell you the failure-mode distribution; the first-failing entry tells you what to fix next.

**C2. For each failing entry, run `probe-validate` before attempting any fix:**

```bash
# First failing RT entry, full trace:
pnpm exec tsx packages/codegen/src/scripts/probe-validate.ts \
    --grammar <X> --first-failing --trace --pretty

# Specific entry:
pnpm exec tsx packages/codegen/src/scripts/probe-validate.ts \
    --grammar <X> --entry '<corpus entry name>' --trace --pretty
```

**C3. Classify the failure into a layer before fixing:**

| Symptom | Owning layer | Where to fix |
|---|---|---|
| Wrap shape wrong | wrap emitter | `packages/codegen/src/emitters/wrap.ts` |
| Factory dispatch wrong | factory-map emitter, validator config | `packages/codegen/src/emitters/factory-map.ts`, `packages/codegen/src/validate/common.ts` |
| Render template wrong | render-module emitter, node-map | `packages/codegen/src/emitters/render-module.ts`, `packages/codegen/src/compiler/node-map.ts` |
| Transport contract wrong | transport-common emitter | `packages/codegen/src/emitters/transport-common.ts` |
| Parse-side issue | grammar overrides | `packages/<grammar>/overrides.ts` |

**C4. After a fix, confirm the NEXT first-failing entry is genuinely different.** If the same entry fails the same way, the regen + measurement loop didn't pick up the change (or the fix targeted the wrong layer).

---

## D. Measurement trust (Invariant)

**D1. Trust cov, then RT.** `cov` tests templates directly without the read → render → reparse round-trip; RT can be inflated by `$text` fastpath masking. If RT moves but cov doesn't, suspect masking, not progress. (See `[[project-render-text-fastpath-masks-templates]]`.)

**D2. The "frozen baseline" in `plan.md` (rust 134/136, python 115/115, ts 83/112) is masked.** It pre-dates the masking fixes and was inflated by the `$text` fastpath. Don't chase the frozen baseline — establish a new honest baseline as cleanup progresses.

**D3. Compare cov + RT + factory + from together.** Honest progress moves multiple metrics. Single-metric jumps deserve scrutiny.

---

## E. Architectural invariants (Invariant — from May 13 design §5–§7)

**E1. Wrap is the sole grammar-aware normalization layer.** All schema-aware shaping happens here. Singular slot mismatches throw. (§6.2, §7.1)

**E2. Native read payload stays raw.** No schema-shaping in the napi side or read-side helpers. The payload alone need not recover declared slot arity. (§6.4, §7.5)

**E3. Validator `nodeToConfig` is metadata-driven, not payload-shape-driven.** No `Array.isArray(...)` heuristics; use emitted `factorySlots` instead. (§6.3, §7.2)

**E4. No render-time reconstruction.** Forbidden helpers — each surviving call is debt to remove:

- `resolve_children`
- `structuralChildrenOf`
- `transportChildrenOf`
- `deriveChildrenTransportCardinality`

(`plan.md` line 13, 024 closeout addendum item 2)

**E5. No `toNativeRenderTransport` shim.** Currently identity-deprecated; full removal preferred over revival. (May 12 design §3 non-goal, native transport plumbing removal milestone)

**E6. Slot widening only for grammar-true multi-shape slots.** Default to single-shape; widen to per-slot enum or `Box<AnyTransport>` only when the grammar genuinely admits multiple shapes. Do NOT invent `<X>ChildTransport` wrappers for single-shape slots. (§5 transport row, addendum item 3)

---

## F. Coordination with sittir-7

**F1. Don't both touch the same emitter at the same time.** `plan.md` is the shared log; check the most recent section before starting.

**F2. Use `--connect` to relay findings without wresting control:**

```bash
GITHUB_TOKEN= copilot --connect=23114631-45be-490a-89f9-33ec197fef14 \
    -p "<message>" -s --allow-all-tools
```

Costs a billed turn and appears in the target session's transcript. See `[[reference-copilot-cli-connect]]`.

**F3. Trust git diff over `plan.md` narrative.** Plan.md drifts (sittir-7 prepends new milestones to the top, baseline numbers go stale, etc.). The working tree is ground truth.

---

## G. Memory hygiene

**G1. File load-bearing findings as memory entries.** Either `feedback_*` (workflow guidance), `project_*` (in-flight state), or `reference_*` (stable tool/resource pointers).

**G2. Update existing memories when state changes.** Don't leave stale "TEMPORARY" or "in-progress" entries when the state has resolved.

---

## H. Open requirements (not yet enforced)

These are requirements that follow from the design or this session's findings but are not yet implemented as enforceable invariants. Each should be addressed before the cleanup is declared complete.

**H1. Token whitespace fidelity invariant (not implemented).** `jjjj` must not become ` jjjj `. Render changes touching token leaves require explicit verification. (May 13 design §6.7, §7.7, §8)

- **Root cause:** The render pipeline does not pass token rules through to the render template. The template therefore has no information about token-specific spacing semantics (adjacent vs spaced, immediate-token vs separated, etc.) and falls back to generic field-spacing helpers — which is what causes `jjjj` to widen to ` jjjj `. The fix is structural, not a regression-test-on-top.
- **Current state:** `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts:297` covers one case (`jjjj` → `"jjjj"`) on the Rust render pipeline. That test is a unit-level fixture, not a corpus-level invariant.
- **Gap:** Token rules are absent from the template input contract. No corpus-level regression catches whitespace drift between source and rendered output.
- **Action (in order):**
  1. Thread token rules from grammar metadata into the template-input data structure produced by `packages/codegen/src/emitters/render-module.ts` (and the upstream slot model in `compiler/node-map.ts`).
  2. Update the Askama / Jinja templates to honor the token-rule annotations when emitting adjacent vs spaced output.
  3. Add a corpus-level regression that flags any rendered output gaining/losing whitespace vs the source on token-only-derived spans (counts-side check is the natural spot since corpus walking is already there).

**H2. Validator counts output should include failing entry names.** ~~The current `counts` output gives bucket aggregates only.~~ **Implemented 2026-05-15.**

`packages/validator/src/cli.ts` now appends the first 5 failing entries per stage to the counts output:

```
rust/native:
  fromPass=137    fromTotal=168
  ...
  read-render-parse first failures (5 of 53):
    "Modules [source_file]" — re-parse error: "mod english ; ..."
    "Extern crate declarations [source_file]" — re-parse error: ...
    ...
  factory-render-parse first failures (5 of 37):
    "Async Block (async_block)" — re-parse error: "async "
    ...
```

For read-render-parse and read-render-parse-shallow the label is the corpus entry name (with `[kind]` appended where the validator tracks it). For factory-render-parse the label is `"<entry> (<kind>)"` since failures are per-kind synthesized constructions. For from validation the label is the kind name (no corpus entries).

**H3. `pnpm -r run build` must succeed cleanly.** Currently fails on:

- TS2339/TS2345 in generated `wrap.ts` for python/typescript/rust grammar packages (the `$children` typing widening drift)
- TS6307 in `@sittir/validator` (cross-package source-path imports of codegen)

See `[[project-wrap-emitter-children-typing-followup]]` for fix paths. Both must resolve before the branch can ship cleanly to production consumers.

---

## I. Sunset note

These rules apply to the 024 cleanup pass. Most of the **Invariants** (sections A, D, E) are durable and should fold into project conventions / `CLAUDE.md` after closeout. The **Workflow** sections (B, C) are durable too. The **Requirements** in section H are open items that will be removed from the rules once they're enforced. **Coordination** (section F) is specific to the parallel sittir-7 collaboration and will retire when that collaboration ends.
