# Rule Attribute Enrichment + Template Emitter Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor codegen template emission to follow the established `nodeMap.nodes` + `modelType` emitter pattern, eliminate the legacy `template-walker.ts` + translation pipeline + ClauseRule, and normalize the rule IR so modifier wrappers (`optional`/`field`/`repeat`/`repeat1`) become attributes on their constituent rules.

**Architecture:** Four sequenced PRs. PR0 adds attributes to rules and back-pointer maps to NodeMap (additive only). PR1 adds a new modelType-dispatching template emitter that runs in parallel with the legacy walker (in-process diff gate enforces equivalence). PR2 deletes the legacy walker + translation pipeline + ClauseRule. PR3 deletes the wrapper rule types entirely (push-down completion) and migrates the two emitters that consume Rule.type (`node-model.ts`, `suggested.ts`).

**Tech Stack:** TypeScript 6.0.2 (workspace ESM); Vitest; tree-sitter via web-tree-sitter / napi-rs; pnpm workspace.

**Spec:** [`docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md`](../specs/2026-05-18-rule-attributes-and-template-emitter-design.md)

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

## Chunk 0: Pre-flight setup

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

## Chunk 1: PR0 — IR enrichment (additive)

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

## Chunk 2: PR1 — Parallel template emitter

PR1 adds a new `emitters/templates.ts` (rewritten) following the modelType-dispatching emitter pattern. Runs in parallel with the legacy walker. In-process diff gate asserts byte-identical output per kind during regen.

### Task 2.1: Scaffold new templates.ts file structure

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts` (significant rewrite)
- Reference: `packages/codegen/src/emitters/factories.ts` (the canonical emitter pattern)

- [ ] **Step 1: Read the canonical emitter pattern**

```bash
$EDITOR packages/codegen/src/emitters/factories.ts   # top 100 lines for shape reference
```

- [ ] **Step 2: Skeleton the new templates.ts (keep legacy path as fallback)**

Modify `packages/codegen/src/emitters/templates.ts`. Keep the existing emit logic intact but add a parallel path:

```ts
import type { AssembledNode, AssembledBranch, AssembledPolymorph, AssembledGroup, AssembledMulti } from '../compiler/node-map.ts';
import type { Rule, SymbolRule, StringRule, EnumRule, /* ... */ } from '../compiler/rule.ts';

interface EmitCtx {
  readonly nodeMap: NodeMap;
  readonly wordMatcher: RegExp;
  readonly externals: readonly string[];
  readonly rules: Record<string, Rule>;
}

function emitOne(node: AssembledNode, ctx: EmitCtx): string | undefined {
  switch (node.modelType) {
    case 'branch':    return emitBranchTemplate(node, ctx);
    case 'polymorph': return emitPolymorphTemplate(node, ctx);
    case 'group':     return emitGroupTemplate(node, ctx);
    case 'multi':     return emitMultiTemplate(node, ctx);
    case 'supertype': case 'pattern': case 'keyword':
    case 'token':     case 'enum':    return undefined;
    default: {
      const _exhaustive: never = node;
      throw new Error(`emitOne: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`);
    }
  }
}

// Stubs — to be filled in subsequent tasks
function emitBranchTemplate(_n: AssembledBranch, _ctx: EmitCtx): string { return ''; }
function emitPolymorphTemplate(_n: AssembledPolymorph, _ctx: EmitCtx): string { return ''; }
function emitGroupTemplate(_n: AssembledGroup, _ctx: EmitCtx): string { return ''; }
function emitMultiTemplate(_n: AssembledMulti, _ctx: EmitCtx): string { return ''; }
```

Don't wire `emitOne` into the existing TemplateEmitter yet. We're building it side-by-side; PR1 wires it in once it produces correct output.

- [ ] **Step 3: Type-check**

```bash
pnpm -F @sittir/codegen exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit scaffold**

```bash
git add packages/codegen/src/emitters/templates.ts
git commit -m "feat(codegen): scaffold new modelType-dispatching template emitter (stubs only)"
```

