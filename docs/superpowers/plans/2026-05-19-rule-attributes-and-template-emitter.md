# Rule Attribute Enrichment + Template Emitter Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status (2026-05-19, SECOND REVISION)**: PR0 SHIPPED via [PR #34](https://github.com/refactory-lang/sittir/pull/34). Early PR1 work (Tasks 2.1-2.5b) surfaced 394 byte-divergences between the new emitter and the legacy walker, prompting a pivot to a **parallel-Rule-types architecture**. Chunks 0 + 1 below are historical context — DO NOT execute them. Active plan starts at Chunk 2 (PR1 — parallel-types infrastructure).

**Goal:** Refactor codegen template emission to follow the established `nodeMap.nodes` + `modelType` emitter pattern, eliminate the legacy `template-walker.ts` + translation pipeline + ClauseRule, and normalize the rule IR via three parallel Rule shapes (RawRule / RenderRule / SimplifiedRule).

**Architecture (post-second-revision):** Three sequenced PRs around parallel Rule types so the legacy walker and the new emitter consume different IR shapes (walker keeps consuming `RawRule` unchanged; new emitter built against `RenderRule`/`SimplifiedRule`).

- **PR1** is purely additive infrastructure: define `RenderRule` (RawRule + wrapper-deletion); add `applyWrapperDeletion` as new last pass in `optimize.ts`; relocate `computeSimplifiedRules` from `optimize.ts` to `simplify.ts`; switch its input from RawRule to RenderRule; attach `.renderRule` per AssembledNode; replace per-node `simplifyRule(init.rule)` populator with snapshot lookup; migrate `deriveSlots` internals (the unified entry point already exists at `node-map.ts:1178`) + separator discovery to walk wrapper-less shape. Walker untouched, output unchanged.
- **PR2** adds `SimplifiedRule` type with universal seq-of-leaves canonicalization (wires PR0's `canonicalizeSeqOfLeaves` + `assertUniversalShape` helpers); builds the new modelType-dispatching `TemplateEmitter` consuming `RenderRule`; replaces the byte-equivalence diff gate with a **slot-preservation** gate (per kind, each declared slot appears in emitter output exactly once); re-enables `applyAutoGroups` in wire.
- **PR3** migrates `factories.ts` / `wrap.ts` / `from.ts` / `render-module.ts` to consume `.simplifiedRule`; deletes the legacy walker (~1758 lines), translation pipeline (`inlineJinjaClauses` / `translateToJinja` / spacing absorbers / `JinjaTranslateMeta` / `AssembledXxx.renderTemplate`), `ClauseRule`, wrapper rule types (`OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`), and the RawRule snapshot from `optimize()` return.

**Tech Stack:** TypeScript 6.0.2 (workspace ESM); Vitest; tree-sitter via web-tree-sitter / napi-rs; pnpm workspace.

**Spec:** [`docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md`](../specs/2026-05-18-rule-attributes-and-template-emitter-design.md) (revised 2026-05-19)

---

## Pre-flight context for the implementer

You are implementing a refactor of sittir's codegen template emission pipeline. **Read the spec first** — it captures the architectural decisions and the principles (`feedback_emitter_pattern_consistency`, `feedback_no_lossy_distillation`, `feedback_ruleid_backpointer`, `feedback_rule_slot_vocabulary_alignment`, `feedback_wrapper_slottiness`, `feedback_enrich_post_evaluation_only`) that govern the design.

Hard rules (from `docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md` and `CLAUDE.md`):
- Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `factory-map.json5`, `overrides.suggested.ts`, `rust/crates/sittir-{rust,python,typescript}/src/**`). Fix codegen and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.
- Generated manifest verification is a hard error on missing OR mismatch — do not reintroduce warn-and-continue.
- `SITTIR_INTERNAL_CODEGEN_RUN=1` env is set ONLY by `packages/codegen/src/cli.ts`; never set it elsewhere.
- Prefix `GITHUB_TOKEN=` for gh commands.
- Use `rg`, not `grep` (except when piping).
- Stage specific files by name (`git add packages/...`), not `git add -A`/`git add .`.

The regression gate is the same for every PR (with PR-specific drift rules — see spec §"Regression gate"):

```bash
# Pre-snapshot baseline
git stash
pnpm regen-all   # verify diff is empty pre-change
git stash pop

# Per-PR verification
pnpm regen-all   # cli.ts sets SITTIR_INTERNAL_CODEGEN_RUN=1 internally; do not set externally
git diff --stat packages/*/templates packages/*/src packages/*/.sittir \
                rust/crates/sittir-*/src/render \
                packages/*/factory-map.json5 packages/*/overrides.suggested.ts

# Counts (must not regress in cov/RT/RT-shallow/factory/from including ast strictness)
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

---

## Chunk 0: Pre-flight setup ~~(SHIPPED via PR #34)~~

### Task 0.1: Worktree + baseline verification

**Files:** none (environment setup)

- [ ] **Step 1: Create dedicated worktree off the current branch**

```bash
git worktree add ../sittir-rule-attrs 024-rust-slot-surface-contract
cd ../sittir-rule-attrs
pnpm install
```

- [ ] **Step 2: Verify pre-snapshot baseline is clean**

```bash
git stash
pnpm regen-all   # cli.ts sets SITTIR_INTERNAL_CODEGEN_RUN=1 internally; do not set externally
git diff --stat
```

Expected: empty diff. If non-empty, the baseline is dirty — resolve before starting the refactor (this is a hard prerequisite per the spec's "Pre-snapshot baseline" requirement).

- [ ] **Step 3: Capture baseline counts**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust    | tee /tmp/baseline-rust.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript | tee /tmp/baseline-typescript.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python  | tee /tmp/baseline-python.txt
```

Expected: all three commands succeed. Save the outputs — every subsequent PR must compare against these numbers.

- [ ] **Step 4: Read the spec front-to-back**

```bash
$EDITOR docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md
```

Focus on: the 5 architectural principles, the per-PR gate rules, the open architectural question for auto-synthesis location.

---

## Chunk 1: PR0 — IR enrichment (additive) ~~(SHIPPED via PR #34)~~

> **Status**: Shipped via PR #34. Steps below preserved for historical context. DO NOT execute. Final landing differed from this chunk's framing (e.g., auto-decomposition moved from enrich to wire as `dsl/wire/auto-groups.ts`; `applyAutoGroups` currently disabled, re-enabled in Chunk 2). Consult the spec's "PR0 shipped — addendum (2026-05-19)" for the architectural realizations that surfaced during PR0 implementation.

PR0 is purely additive. Adds rule attributes, NodeMap back-pointer maps, and enrich-phase auto-decomposition passes. Wrappers, ClauseRule, AssembledXxx.renderTemplate methods, and the translation pipeline are all UNTOUCHED. Snapshot must be zero drift; counts must not regress.

### Task 1.1: Move Multiplicity to rule.ts (or shared multiplicity.ts)

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts`
- Modify: `packages/codegen/src/compiler/node-map.ts:69` (re-export)

The `Multiplicity` enum currently lives in `node-map.ts:69`, but `rule.ts` doesn't import from `node-map.ts` (the layering is rule.ts → node-map.ts). Moving Multiplicity to rule.ts is required before RuleBase can reference it.

- [ ] **Step 1: Read the current Multiplicity definition**

Read `packages/codegen/src/compiler/node-map.ts` lines 60-69 to confirm the current shape:
```ts
export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';
```

- [ ] **Step 2: Add Multiplicity to rule.ts**

Add to `packages/codegen/src/compiler/rule.ts` (near the top, after the existing `RuleId` definition):

```ts
/**
 * Per-rule cardinality + optionality tag. Mirrors NodeOrTerminal.multiplicity
 * (see compiler/node-map.ts) — same values, same semantic. When a rule is
 * pushed-down from a wrapper, this attribute records what the wrapper meant.
 *
 * - `'optional'`      → T | undefined            (from `optional(X)`)
 * - `'single'`        → T                        (default — no wrapper)
 * - `'array'`         → readonly T[]              (from `repeat(X)`)
 * - `'nonEmptyArray'` → NonEmptyArray<T>          (from `repeat1(X)`)
 */
export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';
```

- [ ] **Step 3: Update node-map.ts to re-export from rule.ts**

In `packages/codegen/src/compiler/node-map.ts`, replace the local definition at line 69 with:

```ts
export { type Multiplicity } from './rule.ts';
```

- [ ] **Step 4: Verify type-check**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS. The re-export keeps every consumer working.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/rule.ts packages/codegen/src/compiler/node-map.ts
git commit -m "refactor(codegen): move Multiplicity to rule.ts (preserves rule.ts→node-map.ts layering)"
```

### Task 1.2: Extend RuleBase with modifier attributes

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts` (RuleBase interface)
- Test: `packages/codegen/src/compiler/__tests__/rule-attributes.test.ts`

- [ ] **Step 1: Write failing test for RuleBase attribute presence**

Create `packages/codegen/src/compiler/__tests__/rule-attributes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Rule, SymbolRule, Multiplicity } from '../rule.ts';

