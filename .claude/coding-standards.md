# Working Standards

Repo-wide rules for all work — codegen, tools, validators, native crates, and
docs tooling alike. Codegen examples below are illustrative, not the rule's
scope.

1. **DRY is the #1 correctness rule.** Each fact has one source and one
   derivation. When two derivations of the same fact exist, unify them at the
   root rather than patching one site.

2. **Simple, dry, clean, reusable, consistent > fixed.** Always take the
   general fix at the true root, even when its blast radius is larger than a
   local patch. Do not accumulate tech debt, do not mask architectural issues,
   and do not carry forward existing debt in code you are already touching.

3. **Stamped facts over re-derivation.** Resolve a fact once, where it is
   created, and consume the stamp downstream (e.g. kindIds are stamped at
   link/construction time, never re-resolved by name later). A missing fact
   fails at compile time with a diagnostic, never as an opaque runtime error.
   This covers predicates and classifiers, not just values: canonical
   predicates live on the model (word-shape is the grammar's link-pinned
   `wordMatcher`; hiddenness and kind classification are model attributes) —
   an inline regex or character-class heuristic re-implementing one in an
   emitter is a re-derivation smell.

4. **Never trust "this test is stale" on faith.** Before changing a test's
   expectation, independently reproduce that it pins buggy behavior: stash the
   fix → the test passes; reapply → it fails; find a production case with the
   identical shape.

5. **Three-way verification before every commit:**
   1. targeted probes of the specific cases fixed (wrap AND render layers);
   2. `sittir validate history` comparison across all three grammars —
      numbers compared, not eyeballed;
   3. the full unit suite, with any new failure isolated via stash-and-rerun
      before accepting it as pre-existing.

6. **Generated outputs are never hand-edited.** Fix the source or the
   generator and regenerate, even when nondeterministic regen churn makes that
   annoying.

7. **A diagnosis's broader-scope findings are the work list, not a future
   ask.** When an audit finds N sites sharing a defect class, the fix's scope
   is all N.

8. **Ratchets only tighten.** Baseline counts (phantom kinds, validation
   floors) may only shrink; a count above its ceiling means a change minted
   new debt — fix the source, never raise the ceiling.

9. **Comments state live constraints, not provenance.** A comment never
   explains the history of the code or why a change was made — that belongs
   in the commit message. If removing a comment loses nothing a reader of
   the current code needs, remove it; the declarations and names should
   carry the obvious mappings themselves.
