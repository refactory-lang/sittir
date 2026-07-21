# Union-slot choices — explicit routing predicate, `'content'` storage, VariantRule retirement

**Status:** 🚧 IN PROGRESS — PR 1 (pure-union routing + census diagnostics, `01a7729f7`) and PR 1.5 (label-routed degenerate fielded arms) landed 2026-07-21. PR 2 (VariantRule retype cut) and PR 3 (structured-arm enrich mint) not started.
**Owner phase:** Assemble-time slot derivation (`compiler/collect-slots.ts`), with a follow-up Evaluate/Rule-IR cut.
**Supersedes:** the KNOWN_ISSUES `emitChoice` fallback-B fix sketch (template-layer conditional emission) — reframed as a model-level fix per the 2026-07-21 design discussion.
**Related:** compiler-simplification §4c (sanctioned `content` slot) + §B (VariantRule cut, PR-M scope); `specs/013-canonical-surface/tagvariants-removal-plan.md`; todo-debt-cleanup Track 2 (`VARIANT` rule-type removal); KNOWN_ISSUES "`_export_statement_default_decl_arm` … emitChoice fallback drops non-first arms" (entry retired by this design).

---

## 1. Problem

When a rule's choice has more than one kind mapping into what is semantically ONE
position, the current policy maps the arms as **separate slots by name**:
`collectSlots`' CHOICE case (`collect-slots.ts:557–591`) distributes any
fieldless choice that `isStructuralChoice` (`:196–201` — any arm is a
multi-member seq OR carries a named field) into per-arm slots, merges them by
name across arms (`mergeChoiceArms`), and relaxes absentees to optional.

Two symptoms, one root cause (the choice itself never gets slot identity):

1. **Factory surface artifact** — N sibling optional keys with no structural
   exactly-one-of (e.g. `_export_statement_default_decl_arm`:
   `declaration?` / `exportStatementDefaultDeclArmDefaultKw?`), where the
   original intent was one union slot.
2. **`emitChoice` fallback-B drop** — the slot-less choice misses `lookupSlot`
   (`templates.ts:1643–1690`) and falls to first-non-empty-arm emission,
   silently dropping the other arms (`export default …` unrenderable).
   `assertSlotPreservation` doesn't catch it because the dropped arm slots are
   `isUnnamed` and skipped.

The union-slot model is already the convention everywhere else: `buildSlot`
collapses non-structural fieldless choices to ONE slot with
`baseName = fieldName ?? sharedArmFieldName ?? 'content'` (§4c sanctioned
name), per-slot child transport enums carry one-slot-many-kinds (PR-K3c
`acceptedIdsByKind`), and `export_statement_default` itself works via a single
`content` union slot.

## 2. Decision

**The union logic is per-arm and applies ONLY to unnamed nonterminals within a
choice's arms.** Slot identity has exactly two sources, with disjoint parse
routing:

- **`field()` = slot identity.** A field-named arm is its own named slot —
  existing distribution behavior, untouched. Parse routing is by **field
  label** (`parseNames = [fieldName]`), so duplicate kinds across named arms
  are always distinguishable.
- **An unnamed single-nonterminal arm = union-member kind identity.** All such
  arms of a choice collectively map into ONE union slot with storage name
  `'content'`. Parse routing is by **kind** (`parseNames = refKindNames ∪
  aliasSources`) — and bare same-kind twin arms cannot survive tree-sitter, so
  by-kind dispatch is unambiguous within the union.

Decided by an explicit structural predicate at slot-derivation time — not by
rule-type laundering, not by template fallback.

Gates (both must hold; each failure emits its own diagnostic and keeps the
current distribution behavior — no partial synthesis, no hard fail):

- **(a) `'content'` is free in this rule.** No other slot of the owning rule
  may derive storageName `'content'`. This subsumes "only one choice in the
  rule" (two qualifying choices would both claim `'content'`) AND closes the
  leaf hole: `buildSlot`'s default arm (`:417–427`) also names fieldless
  pattern/enum/aliased leaves `'content'`. Failure → diagnostic
  `union-slot-content-collision`.