### Task 2.2: Implement internal helpers

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`
- Test: `packages/codegen/src/emitters/__tests__/templates-helpers.test.ts`

- [ ] **Step 1: Write failing tests for emitter helpers**

```ts
// templates-helpers.test.ts
describe('templates emitter helpers', () => {
  it('escapeLiteral handles `{` collision', () => {
    expect(escapeLiteral('{x}')).toBe('{ x }');
  });
  it('snakeToCamel basic', () => {
    expect(snakeToCamel('return_type')).toBe('returnType');
  });
  it('escapeJinjaString handles quotes', () => {
    expect(escapeJinjaString('a"b')).toBe('a\\"b');
  });
  it('stringifyRule joins string members', () => {
    expect(stringifyRule({ type: 'string', value: ', ' })).toBe(', ');
  });
});
```

- [ ] **Step 2: Run (verify FAIL — symbols not exported)**

- [ ] **Step 3: Implement helpers in templates.ts**

```ts
export function escapeLiteral(text: string): string {
  return text.replace(/\{/g, '{ ').replace(/\}/g, ' }').replace(/\{  \}/g, '{ }');
}

export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function escapeJinjaString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function stringifyRule(r: Rule): string {
  if (r.type === 'string') return r.value;
  // TODO: extend for other text-bearing rule types as needed
  return '';
}
```

- [ ] **Step 4: Verify tests pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(codegen): templates emitter helpers (escape, snakeToCamel, stringify)"
```

### Task 2.3: Implement emitRule (Rule.type dispatch)

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`
- Test: `packages/codegen/src/emitters/__tests__/templates-emitRule.test.ts`

- [ ] **Step 1: Write failing tests for each Rule.type case**

Cover at minimum:
- `string` → escaped literal text
- `seq` → concatenation
- `optional` → conditional wrap (using `rule.leading`/`rule.trailing` is no longer in scope per universal-shape decision; optional wraps a symbol that's already a slot — read multiplicity)
- `repeat` / `repeat1` → join filter selection
- `choice` → first branch fallback (the non-polymorph case)
- `symbol` (hidden `_x` inlining)
- `field` → emit the slot (post-enrichment, field's content already has fieldName)
- `token` / `alias` / `terminal` → recurse into content
- `enum` → choice over members
- `pattern` → empty string

- [ ] **Step 2-N: Implement emitRule per the spec's PR1 section**

Use the universal-shape model: most case bodies are short because the heavy lifting is in enrich (PR0). For example, `case 'optional'` after PR0 enrichment is the inner content rule with multiplicity: 'optional'. emitOptional just wraps with `{%- if x | isPresent %}...{%- endif %}`.

- [ ] **Step N+1: Commit per-case sub-commits, OR one big commit**

Recommended: one commit per Rule.type case for bisectability. Final state: all cases implemented.

### Task 2.4: Implement per-modelType emit functions

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`
- Test: `packages/codegen/src/emitters/__tests__/templates-modelType.test.ts`

- [ ] **Step 1: Tests for each modelType (branch, polymorph, group, multi)**

For each, exercise: empty kind, single-slot kind, multi-slot kind, kind with nested structure.

- [ ] **Step 2: Implement per the spec's PR1 section**

Each per-modelType function is thin — calls `emitRule(node.rule, ctx)` or aggregates over `node.forms` for polymorph.

- [ ] **Step 3-5: Verify + commit**

