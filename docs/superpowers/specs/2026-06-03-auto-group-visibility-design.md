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
    • ruleMatchesEmpty(body)?  → leave un-hoisted (tree-sitter rejects empty named/aliased rules)
    • isInlineSafe(body)?      → HOIST: hidden _<parent>_N rule + tagged group-lift symbol
                                  + register in syntheticInline (parser inlines, flat CST)
    • else (inline-unsafe)     → leave the seq content inline for the wire pass to alias

wire pass  (REPLACES applyAutoGroups)
  for each inline-unsafe optional/repeat(seq) content enrich left in place:
    • wrap the CONTENT in  alias(<content>, $.<aliasname>)   — INLINE, no hidden rule introduced
    • aliasname = declared groups: entry for this position, else an auto-derived name
    • → tree-sitter emits a visible CST node; the IR classifies it as an AssembledGroup kind

retire applyAutoGroups (step 3) — the wire pass subsumes its responsibility.
```

### The `isInlineSafe` predicate (shared, DRY — one helper, used by enrich and the wire pass)

After dropping pure literals/punctuation from the seq body, the group is **inline-safe iff the body reduces to exactly ONE slot that is a `field` or `symbol` — and is NOT a bare `choice`.** Everything else (a bare `choice` slot, or ≥2 slots) is **inline-unsafe → visible**.

- inline-safe example: `seq("as", field('alias', expr))` (clause) — gate keys on the single `alias` slot.
- inline-unsafe examples: `seq("(", choice(self,super,crate,path), ")")` (bare choice); `repeat1(choice(field(name), enum_assignment))` (≥2 slots).

`ruleMatchesEmpty(rule)` (conservative — `optional`/`repeat`/`blank` and empty-only `seq`/`choice` match empty; `symbol`/`token`/`pattern`/non-empty `string` do not) gates **both** branches: an empty-matching body is never hoisted nor aliased, because a named (or aliased) tree-sitter rule that matches the empty string is rejected at `tree-sitter generate`, even when inlined.

### Visibility = `alias` on inline **content**, not a hidden symbol

Making a group visible wraps the rule's **content** in `alias(<content>, $.<name>)` — the content stays exactly where it parsed, surfaced as a named CST node. Because **no new rule symbol is introduced into the grammar**, the LR table is unchanged at that position → **no new conflicts** (this is why visible groups do not need a `conflicts:`-declaration mechanism). This also routes the kind through the proven pre-1a visible-render path (its own template renders the choice as a polymorph/variant), which avoids the inline disjunction-gate that named Rust keywords (`super`) as template variables.

This is the same `alias(...)`-based surfacing the existing body-pattern `groups:` (`attributed_*`) already rely on; the wire pass generalizes it to every inline-unsafe auto-hoisted position.

### Rule-entry creation for visible aliased kinds (kindId) — REQUIRED

Aliasing inline content surfaces a CST node named `<aliasname>` but introduces **no explicit rule/symbol** for it. The IR pipeline (evaluate → link → assemble) keys kinds off rule entries, so without one the visible kind has **no kindId, no template, no type** — and it would violate the invariant that every kind has a kindId (memory `project_every_kind_has_kindid_invariant`). Therefore the wire pass **must explicitly register a rule entry** for each visible aliased kind (`<aliasname>` → the lifted content) so codegen sees it as an `AssembledGroup` kind.

The exact tree-sitter realization that simultaneously yields **(a) a visible node, (b) a kindId-bearing rule entry, and (c) no LR conflict** is the central thing the implementation must pin down empirically (gate on RELEASE per increment). Two candidate forms to evaluate:

1. **alias of an inlined hidden rule** — register `_<aliasname>` → content into `base.grammar.rules` (kindId + reaches tree-sitter), keep it in `syntheticInline` (parser inlines it → no conflict, same as inline-safe groups), and reference it as `alias($._<aliasname>, $.<aliasname>)` so the alias surfaces the otherwise-inlined kind as a visible node (this is exactly how body-pattern `attributed_*` groups already make inlined hidden rules appear). Preferred starting point — it satisfies the kindId invariant via real base-rule injection rather than a TS-side-only virtual kind.
2. **alias of inline content + a parallel IR-only kind entry** — `alias(<content>, $.<aliasname>)` for the parser, plus a synthesized IR kind entry so codegen emits the kind. Avoids any hidden rule but introduces a TS-side-only kind, which the kindId invariant discourages; fall back only if (1) reintroduces conflicts.

Decide (1) vs (2) by the conflict/kindId outcome under the RELEASE gate, not a priori.

### Declared `groups:` = alias-name supplier (only)

A declared entry (`_visibility_modifier_pub: { '1': 'parens' }`) **only changes what the auto-visible group is called.** Codegen has already decided (structurally) that the position is visible; the declaration supplies the alias name (`parens` → `_visibility_modifier_pub_parens`). It does **not** synthesize a second group and does **not** rewrite the body — which is why the earlier `derefGroupLift` merge (which resolved/rewrote bodies and corrupted sibling groups `type_argument` / `attributed_*` → `unknown node …`) is **not** the approach. Naming-only = no body rewrite = no sibling corruption.

**Default name (no declaration):** an auto-derived readable alias name based on the parent + ordinal (e.g. `_<parent>_groupN`), stable across regens via the existing canonical-stringify cross-parent dedupe. Declared names override the default.

### IR reach

Both branches reach the IR as kinds: inline-safe hidden groups materialize as their own `AssembledGroup` (the `source==='group-lift'` path in `inlineRefs` already skips inlining them in the IR), and inline-unsafe aliased groups are visible CST nodes → `AssembledGroup` kinds. So the consolidation goal (uniform IR-reaching groups, one synthesizer) holds.

### Travel-through interaction (committed infra)

- inline-safe (hidden symbol): authored `transform()`/`groups:` path patches that address into the position travel THROUGH the tagged symbol (the committed `setGroupLiftRuleMap` lookup).
- inline-unsafe (aliased inline content): patches address the inline content directly — no symbol to travel through; path descent reaches it as before.

---

## Components (files)

- `packages/codegen/src/dsl/enrich.ts` — generalize `applyClauseHoist`: hoist inline-safe optional(seq) (drop the clause-only predicate), apply `ruleMatchesEmpty` + `isInlineSafe` guards; leave inline-unsafe content un-hoisted. (`makeGroupLiftSymbol` already tags `metadata.source`.)
- `packages/codegen/src/dsl/wire/` — new visible-alias pass (the `applyAutoGroups` replacement): scan inline-unsafe optional/repeat(seq) content, wrap in `alias(content, $.<name>)`, naming from `groups:` config or default. Retire `dsl/wire/auto-groups.ts`.
- shared predicate module — `isInlineSafe(seqBody)` + `ruleMatchesEmpty(rule)` used by both enrich and the wire pass (no duplication).
- `packages/codegen/src/compiler/group-synthesis.ts` — `applyGroupOverrides` becomes naming-only over auto-visible positions (no `derefGroupLift` body rewrite); reconcile with the alias-name supply.
- emitters/slots — verify the existing visible-`AssembledGroup` render + wrap path handles the auto-aliased kinds generically (pre-1a it handled the hand-declared ones).

## Error handling

- Empty-matching body → never hoisted/aliased (guard). If a future case still produces an empty aliased rule, `tree-sitter generate` fails loudly with the rule name — fix the guard, don't suppress.
- A declared `groups:` name colliding with an existing kind → hard error at config-load (existing `validateGroupsConfig` behavior, retained).
- Rust-keyword slot names: expected to be avoided by the visible-render path (pre-1a precedent). If the native build still reports `unknown node <keyword>`, add raw-identifier escaping (`r#…`) in the Rust slot-name emitter as a scoped follow-up — out of scope for the first cut unless it surfaces.