- **(b) every arm is either field-named or an unnamed single-nonterminal
  reference.** The only violation is an unnamed **structured** arm (a
  multi-member seq with ambient literals, a nested choice). The END-STATE fix
  for ambient-literal arms is compiler-side: the arm resolves to its **group
  kind** (already minted with a kindId by the existing enrich group-synthesis
  route, Principle #16 — it's just inline), and joins the union by that kind
  while its body keeps rendering inline under the existing conditional
  handling (PR 3 is routing, not new synthesis). Until PR 3 lands, failure →
  diagnostic `union-slot-nondegenerate-arm`, naming the offending arm(s);
  author-side alternatives remain `variant()` / a real rule / `field()`. This
  is exactly the `_export_statement_default_decl_arm` migration path, and it
  converts fallback-B's silent drop into a loud, actionable report.

**Mixed rows do not route — gate (c) (2026-07-21 refinement, user
decision).** A field-named arm alongside union arms is exactly as
heterogeneous as an ambient-literal structured arm: **it gets an inlined
kind** (the PR 3 mint — dict_pattern's `_key_value_pattern` is the existing
exemplar) and joins the union BY KIND, so the whole choice resolves to ONE
kind-dispatched union slot. Two reasons, one rule:

- **Repeated mixed rows are order-lossy in the MODEL.** With the repeat
  OUTSIDE the choice (`repeat(choice(...))`), each element independently
  picks an arm; splitting named arms into per-slot lists destroys the
  cross-arm interleaving (enum_body's `A, B = 1, C` — `name[]` +
  `enum_assignment[]` cannot reconstruct the weave; no emission strategy can
  recover it).
- **Even singular mixed rows are a worse factory surface** — N parallel
  optionals with no structural exactly-one-of vs one union member (the §1
  symptom this design exists to remove).

Named arms split into two classes with two mechanisms (2026-07-21, user
decision — "PR 1.5"):

- **Degenerate fielded arm** (a bare `field(x, ref)` — one slot, NO ambient
  literals: enum_body's `field(name, _property_name)`, the export arms'
  `field(declaration, declaration)`): **label-routed into the union** —
  `parseName = fieldName, storageName = 'content'`. Tree-sitter already
  labels these children; the union slot's parseNames become
  `fieldLabels ∪ kinds`, one content storage, NO grammar/parser change, no
  mint. This is PR 1.5 (model/wrap-side only).
- **Structured named arm** (fields + ambient literals: dict_pattern's kv
  `field(key) ":" field(value)`, arrow_function's signature arm,
  index_signature): still needs the **PR 3 enrich mint** — a field label can
  route the children, but only a minted kind's template can re-materialize
  the literals.

Until the respective mechanism lands, a mixed row emits diagnostic
`union-slot-mixed-row` (message tags the repeated/order-lossy case) and
keeps status-quo distribution. **PR 1 routing therefore covers PURE unions
only**; mixed rows convert as PR 1.5 (degenerate) and PR 3 (structured)
land. After PR 1.5, `union-slot-mixed-row` fires only for structured named
arms.

Resulting routings for a fieldless choice (all gates passing):

| Arm population | Slots produced |
| --- | --- |
| all unnamed nonterminals | ONE `'content'` union slot (choice ↔ slot 1:1) |
| all field-named | named per-arm slots (existing distribution — correct by the fields) |
| mixed | named slots for the named arms + ONE `'content'` union slot absorbing the unnamed arms |

Fixed name `'content'` (not derived `xOrY`, not `'value'`): §4c already
sanctions it, gate (a) makes it collision-free by construction, and no new
naming-derivation machinery is introduced. Choices where **all** arms share one
field name keep the existing better outcome (a single slot named by that
field, via `sharedArmFieldName` — `isStructuralChoice` already returns false
there).

**Wrap/read congruity (why this preserves dynamics):** parseNames→storageName
is many-to-one by design, and the two routing keys never overlap — named slots
route by field label, the union slot routes by kind (existing union slots such
as `export_statement_default.content` prove the by-kind path). Per-value
`parseKind`/`kind` refs and K-stamps ride along unchanged
(`deriveValuesForRule` derives the union slot's values from the unnamed arms
as today).

**Emission is slot-driven, and the union slot REPLACES emit-all-arms.**
`emitChoice` emits one reference per slot the choice resolved to — never one
per arm:

- **Pure union (row 1):** a single `{{ content }}` reference (`lookupSlot`
  via the choice `rule.id` back-pointer). Kind dispatch happens on the data
  side (wrap/transport by kind), NOT via template conditionals — the union
  slot subsumes the "emit ALL arms as conditionals" mechanism entirely. This
  is what fixes the standing `visibility_modifier_group1` class (`pub ()`):
  its arms are unnamed nonterminals, so it IS row 1 — one union slot, one
  reference.
- **All-named / mixed (rows 2–3):** one reference per named slot (presence
  gating per the existing per-slot emission conventions) plus, in the mixed
  case, the one `content` reference. Still slot-iteration — arms are a
  many-to-one projection onto slots.

The `__synthetic_exclusive_choice__` case-A concatenation
(`templates.ts:1680–1683`) becomes legacy: wherever union routing applies,
the discriminating position emits as one slot reference instead of
concatenated arm conditionals — retire it as its producers migrate. Producers
with per-arm ambient literals migrate via PR 3's enrich-generated groups
(each structured arm → its own group kind → union member); the generated
group is inlined at the reference site per the existing per-ref inline
convention (`inline = hidden && !aliased`) and its rendering is **already
governed by the existing conditional handling** — no new emission machinery.
Fallback B remains for genuinely pure-literal choices only.

## 3. What already exists (verified 2026-07-21 — the change is routing, not machinery)

| Mechanism | Where | Status |
| --- | --- | --- |
| Single union slot for a fieldless choice, `'content'` fallback name | `buildSlot`, `collect-slots.ts:373–428` | EXISTS — used for non-structural choices |
| One-slot-many-kinds transport | per-slot child enums, `acceptedIdsByKind` (K3c) | EXISTS |
| Template emission from the union slot | `emitChoice` path 1 — `lookupSlot` via the choice `rule.id` back-pointer (`buildSlot` stamps `sourceRuleIds`) | EXISTS — no new emit path needed |
| `content`-array relaxation (empty containers legal) | `collect-slots.ts:446–450` | EXISTS — applies to the new slots automatically |
| Diagnostics channel | `recordAssembleWarning` (already imported by collect-slots; `storagename-collision` precedent) | EXISTS — add the two new codes |
| Exactly-one-choice discipline | `findVariantChoice` (`link.ts:1330–1381`) bails on >1 choice | PRECEDENT — same discipline, now at slot derivation via gate (a) |

## 4. The VariantRule finding

The only remaining **production mint** of `VariantRule` is
`collapseAllFieldChoiceMembers` (`evaluate.ts:197–224`): an all-field choice
with heterogeneous names retypes each `FIELD` to `VARIANT`. Its sole downstream
effect is that VARIANT carries no `fieldName`, so `carriesNamedField` misses
the arms, `isStructuralChoice` returns false, and the choice routes to the
single `'content'` union slot. **The retype IS today's union-slot mechanism,
implemented as type-laundering to erase field names.** Its own doc comment
("Link's `promotePolymorph` … wraps the whole rule in a `PolymorphRule`") is
stale — DE-POLYMORPH (2026-06-01, `link.ts:1131–1145`) ended that consumer.

Everything else has already moved off the rule-type:

- `variant()` overrides mint **aliases**, not VariantRules
  (`dsl/primitives/variant.ts` — "carries NO classification metadata").
- `tagVariants` (the 400+ phantom mint) is removed (`link.ts:1027`).
- `findVariantChoice` / `applyOverridePolymorphs` discover variant children
  **structurally** (`deriveStructuralVariantChildren`); their `m.type ===
  VARIANT ? m.content : m` unwraps are tolerance, not dependence.
- `polymorphVariants` registration/serialization (node-model.json5 descriptors,
  `$variant` stamping) flows from wire deposits + structural derivation —
  untouched by this design.

Under the per-arm model the retype is not merely redundant — it is
**vocabulary-inverting**: it takes arms the author explicitly field-named
(named-slot identity) and launders them into the unnamed-union regime. Deleting
it restores the stated vocabulary: those choices' arms stay `FIELD`s and route
to **named per-arm slots** (routing row 2), not to a `'content'` union. That is
a **generated-surface change** for every kind using the legacy
`field()`-in-choice polymorph encoding (the shape evaluate's own doc comment
calls "the encoding overrides.ts uses for polymorphs"): today they collapse to
one `'content'` slot; post-deletion they surface N named slots. Each census hit
becomes either an accepted named-slot surface or a `variant()` migration in
overrides (author intent: union → say so with `variant()`). Rendering those
named slots correctly depends on PR 1's conditional multi-arm emission.

Then `VariantRule` + `isVariant` + the `case VARIANT:` passthroughs (~24
files; todo-debt Track 2) become a pure cut. **Registration stays. Only the
rule-type retires.**

## 5. Implementation plan

### PR 1 — union-slot routing + diagnostics (collect-slots)

1. **Census first** (spec-endstate rule: discover usage before behavior
   change). Add a dry-run probe (`sittir tool` or a temporary
   `SITTIR_UNION_SLOT_PROBE` stderr trace in the CHOICE case) that, per
   grammar, lists every fieldless structural choice with: owning kind, arm
   shapes, would-qualify verdict, and which gate fails. Prior discussion
   estimated ~88 candidate kinds across the three grammars — re-enumerate;
   this census is the review artifact and the A/B triage worklist.
2. **Predicate (per-arm).** In the CHOICE case: partition arms into
   field-named / unnamed-nonterminal (reuse `isSlotNode` on the arm; no new
   arm-walk helper if `sharedArmAttrs`' walk can be reused) / unnamed-structured.
   Gate (b) = no unnamed-structured arms; gate (a) = `'content'` unclaimed by
   any sibling slot of the rule (pre-pass at the `deriveSlots` boundary — the
   only place with whole-rule visibility). Both pass → named arms distribute as
   today; the unnamed-nonterminal arms build ONE union slot (`buildSlot` on a
   choice restricted to those arms, stamping the choice's `rule.id` into
   `sourceRuleIds`). The qualifying case must NOT fire the unnamed-choice
   warner (it is now sanctioned, not a missing-name smell); gate-failure cases
   keep current behavior and emit their diagnostic via `recordAssembleWarning`
   (`union-slot-content-collision` / `union-slot-nondegenerate-arm`).
3. **Emission.** `emitChoice`: emit one reference per slot the choice
   resolved to — a single `{{ content }}` reference for the pure union (the
   union slot replaces emit-all-arms; dispatch is data-side), per-named-slot
   references (existing presence conventions) for rows 2–3. Tighten
   `assertSlotPreservation` to stop skipping unnamed group-arm slots
   (KNOWN_ISSUES follow-up), so a future slot-less choice fails loudly at emit
   instead of dropping arms. Fallback B remains for genuinely pure-literal
   choices only; the `__synthetic_exclusive_choice__` concatenation retires as
   its producers migrate to union routing.
4. **Gates.** Regen A/B ×3 with every diff triaged against the census (factory
   keys change: N parallel optionals → one `content`; transport N `Option`
   fields → one union field; templates emit one slot ref; read side by-kind
   routing). `pnpm validate:native` hold-or-improve — expect AstMatch **gains**
   on kinds in the fallback-B drop class. Full suite; corpus probes for the
   known broken shapes (`export default function foo() {}`,
   `export default <expr>;` once their arms are restructured per diagnostic).

### PR 1.5 — label-routed degenerate fielded arms (`parseName = fieldName, storageName = 'content'`)

Admit DEGENERATE fielded arms (bare `field(x, ref)`, no ambient literals)
into the union by FIELD LABEL — no mint, no grammar/parser change:

1. **Partition refinement.** `partitionChoiceArms` splits named arms into
   degenerate (the arm is a single fielded ref) vs structured (fields +
   literals / multi-slot). Gate (c) narrows: degenerate arms join the union;
   `union-slot-mixed-row` keeps firing for structured arms only.
2. **Per-value parse-name stamping.** The union slot's routing keys become
   `fieldLabels ∪ kinds`: `deriveValuesForRule` stamps the degenerate arm's
   values with `parseName = fieldName` (today `projectSlotNaming.parseNames`
   switches wholesale on slot-level `fieldName` — the union slot stays
   UNNAMED, so the label must ride per-value).
3. **Wrap precedence (normative).** The reader consumes FIELD-LABELED
   children first and kind-routes only unlabeled children — §6's
   invalidates-if precedence made normative. This also resolves the
   `export_statement` gate (a) shape (same kind bare AND inside a fielded
   arm) by construction.
4. **Gates.** A/B ×3 triaged against the `union-slot-mixed-row` census
   (affected kinds' factory surface: N parallel optionals → one `content`
   union); `validate:native` hold-or-improve — expect gains on the
   export-default class; corpus probes `export default function foo() {}` /
   `export default <expr>;` and enum_body mixed member/assignment order
   round-trip (order now preserved — one list in parse order).

### PR 2 — retype deletion + VariantRule cut

1. Census the retype's reach: every all-field heterogeneous choice per grammar
   (the kinds whose surface flips from one `'content'` slot to N named slots
   when the laundering stops). Per kind, decide: accepted named-slot surface
   (author's fields stand) or `variant()` migration in overrides (author meant
   a union — say so in union vocabulary). Land the override migrations FIRST
   so the surface flip is opt-in per kind.
2. Delete `collapseAllFieldChoiceMembers`' VARIANT retype (heterogeneous
   all-field choices stay plain `CHOICE` of `FIELD`s; simplify pushes
   `fieldName` to leaf attrs as usual; PR 1's per-arm routing takes over).
   **NOT byte-identical**: A/B diffs must match the step-1 census exactly —
   any diff outside it is an unknown second effect of the retype (stop and
   record it here).
3. Cut `VariantRule` from the `Rule` union + `VARIANT` const + `isVariant` +
   the passthrough arms (todo-debt Track 2 worklist; ~24 files — evaluate,
   normalize, simplify, wrapper-deletion, collect-slots, assemble, link,
   templates, suggested, node-model, rule-catalog + tests). `suggested.ts`'
   variant-label naming priority re-points at arm `fieldName` (better fact,
   same information). This step IS byte-identical (passthroughs only).
4. Gates: tsgo clean, A/B triaged against the census (step 2) then
   byte-identical (step 3), `validate:native` hold-or-improve, full suite.

### PR 3 — widen the enrich group-mint gate to structured choice arms

PR 3 is ONE change: the enrich group-mint gate — today `parentIsOptionalSeq`-
shaped only (the clause-hoist path; the Wave 3 `tuple_pattern` finding: "the
mint gate doesn't cover choice arms") — widens to also mint a group for an
unnamed structured (ambient-literal) choice arm, AND (gate (c) refinement)
for a FIELD-NAMED arm of any mixed-row choice: every arm of a union-candidate
choice needs kind identity so the choice resolves to ONE kind-dispatched
union slot (repeated mixed rows are order-lossy, and even singular ones are a
worse factory surface — see §2). Witnesses: enum_body_group1's `field(name)`
arm, dict_pattern_group1's kv arm (whose `_key_value_pattern` rule already
exists — mint = promote, not synthesize). **The elevation MUST be enrich-side
and pre-generate** (Principle #16): wrap routes children into the single
`content` slot BY KIND (`acceptedIdsByKind`), so the minted kind must exist
in the grammar the parser compiles from — a sittir-side-only kind would leave
its parse-tree children unroutable. A field-named arm's fields move onto the
minted kind's OWN surface (`_key_value_pattern.key/value`); the arm site
becomes a bare unnamed ref, and PR 1's predicate routes it with no
PR 3-specific slot code.

**Provenance of the gap (confirmed in code):** the exclusion is deliberate,
not accidental. The mint-site predicate's doc comment
(`isClauseHoistVisibleGroupAlias`, `evaluate.ts:2033–2051`) states the hoist
mints "never as a bare multi-arm dispatch `choice` member (an enum/variant
arm, not a hoisted clause)" and excludes inlined hidden rules as "the
polymorph-variant-hoist shape, a different producer" — i.e. **choice-arm
territory was ceded to the variant-registration producer**. For arms the
author never `variant()`-ed, that claim was never fulfilled: they fall
through as raw seqs to the fallback-B drop. PR 3 reclaims the unclaimed
remainder.

**Variant registration's role converges to NAMING, not producing.** There is
ONE producer — the widened automatic gate — and `variant()` remains as the
authored naming overlay on it: an arm with `variant()` coverage gets its
group minted under the friendly name the author declared; an uncovered arm
gets the derived `_<parent>_groupN` name. Authored name takes precedence
over derived name (prefer-overrides-over-inference). **The friendly name is
COMPILER-TRANSPARENT**: it is minted into the grammar itself (enrich injects
pre-generate, reaching both parser and IR — Principle #16), so tree-sitter's
own parser/catalog carry it natively — it IS the actual name from
tree-sitter's PoV. Specifically, the name applies to the **visible twin** —
the alias target that effects the visible promotion — NOT the hidden twin:
the hidden carrier rule keeps its derived `_`-prefixed name, and the alias
value is the friendly name (the same twin structure the KindId work mapped:
catalog row keyed by the hidden source kind, `symbolName` = the visible
display name). Parse-tree nodes carry the friendly name; no sittir-side
relabel layer on top. Preconditions ("if we can manage it"): the visible
name must not collide with an existing rule (deterministic check at mint),
and the named promotion must not perturb parsing relative to the unnamed
form — per-site fallback is the derived name. This is what
"registration stays" means concretely: friendly names for the auto-promoted
visible groups (+ the existing `polymorphVariants` descriptor
serialization). **Pin at implementation:** exactly one group per arm site
regardless of coverage — whether the variant alias IS the mint (wire injects
it first and the gate sees a degenerate alias ref) or the gate mints and the
variant name relabels it, the composition must never double-mint; verify the
wire-injection ordering and add an explicit coverage check if ordering alone
doesn't guarantee it.

Everything downstream is EXISTING machinery, no new code:

- **kindId** — automatic via the standard synthesis route
  (`every-kind-has-kindId` invariant, minted into `base.grammar.rules`).
- **Inline vs visible** — decided by `isInlineSafe`
  (`dsl/group-classify.ts:17–21`: inline-safe iff the body reduces to
  exactly ONE `field`/`symbol` slot, NOT a bare choice) consumed by
  `applyClauseHoist` (`dsl/enrich.ts` ~:1372): inline-safe → hidden
  `_<parent>_N` symbol, inline + gate; multi-slot / bare-choice-slot /
  separator-variable-repeat bodies → visible promotion (hidden rule +
  alias). CONFIRMED in code; the compiler glossary does not cover this
  (DSL-side).
- **Ambient literals** — NO wrap/read work: they are emitted in the group's
  template (render re-materializes them with zero data carriage), and anon
  literal children route to the `$other` bucket at read time and are
  dropped by the renderer — slots only ever carry nonterminal children.
- **Union membership** — the arm is now a symbol ref to the group kind,
  i.e. an unnamed single nonterminal: **PR 1's predicate routes it into the
  union with no PR 3-specific slot code.**

Consequences to gate on: this PR DOES touch grammar surface (new hidden
group rules → parser regen → kindId renumbering, the Wave 3 precedent) —
unlike PR 1, which is model/emitter-only. Factory/transport surface changes
for the affected kinds; diagnostic (b) population drops to ~0 (remaining
hits are genuinely un-groupable shapes — nested choices — which stay
diagnosed). Note the tuple_pattern memory's invalidates-if fires here: with
the mint gate widened to choice-arm sites, the alias form becomes viable —
revisit the hand-expanded `case_tuple_pattern`/`case_list_pattern` real
rules for simplification to the alias form.

Acceptance exemplar: the export-default class moved to PR 1.5 (its
`field(declaration)` arms are degenerate → label-routed); PR 3's exemplars
are the structured-arm class — dict_pattern's kv arm renders round-trip via
the promoted `_key_value_pattern` kind, `visibility_modifier`'s `pub (…)`
forms via minted groups.

## 6. Invalidates-if

- A grammar needs TWO independent union slots in one rule: gate (a) will
  diagnose instead of synthesize. Escape hatch is the existing convention —
  `field()`-name one of the choices in overrides (named slots bypass the
  `'content'` claim entirely). If that becomes common, revisit derived naming
  (the rejected `xOrY` option) — do not weaken gate (a).
- The same kind appears BOTH as an unnamed union member and inside a
  field-named arm of the same choice (mixed routing row 3): by-kind routing
  for the union and by-field routing for the named slot must not both claim
  the same CST child. Census must flag this shape; if it occurs, the read
  side must consume field-labeled children for named slots FIRST and route
  only unlabeled children by kind — verify wrap's existing precedence, else
  diagnose the shape.
- PR 2 step 2's A/B shows diffs outside the step-1 census: the retype had a
  second behavioral effect beyond fieldName-erasure — stop, find it, and
  record it here before cutting.
