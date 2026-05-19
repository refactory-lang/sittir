# Rule Attribute Enrichment + Template Emitter Refactor

**Date**: 2026-05-18
**Status**: Design — awaiting user review
**Branch**: TBD (follow-on to current `024-rust-slot-surface-contract`)
**Related specs**: [`2026-05-15-024-cleanup-rules.md`](../conventions/2026-05-15-024-cleanup-rules.md), [`2026-05-17-kind-named-slots-design.md`](./2026-05-17-kind-named-slots-design.md), [`specs/020-template-engine-converge/spec.md`](../../../specs/020-template-engine-converge/spec.md)

## Summary

Refactor the codegen template pipeline in four sequenced PRs:

1. **PR0** — Additive IR enrichment: every Rule gains modifier attributes (`fieldName`, `multiplicity`, `separator`, `trailing`, `leading`, `nonterminal`) populated when wrappers (`optional` / `repeat` / `repeat1` / `field`) would force their semantics. Wrappers untouched.
2. **PR1** — New `emitters/templates.ts` runs in parallel with legacy `template-walker.ts`. ModelType-dispatching, follows the established emitter pattern. Reads enriched attributes from PR0. In-process diff gate enforces byte-identical output.
3. **PR2** — Delete `template-walker.ts`, the `node-map.ts` translation pipeline, `AssembledXxx.renderTemplate()` methods, `ClauseRule` (27 sweep sites). Edge case (a)(b)(c) test additions land here.
4. **PR3** — Delete `OptionalRule` / `FieldRule` / `RepeatRule` / `Repeat1Rule` wrapper rule types entirely. Compiler-side switches shrink. `node-model.ts` / `suggested.ts` / `compiler/grammar.ts` migrate with re-wrap logic. `node-model.json5` schema bump. Edge cases (d) multi-separator + (e) list-suffix divergence + spec 020 residual land here.

Net code change estimate: **~−2,400 to −2,600 lines** across the four PRs, with the deletion concentrated in `template-walker.ts` (~1758), the `node-map.ts` translation pipeline (~1300), and `AssembledXxx.renderTemplate()` methods (~200), against ~800 lines added in the new emitter and ~150 in IR enrichment/migration.

## Motivation

Three architectural smells that this refactor closes:

1. **Template emission violates the emitter pattern.** Every other emitter (`factories.ts`, `wrap.ts`, `from.ts`, `types.ts`, `render-module.ts`, `transport-common.ts`) iterates `nodeMap.nodes`, dispatches on `node.modelType`, and owns all string generation locally. Template emission alone delegates string generation back into compiler-side classes (`AssembledXxx.renderTemplate()`), which then call a Rule-tree-walking helper (`template-walker.ts`). The walker re-derives structural information (cardinality, optionality, separator, clause-vs-plain) at emit time that the assembly phase already learned. See `feedback_emitter_pattern_consistency.md`.

2. **The translation pipeline is scar tissue.** The walker emits an intermediate format (`$NAME`, `$$$NAME`, `$NAME_CLAUSE`, plus `clauses` dict and `joinByField` metadata) that a second pass (`inlineJinjaClauses` → `translateToJinja` → spacing absorbers → brace escapes) translates into final Jinja. Two passes through ~3,000 lines of code to produce what direct emission could produce once.

3. **Modifier rule types (`optional`, `repeat`, `repeat1`, `field`) are not "true" rules — they're modifiers of constituent rules.** They alter slottiness (`field('semicolon', ';')` force-promotes a string literal to a nonterminal slot), cardinality (`repeat($.X)` makes X array-multiplicity), and presence (`optional($.X)` makes X optional). All of this can live as attributes ON the constituent rule rather than as wrapper layers around it. See `feedback_wrapper_slottiness.md`.

`ClauseRule` is a fourth, narrower smell: it exists only to remember "these flanking string siblings belong to this optional's bound field", which is information that naturally lives on the optional itself (`leading` / `trailing` attributes).

## Architectural principles

These principles govern every design decision in this spec and are load-bearing for future work in the codegen pipeline:

- **Emitter pattern consistency**: every emitter iterates `nodeMap.nodes`, dispatches on `node.modelType`, owns ALL string generation locally. Compiler-side classes (`AssembledXxx`) expose data only; no `.renderXxx()` methods producing output strings. See `feedback_emitter_pattern_consistency`.
- **No lossy distillation between rule and emitter**: rules preserve all encoded information; consumers walk rules directly. Slot model / derived metadata are additive caches, never replacements for the source. See `feedback_no_lossy_distillation`.
- **RuleId back-pointers for emitter lookups**: emitters walking rule trees use `nodeMap.slotByRuleId(rule.id)` → `AssembledNonterminal` for `storageName` / `propertyName` / etc., not re-derivation from `rule.name` + owner traversal. See `feedback_ruleid_backpointer`.
- **Rule + slot vocabulary alignment**: same concept on both sides MUST use identical field names. `multiplicity` (NOT `arity`), `separator`, `trailing`, `leading`, `nonterminal`. No `hasTrailing`-vs-`trailing` divergence. See `feedback_rule_slot_vocabulary_alignment`.
- **Wrapper slottiness becomes explicit**: `optional` / `repeat` / `repeat1` / `field` force their contents to nonterminal-ness. Under push-down (PR3), this becomes an explicit `nonterminal: true` attribute on the rule. Not lost when wrappers delete.

## Regression gate

A single gate applies to every PR. The gate is composed of three checks:

1. **Pre-snapshot baseline.** Before applying any PR, run `pnpm regen-all` on a clean checkout and capture the diff against the in-tree generated artifacts. The diff must be empty pre-refactor; if not, baseline is dirty and must be resolved as a separate step.

2. **Snapshot diff after refactor.** Apply the PR, run `pnpm regen-all`, then `git diff --stat` against the following files. Drift is interpreted per the PR-specific rules below.
   - `packages/{rust,python,typescript}/templates/*.jinja` (canonical Jinja templates)
   - `packages/{rust,python,typescript}/src/**` (generated TS — factories, wrap, from, types, consts, transport)
   - `packages/{rust,python,typescript}/.sittir/*` (build artifacts)
   - `rust/crates/sittir-{rust,python,typescript}/src/render/**` (generated Rust render code)
   - `packages/{rust,python,typescript}/factory-map.json5` (generated factory map)
   - `packages/{rust,python,typescript}/overrides.suggested.ts` (generated suggested overrides — relevant especially for PR3)

3. **Counts verification.** Run `pnpm exec tsx packages/validator/src/cli.ts counts --backend native {rust,python,typescript}`. No regression in cov / RT / RT-shallow / factory / from across all three grammars, **including ast strictness** (per memory `render_text_fastpath_masks_templates` — the `$text` fast-path can mask broken templates against the RT pass count but not against ast-strict comparison).

### PR-specific drift rules

