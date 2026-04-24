# 013 — Next Session Prompt

**Goal:** extend enrich's kind-to-name pass to recurse into nested seqs, fix the downstream bugs it surfaces iteratively. This is the optimization that drives category (2) and part of (3) without per-kind override bloat.

## Context

Spec 013 Phase 1 + Phase 2 (walker shrink + strict audit default) are landed. Audit clean across all 3 grammars. Corpus floors: 6 pre-existing failures. `deriveChildren` restructured into top-level + per-member (commit `826bbd02`).

Categories of nested seqs still reaching `deriveChildren` (from the probe):
1. **`clause(seq(...))` — 12 kinds — FINE**, clause is our "named optional group" mechanism.
2. **`repeat(seq(...))` / `repeat1(seq(...))` — 11 kinds — positional ambiguity**, need field names on inner seq members.
3. **`optional(seq(...))` — 10 kinds — should be clause**, user agreed these are miscategorized clauses.
4. **`choice(seq(...))` — 3 kinds** — `_let_chain` (real), `_suite` / `yield` (benign).

## Approach: extend `applyKindToName` to recurse

Enrich's `applyKindToName` currently only runs on TOP-LEVEL seqs (`packages/codegen/src/dsl/enrich.ts:220`). Extend it to walk through `repeat`/`repeat1`/`optional`/`clause` wrappers and apply the same bare-symbol → `field(kind, symbol)` transform to every seq it reaches. This auto-covers categories (2) and part of (3) without touching per-kind overrides.

Blueprint (tried in session, reverted on regressions — iterate from here):

```ts
function applyKindToName(ruleName: string, rule: Rule): Rule {
    // Collect ALL existing field names in the rule's subtree — names
    // claimed anywhere (ancestor, sibling, cousin) can't be reused.
    const claimed = new Set<string>()
    walkCollectFieldNames(rule, claimed)
    return walkKindToName(ruleName, rule, claimed) ?? rule
}

function walkKindToName(ruleName: string, rule: Rule, claimed: Set<string>): Rule | null {
    if (isSeqType(rule.type)) return applyKindToNameAtSeq(ruleName, rule, claimed)
    if (isRepeatType(rule.type) || isOptionalType(rule.type) || rule.type === 'clause') {
        const content = (rule as unknown as { content: Rule }).content
        const recursed = walkKindToName(ruleName, content, claimed)
        return recursed ? ({ ...rule, content: recursed } as Rule) : null
    }
    return null
}

function applyKindToNameAtSeq(ruleName: string, rule: Rule, claimed: Set<string>): Rule | null {
    // Same as the existing top-level impl but uses `claimed` (tree-wide)
    // instead of a per-seq `existing` set. Recurse into nested wrappers
    // before the bare-symbol check — deeper changes propagate.
    // ... (see commit history for full implementation)
}
```

**Collision safety**: collision detection must span the ENTIRE rule subtree, not just the current seq level. Tree-sitter folds same-named fields at different depths together, silently merging distinct positional meanings. The pre-walk `walkCollectFieldNames` seeds the `claimed` set with every existing `field('name', ...)` anywhere in the rule.

## Known issues to iterate through

### (A) Autogen'd overrides label wrong positions

Some per-kind overrides wrap the wrong seq position as a field. Example: `packages/typescript/overrides.ts` has

```ts
import_attribute: {
    0: field('object'),  // WRONG — position 0 is 'with' literal
},
```

Base grammar is `seq('with', $.object)` — position 0 is the `'with'` keyword, position 1 is the `$.object` symbol. The autogen walker counted "struct=0" (first named child) = `object` but misidentified position.

When enrich's nested-seq pass runs, the symbol `$.object` at position 1 gets wrapped as `field('object', symbol)` — colliding with the autogen's mislabeled `field('object', 'with')`. Two fields named 'object' at different positions in the same seq; downstream factories emit duplicated property names.

Fix per-kind: audit each override, either correct the position or change the field name. Memory note `project_overrides_generator_positional_bug.md` has the full inventory.

### (B) repeat(separator)-metadata interaction

Some container kinds like `variable_declaration = seq('var', field('declarators', repeat1(variable_declarator, sep=',')))` — enrich's recursion descends through the field wrapper into the repeat1. The repeat1's content (a bare `variable_declarator` symbol) gets wrapped as `field('variable_declarator', symbol)`. This CHANGES the repeat1's inner shape from symbol to field(symbol).

Downstream render walkers may treat `repeat1(field(name, sym))` differently than `repeat1(sym)` — e.g. the separator-trailing metadata or the walker's template emission shifts. In testing, `variable_declaration` rendered as `var ;` losing all declarators.

Fix options: (i) skip recursion through field wrappers (the pass already does this), (ii) add per-kind overrides that explicitly retain the bare-symbol form, (iii) teach the template walker to handle field-wrapped repeat content identically.

### (C) Test floor adjustments

After the nested-seq enrichment lands, expect TS round-trip floors to shift.

**Critical — user guidance**: the aggregate "how many tests are failing overall" number is NOT the signal to track. What matters is the **TOTALS** (`rtTotal` / `fromTotal` / `covTotal`) — a shift downward means kinds disappeared from the universe, which is a real regression. The pass-count floors (`rtPass` etc.) are expected to move around as adoption shifts what's canonical; the totals should only grow or stay flat. If total drops, investigate WHICH kinds fell out of the universe.

## Starting command

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git log --oneline -10 | grep "013:"
npx vitest run 2>&1 | grep -E "Test Files|Tests " | tail -3
# Should show 6 failed, 1402 passed — pre-existing floor.
```

## Investigation order

1. Re-apply the enrich recursion extension (snippet above).
2. Regen all three grammars; check audit stays clean.
3. Run the full test suite; collect the regressions.
4. For each regression, probe the kind and either:
   - Fix the autogen'd override position (category A).
   - Adjust the enrich recursion to skip that shape (category B).
   - Accept the change and adjust the floor (category C).
5. Iterate until tests are back to 6-failure baseline (or better).
6. Commit. Phase 3 projection (drop `#fields`/`#children` caches) is the next stretch goal — defer unless there's time.

## Probe tool

Trivial; don't commit:

```ts
// packages/codegen/src/scripts/probe-rule.ts
import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { optimize } from '../compiler/optimize.ts'
import { simplifyRule } from '../compiler/simplify.ts'
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts'
const raw = await evaluate(resolveOverridesPath(process.argv[2]))
const linked = link(raw)
const optimized = optimize(linked)
const r = optimized.rules[process.argv[3]]
const s = r ? simplifyRule(r) : null
console.log(JSON.stringify(s, (k, v) => k === '_ref' ? undefined : v, 2))
```
