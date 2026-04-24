# 013 — Next Session Prompt

**Goal:** extend enrich's kind-to-name pass to recurse into nested seqs, fix the downstream bugs it surfaces iteratively. This is the optimization that drives category (2) and part of (3) without per-kind override bloat.

## Context

Spec 013 Phase 1 + Phase 2 (walker shrink + strict audit default) are landed. Audit clean across all 3 grammars. Corpus floors: 6 pre-existing failures. `deriveChildren` restructured into top-level + per-member (commit `826bbd02`).

Categories of nested seqs still reaching `deriveChildren` (from the probe):
1. **`clause(seq(...))` — 12 kinds — FINE**, clause is our "named optional group" mechanism.
2. **`repeat(seq(...))` / `repeat1(seq(...))` — 11 kinds — positional ambiguity**, need field names on inner seq members.
3. **`optional(seq(...))` — 10 kinds — should be clause**, user agreed these are miscategorized clauses.
4. **`choice(seq(...))` — 3 kinds** — `_let_chain` (real), `_suite` / `yield` (benign).

## What this session learned (2026-04-24)

Attempts this session (all reverted at end) surfaced **architectural issues** that need addressing before any enrich extension can land cleanly:

### Issue A — DSL-runtime divergence

Enrich runs in BOTH the tree-sitter CLI runtime (transpiled `.sittir/grammar.js`, uppercase tree-sitter-JSON types) AND sittir's evaluate pipeline (direct overrides.ts import, lowercase sittir types). `base.grammar.rules` is evaluated ONCE per runtime — each runtime evaluates it with its own DSL helpers.

Sittir's DSL helpers do structural collapses at evaluation time:
- `seq(...)` runs `liftCommaSep`: `seq(sym, repeat(seq(sep, sym)))` → `repeat1(sym, sep=X)`
- `optional(repeat(...))` collapses to `repeat(...)` inside fields
- `absorbTrailingSeparator`, `collapseOptionalRepeatInField`, `hoistFieldOutOfSingleContentWrapper`

Tree-sitter's DSL does none of these. So:
- Tree-sitter path: enrich sees uncollapsed `seq(sym, repeat(seq(sep, sym)))`.
- Sittir path: enrich sees collapsed `repeat1(sym, sep=',')`.

Any enrich transform that pattern-matches on shape diverges between runtimes. The output grammar.json (tree-sitter CLI) won't match the codegen types / factories / templates (sittir) unless enrich is runtime-agnostic or the two paths are unified.

**Directions considered:**
1. **Pragmatic** — dual-detection in enrich (match both raw + collapsed shapes). Works per-transform but doesn't scale; every new transform needs dual-case handling.
2. **Architectural** — move `liftCommaSep`, `absorbTrailingSeparator`, `collapseOptionalRepeatInField`, `hoistFieldOutOfSingleContentWrapper`, etc. OUT of sittir's DSL helpers and into a post-evaluate compiler pass. Then both runtimes see the same pre-collapsed shape at enrich time. Clean long-term fix.
3. **Normalize in enrich** — wrap the bare symbol directly wherever it appears (approach (2)'s output works because both runtimes still contain the bare symbol, even after collapse).

### Issue B — polymorphic-content repeat regression

Python's `_patterns` hidden rule is `repeat1(sym('pattern'), sep=',')`. `pattern` is a SUPERTYPE with subtypes {attribute, identifier, list_pattern, list_splat_pattern, subscript, tuple_pattern}.

`tuple_pattern` inlines `_patterns`. But `tuple_pattern` ALSO appears inside `case_pattern` contexts (python match statements), so tree-sitter's node-types for `tuple_pattern` merges children types from all contexts: `{case_pattern, pattern}`.

When enrich wraps the inner `pattern` symbol inside `_patterns` as `field('pattern', sym)`:
- Tree-sitter's CST for `tuple_pattern`: field `pattern` (multi=true, types={pattern}) + loose children for anything matching `case_pattern` (which isn't a pattern subtype).
- Source `(a, b)` in match context: `a` and `b` are `case_pattern`-typed → go to loose children.
- Render template says `({{ pattern | join(",") }})` → only reads the field → empty content.
- Result: rendered as `()` or `(case_pattern)` — lost the actual pattern content.

Python regressed -7 rtAstMatch, -9 factoryAstMatch on this cluster.

**Resolution paths:**
1. **Don't hoist when content is polymorphic** — detect if the symbol is a supertype AND the enclosing rule's effective content spans types outside that supertype's subtrees. Skip enrich for those rules.
2. **Wrap the commaSep1 container instead of the inner symbol** — `field(X, repeat1(sym, sep=',')))`. Tree-sitter still applies field to all occurrences, but the field covers the whole range. Template references the field container. Downside: breaks public_field_definition variant extraction (empty-matching subtree) and _let_chain polymorph classification (non-uniform arms when wrapped inside a choice).
3. **Teach render template to handle the split** — `$$$CHILDREN` + `$FIELD` combined rendering when fields can have overflow children.

