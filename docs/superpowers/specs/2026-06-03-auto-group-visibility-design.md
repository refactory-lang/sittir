# Auto-Group Visibility & Declared-Alias Naming — Design

**Date:** 2026-06-03
**Branch:** `pr-m-phi2-enrich-clause-convergence` (PR-M auto-group consolidation)
**Status:** design (spec) — precedes implementation plan
**Supersedes the relevant part of:** `docs/superpowers/plans/2026-06-03-auto-group-consolidation-handoff.md` step 2

---

## Goal (one sentence)

Let enrich hoist **every** `optional(seq)` / `repeat(seq)` / `repeat1(seq)` uniformly toward the IR while rendering correctly, by splitting hoisted groups into **inline-safe** (hidden symbol + inline+gate) and **inline-unsafe** (surfaced as a **visible CST node via `alias()` on the inline content**), with declared `groups:` entries supplying only the visible **name**.

## Why (the problem this solves)

The "1a" attempt (generalize enrich to hoist all non-clause `optional(seq)`) regressed two kinds and could not reach the gate floor (see memory `project_1a_coupled_to_visible_groups`):

- ts **`enum_body`** = `repeat1(choice(field(name), enum_assignment))` — multi-slot; the inline+gate path gates on the unpopulated group name → members dropped (`enum E {A,B}` → `{ }`).
- rust **`visibility_modifier`** = bare `choice(self, super, crate, path)` (a polymorph arm) — the inline render emits only the first arm, and `self`/`super`/`crate` are Rust keywords that break the Askama-compiled native build.

These are the cases the single-slot-vs-visible rule (memory `project_hoisted_group_slot_visibility_rule`) says must be **visible, not inlined**. 1a therefore cannot land before a working visible-group mechanism exists: **this spec is that mechanism, and it is the prerequisite for the hoist generalization — not a follow-up.**

## What is already committed (sound, do not redo)

`e6a096da` — the **travel-through infra**, RELEASE-green at floor (rust 111 / ts 69 / py 74):
enrich tags every group-lift SYMBOL `metadata.source = 'enrich'` (legacy top-level `source = 'group-lift'` kept transitionally; sunset later). `transform-path.ts applyPath` reads the tag and travels THROUGH the symbol by looking up the referenced `_<parent>_N` body via a resolver enrich registers (`setGroupLiftRuleMap`), patching and writing back. The symbol stays a clean ref (do NOT carry `content` on it — that leaks the seq into grammar.json). This stands; this spec builds on it.

---

## Design

### Pipeline

```
enrich (pre-wire)
  for each optional(seq)/repeat(seq)/repeat1(seq):
    • ruleMatchesEmpty(body)?  → leave un-hoisted (tree-sitter rejects empty named rules)
    • isInlineSafe(body)?      → HOIST: hidden _<parent>_N rule + tagged group-lift symbol
                                  + register in syntheticInline (parser inlines, flat CST) → inline+gate render
    • else (inline-unsafe)     → leave the seq content INLINE (parser inlines it flat)

link  (generalize applyGroupOverrides — IR-only, no grammar change)
  for each inline-unsafe optional/repeat(seq) content enrich left inline:
    • reconstruct it into a VISIBLE IR-only synthesized kind in the link rules map
    • rewrite the parent to reference that kind; readNode/collectSlots reconstruct from flat children
    • name = declared groups: entry for this position, else an auto-derived default

retire applyAutoGroups (step 3) — its work splits: inline-safe → enrich, inline-unsafe → link.
```

### The `isInlineSafe` predicate (shared, DRY — one helper, used by enrich and the wire pass)

After dropping pure literals/punctuation from the seq body, the group is **inline-safe iff the body reduces to exactly ONE slot that is a `field` or `symbol` — and is NOT a bare `choice`.** Everything else (a bare `choice` slot, or ≥2 slots) is **inline-unsafe → visible**.

