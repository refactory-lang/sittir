# Design Spec — Canonicalize the `separator` rule-shape

> **Status:** spec for a strangler PR. The **behavioral sub-item of PR-O** (`pr-o-structural-dedup`), named **`separator-canonical`**, with its **own gate** (PR-O's structural half stays non-behavioral). Gated on **PR-H** (the lift moves into `applyWrapperDeletion`, in the phase PR-H renames/reshapes). Compiler-side data shape; rust render is the *gate*, not edited — render support is separately gated on the **existing** `separator`-role child-slot design (`2026-05-26-non-slot-separator-rules-design.md`).

**Goal:** Collapse the 3-way `RuleBase.separator` union to **one canonical form** so every walker/render consumer stops branching on separator *shape* — the same shape-variance reduction class as PR-C (`origin`/`aliasSources` → `parseKind`/`isUnnamed`) and the `patternReplacementKinds` cut.

## Target — a single structured `Rule`, NOT `string` (CORRECTED 2026-05-30)

The first survey recommended collapsing to `string` because *today* every separator reduces to a single literal (`extractSeparatorString`, `separatorToString`, `NodeRef.separator: string`). **That recommendation is rejected by the design authority** — it mistakes a *limitation* for a *property*:

- **Single-literal-separator is the current GAP, not the goal** (`project_multi_separator_templates`: "walker/render assumes one-separator-per-field"). Collapsing to `string` would CEMENT that limitation.
- **We need to support MULTIPLE separators and CHOICE separators** (`choice(',', ';')`, alternating delimiters, etc.). A `string` cannot represent a choice or a list; only a **structured `Rule[]`** (each entry a `Rule` — possibly a `ChoiceRule`/`SeqRule`/`StringRule`) can.
- The "`Rule[]` has zero producers" finding is *because* nothing currently emits structured separators — that's the capability this PR ADDS, not evidence against it.

**Canonical target: `separator?: Rule` — a SINGLE rule** (CORRECTED again: `Rule[]` is the wrong shape — a *list* of alternatives is just a `ChoiceRule`, so one `Rule` already subsumes everything: single-literal (`StringRule`), choice (`ChoiceRule`), sequence/multiple (`SeqRule`)). One field, no list, no union. The `string`-reductions in consumers become the thing to FIX, not the form to adopt.

## Phasing — DEFER separator assignment to the push-down phase

> **Superseded the original "standalone diagnostic NOW" plan (2026-05-30, design authority).** A workflow proved a standalone diagnose-pass walking `optimize().rules` (or the extraction helpers `extractSeparatorString`/`findNestedSeparator`) **can never fire** — the choice separator is already destroyed upstream. The correct move is structural: stop assigning separators early, and **defer the lift to push-down**, where assignment becomes a single non-lossy site. This is **PR-O's `separator-canonical` behavioral sub-item**, gated on **PR-H** (which settles `normalize.ts`/`transforms.ts`, the phase that owns `applyWrapperDeletion`).

### Why a standalone diagnostic can't work (the two-site proof)

`.separator` is **always a plain `string`** by the time `optimize()` finishes (probe: rust 24/0 non-string, ts 19/0, py 30/0) because the choice dies in TWO earlier places, and a single post-optimize `.separator` walk sees NEITHER:

- **SITE 1 — eager evaluate lift (lossy).** `extractRepeatSeparator` (evaluate.ts:389-409, lines ~399-405) lifts an authored `repeat(seq(x, choice(',', _semicolon)))` separator by calling `extractFirstStringFromChoice` (evaluate.ts:427) — taking ONLY the first literal, **discarding** `_semicolon`. The choice is gone at Phase 1.
- **SITE 2 — post-fanout, never re-lifted.** `factorChoiceBranches` (optimize.ts:365) rewrites `repeat(choice(seq(x,','), seq(x,';')))` → `repeat(seq(x, choice(',',';')))`. But evaluate already ran (saw a repeat-OF-choice → `extractRepeatSeparator` returned null → lifted no `.separator`), so this fanout-produced choice sits in **structural** position and is never lifted into `.separator`.

So separator-lift is smeared across phases (evaluate `extractRepeatSeparator`/`liftCommaSep`, link's `'\n'` stamp, then `applyWrapperDeletion`'s push-down). The glossary already designates **`applyWrapperDeletion` as the home** ("Separator-lift and attribute stamping are a separate concern handled in `applyWrapperDeletion` / simplify"; it pushes `separator` to leaf `RuleBase` attributes) — but the eager evaluate lift front-runs it and flattens.

### The work — consolidate the lift into `applyWrapperDeletion` (push-down)

1. **Stop the eager evaluate-side lift.** Let `seq(content, SEP)` ride structurally through evaluate → link → normalize untouched (honors *Normalize non-lossy*; `[[feedback_no_lossy_distillation]]`). The choice survives.
2. **Lift ONCE, in `applyWrapperDeletion`**, assigning `.separator` as a **single `Rule`** (the `ChoiceRule` preserved, not flattened). By Phase 3 both SITE-1 and SITE-2 classes have converged to the same structural `repeat(seq(content, sep))` shape → **one assignment site, one detection site.**
3. **Emit the `warning` at that single site** — when the lifted separator `Rule` is anything other than a single literal. **Detect via the `Rule` DISCRIMINANT** (`rule.type !== 'string'` — a `choice` / `seq` / structured rule — or a dedicated exhaustive predicate). ⚠ **NOT `terminal === false`** (P1, 22:24): `Rule`/`RuleBase` has **no `terminal` property** (that is the slot-value `NodeRef.kind` concept, not Rule); `rule.terminal` would be `undefined`, so a `terminal === false` guard never fires and the case silently continues into the literal-only render path. **Severity = `warning`, NOT `propose-*`** (no render handling until the `separator`-role child-slot design lands; an unsupported-case warning, not an adoptable proposal) and **never `fail`** (emit must not halt). **Surfacing (P2, 22:24):** route the warning through the **printed grammar-diagnostics batch** (`collectGrammarDiagnosticsForGrammar` / `runGrammarDiagnosticsPreflight`, which `runCodegen` prints) **or** return-and-print it — NOT solely PR-G's `DiagnosticSink`, which is **not yet consumed** (`assertEmittable` inspects only `fail`; `GeneratedFiles` does not return sink contents; `runCodegen` prints only `slotGroupingDiagnostics`), so a sink-only warning is INVISIBLE until PR-L consumes the sink. The standalone two-site diagnostic dissolves into this one push-down-site check, surfaced via the existing diagnostics batch.
4. **0 real witnesses today is EXPECTED** — the canonical case (ts `object_type`) was rewritten to visible per-delimiter kinds (`[[project_object_type_rewrite_and_native_list_gaps]]`). This is a forward-looking guard; unit tests exercise the choice/multi shapes synthetically.

### Producer + consumer migration — the singular-`Rule` shape must land COMPLETE (PR #53 review P1s — verified against code)

Narrowing `RuleBase.separator` to a singular `Rule` is NOT just the push-down lift — the **single-literal projection must keep working** (ordinary `,` / `;` / `\n` lists render exactly as today). The push-down sub-item MUST also:

- **Relocate trailing-separator absorption** (`absorbTrailingSeparator`, evaluate.ts:113-130) into push-down — or keep an equivalent non-lossy pre-pass. It gates on `cur.separator !== undefined` (the repeat must already be lifted), so stopping the eager lift loses the trailing-`optional(',')` → `trailing: true` absorption, and push-down then sees a separate optional sibling it can't infer is the delimiter. *(P1 #1 — confirmed at evaluate.ts:113.)*
- **Migrate the literal-projection consumers** to accept a singular `Rule` (incl. a `StringRule`, which has no `.rules`): `separatorToString` (templates.ts:1067-1074) and `extractSeparatorString` (node-map.ts:1051-1061) currently treat every non-array object as the `{rules}` form and call `.rules.map(...)` — a singular `StringRule` **crashes** before choice replay is even relevant. These migrate in THIS sub-item or ordinary comma-lists break. *(P1 #3 — confirmed; `.rules.map` at templates.ts:1071 / node-map.ts:1059.)*
- **Convert the other producers** so the narrowed type is consistent: `list-fusion.ts:107` emits the legacy `{ rules:[StringRule], trailing:true }` object (it runs INSIDE `applyWrapperDeletion` via `fuseHeadRepeatLists`, wrapper-deletion.ts:309), and `link.ts:2209` (`assignRepeatSeparator`) stamps the `'\n'` `BLOCK_SEPARATOR` string at link. Both must produce the singular-`Rule` shape. *(P1 #2 — type-consistency is real and folds in here; but the same comment's "bypasses the warning" risk does NOT bite — both emit SINGLE LITERALS, so no unsupported-separator warning applies, and the in-phase fuse is covered by siting the warning at `applyWrapperDeletion`'s OUTPUT. A post-push-down producer would bypass the warning only if it synthesized a choice/multi separator — neither does.)*
- **Switch separator equality from identity to STRUCTURAL.** Five sites compare `a.separator === b.separator` by object identity: `optimize.ts:774`, `evaluate.ts:225`/`227`, `evaluate.ts:2230`/`2234`. Today the separator is a primitive `string`, so identity works; once it's a `Rule` OBJECT (e.g. `link.ts:2209`'s `'\n'` → a fresh `StringRule`), two structurally-equal separators stop comparing equal → the dedup/factoring those comparators drive (`optimize.ts:432`/`822`/`838`) silently stops collapsing equivalent repeats. Migrate these to a structural compare (`rulesEqual` on the separator, or a `separatorEqual` helper) in THIS sub-item. *(P1 #4 — confirmed; `a.separator === ...` at all five lines.)*

**Sequencing correction (the P1s' shared root):** "defer ALL render" was too broad. The **single-literal** projection (the common case) migrates to the singular-`Rule` shape **in this sub-item** so lists still render; only **choice/multi** render (per-occurrence replay) stays gated on the **`separator`-role child-slot design** (`2026-05-26-non-slot-separator-rules-design.md`) — exactly the cases the `warning` flags. The sub-item's own gate (generated byte-diff *classified*) is what proves the single-literal migration is render-neutral.

### Render — gated on the EXISTING `separator`-role child-slot design (NOT a new "non-slot variables" model)

> **Corrected 2026-05-30 (PR #53 P1 #5 — DRY).** An earlier draft of this section invented a "non-slot variables" dependency and claimed the per-occurrence delimiter is "**NOT** a child-node slot — render-time state." That is **backwards** and would spawn a second, conflicting storage/read model. The authoritative design already exists: **`docs/superpowers/specs/2026-05-26-non-slot-separator-rules-design.md`**. Its first insight: *a separator **IS** a child in tree-sitter's CST → a `role: 'separator'` **child slot**, not a parallel non-slot structure.* Point the render dependency THERE; do not author a competing model.

Normalizing the *data* to a single `Rule` is mechanical; the hard part — **rendering** a structured/choice separator — is owned by that design:
- A rule-shaped separator (`choice`/`optional`/token — not a fixed literal) becomes a **`role: 'separator'` child slot** with a **`delimits: <contentSlotId>`** edge. Its value is **verbatim pass-through** (the actual token text, never a classified choice arm — "don't know which arm, preserve it") **stored on the content slot** (surfaced via the Config options block `{ separator?, trailing?, leading? }`), so render reads it directly with no cross-lookup.
- **Per-instance, never static** — the live `object_type` work (`[[project_object_type_rewrite_and_native_list_gaps]]`) proved a static `trailing` flag crashes deep-AST 70→53; flank-separator presence is captured per-instance (`trailing_sep`/`leading_sep`), exactly what the role-slot pass-through stores. `emitListSlot` (templates.ts:1180) / `selectJoinFilter` / `joinWithTrailing`/`joinWithLeading`/`joinWithFlanks` generalize to read the separator off the content slot, not a fixed literal. Resolves `[[project_multi_separator_templates]]`; relates to `[[project_template_walker_adjacency]]`.
- **Render support is gated on that design landing** (it sequences after the strangler stabilizes, or independently) — the push-down assignment + the `warning` land first (this PR-O sub-item); render follows via the separator-role slot.
- **Fixed-literal separators stay render constants** (today's behavior) — only rule-shaped separators become role slots. So the single-literal projection migrated above (the common case) is unaffected by the role-slot work.

(Flags `trailing`/`leading`: keep as siblings on the rule alongside the single-`Rule` separator, stamped at the push-down lift; at render they become the per-instance captured `trailing_sep`/`leading_sep` on the content slot per the separator-role design — not static.)

## Current shape (the problem)

`packages/codegen/src/compiler/rule.ts:80-87`:
```ts
readonly separator?:
  | string
  | readonly Rule[]
  | { readonly rules: readonly Rule[]; readonly trailing?: boolean; readonly leading?: boolean };
```
But `RepeatRule`/`Repeat1Rule` already **override** this to `separator?: string` + sibling `trailing?`/`leading?` (rule.ts:186-196). Two separator vocabularies coexist. Cost: ~10 consumers each carry a bespoke shape-branch (`typeof === 'string'` / `Array.isArray` / `'rules' in sep`); `rule-attrs.ts:135` resorts to `JSON.stringify` comparison because the shape is non-uniform.

## ~~REJECTED first-pass: string + sibling flags~~ — kept ONLY for the inventory

> ⚠ The string-collapse design below is **REJECTED** (it entrenches single-separator; see corrected target above). The sections below are retained **only** for their *consumer-site + producer-location inventory*, which is valid for either target. The "After → string" columns do **NOT** apply — under a singular `Rule`, consumers **preserve** the structure (and the choice-render path goes through the `separator`-role child slot). The `string` body is reference, not the plan.

~~Make `RuleBase.separator` match the existing majority:~~
```ts
readonly separator?: string;
readonly trailing?: boolean;
readonly leading?: boolean;
```
- Deletes the union outright — no consumer branches on shape again.
- Makes `RuleBase` match `RepeatRule` exactly → the `RepeatRule`/`Repeat1Rule` field *overrides* become deletable (true unification).
- Aligns with `NodeRef`/`TerminalValue` and directly satisfies [[feedback_rule_slot_vocabulary_alignment]] ("same concept both sides → identical field names: `trailing`/`leading`/`separator`, no divergence").

**Engage `rule.ts:54-57` on the record:** it documents a prior "universal-shape decision" (flags on the structured object) that was **never fully applied** — `RepeatRule`/`NodeRef`/`TerminalValue` contradict it with siblings today. This spec resolves the contradiction by aligning to the de-facto majority (siblings) and rewriting that comment. (Alt option A — "object-always," migrating the three sibling-form types onto the object — honors the comment's cohesion but reverses the gravity of ~all existing code + keeps a nested object the renderer must destructure. Rejected: higher churn, lower DRY.)

## Where normalization happens — no new pass

Stop producing the object form at its **two** source sites; emit siblings instead:
- `wrapper-deletion.ts:88-131` (`repeat`/`repeat1`) — PRIMARY producer. Replace `sep = { rules, trailing, leading }` (97-101, 119-123) with carrying `separator: string` + siblings through `WrapperAttrs` (extend `WrapperAttrs` :35-42 with `trailing?`/`leading?`; stamp in `stampAttrs` :258-277).
- `list-fusion.ts:108` — the only OTHER object producer. Replace `separator: { rules, trailing:true }` with `separator: sepStr, trailing: true`.

All other producers already emit string+siblings (`evaluate.ts`, `link.ts:2209`, `group-synthesis.ts:293,298`, `optimize.ts:675,774`) — unchanged.

## Consumer migration (every shape-branch site)

| # | Site | Today | After |
|---|------|-------|-------|
| 1 | `evaluate.ts:2094-2101` (the PRK walker) | `Array.isArray`/`'rules' in sep` walk | delete both branches — separator is a string literal |
| 2 | `templates.ts:1067-1075` `separatorToString` | string/array/object | return `rule.separator` directly |
| 3 | `templates.ts:1088-1127` `selectJoinFilter` | object `sep.trailing/leading` (1098-1105) | drop object branch; read sibling flags |
| 4 | `node-map.ts:1051-1062` `extractSeparatorString` | string/array/object | return string |
| 5 | `collect-slots.ts:60-80` `findNestedSeparator` | passes union through | return `string \| undefined` |
| 6 | `collect-slots.ts:403-416` | object flags else fallback | sibling flags |
| 7 | `list-fusion.ts:69-78` `separatorString` | string/object | string |
| 8 | `rule-attrs.ts:132-137` `sharedArmAttrs` | `JSON.stringify` compare | `===` on separator + per-flag |
| 9 | `template-walker.ts:65-92` `findRepeatFlag` | object pre-check (70-73) | delete; sibling flags |
| 10 | `template-walker.ts:26-48` `findRepeatSeparator` | typed `string` but could return object (**latent bug**) | returns string cleanly (bug dissolves) |

Pass-throughs needing only the type change: `wrapper-deletion.ts:38`, `simplify.ts:1015/1021/1082/1102/1129`, `node-map.ts:683-691`, `transform-path.ts:670-686`.

## Flags-preservation (the crux)

`trailing`/`leading` move to **sibling booleans on `RuleBase`** alongside `separator: string` — preserved by construction at the 2 producer sites, read by `selectJoinFilter` (which `joinWithTrailing`/`joinWithLeading`/`joinWithFlanks` depend on) directly. The slot-level rollup is untouched: `collect-slots.ts:405-414` already derives `hasTrailing`/`hasLeading`; `stampSeparatorOnValues` (node-map.ts:1068) already stamps per-value. No new home needed — siblings ARE the home the codebase already uses. Orphan-flag risk (`trailing:true` with no separator) is contained: both producers set flags only inside the `separator !== undefined` branch. (cf. [[project_preserve_token_wrappers]].)

## Gate

- `pnpm validate:native` holds **rust 125 / ts 72 / py 76** (deep).
- **Generated render byte-identical** — the two diff targets: `selectJoinFilter` filter-name per slot, and `emitListSlot` (`templates.ts:1180`) emitted `{{ name | <filter>("<sep>") }}`.
- **Co-migrate** the 2 object-form fixtures: `compiler/__tests__/rule-attributes.test.ts:29`, `emitters/__tests__/templates-emitter-emitRule.test.ts:415` (update to sibling form — not a regression).
- Run `dump-ast-mismatches` pre/post (the `findRepeatSeparator` latent bug could hide a behavioral shift).

## Risks
1. `selectJoinFilter` ordering — if any rule carries the object form but NOT siblings, deleting the object branch needs the producers to stamp siblings (both do, inside the same conditional — verify per-site).
2. The 2 fixtures encode the object form — co-migrate or the gate trips on the fixtures.
3. `findRepeatSeparator` latent type bug — migration fixes + surfaces it; `dump-ast-mismatches` confirms no hidden shift.
4. Phantom `Rule[]` removal safe (no producer; `rg` confirms none) — double-check `__tests__`.

## Placement — PR-O behavioral sub-item (design authority, 2026-05-30)
**`separator-canonical` stays inside PR-O but as its explicitly-BEHAVIORAL sub-item with its own gate** (PR-O's other half — M1/MO2/P1 structural de-dup — remains non-behavioral). Depends-on:
- **PR-B ✅** + **PR-H ⬜** — the lift moves into `applyWrapperDeletion`, which lives in the phase PR-H renames (`optimize.ts`→`normalize.ts`) and reshapes (`transforms.ts`). Hard dependency, not just file-overlap.
- **The EXISTING `separator`-role child-slot design (`2026-05-26-non-slot-separator-rules-design.md`) — REQUIRED for choice-separator RENDER only** (the delimiter is a `role: 'separator'` child slot, verbatim pass-through stored on the content slot — NOT a non-slot variable). The push-down *assignment* (single `Rule`) + the unsupported-case `warning` land in this PR-O sub-item; render is gated on that design.

**Own gate** (it is behavioral, unlike PR-O's structural half): `validate:native` hold (rust 125 / ts 72 / py 76) **+ generated byte-diff classified, not assumed empty** — relocating the lift from evaluate to push-down can shift rendered bytes; every drift must be explained. Does NOT depend on the M→I→K polymorph chain. **The render half builds on the already-brainstormed `2026-05-26-non-slot-separator-rules-design.md` (separator-role child slots); no new "non-slot variables" model is needed — pointing at a second model would violate DRY (PR #53 P1 #5).**
