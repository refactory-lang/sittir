# Nonterminal-Driven Slot Derivation (replace the complex `deriveSlots` walker)

**Date:** 2026-05-21 · **Branch:** `025-pr2-canonicalize-template-emitter` (HEAD `1279c95f`)
**Status:** design + plan (pre-implementation). Supersedes ad-hoc edits to `deriveSlotsRaw` (those regressed — see UPDATE 5 in `project_pr2_session_handoff`).

## Problem

`deriveSlotsRaw` (compiler/node-map.ts) is a complex recursive walker: per-arm choice slots (`armSlots`/`mergeChoiceArmSlots`), first-arm slot naming, field-named-seq **folding** (`deriveSlotsRawFromLeafAttr`), and `effectiveMultiplicity` threading. This complexity is the root of the bugs chased this session:
- field-seq folding swallowed `comparison_operator`'s inner `field('operators', choice)` into `comparators` → operator literals leaked as phantom `lt`/`eq_eq` refs.
- first-arm naming gave union choices arbitrary names (`lt`, `expression`).
- multiplicity lost on flatten; brittle variant resolution; etc.

All slot facts now live on the **leaf** (post-`applyWrapperDeletion`): `fieldName`, `multiplicity`, `separator`, `aliasedFrom`. So the walker's threading/folding is redundant.

## Decision: a slot IS a `nonterminal`-flagged node

Replace the walker with: **walk the rule, collect `nonterminal: true` nodes, emit one slot per node.** Two new/edified pieces:

### 1. The `nonterminal` predicate — ALREADY EXISTS (reuse, don't reinvent)

`compiler/rule-catalog.ts::classifyIntrinsic` (line 244) + `classifyRule` (234) already encode this:
- `symbol` / `supertype` → nonterminal.
- `string` / `pattern` / `token` / `terminal` / indent/dedent/newline → terminal.
- `field` / `alias` / `seq` / `choice` / `optional` / `repeat` / `repeat1` / `variant` / `clause` / `enum` / `group` / `polymorph` → nonterminal **iff any child is nonterminal** (propagation).
- `forcedBy === 'field' | 'named-alias'` → nonterminal.

And enrich already STAMPS `nonterminal: true` on promoted leaves (`enrich.ts` enrichFieldWrappers/enrichMultiplicityWrappers, ~993/1039). So the predicate + stamping largely exist — REUSE `classifyIntrinsic`.

**Refinement vs the current rule — PRESERVE RECURSIVENESS, with two unconditional cases.** The recursive `children.some(... nonterminal)` rule stays for `seq` / `field` / `alias` / `variant` / `clause` / `group` / `polymorph` **AND for `optional`**. Only these become unconditionally nonterminal:
- `choice` → always nonterminal (a single union slot; a literal-only choice = enum). Turns `operators` into an enum slot.
- `repeat` / `repeat1` → always nonterminal, **including `repeat(terminal)`**. A repeat captures a variable-length sequence — there is no other way to capture "how many / which", so it must be a slot (`repeat('keyword')` = enum array).
- `pattern` → nonterminal (captures matched text = a value, like a `symbol`). `enum` → nonterminal (a value-enum slot). `token` → recursive (nonterminal iff its content is: `token(/regex/)`→slot, `token('fn')`→no). All three differ from current `classifyIntrinsic` (`pattern`→terminal, `enum`→recursive→terminal, `token`→terminal).

**`optional` STAYS recursive** (nonterminal iff its content is nonterminal). This is the critical correction: `optional(',')` / `optional('keyword')` are terminal-content → NO slot (just syntactic presence). The meaningful single-optionals (rust `optional('async')`/`'unsafe'`) become slots the existing way — enrich auto-promotes them to `field('async_marker', …)` (a fieldName), not via nonterminal-ness. This avoids phantom trailing-comma slots (the class list-fusion suppresses). Note: `operators` does NOT need this refinement at all — it already has `fieldName:'operators'`; it's fixed by fold-removal (§Decision). The choice/repeat changes matter for *unnamed* literal choices and `repeat(terminal)` enum arrays.