| PR | Drift allowed? | Counts requirement |
|---|---|---|
| PR0 | **Zero drift.** Enrichment is purely additive. | No regression. |
| PR1 | **Zero drift.** Plus: in-process assertion during regen — legacy walker output and new emitter output must be byte-identical for every kind. | No regression. |
| PR2 | **Zero drift.** Deletion of legacy paths must produce identical output to PR1 (which already matched legacy). | No regression. |
| PR3 | **Drift allowed only paired with (1) a counts improvement and (2) a one-line entry in this spec's `Edge case absorption` ledger explaining which in-scope edge case the drift addresses.** | No regression in core metrics; ast improvements expected for edge case fixes. |

The pre-snapshot baseline requirement is critical — the branch is currently 62+ commits ahead of origin with multiple in-flight workstreams (kind-named slots, groups synthesis). If `pnpm regen-all` produces a non-empty diff against checked-in artifacts before this refactor starts, that's a separate problem that must be resolved first.

## PR0 — IR enrichment (purely additive)

### Goal

Populate modifier attributes on every Rule when wrappers (`optional` / `repeat` / `repeat1` / `field`) would alter that rule's semantics. Wrappers stay in place. Every existing consumer reads the wrapper structure as before; new consumers (the PR1 emitter) can read attributes directly.

### IR changes

```ts
// compiler/rule.ts — add to RuleBase, inherited by every Rule type
interface RuleBase {
  readonly id?: RuleId;

  // PR0 additions — match NodeOrTerminal vocabulary (node-map.ts:69, 117, 144).
  readonly fieldName?: string;
  readonly multiplicity?: Multiplicity;          // 'optional' | 'single' | 'array' | 'nonEmptyArray'
  readonly nonterminal?: boolean;                // explicit slottiness — promotes terminals to slots

  // Separator — structured to disambiguate separator placement from any other concept.
  // Simple case: just literal content. Placement-aware case: object with placement booleans.
  readonly separator?:
    | string                                   // simple case (no placement)
    | readonly Rule[]                          // multi-literal separator (no placement)
    | {
        readonly rules: readonly Rule[];        // the separator content
        readonly trailing?: boolean;            // separator MAY appear after last element
        readonly leading?: boolean;             // separator MAY appear before first element
      };
}
```

**Note on flanking literals**: an earlier version of this spec proposed `leading?: readonly Rule[]` and `trailing?: readonly Rule[]` on `RuleBase` to capture literals bound to a slot (the former `ClauseRule` role). **That approach has been dropped** in favor of the universal seq-of-leaves shape (next section). Flanking literals naturally live as adjacent members in the containing seq; no dedicated rule-attribute is needed.

**`NodeOrTerminal` migration** (consequence): the per-value `trailing?: boolean` / `leading?: boolean` flags on `NodeOrTerminal` (node-map.ts:117, 144) describe separator placement. They migrate into the separator object in PR3 as edge case (f) for vocabulary alignment. PR0/PR1/PR2 keep the existing per-value boolean shape; the migration is independent.

### Universal canonical shape: branches and groups are seqs of leaves

Every `AssembledBranch` and `AssembledGroup` rule body, after simplification, is a `SeqRule` whose members are leaves. A "leaf" is one of:
- A pure-literal rule (`StringRule` with no slot attributes — renders text directly)
- A slot-ref leaf (`SymbolRule` / `StringRule` / `EnumRule` with at least one of `{fieldName, multiplicity, nonterminal}` set — represents a slot at that position)

No nested structural rules (`optional`, `repeat`, `repeat1`, `seq`, `choice`) appear as members of a branch's body seq. Every nested structural rule has been normalized into either:
- An attribute on a leaf — when the wrapper's content was a single leaf
- A synthesized group whose body is itself a seq of leaves — when the wrapper's content was structural

#### Normalization cases

| Original rule shape | After normalization |
|---|---|
| `seq(string('fn'), field('name', $.id), string('('), ...)` (top-level branch body) | Stays — already a seq of literals + slots |
| `optional(field('x', $.A))` (leaf content) | `SymbolRule { name: 'A', fieldName: 'x', multiplicity: 'optional', nonterminal: true }` — leaf with attributes |
| `optional(seq(string('->'), field('x', $.A)))` (single slot with flanks) | Synthesize `_opt_grp_NNN = seq(string('->'), SymbolRule{...})`; parent gets `SymbolRule { name: '_opt_grp_NNN', multiplicity: 'optional', nonterminal: true }` |
| `optional(seq(field('a', $.X), field('b', $.Y)))` (multi-field seq) | Synthesize a group; parent gets a slot-ref. Co-optional preserved by construction. |
| `optional(seq(string('('), field('a', $.X), string(','), field('b', $.Y), string(')')))` (interspersed literals) | Synthesize a group containing the seq verbatim; parent gets a slot-ref |
| `repeat($.X)` (leaf content) | `SymbolRule { name: 'X', multiplicity: 'array' }` |
| `repeat(seq($.X, string(',')))` (single content + separator) | `SymbolRule { name: 'X', multiplicity: 'array', separator: ',' }` |
| `repeat(seq(field('a', $.X), string(','), field('b', $.Y)))` (multi-field) | Synthesize a group; parent gets `SymbolRule { name: '_rep_grp_NNN', multiplicity: 'array', separator: ',' }` |
| `seq(literal, optional(seq(literal, slot)), literal)` (nested structural inside branch seq) | Nested optional/seq gets synthesized into a group; outer seq has `seq(literal, slot-ref-to-group, literal)` |

#### Simplify's role

The simplify phase (`compiler/simplify.ts`) gains responsibility for normalizing toward the universal shape. Specifically:
- Push leaf-content modifier wrappers into attributes on the leaf (idempotent with enrich)
- Trigger group synthesis for ANY structural-content modifier wrapper (any `optional`/`repeat`/`repeat1` whose content is a `seq` or `choice` with multiple members or with slot content)
- Flatten degenerate single-member seqs
- Verify post-condition: every branch / group body is a `SeqRule` of leaves

The "where does auto-synthesis actually run" architectural question (Options A / B / C below) still applies — synthesis can live in wire (pre-tree-sitter) or enrich (post-evaluation) or both, but the canonicalization toward the universal shape happens at simplify regardless.

**Why this is cleaner than the leading/trailing approach:**
- One canonical shape everywhere, applied uniformly. No "is this a clause or just an optional" branching at consumer sites.
- Single-field optional + flanks and multi-field optional are not asymmetric — both synthesize a group containing the seq.
- The emitter has no special-case for "flank handling" — it walks the seq's members in order; if any member is a slot-ref, emit a slot; if any member is a literal, emit the literal.
- Information preservation: the seq IS the source of structural order. Nothing gets lifted out into a separate attribute that consumers have to re-thread.
- Composes with the slottiness rule (PR0 enrichment force-promotes via `nonterminal: true`) — a synthesized group is itself a nonterminal, addressable as a slot at the parent.