describe('RuleBase attribute extensions', () => {
  it('SymbolRule accepts fieldName attribute', () => {
    const r: SymbolRule = { type: 'symbol', name: 'X', fieldName: 'x' };
    expect(r.fieldName).toBe('x');
  });

  it('SymbolRule accepts multiplicity attribute', () => {
    const r: SymbolRule = { type: 'symbol', name: 'X', multiplicity: 'optional' };
    expect(r.multiplicity).toBe('optional');
  });

  it('SymbolRule accepts nonterminal attribute', () => {
    const r: SymbolRule = { type: 'symbol', name: 'X', nonterminal: true };
    expect(r.nonterminal).toBe(true);
  });

  it('SymbolRule accepts structured separator', () => {
    const r: SymbolRule = {
      type: 'symbol',
      name: 'X',
      separator: { rules: [{ type: 'string', value: ',' }], trailing: true },
    };
    expect((r.separator as { trailing?: boolean }).trailing).toBe(true);
  });

  it('Multiplicity type union has expected values', () => {
    const values: readonly Multiplicity[] = ['optional', 'single', 'array', 'nonEmptyArray'];
    expect(values).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/compiler/__tests__/rule-attributes.test.ts
```

Expected: FAIL with type errors on `fieldName`, `multiplicity`, `nonterminal`, `separator` (none exist on RuleBase yet).

- [ ] **Step 3: Extend RuleBase in rule.ts**

In `packages/codegen/src/compiler/rule.ts`, locate the `RuleBase` interface (or the per-type interfaces if RuleBase doesn't exist as a single interface yet). Add the new attributes:

```ts
/**
 * Modifier attributes that any Rule may carry. Populated by enrich passes
 * when a rule was originally wrapped by `field` / `optional` / `repeat` /
 * `repeat1`. The wrapper continues to exist until PR3; these attributes
 * are additive and let downstream consumers (the new template emitter,
 * future consumers) read modifier facts directly from the inner rule.
 *
 * Vocabulary matches NodeOrTerminal (node-map.ts:117, 144) so values that
 * flow from rules to slots use identical field names. See
 * feedback_rule_slot_vocabulary_alignment.
 */
interface RuleBase {
  readonly id?: RuleId;

  readonly fieldName?: string;
  readonly multiplicity?: Multiplicity;
  readonly nonterminal?: boolean;

  // Per spec's universal-shape decision: NO `leading`/`trailing` Rule[] at rule level.
  // Flanking literals live as adjacent seq members. Separator placement
  // (trailing/leading booleans) lives ON the separator object below.
  readonly separator?:
    | string
    | readonly Rule[]
    | {
        readonly rules: readonly Rule[];
        readonly trailing?: boolean;
        readonly leading?: boolean;
      };
}
```

If `RuleBase` doesn't already exist as a shared interface, define it and have every Rule interface extend it. If extending each Rule interface individually is more practical for the existing codebase shape, add the same field set to each. **Prefer the shared interface approach** for DRY — each existing Rule type already shares `id?: RuleId`, so a shared base is natural.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/compiler/__tests__/rule-attributes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Verify full type-check still passes**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS. Existing consumers don't read the new attributes; they remain valid by ignoring them.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/compiler/rule.ts packages/codegen/src/compiler/__tests__/rule-attributes.test.ts
git commit -m "feat(codegen): extend RuleBase with modifier attributes (fieldName/multiplicity/separator/nonterminal)

Vocabulary matches NodeOrTerminal per feedback_rule_slot_vocabulary_alignment.
Additive only — existing consumers unchanged."
```

### Task 1.3: Add NodeMap back-pointer maps

**Files:**
- Modify: `packages/codegen/src/compiler/types.ts` (NodeMap interface)
- Modify: `packages/codegen/src/compiler/node-map.ts` (populate at assembly)
- Test: `packages/codegen/src/compiler/__tests__/node-map-backpointers.test.ts`

- [ ] **Step 1: Write failing test for back-pointer presence**

Create `packages/codegen/src/compiler/__tests__/node-map-backpointers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildNodeMap } from '../node-map.ts';
import { evaluate } from '../evaluate.ts';
// Plus whatever the project's existing test-grammar harness uses

describe('NodeMap back-pointer maps', () => {
  it('exposes nodeByRuleId map', () => {
    const grammar = /* minimal test grammar with one branch */;
    const nm = buildNodeMap(grammar);
    expect(nm.nodeByRuleId).toBeInstanceOf(Map);
    expect(nm.nodeByRuleId.size).toBeGreaterThan(0);
  });

  it('exposes slotByRuleId map', () => {
    const grammar = /* minimal test grammar with one slot */;
    const nm = buildNodeMap(grammar);
    expect(nm.slotByRuleId).toBeInstanceOf(Map);
  });

  it('slotByRuleId resolves a field rule.id to its AssembledNonterminal', () => {
    const grammar = /* grammar with field('foo', $.Bar) */;
    const nm = buildNodeMap(grammar);
    const fieldRule = /* lookup the field rule that has id */;
    const slot = nm.slotByRuleId.get(fieldRule.id!);
    expect(slot?.name).toBe('foo');
  });
});
```

Note: locate the canonical fixture pattern by running `rg -l "buildNodeMap\|createNodeMap\|fromGrammar" packages/codegen/src/__tests__/` and reading the most-cited helper. Confirm the actual NodeMap-construction entry point (it may not be `buildNodeMap` — could be a factory in `compiler/types.ts` or a test-harness wrapper). Use the smallest grammar fixture that exercises a Branch + a Slot.

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/compiler/__tests__/node-map-backpointers.test.ts
```

Expected: FAIL — `nodeByRuleId` and `slotByRuleId` don't exist on NodeMap yet.

- [ ] **Step 3: Extend NodeMap interface in types.ts**

In `packages/codegen/src/compiler/types.ts`, add to the NodeMap interface:

```ts
/**
 * Rule-id → AssembledNode back-pointer. Populated at assembly when the
 * root rule for each kind is registered. Lets consumers walking a rule
 * tree look up the owning AssembledNode without owner traversal.
 * See feedback_ruleid_backpointer.
 */
readonly nodeByRuleId: ReadonlyMap<RuleId, AssembledNode>;

/**
 * Rule-id → AssembledNonterminal back-pointer. Populated at assembly
 * when each slot's source rule (FieldRule or symbol with field-promotion)
 * is registered. Lets consumers walking a rule tree look up the slot's
 * propertyName / storageName / paramName directly.
 * See feedback_ruleid_backpointer.
 */
readonly slotByRuleId: ReadonlyMap<RuleId, AssembledNonterminal>;
```

- [ ] **Step 4: Surface source rule id on AssembledNonterminal (load-bearing for the back-pointer)**

Before populating `slotByRuleId`, the slot must expose the rule id of the rule that produced it. Read `packages/codegen/src/compiler/node-map.ts:1678` (AssembledNonterminal interface) and confirm whether a source rule id is already accessible (via `values[].sourceRuleId`, or directly on the slot, or recoverable via existing code). Three possibilities:

- **Already on `values[]`**: derive from the first node-ref/terminal entry's source rule id; no IR change needed.
- **Already on `AssembledNonterminal` under a different name**: rename or alias; no schema addition.
- **Not present anywhere**: add `readonly sourceRuleId?: RuleId` to `AssembledNonterminal`, populated by `deriveSlots`/`derive*Slots*` when the slot is constructed from its source rule.

Write a failing assertion for whichever case applies (the test from Step 1 already exercises this — extend it if needed). Implement the chosen path. This is a separate commit before Step 5 wires up the map:

```bash
git commit -m "feat(codegen): surface source rule id on AssembledNonterminal for slot back-pointer"
```

- [ ] **Step 5: Populate back-pointer maps at assembly**

In `packages/codegen/src/compiler/node-map.ts`, within `buildNodeMap` (or the function that constructs the final NodeMap return value):

```ts
const nodeByRuleId = new Map<RuleId, AssembledNode>();
const slotByRuleId = new Map<RuleId, AssembledNonterminal>();

for (const [kind, node] of nodes) {
  // Register the root rule of every kind
  const rootRule = node.rule;   // existing field on AssembledNode
  if (rootRule?.id) nodeByRuleId.set(rootRule.id, node);

  // Register each slot's source rule (path chosen in Step 4)
  const slots = slotsOf(node);
  for (const slot of slots) {
    const sourceRuleId = slot.sourceRuleId;   // populated per Step 4's chosen path
    if (sourceRuleId) slotByRuleId.set(sourceRuleId, slot);
  }
}

return { /* existing fields */, nodeByRuleId, slotByRuleId };
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/compiler/__tests__/node-map-backpointers.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify nothing else broke**

```bash
pnpm -F @sittir/codegen exec vitest run
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: all existing tests still PASS. Type-check PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/types.ts packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/compiler/__tests__/node-map-backpointers.test.ts
git commit -m "feat(codegen): add nodeByRuleId / slotByRuleId back-pointer maps to NodeMap

Populated at assembly. Enables emitters to look up AssembledNode /
AssembledNonterminal from a rule.id without owner traversal.
See feedback_ruleid_backpointer."
```

### Task 1.4: Implement enrichFieldWrappers pass

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts`
- Test: `packages/codegen/src/dsl/__tests__/enrich-field-wrappers.test.ts`

- [ ] **Step 1: Write failing test for field-wrapper enrichment**

Create `packages/codegen/src/dsl/__tests__/enrich-field-wrappers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('enrichFieldWrappers', () => {
  it('propagates fieldName + nonterminal onto the inner rule', () => {
    const grammar = {
      grammar: {
        name: 'test',
        rules: {
          root: { type: 'field', name: 'x', content: { type: 'symbol', name: 'X' } },
        },
      },
    };
    const enriched = enrich(grammar);
    const root = enriched.grammar.rules.root as { content: { fieldName?: string; nonterminal?: boolean } };
    expect(root.content.fieldName).toBe('x');
    expect(root.content.nonterminal).toBe(true);
  });

  it('does not modify rules not wrapped by field', () => {
    const grammar = {
      grammar: {
        name: 'test',
        rules: { root: { type: 'symbol', name: 'X' } },
      },
    };
    const enriched = enrich(grammar);
    const root = enriched.grammar.rules.root as { fieldName?: string; nonterminal?: boolean };
    expect(root.fieldName).toBeUndefined();
    expect(root.nonterminal).toBeUndefined();
  });

  it('propagates onto string literal (force-promotion: field forces nonterminal even for terminals)', () => {
    const grammar = {
      grammar: {
        name: 'test',
        rules: {
          root: { type: 'field', name: 'semicolon', content: { type: 'string', value: ';' } },
        },
      },
    };
    const enriched = enrich(grammar);
    const root = enriched.grammar.rules.root as { content: { fieldName?: string; nonterminal?: boolean } };
    expect(root.content.fieldName).toBe('semicolon');
    expect(root.content.nonterminal).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/enrich-field-wrappers.test.ts
```

Expected: FAIL — enrich currently doesn't propagate these attributes.

- [ ] **Step 3: Add enrichFieldWrappers to enrich.ts**

In `packages/codegen/src/dsl/enrich.ts`, add a new pass (alongside the existing passes in `applyEnrichPasses`):

```ts
function enrichFieldWrappers(rule: Rule): Rule {
  // For every FieldRule, propagate fieldName + nonterminal onto its content.
  // Matches today's rule-catalog.ts:234 force-promotion semantics:
  // field-wrapped content is forced to nonterminal classification.
  if (rule.type === 'field') {
    return {
      ...rule,
      content: {
        ...rule.content,
        fieldName: rule.name,
        nonterminal: true,
      },
    };
  }
  return rule;
}
```

Then wire it into `applyEnrichPasses`'s fixed-point loop:

```ts
function applyEnrichPasses(ruleName, rule, kwRules, supertypeNames) {
  let r = rule;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = existingPasses(r, ...);
    r = enrichFieldWrappers(r);   // NEW
    // ...
    if (r === before) break;
  }
  return r;
}
```

The pass needs to recurse into the rule tree to find FieldRules at any depth. If `applyEnrichPasses` already does tree walking, the pass plugs in. If not, add tree-walking:

```ts
function enrichFieldWrappers(rule: Rule): Rule {
  // Recurse first, then transform at this level.
  const recursedRule = recurseChildren(rule, enrichFieldWrappers);
  if (recursedRule.type === 'field') {
    return {
      ...recursedRule,
      content: {
        ...recursedRule.content,
        fieldName: recursedRule.name,
        nonterminal: true,
      },
    };
  }
  return recursedRule;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/enrich-field-wrappers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full enrich suite to confirm no regression**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/
```

Expected: all existing enrich tests still PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/enrich.ts \
        packages/codegen/src/dsl/__tests__/enrich-field-wrappers.test.ts
git commit -m "feat(codegen): add enrichFieldWrappers pass — propagate fieldName + nonterminal to content"
```

### Task 1.5: Implement enrichMultiplicityWrappers pass

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts`
- Test: `packages/codegen/src/dsl/__tests__/enrich-multiplicity-wrappers.test.ts`

- [ ] **Step 1: Write failing tests for optional/repeat/repeat1 enrichment**

Create `packages/codegen/src/dsl/__tests__/enrich-multiplicity-wrappers.test.ts` with three test cases — one per wrapper type:

```ts
import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('enrichMultiplicityWrappers', () => {
  it('optional propagates multiplicity=optional + nonterminal onto content', () => {
    const grammar = {
      grammar: { name: 'test', rules: {
        root: { type: 'optional', content: { type: 'symbol', name: 'X' } },
      }},
    };
    const e = enrich(grammar);
    const root = e.grammar.rules.root as { content: { multiplicity?: string; nonterminal?: boolean } };
    expect(root.content.multiplicity).toBe('optional');
    expect(root.content.nonterminal).toBe(true);
  });

  it('repeat propagates multiplicity=array + nonterminal', () => {
    const grammar = {
      grammar: { name: 'test', rules: {
        root: { type: 'repeat', content: { type: 'symbol', name: 'X' } },
      }},
    };
    const e = enrich(grammar);
    const root = e.grammar.rules.root as { content: { multiplicity?: string; nonterminal?: boolean } };
    expect(root.content.multiplicity).toBe('array');
    expect(root.content.nonterminal).toBe(true);
  });

  it('repeat1 propagates multiplicity=nonEmptyArray + nonterminal', () => {
    const grammar = {
      grammar: { name: 'test', rules: {
        root: { type: 'repeat1', content: { type: 'symbol', name: 'X' } },
      }},
    };
    const e = enrich(grammar);
    const root = e.grammar.rules.root as { content: { multiplicity?: string; nonterminal?: boolean } };
    expect(root.content.multiplicity).toBe('nonEmptyArray');
    expect(root.content.nonterminal).toBe(true);
  });

  it('composes with enrichFieldWrappers: optional(field(...)) propagates both', () => {
    const grammar = {
      grammar: { name: 'test', rules: {
        root: { type: 'optional', content: {
          type: 'field', name: 'x', content: { type: 'symbol', name: 'X' },
        }},
      }},
    };
    const e = enrich(grammar);
    const inner = (e.grammar.rules.root as any).content.content;
    expect(inner.fieldName).toBe('x');
    expect(inner.multiplicity).toBe('optional');
    expect(inner.nonterminal).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/enrich-multiplicity-wrappers.test.ts
```

Expected: FAIL (multiplicity not yet propagated).

- [ ] **Step 3: Add enrichMultiplicityWrappers to enrich.ts**

```ts
function enrichMultiplicityWrappers(rule: Rule): Rule {
  const recursedRule = recurseChildren(rule, enrichMultiplicityWrappers);
  switch (recursedRule.type) {
    case 'optional':
      return { ...recursedRule, content: {
        ...recursedRule.content, multiplicity: 'optional', nonterminal: true,
      }};
    case 'repeat':
      return { ...recursedRule, content: {
        ...recursedRule.content, multiplicity: 'array', nonterminal: true,
      }};
    case 'repeat1':
      return { ...recursedRule, content: {
        ...recursedRule.content, multiplicity: 'nonEmptyArray', nonterminal: true,
      }};
    default:
      return recursedRule;
  }
}
```

Wire into `applyEnrichPasses`. Pick ONE explicit ordering (recommended: `enrichFieldWrappers` first, then `enrichMultiplicityWrappers`) and document it in the function's lead comment. Add a dedicated ordering-invariance test:

```ts
it('field+multiplicity ordering is idempotent across both orderings', () => {
  // Apply each ordering manually to optional(field('x', $.A)) and assert identical output
  const r = /* construct */;
  const a = enrichMultiplicityWrappers(enrichFieldWrappers(r));
  const b = enrichFieldWrappers(enrichMultiplicityWrappers(r));
  expect(a).toEqual(b);
});
```

If the test fails, the ordering matters and pinning one ordering in `applyEnrichPasses` is load-bearing rather than convenience — document why.

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/enrich-multiplicity-wrappers.test.ts
```

Expected: PASS, including the composition test.

- [ ] **Step 5: Full enrich suite**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/
```

Expected: existing tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/enrich.ts \
        packages/codegen/src/dsl/__tests__/enrich-multiplicity-wrappers.test.ts
git commit -m "feat(codegen): add enrichMultiplicityWrappers — propagate optional/array/nonEmptyArray + nonterminal"
```

### Task 1.6: DECISION REQUIRED — auto-synthesis location for decomposition

**Files:** _none (decision step)_

The spec records three options (A/B/C) for where auto-synthesis of multi-slot optional/repeat content lives. Before implementing decomposeOptional/decomposeRepeat with group synthesis, resolve which architecture to use:

- [ ] **Step 1: Verify whether wrap/from currently support "virtual group projection" (Option A's load-bearing assumption)**

Read `packages/codegen/src/emitters/wrap.ts` and `packages/codegen/src/emitters/from.ts`. Look for how AssembledGroup slots are populated from parser CST data. Question: when a synthesized group slot exists (e.g., from an authored `groups:` override), does wrap/from project the parent's flat CST children into the virtual group, or does the parser tree already have a node for the synthesized group?

If the parser already has the synthesized rule (via wire pre-tree-sitter), wrap/from get a real CST node for the group → Option A is NOT what the existing system does → Options B or C are the path.

If wrap/from already do virtual projection from flat CST → Option A is viable.

- [ ] **Step 2: Decide and document**

Edit the spec doc (`docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md`) section "Decision deferred to PR0 implementation". Record the chosen option (A, B, or C) and the verification that supports it.

- [ ] **Step 3: Commit the decision**

```bash
git add docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md
git commit -m "docs(spec): resolve auto-synthesis architecture decision (Option <X>)"
```

The next two tasks (decomposeOptional, decomposeRepeat) depend on this decision.

### Task 1.7: Implement decomposeOptional + group-synth wiring

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (if Options A or B)
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (if Options B or C)
- Modify: `packages/codegen/src/compiler/group-synthesis.ts` (extend caller surface)
- Test: `packages/codegen/src/dsl/__tests__/decompose-optional.test.ts`

The implementation shape depends on Task 1.6's decision. The test set is the same; the implementation location differs.

- [ ] **Step 1: Write failing tests for decomposeOptional**

Create `packages/codegen/src/dsl/__tests__/decompose-optional.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('decomposeOptional (universal-shape canonicalization)', () => {
  it('leaf content: enrich attribute push-down only, no group synthesis', () => {
    // optional($.X) → SymbolRule { name: 'X', multiplicity: 'optional', nonterminal: true }
    // (No new rules synthesized; the optional wrapper still exists wrapping the enriched leaf)
    const grammar = { grammar: { name: 'test', rules: {
      root: { type: 'optional', content: { type: 'symbol', name: 'X' } },
    }}};
    const e = enrich(grammar);
    const rules = e.grammar.rules;
    expect(Object.keys(rules)).toEqual(['root']);   // no _opt_grp_* synthesized
    const root = rules.root as { type: string; content: any };
    expect(root.content.multiplicity).toBe('optional');
  });

  it('single-slot seq with flanks: synthesizes a group containing the seq', () => {
    // optional(seq(string('->'), field('x', $.A))) → optional($._opt_grp_<hash>)
    // _opt_grp_<hash> = seq(string('->'), FieldRule{...})
    const grammar = { grammar: { name: 'test', rules: {
      root: { type: 'optional', content: { type: 'seq', members: [
        { type: 'string', value: '->' },
        { type: 'field', name: 'x', content: { type: 'symbol', name: 'A' } },
      ]}},
    }}};
    const e = enrich(grammar);
    const rules = e.grammar.rules;
    const synthKinds = Object.keys(rules).filter(k => k.startsWith('_opt_grp_'));
    expect(synthKinds.length).toBe(1);
    const synth = rules[synthKinds[0]!] as { type: string; members: unknown[] };
    expect(synth.type).toBe('seq');
    expect(synth.members.length).toBe(2);
  });

  it('multi-slot seq: synthesizes a group (closes clause_multifield_gap)', () => {
    // optional(seq(field('a', $.X), field('b', $.Y))) → optional($._opt_grp_<hash>)
    const grammar = { grammar: { name: 'test', rules: {
      root: { type: 'optional', content: { type: 'seq', members: [
        { type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
        { type: 'field', name: 'b', content: { type: 'symbol', name: 'Y' } },
      ]}},
    }}};
    const e = enrich(grammar);
    const synthKinds = Object.keys(e.grammar.rules).filter(k => k.startsWith('_opt_grp_'));
    expect(synthKinds.length).toBe(1);
  });

  it('pure-literal seq: no synthesis (no slots)', () => {
    // optional(seq(string('('), string(')')))  → no group synthesis
    const grammar = { grammar: { name: 'test', rules: {
      root: { type: 'optional', content: { type: 'seq', members: [
        { type: 'string', value: '(' },
        { type: 'string', value: ')' },
      ]}},
    }}};
    const e = enrich(grammar);
    const synthKinds = Object.keys(e.grammar.rules).filter(k => k.startsWith('_opt_grp_'));
    expect(synthKinds).toEqual([]);
  });

  it('synthesized group name is deterministic across runs (hash-stable)', () => {
    const grammar = { grammar: { name: 'test', rules: {
      root: { type: 'optional', content: { type: 'seq', members: [
        { type: 'field', name: 'a', content: { type: 'symbol', name: 'X' } },
      ]}},
    }}};
    const e1 = enrich(grammar);
    const e2 = enrich(JSON.parse(JSON.stringify(grammar)));
    const s1 = Object.keys(e1.grammar.rules).find(k => k.startsWith('_opt_grp_'))!;
    const s2 = Object.keys(e2.grammar.rules).find(k => k.startsWith('_opt_grp_'))!;
    expect(s1).toBe(s2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: all four tests FAIL (decomposeOptional not implemented).

- [ ] **Step 3: Implement decomposeOptional per the chosen architecture (Task 1.6)**

If **Option A or B**: implement `decomposeOptional` as an enrich pass in `dsl/enrich.ts`. It calls into `applyGroupOverrides` / `synthesizeGroup` from `compiler/group-synthesis.ts` for the synthesis case. Use the universal-shape rules from the spec:

```ts
function decomposeOptional(rule: Rule, synth: GroupSynth, kwRules: Record<string, Rule>): Rule {
  const recursedRule = recurseChildren(rule, r => decomposeOptional(r, synth, kwRules));
  if (recursedRule.type !== 'optional') return recursedRule;
  const content = recursedRule.content;
  if (content.type !== 'seq' && content.type !== 'choice') return recursedRule;
  if (!hasSlotBearingMember(content)) return recursedRule;
  const groupName = synth.synthesizeGroup(content, kwRules);
  return { ...recursedRule, content: { type: 'symbol', name: groupName, source: 'group-lift' } };
}
```

`synth.synthesizeGroup` computes a hash-stable name (e.g. `_opt_grp_<hex>`), registers `content` under that name in `kwRules` (or the equivalent rule-injection bag), and returns the name.

If **Option C** (wire-only): implement in `dsl/wire/wire.ts` instead. The detection runs against the callback shape; the synthesis rewrites the callback to use a synthesized symbol.

`hasSlotBearingMember` helper:
```ts
function hasSlotBearingMember(rule: Rule): boolean {
  if (rule.type !== 'seq' && rule.type !== 'choice') return false;
  return rule.members.some(m =>
    m.type === 'field' || m.type === 'symbol' ||
    m.type === 'optional' || m.type === 'repeat' || m.type === 'repeat1' ||
    (m.type === 'seq' || m.type === 'choice') && hasSlotBearingMember(m)
  );
}
```

- [ ] **Step 4: Verify tests pass**

```bash
pnpm -F @sittir/codegen exec vitest run packages/codegen/src/dsl/__tests__/decompose-optional.test.ts
```

Expected: all four tests PASS.

- [ ] **Step 5: Full suite + type-check**

```bash
pnpm -F @sittir/codegen exec vitest run
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/enrich.ts \
        packages/codegen/src/compiler/group-synthesis.ts \
        packages/codegen/src/dsl/__tests__/decompose-optional.test.ts
git commit -m "feat(codegen): decomposeOptional — universal-shape canonicalization with group synthesis

Multi-slot and single-slot-with-flanks optional content synthesizes a hidden
group. Leaf content gets attribute push-down only. Closes clause_multifield_gap."
```

### Task 1.8: Implement decomposeRepeat + group-synth wiring

**Files:**
- Modify: same files as Task 1.7
- Test: `packages/codegen/src/dsl/__tests__/decompose-repeat.test.ts`

Same shape as Task 1.7 but for repeat / repeat1. Key difference: single-slot-with-separator case lifts the separator strings rather than synthesizing a group.

- [ ] **Step 1: Write failing tests**

```ts
describe('decomposeRepeat (universal-shape canonicalization)', () => {
  it('leaf content: no synthesis, multiplicity already on the leaf via enrich', () => { /* ... */ });
  it('single-slot + separator literals: lifts separator to Rule[]', () => { /* ... */ });
  it('multi-slot: synthesizes a group; separator stays on the repeat', () => { /* ... */ });
});
```

- [ ] **Step 2: Run tests (verify FAIL)**

- [ ] **Step 3: Implement decomposeRepeat per the universal-shape pseudo-code in the spec (lines covering decomposeRepeat in the Universal canonical shape section)**

- [ ] **Step 4: Verify tests pass**

- [ ] **Step 5: Full suite + type-check**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(codegen): decomposeRepeat — separator-lift for single-slot, group synthesis for multi-slot"
```

### Task 1.9: Extend simplify with universal-shape canonicalization + post-condition

**Files:**
- Modify: `packages/codegen/src/compiler/simplify.ts`
- Test: `packages/codegen/src/compiler/__tests__/simplify-universal-shape.test.ts`

Per spec §"Simplify's role" — simplify becomes responsible for verifying every AssembledBranch/AssembledGroup body is a seq of leaves (no nested structural rules with slot content). This is the post-condition the PR1 emitter relies on.

- [ ] **Step 1: Write failing tests for the universal-shape post-condition**

Cases to test:
- Top-level branch with already-flat seq → unchanged
- Branch containing a nested optional/repeat that's already been group-synthesized by enrich → unchanged (post-condition holds)
- Branch with degenerate single-member seq → flattened
- Verification helper that throws on a violating shape (nested optional with slot content not yet group-synthesized)

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement the canonicalization pass + post-condition check in simplify.ts**

```ts
function canonicalizeSeqOfLeaves(rule: Rule): Rule { /* ... */ }

function assertUniversalShape(node: AssembledNode): void {
  // For branch/group: rule body must be SeqRule with members that are leaves.
  // Throw with kind name + offending sub-rule if violated.
}
```

- [ ] **Step 4: Wire `assertUniversalShape` into assembly's post-pass (or simplify's exit)**

- [ ] **Step 5: Verify tests pass**

- [ ] **Step 6: Full regen + snapshot diff zero + commit**

```bash
git commit -m "feat(codegen): simplify canonicalizes to universal seq-of-leaves shape

Adds post-condition check that every AssembledBranch/AssembledGroup body
is a SeqRule of leaves (literals + slot-refs). Enforces the invariant
that PR1's new template emitter relies on. See spec §'Simplify's role'."
```

### Task 1.10: PR0 final verification + commit

**Files:** none (verification step)

- [ ] **Step 1: Full regen + snapshot diff**

```bash
pnpm regen-all   # cli.ts sets SITTIR_INTERNAL_CODEGEN_RUN=1 internally; do not set externally
git diff --stat packages/*/templates packages/*/src packages/*/.sittir \
                rust/crates/sittir-*/src/render \
                packages/*/factory-map.json5 packages/*/overrides.suggested.ts
```

Expected: **EMPTY DIFF**. PR0 is purely additive — no observable output change.

If non-empty: investigate. Likely cause is an enrichment pass leaking attribute changes into Rule object identity that's serialized somewhere. Fix and re-run.

- [ ] **Step 2: Counts verification**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust    | diff - /tmp/baseline-rust.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript | diff - /tmp/baseline-typescript.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python  | diff - /tmp/baseline-python.txt
```

Expected: **EMPTY DIFFS**. Same counts as baseline.

- [ ] **Step 3: Push and open PR0**

```bash
git push -u origin HEAD
GITHUB_TOKEN= gh pr create --title "PR0: IR enrichment (rule attributes + back-pointer maps)" --body "$(cat <<'EOF'
Implements PR0 of the rule-attributes-and-template-emitter refactor.

Adds modifier attributes (fieldName, multiplicity, separator, nonterminal) to RuleBase,
populated by new enrich-phase passes (enrichFieldWrappers, enrichMultiplicityWrappers,
decomposeOptional, decomposeRepeat with universal-shape group synthesis).

Adds nodeByRuleId / slotByRuleId back-pointer maps to NodeMap, populated at assembly.

Additive only — no observable output change. Snapshot diff empty; counts unchanged.

Spec: docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR0 must merge cleanly and the diff/counts gate must hold before PR1 starts.

---

## Chunk 2: PR1 — RenderRule + simplify-against-RenderRule + relocation + consumer migration ~~(SHIPPED 2026-05-19)~~

> **Status:** ✅ SHIPPED via 8 commits on `024-rust-slot-surface-contract` (PR #34 — combined with PR0 closeout). Task-level breakdown below preserved for reference; DO NOT re-execute.
>
> **Shipped commits:**
> - `86134994` Define `RenderRule` type (Task 2.A1)
> - `cd0139c3` `applyWrapperDeletion` pass + `renderRules` snapshot (Task 2.A2)
> - `a27ac1fe` Relocate `computeSimplifiedRules` to simplify.ts; input → RenderRule (Task 2.A3)
> - `c18ea49a` Attach `.renderRule` + snapshot lookup in assemble (Task 2.A4)
> - `39b3a7e3` `deriveSlots` + `findRepeatFlag` attribute-aware (Task 2.A5 — closed 9 regressions)
> - `769005a1` auto-groups polymorph map fix (Copilot review)
> - `72d7f55a` skip auto-groups wire() integration until PR2 re-enables (Copilot review)
> - `fda93103` rename `deriveFieldsRaw`/`_deriveFieldsInternal`/`mergeFieldsByName` → slot vocabulary (Task 2.A6)
>
> **Final test counts:** 36 file-fail / 54 file-pass, 166 test-fail / 821 test-pass, 25 skipped (at or slightly better than pre-PR1 baseline).
>
> **Validation numbers (with SITTIR_DIVERGENCE_LOG=1 + SITTIR_AUDIT_DERIVE=1 — both blockers neutralized, PR2 clears them properly):**
> - Rust: cov 178/184, RT-deep 102/136 ast=92, RT-shallow 134/136 ast=126
> - TypeScript: cov 177/182, RT-deep 48/111 ast=36, factory-RP 506/706 ast=425
> - Python: cov 106/108, RT-deep 82/115 ast=69, factory-RP 310/897 ast=233
>
> **Active path: Chunk 3 (PR2).** The historic Chunk 2 task-level breakdown is preserved for reference only.

### Overview (historical — for reference only)

After early PR1 work (Tasks 2.1-2.5b) surfaced 394 byte-divergences between the new emitter and the legacy walker, this plan pivots to a parallel-Rule-types architecture. PR1 is now purely **additive infrastructure** — no changes to the walker or emit path; output unchanged.

**Goal:** introduce the parallel `RenderRule` type, push wrappers down to leaf attributes, relocate `computeSimplifiedRules` to `simplify.ts`, and migrate `deriveSlots` internals + separator discovery to walk the wrapper-less RenderRule shape.

**Architecture:**

```
link → optimize → simplify → assemble
                  ↑                    ↓
                  └─ applyWrapperDeletion (new last pass)
                                       │
optimize() returns:                    │
  rawRules       (post-normalization) ─┼─► node.rule         (RawRule — for legacy walker)
  renderRules    (post-wrapper-deletion)─► node.renderRule   (RenderRule — for future emitter)
  simplifiedRules (simplify(renderRules))─► node.simplifiedRule (SimplifiedRule)
```

### Pre-flight context for PR1

Implementer: read these BEFORE starting:
- Spec: `docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md` — especially "Second revision — parallel Rule types architecture (2026-05-19)" and the PR1 section
- `packages/codegen/src/compiler/optimize.ts` — current `optimize()` shape and `computeSimplifiedRules` location (lines 80-83 per spec)
- `packages/codegen/src/compiler/simplify.ts` — current `simplifyRule` / `simplifyRules` exports; relocation target for `computeSimplifiedRules`
- `packages/codegen/src/compiler/rule.ts` — Rule union; PR1 adds `RenderRule` type
- `packages/codegen/src/compiler/node-map.ts:1178` — unified `deriveSlots` entry point (consolidation already shipped; PR1 updates internals)
- `packages/codegen/src/compiler/node-map.ts:2844` — per-node `simplifyRule(init.rule)` populator (PR1 replaces with snapshot lookup)
- Pre-existing uncommitted files: `packages/validator/validation-history.jsonl`, `rust/crates/sittir-typescript/test-fixtures.json` — DO NOT touch

### Task 2.A1: Define RenderRule type

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts`

- [ ] **Step 1: Read the existing Rule union to understand the shape**

```bash
$EDITOR packages/codegen/src/compiler/rule.ts
```

Locate `OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule` — these are the wrapper rule types that RenderRule excludes.

- [ ] **Step 2: Add RenderRule type alias**

`RenderRule` is the structural subset of `Rule` with the modifier wrappers removed. Express it as a branded type alias:

```ts
/**
 * A Rule shape produced by `applyWrapperDeletion` in optimize.ts. Modifier
 * wrappers (`optional`/`field`/`repeat`/`repeat1`) have been pushed down to
 * leaf attributes (`fieldName`/`multiplicity`); structural rules (`seq`/`choice`/
 * `variant`/`group`/`polymorph`) are preserved.
 *
 * Structurally a `Rule` minus the wrapper variants — typed as a brand so
 * mismatches between RawRule and RenderRule consumption surface at compile time.
 */
export type RenderRule = Exclude<Rule, OptionalRule | FieldRule | RepeatRule | Repeat1Rule> & {
  readonly __renderRule?: never;
};
```

- [ ] **Step 3: Type-check**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS (modulo pre-existing baseline).

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/compiler/rule.ts
git commit -m "feat(codegen): add RenderRule type alias (Rule minus wrapper variants)"
```

### Task 2.A2: Implement applyWrapperDeletion pass

**Files:**
- Create: `packages/codegen/src/compiler/wrapper-deletion.ts` (NEW)
- Modify: `packages/codegen/src/compiler/optimize.ts`
- Test: `packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts` (NEW)

- [ ] **Step 1: Write failing tests for the four wrapper-deletion cases**

Each test covers one wrapper case. Use the existing Rule constructors from `compiler/rule.ts` (`mkOptional`, `mkField`, `mkRepeat`, `mkRepeat1` or equivalent).

```ts
import { describe, it, expect } from 'vitest';
import { applyWrapperDeletion } from '../wrapper-deletion.ts';
import { mkSymbol, mkOptional, mkField, mkRepeat, mkRepeat1, mkSeq } from '../rule.ts';

describe('applyWrapperDeletion', () => {
  it('lifts optional → multiplicity:"optional" on inner leaf', () => {
    const inner = mkSymbol('expression');
    const wrapped = mkOptional(inner);
    const [out] = applyWrapperDeletion([wrapped]);
    expect(out.type).toBe('symbol');
    expect((out as any).multiplicity).toBe('optional');
  });

  it('lifts field → fieldName on inner leaf', () => {
    const inner = mkSymbol('expression');
    const wrapped = mkField('value', inner);
    const [out] = applyWrapperDeletion([wrapped]);
    expect(out.type).toBe('symbol');
    expect((out as any).fieldName).toBe('value');
  });

  it('lifts repeat → multiplicity:"array"', () => {
    const inner = mkSymbol('expression');
    const wrapped = mkRepeat(inner);
    const [out] = applyWrapperDeletion([wrapped]);
    expect(out.type).toBe('symbol');
    expect((out as any).multiplicity).toBe('array');
  });

  it('lifts repeat1 → multiplicity:"nonEmptyArray"', () => {
    const inner = mkSymbol('expression');
    const wrapped = mkRepeat1(inner);
    const [out] = applyWrapperDeletion([wrapped]);
    expect(out.type).toBe('symbol');
    expect((out as any).multiplicity).toBe('nonEmptyArray');
  });

  it('preserves structural rules (seq) and recurses', () => {
    const inner = mkSeq([mkOptional(mkSymbol('a')), mkSymbol('b')]);
    const [out] = applyWrapperDeletion([inner]);
    expect(out.type).toBe('seq');
    expect((out as any).members[0].type).toBe('symbol');
    expect((out as any).members[0].multiplicity).toBe('optional');
  });

  it('is idempotent', () => {
    const inner = mkSeq([mkOptional(mkField('value', mkSymbol('a')))]);
    const once = applyWrapperDeletion([inner]);
    const twice = applyWrapperDeletion(once);
    expect(twice).toEqual(once);
  });

  it('combines stacked wrappers (field of optional → multiplicity AND fieldName)', () => {
    const inner = mkField('value', mkOptional(mkSymbol('a')));
    const [out] = applyWrapperDeletion([inner]);
    expect(out.type).toBe('symbol');
    expect((out as any).fieldName).toBe('value');
    expect((out as any).multiplicity).toBe('optional');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm -F @sittir/codegen exec vitest run wrapper-deletion -t ""
```

Expected: FAIL with "module not found" for `../wrapper-deletion.ts`.

- [ ] **Step 3: Implement applyWrapperDeletion**

Create `packages/codegen/src/compiler/wrapper-deletion.ts`:

```ts
import type { Rule, RenderRule, OptionalRule, FieldRule, RepeatRule, Repeat1Rule } from './rule.ts';

const isWrapper = (r: Rule): r is OptionalRule | FieldRule | RepeatRule | Repeat1Rule =>
  r.type === 'optional' || r.type === 'field' || r.type === 'repeat' || r.type === 'repeat1';

function deleteWrapper(rule: Rule): RenderRule {
  // Collect stacked wrapper attributes outside-in
  let cursor: Rule = rule;
  let fieldName: string | undefined;
  let multiplicity: 'optional' | 'array' | 'nonEmptyArray' | 'single' = 'single';

  while (isWrapper(cursor)) {
    if (cursor.type === 'field') {
      fieldName = cursor.name;
      cursor = cursor.content;
    } else if (cursor.type === 'optional') {
      multiplicity = 'optional';
      cursor = cursor.content;
    } else if (cursor.type === 'repeat') {
      multiplicity = 'array';
      cursor = cursor.content;
    } else if (cursor.type === 'repeat1') {
      multiplicity = 'nonEmptyArray';
      cursor = cursor.content;
    }
  }

  // Recurse into structural rules
  const recursed = recurseStructural(cursor);

  // Stamp attributes onto the unwrapped leaf
  return { ...recursed, ...(fieldName ? { fieldName } : {}), multiplicity } as RenderRule;
}

function recurseStructural(rule: Rule): RenderRule {
  switch (rule.type) {
    case 'seq':
    case 'choice':
    case 'variant':
    case 'group':
    case 'polymorph':
      return { ...rule, members: rule.members.map(deleteWrapper) } as RenderRule;
    default:
      return rule as RenderRule;
  }
}

export function applyWrapperDeletion(rules: readonly Rule[]): RenderRule[] {
  return rules.map(deleteWrapper);
}
```

Note: exact attribute shapes (`fieldName`, `multiplicity`) are PR0-defined; if existing PR0 stamping uses different names, prefer the PR0 names and update tests.

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm -F @sittir/codegen exec vitest run wrapper-deletion
```

Expected: PASS — all 7 tests green.

- [ ] **Step 5: Wire applyWrapperDeletion into optimize.ts as the new last pass**

Modify `packages/codegen/src/compiler/optimize.ts`. Current shape (approximately):

```ts
function computeSimplifiedRules(rules, word) {
  const wordMatcher = compileWordMatcher(word, rules);
  return simplifyRules(rules, wordMatcher);
}

export function optimize(linked: LinkedGrammar): OptimizedGrammar {
  const rules = applyNormalizationPasses(linked.rules, linked.patternReplacementKinds);
  const simplifiedRules = computeSimplifiedRules(rules, linked.word);
  return { name: linked.name, rules, simplifiedRules, /* ... */ };
}
```

New shape (after this task — `computeSimplifiedRules` body relocates in Task 2.A3; here we just add the new pass + return field):

```ts
import { applyWrapperDeletion } from './wrapper-deletion.ts';

export function optimize(linked: LinkedGrammar): OptimizedGrammar {
  const rawRules = applyNormalizationPasses(linked.rules, linked.patternReplacementKinds);
  const renderRules = applyWrapperDeletion(rawRules);
  const simplifiedRules = computeSimplifiedRules(rawRules, linked.word); // TEMP — switches to renderRules in Task 2.A3
  return { name: linked.name, rules: rawRules, renderRules, simplifiedRules, /* ... */ };
}
```

Also update `OptimizedGrammar` interface to include `renderRules: readonly RenderRule[]`.

- [ ] **Step 6: Type-check**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/wrapper-deletion.ts \
        packages/codegen/src/compiler/__tests__/wrapper-deletion.test.ts \
        packages/codegen/src/compiler/optimize.ts
git commit -m "feat(codegen): add applyWrapperDeletion pass + renderRules snapshot in optimize"
```

### Task 2.A3: Relocate computeSimplifiedRules to simplify.ts; switch input to RenderRule

**Files:**
- Modify: `packages/codegen/src/compiler/optimize.ts` (remove function body; keep call)
- Modify: `packages/codegen/src/compiler/simplify.ts` (receive `computeSimplifiedRules`; switch input to RenderRule)

- [ ] **Step 1: Move computeSimplifiedRules body from optimize.ts to simplify.ts**

In `simplify.ts`, add as a new public export:

```ts
import type { RenderRule } from './rule.ts';

export function computeSimplifiedRules(renderRules: readonly RenderRule[], word: string | undefined): SimplifiedRule[] {
  const wordMatcher = compileWordMatcher(word, renderRules);
  return simplifyRules(renderRules, wordMatcher);
}
```

Note: `simplifyRules` and `compileWordMatcher` may need to widen their parameter types to accept `RenderRule`. Since `RenderRule` is structurally a subset of `Rule`, the change is type-only — no behavior change.

- [ ] **Step 2: Update optimize.ts to import + delegate**

```ts
import { computeSimplifiedRules } from './simplify.ts';

export function optimize(linked: LinkedGrammar): OptimizedGrammar {
  const rawRules = applyNormalizationPasses(linked.rules, linked.patternReplacementKinds);
  const renderRules = applyWrapperDeletion(rawRules);
  const simplifiedRules = computeSimplifiedRules(renderRules, linked.word); // NOW takes renderRules
  return { name: linked.name, rules: rawRules, renderRules, simplifiedRules, /* ... */ };
}
```

Remove the local `computeSimplifiedRules` function definition.

- [ ] **Step 3: Type-check**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS. Resolve any type errors in `simplifyRules` / `compileWordMatcher` by widening their parameter types to `RenderRule`.

- [ ] **Step 4: Run all compiler tests**

```bash
pnpm -F @sittir/codegen exec vitest run compiler/
```

Expected: PASS — relocation is mechanical; tests should hold.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/optimize.ts packages/codegen/src/compiler/simplify.ts
git commit -m "refactor(codegen): relocate computeSimplifiedRules to simplify.ts; input is RenderRule"
```

### Task 2.A4: Attach .renderRule on AssembledNode + replace per-node simplifyRule populator with snapshot lookup

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (line ~2844 — current `simplifyRule(init.rule)` populator)
- Modify: `packages/codegen/src/compiler/assemble.ts` (or wherever `AssembledNode` is constructed)
- Modify: `packages/codegen/src/compiler/node-map.ts` (the AssembledNode-base interface — add `readonly renderRule: RenderRule`)

- [ ] **Step 1: Add .renderRule to AssembledNode base**

Locate the AssembledNode base interface in `node-map.ts`. Add:

```ts
readonly renderRule: RenderRule;
```

next to the existing `readonly rule: Rule` and `readonly simplifiedRule: Rule` fields.

- [ ] **Step 2: Replace per-node simplifyRule(init.rule) populator**

Find `node-map.ts:2844` (or current location via `rg`):

```bash
rg -n "simplifyRule\\(init\\.rule\\)" packages/codegen/src/compiler/node-map.ts
```

Replace the per-node call with a snapshot lookup. Assemble needs `optimize()`'s `simplifiedRules` array indexed by kind/rule-id. If a kind→rule map already exists, use it; otherwise build one.

Pattern (adapt to actual node-map.ts structure):

```ts
// In assemble's nonterminal-construction site:
const renderRule = renderRulesByKind.get(kind) ?? throw new Error(`renderRule missing for ${kind}`);
const simplifiedRule = simplifiedRulesByKind.get(kind) ?? throw new Error(`simplifiedRule missing for ${kind}`);
// ... rest of construction
return { rule: rawRule, renderRule, simplifiedRule, /* ... */ };
```

- [ ] **Step 3: Type-check**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Counts gate (no drift expected — emit path untouched)**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

Expected: counts hold at baseline (rust RT 134/136, ts RT 81/111, py RT 93/115). Walker untouched; .simplifiedRule shape change does not affect emitter or factory output IF Task 2.A5 consumer migration preserves semantics. If counts drop, the drop is in Task 2.A5's consumer migration — investigate there.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts packages/codegen/src/compiler/assemble.ts
git commit -m "feat(codegen): attach .renderRule on AssembledNode; .simplifiedRule from snapshot"
```

### Task 2.A5: Migrate deriveSlots internals + separator discovery to wrapper-less shape

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` — `deriveFieldsRaw` (the internal walker reached from `deriveSlots`) + separator discovery sites

- [ ] **Step 1: Locate all wrapper-case branches in deriveFieldsRaw**

```bash
rg -n "case 'optional'|case 'field'|case 'repeat'|case 'repeat1'" packages/codegen/src/compiler/node-map.ts
```

- [ ] **Step 2: Verify deriveSlots input is now .simplifiedRule (RenderRule-derived, wrapper-less)**

```bash
rg -n "deriveSlots\\(" packages/codegen/src/compiler/node-map.ts
```

Each call site should pass `node.simplifiedRule` (now the RenderRule-derived shape after Task 2.A4). If any call site still passes `node.rule` (RawRule), update it — these are the migration points.

- [ ] **Step 3: Tighten or remove wrapper-case branches in deriveFieldsRaw**

For each wrapper case found in Step 1: the branch is now unreachable IF the caller passes `.simplifiedRule`. Options:

- **Tighten:** convert the branch to `throw new Error('unreachable: wrapper-case in wrapper-less RenderRule')` — surfaces violations of the new invariant during development
- **Remove:** delete the branch and let the switch fall through to the structural-rule cases (relies on TS exhaustiveness checking with `Rule` narrowed to `RenderRule`)

Recommend **tighten** during the migration window so any caller still passing RawRule surfaces loudly; **remove** in PR3 once RawRule is deleted.

- [ ] **Step 4: Same treatment for separator discovery**

```bash
rg -n "separator|trailing|leading" packages/codegen/src/compiler/node-map.ts | head -30
```

Locate separator-discovery code that walks past `optional`/`repeat` wrappers. Replace wrapper-walking with leaf-attribute reads (`multiplicity`, `separator` per PR0 stamping).

- [ ] **Step 5: Counts gate**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

Expected: counts hold at baseline. This task is the highest-risk part of PR1 — wrapper-walking → leaf-attribute-reading is a semantic change in derivation. If counts drop, diff `pnpm regen-all` output to see which factory/wrap surface changed.

- [ ] **Step 6: Snapshot regen (zero drift)**

```bash
pnpm regen-all
git diff --stat packages/*/src packages/*/factory-map.json5 packages/*/overrides.suggested.ts
```

Expected: empty diff. PR1 is purely infrastructure; output unchanged.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts
git commit -m "refactor(codegen): migrate deriveSlots internals + separator discovery to RenderRule shape"
```

### Task 2.A6: Final verification + open PR

- [ ] **Step 1: Full regen + counts**

```bash
pnpm regen-all
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

Expected: zero diff, counts at baseline.

- [ ] **Step 2: All tests**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Open PR**

```bash
GITHUB_TOKEN= gh pr create --title "feat(codegen): PR1 — parallel Rule types infrastructure" --body "$(cat <<'EOF'
## Summary

Introduce parallel Rule types per the second revision of the spec:
- `RawRule` (current Rule, post-normalization) — for legacy walker
- `RenderRule` (RawRule + wrapper deletion) — for future emitter
- `SimplifiedRule` (RenderRule + simplify) — for downstream

PR1 is purely additive infrastructure. Walker untouched. Output unchanged.

## Changes
- `applyWrapperDeletion` new last pass in `optimize.ts`
- `computeSimplifiedRules` relocated from `optimize.ts` to `simplify.ts`; input changed from RawRule to RenderRule
- `optimize()` now returns `{ rawRules, renderRules, simplifiedRules, ... }`
- `assemble()` attaches `.renderRule` per AssembledNode; `.simplifiedRule` now sourced from snapshot
- `deriveSlots` internals + separator discovery migrated to walk wrapper-less RenderRule shape

## Gate
- Snapshot zero drift ✓
- Counts hold at baseline ✓

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### PR1 Review Loop

After PR opens, dispatch reviewer subagents per the subagent-driven-development skill. Address feedback in additional commits on the same branch. Once approved, merge.

---

## Chunk 3: PR2 — Canonicalization + new TemplateEmitter + deprecate `derive*` (2026-05-19 THIRD REVISION)

### Overview

**Goal:** wire PR0's universal-shape helpers into production, build the new modelType-dispatching TemplateEmitter, **replace the recursive `deriveSlotsRaw` walker with a one-shot dispatch on canonical SimplifiedRule** (architectural insight from user, 2026-05-19), close the `validate:native` divergence + non-canonical-derive blockers, and re-enable `applyAutoGroups`.

### Architectural target

After PR2, every rule body (post-simplify+canonicalize) normalizes to ONE of: `seq` (flat list of leaves with `fieldName`/`multiplicity`/`separator` on RuleBase) | `choice` (alternatives) | `repeat` | `enum`/`string`/`pattern` (leaf-terminals). Once that invariant holds, slot derivation is a one-shot mapping — `deriveSlotsRaw`'s 11+ wrapper/structural cases collapse to a small dispatch.

### Two blockers PR2 must clear

Currently `pnpm validate:native` fails with both:
1. `TemplateEmitter divergence on kind _array_expression_list (group)` — the byte-equivalence diff gate in `templates.ts:184-202`. PR2's slot-preservation gate replaces it.
2. `derive: non-canonical shape 'seq-member-choice-needs-variant-or-merge'` from `deriveSlotsRaw` — wrapper-less rules reach derivation in non-canonical shape because `canonicalizeSeqOfLeaves` isn't wired. PR2 wires it.

(Temporary workaround for measurement: `SITTIR_DIVERGENCE_LOG=1 SITTIR_AUDIT_DERIVE=1` — but those are bypasses, not fixes.)

### Pre-flight context for PR2

- Spec: PR2 section in `docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md` (third revision)
- `packages/codegen/src/compiler/simplify.ts` — PR0 added `canonicalizeSeqOfLeaves` and `assertUniversalShape` helpers; they live here unwired
- `packages/codegen/src/compiler/node-map.ts` — `deriveSlots` public entry point + `deriveSlotsRaw` / `_deriveSlotsInternal` / `mergeSlotsByName` internal helpers (PR2 replaces these with direct dispatch)
- `packages/codegen/src/emitters/factories.ts` — canonical modelType-dispatching emitter pattern
- `packages/codegen/src/emitters/templates.ts:184-202` — divergence diff gate (PR2 deletes; slot-preservation replaces)
- `packages/codegen/src/dsl/wire/auto-groups.ts` — `applyAutoGroups`, currently `void`-disabled in `wire.ts`
- `packages/codegen/src/dsl/wire/wire.ts:552-572` — the disabled invocation site
- `packages/codegen/src/dsl/__tests__/auto-groups.test.ts` — the `describe.skip('applyAutoGroups — wire() integration', ...)` block PR1 skipped (PR2 un-skips when re-enabling)

### Task order (revised — slot-derive rewrite is new)

1. **Task 3.B1** — Define `SimplifiedRule` branded type
2. **Task 3.B2** — Wire `canonicalizeSeqOfLeaves` + `assertUniversalShape` into `computeSimplifiedRules`
3. **Task 3.B-derive-rewrite (NEW)** — Replace `deriveSlotsRaw` / `_deriveSlotsInternal` / `mergeSlotsByName` with direct dispatch on canonical SimplifiedRule. Closes the non-canonical-derive blocker. Per-modelType handlers; no recursion.
4. **Task 3.B3** — Build new `TemplateEmitter` consuming `node.renderRule`
5. **Task 3.B4** — Slot-preservation gate replaces byte-equivalence diff gate (closes the divergence blocker)
6. **Task 3.B5** — Re-enable `applyAutoGroups` in `wire.ts`; un-skip the integration test from PR1 commit `72d7f55a`
7. **Task 3.B6** — Final verification: `pnpm validate:native` runs to completion, counts hold at pre-PR1 baseline, open PR

The Task 3.B-derive-rewrite is the largest single deliverable in PR2 and the architectural payoff: `derive*` machinery deprecates entirely; the spec's universal-shape invariant becomes load-bearing.

### Task 3.B1: Define SimplifiedRule type

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts`

- [ ] **Step 1: Add SimplifiedRule branded type alias**

```ts
/**
 * The shape produced by `computeSimplifiedRules` after `canonicalizeSeqOfLeaves`
 * runs. Structurally a RenderRule, but additionally satisfies the universal
 * seq-of-leaves invariant: every branch/polymorph/group/multi body is a seq of
 * leaf rules (no nested seqs, no anonymous tokens left).
 */
export type SimplifiedRule = RenderRule & { readonly __simplifiedRule?: never };
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
git add packages/codegen/src/compiler/rule.ts
git commit -m "feat(codegen): add SimplifiedRule branded type alias"
```

### Task 3.B2: Wire canonicalizeSeqOfLeaves + assertUniversalShape into computeSimplifiedRules

**Files:**
- Modify: `packages/codegen/src/compiler/simplify.ts`

- [ ] **Step 1: Add canonicalize step + post-condition assertion to computeSimplifiedRules**

```ts
import { canonicalizeSeqOfLeaves, assertUniversalShape } from './simplify-helpers.ts'; // path per PR0

export function computeSimplifiedRules(renderRules: readonly RenderRule[], word: string | undefined): SimplifiedRule[] {
  const canonicalized = renderRules.map(canonicalizeSeqOfLeaves);
  const wordMatcher = compileWordMatcher(word, canonicalized);
  const simplified = simplifyRules(canonicalized, wordMatcher);
  for (const rule of simplified) assertUniversalShape(rule);
  return simplified as SimplifiedRule[];
}
```

- [ ] **Step 2: Counts gate**

If `assertUniversalShape` throws on any production rule, that's a legitimate canonicalization gap — investigate. If it passes, proceed.

```bash
pnpm regen-all  # verify drift expectation
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

Expected: counts hold. Snapshot drift may appear in `.simplifiedRule`-consuming surfaces (factories/wrap may see shape changes). If drift is non-trivial, investigate before continuing.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/compiler/simplify.ts
git commit -m "feat(codegen): wire canonicalizeSeqOfLeaves + assertUniversalShape into computeSimplifiedRules"
```

### Task 3.B3: Build the new TemplateEmitter consuming RenderRule

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts` (existing scaffold from Tasks 2.1-2.5b)

The scaffold from earlier work (`EmitCtx`, `emitOne`, per-modelType stubs, `emitRule`, helpers) is preserved. PR2 rewires the emitter to consume `node.renderRule` (not `node.rule`) and applies the slot-preservation principle.

- [ ] **Step 1: Switch the entry point to read node.renderRule**

In `emitters/templates.ts`, the top-level loop iterates `nodeMap.nodes`; for each node, pass `node.renderRule` (not `node.rule`) to the per-modelType helpers.

- [ ] **Step 2: Eliminate hardcoded heuristics**

Remove walker-style heuristics (`needsSpace` and similar). The emitter outputs literally what the rule structure says — leaf attributes (`fieldName`, `multiplicity`, `separator`) directly drive Jinja output. Per the user's instruction (and `feedback_no_lossy_distillation`): no inferred spacing, no implicit separators.

- [ ] **Step 3: Per-modelType implementations**

`emitBranchTemplate` / `emitPolymorphTemplate` / `emitGroupTemplate` / `emitMultiTemplate` each:
1. Iterate the node's slots (from `node.slots`) for the declared slot vocabulary
2. Walk `node.renderRule` to produce Jinja, reading leaf attributes directly
3. Return the Jinja string

Reference: the canonical `argument_list.jinja` shape for arguments:

```jinja
({% if expression | isPresent %}{{ expression | join(",") }} {% endif %}{{ list_splat | join(",") }})
```

Every declared slot appears once. Separators come from leaf-attribute `separator`. No inferred spacing.

### Task 3.B4: Implement slot-preservation gate

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`

- [ ] **Step 1: Implement assertSlotPreservation**

For each kind, after emitting the Jinja template, verify each declared slot in `node.slots` appears in the emitter output exactly once. Parse the output for `{{ <slotName> ... }}` / `{% if <slotName> ... %}` references; count occurrences; assert each declared slot has count ≥ 1 (typically === 1, but some slots may appear in both a conditional and a body reference — define the exact rule during implementation).

```ts
function assertSlotPreservation(kind: string, output: string, slots: readonly AssembledNonterminal[]): void {
  for (const slot of slots) {
    const name = slot.propertyName;
    const re = new RegExp(`\\b${escapeRegex(name)}\\b`);
    if (!re.test(output)) {
      throw new Error(`Slot '${name}' missing from emitted template for kind '${kind}': ${output}`);
    }
  }
}
```

- [ ] **Step 2: Wire into the emit loop (parallel mode — old walker still authority)**

Both legacy walker and new emitter run; slot-preservation is asserted on the new emitter's output. Snapshot drift expected (new emitter writes different bytes than walker), but the gate is slot-preservation not byte-equivalence.

- [ ] **Step 3: Run regen and triage slot-preservation failures**

```bash
pnpm regen-all
```

If `assertSlotPreservation` throws, fix the per-modelType emitter to include the missing slot. Iterate until clean.

- [ ] **Step 4: Counts gate**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

Expected: counts hold at baseline. Snapshot drift expected.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/templates.ts
git commit -m "feat(codegen): new TemplateEmitter consuming RenderRule; slot-preservation gate"
```

### Task 3.B5: Re-enable applyAutoGroups

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (around line 552-572)

- [ ] **Step 1: Remove the void wrapper around applyAutoGroups**

Locate:

```ts
void (() => {
  applyAutoGroups(context);
})();
```

Replace with:

```ts
applyAutoGroups(context);
```

- [ ] **Step 2: Counts gate (no regression expected)**

```bash
pnpm regen-all
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

Expected: counts hold. If regression, investigate the specific gap in the inline-flow chain (synthesized rules → `syntheticInline` → grammar.json `inline:` → `inlineKinds` → existing handling in factories/wrap/from). Do NOT preemptively add new inline-awareness infrastructure.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/dsl/wire/wire.ts
git commit -m "feat(codegen): re-enable applyAutoGroups in wire phase"
```

### Task 3.B6: Final verification + open PR

- [ ] **Step 1: Full regen + counts (drift expected; counts hold)**

```bash
pnpm regen-all
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

- [ ] **Step 2: Open PR**

```bash
GITHUB_TOKEN= gh pr create --title "feat(codegen): PR2 — SimplifiedRule canonicalization + new TemplateEmitter" --body "..." # adapt as needed
```

### PR2 Review Loop

Address reviewer feedback in additional commits. Once approved, merge.

---

## Chunk 4: PR3 — Delete legacy walker + RawRule + downstream consumer migration

### Overview

**Goal:** delete the legacy walker, translation pipeline, ClauseRule, wrapper rule types, RawRule snapshot, `AssembledXxx.renderTemplate` methods. Migrate factories/wrap/from/render-module to consume `SimplifiedRule`.

### Pre-flight context for PR3

- Spec: PR3 section in `docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md`
- All four consumers (factories/wrap/from/render-module) currently read `.rule` (RawRule); migration target is `.simplifiedRule` (SimplifiedRule)
- The walker (`compiler/template-walker.ts`) is ~1758 lines; deletion is the largest single line-count change in this PR

### Task 4.C1: Migrate factories.ts / wrap.ts / from.ts / render-module.ts to .simplifiedRule

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`
- Modify: `packages/codegen/src/emitters/from.ts`
- Modify: `packages/codegen/src/emitters/render-module.ts`

For each file, audit every `node.rule` read site. Either:
1. Change to `node.simplifiedRule` if the consumer needs the canonical seq-of-leaves view
2. Or change to `node.renderRule` if the consumer needs wrapper-less but pre-canonicalization

Document the choice per file in a comment block at the top of each file.

- [ ] **Step 1: Audit reads in factories.ts**

```bash
rg -n "node\\.rule|init\\.rule" packages/codegen/src/emitters/factories.ts
```

For each hit, decide `simplifiedRule` vs `renderRule` and replace.

- [ ] **Step 2: Same for wrap.ts**
- [ ] **Step 3: Same for from.ts**
- [ ] **Step 4: Same for render-module.ts**

- [ ] **Step 5: Snapshot + counts gate per file**

Migrate one file, regen, verify counts hold; commit. Repeat per file. This decouples failure attribution.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/{factories,wrap,from,render-module}.ts
git commit -m "refactor(codegen): migrate downstream emitters to .simplifiedRule"
```

### Task 4.C2: Delete template-walker.ts

**Files:**
- Delete: `packages/codegen/src/compiler/template-walker.ts` (~1758 lines)

- [ ] **Step 1: Verify no remaining imports**

```bash
rg -n "from .*template-walker|require.*template-walker" packages/codegen/src
```

Expected: empty. If any imports remain, those consumers haven't been migrated — go back to Task 4.C1.

- [ ] **Step 2: Delete the file**

```bash
git rm packages/codegen/src/compiler/template-walker.ts
```

- [ ] **Step 3: Type-check + counts**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
pnpm regen-all
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(codegen): delete legacy template-walker.ts"
```

### Task 4.C3: Delete translation pipeline + AssembledXxx.renderTemplate methods

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts`

Re-derive exact locations via `rg`:

```bash
rg -n "^function inlineJinjaClauses|^function translateToJinja|^function escapeJinjaBraceCollisions" packages/codegen/src/compiler/node-map.ts
rg -n "^function absorb" packages/codegen/src/compiler
rg -n "JinjaTranslateMeta" packages/codegen/src/compiler
rg -n "AssembledBranch.*renderTemplate|AssembledPolymorph.*renderTemplate|AssembledGroup.*renderTemplate|AssembledMulti.*renderTemplate" packages/codegen/src/compiler/node-map.ts
```

Delete each. Counts gate after each deletion.

- [ ] **Commit per deletion block** — e.g., one commit for translation pipeline, one for renderTemplate methods.

### Task 4.C4: Delete ClauseRule + sweep 'clause' case sites

```bash
rg -n "ClauseRule|isClause|detectClause" packages/codegen/src/compiler
rg -n "case 'clause'" packages/codegen/src --type ts
```

For each `'clause'` case site:
- Transparent unwrap (`return walkInner(rule.content)`) → fold into `case 'optional':`
- Simplification cases → fold into `'optional'`
- Type guards (`r.type === 'optional' || r.type === 'clause'`) → drop the `|| r.type === 'clause'` term

- [ ] **Commit:**

```bash
git commit -m "refactor(codegen): delete ClauseRule + sweep 'clause' case sites"
```

### Task 4.C5: Delete wrapper rule types

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts`

Now that the new pipeline only uses RenderRule/SimplifiedRule (wrapper-less) and RawRule's only consumer (the walker) is gone:

- [ ] **Step 1: Verify no remaining wrapper references**

```bash
rg -n "OptionalRule|FieldRule|RepeatRule|Repeat1Rule" packages/codegen/src
rg -n "case 'optional'|case 'field'|case 'repeat'|case 'repeat1'" packages/codegen/src
```

Expected: empty. If any references remain in non-wire/non-link code, migrate them.

- [ ] **Step 2: Delete the four wrapper types from the Rule union**

```ts
// Before
export type Rule = SymbolRule | StringRule | EnumRule | SeqRule | ChoiceRule | VariantRule | GroupRule | PolymorphRule
                 | OptionalRule | FieldRule | RepeatRule | Repeat1Rule;

// After (RawRule and Rule unify; RenderRule becomes an alias for Rule)
export type Rule = SymbolRule | StringRule | EnumRule | SeqRule | ChoiceRule | VariantRule | GroupRule | PolymorphRule;
export type RenderRule = Rule & { readonly __renderRule?: never };
export type SimplifiedRule = RenderRule & { readonly __simplifiedRule?: never };
```

- [ ] **Step 3: Type-check + counts**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
pnpm regen-all
```

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/compiler/rule.ts
git commit -m "refactor(codegen): delete wrapper rule types (OptionalRule/FieldRule/RepeatRule/Repeat1Rule)"
```

### Task 4.C6: Delete RawRule snapshot from optimize() return

**Files:**
- Modify: `packages/codegen/src/compiler/optimize.ts`
- Modify: `packages/codegen/src/compiler/node-map.ts` (the AssembledNode base — `.rule` field repurpose or delete)

With wrappers gone, `RawRule` and `Rule` unified, and `RenderRule` and `Rule` co-extensive (modulo branding), the `rawRules` snapshot becomes redundant.

- [ ] **Step 1: Delete rawRules from optimize() return**

```ts
export function optimize(linked: LinkedGrammar): OptimizedGrammar {
  const rules = applyNormalizationPasses(linked.rules, linked.patternReplacementKinds);
  const renderRules = applyWrapperDeletion(rules);
  const simplifiedRules = computeSimplifiedRules(renderRules, linked.word);
  return { name: linked.name, renderRules, simplifiedRules, /* ... */ };
}
```

Note: `applyWrapperDeletion` may become a no-op now that wrappers don't exist; consider deleting it entirely and aliasing `renderRules = rules`.

- [ ] **Step 2: Delete .rule field from AssembledNode (or repurpose as alias of .renderRule)**

- [ ] **Step 3: Type-check + counts**

- [ ] **Step 4: Commit**

### Task 4.C7: Edge case absorption (a-f) verification

For each edge case in the spec's "Edge case absorption ledger", verify the fix landed naturally as a side-effect of the new pipeline. Where it didn't, add a targeted test or fix.

### Task 4.C8: Final verification + open PR

```bash
pnpm regen-all
pnpm test
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python
GITHUB_TOKEN= gh pr create --title "refactor(codegen): PR3 — delete legacy walker + downstream migration" --body "..."
```

### PR3 Review Loop

Address reviewer feedback. Once approved, merge.

---

## Closeout

Once PR3 merges, the refactor is complete. The codebase has:
- One emitter pattern across all five emitters (factories/wrap/from/render-module/templates)
- No translation pipeline (direct Jinja emit only)
- No ClauseRule, no wrapper rule types
- No legacy walker
- SimplifiedRule consumed by all downstream consumers
- `applyAutoGroups` live in wire
- Slot-preservation as the emission invariant
