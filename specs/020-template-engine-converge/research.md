# Research: Render Pipeline Optimization (020)

All planning-time ambiguities are resolved. No open `NEEDS CLARIFICATION` items remain.

---

## Decision 1: 020 owns both baseline convergence and optimization rollout

**Decision**: Feature 020 fully owns any remaining work needed to finish the earlier convergence baseline (single canonical template directory, centralized native render crates, one regenerate workflow, no native-only template mirror) as well as the Level 1 and Level 3 optimization stages.

**Rationale**: Treating baseline convergence as a separate prerequisite would split one architectural story across multiple partially overlapping features. The clarified spec explicitly makes 020 responsible for both finishing the retained baseline and delivering the optimization rollout, which keeps task decomposition and acceptance criteria aligned.

**Alternatives considered**:
- **Separate prerequisite feature**: rejected because it would create artificial sequencing and duplicate planning overhead for tightly coupled generator/runtime work.
- **Optimization-only scope with baseline as assumption**: rejected because the current branch/spec still references retained baseline obligations as active scope.

---

## Decision 2: Level 1 is a generator-only Askama-view change

**Decision**: Implement Level 1 by changing the generated native Askama structs and dispatch construction so scalar/list/children/text/variant values are borrowed from the existing `TemplateContext` instead of cloned out of it. The authored `.jinja` templates, filter surface, JS renderer, and N-API boundary remain unchanged.

**Rationale**: The dominant waste identified in the spec is the step-2→3 clone boundary. Borrowing from the existing context removes that cost with the smallest architectural blast radius and preserves the current runtime layering while parity is re-proven.

**Alternatives considered**:
- **Rewrite templates for native-only borrowed access patterns**: rejected because canonical templates must remain shared across backends.
- **Skip directly to Level 3**: rejected because it combines the clone fix with a larger architectural refactor, making regressions harder to isolate.

---

## Decision 3: Level 3 emits direct-render functions and retires the preparation layer only after proof

**Decision**: Level 3 introduces generated per-kind render functions plus a small shared helper surface for leaf, optional, required, repeated, variant, and child resolution. These functions consume `NodeData` directly and feed Askama without building `TemplateContext`. `prepare.rs` and the runtime metadata bridge are removed after the direct path passes parity, while `filters.rs` remains as the shared Askama-filter surface with a smaller flank-values helper.

**Rationale**: The constitution favors fewer abstractions and a smaller `sittir-core` surface. Emitting direct render functions from known model data removes the extra map-building layer while preserving the observable render contract. Staging cleanup after parity proof keeps rollback cheap.

**Alternatives considered**:
- **Keep `TemplateContext` permanently and optimize around it**: rejected because it leaves the per-render map allocation layer in place.
- **Move all new helpers into `sittir-core` immediately**: rejected because the feature goal is to shrink `sittir-core`, not move another render-specific abstraction into it.

---

## Decision 4: Render metadata remains model-driven and inlined, not re-derived at runtime

**Decision**: Leaf-kind knowledge, separator choices, variant routing, and equivalent render-time facts are chosen from the existing codegen/model pipeline and emitted into generated render code. Level 3 does not introduce a second runtime metadata source parallel to the model.

**Rationale**: This preserves Principle XI (DRY) and Principle VII (Grammar-Agnostic Pipeline). The model already knows which fields are leaf-like, repeated, optional, or variant-sensitive. Re-deriving that data in handwritten runtime code would duplicate logic and drift from the codegen source of truth.

**Alternatives considered**:
- **Runtime introspection of templates/nodes to rediscover field strategy**: rejected because it duplicates model knowledge and weakens determinism.
- **Per-grammar handwritten routing logic**: rejected because it violates grammar-agnostic pipeline constraints.

---

## Decision 5: A level only completes when all three grammars complete it

**Decision**: Level 1 and Level 3 both merge as whole-feature rollouts across `rust`, `typescript`, and `python`. Temporary mixed-mode validation is allowed during implementation, but a merged end state where one grammar remains on an older level is not acceptable.

**Rationale**: The regenerate workflow, parity baselines, and centralized native render crate layout are shared across the supported grammars. Completing a level for only one or two grammars would complicate docs, tests, and generator invariants while leaving the repo in a semi-migrated state.

**Alternatives considered**:
- **Grammar-by-grammar merged rollout for both levels**: rejected because it would leave long-lived mixed architecture in the main branch.
- **Level 1 all-at-once, Level 3 grammar-by-grammar**: rejected by explicit clarification; the feature definition treats both levels as all-grammar milestones.

---

## Decision 6: Verification is parity-first, not benchmark-first

**Decision**: The gating evidence for both levels is byte-identical parity and unchanged observable behavior, using existing regenerate/test/parity workflows. Performance goals are expressed structurally in the spec (no step-2→3 clones, no Level 3 field-map allocations), but benchmark infrastructure is not a separate prerequisite for the plan.

**Rationale**: The repository already has strong parity/test gates and does not yet define a benchmark harness as a merge requirement. Structural optimization targets plus parity-proof rollout provide enough implementation guidance without inventing a new measurement framework in this feature.

**Alternatives considered**:
- **Require a dedicated microbenchmark harness before implementation**: rejected because it would expand scope and delay the correctness-critical refactor.
- **Rely only on code inspection without parity re-proof**: rejected because the feature changes core runtime behavior and needs output-level evidence.
