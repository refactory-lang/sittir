# PR-M-ir Scope Amendment — Design (2026-06-05)

**Status:** design-approved (design authority: Pradeep). **Amendment, not a replacement** — it ties new corpus evidence into the existing PR-M-ir documents rather than superseding them:
- `docs/superpowers/specs/2026-06-04-rule-ir-model-simplification.md` (§D model + alias-reference)
- `docs/superpowers/plans/2026-05-31-pr-m-rule-ir-cut.md` (the polymorph→`AssembledBranch` cut; Task 0 inventory)
- `docs/superpowers/plans/2026-06-04-d2a-normalize-inline.md` (§D-2a group-inline hoist)
- `docs/superpowers/plans/2026-06-04-pr-m-phi2-handoff.md` (A1 family)

**Gate (unchanged):** RELEASE `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`, deep `read-render-parseAstMatchPass`, floor **rust 111 / ts 69 / py 74**. Everything in this amendment is **byte-neutral** model work. `M ≺ I` holds: PR-M-ir restructures the Model; the render fixes that consume the new shape are **PR-I**.

---

## Why this amendment

New corpus evidence (2026-06-05) — surfaced while triaging PR #61 review comments — looked like four fresh render bugs:
- `yield from x` renders `yield x` (the `from` literal segregated into `$other`, never rendered).
- `match_block` emits its `match_arm` list **twice** (`{{ match_arm | join }} {{ match_arm | join }}`).
- `dict_pattern` joins all keys, one `:`, all values → `{a,b:x,y}`; drops `splat_pattern` (parallel-array render loses per-entry pairing).
- `slice` renders `a:b :c` (the `step` group renders its own `:`; the parent inserts a stray space).