### Task 2.5: Wire the new emitter into TemplateEmitter with in-process diff gate

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`

- [ ] **Step 1: Add parallel emit + diff in TemplateEmitter.emit()**

```ts
emit(): EmittedTemplates {
  const bodies = new Map<string, string>();
  for (const [kind, node] of this.#config.nodeMap.nodes) {
    const legacyEntry = node.renderTemplate?.(this.#ctx.rules, this.#ctx.wordMatcher, this.#ctx.externals);
    const legacyBody = legacyEntry?.body;
    const newBody = emitOne(node, this.#ctx);

    // Both must agree on every kind
    if (legacyBody !== undefined && newBody !== undefined && legacyBody !== newBody) {
      throw new Error(
        `TemplateEmitter divergence on kind ${kind}:\n` +
        `  legacy: ${JSON.stringify(legacyBody)}\n` +
        `  new:    ${JSON.stringify(newBody)}`
      );
    }

    const bodyToWrite = legacyBody ?? newBody;
    if (bodyToWrite === undefined) continue;
    bodies.set(kind, GENERATED_HEADER + bodyToWrite);
  }
  return { bodies };
}
```

This makes the legacy walker the AUTHORITY during PR1 (the bodies emitted are legacyBody) while the new emitter is validated against it. PR2 flips the authority once the diff is reliably empty.

- [ ] **Step 2: Run regen to verify zero divergence**

```bash
pnpm regen-all 2>&1 | rg "divergence" | head -20
```

Expected: NO divergence output. If divergences appear, fix the new emitter case-by-case using the divergence kind name.

- [ ] **Step 3: Snapshot diff verification**

```bash
git diff --stat packages/*/templates packages/*/src packages/*/.sittir \
                rust/crates/sittir-*/src/render
```

Expected: empty (legacy was the authority).

- [ ] **Step 4: Counts verification**

Same as Task 1.9 step 2.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(codegen): wire new template emitter alongside legacy walker with in-process diff gate

New emitter runs in parallel; legacy remains the authority for emitted output.
Divergence is asserted at regen time."
```

### Task 2.6: PR1 final verification + open PR

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: all PASS.

- [ ] **Step 2: Snapshot + counts gate (as in Task 1.9)**

- [ ] **Step 3: Push + open PR**

```bash
git push -u origin HEAD
GITHUB_TOKEN= gh pr create --title "PR1: parallel template emitter (modelType dispatch)" --body "..."
```

PR1 must merge cleanly. After it lands, let it settle for ~1 day with normal regen activity before starting PR2.

---

## Chunk 3: PR2 — Legacy delete + ClauseRule sweep

PR2 deletes the legacy walker, translation pipeline, AssembledXxx.renderTemplate methods, and ClauseRule. Edge cases (a), (b), (c) test additions land here.

### Task 3.1: Flip the emitter authority to the new path

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`

- [ ] **Step 1: Make `newBody` the authority instead of `legacyBody`**

```ts
const bodyToWrite = newBody ?? legacyBody;   // flip the fallback
```

- [ ] **Step 2: Regen + snapshot diff**

```bash
pnpm regen-all   # cli.ts sets SITTIR_INTERNAL_CODEGEN_RUN=1 internally; do not set externally
git diff --stat packages/*/templates packages/*/src packages/*/.sittir rust/crates/sittir-*/src/render
```

Expected: empty diff (the in-process diff gate from PR1 guarantees this).

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(codegen): flip template emitter authority — new path is primary"
```

### Task 3.2: Remove in-process diff + legacy emit call from TemplateEmitter

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts`

- [ ] **Step 1: Remove the legacy fallback + divergence check**

```ts
emit(): EmittedTemplates {
  const bodies = new Map<string, string>();
  for (const [kind, node] of this.#config.nodeMap.nodes) {
    const body = emitOne(node, this.#ctx);
    if (body === undefined) continue;
    bodies.set(kind, GENERATED_HEADER + body);
  }
  return { bodies };
}
```

- [ ] **Step 2: Snapshot + counts gate**

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(codegen): remove legacy walker call from TemplateEmitter"
```

### Task 3.3: Delete AssembledXxx.renderTemplate methods

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (delete ~200 lines)

- [ ] **Step 1: Delete the four methods**

In `node-map.ts`, delete:
- `AssembledBranch.renderTemplate()` — locate with `rg -n "AssembledBranch.*renderTemplate\(" packages/codegen/src/compiler/node-map.ts`
- `AssembledPolymorph.renderTemplate()` — same approach
- `AssembledGroup.renderTemplate()` — same approach
- `AssembledMulti.renderTemplate()` (if present)

Also delete any helper methods exclusively used by these (e.g. the polymorph form aggregation helper if private).

- [ ] **Step 2: Type-check**

Expected: type errors at any remaining call sites. Update those.

- [ ] **Step 3: Snapshot + counts**

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(codegen): delete AssembledXxx.renderTemplate methods

String generation now owned by emitters/templates.ts per the emitter pattern.
See feedback_emitter_pattern_consistency."
```

### Task 3.4: Delete translation pipeline from node-map.ts

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (delete ~480 lines)

Locate each function with `rg -n "^function inlineJinjaClauses|^function translateToJinja|^function escapeJinjaBraceCollisions|^function.*JinjaTranslateMeta|^interface JinjaTranslateMeta" packages/codegen/src/compiler/node-map.ts` before each deletion.

- [ ] **Step 1: Delete `inlineJinjaClauses` (~120 lines per pre-refactor estimate)**
- [ ] **Step 2: Delete `translateToJinja` (~200 lines)**
- [ ] **Step 3: Delete `escapeJinjaBraceCollisions` (~40 lines)**
- [ ] **Step 4: Delete JinjaTranslateMeta interface + helper functions (~120 lines)**

After each: snapshot + counts + commit (or one commit at the end if all deletions are contiguous).

### Task 3.5: Delete template-walker.ts entirely

**Files:**
- Delete: `packages/codegen/src/compiler/template-walker.ts`

- [ ] **Step 1: Delete the file**

```bash
git rm packages/codegen/src/compiler/template-walker.ts
```

- [ ] **Step 2: Fix any remaining imports**

```bash
rg -l "template-walker" packages/codegen/src
```

Expected: no results, OR if any: update each import.

- [ ] **Step 3: Snapshot + counts + type-check**

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(codegen): delete template-walker.ts (1758 lines)

Rule-tree recursion now lives in emitters/templates.ts emitRule, dispatched
at the top level via modelType per the established emitter pattern."
```

### Task 3.6: Delete ClauseRule + sweep 27 case sites

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts` (delete ClauseRule + isClause)
- Modify: `packages/codegen/src/compiler/link.ts` (delete detectClause)
- Modify: `packages/codegen/src/compiler/optimize.ts` (7 sites)
- Modify: `packages/codegen/src/compiler/node-map.ts` (remaining sites)
- Modify: `packages/codegen/src/compiler/field-shape.ts` (1 site)

- [ ] **Step 1: Enumerate current 'clause' sites**

```bash
rg -n "case 'clause'|isClause\b|detectClause\b|ClauseRule\b" packages/codegen/src --type ts > /tmp/clause-sites.txt
cat /tmp/clause-sites.txt
```

- [ ] **Step 2: Sweep — per file**

For each site, apply one of three migrations:
- "transparent unwrap" → fold into `case 'optional':`
- "simplification" → fold into the 'optional' case
- "type guard" (`r.type === 'optional' || r.type === 'clause'`) → drop `|| r.type === 'clause'`

After each file: type-check should still pass (because we're collapsing sites, not removing types yet).

- [ ] **Step 3: Delete `detectClause` in link.ts**

- [ ] **Step 4: Delete `ClauseRule` interface + `isClause` guard in rule.ts**

- [ ] **Step 5: Type-check**

Expected: any remaining clause references fail compilation. Fix them.

- [ ] **Step 6: Snapshot + counts**

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor(codegen): delete ClauseRule + all 'clause' case sites

ClauseRule was the IR marker for optional(seq(string,field,string)) shape.
The same pattern is now expressed via decomposeOptional's group synthesis
(PR0), making ClauseRule redundant.

See project_clause_multifield_gap (now closed by group synthesis)."
```

### Task 3.7: Add edge case tests (a)(b)(c)

**Files:**
- Test: `packages/codegen/src/emitters/__tests__/templates-emitter-edge-cases.test.ts`

- [ ] **Step 1: Walker hotspot fix tests (edge case a)**

Locate the 3 walker hotspot fixes' original symptoms (search git log + the `walker_hotspot` memory entry for context). Write a test per fix:

```ts
describe('walker hotspot edge cases (formerly in walkRuleForTemplate)', () => {
  it('fix #1: <describe the original symptom>', () => { /* fixture exercising the case */ });
  it('fix #2: <symptom>', () => { /* fixture */ });
  it('fix #3: <symptom>', () => { /* fixture */ });
});
```

- [ ] **Step 2: Choice-branch literal tests (edge case b)**

Per `choice_with_literals_cluster` memory: write a fixture where a choice's non-primary branches have differentiating literals, assert the new emitter handles them correctly (does not drop them silently).

- [ ] **Step 3: Adjacency tests (edge case c)**

Per `template_walker_adjacency` memory: write a fixture from rust grammar's scanner-delimited tokens; assert no spurious whitespace appears.

- [ ] **Step 4: Run tests + commit**

```bash
git commit -m "test(codegen): walker hotspot, choice-branch literal, and adjacency edge cases

Addresses PR2 edge case absorption (a)(b)(c). Each test references the
memory entry that originated the bug discovery."
```

### Task 3.8: PR2 final verification + open PR

- [ ] **Step 1: Full snapshot + counts gate**
- [ ] **Step 2: Push + open PR**

```bash
git push -u origin HEAD
GITHUB_TOKEN= gh pr create --title "PR2: delete legacy walker + translation pipeline + ClauseRule" --body "..."
```

---

## Chunk 4: PR3 — Wrapper rule type deletion (push-down completion)

PR3 deletes `OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule` from the Rule union. Compiler-side switches shrink (many delete entirely). `node-model.ts` schema bumps; `suggested.ts` and `dsl/wire/wire.ts` (or `compiler/grammar.ts`) gain re-wrap logic. Edge cases (d), (e), (f) land here.

### Task 4.1: Audit compiler-side switch sites + categorize

**Files:** none (audit step)

- [ ] **Step 1: Enumerate wrapper-type switch sites with `rg`**

(Spec estimated ~317 sites at design time; re-derive the current count rather than treating the headline as authoritative.)

```bash
rg -n "case 'optional'|case 'field'|case 'repeat'|case 'repeat1'" packages/codegen/src/compiler --type ts > /tmp/wrapper-sites.txt
wc -l /tmp/wrapper-sites.txt
```

- [ ] **Step 2: Categorize per site**

For each site, categorize as:
- **Delete** — the case existed solely because of the wrapper type; the rule itself now has the attribute and the case is unreachable
- **Migrate** — the case has logic that needs to read the attribute from the rule directly (`if (rule.fieldName)` instead of `case 'field':`)
- **Preserve** — rare; the case handles the wrapper structure for a reason that survives push-down

Capture the categorization in a comment block in this plan or a sidecar markdown.

### Task 4.2: Add Link normalization pass

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` (add normalize pass)
- Test: `packages/codegen/src/compiler/__tests__/normalize-attributes.test.ts`

- [ ] **Step 1: Write failing test**

```ts
describe('normalizeAttributesOnly', () => {
  it('collapses optional(symbol+attrs) to symbol', () => { /* ... */ });
  it('collapses field(symbol+fieldName) to symbol', () => { /* ... */ });
  it('preserves attributes on the inner rule', () => { /* ... */ });
  it('is idempotent', () => { /* ... */ });
});
```

- [ ] **Step 2: Implement normalizeAttributesOnly per the spec's PR3 section**

```ts
function normalizeAttributesOnly(rule: Rule): Rule {
  switch (rule.type) {
    case 'optional': return normalizeAttributesOnly(rule.content);
    case 'field':    return normalizeAttributesOnly(rule.content);
    case 'repeat':   return normalizeAttributesOnly(rule.content);
    case 'repeat1':  return normalizeAttributesOnly(rule.content);
    // Recurse into structural rules:
    case 'seq':      return { ...rule, members: rule.members.map(normalizeAttributesOnly) };
    case 'choice':   return { ...rule, members: rule.members.map(normalizeAttributesOnly) };
    // ... other structural cases
    default:         return rule;
  }
}
```

- [ ] **Step 3-5: Verify + commit**

### Task 4.3: Sweep compiler-side switches per audit categorization

**Files:** every file in `packages/codegen/src/compiler/` with wrapper-type switches

- [ ] **Step 1-N: Per file, apply categorized migrations**

Recommended: one commit per file for bisectability. Files in roughly increasing complexity:
- `field-shape.ts` (5 sites)
- `link-refine.ts` (5 sites)
- `rule.ts` (10 sites — utility helpers)
- `common.ts` (3 sites)
- `group-synthesis.ts` (18 sites)
- `rule-catalog.ts` (15 sites)
- `simplify.ts` (32 sites)
- `optimize.ts` (29 sites)
- `evaluate.ts` (33 sites)
- `node-map.ts` (48 sites)
- `link.ts` (65 sites)

After each file: type-check + tests must pass.

### Task 4.4: Delete wrapper rule types

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts`

- [ ] **Step 1: Delete OptionalRule, FieldRule, RepeatRule, Repeat1Rule from the Rule union**

- [ ] **Step 2: Type-check**

Expected: every remaining wrapper-type switch case fails compilation. The categorization from Task 4.1 should have caught all of these, but any stragglers surface here.

- [ ] **Step 3: Snapshot + counts**

- [ ] **Step 4: Commit**

### Task 4.5: Migrate emitters/node-model.ts

**Files:**
- Modify: `packages/codegen/src/emitters/node-model.ts`
- Modify: `packages/codegen/src/cli.ts` (add schema migration step)
- Test: `packages/codegen/src/emitters/__tests__/node-model-migration.test.ts`

- [ ] **Step 1: Bump schema version in node-model.ts**

Add `version: 2` (or whatever's next) to the emitted JSON5 root. Add a schema-aware reader that can consume v1 (old) format and emit v2 (new).

- [ ] **Step 2: Migration step in cli.ts**

On first regen, if `node-model.json5` is v1, read it as v1, write as v2.

- [ ] **Step 3: Test the migration**

Pre-existing v1 `node-model.json5` in the repo (committed) is the migration input. Snapshot diff will show v1→v2 in the regen output — that's expected drift, paired with the schema bump explanation in this PR's commit message.

- [ ] **Step 4: Commit the v2 `node-model.json5` files as part of this PR's changeset**

Run regen once, capture the v1→v2 conversion, stage and commit the converted files alongside the code change:

```bash
pnpm regen-all
git add packages/{rust,python,typescript}/node-model.json5
git commit -m "chore(codegen): regenerate node-model.json5 to v2 schema (one-time migration)"
```

- [ ] **Step 5: Verify subsequent regens produce empty diffs**

```bash
pnpm regen-all
git diff --stat packages/*/node-model.json5
```

Expected: empty. If non-empty after this PR merges, the migration step would re-fire on every regen — investigate.

- [ ] **Step 6: Commit code changes**

### Task 4.6: Migrate emitters/suggested.ts (re-wrap pass)

**Files:**
- Modify: `packages/codegen/src/emitters/suggested.ts`

- [ ] **Step 1: Add re-wrap pass per the spec's PR3 section**

```ts
function emitRuleExpr(rule: Rule): string {
  let expr = baseExpr(rule);
  if (rule.multiplicity === 'array')         expr = `repeat(${expr})`;
  if (rule.multiplicity === 'nonEmptyArray') expr = `repeat1(${expr})`;
  if (rule.multiplicity === 'optional')      expr = `optional(${expr})`;
  if (rule.fieldName)                        expr = `field('${rule.fieldName}', ${expr})`;
  return expr;
}
```

- [ ] **Step 2: Migrate the existing 'clause'/wrapper switches in suggested.ts**

- [ ] **Step 3: Snapshot diff for `overrides.suggested.ts`**

Expected drift: TS syntax for the wrapped form re-emits identically (the re-wrap inverts the IR change). If drift appears: investigate per kind.

- [ ] **Step 4: Commit**

### Task 4.7: Migrate dsl/wire/wire.ts (or compiler/grammar.ts) re-wrap for tree-sitter

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (or `compiler/grammar.ts`)

- [ ] **Step 1: Same re-wrap pass for tree-sitter grammar.js output**

The output is JS source for the grammar callbacks. Re-wrap canonically:
```js
field('name', optional(repeat($.X)))
```

- [ ] **Step 2: Snapshot diff**

The generated `grammar.js` files should be identical to before push-down.

- [ ] **Step 3: Commit**

### Task 4.8: Unify hasTrailing/hasLeading → trailing/leading on AssembledNonterminal (edge case f)

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (NodeOrTerminal interfaces + AssembledNonterminal)
- Modify: all consumers of `.hasTrailing` / `.hasLeading` (`rg` to enumerate)

- [ ] **Step 1: Sweep `.hasTrailing` / `.hasLeading` usages**

```bash
rg -n "\.hasTrailing|\.hasLeading|hasTrailing:|hasLeading:" packages/codegen/src --type ts > /tmp/has-flags.txt
```

- [ ] **Step 2: Migrate per the structured-separator approach (spec)**

`NodeOrTerminal.separator` becomes `string | { rules, trailing?, leading? }` matching the rule's separator shape. The flat `hasTrailing` / `hasLeading` fields on AssembledNonterminal are deleted; consumers read from `separator.trailing` / `separator.leading` (or via slot helpers).

- [ ] **Step 3: Snapshot + counts (drift may improve ast counts — edge case f)**

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(codegen): unify hasTrailing/hasLeading → separator.{trailing,leading}

Edge case (f) per spec — vocabulary alignment with rule-level structured
separator. See feedback_rule_slot_vocabulary_alignment."
```

### Task 4.9: Multi-separator + list-suffix verification (edge cases d, e)

**Files:** spec edge case ledger update + targeted regression tests

- [ ] **Step 1: Identify fixture cases for multi-separator (edge case d)**

Per `multi_separator_templates` memory. If the new emitter + structured separator already handles these cases (output drift in those .jinja files is now correct rather than buggy), confirm with snapshot + counts (ast should improve).

If multi-separator requires render-engine filter changes (Askama / Nunjucks), this may need to defer to a follow-on per the spec's PR3 risks section.

- [ ] **Step 2: Identify fixture cases for list-suffix divergence (edge case e)**

Per `template_list_suffix_divergence` memory. The unified `slot.propertyName` should fix these by construction. Verify with regression tests.

- [ ] **Step 3: Update the edge case absorption ledger in the spec**

Set Status from `TBD` to landed (with the PR3 commit hash that resolved each).

- [ ] **Step 4: Commit**

### Task 4.10: PR3 final verification + open PR

- [ ] **Step 1: Full snapshot + counts (with drift expected for edge cases d/e/f)**

For each drift entry: confirm it's paired with a counts improvement; document in PR3 commit message.

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin HEAD
GITHUB_TOKEN= gh pr create --title "PR3: delete wrapper rule types (push-down completion) + edge case (d)(e)(f)" --body "..."
```

---

## Post-merge cleanup

After all 4 PRs merge:

- [ ] **Step 1: Update spec 020's status note**

Add to `specs/020-template-engine-converge/spec.md` (top of file): "Template-engine-convergence backlog items (multi-separator, list-suffix divergence) absorbed by spec [2026-05-18-rule-attributes-and-template-emitter-design]. Spec 020 remains Implemented at render-pipeline-optimization scope."

- [ ] **Step 2: Delete the worktree**

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git worktree remove ../sittir-rule-attrs
```

- [ ] **Step 3: Update CLAUDE.md investigation handoff**

Remove the spec from the "in-flight" investigation list once it's landed.

---

## Risk register (read before starting)

Cross-reference with the spec's "Risks + rollback" section:

| Risk | Where it surfaces | Mitigation |
|---|---|---|
| Pre-snapshot baseline is dirty | Task 0.1 step 2 | Hard prerequisite — resolve before starting |
| PR0 enrichment accidentally changes existing IR semantics | Task 1.9 (snapshot diff) | Snapshot gate catches |
| Auto-synthesis architecture decision wrong | Task 1.6 | Verify wrap/from capabilities; document choice |
| PR1 new emitter diverges on edge cases | Task 2.5 (in-process diff) | Per-kind locator; fix divergences case-by-case |
| PR2 deletion breaks something snapshot doesn't catch | Task 3.8 (settling period) | Let PR1 burn in ~1 day before starting PR2 |
| PR3 wrapper deletion misses a consumer | Task 4.3 (categorization) | TypeScript exhaustiveness checks; per-file commits for bisectability |
| node-model.json5 schema migration fails | Task 4.5 | Versioned reader; v1 fallback path |
| Multi-separator requires unanticipated render-engine work | Task 4.9 | Document gap; defer to follow-on if filter design expands scope |
