# JS vs Native Terminology Completion Design

**Date:** 2026-05-27  
**Status:** Proposed  
**Branch:** `pr-b-assembled-nonterminal-class`  
**Related specs:** [`2026-04-27-js-backend-rename-design.md`](./2026-04-27-js-backend-rename-design.md)

## Problem

The repository already has a design decision to rename the non-native backend from `typescript` to `js`, but the rollout is incomplete. Some agent prompts, validator/probe help text, warnings, persisted validation history, and machine-readable outputs still use `typescript` when they mean the deprecated JS engine/backend.

This is now actively misleading because:

- **the deprecated thing is the JS/TypeScript engine**, not the TypeScript language pack
- `typescript` is still the correct term for the TypeScript grammar/package surfaces
- mixed terminology makes review, diagnostics, and validation results harder to interpret

## Decision

Complete the rename so backend/runtime terminology is consistently:

- `native`
- `js`

Reserve `typescript` for the TypeScript language pack / grammar / package surfaces only.

This is a **full end-to-end rename** for backend terminology, including machine-readable outputs.

## Scope

This completion pass applies wherever the system is describing, selecting, serializing, or teaching the deprecated non-native backend:

1. **Agent instructions**
   - `.claude/agents/sittir-research.md`
   - `.claude/agents/sittir-review.md`
   - `.claude/agents/sittir-codegen.md`

2. **Validator CLI and warnings**
   - help text
   - backend option descriptions
   - stale-native fallback warnings
   - printed labels and summaries

3. **Machine-readable validator/probe surfaces**
   - validation history entries
   - probe output fields / labels
   - emitted backend identifiers in JSON/text reports

4. **User-facing command surface**
   - script/help wording where `typescript` currently means the deprecated backend

## Scope boundary

This rename does **not** apply to:

- grammar names such as `typescript`
- package names such as `@sittir/typescript`
- generated TypeScript language-pack artifacts
- language-selection arguments where `typescript` means the grammar

The rule is simple:

- if it means **engine/backend**, use `js`
- if it means **grammar/language pack**, use `typescript`

## Design

### 1. Canonical terminology

All backend-facing logic, docs, and outputs should talk about **js vs native**.

Examples:

- `--backend js`
- `backend: "js"`
- `js/native`
- `deprecated js engine`

Examples that must remain unchanged because they refer to the language pack:

- `--grammar typescript`
- `packages/typescript/...`
- `@sittir/typescript`

### 2. Hard rename for backend identity

Backend identity values should be renamed from `typescript` to `js` in machine-readable outputs as well as printed text. This includes persisted validation history and probe outputs.

This is intentionally a schema/output change. Existing consumers that key on backend=`typescript` must update to backend=`js`.

### 3. Agent guidance alignment

The three `sittir-*` agents should share the same operational guidance:

- **sittir-research**: diagnose native correctness as ground truth; refer to the deprecated path as the JS engine, not the TypeScript language pack
- **sittir-review**: treat JS-engine evidence as non-gating and avoid language that collapses JS-engine/backend with the TypeScript grammar
- **sittir-codegen**: gate on native results while keeping the TypeScript language pack in normal scope for generation and artifact review

### 4. Validation/probe terminology alignment

Validator and probe tooling should present one consistent distinction:

- `native` backend
- `js` backend

Help text, summaries, warnings, and persisted history should all agree on those names. Internals may be refactored as needed, but the external contract should no longer emit backend=`typescript` when the meaning is the deprecated engine.

## Non-goals

- changing backend behavior
- reviving or extending the deprecated JS engine
- renaming TypeScript grammar/package identities
- changing native-vs-JS gating policy beyond the terminology cleanup

## Risks

1. **Schema/output breakage**
   - tools that parse persisted validation history or probe output may still expect `typescript`

2. **Partial rename drift**
   - if CLI text changes but serialized outputs do not, confusion remains

3. **Over-renaming**
   - careless edits could rename TypeScript language-pack references that should stay `typescript`

## Success criteria

1. All three `sittir-*` agent prompts use the same **js vs native** terminology for backend/runtime guidance.
2. Validator/probe help text and warnings no longer describe the deprecated backend as `typescript`.
3. Persisted validation/probe outputs emit `js` rather than `typescript` when naming the deprecated backend.
4. TypeScript grammar/package naming remains unchanged.
5. No prompt, warning, or machine-readable backend identifier is ambiguous about engine vs language pack.

## Minimal implementation surface

- `.claude/agents/sittir-research.md`
- `.claude/agents/sittir-review.md`
- `.claude/agents/sittir-codegen.md`
- `packages/validator/src/**` (backend/help/history/warnings)
- `packages/tools/src/**` where probe/validation outputs still serialize or print backend=`typescript`
- root/package script/help surfaces if they expose the deprecated backend name
