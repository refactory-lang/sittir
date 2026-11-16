# Node-Surface Hoist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a holder's slot reads through every single-slot wrapper the rule holds for, in the TypeScript wrap layer only: types, wrap getters, `$with` setters, factories and the loose `from` input, the validators' node-to-config reconstruction and the slot-descending `is` guards, all keyed on one stamped chain per holder slot. Nothing in the grammar, the parser, the rust crates or render changes.

**Spec:** `docs/superpowers/specs/2026-11-15-node-surface-hoist-design.md`. Read it first. This plan argues from it and doesn't restate it. The approved change is 276 holder slots: python 71, rust 103, typescript 102.

**Executor:** sittir-implement. **Reviewer:** sittir-brainstorm, at the end of every task. One PR, one commit per task, in this order.

## Global Constraints

- **Worktree:** `scratchpad/wt-implement`, branch `feat/node-surface-hoist` from `origin/master`. No new worktrees. Pathspec commits. No force, stash, amend, rebase, revert or abort. Push by literal sha.
- **Generated outputs are never hand-edited.** Fix the emitter and regenerate.
- **One stamp, no re-derivation.** The three conditions are decided once, in `compiler/model/wrapper-chain.ts`. Every consumer reads the stamp.
- **Client side only.** A generated move outside the five consumers (`types.ts`, `wrap.ts`, `factories/*`, `from.ts`, `is.ts`) and the validators stops the work and goes to sittir-brainstorm. So does a moved validation row.
- **The wrapper is reached through the tree only.** No accessor on the holder returns the wrapper once its slot hoists.
- **The counts are pinned** at python 71, rust 103, typescript 102. A slot the census adds or drops against the spec is a row for sittir-brainstorm first.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes, `sittir validate history` compared with numbers, and the full suite with any new failure isolated.
- **Every PR body lists API changes.** The per-slot appendix (`holder.slot`, chain, read type before → after) is generated from the census.
- **Hand-written source in `packages/{codegen,common,tools,types}/src` carries no explanatory comments.** Docs carry no PR or task numbers.
- **Tasks 3–8 wait** for sittir-design's vocabulary branch to land; sittir-brainstorm says when.

### Task 1: The stamp and its census

**Status:** the stamp matches the oracle slot for slot at 71/103/102. The tool and the count test are written; the commit waits on the regen leg and the gates.

**Files:**
- Create: `packages/codegen/src/compiler/model/wrapper-chain.ts`
- Create: `packages/tools/src/census/hoist.ts`, `packages/cli/src/commands/tool/hoist-census.ts`
- Modify: `packages/tools/src/codegen-surface.ts`, `packages/tools/src/index.ts`, `packages/cli/src/commands/tool/index.ts`, `docs/cli-command-glossary.md`
- Test: `packages/tools/tests/hoist-census.test.ts`

- [ ] **Step 1: The stamp.** `wrapperChainsOf(nodeMap)` returns every holder slot the rule holds for, with its chain, outermost first. The rule is §1: one node slot, only always-spelled tokens (zero-width externals, list separators and optional trailing separators included), the holder slot admitting only the wrapper, no leaf or text slot, presence a fact when both slots may be empty, an alias met as its model kind.
- [ ] **Step 2: The tool.** `sittir tool hoist-census --grammar <g>` prints the chains and holder slots from the stamp.
- [ ] **Step 3: The count test.** It pins python 71, rust 103, typescript 102 through the stamp.
- [ ] **Step 4: Run it.** The test passes at the pinned counts, and the glossary test passes with the tool documented.

### Task 2: The rule tests

**Status:** written and passing (10 synthetic cases), uncommitted.

**Files:**
- Test: `packages/codegen/src/compiler/model/__tests__/wrapper-chain.test.ts`

- [ ] **Step 1: Stamped.** A single wrapper; a list wrapper; a composed chain that stops at a slot admitting more than one kind; an optional inner slot under a required holder.
- [ ] **Step 2: Not stamped.** An optional inner slot under an optional holder (presence is a fact); a token spelled only sometimes; a wrapper with two slots; a holder slot that admits another kind; a leaf; a token choice.
- [ ] **Step 3: Run it.** All pass.

### Task 3: Types