- inline-safe example: `seq("as", field('alias', expr))` (clause) — gate keys on the single `alias` slot.
- inline-unsafe examples: `seq("(", choice(self,super,crate,path), ")")` (bare choice); `repeat1(choice(field(name), enum_assignment))` (≥2 slots).

`ruleMatchesEmpty(rule)` (conservative — `optional`/`repeat`/`blank` and empty-only `seq`/`choice` match empty; `symbol`/`token`/`pattern`/non-empty `string` do not) gates **both** branches: an empty-matching body is never hoisted nor aliased, because a named (or aliased) tree-sitter rule that matches the empty string is rejected at `tree-sitter generate`, even when inlined.

### Visibility is an IR-side reconstruction in **link** — no grammar change, no new rule

Making a group visible does **not** touch the tree-sitter grammar. The parser keeps the inline-unsafe content exactly where it parsed (flat CST); **`link` (`applyGroupOverrides` in `compiler/group-synthesis.ts`) reconstructs it into a visible IR-only synthesized kind** in the link rules map, rewrites the parent to reference that kind, and readNode/`collectSlots` reconstruct the node from the flat children. This is precisely what declared `groups:` already do (`_visibility_modifier_pub: {'1':'parens'}` → IR kind `_visibility_modifier_pub_parens`, parser-inline + reconstructed) — and why it compiled cleanly pre-1a. The change is to **generalize that pass from declared-only to every inline-unsafe position.**

Consequences (all positive vs the rejected wire/alias approach):
- **No new rule symbol in the grammar → no LR conflict.** The visible kind is IR-only; tree-sitter never sees it.
- **No separate TS rule entry / kindId machinery.** The synthesized kind lives in the link rules map exactly as the existing declared-group kinds do (which already work without a tree-sitter kindId). The earlier "rule-entry REQUIRED" concern was an artifact of the wire/alias framing and does not apply here.
- **Routes through the proven pre-1a visible-render path** — the kind renders the choice via its own `AssembledGroup` template (polymorph/present-arm), sidestepping the inline disjunction-gate that named Rust keywords (`super`) as template variables.

`enrich` therefore hoists only inline-**safe** `optional(seq)` (hidden `_<parent>_N` symbol + rule, reaching parser+IR, inline+gate render); it **leaves inline-unsafe content in place** for `link` to reconstruct.

### Declared `groups:` = alias-name supplier (only)

A declared entry (`_visibility_modifier_pub: { '1': 'parens' }`) **only changes what the auto-visible group is called.** Codegen has already decided (structurally) that the position is visible; the declaration supplies the alias name (`parens` → `_visibility_modifier_pub_parens`). It does **not** synthesize a second group and does **not** rewrite the body — which is why the earlier `derefGroupLift` merge (which resolved/rewrote bodies and corrupted sibling groups `type_argument` / `attributed_*` → `unknown node …`) is **not** the approach. Naming-only = no body rewrite = no sibling corruption.

**Default name (no declaration):** an auto-derived readable alias name based on the parent + ordinal (e.g. `_<parent>_groupN`), stable across regens via the existing canonical-stringify cross-parent dedupe. Declared names override the default.

### IR reach

Both branches reach the IR as kinds: inline-safe hidden groups materialize as their own `AssembledGroup` (the `source==='group-lift'` path in `inlineRefs` already skips inlining them in the IR), and inline-unsafe groups become visible IR-only synthesized `AssembledGroup` kinds via link. So the consolidation goal (uniform IR-reaching groups) holds.

### Travel-through interaction (committed infra)

- inline-safe (hidden symbol): authored `transform()`/`groups:` path patches that address into the position travel THROUGH the tagged symbol (the committed `setGroupLiftRuleMap` lookup).
- inline-unsafe (aliased inline content): patches address the inline content directly — no symbol to travel through; path descent reaches it as before.

---

## Components (files)

