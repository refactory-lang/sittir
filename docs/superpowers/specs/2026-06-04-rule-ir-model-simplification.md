# Rule-IR / Model Simplification — Spec (2026-06-04)

**Status:** design-approved (design authority: Pradeep). Consolidates three converging threads that share one principle:

> **Structure drives behavior. Provenance is diagnostic-only. Ambiguity is surfaced as a diagnostic, never silently resolved.**

Gate for every step: RELEASE `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`, deep `read-render-parseAstMatchPass`, floor **rust 111 / ts 69 / py 74**. Most of this is render-neutral; a gate move = a real finding, not something to force.

---

## 1. Slot naming (→ lands in/with PR-L)

Detailed in the master-plan `§slot-naming note` (`2026-05-26-compiler-simplification-master-plan.md`). Summary:
- Kill the opaque `isStructuralChoice` + first-arm-name fallback in `collect-slots.ts`.
- A choice with **no derivable name → `content`** (never the first arm); a derivable name (kind, or a field shared by every arm) → use it.
- Collision (content **or** kind-name) → propose-promotion **diagnostic**, symmetric.
- The `mergeByName`/`mergeChoiceArms` fold is **lossy** (keeps `values` + boolean flank, discards per-arm surrounding artifacts) → **diagnostic-gate it on surrounding-equivalence**; **limit to choice arms**; **only when arms are single-slot post-simplify**; **move it from `collect-slots` into `simplify`**.

---

## 2. §D — group/branch classification + alias-reference model

### 2a. Classification: `AssembledGroup ≡ Branch + inline`  — *(Stage 1, render-neutral, landing now)*
- **`inline`** = not-a-parse-kind: ∈ the grammar's `inline:` array (`wire.ts buildWiredInlineFn`, drained from `syntheticInline`); tree-sitter flattens it into the parent's parse table → **no standalone CST node**, absent from `node-types.json`.
- **`hidden` (our PoV) ≡ `inline`** — after the 2b coalescing the only branch-shaped non-parse-kinds left are the inline ones. The bare `_`-prefix is NOT the criterion; "has no parse kind" is.
- **Predicate:** `branch-shaped && inline → AssembledGroup`; `branch-shaped && parse-kind → AssembledBranch`.
- **Delete** the `seq + has-fields` heuristic body of `classifyHiddenSeqRule` (`link.ts:~1824`); classification keys on `inline`. Result: the **63** `_`-NOT-inline groups (rust 23 / ts 32 / py 8) → `AssembledBranch` (group↔branch emit is byte-identical for them — verified); the **34** inline groups (rust 21 / ts 10 / py 3) → stay `AssembledGroup` (their distinct emit — folds into the parent template, no standalone `.jinja` — justifies the model type, not a scattered `if (hidden)`).
- `GroupRule` / `isGroup` / `'group'` arms **survive** — now strictly = "inline branch," not an opaque heuristic.

### 2b. Alias-reference — two-node, **non-lossy (reference, NOT coalesce)**
Every alias-coerced kind is **two entities** (hidden body + visible Branch), linked by back-pointers — never merged:
- **Hidden node (Group / Supertype): `contentAliasedTo[]: kindId[]`** — the visible kind(s) this body's content is aliased to. **Array** — a body may legitimately feed multiple visible kinds (fan-out OK).
- **Branch (visible): `contentAliasedFrom: kindId`** — the **single** hidden source of this Branch's content. Singular by invariant (fan-in = 1).
- **Emit de-dups via the reference, not deletion:** the visible Branch emits transport/render as today; the hidden body (with `contentAliasedTo` set) **skips its standalone emit**. The 4 ts dead-duplicate transports (`_CallSignatureTransport`/`render__call_signature` for `call_signature`/`module`/`number`/`catch_clause_group1`) disappear **because the reference makes them redundant**, not because the node is removed (entity stays for traceability — `feedback_no_lossy_distillation`).
- **Sites:** set the back-pointers in `link.mintContentAliasKinds` (`link.ts:~650`); add the two arrays to the node-map classes (`AssembledGroup`/`AssembledSupertype` → `contentAliasedTo`, `AssembledBranch` → `contentAliasedFrom`); the emitter skips standalone emit when `contentAliasedTo` is set.

### 2c. Non-injective diagnostic — the integrity guard *(point 3)*
- `contentAliasedFrom` is **single by invariant**. If the alias map would give a visible Branch **>1** content source → **error diagnostic** (post-link, propose-promotion). (`contentAliasedTo[].length > 1` is **allowed** — fan-out body reuse — no diagnostic.)
- Checked during/post `mintContentAliasKinds`.

---

## 3. Source-retirement

- **Retire all behavior driven off `source === 'xxx'`** (after evaluate) — `feedback_metadata_not_behavior`. Replace each branch with the **structural fact** it stands in for (the §D predicate already does this — `inline`, not `source:'group-lift'`).
- **Reformat provenance to `metadata.source = "[phase]"` | `"[phase].[method]"`** (e.g. `"enrich.applyClauseHoist"`) — retained for tracing, **never read by behavior**.
- Subsumes the long-deferred "sunset legacy top-level `source:'group-lift'`."

---

## Sequencing

- **§D 2a** (classification) — **landing now** (closes the render-neutral core of M-φ2 §D).
- **§D 2b + 2c** (alias-reference two-node model + non-injective diagnostic) — re-dispatched as a clean task from this spec; scope = all alias-coerced kinds (un-coalesces the currently-single-node 63 into hidden-body + visible-Branch pairs carrying the back-pointers).
- **Slot-naming (§1)** + **Source-retirement (§3)** — PR-L (`Flip heuristics → propose-* fail-diagnostics`).

## Key sites (file:line)
- `link.ts` — `classifyHiddenSeqRule:~1824` (delete heuristic → `inline` check), `mintContentAliasKinds:~650` (back-pointers + injective diagnostic).
- `assemble.ts` — `classifyNode:~1182` (branch-detection target for the 63).
- `node-map.ts` — `AssembledGroup:3685` / `AssembledBranch:2762` (`contentAliasedTo[]` / `contentAliasedFrom`).
- `evaluate.ts` — `isHiddenKind:553`; `wire.ts` — inline drain `:659-676`, `buildWiredInlineFn:1041`.
- `collect-slots.ts` — `isStructuralChoice`, `mergeByName:~192`, `mergeChoiceArms:~218` (§1); `simplify.ts` (new merge home); `diagnose-slot-grouping.ts` (named-collision mirror).