**Files:**
- Modify: `packages/codegen/src/emitters/types.ts` (the holder slot's config and node types read the chain)
- Test: `packages/codegen/src/emitters/__tests__/` and `packages/{typescript,python,rust}/tests/*.test-d.ts`

- [ ] **Step 1: The failing type tests.** A holder's slot types as the hoisted read on one case per row of §7, and the wrapper's own slot types as the rest of its chain.
- [ ] **Step 2: The emitter.** Each slot type is derived from the stamp, not from the holder's native slot.
- [ ] **Step 3: Regenerate** and compare the generated diff with the per-slot appendix.

### Task 4: Wrap getters

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts`
- Test: `packages/{typescript,python,rust}/tests/hoist-read.test.ts`

- [ ] **Step 1: The failing tests.** Per storage (arena, object): the getter reads the native slot, then each wrapper's one slot, and returns a list when any step holds one. A wrapper with an empty slot under a required holder reads `undefined`. A mandatory leading or optional trailing separator doesn't change the read.
- [ ] **Step 2: The old wrapper accessor is gone,** and the wrapper is still there when walking children: the holder's children include the wrapper node with its own range.
- [ ] **Step 3: A comment or an ERROR inside a hoisted wrapper** keeps the wrapper's sides: the getter reads the items around it, and a set through the wrapper keeps the comment or the ERROR. One runtime proof, both storages.
- [ ] **Step 4: The emitter** reads the stamp.

### Task 5: `$with` setters

**Files:**
- Modify: `packages/codegen/src/emitters/node-members.ts`, `packages/codegen/src/emitters/record-construction.ts`
- Test: `packages/{typescript,python,rust}/tests/hoist-set.test.ts`

- [ ] **Step 1: Set through.** On a holder that has the wrapper, the setter replaces what the innermost wrapper holds and keeps every wrapper's own facts: `$with.parameters([a, b, c])` on `def f(a, b,):` writes `def f(a, b, c,):`.
- [ ] **Step 2: Build.** On a holder with no wrapper, the setter builds each wrapper with its own builder, innermost first, each spelling its fixed tokens.
- [ ] **Step 3: The rows of §7.** Rust `extern_modifier` (`undefined` removes the ABI and keeps `extern`), the receiver forms, `template_string`, `object`, the typescript setter signatures reading their one `SetterParameter`.
- [ ] **Step 4: The pinned neighbours of §8.** `objectType.$with.members` sets through `object_type_content`, and `opening` and `closing` stay without setters.
- [ ] **Step 5: The setters** read the stamp.

### Task 6: Factories and the loose `from`

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts`, `packages/codegen/src/emitters/from.ts`
- Test: `packages/{typescript,python,rust}/tests/hoist-build.test.ts`

- [ ] **Step 1: The failing tests.** A factory and a loose `from` input take the hoisted type and wrap it with each wrapper's own builder. A new build's options decide an optional trailing separator.
- [ ] **Step 2: The emitters** read the stamp.

### Task 7: Validators and `is` guards

**Files:**
- Modify: `packages/tools/src/validate/common.ts` (`nodeToConfig`), `packages/codegen/src/emitters/is.ts`
- Test: `packages/tools/tests/hoist-node-to-config.test.ts`

- [ ] **Step 1: The failing tests.** `nodeToConfig` reads a hoisted slot as the hoisted value and round-trips through the factories. The slot-descending `is` guards descend through the chain.
- [ ] **Step 2: The readers** use the stamp.

### Task 8: Regenerate, measure, and the per-slot appendix

**Files:**
- Modify: the three grammars' generated surfaces
- Create: the per-slot appendix, in the PR body or a linked file, from the census

- [ ] **Step 1: Regenerate all three grammars** and compare the generated diff with the stamp's rows.
- [ ] **Step 2: Measure.** `sittir validate history` rows (none move); the generated size per file; a hoisted read against the old two-step read, both storages, against the ×1.10 per-grammar bar; the `$with` edit path against the same-value edit.
- [ ] **Step 3: The full gates:** `tsc` for codegen and the three packages, `oxlint`, the full suite, the `$with` parity run, the rows corpus and the list-setter census.
- [ ] **Step 4: The PR body** lists the API changes by grammar, with the appendix.
