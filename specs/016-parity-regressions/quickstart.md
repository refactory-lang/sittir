# Quickstart: Parity & Regressions

**Feature**: `016-parity-regressions`
**Audience**: Maintainer working on a single cluster fix.

This is the in-flight workflow once the baseline tooling has landed (commit #1). For the bootstrap workflow, see `tasks.md` (Phase 2 output) — it documents how the very first commit creates `collect-baseline.ts` and produces the initial JSON.

---

## Per-Cluster Workflow

### 1. Pick the next cluster

Open `tasks.md` for the ordered cluster list. Cluster order from research:

1. python-comprehensions (6 fixtures, single shared root cause)
2. rust-patterns (5 fixtures, suspected shared cause)
3. factory-rt (1 integration test)
4. ts-template-coverage (1 floor: 138 → ≥140)
5. dsl-tests (3 unit tests)

### 2. Probe before changing code

```sh
# Read the current failure shape — confirm the cluster's root cause hypothesis
# is still accurate vs the memory note.
npx tsx packages/codegen/src/scripts/probe-kind.ts \
    --grammar python --kind list_comprehension --reparse --pretty

# For native parity questions:
npx tsx packages/codegen/src/scripts/probe-kind.ts \
    --grammar rust --kind mut_pattern --engine both --reparse
```

If the probe contradicts the memory note, update the cluster's root-cause hypothesis in your branch's notes before writing any code. Better to discover surprise on the probe than at commit time.

### 3. Capture the "Before" snapshot

```sh
SITTIR_BACKEND=typescript \
    npx tsx packages/codegen/src/scripts/collect-baseline.ts \
    > /tmp/before-ts.json
SITTIR_BACKEND=native \
    npx tsx packages/codegen/src/scripts/collect-baseline.ts \
    > /tmp/before-native.json
```

Compare against the committed baseline as a sanity check:

```sh
diff -u specs/016-parity-regressions/baselines/ts.json /tmp/before-ts.json
# Should be empty — if not, your working tree is dirty in unexpected ways.
```

### 4. Make the fix

- Find the root cause in `packages/codegen/src/{compiler,emitters,dsl,validate}/`.
- For grammar-specific patches, edit `packages/{rust,typescript,python}/overrides.ts`.
- **Never edit** `packages/{lang}/src/*` or `packages/{lang}/templates/*.jinja` — those are generated.

### 5. Regenerate

```sh
npx tsx packages/codegen/src/cli.ts --grammar rust       --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python     --all --output packages/python/src
```

All three regenerate even if your fix only targets one grammar — FR-006 requires the codegen output stay in sync.

### 6. Verify phase-0 invariants

```sh
pnpm -r run type-check                                    # tsgo strict
npx oxlint --deny-warnings packages/{rust,typescript,python}/src
npx tsx scripts/check-jinja-templates.ts                  # 509 .jinja headers
```

If any of these fail, your fix introduced a phase-0 regression — fix it in the same commit (FR-007).

### 7. Capture the "After" snapshot and verify the move

```sh
SITTIR_BACKEND=typescript \
    npx tsx packages/codegen/src/scripts/collect-baseline.ts \
    > specs/016-parity-regressions/baselines/ts.json
SITTIR_BACKEND=native \
    npx tsx packages/codegen/src/scripts/collect-baseline.ts \
    > specs/016-parity-regressions/baselines/native.json
```

Diff to confirm only-up movement:

```sh
git diff specs/016-parity-regressions/baselines/
```

Every changed line should either:

- decrease a `failingKinds` array (or shrink `failingByKind`),
- increase a `pass` / `astMatchPass` / `totals.pass` count, or
- change the `commit` informational field.

If any `pass` count decreased, your fix waterfalled negatively — STOP, investigate, expand the fix or split the commit so the regression is recovered before landing.

**Waterfall reproducibility check** (lesson from 016 Cluster A): when your commit reports a positive waterfall on the native backend (e.g. "+N native python kinds incidentally fixed"), verify the count is reproducible from the COMMIT'S CONTENT, not from residual local state. Specifically, native-mode counts depend on the napi `.node` artifacts loaded at `collect-baseline` time. If you rebuilt one of the napi crates locally as part of the cluster work — e.g. `cargo build` ran inside `rust/crates/sittir-{lang}-napi/` — the `.node` artifact in your working tree may be ahead of master and the `+N waterfall` you see may not be reproducible by a CI run that downloads the same artifact from `napi-build`.

To check reproducibility before pushing:

```sh
# Save your current state.
git stash
# Force a fresh napi rebuild from the committed source.
cargo build --release -p sittir-rust-napi -p sittir-typescript-napi -p sittir-python-napi
# Re-collect.
SITTIR_BACKEND=native npx tsx packages/codegen/src/scripts/collect-baseline.ts > /tmp/native-clean.json 2>/dev/null
# Compare with the JSON in your stashed state.
diff /tmp/native-clean.json <(git stash show -p stash@{0} -- specs/016-parity-regressions/baselines/native.json | git apply --print)
git stash pop
```

If the diff is empty, your waterfall is reproducible. If not, the waterfall depends on local napi state and may evaporate in CI — investigate before pushing.

### 8. Run the test suite

```sh
SITTIR_BACKEND=typescript pnpm test
```

Should complete with the new failure count matching `totals.fail` in the After JSON. Run with `SITTIR_BACKEND=native` too — the regression-checker will compare both backends.

### 9. Commit

Commit message template:

```text
016/<cluster-name>: <one-line summary>

<one-paragraph explanation of root cause + fix>

Before/After (TS mode):
                           rust         typescript     python
fromPass:                 130/148     127/137        107/114
covPass:                  132/136     ↑139/137 ✱     105/115  …

Before/After (native mode): …

+N incidental waterfalls (kinds X, Y, Z…)   # only if applicable

Memory: deleted project_<note>.md (cluster fully resolved) /
        updated project_<note>.md (still open: …)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### 10. Push and watch CI

```sh
git push
```

CI runs:

- Build (tsgo strict)
- Lint generated packages (oxlint --deny-warnings)
- Check .jinja templates (header validator)
- Test (vitest)
- API-surface snapshots
- **NEW**: Baseline regression-checker — diffs `baselines/<backend>.json` against the PR base, fails on any count drop.

If the regression-checker fires, the diff is in the CI log. Either fix the regression (re-run from step 4) or, if the count drop is a known accepted trade-off (rare), document it in the spec's edge-case section before re-pushing.

---

## Common Probe Recipes

```sh
# Single kind, both engines:
npx tsx packages/codegen/src/scripts/probe-kind.ts \
    --grammar X --kind Y --engine both --pretty

# Compare against a baseline package directory (e.g. a worktree off master):
npx tsx packages/codegen/src/scripts/probe-kind.ts \
    --grammar X --kind Y --baseline ../sittir-master/packages/X --pretty

# Diagnose pipeline stages (which walker/emitter is dropping the field?):
npx tsx packages/codegen/src/scripts/probe-stages.ts --grammar X --kind Y

# Find which fields a particular kind contributes:
npx tsx packages/codegen/src/scripts/field-provenance.ts --grammar X --kind Y
```

---

## Anti-Patterns to Avoid

- **Hand-editing generated output** to make a single test pass. The regen step (step 5) will undo your edit; the regression-checker will fail. Fix-the-generator only.
- **Skip-marking failing tests** to clear the suite. Spec FR-004 forbids it.
- **Floor downgrades** in `corpus-validation.test.ts` to "match new reality." Spec edge case explicitly rules this out.
- **Splitting a cluster fix across multiple commits** when the second commit is just regen + JSON updates. Q5/A — incidental waterfalls go in the same commit as the fix.
- **Cross-grammar refactors mid-cluster** — if a fix to the python pipeline tempts you to also rewrite a rust override, split into two commits (one per grammar) or one commit (if the same root cause genuinely affects both, with both grammars' before/after captured).