**Cost**: more synthesized hidden kinds (every nested structural rule with slots becomes one). These appear in `factory-map.json5`, generated TS types, `node-model.json5`, etc. They're internal artifacts (hidden `_` prefix names) but visible in tooling that enumerates all kinds. The previously authored `groups:` synthesis already creates similar artifacts; the auto-version simply creates more.

The `Multiplicity` enum already exists at `node-map.ts:69`. Since `node-map.ts` imports from `rule.ts` (not the reverse), `Multiplicity` must MOVE to `rule.ts` (or to a shared `compiler/multiplicity.ts`) as part of PR0 to preserve layering. `node-map.ts` continues to use it via re-export. Surface-type mapping (from existing doc comments at `node-map.ts:60-69`):

| Wrapper around X | X.multiplicity | TS surface type |
|---|---|---|
| (none) | `'single'` (default — may be omitted) | `T` |
| `optional(X)` | `'optional'` | `T \| undefined` |
| `repeat(X)` | `'array'` | `readonly T[]` |
| `repeat1(X)` | `'nonEmptyArray'` | `NonEmptyArray<T>` |

When a rule's `multiplicity` is derived into a `NodeOrTerminal.multiplicity` by `deriveSlots`, it's literally the same value — no translation.

### Enrichment passes (added to Enrich)

All four enrichment passes run during the **enrich phase** (`dsl/enrich.ts`), not Link. Enrich is the existing place where rule transformations + rule synthesis happen — the `kwRules` injection pattern at `dsl/enrich.ts:108-114` is the precedent for synthesizing hidden helper rules into the rules map. Auto-group-synthesis follows the same pattern.

By the time Link runs, the rules map already contains: original user rules (transformed by enrich), `_kw_<name>` helpers (existing pattern), and `_opt_group_<hash>` / `_rep_group_<hash>` helpers (new). Link's existing `applyGroupOverrides` call still processes user-authored `groups:` config; the enrich-synthesized groups are just present in the rules map and get classified by Link's normal hidden-rule classification path (no special handling needed).

```ts
// dsl/enrich.ts — add as additional enrich passes alongside existing field-promotion / kw-promotion

function enrichFieldWrappers(rule: Rule): Rule {
  // For every FieldRule wrapping a target, propagate fieldName onto the target.
  // Also set nonterminal: true (field force-promotes — matches today's
  // rule-catalog.ts:234 `forcedBy === 'field'` semantics).
  if (rule.type === 'field') {
    return {
      ...rule,
      content: {
        ...rule.content,
        fieldName: rule.name,
        nonterminal: true,
      }
    };
  }
  return rule;
}

function enrichMultiplicityWrappers(rule: Rule): Rule {
  // For optional/repeat/repeat1, propagate multiplicity onto the wrapped content.
  // Slottiness: optional/repeat/repeat1 also force nonterminal (they're presence-tracked / list-shaped).
  if (rule.type === 'optional') {
    return { ...rule, content: { ...rule.content, multiplicity: 'optional', nonterminal: true } };
  }
  if (rule.type === 'repeat') {
    return { ...rule, content: { ...rule.content, multiplicity: 'array', nonterminal: true } };
  }
  if (rule.type === 'repeat1') {
    return { ...rule, content: { ...rule.content, multiplicity: 'nonEmptyArray', nonterminal: true } };
  }
  return rule;
}

function decomposeOptional(rule: OptionalRule, synth: GroupSynth): OptionalRule {
  // Universal-shape canonicalization — no leading/trailing lifting.
  //   1. content is a leaf (symbol/string/enum without slot attributes) → no decomposition
  //   2. content is a leaf with slot attributes (already a slot-ref) → leaf gains multiplicity: 'optional'
  //      (handled by enrichMultiplicityWrappers, not here)
  //   3. content is a seq or choice with one or more slot-bearing members → synthesize a hidden group;
  //      replace the optional's content with a symbol-ref to the synthesized group
  if (rule.content.type !== 'seq' && rule.content.type !== 'choice') return rule;
  if (!hasSlotBearingMember(rule.content)) return rule;   // pure-literal seq — no slot needed
  const groupSymbol = synth.synthesizeGroup(rule.content);
  return { ...rule, content: groupSymbol };
}

function decomposeRepeat(rule: RepeatRule | Repeat1Rule, synth: GroupSynth): RepeatRule | Repeat1Rule {
  // Universal-shape canonicalization, with separator lifting still meaningful for repeats.
  //   1. content is a leaf → no decomposition (multiplicity is already on the leaf via enrich)
  //   2. content is a seq with single slot + separator-like literals → lift separator, point content
  //      at the inner leaf (separator becomes Rule[] on the repeat)
  //   3. content is a seq/choice with multiple slot-bearing members → synthesize a hidden group;
  //      replace repeat's content with a symbol-ref to the synthesized group; separator (if present)
  //      stays on the repeat
  if (Array.isArray(rule.separator) || (typeof rule.separator === 'object' && rule.separator !== null)) {
    return rule;                                          // already decomposed
  }
  if (rule.content.type !== 'seq' && rule.content.type !== 'choice') return rule;

  const slotBearing = countSlotBearingMembers(rule.content);
  if (slotBearing === 0) return rule;                    // pure literals; not a meaningful repeat slot

  // Case 2: single slot-bearing member with separator-like literals (only valid for seq)
  if (rule.content.type === 'seq' && slotBearing === 1) {
    const members = rule.content.members;
    const stringMembers = members.filter(m => m.type === 'string') as readonly Rule[];
    const slotMember = members.find(m => m.type !== 'string')!;
    if (stringMembers.length > 0) {
      return { ...rule, content: slotMember, separator: stringMembers };
    }
    return rule;
  }

  // Case 3: multi-slot content — synthesize a group; separator (if present) stays on the repeat
  const groupSymbol = synth.synthesizeGroup(rule.content);
  return { ...rule, content: groupSymbol };
}
```

All four passes are idempotent and produce no observable change to existing consumers (wrappers remain; synthesized groups are first-class AssembledGroup kinds rendered by the existing group emission path). They run during the enrich phase alongside the existing field-promotion / `_kw_<name>` synthesis passes.

### Phase ordering

```
DSL evaluation (grammar.js runs)
   ↓ produces GrammarResult with raw rule objects
ENRICH (dsl/enrich.ts) — TRANSFORMS RULES + SYNTHESIZES HIDDEN HELPERS
   ├─ existing: bare-keyword promotion, optional-token promotion (→ _kw_<name> helpers)
   ├─ NEW (PR0): enrichFieldWrappers, enrichMultiplicityWrappers
   └─ NEW (PR0): decomposeOptional, decomposeRepeat — auto-synthesize _opt_group_<hash> / _rep_group_<hash> for multi-field/interspersed cases
   ↓ produces enriched rules map (original rules transformed + new hidden helpers)
LINK (compiler/link.ts) — RESOLVES + CLASSIFIES
   ├─ stampStaticExternalAltDefs
   ├─ applyGroupOverrides (user-authored groups: config; UNCHANGED)
   ├─ classifyAndLogHiddenRules — picks up enrich-synthesized hidden groups same as any other
   ├─ polymorph classification (existing tryHoistSiblingVariants)
   └─ ref resolution
   ↓ produces classified rules + RuleCatalog
ASSEMBLY (compiler/node-map.ts) — BUILDS AssembledXxx hierarchy
   ↓ produces NodeMap with AssembledNodes, slots, and the new nodeByRuleId/slotByRuleId back-pointer maps
```

