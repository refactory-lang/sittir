# Working standards

These rules apply to authored code, tooling, native crates, and documentation. [Codegen conventions](codegen-conventions.md) adds the compiler-specific rules.

1. **DRY is the primary correctness rule.** Each fact has exactly one source and one derivation. Consolidate competing representations or derivations at their owner; do not patch their downstream disagreements.
2. **Fix the root boundary.** Prefer a simple, reusable correction to a local workaround. If an audit proves the same defect at several sites, cover all demonstrated sites. Keep unrelated cleanup separate.
3. **Carry canonical facts.** Resolve identity, routing, shape, and cardinality where the information exists, then consume those facts downstream. Prefer object references to names that every consumer must resolve again. Missing information should produce a useful diagnostic.
4. **Never hand-edit generated output.** Change the owning source or generator and regenerate. See [Development](../DEVELOPMENT.md#regeneration).
5. **Prove changed expectations.** Reproduce a failure before fixing it. Do not call a test stale or a failure pre-existing without a comparable base case. Preserve unexpected output and failed-gate evidence while diagnosing it.
6. **Ratchets constrain regressions.** Validator floors must not be weakened and debt ceilings must not be raised to pass a gate. Tighten them when behavior improves. An authored feature-surface census is a different contract: explain and review its exact membership changes.
7. **Verify the affected contract.** Use focused tests and type checks for a bounded change, executable checks for documentation/examples, and full unit/native/corpus gates for changes that affect those surfaces. Corpus changes require raw per-grammar counts compared with a recorded baseline. Report exactly which gates ran.
8. **Respect shared work.** Preserve unrelated dirty files, active worktrees, and in-flight failures. Use an isolated base comparison rather than discarding someone else's edits to obtain a clean result.
9. **Document live constraints.** Internal function explanations belong in the function glossaries; handwritten public API usage contracts belong in source JSDoc. Comments explain an invariant or non-obvious constraint, not development history. Descriptive links may name the governing document; bare task, PR, or plan numbers are not explanations.