Terminal leaves (`string`/`terminal`/indent/dedent/newline) → no slot, ALWAYS — the only way one contributes a slot is through a `repeat`/`repeat1` ancestor (array) or a `fieldName`. (`pattern` is NOT terminal — captures a value; `token` is recursive — terminal only when it wraps a literal.)

#### Table 1 — Rule type → terminality (the `classifyIntrinsic` predicate, refined)

| Rule type | Terminality | Slot? | vs current |
|---|---|---|---|
| `symbol`, `supertype` | nonterminal | 1 slot (the kind) | — |
| `pattern` | **nonterminal** | 1 slot (captured text value) | **change** (was: terminal) |
| `enum` | **nonterminal** | 1 slot (value enum) | **change** (was: recursive→terminal for literal enums) |
| `choice` | **nonterminal (always)** | 1 slot (union; literal-only = enum) | **change** (was: iff child) |
| `repeat`, `repeat1` | **nonterminal (always, incl. terminal content)** | 1 slot (array / nonEmptyArray) | **change** (was: iff child) |
| `optional` | recursive — nonterminal iff content is | iff content nonterminal | unchanged (recursive) |
| `seq` | recursive — nonterminal iff ≥1 member is | distributes (members are slots; seq itself isn't) | unchanged |
| `field` | recursive; **forces** nonterminal on content | content becomes a slot | unchanged (force) |
| `alias` | recursive; **named-alias forces** nonterminal | per content; named → slot | unchanged |
| `token` | **recursive — nonterminal iff content is** | per content (`token(/regex/)`→slot; `token('fn')`→no) | **change** (was: terminal) |
| `variant`, `clause`, `group`, `polymorph` | recursive — nonterminal iff child is | per content | unchanged |
| `string`, `terminal` | terminal | no slot* | unchanged |
| `indent`, `dedent`, `newline` | terminal | no slot | unchanged |

\* a `string`/`terminal` (and `token('literal')`) contributes a slot only under a `repeat`/`repeat1` ancestor (array) or when carrying a `fieldName`. Classifier changes vs current `classifyIntrinsic`: `pattern` and `enum` → nonterminal; `token` → recursive; `choice` and `repeat`/`repeat1` → unconditional. Everything else unchanged.

#### Table 2 — Wrapper push-down onto the wrappee (in `wrapper-deletion`)

| Wrapper `y(x)` | `fieldName` | `multiplicity` | `separator` | `nonterminal` |
|---|---|---|---|---|
| `field('n', x)` | `n` | — | — | `true` |
| `optional(x)` | — | `optional` † | — | `true` iff `x` intrinsically nonterminal |
| `repeat(x)` | — | `array` | `x.separator` | `true` (incl. terminal `x`) |
| `repeat1(x)` | — | `nonEmptyArray` | `x.separator` | `true` (incl. terminal `x`) |
| `alias(x,'t')` | — | — | — | `aliasedFrom='t'`; `true` if named |
| leaf `symbol`/`choice` (no wrapper) | — | — | — | `true` (intrinsic) |

† `optional(repeat(x))` / `optional(repeat1(x))` → `array` (outer optional makes the empty case valid). Stacked wrappers: the OUTER wins for `fieldName`/`multiplicity` (`wrapper-deletion.ts:55,71`). Push-down only ADDS `nonterminal`; the existing `fieldName`/`multiplicity`/`separator` push-down is unchanged.

### 2. Slot collection (the new `deriveSlots`)

Walk the (wrapper-free) rule; for each node:
- **symbol** (nonterminal) → 1 slot. name = `fieldName` ?? kind-synthesized storageName (assemble synthesizes storageName from kind). type = the symbol's kind. multiplicity/separator = the node's own leaf attrs.
- **choice** (nonterminal) → 1 slot. name = `fieldName` (REQUIRED — see naming rule). type = union of arm kinds (enum when arms are string literals). Arms are NOT recursed into separate slots — **the choice is the slot.**
- **seq** → distribute: flat-collect the slots of its nonterminal members. The seq itself is not a slot (no folding).
- terminals → no slot.

Removed entirely: `effectiveMultiplicity` threading, `deriveSlotsRawFromLeafAttr` folding, `armSlots`/`mergeChoiceArmSlots`, first-arm naming.

### 3. Choice slot naming + the variant question (RESOLVED)

A choice slot MUST be field-named. If a choice reaches collection with no `fieldName`:
- **choice-of-groups / polymorph choice → auto field-name `content`.** (A choice-of-groups needs a slot name; `content` is it.)
- else → emit a warning during assemble: "unnamed choice slot found in branch '<kind>'". (Don't auto-name from the first arm.)

**Variant resolution (settles UPDATE 4's TBD):** the choice-of-groups model and the polymorph mechanism COEXIST without conflict, because they operate at different layers:
- **Render/engine:** there is NOTHING different to do. The polymorph's choice is just the `content` slot; render renders whatever group is present in `content`. NO `$variant` dispatch, NO `variant_for`/`resolve_variant` needed for rendering — the present arm IS the content.
- **Client-side type surface ONLY:** the polymorph metadata is preserved purely to generate the ergonomic types (flat-field / discriminated-union API in factory/types emitters). It is a TYPE-LEVEL convenience, not a render mechanism.

So `collectSlots` treats every choice (polymorph or not) identically → one `content` (or fieldName) slot, union of arms. The polymorph path only diverges in the type emitters. `except_clause` → `content` slot (present arm: as-group / list-group / empty); render renders `content`; the discriminated type comes from the polymorph metadata.

### 4. Grouping is autoApplyGroups' job (not deriveSlots')

Multi-slot `optional(seq(...))` / `repeat(seq(...))` are lifted to a synthesized group kind by `autoApplyGroups` BEFORE derivation. So a parent never sees a multi-slot seq inline — it sees a group-ref (1 slot) or the group's own slots.

**Why `comparison_operator`'s `repeat1(seq(operators, operand))` isn't grouped (corrected):** NOT a "hasSlotBearingMember filter" (that was removed — `auto-groups.ts:262-265`). The real cause is the **authored-skip**: `comparison_operator` has a `transforms:` entry → `collectAuthoredSynthesisKinds` adds it (`wire.ts:606-624`) → `applyAutoGroups` skips it (`auto-groups.ts:131`). That skip is DELIBERATE — it keeps the rule tree in the shape the authored positional `transforms` (`0`,`1`) address. So the fix is NOT "fire on all authored kinds" (that shifts the positional patches and risks LR/parser regressions). The fix must **cooperate with authored transform order**: synthesize the group AFTER the author's positional patches resolve, or have the transform/grouping interleave so positions stay stable. With grouping reliable, `comparison_operator` → `left` (1) + group(`operators` enum, operand); `operators` never folded.

## Why this is correct (worked examples)
- `field('body', $._suite)` → symbol nonterminal → 1 `body` slot (block). ✓
- `field('operators', choice(<,<=,==,…))` → choice nonterminal → 1 `operators` slot (operator enum). ✓ (No phantom `lt`; B's operator-enum = the choice-of-string-literals → enum value type, with kindId-at-assemble for read-time `$type`.)
- `comparison_operator` → `left` + autoApplyGroups group(operators, operand). ✓
- `except_clause` (variant choice under optional) → `content` slot (present arm: as-group / list-group / empty); render renders `content`; discriminated client type from polymorph metadata. (RESOLVED — see §3.)
- **Synthetic field-wrapper caveat (was unaddressed):** `field('x', seq(... field('y') ...))` where the inner field is the real content — `isSyntheticFieldWrapper` (`node-map.ts:1347`) handles these today. Under nonterminal-collection they fall out naturally (the inner `field('y')` is its own nonterminal slot, `x` distributes), but Chunk C MUST spot-check these (e.g. ts `field('constraint', optional(seq('extends', field('type', …))))`, `templates.ts:1461`) so removing the fold path doesn't drop the wrapper's own slot.

## Plan (bite-sized; TDD where practical)

**Chunk A — nonterminal predicate (reuse, refine).**
1. REUSE `rule-catalog.ts::classifyIntrinsic` — do NOT write a new predicate. Apply the one refinement: `choice` (and a literal-only `enum`) → unconditionally `nonterminal`. Unit-test the refined clause (all-literal choice → nonterminal) alongside the existing cases.
2. **Single source of truth = wrapper-deletion push-down (resolves the drift the review found).** Today enrich stamps `nonterminal` (~enrich.ts 993/1039) but `wrapper-deletion.ts` does NOT — it only pushes `fieldName`/`multiplicity`/`separator`/`aliasedFrom`. FIX: **wrapper terminality pushes down onto the wrappee**, exactly like the other attrs. `deleteWrapperWith` stamps `nonterminal: true` on the leaf when the wrapper forces a slot:
   - `field(x)` → `x.nonterminal = true`.
   - `repeat(x)` / `repeat1(x)` → `x.nonterminal = true`, INCLUDING terminal `x` (capture-the-variable → array slot).
   - `optional(x)` → push `nonterminal: true` ONLY if `x` is intrinsically nonterminal (recursive; terminal `x` → no slot — the trailing-comma carve-out).
   - `alias` (named) → `nonterminal: true`.
   - Leaf intrinsics combine: a bare `symbol`/`choice` is nonterminal on its own (no wrapper needed).
   Then `collectSlots` just READS `leaf.nonterminal` on the wrapper-free RenderRule — no second predicate pass, no enrich-vs-wrapper-deletion divergence. (`classifyIntrinsic` still defines the intrinsic base — symbol/choice/repeat/repeat1 nonterminal, optional/seq recursive — and wrapper-deletion applies the push-down on top.) Verify on comparison_operator/function_definition/argument_list.

**Chunk B — autoApplyGroups + authored kinds (separable PR; riskiest).**
3. The gap is the authored-skip (`auto-groups.ts:131`, driven by `transforms:` entry), NOT a member filter. Do NOT just "fire on all authored kinds" — that shifts positional `transforms`. Instead make grouping cooperate with authored transform order (synthesize the group after the author's positional patches resolve, or let the transform emit/keep the group). MEASURE override-parser parse-pass on all 3 grammars before/after (rust has documented LR-table sensitivity to synthesis/`_kw_*`).

**Chunk C — new collection.**
4. Write `collectSlots(rule)` = walk, emit 1 slot per nonterminal symbol/choice, distribute through seq, pass through wrappers (reading leaf attrs). NO effectiveMultiplicity/folding/per-arm.
5. Choice naming: warn-if-unnamed + polymorph→`content`.
6. Swap `deriveSlots` internals to `collectSlots`; delete `deriveSlotsRawFromLeafAttr` fold path, `mergeChoiceArmSlots`, `effectiveMultiplicity`, first-arm naming.
7. Regen all 3; gate: covPass must NOT regress — **capture fresh baselines first** via `pnpm exec tsx packages/validator/src/cli.ts counts --backend native <g>` at HEAD before starting (the numbers in earlier drafts were stale/approximate); target deep-RT (read-render-parse) recovery and the operator phantom-refs gone.

**Sequencing:** Chunks A–D are SEPARATE, independently-gated PRs (the review flagged the bundled "bite-sized" framing understates per-chunk risk; this exact code has regressed repeatedly — see handoff UPDATE 5). Order: A (predicate) → C (collectSlots, the core) → D (operator-enum) → B (autoApplyGroups+authored, riskiest, do last/standalone). Each PR holds covPass on its own before the next starts.

**Chunk D — operator enum (B) on top.**
8. The now-correctly-named `operators` choice slot: type as enum of operator literals (source strings), with kindId looked up at assemble for read-time `$type` matching (the runtime emits the alias target `lt`). Gate emitSymbol `source==='link'` with `&& fieldName===undefined` (companion fix). Measure.

## Risks
- Blast radius: every kind's slots re-derived. covPass is the guardrail.
- `nonterminal` completeness gaps → missing slots. Mitigate with the predicate unit tests + per-kind spot checks.
- autoApplyGroups grouping more aggressively could perturb the override parser — measure parse-pass.

Related: [[project_pr2_session_handoff]] (UPDATE 4/5), [[feedback_wrapper_slottiness]], [[feedback_ruleid_backpointer]], [[project_repeat_seq_group_synthesis]].