- `packages/codegen/src/dsl/group-classify.ts` (NEW) — `isInlineSafe(seqBody)` + `ruleMatchesEmpty(rule)` shared predicates. Used by enrich AND link (no duplication).
- `packages/codegen/src/dsl/enrich.ts` — generalize `applyClauseHoist`: hoist inline-safe optional(seq) (drop the clause-only predicate), apply `ruleMatchesEmpty` + `isInlineSafe` guards; leave inline-unsafe content **inline** (un-hoisted). (`makeGroupLiftSymbol` already tags `metadata.source`.)
- `packages/codegen/src/compiler/group-synthesis.ts` (+ its `link.ts` call site) — generalize `applyGroupOverrides` from declared-only to **every inline-unsafe** `optional/repeat(seq)` position: reconstruct it into a visible IR-only synthesized kind, naming from `groups:` config or an auto-derived default. Uses `isInlineSafe` to select positions. Declared entries are **naming-only** (no `derefGroupLift` body rewrite — that corrupted siblings).
- `packages/codegen/src/dsl/wire/auto-groups.ts` — **deleted** (Chunk 3); its inline-safe work moves to enrich, its inline-unsafe work to link.
- emitters/slots — verify the existing visible-`AssembledGroup` render + wrap path handles the now-generalized synthesized kinds (pre-1a it handled the hand-declared ones; confirm it generalizes).

## Error handling

- Empty-matching body → never hoisted/aliased (guard). If a future case still produces an empty aliased rule, `tree-sitter generate` fails loudly with the rule name — fix the guard, don't suppress.
- A declared `groups:` name colliding with an existing kind → hard error at config-load (existing `validateGroupsConfig` behavior, retained).
- Rust-keyword slot names: expected to be avoided by the visible-render path (pre-1a precedent). If the native build still reports `unknown node <keyword>`, add raw-identifier escaping (`r#…`) in the Rust slot-name emitter as a scoped follow-up — out of scope for the first cut unless it surfaces.

## Testing & gates

- **Authoritative gate (RELEASE only):** `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`; confirm `Finished release profile [optimized]` + read the explicit deep `read-render-parseAstMatchPass=` lines. Debug build segfaults (Node-v24/napi) are NOT regressions. Floor: rust 111 / ts 69 / py 74; target: hold-or-improve toward 125/72/76.
- **Witness kinds (must pass deep AST match):** ts `enum_body` (`enum E { A, B }` → `{ A, B }`), rust `visibility_modifier` (`pub(super)` → `pub(super)`).
- Unit tests: `isInlineSafe` / `ruleMatchesEmpty` truth tables; the link generalized `applyGroupOverrides` (inline-unsafe → visible IR kind; names from config/default; declared = rename-only, sibling bodies unchanged); enrich hoists only inline-safe; `applyAutoGroups`-no-op assertion before deletion (`synthRules`/`rewrites` empty).
- Never stage `rust/crates/sittir-*/test-fixtures.json` / `validation-history.jsonl`. Commit by explicit pathspec.

## Sequencing (implementation increments, each gated on RELEASE)

1. Shared `isInlineSafe` + `ruleMatchesEmpty`; enrich hoists inline-safe only (gate hold-or-improve; inline-unsafe dips, recovered in step 2).
2. Generalize link `applyGroupOverrides` to reconstruct every inline-unsafe position as a visible IR kind (auto default names); declared `groups:` supply names (rename-only). **Gate: witnesses pass, floor held.**
3. Retire `applyAutoGroups` (assert no-op first). Gate.
4. (Deferred, only if surfaced) Rust-keyword slot escaping.

## Out of scope / deferred

- Sunsetting the legacy top-level `source: 'group-lift'` once IR readers migrate to `metadata.source`.
- PR-I-φ2 count recovery (match_arm residual) and PR-P (terminal/enum).
- The single-entry `sittirGrammar(base, cfg)` composition cleanup.