All are **corpus-blind** (deep-AST holds at floor — these kinds aren't in the read-render-parse witness set; they would show in the wider, non-gating `factory-render-parse`).

**The finding is not "four new bugs."** Each lands in a bucket PR-M-ir already owns, and two of them are the *exact* cases the rule-ir-cut Task-0 gate predicted would force a re-scope. So we scope the handling **now** instead of discovering it mid-execution.

---

## The three form classes

Every choice/seq-arm "form" classifies into one of three. This classification is the spine of the amendment.

| class | corpus instances | what the model must guarantee | path |
|---|---|---|---|
| **single-slot** | the bulk of polymorph forms | nothing new — the byte-neutral forms-getter seam is sound (`fieldCount===1`) | proceed as planned (D) |
| **discriminating-literal** | `yield` (`from`), `visibility_modifier` (`in`), `except_clause` (`as`) | the per-arm form **carries its distinguishing literal(s)** — not leaked to `$other`, not emitted ungated | literal-carrying invariant (E) → A1 fold (F) |
| **fused** (`fieldCount>1`) | `dict_pattern` (key+value per entry), `match_block` (repeat-arms + last-arm) | the fused form becomes a **single-slot group with a real kindId** before the cut | elevation (C) |

**`yield from` is an A1 instance, not a new problem.** `visibility_modifier`/`except_clause`/`yield` are one root: a literal inside a choice/seq arm dropped (`from` → `$other`) or emitted ungated (`as`, `in`). Empirically confirmed (`probe-kind` 2026-06-05): for `yield from x`, `_content = "x"` only; `from` sits in `$other:[78,5]`; the template `yield{% if content %} {{ content }}{% endif %}` never renders `$other`.

**`dict_pattern`/`match_block` are the `fieldCount>1` fused forms Task 0 STOPs on.** The rule-ir-cut entry gate is verbatim: *"all `fieldCount===1` ⇒ the byte-neutral `forms`-getter seam is sound; any `fieldCount>1` ⇒ a fused multi-field form the derived getter would drop → STOP / re-scope (elevate to a wire group kind, or carve that kind out)."* This amendment takes the **elevate** branch (design decision 2026-06-05).

---

## Components (all byte-neutral; sequenced)

### A. Extended Task 0 inventory — read-only, BLOCKING
Extend the planned polymorph inventory (`{grammar, kind, formIndex, fieldCount}`) into a **census** that assigns every form to one of the three classes above. Output drives which kinds take the single-slot / literal-carrying / elevation path. Read-only `sittir-research` job; nothing proceeds until it is complete and reviewed. (Supersedes the bare "STOP if any `fieldCount>1`" with a classification that already knows the answer for each kind.)

### B. §D-2a group-inline hoist — lands first
Execute `2026-06-04-d2a-normalize-inline.md` unchanged (relocate group-inline to a normalize rule-tree hoist; seq-unit multiplicity; render-neutral). Closes the M-φ2 §D core. Independent of the cut.

### C. Fused-form elevation
For each **fused** form (from A), wire-synthesize a group kind with a real kindId (`dict_pattern` → a key/value entry group; `match_block` → a `match_arm` group distinguishing repeat vs last) via the **existing visible-group mechanism** (`alias($._name, $.name)` minted through `mintContentAliasKinds`, `link.ts:~650` — the same path φ2 landed). After C, every form is single-slot, so the forms-getter seam in D is sound. **Byte-neutral:** these kinds already mis-render and are absent from the passing corpus, so the gate holds; the per-entry render *fix* is PR-I.

### D. Polymorph → `AssembledBranch` + `discriminatingSlot`
The bulk, from `2026-05-31-pr-m-rule-ir-cut.md`: cut the sittir-invented Rule-IR types (`PolymorphRule`/`VariantRule`/`ClauseRule`/GroupRule-classifier); collapse `AssembledPolymorph → AssembledBranch` whose `discriminatingSlot` choice-arms ARE the former forms. After A–C, every arm is single-slot or single-slot+literal.

### E. Literal-carrying invariant + diagnostic
The model **guarantees** each per-arm form carries its distinguishing literals. Add a post-cut **diagnostic** that fails if a form would drop a literal (mirrors the spec's "ambiguity is surfaced as a diagnostic, never silently resolved"). This invariant is precisely what lets PR-I emit per-arm-guarded templates that render `from`/`as`/`in`.

### F. A1 fold
`visibility_modifier` (`pub ()`), `except_clause` (`except E as:`), and `yield` (`yield from`) ride D+E — the same arms-as-forms shape. No separate mechanism. (Per the φ2 handoff, the naive "all-arms-concat via `isStructuralChoice`" fix is WRONG and reverted; the per-arm-guarded emission is PR-I, enabled by E.)

### G. §D-2b/2c alias-reference two-node model + non-injective diagnostic
Execute §D-2b/2c from `2026-06-04-rule-ir-model-simplification.md` (two-node hidden-body + visible-Branch with `contentAliasedTo[]`/`contentAliasedFrom` back-pointers; fan-in>1 → error diagnostic). **Fold in the PR-62 lift-centralization gaps**, since both touch the lift's completeness and `mintContentAliasKinds`:
- `link.ts:127` — `liftSeparators` runs before `mintContentAliasKinds`, which mints visible rules via `resolveRule(body)` **without** re-lifting; an enrich content-alias over a separated list leaves the minted visible kind with raw `repeat(seq(sep,x))`. Re-lift minted bodies (or order the lift after minting).
- `lift-separators.ts:164` — confirm whether `variant`/`group`/`terminal` wrapper shapes can hold separated lists at link time; if so, recurse into them (the default-case comment asserts they appear only post-classification — verify).

---

## Deliverable boundary

**In PR-M-ir (byte-neutral, gate at floor):** A–G.

**Out → PR-I** (the emitter rewrite that consumes the new model): the render fixes themselves — `yield` emits `from`; `dict_pattern` per-entry pairing; `match_block` emits arms once; per-arm-guarded structural-choice emission for the A1 family.

**Out → deferred render-time-spacing workstream:** `slice` `a:b :c` (and the whole `needsSeqSpace` symbol-vs-literal family) → render-time buffer look-ahead, per the d2a plan's "Deferred follow-up — strategic render-time spacing."

---

## Key sites (file:line — verify before editing; some shift with regen)
- `link.ts` — `classifyHiddenSeqRule:~1824` (§D-2a), `mintContentAliasKinds:~650` (C elevation + G back-pointers + the PR-62 re-lift gap at `:127`).
- `lift-separators.ts:~142` (`liftSeparators` wrapper recursion — G).
- `assemble.ts` — `classifyNode:~1182` (branch detection).
- `node-map.ts` — `AssembledGroup` / `AssembledBranch` (`contentAliasedTo[]`/`contentAliasedFrom`; `discriminatingSlot`).
- `2026-05-31-pr-m-rule-ir-cut.md` Task 0 (extend to the three-class census — A).
- Polymorph/form emit (`templates.ts emitChoice:~1602`, first-arm fallback `:1634`) — the A1/literal-carrying read sites, but the *fix* is PR-I.

---

## Risks / open checks
- **Elevation byte-neutrality (C):** synthesizing a kv/arm group changes the slot structure of already-mis-rendering kinds. Expected gate-neutral (they're not in the passing corpus), but Task-A census must confirm none of the fused kinds is currently *passing* — if one is, elevation could move it. Per-kind-gate to bisect.
- **Literal-carrying diagnostic (E)** may fire on forms beyond the three known A1 cases — that's the point (it surfaces the full set); triage each before the cut proceeds.
- **PR-62 lift gaps (G)** held the gate (corpus-blind) — re-lifting minted bodies must stay byte-neutral; a gate move = a real finding.