## Testing & gates

- **Authoritative gate (RELEASE only):** `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`; confirm `Finished release profile [optimized]` + read the explicit deep `read-render-parseAstMatchPass=` lines. Debug build segfaults (Node-v24/napi) are NOT regressions. Floor: rust 111 / ts 69 / py 74; target: hold-or-improve toward 125/72/76.
- **Witness kinds (must pass deep AST match):** ts `enum_body` (`enum E { A, B }` → `{ A, B }`), rust `visibility_modifier` (`pub(super)` → `pub(super)`).
- Unit tests: `isInlineSafe` / `ruleMatchesEmpty` truth tables; the wire alias pass (inline-unsafe → `alias(content, name)`, names from config/default); enrich hoists only inline-safe; `applyAutoGroups`-no-op assertion before deletion (`synthRules`/`rewrites` empty).
- Never stage `rust/crates/sittir-*/test-fixtures.json` / `validation-history.jsonl`. Commit by explicit pathspec.

## Sequencing (implementation increments, each gated on RELEASE)

1. Shared `isInlineSafe` + `ruleMatchesEmpty`; enrich hoists inline-safe only (gate hold-or-improve).
2. Wire visible-alias pass for inline-unsafe content (default names); declared `groups:` supply names; `applyGroupOverrides` → naming-only. **Gate: witnesses pass, floor held.**
3. Retire `applyAutoGroups` (assert no-op first). Gate.
4. (Deferred, only if surfaced) Rust-keyword slot escaping.

## Out of scope / deferred

- Sunsetting the legacy top-level `source: 'group-lift'` once IR readers migrate to `metadata.source`.
- PR-I-φ2 count recovery (match_arm residual) and PR-P (terminal/enum).
- The single-entry `sittirGrammar(base, cfg)` composition cleanup.
