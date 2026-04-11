# Phase Contracts

Each phase is a pure function with a typed input and output. These contracts define the API surface between phases.

Full type definitions are in the design doc (`specs/sittir-grammar-compiler-spec.md`). This file documents the contract signatures and invariants.

## Phase 1: Evaluate

```
evaluate(entryPath: string) → RawGrammar
```

**Input**: Path to grammar.js (bare grammar) or overrides.ts (grammar extension that imports base grammar.js)
**Output**: `RawGrammar`

**Invariants**:
- Single entry point — if overrides exist, the entry is overrides.ts which imports grammar.js as base
- Tree-sitter's `grammar(base, { rules })` handles the merge natively — each rule fn receives `($, original)`
- No custom two-pass system — tree-sitter's `grammar()` provides the base rule as the second argument
- New DSL primitives (`transform`, `insert`, `replace`) operate on the `original` base rule
- All standard DSL functions (`seq`, `choice`, `field`, `repeat`, etc.) produce Rule nodes
- Reference graph captured via `$` proxy during evaluation
- Override-derived rules carry `source: 'override'` provenance
- No global state read or mutated
- `repeat1` may be present (normalized to `repeat` by Link)
- `symbol`, `alias`, `token` references present (resolved by Link)

## Phase 2: Link

```
link(raw: RawGrammar) → LinkedGrammar
```

**Input**: `RawGrammar` from Evaluate (overrides already applied)
**Output**: `LinkedGrammar`

**Invariants**:
- No `symbol`, `alias`, `token`, or `repeat1` in output rules
- All hidden rules classified: supertype / enum / group / inlined
- All `field` nodes annotated with `source` and `nameFrom`
- SymbolRef positions enriched
- No override processing (already done by Evaluate)
- Tree shape preserved — Link does not restructure
- `suggestedOverrides` populated from diagnostic derivations
- node-types.json used for validation only, not as data source

## Phase 3: Optimize

```
optimize(linked: LinkedGrammar) → OptimizedGrammar
```

**Input**: `LinkedGrammar` from Link
**Output**: `OptimizedGrammar`

**Invariants**:
- Structural grouping (seq, choice, optional, repeat) may be restructured
- Named content NEVER modified: string values, pattern values, field metadata, clause/enum/supertype/group content, whitespace directives
- Choice branches wrapped in `variant` nodes
- Common prefixes/suffixes factored out of choice branches
- Structurally identical variants deduplicated (non-lossy)
- All transformations are non-lossy

## Phase 4: Assemble

```
assemble(optimized: OptimizedGrammar) → NodeMap
```

**Input**: `OptimizedGrammar` from Optimize
**Output**: `NodeMap`

**Invariants**:
- First and only phase that creates nodes
- Every rule classified into exactly one of 9 model types
- All metadata derived from rule tree context:
  - `required`: not inside `optional` ancestor
  - `multiple`: inside `repeat` ancestor
  - `contentTypes`: walk field content, collect kind names
  - `detectToken`: unique string among sibling forms
  - `modelType`: structural simplification + visibility
- Rules consumed — not stored on assembled nodes (exception: `mergedRules` on collapsed forms)
- Polymorph forms with identical field sets collapsed (non-lossy: mergedRules preserved)
- Signatures computed for kind collapse
- Projections built for kind projection context

## Phase 5: Emit

```
emitTypes(nodeMap: NodeMap) → string
emitFactories(nodeMap: NodeMap) → string
emitTemplatesYaml(nodeMap: NodeMap) → string
emitFrom(nodeMap: NodeMap) → string          // derives from factory signatures
emitIr(nodeMap: NodeMap) → string            // derives from factory exports
emitSuggestedOverrides(linked: LinkedGrammar) → string
// ... plus wrap, consts, grammar, index, tests, etc.
```

**Input**: `NodeMap` from Assemble (except suggested overrides, which uses `LinkedGrammar`)
**Output**: Source strings

**Invariants**:
- All emitters consume NodeMap exclusively — no access to grammar rules or intermediate representations
- `from` derives from factory signatures, not the node model
- `ir` derives from factory exports, not the node model
- Suggested overrides emitter reads LinkedGrammar's suggestedOverrides
- Output is deterministic (same NodeMap → identical output)

## CLI Orchestration

```
overrides.ts (imports grammar.js as base)  — or grammar.js directly
    → evaluate(entryPath)                    → RawGrammar
    → link(rawGrammar)                       → LinkedGrammar
    → optimize(linkedGrammar)                → OptimizedGrammar
    → assemble(optimizedGrammar)             → NodeMap
    → emit*(nodeMap)                         → files written to disk
    → emitSuggestedOverrides(linkedGrammar)  → overrides.suggested.ts
```

Each step is independently callable and testable. The CLI composes them.
