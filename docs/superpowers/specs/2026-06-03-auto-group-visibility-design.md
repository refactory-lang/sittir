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
enrich (pre-wire) / wire
  for each optional(seq)/repeat(seq)/repeat1(seq):
    • ruleMatchesEmpty(body)?  → leave un-hoisted (tree-sitter rejects empty named rules)
    • isInlineSafe(body)?      → HOIST: hidden _<parent>_N rule + tagged group-lift symbol
                                  + syntheticInline (parser inlines, flat CST) → inline+gate render
    • else (inline-unsafe)     → wrap content in  alias(<content>, $.<name>)   ← alias of CONTENT, not a
                                  symbol → no new rule → no LR conflict; name from groups: or default

link  (NEW rule-registration pass)
  when traversing the rule tree, for each  alias(<non-symbol content>, $.<name>):
    • add  <name> = <content>  to the linkedRule list  → mints the visible kind (template/type/slots)
    • generic — no manual per-group registration, no base.grammar.rules injection, no kindId machinery

retire applyAutoGroups (step 3) — inline-safe → enrich; inline-unsafe alias → enrich/wire + link pass.
```

### The `isInlineSafe` predicate (shared, DRY — one helper, used by enrich and the wire pass)

After dropping pure literals/punctuation from the seq body, the group is **inline-safe iff the body reduces to exactly ONE slot that is a `field` or `symbol` — and is NOT a bare `choice`.** Everything else (a bare `choice` slot, or ≥2 slots) is **inline-unsafe → visible**.

- inline-safe example: `seq("as", field('alias', expr))` (clause) — gate keys on the single `alias` slot.
- inline-unsafe examples: `seq("(", choice(self,super,crate,path), ")")` (bare choice); `repeat1(choice(field(name), enum_assignment))` (≥2 slots).

`ruleMatchesEmpty(rule)` (conservative — `optional`/`repeat`/`blank` and empty-only `seq`/`choice` match empty; `symbol`/`token`/`pattern`/non-empty `string` do not) gates **both** branches: an empty-matching body is never hoisted nor aliased, because a named (or aliased) tree-sitter rule that matches the empty string is rejected at `tree-sitter generate`, even when inlined.

### Visibility = `alias(content)` in the rule tree + a new link rule-registration pass

Making a group visible has two halves:

1. **enrich (or wire) wraps the inline-unsafe content in `alias(<content>, $.<name>)`** in the rule tree. The aliased thing is the **content itself, not a hidden symbol** — so **no new rule is introduced into the grammar → no LR conflict** (the rejected approach aliased/promoted a symbol, which adds a rule). tree-sitter emits a visible CST node for `<name>`; wrap reads it.

2. **New link enhancement — `alias(non-symbol content, $.name)` → `name = content` added to the linkedRule list.** When link traverses the rule tree and finds an alias whose aliased child is **non-symbol content** (an inline seq/choice/…), it registers `<name>` as a kind (body = the aliased content) in the linked rules map. This mints the visible kind (template / type / slots) **generically** — no manual per-group rule registration, no separate `base.grammar.rules` injection, no kindId machinery. The restriction to **non-symbol** content is what scopes the enhancement to these visible groups; `alias($._symbol, $.name)` keeps its existing `aliasedFrom` handling untouched.

**Declared `groups:` registration supplies the friendly `<name>`** for the alias (`_visibility_modifier_pub: {'1':'parens'}` → `alias(<the parens seq>, $.parens)`); undeclared inline-unsafe positions get an auto-derived default name.

Consequences: no LR conflict (alias of content, not a symbol/rule), no TS-side kindId machinery (link mints the IR kind from the alias it finds), and the kind renders the choice via its own `AssembledGroup` template — sidestepping the inline disjunction-gate that named Rust keywords (`super`) as template variables.

**The one pre-flight unknown (spike):** `alias(<content>, $.name)` invents a visible kind `name` that has **no rule at parse time** (tree-sitter runs before link mints the IR rule). The plan's Task 1.0 spikes which tree-sitter form actually emits a visible CST node for such a new name: (1) phantom symbol `alias(content, $.name)`, (2) string `alias(content, 'name')`, or (3) a real trivial rule `name = <minimal non-empty body>` + alias (NOT `blank()` — named empty rules are rejected). The winning form decides the alias emission and whether the link pass keys on a symbol-target or string-name alias.

`enrich` therefore hoists only inline-**safe** `optional(seq)` (hidden `_<parent>_N` symbol + rule, reaching parser+IR, inline+gate render); inline-unsafe content is **aliased visible** (by enrich or wire) and **registered as a kind by the new link pass**.

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

- `packages/codegen/src/dsl/group-classify.ts` (NEW) — `isInlineSafe(seqBody)` + `ruleMatchesEmpty(rule)` shared predicates. Used wherever inline-safe-vs-unsafe is decided (no duplication).
- `packages/codegen/src/dsl/enrich.ts` (or a wire pass) — for each `optional/repeat(seq)`: hoist inline-safe into a hidden symbol (generalize `applyClauseHoist`); wrap inline-unsafe content in `alias(<content>, $.<name>)` (name from `groups:` config or auto-derived default). `ruleMatchesEmpty` guards both.
- `packages/codegen/src/compiler/link.ts` (+ a small new helper) — **NEW pass:** when traversing the rule tree, for each `alias(<non-symbol content>, $.<name>)` add `<name> = <content>` to the linkedRule list (mint the visible kind). Generic; runs early enough that `classifyHiddenRule`/`assemble` see the new kind. Symbol aliases (`aliasedFrom`) are untouched.
- `packages/codegen/src/compiler/group-synthesis.ts` — declared `groups:` entries become **naming-only** for the alias (no `derefGroupLift` body rewrite — that corrupted siblings). If the declared body-pattern groups (`attributed_*`) already cover their positions via the existing alias path, confirm no double-handling.
- `packages/codegen/src/dsl/wire/auto-groups.ts` — **deleted** (Chunk 3); inline-safe → enrich, inline-unsafe → alias + link pass.
- emitters/slots — verify the existing visible-`AssembledGroup` render + wrap path handles the link-minted kinds (pre-1a it handled the hand-declared ones; confirm it generalizes).

## Error handling

- Empty-matching body → never hoisted/aliased (guard). If a future case still produces an empty aliased rule, `tree-sitter generate` fails loudly with the rule name — fix the guard, don't suppress.
- A declared `groups:` name colliding with an existing kind → hard error at config-load (existing `validateGroupsConfig` behavior, retained).
- Rust-keyword slot names: expected to be avoided by the visible-render path (pre-1a precedent). If the native build still reports `unknown node <keyword>`, add raw-identifier escaping (`r#…`) in the Rust slot-name emitter as a scoped follow-up — out of scope for the first cut unless it surfaces.

