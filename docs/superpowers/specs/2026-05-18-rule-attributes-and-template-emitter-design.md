# Rule Attribute Enrichment + Template Emitter Refactor

**Date**: 2026-05-18 (revised 2026-05-19 post-PR0)
**Status**: PR0 shipped via [PR #34](https://github.com/refactory-lang/sittir/pull/34); PR1-PR3 designed per the post-PR0 architectural revisions below
**Branch**: `024-rust-slot-surface-contract`
**Related specs**: [`2026-05-15-024-cleanup-rules.md`](../conventions/2026-05-15-024-cleanup-rules.md), [`2026-05-17-kind-named-slots-design.md`](./2026-05-17-kind-named-slots-design.md), [`specs/020-template-engine-converge/spec.md`](../../../specs/020-template-engine-converge/spec.md)

## PR0 shipped — addendum (2026-05-19)

PR0 closed via PR #34 with commits e63e9706 through 53c83058. Implementation surfaced architectural realizations that the original spec didn't anticipate; PR1-PR3 sections have been rewritten in place to reflect the post-PR0 reality. The original PR0 design body below remains for historical context (see "What PR0 does NOT touch" → that closing list is now stale; consult the per-PR sections for the current scope).

## Second revision — parallel Rule types architecture (2026-05-19)

After PR0 + early PR1 work (Tasks 2.1-2.5b) surfaced 394 byte-divergences between the new emitter and the legacy walker, a second brainstorm pivoted to a parallel-Rule-types architecture. The PR1/PR2/PR3 sections below have been REPLACED with this architecture; old PR1-PR3 design body archived in git history (commit b9039b6d's prior content).

### Architecture: three Rule shapes, one pipeline

```
link → optimize → simplify → assemble
                  ↑                    ↓
                  └─ applyWrapperDeletion (new last pass)
                                       │
optimize() returns:                    │
  rawRules       (post-normalization) ─┼─► node.rule         (RawRule — for legacy walker)
  renderRules    (post-wrapper-deletion)─► node.renderRule   (RenderRule — for new emitter)
  simplifiedRules (post-simplify on renderRules)─► node.simplifiedRule (SimplifiedRule)
```

| Type | Shape | Used by |
|---|---|---|
| **RawRule** | Current Rule (post-normalization); wrappers preserved | Legacy walker (until PR3) |
| **RenderRule** | RawRule + wrapper deletion (modifier wrappers `optional`/`field`/`repeat`/`repeat1` pushed down to leaf attributes); structural rules (seq/choice/variant/group/polymorph) preserved | New TemplateEmitter |
| **SimplifiedRule** | RenderRule + simplify (anonymous tokens stripped + canonicalized via PR0's `canonicalizeSeqOfLeaves`); universal seq-of-leaves invariant after PR2 | factories/wrap/from/render-module (after PR3) |

### Pipeline integration constraints (locked)

1. `applyWrapperDeletion` is a **new pass at the end of `optimize.ts`**, after `applyNormalizationPasses`. Produces `renderRules` snapshot.
2. `computeSimplifiedRules` function body **relocates from `optimize.ts:80-83` to `simplify.ts`** (principle: all simplification in simplify.ts). `optimize.ts` still orchestrates (calls into it).
3. `simplifyRules` **input changes from RawRule to RenderRule** — the new shape, wrappers gone.
4. `optimize()` returns multi-snapshot result: `{ rawRules, renderRules, simplifiedRules, ... }`.
5. `assemble()` attaches all three forms per AssembledNode: `.rule`, `.renderRule`, `.simplifiedRule`.
6. **`.simplifiedRule` REPLACES the existing `simplifyRule(init.rule)` per-node populator** (no rename, no `.derivationRule` shim — new shape replaces old). The unified `deriveSlots` entry point (already in place at `node-map.ts:1178`, replacing the older split between `deriveFields`/`deriveChildren`) and its internals (`deriveFieldsRaw`, separator discovery) update to walk the wrapper-less shape.

### Key architectural realizations from PR0 (preserved from first revision)

Key architectural realizations from PR0:

1. **Auto-group synthesis lives in wire, not enrich**. Wire is where authored `groups:` synthesis already runs, and where rule injection reaches tree-sitter's parse-table generation. Auto-synthesis in enrich runs AFTER tree-sitter has consumed the grammar — synthesized rules never reach the parser. Module landed at `packages/codegen/src/dsl/wire/auto-groups.ts`.

2. **Synthesis vs decomposition are separate concerns.** Synthesis (creating new hidden rules + symbol-ref replacement) belongs in wire. Decomposition (separator-lift, attribute stamping on Rule objects) belongs in link/evaluate (operates on sittir's internal Rule-object copy without leaking to tree-sitter or renderer).

3. **Auto-synthesized rules are indistinguishable from upstream inline hidden rules.** Both go through `inline:` array → tree-sitter inlines them at parse → sittir's `classifyHiddenSeqRule` classifies them as GroupRule → assemble produces AssembledGroup. Same machinery; no new infrastructure needed. The "every kind has a kindId" invariant holds.

4. **Naming convention**: `_<parent>_optional<N>` / `_<parent>_repeat<N>` (tree-sitter aux convention).

5. **`applyAutoGroups` currently disabled** in wire.ts via `void (() => { ... })` wrapper because the original PR0 enrich-time activation regressed counts. Re-enabling is part of PR1 (post template-emitter rewrite).

6. **Simplify post-condition helpers** (`canonicalizeSeqOfLeaves`, `assertUniversalShape`) exist in `compiler/simplify.ts` but not wired into production. PR2 wires `assertUniversalShape` after PR1's emitter is verified.

## Summary (revised)

Three remaining PRs:

1. **~~PR0~~** — **SHIPPED** via PR #34. IR enrichment (rule attributes, back-pointer maps), enrich passes (fieldName/multiplicity propagation), auto-groups module extracted to `dsl/wire/auto-groups.ts` (disabled), simplify post-condition helpers added (not wired).
2. **PR1** — Template emitter rewrite + re-enable `applyAutoGroups`. New `emitters/templates.ts` follows the established modelType-dispatching pattern (consumes `node.rule` + `nodeMap.slotByRuleId` back-pointer); runs in parallel with legacy walker via in-process diff gate. Edge cases (a)/(b)/(c) absorbed as side-effects of direct emit. Re-enable applyAutoGroups as final step — expectation: wire-time synthesis flows through `syntheticInline` → grammar.json `inline` → `inlineKinds` → existing inline-handling in factories/wrap/from. No new synthesizedInline-awareness infrastructure needed.
3. **PR2** — Decomposition pass (separator-lift, attribute canonicalization) in `compiler/decompose.ts` or extension of `compiler/link.ts`. Delete `template-walker.ts`, translation pipeline in `node-map.ts`, `AssembledXxx.renderTemplate()` methods. Delete `ClauseRule` + sweep `'clause'` case sites (re-derive count via `rg`). Wire `assertUniversalShape` into production.
4. **PR3** — Delete `OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule` wrapper rule types. Compiler-side switches shrink. `node-model.ts`/`suggested.ts`/`wire.ts` re-wrap for cross-process consumers. `node-model.json5` schema bump. Edge cases (d) multi-separator + (e) list-suffix + (f) vocabulary alignment land here.

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

## PR0 — IR enrichment (~~purely additive~~ — SHIPPED via PR #34)

> **Status**: shipped. Original spec body below preserved for context. The "auto-decomposition runs in enrich" framing was wrong; final landing is `applyAutoGroups` in `dsl/wire/auto-groups.ts` (disabled, re-enabled in PR1). The "(a)/(b)/(c) edge case absorption" was moved to PR1 (template emitter rewrite) since enrich doesn't touch the walker.

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

#### Decision resolved 2026-05-19: Option A (TS-side-only via enrich)

**Decision**: Auto-synthesis runs in `dsl/enrich.ts` post-evaluation. Synthesized hidden groups are TS-side artifacts; the parser is unchanged.

**Verification**:
- `packages/codegen/src/emitters/wrap.ts:72,827,834,845,877` already accepts `synthesizedKinds: ReadonlySet<string>` for virtual-group projection.
- `packages/codegen/src/emitters/from.ts:21,1034,1077,1083,1115,1194` imports and operates on `AssembledGroup` (the existing authored `groups:` synthesis path). The same projection plumbing serves auto-synthesized groups.
- Tree-sitter aux-research (memory `project_tree_sitter_aux_research`) confirms surface-concern synthesis doesn't need parser-side presence; aux rules are invisible to consumers regardless.

**Consequence for PR0 deliverables**:
- `decomposeOptional` / `decomposeRepeat` (Tasks 1.7/1.8) live in `dsl/enrich.ts`, calling `synthesizeGroup` from `compiler/group-synthesis.ts` (additional caller path; same primitive).
- Synthesized groups are added to the rules map alongside the existing `_kw_<name>` injection pattern. Tree-sitter inlines them at parse time; the CST is unchanged.
- Wrap/from process the synthesized groups via the same `synthesizedKinds` path used by authored `groups:` overrides.

Options B and C remain documented above for traceability and as fallbacks if Option A surfaces an unforeseen limitation during Task 1.7/1.8 implementation.

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

## PR1 — RenderRule + simplify-against-RenderRule + relocation + consumer migration (SHIPPED 2026-05-19)

**Status:** SHIPPED. Eight commits on `024-rust-slot-surface-contract` (PR #34), combined with PR0 closeout in the same PR.

### What shipped

- `86134994` Define `RenderRule` type alias — `Exclude<Rule, OptionalRule | FieldRule | RepeatRule | Repeat1Rule>` with a brand
- `cd0139c3` `applyWrapperDeletion` pass + `renderRules` snapshot on `OptimizedGrammar`
- `a27ac1fe` Relocate `computeSimplifiedRules` from `optimize.ts` to `simplify.ts`; input switched from RawRule to RenderRule
- `c18ea49a` Attach `.renderRule` on AssembledNode (Branch + Group); snapshot lookup in `assemble.ts` (3 of 4 per-call `simplifyRule` invocations migrated; 3 marked `// TODO PR2:` for alias bodies, polymorph form content, group inner content)
- `39b3a7e3` `deriveSlots` populator + `findRepeatFlag` made attribute-aware (read leaf RuleBase `fieldName`/`multiplicity`/`separator` when wrapper structures absent); closes the 9 test regressions introduced by `a27ac1fe`
- `769005a1` Polymorph map identity-preservation fix in `auto-groups.ts` (Copilot review)
- `72d7f55a` Skip `auto-groups` wire() integration test until PR2 re-enables `applyAutoGroups` (Copilot review)
- `fda93103` Rename internal slot helpers: `deriveFieldsRaw` → `deriveSlotsRaw`, `_deriveFieldsInternal` → `_deriveSlotsInternal`, `mergeFieldsByName` → `mergeSlotsByName`, `deriveFieldsRawFromLeafAttr` → `deriveSlotsRawFromLeafAttr` (vocabulary alignment per `feedback_rule_slot_vocabulary_alignment`)

### Final test counts (PR1 close)

- codegen vitest: **36 file-fail / 54 file-pass, 166 test-fail / 821 test-pass, 25 skipped** — at or slightly better than pre-PR1 baseline (37/53, 167/821, 24)
- Per-grammar native counts (`pnpm validate:native`): blocked by pre-existing `TemplateEmitter divergence on kind _array_expression_list (group)` error in `templates.ts`. This is the byte-equivalence diff gate from the early-PR1-rewrite-attempt that surfaced 394 divergences and motivated the parallel-types pivot. Blocker unrelated to PR1 commits; PR2 closes it.

### PR1 architectural footprint

```
link → optimize → simplify → assemble
                  ↑                    ↓
                  └─ applyWrapperDeletion (new last pass)
                                       │
optimize() returns:                    │
  rawRules       (post-normalization) ─┼─► node.rule         (RawRule — for legacy walker)
  renderRules    (post-wrapper-deletion)─► node.renderRule   (RenderRule — for future emitter)
  simplifiedRules (simplify(renderRules))─► node.simplifiedRule (SimplifiedRule shape)
```

## PR2 — Canonicalization + new TemplateEmitter + inlineRefs + per-slot separator (SHIPPED 2026-05-20)

**Status:** SHIPPED. Branch `025-pr2-canonicalize-template-emitter`. Final test counts: 30 file-fail / 61 file-pass, 127 test-fail / 886 test-pass. validate:native: rust covPass 158/184, RT-deep 101/136, RT-shallow 134/136. cargo green.

### What shipped

- `338f1313` — SimplifiedRule branded type
- `c9361b0d` — `canonicalizeSeqOfLeaves` + Rule-based `assertUniversalShapeRule` wired into `computeSimplifiedRules` (gated on `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`); `OptimizedGrammar.simplifiedRules` tightened to `Record<string, SimplifiedRule>`
- `25e97415` — alias-body kinds threaded through `applyWrapperDeletion` + `computeSimplifiedRules`, merged into `renderRules` / `simplifiedRules` snapshots
- `c7c45b82` — `unwrapGroupRuleAndSimplified` reads `renderRule.content` instead of per-call `deleteWrapper(groupRule)`
- `5a3562c5` — `buildVisibleVariantChildGroups` uses non-null snapshot lookup (no per-call fallback)
- `a37469f1` — polymorph form contents pre-computed in `optimize()` and merged into snapshots (disambiguation mirrors `buildAssembledFormGroups` exactly)
- `f83343aa` — docs cleanup for `unwrapGroupRuleAndSimplified`
- `a165ec4c` — `simplifyRules` wrapper-free invariant (deleteWrapper as final pass in `computeSimplifiedRules`)
- `71d9e0f9` — 4 wrapper case arms deleted from `deriveSlotsRaw` (field / optional / repeat / repeat1); `clause` kept until PR3 deletes ClauseRule
- `fb889165` — new modelType-dispatching `TemplateEmitter` authoritative, consumes `node.renderRule`; byte-equivalence diff gate deleted
- `df0ca1e0` — `applyAutoGroups` re-enabled in `wire.ts`; auto-groups integration test un-skipped
- `5e4b1b17` — slot-preservation gate in TemplateEmitter (replaces byte-equivalence diff gate; gated `SITTIR_SLOT_PRESERVATION=0`)
- `b914df13` — polymorph templates use `variant` not `$variant` (Askama-compatible)
- `f7ac7ed2` — render-module valid rust for Optional<Vec<X>> / Vec<X> scalar-view slot shapes
- `<final>` — `inlineGroupRefs` → `inlineRefs` rename + widen to grammar.inline; per-slot separator on `EmittedField` (read from slot.values per-value `separator` stamp); JSDoc cleanup in simplify.ts referencing decomposeOptional/decomposeRepeat (those passes were removed in PR0)

### What's deferred to PR3

- Replace `deriveSlotsRaw` recursive walker with one-shot dispatch (the architectural goal — `clause` case still alive blocks final cleanup; ClauseRule deletion is PR3 scope)
- Render-module separator: drop the node-wide `meta.separators` fallback once per-slot stamping covers all kinds
- `assertUniversalShape` wiring as production fail-fast gate (currently `SITTIR_ASSERT_UNIVERSAL_SHAPE=1` gated)
- Inlined-helper kinds in `types.ts` / `consts.ts` / `node-model.json5` / `transport.rs` — intentional surface for future factory-side construction; not "leakage"

## PR2 (original design — for reference) — Canonicalization + new TemplateEmitter + deprecate derive\* (2026-05-19 THIRD REVISION)

Goal: wire PR0's universal-shape helpers into production, build the new modelType-dispatching TemplateEmitter, **replace the recursive `deriveSlotsRaw` walker with a one-shot dispatch on canonical SimplifiedRule**, close the `validate:native` divergence blocker, and re-enable `applyAutoGroups`.

### Architectural target

After PR2, every rule body (post-simplify+canonicalize) normalizes to ONE of:
- `seq` containing a flat list of leaves (each leaf carries `fieldName` / `multiplicity` / `separator` as RuleBase attributes)
- `choice` (alternatives)
- `repeat` (single wrapped member or flat members)
- `enum` / `string` / `pattern` (leaf-terminals)

Once that invariant holds, slot derivation becomes a one-shot mapping, not a tree walk. `deriveSlotsRaw` and its switch over 11+ wrapper/structural cases collapses to a small dispatch.

### Simplify-side

1. Define `SimplifiedRule` branded type alias in `compiler/rule.ts` — `RenderRule & { readonly __simplifiedRule?: never }`
2. Wire `canonicalizeSeqOfLeaves` as first step inside `computeSimplifiedRules` in `simplify.ts` (PR0 helper, currently unwired)
3. Wire `assertUniversalShape` as post-condition of `computeSimplifiedRules` (PR0 helper, currently unwired)
4. `.simplifiedRule` shape refines: `simplify(canonicalize(RenderRule))` — universal seq-of-leaves invariant

### Slot derivation rewrite (replaces PR1's attribute-aware `deriveSlotsRaw`)

5. Replace `deriveSlotsRaw` / `_deriveSlotsInternal` / `mergeSlotsByName` with a direct dispatch on canonical SimplifiedRule shape. No recursive walking. Each modelType (branch / polymorph / group / multi) gets a small per-shape handler:
   - `seq` → `members.map(leafToSlot)` then `mergeSlotsByName`-equivalent (if still needed)
   - `choice` → polymorph-style alternative slots OR a single choice-slot whose values union the arms
   - `repeat` → single slot wrapping inner (multiplicity = `'array' | 'nonEmptyArray'`)
   - leaf terminals (`enum` / `string` / `pattern`) → no slot (this IS the value)
6. The `deriveSlots` public entry point keeps its signature; the internal helpers shrink dramatically
7. Wrapper-case branches in the rewritten function become unreachable; `assertUniversalShape` enforces they never appear

### Emitter-side

8. Build new modelType-dispatching `TemplateEmitter` in `emitters/templates.ts` consuming `node.renderRule` (per design — RenderRule has wrappers gone but structural rules preserved, sufficient for emission without further canonicalization)
9. Per-modelType dispatch following the established emitter pattern (matches `factories.ts` / `wrap.ts` / `from.ts` / `render-module.ts`)
10. **Replaces the byte-equivalence diff gate** in `templates.ts` (which currently throws on `_array_expression_list` and blocks `pnpm validate:native`) with a **slot-preservation gate** — per kind, verify each declared slot appears in the emitter's output exactly once
11. Eliminate hardcoded heuristics in emitter (`needsSpace` and similar) — emitter outputs literally what rule structure says

### Wire-side

12. Re-enable `applyAutoGroups` in `dsl/wire/wire.ts` (PR0 left it disabled via `void` wrapper)
13. Un-skip the `auto-groups` wire() integration test that PR1 skipped via `72d7f55a`

### PR2 gate

- `pnpm validate:native` runs to completion (divergence blocker cleared)
- Snapshot drift expected (new emitter writes different bytes than walker — by design)
- Slot-preservation passes across all kinds in all 3 grammars
- `assertUniversalShape` passes on every post-simplify rule
- Counts hold at baseline (rust RT 134/136, ts RT 81/111, py RT 93/115)
- Auto-groups integration test re-enabled and passing

## PR3 — Delete legacy + downstream consumer migration

Goal: delete the legacy walker, translation pipeline, ClauseRule, wrapper rule types, RawRule snapshot, AssembledXxx.renderTemplate methods. Migrate factories/wrap/from/render-module to consume SimplifiedRule.

After PR2's slot-derivation rewrite, this PR is mostly mechanical deletion — no consumers are left walking wrapper structures by the time PR3 starts.

1. Migrate `factories.ts`, `wrap.ts`, `from.ts`, `render-module.ts` to consume `.simplifiedRule` (SimplifiedRule) where they currently read `.rule` (RawRule)
2. Delete `template-walker.ts` (~1758 lines)
3. Delete translation pipeline in `node-map.ts`: `inlineJinjaClauses`, `translateToJinja`, spacing absorbers, `JinjaTranslateMeta`
4. Delete `AssembledBranch/Polymorph/Group/Multi.renderTemplate()` methods
5. Delete `ClauseRule`, `isClause`, `detectClause`; sweep `'clause'` case sites (re-derive count via `rg`)
6. Delete wrapper rule types (`OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`) — no consumers left (PR2's derive rewrite ensured this)
7. Delete RawRule snapshot from `optimize()` return; `node.rule` field deleted or repurposed
8. Delete `applyWrapperDeletion` itself once `RawRule === Rule === RenderRule` (wrapper types gone means deletion is a no-op alias)
9. `node-model.ts` / `suggested.ts` / `wire.ts` re-wrap passes for cross-process consumers needing wrapped-form output
10. Delete the 3 `// TODO PR2:` per-call `simplifyRule` fallbacks in `assemble.ts` (alias bodies, polymorph form content, group inner content) — PR2 will have either eliminated them or made them harmless
11. Edge cases (a)/(b)/(c)/(d)/(e)/(f) absorbed where they fit (most as side-effects of new pipeline)

### PR3 gate
- Snapshot drift expected (many deletions)
- Counts hold at baseline

## Edge case absorption ledger (REVISED 2026-05-19)

Tracked across PR1 and PR3 (PR0 shipped; PR2 is pure deletion/sweep):

| # | Edge case | Memory | Landing PR | Status |
|---|---|---|---|---|
| a | Walker hotspot — 3 fixes without tests | `walker_hotspot` | PR1 | TBD — side-effect of walker deletion; intent moves to new emitter tests |
| b | Choice-branch literal drop | `choice_with_literals_cluster` | PR1 | TBD — new emitter handles choices directly; no branch-walking gap |
| c | Template-walker adjacency | `template_walker_adjacency` | PR1 | TBD — spacing absorbers deleted; adjacency natural under direct emit |
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

---

## Appendix: AST-mismatch bug classes diagnosed 2026-05-19

Diagnostic research session on the typescript native deep-AST gap produced a clean categorization of the 47 read-render-parse AST mismatches at branch state `2ef214e8`. Each class maps to either an infrastructure gap this refactor closes (or should close) or to a follow-on outside this refactor's scope.

> **Note**: This appendix is diagnostic context, not commitments. It surveys gaps and maps them to the refactor's potential reach. Items marked "requires scope expansion" are NOT in the refactor's deliverables until explicitly added to the per-PR checklists in the spec body above. The Summary table below uses "may close" language to reflect this — closing any of these classes requires the corresponding scope-expansion decision to be made affirmatively.

### Class A — type_parameters `<>` (15 entries)

Affected: Ambient export function declarations, Classes with method signatures (×2), Classes with generic parameters, Arrow functions/generators with call signatures, Constructor types, Interface declarations, Generic types, Flow type parameter constraint syntax, Mapped types, Assertion functions, Conditional types, Mapped type 'as' clauses, Extends, Abstract.

**Root cause**: sittir's slot model promotes a repeated bare `SYMBOL` (e.g. `type_parameter` inside the `type_parameters` rule) into a named slot (`_type_parameter`) marked `source: "inferred"`. The grammar.json has NO `FIELD` wrapper, so tree-sitter emits children without a field tag. Under `--backend native` (the production path), the rust napi-rs reader doesn't synthesize the inferred slot — children land somewhere the wrap can't find them. `wrapTypeParameters` reads `data._type_parameter === undefined`, the template `<{{ type_parameter | join(",") }}>` renders to `<>`.

**Refactor coverage**: **partial**. PR0's rule-attribute enrichment will explicitly attach `multiplicity` and `nonterminal` attributes to the inferred slot's underlying rule, but the read step is downstream of this spec. **Class A's actionable fix lives in the rust reader emitter (`packages/codegen/src/emitters/render-module.ts`)**, which must consult the rule's `multiplicity` attribute (post-PR0) and emit slot-synthesis code for inferred slots. Track as follow-on issue post-PR3.

### Class B — expression_statement `;` (9 entries)

Same root cause as Class A — `expressions` is an inferred slot over the expression supertype, but the grammar child is unfielded. Closed by the same rust-reader work.

### Class C — object_type missing separators (6 entries)

Affected: Object types, Object types with call signatures, Index signatures, Object types with ASI, Type alias declarations, Flow exact object types.

**Root cause**: the walker's separator-detection at `template-walker.ts:elementWithSep` recognizes `seq(field('X'), SEP)` / `repeat(seq(field('X'), SEP))` patterns, but `object_type.members` has the more complex shape `optional(seq(member_choice, repeat(seq(choice(",", _semicolon), member_choice))))` where the separator is itself a CHOICE over two terminals. The walker falls back to `join("")`, the render filter strips the `,`/`;` tokens from the multi-slot value list (per `render.ts:1366` convention), and the template emits members back-to-back without separators.

**Refactor coverage**: **possible PR1 fit**, requires a **scope expansion decision**. The new emitter would consume PR0's `separator` attribute (which lands on the rule per spec §3 "Attributes"). To close Class C, PR0's enrichment must recognize multi-option choice separators — extend `extractStructuredSeparator` to handle `choice(SEP1, SEP2, ...)` and either emit the first option as the canonical separator or thread both through to the renderer.

> **DECISION ITEM**: edge case `multi_separator_templates` is currently absorbed as PR3 edge case (d). Promote to PR0/PR1 scope to close Class C in this refactor? Default: no (stays PR3). Re-evaluate at PR0 implementation kickoff.

### Class D — ambient_declaration `declare ` (2 entries)

Affected: Flow module.exports declarations, Global namespace declarations.

**Root cause**: variant-dispatched render-module emits all variant arms' fields as required. When `variant == "module"` fires, deserialization rejects the node because `_ambient_declaration_declaration` (the `"declaration"`-arm field) is missing. The TS path also has the Class A reader gap so the field never populates.

**Refactor coverage**: requires **scope expansion** — PR1 is currently scoped to `emitters/templates.ts` (.jinja emission) NOT `emitters/render-module.ts` (rust render dispatch). Closing Class D would mean either expanding PR1 to also rewrite render-module's variant-arm emission to `Option<…>` / `#[serde(default)]`, OR adding a dedicated render-module-touchup PR.

> **DECISION ITEM**: expand PR1 to include render-module variant-arms-as-Option? Default: no — render-module rewrite is its own concern. Track as successor work alongside Class A/B/E's reader-side gap.

### Class E — type_query `typeof ` (3 entries)

Same root cause as Class A. Slot is an alias-union (e.g. `subscript_expression` aliased from `_type_query_subscript_expression`), the CST tag uses the alias-target name, and the inferred slot has no readNode-side lift. Note: the alias-target → alias-source mapping in `wrap.ts:collectConcreteStorageKeys` (commit ca869f16) needs to extend to `$children`-routed siblings once the rust reader's slot-synthesis lands.

### Class F — singletons (~6 entries), split by scope

#### F.1 — In scope (likely closes as side-effect of new emitter)

- `instantiation_expression` template hardcodes a space between expression and type_arguments (TS syntax is `f<T>` no space). The new PR1 emitter preserves adjacency from rule structure rather than inserting walker-era spaces, so this likely fixes.
- `assignment_expression` rendering trailing `!` from non_null_expression LHS without space (`foo!=bar` instead of `foo! = bar`). Same root cause — walker spacing absorbers; PR1 deletion of the absorbers likely fixes.

#### F.2 — Out of scope (separate authoring / template work)

- `required_parameter` template assumes function-context shape; doesn't handle tuple-context (labeled tuple element `[a: A]`). Fix is a `variant()` split in `packages/typescript/overrides.ts` — that's authored-overrides work, not pipeline refactor.
- `rest_pattern` template references only `member_expression` / `non_null_expression` — missing identifier/type_identifier cases. Template-content fix in `packages/typescript/templates/`; PR2 sweep won't catch this (the sweep is structural, not authored-template completeness).

### Summary of remaining gap classes vs this refactor

| Class | Entries | Refactor coverage | Where it could close |
|---|---|---|---|
| A | 15 | Out of scope (rust reader) | Successor spec post-PR3; needs render-module emitter slot-synthesis |
| B | 9 | Out of scope (rust reader) | Same as A |
| C | 6 | May close — requires scope expansion (DECISION ITEM under Class C) | PR0 separator extraction extended to choice-of-terminals + new PR1 emitter consumes it |
| D | 2 | May close — requires scope expansion (DECISION ITEM under Class D) | PR1 expanded to include render-module variant-arms-as-Option |
| E | 3 | Out of scope (rust reader) | Same as A; alias-target routing in `wrap.ts:collectConcreteStorageKeys` already handles wrapper layer |
| F.1 | ~2 | Likely closes as side-effect of PR1 | New emitter preserves rule-structure adjacency; walker spacing absorbers deleted |
| F.2 | ~2 | Out of scope (authoring / template content) | Separate `overrides.ts` + template-content work |

**Implication if all scope-expansion decisions go YES**: this refactor closes Classes C + D + F.1 (~10 entries directly addressable). Classes A + B + E (27 entries) require a separate rust-reader inferred-slot-synthesis effort that consumes PR0's attribute outputs — track as a successor spec post-PR3. Classes F.2 (~2 entries) are authoring fixes not in scope of any pipeline refactor.

**Implication if scope-expansion decisions default NO**: this refactor closes only Class F.1 (~2 entries directly addressable as side-effects). The other 45 entries are tracked as successor work — distinct concerns from the IR/template-pipeline refactor.

### Reference: deprecated path

The TS-side `readNode` at `packages/common/src/readNode.ts` (the JS tree-walk fallback for non-native handles) was marked `@deprecated` in commit `2ef214e8`. Slot-lift / field-routing gaps surfaced in research that point at this path should be ignored — production runs `--backend native` exclusively. See memory `feedback_ts_readnode_deprecated`.