### Issue C — choice recursion

`_let_chain` (rust) has 5 choice arms with genuinely different symbol combinations (some `let_condition`, some `_expression`, one arm with two `let_condition`s). Any enrich wrap inside choice arms creates non-uniform shapes → merge / polymorph classifier breaks (audit error: `choice-needs-variant-or-merge reached fields derivation`).

**Conclusion**: enrich should NOT recurse into choice arms. Polymorph adoption via `variant()` in overrides.ts is a separate concern.

## Paths forward for next session

In priority order:

### Path 1 — Move sittir's structural collapses to a post-evaluate pass

Biggest architectural win. Unwinds the DSL-runtime divergence (Issue A). Sittir's `seq()` / `optional()` / `field()` become thin wrappers; the collapses move to a dedicated normalize pass after evaluate, runs in sittir's pipeline only. Tree-sitter continues to see raw shapes.

Files:
- `packages/codegen/src/compiler/evaluate.ts`: remove `liftCommaSep`, `absorbTrailingSeparator`, `collapseOptionalRepeatInField`, `hoistFieldOutOfSingleContentWrapper` call sites from DSL helpers.
- Add `packages/codegen/src/compiler/normalize.ts`: dedicated pass that runs on the output of evaluate (before link). Consolidates the collapsed transforms.
- Test that the existing corpus still passes (should — semantic equivalence).

Once unified, enrich can extend without dual-detection.

### Path 2 — Fix the template walker for field-wrapped-repeat content

Addresses Issue B. Teach `walkRuleForTemplate` that `repeat1(field(X, sym), sep=',')` is equivalent to `repeat1(sym, sep=',')` for template emission purposes. The multi-valued slot's source should be detected regardless of inner field wrap.

Files:
- `packages/codegen/src/compiler/template-walker.ts`: in the `repeat` / `repeat1` cases, unwrap an inner `field(...)` when computing the element kind / slot reference. The sibling-repeated-field logic already handles `seq(field(X), SEP)` sub-patterns — extend to bare `field` inside repeat.

After this, the inner-symbol enrich hoist can land without the split-first-vs-rest regression.

### Path 3 — Container-level commaSep1 hoist (narrow)

If Paths 1 and 2 are too ambitious, a narrower approach: detect ONLY the commaSep1 shape (`seq(sym, repeat(seq(sep, sym)))` and `repeat1(sym, sep=X)`), hoist the WHOLE container as `field(X, container)`. Don't wrap inside optional/choice. This was the dual-detection approach; it worked for TS/rust at baseline but had some python regressions (small, -1 rtAstMatch, -1 factoryAstMatch).

Much smaller surgery than Paths 1/2 but more fragile — future transform patterns need similar dual detection.

## Tracking signal

Use `npx tsx packages/codegen/src/scripts/counts.ts` (new in this session) to get per-grammar raw counts each iteration. DO NOT rely on aggregate pass/fail. Each line shows `fromPass/fromTotal covPass/covTotal rtPass/rtTotal rtAstMatchPass factoryPass/factoryTotal factoryAstMatchPass` — focus on what's changing kind-by-kind.

**Baseline to match or exceed:**
- rust: fromPass=130/148  covPass=132/136  rtPass=114/136  rtAstMatchPass=113  factoryPass=417/959  factoryAstMatchPass=413
- typescript: fromPass=127/137  covPass=140/145  rtPass=93/112  rtAstMatchPass=83  factoryPass=384/915  factoryAstMatchPass=374
- python: fromPass=107/114  covPass=97/100  rtPass=96/115  rtAstMatchPass=92  factoryPass=193/860  factoryAstMatchPass=184

Totals dropping = real regression (kinds fell out of validation universe). Pass counts changing = shape shifts (good or bad).

## Starting command

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git log --oneline -15 | grep "013:"
npx tsx packages/codegen/src/scripts/counts.ts
# Should match baseline numbers above.
```

## Probe tools

Four scripts available under `packages/codegen/src/scripts/`:

- `counts.ts` — per-grammar raw counts across all validators.
- `diff-failures.ts <grammar> [from|rt|cov|factory|all]` — list failing kinds + error messages.
- `probe-rule.ts <grammar> <kind>` — dump a rule through each compiler phase (post-evaluate, post-link, post-optimize, post-simplify).
- `probe-kind.ts --grammar X --source '...'` — parse + readNode + render one source snippet, dump the full pipeline.

Use these before writing any one-off `/tmp/probe-*.ts`.