The auto-synthesized hidden groups appear in the rules map as `_`-prefixed entries. Tree-sitter inlines hidden rules by default, so they don't observably change the CST shape at parse time. The codegen-internal view gets the synthesized group as a first-class `AssembledGroup` modelType; the parser's observable behavior is unchanged.

### Group synthesis (case 3 in decomposeOptional / decomposeRepeat)

When a wrapper's content has multiple fields or interspersed literals, decomposition synthesizes a hidden group rule. This uses the existing `compiler/group-synthesis.ts` machinery (already exists for authored `groups:` overrides) with an additional caller path from Link decomposition.

**Why group synthesis is the right answer for co-optional fields and interspersed literals:**

- **Co-optional semantic preserved**: the group is a single slot; presence-tracking applies to the whole group, not to each member independently. "Both or neither" is enforced by construction.
- **Interspersed literals render correctly**: the group's body is the original seq; emit walks members in order, including literals at their positions.
- **Composability**: groups are already a first-class modelType (`AssembledGroup`). The template emitter has `emitGroupTemplate`. No new emission machinery.
- **DRY with `groups:` overrides**: the synthesis primitive is the same; the decomposition pass adds automatic invocation alongside the authored-override invocation.
- **Resolves `clause_multifield_gap`**: today `detectClause` picks `firstField` only and loses subsequent fields. Synthesis captures the entire seq into a group, so nothing is lost.

**Naming**: synthesized groups get stable names derived from a content hash (e.g. `_opt_group_<hash>`) so they're regen-stable. They appear in `factory-map.json5`, generated TS types, the assembled view, etc. — treated as first-class kinds.

**Visibility**: synthesized groups are hidden (`_` prefix), matching the convention for synthesized kinds. They're not externally referenceable from grammar authoring; they're an internal artifact of the auto-decomposition pass.

### Open architectural question: where auto-synthesis runs

**Sittir has a dual-side architecture** that the original spec draft glossed over:

- `dsl/wire/wire.ts` runs BEFORE tree-sitter generation. It can rewire the grammar's rule callbacks so that tree-sitter generates synthesized rules into `grammar.json`. **This reaches the parser.**
- `dsl/enrich.ts` runs AFTER tree-sitter has parsed (post-evaluation of grammar.json into Rule-objects). Per the `feedback_enrich_post_evaluation_only` memory entry: enrich operates on the codegen-internal rule view, not the parser-generation pipeline. **This does NOT reach the parser** — adding rules in enrich does not add them to the parsed CST.
- `compiler/link.ts:117` calls `applyGroupOverrides`, which patches the post-evaluation Rule-objects to mirror the wire-side synthesis. The existing authored `groups:` config is consumed by BOTH sides (wire + link) so the parser surface and codegen surface stay in sync.

For auto-synthesis of multi-field optionals/repeats, three architectures are possible. **The choice must be resolved before PR0 implementation begins.**

#### Option A — TS-side-only auto-synthesis (in enrich)

- Parser unchanged. Tree-sitter still parses `optional(seq(field('a',$.X), field('b',$.Y)))` with flat CST children at the parent's position when the optional fires.
- Codegen synthesizes `_opt_group_<hash>` virtually. The synthesized group becomes an `AssembledGroup` in the codegen view, with its own slots.
- **Wrap/from must "virtually project" the parser's flat CST onto the synthesized group's slot structure** — i.e., when readNode encounters the parent's children at positions matching the synthesized group's content, attribute them to a virtual NodeData under the synthesized group's slot.
- **Risk**: requires wrap/from logic that may not currently exist. The existing `applyGroupOverrides` doesn't exercise this path because authored `groups:` synthesis goes through the dual-side architecture (wire patches the parser too).
- **Pros**: lightest touch; no DSL-layer changes; matches the user's "during enrich" intuition literally.
- **Cons**: significant wrap/from emission work; risk of parser/codegen drift if the projection logic gets out of sync with the parser's actual CST shape.

#### Option B — Dual-side auto-synthesis (wire + enrich)