## Testing & gates

- **Authoritative gate (RELEASE only):** `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`; confirm `Finished release profile [optimized]` + read the explicit deep `read-render-parseAstMatchPass=` lines. Debug build segfaults (Node-v24/napi) are NOT regressions. Floor: rust 111 / ts 69 / py 74; target: hold-or-improve toward 125/72/76.
- **Witness kinds (must pass deep AST match):** ts `enum_body` (`enum E { A, B }` → `{ A, B }`), rust `visibility_modifier` (`pub(super)` → `pub(super)`).
- Unit tests: `isInlineSafe` / `ruleMatchesEmpty` truth tables; the alias-wrap (inline-unsafe → `alias(content, $.name)`, name from config/default; inline-safe → hidden symbol untouched); the **new link pass** (`alias(non-symbol content, $.name)` → `name=content` in the linked rules; symbol aliases untouched; sibling body-pattern bodies byte-unchanged); `applyAutoGroups`-no-op assertion before deletion.
- Never stage `rust/crates/sittir-*/test-fixtures.json` / `validation-history.jsonl`. Commit by explicit pathspec.

## Sequencing (implementation increments, each gated on RELEASE)

1. Shared `isInlineSafe` + `ruleMatchesEmpty`; enrich hoists inline-safe, wraps inline-unsafe content in `alias(content, $.<default-name>)` (gate hold-or-improve; the kind isn't minted yet → inline-unsafe still dips, recovered in step 2).
2. **New link pass:** `alias(non-symbol content, $.name)` → register the kind in the linked rules. Declared `groups:` supply friendly names. **Gate: witnesses (enum_body, visibility) pass, floor held.**
3. Disable `applyAutoGroups` (Task 2.0 ordering), then delete it. Gate.
4. (Deferred, only if surfaced) Rust-keyword slot escaping.

## Out of scope / deferred

- Sunsetting the legacy top-level `source: 'group-lift'` once IR readers migrate to `metadata.source`.
- PR-I-φ2 count recovery (match_arm residual) and PR-P (terminal/enum).
- The single-entry `sittirGrammar(base, cfg)` composition cleanup.