- Mirrors the existing authored `groups:` synthesis architecture exactly.
- Wire detects multi-field optional/repeat patterns in the grammar callbacks BEFORE tree-sitter generation. Wire rewires the callbacks to use `optional($._opt_group_<hash>)` syntax. Tree-sitter sees the synthesized symbols and generates the parser accordingly. Because the synthesized rules are hidden (`_` prefix), tree-sitter inlines them at parse time — observable CST shape is unchanged.
- Enrich (or Link's existing `applyGroupOverrides`) does the matching codegen-side rewrite so post-evaluation Rule-objects stay in sync. Could be: the same detection logic in two places, OR detection in wire that emits implicit `groups:` config entries that `applyGroupOverrides` consumes.
- **Risk**: detection-pattern logic duplicated across wire and the codegen side; or shared via a common helper module that both phases import.
- **Pros**: aligns with established architecture; no wrap/from changes needed; parser-side rule actually exists (hidden) so the CST and codegen views are explicitly in sync.
- **Cons**: more files touched; detection logic lives in the DSL layer instead of post-evaluation.

#### Option C — Wire-only auto-synthesis (post-evaluation inherits)

- Detection + rewriting happens entirely in wire (pre-evaluation, DSL layer).
- The post-evaluation Rule-objects already have the synthesized symbol references; enrich and Link don't need to do anything special for this case.
- **Risk**: structural decisions that have historically lived in compiler-side passes (like the polymorph classification or enrich's auto-field-promotion) now live in the DSL layer. Different mental model from the rest of the pipeline.
- **Pros**: single source of truth for detection; no codegen-side mirror logic needed.
- **Cons**: wire layer becomes responsible for structural decisions; harder to test in isolation (wire operates on callbacks rather than Rule-objects).

#### Decision deferred to PR0 implementation

This spec records all three options as the candidate architectures. The PR0 implementation team must:

1. Verify whether wrap/from currently support "virtual group projection" (the load-bearing assumption for Option A). If yes, Option A becomes viable and is the lightest-touch.
2. If Option A is not viable without significant wrap/from changes, choose between B (mirroring existing groups: synthesis) and C (consolidating in wire).
3. Document the chosen architecture inline in this spec before PR0 lands, and update the deliverables checklist accordingly.

The decision affects scope but not the overall architecture of the four-PR sequence — auto-synthesis is a PR0 internal detail; PR1/PR2/PR3 are unaffected.

### RuleId preservation

All enrichment passes preserve `Rule.id?: RuleId`. The back-pointer maps built at assembly (next section) depend on this. Any pass that rebuilds rules without preserving `id` would invalidate the maps.

### NodeMap back-pointer maps

```ts
// compiler/node-map.ts — add to NodeMap
interface NodeMap {
  // ... existing fields ...
  nodeByRuleId: ReadonlyMap<RuleId, AssembledNode>;
  slotByRuleId: ReadonlyMap<RuleId, AssembledNonterminal>;
}
```

Populated at assembly time: when an `AssembledNonterminal` is constructed from a rule (via `deriveSlots`), it's registered under that rule's `id` in `slotByRuleId`. When an `AssembledNode` is constructed from a kind's root rule, the rule's `id` is registered in `nodeByRuleId`.

These are the runtime lookup mechanism for PR1's emitter (and any future emitter that walks rules and needs to ask "what AssembledNonterminal does this rule position correspond to").

### PR0 deliverables

- [ ] Move `Multiplicity` from `compiler/node-map.ts` to `compiler/rule.ts` (or a shared `compiler/multiplicity.ts`); `node-map.ts` re-exports
- [ ] Add `RuleBase` field set (`fieldName`, `multiplicity`, `separator` with structured form, `leading`/`trailing` as `Rule[]`, `nonterminal`)
- [ ] Implement `enrichFieldWrappers`, `enrichMultiplicityWrappers`, `decomposeOptional`, `decomposeRepeat` in `dsl/enrich.ts` alongside existing enrich passes
- [ ] Wire the synthesized `_opt_group_<hash>` / `_rep_group_<hash>` helpers into the enriched rules map (analogous to the existing `_kw_<name>` injection pattern)
- [ ] Populate `nodeByRuleId` / `slotByRuleId` maps at assembly
- [ ] Unit tests for each enrichment pass + group-synthesis cases
- [ ] No other behavior change
- [ ] **Gate**: snapshot zero drift, counts no regression

### What PR0 does NOT touch

- `template-walker.ts` (intact)
- `node-map.ts` translation pipeline (intact)
- `AssembledXxx.renderTemplate()` methods (intact)
- `ClauseRule` (intact — `detectClause` still runs, populating the legacy clause shape; `decomposeOptional` co-exists, populating the new attribute shape on the same Rule positions)
- 27 `'clause'` case sites (intact)
- Wrapper rule types (`OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule`) (intact)

## PR1 — Parallel template emitter

### Goal

Add a new `emitters/templates.ts` following the standard emitter pattern. Run in parallel with the legacy walker; assert byte-identical output during regen.

### Top-level shape

```ts
// emitters/templates.ts (rewritten)
export class TemplateEmitter implements CodegenEmitter<EmittedTemplates> {
  emit(): EmittedTemplates {
    const bodies = new Map<string, string>();
    for (const [kind, node] of this.#config.nodeMap.nodes) {
      const body = this.#emitOne(node);
      if (body === undefined) continue;
      bodies.set(kind, GENERATED_HEADER + body);
    }
    return { bodies };
  }

  #emitOne(node: AssembledNode): string | undefined {
    switch (node.modelType) {
      case 'branch':    return emitBranchTemplate(node, this.#ctx);
      case 'polymorph': return emitPolymorphTemplate(node, this.#ctx);
      case 'group':     return emitGroupTemplate(node, this.#ctx);
      case 'multi':     return emitMultiTemplate(node, this.#ctx);
      case 'supertype': case 'pattern': case 'keyword':
      case 'token':     case 'enum':    return undefined;
      default: {
        const _exhaustive: never = node;
        throw new Error(`unhandled ${(_exhaustive as AssembledNode).modelType}`);
      }
    }
  }
}
```

`EmitCtx` carries cross-cutting read-only context: hidden-symbol resolution (`rules` map), word-matcher regex, externals list, NodeMap (for ruleId back-pointer lookups). No metadata accumulators.

### Per-modelType emit functions

Each takes `node.rule` (the preserved raw rule, enriched in PR0) and walks it via `emitRule`:

```ts
function emitBranchTemplate(node: AssembledBranch, ctx: EmitCtx): string {
  return emitRule(node.rule, ctx);
}

function emitGroupTemplate(node: AssembledGroup, ctx: EmitCtx): string {
  return emitRule(node.rule, ctx);
}

function emitMultiTemplate(node: AssembledMulti, ctx: EmitCtx): string {
  return emitRule(node.rule, ctx);
}

function emitPolymorphTemplate(node: AssembledPolymorph, ctx: EmitCtx): string {
  return node.forms.map(form =>
    `{%- if $variant == "${form.name}" -%}${emitRule(form.rule, ctx)}{%- endif -%}`
  ).join('');
}
```

### `emitRule` — the Rule.type dispatch

This survives the walker deletion, but it lives in the emitter file (per the emitter pattern) and reads enriched attributes from PR0 directly:

```ts
function emitRule(rule: Rule, ctx: EmitCtx): string {
  // PR0 enrichment: leaf rules with fieldName / multiplicity attributes are slots
  if (rule.fieldName !== undefined || rule.multiplicity === 'array' || rule.multiplicity === 'nonEmptyArray') {
    return emitSlot(rule, ctx);
  }
  switch (rule.type) {
    case 'string':   return escapeLiteral(rule.value);
    case 'seq':      return rule.members.map(m => emitRule(m, ctx)).join('');
    case 'optional': return emitOptional(rule, ctx);   // wraps inner with {%- if x | isPresent %} ... {%- endif %}; flanking literals are seq members per universal shape
    case 'repeat':
    case 'repeat1':  return emitRepeat(rule, ctx);     // reads rule.separator (string | Rule[] | { rules, trailing?, leading? }) per PR0
    case 'choice':   return emitChoice(rule, ctx);
    case 'variant':  return emitRule(rule.content, ctx);    // transparent at emit time
    case 'group':    return emitRule(rule.content, ctx);
    case 'clause':   return emitClause(rule, ctx);          // PR1 transitional — detectClause still runs in Link until PR2 deletes both
    case 'field':    return emitRule(rule.content, ctx);    // attribute already on inner via PR0
    case 'symbol':   return emitSymbol(rule, ctx);
    case 'token':
    case 'alias':
    case 'terminal': return emitRule(rule.content, ctx);
    case 'enum':     return rule.members.map(m => escapeLiteral(m.value)).join('');
    case 'pattern':  return '';
    default: {
      const _exhaustive: never = rule;
      throw new Error(`emitRule: unhandled ${(_exhaustive as Rule).type}`);
    }
  }
}

function emitSlot(rule: Rule, ctx: EmitCtx): string {
  // Use ruleId back-pointer to fetch the AssembledNonterminal.
  const slot = rule.id ? ctx.nodeMap.slotByRuleId.get(rule.id) : undefined;
  const propertyName = slot?.propertyName ?? snakeToCamel(rule.fieldName ?? 'value');
  const multi = rule.multiplicity;

  if (multi === 'array' || multi === 'nonEmptyArray') {
    // separator: string | readonly Rule[] | { rules, trailing?, leading? }
    const s = rule.separator;
    const sepRules = typeof s === 'string' ? [s]
                  : Array.isArray(s) ? s.map(stringifyRule)
                  : (s && 'rules' in s) ? s.rules.map(stringifyRule)
                  : [' '];
    const sep = sepRules.join('');
    const placement = (s && typeof s === 'object' && 'rules' in s) ? s : undefined;
    const filter = placement?.trailing ? 'joinWithTrailing'
                : placement?.leading  ? 'joinWithLeading'
                : 'join';
    return `{{ ${propertyName} | ${filter}("${escapeJinjaString(sep)}") }}`;
  }
  if (multi === 'optional') {
    return `{%- if ${propertyName} | isPresent %}{{ ${propertyName} }}{%- endif %}`;
  }
  return `{{ ${propertyName} }}`;
}
```

### Parallel emit + in-process diff gate

During PR1's lifetime, the TemplateEmitter's `emit()` runs BOTH the legacy walker (via the existing `node.renderTemplate()` method) AND the new per-modelType emit functions. The outputs are diffed in-process per kind. If any divergence exists, regen fails loud with the kind + diff.

This gate is **stricter** than the post-regen snapshot diff: it catches divergences during regen rather than after, with a per-kind locator. The snapshot diff is the secondary safety net (catches anything that escapes the per-kind in-process diff).

```ts
// emitters/templates.ts — during PR1
const legacyBody = node.renderTemplate(ctx.rules, ctx.wordMatcher, ctx.externals)?.body;
const newBody = this.#emitOne(node);
if (legacyBody !== newBody) {
  throw new Error(`TemplateEmitter divergence on kind ${kind}:\nlegacy=${JSON.stringify(legacyBody)}\nnew=${JSON.stringify(newBody)}`);
}
```

### PR1 deliverables

- [ ] New `emitters/templates.ts` with modelType dispatch + per-modelType emit functions
- [ ] `emitRule` reads PR0 enriched attributes (`fieldName`, `multiplicity`, `separator` in its structured form, `nonterminal`)
- [ ] `emitSlot` uses `nodeMap.slotByRuleId(rule.id)` for `propertyName` / `storageName` lookups
- [ ] Internal helpers: `escapeLiteral`, `escapeJinjaString`, `stringifyRule`, `snakeToCamel`, plus rule-type helpers (`emitOptional`, `emitRepeat`, `emitChoice`, `emitSymbol`, `emitClause`)
- [ ] In-process diff gate during regen
- [ ] Legacy walker + `AssembledXxx.renderTemplate()` methods + translation pipeline UNTOUCHED
- [ ] **Gate**: snapshot zero drift + in-process diff zero divergence + counts no regression

## PR2 — Legacy delete + ClauseRule sweep

### Goal

After PR1 burns in for a settling period (~1 day), delete the legacy template-walker + translation pipeline + `AssembledXxx.renderTemplate()` methods + `ClauseRule` and all 27 `'clause'` case sites.

### Files deleted entirely

- `packages/codegen/src/compiler/template-walker.ts` (~1758 lines)

### Functions / methods deleted

| Item | Location | Lines (approx) |
|---|---|---|
| `inlineJinjaClauses` | node-map.ts:1737 | ~120 |
| `translateToJinja` | node-map.ts:2059 | ~200 |
| `escapeJinjaBraceCollisions` | node-map.ts:2538 | ~40 |
| `JinjaTranslateMeta` interface + 3 assembly sites | node-map.ts | ~120 |
| `AssembledBranch.renderTemplate` | node-map.ts:2848 | ~50 |
| `AssembledPolymorph.renderTemplate` | node-map.ts:3317 | ~80 |
| `AssembledGroup.renderTemplate` | node-map.ts:3847 | ~50 |
| `AssembledMulti.renderTemplate` (if present) | node-map.ts | ~20 |
| `WalkResult`, `WalkSlotUse`, `deriveWalkSlots` | template-walker.ts (deleted) | — |
| `ClauseRule` interface + `isClause` guard | rule.ts:133, 341 | ~10 |
| `detectClause` | link.ts:2282 | ~20 |

### The 27 `'clause'` case sweep

Each `case 'clause':` in the codebase falls into one of three patterns; the migration is mechanical:

| Pattern | Migration |
|---|---|
| `case 'clause': return walkInner(rule.content)` (transparent unwrap) | Folded into `case 'optional':` — clause was always optional-shaped |
| `case 'clause': /* simplification */` | Folded into 'optional' case which now handles the same shape |
| `case 'clause': /* type guard */` (`if (r.type === 'optional' \|\| r.type === 'clause')`) | Drop `\|\| r.type === 'clause'` — covered by 'optional' |

Sites by file (approximate, from `rg -c "case 'clause'"`):
- `optimize.ts`: 7 sites
- `node-map.ts`: 8 sites (mostly in the translation pipeline being deleted)
- `template-walker.ts`: 9+ sites (file deleted entirely)
- `link.ts`: 2 sites (`detectClause` + rule-type literal)
- `field-shape.ts`: 1 site
- `rule.ts`: ClauseRule + isClause definitions

### In-scope edge cases (a)(b)(c) landed in PR2

| Edge case | Memory entry | How PR2 resolves it |
|---|---|---|
| (a) Walker hotspot — 3 fixes, no tests | `walker_hotspot` | Walker deleted; the 3 fixes' INTENT becomes test cases in `__tests__/templates-emitter.test.ts` against the new emit functions. Each fix's symptom + test is documented inline. |
| (b) Choice-branch literal drop | `choice_with_literals_cluster` | Walker deleted; choice handling moves to `emitChoice` in the new emitter. The new emitter does not have the "drop literals from non-primary branches" bug because there's no branch-walking; choices are either polymorph forms (with explicit variant guards) or simple alternates. |
| (c) Adjacency for scanner-delimited kinds | `template_walker_adjacency` | Spacing absorbers deleted; the new emitter outputs literals exactly as captured on rules. Adjacency is the natural default. The `renderTemplate` text fallback referenced in the memory entry becomes unnecessary. |

### PR2 deliverables

- [ ] Delete `template-walker.ts`
- [ ] Delete translation pipeline functions in `node-map.ts`
- [ ] Delete `AssembledXxx.renderTemplate()` methods
- [ ] Delete `ClauseRule`, `isClause`, `detectClause`
- [ ] Sweep 27 `'clause'` case sites
- [ ] Add `__tests__/templates-emitter.test.ts` with explicit tests for each walker hotspot fix's intent
- [ ] Remove the in-process diff gate from PR1 (only the new emitter runs)
- [ ] **Gate**: snapshot zero drift + counts no regression

## PR3 — Wrapper rule type deletion (push-down completion)

### Goal

Delete `OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule` from the Rule union entirely. The information they carried already lives on the inner rule as attributes (from PR0 enrichment, which has been live since PR0 merged). This PR is the cleanup that removes the now-redundant wrapper structures.

### IR changes

```ts
// compiler/rule.ts — Rule union shrinks
export type Rule =
  | SymbolRule
  | StringRule
  | EnumRule
  | TerminalRule
  | PatternRule
  | AliasRule
  | TokenRule
  | SeqRule
  | ChoiceRule
  | PolymorphRule
  | VariantRule
  | GroupRule
  // DELETED: OptionalRule, FieldRule, RepeatRule, Repeat1Rule
  ;
```

Every remaining rule type extends `RuleBase` with the PR0 attribute set. Type guards (`isOptional`, `isField`, `isRepeat`, `isRepeat1`) are deleted; semantic checks become attribute reads:
- `isOptional(r)` → `r.multiplicity === 'optional'`
- `isField(r)` → `r.fieldName !== undefined`
- `isRepeat(r)` → `r.multiplicity === 'array'`
- `isRepeat1(r)` → `r.multiplicity === 'nonEmptyArray'`

### Link normalization pass

A new normalization pass (or extension to PR0's enrichment passes) collapses any remaining wrapper structures into pure attribute form:

```ts
// compiler/link.ts — runs after PR0 enrichment, in PR3
function normalizeAttributesOnly(rule: Rule): Rule {
  // Recursively walk; replace optional/field/repeat/repeat1 wrappers with their inner rules
  // (which already carry the modifier attributes from PR0 enrichment).
  switch (rule.type) {
    case 'optional':
      return normalizeAttributesOnly(rule.content); // content already has multiplicity: 'optional'
    case 'field':
      return normalizeAttributesOnly(rule.content); // content already has fieldName + nonterminal
    case 'repeat':
      return normalizeAttributesOnly(rule.content); // content already has multiplicity: 'array'
    case 'repeat1':
      return normalizeAttributesOnly(rule.content); // content already has multiplicity: 'nonEmptyArray'
    // ... recurse into structural rules
    default:
      return rule;
  }
}
```

After normalization, no rule in the IR is a wrapper rule type. The Rule union types can be safely deleted.

### Compiler-side migration

The 317 `'clause'`/wrapper case sites identified earlier are concentrated in:
- `link.ts`: 65 (the IR machinery itself)
- `node-map.ts`: 48 (assembly logic; many in the translation pipeline already deleted in PR2)
- `evaluate.ts`: 33 (DSL evaluation)
- `simplify.ts`: 32 (canonicalization)
- `optimize.ts`: 29 (folding)
- `group-synthesis.ts`: 18 (groups: synthesis)
- Others: ~47

**Most of these SHRINK rather than migrate** because they exist BECAUSE of the wrapper types:
- `case 'field': return derive(rule.content)` → delete (rule itself has `fieldName`)
- `case 'optional': return walkInner(rule.content)` → delete (rule itself has `multiplicity: 'optional'`)
- `if (rule.type === 'field' && rule.content.type === 'symbol')` → just `if (rule.fieldName)`

Net expected outcome: compiler-side line counts SHRINK from this PR, not grow.

### Emitter migration (the 2 emitters that DO consume Rule.type)

The pattern audit confirmed only TWO emitters consume Rule.type (the rest consume AssembledNode):

**`emitters/node-model.ts` (~5 sites)** — serializes rules to `node-model.json5`. The serialized shape changes; bump the schema version. Provide a migration step in `packages/codegen/src/cli.ts` that reads the old format and writes the new on first regen.

**`emitters/suggested.ts` (many sites)** — re-prints rule trees as TypeScript override syntax. Needs a re-wrap pass:

```ts
// emitters/suggested.ts — re-wrap from attribute form to TS source
function emitRuleExpr(rule: Rule): string {
  let expr = baseExpr(rule);                // type-specific: $symbol, "string", choice(...), seq(...), etc.
  if (rule.multiplicity === 'array')         expr = `repeat(${expr})`;
  if (rule.multiplicity === 'nonEmptyArray') expr = `repeat1(${expr})`;
  if (rule.multiplicity === 'optional')      expr = `optional(${expr})`;
  if (rule.fieldName)                        expr = `field('${rule.fieldName}', ${expr})`;
  return expr;
}
```

### Tree-sitter grammar emit (`compiler/grammar.ts`)

Same re-wrap pass as `suggested.ts` but produces the tree-sitter `grammar.js` source. Outputs canonical wrapped form: `field('name', optional(repeat($.X)))`.

### Edge cases (d) + (e) + spec 020 residual landing in PR3

| Edge case / item | Memory entry | How PR3 resolves it |
|---|---|---|
| (d) Multi-separator-per-field | `multi_separator_templates`, spec 020 residual | `RepeatRule.separator` widened in PR0 to `string \| Rule[]` is now the canonical form. Multi-separator support requires render-engine filter additions; design here, implementation in PR3 if filter exists or follow-on if engine work is needed. |
| (e) List-suffix divergence (bare vs `_list`) | `template_list_suffix_divergence`, spec 020 residual | `slot.propertyName` is the single source of truth in the new emitter; the bare-vs-suffix divergence cannot occur because there's one naming axis. |
| Vocabulary alignment (e.g. `hasTrailing` → `trailing` on AssembledNonterminal) | `feedback_rule_slot_vocabulary_alignment` | Migration completed as part of PR3's broader IR cleanup. |
| Spec 020 original template-engine-convergence backlog | spec 020 was Implemented at "render pipeline optimization" scope, but the original template-engine items never landed | Absorbed in PR3. Spec 020 disposition: see below. |

### PR3 deliverables

- [ ] Delete `OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule` from Rule union
- [ ] Add `normalizeAttributesOnly` Link pass (or extend PR0 enrichment)
- [ ] Migrate compiler-side switches (sweep: 317 sites; many delete)
- [ ] Migrate `emitters/node-model.ts` (schema bump + migration step in cli.ts)
- [ ] Migrate `emitters/suggested.ts` (re-wrap pass)
- [ ] Migrate `compiler/grammar.ts` (re-wrap pass for tree-sitter)
- [ ] Unify `hasTrailing`/`hasLeading` → `trailing`/`leading` on AssembledNonterminal
- [ ] Multi-separator (d) and list-suffix (e) cases verified working; ast counts improve
- [ ] **Gate**: snapshot drift allowed paired with counts improvement + spec-doc ledger entry; counts no regression in cov/RT/RT-shallow/factory/from

## Edge case absorption ledger

Tracked across PR2 and PR3:

| # | Edge case | Memory | Landing PR | Status |
|---|---|---|---|---|
| a | Walker hotspot — 3 fixes without tests | `walker_hotspot` | PR2 | TBD |
| b | Choice-branch literal drop | `choice_with_literals_cluster` | PR2 | TBD |
| c | Template-walker adjacency | `template_walker_adjacency` | PR2 | TBD |
| d | Multi-separator-per-field | `multi_separator_templates` | PR3 | TBD |
| e | List-suffix divergence | `template_list_suffix_divergence` | PR3 | TBD |
| f | Vocabulary alignment (hasTrailing→trailing) | `feedback_rule_slot_vocabulary_alignment` | PR3 | TBD |

Each PR3 drift entry in the snapshot diff must reference one of these (d/e/f) and pair with a counts improvement.

## Spec 020 disposition

`specs/020-template-engine-converge/spec.md` is **Implemented** at its current scope ("Render Pipeline Optimization" — Level 1 borrowed views + Level 3 direct NodeData rendering, both landed). The ORIGINAL template-engine-convergence scope (multi-separator, list-suffix divergence, template engine consolidation) was displaced when spec 020 was refocused mid-flight and never landed independently.

**This spec absorbs that residual.** PR3's edge cases (d), (e), and (f) cover the spec 020 backlog. Recommended action after this spec lands:

- Add a one-line addendum to `specs/020-template-engine-converge/spec.md` noting that the displaced template-engine-convergence items were absorbed by this spec.
- No new spec 020 work is anticipated; spec 020 remains "Implemented" at its render-pipeline-optimization scope.

## Risks + rollback

| Risk | Likelihood | Mitigation |
|---|---|---|
| PR0 enrichment changes existing IR semantics by accident | Low | Wrappers stay; existing consumers don't read new attributes. Snapshot zero-drift gate catches any leak. |
| PR1 new emitter diverges from legacy on edge cases | Medium | In-process diff gate during regen catches every divergence at per-kind granularity. Snapshot is the second net. Both must hold. |
| PR2 deletion breaks something the snapshot doesn't catch | Low | PR1 has been live and matching legacy output. PR2 is purely deletion of the now-redundant legacy path. |
| PR3 wrapper deletion breaks consumers that depended on wrapper-IR structure | Medium-High | Normalize pass ensures no wrapper remnants in IR. Compiler-side switches caught by TypeScript exhaustiveness checks (the `never` assertion in the switch's default case). Each consumer migration is its own commit in PR3 for bisectability. |
| node-model.json5 schema migration fails on existing checkpoints | Low | Schema bump triggers re-emission on first regen; old format is read once for migration. |
| Multi-separator emission (PR3, edge case d) requires render-engine filter changes not yet specified | Medium | Filter design TBD during PR3 implementation; if it expands scope significantly, defer (d) to a follow-on spec and document the gap. |

**Rollback** for each PR:
- PR0: trivial revert (additive only).
- PR1: trivial revert (legacy walker still primary).
- PR2: moderate revert (must restore legacy walker + translation pipeline + AssembledXxx.renderTemplate + ClauseRule); risk is timing — if PR3 is in flight when PR2 needs reverting, PR3 work depends on PR2 deletion being stable.
- PR3: significant revert (must restore wrapper rule types + un-migrate consumers); strongly preferred to NOT revert PR3 once landed. The PR3 commits should be granular per consumer for partial revert if needed.

## Test strategy

### PR0
- Unit tests for each enrichment pass (`enrichFieldWrappers`, `enrichMultiplicityWrappers`, `decomposeOptional`, `decomposeRepeat`) verifying attribute population without observable behavior change.
- Existing test suites must continue passing (gate).

### PR1
- In-process diff assertion is the primary test (every kind, every grammar).
- Snapshot diff is the secondary net.
- Unit tests for `emitRule` and helpers (`emitSlot`, `emitOptional`, etc.) covering each rule-type case with canonical fixtures.

### PR2
- New `__tests__/templates-emitter.test.ts` with explicit cases for each walker hotspot fix's intent (edge case a).
- Choice-branch literal cases (edge case b) — fixture inputs that previously triggered the bug, asserting correct output.
- Adjacency cases for scanner-delimited kinds (edge case c) — fixture inputs from rust grammar's scanner-delimited tokens.

### PR3
- Multi-separator fixture cases (edge case d).
- List-suffix divergence regression tests (edge case e).
- Vocabulary alignment unit tests on AssembledNonterminal (edge case f).
- Compiler-side switch exhaustiveness verified by `tsc --noEmit` strict-mode build (the deleted wrapper types make any forgotten case fail compilation).

## Out of scope

- Render engine (Askama / Nunjucks) filter implementation changes — if multi-separator (d) requires new filters, that's a follow-on.
- `@sittir/core` engine boundary cleanup (per spec 020's architecture addendum, deferred to a future spec).
- Performance optimization of the new emitter (correctness-first; perf if needed in follow-on).
- New grammar features or parity fixes unrelated to template emission.
- Migration of the JS render engine's behavior to match any new template engine features (engine stays output-compatible; spec 020 LeveL 1/3 work already covered this).

## References

### In this repo
- [`docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md`](../conventions/2026-05-15-024-cleanup-rules.md) — governing cleanup rules for the 024 branch
- [`docs/superpowers/specs/2026-05-17-kind-named-slots-design.md`](./2026-05-17-kind-named-slots-design.md) — recent slot-model unification work this builds on
- [`specs/020-template-engine-converge/spec.md`](../../../specs/020-template-engine-converge/spec.md) — implemented at "render pipeline optimization" scope; this spec absorbs the displaced template-engine residual
- [`packages/codegen/src/compiler/template-walker.ts`](../../../packages/codegen/src/compiler/template-walker.ts) — to be deleted (PR2)
- [`packages/codegen/src/compiler/node-map.ts`](../../../packages/codegen/src/compiler/node-map.ts) — translation pipeline to be deleted (PR2); attributes/maps added (PR0)
- [`packages/codegen/src/emitters/templates.ts`](../../../packages/codegen/src/emitters/templates.ts) — to be rewritten (PR1)

### Memory entries (architectural principles)
- `feedback_emitter_pattern_consistency` — every emitter iterates nodeMap.nodes + dispatches on modelType + owns all string generation
- `feedback_no_lossy_distillation` — preserve rawRules; consumers walk rules directly
- `feedback_ruleid_backpointer` — emitters use nodeMap.slotByRuleId(rule.id) for AssembledNonterminal lookups
- `feedback_rule_slot_vocabulary_alignment` — same concept on rule + slot uses identical field names; `multiplicity` not `arity`
- `feedback_wrapper_slottiness` — wrappers force nonterminal-ness; under push-down this becomes explicit `nonterminal?: boolean`

### Memory entries (edge cases absorbed)
- `walker_hotspot` — 3 walker fixes without unit tests (PR2)
- `choice_with_literals_cluster` — walker drops literals from non-primary branches (PR2)
- `template_walker_adjacency` — walker adds spaces; scanner-delimited needs adjacency (PR2)
- `multi_separator_templates` — walker assumes one-separator-per-field (PR3)
- `template_list_suffix_divergence` — bare vs `_list` suffix DRY anti-pattern (PR3)
- `preserve_token_wrappers` — link.ts drops token.immediate flag (tracked separately; not absorbed but ensure PR0/PR1/PR2/PR3 don't regress)
